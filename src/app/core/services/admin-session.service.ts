import { Injectable, computed, signal } from "@angular/core";
export interface AdminIdentity {
  isAdmin: boolean;
  signedIn: boolean;
  name: string;
  email: string;
}
@Injectable({ providedIn: "root" })
export class AdminSessionService {
  private readonly identity = signal<AdminIdentity | null>(null);
  private verification: Promise<boolean> | null = null;
  private revision = 0;
  readonly active = computed(() => this.identity()?.isAdmin === true);
  readonly signedIn = computed(() => this.identity()?.signedIn === true);
  readonly profile = computed(() => ({
    name: this.identity()?.name || "Administrador",
    initials: "MX",
    role: "Administrador autorizado",
  }));
  setIdentity(identity: AdminIdentity): void {
    this.revision++;
    this.identity.set(identity);
  }
  verifySession(): Promise<boolean> {
    if (!this.verification) this.verification = this.readSession().finally(() => { this.verification = null; });
    return this.verification;
  }
  private async readSession(): Promise<boolean> {
    const revision = this.revision;
    try {
      const response = await fetch("/api/session", { cache: "no-store", signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error("Sessão indisponível.");
      const value = await response.json();
      if (revision !== this.revision) return false;
      this.setIdentity({ isAdmin: value?.isAdmin === true, signedIn: value?.signedIn === true,
        name: typeof value?.name === "string" ? value.name.slice(0,160) : "", email: "" });
      return this.active();
    } catch {
      if (revision === this.revision) this.logout();
      return false;
    }
  }
  async login(username: string, password: string): Promise<void> {
    const response = await fetch("/api/auth/login", {
      method: "POST", headers: {"content-type":"application/json"},
      body: JSON.stringify({username,password}), signal: AbortSignal.timeout(15000),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Não foi possível entrar.");
    this.setIdentity(result);
  }
  async signOut(): Promise<void> {
    const response = await fetch("/api/auth/logout", { method: "POST", signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error("Não foi possível encerrar a sessão. Tente novamente.");
    this.logout();
  }
  logout(): void {
    this.revision++;
    this.identity.set(null);
  }
  assertAdminSession(): void {
    if (!this.active())
      throw new Error(
        "Entre com a conta administradora para salvar alterações.",
      );
  }
}
