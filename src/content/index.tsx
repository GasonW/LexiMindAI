import { createRoot } from 'react-dom/client';
import ContentApp from './ContentApp';
import '../index.css'; // Ensure tailwind is included in build
import { clueHighlighter } from './ClueHighlighter';

console.log('LexiMind AI Content Script Loaded');

// Initialize the clue highlighter (singleton is auto-initialized on import)
// This ensures vocabulary words are highlighted when Clue Mode is enabled
void clueHighlighter;

const HOST_ID = 'leximind-ai-host';

function init() {
    if (document.getElementById(HOST_ID)) return;

    const host = document.createElement('div');
    host.id = HOST_ID;
    host.style.position = 'fixed';
    host.style.top = '0';
    host.style.left = '0';
    host.style.width = '0';
    host.style.height = '0';
    host.style.overflow = 'visible';
    host.style.zIndex = '2147483647';
    host.style.pointerEvents = 'none';
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    // 创建根容器，设置必要的样式
    const rootContainer = document.createElement('div');
    rootContainer.id = 'leximind-root';
    rootContainer.style.position = 'fixed';
    rootContainer.style.top = '0';
    rootContainer.style.left = '0';
    rootContainer.style.width = '100vw';
    rootContainer.style.height = '100vh';
    rootContainer.style.pointerEvents = 'none';
    rootContainer.style.overflow = 'visible';
    shadow.appendChild(rootContainer);

    // 注入样式到 Shadow DOM
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = chrome.runtime.getURL('assets/style.css');
    shadow.appendChild(styleLink);

    // 等待样式加载完成后再渲染 React 组件
    styleLink.onload = () => {
        console.log('LexiMind AI: 样式加载完成');
        createRoot(rootContainer).render(<ContentApp />);
    };

    // 样式加载失败的备选方案
    styleLink.onerror = () => {
        console.warn('LexiMind AI: 样式加载失败，使用内联样式');
        // 添加关键的内联样式作为备选
        const fallbackStyle = document.createElement('style');
        fallbackStyle.textContent = `
            .fixed { position: fixed; }
            .z-\\[99999\\] { z-index: 99999; }
            .z-\\[100000\\] { z-index: 100000; }
            .pointer-events-auto { pointer-events: auto; }
            .bg-blue-600 { background-color: #2563eb; }
            .text-white { color: white; }
            .p-2 { padding: 0.5rem; }
            .rounded-full { border-radius: 9999px; }
            .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
            .cursor-pointer { cursor: pointer; }
            .bg-white { background-color: white; }
            .rounded-xl { border-radius: 0.75rem; }
            .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
        `;
        shadow.appendChild(fallbackStyle);
        createRoot(rootContainer).render(<ContentApp />);
    };

    // 如果样式在 3 秒内未加载完成，强制渲染
    setTimeout(() => {
        if (!rootContainer.hasChildNodes()) {
            console.warn('LexiMind AI: 样式加载超时，强制渲染');
            createRoot(rootContainer).render(<ContentApp />);
        }
    }, 3000);
}

init();
