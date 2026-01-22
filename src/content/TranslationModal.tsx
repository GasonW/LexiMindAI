import { useState, useEffect } from 'react';
import { vocabulary } from '../utils/wordMatching';
import { translateWord, type TranslationResponse } from '../utils/gpt';
import { type VocabularyItem, migrateVocabularyData } from '../types/vocabulary';

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
        // 调用真实 API
        const fetchTranslation = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const result = await translateWord(text);
                setData(result);

                // 检查原形是否已在生词本中
                chrome.storage.local.get(['vocabularyList'], (res: { vocabularyList?: string[] | VocabularyItem[] }) => {
                    const list = migrateVocabularyData(res.vocabularyList || []);
                    const lemma = result.lemma.toLowerCase();
                    const exists = list.some(item => item.word.toLowerCase() === lemma);
                    if (exists) {
                        setIsAdded(true);
                    }
                });
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
        if (isAdded || !data) return;

        // 使用原形（lemma）作为主键
        const lemma = data.lemma.toLowerCase();

        // 确保变形列表包含原形
        const variants = data.variants.map(v => v.toLowerCase());
        if (!variants.includes(lemma)) {
            variants.unshift(lemma);
        }

        // 插入原形和所有变形到词汇表中以便高亮匹配
        vocabulary.insert(lemma);
        variants.forEach(v => vocabulary.insert(v));

        chrome.storage.local.get(['vocabularyList'], (result: { vocabularyList?: string[] | VocabularyItem[] }) => {
            const list = migrateVocabularyData(result.vocabularyList || []);
            const exists = list.some(item => item.word.toLowerCase() === lemma);

            if (!exists) {
                const newItem: VocabularyItem = {
                    word: lemma,
                    phonetic: data.phonetic,
                    definition_en: data.definition_en,
                    definition_zh: data.definition_zh,
                    example_sentences: data.example_sentences,
                    variants: variants,
                    addedAt: Date.now()
                };
                list.push(newItem);
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
            className="fixed z-[100000] pointer-events-auto rounded-2xl p-5 text-sm font-sans"
            style={{
                left: safeX,
                top: safeY,
                width: modalWidth,
                transform: 'translateX(-50%)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1), 0 20px 50px -12px rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                background: '#f8f6f4',
                color: '#181111',
                fontFamily: '"Public Sans", system-ui, sans-serif'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header: 单词 + 音标 + 操作按钮 */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-baseline gap-2 flex-wrap">
                    <h3 className="font-bold text-xl" style={{ color: '#181111' }}>{data?.lemma || text}</h3>
                    {data?.phonetic && (
                        <span className="font-mono text-sm" style={{ color: 'rgba(24, 17, 17, 0.4)' }}>{data.phonetic}</span>
                    )}
                    {data && data.lemma.toLowerCase() !== text.toLowerCase() && (
                        <span className="text-sm" style={{ color: 'rgba(24, 17, 17, 0.4)' }}>← {text}</span>
                    )}
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsPinned(!isPinned); }}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: isPinned ? '#181111' : 'rgba(24, 17, 17, 0.3)' }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {isPinned ? (
                                <path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
                            ) : (
                                <path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
                            )}
                        </svg>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
                        style={{ color: 'rgba(24, 17, 17, 0.3)' }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-4" style={{ color: 'rgba(24, 17, 17, 0.4)' }}>
                    <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                </div>
            ) : error ? (
                <div className="py-4">
                    <div className="flex items-center gap-2 mb-2" style={{ color: '#b91c1c' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span className="font-medium">Error</span>
                    </div>
                    <p className="text-xs" style={{ color: 'rgba(24, 17, 17, 0.5)' }}>{error}</p>
                    {error.includes('API not configured') && (
                        <p className="text-xs mt-2" style={{ color: '#b91c1c' }}>
                            Click the extension icon → Settings to configure your API key.
                        </p>
                    )}
                </div>
            ) : data ? (
                <div className="space-y-3">
                    {/* 英文释义 - 优先展示 */}
                    {data.definition_en && (
                        <p className="text-[15px] leading-relaxed" style={{ color: '#181111' }}>{data.definition_en}</p>
                    )}

                    {/* 中文释义 - 灰色非强调 */}
                    {data.definition_zh && (
                        <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(24, 17, 17, 0.5)' }}>{data.definition_zh}</p>
                    )}

                    {/* 例句 */}
                    {data.example_sentences && data.example_sentences.length > 0 && (
                        <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
                            <p className="font-semibold mb-2" style={{ color: 'rgba(24, 17, 17, 0.4)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Example</p>
                            <p className="leading-relaxed" style={{ color: 'rgba(24, 17, 17, 0.7)' }}>{data.example_sentences[0].en}</p>
                            <p className="mt-1 leading-relaxed" style={{ color: 'rgba(24, 17, 17, 0.4)' }}>{data.example_sentences[0].zh}</p>
                        </div>
                    )}

                    {/* 添加到生词本按钮 */}
                    <button
                        onClick={handleAddToVocabulary}
                        className="w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        style={{
                            background: isAdded ? 'rgba(16, 185, 129, 0.1)' : '#10b981',
                            color: isAdded ? '#059669' : 'white',
                            cursor: isAdded ? 'default' : 'pointer'
                        }}
                    >
                        {isAdded ? (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Added to Vocabulary
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Add to Vocabulary
                            </>
                        )}
                    </button>
                </div>
            ) : null}
        </div>
    );
}
