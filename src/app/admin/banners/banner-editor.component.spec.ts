import { registerLocaleData } from "@angular/common";
import localePt from "@angular/common/locales/pt";
import { TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { BannerEditorComponent } from "./banner-editor.component";
import { AdminService } from "../../core/services/admin.service";
import { AdminSessionService } from "../../core/services/admin-session.service";

describe("Banner motorcycle editor", () => {
  it("seleciona, ordena, mostra prévia e salva sem imagem de fundo; exige imagem sem motos", () => {
    const close = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: MatDialogRef, useValue: { close } },
      ],
    });
    TestBed.inject(AdminSessionService).setIdentity({
      isAdmin: true,
      signedIn: true,
      name: "Admin",
      email: "admin@example.test",
    });
    const admin = TestBed.inject(AdminService);
    const fixture = TestBed.createComponent(BannerEditorComponent),
      editor = fixture.componentInstance;
    editor.form.patchValue({
      title: "Duas motos",
      subtitle: "Escolha seu modelo",
    });
    expect(editor.form.invalid).toBe(true);
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll(
      ".motorcycle-option input",
    );
    options[0].click();
    options[1].click();
    fixture.detectChanges();
    expect(editor.form.valid).toBe(true);
    expect(
      fixture.nativeElement.querySelectorAll(".motorcycle-offer").length,
    ).toBe(2);
    editor.moveMotorcycle(1, -1);
    expect(editor.form.controls.motorcycleIds.value).toEqual([
      admin.bikes()[1].id,
      admin.bikes()[0].id,
    ]);
    editor.save();
    expect(close).toHaveBeenCalledWith(true);
    expect(admin.banners()[1].motorcycleIds).toEqual(
      editor.form.controls.motorcycleIds.value,
    );
    editor.removeMotorcycle(admin.bikes()[0].id);
    editor.removeMotorcycle(admin.bikes()[1].id);
    expect(editor.form.controls.image.hasError("required")).toBe(true);
    fixture.destroy();
  });
});

registerLocaleData(localePt);
