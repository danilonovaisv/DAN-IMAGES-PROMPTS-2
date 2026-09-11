import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { UPLOADS_DIR } from '../prompts/storage';

const MAX_INLINE_BASE64_CHARS = 700000; // ~525 KB, well below Firestore 1MB document limit
const CHUNK_SIZE_CHARS = 600000;

function getMimeTypeFromExt(ext: string): string {
  const cleanExt = ext.toLowerCase().replace(/^\./, '');
  switch (cleanExt) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'image/jpeg';
  }
}

function sanitizeDocId(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 120);
}

class ImageStore {
  private db: Firestore | null = null;
  private initialized = false;

  private getDb(): Firestore {
    if (this.db) return this.db;

    let projectId =
      process.env.GCP_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.FIREBASE_PROJECT_ID ||
      'projeto-agents-503014';

    let databaseId =
      process.env.FIRESTORE_DATABASE_ID ||
      process.env.FIREBASE_DATABASE_ID;

    let apiKey = process.env.FIREBASE_API_KEY;

    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(raw);
        projectId = parsed.projectId || projectId;
        if (parsed.firestoreDatabaseId && (!databaseId || databaseId === 'portfolio-danilo-novais')) {
          databaseId = parsed.firestoreDatabaseId;
        }
        if (parsed.apiKey && !apiKey) {
          apiKey = parsed.apiKey;
        }
      }
    } catch (err) {
      console.warn('[imageStore] Warning reading firebase-applet-config.json:', err);
    }

    const appName = 'image-storage-app';
    let app: FirebaseApp;
    try {
      app = getApp(appName);
    } catch {
      app = initializeApp(
        {
          projectId,
          apiKey: apiKey || 'AIzaSyDHLQ4MHwh_KU1ahvPcstxT11xouYtZMXg',
        },
        appName
      );
    }

    this.db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
    return this.db;
  }

  /**
   * Saves an image buffer to both the local disk cache and durable Firestore storage
   */
  public async saveImage(
    filename: string,
    buffer: Buffer,
    mimeType?: string
  ): Promise<string> {
    const ext = path.extname(filename);
    const resolvedMime = mimeType || getMimeTypeFromExt(ext);
    const localFilePath = path.join(UPLOADS_DIR, filename);

    // 1. Write to local disk cache
    try {
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      fs.writeFileSync(localFilePath, buffer);
    } catch (fsErr) {
      console.warn('[imageStore] Failed to write image to disk cache:', fsErr);
    }

    // 2. Persist to Firestore
    try {
      const db = this.getDb();
      const docId = sanitizeDocId(filename);
      const base64Data = buffer.toString('base64');
      const now = new Date().toISOString();

      if (base64Data.length <= MAX_INLINE_BASE64_CHARS) {
        // Single document storage
        await setDoc(doc(db, 'app_images', docId), {
          id: docId,
          filename,
          mimeType: resolvedMime,
          data: base64Data,
          size: buffer.length,
          chunkCount: 0,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        // Chunked storage for larger images
        const chunkCount = Math.ceil(base64Data.length / CHUNK_SIZE_CHARS);
        await setDoc(doc(db, 'app_images', docId), {
          id: docId,
          filename,
          mimeType: resolvedMime,
          size: buffer.length,
          chunkCount,
          createdAt: now,
          updatedAt: now,
        });

        for (let i = 0; i < chunkCount; i++) {
          const chunkStr = base64Data.substring(i * CHUNK_SIZE_CHARS, (i + 1) * CHUNK_SIZE_CHARS);
          await setDoc(doc(db, 'app_images', docId, 'chunks', `chunk_${i}`), {
            index: i,
            chunkData: chunkStr,
          });
        }
      }
    } catch (dbErr) {
      console.error('[imageStore] Error saving image to Firestore:', dbErr);
    }

    return `/api/uploads/${filename}`;
  }

  /**
   * Retrieves an image buffer.
   * Checks local disk first; if absent (e.g. after container restart), fetches from Firestore and restores to disk.
   */
  public async getImage(filename: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const localFilePath = path.join(UPLOADS_DIR, filename);
    const ext = path.extname(filename);
    const fallbackMime = getMimeTypeFromExt(ext);

    // 1. Check local disk
    if (fs.existsSync(localFilePath)) {
      try {
        const buffer = fs.readFileSync(localFilePath);
        return { buffer, mimeType: fallbackMime };
      } catch (err) {
        console.warn(`[imageStore] Error reading local disk image for ${filename}:`, err);
      }
    }

    // 2. Fetch from Firestore
    try {
      const db = this.getDb();
      const docId = sanitizeDocId(filename);
      let imgDoc = await getDoc(doc(db, 'app_images', docId));

      // If not found by direct docId, query by exact filename
      if (!imgDoc.exists()) {
        const q = query(collection(db, 'app_images'), where('filename', '==', filename));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          imgDoc = qSnap.docs[0];
        }
      }

      if (!imgDoc.exists()) {
        return null;
      }

      const data = imgDoc.data();
      const resolvedMime = data.mimeType || fallbackMime;
      let base64Result = '';

      if (data.chunkCount && data.chunkCount > 0) {
        // Reassemble chunks
        const chunksSnap = await getDocs(collection(db, 'app_images', imgDoc.id, 'chunks'));
        const chunkDocs = chunksSnap.docs
          .map(d => d.data())
          .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
        base64Result = chunkDocs.map(c => c.chunkData || '').join('');
      } else if (data.data) {
        base64Result = data.data;
      }

      if (!base64Result) {
        return null;
      }

      const buffer = Buffer.from(base64Result, 'base64');

      // Cache locally to disk for instant subsequent requests
      try {
        if (!fs.existsSync(UPLOADS_DIR)) {
          fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }
        fs.writeFileSync(localFilePath, buffer);
      } catch (cacheErr) {
        console.warn('[imageStore] Failed to write restored image to local cache:', cacheErr);
      }

      return { buffer, mimeType: resolvedMime };
    } catch (err) {
      console.error(`[imageStore] Failed to retrieve image '${filename}' from Firestore:`, err);
      return null;
    }
  }

  /**
   * Saves Base64 image data (e.g. data URI) durably
   */
  public async saveBase64Image(
    dataUriOrBase64: string,
    mimeType = 'image/jpeg',
    prefix = 'img'
  ): Promise<{ url: string; filename: string }> {
    const matches = dataUriOrBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const resolvedMime = matches ? matches[1] : mimeType;
    const base64Data = matches ? matches[2] : dataUriOrBase64;

    const ext = resolvedMime.includes('png')
      ? '.png'
      : resolvedMime.includes('webp')
      ? '.webp'
      : '.jpg';

    const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    const buffer = Buffer.from(base64Data, 'base64');

    const url = await this.saveImage(filename, buffer, resolvedMime);
    return { url, filename };
  }

  /**
   * Syncs existing files in uploads directory to Firestore if they do not already exist there
   */
  public async syncLocalUploads(): Promise<number> {
    if (!fs.existsSync(UPLOADS_DIR)) return 0;

    let synced = 0;
    try {
      const files = fs.readdirSync(UPLOADS_DIR);
      for (const file of files) {
        const filePath = path.join(UPLOADS_DIR, file);
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) continue;

        const docId = sanitizeDocId(file);
        const db = this.getDb();
        const existingDoc = await getDoc(doc(db, 'app_images', docId));
        if (!existingDoc.exists()) {
          const buffer = fs.readFileSync(filePath);
          const ext = path.extname(file);
          await this.saveImage(file, buffer, getMimeTypeFromExt(ext));
          synced++;
        }
      }
      if (synced > 0) {
        console.log(`[imageStore] Synced ${synced} existing local upload(s) to Firestore durable storage.`);
      }
    } catch (err) {
      console.warn('[imageStore] Error in syncLocalUploads:', err);
    }
    return synced;
  }
}

export const imageStore = new ImageStore();
