import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { TimetableEvent, TimetableDay } from '../types';

export const DAY_ORDER: TimetableDay[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/**
 * Parses "HH:mm" string to minutes from midnight
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Formats minutes from midnight to "HH:mm"
 */
export function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Fetches all timetable events for a given authenticated user
 * Path: users/{uid}/timetable
 */
export async function fetchUserTimetable(uid: string): Promise<TimetableEvent[]> {
  const collectionPath = `users/${uid}/timetable`;
  try {
    const colRef = collection(db, 'users', uid, 'timetable');
    const snap = await getDocs(colRef);
    const list: TimetableEvent[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        eventId: d.id,
        ownerId: data.ownerId || uid,
        unitCode: data.unitCode || '',
        unitName: data.unitName || '',
        day: data.day as TimetableDay,
        startTime: data.startTime || '08:00',
        endTime: data.endTime || '10:00',
        building: data.building || 'KEMU Hub',
        location: data.location || '',
        roomNumber: data.roomNumber || '',
        lecturerName: data.lecturerName || '',
        classType: data.classType || 'Lecture',
        notes: data.notes || '',
        reminderMinutes: data.reminderMinutes || 15,
        color: data.color || 'border-cyan-400',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt,
      });
    });

    // Sort by day order then start time
    list.sort((a, b) => {
      const dayDiff = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
    });

    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, collectionPath);
    return [];
  }
}

/**
 * Creates a new timetable event under users/{uid}/timetable
 */
export async function createTimetableClass(
  uid: string,
  eventData: Omit<TimetableEvent, 'eventId' | 'ownerId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const collectionPath = `users/${uid}/timetable`;
  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, 'users', uid, 'timetable'), {
      ...eventData,
      ownerId: uid,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, collectionPath);
    throw err;
  }
}

/**
 * Updates an existing timetable event under users/{uid}/timetable/{eventId}
 */
export async function updateTimetableClass(
  uid: string,
  eventId: string,
  eventData: Partial<TimetableEvent>
): Promise<void> {
  const docPath = `users/${uid}/timetable/${eventId}`;
  try {
    const ref = doc(db, 'users', uid, 'timetable', eventId);
    const { eventId: _eId, ownerId: _oId, ...dataToSave } = eventData;
    await updateDoc(ref, {
      ...dataToSave,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, docPath);
    throw err;
  }
}

/**
 * Deletes a timetable event under users/{uid}/timetable/{eventId}
 */
export async function deleteTimetableClass(uid: string, eventId: string): Promise<void> {
  const docPath = `users/${uid}/timetable/${eventId}`;
  try {
    const ref = doc(db, 'users', uid, 'timetable', eventId);
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
    throw err;
  }
}

/**
 * Automatically detects overlapping classes on the same day
 */
export function detectTimetableConflicts(
  existingClasses: TimetableEvent[],
  target: { day: TimetableDay; startTime: string; endTime: string },
  excludeEventId?: string
): TimetableEvent[] {
  const targetStart = parseTimeToMinutes(target.startTime);
  const targetEnd = parseTimeToMinutes(target.endTime);

  if (targetEnd <= targetStart) {
    return [];
  }

  return existingClasses.filter((c) => {
    if (excludeEventId && c.eventId === excludeEventId) return false;
    if (c.day !== target.day) return false;

    const cStart = parseTimeToMinutes(c.startTime);
    const cEnd = parseTimeToMinutes(c.endTime);

    // Overlap condition: startA < endB && endA > startB
    return targetStart < cEnd && targetEnd > cStart;
  });
}

/**
 * Gets the current day of the week and current time in Kenya (EAT / UTC+3)
 */
export function getKenyaCurrentDayAndTime(): {
  day: TimetableDay;
  currentTimeStr: string;
  minutesNow: number;
} {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Nairobi',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    let weekdayStr = '';
    let hourStr = '00';
    let minuteStr = '00';

    for (const part of parts) {
      if (part.type === 'weekday') weekdayStr = part.value;
      if (part.type === 'hour') hourStr = part.value;
      if (part.type === 'minute') minuteStr = part.value;
    }

    const matchedDay = DAY_ORDER.find(
      (d) => d.toLowerCase() === weekdayStr.toLowerCase()
    ) || 'Monday';

    const timeStr = `${hourStr}:${minuteStr}`;
    return {
      day: matchedDay,
      currentTimeStr: timeStr,
      minutesNow: parseTimeToMinutes(timeStr),
    };
  } catch {
    // Fallback to local machine date/time
    const now = new Date();
    const dayNames: TimetableDay[] = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const day = dayNames[now.getDay()];
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const timeStr = `${h}:${m}`;
    return {
      day,
      currentTimeStr: timeStr,
      minutesNow: parseTimeToMinutes(timeStr),
    };
  }
}

/**
 * Calculates current class in session, next class today, or next class this week
 */
