import { motion } from "framer-motion";

const features = [
  {
    name: "PRD Intelligence",
    desc: "Parses and structures any product requirement document automatically.",
    output: "→ analysis.json",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="6" y="4" width="20" height="24" rx="2" />
        <line x1="10" y1="10" x2="22" y2="10" />
        <line x1="10" y1="14" x2="18" y2="14" />
        <line x1="10" y1="18" x2="20" y2="18" />
      </svg>
    ),
  },
  {
    name: "Requirement Clarification",
    desc: "Interactive chat to resolve ambiguities before a single line of code.",
    output: "→ clarifications.md",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 8h14v10H10l-4 4V8z" />
        <path d="M12 18h14v10H16l-4 4V18z" opacity="0.5" />
      </svg>
    ),
  },
  {
    name: "Task Generator",
    desc: "Converts user stories into granular, estimable development tasks.",
    output: "→ tasks.json",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="6" y="6" width="8" height="8" rx="1" />
        <rect x="18" y="6" width="8" height="8" rx="1" />
        <rect x="6" y="18" width="8" height="8" rx="1" />
        <rect x="18" y="18" width="8" height="8" rx="1" opacity="0.5" />
      </svg>
    ),
  },
  {
    name: "Sprint Planner",
    desc: "Distributes tasks into balanced sprints based on priority and capacity.",
    output: "→ sprints.json",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="8" y1="8" x2="8" y2="24" />
        <line x1="16" y1="8" x2="16" y2="24" />
        <line x1="24" y1="8" x2="24" y2="24" />
        <rect x="6" y="10" width="4" height="6" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="14" y="14" width="4" height="4" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="22" y="12" width="4" height="8" rx="1" fill="currentColor" opacity="0.3" />
      </svg>
    ),
  },
  {
    name: "Architecture Builder",
    desc: "Generates system, API flow, and database diagrams from requirements.",
    output: "→ architecture.mmd",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="16" cy="8" r="4" />
        <circle cx="8" cy="24" r="4" />
        <circle cx="24" cy="24" r="4" />
        <line x1="14" y1="12" x2="10" y2="20" />
        <line x1="18" y1="12" x2="22" y2="20" />
      </svg>
    ),
  },
  {
    name: "Traceability Graph",
    desc: "Maps every requirement to its stories, tasks, endpoints, and tests.",
    output: "→ trace.json",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="16" r="3" />
        <circle cx="16" cy="8" r="3" />
        <circle cx="24" cy="16" r="3" />
        <circle cx="16" cy="24" r="3" />
        <line x1="10.5" y1="14.5" x2="13.5" y2="10.5" />
        <line x1="18.5" y1="10.5" x2="21.5" y2="14.5" />
        <line x1="21.5" y1="17.5" x2="18.5" y2="21.5" />
        <line x1="13.5" y1="21.5" x2="10.5" y2="17.5" />
      </svg>
    ),
  },
  {
    name: "Code Generator",
    desc: "Scaffolds typed controllers, routes, models, and services.",
    output: "→ schema.prisma",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="12,8 6,16 12,24" />
        <polyline points="20,8 26,16 20,24" />
        <line x1="18" y1="6" x2="14" y2="26" opacity="0.5" />
      </svg>
    ),
  },
  {
    name: "Testing Engine",
    desc: "Generates functional, edge case, and negative test suites.",
    output: "→ tests.json",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 4v6l-4 4v10a4 4 0 004 4h8a4 4 0 004-4V14l-4-4V4" />
        <line x1="10" y1="4" x2="22" y2="4" />
      </svg>
    ),
  },
  {
    name: "DevOps Automation",
    desc: "Pushes scaffolded code to GitHub and syncs tasks to project tools.",
    output: "→ Dockerfile",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="16" cy="16" r="10" />
        <path d="M16 6v20" />
        <path d="M6 16h20" />
        <path d="M9 9l14 14" opacity="0.3" />
      </svg>
    ),
  },
  {
    name: "PRD Health Score",
    desc: "Quantifies document quality across completeness and clarity axes.",
    output: "→ 82/100",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 4l3.09 6.26L26 11.27l-5 4.87 1.18 6.88L16 19.77l-6.18 3.25L11 16.14l-5-4.87 6.91-1.01L16 4z" />
      </svg>
    ),
  },
  {
    name: "Ambiguity Detection",
    desc: "Flags vague, contradictory, or undefined requirements in your PRD.",
    output: "→ 7 flagged",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 4L4 28h24L16 4z" />
        <line x1="16" y1="14" x2="16" y2="20" />
        <circle cx="16" cy="23" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "Missing Req Finder",
    desc: "Identifies requirements that should exist but weren't documented.",
    output: "→ 3 missing",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="14" cy="14" r="8" />
        <line x1="20" y1="20" x2="28" y2="28" />
        <line x1="12" y1="14" x2="16" y2="14" />
      </svg>
    ),
  },
];

export default function FeatureGrid() {
  return (
    <section className="py-32 bg-canvas bg-grid-pattern">
      <div className="max-w-[1280px] mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-satoshi text-5xl font-bold tracking-tight text-foreground text-center"
        >
          Everything your PRD is missing
        </motion.h2>
        <p className="mt-4 text-center text-muted-foreground text-xl max-w-xl mx-auto font-medium">
          Twelve tools that turn ambiguous requirements into executable engineering plans.
        </p>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="group p-10 rounded-2xl border border-border bg-card hover:border-border-emphasis hover:shadow-[0_0_30px_rgba(255,69,0,0.1)] transition-all duration-300"
            >
              <div className="text-text-secondary group-hover:text-accent-orange transition-colors mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-foreground font-satoshi">
                {feature.name}
              </h3>
              <p className="mt-3 text-base text-muted-foreground font-medium leading-relaxed">
                {feature.desc}
              </p>
              <span className="mt-6 inline-block text-sm font-bold font-mono text-text-code uppercase tracking-wider group-hover:text-accent-orange transition-colors">
                {feature.output}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
