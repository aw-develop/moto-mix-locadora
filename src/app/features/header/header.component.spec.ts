import { Component } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, withInMemoryScrolling } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { HeaderComponent } from './header.component';
import { SectionLinkDirective } from '../../shared/section-link/section-link.directive';
@Component({standalone:true,imports:[HeaderComponent,SectionLinkDirective],template:'<mix-header/><section id="inicio"></section><section id="motos"></section><section id="vantagens"></section><section id="localizacao"></section><section id="contato"></section><a mixSectionLink href="https://example.com">External</a>'})
class HeaderPage {}
describe('Header section navigation',()=>{
 async function setup(){
  TestBed.configureTestingModule({providers:[provideRouter([{path:'',component:HeaderPage}],withInMemoryScrolling({anchorScrolling:'enabled',scrollPositionRestoration:'enabled'}))]});
  const viewport=TestBed.inject(ViewportScroller);
  const scroll=vi.spyOn(viewport,'scrollToAnchor').mockImplementation(()=>{});
  vi.spyOn(viewport,'scrollToPosition').mockImplementation(()=>{});
  const offset=vi.spyOn(viewport,'setOffset');
  const harness=await RouterTestingHarness.create('/');
  const header=harness.routeDebugElement!.query(By.directive(HeaderComponent)).componentInstance as HeaderComponent;
  return {harness,header,scroll,offset,router:TestBed.inject(Router)};
 }
 it('navigates to all five sections through the router and closes the mobile menu',async()=>{
  const {harness,header,scroll,router}=await setup();
  for(const fragment of ['inicio','motos','vantagens','localizacao','contato']){
   header.menuOpen.set(true);harness.detectChanges();scroll.mockClear();
   const link=harness.routeNativeElement!.querySelector<HTMLAnchorElement>(`nav a[href="#${fragment}"]`)!;
   link.click();
   await vi.waitFor(()=>expect(router.url).toBe('/#'+fragment));
   expect(header.menuOpen()).toBe(false);
  }
 });
 it('repeats scrolling when the current section is selected again and measures the sticky header',async()=>{
  const {harness,scroll,offset}=await setup();
  const element=harness.routeNativeElement!.querySelector('header')!;
  vi.spyOn(element,'getBoundingClientRect').mockReturnValue({height:76} as DOMRect);
  const callback=offset.mock.calls[0]![0] as ()=>[number,number];
  // The viewport offset is derived from the live document, where the header is mounted.
  document.body.appendChild(harness.fixture.nativeElement);
  expect(callback()).toEqual([0,92]);
  const link=harness.routeNativeElement!.querySelector<HTMLAnchorElement>('nav a[href="#motos"]')!;
  link.click();await vi.waitFor(()=>expect(TestBed.inject(Router).url).toBe('/#motos'));
  scroll.mockClear();link.click();expect(scroll).toHaveBeenCalledWith('motos');
 });
 it('preserves modified clicks and external links',async()=>{
  const {harness,router}=await setup();
  const link=harness.routeNativeElement!.querySelector<HTMLAnchorElement>('nav a[href="#motos"]')!;
  const modifier=new MouseEvent('click',{ctrlKey:true,bubbles:true,cancelable:true,button:0});
  link.dispatchEvent(modifier);expect(modifier.defaultPrevented).toBe(false);expect(router.url).toBe('/');
  const external=harness.routeDebugElement!.queryAll(By.directive(SectionLinkDirective)).find(node=>node.nativeElement.getAttribute('href')==='https://example.com')!;
  const event=new MouseEvent('click',{cancelable:true});external.injector.get(SectionLinkDirective).onClick(event);expect(event.defaultPrevented).toBe(false);
 });
});
