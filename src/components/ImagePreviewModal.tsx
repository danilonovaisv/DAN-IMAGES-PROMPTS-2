import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink } from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  imageUrl,
  title,
  onClose,
}) => {
  if (!imageUrl) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative max-w-5xl max-h-[90vh] w-full bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col z-10"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b-2 border-black bg-white">
              <span className="text-sm font-black uppercase text-black truncate pr-4">
                {title || 'VISUALIZAÇÃO DA IMAGEM DE REFERÊNCIA'}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="p-1.5 text-black hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors flex items-center justify-center"
                  title="Abrir imagem original"
                >
                  <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-black hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors flex items-center justify-center"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50 min-h-[300px]">
              <img
                src={imageUrl}
                alt={title || 'Referência de imagem'}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[75vh] object-contain border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
