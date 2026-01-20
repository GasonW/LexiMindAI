import { useEffect, useState, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import TranslationModal from './TranslationModal';

export default function ContentApp() {
    const [selection, setSelection] = useState<{ text: string; x: number; y: number; bottom: number } | null>(null);
    const [showModal, setShowModal] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleSelection = () => {
            if (showModal) return;

            const sel = window.getSelection();
            if (!sel || sel.isCollapsed || sel.toString().trim().length === 0) {
                if (!showModal) setSelection(null);
                return;
            }

            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // 使用选区的中心 x 坐标，底部 y 坐标（浮层显示在文字下方）
            const x = rect.left + rect.width / 2;
            const bottom = rect.bottom;

            setSelection({
                text: sel.toString().trim(),
                x: Math.max(20, Math.min(x, window.innerWidth - 20)),
                y: rect.top,
                bottom: bottom
            });
        };

        const handleMessage = (message: any) => {
            if (message.type === 'TRIGGER_TRANSLATION' && message.selectionText) {
                const sel = window.getSelection();
                let x = window.innerWidth / 2;
                let bottom = 100;

                if (sel && !sel.isCollapsed) {
                    try {
                        const range = sel.getRangeAt(0);
                        const rect = range.getBoundingClientRect();
                        x = rect.left + rect.width / 2;
                        bottom = rect.bottom;
                    } catch {
                        console.log('LexiMind: 使用默认位置显示翻译框');
                    }
                }

                setSelection({
                    text: message.selectionText,
                    x: Math.max(20, Math.min(x, window.innerWidth - 20)),
                    y: bottom - 20,
                    bottom: bottom
                });
                setShowModal(true);
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);
        document.addEventListener('mouseup', handleSelection, true);
        return () => {
            document.removeEventListener('mouseup', handleSelection, true);
            chrome.runtime.onMessage.removeListener(handleMessage);
        };
    }, [showModal]);

    // 点击外部关闭浮层
    useEffect(() => {
        if (!showModal) return;

        const handleClickOutside = (e: MouseEvent) => {
            // 使用 composedPath 获取完整的事件路径（包括 Shadow DOM 内部）
            const path = e.composedPath();
            const isInsideModal = modalRef.current && path.includes(modalRef.current);

            if (!isInsideModal) {
                setShowModal(false);
                setSelection(null);
            }
        };

        // 使用 setTimeout 确保不会立即触发关闭
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside, true);
        }, 150);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside, true);
        };
    }, [showModal]);

    if (!selection) return null;

    return (
        <>
            {!showModal && (
                <div
                    className="fixed z-[99999] pointer-events-auto"
                    style={{
                        left: selection.x,
                        top: selection.bottom + 8,
                        transform: 'translateX(-50%)'
                    }}
                >
                    <button
                        className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer"
                        onClick={() => setShowModal(true)}
                    >
                        <MessageSquare size={20} />
                    </button>
                </div>
            )}

            {showModal && (
                <div ref={modalRef}>
                    <TranslationModal
                        text={selection.text}
                        position={{ x: selection.x, y: selection.bottom }}
                        onClose={() => {
                            setShowModal(false);
                            setSelection(null);
                        }}
                    />
                </div>
            )}
        </>
    );
}
