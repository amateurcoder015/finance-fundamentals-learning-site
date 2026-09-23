import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { EASE_OUT, DURATION_BASE, DURATION_SLOW, getReducedMotion } from '../lib/motion';

interface HeroLayeredCompositionProps {
  categories: string[];
}

export const HeroLayeredComposition: React.FC<HeroLayeredCompositionProps> = ({ categories }) => {
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);
  const [activeQuizOption, setActiveQuizOption] = useState<number | null>(1);
  const [isReduced, setIsReduced] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse position spring motion for 3D parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // Parallax transforms per layer
  const bgTranslateX = useTransform(smoothMouseX, [-0.5, 0.5], [-12, 12]);
  const bgTranslateY = useTransform(smoothMouseY, [-0.5, 0.5], [-12, 12]);

  const midTranslateX = useTransform(smoothMouseX, [-0.5, 0.5], [-6, 6]);
  const midTranslateY = useTransform(smoothMouseY, [-0.5, 0.5], [-6, 6]);

  const fgTranslateX = useTransform(smoothMouseX, [-0.5, 0.5], [14, -14]);
  const fgTranslateY = useTransform(smoothMouseY, [-0.5, 0.5], [14, -14]);

  const card2TranslateX = useTransform(smoothMouseX, [-0.5, 0.5], [20, -20]);
  const card2TranslateY = useTransform(smoothMouseY, [-0.5, 0.5], [20, -20]);

  useEffect(() => {
    setIsReduced(getReducedMotion());
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReduced || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full overflow-hidden pt-6 pb-16 md:pt-12 md:pb-24 px-4 sm:px-6 lg:px-8"
    >
      {/* ==========================================
          PLANE 1: AMBIENT GRADIENT MESH (BACKGROUND)
         ========================================== */}
      <motion.div
        style={{
          x: isReduced ? 0 : bgTranslateX,
          y: isReduced ? 0 : bgTranslateY,
        }}
        className="absolute inset-0 pointer-events-none overflow-hidden -z-10"
      >
        {/* Primary soft blue glow mesh */}
        <motion.div
          animate={
            !isReduced
              ? {
                  scale: [1, 1.15, 1],
                  opacity: [0.4, 0.65, 0.4],
                  rotate: [0, 15, 0],
                }
              : {}
          }
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-24 -left-20 w-[450px] sm:w-[600px] h-[450px] sm:h-[600px] rounded-full bg-gradient-to-tr from-blue-600/30 via-indigo-500/20 to-sky-400/20 blur-[100px] dark:from-blue-600/40 dark:via-indigo-600/30 dark:to-cyan-500/20"
        />

        {/* Secondary warm accent highlight blob */}
        <motion.div
          animate={
            !isReduced
              ? {
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                  rotate: [0, -20, 0],
                }
              : {}
          }
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-1/3 -right-20 w-[400px] sm:w-[550px] h-[400px] sm:h-[550px] rounded-full bg-gradient-to-bl from-cyan-400/25 via-blue-500/20 to-indigo-600/20 blur-[110px] dark:from-sky-500/30 dark:via-blue-700/25 dark:to-indigo-900/30"
        />
      </motion.div>

      {/* Main Grid Container for Asymmetric Composition */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        
        {/* ==========================================
            PLANE 2: MIDGROUND HEADLINE & CONTENT (LEFT)
           ========================================== */}
        <motion.div
          style={{
            x: isReduced ? 0 : midTranslateX,
            y: isReduced ? 0 : midTranslateY,
          }}
          className="lg:col-span-6 space-y-6 text-left z-10"
        >
          {/* Top Category Tag Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200/80 dark:border-blue-800/80 shadow-sm text-blue-700 dark:text-blue-300 text-xs font-extrabold tracking-wide uppercase">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>Interactive Finance Learning Platform</span>
          </div>

          {/* Large Confident Asymmetric Display Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[76px] font-black tracking-tight text-slate-900 dark:text-white leading-[1.02]">
            Make Finance <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 dark:from-blue-400 dark:via-indigo-300 dark:to-sky-400">
              feel simple.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 font-medium max-w-xl leading-relaxed">
            Master core financial markets, valuation models, derivatives, and portfolio theory through structured interactive notes and practice cards.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="#topics-grid"
              className="px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/35 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
            >
              <span>Explore 23 Topics</span>
              <span>↓</span>
            </a>

            <a
              href="/topics/time-value-of-money"
              className="px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-bold text-sm shadow-sm hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 flex items-center gap-2"
            >
              <span>Try Interactive Lesson</span>
              <span>→</span>
            </a>
          </div>

          {/* Quick Metrics Strip */}
          <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center gap-8 text-xs font-bold text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-base text-blue-600 dark:text-blue-400">✦</span>
              <span>8 Core Domains</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base text-blue-600 dark:text-blue-400">⚡</span>
              <span>Interactive Quizzes & Flashcards</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base text-blue-600 dark:text-blue-400">🎯</span>
              <span>No Textbook Fluff</span>
            </div>
          </div>
        </motion.div>

        {/* ==========================================
            PLANE 3 & 4: FOREGROUND LAYERED TILTED CARDS & SHOWCASE BADGES (RIGHT)
           ========================================== */}
        <div className="lg:col-span-6 relative mt-8 lg:mt-0 min-h-[440px] sm:min-h-[500px] flex items-center justify-center">
          
          {/* --- DESIGN SHOWCASE DECORATIVE BADGE 1: "LAYERS PANEL" (Top-Left Floating) --- */}
          <motion.div
            style={{
              x: isReduced ? 0 : bgTranslateX,
              y: isReduced ? 0 : bgTranslateY,
            }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="absolute -top-4 sm:-top-6 left-0 sm:left-4 z-30 hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-lg text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300"
          >
            <div className="flex flex-col gap-1 pr-2 border-r border-slate-200 dark:border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-sans tracking-widest font-black">Composition</div>
              <div className="text-slate-900 dark:text-white font-sans font-extrabold">Depth Planes (3D)</div>
            </div>
          </motion.div>

          {/* --- CARD 2 (SECONDARY BACK CARD - Rotated ~ -10deg) --- */}
          <motion.div
            style={{
              x: isReduced ? 0 : card2TranslateX,
              y: isReduced ? 0 : card2TranslateY,
            }}
            initial={isReduced ? {} : { opacity: 0, rotate: -16, scale: 0.85 }}
            animate={isReduced ? {} : { opacity: 1, rotate: -10, scale: 0.94 }}
            whileHover={
              !isReduced
                ? {
                    scale: 0.99,
                    rotate: -3,
                    y: -10,
                    boxShadow: '0 30px 60px -12px rgba(15,23,42,0.35)',
                    transition: { duration: DURATION_BASE, ease: EASE_OUT },
                  }
                : {}
            }
            transition={{ duration: DURATION_SLOW, ease: EASE_OUT }}
            className="absolute top-8 left-2 sm:left-6 sm:top-12 z-10 w-[290px] sm:w-[350px] bg-white dark:bg-[#0B172A] rounded-2xl p-5 border border-slate-200 dark:border-slate-800/90 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.2)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)] cursor-pointer select-none"
          >
            {/* Badge overlay on Card 2 */}
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-mono font-bold">
              DEPTH LAYER 2
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
                Derivatives · Options
              </span>
              <span className="text-xs text-slate-400 font-mono">Q2 / 10</span>
            </div>

            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              What does Option Delta (Δ) measure?
            </h4>

            {/* Interactive Options list */}
            <div className="space-y-2 mb-3">
              <div
                onClick={() => setActiveQuizOption(0)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                  activeQuizOption === 0
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>Rate of time decay (Theta)</span>
                {activeQuizOption === 0 && <span>✕</span>}
              </div>

              <div
                onClick={() => setActiveQuizOption(1)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                  activeQuizOption === 1
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>Price sensitivity to underlying asset</span>
                {activeQuizOption === 1 && <span>✓</span>}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Tap option to test</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">Interactive Quiz →</span>
            </div>
          </motion.div>

          {/* --- CARD 1 (PRIMARY TOP CARD - Rotated ~ +14deg, Overlapping Card 2) --- */}
          <motion.div
            style={{
              x: isReduced ? 0 : fgTranslateX,
              y: isReduced ? 0 : fgTranslateY,
            }}
            initial={isReduced ? {} : { opacity: 0, rotate: 20, scale: 0.9 }}
            animate={isReduced ? {} : { opacity: 1, rotate: 14, scale: 1 }}
            whileHover={
              !isReduced
                ? {
                    scale: 1.05,
                    rotate: 4,
                    y: -12,
                    boxShadow: '0 35px 70px -15px rgba(29,78,216,0.35)',
                    transition: { duration: DURATION_BASE, ease: EASE_OUT },
                  }
                : {}
            }
            transition={{ duration: DURATION_SLOW, ease: EASE_OUT, delay: 0.1 }}
            className="relative z-20 w-[300px] sm:w-[360px] bg-white dark:bg-[#0F1E36] rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-blue-500/40 shadow-[0_25px_60px_-15px_rgba(29,78,216,0.25)] dark:shadow-[0_25px_60px_-15px_rgba(30,58,138,0.5)] cursor-pointer select-none"
            onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
          >
            {/* Design Showcase Floating Badge "ROTATE 14°" */}
            <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-mono font-black shadow-md tracking-wider">
              ROTATE 14°
            </div>

            {/* Design Showcase Floating Pill "On Hover Grow" */}
            <div className="absolute -bottom-4 -left-4 z-30 px-3.5 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-extrabold shadow-xl flex items-center gap-1.5 border border-slate-700 dark:border-slate-200">
              <span className="animate-spin text-blue-400 dark:text-blue-600">✦</span>
              <span>On Hover Grow & Straighten</span>
            </div>

            {/* Card Content Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Corporate Finance
              </span>
              <span className="text-xs font-bold text-slate-400">Card 1 / 5</span>
            </div>

            {/* Flip Container */}
            <div className="perspective-1000 min-h-[160px] flex flex-col justify-center items-center text-center">
              <AnimatePresence mode="wait">
                {!isFlashcardFlipped ? (
                  <motion.div
                    key="front"
                    initial={{ opacity: 0, rotateY: -90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    exit={{ opacity: 0, rotateY: 90 }}
                    transition={{ duration: DURATION_BASE }}
                    className="w-full"
                  >
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500 mb-2 block">
                      Core Concept
                    </span>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
                      What is the Time Value of Money (TVM) core rule?
                    </h3>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-4 font-bold flex items-center justify-center gap-1">
                      <span>Click card to flip answer</span>
                      <span>↺</span>
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="back"
                    initial={{ opacity: 0, rotateY: 90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    exit={{ opacity: 0, rotateY: -90 }}
                    transition={{ duration: DURATION_BASE }}
                    className="w-full bg-blue-50/80 dark:bg-blue-950/60 p-4 rounded-2xl border border-blue-200 dark:border-blue-800"
                  >
                    <span className="text-[10px] uppercase font-black tracking-widest text-blue-700 dark:text-blue-300 mb-2 block">
                      Answer
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                      A dollar today is worth more than a dollar in the future due to its capacity to earn interest.
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 italic">Click to flip back ↺</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* --- DESIGN SHOWCASE DECORATIVE BADGE 3: Floating Category Chip (Bottom Right) --- */}
          <motion.div
            style={{
              x: isReduced ? 0 : fgTranslateX,
              y: isReduced ? 0 : fgTranslateY,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="absolute -bottom-6 right-0 sm:right-6 z-30 hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <span className="text-base">💎</span>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">New Category</div>
              <div className="font-extrabold text-blue-600 dark:text-blue-400">Alternative Investments</div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* ==========================================
          CATEGORY FILTER BAR (Positioned below Hero)
         ========================================== */}
      <div className="max-w-7xl mx-auto mt-14 pt-8 border-t border-slate-200/80 dark:border-slate-800/80" id="topics-grid">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 dark:text-slate-500">
            Browse Knowledge Domains
          </h3>
          <span className="text-xs font-semibold text-slate-500">8 Categories Available</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-5 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black shadow-md">
            All Domains
          </span>
          {categories.map((cat) => (
            <a
              key={cat}
              href={`/categories/${cat.toLowerCase().replace(/\s+/g, '-')}`}
              className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all hover:scale-[1.02] border border-slate-200/60 dark:border-slate-700/60"
            >
              {cat}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroLayeredComposition;
