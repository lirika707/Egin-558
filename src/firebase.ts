import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp, getDocFromServer, increment } from 'firebase/firestore';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Auth functions
/**
 * IMPORTANT: To use Google Sign-In, you MUST enable the Google provider in the Firebase Console:
 * Authentication > Sign-in method > Add new provider > Google
 */
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const logOut = () => signOut(auth);

/**
 * IMPORTANT: To use Email/Password Sign-In, you MUST enable the Email/Password provider in the Firebase Console:
 * Authentication > Sign-in method > Add new provider > Email/Password
 */
export const loginWithEmail = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);

export const getAuthErrorMessage = (error: any): string => {
  const code = error?.code;
  console.error("Auth Error Code:", code, error);
  
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Этот способ входа временно недоступен. Пожалуйста, убедитесь, что он включен в консоли Firebase или попробуйте другой вариант.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Неверный email или пароль.';
    case 'auth/email-already-in-use':
      return 'Этот email уже используется другим аккаунтом.';
    case 'auth/weak-password':
      return 'Пароль слишком слабый. Используйте минимум 6 символов.';
    case 'auth/invalid-email':
      return 'Некорректный формат email.';
    case 'auth/network-request-failed':
      return 'Ошибка сети. Проверьте подключение к интернету.';
    case 'auth/popup-closed-by-user':
      return 'Окно входа было закрыто.';
    default:
      return 'Произошла ошибка при входе. Попробуйте позже.';
  }
};

export const registerWithEmail = async (email: string, pass: string, firstName: string, lastName: string, phone: string, location?: string, bio?: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const fullName = `${firstName} ${lastName}`;
  await updateProfile(userCredential.user, { displayName: fullName });
  return { userCredential, firstName, lastName, fullName, phone, location, bio };
};

export const quickRegister = async (identifier: string, type: 'email' | 'phone') => {
  // Generate random password
  const password = Math.random().toString(36).slice(-10) + 'A1!';
  // Generate username from identifier
  const username = identifier.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.floor(Math.random() * 1000);
  
  let email = identifier;
  if (type === 'phone') {
    // Firebase needs an email for email/pass auth. 
    // We can use a virtual email for phone-only quick reg if real phone auth is not enabled.
    email = `${identifier.replace(/[^0-9]/g, '')}@egin.quick`;
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const fullName = type === 'email' ? identifier.split('@')[0] : identifier;
  await updateProfile(userCredential.user, { displayName: fullName });
  
  return { 
    userCredential, 
    email, 
    password, 
    username, 
    fullName,
    phone: type === 'phone' ? identifier : ''
  };
};

// Social Auth Placeholders / Integration-ready
/**
 * IMPORTANT: To use Yandex Sign-In, you MUST configure the Yandex provider.
 * This usually requires a custom OAuth implementation in Firebase.
 */
export const signInWithYandex = async () => {
  // Placeholder for Yandex ID OAuth
  console.log("Yandex ID Auth - Integration Ready");
  throw { code: 'auth/operation-not-allowed' };
};

/**
 * IMPORTANT: To use VK Sign-In, you MUST configure the VK provider.
 */
export const signInWithVK = async () => {
  // Placeholder for VK OAuth
  console.log("VK Auth - Integration Ready");
  throw { code: 'auth/operation-not-allowed' };
};

/**
 * IMPORTANT: To use LinkedIn Sign-In, you MUST configure the LinkedIn provider.
 */
export const signInWithLinkedIn = async () => {
  // Placeholder for LinkedIn OAuth
  console.log("LinkedIn Auth - Integration Ready");
  throw { code: 'auth/operation-not-allowed' };
};

/**
 * IMPORTANT: To use Instagram Sign-In, you MUST configure the Instagram provider.
 */
export const signInWithInstagram = async () => {
  // Placeholder for Instagram Auth
  console.log("Instagram Auth - Integration Ready");
  throw { code: 'auth/operation-not-allowed' };
};

// Types
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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

export { 
  collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp, onAuthStateChanged, increment
};
export type { FirebaseUser };
