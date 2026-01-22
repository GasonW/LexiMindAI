import { vocabulary } from '../utils/wordMatching';
import { type VocabularyItem, migrateVocabularyData } from '../types/vocabulary';

const HIGHLIGHT_CLASS = 'underline-clue-highlight';
const HIGHLIGHT_ATTR = 'data-underline-highlighted';
const TOOLTIP_ID = 'underline-clue-tooltip';

export class ClueHighlighter {
    isActive: boolean = false;
    private observer: MutationObserver | null = null;
    private styleElement: HTMLStyleElement | null = null;
    private vocabularyMap: Map<string, VocabularyItem> = new Map();  // 原形 -> VocabularyItem
    private variantToLemmaMap: Map<string, string> = new Map();      // 变形 -> 原形
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
                    this.variantToLemmaMap.clear();
                    vocabulary.clear();

                    items.forEach(item => {
                        const lemma = item.word.toLowerCase().trim();
                        // 存储原形到词汇信息的映射
                        this.vocabularyMap.set(lemma, item);

                        // 注册原形
                        vocabulary.insert(lemma);
                        this.variantToLemmaMap.set(lemma, lemma);

                        // 注册所有变形，并建立变形到原形的映射
                        if (item.variants && item.variants.length > 0) {
                            item.variants.forEach(variant => {
                                const v = variant.toLowerCase().trim();
                                vocabulary.insert(v);
                                this.variantToLemmaMap.set(v, lemma);
                            });
                        }
                    });

