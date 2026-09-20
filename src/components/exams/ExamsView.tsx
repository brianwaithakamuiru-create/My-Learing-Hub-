import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchUserExams,
  createAcademicExam,
  updateAcademicExam,
  deleteAcademicExam,
} from '../../services/workplaceService';
import { AcademicExam } from '../../types';
import {
  GraduationCap,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Building2,
  User,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  Target,
  Sparkles,
  X,
} from 'lucide-react';

interface ExamsViewProps {
  onNavigate?: (route: string) => void;
}

interface ExamFormData {
  unitCode: string;
  title: string;
  examDate: string;
  time: string;
  durationMinutes: number;
  building: string;
  room: string;
  lecturer: string;
  topicsCovered: string;
  readiness: number;
  status: 'scheduled' | 'completed' | 'urgent';
  notes: string;
}

export const ExamsView: React.FC<ExamsViewProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const [exams, setExams] = useState<AcademicExam[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ExamFormData>({
    unitCode: '',
    title: '',
    examDate: '',
    time: '09:00',
    durationMinutes: 120,
    building: 'KEMU Hub',
    room: '',
    lecturer: '',
    topicsCovered: '',
    readiness: 50,
    status: 'scheduled',
    notes: '',
  });

  const loadExams = async () => {
    if (!userProfile?.uid) return;
    try {
      setLoading(true);
      const list = await fetchUserExams(userProfile.uid);
      setExams(list);
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [userProfile]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      unitCode: '',
      title: '',
      examDate: '',
      time: '09:00',
      durationMinutes: 120,
      building: 'KEMU Hub',
      room: '',
      lecturer: '',
      topicsCovered: '',
      readiness: 50,
      status: 'scheduled',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ex: AcademicExam) => {
    setEditingId(ex.id);
    setFormData({
      unitCode: ex.unitCode,
      title: ex.title,
      examDate: ex.examDate,
      time: ex.time,
      durationMinutes: ex.durationMinutes || 120,
      building: ex.building || 'KEMU Hub',
      room: ex.room || '',
      lecturer: ex.lecturer || '',
      topicsCovered: ex.topicsCovered ? ex.topicsCovered.join(', ') : '',
      readiness: ex.readiness || 50,
      status: ex.status || 'scheduled',
      notes: ex.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid || !formData.unitCode || !formData.examDate) return;

    const topicsArr = formData.topicsCovered
      ? formData.topicsCovered.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    try {
      if (editingId) {
        await updateAcademicExam(userProfile.uid, editingId, {
          unitCode: formData.unitCode.toUpperCase(),
          title: formData.title,
          examDate: formData.examDate,
          time: formData.time,
          durationMinutes: Number(formData.durationMinutes) || 120,
          building: formData.building,
          room: formData.room,
          lecturer: formData.lecturer,
          topicsCovered: topicsArr,
          readiness: Number(formData.readiness) || 50,
          status: formData.status,
          notes: formData.notes,
        });
      } else {
        await createAcademicExam(userProfile.uid, {
          unitCode: formData.unitCode.toUpperCase(),
          title: formData.title || `${formData.unitCode} Final Examination`,
          examDate: formData.examDate,
          time: formData.time,
          durationMinutes: Number(formData.durationMinutes) || 120,
          building: formData.building,
          room: formData.room,
          lecturer: formData.lecturer,
          topicsCovered: topicsArr,
          readiness: Number(formData.readiness) || 50,
          status: formData.status,
          notes: formData.notes,
        });
      }

      setIsModalOpen(false);
      await loadExams();
    } catch (err) {
      console.error('Error saving exam:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userProfile?.uid) return;
    if (!window.confirm('Delete this examination record?')) return;
    try {
      await deleteAcademicExam(userProfile.uid, id);
      await loadExams();
    } catch (err) {
      console.error('Error deleting exam:', err);
    }
  };

  // Exam Countdown calculation
  const getExamCountdown = (examDateStr: string, timeStr: string) => {
    const examTarget = new Date(`${examDateStr}T${timeStr || '09:00:00'}`);
    const now = new Date();
    const diffMs = examTarget.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return { text: 'Concluded', isPast: true, days: 0 };
    }
    if (diffDays === 0) {
      const hours = Math.ceil(diffMs / (1000 * 60 * 60));
      return { text: `Today in ${hours} hours!`, isPast: false, days: 0, isUrgent: true };
    }
    if (diffDays === 1) {
      return { text: 'Tomorrow!', isPast: false, days: 1, isUrgent: true };
    }
    return { text: `${diffDays} days remaining`, isPast: false, days: diffDays, isUrgent: diffDays <= 5 };
  };

  // Sort upcoming first
  const sortedExams = [...exams].sort(
    (a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-400/30 text-rose-300 text-xs font-semibold mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Official Examination Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading">
            University Examinations
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Track university finals, CATs, venues across KEMU Hub & Towers, and readiness scores.
          </p>
        </div>

        <button
          id="add-exam-top-btn"
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-400 text-white font-bold text-xs flex items-center space-x-2 shadow-[0_0_15px_rgba(244,63,94,0.35)] cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Exam</span>
        </button>
      </div>

      {/* Upcoming Exam Highlight if exists */}
      {sortedExams.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 border border-rose-500/30 bg-gradient-to-r from-rose-950/20 via-slate-900/60 to-slate-900/80">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono text-rose-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Next Scheduled Examination</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-heading mt-1">
                {sortedExams[0].unitCode} • {sortedExams[0].title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-2">
                <span className="flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-rose-400" />
                  <span>{sortedExams[0].examDate} at {sortedExams[0].time}</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span>{sortedExams[0].building} • Room {sortedExams[0].room}</span>
                </span>
                {sortedExams[0].durationMinutes && (
                  <span className="flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span>{sortedExams[0].durationMinutes} Minutes</span>
                  </span>
                )}
              </div>
            </div>

            <div className="text-left lg:text-right shrink-0">
              <span className="text-xs text-slate-400 block mb-1">Time Remaining</span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-rose-300 bg-rose-950/40 px-3.5 py-1.5 rounded-xl border border-rose-500/30">
                {getExamCountdown(sortedExams[0].examDate, sortedExams[0].time).text}
              </span>
              <div className="mt-3 flex items-center justify-end space-x-2">
                <span className="text-xs text-slate-400">Readiness:</span>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {sortedExams[0].readiness || 50}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exams Grid */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-xs text-slate-400">
          Loading examination records...
        </div>
      ) : exams.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
          <GraduationCap className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No exams scheduled</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Schedule your midterms, final examinations, or continuous assessment tests (CATs) to track readiness.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-400 text-rose-300 text-xs font-semibold cursor-pointer"
          >
            + Schedule First Exam
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedExams.map((ex) => {
            const countdown = getExamCountdown(ex.examDate, ex.time);

            return (
              <div
                key={ex.id}
                className="glass-card rounded-2xl p-5 border border-white/10 hover:border-rose-400/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-md bg-rose-500/20 border border-rose-400/40 text-rose-300 font-mono text-xs font-bold">
                      {ex.unitCode}
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(ex)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                        title="Edit Exam"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(ex.id)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400"
                        title="Delete Exam"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white font-heading mb-1">{ex.title}</h3>

                  <div className="space-y-1.5 text-xs text-slate-300 my-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-rose-400" />
                      <span>
                        {ex.examDate} at {ex.time} ({ex.durationMinutes || 120} mins)
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>
                        {ex.building} • Room {ex.room || 'TBA'}
                      </span>
                    </div>

                    {ex.lecturer && (
                      <div className="flex items-center space-x-2">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Invigilator / Lecturer: {ex.lecturer}</span>
                      </div>
                    )}
                  </div>

                  {ex.topicsCovered && ex.topicsCovered.length > 0 && (
                    <div className="my-2">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                        Syllabus Covered:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {ex.topicsCovered.map((t: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-white/10 text-slate-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {ex.notes && (
                    <p className="text-xs text-slate-400 mt-2 italic bg-slate-900/60 p-2 rounded-lg">
                      Note: {ex.notes}
                    </p>
                  )}
                </div>

                {/* Footer: Countdown & Readiness Bar */}
                <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Exam Readiness</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {ex.readiness || 50}% Prepared
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        (ex.readiness || 0) >= 75
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : (ex.readiness || 0) <= 40
                          ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                          : 'bg-gradient-to-r from-cyan-400 to-sky-500'
                      }`}
                      style={{ width: `${ex.readiness || 50}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-400">Countdown:</span>
                    <span
                      className={`font-mono font-bold ${
                        countdown.isUrgent ? 'text-rose-400' : 'text-slate-300'
                      }`}
                    >
                      {countdown.text}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Schedule / Edit Exam */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="glass-panel rounded-2xl w-full max-w-lg p-6 border border-rose-500/30 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <h2 className="text-base font-bold text-white font-heading flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-rose-400" />
                <span>{editingId ? 'Edit Examination' : 'Schedule University Exam'}</span>
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
                  <label className="block text-xs text-slate-300 mb-1">Exam Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Final Examination"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.examDate}
                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, durationMinutes: Number(e.target.value) })
                    }
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Building</label>
                  <select
                    value={formData.building}
                    onChange={(e) =>
                      setFormData({ ...formData, building: e.target.value as any })
                    }
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="KEMU Hub">KEMU Hub</option>
                    <option value="KEMU Towers">KEMU Towers</option>
                    <option value="Other">Other University Hall</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Room Number</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="e.g. Lab 4 or Hall B"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Lecturer / Invigilator</label>
                <input
                  type="text"
                  value={formData.lecturer}
                  onChange={(e) => setFormData({ ...formData, lecturer: e.target.value })}
                  placeholder="e.g. Prof. Julian Vance"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Topics Covered (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.topicsCovered}
                  onChange={(e) => setFormData({ ...formData, topicsCovered: e.target.value })}
                  placeholder="e.g. Raft Consensus, Distributed Storage, MapReduce"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Readiness Confidence ({formData.readiness}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={formData.readiness}
                  onChange={(e) =>
                    setFormData({ ...formData, readiness: Number(e.target.value) })
                  }
                  className="w-full accent-rose-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Exam Instructions / Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Permitted items: Non-programmable calculator, student ID card required..."
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
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs"
                >
                  {editingId ? 'Save Changes' : 'Schedule Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
