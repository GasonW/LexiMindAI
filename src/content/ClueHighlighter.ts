import { vocabulary } from '../utils/wordMatching';
import { type VocabularyItem, migrateVocabularyData } from '../types/vocabulary';

const HIGHLIGHT_CLASS = 'leximind-clue-highlight';
const HIGHLIGHT_ATTR = 'data-leximind-highlighted';
const TOOLTIP_ID = 'leximind-clue-tooltip';

export class ClueHighlighter {
    isActive: boolean = false;
    private observer: MutationObserver | null = null;
    private styleElement: HTMLStyleElement | null = null;
    private vocabularyMap: Map<string, VocabularyItem> = new Map();
    private currentTooltip: HTMLElement | null = null;

    constructor() {
        this.init();
    }

    private async init() {
        await this.loadVocabulary();
        this.injectStyles();
        this.initListener();
        this.setupClickHandler();
    }

    private async loadVocabulary(): Promise<void> {
        return new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.get(['vocabularyList'], (result: { vocabularyList?: string[] | VocabularyItem[] }) => {
                    const items = migrateVocabularyData(result.vocabularyList || []);
                    this.vocabularyMap.clear();
                    items.forEach(item => {
                        vocabulary.insert(item.word);
                        this.vocabularyMap.set(item.word.toLowerCase(), item);
                    });
                    console.log(`LexiMind: Loaded ${items.length} words into vocabulary`);
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    private injectStyles() {
        if (this.styleElement) return;

        this.styleElement = document.createElement('style');
        this.styleElement.id = 'leximind-clue-styles';
        this.styleElement.textContent = `
            .${HIGHLIGHT_CLASS} {
                text-decoration: underline;
                text-decoration-color: #3b82f6;
                text-decoration-thickness: 2px;
                text-underline-offset: 2px;
                background-color: rgba(59, 130, 246, 0.1);
                border-radius: 2px;
                cursor: pointer;
                transition: background-color 0.2s ease;
            }
            .${HIGHLIGHT_CLASS}:hover {
                background-color: rgba(59, 130, 246, 0.25);
            }
            #${TOOLTIP_ID} {
                position: fixed;
                z-index: 2147483647;
                background: white;
                border-radius: 12px;
                border: 1px solid #e5e7eb;
                box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
                padding: 14px 18px;
                width: 400px;
                min-height: 120px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                line-height: 1.5;
                color: #374151;
                animation: leximind-tooltip-fade-in 0.15s ease-out;
            }
            @keyframes leximind-tooltip-fade-in {
                from { opacity: 0; transform: translateY(4px); }
                to { opacity: 1; transform: translateY(0); }
            }
            #${TOOLTIP_ID} .tooltip-header {
                display: flex;
                align-items: baseline;
                gap: 10px;
                margin-bottom: 12px;
            }
            #${TOOLTIP_ID} .tooltip-word {
                font-weight: 700;
                font-size: 20px;
                color: #2563eb;
                text-transform: capitalize;
            }
            #${TOOLTIP_ID} .tooltip-phonetic {
                font-size: 14px;
                color: #9ca3af;
                font-family: monospace;
            }
            #${TOOLTIP_ID} .tooltip-definition-en {
                font-size: 15px;
                color: #1f2937;
                line-height: 1.6;
                margin-bottom: 8px;
            }
            #${TOOLTIP_ID} .tooltip-definition-zh {
                font-size: 13px;
                color: #9ca3af;
                line-height: 1.5;
                margin-top: 4px;
            }
            #${TOOLTIP_ID} .tooltip-example {
                background: rgba(239, 246, 255, 0.7);
                border: 1px solid #dbeafe;
                border-radius: 12px;
                padding: 12px 14px;
                margin-top: 12px;
                font-size: 14px;
            }
            #${TOOLTIP_ID} .tooltip-example-label {
                font-size: 13px;
                font-weight: 600;
                color: #2563eb;
                margin-bottom: 6px;
            }
            #${TOOLTIP_ID} .tooltip-example-en {
                color: #374151;
                line-height: 1.5;
            }
            #${TOOLTIP_ID} .tooltip-example-zh {
                color: #6b7280;
                margin-top: 4px;
                line-height: 1.5;
            }
        `;
        document.head.appendChild(this.styleElement);
    }

    private setupClickHandler() {
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;

            // Check if clicked on a highlighted word
            if (target.classList.contains(HIGHLIGHT_CLASS)) {
                e.preventDefault();
                e.stopPropagation();
                const word = target.textContent?.toLowerCase() || '';
                this.showTooltip(word, target);
                return;
            }

            // Close tooltip if clicked outside
            if (this.currentTooltip && !this.currentTooltip.contains(target)) {
                this.hideTooltip();
            }
        }, true);

        // Close tooltip on scroll
        document.addEventListener('scroll', () => {
            this.hideTooltip();
        }, true);

        // Close tooltip on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideTooltip();
            }
        });
    }

    private showTooltip(word: string, target: HTMLElement) {
        this.hideTooltip();

        const item = this.vocabularyMap.get(word);
        if (!item) {
            console.log(`LexiMind: No definition found for "${word}"`);
            return;
        }

        const tooltip = document.createElement('div');
        tooltip.id = TOOLTIP_ID;

        let html = `
            <div class="tooltip-header">
                <span class="tooltip-word">${item.word}</span>
                ${item.phonetic ? `<span class="tooltip-phonetic">${item.phonetic}</span>` : ''}
            </div>
        `;

        // 英文释义优先展示
        if (item.definition_en) {
            html += `<div class="tooltip-definition-en">${item.definition_en}</div>`;
        }

        // 中文释义用灰色
        if (item.definition_zh) {
            html += `<div class="tooltip-definition-zh">${item.definition_zh}</div>`;
        }

        if (item.example_sentences && item.example_sentences.length > 0) {
            const example = item.example_sentences[0];
            html += `
                <div class="tooltip-example">
                    <div class="tooltip-example-label">Example</div>
                    <div class="tooltip-example-en">${example.en}</div>
                    <div class="tooltip-example-zh">${example.zh}</div>
                </div>
            `;
        }

        tooltip.innerHTML = html;
        document.body.appendChild(tooltip);
        this.currentTooltip = tooltip;

        // Position the tooltip
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        let top = targetRect.bottom + 8;

        // Keep within viewport
        const margin = 10;
        if (left < margin) left = margin;
        if (left + tooltipRect.width > window.innerWidth - margin) {
            left = window.innerWidth - tooltipRect.width - margin;
        }

        // If not enough space below, show above
        if (top + tooltipRect.height > window.innerHeight - margin) {
            top = targetRect.top - tooltipRect.height - 8;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }

    private hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }

    initListener() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            // Listen for storage changes (vocabulary updates and clueMode toggle)
            chrome.storage.onChanged.addListener((changes, area) => {
                if (area === 'local') {
                    if (changes.clueMode) {
                        this.toggle(changes.clueMode.newValue as boolean);
                    }
                    if (changes.vocabularyList) {
                        // Reload vocabulary when it changes
                        const newValue = changes.vocabularyList.newValue as string[] | VocabularyItem[] | undefined;
                        const newItems = migrateVocabularyData(newValue || []);
                        this.vocabularyMap.clear();
                        newItems.forEach(item => {
                            vocabulary.insert(item.word);
                            this.vocabularyMap.set(item.word.toLowerCase(), item);
                        });
                        // Re-highlight if active
                        if (this.isActive) {
                            this.removeHighlights();
                            this.scanAndHighlight();
                        }
                    }
                }
            });

            // Initialize state from storage
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
            this.startObserver();
        } else {
            this.stopObserver();
            this.removeHighlights();
            this.hideTooltip();
        }
    }

    private startObserver() {
        if (this.observer) return;

        this.observer = new MutationObserver((mutations) => {
            let shouldRescan = false;
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node as Element;
                            // Skip our own highlights and extension elements
                            if (!element.classList?.contains(HIGHLIGHT_CLASS) &&
                                !element.id?.includes('leximind')) {
                                shouldRescan = true;
                                break;
                            }
                        }
                    }
                }
                if (shouldRescan) break;
            }

            if (shouldRescan && this.isActive) {
                // Debounce re-scanning for performance
                this.debouncedScan();
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    private stopObserver() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }

    private scanTimeout: number | null = null;
    private debouncedScan() {
        if (this.scanTimeout) {
            clearTimeout(this.scanTimeout);
        }
        this.scanTimeout = window.setTimeout(() => {
            this.scanAndHighlight();
            this.scanTimeout = null;
        }, 300);
    }

    scanAndHighlight() {
        if (!this.isActive) return;

        // Check if vocabulary is empty
        if (vocabulary.wordSet.size === 0) {
            console.log('LexiMind: No vocabulary words to highlight');
            return;
        }

        requestIdleCallback(() => {
            this.processNode(document.body);
        }, { timeout: 1000 });
    }

    private processNode(root: Node) {
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (!node.parentElement) return NodeFilter.FILTER_REJECT;

                    const parent = node.parentElement;
                    const tag = parent.tagName.toLowerCase();

                    // Skip certain elements
                    if (['script', 'style', 'noscript', 'textarea', 'input', 'select'].includes(tag)) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    // Skip already highlighted elements
                    if (parent.classList.contains(HIGHLIGHT_CLASS)) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    // Skip if parent or ancestor is already marked
                    if (parent.hasAttribute(HIGHLIGHT_ATTR) || parent.closest(`[${HIGHLIGHT_ATTR}]`)) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    // Skip editable content
                    if (parent.isContentEditable) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    // Skip extension elements
                    if (parent.id?.includes('leximind') || parent.closest('#leximind-ai-host')) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes: Text[] = [];
        let currentNode = walker.nextNode();
        while (currentNode) {
            textNodes.push(currentNode as Text);
            currentNode = walker.nextNode();
        }

        // Process text nodes
        for (const textNode of textNodes) {
            this.highlightTextNode(textNode);
        }
    }

    private highlightTextNode(textNode: Text) {
        const text = textNode.textContent || '';
        if (!text.trim()) return;

        // Use word boundary regex to find words
        const wordRegex = /\b([a-zA-Z]{3,})\b/g;
        const matches: { word: string; index: number }[] = [];
        let match;

        while ((match = wordRegex.exec(text)) !== null) {
            const word = match[1];
            if (vocabulary.has(word)) {
                matches.push({ word: match[0], index: match.index });
            }
        }

        if (matches.length === 0) return;

        // Create a document fragment with highlighted words
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;

        for (const { word, index } of matches) {
            // Add text before the match
            if (index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex, index)));
            }

            // Create highlight span
            const span = document.createElement('span');
            span.className = HIGHLIGHT_CLASS;
            span.setAttribute(HIGHLIGHT_ATTR, 'true');
            span.textContent = word;
            fragment.appendChild(span);

            lastIndex = index + word.length;
        }

        // Add remaining text
        if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }

        // Replace the text node with the fragment
        const parent = textNode.parentNode;
        if (parent) {
            parent.replaceChild(fragment, textNode);
        }
    }

    removeHighlights() {
        // Find all highlighted elements
        const highlights = document.querySelectorAll(`.${HIGHLIGHT_CLASS}`);

        highlights.forEach(span => {
            const parent = span.parentNode;
            if (parent) {
                // Replace span with its text content
                const textNode = document.createTextNode(span.textContent || '');
                parent.replaceChild(textNode, span);

                // Normalize to merge adjacent text nodes
                parent.normalize();
            }
        });

        console.log(`LexiMind: Removed ${highlights.length} highlights`);
    }
}

export const clueHighlighter = new ClueHighlighter();