                    console.log(`Underline: Loaded ${items.length} words into vocabulary (${vocabulary.singleWords.size} single words, ${vocabulary.phrases.size} phrases)`);
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
        this.styleElement.id = 'underline-clue-styles';
        this.styleElement.textContent = `
            .${HIGHLIGHT_CLASS} {
                text-decoration: underline;
                text-decoration-color: #d4c4b0;
                text-decoration-thickness: 2px;
                text-underline-offset: 2px;
                background-color: rgba(248, 246, 244, 0.8);
                border-radius: 2px;
                cursor: pointer;
                transition: background-color 0.2s ease;
            }
            .${HIGHLIGHT_CLASS}:hover {
                background-color: #f8f6f4;
            }
            #${TOOLTIP_ID} {
                position: fixed;
                z-index: 2147483647;
                background: #f8f6f4;
                border-radius: 16px;
                border: 1px solid rgba(0, 0, 0, 0.1);
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1), 0 20px 50px -12px rgba(0, 0, 0, 0.15);
                padding: 20px;
                width: 400px;
                font-family: "Public Sans", system-ui, sans-serif;
                font-size: 14px;
                line-height: 1.6;
                color: #181111;
                animation: underline-tooltip-fade-in 0.15s ease-out;
            }
            @keyframes underline-tooltip-fade-in {
                from { opacity: 0; transform: translateY(4px); }
                to { opacity: 1; transform: translateY(0); }
            }
            #${TOOLTIP_ID} .tooltip-header {
                display: flex;
                align-items: baseline;
                gap: 8px;
                margin-bottom: 12px;
            }
            #${TOOLTIP_ID} .tooltip-word {
                font-weight: 700;
                font-size: 20px;
                color: #181111;
                text-transform: capitalize;
            }
            #${TOOLTIP_ID} .tooltip-phonetic {
                font-size: 14px;
                color: rgba(24, 17, 17, 0.4);
                font-family: monospace;
            }
            #${TOOLTIP_ID} .tooltip-definition-en {
                font-size: 15px;
                color: #181111;
                line-height: 1.5;
            }
            #${TOOLTIP_ID} .tooltip-definition-zh {
                font-size: 15px;
                color: rgba(24, 17, 17, 0.5);
                line-height: 1.5;
                margin-top: 12px;
            }
            #${TOOLTIP_ID} .tooltip-example {
                background: rgba(255, 255, 255, 0.6);
                border: 1px solid rgba(0, 0, 0, 0.05);
                border-radius: 12px;
                padding: 12px;
                margin-top: 12px;
                font-size: 14px;
            }
            #${TOOLTIP_ID} .tooltip-example-label {
                font-size: 9px;
                font-weight: 600;
                color: rgba(24, 17, 17, 0.4);
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.15em;
            }
            #${TOOLTIP_ID} .tooltip-example-en {
                color: rgba(24, 17, 17, 0.7);
                line-height: 1.5;
            }
            #${TOOLTIP_ID} .tooltip-example-zh {
                color: rgba(24, 17, 17, 0.4);
                margin-top: 4px;
                line-height: 1.5;
            }
        `;
        document.head.appendChild(this.styleElement);
    }

    private setupClickHandler() {
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;

            // Check if clicked on a highlighted word/phrase
            if (target.classList.contains(HIGHLIGHT_CLASS)) {
                e.preventDefault();
                e.stopPropagation();
                // Use the data attribute for vocabulary key, fallback to text content
                const key = target.getAttribute('data-vocabulary-key') || target.textContent?.toLowerCase() || '';
                this.showTooltip(key, target);
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

    // Check if the content is a sentence/phrase (more than 4 words or contains punctuation)
    private isSentence(text: string): boolean {
        const words = text.trim().split(/\s+/);
        const hasPunctuation = /[.!?,;:]/.test(text);
        return words.length > 4 || hasPunctuation;
    }

    private showTooltip(key: string, target: HTMLElement) {
        this.hideTooltip();

        // 先通过变形找到原形
        const lemma = this.variantToLemmaMap.get(key.toLowerCase().trim());
        const item = lemma ? this.vocabularyMap.get(lemma) : this.vocabularyMap.get(key);

        if (!item) {
            console.log(`Underline: No definition found for "${key}"`);
            return;
        }

        const tooltip = document.createElement('div');
        tooltip.id = TOOLTIP_ID;

        const isSentence = this.isSentence(item.word);

        let html = `
            <div class="tooltip-header">
                <span class="tooltip-word" style="${isSentence ? 'font-size: 16px; text-transform: none;' : ''}">${item.word}</span>
                ${!isSentence && item.phonetic ? `<span class="tooltip-phonetic">${item.phonetic}</span>` : ''}
            </div>
        `;

        if (isSentence) {
            // For sentences, only show translation
            if (item.definition_zh) {
                html += `<div class="tooltip-definition-zh" style="font-size: 15px; color: #374151;">${item.definition_zh}</div>`;
            }
        } else {
            // For words and phrases, show full details
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
                        this.variantToLemmaMap.clear();
                        vocabulary.clear();

                        newItems.forEach(item => {
                            const lemma = item.word.toLowerCase().trim();
                            this.vocabularyMap.set(lemma, item);

                            vocabulary.insert(lemma);
                            this.variantToLemmaMap.set(lemma, lemma);

                            if (item.variants && item.variants.length > 0) {
                                item.variants.forEach(variant => {
                                    const v = variant.toLowerCase().trim();
                                    vocabulary.insert(v);
                                    this.variantToLemmaMap.set(v, lemma);
                                });
                            }
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
                                !element.id?.includes('underline')) {
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
            console.log('Underline: No vocabulary words to highlight');
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
                    if (parent.id?.includes('underline') || parent.closest('#underline-ai-host')) {
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

        const matches: { text: string; index: number; key: string }[] = [];

        // First, find all phrase matches (longer matches take priority)
        const phrases = vocabulary.getPhrases();

        for (const phrase of phrases) {
            // Create a regex that matches the phrase with word boundaries
            const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const phraseRegex = new RegExp(`\\b${escapedPhrase}\\b`, 'gi');
            let match;

            while ((match = phraseRegex.exec(text)) !== null) {
                matches.push({
                    text: match[0],
                    index: match.index,
                    key: phrase
                });
            }
        }

        // Then find single word matches
        const wordRegex = /\b([a-zA-Z]{3,})\b/g;
        let match;

        while ((match = wordRegex.exec(text)) !== null) {
            const word = match[1];
            if (vocabulary.hasSingleWord(word)) {
                // Check if this word is not already part of a phrase match
                const wordStart = match.index;
                const wordEnd = match.index + match[0].length;

                const isPartOfPhrase = matches.some(m =>
                    wordStart >= m.index && wordEnd <= m.index + m.text.length
                );

                if (!isPartOfPhrase) {
                    matches.push({
                        text: match[0],
                        index: match.index,
                        key: word.toLowerCase()
                    });
                }
            }
        }

        if (matches.length === 0) return;

        // Sort matches by index (for proper ordering when creating fragments)
        matches.sort((a, b) => a.index - b.index);

        // Remove overlapping matches (keep the first/longer one)
        const filteredMatches: typeof matches = [];
        for (const m of matches) {
            const lastMatch = filteredMatches[filteredMatches.length - 1];
            if (!lastMatch || m.index >= lastMatch.index + lastMatch.text.length) {
                filteredMatches.push(m);
            }
        }

        // Create a document fragment with highlighted words/phrases
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;

        for (const { text: matchText, index, key } of filteredMatches) {
            // Add text before the match
            if (index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex, index)));
            }

            // Create highlight span
            const span = document.createElement('span');
            span.className = HIGHLIGHT_CLASS;
            span.setAttribute(HIGHLIGHT_ATTR, 'true');
            span.setAttribute('data-vocabulary-key', key);
            span.textContent = matchText;
            fragment.appendChild(span);

            lastIndex = index + matchText.length;
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

        console.log(`Underline: Removed ${highlights.length} highlights`);
    }
}

export const clueHighlighter = new ClueHighlighter();
