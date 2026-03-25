import React from 'react';
import { motion } from 'motion/react';

interface FractionVisualProps {
  numerator: number;
  denominator: number;
}

export const FractionVisual: React.FC<FractionVisualProps> = ({ numerator, denominator }) => {
  // Use a grid of boxes, or sectors in a circle. Let's do a grid of boxes for simplicity.
  const cols = Math.ceil(Math.sqrt(denominator));
  const rows = Math.ceil(denominator / cols);

  const cells = [];
  for (let i = 0; i < denominator; i++) {
    const isFilled = i < numerator;
    cells.push(
      <motion.div
        key={i}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: i * 0.05 }}
        className={`w-full aspect-square rounded-md border-2 border-white/40 ${
          isFilled ? 'bg-white/80' : 'bg-transparent'
        }`}
      />
    );
  }

  return (
    <div 
      className="max-w-[200px] w-full mx-auto p-4 bg-white/10 rounded-xl"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: '8px'
      }}
    >
      {cells}
    </div>
  );
};
