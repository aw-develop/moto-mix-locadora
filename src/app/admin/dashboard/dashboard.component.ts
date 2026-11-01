import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
} from "@angular/core";
import { DatePipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { AdminService } from "../../core/services/admin.service";
@Component({
  selector: "mix-admin-dashboard",
  standalone: true,
  styleUrl: "./dashboard.component.css",
  imports: [DatePipe, RouterLink],
  templateUrl: "./dashboard.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  readonly admin = inject(AdminService);
  readonly occupancy = computed(() =>
    this.admin.stats().total
      ? Math.round((this.admin.stats().rented / this.admin.stats().total) * 100)
      : 0,
  );
  readonly contacts = computed(() =>
    this.admin.state().activities.filter((a) => a.type === "whatsapp"),
  );
}
