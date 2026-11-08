import { CurrencyPipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from "@angular/core";
import { Motorcycle } from "../../../core/models/motorcycle.model";
import { WhatsappService } from "../../../core/services/whatsapp.service";
import { WhatsappDirective } from "../../../shared/whatsapp/whatsapp.directive";
@Component({
  selector: "mix-banner-motorcycles",
  standalone: true,
  imports: [CurrencyPipe, WhatsappDirective],
  templateUrl: "./banner-motorcycles.component.html",
  styleUrl: "./banner-motorcycles.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerMotorcyclesComponent {
  readonly motorcycles = input.required<readonly Motorcycle[]>();
  readonly preview = input(false);
  readonly whatsapp = inject(WhatsappService);
}
