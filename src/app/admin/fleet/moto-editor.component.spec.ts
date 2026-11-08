import { mixConfig } from "../../core/config/mix.config";
import { TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MotoEditorComponent } from "./moto-editor.component";
import { AdminService } from "../../core/services/admin.service";
import { AdminSessionService } from "../../core/services/admin-session.service";

describe("Fleet card grouping editor", () => {
  it("sugere grupos existentes, salva a associação e permite retirar a moto do grupo", () => {
    const bike = mixConfig.bikes[1],
      close = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: bike },
        { provide: MatDialogRef, useValue: { close } },
      ],
    });
    const admin = TestBed.inject(AdminService);
    TestBed.inject(AdminSessionService).setIdentity({
      isAdmin: true,
      signedIn: true,
      name: "Admin",
      email: "",
    });
    admin.saveMoto(
      { ...admin.bikes()[0], cardGroup: "Motos urbanas" },
      admin.bikes()[0].id,
    );
    const fixture = TestBed.createComponent(MotoEditorComponent),
      editor = fixture.componentInstance;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector("datalist option").value).toBe(
      "Motos urbanas",
    );
    const field = fixture.nativeElement.querySelector(
      '[formControlName="cardGroup"]',
    );
    field.value = "Motos urbanas";
    field.dispatchEvent(new Event("input"));
    editor.save();
    expect(close).toHaveBeenCalledWith(true);
    expect(admin.bikes().find((b) => b.id === bike.id)?.cardGroup).toBe(
      "Motos urbanas",
    );
    editor.form.controls.cardGroup.setValue("");
    editor.save();
    expect(admin.bikes().find((b) => b.id === bike.id)?.cardGroup).toBe("");
    editor.form.controls.cardGroup.setValue("a".repeat(81));
    expect(editor.form.invalid).toBe(true);
    fixture.destroy();
  });
});

describe("Adding a complete card inside a fleet card", () => {
  it("não altera o catálogo ao abrir ou salvar inválido; adiciona as duas associações numa única atualização", () => {
    const close = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { addToCard: "cg160" } },
        { provide: MatDialogRef, useValue: { close } },
      ],
    });
    const admin = TestBed.inject(AdminService);
    TestBed.inject(AdminSessionService).setIdentity({
      isAdmin: true,
      signedIn: true,
      name: "Admin",
      email: "",
    });
    const before = admin.state();
    const fixture = TestBed.createComponent(MotoEditorComponent),
      editor = fixture.componentInstance;
    fixture.detectChanges();
    expect(admin.state()).toBe(before);
    expect(
      fixture.nativeElement.querySelector('[formControlName="cardGroup"]'),
    ).toBeNull();
    editor.save();
    expect(admin.state()).toBe(before);
    const model = admin.bikes()[1];
    editor.form.patchValue({ ...model, name: "Nova moto do card", daily: 99 });
    let updates = 0;
    const sub = admin.state$.subscribe(() => updates++);
    editor.save();
    expect(close).toHaveBeenCalledWith(true);
    expect(updates).toBe(2);
    const added = admin.bikes().at(-1)!;
    expect(added.id).not.toBe(model.id);
    expect(added.name).toBe("Nova moto do card");
    expect(added.cardGroup).toBe(admin.bikes()[0].cardGroup);
    expect(added.cardGroup).toBeTruthy();
    expect(admin.bikes()[1].cardGroup).toBeUndefined();
    expect(admin.bikes()[0].daily).not.toBe(99);
    sub.unsubscribe();
    fixture.destroy();
  });
});
