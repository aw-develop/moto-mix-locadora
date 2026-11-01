import type { BackendEnvironment } from '../models/environment.ts';
import { resolveIdentity } from './identity.ts';
import { passwordIdentity } from './password.ts';
import { administrativePath, normalizedPath } from '../http/security.ts';
import { json } from '../http/responses.ts';
/** The Worker validates the real session before delivering a protected admin document. */
export async function adminPageGate(request: Request, env: BackendEnvironment): Promise<Response | null> {
  const path=normalizedPath(new URL(request.url).pathname);
  if(!administrativePath(path))return null;
  if(!['GET','HEAD'].includes(request.method))return json({error:'Recurso não encontrado.'},404);
  if(path==='/admin/login' || path==='/admin/login/')return null;
  try {
    const identity=(await passwordIdentity(request,env)) ?? resolveIdentity(request,env);
    if(identity.isAdmin)return null;
    return new Response(null,{status:303,headers:{location:'/admin/login','cache-control':'no-store'}});
  }catch{
    return json({error:'Não foi possível validar o acesso. Tente novamente.'},503);
  }
}
