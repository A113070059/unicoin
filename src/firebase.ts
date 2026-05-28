import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged, 
  User, 
  signOut,
  updateEmail
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export let db: any = null;
export let auth: any = null;
export let isFirebaseConfigured = false;

// Determine if configuration is valid/present
if (
  firebaseConfig && 
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== "" &&
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== ""
) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
    isFirebaseConfigured = true;
  } catch (error) {
    console.error("Failed to initialize Firebase SDK:", error);
  }
}

// Verification connection to Firestore on initialization
if (isFirebaseConfigured && db) {
  const testConnection = async () => {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration: Client appears offline.");
      }
    }
  };
  testConnection();
}

// Error Handler schema from Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentAuthUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuthUser?.uid || null,
      email: currentAuthUser?.email || null,
      emailVerified: currentAuthUser?.emailVerified || null,
      isAnonymous: currentAuthUser?.isAnonymous || null,
      tenantId: currentAuthUser?.tenantId || null,
      providerInfo: currentAuthUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Authentication Wrappers
export const logInWithGoogle = async (): Promise<User | null> => {
  if (!isFirebaseConfigured || !auth) {
    console.warn("Firebase is not configured yet.");
    return null;
  }
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    if (result.user && result.user.email) {
      await fbRegisterPublicUser(result.user);
    }
    return result.user;
  } catch (err) {
    console.error("Error signing in with Google:", err);
    throw err;
  }
};

export const logInWithFacebook = async (): Promise<User | null> => {
  if (!isFirebaseConfigured || !auth) {
    console.warn("Firebase is not configured yet.");
    return null;
  }
  try {
    const provider = new FacebookAuthProvider();
    const result = await signInWithPopup(auth, provider);
    if (result.user && result.user.email) {
      await fbRegisterPublicUser(result.user);
    }
    return result.user;
  } catch (err) {
    console.error("Error signing in with Facebook:", err);
    throw err;
  }
};

export const signUpWithEmail = async (email: string, pass: string, name: string, phoneNumber?: string): Promise<User | null> => {
  if (!isFirebaseConfigured || !auth) return null;
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      await updateProfile(result.user, { displayName: name });
      const refreshedUser = auth.currentUser;
      if (refreshedUser && refreshedUser.email) {
        await fbRegisterPublicUser(refreshedUser, phoneNumber);
        return refreshedUser;
      }
    }
    return result.user;
  } catch (err) {
    console.error("Error signing up with Email:", err);
    throw err;
  }
};

export const logInWithEmail = async (email: string, pass: string): Promise<User | null> => {
  if (!isFirebaseConfigured || !auth) return null;
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    if (result.user && result.user.email) {
      await fbRegisterPublicUser(result.user);
    }
    return result.user;
  } catch (err) {
    console.error("Error signing in with Email:", err);
    throw err;
  }
};

export const logOut = async (): Promise<void> => {
  if (!isFirebaseConfigured || !auth) return;
  await signOut(auth);
};

export const onAuthStatusChange = (callback: (user: User | null) => void) => {
  if (!isFirebaseConfigured || !auth) return () => {};
  return onAuthStateChanged(auth, callback);
};

// Firestore CRUD Operations for Transactions
export const fbGetTransactions = async (userId: string): Promise<any[]> => {
  const p = `users/${userId}/transactions`;
  try {
    const q = query(collection(db, p));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, p);
    return [];
  }
};

export const fbSaveTransaction = async (userId: string, tx: any): Promise<void> => {
  const p = `users/${userId}/transactions/${tx.id}`;
  try {
    await setDoc(doc(db, `users/${userId}/transactions`, tx.id), tx);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, p);
  }
};

