import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuizItem } from '../content/config';
import { EASE_OUT, DURATION_BASE, DURATION_FAST, getReducedMotion } from '../lib/motion';
import { Stamp } from './ui/Stamp';

interface QuizProps {
  questions: QuizItem[];
}

export const Quiz: React.FC<QuizProps> = ({ questions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(
    new Array(questions ? questions.length : 0).fill(null),
  );
  const [isComplete, setIsComplete] = useState(false);
  const isReduced = getReducedMotion();

  if (!questions || questions.length === 0) {
    return <div className="p-4 text-ink-muted">No quiz questions available for this topic.</div>;
  }

  const currentQ = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswered) return;
    setIsAnswered(true);
    const updated = [...userAnswers];
    updated[currentIndex] = selectedOption;
    setUserAnswers(updated);
    if (selectedOption === currentQ.correctIndex) setScore((prev) => prev + 1);
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsComplete(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setUserAnswers(new Array(questions.length).fill(null));
    setIsComplete(false);
  };

  const shell = 'mx-auto max-w-2xl overflow-hidden rounded-2xl border border-rule bg-paper-raised p-6 md:p-10';

  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className={shell}>
        <div className="mb-2 flex items-center justify-between gap-4">
          <h3 className="font-serif text-3xl font-semibold text-ink">Quiz summary</h3>
          {percentage >= 70 && <Stamp variant="complete" label="Well done" />}
        </div>
        <p className="mb-8 font-sans text-lg text-ink-muted">
          Final score: <span className="font-bold text-rust">{score}</span> / {questions.length} ({percentage}%)
        </p>

        <div className="mb-8 space-y-4">
          {questions.map((q, idx) => {
            const userAnswer = userAnswers[idx];
            const isCorrect = userAnswer === q.correctIndex;
            return (
              <div
                key={idx}
                className={`rounded-xl border p-5 ${isCorrect ? 'border-success/50 bg-success/10' : 'border-danger/50 bg-danger/10'}`}
              >
                <p className="mb-1 font-serif text-lg font-semibold text-ink">
                  Q{idx + 1}: {q.question}
                </p>
                <p className="font-sans text-sm text-ink">
                  Your choice:{' '}
                  <span className={`font-bold ${isCorrect ? 'text-success' : 'text-danger'}`}>
                    {userAnswer !== null ? q.options[userAnswer] : 'None'}
                  </span>
                </p>
                {!isCorrect && (
                  <p className="font-sans text-sm text-ink">
                    Correct: <span className="font-bold text-success">{q.options[q.correctIndex]}</span>
                  </p>
                )}
                <p className="mt-2 border-t border-rule pt-2 font-sans text-sm italic text-ink-muted">{q.explanation}</p>
              </div>
            );
          })}
        </div>

        <motion.button
          onClick={handleRestart}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: DURATION_FAST }}
          className="min-h-[44px] rounded-full bg-rust px-6 font-sans text-sm font-bold text-on-accent"
        >
          Restart question bank
        </motion.button>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span className="font-mono text-xs font-semibold text-rust">Score: {score}</span>
      </div>

      <div className="mb-8 h-[3px] w-full overflow-hidden rounded-full bg-rule">
        <motion.div
          className="h-full bg-rust"
          initial={false}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: DURATION_BASE, ease: EASE_OUT }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={isReduced ? { opacity: 0 } : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={isReduced ? { opacity: 0 } : { opacity: 0, x: -20 }}
          transition={{ duration: DURATION_BASE, ease: EASE_OUT }}
        >
          <h3 className="mb-6 font-serif text-2xl font-semibold leading-snug text-ink">{currentQ.question}</h3>

          <div className="mb-8 space-y-3">
            {currentQ.options.map((option, idx) => {
              let state: string;
              if (!isAnswered) {
                state =
                  selectedOption === idx
                    ? 'border-ink bg-paper ring-2 ring-rust/40 font-semibold'
                    : 'border-rule bg-paper hover:border-ink/40';
              } else if (idx === currentQ.correctIndex) {
                state = 'border-success bg-success/10 font-semibold';
              } else if (selectedOption === idx) {
                state = 'border-danger bg-danger/10 font-semibold';
              } else {
                state = 'border-rule bg-paper opacity-50';
              }
              return (
                <motion.button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  whileTap={!isAnswered && !isReduced ? { scale: 0.99 } : undefined}
                  transition={{ duration: DURATION_FAST }}
                  className={`flex min-h-[44px] w-full items-baseline rounded-xl border p-4 text-left font-sans text-base text-ink transition-colors ${state}`}
                >
                  <span className="mr-3 inline-block w-6 font-bold text-ink-muted">{String.fromCharCode(65 + idx)}.</span>
                  <span>{option}</span>
                </motion.button>
              );
            })}
          </div>

          {!isAnswered ? (
            <motion.button
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null}
              whileTap={selectedOption !== null && !isReduced ? { scale: 0.98 } : undefined}
              transition={{ duration: DURATION_FAST }}
              className={`min-h-[44px] rounded-full px-7 font-sans text-sm font-bold ${
                selectedOption !== null ? 'bg-rust text-on-accent' : 'cursor-not-allowed bg-rule text-ink-muted'
              }`}
            >
              Submit answer
            </motion.button>
          ) : (
            <div className="space-y-5">
              <motion.div
                initial={isReduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DURATION_BASE, ease: EASE_OUT }}
                className={`rounded-xl border p-5 ${
                  selectedOption === currentQ.correctIndex ? 'border-success/50 bg-success/10' : 'border-danger/50 bg-danger/10'
                }`}
              >
                <div className="mb-2">
                  <Stamp variant={selectedOption === currentQ.correctIndex ? 'correct' : 'incorrect'} />
                </div>
                <p className="font-sans text-sm leading-relaxed text-ink">{currentQ.explanation}</p>
              </motion.div>

              <motion.button
                onClick={handleNextQuestion}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: DURATION_FAST }}
                className="min-h-[44px] rounded-full bg-rust px-7 font-sans text-sm font-bold text-on-accent"
              >
                {currentIndex < questions.length - 1 ? 'Next question →' : 'View score →'}
              </motion.button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Quiz;
