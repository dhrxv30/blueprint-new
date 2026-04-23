import { motion } from "framer-motion";

const graphNodes = [
  { id: "api", label: "API Gateway", x: 50, y: 20, active: true },
  { id: "auth", label: "AuthService", x: 20, y: 45, active: true },
  { id: "db", label: "Database", x: 50, y: 70, active: false },
  { id: "cache", label: "CacheLayer", x: 80, y: 45, active: false },
  { id: "queue", label: "Queue", x: 15, y: 75, active: true },
  { id: "worker", label: "Worker", x: 85, y: 75, active: false },
  { id: "storage", label: "Storage", x: 50, y: 95, active: false },
  { id: "cdn", label: "CDN", x: 80, y: 15, active: false },
];

const graphEdges = [
  { from: "api", to: "auth" },
  { from: "api", to: "cache" },
  { from: "api", to: "cdn" },
  { from: "auth", to: "db" },
  { from: "auth", to: "queue" },
  { from: "cache", to: "db" },
  { from: "queue", to: "worker" },
  { from: "worker", to: "storage" },
  { from: "db", to: "storage" },
];

function getNodePos(id: string) {
  const node = graphNodes.find((n) => n.id === id);
  return node ? { x: node.x, y: node.y } : { x: 50, y: 50 };
}

export default function DependencyGraphVisual() {
  return (
    <div className="relative w-full h-full min-h-[400px]">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Edges */}
        {graphEdges.map((edge, i) => {
          const from = getNodePos(edge.from);
          const to = getNodePos(edge.to);
          const fromNode = graphNodes.find((n) => n.id === edge.from);
          const toNode = graphNodes.find((n) => n.id === edge.to);
          const isActive = fromNode?.active && toNode?.active;
          return (
            <motion.line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={isActive ? "hsl(var(--accent-orange))" : "hsl(var(--border-default))"}
              strokeWidth="0.3"
              strokeDasharray={isActive ? "2 2" : "0"}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: isActive ? 0.8 : 0.3 }}
              transition={{ duration: 1, delay: i * 0.1 }}
              className={isActive ? "animate-dash-flow" : ""}
            />
          );
        })}

        {/* Nodes */}
        {graphNodes.map((node, i) => (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
          >
            <rect
              x={node.x - 8}
              y={node.y - 3}
              width="16"
              height="6"
              rx="1"
              fill={node.active ? "hsl(var(--accent-orange) / 0.15)" : "hsl(var(--bg-elevated))"}
              stroke={node.active ? "hsl(var(--accent-orange))" : "hsl(var(--border-default))"}
              strokeWidth="0.3"
            />
            <text
              x={node.x}
              y={node.y + 0.8}
              textAnchor="middle"
              fill={node.active ? "hsl(var(--accent-orange))" : "hsl(var(--text-secondary))"}
              fontSize="2"
              fontFamily="JetBrains Mono, monospace"
            >
              {node.label}
            </text>
            {node.active && (
              <circle
                cx={node.x + 7}
                cy={node.y - 2}
                r="0.8"
                fill="hsl(var(--accent-orange))"
                className="animate-pulse-dot"
              />
            )}
          </motion.g>
        ))}
      </svg>

      {/* Gradient overlay at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-canvas to-transparent pointer-events-none" />
    </div>
  );
}
