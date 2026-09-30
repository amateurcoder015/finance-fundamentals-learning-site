import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FlashcardItem } from '../content/config';
import { EASE_OUT, DURATION_BASE, DURATION_FAST, SPRING_FLIP, getReducedMotion } from '../lib/motion';
import { Stamp } from './ui/Stamp';

interface FlashcardsProps {
  cards: FlashcardItem[];
}

export const Flashcards: React.FC<FlashcardsProps> = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasCompletedDeck, setHasCompletedDeck] = useState(false);
  const deckRef = useRef<HTMLDivElement>(null);
  const isReduced = getReducedMotion();

  if (!cards || cards.length === 0) {
    return <div className="p-4 text-ink-muted">No flashcards available for this topic.</div>;
  }

  const currentCard = cards[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

  const go = (next: number) => {
    setIsFlipped(false);
    setCurrentIndex(next);
  };
  const handlePrev = () => go(currentIndex > 0 ? currentIndex - 1 : cards.length - 1);
  const handleNext = () => go(currentIndex < cards.length - 1 ? currentIndex + 1 : 0);
  const handleFlip = () => {
    const next = !isFlipped;
    setIsFlipped(next);
    if (next && currentIndex === cards.length - 1) setHasCompletedDeck(true);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      handleFlip();
    } else if (e.code === 'ArrowRight') {
      handleNext();
    } else if (e.code === 'ArrowLeft') {
      handlePrev();
    }
  };

  return (
    <div
      ref={deckRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      aria-label="Flashcard deck. Press space to flip, left and right arrows to move."
      className="mx-auto max-w-2xl rounded-2xl border border-rule bg-paper p-5 outline-none focus-visible:ring-2 focus-visible:ring-rust md:p-8"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">
          Space to flip · ← → to move
        </span>
        <span className="font-mono text-xs font-semibold text-ink">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      <div className="mb-8 h-[3px] w-full overflow-hidden rounded-full bg-rule">
        <motion.div
          className="h-full bg-rust"
          initial={false}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: DURATION_BASE, ease: EASE_OUT }}
        />
      </div>

      {/* Paper stack */}
      <div className="relative">
        <div aria-hidden="true" className="absolute inset-0 translate-y-2.5 -rotate-2 rounded-xl border border-rule bg-paper-raised" />
        <div aria-hidden="true" className="absolute inset-0 translate-y-1 rotate-1 rounded-xl border border-rule bg-paper-raised" />

        <div className="perspective-1000 relative min-h-[260px] cursor-pointer" onClick={handleFlip}>
          <motion.div
            className="relative min-h-[260px] w-full select-none"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            whileTap={!isReduced ? { scale: 0.985 } : undefined}
            transition={isReduced ? { duration: 0.05, ease: EASE_OUT } : SPRING_FLIP}
          >
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-rule bg-paper-raised p-8 text-center shadow-sm md:p-12"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <span className="mb-4 font-sans text-xs font-bold uppercase tracking-[0.14em] text-rust">Question</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={currentIndex}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: DURATION_BASE, ease: EASE_OUT }}
                  className="font-serif text-2xl font-medium leading-snug text-ink"
                >
                  {currentCard.front}
                </motion.p>
              </AnimatePresence>
              <span className="mt-5 font-sans text-xs text-ink-muted">Tap to reveal the answer</span>
            </div>

            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-rust/50 bg-paper p-8 text-center shadow-sm md:p-12"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <span className="mb-4 font-sans text-xs font-bold uppercase tracking-[0.14em] text-rust">Answer</span>
              <p className="font-serif text-xl leading-relaxed text-ink md:text-2xl">{currentCard.back}</p>
              <span className="mt-5 font-sans text-xs text-ink-muted">Tap to see the question</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <motion.button
          onClick={handlePrev}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: DURATION_FAST }}
          className="min-h-[44px] rounded-full border border-rule bg-paper-raised px-5 font-sans text-sm font-bold text-ink hover:border-ink/40"
        >
          ← Previous
        </motion.button>
        <motion.button
          onClick={handleFlip}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: DURATION_FAST }}
          className="min-h-[44px] rounded-full bg-rust px-6 font-sans text-sm font-bold text-on-accent"
        >
          {isFlipped ? 'Show question' : 'Reveal answer'}
        </motion.button>
        <motion.button
          onClick={handleNext}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: DURATION_FAST }}
          className="min-h-[44px] rounded-full border border-rule bg-paper-raised px-5 font-sans text-sm font-bold text-ink hover:border-ink/40"
        >
          Next →
        </motion.button>
      </div>

      {hasCompletedDeck && (
        <div className="mt-6 flex justify-center">
          <Stamp variant="complete" label="Deck complete" />
        </div>
      )}
    </div>
  );
};

export default Flashcards;
