import { SectionLinkDirective } from "../../shared/section-link/section-link.directive";
import { BannerMotorcyclesComponent } from "./banner-motorcycles/banner-motorcycles.component";
import { DOCUMENT } from "@angular/common";
import { Banner } from "../../core/models/admin.model";
import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  signal,
  afterNextRender,
  DestroyRef,
  effect,
} from "@angular/core";
import { WhatsappDirective } from "../../shared/whatsapp/whatsapp.directive";
import { AdminService } from "../../core/services/admin.service";
@Component({
  selector: "mix-hero",
  standalone: true,
  styleUrl: "./hero.component.css",
  imports: [
    SectionLinkDirective,
    WhatsappDirective,
    BannerMotorcyclesComponent,
  ],
  templateUrl: "./hero.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  private readonly admin = inject(AdminService);
  readonly banners = this.admin.activeBanners;
  private readonly index = signal(0);
  readonly currentIndex = computed(() =>
    this.banners().length ? this.index() % this.banners().length : 0,
  );
  readonly slide = computed<Banner | null>(
    () => this.banners()[this.currentIndex()] ?? null,
  );
  readonly motorcycles = computed(() => {
    const bikes = this.admin.bikes();
    return (this.slide()?.motorcycleIds ?? []).flatMap((id) =>
      bikes.filter((bike) => bike.id === id),
    );
  });
  readonly longTitle = computed(() => (this.slide()?.title.length ?? 0) > 60);
  readonly focused = signal(false);
  readonly hovered = signal(false);
  private readonly ready = signal(false);
  private readonly visible = signal(true);
  private readonly document = inject(DOCUMENT);

  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const visibilityChanged = () => this.visible.set(!this.document.hidden);
      visibilityChanged();
      this.document.addEventListener("visibilitychange", visibilityChanged);
      destroy.onDestroy(() =>
        this.document.removeEventListener(
          "visibilitychange",
          visibilityChanged,
        ),
      );
      this.ready.set(true);
    });
    effect((onCleanup) => {
      const count = this.banners().length;
      const duration = this.motorcycles().length ? 12000 : 6000;
      if (
        !this.ready() ||
        count < 2 ||
        this.focused() ||
        this.hovered() ||
        !this.visible()
      )
        return;
      const timer = setInterval(
        () => this.index.update((index) => (index + 1) % count),
        duration,
      );
      onCleanup(() => clearInterval(timer));
    });
  }
  pointerEntered(event: PointerEvent): void {
    if (event.pointerType === "mouse") this.hovered.set(true);
  }
}
