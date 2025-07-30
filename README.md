# Meu Backoffice Protheus

Um aplicativo mobile moderno para acessar e gerenciar dados do sistema Protheus, desenvolvido com React Native, TypeScript e Expo.

## 🚀 Características

- **Design Moderno**: Interface baseada no design system do Protheus com tema claro/escuro
- **Autenticação Segura**: Login com usuário/senha e autenticação biométrica (Face ID/Touch ID)
- **Multi-Filial**: Suporte para seleção de filiais diferentes
- **Módulos Integrados**: Acesso aos principais módulos do Protheus (Faturamento, Estoque, Financeiro, RH, Compras)
- **Offline First**: Funciona offline com sincronização automática
- **Configuração Flexível**: Conexão configurável com servidores REST do Protheus

## 📱 Fluxo do Aplicativo

1. **Splash Screen** - Tela inicial com logo do aplicativo
2. **Onboarding** - Apresentação das funcionalidades (apenas no primeiro acesso)
3. **Configuração REST** - Configuração da conexão com o servidor Protheus
4. **Login** - Autenticação com usuário/senha e opção de biometria
5. **Seleção de Filial** - Escolha da filial para trabalhar
6. **Seleção de Módulo** - Escolha do módulo do Protheus
7. **Tela Principal** - Interface principal com navegação por tabs

## 🛠️ Tecnologias

- **React Native** com **TypeScript**
- **Expo** com **Expo Router** (navegação estilo Next.js)
- **Zustand** para gerenciamento de estado
- **AsyncStorage** para persistência local
- **Firebase** (Auth e Storage)
- **Expo Local Authentication** para biometria
- **StyleSheet nativo** para estilização
- **Sistema de temas** com suporte dark/light

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (para iOS) ou Android Studio (para Android)

### Configuração do Projeto

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/meu-backoffice-protheus.git
cd meu-backoffice-protheus
```

2. **Instale as dependências**
```bash
npm install
# ou
yarn install
```

3. **Configure o Firebase**
   
   Edite o arquivo `src/services/firebase/config.ts` com suas credenciais do Firebase:
```typescript
const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "seu-auth-domain",
  projectId: "seu-project-id",
  storageBucket: "seu-storage-bucket",
  messagingSenderId: "seu-messaging-sender-id",
  appId: "seu-app-id"
};
```

4. **Configure a API do Protheus**

   No arquivo `src/services/api/protheus.ts`, ajuste os endpoints conforme sua API REST do Protheus.

### Executando o Projeto

```bash
# Iniciar o servidor de desenvolvimento
npm start
# ou
yarn start

# Para executar em dispositivo específico
npm run ios     # iOS Simulator
npm run android # Android Emulator
npm run web     # Navegador web
```

## 🏗️ Estrutura do Projeto

```
meu-backoffice-protheus/
├── app/                          # Rotas do Expo Router
│   ├── (auth)/                   # Grupo de rotas de autenticação
│   │   ├── index.tsx            # Splash Screen
│   │   ├── onboarding.tsx       # Onboarding
│   │   ├── setup.tsx            # Configuração REST
│   │   └── login.tsx            # Login
│   ├── (app)/                    # Grupo de rotas do app
│   │   ├── branch-selection.tsx # Seleção de Filial
│   │   ├── module-selection.tsx # Seleção de Módulo
│   │   └── (tabs)/              # Navegação por tabs
│   │       ├── home.tsx         # Tela inicial
│   │       ├── reports.tsx      # Relatórios
│   │       ├── settings.tsx     # Configurações
│   │       └── profile.tsx      # Perfil
│   └── _layout.tsx              # Layout raiz
├── src/
│   ├── components/              # Componentes reutilizáveis
│   │   ├── ui/                  # Componentes de interface
│   │   ├── layout/              # Componentes de layout
│   │   └── forms/               # Componentes de formulário
│   ├── hooks/                   # Hooks customizados
│   ├── services/                # Serviços (API, Firebase, etc.)
│   ├── store/                   # Estados globais (Zustand)
│   ├── styles/                  # Temas e estilos
│   ├── types/                   # Definições de tipos TypeScript
│   └── utils/                   # Utilitários e helpers
├── assets/                      # Imagens, ícones e fontes
└── docs/                        # Documentação adicional
```

## 🎨 Sistema de Temas

O aplicativo suporta temas claro e escuro com persistência automática. A configuração está em:

- `src/styles/theme.ts` - Configuração base dos temas
- `src/styles/colors.ts` - Paleta de cores
- `src/store/themeStore.ts` - Gerenciamento de estado do tema

### Cores Principais

- **Primária**: `#0c9abe` (azul Protheus)
- **Secundárias**: Definidas automaticamente baseadas no tema

