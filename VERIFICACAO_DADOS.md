# ✅ Verificação de Dados no Banco

Siga **exatamente** essa sequência para garantir que os dados estão corretos.

## 🔧 Passo 1: Auditoria Completa do Banco

```bash
node audit-database.js
```

Esse script vai mostrar:
- ✓ Quantos usuários existem
- ✓ Quantas casas existem
- ✓ Quantos registros de UserHouseData existem
- ✓ Quantos snapshots diários existem
- ✓ Distribuição de dados por casa
- ✓ Amostra de dados

**Procure por:**
- `❌ NENHUM REGISTRO DE UserHouseData!` → Execute `npm run prisma:seed`
- `❌ NENHUM SNAPSHOT NO BANCO!` → Execute `npm run prisma:seed`
- `✅ TUDO OK! Banco tem dados completos` → Passe pro Passo 2

---

## 🔍 Passo 2: Verificação Passo a Passo

```bash
node verify-and-fix.js
```

Esse script vai fazer 7 verificações:

1. **Contar dados** - Mostra totais
2. **Verificar Admin** - Confirma que admin@example.com existe
3. **Verificar Betano** - Confirma que casa Betano existe
4. **Dados do Admin em Betano** - Verifica CPA e registros
5. **Snapshots do Admin** - Mostra últimos 3 snapshots
6. **Validar cálculos** - Calcula comissão esperada
7. **Dados de affiliados** - Verifica se affiliados têm dados

**Se todos passarem com ✅:**
- Passe pro Passo 3
- Dados estão corretos no banco

**Se algum falhar com ❌:**
- Execute: `npm run prisma:seed`
- Depois rode o verify de novo

---

## 🚀 Passo 3: Iniciar Servidor e Testar

Agora você pode iniciar o servidor com confiança:

```bash
npm run dev
```

Em outro terminal, rode o health-check:

```bash
node health-check.js
```

**Acesse o navegador:**
- http://localhost:3000/login
- Email: `admin@example.com`
- Senha: `admin123`

**Procure por:**
- Dashboard carregando dados
- "Registros: N" (não zero)
- "FTDs: N" (não zero)
- "QFTDs: N" (não zero)
- "Comissão: R$ X,XX" (não zero)

---

## 📊 Interpretando a Auditoria

### Exemplo de Auditoria OK:

```
👤 USUÁRIOS:
   Total: 49
   Admin, 3 N2 users, 9 N3 users, 18 N4 users, 18 N5 users

🏠 CASAS DE APOSTAS:
   Total: 9
   Betano, Betfair, Novibet, etc.

🔗 DADOS DE USUÁRIO POR CASA:
   Total: 98 (49 users × 2 houses)
   ✓ Distribuição por casa: 49 em Betano, 49 em Novibet

📊 SNAPSHOTS DIÁRIOS:
   Total: 2,880
   ✓ Estatísticas mostram valores > 0
   ✓ Range de datas: últimos 30 dias
```

### Exemplo de Auditoria COM PROBLEMAS:

```
🔗 DADOS DE USUÁRIO POR CASA:
   Total: 0  ❌ NENHUM REGISTRO!

📊 SNAPSHOTS DIÁRIOS:
   Total: 0  ❌ NENHUM SNAPSHOT!
```

→ Execute: `npm run prisma:seed`

---

## 🧪 Testes Rápidos

### Teste 1: Verificar se Admin tem dados

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findFirst({ where: { email: 'admin@example.com' } }).then(u => {
  if (u) {
    prisma.userHouseData.count({ where: { userId: u.id } }).then(c => {
      console.log('Admin UserHouseData records:', c);
      process.exit(0);
    });
  } else {
    console.log('Admin not found');
    process.exit(1);
  }
});
"
```

### Teste 2: Contar snapshots

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.dailySnapshot.count().then(c => {
  console.log('Total snapshots:', c);
  process.exit(0);
});
"
```

### Teste 3: Listar todos os usuários

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany({ select: { name: true, email: true, role: true } }).then(users => {
  users.forEach(u => console.log(u.name, '-', u.email, '-', u.role));
  process.exit(0);
});
"
```

---

## 🆘 Se Ainda Não Funcionar

1. **Execute a auditoria:**
   ```bash
   node audit-database.js > audit-output.txt
   ```

2. **Copie o output inteiro**

3. **Procure por:**
   - `❌` ou `⚠️` 
   - Qualquer valor que seja 0

4. **Se `UserHouseData` or `DailySnapshots` for 0:**
   ```bash
   npm run prisma:seed
   ```

5. **Se mesmo depois disso não funcionar:**
   - Rode o `verify-and-fix.js` de novo
   - Cole a mensagem de erro aqui

---

## ✅ Checklist Final

- [ ] `audit-database.js` mostra dados > 0 em tudo
- [ ] `verify-and-fix.js` passa em todos os 7 testes
- [ ] `npm run dev` inicia sem erros
- [ ] Dashboard carrega sem erro 404
- [ ] Dashboard mostra valores (não zero)
- [ ] HouseSelector carrega as casas
- [ ] Login funciona com admin@example.com / admin123
