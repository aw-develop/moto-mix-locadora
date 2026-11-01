import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { ImageUploadComponent } from "./image-upload.component";
import {
  ImageUploadService,
  UploadedImage,
} from "../../core/services/image-upload.service";
import { imageValidator } from "../../core/validation/admin.validators";

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ImageUploadComponent],
  template: '<mix-image-upload [formControl]="image" />',
})
class UploadHost {
  readonly image = new FormControl("assets/cg160.webp", {
    nonNullable: true,
    validators: [imageValidator],
  });
}

describe("ImageUploadComponent", () => {
  it("bloqueia o salvamento enquanto prepara a foto e atualiza o Reactive Form ao terminar", async () => {
    let resolve!: (image: UploadedImage) => void;
    const process = vi
      .fn()
      .mockReturnValue(new Promise<UploadedImage>((done) => (resolve = done)));
    TestBed.configureTestingModule({
      providers: [{ provide: ImageUploadService, useValue: { process } }],
    });
    const fixture = TestBed.createComponent(UploadHost);
    fixture.detectChanges();
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector("input[type=file]");
    const file = new File(["fake-data"], "foto.png", { type: "image/png" });
    Object.defineProperty(input, "files", { value: [file] });
    input.dispatchEvent(new Event("change"));
    fixture.detectChanges();
    expect(fixture.componentInstance.image.hasError("imageProcessing")).toBe(
      true,
    );
    expect(process).toHaveBeenCalledWith(file);
    resolve({ source: "assets/fazer250.webp", name: "foto.png", size: 200 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.image.valid).toBe(true);
    expect(fixture.componentInstance.image.value).toBe("assets/fazer250.webp");
    expect(fixture.nativeElement.querySelector("img").getAttribute("src")).toBe(
      "assets/fazer250.webp",
    );
    expect(fixture.nativeElement.textContent).toContain("foto.png");
  });
  it("mantém a imagem anterior ao rejeitar o arquivo e permite remover a seleção", async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ImageUploadService,
          useValue: {
            process: () =>
              Promise.reject(new Error("Escolha uma imagem JPG, PNG ou WebP.")),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(UploadHost);
    fixture.detectChanges();
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector("input[type=file]");
    Object.defineProperty(input, "files", {
      value: [new File(["bad"], "foto.svg", { type: "image/svg+xml" })],
    });
    input.dispatchEvent(new Event("change"));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.image.value).toBe("assets/cg160.webp");
    expect(fixture.nativeElement.textContent).toContain(
      "A imagem anterior foi mantida",
    );
    (
      fixture.nativeElement.querySelector(".upload-remove") as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.image.value).toBe("");
    expect(fixture.componentInstance.image.invalid).toBe(true);
  });
});
