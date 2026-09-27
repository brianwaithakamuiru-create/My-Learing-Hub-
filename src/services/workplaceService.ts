import { supabase } from '../lib/supabase';
import { AcademicClass, Assignment, AcademicNote, AcademicGoal, FocusSession, AcademicExam, RevisionTopic, KnowledgeEntry, CalendarEvent, AcademicNotification, AcademicDocument } from '../types';

type RecordKind = 'document' | 'class' | 'assignment' | 'note' | 'goal' | 'focus_session' | 'exam' | 'knowledge' | 'revision' | 'calendar' | 'notification';
type AcademicRecord = { id:string; owner_id:string; kind:RecordKind; data:Record<string,any>; created_at:string; updated_at:string };

async function listRecords<T>(uid:string, kind:RecordKind):Promise<Array<T & {id:string;ownerId:string}>> {
  const {data,error}=await supabase.from('academic_records').select('id, owner_id, kind, data, created_at, updated_at').eq('owner_id',uid).eq('kind',kind);
  if(error) throw error;
  return ((data||[]) as AcademicRecord[]).map(row=>({...row.data,id:row.id,ownerId:row.owner_id,createdAt:row.data?.createdAt||row.created_at,updatedAt:row.data?.updatedAt||row.updated_at})) as Array<T & {id:string;ownerId:string}>;
}
async function createRecord(uid:string,kind:RecordKind,payload:Record<string,any>):Promise<string>{
  const now=new Date().toISOString();
  const data={...payload,ownerId:uid,createdAt:payload.createdAt||now,updatedAt:payload.updatedAt||now};
  const {data:row,error}=await supabase.from('academic_records').insert({owner_id:uid,kind,data,created_at:data.createdAt,updated_at:data.updatedAt}).select('id').single();
  if(error) throw error; return row.id;
}
async function updateRecord(id:string,payload:Record<string,any>):Promise<void>{
  const {data:existing,error:readError}=await supabase.from('academic_records').select('data').eq('id',id).single();
  if(readError) throw readError;
  const now=new Date().toISOString();
  const nextData={...((existing?.data||{}) as Record<string,any>),...payload,updatedAt:now};
  const {error}=await supabase.from('academic_records').update({data:nextData,updated_at:now}).eq('id',id);
  if(error) throw error;
}
async function deleteRecord(id:string):Promise<void>{const {error}=await supabase.from('academic_records').delete().eq('id',id);if(error)throw error;}

export async function fetchUserDocuments(uid:string):Promise<AcademicDocument[]>{try{const list=await listRecords<AcademicDocument>(uid,'document');return list.sort((a,b)=>new Date(b.createdAt||0).getTime()-new Date(a.createdAt||0).getTime());}catch(e){console.error(e);return[];}}
export async function fetchUserClasses(uid:string):Promise<AcademicClass[]>{try{return await listRecords<AcademicClass>(uid,'class');}catch(e){console.error(e);return[];}}
export async function createUserClass(uid:string,classData:Omit<AcademicClass,'id'>):Promise<string>{return createRecord(uid,'class',classData as Record<string,any>);}
export async function deleteUserClass(classId:string):Promise<void>{return deleteRecord(classId);}

export async function fetchUserAssignments(uid:string):Promise<Assignment[]>{try{const list=await listRecords<Assignment>(uid,'assignment');return list.sort((a,b)=>new Date(a.dueDate||0).getTime()-new Date(b.dueDate||0).getTime());}catch(e){console.error(e);return[];}}
export async function createUserAssignment(uid:string,data:Omit<Assignment,'id'>):Promise<string>{return createRecord(uid,'assignment',data as Record<string,any>);}
export async function updateUserAssignmentStatus(assignmentId:string,status:'Pending'|'In Progress'|'Submitted'):Promise<void>{return updateRecord(assignmentId,{status});}
export async function deleteUserAssignment(assignmentId:string):Promise<void>{return deleteRecord(assignmentId);}

export async function fetchUserNotes(uid:string):Promise<AcademicNote[]>{try{const list=await listRecords<AcademicNote>(uid,'note');return list.sort((a,b)=>new Date(b.date||b.createdAt||0).getTime()-new Date(a.date||a.createdAt||0).getTime());}catch(e){console.error(e);return[];}}
export async function createUserNote(uid:string,data:Omit<AcademicNote,'id'>):Promise<string>{return createRecord(uid,'note',data as Record<string,any>);}
export async function deleteUserNote(noteId:string):Promise<void>{return deleteRecord(noteId);}

export async function fetchUserGoals(uid:string):Promise<AcademicGoal[]>{try{return await listRecords<AcademicGoal>(uid,'goal');}catch(e){console.error(e);return[];}}
export async function createUserGoal(uid:string,data:Omit<AcademicGoal,'id'|'createdAt'|'ownerId'>):Promise<string>{return createRecord(uid,'goal',data as Record<string,any>);}
export async function updateGoalProgress(goalId:string,progress:number,completed:boolean):Promise<void>{return updateRecord(goalId,{progress:Math.min(100,Math.max(0,progress)),completed});}
export async function deleteUserGoal(goalId:string):Promise<void>{return deleteRecord(goalId);}

