import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import {
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  where,
} from 'firebase/firestore';
import { AcademicGoal, GoalCategory } from '../../types';
import {
  Target,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  Trophy,
  Calendar,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';

interface GoalsViewProps {
  onNavigate?: (route: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const [goals, setGoals] = useState<AcademicGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'GPA' as GoalCategory,
    target: '',
    description: '',
    targetDate: '',
    progress: 25,
    completed: false,
  });

  const loadGoals = async () => {
    if (!userProfile?.uid) return;
    try {
      setLoading(true);
      const subColRef = collection(db, 'users', userProfile.uid, 'goals');
      const snap = await getDocs(subColRef);
      const list: AcademicGoal[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as AcademicGoal), id: d.id, ownerId: userProfile.uid });
      });

      // Backward compatibility with root collection
      if (list.length === 0) {
        const rootQ = query(collection(db, 'goals'), where('ownerId', '==', userProfile.uid));
        const rootSnap = await getDocs(rootQ);
        rootSnap.forEach((d) => {
          list.push({ ...(d.data() as AcademicGoal), id: d.id, ownerId: userProfile.uid });
        });
      }

      setGoals(list);
    } catch (err) {
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, [userProfile]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      title: '',
      category: 'GPA',
      target: '3.85 Cumulative GPA',
      description: '',
      targetDate: '',
      progress: 25,
      completed: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (g: AcademicGoal) => {
    setEditingId(g.id);
    setFormData({
      title: g.title,
      category: g.category || 'Study',
      target: g.target || '',
      description: g.description || '',
      targetDate: g.targetDate || '',
      progress: g.progress || 0,
      completed: Boolean(g.completed),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid || !formData.title) return;

    try {
      const isComplete = Number(formData.progress) >= 100;
      if (editingId) {
        await updateDoc(doc(db, 'users', userProfile.uid, 'goals', editingId), {
          ...formData,
          progress: Number(formData.progress),
          completed: isComplete,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await addDoc(collection(db, 'users', userProfile.uid, 'goals'), {
          ...formData,
          progress: Number(formData.progress),
          completed: isComplete,
          ownerId: userProfile.uid,
          createdAt: new Date().toISOString(),
        });
      }

      setIsModalOpen(false);
      await loadGoals();
    } catch (err) {
      console.error('Error saving goal:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userProfile?.uid) return;
    if (!window.confirm('Delete this academic goal?')) return;
    try {
      await deleteDoc(doc(db, 'users', userProfile.uid, 'goals', id));
      await loadGoals();
    } catch (err) {
      console.error('Error deleting goal:', err);
    }
  };

  const handleUpdateProgress = async (g: AcademicGoal, delta: number) => {
    if (!userProfile?.uid) return;
    const newProg = Math.min(100, Math.max(0, (g.progress || 0) + delta));
    try {
      await updateDoc(doc(db, 'users', userProfile.uid, 'goals', g.id), {
        progress: newProg,
        completed: newProg >= 100,
        updatedAt: new Date().toISOString(),
      });
      await loadGoals();
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  const filtered = goals.filter((g) => {
    if (activeCategory === 'ALL') return true;
    return g.category === activeCategory;
  });

  const completedCount = goals.filter((g) => g.completed || (g.progress || 0) >= 100).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-2">
            <Target className="w-3.5 h-3.5" />
            <span>Academic Performance & Milestones</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading">
            Academic Goals & Targets
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Establish semester benchmarks, GPA targets, revision goals, and coursework milestones.
          </p>
        </div>

        <button
          id="add-goal-top-btn"
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-[0_0_15px_rgba(34,211,238,0.35)] cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Set Academic Goal</span>
        </button>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <span className="text-xs text-slate-400 uppercase font-semibold">Active Targets</span>
          <p className="text-2xl font-bold text-white font-heading mt-1">{goals.length}</p>
          <span className="text-[11px] text-cyan-400 font-medium">Semester roadmap</span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-emerald-500/20 bg-emerald-950/10">
          <span className="text-xs text-emerald-400 uppercase font-semibold">Completed Milestones</span>
          <p className="text-2xl font-bold text-emerald-300 font-heading mt-1">{completedCount}</p>
          <span className="text-[11px] text-emerald-400 font-medium">100% Target Met</span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-indigo-500/20 bg-indigo-950/10">
          <span className="text-xs text-indigo-400 uppercase font-semibold">Overall Momentum</span>
          <p className="text-2xl font-bold text-indigo-300 font-heading mt-1">
            {goals.length > 0
              ? Math.round(goals.reduce((acc, curr) => acc + (curr.progress || 0), 0) / goals.length)
              : 0}
            %
          </p>
          <span className="text-[11px] text-indigo-400 font-medium">Average completion rate</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {['ALL', 'GPA', 'Weekly', 'Study', 'Assignment', 'Revision'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeCategory === cat
                ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                : 'bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {cat === 'ALL' ? 'All Goals' : `${cat} Goals`}
          </button>
        ))}
      </div>

      {/* Goals List */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-xs text-slate-400">
          Loading your goals...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No academic goals established</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Set ambitious targets for your university coursework, study hours, or GPA.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs font-semibold cursor-pointer"
          >
            + Establish First Target
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((g) => {
            const isDone = g.completed || (g.progress || 0) >= 100;

            return (
              <div
                key={g.id}
                className={`glass-card rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                  isDone
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : 'border-white/10 hover:border-cyan-400/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono text-[11px] font-bold">
                      {g.category || 'GOAL'}
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(g)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                        title="Edit Goal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(g.id)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white font-heading mb-1">{g.title}</h3>

                  {g.target && (
                    <p className="text-xs text-cyan-300 font-semibold mb-2 flex items-center space-x-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Target: {g.target}</span>
                    </p>
                  )}

                  {g.description && (
                    <p className="text-xs text-slate-300 line-clamp-3 mb-3">{g.description}</p>
                  )}
                </div>

                {/* Progress Controls & Bar */}
                <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Current Progress</span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateProgress(g, -10)}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
                      >
                        -10%
                      </button>
                      <span className="font-mono font-bold text-white px-2">
                        {g.progress || 0}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateProgress(g, +10)}
                        className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold border border-cyan-400/30 cursor-pointer"
                      >
                        +10%
                      </button>
                    </div>
                  </div>

                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDone
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : 'bg-gradient-to-r from-cyan-400 to-sky-500'
                      }`}
                      style={{ width: `${g.progress || 0}%` }}
                    />
                  </div>

                  {g.targetDate && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Deadline: {g.targetDate}</span>
                      </span>
                      {isDone && <span className="text-emerald-400 font-bold">Achieved</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="glass-panel rounded-2xl w-full max-w-md p-6 border border-cyan-500/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <h2 className="text-base font-bold text-white font-heading flex items-center space-x-2">
                <Target className="w-5 h-5 text-cyan-400" />
                <span>{editingId ? 'Edit Academic Goal' : 'Establish Academic Goal'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Goal Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Master Distributed Consensus before Midterms"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as GoalCategory })
                    }
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="GPA">GPA Benchmark</option>
                    <option value="Weekly">Weekly Target</option>
                    <option value="Study">Study Hours</option>
                    <option value="Assignment">Assignment Goal</option>
                    <option value="Revision">Revision Goal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Target / Metric</label>
                  <input
                    type="text"
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    placeholder="e.g. 3.85 GPA or 15h"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Target Date</label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Progress Percentage ({formData.progress}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={formData.progress}
                  onChange={(e) =>
                    setFormData({ ...formData, progress: Number(e.target.value) })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Actionable steps to reach this milestone..."
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  {editingId ? 'Save Changes' : 'Establish Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
