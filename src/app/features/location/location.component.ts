import { ScrollRevealDirective } from "../../shared/scroll-reveal/scroll-reveal.directive";
import { Component, ChangeDetectionStrategy } from "@angular/core";
import { inject } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { AdminService } from "../../core/services/admin.service";
import { computed } from "@angular/core";
@Component({
  selector: "mix-location",
  standalone: true,
  styleUrl: "./location.component.css",
  imports: [ScrollRevealDirective],
  templateUrl: "./location.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationComponent {
  readonly admin = inject(AdminService);
  readonly config = this.admin.settings;
  private readonly sanitizer = inject(DomSanitizer);
  readonly mapUrl = computed(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(
      "https://maps.google.com/maps?q=" +
        encodeURIComponent(this.config().mapQuery) +
        "&z=12&ie=UTF8&iwloc=&output=embed",
    ),
  );
  readonly directionsUrl = computed(
    () =>
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(this.config().mapQuery),
  );
}
