import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Star, Clock, Trophy, Play, RotateCcw, ArrowLeft, LogOut, ListOrdered, X, Settings } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from './lib/sounds';
import { games } from './lib/games';
import { GameDef, Question } from './lib/types';
import { collection, query, where, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { db } from './lib/firebase';

type AuthMode = 'login' | 'register';
type GameState = 'auth' | 'menu' | 'start' | 'playing' | 'gameover' | 'scores' | 'settings';

const MAX_LIVES = 3;
const QUESTIONS_PER_LEVEL = 5;

export default function App() {
  const [gameState, setGameState] = useState<GameState>('auth');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [firstNameInput, setFirstNameInput] = useState('');
  const [lastNameInput, setLastNameInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [timeLimit, setTimeLimit] = useState(7);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const timerRef = useRef<number | null>(null);
  const historyRef = useRef<Set<number>>(new Set());

  const activeGame = activeGameId ? games.find(g => g.id === activeGameId) : null;

  useEffect(() => {
    const savedUser = localStorage.getItem('calculo_mental_user');
    if (savedUser) {
      setCurrentUser(savedUser);
      setGameState('menu');
    }
    const savedTime = localStorage.getItem('calculo_mental_time');
    if (savedTime) {
      setTimeLimit(Number(savedTime));
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', usernameInput));
      const querySnapshot = await getDocs(q);

      if (authMode === 'login') {
        if (querySnapshot.empty) {
          setAuthError('El usuario no existe.');
          return;
        }
        const userDoc = querySnapshot.docs[0].data();
        if (userDoc.password !== passwordInput) {
          setAuthError('Contraseña incorrecta.');
          return;
        }
        
        localStorage.setItem('calculo_mental_user', userDoc.username);
        setCurrentUser(userDoc.username);
        setGameState('menu');
        setUsernameInput('');
        setPasswordInput('');
      } else {
        // Register
        if (!firstNameInput || !lastNameInput) {
          setAuthError('Por favor ingresa nombre y apellido.');
          return;
        }
        if (!querySnapshot.empty) {
          setAuthError('El usuario ya existe.');
          return;
        }
        await addDoc(usersRef, {
          username: usernameInput,
          password: passwordInput,
          firstName: firstNameInput,
          lastName: lastNameInput,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('calculo_mental_user', usernameInput);
        setCurrentUser(usernameInput);
        setGameState('menu');
        setUsernameInput('');
        setPasswordInput('');
        setFirstNameInput('');
        setLastNameInput('');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Error conectando a Firebase. Verifica tu configuración y conexión a internet.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('calculo_mental_user');
    setCurrentUser(null);
    setGameState('auth');
  };

  const saveTimeLimit = (newTime: number) => {
    setTimeLimit(newTime);
    localStorage.setItem('calculo_mental_time', newTime.toString());
  };

  const viewLeaderboard = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.reduce((acc: any, doc) => {
        const data = doc.data();
        acc[data.username] = data;
        return acc;
      }, {});

      const scoresSnapshot = await getDocs(collection(db, 'scores'));
      
      const userScores: Record<string, Record<string, number>> = {};
      
      scoresSnapshot.forEach(doc => {
        const data = doc.data();
        if (!userScores[data.username]) userScores[data.username] = {};
        const currentMax = userScores[data.username][data.gameId] || 0;
        if (data.score > currentMax) {
          userScores[data.username][data.gameId] = data.score;
        }
      });

      const processedLeaderboard = Object.keys(userScores).map(username => {
        const games = userScores[username];
        const totalScore = Object.values(games).reduce((sum, score) => sum + score, 0);
        const user = usersData[username];
        return {
          username,
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          totalScore,
          totalGames: Object.keys(games).length
        };
      });

      processedLeaderboard.sort((a, b) => b.totalScore - a.totalScore);
      setLeaderboard(processedLeaderboard.slice(0, 50));
      setGameState('scores');
    } catch (err) {
      console.error(err);
    }
  };

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
    setTimeLeft(timeLimit);
    setSelectedAnswer(null);
    setIsCorrect(null);
  }, [activeGame, timeLimit]);

  const handleAnswer = useCallback((answer: number | string) => {
    if (selectedAnswer !== null || !question || !activeGame) return;
    
    setSelectedAnswer(answer);
    const correct = String(answer) === String(question.answer);
    setIsCorrect(correct);
    
    if (correct) {
      sounds.playCorrect();
      setScore(s => Math.min(1000, s + 10 * level));
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
          
          if (currentUser) {
            const cappedScore = Math.min(1000, score);
            addDoc(collection(db, 'scores'), {
              username: currentUser,
              gameId: activeGame.id,
              score: cappedScore,
              level: level,
              date: new Date().toISOString()
            }).catch(err => console.error('Error saving score to Firebase:', err));
          }
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
  }, [question, selectedAnswer, level, streak, lives, nextQuestion, activeGame, currentUser, score]);

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
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans text-white">
      {gameState === 'auth' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700">
            <h1 className="text-3xl font-black mb-6 text-center bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Calculo Mental
            </h1>
            
            <div className="flex gap-4 mb-6">
              <button 
                className={`flex-1 py-2 font-bold rounded-lg transition-colors ${authMode === 'login' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
              >
                Iniciar Sesión
              </button>
              <button 
                className={`flex-1 py-2 font-bold rounded-lg transition-colors ${authMode === 'register' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                onClick={() => { setAuthMode('register'); setAuthError(''); }}
              >
                Registro
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'register' && (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-400 mb-1">Nombre</label>
                    <input 
                      type="text" 
                      value={firstNameInput}
                      onChange={e => setFirstNameInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tu nombre"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-400 mb-1">Apellido</label>
                    <input 
                      type="text" 
                      value={lastNameInput}
                      onChange={e => setLastNameInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tu apellido"
                      required
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nombre de Usuario</label>
                <input 
                  type="text" 
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tu usuario"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Contraseña</label>
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="********"
                  required
                />
              </div>
              
              {authError && <div className="text-red-400 text-sm font-medium">{authError}</div>}
              
              <button 
                type="submit" 
                className="w-full py-4 mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-bold text-lg shadow-lg"
              >
                {authMode === 'login' ? 'Entrar' : 'Crear Cuenta'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="h-px bg-slate-700 flex-1"></div>
                <span className="text-slate-500 font-medium text-sm">O</span>
                <div className="h-px bg-slate-700 flex-1"></div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCurrentUser(null);
                  setGameState('menu');
                }}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl font-bold text-slate-300 transition-colors"
              >
                Jugar como Invitado
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {gameState === 'settings' && (
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="max-w-md w-full bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700"
        >
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => setGameState('menu')}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors font-medium border border-slate-600"
            >
              <ArrowLeft className="w-5 h-5" /> Volver
            </button>
            <h2 className="text-2xl font-bold text-center flex-1 pr-6">Configuración</h2>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700 shadow-inner">
            <div className="mb-4">
              <label className="flex justify-between items-center text-lg font-bold mb-2">
                <span>Tiempo Límite (Segundos)</span>
                <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg shadow-md">{timeLimit}s</span>
              </label>
              <p className="text-sm text-slate-400 mb-6">Ajusta cuánto tiempo tienes para responder cada pregunta. (Mínimo 4s, Máximo 10s).</p>
              <input 
                type="range" 
                min="4" 
                max="10" 
                value={timeLimit}
                onChange={(e) => saveTimeLimit(Number(e.target.value))}
                className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-xs font-bold text-slate-500 mt-2">
                <span>4s</span>
                <span>10s</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {gameState === 'scores' && (
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="max-w-4xl w-full"
        >
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => setGameState('menu')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors font-medium border border-slate-700"
            >
              <ArrowLeft className="w-5 h-5" /> Volver al Menú
            </button>
            <h2 className="text-3xl font-bold text-center flex-1">Tabla de Puntajes</h2>
          </div>
          
          <div className="bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 shadow-xl">
            {leaderboard.length === 0 ? (
              <div className="p-8 text-center text-slate-400">Aún no hay puntajes registrados.</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="p-4 font-semibold text-slate-300">Posición</th>
                    <th className="p-4 font-semibold text-slate-300">Estudiante</th>
                    <th className="p-4 font-semibold text-slate-300">Usuario</th>
                    <th className="p-4 font-semibold text-slate-300 text-center">Juegos</th>
                    <th className="p-4 font-semibold text-slate-300 text-right">Puntaje Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {leaderboard.map((item, idx) => {
                    return (
                      <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                        <td className="p-4 font-bold text-slate-400">#{idx + 1}</td>
                        <td className="p-4 font-medium text-white">{item.firstName} {item.lastName}</td>
                        <td className="p-4 font-bold text-indigo-300">@{item.username}</td>
                        <td className="p-4 text-center">{item.totalGames}</td>
                        <td className="p-4 font-black text-yellow-400 text-right text-xl">{item.totalScore}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      )}

      {gameState === 'menu' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl w-full"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-lg gap-4">
            <div className="text-xl font-bold">
              Hola, <span className="text-indigo-400">{currentUser || 'Invitado'}</span> 👋
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button onClick={() => setGameState('settings')} className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors font-medium text-sm sm:text-base">
                <Settings className="w-5 h-5 text-slate-300" /> Configuración
              </button>
              <button onClick={viewLeaderboard} className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors font-medium text-sm sm:text-base">
                <ListOrdered className="w-5 h-5 text-indigo-300" /> Puntajes
              </button>
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-2 px-3 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-xl transition-colors font-medium text-sm sm:text-base"
              >
                <LogOut className="w-5 h-5" /> {currentUser ? 'Salir' : 'Volver'}
              </button>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Matemáticas Divertidas
            </h1>
            <p className="text-lg text-slate-400">Selecciona un juego para comenzar a practicar</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {games.map(game => {
              const Icon = game.icon;
              return (
                <motion.button
                  key={game.id}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectGame(game.id)}
                  className={`bg-gradient-to-br ${game.gradient} p-5 rounded-3xl shadow-xl text-left relative overflow-hidden group border border-white/10`}
                >
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Icon className="w-10 h-10 mb-3 text-white drop-shadow-md" />
                  <h3 className="text-xl font-bold mb-2 drop-shadow-sm leading-tight">{game.title}</h3>
                  <p className="text-xs text-white/90 drop-shadow-sm line-clamp-3 leading-relaxed">
                    {game.description}
                  </p>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      )}

      {['start', 'playing', 'gameover'].includes(gameState) && activeGame && (
        <div className="max-w-4xl w-full">
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
                    className="absolute top-6 left-6 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  
                  <div className="mb-8 flex justify-center mt-4">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center shadow-inner">
                      <activeGame.icon className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h1 className="text-4xl font-bold mb-4 tracking-tight drop-shadow-md">{activeGame.title}</h1>
                  <p className="text-lg text-white/90 mb-8 drop-shadow-sm leading-snug">
                    {activeGame.description} ¡Tienes {timeLimit} segundos por pregunta!
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
                  className="p-6 relative"
                >
                  <div className="absolute top-4 right-4 flex gap-2 z-10">
                    <button onClick={startGame} title="Reiniciar Juego" className="p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors backdrop-blur-sm border border-white/10">
                      <RotateCcw className="w-5 h-5" />
                    </button>
                    <button onClick={backToMenu} title="Salir al Menú" className="p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors backdrop-blur-sm border border-white/10">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex justify-between items-center mb-6 mt-8">
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
                      <Trophy className="w-4 h-4 text-yellow-300" />
                      <span className="font-bold text-sm">{score}</span>
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
                            className={`w-5 h-5 sm:w-6 sm:h-6 ${i < lives ? 'text-red-400' : 'text-slate-300/50'}`}
                            fill="currentColor"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-8 pl-1 pr-1">
                    <div className="flex justify-between text-sm font-medium mb-2 opacity-90">
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Tiempo</span>
                      <span>{timeLeft}s</span>
                    </div>
                    <div className="h-4 bg-black/20 rounded-full overflow-hidden border border-white/10 shadow-inner">
                      <motion.div
                        className={`h-full ${timeLeft <= 2 ? 'bg-red-500' : 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]'}`}
                        initial={{ width: '100%' }}
                        animate={{ width: `${(timeLeft / timeLimit) * 100}%` }}
                        transition={{ duration: 1, ease: "linear" }}
                      />
                    </div>
                  </div>

                  <div className="text-center mb-8 min-h-[140px] flex flex-col items-center justify-center">
                    {question.component ? (
                      <motion.div
                        key={`comp-${level}-${streak}`}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex flex-col items-center justify-center w-full"
                      >
                        {question.component}
                      </motion.div>
                    ) : (null)}
                    
                    {question.text && (
                      <motion.div
                        key={`text-${question.answer}`}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-4xl sm:text-6xl font-black tracking-tighter drop-shadow-xl mt-4"
                      >
                        {question.text}
                      </motion.div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {question.options.map((opt, i) => {
                      let btnClass = "bg-white/20 hover:bg-white/30 text-white border-white/20 shadow-md";
                      if (selectedAnswer !== null) {
                        if (String(opt) === String(question.answer)) {
                          btnClass = "bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.6)] border-green-400";
                        } else if (String(opt) === String(selectedAnswer)) {
                          btnClass = "bg-red-500 text-white border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.6)]";
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
                          className={`py-4 sm:py-5 rounded-2xl text-xl sm:text-3xl font-bold transition-all duration-200 border ${btnClass}`}
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
        </div>
      )}
    </div>
  );
}
