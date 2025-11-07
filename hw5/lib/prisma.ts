import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
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
  if (error.message.includes('Can\'t reach database server')) {
    console.error(
      '\n⚠️  數據庫連接失敗！\n' +
      '請檢查以下幾點：\n' +
      '1. 確認 .env.local 中的 DATABASE_URL 是否正確\n' +
      '2. 如果使用 Neon，請確認數據庫是否已激活（免費版會自動暫停）\n' +
      '3. 檢查網絡連接是否正常\n' +
      '4. 確認數據庫服務器是否正在運行\n'
    );
  }
});

