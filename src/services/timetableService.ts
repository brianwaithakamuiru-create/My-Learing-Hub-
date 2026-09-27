import {readCollection,writeCollection,makeId} from '../lib/localStore';
import { TimetableEvent, TimetableDay } from '../types';

export const DAY_ORDER: TimetableDay[] = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export function parseTimeToMinutes(timeStr:string):number {
  if(!timeStr)return 0;
  const parts=timeStr.trim().split(':');
  return (parseInt(parts[0],10)||0)*60+(parseInt(parts[1],10)||0);
}
export function formatMinutesToTime(minutes:number):string {
  const h=Math.floor(minutes/60)%24,m=minutes%60;
  return h.toString().padStart(2,'0')+':'+m.toString().padStart(2,'0');
}

export async function fetchUserTimetable(uid:string):Promise<TimetableEvent[]> {const list=readCollection<any>('timetable').filter(x=>x.ownerId===uid) as TimetableEvent[];list.sort((a,b)=>DAY_ORDER.indexOf(a.day)-DAY_ORDER.indexOf(b.day)||parseTimeToMinutes(a.startTime)-parseTimeToMinutes(b.startTime));return list;}\n\nexport async function createTimetableClass(uid:string,eventData:Omit<TimetableEvent,'eventId'|'ownerId'|'createdAt'|'updatedAt'>):Promise<string>{const now=new Date().toISOString();const id=makeId();const items=readCollection<any>('timetable');items.push({...eventData,eventId:id,ownerId:uid,createdAt:now,updatedAt:now});writeCollection('timetable',items);return id;}\n\nexport async function updateTimetableClass(uid:string,eventId:string,eventData:Partial<TimetableEvent>):Promise<void>{const items=readCollection<any>('timetable');const i=items.findIndex(x=>x.eventId===eventId&&x.ownerId===uid);if(i<0)return;const {_eId,_oId,eventId:_eventId,ownerId:_ownerId,...rest}=eventData as any;items[i]={...items[i],...rest,updatedAt:new Date().toISOString()};writeCollection('timetable',items);}\n\nexport async function deleteTimetableClass(uid:string,eventId:string):Promise<void>{writeCollection('timetable',readCollection<any>('timetable').filter(x=>!(x.eventId===eventId&&x.ownerId===uid)));}\n
export function detectTimetableConflicts(existingClasses:TimetableEvent[],target:{day:TimetableDay;startTime:string;endTime:string},excludeEventId?:string):TimetableEvent[]{
  const targetStart=parseTimeToMinutes(target.startTime),targetEnd=parseTimeToMinutes(target.endTime);
  if(targetEnd<=targetStart)return[];
  return existingClasses.filter(c=>{
    if(excludeEventId&&c.eventId===excludeEventId)return false;
    if(c.day!==target.day)return false;
    return targetStart<parseTimeToMinutes(c.endTime)&&targetEnd>parseTimeToMinutes(c.startTime);
  });
}

export function getKenyaCurrentDayAndTime():{day:TimetableDay;currentTimeStr:string;minutesNow:number}{
  try{
    const formatter=new Intl.DateTimeFormat('en-US',{timeZone:'Africa/Nairobi',weekday:'long',hour:'2-digit',minute:'2-digit',hour12:false});
    const parts=formatter.formatToParts(new Date());
    let weekdayStr='',hourStr='00',minuteStr='00';
    for(const part of parts){if(part.type==='weekday')weekdayStr=part.value;if(part.type==='hour')hourStr=part.value;if(part.type==='minute')minuteStr=part.value;}
    const day=DAY_ORDER.find(d=>d.toLowerCase()===weekdayStr.toLowerCase())||'Monday';
    const currentTimeStr=hourStr+':'+minuteStr;
    return {day,currentTimeStr,minutesNow:parseTimeToMinutes(currentTimeStr)};
  }catch{
    const now=new Date();
    const dayNames:TimetableDay[]=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const day=dayNames[now.getDay()],h=now.getHours().toString().padStart(2,'0'),m=now.getMinutes().toString().padStart(2,'0');
    return {day,currentTimeStr:h+':'+m,minutesNow:now.getHours()*60+now.getMinutes()};
  }
}

