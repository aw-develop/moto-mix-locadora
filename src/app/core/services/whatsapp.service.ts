import { inject, Injectable, signal } from "@angular/core";
import { AdminService } from "./admin.service";

@Injectable({ providedIn: "root" })
export class WhatsappService {
  private readonly admin = inject(AdminService);
  private readonly pending = signal<string | null>(null);
  readonly pendingMessage = this.pending.asReadonly();
  readonly defaultMessage =
    "Olá, gostaria de conhecer os planos de aluguel da Mix Locadora de Motos.";
  get isConfigured(): boolean {
    return /^55\d{10,11}$/.test(this.admin.settings().whatsappNumber);
  }
  url(message = this.defaultMessage): string {
    return `https://wa.me/${this.admin.settings().whatsappNumber}?text=${encodeURIComponent(message)}`;
  }
  reserveMessage(model: string): string {
    return `Olá, tenho interesse em alugar a moto ${model}.`;
  }
  prepare(message: string): boolean {
    if (this.isConfigured) return true;
    this.pending.set(message);
    return false;
  }
  open(message: string): void {
    this.admin.recordWhatsapp();
    if (this.prepare(message))
      window.open(this.url(message), "_blank", "noopener,noreferrer");
  }
  dismiss(): void {
    this.pending.set(null);
  }
}
