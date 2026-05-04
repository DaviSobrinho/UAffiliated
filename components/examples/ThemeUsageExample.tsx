"use client";

import { useHouse } from "@/context/HouseContext";

/**
 * Exemplo de como usar o sistema de temas no seu projeto
 *
 * O sistema de temas permite que você mude as cores do site
 * baseado na casa de aposta selecionada.
 */

export default function ThemeUsageExample() {
  const { theme, selectedHouse } = useHouse();

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-white font-bold">Exemplo de Uso do Sistema de Temas</h2>

      {/* Opção 1: Usando CSS variables diretamente */}
      <div
        style={{ backgroundColor: theme.colors.primary }}
        className="p-4 rounded-lg text-white font-bold"
      >
        Botão com cor primária da casa: {theme.name}
      </div>

      {/* Opção 2: Usando as cores do contexto */}
      <div
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
        }}
        className="p-4 rounded-lg text-white font-bold"
      >
        Gradiente com cores da casa
      </div>

      {/* Opção 3: Usando CSS variables definidas globalmente */}
      <style>{`
        .primary-bg { background-color: var(--color-primary); }
        .accent-text { color: var(--color-accent); }
        .primary-border { border: 2px solid var(--color-primary); }
      `}</style>

      <div className="primary-bg primary-border p-4 rounded-lg">
        <p className="accent-text font-bold">Este é um exemplo com CSS variables</p>
      </div>

      <div className="p-4 bg-zinc-900 rounded-lg text-zinc-400 text-sm">
        <p>Casa selecionada: <span className="text-white font-bold">{theme.name}</span></p>
        <p>Cor primária: <span style={{ color: theme.colors.primary }} className="font-mono">{theme.colors.primary}</span></p>
      </div>
    </div>
  );
}

/**
 * COMO USAR EM SEUS COMPONENTES:
 *
 * 1. Importe o hook:
 *    import { useHouse } from "@/context/HouseContext";
 *
 * 2. Use no seu componente:
 *    const { theme } = useHouse();
 *
 * 3. Acesse as cores:
 *    theme.colors.primary
 *    theme.colors.primaryLight
 *    theme.colors.primaryDark
 *    theme.colors.accent
 *    theme.colors.secondary
 *
 * 4. Ou use as CSS variables:
 *    background-color: var(--color-primary);
 *    color: var(--color-accent);
 */
