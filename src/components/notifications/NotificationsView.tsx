import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchUserNotifications,
  createAcademicNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteAcademicNotification,
  fetchUserAssignments,
  fetchUserExams,
} from '../../services/workplaceService';
import { fetchUserTimetable } from '../../services/timetableService';
import { AcademicNotification, Assignment, AcademicExam, TimetableEvent } from '../../types';
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  Clock,
  ClipboardCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
  AlertCircle,
  FolderArchive,
  Target,
} from 'lucide-react';

interface NotificationsViewProps {
  onNavigate?: (route: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<AcademicNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAllNotifications = async () => {
    if (!userProfile?.uid) return;
    try {
      setLoading(true);
      const [stored, asg, ex, tt] = await Promise.all([
        fetchUserNotifications(userProfile.uid),
        fetchUserAssignments(userProfile.uid),
        fetchUserExams(userProfile.uid),
        fetchUserTimetable(userProfile.uid),
      ]);

      const computedNotifs: AcademicNotification[] = [...stored];

      // Computed dynamic alerts:
      const now = new Date();
      const todayDay = now.toLocaleDateString('en-US', { weekday: 'long' });

      // 1. Classes scheduled today
      const todayClasses = tt.filter((c) => c.day === todayDay);
      if (todayClasses.length > 0 && !stored.some((n) => n.id === `today-classes-${todayDay}`)) {
        computedNotifs.push({
          id: `today-classes-${todayDay}`,
          ownerId: userProfile.uid,
          title: `You have ${todayClasses.length} university ${
            todayClasses.length === 1 ? 'class' : 'classes'
          } today`,
          message: todayClasses
            .map((c) => `${c.unitCode} at ${c.startTime} (${c.building} ${c.roomNumber})`)
            .join(' • '),
          type: 'class_reminder',
          link: '/timetable',
          read: false,
          createdAt: now.toISOString(),
        });
      }

      // 2. Assignments due within 48h
      asg.forEach((a) => {
        if (a.status !== 'Completed' && a.status !== 'Submitted' && a.dueDate) {
          const targetDate = new Date(`${a.dueDate}T${a.dueTime || '23:59:00'}`);
          const diffMs = targetDate.getTime() - now.getTime();
          const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
          if (diffHours > 0 && diffHours <= 48) {
            const notifId = `due-asg-${a.id}`;
            if (!stored.some((n) => n.id === notifId)) {
              computedNotifs.push({
                id: notifId,
                ownerId: userProfile.uid,
                title: `Assignment Due Soon: ${a.title}`,
                message: `Deliverable for ${a.course || a.unit} is due in ${diffHours} hours (${a.dueDate}).`,
                type: 'assignment_due',
                link: '/assignments',
                read: false,
                createdAt: now.toISOString(),
              });
            }
          }
        }
      });

      // 3. Upcoming exams within 7 days
      ex.forEach((e) => {
        const targetDate = new Date(`${e.examDate}T${e.time || '09:00:00'}`);
        const diffMs = targetDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 7) {
          const notifId = `exam-soon-${e.id}`;
          if (!stored.some((n) => n.id === notifId)) {
            computedNotifs.push({
              id: notifId,
              ownerId: userProfile.uid,
              title: `Upcoming Exam: ${e.unitCode}`,
              message: `${e.title} at ${e.building} ${e.room} in ${diffDays === 0 ? 'today' : `${diffDays} days`}.`,
              type: 'exam_alert',
              link: '/exams',
              read: false,
              createdAt: now.toISOString(),
            });
          }
        }
      });

      // Sort newest first
      computedNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(computedNotifs);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllNotifications();
  }, [userProfile]);

  const handleMarkAsRead = async (notif: AcademicNotification) => {
    if (!userProfile?.uid) return;
    try {
      if (!notif.id.startsWith('today-') && !notif.id.startsWith('due-') && !notif.id.startsWith('exam-')) {
        await markNotificationAsRead(userProfile.uid, notif.id);
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!userProfile?.uid) return;
    try {
      await markAllNotificationsAsRead(userProfile.uid);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userProfile?.uid) return;
    try {
      if (!id.startsWith('today-') && !id.startsWith('due-') && !id.startsWith('exam-')) {
        await deleteAcademicNotification(userProfile.uid, id);
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'assignment_due':
        return <ClipboardCheck className="w-5 h-5 text-indigo-400" />;
      case 'exam_alert':
        return <GraduationCap className="w-5 h-5 text-rose-400" />;
      case 'class_reminder':
        return <Calendar className="w-5 h-5 text-cyan-400" />;
      case 'document_upload':
        return <FolderArchive className="w-5 h-5 text-emerald-400" />;
      case 'goal_reached':
        return <Target className="w-5 h-5 text-amber-400" />;
      default:
        return <Bell className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-2">
            <Bell className="w-3.5 h-3.5" />
            <span>Academic Alerts & Activity Log</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading">
            Notifications ({unreadCount} Unread)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Real-time updates regarding university classes, impending assignment deadlines, and exam schedules.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-400/40 hover:border-cyan-400 text-cyan-300 font-semibold text-xs flex items-center space-x-2 cursor-pointer transition-all shrink-0"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-xs text-slate-400">
          Checking your academic alert feed...
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
          <Bell className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">All caught up</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You have no pending academic alerts. Classes, assignments, and exam reminders will notify you here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`glass-card rounded-2xl p-4 sm:p-5 border transition-all flex items-start justify-between gap-4 ${
                n.read
                  ? 'border-white/5 opacity-70 hover:opacity-100'
                  : 'border-cyan-500/30 bg-cyan-950/10 shadow-[0_0_15px_rgba(34,211,238,0.08)]'
              }`}
            >
              <div className="flex items-start space-x-3.5 flex-1">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 shrink-0 mt-0.5">
                  {getNotifIcon(n.type)}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white">{n.title}</h3>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-500 font-mono block pt-1">
                    {new Date(n.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                {n.link && onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      handleMarkAsRead(n);
                      onNavigate(n.link!);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}

                {!n.read && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(n)}
                    className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                    title="Mark as Read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(n.id)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400"
                  title="Dismiss"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
