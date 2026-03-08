import type { ReactNode } from "react";

interface TableProps {
  title: string;
  subtitle?: string;
  headers: string[];
  children: ReactNode;
}

export function Table({ title, subtitle, headers, children }: TableProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="flex items-center px-5 py-4 border-b border-zinc-800">
        <span
          className="font-bold text-zinc-200 text-sm tracking-wide"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}
        >
          {title}
        </span>
        {subtitle && (
          <span className="ml-auto font-mono text-[11px] text-zinc-500">{subtitle}</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-black/20">
              {headers.map(h => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left font-mono text-[9px] uppercase tracking-widest text-zinc-600 border-b border-zinc-800"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}
