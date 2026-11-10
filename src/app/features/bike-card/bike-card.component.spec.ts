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
    expect(fixture.nativeElement.querySelector(".card-slide.is-active h3").textContent).toContain(
      "Yamaha Fazer 250",
    );
    expect(
      fixture.nativeElement
        .querySelector(".card-slide.is-active .reserve")
        .getAttribute("aria-label"),
    ).toBe("Reservar Yamaha Fazer 250");
    expect(
      fixture.nativeElement
        .querySelector(".card-slide.is-active .bike-visual img")
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
      vi.fn().mockReturnValue({
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
  it("mantém navegação limitada com 11 motos e permite percorrer todo o ciclo por botões e teclado", () => {
    vi.useFakeTimers();
    const models = Array.from({ length: 11 }, (_, i) => ({
      ...mixConfig.bikes[0],
      id: "moto-" + i,
      name: "Moto " + (i + 1),
    }));
    const fixture = create(models),
      component = fixture.componentInstance;
    const page = () => fixture.nativeElement.querySelector(".card-pagination");
    const next = () =>
      page().querySelector('[aria-label="Próxima moto neste card"]');
    expect(page().querySelectorAll(".card-dots button").length).toBe(5);
    for (let i = 1; i < 11; i++) {
      next().click();
      fixture.detectChanges();
      expect(component.selectedBike().id).toBe("moto-" + i);
    }
    expect(page().querySelector(".card-count").textContent).toContain(
      "11 / 11",
    );
    expect(page().querySelectorAll(".card-dots button").length).toBe(5);
    expect(
      page().querySelector('[aria-pressed="true"]').getAttribute("aria-label"),
    ).toBe("Ver Moto 11");
    next().click();
    fixture.detectChanges();
    expect(component.currentIndex()).toBe(0);
    page().querySelector('[aria-label="Moto anterior neste card"]').click();
    fixture.detectChanges();
    expect(component.currentIndex()).toBe(10);
    page().dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowRight",
        bubbles: true,
        cancelable: true,
      }),
    );
    fixture.detectChanges();
    expect(component.currentIndex()).toBe(0);
    page().dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowLeft",
        bubbles: true,
        cancelable: true,
      }),
    );
    fixture.detectChanges();
    expect(component.currentIndex()).toBe(10);
    fixture.destroy();
  });
  it("desliza em ambos os sentidos, ignora gestos verticais e mantém variantes inativas fora da interação", () => {
    const fixture = create();
    const card = fixture.componentInstance;
    const target = { setPointerCapture: vi.fn() };
    const event = (x: number, y: number, id = 1) => ({ pointerType: "touch", isPrimary: true, pointerId: id, clientX: x, clientY: y, currentTarget: target }) as unknown as PointerEvent;
    card.swipeStart(event(200, 80));
    card.swipeEnd(event(100, 90));
    fixture.detectChanges();
    expect(card.selectedBike().id).toBe("fazer250");
    expect(fixture.nativeElement.querySelectorAll(".card-slide").length).toBe(2);
    const hidden = fixture.nativeElement.querySelector('.card-slide[aria-hidden="true"]');
    expect(hidden.hasAttribute("inert")).toBe(true);
    card.swipeStart(event(100, 80));
    card.swipeEnd(event(200, 90));
    expect(card.selectedBike().id).toBe("cg160");
    card.swipeStart(event(200, 80));
    card.swipeEnd(event(150, 220));
    expect(card.selectedBike().id).toBe("cg160");
    card.swipeStart(event(200, 80));
    card.swipeCancel();
    card.swipeEnd(event(100, 90));
    expect(card.selectedBike().id).toBe("cg160");
    fixture.destroy();
  });

});
