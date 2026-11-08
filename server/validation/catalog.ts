import type {
  Activity,
  Banner,
  CatalogState,
  Motorcycle,
  SaveCatalog,
  SiteSettings,
} from "../models/catalog.ts";
import { fail } from "../http/errors.ts";
import {
  boolean,
  enumValue,
  https,
  object,
  price,
  rows,
  text,
} from "./fields.ts";
import { imageReference } from "./images.ts";
export function motorcycle(value: Record<string, unknown>): Motorcycle {
  const cardGroup =
    value["cardGroup"] === undefined
      ? ""
      : text(value["cardGroup"], "Grupo do card", 80, true);
  return {
    ...(cardGroup ? { cardGroup } : {}),
    id: text(value["id"], "ID", 80),
    name: text(value["name"], "Modelo", 80),
    version: text(value["version"], "Versão", 80),
    category: enumValue(
      value["category"],
      ["Entregas", "Urbana", "Touring"] as const,
      "Categoria",
    ),
    transmission: text(value["transmission"], "Transmissão", 60),
    consumption: text(value["consumption"], "Consumo", 60),
    description: text(value["description"], "Descrição", 600),
    image: imageReference(value["image"]),
    daily: price(value["daily"]),
    weekly: price(value["weekly"]),
    available: boolean(value["available"]),
  };
}
export function bannerMotorcycleIds(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 6)
    fail("Selecione até 6 motos por banner.");
  const ids = value.map((id) => text(id, "Moto do banner", 80));
  if (new Set(ids).size !== ids.length)
    fail("Não repita uma moto no mesmo banner.");
  return ids;
}
export function banner(
  value: Record<string, unknown>,
  position: number,
): Banner {
  const motorcycleIds = bannerMotorcycleIds(value["motorcycleIds"]);
  const image =
    value["image"] === "" && motorcycleIds.length
      ? ""
      : imageReference(value["image"]);
  const link = text(value["link"], "Link", 2000);
  if (!/^#[a-zA-Z][\w-]*$/.test(link) && !https(link))
    fail("Link de banner inválido.");
  return {
    id: text(value["id"], "ID", 80),
    title: text(value["title"], "Título", 120),
    subtitle: text(value["subtitle"], "Subtítulo", 300),
    image,
    ...(motorcycleIds.length ? { motorcycleIds } : {}),
    link,
    active: boolean(value["active"]),
    order:
      typeof value["order"] === "number" && Number.isInteger(value["order"])
        ? value["order"]
        : position,
  };
}
export function settings(value: unknown): SiteSettings {
  const s = object(value, "Configurações");
  const whatsappNumber = text(s["whatsappNumber"], "WhatsApp", 30);
  if (whatsappNumber !== "55SEUNUMERO" && !/^55\d{10,11}$/.test(whatsappNumber))
    fail("WhatsApp inválido.");
  const result = {
    whatsappNumber,
    address: text(s["address"], "Endereço"),
    hours: text(s["hours"], "Horários"),
    mapQuery: text(s["mapQuery"], "Mapa"),
    mapLabel: text(s["mapLabel"], "Legenda", 100),
    instagram: text(s["instagram"], "Instagram", 2000, true),
    facebook: text(s["facebook"], "Facebook", 2000, true),
  };
  if ([result.instagram, result.facebook].some((url) => url && !https(url)))
    fail("Rede social inválida.");
  return result;
}
export function activity(value: Record<string, unknown>): Activity {
  return {
    id: text(value["id"], "ID", 80),
    type: enumValue(
      value["type"],
      ["fleet", "banner", "settings", "whatsapp"] as const,
      "Tipo de atividade",
    ),
    title: text(value["title"], "Evento", 200),
    detail: text(value["detail"], "Detalhe", 600),
    at: text(value["at"], "Data", 80),
  };
}
export function catalogState(value: unknown): CatalogState {
  const state = object(value);
  const bikes = rows(state["bikes"], 100, "Frota").map(motorcycle);
  const banners = rows(state["banners"], 30, "Banners")
    .map(banner)
    .sort((a, b) => a.order - b.order)
    .map((value, order) => ({ ...value, order }));
  const ids = new Set(bikes.map((bike) => bike.id));
  for (const banner of banners)
    if (banner.motorcycleIds?.some((id) => !ids.has(id)))
      fail("Uma das motos do banner não está cadastrada na frota.");
  return {
    bikes,
    banners,
    settings: settings(state["settings"]),
    activities: rows(state["activities"] ?? [], 80, "Histórico").map(activity),
    visits: 0,
  };
}
export function saveCatalog(value: unknown): SaveCatalog {
  const body = object(value);
  const version = body["version"];
  if (typeof version !== "number" || !Number.isInteger(version) || version < 0)
    fail("Versão inválida.");
  return { version, state: catalogState(body["state"]) };
}
