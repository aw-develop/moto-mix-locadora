import { registerLocaleData } from "@angular/common";
import localePt from "@angular/common/locales/pt";
import { TestBed } from "@angular/core/testing";
import { RentalConditionsComponent } from "./rental-conditions.component";
import { AdminService } from "../../core/services/admin.service";
import { AdminSessionService } from "../../core/services/admin-session.service";
import { SettingsComponent } from "../../admin/settings/settings.component";
registerLocaleData(localePt);

describe("Condições públicas do aluguel", () => {
  it("exibe preços disponíveis e orientações neutras sem inventar caução ou documentos", () => {
    const fixture = TestBed.createComponent(RentalConditionsComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.plans().map(p => p.price)).toEqual([45, 280]);
    const terms = fixture.nativeElement.querySelectorAll("details");
    expect(terms.length).toBe(4);
    expect(terms[0].textContent).toContain("Confirme o valor da caução");
    expect(terms[1].textContent).toContain("Consulte os documentos");
    fixture.destroy();
  });
  it("atualiza o site com os textos salvos no formulário e descarta alterações pendentes", () => {
    const admin = TestBed.inject(AdminService);
    TestBed.inject(AdminSessionService).setIdentity({ isAdmin: true, signedIn: true, name: "Admin", email: "" });
    const settings = TestBed.createComponent(SettingsComponent);
    settings.componentInstance.form.controls.whatsappNumber.setValue("5511999999999");
    settings.componentInstance.form.controls.rentalConditions.controls.deposit.setValue("Consulte nossa caução na retirada.");
    settings.componentInstance.save();
    expect(settings.componentInstance.error()).toBe("");
    expect(admin.settings().rentalConditions?.deposit).toBe("Consulte nossa caução na retirada.");
    const publicView = TestBed.createComponent(RentalConditionsComponent);
    publicView.detectChanges();
    expect(publicView.nativeElement.textContent).toContain("Consulte nossa caução na retirada.");
    settings.componentInstance.form.controls.rentalConditions.controls.deposit.setValue("Alteração pendente");
    settings.componentInstance.reset();
    expect(settings.componentInstance.form.controls.rentalConditions.controls.deposit.value).toBe("Consulte nossa caução na retirada.");
    for (const bike of admin.bikes()) if (bike.available) admin.toggleMoto(bike.id);
    expect(publicView.componentInstance.plans().every(p => p.price === null)).toBe(true);
    publicView.destroy();
    settings.destroy();
  });
});
