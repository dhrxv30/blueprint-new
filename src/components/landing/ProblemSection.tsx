import { motion } from "framer-motion";

const timeline = [
  { week: "Week 1", text: "Someone reads the PRD.", crossed: true },
  { week: "Week 1.5", text: "Someone re-reads the PRD.", crossed: true },
  { week: "Week 2", text: "A Notion doc gets created.", crossed: true },
  { week: "Week 2.5", text: "The Notion doc is already wrong.", crossed: true },
  { week: "Week 3", text: "Planning poker. 13 points. Nobody agrees.", crossed: true },
  { week: "Week 4", text: "Development starts. With the wrong assumptions.", crossed: true },
];

export default function ProblemSection() {
  return (
    <section className="relative bg-canvas py-24 lg:py-0">
      <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start relative">
        
        {/* Left — sticky copy */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:sticky lg:top-1/3 lg:h-screen lg:flex lg:flex-col lg:justify-start lg:pt-[20vh]"
        >
          <h2 className="font-satoshi text-5xl md:text-6xl text-white font-bold tracking-tighter leading-tight">
            The ritual no one
            <br />
            talks about.
          </h2>
          <p className="mt-6 text-lg md:text-xl text-gray-400 leading-relaxed max-w-md font-medium">
            Every engineering team loses the first month to requirements
            archaeology. Digging through ambiguous docs. Debating scope that
            was never defined. Building features no one asked for.
          </p>
          <p className="mt-4 text-lg md:text-xl text-gray-400 leading-relaxed max-w-md font-medium">
            Blueprint reads your PRD in seconds. Finds every gap, every
            ambiguity, every missing edge case and turns it into a
            structured execution plan your team can ship from day one.
          </p>
        </motion.div>

        {/* Right — scrolling crossed-out timeline */}
        <div className="space-y-32 py-12 lg:py-[40vh] pl-0 lg:pl-12">
          {timeline.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="flex items-baseline gap-6 group"
            >
              <span className="text-sm text-gray-500 font-mono w-24 flex-shrink-0 font-semibold tracking-wider uppercase">
                {item.week}
              </span>
              <div className="flex-1">
                <motion.span 
                  initial={{ backgroundSize: "0% 100%" }}
                  whileInView={{ backgroundSize: "100% 100%" }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                  className="text-2xl md:text-4xl font-bold text-white tracking-tight leading-tight text-strike-animated inline"
                >
                  {item.text}
                </motion.span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
