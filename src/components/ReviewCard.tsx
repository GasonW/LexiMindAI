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

    // Reset flip when data changes
    // Note: stronger effect dependency might be needed if strictly resetting, 
    // but key-based re-mounting in parent is usually cleaner for flashcards.

    return (
        <div className="w-full h-64 perspective-1000 group">
            <motion.div
                className="relative w-full h-full preserve-3d cursor-pointer"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
                onClick={() => setIsFlipped(!isFlipped)}
            >
                {/* Front */}
                <div className="absolute w-full h-full backface-hidden bg-white/80 backdrop-blur-md rounded-2xl shadow-xl flex flex-col items-center justify-center p-6 border border-white/60">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800 mb-3 text-center break-words w-full">{data.word}</h2>
                    <p className="italic text-gray-600 text-center text-sm line-clamp-3">
                        "{data.context}"
                    </p>
                    <div className="mt-auto pt-4 text-[10px] text-blue-400 font-semibold uppercase tracking-widest opacity-80">Tap to Flip</div>
                </div>

                {/* Back */}
                <div
                    className="absolute w-full h-full backface-hidden bg-white rounded-2xl shadow-xl p-6 flex flex-col border border-gray-100"
                    style={{ transform: 'rotateY(180deg)' }}
                >
                    <div className="bg-blue-50/50 p-4 rounded-xl flex-1 flex flex-col justify-center border border-blue-100/50 space-y-3">
                        {/* Chinese Translation */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Meaning</h3>
                            <p className="font-bold text-lg text-slate-800">
                                {data.translation}
                            </p>
                        </div>

                        {/* English Definition */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Definition</h3>
                            <p className="text-sm text-blue-800/80 leading-relaxed italic">
                                {data.definition}
                            </p>
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-400 text-center font-medium">LexiMind Review</div>
                </div>
            </motion.div>
        </div>
    );
}
