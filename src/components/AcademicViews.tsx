import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  AcademicClass,
  Assignment,
  AcademicNote,
} from '../types';
import {
  fetchUserClasses,
  createUserClass,
  deleteUserClass,
  fetchUserAssignments,
  createUserAssignment,
  updateUserAssignmentStatus,
  deleteUserAssignment,
  fetchUserNotes,
  createUserNote,
  deleteUserNote,
} from '../services/workplaceService';
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  BookmarkCheck,
  Library,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  Trash2,
  Search,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Tag,
} from 'lucide-react';

interface SubPageProps {
  onNavigate: (route: string) => void;
}

// ==========================================
// 1. CLASSES VIEW (Real Firestore Data)
// ==========================================
export const ClassesView: React.FC<SubPageProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClass, setNewClass] = useState({
    code: '',
    name: '',
    instructor: '',
    room: '',
    schedule: '',
    semester: 'Fall 2026',
    color: 'border-cyan-400',
  });

  const loadClasses = async () => {
    if (!userProfile?.uid) return;
    try {
      const list = await fetchUserClasses(userProfile.uid);
      setClasses(list);
    } catch (err) {
      console.error('Failed to load classes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, [userProfile]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid || !newClass.code || !newClass.name) return;
    try {
      await createUserClass(userProfile.uid, newClass);
      setShowAddModal(false);
      setNewClass({
        code: '',
        name: '',
        instructor: '',
        room: '',
        schedule: '',
        semester: 'Fall 2026',
        color: 'border-cyan-400',
      });
      await loadClasses();
    } catch (err) {
      console.error('Failed to create class:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this course?')) return;
    try {
      await deleteUserClass(id);
      setClasses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Failed to delete class:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading">Enrolled Courses</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Current active academic curriculum synchronized with your student profile
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 text-slate-950 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center space-x-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll Course</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/documents')}
            className="px-4 py-2 bg-slate-900/80 hover:bg-slate-800 border border-cyan-400/40 text-cyan-300 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Browse Class Documents →
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 text-xs">
          Loading courses from Firestore...
        </div>
      ) : classes.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-dashed border-white/10 space-y-3">
          <BookOpen className="w-8 h-8 text-cyan-400 mx-auto opacity-80" />
          <h3 className="text-base font-bold text-white font-heading">No Enrolled Courses Yet</h3>
          <p className="text-xs text-slate-300 max-w-sm mx-auto">
            Add your subjects to keep lecture slides, timetables, and assignment deadlines organized.
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold cursor-pointer"
          >
            + Add Your First Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className={`glass-card rounded-2xl p-5 border-l-4 ${cls.color || 'border-cyan-400'} hover:border-cyan-400/60 transition-all flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-cyan-400">{cls.code}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                      {cls.semester || 'Active'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(cls.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                      title="Delete Course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{cls.name}</h3>
                <p className="text-xs text-slate-300">
                  {cls.instructor ? `Instructor: ${cls.instructor}` : 'Faculty of Sciences'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span>{cls.room || 'Main Hall'}</span>
                <span className="text-cyan-300 font-mono text-[11px]">{cls.schedule || 'TBA'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Class Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="glass-panel rounded-2xl w-full max-w-md p-6 border border-cyan-500/30 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white font-heading">Enroll New Course</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    value={newClass.code}
                    onChange={(e) => setNewClass({ ...newClass, code: e.target.value })}
                    placeholder="e.g. CS 301"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Semester</label>
                  <input
                    type="text"
                    value={newClass.semester}
                    onChange={(e) => setNewClass({ ...newClass, semester: e.target.value })}
                    placeholder="Fall 2026"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  placeholder="e.g. Distributed Systems & Cloud Architecture"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Instructor</label>
                  <input
                    type="text"
                    value={newClass.instructor}
                    onChange={(e) => setNewClass({ ...newClass, instructor: e.target.value })}
                    placeholder="e.g. Prof. Vance"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Lecture Hall / Room</label>
                  <input
                    type="text"
                    value={newClass.room}
                    onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                    placeholder="e.g. Hall B4"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Schedule</label>
                <input
                  type="text"
                  value={newClass.schedule}
                  onChange={(e) => setNewClass({ ...newClass, schedule: e.target.value })}
                  placeholder="e.g. Mon & Wed • 14:00 - 15:30"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. ASSIGNMENTS VIEW (Real Firestore Data)
// ==========================================
export const AssignmentsView: React.FC<SubPageProps> = () => {
  const { userProfile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'In Progress' | 'Submitted'>('All');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    course: '',
    dueDate: '',
    weight: '15% Final Grade',
    status: 'Pending' as const,
  });

  const loadAssignments = async () => {
    if (!userProfile?.uid) return;
    try {
      const list = await fetchUserAssignments(userProfile.uid);
      setAssignments(list);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [userProfile]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid || !newAssignment.title) return;
    try {
      await createUserAssignment(userProfile.uid, {
        ...newAssignment,
        course: newAssignment.course || 'CS 301',
        dueDate: newAssignment.dueDate || new Date().toISOString().split('T')[0],
      });
      setShowAddModal(false);
      setNewAssignment({
        title: '',
        course: '',
        dueDate: '',
        weight: '15% Final Grade',
        status: 'Pending',
      });
      await loadAssignments();
    } catch (err) {
      console.error('Failed to create assignment:', err);
    }
  };

  const handleCycleStatus = async (asg: Assignment) => {
    const nextStatus =
      asg.status === 'Pending'
        ? 'In Progress'
        : asg.status === 'In Progress'
        ? 'Submitted'
        : 'Pending';
    try {
      await updateUserAssignmentStatus(asg.id, nextStatus);
      setAssignments((prev) =>
        prev.map((a) => (a.id === asg.id ? { ...a, status: nextStatus } : a))
      );
    } catch (err) {
      console.error('Failed to update assignment status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;
    try {
      await deleteUserAssignment(id);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Failed to delete assignment:', err);
    }
  };

  const filtered = assignments.filter((a) => (filter === 'All' ? true : a.status === filter));

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading">Assignments & Tasks</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Track coursework deadlines, problem sets, and submission statuses
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex rounded-xl bg-slate-900/80 p-1 border border-white/10 text-xs">
            {(['All', 'Pending', 'In Progress', 'Submitted'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  filter === f
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 text-slate-950 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center space-x-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 text-xs">
          Loading assignments from Firestore...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-dashed border-white/10 space-y-3">
          <ClipboardList className="w-8 h-8 text-cyan-400 mx-auto opacity-80" />
          <h3 className="text-base font-bold text-white font-heading">
            {filter === 'All' ? 'No Assignments Logged Yet' : `No ${filter} Assignments`}
          </h3>
          <p className="text-xs text-slate-300 max-w-sm mx-auto">
            Keep track of all upcoming academic deadlines with due date reminders.
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold cursor-pointer"
          >
            + Add Assignment
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((asg) => {
            const isSubmitted = asg.status === 'Submitted';
            const isInProgress = asg.status === 'In Progress';
            return (
              <div
                key={asg.id}
                className={`glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 transition-all ${
                  isSubmitted
                    ? 'border-emerald-400 opacity-75'
                    : isInProgress
                    ? 'border-cyan-400'
                    : 'border-amber-400'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <button
                    type="button"
                    onClick={() => handleCycleStatus(asg)}
                    className={`w-6 h-6 rounded-lg mt-0.5 flex items-center justify-center border transition-colors cursor-pointer ${
                      isSubmitted
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : isInProgress
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-800 border-white/20 text-transparent hover:border-cyan-400'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        {asg.course}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          isSubmitted
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isInProgress
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {asg.status}
                      </span>
                    </div>
                    <h4
                      className={`text-sm font-semibold text-white mt-1 ${
                        isSubmitted ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {asg.title}
                    </h4>
                    <span className="text-[11px] text-slate-400">{asg.weight}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-4 pl-9 sm:pl-0">
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-300 font-mono block">
                      Due: {asg.dueDate}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCycleStatus(asg)}
                      className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      Mark as {asg.status === 'Pending' ? 'In Progress' : asg.status === 'In Progress' ? 'Submitted' : 'Pending'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(asg.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                    title="Delete Assignment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Assignment Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="glass-panel rounded-2xl w-full max-w-md p-6 border border-cyan-500/30 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white font-heading">Add Assignment</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  placeholder="e.g. Distributed Key-Value Store Implementation"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Course</label>
                  <input
                    type="text"
                    value={newAssignment.course}
                    onChange={(e) => setNewAssignment({ ...newAssignment, course: e.target.value })}
                    placeholder="e.g. CS 301"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newAssignment.dueDate}
                    onChange={(e) =>
                      setNewAssignment({ ...newAssignment, dueDate: e.target.value })
                    }
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Grade Weight</label>
                <input
                  type="text"
                  value={newAssignment.weight}
                  onChange={(e) => setNewAssignment({ ...newAssignment, weight: e.target.value })}
                  placeholder="e.g. 20% of Final Grade"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. NOTES VIEW (Real Firestore Data)
// ==========================================
export const NotesView: React.FC<SubPageProps> = () => {
  const { userProfile } = useAuth();
  const [notes, setNotes] = useState<AcademicNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({
    title: '',
    course: '',
    summary: '',
    tags: '',
  });

  const loadNotes = async () => {
    if (!userProfile?.uid) return;
    try {
      const list = await fetchUserNotes(userProfile.uid);
      setNotes(list);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [userProfile]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid || !newNote.title) return;
    try {
      await createUserNote(userProfile.uid, {
        title: newNote.title,
        course: newNote.course || 'CS 301',
        date: new Date().toISOString().split('T')[0],
        summary: newNote.summary,
        tags: newNote.tags ? newNote.tags.split(',').map((t) => t.trim()) : ['Lecture'],
      });
      setShowAddModal(false);
      setNewNote({ title: '', course: '', summary: '', tags: '' });
      await loadNotes();
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await deleteUserNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading">Academic Notes & Syntheses</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Personal lecture syntheses, formulas, and deep revision summaries
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="glass-input rounded-xl pl-8 pr-3 py-1.5 text-xs text-white"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 text-slate-950 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center space-x-1.5 shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 text-xs">
          Loading lecture notes from Firestore...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-dashed border-white/10 space-y-3">
          <FileText className="w-8 h-8 text-cyan-400 mx-auto opacity-80" />
          <h3 className="text-base font-bold text-white font-heading">No Academic Notes Found</h3>
          <p className="text-xs text-slate-300 max-w-sm mx-auto">
            Capture your lecture key points, theorems, and study summaries in your private vault.
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold cursor-pointer"
          >
            + Create First Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filtered.map((note) => (
            <div
              key={note.id}
              className="glass-card rounded-2xl p-5 border border-white/10 flex flex-col justify-between hover:border-cyan-400/40 transition-all space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-cyan-400">{note.course}</span>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(note.id, `${note.title}\n\n${note.summary}`)}
                      className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      title="Copy note content"
                    >
                      {copiedId === note.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(note.id)}
                      className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-semibold text-white mb-2">{note.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">{note.summary}</p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                <span>{note.date}</span>
                <div className="flex flex-wrap gap-1">
                  {note.tags?.slice(0, 2).map((t, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-cyan-300 font-mono"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Note Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="glass-panel rounded-2xl w-full max-w-md p-6 border border-cyan-500/30 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white font-heading">New Lecture Note</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Note Title</label>
                <input
                  type="text"
                  required
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="e.g. Raft Consensus Algorithm & Invariants"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Course Code</label>
                <input
                  type="text"
                  value={newNote.course}
                  onChange={(e) => setNewNote({ ...newNote, course: e.target.value })}
                  placeholder="e.g. CS 301"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Synthesis Content</label>
                <textarea
                  required
                  rows={4}
                  value={newNote.summary}
                  onChange={(e) => setNewNote({ ...newNote, summary: e.target.value })}
                  placeholder="Key theorems, algorithmic complexity, lecture observations..."
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newNote.tags}
                  onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                  placeholder="e.g. Distributed, Midterm, Consensus"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. TIMETABLE VIEW (Real KEMU Personal Timetable System)
// ==========================================
export { TimetableView } from './timetable/TimetableView';

// ==========================================
// 5. REVISION & EXAM PREP VIEW
// ==========================================
export const RevisionView: React.FC<SubPageProps> = () => {
  const [topics, setTopics] = useState([
    { id: '1', course: 'CS 301', title: 'Raft Protocol & Leader Election', confidence: 85 },
    { id: '2', course: 'CS 301', title: 'Two-Phase Commit (2PC) & Paxos', confidence: 70 },
    { id: '3', course: 'MATH 204', title: 'Bayesian Inference & Conjugate Priors', confidence: 65 },
    { id: '4', course: 'MATH 204', title: 'Hypothesis Testing & Power of Test', confidence: 90 },
    { id: '5', course: 'BIO 215', title: 'CRISPR Cas9 Double-Strand Repair', confidence: 60 },
  ]);

  const incrementConfidence = (id: string) => {
    setTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, confidence: Math.min(100, t.confidence + 10) } : t))
    );
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold text-white font-heading">Revision & Exam Readiness</h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Active recall topic trackers, confidence levels, and syllabus mastery
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Topic Mastery Checklist */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white font-heading flex items-center justify-between">
            <span>Syllabus Confidence Tracker</span>
            <BookmarkCheck className="w-4 h-4 text-cyan-400" />
          </h3>

          <div className="space-y-3">
            {topics.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">{t.course}</span>
                    <span className="text-xs font-semibold text-white">{t.title}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-sky-500 rounded-full"
                      style={{ width: `${t.confidence}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span className="text-xs font-mono text-cyan-300 font-bold">{t.confidence}%</span>
                  <button
                    type="button"
                    onClick={() => incrementConfidence(t.id)}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-medium border border-cyan-400/30 cursor-pointer"
                  >
                    + Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Past Paper Question Vault */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-heading mb-3">
              Past Paper Archives
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Access previous university examinations and marking schemes directly synchronized with your course codes.
            </p>

            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-white/5 text-xs flex justify-between items-center">
                <span>CS 301 Final Exam 2025</span>
                <span className="text-cyan-400 font-mono text-[10px]">PDF</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-white/5 text-xs flex justify-between items-center">
                <span>MATH 204 Midterm 2024</span>
                <span className="text-sky-400 font-mono text-[10px]">PDF</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-white/5 text-xs flex justify-between items-center">
                <span>BIO 215 Genomics Mock Test</span>
                <span className="text-emerald-400 font-mono text-[10px]">DOCX</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <span className="text-xs text-slate-400 block mb-2">Midterm Exams Approach:</span>
            <span className="text-sm font-bold text-amber-300 font-mono">24 Days Remaining</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 6. KNOWLEDGE VAULT & CITATION GENERATOR
// ==========================================
export const KnowledgeVaultView: React.FC<SubPageProps> = () => {
  const [citationForm, setCitationForm] = useState({
    author: 'Lamport, Leslie',
    title: 'Time, Clocks, and the Ordering of Events in a Distributed System',
    journal: 'Communications of the ACM',
    year: '1978',
    volume: '21',
    issue: '7',
    pages: '558-565',
    doi: '10.1145/359545.359563',
  });

  const [style, setStyle] = useState<'APA' | 'IEEE' | 'BibTeX' | 'MLA'>('APA');
  const [copied, setCopied] = useState(false);

  const generateCitation = () => {
    const { author, title, journal, year, volume, issue, pages, doi } = citationForm;
    if (style === 'APA') {
      return `${author} (${year}). ${title}. ${journal}, ${volume}(${issue}), ${pages}. https://doi.org/${doi}`;
    }
    if (style === 'IEEE') {
      return `[1] ${author}, "${title}," ${journal}, vol. ${volume}, no. ${issue}, pp. ${pages}, ${year}, doi: ${doi}.`;
    }
    if (style === 'MLA') {
      return `${author}. "${title}." ${journal}, vol. ${volume}, no. ${issue}, ${year}, pp. ${pages}.`;
    }
    // BibTeX
    const firstAuthor = author.split(',')[0].trim().toLowerCase();
    return `@article{${firstAuthor}${year},\n  author = {${author}},\n  title = {${title}},\n  journal = {${journal}},\n  volume = {${volume}},\n  number = {${issue}},\n  pages = {${pages}},\n  year = {${year}},\n  doi = {${doi}}\n}`;
  };

  const citationResult = generateCitation();

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(citationResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold text-white font-heading">Knowledge Vault & Citations</h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Deep academic literature repository, seminal research articles, and bibliography generator
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Citation Generator Tool */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-heading flex items-center space-x-2">
              <Library className="w-4 h-4 text-cyan-400" />
              <span>Academic Citation Formatter</span>
            </h3>
            <div className="flex space-x-1 bg-slate-900/80 p-1 rounded-xl border border-white/10">
              {(['APA', 'IEEE', 'MLA', 'BibTeX'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyle(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    style === s
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Author(s)</label>
                <input
                  type="text"
                  value={citationForm.author}
                  onChange={(e) => setCitationForm({ ...citationForm, author: e.target.value })}
                  className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Year</label>
                <input
                  type="text"
                  value={citationForm.year}
                  onChange={(e) => setCitationForm({ ...citationForm, year: e.target.value })}
                  className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Article / Book Title</label>
              <input
                type="text"
                value={citationForm.title}
                onChange={(e) => setCitationForm({ ...citationForm, title: e.target.value })}
                className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Journal</label>
                <input
                  type="text"
                  value={citationForm.journal}
                  onChange={(e) => setCitationForm({ ...citationForm, journal: e.target.value })}
                  className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Volume/Issue</label>
                <input
                  type="text"
                  value={`${citationForm.volume}(${citationForm.issue})`}
                  onChange={(e) => {
                    const parts = e.target.value.split('(');
                    setCitationForm({
                      ...citationForm,
                      volume: parts[0] || '',
                      issue: parts[1]?.replace(')', '') || '',
                    });
                  }}
                  className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Pages</label>
                <input
                  type="text"
                  value={citationForm.pages}
                  onChange={(e) => setCitationForm({ ...citationForm, pages: e.target.value })}
                  className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Formatted Citation Output */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-cyan-400 font-mono">
              <span>Output ({style} Format)</span>
              <button
                type="button"
                onClick={handleCopyCitation}
                className="flex items-center space-x-1 text-slate-300 hover:text-white cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-200 font-mono whitespace-pre-wrap select-all">
              {citationResult}
            </p>
          </div>
        </div>

        {/* Seminal Academic Literature Index */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white font-heading">
            Indexed Primary Literature
          </h3>
          <p className="text-xs text-slate-300">
            Seminal peer-reviewed research papers frequently referenced across your courses.
          </p>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
              <span className="text-xs font-mono text-cyan-400 font-bold">Distributed Systems</span>
              <h4 className="text-xs font-semibold text-white">
                In Search of an Understandable Consensus Algorithm (Raft)
              </h4>
              <p className="text-[11px] text-slate-400">Ongaro & Ousterhout, USENIX ATC 2014</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
              <span className="text-xs font-mono text-sky-400 font-bold">Mathematics</span>
              <h4 className="text-xs font-semibold text-white">
                An Essay towards Solving a Problem in the Doctrine of Chances
              </h4>
              <p className="text-[11px] text-slate-400">Thomas Bayes, Phil. Trans. R. Soc. 1763</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
              <span className="text-xs font-mono text-emerald-400 font-bold">Genomics</span>
              <h4 className="text-xs font-semibold text-white">
                A Programmable Dual-RNA-Guided DNA Endonuclease in Adaptive Bacterial Immunity
              </h4>
              <p className="text-[11px] text-slate-400">Jinek, Charpentier, Doudna et al., Science 2012</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 7. CALENDAR VIEW
// ==========================================
export const CalendarView: React.FC<SubPageProps> = () => {
  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold text-white font-heading">Academic Calendar</h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Fall 2026 term milestones, lecture periods, exam recesses, and submission deadlines
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-3">
        <h3 className="text-sm font-semibold text-white mb-4">Key Academic Milestones</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
            <div>
              <span className="text-xs font-semibold text-white block">Fall Term Lectures Begin</span>
              <span className="text-[11px] text-slate-400">Orientation & Enrolment validation</span>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-bold">Sep 01, 2026</span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
            <div>
              <span className="text-xs font-semibold text-white block">Midterm Examination Window</span>
              <span className="text-[11px] text-slate-400">Centrally scheduled examinations</span>
            </div>
            <span className="text-xs font-mono text-amber-400 font-bold">Oct 19 – 24, 2026</span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
            <div>
              <span className="text-xs font-semibold text-white block">Final Thesis & Term Deliverables</span>
              <span className="text-[11px] text-slate-400">Strict portal closing at 23:59 UTC</span>
            </div>
            <span className="text-xs font-mono text-rose-400 font-bold">Dec 04, 2026</span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
            <div>
              <span className="text-xs font-semibold text-white block">Winter Academic Break</span>
              <span className="text-[11px] text-slate-400">University closure and grade publishing</span>
            </div>
            <span className="text-xs font-mono text-indigo-400 font-bold">Dec 18, 2026 – Jan 10, 2027</span>
          </div>
        </div>
      </div>
    </div>
  );
};
