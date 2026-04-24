import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';

export const CustomNode = ({ data, selected }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`
        relative min-w-[220px] backdrop-blur-md border transition-all duration-300 rounded-2xl px-6 py-5
        ${selected 
          ? "bg-white/95 border-white shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)] ring-1 ring-white/50" 
          : "bg-white/80 border-gray-200/50 shadow-sm hover:border-white/80"}
      `}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-1.5 !h-1.5 !bg-zinc-500 border-none transition-opacity" 
      />
      
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-400">
            {data.type}
          </span>
          <div className={`w-2 h-2 rounded-full ${selected ? "bg-black animate-pulse" : "bg-zinc-200"}`} />
        </div>
        
        <h3 className="text-xl font-bold tracking-tighter text-black leading-none mb-2">
          {data.label}
        </h3>
        
        <p className="text-[11px] text-zinc-500 font-medium leading-relaxed line-clamp-2">
          {data.description}
        </p>
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-1.5 !h-1.5 !bg-zinc-500 border-none transition-opacity" 
      />
    </motion.div>
  );
};
