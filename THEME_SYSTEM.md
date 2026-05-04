# Sistema de Temas Dinâmicos - UAffiliated

## Overview

O UAffiliated possui um sistema de temas dinâmicos que permite ao usuário selecionar uma casa de aposta e o tema do site muda automaticamente refletindo as cores oficiais da casa.

## Como Funciona

### Arquivos Principais

```
lib/houseThemes.ts          → Configuração de temas e cores
context/HouseContext.tsx    → Context React para gerenciar tema
components/HouseSelector.tsx → Dropdown para selecionar casa
```

## Adicionando uma Nova Casa

### 1. Adicionar nova casa em `lib/houseThemes.ts`

```typescript
export const HOUSE_THEMES: Record<string, HouseTheme> = {
  // ... casas existentes ...
  
  novahouse: {
    id: "novahouse",
    name: "Nova House",
    logo: "/novahouse.png", // A imagem deve estar em /public
    colors: {
      primary: "#FF6B00",        // Cor principal
      primaryLight: "#FF8533",   // Variação clara
      primaryDark: "#CC5600",    // Variação escura
      secondary: "#333333",      // Cor secundária
      accent: "#FFB380",         // Cor de destaque
      background: "#1a1a1a",     // Fundo
    },
  },
};
```

## Usando as Cores do Tema nos Componentes

### Opção 1: Usando o Hook `useHouse`

```tsx
import { useHouse } from "@/context/HouseContext";

export default function MeuComponente() {
  const { theme } = useHouse();

  return (
    <button style={{ backgroundColor: theme.colors.primary }}>
      Botão com cor da casa
    </button>
  );
}
```

### Opção 2: Usando CSS Variables

O contexto automaticamente define CSS variables globais que você pode usar:

```css
.meu-elemento {
  background-color: var(--color-primary);
  color: var(--color-accent);
  border: 2px solid var(--color-primary-dark);
}
```

### Opção 3: Com Tailwind (requer configuração extra)

Se você quiser usar as cores com classes Tailwind, edite `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: "var(--color-primary)",
      accent: "var(--color-accent)",
    },
  },
},
```

Então use:

```tsx
<div className="bg-primary text-accent">
  Elemento com tema dinâmico
</div>
```

## Acessando o Tema

### Hook `useHouse()`

Retorna:

```typescript
{
  selectedHouse: string;      // ID da casa selecionada (ex: "betano")
  theme: HouseTheme;          // Objeto com tema completo
  setSelectedHouse: (id: string) => void;  // Função para mudar casa
}
```

### Acessando cores do tema:

```typescript
const { theme } = useHouse();

theme.colors.primary       // Cor primária
theme.colors.primaryLight  // Cor primária clara
theme.colors.primaryDark   // Cor primária escura
theme.colors.secondary     // Cor secundária
theme.colors.accent        // Cor de destaque
theme.colors.background    // Cor de fundo
```

## Persistência

A casa selecionada é automaticamente salva em `localStorage` com a chave `selectedHouse` e carregada ao acessar novamente.

## Fluxo de Seleção de Casa

1. Usuário clica no dropdown `HouseSelector` na sidebar
2. Seleciona uma casa de aposta
3. O contexto atualiza o `selectedHouse`
4. As CSS variables globais são atualizadas automaticamente
5. A seleção é salva em localStorage
6. Todo componente que usa `useHouse()` é re-renderizado com as novas cores

## Exemplo Completo de Componente com Tema

```tsx
"use client";

import { useHouse } from "@/context/HouseContext";

export default function CartaoTema() {
  const { theme, selectedHouse } = useHouse();

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
        borderLeft: `4px solid ${theme.colors.accent}`,
      }}
      className="p-6 rounded-lg text-white"
    >
      <h3>Você está na casa: {theme.name}</h3>
      <p>Cor primária: {theme.colors.primary}</p>
    </div>
  );
}
```

## CSS Variables Disponíveis Globalmente

```css
--color-primary        /* Cor principal da casa */
--color-primary-light  /* Variação clara */
--color-primary-dark   /* Variação escura */
--color-accent         /* Cor de destaque */
```

Estes são atualizados automaticamente quando o usuário muda de casa.

## Estrutura de Cores Recomendada

Para manter consistência visual:

- **primary**: A cor principal/logo da casa
- **primaryLight**: Primary com mais claridade
- **primaryDark**: Primary com mais escuridão
- **secondary**: Cor complementar ou escura
- **accent**: Cor para destacar elementos importantes
- **background**: Fundo padrão (mantém #1a1a1a para dark theme)

## Temas Atuais

| Casa | Cor Primária | Status |
|------|---|---|
| Betano | #FFB200 | ✅ |
| Betfair | #FFBF00 | ✅ |
| Bet Nacional | #9C27B0 | ✅ |
| Esportivabet | #00A86B | ✅ |
| Estrelabet | #7C3AED | ✅ |
| Novibet | #0066FF | ✅ |
| Segurobet | #00C853 | ✅ |
| Stake | #0066FF | ✅ |
| Superbet | #00B050 | ✅ |
