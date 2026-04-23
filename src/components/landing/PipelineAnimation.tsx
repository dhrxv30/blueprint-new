import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const steps = [
  { label: "Upload PRD", desc: "Drop your document" },
  { label: "Parse", desc: "Extract structure" },
  { label: "Analyze", desc: "Identify requirements" },
  { label: "Clarify", desc: "Resolve ambiguities" },
  { label: "Generate", desc: "Create tasks & code" },
  { label: "Plan", desc: "Organize sprints" },
  { label: "Ship", desc: "Deploy with confidence" },
];

export default function PipelineAnimation() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 bg-surface">
      <div className="max-w-[1280px] mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-satoshi text-5xl font-bold tracking-tight text-foreground text-center"
        >
          From document to deployment
        </motion.h2>
        <p className="mt-4 text-center text-muted-foreground text-xl font-medium max-w-xl mx-auto">
          Seven stages. Zero standups wasted.
        </p>

        <div className="mt-16 flex items-start justify-between gap-2 overflow-x-auto pb-4">
          {steps.map((step, i) => {
            const isActive = i === activeStep;
            const isDone = i < activeStep;

            return (
              <div key={step.label} className="flex items-start flex-1 min-w-[120px]">
                <div className="flex flex-col items-center w-full">
                  {/* Chip */}
                  <motion.div
                    animate={{
                      scale: isActive ? 1.08 : 1,
                      borderColor: isActive
                        ? "hsl(var(--accent-orange))"
                        : isDone
                        ? "hsl(var(--accent-green))"
                        : "hsl(var(--border-default))",
                    }}
                    transition={{ duration: 0.3 }}
                    className="relative flex items-center justify-center w-12 h-12 rounded-xl border-2 bg-elevated"
                  >
                    {isDone ? (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M4 9l3.5 3.5L14 5" stroke="hsl(var(--accent-green))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <span
                        className={`text-label-sm font-mono font-bold ${
                          isActive ? "text-accent-orange" : "text-text-muted"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    )}

                    {isActive && (
                      <motion.div
                        layoutId="pipeline-glow"
                        className="absolute inset-0 rounded-xl"
                        style={{
                          boxShadow: "0 0 24px hsl(var(--accent-orange) / 0.25)",
                        }}
                      />
                    )}
                  </motion.div>

                  {/* Label */}
                  <span
                    className={`mt-3 text-sm font-bold text-center uppercase tracking-wider ${
                      isActive ? "text-accent-orange" : isDone ? "text-accent-green" : "text-text-muted"
                    }`}
                  >
                    {step.label}
                  </span>

                  {/* Description */}
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 4 }}
                    className="mt-1 text-sm text-text-secondary font-medium text-center"
                  >
                    {step.desc}
                  </motion.span>
                </div>

                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="flex-shrink-0 mt-6 w-full max-w-[40px] h-[2px] mx-1">
                    <div
                      className={`h-full rounded-full transition-colors duration-300 ${
                        isDone ? "bg-accent-green" : isActive ? "bg-accent-orange" : "bg-border"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
