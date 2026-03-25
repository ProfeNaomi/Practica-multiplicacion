import React from 'react';

export interface Question {
  text?: string;
  component?: React.ReactNode;
  answer: number | string;
  options: (number | string)[];
}

export interface GameDef {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  generateQuestion: (level: number, history: Set<number>) => Question;
}
