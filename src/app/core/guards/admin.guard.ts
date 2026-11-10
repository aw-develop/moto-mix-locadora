import { inject } from "@angular/core";
import { CanActivateChildFn, CanMatchFn, Router, UrlTree } from "@angular/router";
import { AdminSessionService } from "../services/admin-session.service";
async function authorize(): Promise<boolean | UrlTree> {
  const session = inject(AdminSessionService);
  const router = inject(Router);
  return await session.verifySession() || router.createUrlTree(["/admin/login"]);
}
export const adminGuard: CanMatchFn = () => authorize();
export const adminChildGuard: CanActivateChildFn = () => authorize();

/** Verify the server session before deciding whether a login form is needed. */
export const loginGuard: CanMatchFn = async () => {
  const session = inject(AdminSessionService);
  const router = inject(Router);
  return await session.verifySession()
    ? router.createUrlTree(["/admin/dashboard"])
    : true;
};
