import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowLeft, Users, Filter } from 'lucide-react';
import { games } from '../lib/games';
import { motion } from 'motion/react';

interface TeacherDashboardProps {
  onBack: () => void;
}

export function TeacherDashboard({ onBack }: TeacherDashboardProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState('');
  const [letterFilter, setLetterFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRef = collection(db, 'users');
        const qUsers = query(usersRef, where('role', '==', 'student'));
        const usersSnap = await getDocs(qUsers);
        const usersData = usersSnap.docs.map(d => d.data());
        setStudents(usersData);

        const scoresRef = collection(db, 'scores');
        const scoresSnap = await getDocs(scoresRef);
        const scoresData = scoresSnap.docs.map(d => d.data());
        setScores(scoresData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredStudents = students.filter(s => {
    if (courseFilter && s.course !== courseFilter) return false;
    if (letterFilter && s.letter !== letterFilter) return false;
    return true;
  }).sort((a, b) => {
    if (a.course !== b.course) return (a.course || '').localeCompare(b.course || '');
    if (a.letter !== b.letter) return (a.letter || '').localeCompare(b.letter || '');
    return (a.lastName || '').localeCompare(b.lastName || '');
  });

  const getStudentMaxLevels = (username: string) => {
    const studentScores = scores.filter(s => s.username === username);
    const maxLevels: Record<string, number> = {};
    
    // Inicializar en nivel 1
    games.forEach(g => {
      maxLevels[g.id] = 1;
    });

    studentScores.forEach(s => {
      if (s.gameId && s.level) {
        if (!maxLevels[s.gameId] || s.level > maxLevels[s.gameId]) {
          maxLevels[s.gameId] = s.level;
        }
      }
    });
    return maxLevels;
  };

  const courses = Array.from(new Set(students.map(s => s.course).filter(Boolean))).sort();
  const letters = Array.from(new Set(students.map(s => s.letter).filter(Boolean))).sort();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl w-full"
    >
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-lg gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            Panel de Profesora
          </h1>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-600">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={courseFilter} 
              onChange={e => setCourseFilter(e.target.value)}
              className="bg-transparent text-white outline-none text-sm"
            >
              <option value="">Todos los cursos</option>
              {courses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-600">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={letterFilter} 
              onChange={e => setLetterFilter(e.target.value)}
              className="bg-transparent text-white outline-none text-sm"
            >
              <option value="">Todas las letras</option>
              {letters.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-3xl overflow-x-auto border border-slate-700 shadow-xl p-4">
        {loading ? (
          <div className="text-center p-8 text-slate-400">Cargando datos de estudiantes...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center p-8 text-slate-400">No hay estudiantes que coincidan con los filtros.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="p-3 text-sm font-semibold text-slate-300 border-b border-slate-700">Estudiante</th>
                <th className="p-3 text-sm font-semibold text-slate-300 border-b border-slate-700 text-center">Curso</th>
                {games.map(g => (
                  <th key={g.id} className="p-3 text-xs font-semibold text-slate-300 border-b border-slate-700 text-center" title={g.title}>
                    <g.icon className="w-4 h-4 mx-auto mb-1 opacity-70" />
                    <span className="truncate block max-w-[80px]">{g.title}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredStudents.map((student, idx) => {
                const maxLevels = getStudentMaxLevels(student.username);
                return (
                  <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white">{student.lastName}, {student.firstName}</div>
                      <div className="text-xs text-indigo-300">@{student.username}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="bg-slate-700 px-2 py-1 rounded text-sm font-medium">{student.course} {student.letter}</span>
                    </td>
                    {games.map(g => (
                      <td key={g.id} className="p-3 text-center">
                        <span className={`inline-block w-8 h-8 leading-8 rounded-full text-sm font-bold ${
                          maxLevels[g.id] > 1 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {maxLevels[g.id]}
                        </span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
