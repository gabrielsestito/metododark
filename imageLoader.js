// Loader customizado que mantém a URL original e acrescenta width/quality
export default function imageLoader({ src, width, quality }) {
  try {
    const u = new URL(src)
    if (width) u.searchParams.set("w", String(width))
    if (quality) u.searchParams.set("q", String(quality))
    return u.toString()
  } catch {
    // Caso não seja uma URL absoluta, retorna como está
    return src
  }
}
