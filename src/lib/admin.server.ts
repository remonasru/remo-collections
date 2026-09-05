/** Server-only admin credential check. Never imported by client code. */
const ADMIN_USER = "Remo Collections";
const ADMIN_PASS = "RemoNasru20";

export function verifyAdmin(user: string, pass: string): boolean {
  return user.trim() === ADMIN_USER && pass === ADMIN_PASS;
}

export function assertAdmin(pass: string): void {
  if (pass !== ADMIN_PASS) throw new Error("Unauthorized");
}
