import { ImageUploadComponent } from "../../shared/image-upload/image-upload.component";
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
} from "@angular/core";
import { toSignal, takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BannerMotorcyclesComponent } from "../../features/hero/banner-motorcycles/banner-motorcycles.component";
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
    BannerMotorcyclesComponent,
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
  readonly bikes = this.admin.bikes;
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
    motorcycleIds: this.fb.nonNullable.control<string[]>([
      ...(this.data?.motorcycleIds ?? []),
    ]),
  });
  readonly selectedIds = toSignal(
    this.form.controls.motorcycleIds.valueChanges,
    { initialValue: this.form.controls.motorcycleIds.value },
  );
  readonly selectedMotorcycles = computed(() =>
    this.selectedIds().flatMap((id) =>
      this.bikes().filter((bike) => bike.id === id),
    ),
  );
  constructor() {
    this.updateImageValidation();
    this.form.controls.motorcycleIds.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateImageValidation());
  }
  private updateImageValidation(): void {
    const control = this.form.controls.image;
    const processing = control.hasError("imageProcessing");
    control.setValidators(
      this.form.controls.motorcycleIds.value.length
        ? [(value) => (!value.value ? null : imageValidator(value))]
        : [Validators.required, imageValidator],
    );
    control.updateValueAndValidity({ emitEvent: false });
    if (processing)
      control.setErrors({ ...control.errors, imageProcessing: true });
  }
  selectMotorcycle(id: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const ids = this.form.controls.motorcycleIds.value;
    if (checked && !ids.includes(id) && ids.length < 6)
      this.form.controls.motorcycleIds.setValue([...ids, id]);
    if (!checked)
      this.form.controls.motorcycleIds.setValue(
        ids.filter((value) => value !== id),
      );
  }
  moveMotorcycle(index: number, direction: -1 | 1): void {
    const ids = [...this.form.controls.motorcycleIds.value],
      target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    this.form.controls.motorcycleIds.setValue(ids);
  }
  removeMotorcycle(id: string): void {
    this.form.controls.motorcycleIds.setValue(
      this.form.controls.motorcycleIds.value.filter((value) => value !== id),
    );
  }
  save(): void {
    this.form.markAllAsTouched();
    this.error.set("");
    if (this.form.invalid) {
      this.error.set(
        "Revise os campos. Escolha uma imagem ou motos da frota e use um link HTTPS ou âncora (ex.: #motos).",
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
