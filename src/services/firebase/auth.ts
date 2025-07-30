import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    User,
    UserCredential,
} from 'firebase/auth';
import { auth } from './config';

interface FirebaseAuthService {
    signIn: (email: string, password: string) => Promise<UserCredential>;
    signOut: () => Promise<void>;
    getCurrentUser: () => User | null;
    onAuthStateChanged: (callback: (user: User | null) => void) => () => void;
}

export const firebaseAuthService: FirebaseAuthService = {
    signIn: async (email: string, password: string): Promise<UserCredential> => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential;
        } catch (error) {
            console.error('Erro no login Firebase:', error);
            throw error;
        }
    },

    signOut: async (): Promise<void> => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Erro no logout Firebase:', error);
            throw error;
        }
    },

    getCurrentUser: (): User | null => {
        return auth.currentUser;
    },

    onAuthStateChanged: (callback: (user: User | null) => void) => {
        return onAuthStateChanged(auth, callback);
    },
};