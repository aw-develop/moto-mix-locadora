import { registerLocaleData } from "@angular/common";
import localePt from "@angular/common/locales/pt";
import { TestBed } from "@angular/core/testing";
import { HeroComponent } from "./hero.component";
import { AdminService } from "../../core/services/admin.service";
import { AdminSessionService } from "../../core/services/admin-session.service";

describe("Public hero integration", () => {
  it("reflete novas campanhas, navegação, pausa e exclusão sem recarregar", () => {
    TestBed.inject(AdminSessionService).setIdentity({
      isAdmin: true,
      signedIn: true,
      name: "Admin teste",
      email: "admin@example.test",
    });
    const admin = TestBed.inject(AdminService);
    const hero = TestBed.createComponent(HeroComponent).componentInstance;
    admin.saveBanner({
      title: "Campanha de fim de semana",
      subtitle: "Escolha sua moto.",
      image: "assets/hero.webp",
      link: "#motos",
      active: true,
    });
    admin.moveBanner(admin.banners()[1].id, -1);
    expect(hero.slide()?.title).toBe("Campanha de fim de semana");
    const id = hero.slide()!.id;
    admin.toggleBanner(id);
    expect(hero.slide()?.id).toBe("hero-main");
    admin.deleteBanner("hero-main");
    expect(hero.slide()).toBeNull();
  });
});

describe("Automatic hero carousel", () => {
  afterEach(() => vi.useRealTimers());
  it("rotaciona a cada 6 segundos, repete o ciclo e respeita pausa, hover e destruição", () => {
    vi.useFakeTimers();
    TestBed.inject(AdminSessionService).setIdentity({
      isAdmin: true,
      signedIn: true,
      name: "Admin teste",
      email: "admin@example.test",
    });
    const admin = TestBed.inject(AdminService);
    admin.saveBanner({
      title: "Segundo banner",
      subtitle: "Campanha",
      image: "assets/hero.webp",
      link: "#motos",
      active: true,
    });
    const fixture = TestBed.createComponent(HeroComponent);
    fixture.detectChanges();
    TestBed.tick();
    const hero = fixture.componentInstance;
    expect(
      fixture.nativeElement.querySelector(".carousel-playback"),
    ).toBeNull();
    const explore = fixture.nativeElement.querySelector(".explore-fleet");
    expect(explore.getAttribute("href")).toBe("#motos");
    expect(explore.querySelector("svg")).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[aria-label="Banner anterior"]'),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[aria-label="Próximo banner"]'),
    ).toBeNull();
    vi.advanceTimersByTime(6000);
    TestBed.tick();
    expect(hero.slide()?.title).toBe("Segundo banner");
    vi.advanceTimersByTime(6000);
    TestBed.tick();
    expect(hero.slide()?.id).toBe("hero-main");
    hero.focused.set(true);
    TestBed.tick();
    vi.advanceTimersByTime(12000);
    expect(hero.slide()?.id).toBe("hero-main");
    hero.focused.set(false);
    TestBed.tick();
    hero.pointerEntered({ pointerType: "mouse" } as PointerEvent);
    TestBed.tick();
    vi.advanceTimersByTime(6000);
    expect(hero.slide()?.id).toBe("hero-main");
    hero.hovered.set(false);
    TestBed.tick();
    vi.advanceTimersByTime(6000);
    expect(hero.slide()?.title).toBe("Segundo banner");
    fixture.destroy();
    vi.advanceTimersByTime(6000);
    expect(hero.slide()?.title).toBe("Segundo banner");
  });
});

describe("Multi-motorcycle banner", () => {
  it("exibe as motos juntas na ordem escolhida e acompanha preço, disponibilidade e exclusão", () => {
    TestBed.inject(AdminSessionService).setIdentity({
      isAdmin: true,
      signedIn: true,
      name: "Admin",
      email: "admin@example.test",
    });
    const admin = TestBed.inject(AdminService);
    const [first, second] = admin.bikes();
    admin.saveBanner(
      {
        ...admin.banners()[0],
        image: "",
        motorcycleIds: [second.id, first.id],
      },
      "hero-main",
    );
    const fixture = TestBed.createComponent(HeroComponent);
    fixture.detectChanges();
    let cards = fixture.nativeElement.querySelectorAll(".motorcycle-offer");
    expect(cards.length).toBe(2);
    expect(cards[0].querySelector("h2").textContent).toContain(second.name);
    expect(cards[1].textContent).toContain(first.transmission);
    expect(cards[1].textContent).toContain(first.consumption);
    const link = cards[1].querySelector("a");
    expect(link.getAttribute("aria-label")).toBe("Reservar " + first.name);
    admin.saveMoto({ ...first, daily: 123, weekly: 777 }, first.id);
    admin.toggleMoto(first.id);
    fixture.detectChanges();
    cards = fixture.nativeElement.querySelectorAll(".motorcycle-offer");
    expect(cards[1].querySelector(".offer-prices").textContent).toContain(
      "123",
    );
    expect(cards[1].querySelector(".offer-prices").textContent).toContain(
      "777",
    );
    expect(cards[1].querySelector("button").disabled).toBe(true);
    admin.deleteMoto(second.id);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll(".motorcycle-offer").length,
    ).toBe(1);
    expect(admin.banners()[0].motorcycleIds).toEqual([first.id]);
    admin.deleteMoto(first.id);
    expect(admin.banners()[0].motorcycleIds).toEqual([]);
    expect(admin.banners()[0].image).toBe("assets/hero.webp");
    fixture.destroy();
  });
});

registerLocaleData(localePt);
