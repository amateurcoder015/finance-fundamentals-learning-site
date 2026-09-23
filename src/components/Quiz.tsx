import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuizItem } from '../content/config';
import { EASE_OUT, DURATION_BASE, DURATION_FAST, SPRING_BOUNCE, getReducedMotion } from '../lib/motion';

interface QuizProps {
  questions: QuizItem[];
}

export const Quiz: React.FC<QuizProps> = ({ questions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(
    new Array(questions ? questions.length : 0).fill(null)
  );
  const [isComplete, setIsComplete] = useState(false);
  const isReduced = getReducedMotion();

  if (!questions || questions.length === 0) {
    return <div className="p-4 text-slate-500">No quiz questions available for this topic.</div>;
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
    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentIndex] = selectedOption;
    setUserAnswers(updatedAnswers);

    if (selectedOption === currentQ.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => (prev + 1));
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

  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="bg-slate-50 dark:bg-[#0B172A] text-slate-900 dark:text-white p-6 md:p-10 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl transition-colors duration-200">
        <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2">Quiz Summary</h3>
        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 flex items-center gap-2">
          Final Score:{' '}
          <motion.span
            initial={isReduced ? { opacity: 1 } : { scale: 0.8, opacity: 0 }}
            animate={isReduced ? { opacity: 1 } : { scale: 1, opacity: 1 }}
            transition={SPRING_BOUNCE}
            className="font-extrabold text-blue-600 dark:text-blue-400 text-2xl"
          >
            {score}
          </motion.span> / {questions.length} ({percentage}%)
        </p>

        <div className="space-y-4 mb-8">
          {questions.map((q, idx) => {
            const userAnswer = userAnswers[idx];
            const isCorrect = userAnswer === q.correctIndex;
            return (
              <div
                key={idx}
                className={`p-5 rounded-2xl border ${
                  isCorrect
                    ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 text-slate-900 dark:text-white'
                    : 'border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 text-slate-900 dark:text-white'
                }`}
              >
                <p className="font-bold text-base mb-1">
                  Q{idx + 1}: {q.question}
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Your Choice:{' '}
                  <span className={isCorrect ? 'font-bold text-emerald-700 dark:text-emerald-400' : 'font-bold text-rose-700 dark:text-rose-400'}>
                    {userAnswer !== null ? q.options[userAnswer] : 'None'}
                  </span>
                </p>
                {!isCorrect && (
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    Correct Choice: <span className="font-bold text-emerald-700 dark:text-emerald-400">{q.options[q.correctIndex]}</span>
                  </p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic border-t border-slate-200 dark:border-slate-800 pt-2">
                  {q.explanation}
                </p>
              </div>
            );
          })}
        </div>

        <motion.button
          onClick={handleRestart}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: DURATION_FAST }}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-full text-xs shadow-md"
        >
          Restart Question Bank
        </motion.button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-[#0B172A] text-slate-900 dark:text-white p-6 md:p-10 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl transition-colors duration-200 overflow-hidden">
      {/* Top Header & Progress */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <motion.span
          key={score}
          initial={isReduced ? {} : { scale: 1.15 }}
          animate={isReduced ? {} : { scale: 1 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm inline-block origin-center"
        >
          Score: {score}
        </motion.span>
      </div>

      {/* Smooth Animating Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-900 h-2 rounded-full mb-8 overflow-hidden border border-slate-300/60 dark:border-slate-800">
        <motion.div
          className="bg-blue-600 dark:bg-blue-500 h-full rounded-full"
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
          <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-6 leading-snug tracking-tight">{currentQ.question}</h3>

          <div className="space-y-3 mb-8">
            {currentQ.options.map((option, idx) => {
              let btnClass = 'w-full text-left p-4 rounded-2xl font-medium transition-colors border shadow-sm ';

              if (!isAnswered) {
                if (selectedOption === idx) {
                  btnClass += 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-[#0F2448] text-blue-950 dark:text-white font-bold ring-2 ring-blue-500/50 shadow-md';
                } else {
                  btnClass += 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080F1E] text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#0B132B]';
                }
              } else {
                if (idx === currentQ.correctIndex) {
                  btnClass += 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 font-bold text-emerald-900 dark:text-emerald-200';
                } else if (selectedOption === idx) {
                  btnClass += 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 font-bold text-rose-900 dark:text-rose-200';
                } else {
                  btnClass += 'border-slate-200 dark:border-slate-900 bg-slate-100 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600 opacity-60';
                }
              }

              return (
                <motion.button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  whileHover={!isAnswered && !isReduced ? { scale: 1.01 } : undefined}
                  whileTap={!isAnswered && !isReduced ? { scale: 0.99 } : undefined}
                  animate={isAnswered && idx === currentQ.correctIndex && !isReduced ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: isAnswered && idx === currentQ.correctIndex ? 0.3 : DURATION_FAST }}
                  className={btnClass}
                >
                  <span className="inline-block w-8 font-bold text-slate-400 dark:text-slate-500">{String.fromCharCode(65 + idx)}.</span>
                  <span>{option}</span>
                </motion.button>
              );
            })}
          </div>

          {!isAnswered ? (
            <motion.button
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null}
              whileHover={selectedOption !== null && !isReduced ? { scale: 1.02 } : undefined}
              whileTap={selectedOption !== null && !isReduced ? { scale: 0.98 } : undefined}
              transition={{ duration: DURATION_FAST }}
              className={`px-7 py-3 rounded-full font-extrabold text-xs shadow-md transition-all ${
                selectedOption !== null ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              Submit Answer
            </motion.button>
          ) : (
            <div className="space-y-5">
              <AnimatePresence mode="wait">
                <motion.div
                  initial={isReduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DURATION_BASE, ease: EASE_OUT }}
                  className={`p-5 rounded-2xl border ${
                    selectedOption === currentQ.correctIndex
                      ? 'border-emerald-300 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                      : 'border-rose-300 dark:border-rose-500/50 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  <p className="font-bold text-sm mb-1">
                    {selectedOption === currentQ.correctIndex ? '✓ Correct Explanation' : '✗ Incorrect Explanation'}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{currentQ.explanation}</p>
                </motion.div>
              </AnimatePresence>

              <motion.button
                onClick={handleNextQuestion}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: DURATION_FAST }}
                className="px-7 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-full text-xs shadow-md"
              >
                {currentIndex < questions.length - 1 ? 'Next Question →' : 'View Quiz Score →'}
              </motion.button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Quiz;
