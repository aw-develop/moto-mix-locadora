import { ScrollRevealDirective } from "../../shared/scroll-reveal/scroll-reveal.directive";
import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  signal,
} from "@angular/core";
import { AdminService } from "../../core/services/admin.service";
import {
  Motorcycle,
  MotorcycleCategory,
} from "../../core/models/motorcycle.model";
import { BikeCardComponent } from "../bike-card/bike-card.component";
type PriceOrder = "default" | "daily-asc" | "daily-desc" | "weekly-asc" | "weekly-desc";
const searchable = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR");
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
  readonly search = signal("");
  readonly order = signal<PriceOrder>("default");
  readonly availability = signal<"all" | "available">("all");
  readonly category = signal<MotorcycleCategory | "all">("all");
  readonly categories = computed(() => [
    ...new Set(this.admin.bikes().map((bike) => bike.category)),
  ]);
  readonly filteredBikes = computed(() => {
    const query = searchable(this.search().trim());
    const models = this.admin.bikes().filter((bike) =>
      (this.availability() === "all" || bike.available) &&
      (this.category() === "all" || bike.category === this.category()) &&
      (!query || searchable(bike.name + " " + bike.version).includes(query))
    );
    const order = this.order();
    if (order === "default") return models;
    const price = order.startsWith("weekly") ? "weekly" : "daily";
    return models.sort((a, b) => (a[price] - b[price]) * (order.endsWith("desc") ? -1 : 1));
  });
  setSearch(event: Event): void { this.search.set((event.target as HTMLInputElement).value); }
  setOrder(event: Event): void { this.order.set((event.target as HTMLSelectElement).value as PriceOrder); }
  readonly cards = computed(() => {
    const groups = new Map<string, { id: string; bikes: Motorcycle[] }>();
    for (const bike of this.filteredBikes()) {
      const label = bike.cardGroup?.trim();
      const id = label
        ? "group:" + label.normalize("NFC").toLocaleLowerCase("pt-BR")
        : "moto:" + bike.id;
      const group = groups.get(id);
      if (group) group.bikes.push(bike);
      else groups.set(id, { id, bikes: [bike] });
    }
    return [...groups.values()];
  });
  setCategory(event: Event): void {
    this.category.set(
      (event.target as HTMLSelectElement).value as MotorcycleCategory | "all",
    );
  }
  reset(): void {
    this.search.set("");
    this.order.set("default");
    this.availability.set("all");
    this.category.set("all");
  }
}
