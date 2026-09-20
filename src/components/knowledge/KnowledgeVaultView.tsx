import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchUserKnowledgeItems,
  createKnowledgeItem,
  updateKnowledgeItem,
  deleteKnowledgeItem,
} from '../../services/workplaceService';
import { KnowledgeVaultItem } from '../../types';
import {
  Library,
  Plus,
  Search,
  BookOpen,
  Star,
  Quote,
  Trash2,
  Edit3,
  Copy,
  Check,
  X,
  FileText,
  Tag,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';

interface KnowledgeVaultViewProps {
  onNavigate?: (route: string) => void;
}

export const KnowledgeVaultView: React.FC<KnowledgeVaultViewProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const [items, setItems] = useState<KnowledgeVaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Citation modal
  const [citationItem, setCitationItem] = useState<KnowledgeVaultItem | null>(null);
  const [citationFormat, setCitationFormat] = useState<'APA' | 'IEEE' | 'MLA' | 'BibTeX'>('APA');
  const [copiedCitation, setCopiedCitation] = useState(false);

  // Add/Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    topic: '',
    unitCode: '',
    explanation: '',
    example: '',
    whatILearned: '',
    tags: '',
    relatedNotes: '',
    isFavorite: false,
  });

  const loadItems = async () => {
    if (!userProfile?.uid) return;
    try {
      setLoading(true);
      const list = await fetchUserKnowledgeItems(userProfile.uid);
      setItems(list);
    } catch (err) {
      console.error('Error fetching knowledge vault:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [userProfile]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      topic: '',
      unitCode: '',
      explanation: '',
      example: '',
      whatILearned: '',
      tags: '',
      relatedNotes: '',
      isFavorite: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (it: KnowledgeVaultItem) => {
    setEditingId(it.id);
    setFormData({
      topic: it.topic,
      unitCode: it.unitCode || '',
      explanation: it.explanation || '',
      example: it.example || '',
      whatILearned: it.whatILearned || '',
      tags: it.tags ? it.tags.join(', ') : '',
      relatedNotes: it.relatedNotes ? it.relatedNotes.join(', ') : '',
      isFavorite: Boolean(it.isFavorite),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid || !formData.topic) return;

    const tagsArr = formData.tags
      ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];
    const notesArr = formData.relatedNotes
      ? formData.relatedNotes.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    try {
      if (editingId) {
        await updateKnowledgeItem(userProfile.uid, editingId, {
          topic: formData.topic,
          unitCode: formData.unitCode.toUpperCase(),
          explanation: formData.explanation,
          example: formData.example,
          whatILearned: formData.whatILearned,
          tags: tagsArr,
          relatedNotes: notesArr,
          isFavorite: formData.isFavorite,
        });
      } else {
        await createKnowledgeItem(userProfile.uid, {
          topic: formData.topic,
          unitCode: formData.unitCode.toUpperCase(),
          explanation: formData.explanation,
          example: formData.example,
          whatILearned: formData.whatILearned,
          tags: tagsArr,
          relatedNotes: notesArr,
          isFavorite: formData.isFavorite,
        });
      }

      setIsModalOpen(false);
      await loadItems();
    } catch (err) {
      console.error('Error saving knowledge item:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userProfile?.uid) return;
    if (!window.confirm('Delete this entry from Brian\'s Knowledge Vault?')) return;
    try {
      await deleteKnowledgeItem(userProfile.uid, id);
      await loadItems();
    } catch (err) {
      console.error('Error deleting entry:', err);
    }
  };

  const toggleFavorite = async (it: KnowledgeVaultItem) => {
    if (!userProfile?.uid) return;
    try {
      await updateKnowledgeItem(userProfile.uid, it.id, {
        isFavorite: !it.isFavorite,
      });
      await loadItems();
    } catch (err) {
      console.error('Error updating favorite:', err);
    }
  };

  // Citation generator function
  const generateCitation = (it: KnowledgeVaultItem, format: 'APA' | 'IEEE' | 'MLA' | 'BibTeX') => {
    const studentName = userProfile?.fullName || 'Scholar';
    const year = new Date().getFullYear();
    const title = it.topic;
    const unit = it.unitCode || 'Academic Studies';

    switch (format) {
      case 'APA':
        return `${studentName}. (${year}). ${title} [Academic Knowledge Synthesis]. Kenya Methodist University, ${unit}.`;
      case 'IEEE':
        return `[1] ${studentName}, "${title}," ${unit} Academic Compendium, Kenya Methodist Univ., Nairobi, Kenya, ${year}.`;
      case 'MLA':
        return `${studentName}. "${title}." My Learning Hub Digital Library, Kenya Methodist University, ${year}.`;
      case 'BibTeX':
        return `@misc{vault_${it.id.substring(0, 6)},
  author = {${studentName}},
  title = {${title}},
  school = {Kenya Methodist University},
  year = {${year}},
  note = {Course: ${unit}}
}`;
    }
  };

  const handleCopyCitation = () => {
    if (!citationItem) return;
    const text = generateCitation(citationItem, citationFormat);
    navigator.clipboard.writeText(text);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2500);
  };

  const allUnits = Array.from(new Set(items.map((it) => it.unitCode).filter(Boolean)));

  const filtered = items.filter((it) => {
    const unitMatch = selectedUnit === 'ALL' || it.unitCode === selectedUnit;
    const favMatch = !onlyFavorites || it.isFavorite;
    const searchMatch =
      !searchTerm ||
      it.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (it.explanation && it.explanation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (it.whatILearned && it.whatILearned.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (it.tags && it.tags.some((t: string) => t.toLowerCase().includes(searchTerm.toLowerCase())));
    return unitMatch && favMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-2">
            <Library className="w-3.5 h-3.5" />
            <span>Digital Library & Research Vault</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading">
            Brian&apos;s Knowledge Vault
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            A permanent digital repository of profound concepts, practical examples, and academic citations.
          </p>
        </div>

        <button
          id="add-vault-entry-btn"
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-[0_0_15px_rgba(34,211,238,0.35)] cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Knowledge Entry</span>
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
            placeholder="Search core concepts, explanations, or tags..."
            className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          {/* Favorite filter toggle */}
          <button
            type="button"
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer border ${
              onlyFavorites
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-400' : ''}`} />
            <span>Favorites</span>
          </button>
        </div>
      </div>

      {/* Knowledge Items Grid */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-xs text-slate-400">
          Accessing Brian&apos;s Knowledge Vault...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Vault is empty</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Store essential formulas, theoretical proofs, and synthesized lessons learned to build your lifelong library.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs font-semibold cursor-pointer"
          >
            + Add First Entry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((it) => (
            <div
              key={it.id}
              className={`glass-card rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                it.isFavorite
                  ? 'border-amber-400/40 bg-amber-950/10'
                  : 'border-white/10 hover:border-cyan-400/40'
              }`}
            >
              <div>
                {/* Top: Unit badge & Controls */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono text-xs font-bold">
                      {it.unitCode || 'CORE'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {it.createdAt ? it.createdAt.split('T')[0] : 'Library Archive'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setCitationItem(it)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-cyan-300"
                      title="Cite this entry"
                    >
                      <Quote className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(it)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        it.isFavorite
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-slate-800 border-white/10 text-slate-400 hover:text-amber-300'
                      }`}
                      title={it.isFavorite ? 'Unfavorite' : 'Favorite'}
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(it)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(it.id)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Topic Header */}
                <h3 className="text-base font-bold text-white font-heading mb-2">
                  {it.topic}
                </h3>

                {/* Explanation */}
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 block mb-0.5">
                      Conceptual Explanation
                    </span>
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {it.explanation}
                    </p>
                  </div>

                  {/* Practical Example if present */}
                  {it.example && (
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10">
                      <span className="text-[10px] font-mono uppercase font-bold text-indigo-400 block mb-0.5">
                        Practical Real-World Example
                      </span>
                      <p className="text-slate-300 text-[11px] leading-relaxed font-mono">
                        {it.example}
                      </p>
                    </div>
                  )}

                  {/* What I Learned */}
                  {it.whatILearned && (
                    <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                      <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 flex items-center space-x-1 mb-0.5">
                        <Lightbulb className="w-3 h-3" />
                        <span>What I Learned (Student Takeaway)</span>
                      </span>
                      <p className="text-slate-200 text-xs italic">
                        &quot;{it.whatILearned}&quot;
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer: Tags */}
              <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-1">
                {it.tags && it.tags.length > 0 ? (
                  it.tags.map((t: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-white/10 text-slate-400 font-mono"
                    >
                      #{t}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono">#academics</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Citation Generator Modal */}
      {citationItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setCitationItem(null)}
        >
          <div
            className="glass-panel rounded-2xl w-full max-w-md p-6 border border-cyan-500/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <h2 className="text-base font-bold text-white font-heading flex items-center space-x-2">
                <Quote className="w-4 h-4 text-cyan-400" />
                <span>Academic Citation Generator</span>
              </h2>
              <button
                type="button"
                onClick={() => setCitationItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-3">
              Generate formatted bibliographical citations for research papers, reports, or thesis submissions:
            </p>

            {/* Format Switcher */}
            <div className="grid grid-cols-4 gap-1.5 mb-3 bg-slate-900/80 p-1 rounded-xl border border-white/10">
              {(['APA', 'IEEE', 'MLA', 'BibTeX'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setCitationFormat(fmt)}
                  className={`py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    citationFormat === fmt
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            {/* Citation Preview Box */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-slate-200 leading-relaxed select-all">
              {generateCitation(citationItem, citationFormat)}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleCopyCitation}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
              >
                {copiedCitation ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-950" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Citation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Entry Modal */}
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
              <h2 className="text-base font-bold text-white font-heading flex items-center space-x-2">
                <Library className="w-4 h-4 text-cyan-400" />
                <span>
                  {editingId ? 'Edit Knowledge Entry' : 'Add to Brian\'s Knowledge Vault'}
                </span>
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
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-slate-300 mb-1">
                    Topic / Concept Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="e.g. Byzantine Fault Tolerance (BFT)"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Unit Code</label>
                  <input
                    type="text"
                    value={formData.unitCode}
                    onChange={(e) => setFormData({ ...formData, unitCode: e.target.value })}
                    placeholder="e.g. CS 301"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Explanation & Theoretical Rigor <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="Define the concept mathematically or logically..."
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Practical Real-World Example
                </label>
                <textarea
                  rows={2}
                  value={formData.example}
                  onChange={(e) => setFormData({ ...formData, example: e.target.value })}
                  placeholder="e.g. Blockchain consensus engines (Tendermint, PBFT) sustaining up to 1/3 arbitrary node failures."
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  What I Learned (Student Takeaway)
                </label>
                <input
                  type="text"
                  value={formData.whatILearned}
                  onChange={(e) => setFormData({ ...formData, whatILearned: e.target.value })}
                  placeholder="Key intuition or takeaway to remember for life"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g. DistributedSystems, Consensus, Algorithms"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="vault-fav-checkbox"
                  checked={formData.isFavorite}
                  onChange={(e) => setFormData({ ...formData, isFavorite: e.target.checked })}
                  className="rounded text-cyan-500 focus:ring-cyan-400"
                />
                <label htmlFor="vault-fav-checkbox" className="text-xs text-slate-300 cursor-pointer">
                  Mark as favorite entry in Brian&apos;s Knowledge Vault
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
                  {editingId ? 'Save Changes' : 'Store in Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
