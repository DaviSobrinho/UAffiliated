# Plano de Reorganização - Estrutura de Módulos

## Estrutura Proposta

```
src/                          ← Novo root para source code
├── modules/                   ← Módulos da aplicação (feature-driven)
│   ├── auth/
│   │   ├── api/
│   │   │   ├── login.route.ts
│   │   │   └── register.route.ts
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── lib/
│   │   │   └── auth.ts
│   │   └── types/
│   │       └── auth.types.ts
│   │
│   ├── users/
│   │   ├── api/
│   │   │   ├── [userId]/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── team-stats/
│   │   │   │   └── house-data/
│   │   │   ├── me/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── performance-summary/
│   │   │   │   ├── charts/
│   │   │   │   ├── team/
│   │   │   │   └── referral/
│   │   │   ├── search/route.ts
│   │   │   └── view-as/[userId]/
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardHeader.tsx
│   │   │   │   ├── MinhaPerformance.tsx
│   │   │   │   ├── PerformanceEquipe.tsx
│   │   │   │   ├── TotalPerformance.tsx
│   │   │   │   ├── ChartsSection.tsx
│   │   │   │   ├── AffiliateLinksSection.tsx
│   │   │   │   ├── AffiliateFilter.tsx
│   │   │   │   ├── InfoBox.tsx
│   │   │   │   └── ReferralDialog.tsx
│   │   │   └── team/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── team/page.tsx
│   │   │   └── [userId]/dashboard/page.tsx
│   │   └── types/
│   │
│   ├── admin/
│   │   ├── api/
│   │   │   ├── houses/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   └── users/
│   │   │       ├── route.ts
│   │   │       └── [userId]/
│   │   ├── components/
│   │   │   ├── AdminUserModal.tsx
│   │   │   ├── AdminEditSnapshotModal.tsx
│   │   │   └── HousesList.tsx
│   │   ├── pages/
│   │   │   ├── page.tsx
│   │   │   └── houses/page.tsx
│   │   ├── hooks/
│   │   └── lib/
│   │
│   ├── houses/
│   │   ├── api/
│   │   │   └── settings/route.ts
│   │   ├── components/
│   │   │   ├── HouseSelector.tsx
│   │   │   ├── StatelessHouseSelector.tsx
│   │   │   └── LocalHouseSelector.tsx
│   │   ├── context/
│   │   │   ├── HouseContext.tsx
│   │   │   └── useHouse.ts
│   │   ├── lib/
│   │   │   ├── house-utils.ts
│   │   │   ├── houseThemes.ts
│   │   │   └── house.types.ts
│   │   └── types/
│   │
│   └── affiliates/
│       ├── lib/
│       │   ├── affiliate-utils.ts
│       │   ├── hierarchy.ts
│       │   └── commission.ts
│       └── types/
│
├── shared/                    ← Componentes e utilitários compartilhados
│   ├── components/
│   │   ├── common/
│   │   │   ├── Toast.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── Skeleton.tsx
│   │   ├── ui/
│   │   │   ├── inputs/
│   │   │   │   ├── CurrencyInput.tsx
│   │   │   │   ├── CustomSelect.tsx
│   │   │   │   └── TimeframeSelector.tsx
│   │   │   ├── cards/
│   │   │   │   ├── AnimatedCard.tsx
│   │   │   │   ├── ChartCard.tsx
│   │   │   │   └── BalanceCard.tsx
│   │   │   ├── charts/
│   │   │   │   └── Charts.tsx
│   │   │   └── buttons/
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── SidebarBottom.tsx
│   │   │   ├── MobileHeader.tsx
│   │   │   └── MobileDrawerBottom.tsx
│   │   └── loaders/
│   │       └── Skeleton.tsx
│   ├── hooks/
│   │   ├── useBalance.ts
│   │   └── useLocalStorage.ts
│   ├── lib/
│   │   ├── logger.ts
│   │   └── r2.ts
│   ├── context/
│   │   ├── BalanceContext.tsx
│   │   ├── LogoContext.tsx
│   │   └── providers.tsx
│   ├── types/
│   │   └── common.types.ts
│   └── constants/
│       └── config.ts
│
├── app/                       ← App Router (mínimo possível)
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── providers.tsx (aponta para src/shared/context/providers.tsx)
│
├── lib/                       ← Utilities globais (manutenção)
│   ├── prisma.ts
│   └── auth.ts → src/modules/auth/lib/auth.ts
│
└── context/                   ← Contexts globais (manutenção)
    ├── HouseContext.tsx → src/modules/houses/context/HouseContext.tsx
    ├── BalanceContext.tsx → src/modules/auth/context/BalanceContext.tsx
    └── LogoContext.tsx → src/shared/context/LogoContext.tsx
```

## Benefícios

✅ **Modular**: Cada feature é um módulo independente
✅ **Escalável**: Fácil adicionar novos módulos
✅ **Organizado**: Componentes, API, hooks, types juntos por feature
✅ **Compartilhado**: `shared/` centraliza UI e utilitários globais
✅ **Isolado**: Mudanças em um módulo não afetam outros

## Fase 1: Preparação
- [x] Deletar arquivos de debug
- [x] Limpar console.log
- [ ] Criar estrutura `src/`
- [ ] Criar pastas de módulos

## Fase 2: Migração
- [ ] Mover `components/` → `src/shared/components/`
- [ ] Mover `context/` → `src/shared/context/` + `src/modules/*/context/`
- [ ] Mover `lib/` → `src/shared/lib/` + `src/modules/*/lib/`
- [ ] Mover `app/api/` → `src/modules/*/api/`
- [ ] Mover `app/*.tsx` → `src/modules/*/pages/`

## Fase 3: Atualização de Imports
- [ ] Atualizar todos os imports
- [ ] Verificar compilação
- [ ] Testar aplicação

