import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AdminSessionService } from '../../core/services/admin-session.service';
import { AdminService } from '../../core/services/admin.service';
@Component({
 selector:'mix-admin-credentials', standalone:true,
 imports:[ReactiveFormsModule,MatButtonModule],
 templateUrl:'./credentials.component.html', styleUrl:'./credentials.component.css',
 changeDetection:ChangeDetectionStrategy.OnPush,
})
export class CredentialsComponent {
 private readonly fb=inject(FormBuilder);
 private readonly session=inject(AdminSessionService);
 private readonly admin=inject(AdminService);
 private readonly router=inject(Router);
 readonly busy=signal(false);
 readonly error=signal('');
 readonly form=this.fb.nonNullable.group({
  username:['',[Validators.required,Validators.pattern(/^[a-zA-Z0-9][a-zA-Z0-9._@-]{2,79}$/)]],
  currentPassword:['',[Validators.required,Validators.maxLength(256)]],
  newPassword:['',[Validators.required,Validators.minLength(12),Validators.maxLength(128),Validators.pattern(/\S/)]],
  confirmPassword:['',[Validators.required]],
 });
 async save():Promise<void> {
  if(this.busy()) return;
  this.form.markAllAsTouched(); this.error.set('');
  if(this.form.invalid){this.error.set('Revise o login e preencha as senhas. A nova senha deve ter de 12 a 128 caracteres.');return;}
  const values=this.form.getRawValue();
  if(values.newPassword!==values.confirmPassword){this.error.set('A confirmação da senha não confere.');return;}
  if(values.newPassword===values.currentPassword){this.error.set('Escolha uma senha diferente da atual.');return;}
  if(this.admin.saveStatus()!=='saved'){this.error.set('Aguarde a confirmação de salvamento dos dados do site antes de alterar o acesso.');return;}
  this.busy.set(true);
  try {
   const response=await fetch('/api/auth/credentials',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(values),signal:AbortSignal.timeout(15000)});
   const result=await response.json();
   if(!response.ok) throw new Error(result.error || 'Não foi possível alterar as credenciais.');
   this.form.reset(); this.session.logout();
   await this.router.navigate(['/admin/login'],{queryParams:{credentials:'updated'}});
  } catch(error){this.error.set(error instanceof Error?error.message:'Não foi possível alterar as credenciais.');}
  finally{this.busy.set(false);}
 }
}
