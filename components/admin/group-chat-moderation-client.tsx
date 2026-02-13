"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Trash2, 
  Ban, 
  Unlock, 
  MessageSquare, 
  Loader2, 
  X, 
  Search,
  Users,
  MessageCircle
} from "lucide-react"
import { notifyError, notifySuccess } from "@/lib/notifications"
import { CourseGroupChatModeration } from "./course-group-chat-moderation"

interface Course {
  id: string
  title: string
  slug: string
  _count: {
    enrollments: number
  }
  groupChat: {
    id: string
    _count: {
      messages: number
      bans: number
    }
    messages: Array<{
      id: string
      content: string
      createdAt: string
      sender: {
        id: string
        name: string
        email: string
      } | null
    }>
  } | null
}

interface GroupChatModerationClientProps {
  initialCourses: Course[]
}

export function GroupChatModerationClient({ initialCourses }: GroupChatModerationClientProps) {
  const { data: session } = useSession()
  const [courses, setCourses] = useState<Course[]>(initialCourses)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedCourse = courses.find(c => c.id === selectedCourseId)

  return (
    <div className="space-y-6">
      {/* Busca e Filtros */}
      <Card className="bg-[#0f0f0f] border border-white/5">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar curso..."
                className="bg-[#0a0a0a] border-white/10 text-white placeholder:text-white/40 pl-10"
              />
            </div>
            {selectedCourseId && (
              <Button
                onClick={() => setSelectedCourseId(null)}
                variant="outline"
                className="border-white/10 text-white/80 hover:bg-white/5"
              >
                <X className="h-4 w-4 mr-2" />
                Limpar Seleção
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedCourseId && selectedCourse ? (
        /* Moderação do Chat Selecionado */
        <div className="space-y-4">
          <Card className="bg-[#0f0f0f] border border-white/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-[#8b5cf6]" />
                    {selectedCourse.title}
                  </CardTitle>
                  <p className="text-sm text-white/60 mt-1">
                    {selectedCourse.groupChat?._count.messages || 0} mensagens •{" "}
                    {selectedCourse.groupChat?._count.bans || 0} banidos •{" "}
                    {selectedCourse._count.enrollments} alunos
                  </p>
                </div>
                <Button
                  onClick={() => setSelectedCourseId(null)}
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
          <CourseGroupChatModeration courseId={selectedCourseId} />
        </div>
      ) : (
        /* Lista de Cursos */
        <div className="grid gap-4">
          {filteredCourses.length === 0 ? (
            <Card className="bg-[#0f0f0f] border border-white/5">
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-white/20" />
                <p className="text-white/60">Nenhum curso encontrado</p>
              </CardContent>
            </Card>
          ) : (
            filteredCourses.map((course) => (
              <Card
                key={course.id}
                className="bg-[#0f0f0f] border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
                onClick={() => setSelectedCourseId(course.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-2">{course.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>
                            {course.groupChat?._count.messages || 0} mensagens
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Ban className="h-4 w-4" />
                          <span>
                            {course.groupChat?._count.bans || 0} banidos
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{course._count.enrollments} alunos</span>
                        </div>
                      </div>
                      {course.groupChat?.messages[0] && (
                        <p className="text-xs text-white/40 mt-2 line-clamp-1">
                          Última mensagem: {course.groupChat.messages[0].content}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                    >
                      Moderar
                      <MessageSquare className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
