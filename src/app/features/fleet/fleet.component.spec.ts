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
