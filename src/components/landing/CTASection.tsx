// src/components/landing/CTASection.tsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom"; // Added Link

export default function CTASection() {
  return (
    <section className="py-32 bg-canvas bg-grid-pattern relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-accent-orange/5 blur-[120px]" />
      </div>

      <div className="relative max-w-[1280px] mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-satoshi text-5xl md:text-6xl font-bold tracking-tight text-white"
        >
          Stop planning. Start shipping.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-6 text-xl text-muted-foreground max-w-xl mx-auto font-medium leading-relaxed"
        >
          Upload your first PRD and get a complete engineering plan in under two minutes.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-8 flex justify-center gap-4"
        >
          {/* WIRED LINKS INSTEAD OF DEAD <a> TAGS */}
          <Link
            to="/auth"
            className="px-8 py-3 inline-flex items-center justify-center rounded-full bg-primary text-white font-semibold hover:scale-[1.02] hover:brightness-110 transition-all shadow-lg glow-orange"
          >
            Get Started Free
          </Link>
          <Link
            to="/demo"
            className="px-8 py-3 inline-flex items-center justify-center rounded-full border border-border text-white font-semibold hover:bg-overlay transition-all"
          >
            View Demo
          </Link>
        </motion.div>
      </div>
    </section>
  );
}