import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  AcademicDocument,
  AcademicClass,
  Assignment,
  AcademicNote,
  AcademicGoal,
  TimetableEvent,
} from '../types';
import {
  fetchUserClasses,
  fetchUserAssignments,
  fetchUserNotes,
  fetchUserGoals,
  fetchUserFocusSessions,
  createUserClass,
  createUserAssignment,
  createUserNote,
  createUserGoal,
  updateUserAssignmentStatus,
  updateGoalProgress,
} from '../services/workplaceService';
import { fetchUserTimetable } from '../services/timetableService';
import { TimetableDashboardWidgets } from './timetable/TimetableDashboardWidgets';
import {
  BookOpen,
  Calendar,
  ClipboardList,
  FileText,
  Clock,
  Sparkles,
  ArrowUpRight,
  FolderArchive,
  GraduationCap,
  Download,
  Plus,
  CheckCircle2,
  AlertCircle,
  Flame,
  Target,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (route: string) => void;
}

export const DashboardView: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();

  // Real Firestore workplace data states
  const [documents, setDocuments] = useState<AcademicDocument[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [notes, setNotes] = useState<AcademicNote[]>([]);
  const [goals, setGoals] = useState<AcademicGoal[]>([]);
  const [timetable, setTimetable] = useState<TimetableEvent[]>([]);
  const [focusMinutes, setFocusMinutes] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Quick Action Modal States
  const [activeModal, setActiveModal] = useState<
    'assignment' | 'note' | 'class' | 'goal' | null
  >(null);

  // Form states for quick actions
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    course: '',
    dueDate: '',
    weight: '15%',
    status: 'Pending' as const,
  });

  const [newNote, setNewNote] = useState({
    title: '',
    course: '',
    summary: '',
    tags: '',
  });

  const [newClass, setNewClass] = useState({
    code: '',
    name: '',
    instructor: '',
    room: '',
    schedule: '',
    semester: 'Fall 2026',
    color: 'border-cyan-400',
  });

  const [newGoal, setNewGoal] = useState({
    title: '',
    target: '3.85 GPA',
    category: 'GPA' as const,
    progress: 25,
  });

  // Time-of-day greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const loadAllWorkplaceData = async () => {
    if (!userProfile?.uid) return;
    try {
      const [docSnap, cls, asg, nts, gls, fcs, tt] = await Promise.all([
        getDocs(query(collection(db, 'documents'), where('ownerId', '==', userProfile.uid))),
        fetchUserClasses(userProfile.uid),
        fetchUserAssignments(userProfile.uid),
        fetchUserNotes(userProfile.uid),
        fetchUserGoals(userProfile.uid),
        fetchUserFocusSessions(userProfile.uid),
        fetchUserTimetable(userProfile.uid),
      ]);

      const docList: AcademicDocument[] = [];
      docSnap.forEach((d) => {
        docList.push({ ...(d.data() as AcademicDocument), documentId: d.id });
      });
      docList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setDocuments(docList);
      setClasses(cls);
      setAssignments(asg);
      setNotes(nts);
      setGoals(gls);
      setTimetable(tt);

      const totalMins = fcs.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
      setFocusMinutes(totalMins);
    } catch (err) {
      console.error('Error loading workplace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllWorkplaceData();
  }, [userProfile]);

  // Seed sample starter set into real Firestore documents on request
  const handleSeedStarterAcademicSet = async () => {
    if (!userProfile?.uid) return;
    setLoading(true);
    try {
      // Add standard classes
      await Promise.all([
        createUserClass(userProfile.uid, {
          code: 'CS 301',
          name: 'Distributed Systems & Cloud Architecture',
          instructor: 'Prof. Julian Vance',
          room: 'Hall B4',
          schedule: 'Mon & Wed • 14:00 - 15:30',
          semester: 'Fall 2026',
          color: 'border-cyan-400',
        }),
        createUserClass(userProfile.uid, {
          code: 'MATH 204',
          name: 'Advanced Probability & Mathematical Statistics',
          instructor: 'Dr. Sarah Patel',
          room: 'Room 108',
          schedule: 'Tue & Thu • 10:00 - 11:30',
          semester: 'Fall 2026',
          color: 'border-sky-400',
        }),
      ]);

      // Add standard assignments
      const now = new Date();
      const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      await Promise.all([
        createUserAssignment(userProfile.uid, {
          title: 'Distributed Key-Value Store Implementation',
          course: 'CS 301',
          dueDate: inThreeDays,
          status: 'In Progress',
          weight: '20% Final Grade',
        }),
        createUserAssignment(userProfile.uid, {
          title: 'Hypothesis Testing Problem Set 3',
          course: 'MATH 204',
          dueDate: inSevenDays,
          status: 'Pending',
          weight: '10% Final Grade',
        }),
      ]);

      // Add starter notes & goals
      await createUserNote(userProfile.uid, {
        title: 'Raft Consensus Algorithm & Quorums',
        course: 'CS 301',
        date: new Date().toISOString().split('T')[0],
        summary: 'Leader election, heartbeat intervals, log consistency invariants, and network partitioning resilience.',
        tags: ['DistributedSystems', 'Consensus', 'Architecture'],
      });

      await createUserGoal(userProfile.uid, {
        title: 'Achieve First-Class Honors (GPA 3.8+)',
        target: '3.85 GPA',
        category: 'GPA',
        progress: 80,
        completed: false,
      });

      setActionSuccess('Initialized your personal academic workspace with your starter courses and tasks!');
      setTimeout(() => setActionSuccess(null), 4000);
      await loadAllWorkplaceData();
    } catch (err) {
      console.error('Error seeding academic workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  // Status toggle handler for assignments
  const handleCycleAssignmentStatus = async (asg: Assignment) => {
    const nextStatus =
      asg.status === 'Pending'
        ? 'In Progress'
        : asg.status === 'In Progress'
        ? 'Submitted'
        : 'Pending';

    try {
      await updateUserAssignmentStatus(asg.id, nextStatus);
      setAssignments((prev) =>
        prev.map((item) => (item.id === asg.id ? { ...item, status: nextStatus } : item))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Goal progress increment handler
  const handleIncrementGoal = async (goal: AcademicGoal) => {
    const nextProgress = Math.min(100, goal.progress + 15);
    const completed = nextProgress >= 100;
    try {
      await updateGoalProgress(goal.id, nextProgress, completed);
      setGoals((prev) =>
        prev.map((g) => (g.id === goal.id ? { ...g, progress: nextProgress, completed } : g))
      );
    } catch (err) {
      console.error('Failed to update goal:', err);
    }
  };

  // Submission handlers for Quick Modals
  const handleCreateAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid || !newAssignment.title) return;
    try {
      await createUserAssignment(userProfile.uid, {
        ...newAssignment,
        course: newAssignment.course || 'CS 301',
        dueDate: newAssignment.dueDate || new Date().toISOString().split('T')[0],
      });
      setActiveModal(null);
      setNewAssignment({ title: '', course: '', dueDate: '', weight: '15%', status: 'Pending' });
      setActionSuccess('Assignment successfully added to your academic calendar.');
      setTimeout(() => setActionSuccess(null), 3000);
      await loadAllWorkplaceData();
    } catch (err) {
      console.error('Failed to add assignment:', err);
    }
  };

  const handleCreateNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid || !newNote.title) return;
    try {
      await createUserNote(userProfile.uid, {
        title: newNote.title,
        course: newNote.course || 'General',
        date: new Date().toISOString().split('T')[0],
        summary: newNote.summary,
        tags: newNote.tags ? newNote.tags.split(',').map((t) => t.trim()) : ['Lecture'],
      });
      setActiveModal(null);
      setNewNote({ title: '', course: '', summary: '', tags: '' });
      setActionSuccess('Academic note saved to your private notebook.');
      setTimeout(() => setActionSuccess(null), 3000);
      await loadAllWorkplaceData();
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const handleCreateClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid || !newClass.name) return;
    try {
      await createUserClass(userProfile.uid, {
        ...newClass,
        code: newClass.code || 'COURSE 101',
      });
      setActiveModal(null);
      setNewClass({
        code: '',
        name: '',
        instructor: '',
        room: '',
        schedule: '',
        semester: 'Fall 2026',
        color: 'border-cyan-400',
      });
      setActionSuccess('Course successfully enrolled in your semester workspace.');
      setTimeout(() => setActionSuccess(null), 3000);
      await loadAllWorkplaceData();
    } catch (err) {
      console.error('Failed to add class:', err);
    }
  };

  const handleCreateGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid || !newGoal.title) return;
    try {
      await createUserGoal(userProfile.uid, {
        title: newGoal.title,
        target: newGoal.target,
        category: newGoal.category,
        progress: Number(newGoal.progress) || 0,
        completed: Number(newGoal.progress) >= 100,
      });
      setActiveModal(null);
      setNewGoal({ title: '', target: '3.85 GPA', category: 'GPA', progress: 25 });
      setActionSuccess('Academic milestone target established.');
      setTimeout(() => setActionSuccess(null), 3000);
      await loadAllWorkplaceData();
    } catch (err) {
      console.error('Failed to add goal:', err);
    }
  };

  const pendingAssignments = assignments.filter((a) => a.status !== 'Submitted');
  const submittedCount = assignments.filter((a) => a.status === 'Submitted').length;

  return (
    <div className="space-y-6">
      {/* 1. Academic Command Center Header */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Academic Command Center • {userProfile?.role || 'student'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-heading">
              {greeting}, {userProfile?.fullName || 'Scholar'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Your personalized academic workplace is active and fully synchronized with Cloud Firestore.
            </p>
          </div>

          {/* Quick Action Navigation Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="workplace-timetable-btn"
              type="button"
              onClick={() => onNavigate('/timetable')}
              className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-cyan-400/30 text-cyan-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all"
            >
              <CalendarDays className="w-3.5 h-3.5 text-cyan-400" />
              <span>Timetable ({timetable.length})</span>
            </button>

            <button
              id="workplace-new-note-btn"
              type="button"
              onClick={() => setActiveModal('note')}
              className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/15 text-slate-200 hover:text-white text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>New Note</span>
            </button>

            <button
              id="workplace-new-assignment-btn"
              type="button"
              onClick={() => setActiveModal('assignment')}
              className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/15 text-slate-200 hover:text-white text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Add Assignment</span>
            </button>

            <button
              id="workplace-focus-btn"
              type="button"
              onClick={() => onNavigate('/focus-mode')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-[0_0_15px_rgba(34,211,238,0.3)] cursor-pointer transition-all"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Focus Sanctuary</span>
            </button>

            <button
              id="workplace-upload-doc-btn"
              type="button"
              onClick={() => onNavigate('/documents')}
              className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/15 text-slate-200 hover:text-white text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all"
            >
              <FolderArchive className="w-3.5 h-3.5 text-emerald-400" />
              <span>Documents ({documents.length})</span>
            </button>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs text-center flex items-center justify-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}

      {/* 2. Key Academic Metrics (Computed from Real Firestore Records) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KEMU Timetable */}
        <div
          onClick={() => onNavigate('/timetable')}
          className="glass-card rounded-2xl p-5 hover:border-cyan-400/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-300 transition-colors" />
          </div>
          <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
            KEMU Timetable
          </span>
          <p className="text-2xl font-bold text-white font-heading mt-1">
            {timetable.length} {timetable.length === 1 ? 'Class' : 'Classes'}
          </p>
          <span className="text-[11px] text-cyan-400 font-medium">
            {timetable.length > 0 ? 'Hub & Towers schedule' : 'Setup your schedule →'}
          </span>
        </div>

        {/* Enrolled Classes */}
        <div
          onClick={() => onNavigate('/classes')}
          className="glass-card rounded-2xl p-5 hover:border-sky-400/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-400/30 text-sky-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-sky-300 transition-colors" />
          </div>
          <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
            Enrolled Courses
          </span>
          <p className="text-2xl font-bold text-white font-heading mt-1">
            {classes.length} Active
          </p>
          <span className="text-[11px] text-sky-400 font-medium">
            {classes.length > 0 ? `${classes[0].code} syllabus` : 'Manage courses'}
          </span>
        </div>

        {/* Assignments & Tasks */}
        <div
          onClick={() => onNavigate('/assignments')}
          className="glass-card rounded-2xl p-5 hover:border-indigo-400/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-400/30 text-indigo-400 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-300 transition-colors" />
          </div>
          <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
            Assignments
          </span>
          <p className="text-2xl font-bold text-white font-heading mt-1">
            {pendingAssignments.length} Pending
          </p>
          <span className="text-[11px] text-indigo-400 font-medium">
            {submittedCount} Submitted
          </span>
        </div>

        {/* Academic Documents */}
        <div
          onClick={() => onNavigate('/documents')}
          className="glass-card rounded-2xl p-5 hover:border-emerald-400/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 flex items-center justify-center">
              <FolderArchive className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-300 transition-colors" />
          </div>
          <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
            Stored Documents
          </span>
          <p className="text-2xl font-bold text-white font-heading mt-1">
            {documents.length} Files
          </p>
          <span className="text-[11px] text-emerald-400 font-medium">Encrypted Firestore</span>
        </div>
      </div>

      {/* 2.5 Live KEMU Timetable Status: Next Class Countdown & Today's Schedule */}
      <TimetableDashboardWidgets
        timetable={timetable}
        onNavigateToTimetable={() => onNavigate('/timetable')}
        onOpenAddModal={() => onNavigate('/timetable')}
      />

      {/* Clean Zero State Onboarding */}
      {classes.length === 0 && assignments.length === 0 && timetable.length === 0 && !loading && (
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/30 text-center space-y-3 bg-cyan-950/20">
          <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 mx-auto flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white font-heading">
            Welcome to Your KEMU Academic Workplace
          </h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Your private academic command center is ready. Set up your official KEMU classes, upload course materials, and track upcoming deadlines with real Firebase cloud storage.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('/timetable')}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold cursor-pointer transition-all shadow-lg flex items-center space-x-1.5"
            >
              <CalendarDays className="w-4 h-4" />
              <span>+ Add KEMU Timetable Class</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('class')}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-white/20 text-slate-200 text-xs font-semibold cursor-pointer hover:bg-slate-800 flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Enroll Course</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/documents')}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-white/20 text-slate-200 text-xs font-semibold cursor-pointer hover:bg-slate-800 flex items-center space-x-1.5"
            >
              <FolderArchive className="w-4 h-4 text-emerald-400" />
              <span>+ Upload Document</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Workspace Grid: Deadlines & Assignments + Academic Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Upcoming Deadlines & Interactive Assignments */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <ClipboardList className="w-4 h-4 text-cyan-400" />
                <h3 className="text-base font-bold text-white font-heading">
                  Upcoming Deliverables & Tasks
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('assignment')}
                  className="text-xs px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-semibold cursor-pointer"
                >
                  + Add Task
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/assignments')}
                  className="text-xs text-slate-400 hover:text-white font-medium cursor-pointer"
                >
                  View All →
                </button>
              </div>
            </div>

            {loading ? (
              <p className="text-xs text-slate-400 py-6 text-center">Synchronizing tasks...</p>
            ) : assignments.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                <p className="text-xs text-slate-300">No deliverables or tasks logged yet.</p>
                <button
                  type="button"
                  onClick={() => setActiveModal('assignment')}
                  className="mt-2 text-xs text-cyan-400 hover:underline font-semibold"
                >
                  + Create your first assignment
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.slice(0, 4).map((asg) => {
                  const isSubmitted = asg.status === 'Submitted';
                  const isInProgress = asg.status === 'In Progress';
                  return (
                    <div
                      key={asg.id}
                      className={`p-3.5 rounded-xl bg-slate-900/70 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSubmitted
                          ? 'border-emerald-500/30 opacity-70'
                          : isInProgress
                          ? 'border-cyan-400/40'
                          : 'border-white/10'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <button
                          type="button"
                          onClick={() => handleCycleAssignmentStatus(asg)}
                          title="Click to toggle status: Pending -> In Progress -> Submitted"
                          className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center border transition-colors cursor-pointer ${
                            isSubmitted
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400'
                              : isInProgress
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400'
                              : 'bg-slate-800 border-white/20 text-transparent hover:border-cyan-400'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono font-bold text-cyan-400">
                              {asg.course}
                            </span>
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${
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
                            className={`text-xs sm:text-sm font-semibold text-white mt-0.5 ${
                              isSubmitted ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {asg.title}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end space-x-4 pl-8 sm:pl-0">
                        <div className="text-left sm:text-right">
                          <span className="text-[11px] text-slate-300 font-mono block">
                            Due: {asg.dueDate}
                          </span>
                          <span className="text-[10px] text-slate-400 block">{asg.weight}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCycleAssignmentStatus(asg)}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 cursor-pointer"
                        >
                          {isSubmitted ? 'Reopen' : 'Next State'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Real-time persistence in Firestore</span>
            <button
              onClick={() => onNavigate('/assignments')}
              className="text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Open Full Tasks Board →
            </button>
          </div>
        </div>

        {/* Right 1 Col: Academic Goals & Milestone Progress */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-sky-400" />
                <h3 className="text-base font-bold text-white font-heading">Academic Goals</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('goal')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
              >
                + New Goal
              </button>
            </div>

            {loading ? (
              <p className="text-xs text-slate-400 py-6 text-center">Loading goals...</p>
            ) : goals.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                <p className="text-xs text-slate-300">No academic goals set yet.</p>
                <button
                  type="button"
                  onClick={() => setActiveModal('goal')}
                  className="mt-2 text-xs text-cyan-400 hover:underline font-semibold"
                >
                  + Set your target GPA or study goal
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.slice(0, 3).map((g) => (
                  <div key={g.id} className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white truncate max-w-[150px]">
                        {g.title}
                      </span>
                      <span className="text-[11px] font-mono text-cyan-400 font-bold">
                        {g.progress}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-sky-500 rounded-full transition-all duration-500"
                        style={{ width: `${g.progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span>Target: {g.target}</span>
                      <button
                        type="button"
                        onClick={() => handleIncrementGoal(g)}
                        className="text-cyan-300 hover:underline cursor-pointer"
                      >
                        +15% Progress
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-xs text-slate-400 flex items-center justify-between">
            <span>Term Objective</span>
            <span className="text-cyan-400 font-mono text-[11px]">Honors Track</span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: Recent Academic Documents & Notes Library */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Academic Documents */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FolderArchive className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white font-heading">
                  Recent Academic Documents
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/documents')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
              >
                Document Vault ({documents.length}) →
              </button>
            </div>

            {loading ? (
              <p className="text-xs text-slate-400 py-4 text-center">Loading files...</p>
            ) : documents.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
                <p className="text-xs text-slate-300">No documents stored in your library.</p>
                <button
                  type="button"
                  onClick={() => onNavigate('/documents')}
                  className="mt-2 text-xs text-cyan-400 hover:underline font-semibold"
                >
                  Upload your syllabus, lecture slides, or past paper
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {documents.slice(0, 3).map((docItem) => (
                  <div
                    key={docItem.documentId}
                    className="p-3 rounded-xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-300 text-[10px] font-mono shrink-0">
                        {docItem.fileType}
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-semibold text-white block truncate">
                          {docItem.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {docItem.unitName || 'Academic Unit'} • {docItem.category}
                        </span>
                      </div>
                    </div>

                    {docItem.downloadUrl && (
                      <a
                        href={docItem.downloadUrl}
                        download={docItem.originalFileName}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-cyan-300 transition-colors"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-xs text-slate-400 flex items-center justify-between">
            <span>Per-User Encrypted Storage</span>
            <span className="text-emerald-400 font-mono text-[11px]">Firebase Storage Rules</span>
          </div>
        </div>

        {/* Recent Academic Notes */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-sky-400" />
                <h3 className="text-base font-bold text-white font-heading">
                  Lecture Syntheses & Notes
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('note')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                >
                  + New Note
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/notes')}
                  className="text-xs text-slate-400 hover:text-white font-medium cursor-pointer"
                >
                  View All →
                </button>
              </div>
            </div>

            {loading ? (
              <p className="text-xs text-slate-400 py-4 text-center">Loading notes...</p>
            ) : notes.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
                <p className="text-xs text-slate-300">No lecture notes created yet.</p>
                <button
                  type="button"
                  onClick={() => setActiveModal('note')}
                  className="mt-2 text-xs text-cyan-400 hover:underline font-semibold"
                >
                  Write your first academic note
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {notes.slice(0, 3).map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-cyan-400 font-bold">
                        {note.course}
                      </span>
                      <span className="text-[10px] text-slate-400">{note.date}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-white truncate">{note.title}</h4>
                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                      {note.summary}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-xs text-slate-400 flex items-center justify-between">
            <span>Verified Student Profile</span>
            <span className="text-cyan-400 font-mono text-[11px]">Cloud Synced</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* QUICK ACTION MODALS (All saving to real Cloud Firestore) */}
      {/* ========================================================= */}

      {/* 1. Add Assignment Modal */}
      {activeModal === 'assignment' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="glass-panel rounded-2xl w-full max-w-md p-6 border border-cyan-500/30 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white font-heading">Add Academic Assignment</h3>
            <form onSubmit={handleCreateAssignmentSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  placeholder="e.g. Distributed Key-Value Store"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Course Code</label>
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
                  onClick={() => setActiveModal(null)}
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

      {/* 2. Add Note Modal */}
      {activeModal === 'note' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="glass-panel rounded-2xl w-full max-w-md p-6 border border-cyan-500/30 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white font-heading">New Lecture Note</h3>
            <form onSubmit={handleCreateNoteSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Note Title</label>
                <input
                  type="text"
                  required
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="e.g. Raft Consensus Algorithm"
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
                <label className="block text-xs text-slate-300 mb-1">Synthesis / Summary</label>
                <textarea
                  required
                  rows={3}
                  value={newNote.summary}
                  onChange={(e) => setNewNote({ ...newNote, summary: e.target.value })}
                  placeholder="Core theorems, key equations, or lecture summary..."
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newNote.tags}
                  onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                  placeholder="e.g. Distributed, Midterm, Algorithms"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
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

      {/* 3. Add Class Modal */}
      {activeModal === 'class' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="glass-panel rounded-2xl w-full max-w-md p-6 border border-cyan-500/30 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white font-heading">Enroll in Course</h3>
            <form onSubmit={handleCreateClassSubmit} className="space-y-3">
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
                <label className="block text-xs text-slate-300 mb-1">Course Name</label>
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
                  <label className="block text-xs text-slate-300 mb-1">Room / Hall</label>
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
                <label className="block text-xs text-slate-300 mb-1">Meeting Schedule</label>
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
                  onClick={() => setActiveModal(null)}
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

      {/* 4. Add Goal Modal */}
      {activeModal === 'goal' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="glass-panel rounded-2xl w-full max-w-md p-6 border border-cyan-500/30 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white font-heading">Set Academic Target</h3>
            <form onSubmit={handleCreateGoalSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Goal Description</label>
                <input
                  type="text"
                  required
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="e.g. Finish Distributed Systems Term Paper"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Category</label>
                  <select
                    value={newGoal.category}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, category: e.target.value as 'GPA' })
                    }
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white bg-slate-900"
                  >
                    <option value="GPA">GPA</option>
                    <option value="Study Hours">Study Hours</option>
                    <option value="Coursework">Coursework</option>
                    <option value="Revision">Revision</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Target Metric</label>
                  <input
                    type="text"
                    value={newGoal.target}
                    onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                    placeholder="e.g. 3.85 GPA or 20h"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Current Progress ({newGoal.progress}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newGoal.progress}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, progress: parseInt(e.target.value) })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  Set Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
