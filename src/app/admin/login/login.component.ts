import { Component, ChangeDetectionStrategy, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { AdminSessionService } from "../../core/services/admin-session.service";
import { AdminService } from "../../core/services/admin.service";
@Component({
  selector: "mix-admin-login",
  standalone: true,
  styleUrl: "./login.component.css",
  imports: [RouterLink, MatButtonModule, ReactiveFormsModule],
  templateUrl: "./login.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  readonly credentialsUpdated = inject(ActivatedRoute).snapshot.queryParamMap.get("credentials") === "updated";
  readonly session = inject(AdminSessionService);
  readonly admin = inject(AdminService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly busy = signal(false);
  readonly error = signal("");
  readonly form = this.fb.nonNullable.group({
    username: ["", [Validators.required, Validators.maxLength(80)]],
    password: ["", [Validators.required, Validators.maxLength(256)]],
  });
  async submit(): Promise<void> {
    if (this.busy() || this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.busy.set(true); this.error.set("");
    try {
      const {username,password} = this.form.getRawValue();
      await this.session.login(username,password);
      this.form.controls.password.reset();
      await this.admin.initialize();
      if (!this.session.active() || this.admin.saveStatus() === "error")
        throw new Error("Não foi possível carregar o painel. Tente novamente.");
      await this.router.navigateByUrl("/admin/dashboard");
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : "Não foi possível entrar.");
    } finally { this.busy.set(false); }
  }
}