export const fbDeleteTransaction = async (userId: string, txId: string): Promise<void> => {
  const p = `users/${userId}/transactions/${txId}`;
  try {
    await deleteDoc(doc(db, `users/${userId}/transactions`, txId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, p);
  }
};

// Firestore CRUD Operations for AA Groups
export const fbGetAAGroups = async (userId: string): Promise<any[]> => {
  const p = `users/${userId}/aaGroups`;
  try {
    const snapshot = await getDocs(collection(db, p));
    return snapshot.docs.map(d => d.data());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, p);
    return [];
  }
};

export const fbSaveAAGroup = async (userId: string, group: any): Promise<void> => {
  const p = `users/${userId}/aaGroups/${group.id}`;
  try {
    await setDoc(doc(db, `users/${userId}/aaGroups`, group.id), group);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, p);
  }
};

export const fbDeleteAAGroup = async (userId: string, groupId: string): Promise<void> => {
  const p = `users/${userId}/aaGroups/${groupId}`;
  try {
    await deleteDoc(doc(db, `users/${userId}/aaGroups`, groupId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, p);
  }
};

// Firestore CRUD Operations for Invoices
export const fbGetInvoices = async (userId: string): Promise<any[]> => {
  const p = `users/${userId}/invoices`;
  try {
    const snapshot = await getDocs(collection(db, p));
    return snapshot.docs.map(d => d.data());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, p);
    return [];
  }
};

export const fbSaveInvoice = async (userId: string, invoice: any): Promise<void> => {
  const p = `users/${userId}/invoices/${invoice.id}`;
  try {
    await setDoc(doc(db, `users/${userId}/invoices`, invoice.id), invoice);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, p);
  }
};

export const fbSaveUserSetting = async (userId: string, setting: { monthlyLimit: number }): Promise<void> => {
  const p = `users/${userId}/settings/allowance`;
  try {
    await setDoc(doc(db, `users/${userId}/settings`, 'allowance'), setting);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, p);
  }
};

export const fbGetUserSetting = async (userId: string): Promise<{ monthlyLimit: number } | null> => {
  const p = `users/${userId}/settings/allowance`;
  try {
    const d = await getDocFromServer(doc(db, `users/${userId}/settings`, 'allowance'));
    if (d.exists()) {
      return d.data() as { monthlyLimit: number };
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, p);
    return null;
  }
};

// Helper to generate a stable 10-digit numeric string based on any string context
export const generate10DigitUid = (input: string): string => {
  if (!input) return "1000000000";
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  const positive = Math.abs(hash);
  const result = (positive % 9000000000) + 1000000000;
  return result.toString();
};

// Registered Directory and Notification System API
export const fbRegisterPublicUser = async (userObj: User, phoneNumber?: string): Promise<void> => {
  if (!userObj || !userObj.email) return;
  const p = `publicUsers/${userObj.email}`;
  try {
    const d10 = generate10DigitUid(userObj.uid);
    const data: any = {
      uid: d10,
      email: userObj.email,
      displayName: userObj.displayName || '學生用戶'
    };
    if (phoneNumber) {
      data.phoneNumber = phoneNumber;
    }
    await setDoc(doc(db, 'publicUsers', userObj.email), data, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, p);
  }
};

export const fbGetPublicUserByEmail = async (email: string): Promise<any | null> => {
  const p = `publicUsers/${email}`;
  try {
    const d = await getDocFromServer(doc(db, 'publicUsers', email));
    if (d.exists()) {
      return d.data();
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, p);
    return null;
  }
};

export const fbSearchPublicUser = async (searchQuery: string): Promise<any | null> => {
  if (!searchQuery || !isFirebaseConfigured || !db) return null;
  const val = searchQuery.trim();

  // Try direct email match first since it's the document key
  try {
    const directDoc = await getDocFromServer(doc(db, 'publicUsers', val));
    if (directDoc.exists()) {
      return directDoc.data();
    }
  } catch (err) {
    // optional fail-soft
  }

  // Query database collection by UID
  try {
    const qUid = query(collection(db, 'publicUsers'), where('uid', '==', val));
    const snapsUid = await getDocs(qUid);
    if (!snapsUid.empty) {
      return snapsUid.docs[0].data();
    }
  } catch (err) {
    console.error("Error searching user by UID", err);
  }

  // Query database collection by PhoneNumber
  try {
    const qPhone = query(collection(db, 'publicUsers'), where('phoneNumber', '==', val));
    const snapsPhone = await getDocs(qPhone);
    if (!snapsPhone.empty) {
      return snapsPhone.docs[0].data();
    }
  } catch (err) {
    console.error("Error searching user by phone number", err);
  }

  return null;
};

