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
