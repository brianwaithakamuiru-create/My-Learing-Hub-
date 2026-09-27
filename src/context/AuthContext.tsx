import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

export const LOCAL_STORAGE_PROFILE_KEY = 'my_learning_hub_user_profile';

export interface RegisterUserData {
  fullName:string; username:string; email:string; password:string; country:string; academicYear:string; semester:string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileError: string | null;
  updateProfile:(data:Partial<UserProfile>)=>Promise<void>;
  updateUserPreferences:(prefs:Partial<NonNullable<UserProfile['preferences']>>)=>Promise<void>;
  refreshProfile:()=>Promise<void>;
  signIn:(email:string,pass:string,rememberMe?:boolean)=>Promise<UserProfile>;
  registerUser:(data:RegisterUserData)=>Promise<UserProfile>;
  resetPassword:(email:string)=>Promise<void>;
  resendVerification:()=>Promise<void>;
  logout:()=>Promise<void>;
}

const AuthContext=createContext<AuthContextType|undefined>(undefined);

export function mapSupabaseAuthError(error:any):string{
  const code=error?.code||'';
  const msg=error?.message||'';
  if(code==='invalid_credentials'||code==='user_not_found'||msg.toLowerCase().includes('invalid login credentials'))return'Incorrect email or password.';
  if(code==='email_address_invalid'||code==='invalid_email')return'Please enter a valid email address.';
  if(code==='user_already_exists'||msg.toLowerCase().includes('already registered'))return'An account with this email already exists. Please log in instead.';
  if(code==='weak_password')return'Please choose a stronger password (at least 8 characters).';
  if(msg.toLowerCase().includes('username already taken')||msg==='USERNAME_TAKEN')return'That username is already in use. Please choose another username.';
  if(msg.toLowerCase().includes('rate limit'))return'Too many attempts. Please wait and try again later.';
  return msg||'An unexpected error occurred. Please try again.';
}

function toProfile(row:any,user:User):UserProfile{
  const now=new Date().toISOString();
  return {
    uid:user.id,
    fullName:row?.full_name||user.user_metadata?.full_name||'Scholar',
    email:user.email||row?.email||'',
    username:row?.username||user.user_metadata?.username||user.email?.split('@')[0]||'scholar',
    normalizedUsername:row?.normalized_username||(row?.username||user.email?.split('@')[0]||'scholar').toLowerCase(),
    country:row?.country||user.user_metadata?.country||'Kenya',
    academicYear:row?.academic_year||user.user_metadata?.academic_year||'Year 3 (2026/2027)',
    currentSemester:row?.current_semester||row?.semester||user.user_metadata?.semester||'Trimester 2 - 2026',
    semester:row?.semester||user.user_metadata?.semester||'Trimester 2 - 2026',
    role:row?.role||'student',
    accountStatus:row?.account_status||'ACTIVE',
    emailVerified:!!user.email_confirmed_at,
    avatarUrl:row?.avatar_url||'',
    photoURL:row?.photo_url||'',
    createdAt:row?.created_at||user.created_at||now,
    updatedAt:row?.updated_at||now,
    lastLoginAt:row?.last_login_at||now,
    preferences:row?.preferences||{overlayStrength:60,backgroundBlur:0,clockAnimation:true,backgroundPosition:'center'},
  };
}

function cacheProfile(profile:UserProfile|null){
  try{
    if(profile)localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY,JSON.stringify(profile));
    else localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
  }catch{}
}

async function loadProfile(user:User):Promise<UserProfile>{
  const {data,error}=await supabase.from('profiles').select('*').eq('id',user.id).maybeSingle();
  if(error)throw error;
  const profile=toProfile(data,user);
  const lastLoginAt=new Date().toISOString();
  const {error:updateError}=await supabase.from('profiles').update({
    email:user.email||profile.email,
    email_verified:!!user.email_confirmed_at,
    last_login_at:lastLoginAt,
  }).eq('id',user.id);
  if(updateError)console.warn('Profile timestamp sync failed:',updateError.message);
  profile.lastLoginAt=lastLoginAt;
  return profile;
}

