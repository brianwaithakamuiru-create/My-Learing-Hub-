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
import { AcademicNote, NoteCategory } from '../../types';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Star,
  Trash2,
  Edit3,
  BookOpen,
  Tag,
  Check,
  X,
  Sparkles,
  Calendar,
} from 'lucide-react';

interface NotesViewProps {
  onNavigate?: (route: string) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const [notes, setNotes] = useState<AcademicNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');

  // Modal / Editor states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    course: '',
    category: 'Lecture' as NoteCategory,
    summary: '',
    tags: '',
    isPinned: false,
    isFavorite: false,
  });

  const loadNotes = async () => {
    if (!userProfile?.uid) return;
    try {
      setLoading(true);
      const subColRef = collection(db, 'users', userProfile.uid, 'notes');
      const snap = await getDocs(subColRef);
      const list: AcademicNote[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as AcademicNote), id: d.id, ownerId: userProfile.uid });
      });

      // Backward compatibility with root collection
      if (list.length === 0) {
        const rootQ = query(collection(db, 'notes'), where('ownerId', '==', userProfile.uid));
        const rootSnap = await getDocs(rootQ);
        rootSnap.forEach((d) => {
          list.push({ ...(d.data() as AcademicNote), id: d.id, ownerId: userProfile.uid });
        });
      }

      setNotes(list);
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [userProfile]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      title: '',
      course: '',
      category: 'Lecture',
      summary: '',
      tags: '',
      isPinned: false,
      isFavorite: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note: AcademicNote) => {
    setEditingId(note.id);
    setFormData({
      title: note.title,
      course: note.course || note.unit || '',
      category: note.category || 'Lecture',
      summary: note.summary || note.content || '',
      tags: note.tags ? note.tags.join(', ') : '',
      isPinned: Boolean(note.isPinned),
      isFavorite: Boolean(note.isFavorite),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid || !formData.title) return;

    const parsedTags = formData.tags
      ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    try {
      if (editingId) {
        await updateDoc(doc(db, 'users', userProfile.uid, 'notes', editingId), {
          title: formData.title,
          course: formData.course || 'General',
          unit: formData.course || 'General',
          category: formData.category,
          summary: formData.summary,
          content: formData.summary,
          tags: parsedTags,
          isPinned: formData.isPinned,
          isFavorite: formData.isFavorite,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await addDoc(collection(db, 'users', userProfile.uid, 'notes'), {
          title: formData.title,
          course: formData.course || 'General',
          unit: formData.course || 'General',
          category: formData.category,
          summary: formData.summary,
          content: formData.summary,
          tags: parsedTags,
          isPinned: formData.isPinned,
          isFavorite: formData.isFavorite,
          date: new Date().toISOString().split('T')[0],
          ownerId: userProfile.uid,
          createdAt: new Date().toISOString(),
        });
      }

      setIsModalOpen(false);
      await loadNotes();
    } catch (err) {
      console.error('Error saving note:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userProfile?.uid) return;
    if (!window.confirm('Delete this academic note?')) return;
    try {
      await deleteDoc(doc(db, 'users', userProfile.uid, 'notes', id));
      await loadNotes();
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const togglePin = async (note: AcademicNote) => {
    if (!userProfile?.uid) return;
    try {
      await updateDoc(doc(db, 'users', userProfile.uid, 'notes', note.id), {
        isPinned: !note.isPinned,
      });
      await loadNotes();
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
  };

  const toggleFavorite = async (note: AcademicNote) => {
    if (!userProfile?.uid) return;
    try {
      await updateDoc(doc(db, 'users', userProfile.uid, 'notes', note.id), {
        isFavorite: !note.isFavorite,
      });
      await loadNotes();
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  // Aggregates for filter dropdowns
  const allUnits = Array.from(
    new Set(notes.map((n) => n.course || n.unit).filter(Boolean))
  );
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags || [])));

  const filtered = notes.filter((n) => {
    const catMatch = selectedCategory === 'ALL' || n.category === selectedCategory;
    const unitMatch = selectedUnit === 'ALL' || n.course === selectedUnit || n.unit === selectedUnit;
    const tagMatch = selectedTag === 'ALL' || (n.tags && n.tags.includes(selectedTag));
    const searchMatch =
      !searchTerm ||
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.summary && n.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (n.course && n.course.toLowerCase().includes(searchTerm.toLowerCase()));
    return catMatch && unitMatch && tagMatch && searchMatch;
  });

  // Sort pinned items first, then by date descending
  filtered.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Academic Notebook & Synthesis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading">
            Personal Notes
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Capture lecture notes, quick revisions, summaries, and coursework observations.
          </p>
        </div>

        <button
          id="add-note-top-btn"
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-[0_0_15px_rgba(34,211,238,0.35)] cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notes, tags, or concepts..."
            className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="glass-input rounded-xl px-3 py-2 text-xs text-slate-200 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="Lecture">Lecture Notes</option>
            <option value="Revision">Revision Notes</option>
            <option value="Assignment">Assignment Notes</option>
            <option value="Quick">Quick Notes</option>
            <option value="Personal">Personal Notes</option>
          </select>

          {/* Unit Filter */}
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="glass-input rounded-xl px-3 py-2 text-xs text-slate-200 cursor-pointer"
          >
            <option value="ALL">All Units</option>
            {allUnits.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="glass-input rounded-xl px-3 py-2 text-xs text-slate-200 cursor-pointer"
            >
              <option value="ALL">All Tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-xs text-slate-400">
          Loading your notes...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No notes match your filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm || selectedCategory !== 'ALL'
              ? 'Try resetting the filters or searching for different keywords.'
              : 'Create your first lecture or revision note to begin building your academic knowledge.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs font-semibold cursor-pointer"
          >
            + Create Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((note) => (
            <div
              key={note.id}
              className={`glass-card rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                note.isPinned
                  ? 'border-cyan-400/50 bg-cyan-950/20 shadow-[0_0_20px_rgba(34,211,238,0.1)]'
                  : 'border-white/10 hover:border-cyan-400/40'
              }`}
            >
              <div>
                {/* Card Top: Unit & Controls */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono text-[11px] font-bold">
                      {note.course || note.unit || 'GENERAL'}
                    </span>
                    {note.category && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {note.category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => togglePin(note)}
                      title={note.isPinned ? 'Unpin' : 'Pin to top'}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        note.isPinned
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-slate-800/80 border-white/10 text-slate-400 hover:text-cyan-300'
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(note)}
                      title={note.isFavorite ? 'Remove favorite' : 'Mark favorite'}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        note.isFavorite
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-slate-800/80 border-white/10 text-slate-400 hover:text-amber-300'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(note)}
                      className="p-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(note.id)}
                      className="p-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white font-heading mb-2 line-clamp-2">
                  {note.title}
                </h3>

                {/* Summary / Body */}
                <p className="text-xs text-slate-300 line-clamp-4 leading-relaxed whitespace-pre-wrap">
                  {note.summary || note.content}
                </p>
              </div>

              {/* Card Footer: Tags & Date */}
              <div className="mt-4 pt-3 border-t border-white/10">
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {note.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-white/10 text-slate-400 font-mono"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{note.date || note.createdAt?.split('T')[0]}</span>
                  </span>
                  {note.isPinned && (
                    <span className="text-cyan-400 font-medium">Pinned</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note Editor Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="glass-panel rounded-2xl w-full max-w-xl p-6 border border-cyan-500/30 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold text-white font-heading flex items-center space-x-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span>{editingId ? 'Edit Academic Note' : 'Create Academic Note'}</span>
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
                  Note Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Raft Consensus Algorithm: Election Safety & Quorums"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Unit Code</label>
                  <input
                    type="text"
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    placeholder="e.g. CS 301"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as NoteCategory })
                    }
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="Lecture">Lecture Note</option>
                    <option value="Revision">Revision Note</option>
                    <option value="Assignment">Assignment Note</option>
                    <option value="Quick">Quick Note</option>
                    <option value="Personal">Personal Note</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Note Content & Synthesis <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Capture key theorems, lecture observations, algorithmic complexity..."
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white font-sans leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g. Distributed, Midterm, Consensus"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center space-x-4 pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="rounded text-cyan-500 focus:ring-cyan-400"
                  />
                  <span>Pin note to top of notebook</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFavorite}
                    onChange={(e) => setFormData({ ...formData, isFavorite: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span>Mark as favorite</span>
                </label>
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
                  {editingId ? 'Save Changes' : 'Create Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
