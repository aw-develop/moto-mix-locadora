import { Routes } from "@angular/router";
import { adminGuard, adminChildGuard, loginGuard } from "./core/guards/admin.guard";
export const routes: Routes = [
  {
    path: "",
    pathMatch: "full",
    loadComponent: () =>
      import("./public/public-site.component").then(
        (m) => m.PublicSiteComponent,
      ),
    title: "Aluguel de Motos em Palhoça – SC | Mix Locadora",
  },
  {
    path: "admin/login",
    canMatch: [loginGuard],
    loadComponent: () =>
      import("./admin/login/login.component").then((m) => m.LoginComponent),
    title: "Mix | Acesso administrativo",
  },
  {
    path: "admin",
    canMatch: [adminGuard],
    canActivateChild: [adminChildGuard],
    loadComponent: () =>
      import("./admin/layout/admin-layout.component").then(
        (m) => m.AdminLayoutComponent,
      ),
    children: [
      { path: "", pathMatch: "full", redirectTo: "dashboard" },
      {
        path: "dashboard",
        loadComponent: () =>
          import("./admin/dashboard/dashboard.component").then(
            (m) => m.DashboardComponent,
          ),
        title: "Mix Admin | Visão geral",
      },
      {
        path: "motos",
        loadComponent: () =>
          import("./admin/fleet/fleet-admin.component").then(
            (m) => m.FleetAdminComponent,
          ),
        title: "Mix Admin | Frota",
      },
      {
        path: "banners",
        loadComponent: () =>
          import("./admin/banners/banners.component").then(
            (m) => m.BannersComponent,
          ),
        title: "Mix Admin | Banners",
      },
      {
        path: "configuracoes",
        loadComponent: () =>
          import("./admin/settings/settings.component").then(
            (m) => m.SettingsComponent,
          ),
        title: "Mix Admin | Configurações",
      },
    ],
  },
  { path: "**", redirectTo: "" },
];
