import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  computed,
  signal,
  afterNextRender,
  DestroyRef,
  effect,
} from "@angular/core";
import { DOCUMENT, CurrencyPipe } from "@angular/common";
import { Motorcycle } from "../../core/models/motorcycle.model";
import { WhatsappService } from "../../core/services/whatsapp.service";
import { WhatsappDirective } from "../../shared/whatsapp/whatsapp.directive";
@Component({
  selector: "mix-bike-card",
  standalone: true,
  styleUrl: "./bike-card.component.css",
  imports: [CurrencyPipe, WhatsappDirective],
  templateUrl: "./bike-card.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BikeCardComponent {
  readonly bike = input.required<Motorcycle>();
  readonly alternatives = input<readonly Motorcycle[]>([]);
  private readonly selectedId = signal<string | null>(null);
  readonly selectedBike = computed(
    () =>
      this.alternatives().find((bike) => bike.id === this.selectedId()) ??
      this.alternatives()[0] ??
      this.bike(),
  );
  readonly currentIndex = computed(() =>
    Math.max(
      0,
      this.alternatives().findIndex(
        (bike) => bike.id === this.selectedBike().id,
      ),
    ),
  );
  readonly hovered = signal(false);
  readonly focused = signal(false);
  private readonly ready = signal(false);
  private readonly visible = signal(true);
  private readonly reducedMotion = signal(false);
  private readonly document = inject(DOCUMENT);
  readonly rotating = computed(
    () =>
      this.ready() &&
      this.visible() &&
      !this.reducedMotion() &&
      !this.hovered() &&
      !this.focused() &&
      this.alternatives().length > 1,
  );
  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const media = this.document.defaultView?.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
      );
      const motionChanged = () =>
        this.reducedMotion.set(media?.matches ?? false);
      const visibilityChanged = () => this.visible.set(!this.document.hidden);
      motionChanged();
      visibilityChanged();
      media?.addEventListener("change", motionChanged);
      this.document.addEventListener("visibilitychange", visibilityChanged);
      destroy.onDestroy(() => {
        media?.removeEventListener("change", motionChanged);
        this.document.removeEventListener(
          "visibilitychange",
          visibilityChanged,
        );
      });
      this.ready.set(true);
    });
    effect((onCleanup) => {
      const models = this.alternatives(),
        current = this.currentIndex();
      if (!this.rotating()) return;
      const timer = setTimeout(
        () => this.selectedId.set(models[(current + 1) % models.length].id),
        6000,
      );
      onCleanup(() => clearTimeout(timer));
    });
  }
  pointerEntered(event: PointerEvent): void {
    if (event.pointerType === "mouse") this.hovered.set(true);
  }
  select(id: string): void {
    this.selectedId.set(id);
  }
  readonly whatsapp = inject(WhatsappService);
}
