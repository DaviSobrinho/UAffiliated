# UAffiliated - Sistema de Afiliados em Rede

## Status
✅ **Autenticação básica implementada e funcional**

## Stack
- **Framework:** Next.js 16 + React 19 + TypeScript 5
- **Banco de Dados:** PostgreSQL (Neon) + Prisma 5
- **Autenticação:** JWT + bcryptjs
- **UI:** Tailwind CSS v4 + Lucide React
- **Cookie/Session:** HTTP-only cookies com JWT

## Estrutura do Projeto

```
/app
  /api/auth/login      → Endpoint de login
  /dashboard           → Dashboard protegido
  /login               → Página de login
  /layout.tsx          → Layout raiz
  /page.tsx            → Home
  /globals.css         → Estilos globais

/lib
  /auth.ts             → Funções de autenticação (hash, token, verify)

/prisma
  /schema.prisma       → Schema do banco
  /seed.ts             → Seed com usuários de teste

Arquivo de config:
- tsconfig.json        → TypeScript config
- tailwind.config.js   → Tailwind CSS v4
- postcss.config.js    → PostCSS (Tailwind v4 plugin)
- next.config.js       → Next.js config
- .eslintrc.json       → ESLint config
```

## Usuários de Teste (Seed)
```
Admin:    admin@example.com    / admin123
User:     user@example.com     / user123
SubUser:  subuser@example.com  / subuser123
```

## Como Rodar
```bash
npm install           # Já feito
npm run dev          # Inicia servidor em http://localhost:3001
npm run prisma:seed  # Recriar dados de teste (se necessário)
npm run build        # Build para produção
npm start            # Inicia em produção
```

## Modelos de Banco de Dados (Atual)
```
User {
  id        String   @id
  email     String   @unique
  password  String   (hash bcryptjs)
  name      String
  role      String   (ADMIN, USER)
  createdAt DateTime
  updatedAt DateTime
}
```

## Fluxo de Autenticação
1. Usuário acessa `/login`
2. Envia credenciais para `POST /api/auth/login`
3. API valida email/password e gera JWT
4. JWT armazenado em cookie `auth` (httpOnly)
5. Dados do usuário salvos em localStorage
6. Redireciona para `/dashboard`

## Próximas Implementações
- [ ] Model House (casas de apostas)
- [ ] Model HouseLink (links de afiliados por casa)
- [ ] Model Conversion (registros, FTD, QFTD, comissão)
- [ ] Dashboard Admin (gerenciar casas, usuários, comissões)
- [ ] Dashboard User (ver conversões por casa, links, subafiliados)
- [ ] Sistema de comissões em árvore
- [ ] Sistema de temas dinâmicos
- [ ] API endpoints completos
- [ ] Middleware de proteção de rotas
- [ ] Páginas de erro e 404
