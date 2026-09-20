import React, { useEffect, useState } from 'react';
import {
  TimetableEvent,
} from '../../types';
import {
  getNextClassCalculation,
  getKenyaCurrentDayAndTime,
  parseTimeToMinutes,
} from '../../services/timetableService';
import {
  Clock,
  Building,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Plus,
  ArrowRight,
  User,
  Sparkles,
} from 'lucide-react';

interface TimetableDashboardWidgetsProps {
  timetable: TimetableEvent[];
  onNavigateToTimetable: () => void;
  onOpenAddModal?: () => void;
}

export const TimetableDashboardWidgets: React.FC<TimetableDashboardWidgetsProps> = ({
  timetable,
  onNavigateToTimetable,
  onOpenAddModal,
}) => {
  // Recalculate every minute for live countdowns
  const [calcState, setCalcState] = useState(() => getNextClassCalculation(timetable));
  const kenyaInfo = getKenyaCurrentDayAndTime();

  useEffect(() => {
    setCalcState(getNextClassCalculation(timetable));
    const interval = setInterval(() => {
      setCalcState(getNextClassCalculation(timetable));
    }, 30000); // 30 seconds interval
    return () => clearInterval(interval);
  }, [timetable]);

  const { activeClass, nextClass, todaysClasses, statusBadge, statusMessage, timeRemainingText } =
    calcState;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* 1. Next Class Live Countdown Widget (1 col on lg) */}
      <div className="glass-card rounded-2xl p-5 border border-cyan-500/20 relative overflow-hidden flex flex-col justify-between">
        {/* Glow ambient accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div>
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-slate-300 font-heading">
                Next Academic Class
              </span>
            </div>

            {statusBadge === 'IN_SESSION' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider animate-pulse">
                In Session
              </span>
            )}
            {statusBadge === 'UPCOMING_TODAY' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 font-semibold">
                Upcoming Today
              </span>
            )}
            {statusBadge === 'COMPLETED_TODAY' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-semibold">
                Done for Today
              </span>
            )}
            {statusBadge === 'EMPTY' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-semibold">
                No Schedule
              </span>
            )}
          </div>

          {/* Active or Upcoming Class Content */}
          <div className="mt-4">
            {activeClass ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-base font-mono font-bold text-cyan-300">
                    {activeClass.unitCode}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200">
                    {activeClass.classType || 'Lecture'}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white leading-snug">
                  {activeClass.unitName}
                </h4>

                <div className="pt-2 text-xs space-y-1.5 text-slate-300">
                  <div className="flex items-center space-x-2 text-cyan-300 font-mono">
                    <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>
                      {activeClass.startTime} - {activeClass.endTime}
                    </span>
                    <span className="text-cyan-400 font-bold">({timeRemainingText})</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {activeClass.building} • <strong className="text-white">{activeClass.roomNumber}</strong>
                    </span>
                  </div>

                  {activeClass.lecturerName && (
                    <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span>{activeClass.lecturerName}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : nextClass ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-base font-mono font-bold text-cyan-300">
                    {nextClass.unitCode}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {nextClass.day} {nextClass.startTime}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white leading-snug">
                  {nextClass.unitName}
                </h4>

                <div className="pt-2 text-xs space-y-1.5 text-slate-300">
                  <div className="flex items-center space-x-2 text-cyan-300 font-mono">
                    <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>
                      {nextClass.startTime} - {nextClass.endTime}
                    </span>
                    <span className="text-sky-300 font-semibold">({timeRemainingText})</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {nextClass.building} • <strong className="text-white">{nextClass.roomNumber}</strong>
                    </span>
                  </div>

                  {nextClass.lecturerName && (
                    <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span>{nextClass.lecturerName}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center space-y-2">
                <p className="text-xs text-slate-300">{statusMessage}</p>
                <p className="text-[11px] text-slate-400">
                  Add your KEMU classes to see real-time updates and countdowns.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Link */}
        <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={onNavigateToTimetable}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center space-x-1 cursor-pointer"
          >
            <span>Open Timetable</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {onOpenAddModal && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="text-xs text-slate-400 hover:text-white inline-flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Class</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Today's Classes List (2 cols on lg) */}
      <div className="glass-card rounded-2xl p-5 border border-white/10 lg:col-span-2 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-heading">
                  Today&apos;s Classes ({kenyaInfo.day})
                </h3>
              </div>
            </div>

            <span className="text-xs font-mono text-cyan-400">
              {todaysClasses.length} {todaysClasses.length === 1 ? 'Class' : 'Classes'} Scheduled
            </span>
          </div>

          {/* List of today's classes */}
          <div className="mt-3">
            {todaysClasses.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-slate-300">
                  No classes scheduled for today ({kenyaInfo.day}).
                </p>
                <p className="text-[11px] text-slate-400">
                  {timetable.length > 0
                    ? 'You have classes scheduled on other days this week.'
                    : 'Your personal timetable is currently empty.'}
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onNavigateToTimetable}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-semibold inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>Manage Timetable</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {todaysClasses.map((c) => {
                  const startMins = parseTimeToMinutes(c.startTime);
                  const endMins = parseTimeToMinutes(c.endTime);
                  const isNow =
                    kenyaInfo.minutesNow >= startMins && kenyaInfo.minutesNow < endMins;
                  const isPast = kenyaInfo.minutesNow >= endMins;

                  return (
                    <div
                      key={c.eventId}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                        isNow
                          ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                          : isPast
                          ? 'bg-slate-900/40 border-white/5 opacity-60'
                          : 'bg-slate-900/70 border-white/10'
                      }`}
                    >
                      <div className="flex items-start sm:items-center space-x-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center shrink-0 font-mono text-xs ${
                            isNow
                              ? 'bg-cyan-400 text-slate-950 font-bold'
                              : 'bg-white/5 text-cyan-300'
                          }`}
                        >
                          <span className="text-[10px] uppercase">{c.startTime.slice(0, 2)}h</span>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono font-bold text-cyan-400">
                              {c.unitCode}
                            </span>
                            <span className="text-xs text-white font-semibold">
                              {c.unitName}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5 mt-1 text-[11px] text-slate-300">
                            <span className="font-mono text-cyan-300">
                              {c.startTime} - {c.endTime}
                            </span>
                            <span>•</span>
                            <span>
                              {c.building} ({c.roomNumber})
                            </span>
                            {c.lecturerName && (
                              <>
                                <span>•</span>
                                <span className="text-slate-400">{c.lecturerName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <div className="self-end sm:self-center shrink-0">
                        {isNow ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider">
                            Now
                          </span>
                        ) : isPast ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                            Completed
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 font-semibold">
                            Upcoming
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px]">Kenya Methodist University Official Timetable</span>
          <button
            type="button"
            onClick={onNavigateToTimetable}
            className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center space-x-1 cursor-pointer"
          >
            <span>View Full Weekly Grid</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
