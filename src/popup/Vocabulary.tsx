import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { type VocabularyItem, migrateVocabularyData } from '../types/vocabulary';

interface Props {
    onBack: () => void;
}

function WordCard({ item, onDelete }: { item: VocabularyItem; onDelete: () => void }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 capitalize">{item.word}</span>
                        {item.phonetic && (
                            <span className="text-xs text-gray-400 font-mono">{item.phonetic}</span>
                        )}
                    </div>
                    {item.definition_zh && !expanded && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{item.definition_zh}</p>
                    )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove"
                    >
                        <Trash2 size={16} />
                    </button>
                    {expanded ? (
                        <ChevronUp size={16} className="text-gray-400" />
                    ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                    )}
                </div>
            </div>

            {expanded && (
                <div className="px-4 pb-3 pt-1 border-t border-gray-100 space-y-2">
                    {item.definition_en && (
                        <div>
                            <p className="text-xs text-gray-400 mb-0.5">English</p>
                            <p className="text-sm text-gray-700">{item.definition_en}</p>
                        </div>
                    )}
                    {item.definition_zh && (
                        <div>
                            <p className="text-xs text-gray-400 mb-0.5">中文</p>
                            <p className="text-sm text-gray-800 font-medium">{item.definition_zh}</p>
                        </div>
                    )}
                    {item.example_sentences && item.example_sentences.length > 0 && (
                        <div className="bg-blue-50 p-2 rounded text-xs border border-blue-100">
                            <p className="text-blue-600 font-medium mb-1">Example</p>
                            <p className="text-gray-700">{item.example_sentences[0].en}</p>
                            <p className="text-gray-500 mt-0.5">{item.example_sentences[0].zh}</p>
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
        // 从 chrome.storage 加载词汇表
        chrome.storage.local.get(['vocabularyList'], (result: { vocabularyList?: string[] | VocabularyItem[] }) => {
            const list = migrateVocabularyData(result.vocabularyList || []);
            // Sort by addedAt descending (newest first)
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

    const handleClearAll = () => {
        if (confirm('Are you sure you want to clear all words?')) {
            setWords([]);
            chrome.storage.local.set({ vocabularyList: [] });
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <h2 className="text-lg font-bold text-gray-800">My Vocabulary</h2>
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 mb-4 text-white">
                <div className="flex items-center gap-3">
                    <BookOpen size={24} />
                    <div>
                        <p className="text-2xl font-bold">{words.length}</p>
                        <p className="text-blue-100 text-sm">Words collected</p>
                    </div>
                </div>
            </div>

            {/* Word List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="text-center text-gray-400 py-8">Loading...</div>
                ) : words.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-400 mb-2">No words yet</p>
                        <p className="text-gray-300 text-sm">Select text on any page and click "Add to Vocabulary"</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {words.map((item, index) => (
                            <WordCard
                                key={`${item.word}-${index}`}
                                item={item}
                                onDelete={() => handleDelete(item.word)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Clear All Button */}
            {words.length > 0 && (
                <button
                    onClick={handleClearAll}
                    className="mt-4 w-full py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                >
                    Clear All
                </button>
            )}
        </div>
    );
}
