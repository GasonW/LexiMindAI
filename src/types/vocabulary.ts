export interface VocabularyItem {
    word: string;
    phonetic: string;
    definition_en: string;
    definition_zh: string;
    example_sentences: Array<{
        en: string;
        zh: string;
    }>;
    addedAt: number; // timestamp
}

// Helper to convert old string[] format to new VocabularyItem[] format
export function migrateVocabularyData(oldData: string[] | VocabularyItem[]): VocabularyItem[] {
    if (!oldData || oldData.length === 0) return [];

    // Check if it's already in new format
    if (typeof oldData[0] === 'object' && 'word' in oldData[0]) {
        return oldData as VocabularyItem[];
    }

    // Migrate from old string[] format
    return (oldData as string[]).map(word => ({
        word: word.toLowerCase(),
        phonetic: '',
        definition_en: '',
        definition_zh: '',
        example_sentences: [],
        addedAt: Date.now()
    }));
}
