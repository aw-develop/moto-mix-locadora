import { AngularAppEngine } from '@angular/ssr';
const engine = new AngularAppEngine();
/** The Worker supplies only the public catalog, never a session or environment bindings. */
export function renderPublicPage(request: Request, context: unknown): Promise<Response | null> {
  return engine.handle(request, context);
}
