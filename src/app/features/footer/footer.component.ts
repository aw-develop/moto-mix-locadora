import { RouterLink } from "@angular/router";
import { AdminService } from "../../core/services/admin.service";
import { Component, ChangeDetectionStrategy, inject } from "@angular/core";

@Component({
  selector: "mix-footer",
  standalone: true,
  styleUrl: "./footer.component.css",
  imports: [RouterLink],
  templateUrl: "./footer.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  readonly settings = inject(AdminService).settings;
  readonly year = new Date().getFullYear();
}
