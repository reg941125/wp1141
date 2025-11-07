import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  // Parse DATABASE_URL to add connection pool settings if needed
  const databaseUrl = process.env.DATABASE_URL;
  
  // For Vercel/Neon, ensure we use connection pooling
  // Add connection_limit and connect_timeout if not present
  let finalDatabaseUrl = databaseUrl;
  
  if (databaseUrl && !databaseUrl.includes('connection_limit')) {
    const url = new URL(databaseUrl);
    url.searchParams.set('connection_limit', '10');
    url.searchParams.set('connect_timeout', '10');
    url.searchParams.set('pool_timeout', '10');
    finalDatabaseUrl = url.toString();
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: finalDatabaseUrl,
      },
    },
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Handle connection errors gracefully
prisma.$connect().catch((error) => {
  console.error('Prisma connection error:', error.message);
  if (error.message.includes('Can\'t reach database server') || error.code === 'P1002') {
    console.error(
      '\n⚠️  數據庫連接失敗！\n' +
      '請檢查以下幾點：\n' +
      '1. 確認 .env.local 中的 DATABASE_URL 是否正確\n' +
      '2. 如果使用 Neon，請使用 Connection Pooling 模式的連接字符串\n' +
      '3. 確認數據庫是否已激活（免費版會自動暫停）\n' +
      '4. 檢查網絡連接是否正常\n' +
      '5. 確認數據庫服務器是否正在運行\n' +
      '6. 如果使用 Vercel，請確認環境變數 DATABASE_URL 已正確設置\n'
    );
  }
});

