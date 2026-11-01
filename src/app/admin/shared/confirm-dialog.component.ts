import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
export interface ConfirmData {
  title: string;
  description: string;
}
@Component({
  selector: "mix-confirm-dialog",
  standalone: true,
  styleUrl: "./confirm-dialog.component.css",
  imports: [MatDialogModule, MatButtonModule],
  template: `<div class="admin-dialog-heading">
      <span class="admin-kicker">CONFIRMAR EXCLUSÃO</span>
      <h2 mat-dialog-title>{{ data.title }}</h2>
    </div>
    <mat-dialog-content
      ><p>{{ data.description }}</p>
      <p class="muted">
        Esta ação remove permanentemente o item do cadastro.
      </p></mat-dialog-content
    ><mat-dialog-actions align="end"
      ><button mat-button [mat-dialog-close]="false" cdkFocusInitial>
        Cancelar</button
      ><button mat-flat-button class="danger-button" [mat-dialog-close]="true">
        Excluir
      </button></mat-dialog-actions
    >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmData>(MAT_DIALOG_DATA);
}
