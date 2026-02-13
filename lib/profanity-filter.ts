// Lista de palavras proibidas (palavrões e conteúdo inadequado)
const PROFANITY_WORDS: string[] = [
  // Palavrões comuns em português
  'caralho', 'porra', 'puta', 'puto', 'foda', 'foder', 'fodido', 'fodida',
  'merda', 'bosta', 'cacete', 'cuzão', 'cuzao', 'cuzinho', 'cuzinha',
  'viado', 'viadinho', 'bicha', 'bichinha', 'baitola', 'gayzinho', 'acasalar',
  'filho da puta', 'fdp', 'vai se foder', 'vsf', 'vtnc', 'vai tomar no cu',
  'arrombado', 'arrombada', 'desgraça', 'desgraçado',
  // Palavrões em inglês comuns
  'fuck', 'shit', 'bitch', 'asshole', 'damn', 'crap', 'piss', 'dick', 'cock',
  'pussy', 'whore', 'slut', 'bastard', 'motherfucker', 'fucker',
]

// Palavras relacionadas a pornografia
const PORNOGRAPHY_WORDS: string[] = [
  'porn', 'porno', 'pornografia', 'sexo', 'xxx', 'nsfw',
  'nude', 'nua', 'nu', 'naked', 'pelado', 'pelada',
  'hentai', 'erotico', 'erótico', 'sex', 'sexual',
]

// Combinar todas as palavras proibidas
const FORBIDDEN_WORDS: string[] = [...PROFANITY_WORDS, ...PORNOGRAPHY_WORDS]

/**
 * Verifica se o texto contém palavras proibidas
 */
export function containsProfanity(text: string): boolean {
  const normalizedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  return FORBIDDEN_WORDS.some(word => {
    const normalizedWord = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    // Verifica se a palavra está no texto (como palavra completa ou parte)
    const regex = new RegExp(`\\b${normalizedWord}\\b`, 'i')
    return regex.test(normalizedText)
  })
}

/**
 * Filtra palavras proibidas do texto
 */
export function filterProfanity(text: string): string {
  let filtered = text
  const normalizedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  FORBIDDEN_WORDS.forEach(word => {
    const normalizedWord = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const regex = new RegExp(`\\b${normalizedWord}\\b`, 'gi')
    filtered = filtered.replace(regex, '*'.repeat(word.length))
  })
  
  return filtered
}
