import { TestBed } from "@angular/core/testing";
import { ContactComponent } from "./contact.component";
import { WhatsappService } from "../../core/services/whatsapp.service";

describe("ContactComponent", () => {
  it("rejeita campos vazios, espaços e telefone sem dígitos suficientes", () => {
    const contact = TestBed.createComponent(ContactComponent).componentInstance;
    const open = vi.spyOn(TestBed.inject(WhatsappService), "open");
    contact.submit();
    expect(open).not.toHaveBeenCalled();
    contact.form.setValue({ name: "   ", phone: "----------", message: "   " });
    expect(contact.form.invalid).toBe(true);
  });
  it("prepara uma mensagem completa com os dados preenchidos", () => {
    const contact = TestBed.createComponent(ContactComponent).componentInstance;
    const open = vi
      .spyOn(TestBed.inject(WhatsappService), "open")
      .mockImplementation(() => undefined);
    contact.form.setValue({
      name: " Ana ",
      phone: "(11) 99999-9999",
      message: " Quero a CG 160. ",
    });
    contact.submit();
    expect(open).toHaveBeenCalledWith(
      "Olá, sou Ana. Meu WhatsApp é (11) 99999-9999.\n\nQuero a CG 160.",
    );
  });
});
