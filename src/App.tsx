import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Star, Clock, Trophy, Play, RotateCcw, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from './lib/sounds';
import { games } from './lib/games';
import { GameDef, Question } from './lib/types';

type GameState = 'menu' | 'start' | 'playing' | 'gameover';

const MAX_LIVES = 3;
const TIME_LIMIT = 7;
const QUESTIONS_PER_LEVEL = 5;

export default function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  const timerRef = useRef<number | null>(null);
  const historyRef = useRef<Set<number>>(new Set());

  const activeGame = activeGameId ? games.find(g => g.id === activeGameId) : null;

  const selectGame = (gameId: string) => {
    setActiveGameId(gameId);
    setGameState('start');
  };

  const startGame = () => {
    sounds.init();
    setGameState('playing');
    setScore(0);
    setLives(MAX_LIVES);
    setLevel(1);
    setStreak(0);
    historyRef.current = new Set();
    nextQuestion(1);
  };

  const backToMenu = () => {
    setGameState('menu');
    setActiveGameId(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const nextQuestion = useCallback((currentLevel: number) => {
    if (!activeGame) return;
    setQuestion(activeGame.generateQuestion(currentLevel, historyRef.current));
    setTimeLeft(TIME_LIMIT);
    setSelectedAnswer(null);
    setIsCorrect(null);
  }, [activeGame]);

  const handleAnswer = useCallback((answer: number | string) => {
    if (selectedAnswer !== null || !question || !activeGame) return;
    
    setSelectedAnswer(answer);
    
    // In javascript, '10' === 10 is false, so let's convert safely for comparison if both look like numbers,
    // actually our generic generators already keep types consistent.
    const correct = String(answer) === String(question.answer);
    setIsCorrect(correct);
    
    if (correct) {
      sounds.playCorrect();
      setScore(s => s + 10 * level);
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      if (newStreak >= QUESTIONS_PER_LEVEL) {
        sounds.playLevelUp();
        setLevel(l => l + 1);
        setStreak(0);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } else {
      sounds.playWrong();
      setLives(l => {
        const newLives = l - 1;
        if (newLives <= 0) {
          sounds.playGameOver();
          setGameState('gameover');
        }
        return newLives;
      });
      setStreak(0);
    }
    
    if (lives > 1 || correct) {
      setTimeout(() => {
        nextQuestion(correct && streak + 1 >= QUESTIONS_PER_LEVEL ? level + 1 : level);
      }, 1000);
    }
  }, [question, selectedAnswer, level, streak, lives, nextQuestion, activeGame]);

  useEffect(() => {
    if (gameState === 'playing' && selectedAnswer === null) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            handleAnswer(-1); // Timeout
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, selectedAnswer, handleAnswer]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-white">
      <div className="max-w-4xl w-full">
        {gameState === 'menu' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="text-center mb-12">
              <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Matemáticas Divertidas
              </h1>
              <p className="text-xl text-slate-400">Selecciona un juego para comenzar a practicar</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {games.map(game => {
                const Icon = game.icon;
                return (
                  <motion.button
                    key={game.id}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => selectGame(game.id)}
                    className={`bg-gradient-to-br ${game.gradient} p-6 rounded-3xl shadow-xl text-left relative overflow-hidden group border border-white/10`}
                  >
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Icon className="w-12 h-12 mb-4 text-white drop-shadow-md" />
                    <h3 className="text-2xl font-bold mb-2 drop-shadow-sm">{game.title}</h3>
                    <p className="text-sm text-white/90 drop-shadow-sm line-clamp-3 leading-relaxed">
                      {game.description}
                    </p>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}

        {gameState !== 'menu' && activeGame && (
          <div className={`max-w-md mx-auto w-full bg-gradient-to-br ${activeGame.gradient} rounded-3xl shadow-2xl overflow-hidden border border-white/20 transition-colors duration-500`}>
            <AnimatePresence mode="wait">
              {gameState === 'start' && (
                <motion.div
                  key="start"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="p-8 text-center"
                >
                  <button 
                    onClick={backToMenu}
                    className="absolute top-6 left-6 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  
                  <div className="mb-8 flex justify-center mt-4">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                      <activeGame.icon className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h1 className="text-4xl font-bold mb-4 tracking-tight drop-shadow-md">{activeGame.title}</h1>
                  <p className="text-lg text-white/90 mb-8 drop-shadow-sm">
                    {activeGame.description} ¡Tienes {TIME_LIMIT} segundos por pregunta!
                  </p>
                  <button
                    onClick={startGame}
                    className="w-full py-4 bg-white/20 hover:bg-white/30 border border-white/40 text-white rounded-2xl font-bold text-xl shadow-lg transform transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Play className="w-6 h-6" fill="currentColor" />
                    ¡Jugar Ahora!
                  </button>
                </motion.div>
              )}

              {gameState === 'playing' && question && (
                <motion.div
                  key="playing"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="p-6"
                >
                  {/* Header */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full border border-white/20 shadow-sm">
                      <Trophy className="w-5 h-5 text-yellow-300" />
                      <span className="font-bold">{score}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full border border-white/20 shadow-sm">
                      <Star className="w-5 h-5 text-yellow-300" fill="currentColor" />
                      <span className="font-bold">Nivel {level}</span>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(MAX_LIVES)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ scale: i < lives ? 1 : 0.5, opacity: i < lives ? 1 : 0.3 }}
                        >
                          <Heart
                            className={`w-6 h-6 ${i < lives ? 'text-red-400' : 'text-gray-400'}`}
                            fill="currentColor"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="mb-8 pl-1 pr-1">
                    <div className="flex justify-between text-sm font-medium mb-2 opacity-90">
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Tiempo</span>
                      <span>{timeLeft}s</span>
                    </div>
                    <div className="h-4 bg-black/20 rounded-full overflow-hidden border border-white/10 shadow-inner">
                      <motion.div
                        className={`h-full ${timeLeft <= 2 ? 'bg-red-500' : 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]'}`}
                        initial={{ width: '100%' }}
                        animate={{ width: `${(timeLeft / TIME_LIMIT) * 100}%` }}
                        transition={{ duration: 1, ease: "linear" }}
                      />
                    </div>
                  </div>

                  {/* Question */}
                  <div className="text-center mb-8 min-h-[120px] flex flex-col items-center justify-center">
                    {question.component ? (
                      <motion.div
                        key={`comp-${level}-${streak}`}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                      >
                        {question.component}
                      </motion.div>
                    ) : (null)}
                    
                    {question.text && (
                      <motion.div
                        key={`text-${question.answer}`}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-5xl sm:text-6xl font-black tracking-tighter drop-shadow-xl mt-4"
                      >
                        {question.text}
                      </motion.div>
                    )}
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-2 gap-4">
                    {question.options.map((opt, i) => {
                      let btnClass = "bg-white/20 hover:bg-white/30 text-white border-white/20 shadow-md";
                      if (selectedAnswer !== null) {
                         // Must cast values to string before comparing due to random generation logic potentially mixing types.
                        if (String(opt) === String(question.answer)) {
                          btnClass = "bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.6)] border-green-400";
                        } else if (String(opt) === String(selectedAnswer)) {
                          btnClass = "bg-red-500 text-white border-red-400";
                        } else {
                          btnClass = "bg-black/20 text-white/50 border-transparent shadow-none";
                        }
                      }

                      return (
                        <motion.button
                          key={i}
                          whileHover={selectedAnswer === null ? { scale: 1.05 } : {}}
                          whileTap={selectedAnswer === null ? { scale: 0.95 } : {}}
                          onClick={() => handleAnswer(opt)}
                          disabled={selectedAnswer !== null}
                          className={`py-5 sm:py-6 rounded-2xl text-2xl sm:text-3xl font-bold transition-all duration-200 border ${btnClass}`}
                        >
                          {opt}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {gameState === 'gameover' && (
                <motion.div
                  key="gameover"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 text-center"
                >
                  <div className="mb-6 flex justify-center">
                    <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center">
                      <Heart className="w-12 h-12 text-red-500" fill="currentColor" />
                    </div>
                  </div>
                  <h2 className="text-4xl font-bold mb-2 drop-shadow-md">¡Juego Terminado!</h2>
                  <p className="text-xl text-white/90 mb-6 drop-shadow-sm">Llegaste al Nivel {level}</p>
                  
                  <div className="bg-black/20 rounded-3xl p-6 mb-8 border border-white/10 shadow-inner">
                    <div className="text-sm text-white/70 uppercase tracking-widest mb-1 font-semibold">Puntuación Final</div>
                    <div className="text-6xl font-black text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.4)]">{score}</div>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={startGame}
                      className="w-full py-4 bg-white text-slate-800 hover:bg-gray-100 rounded-2xl font-bold text-xl shadow-xl transform transition active:scale-95 flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-6 h-6" />
                      Volver a Jugar
                    </button>
                    <button
                      onClick={backToMenu}
                      className="w-full py-4 bg-black/20 hover:bg-black/30 border border-white/30 text-white rounded-2xl font-bold text-xl shadow-lg transform transition active:scale-95 flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-6 h-6" />
                      Menú Principal
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
