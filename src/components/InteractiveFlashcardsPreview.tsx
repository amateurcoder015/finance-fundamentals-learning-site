import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EASE_OUT, DURATION_BASE, DURATION_SLOW, getReducedMotion } from '../lib/motion';

export const InteractiveFlashcardsPreview: React.FC = () => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeTab, setActiveTab] = useState<'flashcards' | 'blueprint' | 'quiz'>('flashcards');
  const isReduced = getReducedMotion();

  return (
    <div className="bg-slate-50 dark:bg-[#0B172A] text-slate-900 dark:text-white rounded-[32px] md:rounded-[40px] p-6 sm:p-10 md:p-14 shadow-xl border border-slate-200/80 dark:border-slate-800 my-8 transition-colors duration-200">
      {/* Top Tab Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 mb-8 border-b border-slate-200 dark:border-slate-800 text-center">
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`py-2 text-xs uppercase font-extrabold tracking-wider transition-all border-b-2 ${
            activeTab === 'flashcards' ? 'text-blue-600 dark:text-white border-blue-600 dark:border-white' : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Interactive Flashcards
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`py-2 text-xs uppercase font-extrabold tracking-wider transition-all border-b-2 ${
            activeTab === 'quiz' ? 'text-blue-600 dark:text-white border-blue-600 dark:border-white' : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Question Bank & Quiz
        </button>
        <button
          onClick={() => setActiveTab('blueprint')}
          className={`py-2 text-xs uppercase font-extrabold tracking-wider transition-all border-b-2 ${
            activeTab === 'blueprint' ? 'text-blue-600 dark:text-white border-blue-600 dark:border-white' : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Blueprint Notes
        </button>
        <div className="py-2 text-xs uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 border-b-2 border-transparent">
          Mermaid Diagrams
        </div>
      </div>

      {/* Feature Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-4 space-y-4">
          <motion.div
            onClick={() => setActiveTab('flashcards')}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
            className={`p-5 rounded-2xl cursor-pointer transition-all ${
              activeTab === 'flashcards' ? 'bg-white dark:bg-[#0F1E36] border border-blue-500/40 shadow-lg' : 'bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200/80 dark:hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xl">📇</span>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-base">Flashcards</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-8">
              Stuff you actually need to remember for TVM, valuation, and finance exams.
            </p>
          </motion.div>

          <motion.div
            onClick={() => setActiveTab('blueprint')}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
            className={`p-5 rounded-2xl cursor-pointer transition-all ${
              activeTab === 'blueprint' ? 'bg-white dark:bg-[#0F1E36] border border-blue-500/40 shadow-lg' : 'bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200/80 dark:hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xl">📝</span>
              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-base">Blueprint Notes</h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-8">
              Simple explanations that make formulas click without textbook fluff.
            </p>
          </motion.div>

          <motion.div
            onClick={() => setActiveTab('quiz')}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
            className={`p-5 rounded-2xl cursor-pointer transition-all ${
              activeTab === 'quiz' ? 'bg-white dark:bg-[#0F1E36] border border-blue-500/40 shadow-lg' : 'bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200/80 dark:hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xl">📊</span>
              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-base">Mock Tests & Quiz</h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-8">
              Practice what's likely to show up with step-by-step explanations.
            </p>
          </motion.div>
        </div>

        {/* Right Browser Sandbox Window */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
          <div className="bg-slate-100 dark:bg-[#0B132B] px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
            </div>
            <div className="bg-white dark:bg-slate-950/80 px-6 py-1 rounded-full text-xs font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800/80">
              financefundamentals.app / time-value-of-money
            </div>
            <div className="w-12"></div>
          </div>

          <div className="p-6 md:p-8 bg-slate-50 dark:bg-[#060B14]">
            <div className="max-w-xl mx-auto">
              <div className="mb-4 flex justify-between items-center text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <span>Corporate Finance</span>
                <span>1 / 5 Flashcards</span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mb-6 overflow-hidden">
                <motion.div
                  className="bg-blue-600 dark:bg-blue-500 h-full rounded-full"
                  animate={{ width: isFlipped ? '60%' : '20%' }}
                  transition={{ duration: DURATION_BASE, ease: EASE_OUT }}
                />
              </div>

              {/* 3D Flip Card */}
              <div className="perspective-1000 min-h-[190px] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                <motion.div
                  className="relative w-full min-h-[190px] rounded-2xl select-none"
                  style={{ transformStyle: 'preserve-3d' }}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  whileTap={!isReduced ? { scale: 0.98 } : undefined}
                  transition={{ duration: isReduced ? 0.05 : DURATION_SLOW, ease: EASE_OUT }}
                >
                  {/* Front */}
                  <div
                    className="absolute inset-0 w-full h-full p-8 rounded-2xl bg-white dark:bg-[#0B172A] border border-slate-200 dark:border-slate-800 text-center shadow-lg flex flex-col justify-center items-center"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <span className="text-[10px] uppercase font-black text-blue-700 dark:text-blue-400 tracking-widest mb-3 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800">
                      Core Principle
                    </span>
                    <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
                      What is the core principle of the Time Value of Money (TVM)?
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 italic">Tap card to reveal answer ↺</p>
                  </div>

                  {/* Back */}
                  <div
                    className="absolute inset-0 w-full h-full p-8 rounded-2xl bg-blue-50/80 dark:bg-[#0F2448] border border-blue-200 dark:border-blue-500/50 text-center shadow-lg flex flex-col justify-center items-center"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <span className="text-[10px] uppercase font-black text-blue-800 dark:text-blue-300 tracking-widest mb-3 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/80 border border-blue-300 dark:border-blue-600">
                      Answer
                    </span>
                    <p className="text-base md:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                      A dollar today is worth more than a dollar in the future because today's dollar can earn interest.
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-200 mt-4 italic">Click to flip back ↺</p>
                  </div>
                </motion.div>
              </div>

              <div className="mt-6 text-center">
                <motion.a
                  href="/topics/time-value-of-money"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg"
                >
                  <span>Launch Interactive Lesson</span>
                  <span>→</span>
                </motion.a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveFlashcardsPreview;
