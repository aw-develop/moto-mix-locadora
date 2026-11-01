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
  readonly active = computed(() => this.identity()?.isAdmin === true);
  readonly signedIn = computed(() => this.identity()?.signedIn === true);
  readonly profile = computed(() => ({
    name: this.identity()?.name || "Administrador",
    initials: "MX",
    role: "Administrador autorizado",
  }));
  setIdentity(identity: AdminIdentity): void {
    this.identity.set(identity);
  }
  logout(): void {
    this.identity.set(null);
  }
  assertAdminSession(): void {
    if (!this.active())
      throw new Error(
        "Entre com a conta administradora para salvar alterações.",
      );
  }
}
