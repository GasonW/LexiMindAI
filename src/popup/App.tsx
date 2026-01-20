import { useState, useEffect } from 'react'
import ReviewCard, { type WordData } from '../components/ReviewCard'
import Settings from './Settings';
import Vocabulary from './Vocabulary';
import { Settings as SettingsIcon, ChevronRight, ChevronLeft, RefreshCw, BookOpen } from 'lucide-react'

// Mock Data for Review
const MOCK_WORDS: WordData[] = [
  {
    word: "Serendipity",
    context: "We found the cafe by pure serendipity.",
    definition: "The occurrence and development of events by chance in a happy or beneficial way.",
    translation: "机缘凑巧"
  },
  {
    word: "Ephemeral",
    context: "Fashions are ephemeral, changing with every season.",
    definition: "Lasting for a very short time.",
    translation: "转瞬即逝的"
  },
  {
    word: "Mellifluous",
    context: "She had a rich, mellifluous voice that turned heads.",
    definition: "(of a voice or words) sweet or musical; pleasant to hear.",
    translation: "声音甜美的"
  }
];

function Toggle({ label, active, onToggle }: { label: string, active: boolean, onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100">
      <span className="font-medium text-gray-700">{label}</span>
      <button
        onClick={onToggle}
        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${active ? 'bg-blue-500' : 'bg-gray-300'}`}
      >
        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${active ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

function App() {
  const [view, setView] = useState<'home' | 'settings' | 'vocabulary'>('home');
  const [clueMode, setClueMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [vocabCount, setVocabCount] = useState(0);

  useEffect(() => {
    // Sync Clue Mode from storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['clueMode', 'vocabularyList'], (result: { clueMode?: boolean; vocabularyList?: string[] }) => {
        if (result.clueMode) setClueMode(true);
        setVocabCount(result.vocabularyList?.length || 0);
      });
    }
  }, [view]); // 当视图切换时刷新数据

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % MOCK_WORDS.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + MOCK_WORDS.length) % MOCK_WORDS.length);
  };

  if (view === 'settings') {
    return (
      <div className="w-[350px] min-h-[500px] bg-slate-50 font-sans p-6">
        <Settings onBack={() => setView('home')} />
      </div>
    );
  }

  if (view === 'vocabulary') {
    return (
      <div className="w-[350px] min-h-[500px] bg-slate-50 font-sans p-6">
        <Vocabulary onBack={() => setView('home')} />
      </div>
    );
  }

  return (
    <div className="w-[350px] min-h-[500px] bg-slate-50 font-sans text-gray-800 flex flex-col">
      <header className="bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          LexiMind AI
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setView('vocabulary')}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative"
            title="My Vocabulary"
          >
            <BookOpen size={20} />
            {vocabCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                {vocabCount > 99 ? '99+' : vocabCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setView('settings')}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6 flex-1 overflow-y-auto">
        <section>
          <Toggle
            label="Clue Mode"
            active={clueMode}
            onToggle={() => {
              const newState = !clueMode;
              setClueMode(newState);
              if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.set({ clueMode: newState });
              }
            }}
          />
          <p className="text-xs text-gray-500 mt-2 px-1">
            Automatically highlights "Review" words on web pages.
          </p>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Daily Review</h2>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
              {currentIndex + 1} / {MOCK_WORDS.length}
            </span>
          </div>

          <div key={currentIndex}>
            {/* Key ensures simple remount animation/reset on change */}
            <ReviewCard data={MOCK_WORDS[currentIndex]} />
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-4 px-2">
            <button
              onClick={handlePrev}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-full transition-all active:scale-95"
            >
              <ChevronLeft size={24} />
            </button>

            <button className="flex flex-col items-center gap-1 text-gray-300 hover:text-green-500 transition-colors">
              <RefreshCw size={16} />
              <span className="text-[10px] font-medium">Mastered</span>
            </button>

            <button
              onClick={handleNext}
              className="p-2 text-blue-600 hover:bg-white bg-blue-50/50 rounded-full transition-all shadow-sm active:scale-95 hover:shadow-md"
            >
              <ChevronRight size={24} />
            </button>
          </div>

        </section>
      </main>
    </div>
  )
}

export default App
