import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { Language } from '../types/music';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
  lang: Language;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  lang,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim());
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-[#181818] border border-white/10 rounded-xl w-full max-w-md overflow-hidden shadow-2xl"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#282828] bg-[#181818]">
          <div className="flex items-center gap-2.5">
            <FolderPlus className="w-5 h-5 text-[#1DB954]" />
            <h3 className="text-base font-bold text-white">
              {lang === 'ar' ? 'إنشاء قائمة تشغيل جديدة' : 'Create New Playlist'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#a7a7a7] hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#a7a7a7] mb-1.5">
              {lang === 'ar' ? 'اسم القائمة' : 'Playlist Name'} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={lang === 'ar' ? 'مثال: نغمات السهر والتركيز' : 'e.g. Midnight Coding Vibes'}
              className="w-full px-3.5 py-2.5 bg-[#242424] border border-[#3e3e3e] rounded-lg text-white text-sm focus:outline-none focus:border-[#1DB954] transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#a7a7a7] mb-1.5">
              {lang === 'ar' ? 'الوصف (اختياري)' : 'Description (Optional)'}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={lang === 'ar' ? 'اكتب وصفاً لطيفاً لقائمتك...' : 'Give your playlist a memorable description...'}
              className="w-full px-3.5 py-2.5 bg-[#242424] border border-[#3e3e3e] rounded-lg text-white text-sm focus:outline-none focus:border-[#1DB954] transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#a7a7a7] hover:text-white transition-colors cursor-pointer"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-6 py-2 text-xs font-bold text-black bg-[#1DB954] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-full transition-all shadow-md cursor-pointer"
            >
              {lang === 'ar' ? 'حفظ وإنشاء' : 'Save & Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
