import { ChangeDetectionStrategy, Component, input } from '@angular/core';
export type BootstrapIconName = 'speedometer2' | 'scooter' | 'images' | 'gear' | 'globe2' | 'layout-sidebar-inset' | 'list' | 'power';
/** Official Bootstrap Icons subset, served locally; see vendor/bootstrap-icons.LICENSE. */
@Component({
  selector: 'mix-bootstrap-icon',
  standalone: true,
  template: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false"><use [attr.href]="\'/assets/bootstrap-icons.svg#\' + name()" /></svg>',
  styleUrl: './bootstrap-icon.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootstrapIconComponent {
  readonly name = input.required<BootstrapIconName>();
}
