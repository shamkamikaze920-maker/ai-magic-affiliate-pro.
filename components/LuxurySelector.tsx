
import React from 'react';

interface LuxurySelectorProps {
  title: string;
  options: string[];
  selected: string | undefined;
  onChange: (val: string) => void;
  gridCols?: string;
}

export const LuxurySelector: React.FC<LuxurySelectorProps> = ({ title, options, selected, onChange, gridCols = "grid-cols-2 md:grid-cols-4" }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold serif gold-text">{title}</h3>
      <div className={`grid ${gridCols} gap-3`}>
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`px-4 py-3 text-sm transition-all duration-300 border ${
              selected === option
                ? "border-[#bf953f] bg-[#bf953f]/10 text-[#fcf6ba] shadow-[0_0_15px_rgba(191,149,63,0.3)]"
                : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/30 hover:bg-white/10"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};
