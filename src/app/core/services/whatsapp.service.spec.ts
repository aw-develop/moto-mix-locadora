import { TestBed } from "@angular/core/testing";
import { MIX_CONFIG, mixConfig } from "../config/mix.config";
import { WhatsappService } from "./whatsapp.service";

describe("WhatsappService", () => {
  it("preserva acentos e caracteres especiais no link da moto escolhida", () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: MIX_CONFIG,
          useValue: { ...mixConfig, whatsappNumber: "5511999999999" },
        },
      ],
    });
    const service = TestBed.inject(WhatsappService);
    const message = service.reserveMessage("Honda CG 160 & edição São Paulo");
    const url = new URL(service.url(message));
    expect(url.pathname).toBe("/5511999999999");
    expect(url.searchParams.get("text")).toBe(message);
    expect(service.prepare(message)).toBe(true);
  });
  it("interrompe o envio quando o telefone ainda é um placeholder", () => {
    const service = TestBed.inject(WhatsappService);
    expect(service.prepare("Quero alugar uma moto.")).toBe(false);
    expect(service.pendingMessage()).toBe("Quero alugar uma moto.");
    service.dismiss();
    expect(service.pendingMessage()).toBeNull();
  });
});
