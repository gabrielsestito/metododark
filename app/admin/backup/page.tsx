"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Download, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { getPermissions } from "@/lib/permissions"

export default function BackupPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; filename?: string } | null>(null)

  if (status === "loading") {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#8b5cf6]" />
    </div>
  }

  if (!session?.user) {
    redirect("/login")
  }

  const permissions = getPermissions(session.user.role)
  if (!permissions.canBackupDatabase) {
    redirect("/admin")
  }

  const handleBackup = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/backup", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        setResult({
          success: false,
          message: errorData.error || "Erro ao criar backup",
        })
        return
      }

      // Obter o nome do arquivo do header
      const contentDisposition = response.headers.get("content-disposition")
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : `backup_${new Date().toISOString().split("T")[0]}.${response.headers.get("content-type")?.includes("json") ? "json" : "sql"}`

      // Criar blob e fazer download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setResult({
        success: true,
        message: "Backup criado e baixado com sucesso!",
        filename: filename,
      })
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "Erro ao criar backup",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8 px-4 lg:px-8">
      <div className="container mx-auto max-w-2xl">
        <Card className="bg-[#0f0f0f] border border-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6 text-[#8b5cf6]" />
              Backup do Banco de Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-sm text-yellow-400">
                <strong>Atenção:</strong> Esta ação criará um backup completo do banco de dados. 
                O arquivo será salvo no servidor.
              </p>
            </div>

            {result && (
              <div className={`p-4 rounded-lg border ${
                result.success 
                  ? "bg-green-500/10 border-green-500/30" 
                  : "bg-red-500/10 border-red-500/30"
              }`}>
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-semibold ${
                      result.success ? "text-green-400" : "text-red-400"
                    }`}>
                      {result.success ? "Sucesso!" : "Erro"}
                    </p>
                    <p className="text-sm text-white/80 mt-1">{result.message}</p>
                    {result.success && result.filename && (
                      <p className="text-xs text-white/60 mt-2">
                        Arquivo: {result.filename}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleBackup}
              disabled={loading}
              className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando backup...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Criar Backup
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

