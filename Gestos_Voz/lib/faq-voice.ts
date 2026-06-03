export type FaqVoiceItem = {
  question: string
  answer: string
  keyword?: string
}

export type FaqVoiceMatch = {
  answer: string
  keyword: string
}

/** Quita tildes, signos y guiones (wi-fi → wifi). */
export function normalizarVoz(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:'"]/g, "")
    .replace(/-/g, "")
    .trim()
}

/** Texto sin espacios ni guiones: "wi fi" / "wi-fi" → "wifi". */
export function compactarVoz(texto: string): string {
  return normalizarVoz(texto).replace(/[\s_]+/g, "")
}

export function tokensDesdeTranscript(mensaje: string): string[] {
  const raw = mensaje.toLowerCase().trim()
  if (!raw) return []

  const set = new Set<string>()

  for (const parte of raw.split(/[\s\-]+/)) {
    const t = normalizarVoz(parte)
    if (t.length >= 2) set.add(t)
  }

  const compact = compactarVoz(mensaje)
  if (compact.length >= 2) set.add(compact)

  return Array.from(set)
}

function tokenCoincideClave(token: string, keyword: string): boolean {
  const t = normalizarVoz(token)
  const kw = normalizarVoz(keyword)
  if (!t || !kw) return false
  return t === kw || compactarVoz(t) === compactarVoz(kw)
}

function mensajeCoincideClave(mensaje: string, keyword: string): boolean {
  const kw = normalizarVoz(keyword)
  if (!kw) return false

  if (compactarVoz(mensaje) === kw) return true

  const tokens = tokensDesdeTranscript(mensaje)
  return tokens.some((t) => tokenCoincideClave(t, kw))
}

/** Una palabra clave por ítem (tolera wi-fi, wi fi, etc.). */
export function buscarEnFaqPorPalabraClave(
  mensajeUsuario: string,
  items: FaqVoiceItem[]
): FaqVoiceMatch | null {
  if (!mensajeUsuario.trim()) return null

  let mejor: (FaqVoiceMatch & { keywordLen: number }) | null = null

  for (const item of items) {
    const kw = normalizarVoz(item.keyword ?? "")
    if (!kw || kw.length < 2) continue

    if (!mensajeCoincideClave(mensajeUsuario, kw)) continue

    if (!mejor || kw.length > mejor.keywordLen) {
      mejor = {
        answer: item.answer,
        keyword: kw,
        keywordLen: kw.length,
      }
    }
  }

  if (!mejor) return null
  return { answer: mejor.answer, keyword: mejor.keyword }
}

export function palabrasClaveDelFaq(items: FaqVoiceItem[]): Set<string> {
  const set = new Set<string>()
  for (const item of items) {
    const kw = normalizarVoz(item.keyword ?? "")
    if (kw.length >= 2) {
      set.add(kw)
      set.add(compactarVoz(kw))
    }
  }
  return set
}

export function tokenEsPalabraClave(
  token: string,
  claves: Set<string>
): boolean {
  const t = normalizarVoz(token)
  const c = compactarVoz(token)
  return claves.has(t) || claves.has(c)
}
