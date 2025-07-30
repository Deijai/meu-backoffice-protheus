import AsyncStorage from '@react-native-async-storage/async-storage';

interface AsyncStorageService {
    setItem: (key: string, value: any) => Promise<void>;
    getItem: <T = any>(key: string) => Promise<T | null>;
    removeItem: (key: string) => Promise<void>;
    clear: () => Promise<void>;
    getAllKeys: () => Promise<string[]>;
    multiGet: (keys: string[]) => Promise<Record<string, any>>;
    multiSet: (keyValuePairs: Array<[string, any]>) => Promise<void>;
    multiRemove: (keys: string[]) => Promise<void>;
}

export const asyncStorageService: AsyncStorageService = {
    setItem: async (key: string, value: any): Promise<void> => {
        try {
            const jsonValue = JSON.stringify(value);
            await AsyncStorage.setItem(key, jsonValue);
        } catch (error) {
            console.error(`Erro ao salvar ${key}:`, error);
            throw error;
        }
    },

    getItem: async <T = any>(key: string): Promise<T | null> => {
        try {
            const jsonValue = await AsyncStorage.getItem(key);
            return jsonValue != null ? JSON.parse(jsonValue) : null;
        } catch (error) {
            console.error(`Erro ao recuperar ${key}:`, error);
            return null;
        }
    },

    removeItem: async (key: string): Promise<void> => {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error(`Erro ao remover ${key}:`, error);
            throw error;
        }
    },

    clear: async (): Promise<void> => {
        try {
            await AsyncStorage.clear();
        } catch (error) {
            console.error('Erro ao limpar AsyncStorage:', error);
            throw error;
        }
    },

    getAllKeys: async (): Promise<string[]> => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            return keys as string[];
        } catch (error) {
            console.error('Erro ao obter todas as chaves:', error);
            return [];
        }
    },

    multiGet: async (keys: string[]): Promise<Record<string, any>> => {
        try {
            const keyValuePairs = await AsyncStorage.multiGet(keys);
            const result: Record<string, any> = {};

            keyValuePairs.forEach(([key, value]) => {
                if (value) {
                    try {
                        result[key] = JSON.parse(value);
                    } catch {
                        result[key] = value;
                    }
                }
            });

            return result;
        } catch (error) {
            console.error('Erro no multiGet:', error);
            return {};
        }
    },

    multiSet: async (keyValuePairs: Array<[string, any]>): Promise<void> => {
        try {
            const pairs = keyValuePairs.map(([key, value]) => [
                key,
                JSON.stringify(value),
            ]) as Array<[string, string]>;

            await AsyncStorage.multiSet(pairs);
        } catch (error) {
            console.error('Erro no multiSet:', error);
            throw error;
        }
    },

    multiRemove: async (keys: string[]): Promise<void> => {
        try {
            await AsyncStorage.multiRemove(keys);
        } catch (error) {
            console.error('Erro no multiRemove:', error);
            throw error;
        }
    },
};

// Keys padronizadas para o app
export const STORAGE_KEYS = {
    USER_CREDENTIALS: 'user_credentials',
    CONNECTION_CONFIG: 'connection_config',
    THEME_PREFERENCE: 'theme_preference',
    BIOMETRIC_ENABLED: 'biometric_enabled',
    SELECTED_BRANCH: 'selected_branch',
    SELECTED_MODULE: 'selected_module',
    ONBOARDING_COMPLETED: 'onboarding_completed',
    FIRST_LAUNCH: 'first_launch',
    OFFLINE_DATA: 'offline_data',
    SYNC_TIMESTAMP: 'sync_timestamp',
} as const;