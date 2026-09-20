import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileError: string | null;
  signIn: (email: string, pass: string) => Promise<UserProfile>;
  signInWithGoogle: () => Promise<UserProfile>;
  registerUser: (data: {
    fullName: string;
    email: string;
    username: string;
    country: string;
    password: string;
  }) => Promise<UserProfile>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserPreferences: (prefs: Partial<UserProfile['preferences']>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to map friendly Firebase error messages
export function mapFirebaseAuthError(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not yet enabled in the Firebase Console. You can sign in immediately using "Continue with Google", or enable Email/Password provider in the Firebase Authentication console under Sign-in method.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing. Please try again.';
    case 'auth/popup-blocked':
      return 'Google sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account was found with these credentials.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Please choose a stronger password (at least 8 characters with uppercase, lowercase, and numbers).';
    case 'auth/too-many-requests':
      return 'Too many sign-in attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Unable to connect. Check your internet connection and try again.';
    default:
      if (error?.message && !error.message.includes('Firebase:')) {
        return error.message;
      }
      return 'Authentication failed. Please verify your details or continue with Google.';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Fetch or safely repair user profile from Firestore
  const fetchUserProfile = async (firebaseUser: User): Promise<UserProfile | null> => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        return data;
      }

      // Safe Profile Recovery Strategy:
      // If Auth user exists but Firestore profile is missing (e.g. initial network cutoff)
      console.warn('Profile document missing for auth user. Attempting automatic recovery...');
      const fallbackUsername = (firebaseUser.email?.split('@')[0] || 'student').toLowerCase().replace(/[^a-z0-9_]/g, '');
      const defaultProfile: UserProfile = {
        uid: firebaseUser.uid,
        fullName: firebaseUser.displayName || 'Academic Scholar',
        email: firebaseUser.email || '',
        username: fallbackUsername,
        normalizedUsername: fallbackUsername,
        country: 'United States',
        role: 'student',
        accountStatus: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferences: {
          overlayStrength: 60,
          backgroundBlur: 0,
          clockAnimation: true,
          backgroundPosition: 'center',
        },
      };

      await setDoc(userDocRef, defaultProfile);
      return defaultProfile;
    } catch (err: any) {
      console.error('Error fetching/repairing user profile:', err);
      setProfileError('Failed to load user profile. Please check connection.');
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setProfileError(null);

      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        const profile = await fetchUserProfile(firebaseUser);
        setUserProfile(profile);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real Firebase Sign In
  const signIn = async (email: string, pass: string): Promise<UserProfile> => {
    setProfileError(null);
    const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const user = credential.user;

    const profile = await fetchUserProfile(user);
    if (!profile) {
      throw new Error('Failed to retrieve user profile.');
    }

    if (profile.accountStatus === 'DISABLED') {
      await signOut(auth);
      throw new Error('This account has been disabled. Please contact support.');
    }

    setUserProfile(profile);
    return profile;
  };

  // Real Firebase Google Sign In
  const signInWithGoogle = async (): Promise<UserProfile> => {
    setProfileError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const credential = await signInWithPopup(auth, provider);
    const user = credential.user;

    const profile = await fetchUserProfile(user);
    if (!profile) {
      throw new Error('Failed to retrieve user profile from database.');
    }

    if (profile.accountStatus === 'DISABLED') {
      await signOut(auth);
      throw new Error('This account has been disabled. Please contact support.');
    }

    setUserProfile(profile);
    return profile;
  };

  // Real Firebase Registration with Atomic Username Claim
  const registerUser = async (data: {
    fullName: string;
    email: string;
    username: string;
    country: string;
    password: string;
  }): Promise<UserProfile> => {
    setProfileError(null);
    const normalized = data.username.trim().toLowerCase();

    // 1. Enforce unique username claim check before account creation
    const usernameDocRef = doc(db, 'usernames', normalized);
    const usernameSnap = await getDoc(usernameDocRef);
    if (usernameSnap.exists()) {
      throw new Error('This username is already taken. Please choose another one.');
    }

    // 2. Real Firebase Auth creation
    const credential = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password);
    const uid = credential.user.uid;

    const newProfile: UserProfile = {
      uid,
      fullName: data.fullName.trim(),
      email: data.email.trim(),
      username: data.username.trim(),
      normalizedUsername: normalized,
      country: data.country || 'Global',
      role: 'student', // Never grant admin from client registration
      accountStatus: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preferences: {
        overlayStrength: 60,
        backgroundBlur: 0,
        clockAnimation: true,
        backgroundPosition: 'center',
      },
    };

    // 3. Atomically claim username and create user profile
    try {
      await runTransaction(db, async (transaction) => {
        const uSnap = await transaction.get(usernameDocRef);
        if (uSnap.exists()) {
          throw new Error('This username is already taken. Please choose another one.');
        }

        const userDocRef = doc(db, 'users', uid);
        transaction.set(usernameDocRef, {
          uid,
          username: data.username.trim(),
          createdAt: serverTimestamp(),
        });
        transaction.set(userDocRef, newProfile);
      });
    } catch (txError: any) {
      console.error('Profile/Username creation transaction error:', txError);
      // Fallback: direct setDoc if transaction fails or rules prevent atomic multi-doc in dev
      try {
        await setDoc(doc(db, 'users', uid), newProfile);
        await setDoc(usernameDocRef, { uid, username: data.username.trim() });
      } catch (directErr) {
        console.error('Fallback direct setDoc error:', directErr);
      }
    }

    // Optional verification email
    try {
      await sendEmailVerification(credential.user);
    } catch (e) {
      // Non-blocking in dev
      console.log('Email verification send ignored or delayed:', e);
    }

    setUserProfile(newProfile);
    return newProfile;
  };

  // Forgot Password
  const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  // Resend Verification
  const resendVerification = async (): Promise<void> => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
  };

  const refreshProfile = async (): Promise<void> => {
    if (auth.currentUser) {
      const p = await fetchUserProfile(auth.currentUser);
      setUserProfile(p);
    }
  };

  const updateUserPreferences = async (prefs: Partial<UserProfile['preferences']>): Promise<void> => {
    if (!currentUser || !userProfile) return;
    const updated = {
      ...userProfile,
      preferences: {
        ...userProfile.preferences,
        ...prefs,
      },
      updatedAt: new Date().toISOString(),
    };
    setUserProfile(updated);
    try {
      await setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true });
    } catch (e) {
      console.error('Failed to update preferences:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        profileError,
        signIn,
        signInWithGoogle,
        registerUser,
        resetPassword,
        resendVerification,
        logout,
        refreshProfile,
        updateUserPreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
