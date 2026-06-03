import dns from "dns"
import mongoose from "mongoose"

dns.setDefaultResultOrder("ipv4first")

const PUBLIC_DNS = ["8.8.8.8", "1.1.1.1"]

let resolvedUri: string | null = null

async function resolveSrvUri(uri: string): Promise<string> {
  const match = uri.match(/^mongodb\+srv:\/\/([^@]+)@([^/?]+)(\/[^?]*)?(\?.*)?$/)
  if (!match) return uri

  const [, credentials, host, path = "", query = ""] = match
  const srvName = `_mongodb._tcp.${host}`

  dns.setServers(PUBLIC_DNS)
  const records = await dns.promises.resolveSrv(srvName)
  const hosts = records
    .map((r) => `${r.name.replace(/\.$/, "")}:${r.port}`)
    .join(",")

  let txtOptions = ""
  try {
    const txtRecords = await dns.promises.resolveTxt(srvName)
    txtOptions = txtRecords.map((parts) => parts.join("")).join("&")
  } catch {
    txtOptions = ""
  }

  const params = new URLSearchParams(query.replace(/^\?/, ""))
  if (txtOptions) {
    const txtParams = new URLSearchParams(txtOptions)
    txtParams.forEach((value, key) => params.set(key, value))
  }
  if (!params.has("tls")) params.set("tls", "true")

  const queryString = params.toString()
  const pathPart = path || "/"
  return `mongodb://${credentials}@${hosts}${pathPart}${queryString ? `?${queryString}` : "?tls=true"}`
}

async function getMongoUri(): Promise<string> {
  if (resolvedUri) return resolvedUri

  const uri = (process.env.MONGODB_URI || process.env.MONGO_URI || "").trim()
  if (!uri) {
    throw new Error("Define MONGO_URI o MONGODB_URI en .env.local")
  }

  resolvedUri = uri.startsWith("mongodb+srv://") ? await resolveSrvUri(uri) : uri
  return resolvedUri
}

let cached = (global as typeof globalThis & {
  mongoose?: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  }
}).mongoose

if (!cached) {
  cached = (global as typeof globalThis & {
    mongoose: {
      conn: typeof mongoose | null
      promise: Promise<typeof mongoose> | null
    }
  }).mongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (cached!.conn) {
    return cached!.conn
  }

  if (!cached!.promise) {
    const uri = await getMongoUri()
    cached!.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        family: 4,
        serverSelectionTimeoutMS: 10000,
      })
      .then((instance) => instance)
  }

  cached!.conn = await cached!.promise
  return cached!.conn
}

export default connectDB
