"use client"

import { useState } from "react"
import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LessonChatModal } from "./lesson-chat-modal"

interface LessonChatButtonProps {
  lessonId: string
  lessonTitle: string
  courseId: string
  courseTitle: string
}

export function LessonChatButton({ lessonId, lessonTitle, courseId, courseTitle }: LessonChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto bg-[#8b5cf6] hover:bg-[#7c3aed] text-white border-0 h-12 sm:h-11 text-base sm:text-sm"
      >
        <MessageCircle className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
        <span className="hidden sm:inline">Dúvida sobre esta aula</span>
        <span className="sm:hidden">Dúvida</span>
      </Button>

      {isOpen && (
        <LessonChatModal
          onClose={() => setIsOpen(false)}
          lessonId={lessonId}
          lessonTitle={lessonTitle}
          courseId={courseId}
          courseTitle={courseTitle}
        />
      )}
    </>
  )
}

