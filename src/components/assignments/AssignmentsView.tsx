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
import {
  Assignment,
  AssignmentStatus,
  AssignmentPriority,
} from '../../types';
import {
  ClipboardCheck,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  User,
  FileText,
  Paperclip,
  Check,
  X,
  ChevronDown,
} from 'lucide-react';

interface AssignmentsViewProps {
  onNavigate?: (route: string) => void;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'title'>('deadline');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    course: '',
    description: '',
    lecturer: '',
    assignedDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    dueTime: '23:59',
    status: 'Not Started' as AssignmentStatus,
    priority: 'Medium' as AssignmentPriority,
    weight: '15%',
    notes: '',
  });

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const loadAssignments = async () => {
    if (!userProfile?.uid) return;
    try {
      setLoading(true);
      const subColRef = collection(db, 'users', userProfile.uid, 'assignments');
      const snap = await getDocs(subColRef);
      const list: Assignment[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as Assignment), id: d.id, ownerId: userProfile.uid });
      });

      // Backward compatibility with root collection
      if (list.length === 0) {
        const rootQ = query(collection(db, 'assignments'), where('ownerId', '==', userProfile.uid));
        const rootSnap = await getDocs(rootQ);
        rootSnap.forEach((d) => {
          list.push({ ...(d.data() as Assignment), id: d.id, ownerId: userProfile.uid });
        });
      }

      setAssignments(list);
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [userProfile]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      title: '',
      course: '',
      description: '',
      lecturer: '',
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      dueTime: '23:59',
      status: 'Not Started',
      priority: 'Medium',
      weight: '15%',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (asg: Assignment) => {
    setEditingId(asg.id);
    setFormData({
      title: asg.title || '',
      course: asg.course || asg.unit || '',
      description: asg.description || '',
      lecturer: asg.lecturer || '',
      assignedDate: asg.assignedDate || new Date().toISOString().split('T')[0],
      dueDate: asg.dueDate || '',
      dueTime: asg.dueTime || '23:59',
      status: asg.status || 'Not Started',
      priority: asg.priority || 'Medium',
      weight: asg.weight || '',
      notes: asg.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid || !formData.title || !formData.dueDate) return;

    try {
      if (editingId) {
        // Update
        const docRef = doc(db, 'users', userProfile.uid, 'assignments', editingId);
        await updateDoc(docRef, {
          ...formData,
          unit: formData.course,
          updatedAt: new Date().toISOString(),
        });
        setNotificationMsg('Assignment updated successfully.');
      } else {
        // Create
        await addDoc(collection(db, 'users', userProfile.uid, 'assignments'), {
          ...formData,
          unit: formData.course,
          ownerId: userProfile.uid,
          createdAt: new Date().toISOString(),
        });
        setNotificationMsg('Assignment added to your academic schedule.');
      }

      setIsModalOpen(false);
      setTimeout(() => setNotificationMsg(null), 3000);
      await loadAssignments();
    } catch (err) {
      console.error('Error saving assignment:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userProfile?.uid) return;
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await deleteDoc(doc(db, 'users', userProfile.uid, 'assignments', id));
      setNotificationMsg('Assignment removed.');
      setTimeout(() => setNotificationMsg(null), 3000);
      await loadAssignments();
    } catch (err) {
      console.error('Error deleting assignment:', err);
    }
  };

  const handleToggleComplete = async (asg: Assignment) => {
    if (!userProfile?.uid) return;
    const newStatus: AssignmentStatus = asg.status === 'Completed' || asg.status === 'Submitted'
      ? 'In Progress'
      : 'Completed';
    try {
      await updateDoc(doc(db, 'users', userProfile.uid, 'assignments', asg.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      await loadAssignments();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Calculate countdown text
  const getDeadlineInfo = (dueDateStr: string, dueTimeStr?: string) => {
    if (!dueDateStr) return { text: 'No due date', isOverdue: false, isUrgent: false };
    const target = new Date(`${dueDateStr}T${dueTimeStr || '23:59:00'}`);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)}d`, isOverdue: true, isUrgent: true };
    }
    if (diffDays === 0) {
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
      return { text: `Due today in ${diffHours}h`, isOverdue: false, isUrgent: true };
    }
    if (diffDays === 1) {
      return { text: 'Due tomorrow', isOverdue: false, isUrgent: true };
    }
    return { text: `${diffDays} days left`, isOverdue: false, isUrgent: diffDays <= 3 };
  };

  // Filter and sort assignments
  const units = Array.from(new Set(assignments.map((a) => a.course || a.unit).filter(Boolean)));

  const filtered = assignments.filter((a) => {
    const unitMatch = unitFilter === 'ALL' || (a.course === unitFilter || a.unit === unitFilter);
    const statusMatch = statusFilter === 'ALL' || a.status === statusFilter;
    const searchMatch =
      !searchTerm ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.course && a.course.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.lecturer && a.lecturer.toLowerCase().includes(searchTerm.toLowerCase()));
    return unitMatch && statusMatch && searchMatch;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'deadline') {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy === 'priority') {
      const rank: Record<string, number> = { High: 1, Medium: 2, Low: 3 };
      return (rank[a.priority || 'Medium'] || 2) - (rank[b.priority || 'Medium'] || 2);
    }
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-2">
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Coursework Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading">
            Academic Assignments
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Track coursework, deliverables, and submissions across all semester units.
          </p>
        </div>

        <button
          id="add-assignment-top-btn"
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-600 hover:from-indigo-400 text-white font-bold text-xs flex items-center space-x-2 shadow-[0_0_15px_rgba(99,102,241,0.35)] cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Assignment</span>
        </button>
      </div>

      {notificationMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Controls Bar: Search, Filters, Sorting */}
      <div className="glass-panel rounded-2xl p-4 border border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, unit code, or lecturer..."
            className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Unit Filter */}
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="glass-input rounded-xl px-3 py-2 text-xs text-slate-200 cursor-pointer"
          >
            <option value="ALL">All Units</option>
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input rounded-xl px-3 py-2 text-xs text-slate-200 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Submitted">Submitted</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="glass-input rounded-xl px-3 py-2 text-xs text-slate-200 cursor-pointer"
          >
            <option value="deadline">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="title">Sort by Title</option>
          </select>
        </div>
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-xs text-slate-400">
          Loading your academic assignments...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
          <ClipboardCheck className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No assignments found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'ALL' || unitFilter !== 'ALL'
              ? 'Try changing your search keywords or filter criteria.'
              : 'Add your first semester assignment or coursework deliverable to stay ahead.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs font-semibold cursor-pointer"
          >
            + Add Assignment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((asg) => {
            const deadline = getDeadlineInfo(asg.dueDate, asg.dueTime);
            const isDone = asg.status === 'Completed' || asg.status === 'Submitted';

            return (
              <div
                key={asg.id}
                className={`glass-card rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                  isDone
                    ? 'border-emerald-500/30 opacity-80'
                    : deadline.isOverdue
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : deadline.isUrgent
                    ? 'border-amber-500/40'
                    : 'border-white/10 hover:border-indigo-400/40'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 font-mono text-xs font-bold">
                        {asg.course || asg.unit || 'GENERAL'}
                      </span>
                      {asg.priority && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            asg.priority === 'High'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                              : asg.priority === 'Medium'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {asg.priority} Priority
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(asg)}
                        title={isDone ? 'Mark Incomplete' : 'Mark Completed'}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isDone
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-slate-800/80 border-white/10 text-slate-400 hover:text-emerald-300'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(asg)}
                        className="p-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(asg.id)}
                        className="p-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3
                    className={`text-base font-bold font-heading mb-1 ${
                      isDone ? 'line-through text-slate-400' : 'text-white'
                    }`}
                  >
                    {asg.title}
                  </h3>

                  {asg.description && (
                    <p className="text-xs text-slate-300 line-clamp-2 mb-3">
                      {asg.description}
                    </p>
                  )}

                  {/* Lecturer & Weight Details */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 my-2">
                    {asg.lecturer && (
                      <span className="flex items-center space-x-1">
                        <User className="w-3 h-3 text-cyan-400" />
                        <span>{asg.lecturer}</span>
                      </span>
                    )}
                    {asg.weight && (
                      <span className="font-mono text-slate-300 font-semibold">
                        Weight: {asg.weight}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer: Due date & Countdown */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      {asg.dueDate} {asg.dueTime ? `at ${asg.dueTime}` : ''}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : deadline.isOverdue
                        ? 'bg-rose-500/20 text-rose-300'
                        : deadline.isUrgent
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isDone ? asg.status : deadline.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Assignment Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="glass-panel rounded-2xl w-full max-w-lg p-6 border border-indigo-500/30 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold text-white font-heading flex items-center space-x-2">
                <ClipboardCheck className="w-5 h-5 text-indigo-400" />
                <span>{editingId ? 'Edit Assignment' : 'Add New Assignment'}</span>
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
                  Assignment Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Distributed Key-Value Store Implementation"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Unit Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    placeholder="e.g. CS 301"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Lecturer</label>
                  <input
                    type="text"
                    value={formData.lecturer}
                    onChange={(e) => setFormData({ ...formData, lecturer: e.target.value })}
                    placeholder="e.g. Dr. Vance"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Due Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Due Time</label>
                  <input
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as AssignmentStatus })
                    }
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Completed">Completed</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as AssignmentPriority })
                    }
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Weight</label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="e.g. 20%"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Description / Brief</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Task instructions, marking criteria, repository link..."
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Private Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Personal observations, questions for lecturer..."
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-600 hover:from-indigo-400 text-white font-bold text-xs"
                >
                  {editingId ? 'Save Changes' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