export const fbGetNotifications = async (userId: string): Promise<any[]> => {
  const p = `users/${userId}/notifications`;
  try {
    const snapshot = await getDocs(collection(db, p));
    return snapshot.docs.map(d => d.data());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, p);
    return [];
  }
};

export const fbSendNotification = async (recipientUserId: string, notification: any): Promise<void> => {
  const p = `users/${recipientUserId}/notifications/${notification.id}`;
  try {
    await setDoc(doc(db, `users/${recipientUserId}/notifications`, notification.id), notification);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, p);
  }
};

export const fbMarkAsReadNotification = async (userId: string, notificationId: string, item: any): Promise<void> => {
  const p = `users/${userId}/notifications/${notificationId}`;
  try {
    await setDoc(doc(db, `users/${userId}/notifications`, notificationId), { ...item, status: 'read' });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, p);
  }
};

export const fbUpdatePublicUserProfile = async (
  oldEmail: string,
  newEmail: string,
  updates: { displayName: string; phoneNumber?: string; birthday?: string; avatarUrl?: string }
): Promise<void> => {
  if (!isFirebaseConfigured || !db) return;
  const p = `publicUsers/${newEmail}`;
  try {
    const d10 = auth.currentUser ? generate10DigitUid(auth.currentUser.uid) : '';
    const data: any = {
      uid: d10,
      email: newEmail,
      displayName: updates.displayName,
    };
    if (updates.phoneNumber !== undefined) data.phoneNumber = updates.phoneNumber;
    if (updates.birthday !== undefined) data.birthday = updates.birthday;
    if (updates.avatarUrl !== undefined) data.avatarUrl = updates.avatarUrl;

    // Use updateProfile on standard Auth user if logged in
    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, { displayName: updates.displayName });
        if (newEmail !== oldEmail) {
          await updateEmail(auth.currentUser, newEmail);
        }
      } catch (authErr) {
        console.warn("Failed to update Firebase Auth profile/email directly (might require recent sign-in):", authErr);
      }
    }

    // Save under the new document key
    await setDoc(doc(db, 'publicUsers', newEmail), data, { merge: true });

    // Delete old document if the email updated
    if (oldEmail !== newEmail) {
      await deleteDoc(doc(db, 'publicUsers', oldEmail));
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, p);
    throw err;
  }
};

// Migration to convert any existing non-10-digit UIDs in Firestore to conforming UIDs
export const fbMigrateExistingUsersUid = async (): Promise<{ migrated: number; total: number }> => {
  if (!isFirebaseConfigured || !db) return { migrated: 0, total: 0 };
  try {
    const snaps = await getDocs(collection(db, 'publicUsers'));
    let migratedCount = 0;
    for (const snapDoc of snaps.docs) {
      const data = snapDoc.data();
      const currentUid = data.uid || '';
      // If UID is empty, or is not matches 10-digit number pattern
      if (!currentUid || !/^\d{10}$/.test(currentUid)) {
        // Use either currentUid or generating from the document ID which is email
        const newD10 = generate10DigitUid(currentUid || snapDoc.id);
        await setDoc(doc(db, 'publicUsers', snapDoc.id), { uid: newD10 }, { merge: true });
        migratedCount++;
      }
    }
    return { migrated: migratedCount, total: snaps.size };
  } catch (err) {
    console.error("Migration error in publicUsers UID conversion:", err);
    throw err;
  }
};

