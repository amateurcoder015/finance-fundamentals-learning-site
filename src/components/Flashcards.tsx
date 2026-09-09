import React, { useState } from 'react';
import type { FlashcardItem } from '../content/config';

interface FlashcardsProps {
  cards: FlashcardItem[];
}

export const Flashcards: React.FC<FlashcardsProps> = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!cards || cards.length === 0) {
    return <div className="p-4 text-slate-500">No flashcards available for this topic.</div>;
  }

  const currentCard = cards[currentIndex];

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : cards.length - 1));
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev < cards.length - 1 ? prev + 1 : 0));
  };

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  return (
    <div className="p-6 md:p-8 bg-blue-500/[0.04] dark:bg-slate-900/40 border border-blue-200/60 dark:border-blue-900/40 rounded-xl shadow-sm border-l-4 border-l-[#1D4ED8] max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-blue-100 dark:border-slate-800">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Flashcard {currentIndex + 1} of {cards.length}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">Click card to reveal answer</span>
      </div>

      {/* Card area */}
      <div
        onClick={handleFlip}
        className={`min-h-[220px] p-8 rounded-xl flex flex-col justify-center items-center text-center cursor-pointer transition-all duration-200 select-none border ${
          isFlipped
            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-100 shadow-sm'
            : 'bg-white dark:bg-[#131B2E] border-stone-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-sm hover:border-blue-400'
        }`}
      >
        <span className="text-xs uppercase font-extrabold tracking-wider text-blue-600 dark:text-blue-400 mb-3 px-2.5 py-0.5 rounded bg-blue-100/60 dark:bg-blue-950">
          {isFlipped ? 'Answer (Back)' : 'Concept (Front)'}
        </span>
        <p className="text-xl md:text-2xl font-semibold leading-relaxed max-w-xl">
          {isFlipped ? currentCard.back : currentCard.front}
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={handlePrev}
          className="px-4 py-2 border border-stone-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-white dark:hover:bg-slate-800 transition-colors text-sm"
        >
          ← Previous
        </button>

        <button
          onClick={handleFlip}
          className="px-6 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold rounded-lg shadow-sm transition-colors text-sm"
        >
          {isFlipped ? 'Show Front' : 'Reveal Back'}
        </button>

        <button
          onClick={handleNext}
          className="px-4 py-2 border border-stone-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-white dark:hover:bg-slate-800 transition-colors text-sm"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default Flashcards;
