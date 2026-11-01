export type Category = "Entregas" | "Urbana" | "Touring";
export interface Motorcycle {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly category: Category;
  readonly transmission: string;
  readonly consumption: string;
  readonly description: string;
  readonly image: string;
  readonly daily: number;
  readonly weekly: number;
  readonly available: boolean;
}
export interface Banner {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly image: string;
  readonly link: string;
  readonly active: boolean;
  readonly order: number;
}
export interface SiteSettings {
  readonly whatsappNumber: string;
  readonly address: string;
  readonly hours: string;
  readonly mapQuery: string;
  readonly mapLabel: string;
  readonly instagram: string;
  readonly facebook: string;
}
export type ActivityType = "fleet" | "banner" | "settings" | "whatsapp";
export interface Activity {
  readonly id: string;
  readonly type: ActivityType;
  readonly title: string;
  readonly detail: string;
  readonly at: string;
}
export interface CatalogState {
  readonly bikes: readonly Motorcycle[];
  readonly banners: readonly Banner[];
  readonly settings: SiteSettings;
  readonly activities: readonly Activity[];
  readonly visits: number;
}
export interface CatalogSnapshot {
  readonly state: CatalogState;
  readonly version: number;
  readonly updatedAt: string | null;
}
export interface SaveCatalog {
  readonly state: CatalogState;
  readonly version: number;
}
