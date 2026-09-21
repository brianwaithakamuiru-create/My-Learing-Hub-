import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

export const LOCAL_STORAGE_PROFILE_KEY = 'kemu_my_learning_hub_user_profile';

export interface RegisterUserData {
  fullName: string;
  username: string;
  email: string;
  password: string;
  country: string;
  academicYear: string;
  semester: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileError: string | null;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateUserPreferences: (prefs: Partial<UserProfile['preferences']>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, pass: string, rememberMe?: boolean) => Promise<UserProfile>;
  registerUser: (data: RegisterUserData) => Promise<UserProfile>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function mapFirebaseAuthError(error: any): string {
  const code = error?.code || '';
  const msg = error?.message || '';

  if (
    code === 'auth/wrong-password' ||
    code === 'auth/invalid-credential' ||
    code === 'auth/user-not-found'
  ) {
    return 'Incorrect email or password.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Please log in instead.';
  }
  if (code === 'auth/weak-password') {
    return 'Please choose a stronger password (at least 8 characters, letters & numbers).';
  }
  if (code === 'auth/network-request-failed' || msg.includes('network-request-failed')) {
    return "We couldn't connect to the server. Please check your internet connection and try again.";
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Please wait and try again later.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Email/Password sign-in is not enabled in Firebase Authentication. Please enable Email/Password provider in your Firebase Console.';
  }
  if (msg.includes('Username already taken') || msg === 'USERNAME_TAKEN') {
    return 'That username is already in use. Please choose another username.';
  }
  return error?.message || 'An unexpected error occurred. Please try again.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {}
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Monitor Firebase Authentication state
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);

