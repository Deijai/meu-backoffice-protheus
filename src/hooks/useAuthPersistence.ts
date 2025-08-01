// src/hooks/useAuthPersistence.ts - Hook para garantir persistência
import { useEffect, useState } from 'react';
import { asyncStorageService } from '../services/storage/asyncStorage';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

interface AuthPersistenceData {
    selectedBranch?: any;
    selectedModule?: any;
    user?: any;
    isAuthenticated?: boolean;
    biometricEnabled?: boolean;
}

export const useAuthPersistence = () => {
    const {
        isAuthenticated,
        user,
        selectedBranch,
        selectedModule,
        biometricEnabled,
        setBranch,
        setModule,
        login,
        setBiometricEnabled,
        loadFromStorage,
    } = useAuthStore();

    const { showInfo, showSuccess, showError } = useToastStore();
    const [isLoadingPersistence, setIsLoadingPersistence] = useState(true);
    const [persistenceLoaded, setPersistenceLoaded] = useState(false);

    /**
     * Inicializar persistência na montagem
     */
    useEffect(() => {
        initializePersistence();
    }, []);

    /**
     * Salvar dados automaticamente quando mudarem
     */
    useEffect(() => {
        if (persistenceLoaded) {
            saveAuthData();
        }
    }, [selectedBranch, selectedModule, user, isAuthenticated, biometricEnabled, persistenceLoaded]);

    /**
     * Inicializar dados de persistência
     */
    const initializePersistence = async () => {
        console.log('🔄 === INICIALIZANDO PERSISTÊNCIA DE AUTH ===');
        setIsLoadingPersistence(true);

        try {
            // 1. Carregar dados do Zustand persist (já carregado automaticamente)
            console.log('📂 Dados do Zustand persist já carregados');

            // 2. Carregar dados adicionais do AsyncStorage
            await loadFromStorage();

            // 3. Verificar e consolidar dados
            await consolidateAuthData();

            console.log('✅ Persistência inicializada com sucesso');
            setPersistenceLoaded(true);

        } catch (error) {
            console.error('❌ Erro ao inicializar persistência:', error);
            showError('❌ Erro ao carregar dados salvos');
        } finally {
            setIsLoadingPersistence(false);
        }
    };

    /**
     * Consolidar dados de diferentes fontes
     */
    const consolidateAuthData = async () => {
        try {
            console.log('🔄 Consolidando dados de auth...');

            // Verificar se há dados no AsyncStorage que não estão no Zustand
            const [storedBranch, storedModule, storedAuth] = await Promise.all([
                asyncStorageService.getItem('selected_branch'),
                asyncStorageService.getItem('selected_module'),
                asyncStorageService.getItem('auth_user_data'),
            ]);

            console.log('📊 Dados encontrados no AsyncStorage:', {
                branch: storedBranch?.name,
                module: storedModule?.name,
                auth: !!storedAuth,
            });

            console.log('📊 Dados atuais no Zustand:', {
                branch: selectedBranch?.name,
                module: selectedModule?.name,
                user: user?.username,
                isAuthenticated,
            });

            // Consolidar filial
            if (storedBranch && !selectedBranch) {
                console.log('📂 Restaurando filial do AsyncStorage:', storedBranch.name);
                setBranch(storedBranch);
            } else if (selectedBranch && !storedBranch) {
                console.log('💾 Salvando filial do Zustand no AsyncStorage:', selectedBranch.name);
                await asyncStorageService.setItem('selected_branch', selectedBranch);
            }

            // Consolidar módulo
            if (storedModule && !selectedModule) {
                console.log('📂 Restaurando módulo do AsyncStorage:', storedModule.name);
                setModule(storedModule);
            } else if (selectedModule && !storedModule) {
                console.log('💾 Salvando módulo do Zustand no AsyncStorage:', selectedModule.name);
                await asyncStorageService.setItem('selected_module', selectedModule);
            }

            console.log('✅ Consolidação concluída');

        } catch (error) {
            console.error('❌ Erro na consolidação:', error);
        }
    };

    /**
     * Salvar dados automaticamente
     */
    const saveAuthData = async () => {
        try {
            const authData: AuthPersistenceData = {
                selectedBranch,
                selectedModule,
                user,
                isAuthenticated,
                biometricEnabled,
            };

            console.log('💾 Salvando dados de auth automaticamente...');

            // Salvar dados individuais
            const savePromises = [];

            if (selectedBranch) {
                savePromises.push(
                    asyncStorageService.setItem('selected_branch', selectedBranch)
                );
            }

            if (selectedModule) {
                savePromises.push(
                    asyncStorageService.setItem('selected_module', selectedModule)
                );
            }

            if (user && isAuthenticated) {
                savePromises.push(
                    asyncStorageService.setItem('auth_user_data', {
                        user,
                        isAuthenticated,
                        biometricEnabled,
                        lastSaved: new Date().toISOString(),
                    })
                );
            }

            await Promise.all(savePromises);
            console.log('✅ Dados salvos automaticamente');

        } catch (error) {
            console.error('❌ Erro ao salvar dados automaticamente:', error);
        }
    };

    /**
     * Forçar salvamento manual
     */
    const forceSave = async (): Promise<boolean> => {
        console.log('🔄 Forçando salvamento manual...');
        showInfo('💾 Salvando dados...');

        try {
            await saveAuthData();
            showSuccess('✅ Dados salvos com sucesso!');
            return true;
        } catch (error) {
            console.error('❌ Erro no salvamento forçado:', error);
            showError('❌ Erro ao salvar dados');
            return false;
        }
    };

    /**
     * Recarregar dados do storage
     */
    const reloadFromStorage = async (): Promise<boolean> => {
        console.log('🔄 Recarregando dados do storage...');
        showInfo('📂 Recarregando dados...');

        try {
            await loadFromStorage();
            await consolidateAuthData();
            showSuccess('✅ Dados recarregados!');
            return true;
        } catch (error) {
            console.error('❌ Erro ao recarregar:', error);
            showError('❌ Erro ao recarregar dados');
            return false;
        }
    };

    /**
     * Limpar todos os dados persistidos
     */
    const clearAllPersistence = async (): Promise<boolean> => {
        console.log('🗑️ Limpando toda a persistência...');

        try {
            await asyncStorageService.multiRemove([
                'selected_branch',
                'selected_module',
                'auth_user_data',
                'auth-storage', // Zustand persist key
            ]);

            console.log('✅ Persistência limpa');
            return true;
        } catch (error) {
            console.error('❌ Erro ao limpar persistência:', error);
            return false;
        }
    };

    /**
     * Obter estatísticas de persistência
     */
    const getPersistenceStats = async () => {
        try {
            const [branchSize, moduleSize, authSize] = await Promise.all([
                asyncStorageService.getItem('selected_branch'),
                asyncStorageService.getItem('selected_module'),
                asyncStorageService.getItem('auth_user_data'),
            ]);

            return {
                hasBranch: !!branchSize,
                hasModule: !!moduleSize,
                hasAuth: !!authSize,
                branchName: branchSize?.name,
                moduleName: moduleSize?.name,
                userName: authSize?.user?.username,
                lastSaved: authSize?.lastSaved,
            };
        } catch (error) {
            console.error('❌ Erro ao obter stats:', error);
            return null;
        }
    };

    /**
     * Validar integridade dos dados
     */
    const validateDataIntegrity = async (): Promise<{
        isValid: boolean;
        issues: string[];
        recommendations: string[];
    }> => {
        const issues: string[] = [];
        const recommendations: string[] = [];

        try {
            // Verificar se usuário autenticado tem filial
            if (isAuthenticated && !selectedBranch) {
                issues.push('Usuário autenticado sem filial selecionada');
                recommendations.push('Selecionar uma filial');
            }

            // Verificar se há filial sem módulo
            if (selectedBranch && !selectedModule) {
                issues.push('Filial selecionada sem módulo');
                recommendations.push('Selecionar um módulo');
            }

            // Verificar consistência entre Zustand e AsyncStorage
            const storedBranch = await asyncStorageService.getItem('selected_branch');
            const storedModule = await asyncStorageService.getItem('selected_module');

            if (selectedBranch && storedBranch && selectedBranch.id !== storedBranch.id) {
                issues.push('Inconsistência entre filial no Zustand e AsyncStorage');
                recommendations.push('Recarregar dados do storage');
            }

            if (selectedModule && storedModule && selectedModule.id !== storedModule.id) {
                issues.push('Inconsistência entre módulo no Zustand e AsyncStorage');
                recommendations.push('Recarregar dados do storage');
            }

            return {
                isValid: issues.length === 0,
                issues,
                recommendations,
            };

        } catch (error) {
            console.error('❌ Erro na validação:', error);
            return {
                isValid: false,
                issues: ['Erro ao validar dados'],
                recommendations: ['Tentar novamente'],
            };
        }
    };

    return {
        // Estados
        isLoadingPersistence,
        persistenceLoaded,

        // Ações
        forceSave,
        reloadFromStorage,
        clearAllPersistence,
        getPersistenceStats,
        validateDataIntegrity,
        initializePersistence,
    };
};