import { AdminService } from "../../core/services/admin.service";
import {
  Directive,
  HostListener,
  computed,
  inject,
  input,
} from "@angular/core";
import { WhatsappService } from "../../core/services/whatsapp.service";

@Directive({
  selector: "a[mixWhatsapp]",
  standalone: true,
  host: {
    "[attr.href]": "href()",
    target: "_blank",
    rel: "noopener noreferrer",
  },
})
export class WhatsappDirective {
  readonly mixWhatsapp = input("");
  readonly mixModel = input("");
  private readonly admin = inject(AdminService);
  private readonly whatsapp = inject(WhatsappService);
  readonly href = computed(() => this.whatsapp.url(this.message()));
  private message(): string {
    return this.mixWhatsapp() || this.whatsapp.defaultMessage;
  }
  @HostListener("click", ["$event"])
  onClick(event: MouseEvent): void {
    this.admin.recordWhatsapp(this.mixModel());
    if (!this.whatsapp.prepare(this.message())) event.preventDefault();
  }
}
