// src/components/landing/Hero.tsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import DependencyGraph3D from "./DependencyGraph3D";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-canvas bg-grid-pattern overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 w-screen h-screen z-0 opacity-60">
        <DependencyGraph3D />
      </div>

      {/* Foreground Text */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pointer-events-none w-full max-w-5xl">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-satoshi text-6xl md:text-8xl tracking-tighter text-white leading-tight font-bold">
          Architecture
          <br />
          begins <span className="text-gray-500">here.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-6 max-w-2xl text-lg md:text-xl text-gray-400 leading-relaxed font-medium">
          Upload any PRD. Blueprint extracts requirements, generates tasks, designs
          architecture, and scaffolds your codebase before your first standup.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 flex gap-4 pointer-events-auto">

          <Link
            to="/auth"
            className="px-8 py-3 rounded-full bg-primary text-white font-semibold hover:scale-[1.02] hover:brightness-110 transition-all glow-orange">
            Upload PRD
          </Link>
          <Link
            to="/demo"
            className="px-8 py-3 rounded-full border border-border text-white font-semibold hover:bg-overlay transition-all">
            View Demo
          </Link>
        </motion.div>
      </div>

      {/* Bottom gradient fade for smooth transition to next section */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-canvas to-transparent pointer-events-none z-10" />
    </section>);

}