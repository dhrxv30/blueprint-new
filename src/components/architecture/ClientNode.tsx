import { Handle, Position, NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { Monitor } from 'lucide-react';

export const ClientNode = ({ data, selected }: NodeProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`
        relative min-w-[180px] backdrop-blur-md border transition-all duration-300 rounded-full px-6 py-4 flex items-center gap-4
        ${selected 
          ? "bg-white/95 border-white shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)]" 
          : "bg-white/80 border-gray-200/50 shadow-sm"}
      `}
    >
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center
        ${selected ? "bg-black text-white" : "bg-zinc-100 text-black"}
      `}>
        <Monitor className="w-5 h-5" />
      </div>

      <div className="flex flex-col">
        <span className="text-[9px] uppercase tracking-widest font-black text-zinc-400">
          {data.type}
        </span>
        <h3 className="text-md font-bold tracking-tighter text-black leading-none">
          {data.label}
        </h3>
      </div>

      <Handle type="source" position={Position.Right} className="!w-1.5 !h-1.5 !bg-zinc-500 border-none" />
    </motion.div>
  );
};
