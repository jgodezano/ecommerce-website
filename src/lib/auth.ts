import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getDb } from "./db";

const SALT_ROUNDS = 12;
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export interface UserRow {
  id: string;
  email: string;
  username: string;
  password_hash?: string;
  name: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string;
  company_name: string;
  account_status: string;
  identity_document: string;
  rejection_reason: string;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

export function createUser(
  email: string,
  username: string,
  password: string,
  name: string,
  firstName: string,
  lastName: string,
  role: string = "customer",
  companyName: string = "",
  phone: string = ""
): UserRow {
  const db = getDb();
  const id = crypto.randomUUID();
  const hash = bcrypt.hashSync(password, SALT_ROUNDS);
  db.prepare(
    `INSERT INTO users (id, email, username, password_hash, name, first_name, last_name, role, phone, company_name, account_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
  ).run(id, email.toLowerCase().trim(), username.toLowerCase().trim(), hash, name, firstName, lastName, role, phone, companyName);
  const user = getUserById(id);
  if (!user) throw new Error("Failed to create user");
  return user;
}

export function getUserByEmail(email: string): UserRow | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim()) as UserRow | undefined;
}

export function getUserByUsername(username: string): UserRow | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE username = ?").get(username.toLowerCase().trim()) as UserRow | undefined;
}

export function getUserById(id: string): UserRow | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
}

export function createSession(userId: string, extended: boolean = false): { id: string; expiresAt: string } {
  const db = getDb();
  const id = crypto.randomUUID();
  const duration = extended ? SESSION_DURATION_MS * 4 : SESSION_DURATION_MS;
  const expiresAt = new Date(Date.now() + duration).toISOString();
  db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(id, userId, expiresAt);
  return { id, expiresAt };
}

export function getSession(sessionId: string): { user: UserRow } | null {
  const db = getDb();
  const session = db.prepare(
    `SELECT s.id, s.expires_at,
            u.id as user_id, u.email, u.username, u.name, u.first_name, u.last_name,
            u.role, u.phone, u.company_name, u.account_status, u.identity_document, u.rejection_reason
     FROM sessions s JOIN users u ON s.user_id = u.id
     WHERE s.id = ? AND s.expires_at > datetime('now')`
  ).get(sessionId) as any | undefined;
  if (!session) return null;
  return {
    user: {
      id: session.user_id,
      email: session.email,
      username: session.username || "",
      name: session.name,
      first_name: session.first_name,
      last_name: session.last_name,
      role: session.role,
      phone: session.phone || "",
      company_name: session.company_name || "",
      account_status: session.account_status || "pending",
      identity_document: session.identity_document || "",
      rejection_reason: session.rejection_reason || "",
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

export function authenticateUser(login: string, password: string): { user: UserRow; sessionId: string } | null {
  const user = getUserByEmail(login) || getUserByUsername(login);
  if (!user) return null;
  if (!user.password_hash || !bcrypt.compareSync(password, user.password_hash)) return null;
  deleteUserSessions(user.id);
  const newSession = createSession(user.id);
  return { user, sessionId: newSession.id };
}

export function updateAccountStatus(userId: string, status: string, reason: string = "") {
  const db = getDb();
  db.prepare("UPDATE users SET account_status = ?, rejection_reason = ? WHERE id = ?")
    .run(status, reason, userId);
}

export function updatePassword(userId: string, newPassword: string) {
  const db = getDb();
  const hash = bcrypt.hashSync(newPassword, SALT_ROUNDS);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, userId);
  deleteUserSessions(userId);
}

export function updateUserProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string; companyName?: string }) {
  const db = getDb();
  const updates: string[] = [];
  const params: any[] = [];

  if (data.firstName !== undefined) {
    updates.push("first_name = ?");
    params.push(data.firstName);
  }
  if (data.lastName !== undefined) {
    updates.push("last_name = ?");
    params.push(data.lastName);
  }
  if (data.phone !== undefined) {
    updates.push("phone = ?");
    params.push(data.phone);
  }
  if (data.companyName !== undefined) {
    updates.push("company_name = ?");
    params.push(data.companyName);
  }

  if (updates.length > 0) {
    if (data.firstName !== undefined && data.lastName !== undefined) {
      updates.push("name = ? || ' ' || ?");
      params.push(data.firstName, data.lastName);
    } else if (data.firstName !== undefined) {
      updates.push("name = ? || ' ' || last_name");
      params.push(data.firstName);
    } else if (data.lastName !== undefined) {
      updates.push("name = first_name || ' ' || ?");
      params.push(data.lastName);
    }
    params.push(userId);
    db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...params);
  }
}

export function createPasswordResetToken(userId: string): string {
  const db = getDb();
  const id = crypto.randomUUID();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  db.prepare("INSERT INTO password_resets (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)")
    .run(id, userId, token, expiresAt);
  return token;
}

export function verifyPasswordResetToken(token: string): UserRow | null {
  const db = getDb();
  const row = db.prepare(
    "SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > datetime('now')"
  ).get(token) as any;
  if (!row) return null;
  return getUserById(row.user_id) || null;
}

export function markResetTokenUsed(token: string) {
  const db = getDb();
  db.prepare("UPDATE password_resets SET used = 1 WHERE token = ?").run(token);
}

import { NextRequest, NextResponse } from "next/server";

export function getSessionFromRequest(req: NextRequest): { user: UserRow } | null {
  const sessionId = req.cookies.get("session_id")?.value;
  if (!sessionId) return null;
  return getSession(sessionId);
}

export function setSessionCookie(response: NextResponse, sessionId: string, remember: boolean = false) {
  response.cookies.set("session_id", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: remember ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
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
