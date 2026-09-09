import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { FlashcardItem } from '../content/config';
import { EASE_OUT, DURATION_BASE, DURATION_SLOW, DURATION_FAST, getReducedMotion } from '../lib/motion';

interface FlashcardsProps {
  cards: FlashcardItem[];
}

export const Flashcards: React.FC<FlashcardsProps> = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const isReduced = getReducedMotion();

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

  // Keyboard navigation listener (Space to flip, Arrow keys to navigate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isFlipped]);

  return (
    <div className="bg-[#0B172A] text-white p-6 md:p-10 rounded-3xl border border-slate-800 shadow-2xl max-w-3xl mx-auto">
      {/* Top Header & Progress */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
          Flashcard Practice (Space to flip, ← → to navigate)
        </span>
        <span className="text-xs font-mono font-bold text-slate-300 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      {/* Smooth Animating Progress Bar */}
      <div className="w-full bg-slate-900 h-2 rounded-full mb-8 overflow-hidden border border-slate-800">
        <motion.div
          className="bg-blue-500 h-full rounded-full"
          initial={false}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: DURATION_BASE, ease: EASE_OUT }}
        />
      </div>

      {/* 3D Card Container */}
      <div className="perspective-1000 min-h-[250px] cursor-pointer" onClick={handleFlip}>
        <motion.div
          className="relative w-full min-h-[250px] rounded-2xl select-none"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          whileTap={!isReduced ? { scale: 0.98 } : undefined}
          transition={{ duration: isReduced ? 0.05 : DURATION_SLOW, ease: EASE_OUT }}
        >
          {/* Front Face */}
          <div
            className="absolute inset-0 w-full h-full p-8 md:p-12 rounded-2xl bg-[#080F1E] border border-slate-800 flex flex-col justify-center items-center text-center shadow-lg"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full bg-blue-950/90 text-blue-300 border border-blue-800 mb-4">
              Concept (Front)
            </span>
            <p className="text-xl md:text-2xl font-bold leading-relaxed text-white tracking-tight">
              {currentCard.front}
            </p>
            <p className="text-xs text-slate-400 mt-6 font-semibold flex items-center gap-1">
              <span>Tap or press Space to reveal answer</span>
              <span>↺</span>
            </p>
          </div>

          {/* Back Face */}
          <div
            className="absolute inset-0 w-full h-full p-8 md:p-12 rounded-2xl bg-[#0F2448] border border-blue-500/50 flex flex-col justify-center items-center text-center shadow-xl"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <span className="text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full bg-blue-900/90 text-blue-200 border border-blue-600 mb-4">
              Answer (Back)
            </span>
            <p className="text-xl md:text-2xl font-bold leading-relaxed text-white tracking-tight">
              {currentCard.back}
            </p>
            <p className="text-xs text-blue-200 mt-6 font-semibold flex items-center gap-1">
              <span>Click to show question</span>
              <span>↺</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mt-8">
        <motion.button
          onClick={handlePrev}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: DURATION_FAST }}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-full font-bold text-xs border border-slate-800"
        >
          ← Previous
        </motion.button>

        <motion.button
          onClick={handleFlip}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: DURATION_FAST }}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-full text-xs shadow-md"
        >
          {isFlipped ? 'Show Front' : 'Reveal Back'}
        </motion.button>

        <motion.button
          onClick={handleNext}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: DURATION_FAST }}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-full font-bold text-xs border border-slate-800"
        >
          Next →
        </motion.button>
      </div>
    </div>
  );
};

export default Flashcards;
