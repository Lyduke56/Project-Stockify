"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SLIDES = [
  {
    id: 0,
    gradient: "linear-gradient(135deg, var(--color-secondary, #2A4725) 0%, var(--color-primary, #385E31) 100%)",
    pattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    headline: "Manage Smarter,",
    subline: "Grow Faster.",
    accent: "var(--color-accent, #E5AC24)",
  },
  {
    id: 1,
    gradient: "linear-gradient(135deg, var(--color-primary, #385E31) 0%, var(--color-secondary, #2A4725) 100%)",
    pattern: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23E5AC24' fill-opacity='0.25' fill-rule='evenodd'%3E%3Ccircle cx='40' cy='40' r='20'/%3E%3Ccircle cx='0' cy='0' r='20'/%3E%3Ccircle cx='80' cy='0' r='20'/%3E%3Ccircle cx='0' cy='80' r='20'/%3E%3Ccircle cx='80' cy='80' r='20'/%3E%3C/g%3E%3C/svg%3E")`,
    headline: "Your Business,",
    subline: "Your Control.",
    accent: "var(--color-accent, #E5AC24)",
  },
  {
    id: 2,
    gradient: "linear-gradient(135deg, var(--color-secondary, #2A4725) 50%, var(--color-primary, #385E31) 100%)",
    pattern: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cpolygon points='50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5' fill='none' stroke='%23ffffff' stroke-opacity='0.25' stroke-width='1'/%3E%3C/svg%3E")`,
    headline: "Every Item",
    subline: "Tracked. Trusted.",
    accent: "var(--color-accent, #E5AC24)",
  },
];

const SLIDE_DURATION = 5000;
const easeOutQuint: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface Props {
  /** Override the left-side headline copy per page */
  slides?: typeof SLIDES;
}

export default function SlideshowBackground({ slides = SLIDES }: Props) {
  const [current, setCurrent] = useState(0);
  const [isFirstSlide, setIsFirstSlide] = useState(true);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsFirstSlide(false));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setCurrent((p) => (p + 1) % slides.length), SLIDE_DURATION);
    return () => clearInterval(id);
  }, [slides.length]);

  const slide = slides[current];

  return (
    <>
      {/* Animated layer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: isFirstSlide ? 0 : 0.5,
            ease: "easeOut",
          }}
          className="absolute inset-0 z-0"
          style={{ background: slide.gradient }}
        >
          {/* Noise texture overlay */}
          <div
            className="absolute inset-0 opacity-20 mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
          <div
            className="absolute inset-0"
            style={{ backgroundImage: slide.pattern, backgroundRepeat: "repeat" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Left headline — desktop only */}
      <div className="absolute left-8 md:left-[8%] lg:left-[10%] bottom-[20%] z-10 hidden md:block max-w-[50%] pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={`headline-${slide.id}`}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.65, ease: easeOutQuint, delay: 0.15 }}
          >
            <h2
              className="font-['Fredoka'] font-bold leading-[1.1] text-white tracking-wide drop-shadow-lg"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}
            >
              {slide.headline}
            </h2>
            <h2
              className="font-['Fredoka'] font-bold leading-[1.1] drop-shadow-lg"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", color: slide.accent }}
            >
              {slide.subline}
            </h2>
          </motion.div>
        </AnimatePresence>

        {/* Dot nav */}
        <div className="flex gap-3 mt-8 pointer-events-auto">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="transition-all duration-700 ease-in-out rounded-full"
              style={{
                width: i === current ? "36px" : "10px",
                height: "10px",
                background: i === current ? slide.accent : "rgba(255,255,255,0.3)",
                boxShadow: i === current ? `0 0 12px ${slide.accent}80` : "none",
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}