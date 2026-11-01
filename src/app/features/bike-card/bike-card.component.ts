import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
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
  readonly whatsapp = inject(WhatsappService);
}