export const AuthProvider:React.FC<{children:React.ReactNode}>=({children})=>{
  const [currentUser,setCurrentUser]=useState<User|null>(null);
  const [userProfile,setUserProfile]=useState<UserProfile|null>(()=>{try{const saved=localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);return saved?JSON.parse(saved):null;}catch{return null;}});
  const [loading,setLoading]=useState(true);
  const [profileError,setProfileError]=useState<string|null>(null);

  useEffect(()=>{
    let mounted=true;
    const applySession=async(user:User|null)=>{
      if(!mounted)return;
      if(!user){setCurrentUser(null);setUserProfile(null);cacheProfile(null);setLoading(false);return;}
      setCurrentUser(user);
      try{
        const profile=await loadProfile(user);
        if(!mounted)return;
        setUserProfile(profile);cacheProfile(profile);setProfileError(null);
      }catch(error:any){
        if(mounted)setProfileError('Failed to load your profile from Supabase.');
        console.error('Profile load failed:',error);
      }finally{if(mounted)setLoading(false);}
    };
    supabase.auth.getSession().then(({data,error})=>{if(error)console.error(error);return applySession(data.session?.user||null);});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{void applySession(session?.user||null);});
    return()=>{mounted=false;subscription.unsubscribe();};
  },[]);

  const updateProfile=async(data:Partial<UserProfile>)=>{
    if(!currentUser||!userProfile)return;
    setProfileError(null);
    const updated={...userProfile,...data,updatedAt:new Date().toISOString()};
    setUserProfile(updated);cacheProfile(updated);
    const row:any={};
    if(data.fullName!==undefined)row.full_name=data.fullName;
    if(data.username!==undefined){row.username=data.username;row.normalized_username=data.username.toLowerCase();}
    if(data.country!==undefined)row.country=data.country;
    if(data.academicYear!==undefined)row.academic_year=data.academicYear;
    if(data.currentSemester!==undefined)row.current_semester=data.currentSemester;
    if(data.semester!==undefined)row.semester=data.semester;
    if(data.avatarUrl!==undefined)row.avatar_url=data.avatarUrl;
    if(data.photoURL!==undefined)row.photo_url=data.photoURL;
    row.updated_at=updated.updatedAt;
    const {error}=await supabase.from('profiles').update(row).eq('id',currentUser.id);
    if(error){setProfileError('Could not sync profile with Supabase.');throw error;}
  };

  const updateUserPreferences=async(prefs:Partial<NonNullable<UserProfile['preferences']>>)=>{
    if(!currentUser||!userProfile)return;
    const updated={...userProfile,preferences:{...userProfile.preferences,...prefs},updatedAt:new Date().toISOString()};
    setUserProfile(updated);cacheProfile(updated);
    const {error}=await supabase.from('profiles').update({preferences:updated.preferences,updated_at:updated.updatedAt}).eq('id',currentUser.id);
    if(error)console.error('Preference sync failed:',error);
  };

  const refreshProfile=async()=>{
    if(!currentUser)return;
    const profile=await loadProfile(currentUser);
    setUserProfile(profile);cacheProfile(profile);
  };

  const signIn=async(email:string,pass:string,_rememberMe=true):Promise<UserProfile>=>{
    const cleanEmail=email.trim().toLowerCase();
    const {data,error}=await supabase.auth.signInWithPassword({email:cleanEmail,password:pass});
    if(error)throw error;
    if(!data.user)throw new Error('Login did not return a user session.');
    const profile=await loadProfile(data.user);
    setCurrentUser(data.user);setUserProfile(profile);cacheProfile(profile);
    return profile;
  };

  const registerUser=async(data:RegisterUserData):Promise<UserProfile>=>{
    const cleanEmail=data.email.trim().toLowerCase();
    const cleanUsername=data.username.trim();
    const normalizedUsername=cleanUsername.toLowerCase();
    const {data:existing,error:usernameError}=await supabase.from('profiles').select('id').eq('normalized_username',normalizedUsername).maybeSingle();
    if(usernameError)throw usernameError;
    if(existing)throw new Error('Username already taken. Please choose another username.');
    const {data:authData,error}=await supabase.auth.signUp({
      email:cleanEmail,password:data.password,
      options:{data:{full_name:data.fullName.trim(),username:cleanUsername,country:data.country.trim(),academic_year:data.academicYear.trim(),semester:data.semester.trim()},emailRedirectTo:window.location.origin},
    });
    if(error)throw error;
    if(!authData.user)throw new Error('Account creation did not return a user.');
    const profile:UserProfile={
      uid:authData.user.id,fullName:data.fullName.trim(),username:cleanUsername,normalizedUsername,
      email:cleanEmail,country:data.country.trim(),academicYear:data.academicYear.trim(),currentSemester:data.semester.trim(),semester:data.semester.trim(),
      role:'student',accountStatus:'ACTIVE',emailVerified:!!authData.user.email_confirmed_at,avatarUrl:'',photoURL:'',
      createdAt:authData.user.created_at||new Date().toISOString(),updatedAt:new Date().toISOString(),lastLoginAt:new Date().toISOString(),
      preferences:{overlayStrength:60,backgroundBlur:0,clockAnimation:true,backgroundPosition:'center'},
    };
    if(authData.session){
      const {error:profileError}=await supabase.from('profiles').upsert({
        id:profile.uid,full_name:profile.fullName,username:profile.username,normalized_username:profile.normalizedUsername,email:profile.email,
        country:profile.country,academic_year:profile.academicYear,current_semester:profile.currentSemester,semester:profile.semester,
        role:'student',account_status:'ACTIVE',email_verified:profile.emailVerified,preferences:profile.preferences,
      },{onConflict:'id'});
      if(profileError)throw profileError;
      setCurrentUser(authData.user);setUserProfile(profile);cacheProfile(profile);
    }else{
      cacheProfile(profile);
    }
    return profile;
  };

  const resetPassword=async(email:string)=>{
    const {error}=await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(),{redirectTo:window.location.origin+'/#/reset-password'});
    if(error)throw error;
  };

  const resendVerification=async()=>{
    if(!currentUser?.email)throw new Error('No signed-in email is available.');
    const {error}=await supabase.auth.resend({type:'signup',email:currentUser.email,options:{emailRedirectTo:window.location.origin}});
    if(error)throw error;
  };

  const logout=async()=>{
    const {error}=await supabase.auth.signOut();
    if(error)throw error;
    setCurrentUser(null);setUserProfile(null);cacheProfile(null);
  };

  return <AuthContext.Provider value={{currentUser,userProfile,loading,profileError,updateProfile,updateUserPreferences,refreshProfile,signIn,registerUser,resetPassword,resendVerification,logout}}>{children}</AuthContext.Provider>;
};

export const useAuth=():AuthContextType=>{
  const context=useContext(AuthContext);
  if(!context)throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
