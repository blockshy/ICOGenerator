# ICOGenerator

## 中文说明

ICOGenerator 是一个本地图片转 ICO 的 Web 工具，支持上传图片后进行裁剪，并按多个分辨率分别生成 `.ico` 文件，适合为网站、桌面程序或快捷方式制作图标。

### 功能特性

- 支持上传本地图片并进行可视化裁剪
- 支持选择多个常用分辨率，如 `16x16`、`32x32`、`64x64`、`128x128`、`256x256`
- 按分辨率分别导出 ICO 文件
- 内置中英双语界面切换
- 使用 `localStorage` 保存语言和生成历史
- 提供裁剪预览与历史记录面板

### 技术栈

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- `react-easy-crop`
- `lucide-react`
- `motion`

### 本地运行

```bash
npm install
npm run dev
```

默认开发地址：

```text
http://localhost:3000
```

### 构建生产版本

```bash
npm run build
npm run preview
```

### 目录结构

```text
src/
  App.tsx              主界面
  lib/
    i18n.ts            中英文本
    utils.ts           通用工具
  utils/
    canvas.ts          图片裁剪与预览处理
    ico.ts             ICO 生成逻辑
```

### 适用场景

- 生成网站 favicon
- 制作 Windows 应用图标
- 批量导出常见尺寸图标素材

---

## English

ICOGenerator is a web-based local image-to-ICO tool. It lets users upload an image, crop it visually, and export separate `.ico` files in multiple resolutions. It is suitable for website favicons, desktop apps, and shortcut icons.

### Features

- Upload and crop local images in the browser
- Select multiple common resolutions such as `16x16`, `32x32`, `64x64`, `128x128`, and `256x256`
- Export ICO files separately for each selected size
- Built-in Chinese and English UI switching
- Persists language and generation history with `localStorage`
- Includes preview and history panels

### Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- `react-easy-crop`
- `lucide-react`
- `motion`

### Run Locally

```bash
npm install
npm run dev
```

Default dev URL:

```text
http://localhost:3000
```

### Build for Production

```bash
npm run build
npm run preview
```

### Project Structure

```text
src/
  App.tsx              Main UI
  lib/
    i18n.ts            Chinese and English text resources
    utils.ts           Shared helpers
  utils/
    canvas.ts          Crop and preview processing
    ico.ts             ICO generation logic
```

### Use Cases

- Generate website favicons
- Create Windows application icons
- Export common icon sizes from one source image
