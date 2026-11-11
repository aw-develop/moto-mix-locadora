import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, REQUEST_CONTEXT, TransferState, makeStateKey } from '@angular/core';
import { AdminService } from './admin.service';
import { AdminSessionService } from './admin-session.service';
import { mixConfig } from '../config/mix.config';

describe('Inicialização pública no servidor',()=>{
 afterEach(()=>vi.unstubAllGlobals());
 it('usa o snapshot público do Worker sem fazer chamadas HTTP ou criar uma sessão',async()=>{
  const state={bikes:[{...mixConfig.bikes[0],name:'Moto SSR de teste'}],banners:[],settings:{whatsappNumber:'5548999999999',address:'Rua Teste, Palhoça - SC',hours:'8h às 18h',mapQuery:'Palhoça SC',mapLabel:'MIX · PALHOÇA',instagram:'',facebook:''},activities:[],visits:0};
  TestBed.configureTestingModule({providers:[{provide:PLATFORM_ID,useValue:'server'},{provide:REQUEST_CONTEXT,useValue:{publicCatalog:{state,version:7,updatedAt:'2026-11-10T10:00:00Z'}}}]});
  const fetchSpy=vi.fn().mockRejectedValue(new Error('SSR must not fetch API/session'));
  vi.stubGlobal('fetch',fetchSpy);
  const admin=TestBed.inject(AdminService);
  await admin.initialize();
  expect(admin.bikes()[0].name).toBe('Moto SSR de teste');
  expect(admin.settings().address).toContain('Palhoça');
  expect(admin.saveStatus()).toBe('saved');
  expect(TestBed.inject(AdminSessionService).active()).toBe(false);
  expect(fetchSpy).not.toHaveBeenCalled();
  expect(TestBed.inject(TransferState).toJson()).toContain('mix.public-catalog');
  expect(TestBed.inject(TransferState).toJson()).not.toContain('SESSION_SECRET');
 });
 it('restaura o mesmo snapshot no navegador antes da hidratação, sem aguardar a API',async()=>{
  const state={bikes:[{...mixConfig.bikes[0],name:'Conteúdo já renderizado'}],banners:[],settings:{whatsappNumber:'5548999999999',address:'Palhoça SC',hours:'8h às 18h',mapQuery:'Palhoça SC',mapLabel:'MIX',instagram:'',facebook:''},activities:[],visits:0};
  const transfer=TestBed.inject(TransferState);
  const payload={state,version:8,updatedAt:null};
  transfer.set(makeStateKey<typeof payload>('mix.public-catalog'),payload);
  const fetchSpy=vi.fn();vi.stubGlobal('fetch',fetchSpy);
  const admin=TestBed.inject(AdminService);
  await admin.initialize();
  expect(admin.bikes()[0].name).toBe('Conteúdo já renderizado');
  expect(admin.saveStatus()).toBe('saved');
  expect(transfer.hasKey(makeStateKey('mix.public-catalog'))).toBe(false);
  expect(fetchSpy).not.toHaveBeenCalled();
 });

});
