import React,{createContext,useContext,useState} from 'react';
import {UserProfile} from '../types';
import {makeId} from '../lib/localStore';

export const LOCAL_STORAGE_PROFILE_KEY='my_learning_hub_user_profile';
export interface RegisterUserData{fullName:string;username:string;email:string;password:string;country:string;academicYear:string;semester:string;}
type LocalUser={id:string;email:string};
interface AuthContextType{currentUser:LocalUser|null;userProfile:UserProfile|null;loading:boolean;profileError:string|null;updateProfile:(data:Partial<UserProfile>)=>Promise<void>;updateUserPreferences:(prefs:Partial<NonNullable<UserProfile['preferences']>>)=>Promise<void>;refreshProfile:()=>Promise<void>;signIn:(email:string,pass:string,rememberMe?:boolean)=>Promise<UserProfile>;registerUser:(data:RegisterUserData)=>Promise<UserProfile>;resetPassword:(email:string)=>Promise<void>;resendVerification:()=>Promise<void>;logout:()=>Promise<void>;}
const AuthContext=createContext<AuthContextType|undefined>(undefined);
const profileKey=LOCAL_STORAGE_PROFILE_KEY;
function defaultProfile():UserProfile{const now=new Date().toISOString();return{uid:'local-student',fullName:'Scholar',email:'',username:'scholar',normalizedUsername:'scholar',country:'Kenya',academicYear:'Year 3 (2026/2027)',currentSemester:'Trimester 2 - 2026',semester:'Trimester 2 - 2026',role:'student',accountStatus:'ACTIVE',emailVerified:true,avatarUrl:'',photoURL:'',createdAt:now,updatedAt:now,lastLoginAt:now,preferences:{overlayStrength:60,backgroundBlur:0,clockAnimation:true,backgroundPosition:'center'}};}
function loadCached():UserProfile{try{const raw=localStorage.getItem(profileKey);if(raw)return JSON.parse(raw);}catch{}const p=defaultProfile();try{localStorage.setItem(profileKey,JSON.stringify(p));}catch{}return p;}
export function mapSupabaseAuthError(error:any){return error?.message||'An unexpected error occurred. Please try again.';}
export const AuthProvider:React.FC<{children:React.ReactNode}>=({children})=>{const [userProfile,setUserProfile]=useState<UserProfile>(()=>loadCached());const [currentUser]=useState<LocalUser>({id:'local-student',email:userProfile.email});const [profileError,setProfileError]=useState<string|null>(null);
 const save=(p:UserProfile)=>{setUserProfile(p);try{localStorage.setItem(profileKey,JSON.stringify(p));}catch{}};
 const updateProfile=async(data:Partial<UserProfile>)=>{setProfileError(null);save({...userProfile,...data,updatedAt:new Date().toISOString()});};
 const updateUserPreferences=async(prefs:Partial<NonNullable<UserProfile['preferences']>>)=>save({...userProfile,preferences:{...userProfile.preferences,...prefs},updatedAt:new Date().toISOString()});
 const refreshProfile=async()=>{};
 const signIn=async(email:string,_pass:string,_rememberMe=true)=>{const p={...userProfile,email:email.trim().toLowerCase(),lastLoginAt:new Date().toISOString(),updatedAt:new Date().toISOString()};save(p);return p;};
 const registerUser=async(data:RegisterUserData)=>{const p:UserProfile={...userProfile,uid:makeId(),fullName:data.fullName.trim()||'Scholar',username:data.username.trim()||'scholar',normalizedUsername:(data.username.trim()||'scholar').toLowerCase(),email:data.email.trim().toLowerCase(),country:data.country.trim()||'Kenya',academicYear:data.academicYear.trim()||userProfile.academicYear,currentSemester:data.semester.trim()||userProfile.currentSemester,semester:data.semester.trim()||userProfile.semester,emailVerified:true,updatedAt:new Date().toISOString(),lastLoginAt:new Date().toISOString()};save(p);return p;};
 const resetPassword=async(_email:string)=>{};const resendVerification=async()=>{};const logout=async()=>{};
 return <AuthContext.Provider value={{currentUser,userProfile,loading:false,profileError,updateProfile,updateUserPreferences,refreshProfile,signIn,registerUser,resetPassword,resendVerification,logout}}>{children}</AuthContext.Provider>;};
export const useAuth=()=>{const context=useContext(AuthContext);if(!context)throw new Error('useAuth must be used within an AuthProvider');return context;};
