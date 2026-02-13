import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { isAdminRole, getPermissions } from "@/lib/permissions"

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const permissions = getPermissions(session.user.role)
    if (!permissions.canManageCourses) {
      return NextResponse.json(
        { error: "Sem permissão para fazer upload" },
        { status: 403 }
      )
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    // Validar tipo de arquivo (aceitar PDFs, ZIPs, DOCX, TXT e genéricos)
    const allowedTypes = [
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
      "application/octet-stream",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
      "application/x-tar",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido. Use PDF, ZIP, DOCX ou TXT" },
        { status: 400 }
      )
    }

    // Validar tamanho (máximo 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Tamanho máximo: 50MB" },
        { status: 400 }
      )
    }

    // Criar diretório se não existir
    const uploadsDir = join(process.cwd(), "public", "uploads", "attachments")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const fileName = `${timestamp}_${sanitizedName}`
    const filePath = join(uploadsDir, fileName)

    // Salvar arquivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Retornar URL do arquivo
    const fileUrl = `/uploads/attachments/${fileName}`

    return NextResponse.json({ url: fileUrl, fileName: file.name })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Erro ao fazer upload do arquivo" },
      { status: 500 }
    )
  }
}
