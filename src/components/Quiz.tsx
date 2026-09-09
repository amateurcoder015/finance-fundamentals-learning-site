import React, { useState } from 'react';
import type { QuizItem } from '../content/config';

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

  if (!questions || questions.length === 0) {
    return <div className="p-4 text-slate-500">No quiz questions available for this topic.</div>;
  }

  const currentQ = questions[currentIndex];

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

  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="p-6 md:p-8 bg-white dark:bg-[#131B2E] border border-stone-200 dark:border-slate-800 rounded-xl shadow-sm border-l-4 border-l-blue-600">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Quiz Results</h3>
        <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
          Your Final Score: <span className="font-extrabold text-blue-600 dark:text-blue-400">{score}</span> / {questions.length} ({percentage}%)
        </p>

        <div className="space-y-4 mb-8">
          {questions.map((q, idx) => {
            const userAnswer = userAnswers[idx];
            const isCorrect = userAnswer === q.correctIndex;
            return (
              <div
                key={idx}
                className={`p-4 border rounded-lg ${
                  isCorrect
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30'
                    : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30'
                }`}
              >
                <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  Q{idx + 1}: {q.question}
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Your Answer:{' '}
                  <span className={isCorrect ? 'font-bold text-[#16A34A]' : 'font-bold text-[#DC2626]'}>
                    {userAnswer !== null ? q.options[userAnswer] : 'None'}
                  </span>
                </p>
                {!isCorrect && (
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Correct Answer: <span className="font-bold text-[#16A34A]">{q.options[q.correctIndex]}</span>
                  </p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic border-t border-slate-200/50 dark:border-slate-800 pt-2">
                  {q.explanation}
                </p>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleRestart}
          className="px-6 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold rounded-lg shadow-sm transition-colors"
        >
          Restart Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-blue-500/[0.04] dark:bg-slate-900/40 border border-blue-200/60 dark:border-blue-900/40 rounded-xl shadow-sm border-l-4 border-l-[#1D4ED8]">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-blue-100 dark:border-slate-800">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-100 dark:bg-blue-950 text-[#1D4ED8] dark:text-blue-300">
          Score: {score}
        </span>
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 leading-snug">{currentQ.question}</h3>

      <div className="space-y-3 mb-6">
        {currentQ.options.map((option, idx) => {
          let btnClass = 'w-full text-left p-4 rounded-lg font-medium text-slate-800 dark:text-slate-200 transition-all border ';

          if (!isAnswered) {
            if (selectedOption === idx) {
              btnClass += 'border-[#1D4ED8] bg-blue-50 dark:bg-blue-950/60 ring-2 ring-[#1D4ED8] font-semibold';
            } else {
              btnClass += 'border-stone-200 dark:border-slate-700/80 bg-white dark:bg-[#131B2E] hover:border-blue-300 dark:hover:border-blue-700';
            }
          } else {
            if (idx === currentQ.correctIndex) {
              btnClass += 'border-[#16A34A] bg-emerald-50 dark:bg-emerald-950/60 font-bold text-emerald-950 dark:text-emerald-200';
            } else if (selectedOption === idx) {
              btnClass += 'border-[#DC2626] bg-rose-50 dark:bg-rose-950/60 font-bold text-rose-950 dark:text-rose-200';
            } else {
              btnClass += 'border-stone-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 opacity-50';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelectOption(idx)}
              disabled={isAnswered}
              className={btnClass}
            >
              <span className="inline-block w-7 font-bold text-slate-400 dark:text-slate-500">{String.fromCharCode(65 + idx)}.</span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      {!isAnswered ? (
        <button
          onClick={handleSubmitAnswer}
          disabled={selectedOption === null}
          className={`px-6 py-2.5 rounded-lg font-semibold text-white shadow-sm transition-colors ${
            selectedOption !== null ? 'bg-[#1D4ED8] hover:bg-[#1E40AF]' : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
          }`}
        >
          Submit Answer
        </button>
      ) : (
        <div className="space-y-4">
          <div
            className={`p-4 border rounded-lg ${
              selectedOption === currentQ.correctIndex
                ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-200'
                : 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 text-rose-950 dark:text-rose-200'
            }`}
          >
            <p className="font-bold mb-1 flex items-center gap-1.5">
              <span>{selectedOption === currentQ.correctIndex ? '✓ Correct Answer' : '✗ Incorrect Answer'}</span>
            </p>
            <p className="text-sm leading-relaxed">{currentQ.explanation}</p>
          </div>

          <button
            onClick={handleNextQuestion}
            className="px-6 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold rounded-lg shadow-sm transition-colors"
          >
            {currentIndex < questions.length - 1 ? 'Next Question →' : 'View Final Score →'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Quiz;
