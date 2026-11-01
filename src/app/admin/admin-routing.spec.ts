import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { routes } from "../app.routes";
import { AdminSessionService } from "../core/services/admin-session.service";
import "../app.config";

describe("Admin routing", () => {
  it("redireciona o acesso direto, permite a sessão autorizada e bloqueia após logout", async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const harness = await RouterTestingHarness.create();
    const router = TestBed.inject(Router);
    await harness.navigateByUrl("/admin/motos");
    expect(router.url).toBe("/admin/login");
    expect(harness.routeNativeElement?.textContent).toContain(
      "Entrar no painel",
    );
    expect(harness.routeNativeElement?.querySelector('a[href^="/signin-with-chatgpt"]')).toBeNull();
    const session = TestBed.inject(AdminSessionService);
    session.setIdentity({
      isAdmin: true,
      signedIn: true,
      name: "Admin teste",
      email: "admin@example.test",
    });
    await harness.navigateByUrl("/admin/motos");
    expect(router.url).toBe("/admin/motos");
    expect(harness.routeNativeElement?.textContent).toContain("Honda CG 160");
    session.logout();
    await harness.navigateByUrl("/admin/banners");
    expect(router.url).toBe("/admin/login");
  });
});
