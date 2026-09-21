import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchUserAssignments,
  fetchUserNotes,
  fetchUserExams,
  fetchUserKnowledgeItems,
  fetchUserRevisionTopics,
  fetchUserDocuments,
} from '../../services/workplaceService';
import { fetchUserTimetable } from '../../services/timetableService';
import { AcademicDocument } from '../../types';
import {
  Search,
  X,
  Calendar,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Library,
  BookmarkCheck,
  FolderArchive,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [queryText, setQueryText] = useState('');
  const [loading, setLoading] = useState(false);

  // Cached search datasets
  const [timetable, setTimetable] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [documents, setDocuments] = useState<AcademicDocument[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [revision, setRevision] = useState<any[]>([]);

  useEffect(() => {
    const activeUid = currentUser?.uid || userProfile?.uid;
    if (!isOpen || !activeUid) return;

    const loadIndex = async () => {
      setLoading(true);
      try {
        const [tt, asg, nts, ex, kn, rev, docs] = await Promise.all([
          fetchUserTimetable(activeUid),
          fetchUserAssignments(activeUid),
          fetchUserNotes(activeUid),
          fetchUserExams(activeUid),
          fetchUserKnowledgeItems(activeUid),
          fetchUserRevisionTopics(activeUid),
          fetchUserDocuments(activeUid),
        ]);

        setTimetable(tt);
        setAssignments(asg);
        setNotes(nts);
        setExams(ex);
        setKnowledge(kn);
        setRevision(rev);
        setDocuments(docs);
      } catch (err) {
        console.error('Failed to load search index:', err);
      } finally {
        setLoading(false);
      }
    };

    loadIndex();
  }, [isOpen, currentUser?.uid, userProfile?.uid]);

  // Keyboard shortcut handler for Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const q = queryText.trim().toLowerCase();

  // Search results
  const results: Array<{
    id: string;
    category: string;
    title: string;
    subtitle: string;
    route: string;
    icon: any;
  }> = [];

  if (q) {
    // 1. Timetable classes
    timetable.forEach((c) => {
      if (
        c.unitCode?.toLowerCase().includes(q) ||
        c.unitName?.toLowerCase().includes(q) ||
        c.lecturerName?.toLowerCase().includes(q) ||
        c.roomNumber?.toLowerCase().includes(q)
      ) {
        results.push({
          id: `tt-${c.eventId}`,
          category: 'Timetable Class',
          title: `${c.unitCode} • ${c.unitName}`,
          subtitle: `${c.day} ${c.startTime}-${c.endTime} • ${c.building} ${c.roomNumber}`,
          route: '/timetable',
          icon: Calendar,
        });
      }
    });

    // 2. Assignments
    assignments.forEach((a) => {
      if (
        a.title?.toLowerCase().includes(q) ||
        a.course?.toLowerCase().includes(q) ||
        a.unit?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q)
      ) {
        results.push({
          id: `asg-${a.id}`,
          category: 'Assignment',
          title: a.title,
          subtitle: `Unit: ${a.course || a.unit} • Due: ${a.dueDate} (${a.status})`,
          route: '/assignments',
          icon: ClipboardCheck,
        });
      }
    });

    // 3. Notes
    notes.forEach((n) => {
      if (
        n.title?.toLowerCase().includes(q) ||
        n.summary?.toLowerCase().includes(q) ||
        n.course?.toLowerCase().includes(q) ||
        (n.tags && n.tags.some((t: string) => t.toLowerCase().includes(q)))
      ) {
        results.push({
          id: `note-${n.id}`,
          category: 'Academic Note',
          title: n.title,
          subtitle: `${n.course || 'General'} • ${n.summary?.substring(0, 70)}...`,
          route: '/notes',
          icon: FileText,
        });
      }
    });

    // 4. Exams
    exams.forEach((e) => {
      if (
        e.title?.toLowerCase().includes(q) ||
        e.unitCode?.toLowerCase().includes(q) ||
        e.room?.toLowerCase().includes(q)
      ) {
        results.push({
          id: `exam-${e.id}`,
          category: 'University Exam',
          title: `${e.unitCode} • ${e.title}`,
          subtitle: `${e.examDate} at ${e.time} • ${e.building} Room ${e.room}`,
          route: '/exams',
          icon: GraduationCap,
        });
      }
    });

    // 5. Knowledge Vault
    knowledge.forEach((k) => {
      if (
        k.topic?.toLowerCase().includes(q) ||
        k.explanation?.toLowerCase().includes(q) ||
        k.unitCode?.toLowerCase().includes(q)
      ) {
        results.push({
          id: `know-${k.id}`,
          category: 'Knowledge Vault',
          title: k.topic,
          subtitle: `${k.unitCode || 'General'} • ${k.explanation?.substring(0, 70)}...`,
          route: '/knowledge-vault',
          icon: Library,
        });
      }
    });

    // 6. Revision Topics
    revision.forEach((r) => {
      if (
        r.topic?.toLowerCase().includes(q) ||
        r.unitCode?.toLowerCase().includes(q) ||
        r.notes?.toLowerCase().includes(q)
      ) {
        results.push({
          id: `rev-${r.id}`,
          category: 'Revision Topic',
          title: r.topic,
          subtitle: `${r.unitCode} • ${r.confidence}% confidence score`,
          route: '/revision',
          icon: BookmarkCheck,
        });
      }
    });

    // 7. Documents
    documents.forEach((d) => {
      if (
        d.title?.toLowerCase().includes(q) ||
        d.courseCode?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q)
      ) {
        results.push({
          id: `doc-${d.documentId}`,
          category: 'Academic Document',
          title: d.title,
          subtitle: `${d.courseCode || 'Course Material'} • ${d.fileName}`,
          route: '/documents',
          icon: FolderArchive,
        });
      }
    });
  }

  const handleSelect = (route: string) => {
    onClose();
    onNavigate(route);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-20 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="glass-panel rounded-2xl w-full max-w-2xl border border-cyan-500/30 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-white/10 flex items-center space-x-3">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Search classes, assignments, documents, notes, exams, knowledge..."
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
          />
          {queryText && (
            <button
              onClick={() => setQueryText('')}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/10">
            ESC to exit
          </span>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="py-10 text-center text-xs text-slate-400">
              Indexing academic workspace...
            </div>
          ) : !q ? (
            <div className="py-8 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-cyan-400/40 mx-auto" />
              <p className="text-xs text-slate-400">
                Type any unit code, topic, lecturer name, or keyword to search across the entire workspace.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {['CS 301', 'Timetable', 'Final Exam', 'Raft', 'Assignments'].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setQueryText(sample)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-cyan-300 hover:border-cyan-400/40"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No matching academic resources found for &quot;{queryText}&quot;
            </div>
          ) : (
            results.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.id}
                  onClick={() => handleSelect(r.route)}
                  className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-white/5 hover:border-cyan-400/40 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-950 border border-white/10 text-cyan-400 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 px-1.5 py-0.2 rounded bg-cyan-500/10">
                          {r.category}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate">{r.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{r.subtitle}</p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
