// Validações de formulários e dados
export const validation = {
    // Validação de email
    email: (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Validação de senha
    password: (password: string): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (password.length < 1) {
            errors.push('A senha deve ter pelo menos 6 caracteres');
        }

        if (password.length > 50) {
            errors.push('A senha deve ter no máximo 50 caracteres');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    },

    // Validação de nome de usuário
    username: (username: string): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (username.length < 3) {
            errors.push('O nome de usuário deve ter pelo menos 3 caracteres');
        }

        if (username.length > 30) {
            errors.push('O nome de usuário deve ter no máximo 30 caracteres');
        }

        if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
            errors.push('O nome de usuário deve conter apenas letras, números, "_", "." e "-"');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    },

    // Validação de IP
    ip: (ip: string): boolean => {
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(ip) || ip === 'localhost' || /^[a-zA-Z0-9.-]+$/.test(ip);
    },

    // Validação de porta
    port: (port: string): boolean => {
        const portNum = parseInt(port, 10);
        return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
    },

    // Validação de URL
    url: (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    // Validação de campos obrigatórios
    required: (value: any): boolean => {
        if (typeof value === 'string') {
            return value.trim().length > 0;
        }
        return value !== null && value !== undefined;
    },

    // Validação de CPF
    cpf: (cpf: string): boolean => {
        const cleanCpf = cpf.replace(/[^\d]/g, '');

        if (cleanCpf.length !== 11) return false;

        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

        // Validação dos dígitos verificadores
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
        }
        let digit = 11 - (sum % 11);
        if (digit === 10 || digit === 11) digit = 0;
        if (digit !== parseInt(cleanCpf.charAt(9))) return false;

        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
        }
        digit = 11 - (sum % 11);
        if (digit === 10 || digit === 11) digit = 0;
        if (digit !== parseInt(cleanCpf.charAt(10))) return false;

        return true;
    },

    // Validação de CNPJ
    cnpj: (cnpj: string): boolean => {
        const cleanCnpj = cnpj.replace(/[^\d]/g, '');

        if (cleanCnpj.length !== 14) return false;

        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1{13}$/.test(cleanCnpj)) return false;

        // Validação do primeiro dígito verificador
        let sum = 0;
        const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        for (let i = 0; i < 12; i++) {
            sum += parseInt(cleanCnpj.charAt(i)) * weights1[i];
        }
        let digit = sum % 11;
        digit = digit < 2 ? 0 : 11 - digit;
        if (digit !== parseInt(cleanCnpj.charAt(12))) return false;

        // Validação do segundo dígito verificador
        sum = 0;
        const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        for (let i = 0; i < 13; i++) {
            sum += parseInt(cleanCnpj.charAt(i)) * weights2[i];
        }
        digit = sum % 11;
        digit = digit < 2 ? 0 : 11 - digit;
        if (digit !== parseInt(cleanCnpj.charAt(13))) return false;

        return true;
    },
};