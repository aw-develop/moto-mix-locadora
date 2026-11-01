import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CredentialsComponent } from './credentials.component';
import { AdminService } from '../../core/services/admin.service';
import { AdminSessionService } from '../../core/services/admin-session.service';
describe('CredentialsComponent',()=>{
 afterEach(()=>vi.unstubAllGlobals());
 function setup(){
  const logout=vi.fn();
  TestBed.configureTestingModule({imports:[CredentialsComponent],providers:[provideRouter([]),{provide:AdminService,useValue:{saveStatus:()=> 'saved'}},{provide:AdminSessionService,useValue:{logout}}]});
  const fixture=TestBed.createComponent(CredentialsComponent);fixture.detectChanges();
  fixture.componentInstance.form.setValue({username:'cliente',currentPassword:'old-password-123',newPassword:'new-password-123',confirmPassword:'new-password-123'});
  return {component:fixture.componentInstance,logout,router:TestBed.inject(Router)};
 }
 it('rejects a mismatched confirmation before making a request',async()=>{
  const {component}=setup();const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
  component.form.controls.confirmPassword.setValue('different');await component.save();
  expect(fetch).not.toHaveBeenCalled();expect(component.error()).toContain('confirmação');
 });
 it('keeps the session and displays a server rejection',async()=>{
  const {component,logout}=setup();vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,json:async()=>({error:'Senha atual incorreta.'})}));
  await component.save();expect(logout).not.toHaveBeenCalled();expect(component.error()).toBe('Senha atual incorreta.');
 });
 it('clears secrets and session, then returns to login after a successful change',async()=>{
  const {component,logout,router}=setup();const navigate=vi.spyOn(router,'navigate').mockResolvedValue(true);
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({success:true})}));await component.save();
  expect(logout).toHaveBeenCalled();expect(component.form.controls.currentPassword.value).toBe('');expect(component.form.controls.newPassword.value).toBe('');
  expect(navigate).toHaveBeenCalledWith(['/admin/login'],{queryParams:{credentials:'updated'}});
 });
});
