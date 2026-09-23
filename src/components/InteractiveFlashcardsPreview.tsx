import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EASE_OUT, DURATION_BASE, DURATION_SLOW, getReducedMotion } from '../lib/motion';

export const InteractiveFlashcardsPreview: React.FC = () => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeTab, setActiveTab] = useState<'flashcards' | 'quiz' | 'blueprint' | 'diagrams'>('flashcards');
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const isReduced = getReducedMotion();

  return (
    <div className="bg-slate-50 dark:bg-[#0B172A] text-slate-900 dark:text-white rounded-[32px] md:rounded-[40px] p-6 sm:p-10 md:p-14 shadow-2xl border border-slate-200/80 dark:border-slate-800/90 my-12 transition-colors duration-200">
      
      {/* Top Section Header */}
      <div className="max-w-2xl mb-8">
        <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          Interactive Study Sandbox
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-3">
          Four Ways to Master Financial Concepts
        </h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 font-medium mt-2">
          Switch tabs to preview how every lesson integrates interactive flashcards, quizzes, blueprint notes, and visual flowcharts.
        </p>
      </div>

      {/* Top Tab Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-4 mb-8 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`py-3 px-4 rounded-xl text-xs uppercase font-extrabold tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'flashcards'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40'
          }`}
        >
          <span>📇</span>
          <span>Flashcards</span>
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`py-3 px-4 rounded-xl text-xs uppercase font-extrabold tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'quiz'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40'
          }`}
        >
          <span>📊</span>
          <span>Question Bank</span>
        </button>

        <button
          onClick={() => setActiveTab('blueprint')}
          className={`py-3 px-4 rounded-xl text-xs uppercase font-extrabold tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'blueprint'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40'
          }`}
        >
          <span>📝</span>
          <span>Blueprint Notes</span>
        </button>

        <button
          onClick={() => setActiveTab('diagrams')}
          className={`py-3 px-4 rounded-xl text-xs uppercase font-extrabold tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'diagrams'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40'
          }`}
        >
          <span>🔄</span>
          <span>Mermaid Diagrams</span>
        </button>
      </div>

      {/* Feature Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Info Column */}
        <div className="lg:col-span-4 space-y-4">
          <motion.div
            onClick={() => setActiveTab('flashcards')}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
            className={`p-5 rounded-2xl cursor-pointer transition-all border ${
              activeTab === 'flashcards'
                ? 'bg-white dark:bg-[#0F1E36] border-blue-500/60 shadow-xl'
                : 'bg-slate-200/40 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-200/70 dark:hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xl">📇</span>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-base">Interactive Flashcards</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-8">
              Fast, active-recall cards with 3D flip physics to test essential formulas and rules.
            </p>
          </motion.div>

          <motion.div
            onClick={() => setActiveTab('quiz')}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
            className={`p-5 rounded-2xl cursor-pointer transition-all border ${
              activeTab === 'quiz'
                ? 'bg-white dark:bg-[#0F1E36] border-blue-500/60 shadow-xl'
                : 'bg-slate-200/40 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-200/70 dark:hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xl">📊</span>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-base">Question Bank & Quiz</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-8">
              Multiple-choice questions with real-time feedback and step-by-step solution breakdowns.
            </p>
          </motion.div>

          <motion.div
            onClick={() => setActiveTab('blueprint')}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
            className={`p-5 rounded-2xl cursor-pointer transition-all border ${
              activeTab === 'blueprint'
                ? 'bg-white dark:bg-[#0F1E36] border-blue-500/60 shadow-xl'
                : 'bg-slate-200/40 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-200/70 dark:hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xl">📝</span>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-base">Blueprint Notes</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-8">
              Structured, markdown-based study guides cut down fluff to focus on exam-tested mechanics.
            </p>
          </motion.div>

          <motion.div
            onClick={() => setActiveTab('diagrams')}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
            className={`p-5 rounded-2xl cursor-pointer transition-all border ${
              activeTab === 'diagrams'
                ? 'bg-white dark:bg-[#0F1E36] border-blue-500/60 shadow-xl'
                : 'bg-slate-200/40 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-200/70 dark:hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xl">🔄</span>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-base">Mermaid Flow Diagrams</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-8">
              Visual market structure flowcharts mapping out order flows, clearing, and settlement.
            </p>
          </motion.div>
        </div>

        {/* Right Browser Sandbox Window (Elevated 3D Depth Treatment) */}
        <motion.div
          whileHover={!isReduced ? { rotateY: 0, rotateX: 0, scale: 1.01 } : {}}
          transition={{ duration: DURATION_BASE, ease: EASE_OUT }}
          className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-[0_30px_70px_-15px_rgba(15,23,42,0.25)] dark:shadow-[0_35px_80px_-20px_rgba(0,0,0,0.8)] transform md:rotate-y-[-2deg] md:rotate-x-[1deg] transition-transform duration-300"
        >
          {/* Browser Header Bar */}
          <div className="bg-slate-100 dark:bg-[#0B132B] px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
            </div>
            <div className="bg-white dark:bg-slate-950/80 px-6 py-1.5 rounded-full text-xs font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800/80 shadow-inner">
              financefundamentals.app / preview / {activeTab}
            </div>
            <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hidden sm:block">
              LIVE DEMO
            </div>
          </div>

          {/* Browser Body with Smooth Tab Switch Transitions */}
          <div className="p-6 md:p-10 bg-slate-50 dark:bg-[#060B14] min-h-[360px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              
              {/* TAB 1: FLASHCARDS */}
              {activeTab === 'flashcards' && (
                <motion.div
                  key="tab-flashcards"
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -10 }}
                  transition={{ duration: DURATION_BASE, ease: EASE_OUT }}
                  className="w-full max-w-xl mx-auto"
                >
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

                  <div className="perspective-1000 min-h-[200px] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                    <motion.div
                      className="relative w-full min-h-[200px] rounded-2xl select-none"
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
                        className="absolute inset-0 w-full h-full p-8 rounded-2xl bg-blue-50/90 dark:bg-[#0F2448] border border-blue-200 dark:border-blue-500/50 text-center shadow-lg flex flex-col justify-center items-center"
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
                    <a
                      href="/topics/time-value-of-money"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg"
                    >
                      <span>Open Time Value of Money Topic</span>
                      <span>→</span>
                    </a>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: QUESTION BANK & QUIZ */}
              {activeTab === 'quiz' && (
                <motion.div
                  key="tab-quiz"
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -10 }}
                  transition={{ duration: DURATION_BASE, ease: EASE_OUT }}
                  className="w-full max-w-xl mx-auto bg-white dark:bg-[#0B172A] p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                      Derivatives Practice Quiz
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">Q3 / 5</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-4">
                    According to Put-Call Parity, if a European Call option is mispriced relative to the Put, which strategy yields riskless arbitrage?
                  </h3>

                  <div className="space-y-3 mb-5">
                    {[
                      { id: 0, text: 'Buy synthetic long futures and sell actual futures' },
                      { id: 1, text: 'Buy the underpriced option, short the overpriced option, and hedge with underlying stock' },
                      { id: 2, text: 'Sell both Call and Put options simultaneously' },
                    ].map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedQuizOption(opt.id)}
                        className={`p-3.5 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center justify-between ${
                          selectedQuizOption === opt.id
                            ? opt.id === 1
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-sm'
                              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200'
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                        }`}
                      >
                        <span>{opt.text}</span>
                        {selectedQuizOption === opt.id && (
                          <span className="font-extrabold">{opt.id === 1 ? '✓ Correct' : '✕ Incorrect'}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedQuizOption === 1 && (
                    <div className="p-3.5 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                      <strong className="block mb-1">Explanation:</strong>
                      Put-Call Parity enforces \(C + PV(K) = P + S_0\). Any deviation allows a cash-and-carry or reverse cash-and-carry arbitrage lock.
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 3: BLUEPRINT NOTES */}
              {activeTab === 'blueprint' && (
                <motion.div
                  key="tab-blueprint"
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -10 }}
                  transition={{ duration: DURATION_BASE, ease: EASE_OUT }}
                  className="w-full max-w-xl mx-auto bg-white dark:bg-[#0B172A] p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg text-left"
                >
                  <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-widest text-blue-600 dark:text-blue-400">
                        Topic Summary Notes
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        Derivatives Trading Mechanism
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
                      Intermediate
                    </span>
                  </div>

                  <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span><strong>Order Matching Engine:</strong> Uses Price-Time Priority (FIFO) matching algorithms in real-time order books.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span><strong>Clearing Corporation (NSCCL/CCIL):</strong> Novates every trade, becoming the buyer to every seller and seller to every buyer.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span><strong>SPAN Margining:</strong> Portfolio-based risk system determining initial margin based on extreme scenario matrix stress testing.</span>
                    </li>
                  </ul>
                </motion.div>
              )}

              {/* TAB 4: MERMAID DIAGRAMS */}
              {activeTab === 'diagrams' && (
                <motion.div
                  key="tab-diagrams"
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -10 }}
                  transition={{ duration: DURATION_BASE, ease: EASE_OUT }}
                  className="w-full max-w-xl mx-auto bg-white dark:bg-[#0B172A] p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg text-center"
                >
                  <span className="text-[10px] uppercase font-black tracking-widest text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800 mb-4 inline-block">
                    Visual Architecture Flowchart
                  </span>
                  
                  {/* Clean SVG Flowchart Diagram representation */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 font-mono text-xs my-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 font-bold flex-1 text-center">
                        Buyer Order
                      </div>
                      <span className="text-blue-600 font-bold">→</span>
                      <div className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 font-bold flex-1 text-center">
                        Matching Engine
                      </div>
                      <span className="text-blue-600 font-bold">←</span>
                      <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 font-bold flex-1 text-center">
                        Seller Order
                      </div>
                    </div>

                    <div className="text-center text-slate-400">↓ Order Matched & Novated</div>

                    <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 font-bold text-center">
                      Clearing House (Novation & SPAN Mark-to-Market Settlement)
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    All 23 topics feature interactive flowcharts rendered via Mermaid.js.
                  </p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default InteractiveFlashcardsPreview;
