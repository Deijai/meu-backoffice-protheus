import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuração do Firebase - substituir pelos seus valores
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar serviços
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);

export default app;