export async function fetchUserFocusSessions(uid:string):Promise<FocusSession[]>{try{const list=await listRecords<FocusSession>(uid,'focus_session');return list.sort((a,b)=>new Date(b.completedAt).getTime()-new Date(a.completedAt).getTime());}catch(e){console.error(e);return[];}}
export async function logFocusSession(uid:string,data:Omit<FocusSession,'id'|'ownerId'>):Promise<string>{return createRecord(uid,'focus_session',data as Record<string,any>);}

export async function fetchUserExams(uid:string):Promise<AcademicExam[]>{try{const list=await listRecords<AcademicExam>(uid,'exam');return list.sort((a,b)=>new Date((a.examDate||'')+'T'+(a.time||'00:00')).getTime()-new Date((b.examDate||'')+'T'+(b.time||'00:00')).getTime());}catch(e){console.error(e);return[];}}
export async function createUserExam(uid:string,data:Omit<AcademicExam,'id'|'ownerId'>):Promise<string>{return createRecord(uid,'exam',data as Record<string,any>);}
export async function updateUserExam(_uid:string,examId:string,data:Partial<AcademicExam>):Promise<void>{return updateRecord(examId,data as Record<string,any>);}
export async function deleteUserExam(_uid:string,examId:string):Promise<void>{return deleteRecord(examId);}

export async function fetchUserKnowledgeEntries(uid:string):Promise<KnowledgeEntry[]>{try{const list=await listRecords<KnowledgeEntry>(uid,'knowledge');return list.sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());}catch(e){console.error(e);return[];}}
export async function createKnowledgeEntry(uid:string,data:Omit<KnowledgeEntry,'id'|'ownerId'|'createdAt'>):Promise<string>{return createRecord(uid,'knowledge',data as Record<string,any>);}
export async function updateKnowledgeEntry(_uid:string,entryId:string,data:Partial<KnowledgeEntry>):Promise<void>{return updateRecord(entryId,data as Record<string,any>);}
export async function deleteKnowledgeEntry(_uid:string,entryId:string):Promise<void>{return deleteRecord(entryId);}

export async function fetchUserRevisionTopics(uid:string):Promise<RevisionTopic[]>{try{return await listRecords<RevisionTopic>(uid,'revision');}catch(e){console.error(e);return[];}}
export async function createRevisionTopic(uid:string,data:Omit<RevisionTopic,'id'|'ownerId'>):Promise<string>{return createRecord(uid,'revision',data as Record<string,any>);}
export async function updateRevisionTopic(_uid:string,topicId:string,data:Partial<RevisionTopic>):Promise<void>{return updateRecord(topicId,{...(data as Record<string,any>),lastRevisedAt:new Date().toISOString()});}
export async function deleteRevisionTopic(_uid:string,topicId:string):Promise<void>{return deleteRecord(topicId);}

export async function fetchUserCalendarEvents(uid:string):Promise<CalendarEvent[]>{try{const list=await listRecords<CalendarEvent>(uid,'calendar');return list.sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime());}catch(e){console.error(e);return[];}}
export async function createCalendarEvent(uid:string,data:Omit<CalendarEvent,'id'|'ownerId'>):Promise<string>{return createRecord(uid,'calendar',data as Record<string,any>);}
export async function deleteCalendarEvent(_uid:string,eventId:string):Promise<void>{return deleteRecord(eventId);}

export async function fetchUserNotifications(uid:string):Promise<AcademicNotification[]>{try{const list=await listRecords<AcademicNotification>(uid,'notification');return list.sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());}catch(e){console.error(e);return[];}}
export async function createNotification(uid:string,data:Omit<AcademicNotification,'id'|'ownerId'|'createdAt'>):Promise<string>{return createRecord(uid,'notification',data as Record<string,any>);}
export async function markNotificationAsRead(_uid:string,notifId:string):Promise<void>{return updateRecord(notifId,{read:true});}
export async function markAllNotificationsAsRead(uid:string,notifications?:AcademicNotification[]):Promise<void>{const list=notifications||(await fetchUserNotifications(uid));await Promise.all(list.filter(n=>!n.read).map(n=>updateRecord(n.id,{read:true})));}
export async function deleteNotification(_uid:string,notifId:string):Promise<void>{return deleteRecord(notifId);}

export async function uploadAcademicDocument(uid:string,file:File,metadata:Omit<AcademicDocument,'documentId'|'ownerId'|'storagePath'|'downloadUrl'|'createdAt'|'updatedAt'>):Promise<string>{
  const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
  const storagePath=uid+'/'+crypto.randomUUID()+'-'+safeName;
  const {error:uploadError}=await supabase.storage.from('academic-documents').upload(storagePath,file,{upsert:false,contentType:file.type||undefined});
  if(uploadError)throw uploadError;
  const {data:publicUrl}=supabase.storage.from('academic-documents').getPublicUrl(storagePath);
  return createRecord(uid,'document',{...metadata,storagePath,downloadUrl:publicUrl.publicUrl,originalFileName:file.name,fileType:file.name.split('.').pop()?.toLowerCase()||'',mimeType:file.type||'application/octet-stream',fileSize:file.size});
}

export const createAcademicExam=createUserExam;
export const updateAcademicExam=updateUserExam;
export const deleteAcademicExam=deleteUserExam;
export const fetchUserKnowledgeItems=fetchUserKnowledgeEntries;
export const createKnowledgeItem=createKnowledgeEntry;
export const updateKnowledgeItem=updateKnowledgeEntry;
export const deleteKnowledgeItem=deleteKnowledgeEntry;
export const createAcademicNotification=createNotification;
export const deleteAcademicNotification=deleteNotification;
