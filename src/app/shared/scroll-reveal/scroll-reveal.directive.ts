import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  NgZone,
  numberAttribute,
} from "@angular/core";

/** Reveal once; content stays visible when observers or motion are unavailable. */
@Directive({ selector: "[mixReveal]", standalone: true })
export class ScrollRevealDirective {
  readonly mixReveal = input(0, { transform: numberAttribute });
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroy = inject(DestroyRef);
  private readonly zone = inject(NgZone);

  constructor() {
    afterNextRender(() =>
      this.zone.runOutsideAngular(() => {
        const view = this.element.ownerDocument.defaultView;
        if (!view || !("IntersectionObserver" in view) || !view.matchMedia)
          return;
        const motion = view.matchMedia("(prefers-reduced-motion: reduce)");
        if (motion.matches) return;

        let revealed = false;
        const reveal = () => {
          if (revealed) return;
          revealed = true;
          this.element.classList.remove("reveal-pending");
          observer.disconnect();
          motion.removeEventListener("change", onMotionChange);
          this.element.removeEventListener("focusin", reveal);
        };
        const onMotionChange = (event: MediaQueryListEvent) => {
          if (event.matches) reveal();
        };
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) reveal();
          },
          { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
        );

        this.element.style.setProperty(
          "--reveal-delay",
          `${Math.max(0, Math.min(this.mixReveal() || 0, 240))}ms`,
        );
        this.element.classList.add("scroll-reveal", "reveal-pending");
        observer.observe(this.element);
        motion.addEventListener("change", onMotionChange);
        this.element.addEventListener("focusin", reveal);
        this.destroy.onDestroy(() => {
          observer.disconnect();
          motion.removeEventListener("change", onMotionChange);
          this.element.removeEventListener("focusin", reveal);
        });
      }),
    );
  }
}
