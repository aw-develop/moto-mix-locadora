import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../app.routes';
import { AdminSessionService } from '../core/services/admin-session.service';
import '../app.config';
const identity={isAdmin:true,signedIn:true,name:'Admin teste',email:''};
describe('Admin routing',()=>{
 afterEach(()=>vi.unstubAllGlobals());
 function serverSession(allowed:()=>boolean){
  vi.stubGlobal('fetch',vi.fn().mockImplementation(async()=>({ok:true,json:async()=>({...identity,isAdmin:allowed(),signedIn:allowed()})})));
  TestBed.configureTestingModule({providers:[provideRouter(routes)]});
 }
 it('redirects anonymous users, allows a verified session and blocks again after logout',async()=>{
  let allowed=false;serverSession(()=>allowed);
  const harness=await RouterTestingHarness.create(),router=TestBed.inject(Router);
  await harness.navigateByUrl('/admin/motos');expect(router.url).toBe('/admin/login');
  expect(harness.routeNativeElement?.textContent).toContain('Entrar no painel');
  expect(harness.routeNativeElement?.querySelector('a[href^="/signin-with-chatgpt"]')).toBeNull();
  allowed=true;await harness.navigateByUrl('/admin/motos');expect(router.url).toBe('/admin/motos');
  expect(harness.routeNativeElement?.textContent).toContain('Honda CG 160');
  TestBed.inject(AdminSessionService).logout();allowed=false;
  await harness.navigateByUrl('/admin/banners');expect(router.url).toBe('/admin/login');
 });
 it('revalidates an expired session before navigating to another administrative page',async()=>{
  let allowed=true;serverSession(()=>allowed);
  const harness=await RouterTestingHarness.create(),router=TestBed.inject(Router);
  await harness.navigateByUrl('/admin/dashboard');expect(router.url).toBe('/admin/dashboard');
  const session=TestBed.inject(AdminSessionService);expect(session.active()).toBe(true);
  allowed=false;await harness.navigateByUrl('/admin/configuracoes');
  expect(router.url).toBe('/admin/login');expect(session.active()).toBe(false);
 });
 it('does not trust an administrative flag changed only in the browser',async()=>{
  serverSession(()=>false);const harness=await RouterTestingHarness.create();
  TestBed.inject(AdminSessionService).setIdentity(identity);
  await harness.navigateByUrl('/admin/banners');expect(TestBed.inject(Router).url).toBe('/admin/login');
 });
 it('fails closed when session verification cannot reach the server',async()=>{
  TestBed.configureTestingModule({providers:[provideRouter(routes)]});
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('network unavailable')));
  const harness=await RouterTestingHarness.create();TestBed.inject(AdminSessionService).setIdentity(identity);
  await harness.navigateByUrl('/admin/motos');expect(TestBed.inject(Router).url).toBe('/admin/login');
 });
 it('skips the login form when the server confirms an existing administrator session',async()=>{
  serverSession(()=>true);
  const harness=await RouterTestingHarness.create();
  await harness.navigateByUrl('/admin/login');
  expect(TestBed.inject(Router).url).toBe('/admin/dashboard');
  expect(harness.routeNativeElement?.querySelector('.login-form')).toBeNull();
 });

});
