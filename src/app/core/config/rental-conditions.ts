import { RentalConditions } from "../models/admin.model";
export const rentalFields = [
  { key: "dailyPlan", label: "Plano diário" },
  { key: "weeklyPlan", label: "Plano semanal" },
  { key: "deposit", label: "Caução e pagamento" },
  { key: "documents", label: "Documentos e aprovação" },
  { key: "coverage", label: "Cobertura e proteção" },
  { key: "included", label: "O que está incluído" },
] as const;
export const defaultRentalConditions: RentalConditions = {
  dailyPlan: "Consulte o período mínimo e as condições de retirada para o modelo escolhido.",
  weeklyPlan: "Consulte o total da semana e as condições de renovação.",
  deposit: "Confirme o valor da caução, a forma de pagamento e o prazo de devolução antes da contratação.",
  documents: "Consulte os documentos e os critérios de aprovação exigidos pela Mix.",
  coverage: "Consulte as coberturas, franquias e exclusões no contrato do plano escolhido.",
  included: "Confirme os serviços e itens incluídos no preço e as possíveis cobranças adicionais.",
};
export function rentalConditions(value?: RentalConditions): RentalConditions {
  return Object.fromEntries(rentalFields.map(({ key }) => [key, value?.[key]?.trim() || defaultRentalConditions[key]])) as unknown as RentalConditions;
}
