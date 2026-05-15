# 🔍 Debugando Travamento do Servidor

Se o servidor está travando, use este guia **passo a passo**.

## Passo 1: Rodar o servidor com logs

```bash
npm run dev
```

**O que você vai ver (sequência esperada):**

```
[NEXT-CONFIG] 🚀 Next.js config carregando...
[NEXT-CONFIG] ✅ Config carregado em XXms

[LAYOUT] 📄 App Layout module carregando...
[LAYOUT] ✓ Poppins font carregada em XXms

[PROVIDERS] 🔌 Providers carregando...
[PROVIDERS] ✓ HouseProvider importado

▲ Next.js 16.2.4 (Turbopack)
- Local:         http://localhost:3000
✓ Ready in XXXms
```

**Se travar ANTES disso aparecer:**
- Vá para **Passo 2A** (problema no build/config)

**Se travar DEPOIS de "Ready":**
- Vá para **Passo 2B** (problema em requisição)

---

## Passo 2A: Servidor não chega em "Ready"

Se você vê logs até `[PROVIDERS]` mas não chega em `Ready`, significa que está **compilando ou travou no Turbopack**.

**Teste:**
1. Abra outro terminal
2. Execute: `node health-check.js`
3. Observe se alguma requisição passa

**Se health-check retorna TIMEOUT (⏳):**
→ Servidor está compilando ou realmente travou

**Se health-check retorna ECONNREFUSED (🔴):**
→ Porta 3001 não está aberta, servidor falhou antes

---

## Passo 2B: Servidor respondeu "Ready" mas trava ao acessar

Se o servidor diz "Ready" mas depois trava ao você acessar:

**Terminal 1 (Servidor):**
```
✓ Ready in 2345ms

[REQUEST] GET /
[RESPONSE] GET / - 45ms

[REQUEST] GET /login
[RESPONSE] GET /login - 78ms

[REQUEST] GET /api/settings
[SETTINGS] 🔧 Buscando settings...
[SETTINGS] ✓ Query em 12ms
[SETTINGS] ✅ Logo URL: ... (25ms)

** AQUI TRAVA **
```

**Terminal 2 (Health Check):**
```bash
node health-check.js
```

Vai mostrar qual requisição trava (procure por `⏳ TIMEOUT`).

---

## Passo 3: Analisar os logs

### Cenário A: Trava logo no startup

```
[NEXT-CONFIG] 🚀 Next.js config carregando...
[NEXT-CONFIG] ✅ Config carregado em 234ms

** TRAVA AQUI **
```

**Culpado:** Algo no `next.config.js` ou nas dependências

---

### Cenário B: Trava ao compilar layouts

```
[LAYOUT] 📄 App Layout module carregando...
** TRAVA AQUI **
```

**Culpado:** Algo no `app/layout.tsx` ou `app/providers.tsx`

---

### Cenário C: Trava em requisição específica

```
[REQUEST] GET /api/settings
[SETTINGS] 🔧 Buscando settings...
[SETTINGS] ✓ Query em 12ms
** TRAVA AQUI (nunca chega em [SETTINGS] ✅) **
```

**Culpado:** Query ao banco está demorando/travando, ou há loop infinito na rota

---

## Passo 4: Coletar informações para debug

Quando você descobrir aonde trava, copie:

1. **Terminal do servidor (todos os logs)** ← IMPORTANTE!
2. **Output do health-check** ← mostra qual requisição trava
3. **Qual é a última linha de log que aparece antes de travar**

**Exemplo:**
```
Última linha antes de travar: [SETTINGS] ✓ Query em 12ms
Requisição que trava: GET /api/settings
Status no health-check: ⏳ TIMEOUT (2000ms)
```

---

## Passo 5: Interpretação rápida

| Situação | Causa Provável | Próximo Passo |
|----------|----------------|---------------|
| Trava no `[NEXT-CONFIG]` | Problema no next.config.js | Verificar imports/lógica em next.config.js |
| Trava no `[LAYOUT]` | Problema carregando fontes ou Providers | Verificar app/layout.tsx |
| Trava em `[SETTINGS]` | Banco de dados lento ou query infinita | Verificar conexão Neon ou query em /api/settings |
| Trava em `[HOUSES-GET]` | Banco de dados lento | Verificar /api/admin/houses |
| Trava em `[LOGIN]` | Bcryptjs ou banco lento | Verificar /api/auth/login ou banco |

---

## Script: Health Check Automático

Rode em um terminal separado enquanto testa:

```bash
node health-check.js
```

Isso vai:
- ✅ Testar requisição a cada 1 segundo
- ⏳ Mostrar TIMEOUT se servidor trava
- 📊 Mostrar taxa de sucesso

---

## 🚨 Situação: "Meu PC trava, não consigo nem parar o proceso"

Se o Node.js inteiro ficar preso:

**Windows:**
```bash
taskkill /F /IM node.exe
```

**Mac/Linux:**
```bash
pkill -9 node
```

---

## 📋 Checklist de Debug

- [ ] Rodar `npm run dev`
- [ ] Anotar até qual log chega
- [ ] Rodar `node health-check.js` em outro terminal
- [ ] Ver qual requisição trava (TIMEOUT)
- [ ] Copiar os logs completos
- [ ] Comparar com a tabela acima
- [ ] Reportar com: "Trava em [XYZ], última linha: [ABC]"
