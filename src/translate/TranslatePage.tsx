import { useState, useEffect } from 'react';
import { Volume2, Copy, Plus, Check, Loader2, X } from 'lucide-react';
import { vocabulary } from '../utils/wordMatching';

interface TranslationData {
    word: string;
    phonetic: string;
    partOfSpeech: string;
    definition: string;
    example: string;
    exampleTranslation: string;
    contextualAnalysis: string;
}

export default function TranslatePage() {
    const [word, setWord] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<TranslationData | null>(null);
    const [isAdded, setIsAdded] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // 从 URL 参数获取要翻译的单词
        const params = new URLSearchParams(window.location.search);
        const text = params.get('text') || '';
        setWord(text);

        if (text) {
            // 检查是否已在生词本中
            setIsAdded(vocabulary.has(text));

            // 模拟 API 调用获取翻译结果
            setTimeout(() => {
                setData({
                    word: text,
                    phonetic: `/${text.toLowerCase()}/`,
                    partOfSpeech: 'n.',
                    definition: `${text} 的中文释义`,
                    example: `${text} is a powerful tool for learning.`,
                    exampleTranslation: `${text} 是一个强大的学习工具。`,
                    contextualAnalysis: `${text} 在当前语境中表示一个专有名词，常用于技术和学术领域，尤其在人工智能和自然语言处理方面表现出色。`
                });
                setIsLoading(false);
            }, 800);
        } else {
            setIsLoading(false);
        }
    }, []);

    const handleSpeak = () => {
        if (word && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            speechSynthesis.speak(utterance);
        }
    };

    const handleCopy = async () => {
        if (data) {
            await navigator.clipboard.writeText(`${data.word}: ${data.definition}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleAddToVocabulary = () => {
        if (word && !isAdded) {
            vocabulary.insert(word);
            // 保存到 chrome.storage
            chrome.storage.local.get(['vocabulary'], (result: { vocabulary?: string[] }) => {
                const vocab: string[] = result.vocabulary || [];
                if (!vocab.includes(word.toLowerCase())) {
                    vocab.push(word.toLowerCase());
                    chrome.storage.local.set({ vocabulary: vocab });
                }
            });
            setIsAdded(true);
        }
    };

    const handleClose = () => {
        window.close();
    };

    if (!word) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="text-gray-500">No word selected</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">L</span>
                        </div>
                        <span className="font-semibold text-gray-700">LexiMind AI</span>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto p-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                        <p className="text-gray-500">Translating...</p>
                    </div>
                ) : data ? (
                    <div className="space-y-6">
                        {/* Word Header */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
                                        {data.word}
                                    </h1>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-gray-500 font-mono text-sm">
                                            {data.phonetic}
                                        </span>
                                        <button
                                            onClick={handleSpeak}
                                            className="p-1.5 hover:bg-blue-50 rounded-full transition-colors text-blue-500"
                                            title="Play pronunciation"
                                        >
                                            <Volume2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCopy}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                                        title="Copy"
                                    >
                                        {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                    </button>
                                    <button
                                        onClick={handleAddToVocabulary}
                                        disabled={isAdded}
                                        className={`p-2 rounded-lg transition-colors ${
                                            isAdded
                                                ? 'bg-green-50 text-green-600'
                                                : 'hover:bg-blue-50 text-blue-500'
                                        }`}
                                        title={isAdded ? "Added to vocabulary" : "Add to vocabulary"}
                                    >
                                        {isAdded ? <Check size={18} /> : <Plus size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Definition */}
                            <div className="mt-6">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-blue-600 font-medium">{data.partOfSpeech}</span>
                                    <span className="text-gray-800 text-lg">{data.definition}</span>
                                </div>
                            </div>

                            {/* Example */}
                            <div className="mt-4 pl-4 border-l-2 border-blue-200">
                                <p className="text-gray-700">
                                    <span className="text-blue-600 font-medium">{data.word}</span>
                                    {data.example.replace(data.word, '').trim()}
                                </p>
                                <p className="text-gray-500 text-sm mt-1">{data.exampleTranslation}</p>
                            </div>
                        </div>

                        {/* Contextual Analysis Card */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <h2 className="font-bold text-gray-800">{data.word}</h2>
                                <button
                                    onClick={handleSpeak}
                                    className="p-1 hover:bg-blue-50 rounded-full transition-colors text-blue-500"
                                >
                                    <Volume2 size={16} />
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                                >
                                    <Copy size={16} />
                                </button>
                            </div>
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                                <p className="text-gray-700 leading-relaxed">
                                    {data.contextualAnalysis}
                                </p>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex justify-center gap-4 pt-4">
                            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                                Add to Review
                            </button>
                            <button
                                onClick={handleClose}
                                className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-500">
                        Failed to load translation
                    </div>
                )}
            </div>
        </div>
    );
}
