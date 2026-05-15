# 📊 Guia de Logs - UAffiliated

Quando você rodar `npm run dev`, os logs mostrarão exatamente o que está acontecendo no servidor. Use este guia para entender os logs.

## Sequência Esperada de Logs no Startup

```
[SERVER] ▲ Next.js iniciando...
[REQUEST] GET / 
[RESPONSE] GET / - 45ms

[REQUEST] GET /api/settings
[SETTINGS] 🔧 Buscando settings...
[SETTINGS] ✓ Query em 12ms
[SETTINGS] ✅ Logo URL: /uaffiliatedwide.png (25ms)
[RESPONSE] GET /api/settings - 30ms

[HouseSelector] ⏰ Timer iniciado (fetch em 500ms)
[REQUEST] GET /login
[RESPONSE] GET /login - 85ms

[HouseSelector] 🏠 Iniciando fetch de casas (com delay de 500ms)...
[REQUEST] GET /api/admin/houses
[HOUSES-GET] 🏠 Buscando casas...
[HOUSES-GET] ✓ Query em 18ms, encontradas 9 casas
[HOUSES-GET] ✅ Retornando 9 casas (22ms)
[RESPONSE] GET /api/admin/houses - 25ms
[HouseSelector] ✅ Casas carregadas: 9 casas em 26ms
```

## Códigos de Logs

### Login
| Código | Significado |
|--------|------------|
| `[LOGIN] 🔐 Iniciando login...` | Começou tentativa de login |
| `[LOGIN] 🔍 Buscando usuário no banco...` | Consultando banco de dados |
| `[LOGIN] ✓ Query de usuário em XXms` | Query executada com sucesso |
| `[LOGIN] ✓ Usuário encontrado: ...` | Usuário existe no banco |
| `[LOGIN] ❌ Usuário não encontrado` | Email não existe (401) |
| `[LOGIN] ✓ Senha validada` | Senha correta |
| `[LOGIN] ❌ Senha inválida` | Senha incorreta (401) |
| `[LOGIN] ✅ Login bem-sucedido em XXms` | ✅ Login funcionou |
| `[LOGIN] 💥 ERRO após XXms: ...` | ❌ Erro no servidor (500) |

### Settings (Logo)
| Código | Significado |
|--------|------------|
| `[SETTINGS] 🔧 Buscando settings...` | Iniciou busca de configurações |
| `[SETTINGS] ✓ Query em XXms` | Query ao banco executada |
| `[SETTINGS] 📝 Criando settings padrão...` | Settings não existe, criando |
| `[SETTINGS] ✅ Logo URL: ...` | ✅ Logo recuperada com sucesso |

### Houses
| Código | Significado |
|--------|------------|
| `[HOUSES-GET] 🏠 Buscando casas...` | Iniciou busca de casas |
| `[HOUSES-GET] ✓ Query em XXms, encontradas Nnn casas` | Query bem-sucedida |
| `[HOUSES-GET] ✅ Retornando N casas (XXms)` | ✅ Casas retornadas |

### HouseSelector
| Código | Significado |
|--------|------------|
| `[HouseSelector] ⏰ Timer iniciado (fetch em 500ms)` | Delay de 500ms iniciado |
| `[HouseSelector] 🏠 Iniciando fetch de casas...` | Começou fetch das casas |
| `[HouseSelector] 📡 Response status: 200, duração: XXms` | API respondeu |
| `[HouseSelector] ✅ Casas carregadas: N casas em XXms` | ✅ Casas carregadas no cliente |
| `[HouseSelector] ❌ Erro na resposta: 403/401/500` | ❌ Erro da API |
| `[HouseSelector] 💥 Erro ao buscar casas: ...` | ❌ Erro de rede |

### Middleware
| Código | Significado |
|--------|------------|
| `[REQUEST] METHOD /path` | Requisição chegou |
| `[RESPONSE] METHOD /path - XXms` | ✅ Requisição completada |
| `⚠️  [SLOW] METHOD /path - XXms` | ⚠️ Requisição demorou mais de 1s |

---

## Procurando Problemas

### Problema: Erro 403 no Login
Procure por:
- `[LOGIN] ❌` → Check email/senha
- `[RESPONSE] ... - 403` → Middleware bloqueando
- Verifique se há `[SETTINGS]` antes do login tentar

### Problema: Casas não carregando (timeout)
Procure por:
- `[HOUSES-GET] 💥 ERRO` → Erro no banco
- `[REQUEST] GET /api/admin/houses` sem `[RESPONSE]` → Travou
- `[HouseSelector] 💥 Erro ao buscar casas` → Erro de rede

### Problema: PC travando no startup
Procure por:
- Múltiplas requisições simultâneas sem timing entre elas
- Queries ao banco que demoram > 2s
- `[SLOW]` warnings para a mesma rota repetidamente

### Problema: "Cannot read properties of undefined"
Procure por:
- Qual rota está causando erro (veja qual `[REQUEST]` não tem `[RESPONSE]`)
- Errors começando com `[...] 💥`
- Procure a stack trace após os logs

---

## Enviando Logs para Debug

Quando o servidor travar ou der erro:
1. **Copie TODOS os logs do console**
2. **Cole aqui**: Mostra exatamente onde começou o problema
3. Procure por `💥` ou `❌` - aí está o problema

---

## Otimizando Performance

Se vir `⚠️  [SLOW]`:
- `[SLOW] GET /api/admin/houses - 5000ms` → Banco está lento
- `[SLOW] GET / - 2000ms` → Layout está pesado
- `[SLOW] POST /api/auth/login - 3000ms` → Hash de senha demorando

Tempo esperado:
- ✅ Requisições normais: < 100ms
- ✅ Queries ao banco: < 50ms
- ⚠️ Aceitável: < 1000ms
- 🔴 Lento: > 1000ms
