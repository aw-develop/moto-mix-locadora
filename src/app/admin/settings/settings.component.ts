import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { CredentialsComponent } from "../security/credentials.component";
import { AdminService } from "../../core/services/admin.service";
import { optionalHttpsValidator } from "../../core/validation/admin.validators";
@Component({
  selector: "mix-admin-settings",
  standalone: true,
  styleUrl: "./settings.component.css",
  imports: [ReactiveFormsModule, MatButtonModule, CredentialsComponent],
  templateUrl: "./settings.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  readonly error = signal("");
  readonly saved = signal(false);
  private readonly initial = this.admin.settings();
  readonly form = this.fb.nonNullable.group({
    whatsappNumber: [
      this.initial.whatsappNumber,
      [Validators.required, Validators.pattern(/^55\d{10,11}$/)],
    ],
    address: [
      this.initial.address,
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(400),
      ],
    ],
    hours: [
      this.initial.hours,
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(400),
      ],
    ],
    mapQuery: [
      this.initial.mapQuery,
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(400),
      ],
    ],
    mapLabel: [
      this.initial.mapLabel,
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(100),
      ],
    ],
    instagram: [this.initial.instagram, optionalHttpsValidator],
    facebook: [this.initial.facebook, optionalHttpsValidator],
  });
  save(): void {
    this.saved.set(false);
    this.error.set("");
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set(
        "Revise os campos destacados. Informe o WhatsApp completo e links HTTPS.",
      );
      return;
    }
    try {
      this.admin.saveSettings(this.form.getRawValue());
      this.form.markAsPristine();
      this.saved.set(true);
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : "Não foi possível salvar.",
      );
    }
  }
  reset(): void {
    this.form.reset(this.admin.settings());
    this.error.set("");
    this.saved.set(false);
  }
}
