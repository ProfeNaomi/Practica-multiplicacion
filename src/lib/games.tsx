import React from 'react';
import { GameDef, Question } from './types';
import { 
  Plus, Minus, X, Divide, Calculator, Blocks, PieChart, Percent, Superscript, Radical 
} from 'lucide-react';
import { FractionVisual } from '../components/FractionVisual';

const shuffle = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  newArr.sort(() => Math.random() - 0.5);
  return newArr;
};

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateNumOptions = (answer: number, variance: number, allowNegative: boolean = false): number[] => {
  const options = new Set<number>([answer]);
  while (options.size < 4) {
    const wrong = answer + randomInt(-variance, variance) + (Math.random() > 0.5 ? 1 : -1);
    if (wrong !== answer && (allowNegative || wrong >= 0)) {
      options.add(wrong);
    }
  }
  return shuffle(Array.from(options));
};

export const games: GameDef[] = [
  {
    id: 'sumas',
    title: 'Sumas',
    description: 'Suma números, aumenta su dificultad progresivamente.',
    icon: Plus,
    gradient: 'from-blue-400 to-cyan-500',
    generateQuestion: (level) => {
      const max = Math.min(10 + level * 10, 500);
      const a = randomInt(1, max);
      const b = randomInt(1, max);
      const answer = a + b;
      return {
        text: `${a} + ${b}`,
        answer,
        options: generateNumOptions(answer, Math.max(5, Math.floor(answer * 0.2)))
      };
    }
  },
  {
    id: 'restas',
    title: 'Restas',
    description: 'Resta números y mejora tu agilidad mental.',
    icon: Minus,
    gradient: 'from-orange-400 to-red-500',
    generateQuestion: (level) => {
      const max = Math.min(10 + level * 10, 500);
      const a = randomInt(5, max);
      const b = randomInt(1, a);
      const answer = a - b;
      return {
        text: `${a} - ${b}`,
        answer,
        options: generateNumOptions(answer, Math.max(5, Math.floor(a * 0.2)))
      };
    }
  },
  {
    id: 'multiplicacion',
    title: 'Multiplicación',
    description: 'El clásico multiplicador rápido que ya conoces.',
    icon: X,
    gradient: 'from-purple-500 to-pink-500',
    generateQuestion: (level) => {
      const maxTable = Math.min(3 + Math.floor(level * 1.5), 15);
      const minTable = Math.max(2, maxTable - 4);
      const a = randomInt(minTable, maxTable);
      const b = randomInt(2, Math.min(10 + Math.floor(level / 2), 15));
      const answer = a * b;
      return {
        text: `${a} × ${b}`,
        answer,
        options: generateNumOptions(answer, 15)
      };
    }
  },
  {
    id: 'division',
    title: 'División Exacta',
    description: 'Practica la división sin restos.',
    icon: Divide,
    gradient: 'from-teal-400 to-emerald-500',
    generateQuestion: (level) => {
      const divisor = randomInt(2, Math.min(12 + Math.floor(level / 2), 20));
      const quotient = randomInt(2, Math.min(10 + level, 20));
      const dividend = divisor * quotient;
      return {
        text: `${dividend} ÷ ${divisor}`,
        answer: quotient,
        options: generateNumOptions(quotient, 5)
      };
    }
  },
  {
    id: 'combinadas-mult-suma',
    title: 'Combinadas (× y +)',
    description: 'Resuelve primero la multiplicación y luego la suma.',
    icon: Calculator,
    gradient: 'from-indigo-400 to-blue-600',
    generateQuestion: (level) => {
      const a = randomInt(2, Math.min(10 + level, 15));
      const b = randomInt(2, Math.min(10 + level, 15));
      const c = randomInt(1, Math.min(20 + level * 2, 50));
      const answer = (a * b) + c;
      return {
        text: `${a} × ${b} + ${c}`,
        answer,
        options: generateNumOptions(answer, 15)
      };
    }
  },
  {
    id: 'combinadas-div-suma',
    title: 'Combinadas (÷ y +)',
    description: 'Operaciones combinadas de hasta 3 números (ej. 4÷2+5).',
    icon: Calculator,
    gradient: 'from-indigo-500 to-purple-600',
    generateQuestion: (level) => {
      const divisor = randomInt(2, Math.min(10 + Math.floor(level / 2), 15));
      const quotient = randomInt(2, Math.min(10 + level, 20));
      const dividend = divisor * quotient;
      const c = randomInt(1, Math.min(20 + level * 2, 50));
      const answer = quotient + c;
      const useMinus = Math.random() > 0.5;
      
      if (useMinus && quotient - c > 0) {
        return {
          text: `${dividend} ÷ ${divisor} - ${c}`,
          answer: quotient - c,
          options: generateNumOptions(quotient - c, 10, true)
        };
      }
      return {
        text: `${dividend} ÷ ${divisor} + ${c}`,
        answer,
        options: generateNumOptions(answer, 10)
      };
    }
  },
  {
    id: 'factores',
    title: 'Factores',
    description: 'Descompón un número en la multiplicación correcta.',
    icon: Blocks,
    gradient: 'from-yellow-400 to-orange-500',
    generateQuestion: (level, history) => {
      let a = 0, b = 0, product = 0;
      let attempts = 0;
      do {
        a = randomInt(2, Math.min(10 + level, 20));
        b = randomInt(2, Math.min(10 + level, 20));
        product = a * b;
        attempts++;
      } while (history.has(product) && attempts < 10);
      
      history.add(product);
      const answerStr = `${a} × ${b}`;
      
      const options = new Set<string>([answerStr]);
      while (options.size < 4) {
        const wrongA = randomInt(2, 20);
        const wrongB = randomInt(2, 20);
        if (wrongA * wrongB !== product) {
          options.add(`${wrongA} × ${wrongB}`);
        }
      }
      
      return {
        text: `${product} = ?`,
        answer: answerStr,
        options: shuffle(Array.from(options))
      };
    }
  },
  {
    id: 'dibujo-fraccion',
    title: 'Dibujo a Fracción',
    description: '¿Qué fracción representa el dibujo?',
    icon: PieChart,
    gradient: 'from-rose-400 to-red-600',
    generateQuestion: (level) => {
      const denominator = randomInt(2, Math.min(12, 4 + level));
      const numerator = randomInt(1, denominator - 1);
      const answerStr = `${numerator}/${denominator}`;
      
      const options = new Set<string>([answerStr]);
      while (options.size < 4) {
        const wrongN = randomInt(1, 11);
        const wrongD = randomInt(2, 12);
        const wrongStr = `${wrongN}/${wrongD}`;
        if (wrongStr !== answerStr && wrongN < wrongD) {
          options.add(wrongStr);
        }
      }
      
      return {
        // text is empty, we use component
        component: <FractionVisual numerator={numerator} denominator={denominator} />,
        answer: answerStr,
        options: shuffle(Array.from(options))
      };
    }
  },
  {
    id: 'fraccion-numero',
    title: 'Fracción de un número',
    description: 'Calcula cuánto es la fracción de una cantidad (ej. 2/5 de 1000).',
    icon: Percent,
    gradient: 'from-fuchsia-500 to-pink-600',
    generateQuestion: (level) => {
      const multipliers = [10, 20, 50, 100, 1000];
      const mult = multipliers[Math.min(level - 1, multipliers.length - 1)] || multipliers[randomInt(0, multipliers.length - 1)];
      const denominator = randomInt(2, 10);
      const numerator = randomInt(1, denominator - 1);
      const base = denominator * mult;
      const answer = numerator * mult;
      
      return {
        text: `${numerator}/${denominator} de ${base}`,
        answer,
        options: generateNumOptions(answer, mult, false)
      };
    }
  },
  {
    id: 'potencias',
    title: 'Potencias',
    description: 'Calcula potencias con exponentes naturales (hasta 4).',
    icon: Superscript,
    gradient: 'from-lime-400 to-green-600',
    generateQuestion: (level) => {
      const exp = level <= 2 ? randomInt(2, 3) : randomInt(2, 4);
      let baseMax = 10;
      if (exp === 3) baseMax = 6;
      if (exp === 4) baseMax = 4;
      
      const base = randomInt(2, baseMax);
      const answer = Math.pow(base, exp);
      
      return {
        text: `${base} ^ ${exp}`,
        component: (
          <div className="flex items-start justify-center text-6xl font-black tracking-tighter drop-shadow-lg gap-2">
            <span>{base}</span>
            <span className="text-4xl mt-1">{exp}</span>
          </div>
        ),
        answer,
        options: generateNumOptions(answer, Math.max(5, Math.floor(answer * 0.3)))
      };
    }
  },
  {
    id: 'raices',
    title: 'Raíces Cuadradas',
    description: 'Encuentra el número que multiplicado por sí mismo da el resultado.',
    icon: Radical,
    gradient: 'from-cyan-500 to-blue-600',
    generateQuestion: (level) => {
      const maxRoot = Math.min(5 + level * 2, 15);
      const root = randomInt(1, maxRoot);
      const square = root * root;
      
      return {
        text: `√${square}`,
        answer: root,
        options: generateNumOptions(root, 3) // range 1-15, variance 3 is enough
      };
    }
  }
];
