export interface User {
    id: string;
    username: string;
    email?: string;
    name?: string;
    avatar?: string;
}

export interface Branch {
    id: string;
    code: string;
    name: string;
    location: string;
    description?: string;
}

export interface Module {
    id: string;
    code: string;
    name: string;
    icon: string;
    description: string;
    color?: string;
}

export interface LoginCredentials {
    username: string;
    password: string;
}