export interface VocabularyItem {
    word: string;              // 单词原形（lemma）
    phonetic: string;
    definition_en: string;
    definition_zh: string;
    example_sentences: Array<{
        en: string;
        zh: string;
    }>;
    variants: string[];        // 单词的变形列表（包括原形）
    addedAt: number;           // timestamp
}

// Helper to convert old formats to new VocabularyItem[] format
export function migrateVocabularyData(oldData: string[] | VocabularyItem[]): VocabularyItem[] {
    if (!oldData || oldData.length === 0) return [];

    // Check if it's already in new format (array of objects)
    if (typeof oldData[0] === 'object' && 'word' in oldData[0]) {
        // Ensure all items have the variants field
        return (oldData as VocabularyItem[]).map(item => ({
            ...item,
            variants: item.variants || [item.word.toLowerCase()]
        }));
    }

    // Migrate from old string[] format
    return (oldData as string[]).map(word => ({
        word: word.toLowerCase(),
        phonetic: '',
        definition_en: '',
        definition_zh: '',
        example_sentences: [],
        variants: [word.toLowerCase()],
        addedAt: Date.now()
    }));
}
