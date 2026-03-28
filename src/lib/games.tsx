import React from 'react';
import { GameDef, Question } from './types';
import { 
  Plus, Minus, X, Divide, Calculator, Blocks, PieChart, Percent, Superscript, Radical, ArrowRightLeft, Baseline
} from 'lucide-react';
import { FractionVisual } from '../components/FractionVisual';

const shuffle = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  newArr.sort(() => Math.random() - 0.5);
  return newArr;
};

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

const renderFraction = (n: number | string, d: number | string, extra?: string) => (
  <div className="flex items-center justify-center gap-4 text-5xl sm:text-6xl font-black drop-shadow-xl text-white my-4">
    <div className="flex flex-col items-center">
      <span className="border-b-[4px] border-white/90 px-3 pb-1 leading-none">{n}</span>
      <span className="px-3 pt-2 leading-none">{d}</span>
    </div>
    {extra && <span className="text-3xl sm:text-4xl text-white/90 font-bold">{extra}</span>}
  </div>
);

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
        component: renderFraction(numerator, denominator, `de ${base}`),
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
        component: (
          <div className="flex items-start justify-center text-6xl font-black tracking-tighter drop-shadow-lg gap-2 mt-4 mb-4">
            <span className="text-7xl">{base}</span>
            <span className="text-4xl mt-1 text-white/90">{exp}</span>
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
  },
  {
    id: 'porcentajes-10',
    title: 'Porcentajes (10%)',
    description: 'Calcula porcentajes múltiplos de 10 (ej. 40% de 90).',
    icon: Percent,
    gradient: 'from-amber-400 to-amber-600',
    generateQuestion: (level) => {
      const p = randomInt(1, 9) * 10;
      const multipliers = [10, 20, 30, 40, 50, 100, 150, 200];
      const n = multipliers[randomInt(0, Math.min(level + 2, multipliers.length - 1))];
      const answer = (p * n) / 100;
      return { text: `${p}% de ${n}`, answer, options: generateNumOptions(answer, Math.max(5, answer * 0.2)) };
    }
  },
  {
    id: 'porcentajes-5',
    title: 'Porcentajes (5%)',
    description: 'Calcula porcentajes múltiplos de 5.',
    icon: Percent,
    gradient: 'from-emerald-400 to-teal-600',
    generateQuestion: (level) => {
      const p = randomInt(1, 19) * 5;
      const multipliers = [20, 40, 60, 80, 100, 120, 200];
      const n = multipliers[randomInt(0, Math.min(level + 1, multipliers.length - 1))];
      const answer = (p * n) / 100;
      return { text: `${p}% de ${n}`, answer, options: generateNumOptions(answer, Math.max(5, answer * 0.2)) };
    }
  },
  {
    id: 'porcentajes-1',
    title: 'Porcentajes Libres',
    description: 'Calcula cualquier porcentaje del 1% al 100%.',
    icon: Percent,
    gradient: 'from-blue-500 to-indigo-600',
    generateQuestion: (level) => {
      const p = randomInt(1, 99);
      const multipliers = [100, 200, 300, 400, 500, 1000];
      const n = multipliers[randomInt(0, Math.min(level, multipliers.length - 1))];
      const answer = (p * n) / 100;
      return { text: `${p}% de ${n}`, answer, options: generateNumOptions(answer, Math.max(5, answer * 0.2)) };
    }
  },
  {
    id: 'fraccion-a-decimal',
    title: 'Fracción a Decimal',
    description: 'Convierte fracciones a números decimales.',
    icon: ArrowRightLeft,
    gradient: 'from-violet-500 to-purple-700',
    generateQuestion: (level) => {
      const denoms = [2, 4, 5, 8, 10];
      const d = denoms[randomInt(0, Math.min(level + 1, denoms.length - 1))];
      const n = randomInt(1, d - 1);
      const answer = n / d;
      const options = new Set<number>([answer]);
      while(options.size < 4) {
        let wrong = (randomInt(1, d-1) / d) + (Math.random() > 0.5 ? 0 : 0.1);
        if (wrong !== answer && wrong > 0) options.add(parseFloat(wrong.toFixed(3)));
      }
      return { component: renderFraction(n, d), answer, options: shuffle(Array.from(options)) };
    }
  },
  {
    id: 'decimal-a-fraccion',
    title: 'Decimal a Fracción',
    description: 'Convierte números decimales a fracciones simples.',
    icon: ArrowRightLeft,
    gradient: 'from-pink-500 to-rose-600',
    generateQuestion: (level) => {
      const denoms = [2, 4, 5, 10];
      const d = denoms[randomInt(0, Math.min(level, denoms.length - 1))];
      const n = randomInt(1, d - 1);
      const dec = n / d;
      
      const g = gcd(n, d);
      const answer = `${n/g}/${d/g}`;
      
      const options = new Set<string>([answer]);
      while(options.size < 4) {
        let wd = denoms[randomInt(0, denoms.length - 1)];
        let wn = randomInt(1, wd - 1);
        let wg = gcd(wn, wd);
        let wrong = `${wn/wg}/${wd/wg}`;
        if (wrong !== answer) options.add(wrong);
      }
      return { text: dec.toString(), answer, options: shuffle(Array.from(options)) };
    }
  },
  {
    id: 'porcentaje-a-fraccion-100',
    title: 'Porcentaje a Fracción /100',
    description: 'Transforma el porcentaje en una fracción con denominador 100.',
    icon: Baseline,
    gradient: 'from-cyan-500 to-blue-500',
    generateQuestion: (level) => {
      const p = randomInt(1, 99);
      const answer = `${p}/100`;
      const options = new Set<string>([answer]);
      while(options.size < 4) {
        let wrongP = p + randomInt(-20, 20);
        if (wrongP > 0 && wrongP !== p) options.add(`${wrongP}/100`);
      }
      return { text: `${p}%`, component: (
        <div className="text-5xl font-black mb-4 drop-shadow-xl">{p}% = ?</div>
      ), answer, options: shuffle(Array.from(options)) };
    }
  },
  {
    id: 'porcentaje-a-fraccion-simp',
    title: 'Porcentaje Simplificado',
    description: 'Transforma el porcentaje en la fracción más pequeña (simplificada).',
    icon: Baseline,
    gradient: 'from-fuchsia-500 to-purple-600',
    generateQuestion: (level) => {
      const p = randomInt(1, 19) * 5; // like 5, 25, 40, etc
      const g = gcd(p, 100);
      const answer = `${p/g}/${100/g}`;
      
      const options = new Set<string>([answer]);
      while(options.size < 4) {
        let wp = randomInt(1, 19) * 5;
        let wg = gcd(wp, 100);
        let wrong = `${wp/wg}/${100/wg}`;
        if (wrong !== answer) options.add(wrong);
      }
      return { text: `${p}%`, component: (
        <div className="text-5xl font-black mb-4 drop-shadow-xl">{p}% = ?</div>
      ), answer, options: shuffle(Array.from(options)) };
    }
  },
  {
    id: 'potencias-mult-base',
    title: 'Multiplicación (Igual Base)',
    description: 'Aplica propiedades y calcula el resultado. Ej: a^b × a^c = a^(b+c)',
    icon: Superscript,
    gradient: 'from-blue-500 to-indigo-600',
    generateQuestion: (level) => {
      const base = randomInt(2, 5);
      const e1 = randomInt(1, 3);
      const e2 = randomInt(1, 3);
      const answer = Math.pow(base, e1 + e2);
      return {
        component: (
          <div className="flex items-center justify-center text-5xl font-black drop-shadow-xl gap-4 my-2">
            <div className="flex items-start"><span>{base}</span><span className="text-2xl mt-1">{e1}</span></div>
            <span>×</span>
            <div className="flex items-start"><span>{base}</span><span className="text-2xl mt-1">{e2}</span></div>
          </div>
        ),
        answer,
        options: generateNumOptions(answer, Math.max(5, answer * 0.5))
      };
    }
  },
  {
    id: 'potencias-mult-exp',
    title: 'Multiplicación (Igual Exponente)',
    description: 'Aplica propiedades y calcula el resultado. Ej: a^c × b^c = (a×b)^c',
    icon: Superscript,
    gradient: 'from-indigo-500 to-purple-600',
    generateQuestion: (level) => {
      const base1 = randomInt(2, 5);
      const base2 = randomInt(2, 4);
      const e = randomInt(2, 3);
      const answer = Math.pow(base1 * base2, e);
      return {
        component: (
          <div className="flex items-center justify-center text-5xl font-black drop-shadow-xl gap-4 my-2">
            <div className="flex items-start"><span>{base1}</span><span className="text-2xl mt-1">{e}</span></div>
            <span>×</span>
            <div className="flex items-start"><span>{base2}</span><span className="text-2xl mt-1">{e}</span></div>
          </div>
        ),
        answer,
        options: generateNumOptions(answer, Math.max(5, answer * 0.5))
      };
    }
  },
  {
    id: 'potencias-pot',
    title: 'Potencia de una Potencia',
    description: 'Se multiplican los exponentes. Ej: (a^b)^c = a^(b×c)',
    icon: Superscript,
    gradient: 'from-purple-500 to-pink-600',
    generateQuestion: (level) => {
      const base = randomInt(2, 4);
      const e1 = randomInt(2, 3);
      const e2 = randomInt(2, 3);
      const answer = Math.pow(base, e1 * e2);
      return {
        component: (
          <div className="flex items-center justify-center text-5xl font-black drop-shadow-xl gap-1 my-2">
            <span>(</span>
            <div className="flex items-start"><span>{base}</span><span className="text-2xl mt-1">{e1}</span></div>
            <span>)</span>
            <span className="text-2xl mt-1 ml-1">{e2}</span>
          </div>
        ),
        answer,
        options: generateNumOptions(answer, Math.max(5, answer * 0.5))
      };
    }
  },
  {
    id: 'potencias-div-base',
    title: 'División (Igual Base)',
    description: 'Resta los exponentes. Ej: a^b ÷ a^c = a^(b-c)',
    icon: Superscript,
    gradient: 'from-pink-500 to-rose-600',
    generateQuestion: (level) => {
      const base = randomInt(2, 5);
      const e1 = randomInt(3, 6);
      const e2 = randomInt(1, e1 - 1);
      const answer = Math.pow(base, e1 - e2);
      return {
        component: (
          <div className="flex items-center justify-center text-5xl font-black drop-shadow-xl gap-4 my-2">
            <div className="flex items-start"><span>{base}</span><span className="text-2xl mt-1">{e1}</span></div>
            <span>÷</span>
            <div className="flex items-start"><span>{base}</span><span className="text-2xl mt-1">{e2}</span></div>
          </div>
        ),
        answer,
        options: generateNumOptions(answer, Math.max(5, answer * 0.5))
      };
    }
  },
  {
    id: 'potencias-div-exp',
    title: 'División (Igual Exponente)',
    description: 'Divide las bases. Ej: a^c ÷ b^c = (a÷b)^c',
    icon: Superscript,
    gradient: 'from-rose-500 to-orange-600',
    generateQuestion: (level) => {
      const b2 = randomInt(2, 5);
      const mult = randomInt(2, 5);
      const b1 = b2 * mult;
      const e = randomInt(2, 3);
      const answer = Math.pow(b1 / b2, e);
      return {
        component: (
          <div className="flex items-center justify-center text-5xl font-black drop-shadow-xl gap-4 my-2">
            <div className="flex items-start"><span>{b1}</span><span className="text-2xl mt-1">{e}</span></div>
            <span>÷</span>
            <div className="flex items-start"><span>{b2}</span><span className="text-2xl mt-1">{e}</span></div>
          </div>
        ),
        answer,
        options: generateNumOptions(answer, Math.max(2, answer * 0.5))
      };
    }
  },
  {
    id: 'potencias-exp-1',
    title: 'Exponente Uno',
    description: 'Todo número elevado a 1 es igual al mismo número.',
    icon: Superscript,
    gradient: 'from-orange-500 to-amber-600',
    generateQuestion: (level) => {
      const base = randomInt(11, 150);
      return {
        component: (
          <div className="flex items-start justify-center text-6xl font-black drop-shadow-xl gap-1 my-2">
            <span>{base}</span><span className="text-3xl mt-1">1</span>
          </div>
        ),
        answer: base,
        options: generateNumOptions(base, 10)
      };
    }
  },
  {
    id: 'potencias-exp-0',
    title: 'Exponente Cero',
    description: 'Todo número distinto de 0 elevado a 0 es igual a 1.',
    icon: Superscript,
    gradient: 'from-amber-500 to-yellow-600',
    generateQuestion: (level) => {
      const base = randomInt(5, 500);
      return {
        component: (
          <div className="flex items-start justify-center text-6xl font-black drop-shadow-xl gap-1 my-2">
            <span>{base}</span><span className="text-3xl mt-1">0</span>
          </div>
        ),
        answer: 1,
        options: [0, 1, base, base * 10].sort(() => Math.random() - 0.5)
      };
    }
  },
  {
    id: 'potencias-exp-neg',
    title: 'Exponente Negativo',
    description: 'Invierte la base y el exponente cambia a positivo.',
    icon: Superscript,
    gradient: 'from-lime-500 to-green-600',
    generateQuestion: (level) => {
      const base = randomInt(2, 5);
      const exp = randomInt(1, 3);
      const val = Math.pow(base, exp);
      const answer = `1/${val}`;
      const options = new Set<string>([answer]);
      options.add(`1/${val + randomInt(1, 4)}`);
      if (val !== 1) options.add(`${val}`);
      options.add(`-${val}`);
      while(options.size < 4) {
          options.add(`1/${val + randomInt(5, 15)}`);
      }
      return {
        component: (
          <div className="flex items-start justify-center text-6xl font-black drop-shadow-xl gap-1 my-2">
            <span>{base}</span><span className="text-3xl mt-1">-{exp}</span>
          </div>
        ),
        answer,
        options: shuffle(Array.from(options))
      };
    }
  },
  {
    id: 'potencias-fraccion',
    title: 'Potencia de una Fracción',
    description: 'El exponente se aplica al numerador y al denominador.',
    icon: Superscript,
    gradient: 'from-emerald-500 to-teal-600',
    generateQuestion: (level) => {
      const d = randomInt(3, 6);
      const n = randomInt(1, d - 1);
      const e = randomInt(2, 3);
      const answer = `${Math.pow(n, e)}/${Math.pow(d, e)}`;
      const options = new Set<string>([answer]);
      while(options.size < 4) {
        let wd = randomInt(2, 10);
        let wn = randomInt(1, wd);
        if (Math.pow(wn, e) !== Math.pow(n, e) && `${Math.pow(wn, e)}/${Math.pow(wd, e)}` !== answer) {
          options.add(`${Math.pow(wn, e)}/${Math.pow(wd, e)}`);
        }
      }
      return {
        component: (
          <div className="flex items-center justify-center text-5xl font-black drop-shadow-xl gap-2 my-2">
            <span>(</span>
            <div className="flex flex-col items-center text-4xl mt-2">
              <span className="border-b-[3px] border-white/90 px-2 pb-1 leading-none">{n}</span>
              <span className="px-2 pt-1 leading-none">{d}</span>
            </div>
            <span>)</span>
            <span className="text-2xl mt-1 -ml-1 self-start">{e}</span>
          </div>
        ),
        answer,
        options: shuffle(Array.from(options))
      };
    }
  },
  {
    id: 'potencias-decimal',
    title: 'Potencia Decimal Simple',
    description: 'Eleva un número decimal a una potencia pequeña. Ej: 2.5^2',
    icon: Superscript,
    gradient: 'from-cyan-500 to-sky-600',
    generateQuestion: (level) => {
      const decs = [0.1, 0.5, 1.5, 2.5, 0.2];
      const base = decs[randomInt(0, decs.length - 1)];
      const e = base === 0.1 || base === 0.2 || base === 0.5 ? randomInt(2, 3) : 2;
      const answer = Number(Math.pow(base, e).toFixed(3));
      
      const options = new Set<number>([answer]);
      while(options.size < 4) {
        const wrong = Number((answer + randomInt(-5, 5) * (e===2? 0.01 : 0.001)).toFixed(3));
        if (wrong !== answer && wrong > 0) options.add(wrong);
      }
      
      return {
        component: (
          <div className="flex items-start justify-center text-6xl font-black drop-shadow-xl gap-1 my-2">
            <span>{base}</span><span className="text-3xl mt-1">{e}</span>
          </div>
        ),
        answer,
        options: shuffle(Array.from(options))
      };
    }
  },
  {
    id: 'potencias-identificar',
    title: 'Identificar Potencia',
    description: 'Encuentra qué potencia equivale al número grande mostrado.',
    icon: Superscript,
    gradient: 'from-sky-500 to-blue-600',
    generateQuestion: (level) => {
      const bases = [2, 3, 4, 5];
      const exps = [2, 3, 4, 5, 6];
      let base = bases[randomInt(0, bases.length - 1)];
      let exp = exps[randomInt(0, exps.length - 1)];
      
      if (base === 3 && exp > 4) exp = 4;
      if (base >= 4 && exp > 3) exp = 3;
      if (base === 5 && exp > 3) exp = 3;
      
      const num = Math.pow(base, exp);
      const answer = `${base}^${exp}`;
      
      const options = new Set<string>([answer]);
      options.add(`${base}^${exp + 1}`);
      options.add(`${base + 1}^${exp}`);
      options.add(`${exp}^${base}`);
      while (options.size < 4) {
        let rb = randomInt(2, 5);
        let re = randomInt(2, 5);
        if (`${rb}^${re}` !== answer) options.add(`${rb}^${re}`);
      }

      return {
        text: num.toString(),
        answer,
        options: shuffle(Array.from(options))
      };
    }
  }
];
