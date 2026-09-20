import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  AcademicClass,
  Assignment,
  AcademicNote,
  AcademicGoal,
  FocusSession,
  AcademicExam,
  RevisionTopic,
  KnowledgeEntry,
  CalendarEvent,
  AcademicNotification,
} from '../types';

// ==========================================
// 1. CLASSES SERVICE
// ==========================================

export async function fetchUserClasses(uid: string): Promise<AcademicClass[]> {
  try {
    const q = query(
      collection(db, 'classes'),
      where('ownerId', '==', uid)
    );
    const snap = await getDocs(q);
    const list: AcademicClass[] = [];
    snap.forEach((d) => {
      list.push({ ...(d.data() as AcademicClass), id: d.id });
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'classes');
    return [];
  }
}

export async function createUserClass(
  uid: string,
  classData: Omit<AcademicClass, 'id'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'classes'), {
      ...classData,
      ownerId: uid,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'classes');
    throw err;
  }
}

export async function deleteUserClass(classId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'classes', classId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `classes/${classId}`);
    throw err;
  }
}

// ==========================================
// 2. ASSIGNMENTS SERVICE
// ==========================================

export async function fetchUserAssignments(uid: string): Promise<Assignment[]> {
  try {
    const q = query(
      collection(db, 'assignments'),
      where('ownerId', '==', uid)
    );
    const snap = await getDocs(q);
    const list: Assignment[] = [];
    snap.forEach((d) => {
      list.push({ ...(d.data() as Assignment), id: d.id });
    });
    // Sort by dueDate ascending
    list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'assignments');
    return [];
  }
}

export async function createUserAssignment(
  uid: string,
  data: Omit<Assignment, 'id'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'assignments'), {
      ...data,
      ownerId: uid,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'assignments');
    throw err;
  }
}

export async function updateUserAssignmentStatus(
  assignmentId: string,
  status: 'Pending' | 'In Progress' | 'Submitted'
): Promise<void> {
  try {
    await updateDoc(doc(db, 'assignments', assignmentId), {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `assignments/${assignmentId}`);
    throw err;
  }
}

export async function deleteUserAssignment(assignmentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'assignments', assignmentId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `assignments/${assignmentId}`);
    throw err;
  }
}

// ==========================================
// 3. ACADEMIC NOTES SERVICE
// ==========================================

export async function fetchUserNotes(uid: string): Promise<AcademicNote[]> {
  try {
    const q = query(
      collection(db, 'notes'),
      where('ownerId', '==', uid)
    );
    const snap = await getDocs(q);
    const list: AcademicNote[] = [];
    snap.forEach((d) => {
      list.push({ ...(d.data() as AcademicNote), id: d.id });
    });
    // Sort by date newest first
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'notes');
    return [];
  }
}

export async function createUserNote(
  uid: string,
  data: Omit<AcademicNote, 'id'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'notes'), {
      ...data,
      ownerId: uid,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'notes');
    throw err;
  }
}

export async function deleteUserNote(noteId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'notes', noteId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `notes/${noteId}`);
    throw err;
  }
}

// ==========================================
// 4. ACADEMIC GOALS SERVICE
// ==========================================

export async function fetchUserGoals(uid: string): Promise<AcademicGoal[]> {
  try {
    const q = query(
      collection(db, 'goals'),
      where('ownerId', '==', uid)
    );
    const snap = await getDocs(q);
    const list: AcademicGoal[] = [];
    snap.forEach((d) => {
      list.push({ ...(d.data() as AcademicGoal), id: d.id });
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'goals');
    return [];
  }
}

export async function createUserGoal(
  uid: string,
  data: Omit<AcademicGoal, 'id' | 'createdAt' | 'ownerId'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'goals'), {
      ...data,
      ownerId: uid,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'goals');
    throw err;
  }
}

export async function updateGoalProgress(
  goalId: string,
  progress: number,
  completed: boolean
): Promise<void> {
  try {
    await updateDoc(doc(db, 'goals', goalId), {
      progress: Math.min(100, Math.max(0, progress)),
      completed,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `goals/${goalId}`);
    throw err;
  }
}

export async function deleteUserGoal(goalId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'goals', goalId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `goals/${goalId}`);
    throw err;
  }
}

