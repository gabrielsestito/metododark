/**
 * Script para resetar o banco de dados
 * 
 * ⚠️ ATENÇÃO: Este script vai DELETAR TODOS OS DADOS!
 * 
 * Uso: node scripts/reset-database.js
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  ATENÇÃO: Este script vai DELETAR TODOS OS DADOS do banco de dados!');
console.log('');

rl.question('Você tem certeza que deseja continuar? (digite "SIM" para confirmar): ', (answer) => {
  if (answer !== 'SIM') {
    console.log('Operação cancelada.');
    rl.close();
    process.exit(0);
  }

  console.log('');
  console.log('🔄 Resetando banco de dados...');
  console.log('');

  try {
    // 1. Aplicar migration de reset
    console.log('📦 Aplicando migration...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    // 2. Regenerar Prisma Client
    console.log('');
    console.log('🔨 Regenerando Prisma Client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('');
    console.log('✅ Banco de dados resetado com sucesso!');
    console.log('');
    console.log('Próximos passos:');
    console.log('1. Recriar usuários de teste');
    console.log('2. Recriar cursos e conteúdo');
    console.log('3. Configurar planos de assinatura');
    
  } catch (error) {
    console.error('');
    console.error('❌ Erro ao resetar banco de dados:', error.message);
    process.exit(1);
  }
  
  rl.close();
});