          if (snap.exists() && isMounted) {
            const cloudProfile = snap.data() as UserProfile;
            // Update last login timestamp
            const updatedProfile: UserProfile = {
              ...cloudProfile,
              uid: user.uid,
              email: user.email || cloudProfile.email,
              emailVerified: user.emailVerified,
              lastLoginAt: new Date().toISOString(),
            };
            setUserProfile(updatedProfile);
            try {
              localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));
            } catch (_) {}

            // Persist lastLoginAt update to firestore
            setDoc(userDocRef, { lastLoginAt: updatedProfile.lastLoginAt }, { merge: true }).catch(() => {});
          } else if (isMounted) {
            // First time login or fallback profile construction
            const fallbackProfile: UserProfile = {
              uid: user.uid,
              fullName: user.displayName || 'Scholar',
              email: user.email || '',
              username: user.email?.split('@')[0] || `scholar_${user.uid.slice(0, 6)}`,
              normalizedUsername: (user.email?.split('@')[0] || `scholar_${user.uid.slice(0, 6)}`).toLowerCase(),
              country: 'Kenya',
              academicYear: 'Year 3 (2026/2027)',
              currentSemester: 'Trimester 2 - 2026',
              semester: 'Trimester 2 - 2026',
              role: 'student',
              accountStatus: 'ACTIVE',
              emailVerified: user.emailVerified,
              avatarUrl: user.photoURL || '',
              photoURL: user.photoURL || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              preferences: {
                overlayStrength: 60,
                backgroundBlur: 0,
                clockAnimation: true,
                backgroundPosition: 'center',
              },
            };
            setUserProfile(fallbackProfile);
            try {
              localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(fallbackProfile));
            } catch (_) {}
            setDoc(userDocRef, fallbackProfile, { merge: true }).catch(() => {});
          }
        } catch (err: any) {
          console.error('Error fetching Firestore user profile onAuthStateChanged:', err);
          if (isMounted) {
            setProfileError('Failed to load user profile from database.');
          }
        }
      } else {
        // User logged out or unauthenticated
        setCurrentUser(null);
        setUserProfile(null);
        try {
          localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
        } catch (_) {}
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Update Profile
  const updateProfile = async (data: Partial<UserProfile>): Promise<void> => {
    if (!currentUser && !userProfile) return;
    setProfileError(null);

    const activeUid = currentUser?.uid || userProfile?.uid;
    if (!activeUid) return;

    const updated: UserProfile = {
      ...(userProfile as UserProfile),
      ...data,
      updatedAt: new Date().toISOString(),
    };
    setUserProfile(updated);

    try {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save profile to localStorage:', e);
    }

    try {
      const userDocRef = doc(db, 'users', activeUid);
      await setDoc(userDocRef, updated, { merge: true });
    } catch (err: any) {
      console.error('Firestore profile sync error:', err);
      setProfileError('Could not sync profile with Firestore.');
      throw err;
    }
  };

  // Update Preferences
  const updateUserPreferences = async (prefs: Partial<UserProfile['preferences']>): Promise<void> => {
    if (!userProfile) return;
    const activeUid = currentUser?.uid || userProfile.uid;

    const updated: UserProfile = {
      ...userProfile,
      preferences: {
        ...userProfile.preferences,
        ...prefs,
      },
      updatedAt: new Date().toISOString(),
    };
    setUserProfile(updated);

    try {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
      if (activeUid) {
        await setDoc(doc(db, 'users', activeUid), updated, { merge: true });
      }
    } catch (e) {
      console.error('Failed to update preferences:', e);
    }
  };

  // Refresh Profile
  const refreshProfile = async (): Promise<void> => {
    const activeUid = currentUser?.uid || userProfile?.uid;
    if (!activeUid) return;

    try {
      const snap = await getDoc(doc(db, 'users', activeUid));
      if (snap.exists()) {
        const cloudData = snap.data() as UserProfile;
        setUserProfile((prev) => (prev ? { ...prev, ...cloudData } : cloudData));
        try {
          localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(cloudData));
        } catch (_) {}
      }
    } catch (e) {
      console.error('Error refreshing profile:', e);
    }
  };

  // Sign In with Email & Password
  const signIn = async (
    email: string,
    pass: string,
    rememberMe: boolean = true
  ): Promise<UserProfile> => {
    // Set Auth Persistence based on Remember Me
    try {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );
    } catch (persistErr) {
      console.warn('Persistence configuration warning:', persistErr);
    }

    // Authenticate with Firebase Authentication
    const cleanEmail = email.trim().toLowerCase();
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    const user = userCredential.user;

    // Fetch existing user profile
    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);

    let profile: UserProfile;
    if (userSnap.exists()) {
      profile = {
        ...(userSnap.data() as UserProfile),
        uid: user.uid,
        email: user.email || cleanEmail,
        emailVerified: user.emailVerified,
        lastLoginAt: new Date().toISOString(),
      };
      // Update lastLoginAt in Firestore
      await setDoc(userDocRef, { lastLoginAt: profile.lastLoginAt }, { merge: true });
    } else {
      // First-time fallback profile
      profile = {
        uid: user.uid,
        fullName: user.displayName || cleanEmail.split('@')[0],
        email: user.email || cleanEmail,
        username: cleanEmail.split('@')[0],
        normalizedUsername: cleanEmail.split('@')[0].toLowerCase(),
        country: 'Kenya',
        academicYear: 'Year 3 (2026/2027)',
        currentSemester: 'Trimester 2 - 2026',
        semester: 'Trimester 2 - 2026',
        role: 'student',
        accountStatus: 'ACTIVE',
        emailVerified: user.emailVerified,
        avatarUrl: '',
        photoURL: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        preferences: {
          overlayStrength: 60,
          backgroundBlur: 0,
          clockAnimation: true,
          backgroundPosition: 'center',
        },
      };
      await setDoc(userDocRef, profile, { merge: true });
    }

    setCurrentUser(user);
    setUserProfile(profile);
    try {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profile));
    } catch (_) {}

    return profile;
  };

  // Register New User
  const registerUser = async (data: RegisterUserData): Promise<UserProfile> => {
    const cleanEmail = data.email.trim();
    const cleanUsername = data.username.trim();
    const normalizedUsername = cleanUsername.toLowerCase();
    const cleanFullName = data.fullName.trim();
    const cleanCountry = data.country.trim();
    const cleanYear = data.academicYear.trim();
    const cleanSemester = data.semester.trim();

    // 1. Pre-check username availability
    const usernameDocRef = doc(db, 'usernames', normalizedUsername);
    const usernameCheck = await getDoc(usernameDocRef);
    if (usernameCheck.exists()) {
      throw new Error('Username already taken. Please choose another username.');
    }

    // 2. Create Firebase Authentication account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      cleanEmail,
      data.password
    );
    const user = userCredential.user;

    // 3. Prepare User Profile
    const newProfile: UserProfile = {
      uid: user.uid,
      fullName: cleanFullName,
      username: cleanUsername,
      normalizedUsername,
      email: cleanEmail,
      country: cleanCountry,
      academicYear: cleanYear,
      currentSemester: cleanSemester,
      semester: cleanSemester,
      role: 'student', // Never admin from public registration
      accountStatus: 'ACTIVE',
      emailVerified: user.emailVerified || false,
      photoURL: '',
      avatarUrl: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      preferences: {
        overlayStrength: 60,
        backgroundBlur: 0,
        clockAnimation: true,
        backgroundPosition: 'center',
      },
    };

    // 4. Claim username and store user profile in Firestore
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await runTransaction(db, async (transaction) => {
        const uDoc = await transaction.get(usernameDocRef);
        if (uDoc.exists()) {
          throw new Error('USERNAME_TAKEN');
        }
        transaction.set(usernameDocRef, {
          uid: user.uid,
          username: cleanUsername,
          createdAt: new Date().toISOString(),
        });
        transaction.set(userDocRef, newProfile);
      });
    } catch (txErr: any) {
      // Rollback created Firebase auth account if username became claimed concurrently
      try {
        await user.delete();
      } catch (delErr) {
        console.warn('Rollback auth account deletion failed:', delErr);
      }
      if (txErr.message === 'USERNAME_TAKEN') {
        throw new Error('Username already taken. Please choose another username.');
      }
      throw txErr;
    }

    // 5. Send Email Verification
    try {
      await sendEmailVerification(user);
    } catch (verifErr) {
      console.warn('Email verification send notice:', verifErr);
    }

    setCurrentUser(user);
    setUserProfile(newProfile);
    try {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(newProfile));
    } catch (_) {}

    return newProfile;
  };

  // Reset Password
  const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  };

  // Resend Email Verification
  const resendVerification = async (): Promise<void> => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } finally {
      setCurrentUser(null);
      setUserProfile(null);
      try {
        localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
      } catch (_) {}
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        profileError,
        updateProfile,
        updateUserPreferences,
        refreshProfile,
        signIn,
        registerUser,
        resetPassword,
        resendVerification,
        logout,
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