export function getNextClassCalculation(classes: TimetableEvent[]): {
  activeClass: TimetableEvent | null;
  nextClass: TimetableEvent | null;
  todaysClasses: TimetableEvent[];
  statusBadge: 'IN_SESSION' | 'UPCOMING_TODAY' | 'COMPLETED_TODAY' | 'EMPTY' | 'FUTURE_DAY';
  statusMessage: string;
  timeRemainingText: string;
} {
  if (classes.length === 0) {
    return {
      activeClass: null,
      nextClass: null,
      todaysClasses: [],
      statusBadge: 'EMPTY',
      statusMessage: 'No classes scheduled on your timetable.',
      timeRemainingText: 'Add your classes to see schedule',
    };
  }

  const { day: currentDay, minutesNow } = getKenyaCurrentDayAndTime();
  const todaysClasses = classes.filter((c) => c.day === currentDay);

  // Check if any class is currently happening
  const activeClass =
    todaysClasses.find((c) => {
      const start = parseTimeToMinutes(c.startTime);
      const end = parseTimeToMinutes(c.endTime);
      return minutesNow >= start && minutesNow < end;
    }) || null;

  if (activeClass) {
    const endMinutes = parseTimeToMinutes(activeClass.endTime);
    const diff = Math.max(0, endMinutes - minutesNow);
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;

    return {
      activeClass,
      nextClass: null,
      todaysClasses,
      statusBadge: 'IN_SESSION',
      statusMessage: `Class in session right now at ${activeClass.building}, ${activeClass.roomNumber}`,
      timeRemainingText: `Ends in ${timeStr}`,
    };
  }

  // Look for next upcoming class today
  const upcomingToday = todaysClasses.filter(
    (c) => parseTimeToMinutes(c.startTime) > minutesNow
  );

  if (upcomingToday.length > 0) {
    const nextClass = upcomingToday[0];
    const startMinutes = parseTimeToMinutes(nextClass.startTime);
    const diff = Math.max(0, startMinutes - minutesNow);
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;

    return {
      activeClass: null,
      nextClass,
      todaysClasses,
      statusBadge: 'UPCOMING_TODAY',
      statusMessage: `Next class starts at ${nextClass.startTime} (${nextClass.roomNumber})`,
      timeRemainingText: `Starts in ${timeStr}`,
    };
  }

  // If there were classes today, but they are all done
  if (todaysClasses.length > 0) {
    // Find next day with classes
    const currentDayIndex = DAY_ORDER.indexOf(currentDay);
    let nextScheduled: TimetableEvent | null = null;

    for (let i = 1; i <= 7; i++) {
      const checkDay = DAY_ORDER[(currentDayIndex + i) % 7];
      const found = classes.filter((c) => c.day === checkDay);
      if (found.length > 0) {
        nextScheduled = found[0];
        break;
      }
    }

    return {
      activeClass: null,
      nextClass: nextScheduled,
      todaysClasses,
      statusBadge: 'COMPLETED_TODAY',
      statusMessage: 'All scheduled classes for today are complete.',
      timeRemainingText: nextScheduled
        ? `Next: ${nextScheduled.unitCode} on ${nextScheduled.day} at ${nextScheduled.startTime}`
        : 'Rest of the week is clear',
    };
  }

  // No classes today at all, find next upcoming day
  const currentDayIndex = DAY_ORDER.indexOf(currentDay);
  let nextScheduled: TimetableEvent | null = null;

  for (let i = 1; i <= 7; i++) {
    const checkDay = DAY_ORDER[(currentDayIndex + i) % 7];
    const found = classes.filter((c) => c.day === checkDay);
    if (found.length > 0) {
      nextScheduled = found[0];
      break;
    }
  }

  return {
    activeClass: null,
    nextClass: nextScheduled,
    todaysClasses: [],
    statusBadge: 'FUTURE_DAY',
    statusMessage: `No classes scheduled today (${currentDay}).`,
    timeRemainingText: nextScheduled
      ? `Next: ${nextScheduled.unitCode} on ${nextScheduled.day} at ${nextScheduled.startTime}`
      : 'Weekly schedule is clear',
  };
}

/**
 * Generates an RFC 5545 .ics file for calendar export
 */
export function generateTimetableICS(classes: TimetableEvent[], userName = 'Student'): string {
  const dayToIcsFreq: Record<TimetableDay, string> = {
    Monday: 'MO',
    Tuesday: 'TU',
    Wednesday: 'WE',
    Thursday: 'TH',
    Friday: 'FR',
    Saturday: 'SA',
    Sunday: 'SU',
  };

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//My Learning Hub//KEMU Personal Academic Timetable//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${userName}'s KEMU Timetable`,
    'X-WR-TIMEZONE:Africa/Nairobi',
  ];

  // Base date reference for recurring events (e.g. 2026-09-21 was a Monday)
  const baseDayOffsets: Record<TimetableDay, number> = {
    Monday: 21,
    Tuesday: 22,
    Wednesday: 23,
    Thursday: 24,
    Friday: 25,
    Saturday: 26,
    Sunday: 27,
  };

  classes.forEach((c) => {
    const dayOffset = baseDayOffsets[c.day] || 21;
    const startParts = c.startTime.split(':');
    const endParts = c.endTime.split(':');
    const startH = (startParts[0] || '08').padStart(2, '0');
    const startM = (startParts[1] || '00').padStart(2, '0');
    const endH = (endParts[0] || '10').padStart(2, '0');
    const endM = (endParts[1] || '00').padStart(2, '0');

    const dtStart = `202609${dayOffset.toString().padStart(2, '0')}T${startH}${startM}00`;
    const dtEnd = `202609${dayOffset.toString().padStart(2, '0')}T${endH}${endM}00`;
    const summary = `${c.unitCode} - ${c.unitName}`;
    const location = `${c.building}, ${c.roomNumber}${c.location ? ` (${c.location})` : ''}`;
    const description = `Lecturer: ${c.lecturerName || 'TBA'}\\nType: ${c.classType || 'Lecture'}\\nNotes: ${c.notes || 'None'}`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${c.eventId || Math.random().toString(36).substring(2)}@mylearninghub.kemu`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART;TZID=Africa/Nairobi:${dtStart}`,
      `DTEND;TZID=Africa/Nairobi:${dtEnd}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${dayToIcsFreq[c.day]}`,
      `SUMMARY:${summary}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
