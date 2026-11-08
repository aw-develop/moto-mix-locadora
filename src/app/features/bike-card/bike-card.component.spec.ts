import { registerLocaleData } from "@angular/common";
import localePt from "@angular/common/locales/pt";
import { TestBed } from "@angular/core/testing";
import { BikeCardComponent } from "./bike-card.component";
import { mixConfig } from "../../core/config/mix.config";
registerLocaleData(localePt);

describe("Independent card carousels", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  function create(models = mixConfig.bikes.slice(0, 2)) {
    const fixture = TestBed.createComponent(BikeCardComponent);
    fixture.componentRef.setInput("bike", models[0]);
    fixture.componentRef.setInput("alternatives", models);
    fixture.detectChanges();
    TestBed.tick();
    return fixture;
  }
  it("troca a ficha inteira automaticamente, repete o ciclo e preserva o modelo na reserva", () => {
    vi.useFakeTimers();
    const fixture = create(),
      card = fixture.componentInstance;
    expect(card.selectedBike().id).toBe("cg160");
    vi.advanceTimersByTime(6000);
    TestBed.tick();
    fixture.detectChanges();
    expect(card.selectedBike().id).toBe("fazer250");
    expect(fixture.nativeElement.querySelector("h3").textContent).toContain(
      "Yamaha Fazer 250",
    );
    expect(
      fixture.nativeElement
        .querySelector(".reserve")
        .getAttribute("aria-label"),
    ).toBe("Reservar Yamaha Fazer 250");
    expect(
      fixture.nativeElement
        .querySelector(".bike-visual img")
        .getAttribute("src"),
    ).toBe(mixConfig.bikes[1].image);
    vi.advanceTimersByTime(6000);
    TestBed.tick();
    expect(card.selectedBike().id).toBe("cg160");
    fixture.destroy();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("pausa somente o card em interação e se recupera quando o modelo é filtrado ou excluído", () => {
    vi.useFakeTimers();
    const first = create(),
      second = create();
    first.componentInstance.focused.set(true);
    TestBed.tick();
    vi.advanceTimersByTime(6000);
    TestBed.tick();
    expect(first.componentInstance.selectedBike().id).toBe("cg160");
    expect(second.componentInstance.selectedBike().id).toBe("fazer250");
    first.componentInstance.focused.set(false);
    first.componentInstance.pointerEntered({
      pointerType: "mouse",
    } as PointerEvent);
    TestBed.tick();
    vi.advanceTimersByTime(6000);
    TestBed.tick();
    expect(first.componentInstance.selectedBike().id).toBe("cg160");
    second.componentInstance.select("fazer250");
    second.componentRef.setInput("alternatives", [mixConfig.bikes[0]]);
    TestBed.tick();
    expect(second.componentInstance.selectedBike().id).toBe("cg160");
    expect(second.componentInstance.rotating()).toBe(false);
    first.destroy();
    second.destroy();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("respeita movimento reduzido e deixa a escolha pelos indicadores disponível", () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "matchMedia",
      vi
        .fn()
        .mockReturnValue({
          matches: true,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }),
    );
    const fixture = create();
    expect(fixture.componentInstance.rotating()).toBe(false);
    vi.advanceTimersByTime(12000);
    TestBed.tick();
    expect(fixture.componentInstance.selectedBike().id).toBe("cg160");
    fixture.nativeElement.querySelectorAll(".card-dots button")[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedBike().id).toBe("fazer250");
    fixture.destroy();
  });
});
