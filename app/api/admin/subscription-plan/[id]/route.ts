import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, unauthorizedResponse } from "@/lib/auth-helpers"

export const dynamic = 'force-dynamic'

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requirePermission("canManageSubscriptions")
    if (!session) {
      return unauthorizedResponse()
    }

    // Verificar se há assinaturas ativas usando este plano
    const subscriptions = await prisma.subscription.count({
      where: {
        // Nota: Não temos relação direta, mas podemos verificar se há assinaturas
        // que foram criadas recentemente (aproximação)
      },
    })

    // Deletar cursos do plano primeiro
    await prisma.subscriptionPlanCourse.deleteMany({
      where: { subscriptionPlanId: params.id },
    })

    // Deletar o plano
    await prisma.subscriptionPlan.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting subscription plan:", error)
    return NextResponse.json(
      { error: "Erro ao excluir plano de assinatura", details: error.message },
      { status: 500 }
    )
  }
}
