import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { CurrencyPipe } from "@angular/common";
import { AdminService } from "../../core/services/admin.service";
import { rentalConditions, rentalFields } from "../../core/config/rental-conditions";
import { WhatsappDirective } from "../../shared/whatsapp/whatsapp.directive";
import { ScrollRevealDirective } from "../../shared/scroll-reveal/scroll-reveal.directive";
@Component({
  selector: "mix-rental-conditions",
  standalone: true,
  imports: [CurrencyPipe, WhatsappDirective, ScrollRevealDirective],
  templateUrl: "./rental-conditions.component.html",
  styleUrl: "./rental-conditions.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RentalConditionsComponent {
  private readonly admin = inject(AdminService);
  readonly conditions = computed(() => rentalConditions(this.admin.settings().rentalConditions));
  readonly details = rentalFields.slice(2);
  readonly plans = computed(() => {
    const available = this.admin.bikes().filter(bike => bike.available);
    return [
      { name: "CAUÇÃO", label: "CAUÇÃO", period: "", starting: false, price: Number((this.conditions().depositAmount ?? "400").replace(",", ".")), description: this.conditions().dailyPlan },
      { name: "SEMANAL", label: "PLANO SEMANAL", starting: true, period: "semana", price: available.length ? Math.min(...available.map(b => b.weekly)) : null, description: this.conditions().weeklyPlan },
    ];
  });
}
