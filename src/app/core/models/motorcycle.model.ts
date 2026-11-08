export type MotorcycleCategory = "Entregas" | "Urbana" | "Touring";
export interface Motorcycle {
  readonly id: string;
  readonly name: string;
  readonly cardGroup?: string;
  readonly version: string;
  readonly category: MotorcycleCategory;
  readonly transmission: string;
  readonly consumption: string;
  readonly daily: number;
  readonly weekly: number;
  readonly available: boolean;
  readonly image: string;
  readonly description: string;
}
export interface MixConfig {
  readonly whatsappNumber: string;
  readonly address: string;
  readonly hours: string;
  readonly mapQuery: string;
  readonly mapLabel: string;
  readonly bikes: readonly Motorcycle[];
}
