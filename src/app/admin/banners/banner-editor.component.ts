import { ImageUploadComponent } from "../../shared/image-upload/image-upload.component";
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { Banner } from "../../core/models/admin.model";
import { AdminService } from "../../core/services/admin.service";
import {
  imageValidator,
  linkValidator,
} from "../../core/validation/admin.validators";
@Component({
  selector: "mix-banner-editor",
  standalone: true,
  styleUrl: "./banner-editor.component.css",
  imports: [
    ImageUploadComponent,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatSlideToggleModule,
  ],
  templateUrl: "./banner-editor.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerEditorComponent {
  readonly data = inject<Banner | null>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<BannerEditorComponent>);
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  readonly error = signal("");
  readonly form = this.fb.nonNullable.group({
    title: [
      this.data?.title ?? "",
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(120),
      ],
    ],
    subtitle: [
      this.data?.subtitle ?? "",
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(300),
      ],
    ],
    image: [this.data?.image ?? "", [Validators.required, imageValidator]],
    link: [this.data?.link ?? "#motos", [Validators.required, linkValidator]],
    active: [this.data?.active ?? true],
  });
  save(): void {
    this.form.markAllAsTouched();
    this.error.set("");
    if (this.form.invalid) {
      this.error.set(
        "Revise os campos. Escolha uma imagem e use link HTTPS ou âncora (ex.: #motos).",
      );
      return;
    }
    try {
      this.admin.saveBanner(this.form.getRawValue(), this.data?.id);
      this.ref.close(true);
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : "Não foi possível salvar.",
      );
    }
  }
}
