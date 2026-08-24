import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  FolderSync,
  Sparkles,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldCheck,
  Key,
  Loader2,
  Upload,
  Image as ImageIcon,
  ClipboardPaste,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { useToast } from '../../components/Toast';
import { googleSignIn, initAuth, getAccessToken, setManualAccessToken } from '../../services/firebaseAuth';
import firebaseConfig from '../../../firebase-applet-config.json';

declare global {
  interface Window {
    google?: any;
  }
}

interface WorkspaceImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const WorkspaceImportModal: React.FC<WorkspaceImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'direct' | 'oauth'>('direct');

  // Direct Tab State
  const [pastedText, setPastedText] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // OAuth Tab State
  const [docUrl, setDocUrl] = useState(
    'https://docs.google.com/document/d/1v3R4JZqAWiBfNMCnIamCnvXpcXYKcgI6J9HZkSWmp2I/edit?usp=drive_link'
  );
  const [folderUrl, setFolderUrl] = useState(
    'https://drive.google.com/drive/folders/1ceHlomDrh3Lu_nmLN_LXxrymIShvMdoK?usp=drive_link'
  );
  const [accessToken, setAccessToken] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [autoAnalyzeWithAI, setAutoAnalyzeWithAI] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [importStats, setImportStats] = useState<{
    totalParsed: number;
    importedCount: number;
    updatedCount: number;
    matchedImagesCount: number;
    warnings: string[];
  } | null>(null);

  const [isInIframe, setIsInIframe] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setImportStats(null);
      setAuthError(null);
      setIsInIframe(window.self !== window.top);

      // Check existing cached token
      getAccessToken().then((token) => {
        if (token) {
          setAccessToken(token);
        }
      });

      const unsubscribe = initAuth(
        (user, token) => {
          if (user.email) setUserEmail(user.email);
          if (token) setAccessToken(token);
        },
        () => {
          // Unauthenticated or token cleared
        }
      );

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [isOpen]);

  const handleGoogleAuth = async () => {
    setIsAuthorizing(true);
    setAuthError(null);

    try {
      // 1. Try Firebase Auth popup
      const result = await googleSignIn();
      if (result && result.accessToken) {
        setAccessToken(result.accessToken);
        if (result.user.email) setUserEmail(result.user.email);
        showToast(
          'Conta Google Conectada!',
          'Autorização concedida com sucesso. Agora você pode clicar em "Iniciar Importação".',
          'success'
        );
        setIsAuthorizing(false);
        return;
      }
    } catch (firebaseErr: any) {
      console.warn('Tentativa com Firebase Auth popup falhou, tentando fallback com Google Identity Services:', firebaseErr);

      // 2. Fallback to Google Identity Services (GIS) with accurate OAuth Client ID
      try {
        const clientId =
          firebaseConfig.oAuthClientId ||
          import.meta.env.VITE_GOOGLE_CLIENT_ID ||
          '1044209571335-1pnbfjpan7npjb2bqlhv7bhffji9cror.apps.googleusercontent.com';

        if (window.google?.accounts?.oauth2) {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope:
              'https://www.googleapis.com/auth/documents.readonly https://www.googleapis.com/auth/drive.readonly',
            callback: (response: any) => {
              setIsAuthorizing(false);
              if (response && response.access_token) {
                setAccessToken(response.access_token);
                setManualAccessToken(response.access_token);
                showToast(
                  'Conta Google Conectada!',
                  'Autorização concedida via Google. Agora clique em "Iniciar Importação".',
                  'success'
                );
              } else if (response?.error) {
                const msg = response.error_description || response.error || 'Falha na autorização';
                setAuthError(msg);
                showToast('Aviso de Login', 'Use a aba "Colar Conteúdo & Imagens" para importar com 1 clique.', 'info');
              }
            },
            error_callback: (err: any) => {
              setIsAuthorizing(false);
              const errMsg = err?.type === 'popup_closed'
                ? 'Janela de login fechada'
                : 'Restrição de pop-up no navegador';
              setAuthError(errMsg);
              showToast(
                'Aviso de Pop-up',
                'Utilize a aba "Colar Conteúdo & Imagens" para importar instantaneamente.',
                'info'
              );
            },
          });
          client.requestAccessToken({ prompt: 'consent' });
          return;
        }
      } catch (gisErr: any) {
        console.warn('Fallback GIS também falhou:', gisErr);
      }

      setIsAuthorizing(false);
      const isPopupBlocked = firebaseErr?.code === 'auth/popup-blocked' || firebaseErr?.code === 'auth/popup-closed-by-user';
      const msg = isPopupBlocked
        ? 'O pop-up de login foi bloqueado ou fechado pelo navegador.'
        : (firebaseErr.message || 'Não foi possível autenticar.');
      
      setAuthError(msg);
      showToast(
        'Dica de Importação',
        'Você pode usar a aba "Colar Conteúdo & Imagens" ao lado para importar diretamente sem precisar de login!',
        'info'
      );
    }
  };

  // Direct Import Submit
  const handleDirectImport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pastedText.trim()) {
      showToast(
        'Texto Obrigatório',
        'Cole o texto ou a lista de prompts do Google Docs no campo de texto.',
        'error'
      );
      return;
    }

    setIsImporting(true);
    setImportStats(null);

    try {
      let uploadedFilesMeta: Array<{ originalName: string; localUrl: string }> = [];

      // If user selected drive images, upload them first
      if (selectedImages.length > 0) {
        setIsUploadingImages(true);
        try {
          const filesResponse = await ApiService.uploadBatchImages(selectedImages);
          uploadedFilesMeta = filesResponse.map(f => ({
            originalName: f.originalName,
            localUrl: f.localUrl,
          }));
        } catch (uploadErr: any) {
          console.warn('Erro ao fazer upload das imagens:', uploadErr);
          showToast('Aviso nas Imagens', 'Algumas imagens não puderam ser enviadas. Continuando importação dos prompts...', 'info');
        } finally {
          setIsUploadingImages(false);
        }
      }

      // Execute Direct Import
      const result = await ApiService.directTextImport({
        rawText: pastedText.trim(),
        imageFiles: uploadedFilesMeta,
        autoAnalyzeWithAI,
      });

      setImportStats({
        totalParsed: result.totalParsed,
        importedCount: result.importedCount,
        updatedCount: result.updatedCount,
        matchedImagesCount: result.matchedImagesCount,
        warnings: result.warnings || [],
      });

      showToast(
        'Importação Concluída com Sucesso!',
        `${result.importedCount + result.updatedCount} prompts adicionados à biblioteca e ${result.matchedImagesCount} imagens vinculadas.`,
        'success'
      );

      onImportSuccess();
    } catch (err: any) {
      console.error('Erro na importação direta:', err);
      showToast(
        'Falha na importação',
        err.message || 'Verifique o formato do texto inserido.',
        'error'
      );
    } finally {
      setIsImporting(false);
    }
  };

  // OAuth Import Submit
  const handleOAuthImport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessToken.trim()) {
      showToast(
        'Token de Acesso Necessário',
        'Conecte com sua Conta Google ou use a aba "Colar Conteúdo & Imagens" para importar sem precisar de token.',
        'error'
      );
      return;
    }

    if (!docUrl.trim()) {
      showToast('URL do Documento Obrigatória', 'Informe o link do Google Docs com os prompts.', 'error');
      return;
    }

    setIsImporting(true);
    setImportStats(null);

    try {
      const result = await ApiService.importFromWorkspace({
        accessToken: accessToken.trim(),
        docUrlOrId: docUrl.trim(),
        folderUrlOrId: folderUrl.trim(),
        autoAnalyzeWithAI,
      });

      setImportStats({
        totalParsed: result.totalParsed,
        importedCount: result.importedCount,
        updatedCount: result.updatedCount,
        matchedImagesCount: result.matchedImagesCount,
        warnings: result.warnings || [],
      });

      showToast(
        'Importação Concluída com Sucesso!',
        `${result.importedCount + result.updatedCount} prompts sincronizados e ${result.matchedImagesCount} imagens vinculadas do Drive.`,
        'success'
      );

      onImportSuccess();
    } catch (err: any) {
      console.error('Erro na importação OAuth:', err);
      showToast(
        'Falha ao importar do Workspace',
        err.message || 'Verifique se o token tem permissões de leitura no Google Docs e Google Drive.',
        'error',
        6000
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedImages((prev) => [...prev, ...filesArray]);
    }
  };

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setPastedText(text);
          showToast('Arquivo Carregado', `${file.name} carregado com sucesso.`, 'success');
        }
      };
      reader.readAsText(file);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative max-w-2xl w-full bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col z-10 my-8 max-h-[92vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-white sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <FolderSync className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black uppercase text-black tracking-tight leading-none">
                  IMPORTAR GOOGLE DOCS & DRIVE
                </h2>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">
                  Sincronização de prompts e imagens de referência
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-black hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="grid grid-cols-2 border-b-2 border-black bg-gray-100 font-black text-xs uppercase tracking-tight">
            <button
              type="button"
              onClick={() => setActiveTab('direct')}
              className={`py-3 px-4 flex items-center justify-center gap-2 border-r-2 border-black transition-colors cursor-pointer ${
                activeTab === 'direct'
                  ? 'bg-white text-black shadow-inner'
                  : 'text-gray-500 hover:text-black hover:bg-gray-50'
              }`}
            >
              <ClipboardPaste className="w-4 h-4" />
              <span>Colar Conteúdo & Imagens</span>
              <span className="ml-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] border border-emerald-800">
                Recomendado
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('oauth')}
              className={`py-3 px-4 flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'oauth'
                  ? 'bg-white text-black shadow-inner'
                  : 'text-gray-500 hover:text-black hover:bg-gray-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Conectar API Google (OAuth)</span>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Quick Links to User's Google Workspace Assets */}
            <div className="p-3 bg-gray-50 border-2 border-black flex flex-wrap items-center justify-between gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-xs font-black uppercase text-gray-700">Seus Links Google:</span>
              <div className="flex items-center gap-2">
                <a
                  href="https://docs.google.com/document/d/1v3R4JZqAWiBfNMCnIamCnvXpcXYKcgI6J9HZkSWmp2I/edit?usp=drive_link"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-black bg-white border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Abrir Google Docs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <a
                  href="https://drive.google.com/drive/folders/1ceHlomDrh3Lu_nmLN_LXxrymIShvMdoK?usp=drive_link"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-black bg-white border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100"
                >
                  <FolderSync className="w-3.5 h-3.5" />
                  <span>Abrir Pasta Google Drive</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* TAB 1: DIRECT CONTENT PASTE & BATCH IMAGES */}
            {activeTab === 'direct' && (
              <form onSubmit={handleDirectImport} className="space-y-4">
                <div className="p-3 bg-neutral-50 border-2 border-black text-xs text-gray-700 space-y-1">
                  <div className="font-black uppercase text-black flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-black" />
                    Como funciona a importação direta:
                  </div>
                  <p>
                    1. Abra o seu <strong className="text-black">Google Docs</strong>, copie o texto com os prompts e cole no campo abaixo (ou carregue um arquivo .txt).
                  </p>
                  <p>
                    2. Selecione as fotos baixadas do <strong className="text-black">Google Drive</strong>. O sistema associará automaticamente cada imagem ao prompt pelo título ou número correspondente!
                  </p>
                </div>

                {/* Prompts Text Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-black uppercase text-black">
                    <label className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-black" />
                      Conteúdo dos Prompts (Google Docs)
                    </label>

                    <button
                      type="button"
                      onClick={() => docFileInputRef.current?.click()}
                      className="text-xs text-gray-600 hover:text-black font-bold uppercase underline cursor-pointer"
                    >
                      Carregar Arquivo (.txt)
                    </button>
                    <input
                      ref={docFileInputRef}
                      type="file"
                      accept=".txt,.json,.md"
                      onChange={handleDocFileChange}
                      className="hidden"
                    />
                  </div>

                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Cole aqui os prompts do Google Docs... Exemplo:&#10;&#10;Prompt 1: Cyberpunk City at Night&#10;Futuristic city street with neon lights, volumetric rain, 8k resolution, cinematic lighting --ar 16:9 --v 6.0&#10;&#10;Prompt 2: Portrait of Ancient Warrior&#10;Detailed close-up studio portrait, intricate gold armor, atmospheric haze --ar 16:9"
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-black text-xs font-mono text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black resize-y"
                    required
                  />
                </div>

                {/* Drive Images Batch Upload */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-black uppercase text-black">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-black" />
                      Imagens de Referência do Drive (Opcional)
                    </span>
                    {selectedImages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedImages([])}
                        className="text-xs text-red-600 hover:underline font-bold uppercase cursor-pointer"
                      >
                        Limpar ({selectedImages.length})
                      </button>
                    )}
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 border-2 border-dashed border-black bg-gray-50 hover:bg-gray-100 cursor-pointer text-center transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <Upload className="w-6 h-6 mx-auto mb-2 text-black" />
                    <p className="text-xs font-black uppercase text-black">
                      Clique para selecionar as imagens da pasta do Google Drive
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      (PNG, JPG, WebP — Suporta múltiplos arquivos de uma vez)
                    </p>
                  </div>

                  {selectedImages.length > 0 && (
                    <div className="p-2.5 bg-white border-2 border-black max-h-24 overflow-y-auto space-y-1">
                      <p className="text-[11px] font-black text-black uppercase">
                        {selectedImages.length} imagens selecionadas para vinculação:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedImages.map((file, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-gray-100 text-black text-[10px] font-mono border border-black"
                          >
                            {file.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Toggle */}
                <label className="flex items-center gap-3 p-3 bg-gray-50 border-2 border-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none">
                  <input
                    type="checkbox"
                    checked={autoAnalyzeWithAI}
                    onChange={(e) => setAutoAnalyzeWithAI(e.target.checked)}
                    className="w-4 h-4 accent-black rounded-none border-2 border-black"
                  />
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-black">
                    <Sparkles className="w-4 h-4 stroke-[2.5]" />
                    <span>Decompor e estruturar automaticamente com IA (Gemini)</span>
                  </div>
                </label>

                {/* Result Feedback */}
                {importStats && (
                  <div className="p-4 bg-emerald-50 border-2 border-black space-y-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-2 text-black font-black uppercase text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
                      <span>Relatório de Importação</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-black uppercase">
                      <div className="p-2 bg-white border-2 border-black">
                        <div className="text-base text-black">{importStats.totalParsed}</div>
                        <div className="text-[10px] text-gray-500">Detectados</div>
                      </div>
                      <div className="p-2 bg-white border-2 border-black">
                        <div className="text-base text-emerald-700">
                          {importStats.importedCount + importStats.updatedCount}
                        </div>
                        <div className="text-[10px] text-gray-500">Salvos</div>
                      </div>
                      <div className="p-2 bg-white border-2 border-black">
                        <div className="text-base text-blue-700">{importStats.matchedImagesCount}</div>
                        <div className="text-[10px] text-gray-500">Imagens Vinculadas</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-black">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isImporting || isUploadingImages}
                    className="px-4 py-2.5 text-xs font-black uppercase text-black bg-white hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer"
                  >
                    {importStats ? 'Concluir & Fechar' : 'Cancelar'}
                  </button>

                  <button
                    type="submit"
                    disabled={isImporting || isUploadingImages}
                    className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isImporting || isUploadingImages ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processando Importação...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                        <span>Processar e Importar</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: OAUTH API SYNC */}
            {activeTab === 'oauth' && (
              <form onSubmit={handleOAuthImport} className="space-y-4">
                {/* Google OAuth Banner */}
                <div className="p-4 bg-gray-50 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-black stroke-[2.5] shrink-0" />
                      <div>
                        <p className="text-xs font-black uppercase text-black">Autenticação Google Workspace</p>
                        <p className="text-xs text-gray-600 font-medium">
                          {userEmail ? `Conectado como ${userEmail}` : 'Conecte sua conta para autorizar leitura direta via API.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleAuth}
                      disabled={isAuthorizing || isImporting}
                      className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      {isAuthorizing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Conectando...</span>
                        </>
                      ) : accessToken ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                          <span>Reconectar Google</span>
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          <span>Conectar com Google</span>
                        </>
                      )}
                    </button>
                  </div>

                  {accessToken && (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 text-xs font-black text-emerald-700 uppercase">
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>Token OAuth ativo e pronto para importação</span>
                    </div>
                  )}

                  {authError && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-amber-900 bg-amber-50 p-2.5 border border-amber-400 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold">{authError}</p>
                        <p className="text-amber-800">
                          Recomendação: você pode usar a aba{' '}
                          <button
                            type="button"
                            onClick={() => setActiveTab('direct')}
                            className="font-black underline uppercase text-black"
                          >
                            Colar Conteúdo & Imagens
                          </button>{' '}
                          para importar sem depender de autenticação por popup.
                        </p>
                      </div>
                    </div>
                  )}

                  {isInIframe && !accessToken && (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between gap-2 text-xs text-gray-500">
                      <span>Se o Google exibir erro de pop-up ou tela vermelha:</span>
                      <button
                        type="button"
                        onClick={() => window.open(window.location.href, '_blank')}
                        className="inline-flex items-center gap-1 font-bold text-black hover:underline shrink-0"
                      >
                        <span>Abrir nova aba</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Google Docs URL Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase text-black">
                    Link do Google Docs (Prompts)
                  </label>
                  <input
                    type="text"
                    value={docUrl}
                    onChange={(e) => setDocUrl(e.target.value)}
                    placeholder="https://docs.google.com/document/d/..."
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-black text-xs font-mono text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>

                {/* Google Drive Folder Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase text-black">
                    Link da Pasta Google Drive (Imagens)
                  </label>
                  <input
                    type="text"
                    value={folderUrl}
                    onChange={(e) => setFolderUrl(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-black text-xs font-mono text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                {/* Manual Access Token */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase text-black">
                    Access Token OAuth (Google API Bearer Token)
                  </label>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="ya29.a0..."
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-black text-xs font-mono text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                {/* AI Auto Decomposition Toggle */}
                <label className="flex items-center gap-3 p-3 bg-gray-50 border-2 border-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none">
                  <input
                    type="checkbox"
                    checked={autoAnalyzeWithAI}
                    onChange={(e) => setAutoAnalyzeWithAI(e.target.checked)}
                    className="w-4 h-4 accent-black rounded-none border-2 border-black"
                  />
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-black">
                    <Sparkles className="w-4 h-4 stroke-[2.5]" />
                    <span>Estruturar automaticamente com IA (Gemini)</span>
                  </div>
                </label>

                {/* Results Box */}
                {importStats && (
                  <div className="p-4 bg-emerald-50 border-2 border-black space-y-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-2 text-black font-black uppercase text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
                      <span>Relatório de Importação</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-black uppercase">
                      <div className="p-2 bg-white border-2 border-black">
                        <div className="text-base text-black">{importStats.totalParsed}</div>
                        <div className="text-[10px] text-gray-500">Detectados</div>
                      </div>
                      <div className="p-2 bg-white border-2 border-black">
                        <div className="text-base text-emerald-700">
                          {importStats.importedCount + importStats.updatedCount}
                        </div>
                        <div className="text-[10px] text-gray-500">Salvos</div>
                      </div>
                      <div className="p-2 bg-white border-2 border-black">
                        <div className="text-base text-blue-700">{importStats.matchedImagesCount}</div>
                        <div className="text-[10px] text-gray-500">Imagens Drive</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-black">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isImporting}
                    className="px-4 py-2.5 text-xs font-black uppercase text-black bg-white hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer"
                  >
                    {importStats ? 'Concluir & Fechar' : 'Cancelar'}
                  </button>

                  <button
                    type="submit"
                    disabled={isImporting}
                    className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sincronizando Workspace...</span>
                      </>
                    ) : (
                      <>
                        <FolderSync className="w-4 h-4 stroke-[2.5]" />
                        <span>Iniciar Importação</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
