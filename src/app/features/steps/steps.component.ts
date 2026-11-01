import { ScrollRevealDirective } from "../../shared/scroll-reveal/scroll-reveal.directive";
import { Component, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "mix-steps",
  standalone: true,
  styleUrl: "./steps.component.css",
  imports: [ScrollRevealDirective],
  templateUrl: "./steps.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepsComponent {}
