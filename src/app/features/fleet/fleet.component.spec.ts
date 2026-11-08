import { registerLocaleData } from "@angular/common";
import localePt from "@angular/common/locales/pt";
registerLocaleData(localePt);
import { TestBed } from "@angular/core/testing";
import { FleetComponent } from "./fleet.component";

describe("FleetComponent", () => {
  it("combina disponibilidade e categoria e permite limpar um resultado vazio", () => {
    const fixture = TestBed.createComponent(FleetComponent);
    const fleet = fixture.componentInstance;
    expect(fleet.filteredBikes().length).toBe(3);
    fleet.availability.set("available");
    expect(fleet.filteredBikes().map((bike) => bike.id)).toEqual([
      "cg160",
      "fazer250",
    ]);
    fleet.category.set("Touring");
    expect(fleet.filteredBikes()).toEqual([]);
    fixture.detectChanges();
    const reset = fixture.nativeElement.querySelector(
      ".no-results button",
    ) as HTMLButtonElement;
    reset.click();
    fixture.detectChanges();
    expect(fleet.filteredBikes().length).toBe(3);
    expect(fixture.nativeElement.querySelectorAll("mix-bike-card").length).toBe(
      3,
    );
    expect(
      fixture.nativeElement.querySelector("button[disabled]").textContent,
    ).toContain("Indisponível");
  });
});

describe("Grouped fleet cards", () => {
  it("agrupa modelos no mesmo card, alterna todos os dados e filtra cada moto do grupo", async () => {
    const { AdminService } = await import("../../core/services/admin.service");
    const { AdminSessionService } =
      await import("../../core/services/admin-session.service");
    const admin = TestBed.inject(AdminService);
    TestBed.inject(AdminSessionService).setIdentity({
      isAdmin: true,
      signedIn: true,
      name: "Admin",
      email: "",
    });
    const [first, second] = admin.bikes();
    admin.saveMoto({ ...first, cardGroup: "Motos urbanas" }, first.id);
    admin.saveMoto(
      { ...second, cardGroup: "Motos urbanas", available: false, daily: 76.5 },
      second.id,
    );
    const fixture = TestBed.createComponent(FleetComponent);
    fixture.detectChanges();
    let cards = fixture.nativeElement.querySelectorAll("mix-bike-card");
    expect(cards.length).toBe(2);
    const card = cards[0],
      options = card.querySelectorAll(".model-picker button");
    expect(options.length).toBe(2);
    expect(card.querySelector("h3").textContent).toContain(first.name);
    options[1].click();
    fixture.detectChanges();
    expect(options[1].getAttribute("aria-pressed")).toBe("true");
    expect(card.querySelector("h3").textContent).toContain(second.name);
    expect(card.querySelector(".bike-visual img").getAttribute("src")).toBe(
      second.image,
    );
    expect(card.querySelector(".specs").textContent).toContain(
      second.consumption,
    );
    expect(card.querySelector(".price-row").textContent).toContain("76,50");
    expect(card.querySelector(".reserve").disabled).toBe(true);
    admin.toggleMoto(second.id);
    fixture.detectChanges();
    expect(card.querySelector(".reserve").getAttribute("aria-label")).toBe(
      "Reservar " + second.name,
    );
    fixture.componentInstance.category.set("Entregas");
    fixture.detectChanges();
    expect(fixture.componentInstance.filteredBikes().map((b) => b.id)).toEqual([
      first.id,
    ]);
    expect(card.querySelector("h3").textContent).toContain(first.name);
    fixture.componentInstance.reset();
    fixture.componentInstance.availability.set("available");
    admin.toggleMoto(second.id);
    fixture.detectChanges();
    expect(fixture.componentInstance.filteredBikes().map((b) => b.id)).toEqual([
      first.id,
    ]);
    admin.deleteMoto(first.id);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll("mix-bike-card").length).toBe(
      0,
    );
    fixture.destroy();
  });
});
