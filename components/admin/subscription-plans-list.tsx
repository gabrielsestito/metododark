"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus, Edit2, Trash2, Crown, CheckCircle, X } from "lucide-react"
import { SubscriptionPlanForm } from "./subscription-plan-form"
import { notifySuccess, notifyError } from "@/lib/notifications"

interface Plan {
  id: string
  name: string
  price: number
  isActive: boolean
  courses: Array<{
    courseId: string
    course?: { id: string; title: string }
  }>
}

export function SubscriptionPlansList() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/admin/subscription-plans")
      const data = await response.json()
      setPlans(data)
    } catch (error) {
      console.error("Error fetching plans:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (planId: string) => {
    if (!confirm("Tem certeza que deseja excluir este plano?")) return

    try {
      const response = await fetch(`/api/admin/subscription-plan/${planId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await notifySuccess("Sucesso", "Plano excluído com sucesso!")
        fetchPlans()
      } else {
        const data = await response.json()
        await notifyError("Erro", data.error || "Erro ao excluir plano")
      }
    } catch (error) {
      console.error("Error deleting plan:", error)
      await notifyError("Erro", "Erro ao excluir plano")
    }
  }

  const handleToggleActive = async (plan: Plan) => {
    try {
      const response = await fetch("/api/admin/subscription-plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: plan.id,
          name: plan.name,
          price: plan.price,
          isActive: !plan.isActive,
          courseIds: plan.courses.map((c) => c.courseId || c.course?.id).filter(Boolean),
        }),
      })

      if (response.ok) {
        fetchPlans()
      } else {
        const data = await response.json()
        await notifyError("Erro", data.error || "Erro ao atualizar plano")
      }
    } catch (error) {
      console.error("Error updating plan:", error)
      await notifyError("Erro", "Erro ao atualizar plano")
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingPlan(null)
    fetchPlans()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#8b5cf6]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Planos de Assinatura</h2>
        <Button
          onClick={() => {
            setEditingPlan(null)
            setShowForm(!showForm)
          }}
          className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white border-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? "Cancelar" : "Novo Plano"}
        </Button>
      </div>

      {showForm && (
        <SubscriptionPlanForm
          plan={editingPlan || undefined}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false)
            setEditingPlan(null)
          }}
        />
      )}

      <div className="grid gap-4">
        {plans.length === 0 ? (
          <Card className="bg-[#0a0a0a] border border-white/5">
            <CardContent className="p-8 text-center">
              <p className="text-white/60">Nenhum plano criado ainda.</p>
            </CardContent>
          </Card>
        ) : (
          plans.map((plan) => (
            <Card
              key={plan.id}
              className={`bg-[#0a0a0a] border ${
                plan.isActive ? "border-green-500/30" : "border-white/5"
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                      {plan.isActive ? (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/50">
                          Ativo
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-500/20 text-gray-400 border border-gray-500/50">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-black text-white">
                      R$ {plan.price.toFixed(2)}
                      <span className="text-lg text-white/60">/mês</span>
                    </p>
                    <p className="text-sm text-white/60 mt-2">
                      {plan.courses.length} curso(s) incluído(s)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingPlan(plan)
                        setShowForm(true)
                      }}
                      className="text-white/80 hover:text-white hover:bg-white/5"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(plan)}
                      className={
                        plan.isActive
                          ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                          : "text-green-400 hover:text-green-300 hover:bg-green-500/10"
                      }
                    >
                      {plan.isActive ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(plan.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {plan.courses.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-sm font-semibold text-white/80 mb-2">Cursos incluídos:</p>
                    <div className="flex flex-wrap gap-2">
                      {plan.courses.map((planCourse) => (
                        <span
                          key={planCourse.courseId || planCourse.course?.id}
                          className="px-2 py-1 rounded text-xs bg-white/5 text-white/60 border border-white/10"
                        >
                          {planCourse.course?.title || "Curso"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
