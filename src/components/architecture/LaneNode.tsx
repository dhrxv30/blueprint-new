import { NodeProps } from '@xyflow/react';

const laneStyles: Record<string, { color: string; bg: string; border: string }> = {
  'lane-clients': { color: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/20' },
  'lane-edge': { color: 'text-green-400', bg: 'bg-green-500/5', border: 'border-green-500/20' },
  'lane-app': { color: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/20' },
  'lane-data': { color: 'text-yellow-400', bg: 'bg-yellow-500/5', border: 'border-yellow-500/20' },
  'lane-external': { color: 'text-purple-400', bg: 'bg-purple-500/5', border: 'border-purple-500/20' },
  'lane-obs': { color: 'text-zinc-400', bg: 'bg-zinc-500/5', border: 'border-zinc-500/20' },
  'default': { color: 'text-zinc-400', bg: 'bg-zinc-500/5', border: 'border-zinc-500/20' },
};

export const LaneNode = ({ id, data, selected }: NodeProps) => {
  const style = laneStyles[id] || laneStyles.default;
  const isObs = id === 'lane-obs';

  return (
    <div className={`
      w-full h-full rounded-[2rem] border-2 transition-all duration-500 flex flex-col overflow-hidden
      ${style.bg} ${style.border} ${selected ? "ring-2 ring-white/20" : ""}
    `}>
      <div className={`px-6 py-4 border-b ${style.border} flex items-center justify-center bg-black/40`}>
        <span className={`text-xs font-black uppercase tracking-[0.3em] ${style.color}`}>
          {data.label as string}
        </span>
      </div>
      <div className="flex-1" />
    </div>
  );
};
