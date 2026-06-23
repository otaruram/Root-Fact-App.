<div align="center">
  <h1>🌱 RootFacts - AI Vegetable Fun Facts</h1>
  <p>
    An intelligent, browser-based application that identifies vegetables using your camera and generates interesting fun facts using Generative AI. Built as a Progressive Web App (PWA) with full offline capabilities.
  </p>
  
  [![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
  [![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/js)
  [![Hugging Face](https://img.shields.io/badge/Transformers.js-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)](https://huggingface.co/docs/transformers.js)
  [![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
</div>

---

## 📖 Overview

**RootFacts** is an end-to-end web application developed for the Dicoding Final Project. It leverages edge AI to perform real-time image classification of vegetables and uses natural language processing (NLP) to dynamically generate unique, context-aware fun facts about the detected vegetable. The entire inference pipeline runs directly in the browser, ensuring privacy and speed.

## ✨ Key Features

- **📷 Real-time Edge AI Vision:** Identifies various vegetables instantly using your device's camera via a custom-trained Teachable Machine model running on TensorFlow.js.
- **🧠 Generative AI Facts:** Dynamically generates unique fun facts about the detected vegetable using the `Xenova/distilgpt2` model via Transformers.js (WASM backend).
- **📶 Fully Offline Capable (PWA):** Powered by Workbox Service Workers, the app caches shell assets, AI model binaries, and fonts to ensure the application works flawlessly without an internet connection after the initial load.
- **🎛️ Camera Controls:** Switch between front and rear cameras, adjust framerate (FPS), and toggle real-time scanning.
- **🎨 Modern UI/UX:** Clean, responsive design with smooth animations, dynamic confidence bars, and a polished user interface.

## 🛠️ Technology Stack

- **Frontend Core:** Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Computer Vision:** [TensorFlow.js](https://www.tensorflow.org/js) & [@teachablemachine/image](https://www.npmjs.com/package/@teachablemachine/image)
- **Generative AI / NLP:** [Transformers.js](https://huggingface.co/docs/transformers.js) (`@xenova/transformers`) running `distilgpt2` via WebAssembly
- **PWA & Caching:** [Workbox](https://developer.chrome.com/docs/workbox/) (Service Workers, CacheFirst, and StaleWhileRevalidate strategies)
- **Icons:** [Lucide Icons](https://lucide.dev/)

## 📂 Project Structure

```text
root-facts-starter/
├── index.html              # Main application entry point
├── manifest.json           # PWA Web App Manifest
├── sw.js                   # Workbox Service Worker for offline caching
├── model/                  # Local Computer Vision Model files
│   ├── model.json          # TF.js model topology
│   ├── weights.bin         # TF.js model weights
│   └── metadata.json       # Labels and model metadata
└── assets/
    ├── css/
    │   └── styles.css      # Core application styles
    ├── js/
    │   ├── core/           # App initialization, config, and utilities
    │   ├── services/       # Core business logic (Camera, Detection, Generative AI)
    │   └── ui/             # DOM manipulation and UI state management
    └── icons/              # PWA icons (192x192, 512x512, favicon, etc.)
```

## 🚀 Getting Started

Since the application uses local modules (`type="module"`) and fetches local JSON files, it must be run via a local web server. Opening `index.html` directly via the `file://` protocol will result in CORS errors.

### Prerequisites

You need a local web server to serve the files. You can use any of the following:
- **Node.js:** `npx serve` or `npm install -g http-server`
- **Python:** `python -m http.server`
- **VS Code:** Install the "Live Server" extension.

### Installation & Setup

1. **Clone the repository** (if applicable) or download the source code:
   ```bash
   git clone <repository-url>
   cd root-facts-starter
   ```

2. **Start a local development server:**
   Using `npx serve`:
   ```bash
   npx serve .
   ```
   Or using Python:
   ```bash
   python -m http.server 3000
   ```

3. **Open the app:**
   Navigate to `http://localhost:3000` (or the port provided by your server) in your modern web browser (Chrome, Edge, Firefox, or Safari).

## 💡 Usage Guide

1. **Grant Camera Permissions:** Upon first load, the browser will request access to your camera. Please allow it to enable the scanning feature.
2. **Scan a Vegetable:** Point your camera at a vegetable. Wait for the model to identify it (a confidence bar will appear).
3. **Read the Fact:** Once identified with high confidence, the app will pause the camera and generate a unique fun fact using the NLP model.
4. **Copy & Share:** Click the copy icon to copy the generated fact to your clipboard.
5. **Resume Scanning:** Click the scanning toggle button to resume the camera feed and scan another vegetable.

## 📱 Progressive Web App (Offline Mode)

This app is a fully compliant PWA. 
- You can install it on your desktop or mobile device (look for the "Install" icon in your browser's address bar).
- **Caching Strategy:** 
  - The Core Shell (HTML, CSS, JS) and TF.js Models are cached using a `CacheFirst` strategy.
  - External CDNs (Transformers.js, Lucide, Fonts) use `StaleWhileRevalidate`.
  - The Hugging Face `distilgpt2` model is cached locally via IndexedDB and Service Workers.
- Once loaded for the first time, you can disconnect from the internet and the app will continue to function natively.

## 📄 License

This project was developed as a submission for the Dicoding Academy Final Project. All rights reserved.

---
*Powered by edge AI technologies. Built with ❤️ for Dicoding.*
