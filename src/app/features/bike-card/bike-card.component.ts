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
  readonly models = computed(() => this.alternatives().length ? this.alternatives() : [this.bike()]);
  private readonly touching = signal(false);
  private gesture: { id: number; x: number; y: number } | null = null;
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
  readonly navigationModels = computed(() => {
    const models = this.alternatives();
    const start = Math.min(
      Math.max(this.currentIndex() - 2, 0),
      Math.max(models.length - 5, 0),
    );
    return models.slice(start, start + 5);
  });
  navigate(direction: -1 | 1, event?: Event): void {
    event?.preventDefault();
    const models = this.alternatives();
    if (models.length < 2) return;
    this.select(
      models[(this.currentIndex() + direction + models.length) % models.length]
        .id,
    );
  }
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
      !this.touching() &&
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
  swipeStart(event: PointerEvent): void {
    if (event.pointerType !== "touch" || event.isPrimary === false || this.models().length < 2) return;
    this.gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
    this.touching.set(true);
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }
  swipeEnd(event: PointerEvent): void {
    const start = this.gesture;
    if (!start || event.pointerId !== start.id) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    this.swipeCancel();
    if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      this.navigate(dx < 0 ? 1 : -1);
    }
  }
  swipeCancel(): void { this.gesture = null; this.touching.set(false); }
  select(id: string): void {
    this.selectedId.set(id);
  }
  readonly whatsapp = inject(WhatsappService);
}
