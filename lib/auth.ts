import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string, email: string) {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string };
  } catch {
    return null;
  }
}
