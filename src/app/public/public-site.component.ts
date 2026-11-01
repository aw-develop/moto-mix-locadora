import { AdminService } from "../core/services/admin.service";
import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { registerLocaleData } from "@angular/common";
import localePt from "@angular/common/locales/pt";
import { IconsComponent } from "../shared/icons/icons.component";
import { WhatsappDirective } from "../shared/whatsapp/whatsapp.directive";
import { SetupDialogComponent } from "../shared/setup-dialog/setup-dialog.component";
import { HeaderComponent } from "../features/header/header.component";
import { HeroComponent } from "../features/hero/hero.component";
import { FleetComponent } from "../features/fleet/fleet.component";
import { AdvantagesComponent } from "../features/advantages/advantages.component";
import { StepsComponent } from "../features/steps/steps.component";
import { LocationComponent } from "../features/location/location.component";
import { ContactComponent } from "../features/contact/contact.component";
import { FooterComponent } from "../features/footer/footer.component";
registerLocaleData(localePt);
@Component({
  selector: "mix-public-site",
  host: { class: "public-site" },
  standalone: true,
  styleUrl: "./public-site.component.css",
  imports: [
    IconsComponent,
    WhatsappDirective,
    SetupDialogComponent,
    HeaderComponent,
    HeroComponent,
    FleetComponent,
    AdvantagesComponent,
    StepsComponent,
    LocationComponent,
    ContactComponent,
    FooterComponent,
  ],
  templateUrl: "./public-site.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicSiteComponent {
  private readonly admin = inject(AdminService);
  constructor() {
    this.admin.recordVisit();
  }
}
