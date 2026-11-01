import { inject } from "@angular/core";
import { ScrollEffectsService } from "../../core/services/scroll-effects.service";
import { Component, ChangeDetectionStrategy, signal } from "@angular/core";
import { WhatsappDirective } from "../../shared/whatsapp/whatsapp.directive";
@Component({
  selector: "mix-header",
  standalone: true,
  styleUrl: "./header.component.css",
  imports: [WhatsappDirective],
  templateUrl: "./header.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  readonly scroll = inject(ScrollEffectsService);
  readonly menuOpen = signal(false);
  readonly toggle = (value: boolean) => !value;
  closeMenu(event: MouseEvent) {
    if ((event.target as HTMLElement).closest("a")) this.menuOpen.set(false);
  }
}
