import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  computed,
  signal,
} from "@angular/core";
import { CurrencyPipe } from "@angular/common";
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
  select(id: string): void {
    this.selectedId.set(id);
  }
  readonly whatsapp = inject(WhatsappService);
}
