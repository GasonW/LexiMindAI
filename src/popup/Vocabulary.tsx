import { useState, useEffect } from 'react';
import { type VocabularyItem, migrateVocabularyData } from '../types/vocabulary';

interface Props {
    onBack: () => void;
}

function WordCard({ item, onDelete }: { item: VocabularyItem; onDelete: () => void }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-paper-white rounded-xl zen-shadow border border-black/5 overflow-hidden">
            <div
                className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-black/[0.02]"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-ink capitalize">{item.word}</span>
                        {item.phonetic && (
                            <span className="text-[11px] text-ink/30 font-mono">{item.phonetic}</span>
                        )}
                    </div>
                    {item.definition_zh && !expanded && (
                        <p className="text-xs text-ink/50 truncate">{item.definition_zh}</p>
                    )}
                </div>
                <div className="flex items-center gap-0.5 ml-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-1 text-ink/20 hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
                        title="Remove"
                    >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                    <span className="material-symbols-outlined text-ink/30 text-[18px]">
                        {expanded ? 'expand_less' : 'expand_more'}
                    </span>
                </div>
            </div>

            {expanded && (
                <div className="px-3 pb-2.5 pt-1 border-t border-black/5 space-y-1.5">
                    {item.definition_en && (
                        <div>
                            <p className="text-[9px] uppercase kerning-wide text-ink/30 mb-0.5">English</p>
                            <p className="text-xs text-ink/70">{item.definition_en}</p>
                        </div>
                    )}
                    {item.definition_zh && (
                        <div>
                            <p className="text-[9px] uppercase kerning-wide text-ink/30 mb-0.5">中文</p>
                            <p className="text-xs text-ink font-medium">{item.definition_zh}</p>
                        </div>
                    )}
                    {item.example_sentences && item.example_sentences.length > 0 && (
                        <div className="bg-primary/5 p-2 rounded-lg text-xs border border-primary/10">
                            <p className="text-[9px] uppercase kerning-wide text-ink/40 mb-1">Example</p>
                            <p className="text-ink/70 text-[11px]">{item.example_sentences[0].en}</p>
                            <p className="text-ink/40 text-[11px] mt-0.5">{item.example_sentences[0].zh}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Vocabulary({ onBack }: Props) {
    const [words, setWords] = useState<VocabularyItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        chrome.storage.local.get(['vocabularyList'], (result: { vocabularyList?: string[] | VocabularyItem[] }) => {
            const list = migrateVocabularyData(result.vocabularyList || []);
            list.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
            setWords(list);
            setLoading(false);
        });
    }, []);

    const handleDelete = (word: string) => {
        const newList = words.filter(w => w.word !== word);
        setWords(newList);
        chrome.storage.local.set({ vocabularyList: newList });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onBack}
                        className="p-1 -ml-1 hover:bg-black/5 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined text-ink/50 text-xl">chevron_left</span>
                    </button>
                    <h2 className="text-sm font-medium tracking-[0.1em] uppercase text-ink">Vocabulary</h2>
                </div>
                <span className="text-xs text-ink/40">{words.length} words</span>
            </div>

            {/* Word List */}
            <div className="flex-1 overflow-y-auto space-y-2">
                {loading ? (
                    <div className="text-center text-ink/30 py-8">
                        <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
                    </div>
                ) : words.length === 0 ? (
                    <div className="text-center py-8">
                        <span className="material-symbols-outlined text-ink/20 text-3xl mb-2">auto_stories</span>
                        <p className="text-ink/40 text-sm mb-1">No words yet</p>
                        <p className="text-ink/30 text-xs">Select text on any page to add</p>
                    </div>
                ) : (
                    words.map((item, index) => (
                        <WordCard
                            key={`${item.word}-${index}`}
                            item={item}
                            onDelete={() => handleDelete(item.word)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
