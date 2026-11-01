import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from "@angular/core";
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { AdminSessionService } from "../../core/services/admin-session.service";
import { AdminService } from "../../core/services/admin.service";
@Component({
  selector: "mix-admin-layout",
  standalone: true,
  styleUrl: "./admin-layout.component.css",
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatButtonModule],
  templateUrl: "./admin-layout.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent {
  readonly session = inject(AdminSessionService);
  readonly admin = inject(AdminService);
  private readonly router = inject(Router);
  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);
  readonly links = [
    { path: "dashboard", icon: "◫", label: "Visão geral" },
    { path: "motos", icon: "◇", label: "Frota de motos" },
    { path: "banners", icon: "▧", label: "Banners" },
    { path: "configuracoes", icon: "⚙", label: "Configurações" },
  ];
  reloadSaved(): void {
    if (
      window.confirm(
        "Recarregar a versão salva no servidor? Alterações locais não salvas serão descartadas.",
      )
    )
      void this.admin.initialize();
  }
  async logout(): Promise<void> {
    try {
      await this.session.signOut();
      window.location.assign("/signout-with-chatgpt?return_to=%2Fadmin%2Flogin");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível sair.");
    }
  }
}
