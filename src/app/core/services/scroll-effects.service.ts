import { DOCUMENT } from "@angular/common";
import {
  afterNextRender,
  DestroyRef,
  inject,
  Injectable,
  NgZone,
  signal,
} from "@angular/core";

@Injectable({ providedIn: "root" })
export class ScrollEffectsService {
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly destroy = inject(DestroyRef);
  private readonly scrolled = signal(false);
  readonly isScrolled = this.scrolled.asReadonly();

  constructor() {
    afterNextRender(() =>
      this.zone.runOutsideAngular(() => {
        const view = this.document.defaultView;
        if (!view) return;
        let frame = 0;
        const update = () => {
          frame = 0;
          const root = this.document.documentElement;
          const distance = root.scrollHeight - view.innerHeight;
          const progress =
            distance > 0
              ? Math.min(1, Math.max(0, view.scrollY / distance))
              : 0;
          root.style.setProperty("--scroll-progress", String(progress));
          const scrolled = view.scrollY > 24;
          if (scrolled !== this.scrolled())
            this.zone.run(() => this.scrolled.set(scrolled));
        };
        const schedule = () => {
          if (!frame) frame = view.requestAnimationFrame(update);
        };
        view.addEventListener("scroll", schedule, { passive: true });
        view.addEventListener("resize", schedule, { passive: true });
        const observer =
          typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(schedule)
            : null;
        observer?.observe(this.document.body);
        update();
        this.destroy.onDestroy(() => {
          view.removeEventListener("scroll", schedule);
          view.removeEventListener("resize", schedule);
          observer?.disconnect();
          if (frame) view.cancelAnimationFrame(frame);
          this.document.documentElement.style.removeProperty(
            "--scroll-progress",
          );
        });
      }),
    );
  }
}