## 🔐 Autenticação e Segurança

### Autenticação por Usuário/Senha
- Validação local e no servidor
- Persistência segura das credenciais

### Autenticação Biométrica
- Suporte a Face ID, Touch ID e impressão digital
- Configuração opcional pelo usuário
- Fallback para senha em caso de falha

### Segurança de Dados
- Tokens JWT para autenticação da API
- Criptografia de dados sensíveis no AsyncStorage
- Timeout automático de sessão

## 🌐 Configuração da API

### Configuração da Conexão REST

O aplicativo permite configurar a conexão com o servidor Protheus através da tela de setup:

- **Protocolo**: HTTP ou HTTPS
- **Endereço**: IP ou hostname do servidor
- **Porta**: Porta do serviço REST
- **Ambiente**: Ambiente REST do Protheus

### Endpoints da API

Os endpoints estão definidos em `src/services/api/endpoints.ts` e incluem:

- Autenticação e autorização
- Gestão de filiais e módulos
- Dados específicos por módulo
- Relatórios e sincronização

## 📱 Funcionalidades por Módulo

### Faturamento (SIGAFAT)
- Consulta de pedidos de venda
- Gestão de clientes
- Emissão de notas fiscais
- Relatórios de vendas

### Estoque (SIGAEST)
- Consulta de produtos
- Movimentações de estoque
- Inventário
- Localização de produtos

### Financeiro (SIGAFIN)
- Contas a receber
- Contas a pagar
- Fluxo de caixa
- Centros de custo

### Recursos Humanos (SIGARH)
- Dados de funcionários
- Folha de pagamento
- Controle de ponto
- Gestão de férias

### Compras (SIGACOM)
- Pedidos de compra
- Gestão de fornecedores
- Cotações
- Aprovações

## 🔄 Sincronização e Offline

### Funcionalidades Offline
- Cache local de dados essenciais
- Operações offline com sincronização posterior
- Detecção automática de conectividade

### Sincronização
- Sincronização incremental
- Resolução de conflitos
- Sincronização manual e automática

## ⚙️ Configurações

### Configurações do Usuário
- Tema claro/escuro
- Autenticação biométrica
- Configurações de sincronização
- Preferências de notificação

### Configurações do Sistema
- Configuração do servidor REST
- Timeout de requisições
- Cache e armazenamento local

## 🧪 Testes

Para executar os testes:

```bash
# Testes unitários
npm test
# ou
yarn test

# Testes com cobertura
npm run test:coverage
# ou
yarn test:coverage
```

## 📱 Build e Deploy

### Build para Desenvolvimento
```bash
expo build:android --type apk
expo build:ios --type simulator
```

### Build para Produção
```bash
# Android
expo build:android --type app-bundle

# iOS
expo build:ios --type archive
```

### Deploy para Store
```bash
# Android Play Store
expo upload:android

# iOS App Store
expo upload:ios
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📋 Roadmap

- [ ] Implementação completa dos módulos do Protheus
- [ ] Sistema de notificações push
- [ ] Relatórios avançados com gráficos
- [ ] Suporte a múltiplos idiomas
- [ ] Dashboard analítico
- [ ] Integração com outros sistemas TOTVS

## 🐛 Problemas Conhecidos

- Autenticação biométrica pode não funcionar em alguns emuladores
- Sincronização pode ser lenta em conexões instáveis
- Alguns relatórios podem demorar para carregar

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Equipe

- **Desenvolvedor Principal**: Seu Nome
- **UI/UX Design**: Designer Nome
- **Product Owner**: PO Nome

## 📞 Suporte

Para suporte e dúvidas:

- Email: suporte@empresa.com
- Slack: #meu-backoffice-protheus
- Documentação: [docs.empresa.com](https://docs.empresa.com)

## 🔗 Links Úteis

- [Documentação do Expo](https://docs.expo.dev/)
- [React Native](https://reactnative.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Firebase](https://firebase.google.com/)

---

**Desenvolvido com ❤️ para a comunidade TOTVS Protheus**