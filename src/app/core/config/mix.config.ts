import { InjectionToken } from "@angular/core";
import { MixConfig } from "../models/motorcycle.model";

// Substitua os dados demonstrativos pelos dados reais antes de divulgar.
export const mixConfig: MixConfig = {
  whatsappNumber: "55SEUNUMERO", // DDI + DDD + número, somente dígitos.
  address:
    "Endereço completo da locadora a confirmar.\nSão Paulo — SP (referência demonstrativa).",
  hours:
    "Segunda a sexta · 8h às 18h\nSábado · 8h às 13h\nHorários demonstrativos — confirme com a equipe.",
  mapQuery: "São Paulo Brasil",
  mapLabel: "LOCALIZAÇÃO DEMONSTRATIVA · SÃO PAULO",
  bikes: [
    {
      id: "cg160",
      name: "Honda CG 160",
      version: "TITAN · 160 CC",
      category: "Entregas",
      transmission: "5 marchas",
      consumption: "Até 40 km/l",
      daily: 45,
      weekly: 280,
      available: true,
      image: "assets/cg160.webp",
      description: "Leve no trânsito. Forte no seu corre.",
    },
    {
      id: "fazer250",
      name: "Yamaha Fazer 250",
      version: "FZ25 · 250 CC",
      category: "Urbana",
      transmission: "5 marchas",
      consumption: "Até 30 km/l",
      daily: 75,
      weekly: 450,
      available: true,
      image: "assets/fazer250.webp",
      description: "Presença e conforto em cada trajeto.",
    },
    {
      id: "xre300",
      name: "Honda XRE 300",
      version: "ADVENTURE · 300 CC",
      category: "Touring",
      transmission: "5 marchas",
      consumption: "Até 28 km/l",
      daily: 95,
      weekly: 590,
      available: false,
      image: "assets/xre300.webp",
      description: "Seu espírito livre vai mais longe.",
    },
  ],
};
export const MIX_CONFIG = new InjectionToken<MixConfig>("MIX_CONFIG", {
  providedIn: "root",
  factory: () => mixConfig,
});
