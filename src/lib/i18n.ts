export const translations = {
  zh: {
    title: '网页图标生成器',
    upload: '选取图片',
    dragDrop: '拖拽图片到这里，或点击上传',
    crop: '调整裁剪区域',
    resolutions: '选择分辨率',
    generate: '生成并下载',
    history: '生成记录',
    noHistory: '暂无记录',
    clearHistory: '清空记录',
    language: '语言',
    success: '生成成功！',
    error: '生成失败，请重试',
    download: '下载',
    delete: '删除',
    preview: '预览',
    aspectRatio: '宽高比',
    square: '正方形',
    original: '原比例',
    themeLight: '切换到浅色模式',
    themeDark: '切换到深色模式',
    generating: '正在生成 ICO...',
  },
  en: {
    title: 'ICO Generator',
    upload: 'Upload Image',
    dragDrop: 'Drag and drop image here, or click to upload',
    crop: 'Adjust Crop Area',
    resolutions: 'Select Resolution',
    generate: 'Generate & Download',
    history: 'History',
    noHistory: 'No history yet',
    clearHistory: 'Clear History',
    language: 'Language',
    success: 'Generated successfully!',
    error: 'Generation failed, please try again',
    download: 'Download',
    delete: 'Delete',
    preview: 'Preview',
    aspectRatio: 'Aspect Ratio',
    square: 'Square',
    original: 'Original',
    themeLight: 'Switch to light mode',
    themeDark: 'Switch to dark mode',
    generating: 'Generating ICO...',
  },
  ja: {
    title: 'ICOジェネレーター',
    upload: '画像を選択',
    dragDrop: '画像をドラッグ＆ドロップ、またはクリックしてアップロード',
    crop: '切り抜き領域を調整',
    resolutions: '解像度を選択',
    generate: '生成してダウンロード',
    history: '生成履歴',
    noHistory: '履歴はまだありません',
    clearHistory: '履歴をクリア',
    language: '言語',
    success: '生成成功！',
    error: '生成に失敗しました。もう一度お試しください',
    download: 'ダウンロード',
    delete: '削除',
    preview: 'プレビュー',
    aspectRatio: 'アスペクト比',
    square: '正方形',
    original: '元の比率',
    themeLight: 'ライトモードに切り替え',
    themeDark: 'ダークモードに切り替え',
    generating: 'ICOを生成中...',
  }
};

export type Language = 'zh' | 'en' | 'ja';

export const languageStorageKey = 'ico-gen-lang';

export function isLanguage(value: string | null): value is Language {
  return value === 'zh' || value === 'en' || value === 'ja';
}

function normalizeLanguage(value: string | null): Language | null {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase();
  if (normalized === 'zh' || normalized === 'zh-cn' || normalized.startsWith('zh-')) {
    return 'zh';
  }
  if (normalized === 'en' || normalized === 'en-us' || normalized.startsWith('en-')) {
    return 'en';
  }
  if (normalized === 'ja' || normalized === 'ja-jp' || normalized.startsWith('ja-')) {
    return 'ja';
  }
  return null;
}

export function readInitialLanguage(storageKey = languageStorageKey): Language {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const url = new URL(window.location.href);
  const urlLanguage = normalizeLanguage(url.searchParams.get('lang') || url.searchParams.get('locale'));
  if (urlLanguage) {
    return urlLanguage;
  }

  const stored = window.localStorage.getItem(storageKey);
  if (isLanguage(stored)) {
    return stored;
  }

  const browserLang = window.navigator.language.toLowerCase();
  if (browserLang.startsWith('zh')) return 'zh';
  if (browserLang.startsWith('ja')) return 'ja';
  return 'en';
}

export function applyLanguage(language: Language, storageKey = languageStorageKey) {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja' : 'en';
  window.localStorage.setItem(storageKey, language);
}

export function cleanupLanguageQueryParam() {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  const hasValidLanguage = Boolean(
    normalizeLanguage(url.searchParams.get('lang')) || normalizeLanguage(url.searchParams.get('locale')),
  );
  if (!hasValidLanguage) {
    return;
  }

  url.searchParams.delete('lang');
  url.searchParams.delete('locale');
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}