// ==========================================
// 5. FOCUS SESSIONS SERVICE
// ==========================================

export async function fetchUserFocusSessions(uid: string): Promise<FocusSession[]> {
  try {
    const q = query(
      collection(db, 'focus_sessions'),
      where('ownerId', '==', uid)
    );
    const snap = await getDocs(q);
    const list: FocusSession[] = [];
    snap.forEach((d) => {
      list.push({ ...(d.data() as FocusSession), id: d.id });
    });
    list.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'focus_sessions');
    return [];
  }
}

export async function logFocusSession(
  uid: string,
  data: Omit<FocusSession, 'id' | 'ownerId'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'focus_sessions'), {
      ...data,
      ownerId: uid,
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'focus_sessions');
    throw err;
  }
}

// ==========================================
// 6. ACADEMIC EXAMS SERVICE
// ==========================================

export async function fetchUserExams(uid: string): Promise<AcademicExam[]> {
  try {
    // Try user subcollection first
    const subColRef = collection(db, 'users', uid, 'exams');
    const subSnap = await getDocs(subColRef);
    const list: AcademicExam[] = [];

    subSnap.forEach((d) => {
      list.push({ ...(d.data() as AcademicExam), id: d.id, ownerId: uid });
    });

    // Also check root collection for backward compatibility
    if (list.length === 0) {
      const rootQ = query(collection(db, 'exams'), where('ownerId', '==', uid));
      const rootSnap = await getDocs(rootQ);
      rootSnap.forEach((d) => {
        list.push({ ...(d.data() as AcademicExam), id: d.id, ownerId: uid });
      });
    }

    // Sort by exam date ascending
    list.sort((a, b) => new Date(`${a.examDate}T${a.time || '00:00'}`).getTime() - new Date(`${b.examDate}T${b.time || '00:00'}`).getTime());
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${uid}/exams`);
    return [];
  }
}

export async function createUserExam(
  uid: string,
  data: Omit<AcademicExam, 'id' | 'ownerId'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'users', uid, 'exams'), {
      ...data,
      ownerId: uid,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${uid}/exams`);
    throw err;
  }
}

export async function updateUserExam(
  uid: string,
  examId: string,
  data: Partial<AcademicExam>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid, 'exams', examId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    try {
      await updateDoc(doc(db, 'exams', examId), {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/exams/${examId}`);
      throw err;
    }
  }
}

export async function deleteUserExam(uid: string, examId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', uid, 'exams', examId));
  } catch (err) {
    // Fallback delete root
    try {
      await deleteDoc(doc(db, 'exams', examId));
    } catch {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}/exams/${examId}`);
      throw err;
    }
  }
}

// ==========================================
// 7. BRIAN'S KNOWLEDGE VAULT SERVICE
// ==========================================

export async function fetchUserKnowledgeEntries(uid: string): Promise<KnowledgeEntry[]> {
  try {
    const subColRef = collection(db, 'users', uid, 'knowledge');
    const snap = await getDocs(subColRef);
    const list: KnowledgeEntry[] = [];
    snap.forEach((d) => {
      list.push({ ...(d.data() as KnowledgeEntry), id: d.id, ownerId: uid });
    });
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${uid}/knowledge`);
    return [];
  }
}

export async function createKnowledgeEntry(
  uid: string,
  data: Omit<KnowledgeEntry, 'id' | 'ownerId' | 'createdAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'users', uid, 'knowledge'), {
      ...data,
      ownerId: uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${uid}/knowledge`);
    throw err;
  }
}

export async function updateKnowledgeEntry(
  uid: string,
  entryId: string,
  data: Partial<KnowledgeEntry>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid, 'knowledge', entryId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/knowledge/${entryId}`);
    throw err;
  }
}

export async function deleteKnowledgeEntry(uid: string, entryId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', uid, 'knowledge', entryId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${uid}/knowledge/${entryId}`);
    throw err;
  }
}

// ==========================================
// 8. REVISION CENTER TOPICS SERVICE
// ==========================================

