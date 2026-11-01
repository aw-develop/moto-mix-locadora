import { TestBed } from "@angular/core/testing";
import {
  ImageUploadService,
  MAX_UPLOAD_BYTES,
  matchesImageSignature,
  validateImageFile,
} from "./image-upload.service";
import { isSafeImage } from "../validation/admin.validators";
import { AdminService } from "./admin.service";
import { AdminSessionService } from "./admin-session.service";

const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jc1sAAAAASUVORK5CYII=";
const pngBytes = Uint8Array.from(atob(png), (c) => c.charCodeAt(0));

describe("Device image upload", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  it("rejeita arquivos vazios, maiores que 5 MB e formatos não suportados", () => {
    expect(() =>
      validateImageFile({ type: "image/png", size: MAX_UPLOAD_BYTES + 1 }),
    ).toThrow(/5 MB/);
    expect(() => validateImageFile({ type: "image/png", size: 0 })).toThrow();
    expect(() =>
      validateImageFile({ type: "image/svg+xml", size: 100 }),
    ).toThrow(/JPG/);
    expect(() =>
      validateImageFile({ type: "image/heic", size: 100 }),
    ).toThrow();
  });
  it("verifica assinatura e recusa scripts ou SVG disfarçados de imagem", async () => {
    const service = TestBed.inject(ImageUploadService);
    expect(matchesImageSignature(pngBytes, "image/png")).toBe(true);
    expect(isSafeImage("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).toBe(
      false,
    );
    expect(
      isSafeImage("data:image/png;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="),
    ).toBe(false);
    await expect(
      service.process(
        new File(["<svg></svg>"], "fake.png", { type: "image/png" }),
      ),
    ).rejects.toThrow(/conteúdo/);
  });
  it("otimiza o arquivo, libera o bitmap e permite salvar a imagem no estado compartilhado", async () => {
    const close = vi.fn();
    const drawImage = vi.fn();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ width: 4000, height: 2000, close }),
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      function (this: HTMLCanvasElement, callback) {
        expect(this.width).toBe(1920);
        expect(this.height).toBe(960);
        callback(new Blob([pngBytes], { type: "image/png" }));
      },
    );
    const image = await TestBed.inject(ImageUploadService).process(
      new File([pngBytes], "moto.png", { type: "image/png" }),
    );
    expect(isSafeImage(image.source)).toBe(true);
    expect(drawImage).toHaveBeenCalled();
    expect(close).toHaveBeenCalledOnce();
    TestBed.inject(AdminSessionService).setIdentity({
      isAdmin: true,
      signedIn: true,
      name: "Admin teste",
      email: "admin@example.test",
    });
    const admin = TestBed.inject(AdminService);
    admin.saveMoto({ ...admin.bikes()[0], image: image.source }, "cg160");
    admin.saveBanner({
      title: "Foto local",
      subtitle: "Banner do dispositivo.",
      image: image.source,
      link: "#motos",
      active: true,
    });
    expect(admin.bikes()[0].image).toBe(image.source);
    expect(admin.activeBanners()[1].image).toBe(image.source);
  });
});
