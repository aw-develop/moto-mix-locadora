import { ScrollRevealDirective } from "../../shared/scroll-reveal/scroll-reveal.directive";
import { Component, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "mix-advantages",
  standalone: true,
  styleUrl: "./advantages.component.css",
  imports: [ScrollRevealDirective],
  templateUrl: "./advantages.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvantagesComponent {}
