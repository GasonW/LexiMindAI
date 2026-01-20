import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, BookOpen } from 'lucide-react';

interface Props {
    onBack: () => void;
}

export default function Vocabulary({ onBack }: Props) {
    const [words, setWords] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 从 chrome.storage 加载词汇表
        chrome.storage.local.get(['vocabularyList'], (result: { vocabularyList?: string[] }) => {
            setWords(result.vocabularyList || []);
            setLoading(false);
        });
    }, []);

    const handleDelete = (word: string) => {
        const newList = words.filter(w => w !== word);
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
                        {words.map((word, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-100"
                            >
                                <span className="font-medium text-gray-800 capitalize">{word}</span>
                                <button
                                    onClick={() => handleDelete(word)}
                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    title="Remove"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
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
