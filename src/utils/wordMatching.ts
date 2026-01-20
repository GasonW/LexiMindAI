/**
 * Vocabulary Manager for high-performance word matching.
 * Uses a Set for O(1) exact lookups and a Trie for potential prefix matching optimizations.
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

    constructor() {
        this.root = new TrieNode();
        this.wordSet = new Set();
    }

    insert(word: string) {
        const normalized = word.toLowerCase();
        if (this.wordSet.has(normalized)) return;

        this.wordSet.add(normalized);
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
        return this.wordSet.has(word.toLowerCase());
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
}

// Singleton instance for the application
export const vocabulary = new VocabularyTrie();
