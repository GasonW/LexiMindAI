/**
 * Vocabulary Manager for high-performance word matching.
 * Uses a Set for O(1) exact lookups and a Trie for potential prefix matching optimizations.
 * Supports both single words and phrases.
 */

class TrieNode {
    children: Map<string, TrieNode>;
    isEndOfWord: boolean;

    constructor() {
        this.children = new Map();
        this.isEndOfWord = false;
    }
}

export class VocabularyTrie {
    root: TrieNode;
    wordSet: Set<string>;
    // Separate sets for single words and phrases for efficient matching
    singleWords: Set<string>;
    phrases: Set<string>;

    constructor() {
        this.root = new TrieNode();
        this.wordSet = new Set();
        this.singleWords = new Set();
        this.phrases = new Set();
    }

    insert(word: string) {
        const normalized = word.toLowerCase().trim();
        if (this.wordSet.has(normalized)) return;

        this.wordSet.add(normalized);

        // Check if it's a phrase (contains space) or single word
        if (normalized.includes(' ')) {
            this.phrases.add(normalized);
        } else {
            this.singleWords.add(normalized);
        }

        let current = this.root;
        for (const char of normalized) {
            if (!current.children.has(char)) {
                current.children.set(char, new TrieNode());
            }
            current = current.children.get(char)!;
        }
        current.isEndOfWord = true;
    }

    has(word: string): boolean {
        return this.wordSet.has(word.toLowerCase().trim());
    }

    hasSingleWord(word: string): boolean {
        return this.singleWords.has(word.toLowerCase().trim());
    }

    hasPhrase(phrase: string): boolean {
        return this.phrases.has(phrase.toLowerCase().trim());
    }

    getPhrases(): string[] {
        return Array.from(this.phrases);
    }

    /**
     * Returns true if the prefix exists in the trie.
     */
    startsWith(prefix: string): boolean {
        let current = this.root;
        for (const char of prefix.toLowerCase()) {
            if (!current.children.has(char)) return false;
            current = current.children.get(char)!;
        }
        return true;
    }

    clear() {
        this.root = new TrieNode();
        this.wordSet.clear();
        this.singleWords.clear();
        this.phrases.clear();
    }
}

// Singleton instance for the application
export const vocabulary = new VocabularyTrie();
