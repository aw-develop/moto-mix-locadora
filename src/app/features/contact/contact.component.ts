import { ScrollRevealDirective } from "../../shared/scroll-reveal/scroll-reveal.directive";
import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { WhatsappService } from "../../core/services/whatsapp.service";
import { WhatsappDirective } from "../../shared/whatsapp/whatsapp.directive";
@Component({
  selector: "mix-contact",
  standalone: true,
  styleUrl: "./contact.component.css",
  imports: [ScrollRevealDirective, ReactiveFormsModule, WhatsappDirective],
  templateUrl: "./contact.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  private readonly fb = inject(FormBuilder);
  private readonly whatsapp = inject(WhatsappService);
  readonly form = this.fb.nonNullable.group({
    name: [
      "",
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(100),
      ],
    ],
    phone: [
      "",
      [
        Validators.required,
        Validators.pattern(/^[0-9+() .-]{10,20}$/),
        Validators.pattern(/^(?:\D*\d){10,13}\D*$/),
      ],
    ],
    message: [
      "",
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(1500),
      ],
    ],
  });
  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { name, phone, message } = this.form.getRawValue();
    this.whatsapp.open(
      `Olá, sou ${name.trim()}. Meu WhatsApp é ${phone.trim()}.\n\n${message.trim()}`,
    );
  }
}
