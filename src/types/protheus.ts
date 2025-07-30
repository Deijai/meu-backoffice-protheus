// src/types/protheus.ts - Tipos específicos do Protheus
export interface ProteusBranch {
    EnterpriseGroup: string;
    CompanyCode: string;
    UnitOfBusiness: string;
    ParentCode: string;
    Code: string;
    Description: string;
    Title: string;
    Cgc: string;
    StateRegistration: string;
    Phone: string;
    Street: string;
    Complement: string;
    Neighborhood: string;
    State: string;
    City: string;
    ZipCode: string;
    CityCode: string;
    CNAECode: string;
    NatureCode: string;
    BillingAddress: string;
    BillingZipCode: string;
    BillingComplement: string;
    BillingNeighborhood: string;
    BillingCity: string;
    BillingState: string;
    NIRE: string;
    DTRE: string;
    Suframa: string;
    SubscriptionType: string;
    CommercialName: string;
    CityRegistration: string;
}

export interface ProteusBranchesResponse {
    items: ProteusBranch[];
    hasNext: boolean;
}

// Converter Branch do Protheus para formato do app
export interface AppBranch {
    id: string;
    code: string;
    name: string;
    location: string;
    description?: string;
    // Dados extras do Protheus
    enterpriseGroup?: string;
    companyCode?: string;
    unitOfBusiness?: string;
    cgc?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
}

// Função para converter Branch do Protheus para formato do app
export const convertProteusBranchToApp = (proteusBranch: ProteusBranch): AppBranch => {
    return {
        id: proteusBranch.Code.trim(),
        code: proteusBranch.Code.trim(),
        name: proteusBranch.Description.trim(),
        location: `${proteusBranch.City.trim()}, ${proteusBranch.State.trim()}`,
        description: proteusBranch.Title.trim(),
        // Dados extras
        enterpriseGroup: proteusBranch.EnterpriseGroup,
        companyCode: proteusBranch.CompanyCode,
        unitOfBusiness: proteusBranch.UnitOfBusiness,
        cgc: proteusBranch.Cgc,
        phone: proteusBranch.Phone,
        address: `${proteusBranch.Street.trim()}, ${proteusBranch.Neighborhood.trim()}`,
        city: proteusBranch.City.trim(),
        state: proteusBranch.State.trim(),
        zipCode: proteusBranch.ZipCode,
    };
};

// Módulos do Protheus (para próximo passo)
export interface ProtheusModule {
    id: string;
    code: string;
    name: string;
    icon: string;
    description: string;
    color?: string;
}

// Resposta de paginação genérica do Protheus
export interface ProtheusPagedResponse<T> {
    items: T[];
    hasNext: boolean;
    page?: number;
    pageSize?: number;
    total?: number;
}