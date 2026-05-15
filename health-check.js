#!/usr/bin/env node

/**
 * Health Check Script
 *
 * Execute em outro terminal enquanto o servidor está rodando:
 * node health-check.js
 *
 * Vai verificar a cada segundo se o servidor está respondendo
 */

const http = require("http");

const PORT = process.env.PORT || 3000;
const CHECK_INTERVAL = 1000; // 1 segundo

let checkCount = 0;
let successCount = 0;
let errorCount = 0;

console.log(`\n🏥 Health Check iniciado para http://localhost:${PORT}`);
console.log(`⏱️  Verificando a cada ${CHECK_INTERVAL}ms\n`);
console.log("Pressione Ctrl+C para parar\n");

function healthCheck() {
  checkCount++;
  const timestamp = new Date().toISOString();

  const req = http.get(
    `http://localhost:${PORT}/api/settings`,
    { timeout: 2000 },
    (res) => {
      successCount++;
      const status = res.statusCode;
      const statusEmoji = status === 200 ? "✅" : "⚠️ ";
      console.log(
        `[${timestamp}] ${statusEmoji} Check #${checkCount} - Status ${status} (✓ ${successCount}/${checkCount})`
      );
    }
  );

  req.on("error", (err) => {
    errorCount++;
    const emoji = err.code === "ECONNREFUSED" ? "🔴" : "⚠️ ";
    console.log(
      `[${timestamp}] ${emoji} Check #${checkCount} - ERRO: ${err.code} (✗ ${errorCount}/${checkCount})`
    );

    if (err.code === "ECONNREFUSED") {
      console.log("    → Servidor NÃO está respondendo (porta 3001 fechada)");
    } else if (err.code === "ETIMEDOUT") {
      console.log("    → Servidor TRAVOU (timeout na requisição)");
    }
  });

  req.on("timeout", () => {
    errorCount++;
    console.log(
      `[${timestamp}] ⏳ Check #${checkCount} - TIMEOUT (servidor não respondeu em 2s)`
    );
    req.destroy();
  });
}

// Primeira verificação imediata
healthCheck();

// Verificações subsequentes
const interval = setInterval(healthCheck, CHECK_INTERVAL);

// Graceful shutdown
process.on("SIGINT", () => {
  clearInterval(interval);
  const successRate = ((successCount / checkCount) * 100).toFixed(1);
  console.log(`\n\n📊 Resultado Final:`);
  console.log(`   Total de checks: ${checkCount}`);
  console.log(`   ✅ Sucessos: ${successCount}`);
  console.log(`   ❌ Erros: ${errorCount}`);
  console.log(`   📈 Taxa de sucesso: ${successRate}%`);
  console.log(`\n👋 Health check encerrado\n`);
  process.exit(0);
});
