import crypto from "crypto"

export function generateResetToken() {
  const token = crypto.randomBytes(32).toString("hex")
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000)
  return { token, tokenHash, expiresAt }
}

export function hashResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}
