import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  TimetableEvent,
  TimetableDay,
  TimetableBuildingOption,
} from '../../types';
import {
  fetchUserTimetable,
  createTimetableClass,
  updateTimetableClass,
  deleteTimetableClass,
  detectTimetableConflicts,
  getKenyaCurrentDayAndTime,
  DAY_ORDER,
  parseTimeToMinutes,
  generateTimetableICS,
} from '../../services/timetableService';
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  Building,
  User,
  Trash2,
  Edit2,
  AlertTriangle,
  Download,
  Printer,
  Search,
  CheckCircle2,
  Sparkles,
  Calendar,
  Layers,
  BookOpen,
  X,
  Bell,
  Info,
} from 'lucide-react';

interface TimetableViewProps {
  onNavigate?: (route: string) => void;
  onOpenAddModal?: () => void;
}

export const TimetableView: React.FC<TimetableViewProps> = ({ onNavigate }) => {
  const { userProfile, currentUser } = useAuth();
  const uid = currentUser?.uid || userProfile?.uid;

  const [timetable, setTimetable] = useState<TimetableEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'columns' | 'list'>('columns');
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState<string>('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimetableEvent | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Form states
  const [formUnitCode, setFormUnitCode] = useState('');
  const [formUnitName, setFormUnitName] = useState('');
  const [formDay, setFormDay] = useState<TimetableDay>('Monday');
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formEndTime, setFormEndTime] = useState('10:00');
  const [formBuildingOption, setFormBuildingOption] = useState<TimetableBuildingOption>('KEMU Hub');
  const [formCustomBuilding, setFormCustomBuilding] = useState('');
  const [formLocation, setFormLocation] = useState('Main Campus');
  const [formRoomNumber, setFormRoomNumber] = useState('');
  const [formLecturer, setFormLecturer] = useState('');
  const [formClassType, setFormClassType] = useState('Lecture');
  const [formNotes, setFormNotes] = useState('');
  const [formReminder, setFormReminder] = useState<number>(15);
  const [detectedConflicts, setDetectedConflicts] = useState<TimetableEvent[]>([]);
  const [ignoreConflictPrompt, setIgnoreConflictPrompt] = useState(false);

  // Time & date in Kenya
  const kenyaInfo = getKenyaCurrentDayAndTime();

  const loadTimetable = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const list = await fetchUserTimetable(uid);
      setTimetable(list);
    } catch (err) {
      console.error('Failed to load timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, [uid]);

  // Live conflict detection whenever day, start, or end time change in form
  useEffect(() => {
    if (!isModalOpen) return;
    const conflicts = detectTimetableConflicts(
      timetable,
      { day: formDay, startTime: formStartTime, endTime: formEndTime },
      editingEvent?.eventId
    );
    setDetectedConflicts(conflicts);
  }, [formDay, formStartTime, formEndTime, timetable, editingEvent, isModalOpen]);

  const openCreateModal = (presetDay?: TimetableDay) => {
    setEditingEvent(null);
    setFormUnitCode('');
    setFormUnitName('');
    setFormDay(presetDay || (kenyaInfo.day as TimetableDay) || 'Monday');
    setFormStartTime('08:00');
    setFormEndTime('10:00');
    setFormBuildingOption('KEMU Hub');
    setFormCustomBuilding('');
    setFormLocation('Main Campus');
    setFormRoomNumber('');
    setFormLecturer('');
    setFormClassType('Lecture');
    setFormNotes('');
    setFormReminder(15);
    setDetectedConflicts([]);
    setIgnoreConflictPrompt(false);
    setIsModalOpen(true);
  };

  const openEditModal = (event: TimetableEvent) => {
    setEditingEvent(event);
    setFormUnitCode(event.unitCode);
    setFormUnitName(event.unitName);
    setFormDay(event.day);
    setFormStartTime(event.startTime);
    setFormEndTime(event.endTime);

    if (event.building === 'KEMU Hub' || event.building === 'KEMU Towers') {
      setFormBuildingOption(event.building);
      setFormCustomBuilding('');
    } else {
      setFormBuildingOption('Other');
      setFormCustomBuilding(event.building);
    }

    setFormLocation(event.location || '');
    setFormRoomNumber(event.roomNumber);
    setFormLecturer(event.lecturerName || '');
    setFormClassType(event.classType || 'Lecture');
    setFormNotes(event.notes || '');
    setFormReminder(event.reminderMinutes || 15);
    setIgnoreConflictPrompt(false);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;

    if (!formUnitCode.trim() || !formUnitName.trim() || !formRoomNumber.trim()) {
      setFeedbackMessage({
        type: 'error',
        text: 'Please enter Unit Code, Unit Name, and Room Number.',
      });
      return;
    }

    const startMins = parseTimeToMinutes(formStartTime);
    const endMins = parseTimeToMinutes(formEndTime);
    if (endMins <= startMins) {
      setFeedbackMessage({
        type: 'error',
        text: 'End time must be later than start time.',
      });
      return;
    }

    // If conflicts exist and user hasn't explicitly clicked override
    if (detectedConflicts.length > 0 && !ignoreConflictPrompt) {
      setFeedbackMessage({
        type: 'error',
        text: `Conflict detected with ${detectedConflicts[0].unitCode}. Review the warning or tick "Confirm Overlapping Schedule" to save.`,
      });
      return;
    }

    const finalBuilding =
      formBuildingOption === 'Other'
        ? formCustomBuilding.trim() || 'Other Campus Building'
        : formBuildingOption;

    const payload = {
      unitCode: formUnitCode.trim().toUpperCase(),
      unitName: formUnitName.trim(),
      day: formDay,
      startTime: formStartTime,
      endTime: formEndTime,
      building: finalBuilding,
      location:
        formLocation.trim() ||
        (finalBuilding === 'KEMU Hub'
          ? 'KEMU Hub Campus'
          : finalBuilding === 'KEMU Towers'
          ? 'KEMU Towers Campus'
          : ''),
      roomNumber: formRoomNumber.trim(),
      lecturerName: formLecturer.trim() || undefined,
      classType: formClassType || 'Lecture',
      notes: formNotes.trim() || undefined,
      reminderMinutes: formReminder,
      color:
        formClassType === 'Practical / Lab'
          ? 'border-emerald-400'
          : formClassType === 'Tutorial'
          ? 'border-indigo-400'
          : formClassType === 'Seminar'
          ? 'border-amber-400'
          : 'border-cyan-400',
    };

    try {
      if (editingEvent) {
        await updateTimetableClass(uid, editingEvent.eventId, payload);
        setFeedbackMessage({
          type: 'success',
          text: `Class ${payload.unitCode} updated successfully.`,
        });
      } else {
        await createTimetableClass(uid, payload);
        setFeedbackMessage({
          type: 'success',
          text: `Class ${payload.unitCode} added to your weekly timetable.`,
        });
      }

      setIsModalOpen(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
      await loadTimetable();
    } catch (err) {
      console.error('Failed to save class:', err);
      setFeedbackMessage({
        type: 'error',
        text: 'Could not save timetable event. Please verify your connection.',
      });
    }
  };

  const handleDelete = async (eventId: string, unitCode: string) => {
    if (!uid) return;
    if (!window.confirm(`Are you sure you want to remove ${unitCode} from your timetable?`)) {
      return;
    }

    try {
      await deleteTimetableClass(uid, eventId);
      setTimetable((prev) => prev.filter((item) => item.eventId !== eventId));
      setFeedbackMessage({
        type: 'success',
        text: `${unitCode} has been removed from your schedule.`,
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err) {
      console.error('Failed to delete class:', err);
      setFeedbackMessage({
        type: 'error',
        text: 'Could not remove class. Please try again.',
      });
    }
  };

  const handleExportICS = () => {
    if (timetable.length === 0) {
      alert('Your timetable is empty. Add classes first to export.');
      return;
    }
    const icsContent = generateTimetableICS(timetable, userProfile?.fullName || 'Student');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `KEMU_Timetable_${userProfile?.fullName || 'MyHub'}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter logic
  const filteredEvents = timetable.filter((event) => {
    const matchesDay = selectedDay === 'All' || event.day === selectedDay;
    const matchesBuilding =
      buildingFilter === 'All' ||
      (buildingFilter === 'KEMU Hub' && event.building === 'KEMU Hub') ||
      (buildingFilter === 'KEMU Towers' && event.building === 'KEMU Towers') ||
      (buildingFilter === 'Other' &&
        event.building !== 'KEMU Hub' &&
        event.building !== 'KEMU Towers');

    const matchesSearch =
      searchQuery === '' ||
      event.unitCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.unitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.lecturerName && event.lecturerName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesDay && matchesBuilding && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-7 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-bold text-white font-heading tracking-tight">
              KEMU Personal Timetable
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl">
            Manage your official Kenya Methodist University class schedule with real Firestore synchronization, campus locations, and conflict detection.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="timetable-add-class-btn"
            type="button"
            onClick={() => openCreateModal()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-[0_0_20px_rgba(34,211,238,0.25)] cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class</span>
          </button>

          <button
            id="timetable-export-ics-btn"
            type="button"
            onClick={handleExportICS}
            className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/15 text-slate-200 hover:text-white text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all"
            title="Download .ics file for Google Calendar or Apple Calendar"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export Calendar</span>
          </button>

          <button
            id="timetable-print-btn"
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/15 text-slate-200 hover:text-white text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all"
            title="Print weekly schedule"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center space-x-2 text-xs animate-in fade-in ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/70 border-red-500/40 text-red-200'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span className="font-semibold">{feedbackMessage.text}</span>
        </div>
      )}

      {/* Control Bar: Day Tabs, Filters, and Search */}
      <div className="glass-panel rounded-2xl p-4 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Day of Week Selector */}
        <div className="flex items-center overflow-x-auto pb-1 lg:pb-0 gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedDay('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedDay === 'All'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            All Days ({timetable.length})
          </button>
          {DAY_ORDER.map((day) => {
            const count = timetable.filter((c) => c.day === day).length;
            const isToday = kenyaInfo.day === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
                  selectedDay === day
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <span>{day.slice(0, 3)}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      selectedDay === day
                        ? 'bg-cyan-400/20 text-cyan-200'
                        : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                )}
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" title="Today in Kenya" />
                )}
              </button>
            );
          })}
        </div>

        {/* Search, Building Filter & View Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Building Filter */}
          <select
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="glass-input rounded-xl px-3 py-1.5 text-xs text-slate-200 border-white/10 cursor-pointer"
          >
            <option value="All">All Locations</option>
            <option value="KEMU Hub">KEMU Hub</option>
            <option value="KEMU Towers">KEMU Towers</option>
            <option value="Other">Other Campuses</option>
          </select>

          {/* Search Box */}
          <div className="relative min-w-[170px] flex-1 sm:flex-none">
            <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, unit, room..."
              className="w-full glass-input rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 bg-slate-900/80 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('columns')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === 'columns'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Weekly Columns"
            >
              Columns
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === 'list'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="List View"
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
          <p>Retrieving your authenticated KEMU timetable from Cloud Firestore...</p>
        </div>
      ) : timetable.length === 0 ? (
        /* Empty State with Zero Fake Data */
        <div className="glass-panel rounded-2xl p-12 text-center border border-dashed border-white/15 space-y-4 max-w-2xl mx-auto my-6">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 mx-auto flex items-center justify-center shadow-lg">
            <CalendarDays className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-heading">
              Your timetable is empty
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">
              Add your KEMU classes to start building your weekly schedule with accurate start/end times, campus buildings, and room numbers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openCreateModal()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 text-slate-950 text-xs font-bold inline-flex items-center space-x-2 shadow-lg cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class</span>
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center border border-dashed border-white/10 space-y-2">
          <Info className="w-6 h-6 text-cyan-400 mx-auto opacity-75" />
          <p className="text-xs text-slate-300">
            No classes match the filter criteria for &quot;{selectedDay}&quot;.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedDay('All');
              setBuildingFilter('All');
              setSearchQuery('');
            }}
            className="text-xs text-cyan-400 hover:underline cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : viewMode === 'columns' ? (
        /* Columns / Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(selectedDay === 'All' ? DAY_ORDER : [selectedDay as TimetableDay]).map((day) => {
            const dayClasses = filteredEvents.filter((c) => c.day === day);
            if (selectedDay === 'All' && dayClasses.length === 0) {
              return null; // Skip days with no classes when in All Days view for a compact bento
            }
            const isToday = kenyaInfo.day === day;

            return (
              <div
                key={day}
                className={`glass-card rounded-2xl p-4 flex flex-col justify-between border transition-all ${
                  isToday
                    ? 'border-cyan-400/40 shadow-[0_0_20px_rgba(34,211,238,0.12)]'
                    : 'border-white/10'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white font-heading">{day}</h4>
                    {isToday && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold uppercase">
                        Today
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openCreateModal(day)}
                    className="text-slate-400 hover:text-cyan-300 p-1 rounded hover:bg-white/5 transition-colors"
                    title={`Add class for ${day}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Event Cards inside this Day */}
                <div className="space-y-3 flex-1">
                  {dayClasses.map((item) => {
                    // Check if class is happening right now
                    const startMins = parseTimeToMinutes(item.startTime);
                    const endMins = parseTimeToMinutes(item.endTime);
                    const isNow =
                      isToday &&
                      kenyaInfo.minutesNow >= startMins &&
                      kenyaInfo.minutesNow < endMins;

                    return (
                      <div
                        key={item.eventId}
                        className={`p-3.5 rounded-xl bg-slate-900/70 border transition-all relative group flex flex-col justify-between ${
                          isNow
                            ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                            : 'border-white/10 hover:border-cyan-400/40'
                        }`}
                      >
                        {/* Live active indicator */}
                        {isNow && (
                          <div className="flex items-center space-x-1.5 mb-2 text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                            <span>In Session Right Now</span>
                          </div>
                        )}

                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-mono font-bold text-cyan-400">
                                {item.unitCode}
                              </span>
                              {item.classType && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-300">
                                  {item.classType}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-white/10 transition-colors"
                                title="Edit Class"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(item.eventId, item.unitCode)}
                                className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-white/10 transition-colors"
                                title="Delete Class"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <h5 className="text-xs font-semibold text-white mt-1 leading-snug">
                            {item.unitName}
                          </h5>
                        </div>

                        {/* Details Footnote */}
                        <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1 text-[11px] text-slate-300">
                          <div className="flex items-center space-x-1.5 text-cyan-300/90 font-mono">
                            <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span>
                              {item.startTime} - {item.endTime}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5 text-slate-300">
                            <Building className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {item.building} • <strong className="text-white">{item.roomNumber}</strong>
                            </span>
                          </div>

                          {item.lecturerName && (
                            <div className="flex items-center space-x-1.5 text-slate-400 text-[10px]">
                              <User className="w-3 h-3 shrink-0" />
                              <span className="truncate">{item.lecturerName}</span>
                            </div>
                          )}

                          {item.notes && (
                            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-white/5 line-clamp-2">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="glass-panel rounded-2xl border border-white/10 divide-y divide-white/5 overflow-hidden">
          {filteredEvents.map((item) => {
            const isToday = kenyaInfo.day === item.day;
            const startMins = parseTimeToMinutes(item.startTime);
            const endMins = parseTimeToMinutes(item.endTime);
            const isNow =
              isToday &&
              kenyaInfo.minutesNow >= startMins &&
              kenyaInfo.minutesNow < endMins;

            return (
              <div
                key={item.eventId}
                className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-white/[0.02] ${
                  isNow ? 'bg-cyan-950/20 border-l-4 border-cyan-400' : ''
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-mono uppercase font-bold">
                      {item.day.slice(0, 3)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {item.startTime.slice(0, 2)}h
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono font-bold text-cyan-400">
                        {item.unitCode}
                      </span>
                      <span className="text-xs text-white font-semibold">{item.unitName}</span>
                      {isNow && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider">
                          Live Now
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-300">
                      <span className="flex items-center space-x-1 font-mono text-cyan-300">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>
                          {item.startTime} - {item.endTime}
                        </span>
                      </span>

                      <span className="flex items-center space-x-1 text-slate-300">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {item.building} • <strong className="text-white">{item.roomNumber}</strong>
                        </span>
                      </span>

                      {item.lecturerName && (
                        <span className="flex items-center space-x-1 text-slate-400 text-[11px]">
                          <User className="w-3.5 h-3.5" />
                          <span>{item.lecturerName}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-cyan-400/40 text-xs text-slate-300 hover:text-white flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.eventId, item.unitCode)}
                    className="px-2.5 py-1.5 rounded-xl bg-red-950/40 border border-red-500/30 hover:bg-red-900/60 text-xs text-red-300 transition-colors cursor-pointer"
                    title="Delete Class"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD / EDIT CLASS MODAL WITH CONFLICT DETECTION            */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="glass-panel rounded-2xl w-full max-w-lg p-6 border border-cyan-500/30 shadow-2xl space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white font-heading">
                  {editingEvent ? 'Edit Timetable Class' : 'Add Class to Timetable'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conflict Warning Alert Banner */}
            {detectedConflicts.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold block text-amber-300">
                      Timetable Conflict Detected
                    </strong>
                    <p className="mt-0.5 text-amber-200/90">
                      This class overlaps on <strong>{formDay}</strong> with:
                    </p>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px]">
                      {detectedConflicts.map((c) => (
                        <li key={c.eventId}>
                          <strong>{c.unitCode}</strong> ({c.unitName}) from {c.startTime} to{' '}
                          {c.endTime} in {c.roomNumber}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <label className="flex items-center space-x-2 pt-1 text-[11px] text-amber-300 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ignoreConflictPrompt}
                    onChange={(e) => setIgnoreConflictPrompt(e.target.checked)}
                    className="rounded text-amber-500 bg-slate-900 border-white/20"
                  />
                  <span>Confirm and save with overlapping schedule anyway</span>
                </label>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              {/* Unit Code & Unit Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs text-slate-300 mb-1 font-medium">
                    Unit Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formUnitCode}
                    onChange={(e) => setFormUnitCode(e.target.value)}
                    placeholder="e.g. CIS 310"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white uppercase placeholder:text-slate-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-300 mb-1 font-medium">
                    Unit Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formUnitName}
                    onChange={(e) => setFormUnitName(e.target.value)}
                    placeholder="e.g. Data Structures & Algorithms"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Day, Start Time & End Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">
                    Day of Week <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value as TimetableDay)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                  >
                    {DAY_ORDER.map((d) => (
                      <option key={d} value={d} className="bg-slate-900 text-white">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">
                    Start Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">
                    End Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Building Selection & Room Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">
                    Building / Location <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formBuildingOption}
                    onChange={(e) => {
                      const val = e.target.value as TimetableBuildingOption;
                      setFormBuildingOption(val);
                      if (val === 'KEMU Hub') setFormLocation('Main Campus');
                      else if (val === 'KEMU Towers') setFormLocation('Nairobi Campus');
                    }}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                  >
                    <option value="KEMU Hub" className="bg-slate-900 text-white">
                      KEMU Hub
                    </option>
                    <option value="KEMU Towers" className="bg-slate-900 text-white">
                      KEMU Towers
                    </option>
                    <option value="Other" className="bg-slate-900 text-white">
                      Other (Specify manually)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">
                    Room Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formRoomNumber}
                    onChange={(e) => setFormRoomNumber(e.target.value)}
                    placeholder="e.g. Room 101, Lab 3, Hall 2"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Conditional Manual Location Input if "Other" */}
              {formBuildingOption === 'Other' && (
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">
                    Specify Custom Building / Campus Location
                  </label>
                  <input
                    type="text"
                    required
                    value={formCustomBuilding}
                    onChange={(e) => setFormCustomBuilding(e.target.value)}
                    placeholder="e.g. School of Medicine or Meru Town Campus"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              )}

              {/* Lecturer & Class Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">
                    Lecturer Name <span className="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formLecturer}
                    onChange={(e) => setFormLecturer(e.target.value)}
                    placeholder="e.g. Dr. Mwangi"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">
                    Class Type <span className="text-slate-500">(Optional)</span>
                  </label>
                  <select
                    value={formClassType}
                    onChange={(e) => setFormClassType(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                  >
                    <option value="Lecture" className="bg-slate-900 text-white">Lecture</option>
                    <option value="Practical / Lab" className="bg-slate-900 text-white">Practical / Lab</option>
                    <option value="Tutorial" className="bg-slate-900 text-white">Tutorial</option>
                    <option value="Seminar" className="bg-slate-900 text-white">Seminar</option>
                    <option value="Clinical" className="bg-slate-900 text-white">Clinical</option>
                    <option value="Workshop" className="bg-slate-900 text-white">Workshop</option>
                  </select>
                </div>
              </div>

              {/* Reminder minutes */}
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium flex items-center space-x-1.5">
                  <Bell className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Class Reminder</span>
                </label>
                <select
                  value={formReminder}
                  onChange={(e) => setFormReminder(Number(e.target.value))}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                >
                  <option value={5} className="bg-slate-900 text-white">5 minutes before</option>
                  <option value={10} className="bg-slate-900 text-white">10 minutes before</option>
                  <option value={15} className="bg-slate-900 text-white">15 minutes before (Recommended)</option>
                  <option value={30} className="bg-slate-900 text-white">30 minutes before</option>
                  <option value={60} className="bg-slate-900 text-white">1 hour before</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">
                  Class Notes / Reminders <span className="text-slate-500">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Bring lab coat, project submission week 6..."
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 hover:text-white border border-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer transition-all"
                >
                  {editingEvent ? 'Save Changes' : 'Add Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
