import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  computed,
  inject,
  signal,
} from "@angular/core";
import { CurrencyPipe } from "@angular/common";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatDialog } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { AdminService } from "../../core/services/admin.service";
import { Moto } from "../../core/models/admin.model";
import { MotoEditorComponent } from "./moto-editor.component";
import { ConfirmDialogComponent } from "../shared/confirm-dialog.component";
@Component({
  selector: "mix-fleet-admin",
  standalone: true,
  styleUrl: "./fleet-admin.component.css",
  imports: [CurrencyPipe, MatButtonModule, MatSlideToggleModule],
  templateUrl: "./fleet-admin.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FleetAdminComponent {
  readonly admin = inject(AdminService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy = inject(DestroyRef);
  readonly search = signal("");
  readonly status = signal("all");
  readonly category = signal("all");
  readonly page = signal(1);
  readonly notice = signal("");
  readonly error = signal("");
  readonly filtered = computed(() =>
    this.admin
      .bikes()
      .filter(
        (b) =>
          (b.name + " " + b.version)
            .toLocaleLowerCase("pt-BR")
            .includes(this.search().toLocaleLowerCase("pt-BR")) &&
          (this.status() === "all" ||
            b.available === (this.status() === "available")) &&
          (this.category() === "all" || b.category === this.category()),
      ),
  );
  readonly pages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / 6)),
  );
  readonly currentPage = computed(() => Math.min(this.page(), this.pages()));
  readonly visible = computed(() =>
    this.filtered().slice((this.currentPage() - 1) * 6, this.currentPage() * 6),
  );
  value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
  filter(type: "search" | "status" | "category", event: Event): void {
    this[type].set(this.value(event));
    this.page.set(1);
  }
  edit(moto: Moto | null = null): void {
    this.dialog
      .open(MotoEditorComponent, {
        data: moto,
        width: "720px",
        maxWidth: "calc(100vw - 24px)",
        maxHeight: "92vh",
        panelClass: "admin-dialog",
        autoFocus: "first-tabbable",
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((saved) => {
        if (saved)
          this.notice.set(moto ? "Moto atualizada." : "Moto adicionada.");
      });
  }
  toggle(moto: Moto): void {
    try {
      this.admin.toggleMoto(moto.id);
      this.error.set("");
      this.notice.set(`Status de ${moto.name} atualizado.`);
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : "Erro ao alterar status.",
      );
    }
  }
  remove(moto: Moto): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: "Excluir esta moto?",
          description: `${moto.name} será removida do catálogo público.`,
        },
        width: "440px",
        panelClass: "admin-dialog",
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((confirmed) => {
        if (confirmed) {
          try {
            this.admin.deleteMoto(moto.id);
            this.notice.set("Moto excluída.");
          } catch (error) {
            this.error.set(
              error instanceof Error ? error.message : "Erro ao excluir.",
            );
          }
        }
      });
  }
}
