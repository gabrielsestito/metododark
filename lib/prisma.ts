import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Remove prisma debug logs if DEBUG was set externally.
if (process.env.DEBUG?.includes('prisma')) {
  const cleanedDebug = process.env.DEBUG
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0 && !entry.startsWith('prisma'))
    .join(',')

  if (cleanedDebug) {
    process.env.DEBUG = cleanedDebug
  } else {
    delete process.env.DEBUG
  }
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error'],
  errorFormat: 'pretty',
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma


