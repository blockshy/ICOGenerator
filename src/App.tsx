import React, { useState, useCallback, useEffect, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Download, 
  History, 
  Languages, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Image as ImageIcon,
  X,
  Plus
} from 'lucide-react';
import { cn, formatDate } from './lib/utils';
import { translations, Language } from './lib/i18n';
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ImageIcon className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t.title}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors relative"
              title={t.history}
            >
              <History className="w-5 h-5 text-slate-600" />
              {history.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-white" />
              )}
            </button>
            <button
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 rounded-full transition-colors text-sm font-medium text-slate-600"
            >
              <Languages className="w-4 h-4" />
              {language.toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
                <div className="border-2 border-dashed border-slate-300 group-hover:border-blue-400 group-hover:bg-blue-50/50 rounded-2xl p-12 transition-all duration-300 flex flex-col items-center justify-center text-center space-y-4 bg-white shadow-sm">
                  <div className="w-16 h-16 bg-slate-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center transition-colors">
                    <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-500" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-700">{t.upload}</p>
                    <p className="text-sm text-slate-500 mt-1">{t.dragDrop}</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-blue-500" />
                      {t.crop}
                    </h2>
                    <button
                      onClick={() => setImage(null)}
                      className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative h-[400px] bg-slate-900">
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
                      <span className="text-sm font-medium text-slate-500 w-12">Zoom</span>
                      <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <span className="text-sm font-mono text-slate-400 w-8">{zoom.toFixed(1)}x</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column: Options */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
              <div>
                <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-500" />
                  {t.resolutions}
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {COMMON_RESOLUTIONS.map(res => (
                    <button
                      key={res}
                      onClick={() => toggleResolution(res)}
                      className={cn(
                        "py-2 px-1 rounded-lg border text-sm font-medium transition-all",
                        selectedResolutions.includes(res)
                          ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                      )}
                    >
                      {res}x{res}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  disabled={!image || selectedResolutions.length === 0 || isGenerating}
                  onClick={generateIco}
                  className={cn(
                    "w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200/50",
                    !image || selectedResolutions.length === 0 || isGenerating
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
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
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
              >
                <h2 className="font-semibold text-slate-700 mb-4">{t.preview}</h2>
                <div className="flex items-center justify-center bg-slate-50 rounded-xl p-8 border border-slate-100">
                  <div className="relative group">
                    <div className="w-16 h-16 bg-white rounded shadow-sm border border-slate-200 overflow-hidden">
                      {previewUrl ? (
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 animate-pulse" />
                      )}
                    </div>
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-400">
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
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-[70] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-500" />
                  {t.history}
                </h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
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
                      className="group bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                    >
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 overflow-hidden flex-shrink-0">
                          <img src={item.preview} alt="" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 truncate">{item.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{formatDate(item.timestamp)}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.resolutions.map(res => (
                              <span key={res} className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                {res}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteHistoryItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {history.length > 0 && (
                <div className="p-6 border-t border-slate-100">
                  <button
                    onClick={clearHistory}
                    className="w-full py-2.5 px-4 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2"
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
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-[100]"
          >
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-sm font-medium">Generating ICO...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
