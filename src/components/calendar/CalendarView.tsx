import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import {
  fetchUserCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  fetchUserAssignments,
  fetchUserExams,
} from '../../services/workplaceService';
import { fetchUserTimetable } from '../../services/timetableService';
import { CalendarEvent, Assignment, AcademicExam, TimetableEvent } from '../../types';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Trash2,
  X,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Flame,
  User,
} from 'lucide-react';

interface CalendarViewProps {
  onNavigate?: (route: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<AcademicExam[]>([]);
  const [timetable, setTimetable] = useState<TimetableEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    type: 'personal' as const,
    unitCode: '',
    location: '',
    notes: '',
  });

  const loadData = async () => {
    if (!userProfile?.uid) return;
    try {
      setLoading(true);
      const [cal, asg, ex, tt] = await Promise.all([
        fetchUserCalendarEvents(userProfile.uid),
        fetchUserAssignments(userProfile.uid),
        fetchUserExams(userProfile.uid),
        fetchUserTimetable(userProfile.uid),
      ]);
      setCalendarEvents(cal);
      setAssignments(asg);
      setExams(ex);
      setTimetable(tt);
    } catch (err) {
      console.error('Error loading calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userProfile]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid || !newEvent.title || !newEvent.date) return;
    try {
      await createCalendarEvent(userProfile.uid, newEvent);
      setIsModalOpen(false);
      setNewEvent({
        title: '',
        date: selectedDateStr,
        startTime: '10:00',
        endTime: '11:00',
        type: 'personal',
        unitCode: '',
        location: '',
        notes: '',
      });
      await loadData();
    } catch (err) {
      console.error('Error creating event:', err);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!userProfile?.uid) return;
    try {
      await deleteCalendarEvent(userProfile.uid, id);
      await loadData();
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Month grid calculation
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Aggregate items for a specific date
  const getItemsForDate = (dateStr: string) => {
    const items: Array<{
      id: string;
      title: string;
      type: 'class' | 'assignment' | 'exam' | 'study' | 'personal';
      time?: string;
      location?: string;
      unit?: string;
      isCustom?: boolean;
    }> = [];

    // Custom calendar events
    calendarEvents
      .filter((e) => e.date === dateStr)
      .forEach((e) => {
        items.push({
          id: e.id,
          title: e.title,
          type: e.type,
          time: e.startTime,
          location: e.location,
          unit: e.unitCode,
          isCustom: true,
        });
      });

    // Assignments due on this date
    assignments
      .filter((a) => a.dueDate === dateStr)
      .forEach((a) => {
        items.push({
          id: `asg-${a.id}`,
          title: `Assignment Due: ${a.title}`,
          type: 'assignment',
          time: a.dueTime || '23:59',
          unit: a.course || a.unit,
        });
      });

    // Exams on this date
    exams
      .filter((e) => e.examDate === dateStr)
      .forEach((e) => {
        items.push({
          id: `ex-${e.id}`,
          title: `EXAM: ${e.title}`,
          type: 'exam',
          time: e.time,
          location: `${e.building} ${e.room}`,
          unit: e.unitCode,
        });
      });

    // Timetable classes matching day of week
    const targetDayName = new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', {
      weekday: 'long',
    });
    timetable
      .filter((tt) => tt.day === targetDayName)
      .forEach((tt) => {
        items.push({
          id: `tt-${tt.eventId}-${dateStr}`,
          title: `${tt.unitCode}: ${tt.unitName}`,
          type: 'class',
          time: `${tt.startTime} - ${tt.endTime}`,
          location: `${tt.building} • ${tt.roomNumber}`,
          unit: tt.unitCode,
        });
      });

    return items;
  };

  const selectedDateItems = getItemsForDate(selectedDateStr);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-2">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Integrated Academic Calendar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading">
            Academic Schedule & Events
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Combines timetable classes, coursework deadlines, examinations, and personal study sessions.
          </p>
        </div>

        <button
          id="add-calendar-event-btn"
          type="button"
          onClick={() => {
            setNewEvent({ ...newEvent, date: selectedDateStr });
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-[0_0_15px_rgba(34,211,238,0.35)] cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Event</span>
        </button>
      </div>

      {/* Calendar Controls & Month Header */}
      <div className="glass-panel rounded-2xl p-4 border border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-bold text-white font-heading">
            {monthNames[month]} {year}
          </h2>
          <div className="flex items-center space-x-1 bg-slate-900/80 rounded-xl p-1 border border-white/10">
            <button
              onClick={prevMonth}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2.5 py-0.5 text-xs font-semibold text-cyan-300 hover:text-white"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="hidden md:flex items-center space-x-4 text-xs">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Class</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <span className="text-slate-300">Assignment</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="text-slate-300">Exam</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Event</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Month Grid */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-white/10">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank leading slots */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[75px] rounded-xl p-1 opacity-20" />
            ))}

            {/* Month days */}
            {daysArray.map((dayNum) => {
              const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                dayNum
              ).padStart(2, '0')}`;
              const isSelected = selectedDateStr === dStr;
              const isToday =
                new Date().toISOString().split('T')[0] === dStr;
              const items = getItemsForDate(dStr);

              return (
                <div
                  key={dayNum}
                  onClick={() => setSelectedDateStr(dStr)}
                  className={`min-h-[78px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                      : isToday
                      ? 'bg-slate-900 border-cyan-400/50 text-white'
                      : 'bg-slate-900/60 border-white/5 hover:border-white/20 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isToday ? 'text-cyan-400 underline underline-offset-2' : ''
                      }`}
                    >
                      {dayNum}
                    </span>
                    {items.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                        {items.length}
                      </span>
                    )}
                  </div>

                  {/* Micro Indicators */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {items.slice(0, 3).map((it) => (
                      <span
                        key={it.id}
                        className={`w-1.5 h-1.5 rounded-full ${
                          it.type === 'class'
                            ? 'bg-cyan-400'
                            : it.type === 'assignment'
                            ? 'bg-indigo-400'
                            : it.type === 'exam'
                            ? 'bg-rose-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                    ))}
                    {items.length > 3 && (
                      <span className="text-[9px] text-slate-400 font-mono">
                        +{items.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Selected Day Agenda */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div>
                <span className="text-xs text-cyan-400 font-mono uppercase tracking-wider block">
                  Selected Agenda
                </span>
                <h3 className="text-base font-bold text-white font-heading">
                  {new Date(`${selectedDateStr}T12:00:00`).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewEvent({ ...newEvent, date: selectedDateStr });
                  setIsModalOpen(true);
                }}
                className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/30 cursor-pointer"
                title="Add event on this date"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {selectedDateItems.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No scheduled classes or events for this date.</p>
                <button
                  type="button"
                  onClick={() => {
                    setNewEvent({ ...newEvent, date: selectedDateStr });
                    setIsModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-cyan-300 text-xs font-semibold cursor-pointer"
                >
                  + Add Study Event
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateItems.map((it) => (
                  <div
                    key={it.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      it.type === 'class'
                        ? 'bg-cyan-950/20 border-cyan-500/30'
                        : it.type === 'assignment'
                        ? 'bg-indigo-950/20 border-indigo-500/30'
                        : it.type === 'exam'
                        ? 'bg-rose-950/20 border-rose-500/30'
                        : 'bg-emerald-950/20 border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-md ${
                          it.type === 'class'
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : it.type === 'assignment'
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : it.type === 'exam'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {it.type}
                      </span>
                      {it.isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(it.id)}
                          className="text-slate-400 hover:text-rose-400 p-1"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-white mb-1">{it.title}</h4>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      {it.time && (
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{it.time}</span>
                        </span>
                      )}
                      {it.location && (
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{it.location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Custom Calendar Event Modal */}
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
                <CalendarIcon className="w-4 h-4 text-cyan-400" />
                <span>Add Calendar Event</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Event Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="e.g. Distributed Systems Group Study"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Type</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, type: e.target.value as any })
                    }
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="study">Study Session</option>
                    <option value="personal">Personal Milestone</option>
                    <option value="class">Extra Lecture</option>
                    <option value="exam">Mock Exam</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Location / Venue</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="e.g. KEMU Hub Library Level 2 or Google Meet"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-white/10">
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
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
