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
import { Moto, MotoDraft } from "../../core/models/admin.model";
import { MotorcycleCategory } from "../../core/models/motorcycle.model";
import { AdminService } from "../../core/services/admin.service";
import { imageValidator } from "../../core/validation/admin.validators";
export interface AddToCardData {
  readonly addToCard: string;
}
@Component({
  selector: "mix-moto-editor",
  standalone: true,
  styleUrl: "./moto-editor.component.css",
  imports: [
    ImageUploadComponent,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatSlideToggleModule,
  ],
  templateUrl: "./moto-editor.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MotoEditorComponent {
  private readonly context = inject<Moto | AddToCardData | null>(
    MAT_DIALOG_DATA,
  );
  readonly data = this.context && "id" in this.context ? this.context : null;
  readonly parentId =
    this.context && "addToCard" in this.context ? this.context.addToCard : null;
  private readonly ref = inject(MatDialogRef<MotoEditorComponent>);
  private readonly admin = inject(AdminService);
  readonly parent = this.admin
    .bikes()
    .find((bike) => bike.id === this.parentId);
  private readonly fb = inject(FormBuilder);
  readonly error = signal("");
  readonly cardGroups = [
    ...new Set(
      this.admin
        .bikes()
        .map((bike) => bike.cardGroup)
        .filter((group): group is string => !!group),
    ),
  ];
  readonly form = this.fb.nonNullable.group({
    cardGroup: [this.data?.cardGroup ?? "", Validators.maxLength(80)],
    name: [
      this.data?.name ?? "",
      [Validators.required, Validators.pattern(/\S/), Validators.maxLength(80)],
    ],
    version: [
      this.data?.version ?? "",
      [Validators.required, Validators.pattern(/\S/), Validators.maxLength(80)],
    ],
    category: [
      this.data?.category ?? ("Entregas" as MotorcycleCategory),
      Validators.required,
    ],
    image: [this.data?.image ?? "", [Validators.required, imageValidator]],
    daily: [
      this.data?.daily ?? 45,
      [Validators.required, Validators.min(0.01), Validators.max(100000)],
    ],
    weekly: [
      this.data?.weekly ?? 280,
      [Validators.required, Validators.min(0.01), Validators.max(100000)],
    ],
    description: [
      this.data?.description ?? "",
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(600),
      ],
    ],
    transmission: [
      this.data?.transmission ?? "5 marchas",
      [Validators.required, Validators.pattern(/\S/), Validators.maxLength(60)],
    ],
    consumption: [
      this.data?.consumption ?? "",
      [Validators.required, Validators.pattern(/\S/), Validators.maxLength(60)],
    ],
    available: [this.data?.available ?? true],
  });
  save(): void {
    this.form.markAllAsTouched();
    this.error.set("");
    if (this.form.invalid) {
      this.error.set(
        "Revise os campos destacados. Escolha uma imagem e informe preços maiores que zero.",
      );
      return;
    }
    try {
      const draft = this.form.getRawValue() as MotoDraft;
      if (this.parentId) this.admin.addMotoToCard(draft, this.parentId);
      else this.admin.saveMoto(draft, this.data?.id);
      this.ref.close(true);
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : "Não foi possível salvar.",
      );
    }
  }
}
