"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SLIDES = [
  {
    id: 0,
    gradient: "linear-gradient(135deg, #1a3a14 0%, #2d5a25 40%, #385E31 70%, #4a7a3d 100%)",
    pattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    headline: "Manage Smarter,",
    subline: "Grow Faster.",
    accent: "#F7B71D",
  },
  {
    id: 1,
    gradient: "linear-gradient(135deg, #0f2d0a 0%, #1e4a17 40%, #2a5c22 70%, #385E31 100%)",
    pattern: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23F7B71D' fill-opacity='0.05' fill-rule='evenodd'%3E%3Ccircle cx='40' cy='40' r='20'/%3E%3Ccircle cx='0' cy='0' r='20'/%3E%3Ccircle cx='80' cy='0' r='20'/%3E%3Ccircle cx='0' cy='80' r='20'/%3E%3Ccircle cx='80' cy='80' r='20'/%3E%3C/g%3E%3C/svg%3E")`,
    headline: "Your Business,",
    subline: "Your Control.",
    accent: "#FFD980",
  },
  {
    id: 2,
    gradient: "linear-gradient(135deg, #243b1c 0%, #385E31 50%, #4f7a42 100%)",
    pattern: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cpolygon points='50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5' fill='none' stroke='%23ffffff' stroke-opacity='0.04' stroke-width='1'/%3E%3C/svg%3E")`,
    headline: "Every Item",
    subline: "Tracked. Trusted.",
    accent: "#F7B71D",
  },
];

const SLIDE_DURATION = 5000;

interface Props {
  /** Override the left-side headline copy per page */
  slides?: typeof SLIDES;
}

export default function SlideshowBackground({ slides = SLIDES }: Props) {
  const [current, setCurrent] = useState(0);

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
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0 z-0"
          style={{ background: slide.gradient }}
        >
          {/* Tile pattern */}
          <div
            className="absolute inset-0"
            style={{ backgroundImage: slide.pattern, backgroundRepeat: "repeat" }}
          />
          {/* Grain */}
          <div
            className="absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Left headline — desktop only */}
      <div className="absolute left-8 md:left-16 bottom-1/3 z-10 hidden md:block pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={`hl-${slide.id}`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <p
              className="font-['Fredoka'] font-bold leading-tight text-white/90"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
            >
              {slide.headline}
            </p>
            <p
              className="font-['Fredoka'] font-bold leading-tight"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", color: slide.accent }}
            >
              {slide.subline}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Dot nav */}
        <div className="flex gap-2 mt-6 pointer-events-auto">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="transition-all duration-500 rounded-full"
              style={{
                width: i === current ? "28px" : "8px",
                height: "8px",
                background: i === current ? slide.accent : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}