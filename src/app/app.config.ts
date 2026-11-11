import { provideClientHydration, withNoHttpTransferCache } from "@angular/platform-browser";
import { AdminService } from "./core/services/admin.service";
import { registerLocaleData } from "@angular/common";
import localePt from "@angular/common/locales/pt";
registerLocaleData(localePt);
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { routes } from "./app.routes";
import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  provideAppInitializer,
  inject,
} from "@angular/core";
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    ...(typeof window === "undefined" || window.location.pathname === "/"
      ? [provideClientHydration(withNoHttpTransferCache())]
      : []),
    provideAppInitializer(() => inject(AdminService).initialize()),
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: "enabled", scrollPositionRestoration: "enabled" }),
    ),
  ],
};
