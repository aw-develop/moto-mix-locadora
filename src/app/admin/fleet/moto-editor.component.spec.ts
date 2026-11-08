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
