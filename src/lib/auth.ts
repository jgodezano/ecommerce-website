import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getDb } from "./db";

const SALT_ROUNDS = 12;
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export interface UserRow {
  id: string;
  email: string;
  password_hash?: string;
  name: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createUser(email: string, password: string, name: string, firstName: string, lastName: string, role: string = "customer"): UserRow {
  const db = getDb();
  const id = crypto.randomUUID();
  const hash = bcrypt.hashSync(password, SALT_ROUNDS);
  db.prepare(
    `INSERT INTO users (id, email, password_hash, name, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, email.toLowerCase().trim(), hash, name, firstName, lastName, role);
  const user = getUserById(id);
  if (!user) throw new Error("Failed to create user");
  return user;
}

export function getUserByEmail(email: string): UserRow | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim()) as UserRow | undefined;
}

export function getUserById(id: string): UserRow | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
}

export function createSession(userId: string): { id: string; expiresAt: string } {
  const db = getDb();
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(id, userId, expiresAt);
  return { id, expiresAt };
}

export function getSession(sessionId: string): { user: UserRow } | null {
  const db = getDb();
    const session = db.prepare(
      "SELECT s.id, s.expires_at, u.id as user_id, u.email, u.name, u.first_name, u.last_name, u.role, u.phone FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > datetime('now')"
    ).get(sessionId) as { id: string; expires_at: string; user_id: string; email: string; name: string; first_name: string; last_name: string; role: string; phone: string } | undefined;
  if (!session) return null;
  return {
    user: {
      id: session.user_id,
      email: session.email,
      name: session.name,
      first_name: session.first_name,
      last_name: session.last_name,
      role: session.role,
      phone: session.phone,
    },
  };
}

export function deleteSession(sessionId: string) {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

export function deleteUserSessions(userId: string) {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

export function authenticateUser(email: string, password: string): { user: UserRow; sessionId: string } | null {
  const user = getUserByEmail(email);
  if (!user) return null;
  if (!user.password_hash || !bcrypt.compareSync(password, user.password_hash)) return null;
  const session = createSession(user.id);
  deleteUserSessions(user.id);
  const newSession = createSession(user.id);
  return { user, sessionId: newSession.id };
}

import { NextRequest, NextResponse } from "next/server";

export function getSessionFromRequest(req: NextRequest): { user: UserRow } | null {
  const sessionId = req.cookies.get("session_id")?.value;
  if (!sessionId) return null;
  return getSession(sessionId);
}

export function setSessionCookie(response: NextResponse, sessionId: string) {
  response.cookies.set("session_id", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set("session_id", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}
