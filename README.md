# Store Blueprint OS

> Analyze any online store and generate a complete **CRO + UX + Funnel Blueprint** in seconds.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=googlechrome)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)

---

## ⚡ Quick Install (from dist/)

> The `dist/` folder is auto-built by GitHub Actions on every push.

1. Clone the repo:
   ```bash
   git clone https://github.com/leonardol28m-wq/store-blueprint-os.git
   ```
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **"Load unpacked"**
5. Select the `dist/` folder
6. Done! Click the extension icon to open the Side Panel

---

## 🛠️ Build from Source

### Prerequisites
- Node.js 18+
- npm 9+

### Steps

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# dist/ is now ready to load in Chrome
```

### Build output

```
dist/
├── manifest.json        # Extension manifest (MV3)
├── background.js        # Service worker (ESM)
├── content.js           # Content script (IIFE)
├── sidebar.html         # Side panel entry
├── assets/
│   ├── sidebar-*.js     # React app bundle
│   └── sidebar-*.css    # Tailwind styles
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 📐 Architecture

| File | Role |
|------|------|
| `src/background/service-worker.ts` | Background service worker - handles messaging, caching |
| `src/content/content-script.ts` | Injected into pages - runs analysis |
| `src/content/analyzers/*` | Platform detection, structure, funnel, UX, CRO analyzers |
| `src/sidebar/App.tsx` | React side panel UI |
| `src/db/database.ts` | Dexie (IndexedDB) for analysis history |
| `src/types/index.ts` | Shared TypeScript types |
| `src/utils/` | Score computation, helpers |

---

## 🔬 Features

- **Platform Detection**: Shopify, Tiendanube, WooCommerce, Magento, PrestaShop, VTEX, BigCommerce, Squarespace, Wix
- **Structure Analysis**: 10 section types detected
- **Funnel Mapping**: Landing → Product → Cart → Checkout → Confirmation
- **UX Analysis**: Visual hierarchy, CTAs, spacing, trust elements
- **CRO Analysis**: 10 conversion elements (popups, urgency, bundles, upsells...)
- **Blueprint Generation**: Executive summary, strengths, weaknesses, quick wins, recommendations
- **History Library**: IndexedDB persistence with Dexie
- **Dark Theme**: Premium SF Pro Display typography

---

## 📁 Project Structure

```
store-blueprint-os/
├── src/
│   ├── background/service-worker.ts
│   ├── content/
│   │   ├── content-script.ts
│   │   └── analyzers/
│   │       ├── platform-detector.ts
│   │       ├── structure-analyzer.ts
│   │       ├── funnel-analyzer.ts
│   │       ├── ux-analyzer.ts
│   │       └── conversion-analyzer.ts
│   ├── sidebar/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   └── index.css
│   ├── db/database.ts
│   ├── types/index.ts
│   └── utils/
│       ├── helpers.ts
│       └── score.ts
├── scripts/
│   ├── build-scripts.mjs    # esbuild for content + background
│   └── generate-icons.mjs   # PNG icon generator
├── manifest.json
├── sidebar.html
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🛡️ Permissions

| Permission | Reason |
|------------|--------|
| `activeTab` | Access current tab URL |
| `storage` | Cache analysis results |
| `sidePanel` | Open the side panel UI |
| `scripting` | Inject content script on demand |
| `host_permissions: <all_urls>` | Analyze any website |

---

*Store Blueprint OS — Built for e-commerce professionals who need instant CRO intelligence.*
