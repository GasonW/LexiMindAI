console.log('LexiMind AI Background Service Worker Running');

chrome.runtime.onInstalled.addListener(() => {
    console.log('LexiMind AI Installed');

    chrome.contextMenus.create({
        id: "leximind-translate",
        title: "Translate with LexiMind AI",
        contexts: ["selection"]
    });
});

// 发送消息并支持重试
async function sendMessageWithRetry(tabId: number, message: any, retries = 3): Promise<void> {
    for (let i = 0; i < retries; i++) {
        try {
            await chrome.tabs.sendMessage(tabId, message);
            return;
        } catch {
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
    }
    throw new Error('Failed to send message after retries');
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "leximind-translate" && info.selectionText && tab?.id) {
        const tabId = tab.id;
        const message = {
            type: 'TRIGGER_TRANSLATION',
            selectionText: info.selectionText.trim()
        };

        try {
            // 尝试发送消息
            await chrome.tabs.sendMessage(tabId, message);
        } catch {
            // Content script 未加载，先注入再发送消息
            console.log('Injecting content script...');
            try {
                await chrome.scripting.executeScript({
                    target: { tabId },
                    files: ['assets/content.js']
                });
                await chrome.scripting.insertCSS({
                    target: { tabId },
                    files: ['assets/style.css']
                });
                // 等待 content script 初始化并重试发送消息
                await new Promise(resolve => setTimeout(resolve, 500));
                await sendMessageWithRetry(tabId, message);
            } catch (e) {
                console.error('Failed to inject content script:', e);
            }
        }
    }
});
