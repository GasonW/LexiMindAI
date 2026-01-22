import { useState, useEffect, useCallback } from 'react'
import ReviewCard, { type WordData } from '../components/ReviewCard'
import Settings from './Settings';
import Vocabulary from './Vocabulary';
import { type VocabularyItem, migrateVocabularyData } from '../types/vocabulary';

const MAX_REVIEW_WORDS = 12;

// Convert VocabularyItem to WordData for ReviewCard
function convertToWordData(item: VocabularyItem): WordData {
  return {
    word: item.word,
    context: item.example_sentences?.[0]?.en || '',
    definition: item.definition_en || '',
    translation: item.definition_zh || ''
  };
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get random items from vocabulary
function getRandomReviewWords(vocabulary: VocabularyItem[], count: number): WordData[] {
  if (vocabulary.length === 0) return [];
  const shuffled = shuffleArray(vocabulary);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  return selected.map(convertToWordData);
}

function Toggle({ active, onToggle }: { active: boolean, onToggle: () => void }) {
  return (
    <div className="bg-paper-white rounded-xl p-4 zen-shadow border border-black/5 flex items-center justify-between">
      <div className="flex flex-col gap-0.5">
        <span className="text-[9px] uppercase kerning-wide font-medium text-ink/40">Underline it</span>
        <span className={`text-[10px] font-bold tracking-widest uppercase ${active ? 'text-primary' : 'text-ink/30'}`}>
          {active ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-[8px] font-bold tracking-tighter uppercase ${!active ? 'text-ink/40' : 'text-ink/20'}`}>
          Off
        </span>
        <button
          onClick={onToggle}
          className="relative inline-flex items-center cursor-pointer group"
        >
          <div className={`w-10 h-5 rounded-full inset-shadow-sm transition-colors duration-300 flex items-center px-0.5 ${active ? 'bg-primary' : 'bg-ink/20'}`}>
            <div className={`size-4 bg-white rounded-full shadow-md transition-all duration-300 ${active ? 'ml-auto' : 'ml-0'}`} />
          </div>
        </button>
        <span className={`text-[8px] font-bold tracking-tighter uppercase ${active ? 'text-primary' : 'text-ink/20'}`}>
          On
        </span>
      </div>
    </div>
  )
}

function App() {
  const [view, setView] = useState<'home' | 'settings' | 'vocabulary'>('home');
  const [clueMode, setClueMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewWords, setReviewWords] = useState<WordData[]>([]);
  const [allVocabulary, setAllVocabulary] = useState<VocabularyItem[]>([]);

  // Load vocabulary and generate random review words
  const loadVocabularyAndReview = useCallback(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['clueMode', 'vocabularyList'], (result: { clueMode?: boolean; vocabularyList?: string[] | VocabularyItem[] }) => {
        if (result.clueMode) setClueMode(true);

        const items = migrateVocabularyData(result.vocabularyList || []);
        setAllVocabulary(items);

        // Generate random review words
        const randomWords = getRandomReviewWords(items, MAX_REVIEW_WORDS);
        setReviewWords(randomWords);
        setCurrentIndex(0);
      });
    }
  }, []);

  useEffect(() => {
    loadVocabularyAndReview();
  }, [view, loadVocabularyAndReview]);

  // Refresh with new random words
  const handleShuffle = () => {
    const randomWords = getRandomReviewWords(allVocabulary, MAX_REVIEW_WORDS);
    setReviewWords(randomWords);
    setCurrentIndex(0);
  };

  const handleNext = () => {
    if (reviewWords.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % reviewWords.length);
  };

  const handlePrev = () => {
    if (reviewWords.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + reviewWords.length) % reviewWords.length);
  };

  if (view === 'settings') {
    return (
      <div className="w-[340px] h-[420px] bg-paper-creme font-sans p-5 overflow-hidden relative">
        <div className="fixed inset-0 paper-grain z-50 pointer-events-none"></div>
        <Settings onBack={() => setView('home')} />
      </div>
    );
  }

  if (view === 'vocabulary') {
    return (
      <div className="w-[340px] h-[420px] bg-paper-creme font-sans p-5 overflow-hidden relative">
        <div className="fixed inset-0 paper-grain z-50 pointer-events-none"></div>
        <Vocabulary onBack={() => setView('home')} />
      </div>
    );
  }

  return (
    <div className="w-[340px] h-[420px] bg-paper-creme font-sans text-ink flex flex-col overflow-hidden relative">
      {/* Paper grain texture */}
      <div className="fixed inset-0 paper-grain z-50 pointer-events-none"></div>

      {/* Decorative blur */}
      <div className="fixed bottom-[-10%] left-[-10%] size-[150px] bg-primary/5 rounded-full blur-[50px] -z-10"></div>

      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <h1 className="text-lg font-light tracking-[0.2em] uppercase text-ink">
          Underline
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('vocabulary')}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            title="My Vocabulary"
          >
            <span className="material-symbols-outlined text-ink/70 text-[22px]">auto_stories</span>
          </button>
          <button
            onClick={() => setView('settings')}
            className="flex items-center justify-center hover:opacity-70 transition-opacity"
          >
            <span className="material-symbols-outlined text-ink/70 text-[22px]">settings</span>
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 flex flex-col gap-4">
        <section>
          <Toggle
            active={clueMode}
            onToggle={() => {
              const newState = !clueMode;
              setClueMode(newState);
              if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.set({ clueMode: newState });
              }
            }}
          />
        </section>

        <section className="flex flex-col gap-2 flex-1">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] uppercase kerning-wide font-semibold text-ink/40">Daily Review</h3>
            {reviewWords.length > 0 && (
              <span className="text-[10px] font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                {currentIndex + 1} / {reviewWords.length}
              </span>
            )}
          </div>

          {reviewWords.length > 0 ? (
            <div key={currentIndex} className="flex-1 overflow-hidden">
              <ReviewCard data={reviewWords[currentIndex]} />
            </div>
          ) : (
            <div className="bg-paper-white rounded-2xl p-6 flex flex-col items-center justify-center flex-1 text-center zen-shadow border border-black/5">
              <span className="material-symbols-outlined text-ink/20 text-4xl mb-2">auto_stories</span>
              <p className="text-ink/50 text-sm">
                单词本为空，快去收藏一些单词吧！
              </p>
              <p className="text-ink/30 text-xs mt-1">
                在网页中选中单词，点击翻译后添加到单词本
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Navigation Controls */}
      {reviewWords.length > 0 && (
        <div className="flex items-center justify-between px-6 pb-2 -mt-3">
          <button
            onClick={handlePrev}
            className="p-2 text-ink/40 hover:text-ink transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">chevron_left</span>
          </button>

          <button
            onClick={handleShuffle}
            className="flex flex-col items-center gap-0.5 cursor-pointer group"
            title="Shuffle"
          >
            <span className="material-symbols-outlined text-ink/40 group-hover:text-ink transition-colors text-xl">shuffle</span>
            <span className="text-[9px] uppercase kerning-wide text-ink/40 group-hover:text-ink transition-colors">Shuffle</span>
          </button>

          <button
            onClick={handleNext}
            className="p-2 text-ink/40 hover:text-ink transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default App
