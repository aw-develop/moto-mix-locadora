import { Motorcycle } from "./motorcycle.model";
export type Moto = Motorcycle;
export type MotoDraft = Omit<Moto, "id">;
export interface Banner {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly image: string;
  readonly link: string;
  readonly active: boolean;
  readonly order: number;
  readonly motorcycleIds?: readonly string[];
}
export type BannerDraft = Omit<Banner, "id" | "order">;
export interface SiteSettings {
  readonly whatsappNumber: string;
  readonly address: string;
  readonly hours: string;
  readonly mapQuery: string;
  readonly mapLabel: string;
  readonly instagram: string;
  readonly facebook: string;
}
export interface AdminActivity {
  readonly id: string;
  readonly type: "fleet" | "banner" | "settings" | "whatsapp";
  readonly title: string;
  readonly detail: string;
  readonly at: string;
}
export interface AdminState {
  readonly bikes: readonly Moto[];
  readonly banners: readonly Banner[];
  readonly settings: SiteSettings;
  readonly activities: readonly AdminActivity[];
  readonly visits: number;
}
