import { fetchWithAuth } from "@/lib/fetch-auth"
import { resolveTotemMediaField } from "@/lib/totem-media-fields"
import {
  CHUNK_UPLOAD_SIZE_BYTES,
  formatMaxChunkedMediaSizeMessage,
  formatMaxMediaSizeMessage,
  isMediaWithinChunkedLimit,
  isMediaWithinDirectLimit,
  needsChunkedUpload,
} from "@/lib/upload-limits"

export type ClientTotemArchivoRef = {
  slot: string
  tipo: string
  contentId: string
}

async function uploadTotemMediaDirect(
  file: File,
  field: { slot: string; tipo: string },
  nombreTotem: string
): Promise<ClientTotemArchivoRef> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("slot", field.slot)
  formData.append("nombreTotem", nombreTotem)

  const response = await fetchWithAuth("/api/contents/upload", {
    method: "POST",
    body: formData,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "error" in data
        ? String((data as { error: string }).error)
        : response.status === 413
          ? formatMaxMediaSizeMessage()
          : "No se pudo subir el archivo."
    throw new Error(message)
  }

  return parseUploadResponse(data)
}

async function uploadTotemMediaChunked(
  file: File,
  field: { slot: string; tipo: string },
  nombreTotem: string
): Promise<ClientTotemArchivoRef> {
  const uploadId = crypto.randomUUID()
  const totalChunks = Math.ceil(file.size / CHUNK_UPLOAD_SIZE_BYTES)

  for (let index = 0; index < totalChunks; index += 1) {
    const start = index * CHUNK_UPLOAD_SIZE_BYTES
    const end = Math.min(start + CHUNK_UPLOAD_SIZE_BYTES, file.size)
    const chunkBlob = file.slice(start, end)

    const formData = new FormData()
    formData.append("chunk", chunkBlob, `${file.name}.part${index}`)
    formData.append("uploadId", uploadId)
    formData.append("index", String(index))
    formData.append("totalChunks", String(totalChunks))
    formData.append("fileName", file.name)
    formData.append("contentType", file.type || "application/octet-stream")
    formData.append("slot", field.slot)
    formData.append("nombreTotem", nombreTotem)
    formData.append("fileSize", String(file.size))

    const response = await fetchWithAuth("/api/contents/upload-chunk", {
      method: "POST",
      body: formData,
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      const message =
        typeof data === "object" && data && "error" in data
          ? String((data as { error: string }).error)
          : response.status === 413
            ? formatMaxChunkedMediaSizeMessage()
            : `No se pudo subir la parte ${index + 1} de ${totalChunks}.`
      throw new Error(message)
    }
  }

  const response = await fetchWithAuth("/api/contents/upload-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uploadId }),
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      typeof data === "object" && data && "error" in data
        ? String((data as { error: string }).error)
        : "No se pudo finalizar la subida del archivo."
    throw new Error(message)
  }

  return parseUploadResponse(data)
}

function parseUploadResponse(data: unknown): ClientTotemArchivoRef {
  if (
    !data ||
    typeof data !== "object" ||
    !("contentId" in data) ||
    !("slot" in data) ||
    !("tipo" in data)
  ) {
    throw new Error("Respuesta inválida al subir el archivo.")
  }

  return {
    contentId: String((data as { contentId: string }).contentId),
    slot: String((data as { slot: string }).slot),
    tipo: String((data as { tipo: string }).tipo),
  }
}

export async function uploadTotemMediaFileClient(
  file: File,
  formKey: string,
  nombreTotem: string
): Promise<ClientTotemArchivoRef> {
  if (!isMediaWithinChunkedLimit(file.size)) {
    throw new Error(formatMaxChunkedMediaSizeMessage())
  }

  const field = resolveTotemMediaField(formKey)
  if (!field) {
    throw new Error("Archivo de tótem no reconocido.")
  }

  if (needsChunkedUpload(file.size)) {
    return uploadTotemMediaChunked(file, field, nombreTotem)
  }

  if (!isMediaWithinDirectLimit(file.size)) {
    throw new Error(formatMaxMediaSizeMessage())
  }

  return uploadTotemMediaDirect(file, field, nombreTotem)
}

export async function uploadTotemMediaBatch(
  files: Array<{ formKey: string; file: File }>,
  nombreTotem: string,
  onProgress?: (label: string) => void
): Promise<ClientTotemArchivoRef[]> {
  const archivos: ClientTotemArchivoRef[] = []

  for (let i = 0; i < files.length; i += 1) {
    const item = files[i]
    const kind = item.formKey.startsWith("video") ? "video" : "imagen"
    onProgress?.(`Subiendo ${kind} ${i + 1} de ${files.length}…`)
    const uploaded = await uploadTotemMediaFileClient(
      item.file,
      item.formKey,
      nombreTotem
    )
    archivos.push(uploaded)
  }

  return archivos
}
