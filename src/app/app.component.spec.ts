import { TestBed } from "@angular/core/testing";
import { PublicSiteComponent } from "./public/public-site.component";
import { provideRouter } from "@angular/router";

describe("Mix application", () => {
  it("renderiza todas as seções e abre o aviso de reserva sem telefone configurado", async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(PublicSiteComponent);
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    for (const id of [
      "inicio",
      "motos",
      "vantagens",
      "localizacao",
      "contato",
    ]) {
      expect(page.querySelector(`#${id}`)).not.toBeNull();
    }
    expect(page.querySelector(".benefit-bar")).not.toBeNull();
    const dialog = page.querySelector("dialog")!;
    // JSDOM does not implement the browser's dialog methods.
    dialog.showModal = vi.fn();
    (page.querySelector(".reserve") as HTMLAnchorElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(dialog.showModal).toHaveBeenCalled();
    expect(page.querySelector(".dialog-message")?.textContent).toContain(
      "Honda CG 160",
    );
  });
});
