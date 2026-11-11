declare module '*site-client/server/server.mjs' {
  export function renderPublicPage(request: Request, context: unknown): Promise<Response | null>;
}
