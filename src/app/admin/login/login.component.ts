import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { AdminSessionService } from "../../core/services/admin-session.service";
import { AdminService } from "../../core/services/admin.service";
@Component({
  selector: "mix-admin-login",
  standalone: true,
  styleUrl: "./login.component.css",
  imports: [RouterLink, MatButtonModule],
  templateUrl: "./login.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  readonly session = inject(AdminSessionService);
  readonly admin = inject(AdminService);
}
