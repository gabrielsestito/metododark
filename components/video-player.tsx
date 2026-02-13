"use client"

interface VideoPlayerProps {
  videoUrl: string
  className?: string
}

export function VideoPlayer({ videoUrl, className = "" }: VideoPlayerProps) {
  if (!videoUrl) {
    return null
  }

  const getYouTubeEmbedUrl = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([0-9A-Za-z_-]{11})/,
      /youtube\.com\/.*[?&]v=([0-9A-Za-z_-]{11})/,
      /youtube\.com\/shorts\/([0-9A-Za-z_-]{11})/,
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`
      }
    }
    return null
  }

  const getVimeoEmbedUrl = (url: string): string | null => {
    const patterns = [/vimeo\.com\/(\d+)/, /vimeo\.com\/.*\/(\d+)/, /player\.vimeo\.com\/video\/(\d+)/]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return `https://player.vimeo.com/video/${match[1]}`
      }
    }
    return null
  }

  const youtubeEmbedUrl = getYouTubeEmbedUrl(videoUrl)
  if (youtubeEmbedUrl) {
    return (
      <iframe
        src={youtubeEmbedUrl}
        className={`${className} w-full h-full`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ border: 0 }}
        title="YouTube player"
      />
    )
  }

  const vimeoEmbedUrl = getVimeoEmbedUrl(videoUrl)
  if (vimeoEmbedUrl) {
    return (
      <iframe
        src={vimeoEmbedUrl}
        className={`${className} w-full h-full`}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        style={{ border: 0 }}
        title="Vimeo player"
      />
    )
  }

  return (
    <video src={videoUrl} controls className={`${className} w-full h-full`} playsInline />
  )
}
