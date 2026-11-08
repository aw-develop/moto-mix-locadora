import { TestBed } from "@angular/core/testing";
import { AdminService } from "./admin.service";
import { mixConfig } from "../config/mix.config";

describe("Server persistence", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
  const initial = () => ({
    bikes: mixConfig.bikes,
    banners: [],
    settings: { ...mixConfig, instagram: "", facebook: "" },
    activities: [],
    visits: 0,
  });
  it("salva uma alteração e recupera os dados em uma nova instância da aplicação", async () => {
    vi.useFakeTimers();
    let persisted = structuredClone(initial()),
      version = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, options?: RequestInit) => {
        if (url === "/api/session")
          return Response.json({
            isAdmin: true,
            signedIn: true,
            name: "Admin",
            email: "admin@example.com",
          });
        if (options?.method === "PUT") {
          const body = JSON.parse(String(options.body));
          expect(body.version).toBe(version);
          persisted = body.state;
          version++;
        }
        return Response.json({
          state: persisted,
          version,
          updatedAt: "2026-10-31T12:00:00Z",
        });
      }),
    );
    const first = TestBed.inject(AdminService);
    await first.initialize();
    first.saveMoto(
      { ...first.bikes()[0], daily: 79, cardGroup: "Motos para entregas" },
      "cg160",
    );
    expect(first.saveStatus()).toBe("saving");
    await vi.advanceTimersByTimeAsync(300);
    expect(first.saveStatus()).toBe("saved");
    TestBed.resetTestingModule();
    const second = TestBed.inject(AdminService);
    await second.initialize();
    expect(second.bikes()[0].daily).toBe(79);
    expect(second.bikes()[0].cardGroup).toBe("Motos para entregas");
  });
  it("mantém os dados locais e mostra conflito quando outro dispositivo já salvou", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, options?: RequestInit) => {
        if (url === "/api/session")
          return Response.json({
            isAdmin: true,
            signedIn: true,
            name: "Admin",
            email: "admin@example.com",
          });
        if (options?.method === "PUT")
          return Response.json(
            { error: "Outro dispositivo atualizou os dados." },
            { status: 409 },
          );
        return Response.json({ state: initial(), version: 1 });
      }),
    );
    const service = TestBed.inject(AdminService);
    await service.initialize();
    service.toggleMoto("cg160");
    await vi.advanceTimersByTimeAsync(300);
    expect(service.saveStatus()).toBe("conflict");
    expect(service.saveError()).toContain("Outro dispositivo");
    expect(service.bikes()[0].available).toBe(false);
  });
  it("não anuncia sucesso em erro de rede e permite tentar novamente", async () => {
    vi.useFakeTimers();
    let fail = true;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, options?: RequestInit) => {
        if (url === "/api/session")
          return Response.json({
            isAdmin: true,
            signedIn: true,
            name: "Admin",
            email: "admin@example.com",
          });
        if (options?.method === "PUT") {
          if (fail) throw new Error("Conexão interrompida");
          return Response.json({
            state: JSON.parse(String(options.body)).state,
            version: 1,
          });
        }
        return Response.json({ state: initial(), version: 0 });
      }),
    );
    const service = TestBed.inject(AdminService);
    await service.initialize();
    service.toggleMoto("cg160");
    await vi.advanceTimersByTimeAsync(300);
    expect(service.saveStatus()).toBe("error");
    fail = false;
    service.retrySave();
    await vi.advanceTimersByTimeAsync(0);
    expect(service.saveStatus()).toBe("saved");
  });
});
