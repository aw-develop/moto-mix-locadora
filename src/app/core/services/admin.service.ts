import {
  computed,
  inject,
  Injectable,
  signal,
  DestroyRef,
  PLATFORM_ID,
  REQUEST_CONTEXT,
  TransferState,
  makeStateKey,
  afterNextRender,
} from "@angular/core";
import { isPlatformServer } from "@angular/common";
import { toSignal } from "@angular/core/rxjs-interop";
import { BehaviorSubject } from "rxjs";
import { MIX_CONFIG } from "../config/mix.config";
import {
  AdminActivity,
  AdminState,
  BannerDraft,
  MotoDraft,
  SiteSettings,
} from "../models/admin.model";
import {
  isHttps,
  isSafeImage,
  isSafeLink,
} from "../validation/admin.validators";
import { AdminSessionService } from "./admin-session.service";

interface PublicSnapshot { state: AdminState; version: number; updatedAt: string | null; }
const PUBLIC_CATALOG = makeStateKey<PublicSnapshot | null>("mix.public-catalog");

/** Reactive repository synchronized with the authenticated D1/R2 backend. */
@Injectable({ providedIn: "root" })
export class AdminService {
  private readonly transferState = inject(TransferState);
  private refreshAfterHydration = false;
  private readonly serverRendering = isPlatformServer(inject(PLATFORM_ID));
  private readonly renderContext = inject(REQUEST_CONTEXT, { optional: true }) as { publicCatalog?: PublicSnapshot } | null;
  private readonly config = inject(MIX_CONFIG);
  private readonly session = inject(AdminSessionService);
  private readonly subject = new BehaviorSubject<AdminState>({
    bikes: this.config.bikes.map((bike) => ({ ...bike })),
    banners: [
      {
        id: "hero-main",
        title: "ALUGUE SUA MOTO E VÁ MAIS LONGE.",
        subtitle:
          "Para fazer o corre ou sair da rotina. A moto certa para o seu próximo movimento.",
        image: "assets/hero.webp",
        link: "#motos",
        active: true,
        order: 0,
      },
    ],
    settings: {
      whatsappNumber: this.config.whatsappNumber,
      address: this.config.address,
      hours: this.config.hours,
      mapQuery: this.config.mapQuery,
      mapLabel: this.config.mapLabel,
      instagram: "",
      facebook: "",
    },
    activities: [],
    visits: 0,
  });
  readonly state$ = this.subject.asObservable();
  readonly state = toSignal(this.state$, { requireSync: true });
  readonly bikes = computed(() => this.state().bikes);
  readonly banners = computed(() =>
    [...this.state().banners].sort((a, b) => a.order - b.order),
  );
  readonly activeBanners = computed(() =>
    this.banners().filter((banner) => banner.active),
  );
  readonly settings = computed(() => this.state().settings);
  readonly stats = computed(() => ({
    total: this.bikes().length,
    available: this.bikes().filter((b) => b.available).length,
    rented: this.bikes().filter((b) => !b.available).length,
    visits: this.state().visits,
  }));
  readonly saveStatus = signal<
    "loading" | "saved" | "saving" | "error" | "conflict"
  >("loading");
  readonly saveError = signal("");
  readonly savedAt = signal<string | null>(null);
  private hydrated = false;
  private version = 0;
  private generation = 0;
  private savedGeneration = 0;
  private running = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  constructor() {
    afterNextRender(() => {
      if (this.refreshAfterHydration) {
        this.refreshAfterHydration = false;
        void this.initialize();
      }
    });
    const guard = (event: BeforeUnloadEvent) => {
      if (this.generation > this.savedGeneration) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    if (typeof window !== "undefined")
      window.addEventListener("beforeunload", guard);
    inject(DestroyRef).onDestroy(() => {
      if (this.timer) clearTimeout(this.timer);
      if (typeof window !== "undefined")
        window.removeEventListener("beforeunload", guard);
    });
  }
  async initialize(): Promise<void> {
    if (this.serverRendering) {
      const snapshot = this.renderContext?.publicCatalog;
      if (snapshot) {
        const publicSnapshot: PublicSnapshot = {
          ...snapshot,
          state: { ...snapshot.state, banners: snapshot.state.banners.filter(b => b.active), activities: [], visits: 0 },
        };
        this.subject.next(publicSnapshot.state);
        this.version = publicSnapshot.version;
        this.savedAt.set(publicSnapshot.updatedAt);
        this.saveStatus.set("saved");
        this.transferState.set(PUBLIC_CATALOG, publicSnapshot);
      }
      // No HTTP requests, credentials or browser APIs during SSR/route discovery.
      return;
    }
    const transferred = this.transferState.get(PUBLIC_CATALOG, null);
    if (transferred) {
      this.transferState.remove(PUBLIC_CATALOG);
      this.subject.next(transferred.state);
      this.version = transferred.version;
      this.savedAt.set(transferred.updatedAt);
      this.saveStatus.set("saved");
      this.hydrated = true;
      this.refreshAfterHydration = true;
      return;
    }
    this.saveStatus.set("loading");
    try {
      const [sessionResponse, stateResponse] = await Promise.all([
        fetch("/api/session", {
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        }),
        fetch("/api/state", {
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        }),
      ]);
      if (!sessionResponse.ok || !stateResponse.ok)
        throw new Error(
          "Não foi possível carregar os dados salvos. Tente novamente.",
        );
      const [identity, result] = await Promise.all([
        sessionResponse.json(),
        stateResponse.json(),
      ]);
      this.subject.next(result.state);
      this.version = result.version;
      this.session.setIdentity(identity);
      this.hydrated = true;
      this.generation = 0;
      this.savedGeneration = 0;
      this.savedAt.set(result.updatedAt);
      this.saveError.set("");
      this.saveStatus.set("saved");
    } catch (error) {
      this.saveError.set(
        error instanceof Error ? error.message : "Servidor indisponível.",
      );
      this.saveStatus.set("error");
    }
  }
  retrySave(): void {
    void this.flush();
  }
  private queueSave(): void {
    if (!this.hydrated || !this.session.active()) return;
    this.generation++;
    this.saveStatus.set("saving");
    this.saveError.set("");
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), 300);
  }
  private async flush(): Promise<void> {
    if (
      !this.hydrated ||
      this.running ||
      this.generation === this.savedGeneration ||
      !this.session.active()
    )
      return;
    if (this.timer) clearTimeout(this.timer);
    this.running = true;
    const generation = this.generation;
    const snapshot = this.state();
    this.saveStatus.set("saving");
    try {
      const response = await fetch("/api/state", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ version: this.version, state: snapshot }),
        signal: AbortSignal.timeout(45000),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409) this.saveStatus.set("conflict");
        throw new Error(
          result.error || "Não foi possível salvar. Tente novamente.",
        );
      }
      this.version = result.version;
      this.savedAt.set(result.updatedAt);
      this.savedGeneration = generation;
      if (generation === this.generation) {
        this.subject.next({ ...result.state, visits: this.state().visits });
        this.saveStatus.set("saved");
      }
    } catch (error) {
      this.saveError.set(
        error instanceof Error ? error.message : "Erro de conexão.",
      );
      if (this.saveStatus() !== "conflict") this.saveStatus.set("error");
    } finally {
      this.running = false;
    }
    if (
      this.saveStatus() === "saving" &&
      this.generation > this.savedGeneration
    )
      void this.flush();
  }
  private text(value: string, label: string, max = 160): string {
    const text = value.trim();
    if (!text || text.length > max)
      throw new Error(`${label}: preencha até ${max} caracteres.`);
    return text;
  }
  private commit(
    patch: Partial<AdminState>,
    type: AdminActivity["type"],
    title: string,
    detail: string,
  ): void {
    const activity: AdminActivity = {
      id: crypto.randomUUID(),
      type,
      title,
      detail,
      at: new Date().toISOString(),
    };
    this.subject.next({
      ...this.state(),
      ...patch,
      activities: [activity, ...this.state().activities].slice(0, 80),
    });
    if (type !== "whatsapp") this.queueSave();
  }
  addMotoToCard(draft: MotoDraft, parentId: string): void {
    this.saveMoto(draft, undefined, parentId);
  }
  saveMoto(draft: MotoDraft, id?: string, parentId?: string): void {
    this.session.assertAdminSession();
    if (id && !this.bikes().some((b) => b.id === id))
      throw new Error("Moto não encontrada.");
    if (!["Entregas", "Urbana", "Touring"].includes(draft.category))
      throw new Error("Categoria inválida.");
    if (
      ![draft.daily, draft.weekly].every(
        (p) => Number.isFinite(p) && p > 0 && p <= 100000,
      )
    )
      throw new Error("Informe valores positivos de até R$ 100.000.");
    if (!isSafeImage(draft.image.trim()))
      throw new Error(
        "Escolha uma imagem do dispositivo, uma URL HTTPS ou um arquivo em assets/.",
      );
    const parent = parentId
      ? this.bikes().find((bike) => bike.id === parentId)
      : undefined;
    if (parentId && !parent)
      throw new Error("O card de origem não existe mais.");
    const cardGroup = (
      (parent
        ? parent.cardGroup ||
          "Card · " + parent.name.slice(0, 40) + " · " + parent.id.slice(0, 8)
        : undefined) ??
      draft.cardGroup ??
      this.bikes().find((b) => b.id === id)?.cardGroup ??
      ""
    ).trim();
    if (cardGroup.length > 80)
      throw new Error("Grupo do card: use até 80 caracteres.");
    const moto = {
      ...draft,
      cardGroup,
      id: id || crypto.randomUUID(),
      name: this.text(draft.name, "Modelo", 80),
      version: this.text(draft.version, "Versão", 80),
      description: this.text(draft.description, "Descrição", 600),
      transmission: this.text(draft.transmission, "Transmissão", 60),
      consumption: this.text(draft.consumption, "Consumo", 60),
      image: draft.image.trim(),
      available: !!draft.available,
    };
    const bikes = id
      ? this.bikes().map((b) => (b.id === id ? moto : b))
      : [
          ...this.bikes().map((bike) =>
            bike.id === parentId ? { ...bike, cardGroup } : bike,
          ),
          moto,
        ];
    this.commit(
      { bikes },
      "fleet",
      id ? "Moto atualizada" : "Moto adicionada",
      moto.name,
    );
  }
  toggleMoto(id: string): void {
    this.session.assertAdminSession();
    const moto = this.bikes().find((b) => b.id === id);
    if (!moto) throw new Error("Moto não encontrada.");
    this.commit(
      {
        bikes: this.bikes().map((b) =>
          b.id === id ? { ...b, available: !b.available } : b,
        ),
      },
      "fleet",
      "Disponibilidade alterada",
      `${moto.name} · ${moto.available ? "Alugada" : "Disponível"}`,
    );
  }
  deleteMoto(id: string): void {
    this.session.assertAdminSession();
    const moto = this.bikes().find((b) => b.id === id);
    if (!moto) throw new Error("Moto não encontrada.");
    this.commit(
      {
        bikes: this.bikes().filter((b) => b.id !== id),
        banners: this.banners().map((banner) => {
          const motorcycleIds = banner.motorcycleIds?.filter(
            (motoId) => motoId !== id,
          );
          return {
            ...banner,
            ...(motorcycleIds ? { motorcycleIds } : {}),
            image:
              !banner.image && !motorcycleIds?.length
                ? "assets/hero.webp"
                : banner.image,
          };
        }),
      },
      "fleet",
      "Moto excluída",
      moto.name,
    );
  }
  saveBanner(draft: BannerDraft, id?: string): void {
    this.session.assertAdminSession();
    const previous = this.banners().find((b) => b.id === id);
    if (id && !previous) throw new Error("Banner não encontrado.");
    const motorcycleIds = [
      ...(draft.motorcycleIds ?? previous?.motorcycleIds ?? []),
    ];
    if (
      motorcycleIds.length > 6 ||
      new Set(motorcycleIds).size !== motorcycleIds.length ||
      motorcycleIds.some(
        (motoId) => !this.bikes().some((bike) => bike.id === motoId),
      )
    )
      throw new Error("Selecione até 6 motos diferentes cadastradas na frota.");
    if (
      (!draft.image.trim() && !motorcycleIds.length) ||
      (draft.image.trim() && !isSafeImage(draft.image.trim())) ||
      !isSafeLink(draft.link.trim())
    )
      throw new Error(
        "Imagem ou link inválido. Use HTTPS ou uma âncora da página.",
      );
    const banner = {
      ...draft,
      id: id || crypto.randomUUID(),
      order: previous?.order ?? this.banners().length,
      title: this.text(draft.title, "Título", 120),
      subtitle: this.text(draft.subtitle, "Subtítulo", 300),
      image: draft.image.trim(),
      motorcycleIds,
      link: draft.link.trim(),
      active: !!draft.active,
    };
    this.commit(
      {
        banners: id
          ? this.banners().map((b) => (b.id === id ? banner : b))
          : [...this.banners(), banner],
      },
      "banner",
      id ? "Banner atualizado" : "Banner adicionado",
      banner.title,
    );
  }
  toggleBanner(id: string): void {
    this.session.assertAdminSession();
    const banner = this.banners().find((b) => b.id === id);
    if (!banner) throw new Error("Banner não encontrado.");
    this.commit(
      {
        banners: this.banners().map((b) =>
          b.id === id ? { ...b, active: !b.active } : b,
        ),
      },
      "banner",
      "Visibilidade alterada",
      banner.title,
    );
  }
  moveBanner(id: string, direction: -1 | 1): void {
    this.session.assertAdminSession();
    const banners = [...this.banners()];
    const index = banners.findIndex((b) => b.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= banners.length) return;
    [banners[index], banners[target]] = [banners[target], banners[index]];
    this.commit(
      { banners: banners.map((b, order) => ({ ...b, order })) },
      "banner",
      "Ordem dos banners alterada",
      banners[target].title,
    );
  }
  deleteBanner(id: string): void {
    this.session.assertAdminSession();
    const banner = this.banners().find((b) => b.id === id);
    if (!banner) throw new Error("Banner não encontrado.");
    this.commit(
      {
        banners: this.banners()
          .filter((b) => b.id !== id)
          .map((b, order) => ({ ...b, order })),
      },
      "banner",
      "Banner excluído",
      banner.title,
    );
  }
  saveSettings(draft: SiteSettings): void {
    this.session.assertAdminSession();
    if (!/^55\d{10,11}$/.test(draft.whatsappNumber))
      throw new Error(
        "WhatsApp: informe DDI 55, DDD e número, somente dígitos.",
      );
    if ([draft.instagram, draft.facebook].some((url) => !!url && !isHttps(url)))
      throw new Error("Redes sociais: use links HTTPS.");
    if (draft.rentalConditions && Object.values(draft.rentalConditions).some((value) => typeof value !== "string" || value.length > 800))
      throw new Error("Condições do aluguel: use textos de até 800 caracteres.");
    const settings = {
      ...draft,
      address: this.text(draft.address, "Endereço", 400),
      hours: this.text(draft.hours, "Horários", 400),
      mapQuery: this.text(draft.mapQuery, "Referência do mapa", 400),
      mapLabel: this.text(draft.mapLabel, "Legenda do mapa", 100),
    };
    this.commit(
      { settings },
      "settings",
      "Configurações atualizadas",
      "Contato, localização e redes sociais",
    );
  }
  recordVisit(): void {
    this.subject.next({ ...this.state(), visits: this.state().visits + 1 });
  }
  recordWhatsapp(model?: string): void {
    this.commit(
      {},
      "whatsapp",
      "Intenção de contato pelo WhatsApp",
      model || "Atendimento geral · envio não confirmado",
    );
  }
}