export function getNextClassCalculation(classes:TimetableEvent[]):{
  activeClass:TimetableEvent|null;nextClass:TimetableEvent|null;todaysClasses:TimetableEvent[];
  statusBadge:'IN_SESSION'|'UPCOMING_TODAY'|'COMPLETED_TODAY'|'EMPTY'|'FUTURE_DAY';statusMessage:string;timeRemainingText:string;
}{
  if(classes.length===0)return{activeClass:null,nextClass:null,todaysClasses:[],statusBadge:'EMPTY',statusMessage:'No classes scheduled on your timetable.',timeRemainingText:'Add your classes to see schedule'};
  const {day:currentDay,minutesNow}=getKenyaCurrentDayAndTime();
  const todaysClasses=classes.filter(c=>c.day===currentDay);
  const activeClass=todaysClasses.find(c=>minutesNow>=parseTimeToMinutes(c.startTime)&&minutesNow<parseTimeToMinutes(c.endTime))||null;
  if(activeClass){
    const diff=Math.max(0,parseTimeToMinutes(activeClass.endTime)-minutesNow),hours=Math.floor(diff/60),mins=diff%60;
    return{activeClass,nextClass:null,todaysClasses,statusBadge:'IN_SESSION',statusMessage:'Class in session right now at '+activeClass.building+', '+activeClass.roomNumber,timeRemainingText:'Ends in '+(hours>0?hours+'h '+mins+'m':mins+' min')};
  }
  const upcomingToday=todaysClasses.filter(c=>parseTimeToMinutes(c.startTime)>minutesNow);
  if(upcomingToday.length>0){
    const nextClass=upcomingToday[0],diff=Math.max(0,parseTimeToMinutes(nextClass.startTime)-minutesNow),hours=Math.floor(diff/60),mins=diff%60;
    return{activeClass:null,nextClass,todaysClasses,statusBadge:'UPCOMING_TODAY',statusMessage:'Next class starts at '+nextClass.startTime+' ('+nextClass.roomNumber+')',timeRemainingText:'Starts in '+(hours>0?hours+'h '+mins+'m':mins+' min')};
  }
  const currentDayIndex=DAY_ORDER.indexOf(currentDay);
  let nextScheduled:TimetableEvent|null=null;
  for(let i=1;i<=7;i++){const checkDay=DAY_ORDER[(currentDayIndex+i)%7];const found=classes.filter(c=>c.day===checkDay);if(found.length){nextScheduled=found[0];break;}}
  if(todaysClasses.length>0)return{activeClass:null,nextClass:nextScheduled,todaysClasses,statusBadge:'COMPLETED_TODAY',statusMessage:'All scheduled classes for today are complete.',timeRemainingText:nextScheduled?'Next: '+nextScheduled.unitCode+' on '+nextScheduled.day+' at '+nextScheduled.startTime:'Rest of the week is clear'};
  return{activeClass:null,nextClass:nextScheduled,todaysClasses:[],statusBadge:'FUTURE_DAY',statusMessage:'No classes scheduled today ('+currentDay+').',timeRemainingText:nextScheduled?'Next: '+nextScheduled.unitCode+' on '+nextScheduled.day+' at '+nextScheduled.startTime:'Weekly schedule is clear'};
}

export function generateTimetableICS(classes:TimetableEvent[],userName='Student'):string{
  const dayToIcsFreq:Record<TimetableDay,string>={Monday:'MO',Tuesday:'TU',Wednesday:'WE',Thursday:'TH',Friday:'FR',Saturday:'SA',Sunday:'SU'};
  const baseDayOffsets:Record<TimetableDay,number>={Monday:21,Tuesday:22,Wednesday:23,Thursday:24,Friday:25,Saturday:26,Sunday:27};
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//My Learning Hub//KEMU Personal Academic Timetable//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:'+userName+"'s KEMU Timetable",'X-WR-TIMEZONE:Africa/Nairobi'];
  classes.forEach(c=>{
    const dayOffset=baseDayOffsets[c.day]||21,startParts=c.startTime.split(':'),endParts=c.endTime.split(':');
    const startH=(startParts[0]||'08').padStart(2,'0'),startM=(startParts[1]||'00').padStart(2,'0'),endH=(endParts[0]||'10').padStart(2,'0'),endM=(endParts[1]||'00').padStart(2,'0');
    const dtStart='202609'+dayOffset.toString().padStart(2,'0')+'T'+startH+startM+'00',dtEnd='202609'+dayOffset.toString().padStart(2,'0')+'T'+endH+endM+'00';
    const summary=c.unitCode+' - '+c.unitName,location=c.building+', '+c.roomNumber+(c.location?' ('+c.location+')':''),description='Lecturer: '+(c.lecturerName||'TBA')+'\\nType: '+(c.classType||'Lecture')+'\\nNotes: '+(c.notes||'None');
    lines.push('BEGIN:VEVENT','UID:'+(c.eventId||Math.random().toString(36).substring(2))+'@mylearninghub.kemu','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').split('.')[0]+'Z','DTSTART;TZID=Africa/Nairobi:'+dtStart,'DTEND;TZID=Africa/Nairobi:'+dtEnd,'RRULE:FREQ=WEEKLY;BYDAY='+dayToIcsFreq[c.day],'SUMMARY:'+summary,'LOCATION:'+location,'DESCRIPTION:'+description,'STATUS:CONFIRMED','END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\\r\\n');
}
