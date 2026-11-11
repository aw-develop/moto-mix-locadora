import { SectionLinkDirective } from "../../shared/section-link/section-link.directive";
import { AdminService } from "../../core/services/admin.service";
import { Component, ChangeDetectionStrategy, inject, computed } from "@angular/core";

@Component({
  selector: "mix-footer",
  standalone: true,
  styleUrl: "./footer.component.css",
  imports: [SectionLinkDirective],
  templateUrl: "./footer.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  readonly settings = inject(AdminService).settings;
  readonly phone = computed(() => {
    const value = this.settings().whatsappNumber;
    if (!/^55\d{10,11}$/.test(value)) return null;
    const local = value.slice(4);
    return { href: "tel:+" + value, label: `+55 (${value.slice(2,4)}) ${local.slice(0,-4)}-${local.slice(-4)}` };
  });
  readonly year = new Date().getFullYear();
}
