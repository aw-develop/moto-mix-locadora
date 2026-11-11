import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, RenderMode, withRoutes } from '@angular/ssr';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
const config = mergeApplicationConfig(appConfig, {
  providers: [provideServerRendering(withRoutes([
    { path: '', renderMode: RenderMode.Server },
    { path: '**', renderMode: RenderMode.Client },
  ]))],
});
export default (context: BootstrapContext) => bootstrapApplication(AppComponent, config, context);
