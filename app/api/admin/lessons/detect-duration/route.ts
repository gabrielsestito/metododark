import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { videoUrl: rawVideoUrl } = await req.json()
    let videoUrl: string = rawVideoUrl

    if (!videoUrl || typeof videoUrl !== "string") {
      return NextResponse.json(
        { error: "URL do vídeo não fornecida" },
        { status: 400 }
      )
    }

    // Se recebeu código de embed, extrair o src
    if (videoUrl.trim().startsWith("<iframe")) {
      const match = videoUrl.match(/src=["']([^"']+)["']/i)
      videoUrl = match?.[1] || ""
    }

    // Normalizar URL do YouTube (m., shorts, embed)
    const isYouTubeUrl =
      videoUrl.includes("youtube.com") ||
      videoUrl.includes("youtu.be") ||
      videoUrl.includes("m.youtube.com") ||
      videoUrl.includes("youtube.com/shorts")

    // YouTube
    if (isYouTubeUrl) {
      // Tentativa robusta para extrair o ID (11 caracteres)
      const idRegex = /(?:v=|\/)([0-9A-Za-z_-]{11})/
      const shortsRegex = /shorts\/([0-9A-Za-z_-]{11})/
      const embedRegex = /embed\/([0-9A-Za-z_-]{11})/

      let videoId =
        videoUrl.match(idRegex)?.[1] ||
        videoUrl.match(shortsRegex)?.[1] ||
        videoUrl.match(embedRegex)?.[1] ||
        ""
      
      if (videoId) {
        // Tentar usar get_video_info do YouTube (método mais confiável)
        try {
          const response = await fetch(`https://www.youtube.com/get_video_info?video_id=${videoId}&el=detailpage`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          })
          
          if (response.ok) {
            const text = await response.text()
            // Tentar extrair duração de múltiplas formas
            let durationMatch = text.match(/length_seconds["\s]*[:=]["\s]*(\d+)/)
            if (!durationMatch) {
              durationMatch = text.match(/length_seconds=(\d+)/)
            }
            if (!durationMatch) {
              // Tentar extrair do formato JSON se disponível
              const jsonMatch = text.match(/"length_seconds":\s*(\d+)/)
              if (jsonMatch) {
                durationMatch = jsonMatch
              }
            }
            
            if (durationMatch && durationMatch[1]) {
              const duration = parseInt(durationMatch[1])
              if (duration > 0) {
                return NextResponse.json({ duration })
              }
            }
          }
        } catch (e) {
          console.error("YouTube get_video_info error:", e)
        }
        
        // Fallback: carregar página watch e extrair lengthSeconds ou approxDurationMs
        try {
          const watchUrl = `https://www.youtube.com/watch?v=${videoId}`
          const watchResponse = await fetch(watchUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            }
          })
          if (watchResponse.ok) {
            const html = await watchResponse.text()
            let match = html.match(/"lengthSeconds":"(\d+)"/)
            if (!match) {
              const approxMs = html.match(/"approxDurationMs":"(\d+)"/)
              if (approxMs && approxMs[1]) {
                const seconds = Math.floor(parseInt(approxMs[1], 10) / 1000)
                if (seconds > 0) {
                  return NextResponse.json({ duration: seconds })
                }
              }
            } else if (match[1]) {
              const seconds = parseInt(match[1], 10)
              if (seconds > 0) {
                return NextResponse.json({ duration: seconds })
              }
            }
          }
        } catch (e) {
          console.error("YouTube watch page parse error:", e)
        }
      }
    }
    
    // Vimeo
    if (videoUrl.includes('vimeo.com')) {
      const vimeoId = videoUrl.match(/vimeo\.com\/(\d+)/)?.[1] || 
                      videoUrl.match(/vimeo\.com\/.*\/(\d+)/)?.[1] ||
                      videoUrl.match(/player\.vimeo\.com\/video\/(\d+)/)?.[1]
      
      if (vimeoId) {
        try {
          const response = await fetch(`https://vimeo.com/api/v2/video/${vimeoId}.json`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          })
          if (response.ok) {
            const data = await response.json()
            if (data[0]?.duration) {
              return NextResponse.json({ duration: Math.floor(data[0].duration) })
            }
          }
        } catch (e) {
          console.error("Vimeo API error:", e)
        }
      }
    }

    // Para outros vídeos (URLs diretas), não podemos detectar no servidor
    // Retornar erro informando que precisa ser feito manualmente
    return NextResponse.json(
      { error: "Não foi possível detectar a duração automaticamente. Por favor, insira manualmente." },
      { status: 400 }
    )
  } catch (error: any) {
    console.error("Error detecting video duration:", error)
    return NextResponse.json(
      { error: "Erro ao detectar duração do vídeo" },
      { status: 500 }
    )
  }
}
