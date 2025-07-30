// Formatadores de texto e dados
export const formatters = {
    // Formatação de dinheiro
    currency: (value: number, currency = 'BRL'): string => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency,
        }).format(value);
    },

    // Formatação de números
    number: (value: number, decimals = 2): string => {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(value);
    },

    // Formatação de percentual
    percentage: (value: number, decimals = 1): string => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'percent',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(value / 100);
    },

    // Formatação de data
    date: (date: Date | string, format: 'short' | 'medium' | 'long' = 'medium'): string => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;

        const options: Intl.DateTimeFormatOptions = {
            short: { day: '2-digit', month: '2-digit', year: 'numeric' },
            medium: { day: '2-digit', month: 'short', year: 'numeric' },
            long: { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' },
        }[format] as any;

        return new Intl.DateTimeFormat('pt-BR', options).format(dateObj);
    },

    // Formatação de hora
    time: (date: Date | string): string => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(dateObj);
    },

    // Formatação de data e hora
    datetime: (date: Date | string): string => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(dateObj);
    },

    // Formatação de CPF
    cpf: (cpf: string): string => {
        const numbers = cpf.replace(/\D/g, '');
        return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    },

    // Formatação de CNPJ
    cnpj: (cnpj: string): string => {
        const numbers = cnpj.replace(/\D/g, '');
        return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    },

    // Formatação de telefone
    phone: (phone: string): string => {
        const numbers = phone.replace(/\D/g, '');

        if (numbers.length === 10) {
            return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        } else if (numbers.length === 11) {
            return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }

        return phone;
    },

    // Formatação de CEP
    cep: (cep: string): string => {
        const numbers = cep.replace(/\D/g, '');
        return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
    },

    // Formatação de bytes
    bytes: (bytes: number, decimals = 2): string => {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },

    // Formatação de texto para capitalização
    capitalize: (text: string): string => {
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    },

    // Formatação de texto para título
    title: (text: string): string => {
        return text.replace(/\w\S*/g, (txt) =>
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    },

    // Truncar texto
    truncate: (text: string, length = 50, suffix = '...'): string => {
        if (text.length <= length) return text;
        return text.substring(0, length).trim() + suffix;
    },

    // Remover acentos
    removeAccents: (text: string): string => {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },

    // Formatação de tempo relativo
    timeAgo: (date: Date | string): string => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diff = now.getTime() - dateObj.getTime();

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} dia${days > 1 ? 's' : ''} atrás`;
        if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
        if (minutes > 0) return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
        return 'Agora mesmo';
    },
};