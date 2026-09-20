import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchUserRevisionTopics,
  createRevisionTopic,
  updateRevisionTopic,
  deleteRevisionTopic,
} from '../../services/workplaceService';
import { RevisionTopic } from '../../types';
import {
  BookmarkCheck,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCw,
  Trash2,
  Edit2,
  Brain,
  Sparkles,
  ChevronRight,
  Award,
  Layers,
} from 'lucide-react';

interface RevisionViewProps {
  onNavigate?: (route: string) => void;
}

export const RevisionView: React.FC<RevisionViewProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const [topics, setTopics] = useState<RevisionTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeUnit, setActiveUnit] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Active flashcard flip states
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  // New topic modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    unitCode: '',
    topic: '',
    notes: '',
    confidence: 60,
    status: 'in_progress' as const,
    flashcardQ: '',
    flashcardA: '',
    practiceQ: '',
    practiceA: '',
  });

  const loadTopics = async () => {
    if (!userProfile?.uid) return;
    try {
      setLoading(true);
      const list = await fetchUserRevisionTopics(userProfile.uid);
      setTopics(list);
    } catch (err) {
      console.error('Error fetching revision topics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, [userProfile]);

  const handleUpdateConfidence = async (t: RevisionTopic, delta: number) => {
    if (!userProfile?.uid) return;
    const newConf = Math.min(100, Math.max(0, t.confidence + delta));
    const newStatus = newConf >= 85 ? 'mastered' : newConf <= 40 ? 'weak' : 'in_progress';
    try {
      await updateRevisionTopic(userProfile.uid, t.id, {
        confidence: newConf,
        status: newStatus,
      });
      await loadTopics();
    } catch (err) {
      console.error('Error updating confidence:', err);
    }
  };

  const handleDelete = async (topicId: string) => {
    if (!userProfile?.uid) return;
    if (!window.confirm('Delete this revision topic?')) return;
    try {
      await deleteRevisionTopic(userProfile.uid, topicId);
      await loadTopics();
    } catch (err) {
      console.error('Error deleting topic:', err);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid || !formData.topic || !formData.unitCode) return;

    const flashcards = formData.flashcardQ && formData.flashcardA
      ? [{ id: 'fc-1', question: formData.flashcardQ, answer: formData.flashcardA }]
      : [];

    const practiceQuestions = formData.practiceQ && formData.practiceA
      ? [{ id: 'pq-1', question: formData.practiceQ, answer: formData.practiceA, type: 'short' as const }]
      : [];

    try {
      await createRevisionTopic(userProfile.uid, {
        unitCode: formData.unitCode.toUpperCase(),
        topic: formData.topic,
        notes: formData.notes,
        confidence: Number(formData.confidence) || 50,
        status: formData.confidence >= 80 ? 'mastered' : 'in_progress',
        flashcards,
        practiceQuestions,
      });

      setIsModalOpen(false);
      setFormData({
        unitCode: '',
        topic: '',
        notes: '',
        confidence: 60,
        status: 'in_progress',
        flashcardQ: '',
        flashcardA: '',
        practiceQ: '',
        practiceA: '',
      });
      await loadTopics();
    } catch (err) {
      console.error('Error creating revision topic:', err);
    }
  };

  const uniqueUnits = Array.from(new Set(topics.map((t) => t.unitCode).filter(Boolean)));

  const filteredTopics = topics.filter((t) => {
    const unitMatch = activeUnit === 'ALL' || t.unitCode === activeUnit;
    const searchMatch =
      !searchTerm ||
      t.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.unitCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return unitMatch && searchMatch;
  });

  const totalMastered = topics.filter((t) => (t.confidence || 0) >= 80).length;
  const totalWeak = topics.filter((t) => (t.confidence || 0) < 50).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-2">
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Active Recall & Syllabus Mastery</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading">
            Revision Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Organized by unit and topic. Master key concepts with active recall trackers and flashcards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('/ai-study')}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-400/30 hover:border-cyan-400 text-cyan-300 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Question Gen</span>
            </button>
          )}

          <button
            id="add-revision-topic-btn"
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-[0_0_15px_rgba(34,211,238,0.35)] cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Topic</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Topics</span>
          <p className="text-2xl font-bold text-white font-heading mt-1">{topics.length}</p>
          <span className="text-[11px] text-cyan-400 font-medium">Under active syllabus review</span>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-emerald-500/20 bg-emerald-950/10">
          <span className="text-xs text-emerald-400 uppercase font-semibold">Mastered (≥80%)</span>
          <p className="text-2xl font-bold text-emerald-300 font-heading mt-1">{totalMastered}</p>
          <span className="text-[11px] text-emerald-400 font-medium">Exam-ready retention</span>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-amber-500/20 bg-amber-950/10">
          <span className="text-xs text-amber-400 uppercase font-semibold">Needs Focus (&lt;50%)</span>
          <p className="text-2xl font-bold text-amber-300 font-heading mt-1">{totalWeak}</p>
          <span className="text-[11px] text-amber-400 font-medium">Flagged for active revision</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search topics, unit codes, or review notes..."
            className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveUnit('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeUnit === 'ALL'
                ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Units
          </button>
          {uniqueUnits.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setActiveUnit(u)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeUnit === u
                  ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Topics List & Flashcard Cards */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-xs text-slate-400">
          Loading revision topics...
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
          <Brain className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No revision topics found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Add unit topics and syllabus items to start tracking your confidence and active recall.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs font-semibold cursor-pointer"
          >
            + Add Revision Topic
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTopics.map((t) => {
            const hasFlashcards = t.flashcards && t.flashcards.length > 0;
            const hasPractice = t.practiceQuestions && t.practiceQuestions.length > 0;

            return (
              <div
                key={t.id}
                className="glass-card rounded-2xl p-5 border border-white/10 space-y-4 hover:border-cyan-400/40 transition-all"
              >
                {/* Top Row: Unit, Topic, Confidence & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono text-xs font-bold">
                        {t.unitCode}
                      </span>
                      <h3 className="text-base font-bold text-white font-heading">{t.topic}</h3>
                    </div>
                    {t.notes && <p className="text-xs text-slate-300 mt-1">{t.notes}</p>}
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right">
                      <span
                        className={`text-xs font-mono font-bold block ${
                          t.confidence >= 80
                            ? 'text-emerald-300'
                            : t.confidence <= 40
                            ? 'text-amber-300'
                            : 'text-cyan-300'
                        }`}
                      >
                        {t.confidence}% Confidence
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {t.confidence >= 80 ? 'Mastered' : t.confidence <= 40 ? 'Needs Review' : 'Learning'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateConfidence(t, -10)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                        title="-10% Confidence"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateConfidence(t, +10)}
                        className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold cursor-pointer border border-cyan-400/40"
                        title="+10% Confidence"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer ml-1"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      t.confidence >= 80
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : t.confidence <= 40
                        ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                        : 'bg-gradient-to-r from-cyan-400 to-sky-500'
                    }`}
                    style={{ width: `${t.confidence}%` }}
                  />
                </div>

                {/* Flashcards & Practice section if present */}
                {(hasFlashcards || hasPractice) && (
                  <div className="pt-3 border-t border-white/10 space-y-3">
                    {hasFlashcards && (
                      <div>
                        <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block mb-2">
                          Active Recall Flashcards ({t.flashcards?.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {t.flashcards?.map((fc) => {
                            const isFlipped = flippedCardId === fc.id;
                            return (
                              <div
                                key={fc.id}
                                onClick={() => setFlippedCardId(isFlipped ? null : fc.id)}
                                className={`p-4 rounded-xl border transition-all cursor-pointer select-none min-h-[90px] flex flex-col justify-between ${
                                  isFlipped
                                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 shadow-md'
                                    : 'bg-slate-900/80 border-white/10 hover:border-cyan-400/40 text-slate-200'
                                }`}
                              >
                                <div>
                                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold block mb-1 text-slate-400">
                                    {isFlipped ? 'Answer' : 'Question (Click to flip)'}
                                  </span>
                                  <p className="text-xs font-medium leading-relaxed">
                                    {isFlipped ? fc.answer : fc.question}
                                  </p>
                                </div>
                                <span className="text-[10px] text-slate-500 mt-2 flex items-center space-x-1">
                                  <RotateCw className="w-3 h-3" />
                                  <span>{isFlipped ? 'Click for Question' : 'Flip for Answer'}</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {hasPractice && (
                      <div>
                        <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-2">
                          Practice Questions ({t.practiceQuestions?.length})
                        </span>
                        <div className="space-y-2">
                          {t.practiceQuestions?.map((pq) => (
                            <div
                              key={pq.id}
                              className="p-3 rounded-xl bg-slate-900/60 border border-white/10 space-y-1 text-xs"
                            >
                              <p className="font-semibold text-white">Q: {pq.question}</p>
                              <p className="text-slate-300 font-mono text-[11px]">
                                Answer Key: {pq.answer}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Topic Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="glass-panel rounded-2xl w-full max-w-lg p-6 border border-cyan-500/30 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-white font-heading mb-4">
              Add Revision Topic
            </h2>

            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Unit Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.unitCode}
                    onChange={(e) => setFormData({ ...formData, unitCode: e.target.value })}
                    placeholder="e.g. CS 301"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Initial Confidence ({formData.confidence}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={formData.confidence}
                    onChange={(e) =>
                      setFormData({ ...formData, confidence: Number(e.target.value) })
                    }
                    className="w-full mt-2 accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Topic Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="e.g. Paxos vs Raft: Invariants, Quorums & Leader Election"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Study / Revision Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Core rules, definitions, formulas to memorize..."
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
                <span className="text-xs font-semibold text-cyan-300 block">
                  Optional Starter Flashcard
                </span>
                <input
                  type="text"
                  value={formData.flashcardQ}
                  onChange={(e) => setFormData({ ...formData, flashcardQ: e.target.value })}
                  placeholder="Flashcard Question (e.g. What is the Raft Election Timeout?)"
                  className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  value={formData.flashcardA}
                  onChange={(e) => setFormData({ ...formData, flashcardA: e.target.value })}
                  placeholder="Flashcard Answer (e.g. 150-300ms randomized interval)"
                  className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-white"
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
                  Save Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
