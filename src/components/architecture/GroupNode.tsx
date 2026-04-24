import { NodeProps } from '@xyflow/react';

export const GroupNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`
      w-full h-full min-w-[200px] min-h-[200px] rounded-3xl border-2 border-dashed transition-all duration-500
      ${selected ? "border-white/40 bg-white/[0.04]" : "border-white/10 bg-white/[0.02]"}
    `}>
      <div className="absolute -top-3 left-6 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full shadow-xl">
        <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">
          {data.label}
        </span>
      </div>
    </div>
  );
};
