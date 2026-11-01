import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  effect,
  inject,
  viewChild,
} from "@angular/core";
import { WhatsappService } from "../../core/services/whatsapp.service";
@Component({
  selector: "mix-setup-dialog",
  standalone: true,
  styleUrl: "./setup-dialog.component.css",
  templateUrl: "./setup-dialog.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupDialogComponent {
  readonly whatsapp = inject(WhatsappService);
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>("dialog");
  constructor() {
    effect(() => {
      const element = this.dialog()?.nativeElement;
      if (!element) return;
      if (this.whatsapp.pendingMessage() !== null) {
        if (!element.open) element.showModal();
      } else if (element.open) element.close();
    });
  }
  dismiss(): void {
    this.whatsapp.dismiss();
  }
  backdrop(event: MouseEvent): void {
    const element = this.dialog()?.nativeElement;
    if (!element || event.target !== element) return;
    const rect = element.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      this.dismiss();
  }
}
