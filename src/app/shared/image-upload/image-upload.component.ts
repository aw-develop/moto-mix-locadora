import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  forwardRef,
  inject,
  input,
  signal,
} from "@angular/core";
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from "@angular/forms";
import { ImageUploadService } from "../../core/services/image-upload.service";
import { isSafeImage } from "../../core/validation/admin.validators";

@Component({
  selector: "mix-image-upload",
  standalone: true,
  styleUrl: "./image-upload.component.css",
  templateUrl: "./image-upload.component.html",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ImageUploadComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ImageUploadComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUploadComponent implements ControlValueAccessor, Validator {
  readonly label = input("Imagem");
  readonly wide = input(false);
  readonly value = signal("");
  readonly disabled = signal(false);
  readonly busy = signal(false);
  readonly error = signal("");
  readonly filename = signal("");
  readonly previewFailed = signal(false);
  readonly dragging = signal(false);
  private readonly upload = inject(ImageUploadService);
  private sequence = 0;
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidationChange: () => void = () => {};
  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.sequence++;
    });
  }
  writeValue(value: string | null): void {
    this.value.set(value || "");
    this.filename.set(
      value?.startsWith("data:image/") ? "Imagem do dispositivo" : "",
    );
    this.previewFailed.set(false);
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(value: boolean): void {
    this.disabled.set(value);
  }
  registerOnValidatorChange(fn: () => void): void {
    this.onValidationChange = fn;
  }
  validate(_control: AbstractControl): ValidationErrors | null {
    return this.busy() ? { imageProcessing: true } : null;
  }
  preview(): string {
    return isSafeImage(this.value()) ? this.value() : "";
  }
  isLocal(): boolean {
    return this.value().startsWith("data:image/");
  }
  touch(): void {
    this.onTouched();
  }
  urlChanged(event: Event): void {
    this.sequence++;
    this.busy.set(false);
    this.onValidationChange();
    this.error.set("");
    this.filename.set("");
    this.setValue((event.target as HTMLInputElement).value.trim());
  }
  clear(): void {
    this.sequence++;
    this.busy.set(false);
    this.error.set("");
    this.filename.set("");
    this.setValue("");
    this.onValidationChange();
  }
  selected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (file) void this.choose(file);
  }
  dragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.disabled() && !this.busy()) this.dragging.set(true);
  }
  drop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    if (this.disabled() || this.busy()) return;
    const files = event.dataTransfer?.files;
    if (files?.length !== 1) {
      this.error.set("Selecione uma imagem por vez.");
      return;
    }
    void this.choose(files[0]);
  }
  async choose(file: File): Promise<void> {
    if (this.disabled() || this.busy()) return;
    const sequence = ++this.sequence;
    this.busy.set(true);
    this.error.set("");
    this.onTouched();
    this.onValidationChange();
    try {
      const image = await this.upload.process(file);
      if (sequence !== this.sequence) return;
      this.filename.set(image.name);
      this.setValue(image.source);
    } catch (error) {
      if (sequence === this.sequence)
        this.error.set(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a imagem.",
        );
    } finally {
      if (sequence === this.sequence) {
        this.busy.set(false);
        this.onValidationChange();
      }
    }
  }
  private setValue(value: string): void {
    this.value.set(value);
    this.previewFailed.set(false);
    this.onChange(value);
    this.onTouched();
  }
}
