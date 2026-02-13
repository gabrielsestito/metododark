import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🔍 Verificando roles dos usuários...\n")

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })

  console.log("Usuários encontrados:")
  users.forEach((user) => {
    console.log(`- ${user.name} (${user.email}): ${user.role}`)
  })

  console.log("\n✅ Roles válidos: STUDENT, ASSISTANT, ADMIN, FINANCIAL, CEO")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

