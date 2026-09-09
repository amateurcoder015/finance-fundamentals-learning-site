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
  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

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
    <div className="bg-[#0B172A] text-white p-6 md:p-10 rounded-3xl border border-slate-800 shadow-2xl max-w-3xl mx-auto">
      {/* Top Header & Progress */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
          Flashcard Practice
        </span>
        <span className="text-xs font-mono font-bold text-slate-300 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      {/* Track Progress Bar */}
      <div className="w-full bg-slate-900 h-2 rounded-full mb-8 overflow-hidden border border-slate-800">
        <div
          className="bg-blue-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {/* Card area (Preparoo Dark Card Style) */}
      <div
        onClick={handleFlip}
        className={`min-h-[240px] p-8 md:p-12 rounded-2xl flex flex-col justify-center items-center text-center cursor-pointer transition-all duration-300 select-none border ${
          isFlipped
            ? 'bg-[#0F2448] border-blue-500/50 text-white shadow-xl'
            : 'bg-[#080F1E] border-slate-800 text-white shadow-lg hover:border-slate-700'
        }`}
      >
        <span className="text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full bg-blue-950/90 text-blue-300 border border-blue-800 mb-4">
          {isFlipped ? 'Answer (Back)' : 'Question (Front)'}
        </span>

        <p className="text-xl md:text-2xl font-bold leading-relaxed max-w-xl text-white tracking-tight">
          {isFlipped ? currentCard.back : currentCard.front}
        </p>

        <p className="text-xs text-slate-400 mt-6 font-semibold flex items-center gap-1">
          <span>{isFlipped ? 'Click to show question' : 'Tap to reveal answer'}</span>
          <span>↺</span>
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={handlePrev}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-full font-bold text-xs transition-colors border border-slate-800"
        >
          ← Previous
        </button>

        <button
          onClick={handleFlip}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-full text-xs transition-all shadow-md"
        >
          {isFlipped ? 'Show Front' : 'Reveal Back'}
        </button>

        <button
          onClick={handleNext}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-full font-bold text-xs transition-colors border border-slate-800"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default Flashcards;
