import { Handle, Position, NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';

export const DatabaseNode = ({ data, selected }: NodeProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className="relative group"
    >
      <Handle type="target" position={Position.Left} className="!w-1.5 !h-1.5 !bg-zinc-500 border-none" />
      
      {/* Cylinder Top */}
      <div className={`
        w-[120px] h-[30px] rounded-[100%] border-x-2 border-t-2 absolute -top-[15px] z-10 transition-all duration-300
        ${selected ? "bg-white border-white" : "bg-white/90 border-gray-200/50"}
      `} />
      
      {/* Cylinder Body */}
      <div className={`
        w-[120px] h-[80px] border-x-2 border-b-2 rounded-b-[40px] flex flex-col items-center justify-center px-4 pt-4 transition-all duration-300
        ${selected 
          ? "bg-white border-white shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)]" 
          : "bg-white/80 border-gray-200/50 shadow-sm"}
      `}>
        <span className="text-[9px] uppercase tracking-widest font-black text-zinc-400 mb-1">
          {data.type}
        </span>
        <h3 className="text-sm font-black tracking-tighter text-black text-center leading-none">
          {data.label}
        </h3>
      </div>

      <Handle type="source" position={Position.Right} className="!w-1.5 !h-1.5 !bg-zinc-500 border-none" />
    </motion.div>
  );
};
