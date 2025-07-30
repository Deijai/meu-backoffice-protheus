import {
    deleteObject,
    getDownloadURL,
    listAll,
    ref,
    uploadBytes,
    uploadBytesResumable
} from 'firebase/storage';
import { storage } from './config';

interface UploadProgress {
    bytesTransferred: number;
    totalBytes: number;
    percentage: number;
}

interface FirebaseStorageService {
    uploadFile: (
        file: Blob | Uint8Array | ArrayBuffer,
        path: string,
        onProgress?: (progress: UploadProgress) => void
    ) => Promise<string>;
    downloadFile: (path: string) => Promise<string>;
    deleteFile: (path: string) => Promise<void>;
    listFiles: (path: string) => Promise<string[]>;
}

export const firebaseStorageService: FirebaseStorageService = {
    uploadFile: async (
        file: Blob | Uint8Array | ArrayBuffer,
        path: string,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<string> => {
        try {
            const storageRef = ref(storage, path);

            if (onProgress) {
                const uploadTask = uploadBytesResumable(storageRef, file);

                return new Promise((resolve, reject) => {
                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const progress = {
                                bytesTransferred: snapshot.bytesTransferred,
                                totalBytes: snapshot.totalBytes,
                                percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
                            };
                            onProgress(progress);
                        },
                        (error) => {
                            reject(error);
                        },
                        async () => {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve(downloadURL);
                        }
                    );
                });
            } else {
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                return downloadURL;
            }
        } catch (error) {
            console.error('Erro no upload:', error);
            throw error;
        }
    },

    downloadFile: async (path: string): Promise<string> => {
        try {
            const storageRef = ref(storage, path);
            const downloadURL = await getDownloadURL(storageRef);
            return downloadURL;
        } catch (error) {
            console.error('Erro no download:', error);
            throw error;
        }
    },

    deleteFile: async (path: string): Promise<void> => {
        try {
            const storageRef = ref(storage, path);
            await deleteObject(storageRef);
        } catch (error) {
            console.error('Erro ao deletar arquivo:', error);
            throw error;
        }
    },

    listFiles: async (path: string): Promise<string[]> => {
        try {
            const storageRef = ref(storage, path);
            const result = await listAll(storageRef);

            const fileNames = result.items.map(item => item.name);
            return fileNames;
        } catch (error) {
            console.error('Erro ao listar arquivos:', error);
            throw error;
        }
    },
};