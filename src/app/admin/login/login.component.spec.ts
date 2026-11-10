import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { LoginComponent } from "./login.component";
import { AdminSessionService } from "../../core/services/admin-session.service";
import { AdminService } from "../../core/services/admin.service";

describe("Transição de entrada no painel", () => {
  function create() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.form.setValue({ username: "admin", password: "senha-de-teste-local" });
    const session = TestBed.inject(AdminSessionService);
    const admin = TestBed.inject(AdminService);
    const navigate = vi.spyOn(TestBed.inject(Router), "navigateByUrl").mockResolvedValue(true);
    vi.spyOn(session, "login").mockImplementation(async () => {
      session.setIdentity({ isAdmin: true, signedIn: true, name: "Admin", email: "" });
    });
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, session, admin, navigate };
  }
  it("remove o formulário após autenticar e abre o dashboard sem uma segunda ação", async () => {
    const { fixture, component, admin, navigate } = create();
    let finish!: () => void;
    const pending = new Promise<void>(resolve => { finish = resolve; });
    vi.spyOn(admin, "initialize").mockReturnValue(pending);
    const submission = component.submit();
    await Promise.resolve();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.login-form')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain("Abrindo seu painel");
    expect(fixture.nativeElement.textContent).not.toContain("Bem-vindo à central");
    expect(fixture.nativeElement.querySelector('a[href="/admin/dashboard"]')).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
    finish();
    await submission;
    expect(navigate).toHaveBeenCalledExactlyOnceWith("/admin/dashboard", { replaceUrl: true });
    expect(component.form.controls.password.value).toBe("");
    fixture.destroy();
  });
  it("mostra erro no formulário se as credenciais forem recusadas e não navega", async () => {
    const { fixture, component, session, navigate } = create();
    vi.mocked(session.login).mockRejectedValue(new Error("Login ou senha inválidos."));
    await component.submit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.login-form')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain("Login ou senha inválidos");
    expect(component.form.controls.username.value).toBe("admin");
    expect(component.form.controls.password.value).toBe("");
    expect(navigate).not.toHaveBeenCalled();
    fixture.destroy();
  });
  it("volta ao formulário com erro se o carregamento falhar, sem ficar preso na transição", async () => {
    const { fixture, component, admin, navigate } = create();
    vi.spyOn(admin, "initialize").mockImplementation(async () => { admin.saveStatus.set("error"); });
    await component.submit();
    fixture.detectChanges();
    expect(component.opening()).toBe(false);
    expect(component.busy()).toBe(false);
    expect(fixture.nativeElement.querySelector('.login-form')).not.toBeNull();
    expect(component.error()).toContain("Não foi possível carregar o painel");
    expect(navigate).not.toHaveBeenCalled();
    fixture.destroy();
  });
});
