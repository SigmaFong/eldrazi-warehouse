interface BarChartItem {
  label: string;
  value: number;
  max: number;
}

interface BarChartProps {
  title: string;
  items: BarChartItem[];
}

export function BarChart({ title, items }: BarChartProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div
        className="font-bold text-zinc-200 text-sm mb-5 tracking-wide"
        style={{ fontFamily: "'Cinzel Decorative', serif" }}
      >
        {title}
      </div>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.label} className="flex items-center gap-3">
            <div className="w-36 truncate text-xs text-zinc-400 flex-shrink-0">{item.label}</div>
            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-700 to-violet-400"
                style={{ width: `${(item.value / item.max) * 100}%` }}
              />
            </div>
            <div className="w-8 text-right font-mono text-[11px] text-zinc-500">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
