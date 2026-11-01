import { inject } from "@angular/core";
import { CanActivateChildFn, CanMatchFn, Router } from "@angular/router";
import { AdminSessionService } from "../services/admin-session.service";
export const adminGuard: CanMatchFn = () =>
  inject(AdminSessionService).active() ||
  inject(Router).createUrlTree(["/admin/login"]);
export const adminChildGuard: CanActivateChildFn = () =>
  inject(AdminSessionService).active() ||
  inject(Router).createUrlTree(["/admin/login"]);
