import { Handle, Position, NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { 
  Monitor, Smartphone, Code2, Cloud, Globe, 
  Network, ShieldCheck, LayoutGrid, Server, 
  Database, Zap, Archive, MessageSquareShare,
  Activity, BarChart3, LineChart, Bell, Settings2
} from 'lucide-react';

const iconMap: Record<string, any> = {
  web: Monitor,
  mobile: Smartphone,
  api: Code2,
  external: Cloud,
  dns: Globe,
  lb: Network,
  waf: ShieldCheck,
  gateway: LayoutGrid,
  service: Server,
  database: Database,
  cache: Zap,
  storage: Archive,
  broker: MessageSquareShare,
  logging: BarChart3,
  metrics: LineChart,
  alert: Bell,
  config: Settings2,
  default: Server
};

const typeColors: Record<string, string> = {
  database: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  cache: 'text-red-400 bg-red-500/10 border-red-500/20',
  storage: 'text-green-400 bg-green-500/10 border-green-500/20',
  service: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  external: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  gateway: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  default: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
};

export const UnifiedNode = ({ data, selected }: NodeProps) => {
  const type = (data.type as string)?.toLowerCase();
  const Icon = iconMap[type] || iconMap.default;
  const colors = typeColors[type] || typeColors.default;
  const isCylinder = data.type === 'database' || data.type === 'cache';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative group"
    >
      <Handle type="target" position={Position.Left} className="!w-1.5 !h-1.5 !bg-zinc-600 border-none opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className={`
        min-w-[140px] px-4 py-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all duration-300
        ${selected ? "border-white bg-white shadow-[0_0_30px_rgba(255,255,255,0.3)]" : "border-white/10 bg-zinc-950"}
      `}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selected ? "bg-black text-white" : colors}`}>
          <Icon className="w-6 h-6" />
        </div>
        
        <div className="text-center">
          <h3 className={`text-[11px] font-black tracking-tight leading-tight uppercase ${selected ? "text-black" : "text-white"}`}>
            {data.label as string}
          </h3>
          {(data.tech || data.type) && (
            <div className={`
              mt-1.5 px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest inline-block
              ${selected ? "bg-black/10 text-black" : "bg-white/5 text-zinc-500 border border-white/10"}
            `}>
              {(data.tech as string) || (data.type as string)}
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!w-1.5 !h-1.5 !bg-zinc-600 border-none opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
};
