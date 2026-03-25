import React from 'react';

interface FractionVisualProps {
  numerator: number;
  denominator: number;
}

export const FractionVisual: React.FC<FractionVisualProps> = ({ numerator, denominator }) => {
  const cols = Math.ceil(Math.sqrt(denominator));
  const rows = Math.ceil(denominator / cols);

  return (
    <div className="flex flex-col items-center gap-2 mb-4">
      <div 
        className="w-[160px] h-[160px] mx-auto bg-black/20 rounded-xl overflow-hidden shadow-inner border border-white/20"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap: '4px',
          padding: '8px'
        }}
      >
        {Array.from({ length: denominator }).map((_, i) => (
          <div
            key={i}
            className={`w-full h-full rounded-sm ${
              i < numerator ? 'bg-gradient-to-br from-indigo-400 to-purple-500 shadow-md' : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      <div className="text-white/60 text-sm italic">Figura dividida en {denominator} partes</div>
    </div>
  );
};
