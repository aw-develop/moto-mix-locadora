import { TestBed } from "@angular/core/testing";
import { AdminService } from "./admin.service";
import { AdminSessionService } from "./admin-session.service";
import { WhatsappService } from "./whatsapp.service";

describe("AdminService", () => {
  const draft = {
    name: "Honda Pop 110",
    version: "110 CC",
    category: "Entregas" as const,
    image: "assets/cg160.webp",
    daily: 39,
    weekly: 240,
    description: "Para o dia a dia.",
    transmission: "4 marchas",
    consumption: "Até 45 km/l",
    available: true,
  };
  function setup() {
    const service = TestBed.inject(AdminService);
    TestBed.inject(AdminSessionService).setIdentity({
      isAdmin: true,
      signedIn: true,
      name: "Admin teste",
      email: "admin@example.test",
    });
    return service;
  }
  it("exige autorização administrativa antes de qualquer mutação administrativa", () => {
    const service = TestBed.inject(AdminService);
    expect(() => service.saveMoto(draft)).toThrow(
      /Entre com a conta administradora/,
    );
    expect(() => service.toggleMoto("cg160")).toThrow();
    expect(() => service.deleteMoto("cg160")).toThrow();
    expect(() =>
      service.saveBanner({
        title: "Promo",
        subtitle: "Texto",
        image: "assets/hero.webp",
        link: "#motos",
        active: true,
      }),
    ).toThrow();
    expect(service.bikes().length).toBe(3);
  });
  it("cria, edita, alterna disponibilidade e exclui a moto no estado observável", () => {
    const service = setup();
    let emitted = 0;
    const sub = service.state$.subscribe(() => emitted++);
    service.saveMoto(draft);
    const moto = service.bikes().find((b) => b.name === draft.name)!;
    expect(service.stats().total).toBe(4);
    expect(service.stats().available).toBe(3);
    service.saveMoto(
      { ...moto, name: "Honda Pop atualizada", daily: 49 },
      moto.id,
    );
    service.toggleMoto(moto.id);
    expect(service.bikes().find((b) => b.id === moto.id)?.available).toBe(
      false,
    );
    expect(service.bikes().find((b) => b.id === moto.id)?.daily).toBe(49);
    service.deleteMoto(moto.id);
    expect(service.stats().total).toBe(3);
    expect(emitted).toBe(5);
    sub.unsubscribe();
  });
  it("rejeita preços inválidos e URLs executáveis sem alterar o estado", () => {
    const service = setup();
    expect(() => service.saveMoto({ ...draft, daily: NaN })).toThrow();
    expect(() =>
      service.saveMoto({ ...draft, image: "javascript:alert(1)" }),
    ).toThrow();
    expect(() =>
      service.saveBanner({
        title: "Teste",
        subtitle: "Teste",
        image: "assets/hero.webp",
        link: "javascript:alert(1)",
        active: true,
      }),
    ).toThrow();
    expect(service.bikes().length).toBe(3);
    expect(service.banners().length).toBe(1);
  });
  it("ordena, edita, pausa e exclui banners com posições consistentes", () => {
    const service = setup();
    service.saveBanner({
      title: "Segundo",
      subtitle: "Campanha",
      image: "assets/hero.webp",
      link: "#contato",
      active: true,
    });
    const second = service.banners()[1];
    service.moveBanner(second.id, -1);
    expect(service.banners()[0].id).toBe(second.id);
    expect(service.banners().map((b) => b.order)).toEqual([0, 1]);
    service.saveBanner({ ...second, title: "Campanha atualizada" }, second.id);
    expect(service.banners()[0].title).toBe("Campanha atualizada");
    service.toggleBanner(second.id);
    expect(service.activeBanners().length).toBe(1);
    service.deleteBanner("hero-main");
    expect(service.activeBanners().length).toBe(0);
    expect(service.banners()[0].order).toBe(0);
  });
  it("atualiza o telefone utilizado pelos CTAs e rejeita configuração inválida", () => {
    const service = setup();
    const whatsapp = TestBed.inject(WhatsappService);
    const settings = {
      ...service.settings(),
      whatsappNumber: "5511999999999",
      address: "Rua Mix, 100 — São Paulo, SP",
      instagram: "https://instagram.com/mix",
    };
    service.saveSettings(settings);
    expect(whatsapp.isConfigured).toBe(true);
    expect(new URL(whatsapp.url()).pathname).toBe("/5511999999999");
    expect(() =>
      service.saveSettings({ ...settings, facebook: "javascript:alert(1)" }),
    ).toThrow();
    expect(service.settings().address).toBe(settings.address);
  });
  it("registra somente métricas desta sessão, sem mensagens pessoais", () => {
    const service = setup();
    const whatsapp = TestBed.inject(WhatsappService);
    service.recordVisit();
    service.recordVisit();
    whatsapp.open("Olá, sou Ana, meu telefone é 11999999999.");
    expect(service.stats().visits).toBe(2);
    expect(service.state().activities[0].type).toBe("whatsapp");
    expect(JSON.stringify(service.state().activities)).not.toContain(
      "11999999999",
    );
  });
});
