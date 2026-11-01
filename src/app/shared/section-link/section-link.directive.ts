import { DOCUMENT, ViewportScroller } from '@angular/common';
import { Directive, ElementRef, HostListener, Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
@Injectable({providedIn:'root'})
export class SectionNavigationService {
 private readonly router=inject(Router);
 private readonly viewport=inject(ViewportScroller);
 private readonly document=inject(DOCUMENT);
 constructor(){
  this.viewport.setOffset(()=>[0,(this.document.querySelector('mix-header .header')?.getBoundingClientRect().height || 0)+16]);
 }
 navigate(fragment:string):void {
  if(this.router.parseUrl(this.router.url).fragment===fragment){
   this.viewport.scrollToAnchor(fragment);
  } else {
   void this.router.navigate([], {fragment});
  }
 }
}
/** Same-page links use imperative router navigation, preserving ordinary modified clicks and external URLs. */
@Directive({selector:'a[mixSectionLink]',standalone:true})
export class SectionLinkDirective {
 private readonly element=inject<ElementRef<HTMLAnchorElement>>(ElementRef);
 private readonly navigation=inject(SectionNavigationService);
 @HostListener('click',['$event'])
 onClick(event:MouseEvent):void {
  if(event.defaultPrevented || event.button!==0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const anchor=this.element.nativeElement;
  if(anchor.hasAttribute('download') || (anchor.target && anchor.target!=='_self')) return;
  const href=anchor.getAttribute('href');
  if(!href?.startsWith('#') || href.length<2) return;
  let fragment:string;
  try {fragment=decodeURIComponent(href.slice(1));} catch {return;}
  event.preventDefault();
  this.navigation.navigate(fragment);
 }
}
