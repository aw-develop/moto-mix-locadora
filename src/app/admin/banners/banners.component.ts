import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatDialog } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { Banner } from "../../core/models/admin.model";
import { AdminService } from "../../core/services/admin.service";
import { BannerEditorComponent } from "./banner-editor.component";
import { ConfirmDialogComponent } from "../shared/confirm-dialog.component";
@Component({
  selector: "mix-banners-admin",
  standalone: true,
  styleUrl: "./banners.component.css",
  imports: [MatButtonModule, MatSlideToggleModule],
  templateUrl: "./banners.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannersComponent {
  readonly admin = inject(AdminService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy = inject(DestroyRef);
  readonly notice = signal("");
  readonly error = signal("");
  edit(banner: Banner | null = null): void {
    this.dialog
      .open(BannerEditorComponent, {
        data: banner,
        width: "640px",
        maxWidth: "calc(100vw - 24px)",
        maxHeight: "92vh",
        panelClass: "admin-dialog",
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((saved) => {
        if (saved) this.notice.set("Banner salvo.");
      });
  }
  toggle(banner: Banner): void {
    try {
      this.admin.toggleBanner(banner.id);
      this.notice.set("Visibilidade atualizada.");
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : "Erro ao alterar banner.",
      );
    }
  }
  move(banner: Banner, direction: -1 | 1): void {
    try {
      this.admin.moveBanner(banner.id, direction);
      this.notice.set("Ordem atualizada no site.");
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : "Erro ao reordenar.",
      );
    }
  }
  remove(banner: Banner): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: "Excluir este banner?",
          description: `O banner “${banner.title}” será removido do carrossel.`,
        },
        width: "440px",
        panelClass: "admin-dialog",
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((confirmed) => {
        if (confirmed) {
          try {
            this.admin.deleteBanner(banner.id);
            this.notice.set("Banner excluído.");
          } catch (error) {
            this.error.set(
              error instanceof Error ? error.message : "Erro ao excluir.",
            );
          }
        }
      });
  }
}
