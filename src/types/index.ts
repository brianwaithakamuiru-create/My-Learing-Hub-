export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  username: string;
  normalizedUsername: string;
  country: string;
  role: 'student' | 'researcher' | 'admin';
  accountStatus: 'ACTIVE' | 'DISABLED' | 'PENDING';
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  preferences?: {
    overlayStrength?: number;
    backgroundBlur?: number;
    clockAnimation?: boolean;
    backgroundPosition?: string;
  };
}

export interface AcademicDocument {
  documentId: string;
  ownerId: string;
  title: string;
  originalFileName: string;
  fileName?: string;
  storagePath: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  unitId?: string;
  unitName?: string;
  courseCode?: string;
  category: 'Lecture Notes' | 'Assignments' | 'Revision' | 'Past Papers' | 'Textbooks' | 'Research' | 'Class Materials' | 'Personal Notes' | 'Presentations' | 'Other';
  semester?: string;
  academicYear?: string;
  description?: string;
  tags: string[];
  isFavorite?: boolean;
  isImportant?: boolean;
  downloadUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicClass {
  id: string;
  code: string;
  name: string;
  instructor: string;
  room: string;
  schedule: string;
  semester: string;
  color: string;
}

export interface TimetableSlot {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  time: string;
  courseCode: string;
  courseName: string;
  room: string;
  type: 'Lecture' | 'Lab' | 'Seminar' | 'Tutorial';
}

export type TimetableDay =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export type TimetableBuildingOption = 'KEMU Hub' | 'KEMU Towers' | 'Other';

export interface TimetableEvent {
  eventId: string;
  ownerId: string;
  unitCode: string;
  unitName: string;
  day: TimetableDay;
  startTime: string;
  endTime: string;
  building: string;
  location?: string;
  roomNumber: string;
  lecturerName?: string;
  classType?: string;
  notes?: string;
  reminderMinutes?: number;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AssignmentStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Submitted'
  | 'Completed'
  | 'Overdue'
  | 'Pending';

export type AssignmentPriority = 'High' | 'Medium' | 'Low';

export interface Assignment {
  id: string;
  ownerId?: string;
  title: string;
  course: string; // Unit code e.g. CS 301
  unit?: string;
  description?: string;
  lecturer?: string;
  assignedDate?: string;
  dueDate: string;
  dueTime?: string;
  status: AssignmentStatus;
  priority?: AssignmentPriority;
  weight?: string;
  notes?: string;
  attachments?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type NoteCategory =
  | 'Quick'
  | 'Lecture'
  | 'Revision'
  | 'Assignment'
  | 'Personal';

export interface AcademicNote {
  id: string;
  ownerId?: string;
  title: string;
  course: string; // Unit code
  unit?: string;
  category?: NoteCategory;
  date: string;
  summary: string;
  content?: string;
  tags: string[];
  isPinned?: boolean;
  isFavorite?: boolean;
  linkedDocId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type GoalCategory =
  | 'Semester'
  | 'Weekly'
  | 'Study'
  | 'Assignment'
  | 'Revision'
  | 'GPA'
  | 'Reading';

export interface AcademicGoal {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  target: string;
  progress: number;
  category: GoalCategory;
  completed: boolean;
  targetDate?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FocusSession {
  id: string;
  ownerId: string;
  task: string;
  durationMinutes: number;
  completedAt: string;
  course?: string;
  notes?: string;
}

export interface AcademicExam {
  id: string;
  ownerId?: string;
  unitCode: string;
  courseCode?: string;
  unitName?: string;
  courseName?: string;
  title: string;
  examDate: string;
  time: string;
  building: string;
  room: string;
  durationMinutes?: number;
  lecturer?: string;
  topics?: string[];
  topicsCovered?: string[];
  notes?: string;
  readiness?: number;
  readinessPercentage?: number;
  status?: 'scheduled' | 'completed' | 'urgent';
  weight?: string;
  createdAt?: string;
}

export interface RevisionTopic {
  id: string;
  ownerId?: string;
  unitCode: string;
  topic: string;
  notes?: string;
  confidence: number;
  status?: 'not_started' | 'in_progress' | 'mastered' | 'weak';
  flashcards?: { id: string; question: string; answer: string }[];
  practiceQuestions?: {
    id: string;
    question: string;
    type: 'mcq' | 'short';
    options?: string[];
    answer: string;
  }[];
  lastRevisedAt?: string;
  createdAt?: string;
}

export interface KnowledgeEntry {
  id: string;
  ownerId?: string;
  topic: string;
  unitCode: string;
  explanation: string;
  example?: string;
  whatILearned?: string;
  relatedDocs?: string[];
  relatedNotes?: string[];
  tags: string[];
  isFavorite?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type KnowledgeVaultItem = KnowledgeEntry;

export interface CalendarEvent {
  id: string;
  ownerId?: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  type: 'class' | 'assignment' | 'exam' | 'study' | 'personal';
  unitCode?: string;
  location?: string;
  notes?: string;
  createdAt?: string;
}

export interface AcademicNotification {
  id: string;
  ownerId: string;
  title: string;
  message: string;
  type:
    | 'class'
    | 'class_reminder'
    | 'assignment'
    | 'assignment_due'
    | 'overdue'
    | 'exam'
    | 'exam_alert'
    | 'document'
    | 'document_upload'
    | 'goal'
    | 'goal_reached'
    | 'system'
    | 'deadline';
  read: boolean;
  createdAt: string;
  linkRoute?: string;
  link?: string;
}
