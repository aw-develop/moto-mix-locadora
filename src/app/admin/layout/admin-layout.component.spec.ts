import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout.component';
import { AdminSessionService } from '../../core/services/admin-session.service';
import { AdminService } from '../../core/services/admin.service';
describe('Administrative sign-out',()=>{
 it('uses the backend logout handler rather than a ChatGPT-only sign-out link',()=>{
  TestBed.configureTestingModule({imports:[AdminLayoutComponent],providers:[provideRouter([]),{provide:AdminSessionService,useValue:{profile:()=>({name:'Administrador',initials:'MX'})}},{provide:AdminService,useValue:{saveStatus:()=> 'saved'}}]});
  const fixture=TestBed.createComponent(AdminLayoutComponent);fixture.detectChanges();
  const logout=vi.spyOn(fixture.componentInstance,'logout').mockResolvedValue();
  const control=fixture.nativeElement.querySelector('[aria-label="Sair do painel"]') as HTMLButtonElement;
  expect(control.tagName).toBe('BUTTON');control.click();expect(logout).toHaveBeenCalledOnce();
 });
});
