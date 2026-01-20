# LexiMind AI - 你的 AI 智能语言学习助手

LexiMind AI 是一款基于 OpenAI GPT 模型的 Chrome 浏览器插件，旨在为你提供深度、准确的英语单词释义、发音、例句以及生词本复习功能，助你高效学习英语。

## ✨ 主要功能

- **AI 智能查词**：利用 GPT-4o 等先进模型，提供单词的精准中文释义、英文定义及音标。
- **语境例句**：自动生成带有中文翻译的双语例句，帮助你在实际语境中理解词汇。
- **生词本管理**：一键保存生词，随时查看和复习。
- **个性化设置**：支持自定义 OpenAI API Key、Base URL (方便国内用户使用代理) 和模型选择。

## 🛠️ 安装指南

### 1. 环境准备
确保你的电脑上已安装 [Node.js](https://nodejs.org/) (推荐 v16+)。

### 2. 获取代码
如果你已经下载了代码，请进入项目目录：
```bash
cd LexiMindAI
```

### 3. 安装依赖
在项目根目录下运行以下命令安装所需的依赖包：
```bash
npm install
```

### 4. 构建项目
运行构建命令，生成浏览器插件所需的 `dist` 文件夹：
```bash
npm run build
```

### 5. 加载到 Chrome 浏览器
1. 打开 Chrome 浏览器，在地址栏输入 `chrome://extensions/` 并回车。
2. 在页面右上角，开启 **"开发者模式" (Developer mode)** 开关。
3. 点击左上角的 **"加载已解压的扩展程序" (Load unpacked)** 按钮。
4. 选择本项目目录下的 `dist` 文件夹。
5. 成功加载后，你将在扩展程序列表中看到 "LexiMind AI"。

## 🚀 使用说明

1. **配置 API Key**：
   - 点击浏览器右上角的 LexiMind AI 插件图标打开弹窗。
   - 点击 **Settings (设置)** 图标。
   - 在 **API Token** 输入框中填入你的 OpenAI API Key (以 `sk-` 开头)。
   - (可选) 如果你需要使用代理地址，请在 **Base URL** 中填入 (例如: `https://api.openai-proxy.com/v1`)。
   - 点击 **Save Configuration** 保存。

2. **开始查词**：
   - 在弹窗的 **Vocabulary** 页面添加单词，或者在网页中使用插件提供的查词功能（如果有）。
   - 系统会自动调用 AI 获取详细解释。

## 🏗️ 技术栈

- **前端框架**: React + TypeScript
- **构建工具**: Vite
- **样式库**: Tailwind CSS
- **图标库**: Lucide React
- **AI 接口**: OpenAI API

## 📝 注意事项

- 本插件需要自行提供 OpenAI API Key 才能正常工作。
- 请确保你的网络环境可以访问 OpenAI API 或配置了正确的 Base URL。

---
**License**: MIT