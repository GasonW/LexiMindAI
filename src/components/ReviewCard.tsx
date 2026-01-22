import { useState } from 'react';
import { motion } from 'framer-motion';

export interface WordData {
    word: string;
    context: string;
    definition: string; // English definition
    translation: string; // Chinese definition
    type?: string;
}

interface ReviewCardProps {
    data: WordData;
}

export default function ReviewCard({ data }: ReviewCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div className="w-full h-[180px] perspective-1000 group" style={{ perspective: '1000px' }}>
            <motion.div
                className="relative w-full h-full cursor-pointer"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
                onClick={() => setIsFlipped(!isFlipped)}
            >
                {/* Front */}
                <div
                    className="absolute inset-0 bg-paper-white rounded-2xl zen-shadow flex flex-col p-4 border border-black/5"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                    <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto">
                        <h2 className="text-2xl font-bold tracking-tight text-ink mb-2 text-center break-words w-full shrink-0">{data.word}</h2>
                        <p className="italic text-ink/60 text-center text-sm leading-relaxed px-2">
                            "{data.context}"
                        </p>
                    </div>
                    <span className="shrink-0 text-center text-[9px] uppercase kerning-wide font-bold text-ink/30 pt-2">Tap to reveal</span>
                </div>

                {/* Back */}
                <div
                    className="absolute inset-0 bg-paper-white rounded-2xl zen-shadow p-2.5 flex flex-col border border-black/5"
                    style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                    <div className="bg-primary/5 p-2.5 rounded-xl flex-1 overflow-y-auto border border-primary/10 space-y-2">
                        {/* Chinese Translation */}
                        <div>
                            <h3 className="text-[9px] uppercase kerning-wide font-semibold text-ink/40 mb-0.5">Meaning</h3>
                            <p className="font-bold text-sm text-ink leading-snug">
                                {data.translation}
                            </p>
                        </div>

                        {/* English Definition */}
                        <div>
                            <h3 className="text-[9px] uppercase kerning-wide font-semibold text-ink/40 mb-0.5">Definition</h3>
                            <p className="text-xs text-ink/70 leading-relaxed italic">
                                {data.definition}
                            </p>
                        </div>
                    </div>
                    <div className="mt-1.5 text-[8px] uppercase kerning-wide text-ink/30 text-center font-medium shrink-0">Underline Review</div>
                </div>
            </motion.div>
        </div>
    );
}
