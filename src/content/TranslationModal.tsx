import { useState, useEffect } from 'react';
import { X, Pin, PinOff, Loader2, Plus, Check, AlertCircle } from 'lucide-react';
import { vocabulary } from '../utils/wordMatching';
import { translateWord, type TranslationResponse } from '../utils/gpt';

interface Props {
    text: string;
    onClose: () => void;
    position: { x: number; y: number };
}

export default function TranslationModal({ text, onClose, position }: Props) {
    const [isPinned, setIsPinned] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<TranslationResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isAdded, setIsAdded] = useState(false);

    useEffect(() => {
        // 检查是否已在生词本中
        chrome.storage.local.get(['vocabularyList'], (result: { vocabularyList?: string[] }) => {
            const list = result.vocabularyList || [];
            if (list.includes(text.toLowerCase())) {
                setIsAdded(true);
            }
        });

        // 调用真实 API
        const fetchTranslation = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const result = await translateWord(text);
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Translation failed');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTranslation();
    }, [text]);

    const handleAddToVocabulary = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isAdded) return;

        vocabulary.insert(text);

        chrome.storage.local.get(['vocabularyList'], (result: { vocabularyList?: string[] }) => {
            const list = result.vocabularyList || [];
            if (!list.includes(text.toLowerCase())) {
                list.push(text.toLowerCase());
                chrome.storage.local.set({ vocabularyList: list });
            }
        });

        setIsAdded(true);
    };

    // 浮层尺寸
    const modalWidth = 400;
    const maxModalHeight = 350; // 最大高度，超出时滚动
    const margin = 10; // 距离屏幕边缘的最小距离

    // 计算安全的 X 坐标（确保不超出左右边界）
    let safeX = position.x;
    const halfWidth = modalWidth / 2;

    if (safeX - halfWidth < margin) {
        safeX = halfWidth + margin;
    } else if (safeX + halfWidth > window.innerWidth - margin) {
        safeX = window.innerWidth - halfWidth - margin;
    }

    // 计算安全的 Y 坐标（优先显示在下方，空间不足时显示在上方）
    let safeY = position.y + 8;
    const spaceBelow = window.innerHeight - position.y - 8 - margin;
    const spaceAbove = position.y - 8 - margin;

    if (spaceBelow < maxModalHeight && spaceAbove > spaceBelow) {
        // 下方空间不足且上方空间更大，显示在上方
        safeY = Math.max(margin, position.y - maxModalHeight - 8);
    } else {
        // 显示在下方，确保不超出底部
        safeY = Math.min(safeY, window.innerHeight - maxModalHeight - margin);
    }

    // 确保 Y 坐标不小于最小边距
    safeY = Math.max(margin, safeY);

    return (
        <div
            className="fixed z-[100000] pointer-events-auto bg-white rounded-xl shadow-2xl border border-gray-100 p-4 text-sm text-gray-800 font-sans"
            style={{
                left: safeX,
                top: safeY,
                width: modalWidth,
                transform: 'translateX(-50%)'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-blue-600">{text}</h3>
                <div className="flex gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsPinned(!isPinned); }}
                        className={`p-1 rounded hover:bg-gray-100 ${isPinned ? 'text-blue-500' : 'text-gray-400'}`}
                    >
                        {isPinned ? <Pin size={14} /> : <PinOff size={14} />}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-4 text-blue-500">
                    <Loader2 className="animate-spin" />
                </div>
            ) : error ? (
                <div className="py-4">
                    <div className="flex items-center gap-2 text-red-500 mb-2">
                        <AlertCircle size={16} />
                        <span className="font-medium">Error</span>
                    </div>
                    <p className="text-gray-600 text-xs">{error}</p>
                    {error.includes('API not configured') && (
                        <p className="text-blue-500 text-xs mt-2">
                            Click the extension icon → Settings to configure your API key.
                        </p>
                    )}
                </div>
            ) : data ? (
                <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                        <span className="text-gray-500 font-mono text-xs">{data.phonetic}</span>
                    </div>

                    {/* 英文释义 */}
                    <div>
                        <p className="text-xs text-gray-400 mb-1">English</p>
                        <p className="text-gray-700">{data.definition_en}</p>
                    </div>

                    {/* 中文释义 */}
                    <div>
                        <p className="text-xs text-gray-400 mb-1">中文</p>
                        <p className="font-medium text-gray-800">{data.definition_zh}</p>
                    </div>

                    {/* 例句 */}
                    {data.example_sentences && data.example_sentences.length > 0 && (
                        <div className="bg-blue-50 p-2 rounded text-xs border border-blue-100">
                            <p className="text-blue-600 font-medium mb-1">Example</p>
                            <p className="text-gray-700">{data.example_sentences[0].en}</p>
                            <p className="text-gray-500 mt-0.5">{data.example_sentences[0].zh}</p>
                        </div>
                    )}

                    {/* 添加到生词本按钮 */}
                    <button
                        onClick={handleAddToVocabulary}
                        className={`w-full py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                            isAdded
                                ? 'bg-green-100 text-green-700 cursor-default'
                                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
                        }`}
                    >
                        {isAdded ? (
                            <>
                                <Check size={16} />
                                Added to Vocabulary
                            </>
                        ) : (
                            <>
                                <Plus size={16} />
                                Add to Vocabulary
                            </>
                        )}
                    </button>
                </div>
            ) : null}
        </div>
    );
}
