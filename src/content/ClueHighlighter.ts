import { vocabulary } from '../utils/wordMatching';

export class ClueHighlighter {
    isActive: boolean = false;

    constructor() {
        this.initListener();
    }

    initListener() {
        // Listen for storage changes
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.onChanged.addListener((changes, area) => {
                if (area === 'local' && changes.clueMode) {
                    // Type assertion for newValue
                    this.toggle(changes.clueMode.newValue as boolean);
                }
            });

            // Initialize state
            chrome.storage.local.get(['clueMode'], (result) => {
                if (result.clueMode) {
                    this.toggle(true);
                }
            });
        }
    }

    toggle(active: boolean) {
        this.isActive = active;
        if (active) {
            this.scanAndHighlight();
        } else {
            this.removeHighlights();
        }
    }

    scanAndHighlight() {
        if (!this.isActive) return;

        requestIdleCallback(() => {
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        if (!node.parentElement) return NodeFilter.FILTER_REJECT;
                        const tag = node.parentElement.tagName.toLowerCase();
                        if (['script', 'style', 'noscript', 'textarea', 'input'].includes(tag)) return NodeFilter.FILTER_REJECT;
                        if (node.parentElement.isContentEditable) return NodeFilter.FILTER_REJECT;
                        return NodeFilter.FILTER_ACCEPT;
                    }
                }
            );

            let currentNode = walker.nextNode();

            while (currentNode) {
                const text = currentNode.textContent || '';
                const words = text.split(/\b/);

                let found = false;
                for (const word of words) {
                    if (vocabulary.has(word) && word.length > 3) {
                        found = true;
                        break;
                    }
                }

                if (found) {
                    // Placeholder for highlighting logic
                    // console.log("Found word to highlight:", text);
                }

                currentNode = walker.nextNode();
            }
        });
    }

    removeHighlights() {
        // Cleanup logic
    }
}

export const clueHighlighter = new ClueHighlighter();
