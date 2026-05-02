import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Download, 
  History, 
  Languages, 
  Trash2, 
  Image as ImageIcon,
  X,
  Plus,
  Moon,
  Sun
} from 'lucide-react';
import { cn, formatDate } from './lib/utils';
import { translations, Language } from './lib/i18n';
import { applyTheme, cleanupThemeQueryParam, readInitialTheme } from './lib/theme';
import type { ThemeMode } from './lib/theme';
import { getCroppedImg, blobToBase64 } from './utils/canvas';
import { generateMultiResIco } from './utils/ico';

interface HistoryItem {
  id: string;
  name: string;
  resolutions: number[];
  timestamp: number;
  preview: string;
}

const COMMON_RESOLUTIONS = [16, 32, 48, 64, 128, 256];

export default function App() {
  // --- State ---
  const [language, setLanguage] = useState<Language>(() => {
    const cached = localStorage.getItem('ico-gen-lang');
    if (cached === 'zh' || cached === 'en') return cached;
    return navigator.language.startsWith('zh') ? 'zh' : 'en';
  });
  const [theme, setTheme] = useState<ThemeMode>(() => readInitialTheme());

  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [selectedResolutions, setSelectedResolutions] = useState<number[]>([32, 64, 128]);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const cached = localStorage.getItem('ico-gen-history');
    return cached ? JSON.parse(cached) : [];
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const t = translations[language];

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('ico-gen-lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('ico-gen-history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    applyTheme(theme);
    cleanupThemeQueryParam();
  }, [theme]);

  // --- Handlers ---
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileName(file.name.split('.')[0]);
      const reader = new FileReader();
      reader.addEventListener('load', () => setImage(reader.result as string));
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback(async (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
    if (image) {
      const preview = await getCroppedImg(image, croppedAreaPixels, 64);
      if (preview) {
        setPreviewUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(preview);
        });
      }
    }
  }, [image]);

  const generateIco = async () => {
    if (!image || !croppedAreaPixels || selectedResolutions.length === 0) return;

    setIsGenerating(true);
    try {
      // Generate and download each resolution separately
      await Promise.all(
        selectedResolutions.map(async (size) => {
          const blob = await getCroppedImg(image, croppedAreaPixels, size);
          if (!blob) throw new Error(`Failed to crop image for ${size}x${size}`);
          
          // Wrap single PNG in ICO container
          const icoBlob = await generateMultiResIco([{ blob, size }]);
          const url = URL.createObjectURL(icoBlob);
          
          // Download with new naming rule: [filename]_[size].ico
          const link = document.createElement('a');
          link.href = url;
          link.download = `${fileName || 'favicon'}_${size}x${size}.ico`;
          document.body.appendChild(link);
          link.click();
          
          // Cleanup
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }, 100);
        })
      );

      // Add to history (one entry representing the batch)
      const previewBlob = await getCroppedImg(image, croppedAreaPixels, 64);
      const previewBase64 = previewBlob ? await blobToBase64(previewBlob) : '';
      
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        name: `${fileName || 'favicon'}_[${selectedResolutions.join(', ')}].ico`,
        resolutions: [...selectedResolutions],
        timestamp: Date.now(),
        preview: previewBase64,
      };
      setHistory(prev => [newItem, ...prev].slice(0, 20));

    } catch (error) {
      console.error(error);
      alert(t.error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleResolution = (res: number) => {
    setSelectedResolutions(prev => 
      prev.includes(res) ? prev.filter(r => r !== res) : [...prev, res]
    );
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="ico-app min-h-screen font-sans">
      {/* Header */}
      <header className="tool-shell-header">
        <div className="tool-shell-header-inner">
          <div className="tool-brand">
            <div className="tool-brand-mark">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h1 className="tool-brand-title">
              {t.title}
            </h1>
          </div>
          
          <div className="tool-header-actions">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="tool-icon-button relative"
              title={t.history}
              aria-label={t.history}
            >
              <History className="w-5 h-5" />
              {history.length > 0 && (
                <span className="tool-notification-dot" />
              )}
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="tool-icon-button"
              title={theme === 'dark' ? t.themeLight : t.themeDark}
              aria-label={theme === 'dark' ? t.themeLight : t.themeDark}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
              className="tool-text-button"
              title={t.language}
              aria-label={t.language}
            >
              <Languages className="w-4 h-4" />
              {language.toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      <main className="tool-main">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column: Upload & Crop */}
          <div className="lg:col-span-8 space-y-6">
            {!image ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative group"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="ico-upload-zone">
                  <div className="ico-upload-icon">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="tool-section-title">{t.upload}</p>
                    <p className="tool-muted-text mt-1">{t.dragDrop}</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="tool-surface overflow-hidden">
                  <div className="tool-surface-header">
                    <h2 className="tool-panel-title">
                      <ImageIcon className="w-4 h-4" />
                      {t.crop}
                    </h2>
                    <button
                      onClick={() => setImage(null)}
                      className="tool-icon-button compact"
                      aria-label={language === 'zh' ? '移除图片' : 'Remove image'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="ico-crop-stage">
                    <Cropper
                      image={image}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                    />
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="tool-label w-12">Zoom</span>
                      <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="tool-range flex-1"
                      />
                      <span className="tool-mono-value w-8">{zoom.toFixed(1)}x</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column: Options */}
          <div className="lg:col-span-4 space-y-6">
            <div className="tool-surface p-6 space-y-6">
              <div>
                <h2 className="tool-panel-title mb-4">
                  <Plus className="w-4 h-4" />
                  {t.resolutions}
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {COMMON_RESOLUTIONS.map(res => (
                    <button
                      key={res}
                      onClick={() => toggleResolution(res)}
                      className={cn(
                        "ico-resolution-button",
                        selectedResolutions.includes(res) ? "selected" : ""
                      )}
                    >
                      {res}x{res}
                    </button>
                  ))}
                </div>
              </div>

              <div className="tool-divider-top pt-4">
                <button
                  disabled={!image || selectedResolutions.length === 0 || isGenerating}
                  onClick={generateIco}
                  className={cn(
                    "tool-primary-button w-full",
                    (!image || selectedResolutions.length === 0 || isGenerating) ? "disabled" : ""
                  )}
                >
                  {isGenerating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  {t.generate}
                </button>
              </div>
            </div>

            {/* Preview Section (if image exists) */}
            {image && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="tool-surface p-6"
              >
                <h2 className="tool-panel-title mb-4">{t.preview}</h2>
                <div className="ico-preview-stage">
                  <div className="relative group">
                    <div className="ico-preview-box">
                      {previewUrl ? (
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="tool-skeleton w-full h-full animate-pulse" />
                      )}
                    </div>
                    <div className="ico-preview-size-label">
                      64x64
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* History Sidebar Overlay */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="tool-overlay"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="tool-drawer"
            >
              <div className="tool-drawer-header">
                <h2 className="tool-drawer-title">
                  <History className="w-5 h-5" />
                  {t.history}
                </h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="tool-icon-button"
                  aria-label={language === 'zh' ? '关闭记录' : 'Close history'}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {history.length === 0 ? (
                  <div className="tool-empty-state">
                    <History className="w-12 h-12 opacity-20" />
                    <p>{t.noHistory}</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="tool-history-item group"
                    >
                      <div className="flex gap-4">
                        <div className="tool-history-preview">
                          <img src={item.preview} alt="" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="tool-history-name">{item.name}</p>
                          <p className="tool-history-time">{formatDate(item.timestamp)}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.resolutions.map(res => (
                              <span key={res} className="tool-chip">
                                {res}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteHistoryItem(item.id)}
                          className="tool-danger-icon-button"
                          aria-label={language === 'zh' ? '删除记录' : 'Delete history item'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {history.length > 0 && (
                <div className="tool-drawer-footer">
                  <button
                    onClick={clearHistory}
                    className="tool-danger-button"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t.clearHistory}
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notification (Simple) */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="tool-toast"
          >
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-sm font-medium">{t.generating}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
