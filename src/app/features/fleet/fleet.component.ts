import { ScrollRevealDirective } from "../../shared/scroll-reveal/scroll-reveal.directive";
import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  signal,
} from "@angular/core";
import { AdminService } from "../../core/services/admin.service";
import { MotorcycleCategory } from "../../core/models/motorcycle.model";
import { BikeCardComponent } from "../bike-card/bike-card.component";
@Component({
  selector: "mix-fleet",
  standalone: true,
  styleUrl: "./fleet.component.css",
  imports: [ScrollRevealDirective, BikeCardComponent],
  templateUrl: "./fleet.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FleetComponent {
  readonly admin = inject(AdminService);
  readonly availability = signal<"all" | "available">("all");
  readonly category = signal<MotorcycleCategory | "all">("all");
  readonly categories = computed(() => [
    ...new Set(this.admin.bikes().map((bike) => bike.category)),
  ]);
  readonly filteredBikes = computed(() =>
    this.admin
      .bikes()
      .filter(
        (bike) =>
          (this.availability() === "all" || bike.available) &&
          (this.category() === "all" || bike.category === this.category()),
      ),
  );
  setCategory(event: Event): void {
    this.category.set(
      (event.target as HTMLSelectElement).value as MotorcycleCategory | "all",
    );
  }
  reset(): void {
    this.availability.set("all");
    this.category.set("all");
  }
}
