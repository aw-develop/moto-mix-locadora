import type {
  Banner,
  CatalogSnapshot,
  Motorcycle,
  SaveCatalog,
} from "../models/catalog.ts";
import { CatalogRepository } from "../repositories/catalog.repository.ts";
import { MediaService } from "./media.service.ts";
import { fail } from "../http/errors.ts";
export class CatalogService {
  private readonly repository: CatalogRepository;
  private readonly media: MediaService;
  constructor(repository: CatalogRepository, media: MediaService) {
    this.repository = repository;
    this.media = media;
  }
  async read(administrator: boolean): Promise<CatalogSnapshot> {
    const snapshot = await this.repository.load();
    return administrator
      ? snapshot
      : {
          ...snapshot,
          state: { ...snapshot.state, activities: [], visits: 0 },
        };
  }
  async save(command: SaveCatalog): Promise<CatalogSnapshot> {
    const current = await this.repository.load();
    if (current.version !== command.version)
      fail(
        "Outro dispositivo atualizou os dados. Recarregue antes de salvar novamente.",
        409,
      );
    const bikes: Motorcycle[] = [];
    for (const bike of command.state.bikes)
      bikes.push({ ...bike, image: await this.media.store(bike.image) });
    const banners: Banner[] = [];
    for (const banner of command.state.banners)
      banners.push({ ...banner, image: await this.media.store(banner.image) });
    return this.repository.save(
      { ...command.state, bikes, banners },
      command.version,
    );
  }
}