export async function fetchUserRevisionTopics(uid: string): Promise<RevisionTopic[]> {
  try {
    const subColRef = collection(db, 'users', uid, 'revision');
    const snap = await getDocs(subColRef);
    const list: RevisionTopic[] = [];
    snap.forEach((d) => {
      list.push({ ...(d.data() as RevisionTopic), id: d.id, ownerId: uid });
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${uid}/revision`);
    return [];
  }
}

export async function createRevisionTopic(
  uid: string,
  data: Omit<RevisionTopic, 'id' | 'ownerId'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'users', uid, 'revision'), {
      ...data,
      ownerId: uid,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${uid}/revision`);
    throw err;
  }
}

export async function updateRevisionTopic(
  uid: string,
  topicId: string,
  data: Partial<RevisionTopic>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid, 'revision', topicId), {
      ...data,
      lastRevisedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/revision/${topicId}`);
    throw err;
  }
}

export async function deleteRevisionTopic(uid: string, topicId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', uid, 'revision', topicId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${uid}/revision/${topicId}`);
    throw err;
  }
}

// ==========================================
// 9. ACADEMIC CALENDAR SERVICE
// ==========================================

export async function fetchUserCalendarEvents(uid: string): Promise<CalendarEvent[]> {
  try {
    const subColRef = collection(db, 'users', uid, 'calendar');
    const snap = await getDocs(subColRef);
    const list: CalendarEvent[] = [];
    snap.forEach((d) => {
      list.push({ ...(d.data() as CalendarEvent), id: d.id, ownerId: uid });
    });
    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${uid}/calendar`);
    return [];
  }
}

export async function createCalendarEvent(
  uid: string,
  data: Omit<CalendarEvent, 'id' | 'ownerId'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'users', uid, 'calendar'), {
      ...data,
      ownerId: uid,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${uid}/calendar`);
    throw err;
  }
}

export async function deleteCalendarEvent(uid: string, eventId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', uid, 'calendar', eventId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${uid}/calendar/${eventId}`);
    throw err;
  }
}

// ==========================================
// 10. NOTIFICATIONS SERVICE
// ==========================================

export async function fetchUserNotifications(uid: string): Promise<AcademicNotification[]> {
  try {
    const subColRef = collection(db, 'users', uid, 'notifications');
    const snap = await getDocs(subColRef);
    const list: AcademicNotification[] = [];
    snap.forEach((d) => {
      list.push({ ...(d.data() as AcademicNotification), id: d.id, ownerId: uid });
    });
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${uid}/notifications`);
    return [];
  }
}

export async function createNotification(
  uid: string,
  data: Omit<AcademicNotification, 'id' | 'ownerId' | 'createdAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'users', uid, 'notifications'), {
      ...data,
      ownerId: uid,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${uid}/notifications`);
    throw err;
  }
}

export async function markNotificationAsRead(uid: string, notifId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid, 'notifications', notifId), {
      read: true,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/notifications/${notifId}`);
    throw err;
  }
}

export async function markAllNotificationsAsRead(
  uid: string,
  notifications?: AcademicNotification[]
): Promise<void> {
  try {
    let unreadList = notifications;
    if (!unreadList) {
      unreadList = await fetchUserNotifications(uid);
    }
    const unread = unreadList.filter((n) => !n.read);
    await Promise.all(
      unread.map((n) => updateDoc(doc(db, 'users', uid, 'notifications', n.id), { read: true }))
    );
  } catch (err) {
    console.error('Failed to mark all as read:', err);
  }
}

export async function deleteNotification(uid: string, notifId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', uid, 'notifications', notifId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${uid}/notifications/${notifId}`);
    throw err;
  }
}

// Aliases for unified naming across all views
export const createAcademicExam = createUserExam;
export const updateAcademicExam = updateUserExam;
export const deleteAcademicExam = deleteUserExam;

export const fetchUserKnowledgeItems = fetchUserKnowledgeEntries;
export const createKnowledgeItem = createKnowledgeEntry;
export const updateKnowledgeItem = updateKnowledgeEntry;
export const deleteKnowledgeItem = deleteKnowledgeEntry;

export const createAcademicNotification = createNotification;
export const deleteAcademicNotification = deleteNotification;

