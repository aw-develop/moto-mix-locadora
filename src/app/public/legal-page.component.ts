import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";

@Component({
  selector: "mix-legal-page",
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="legal-page">
      <a routerLink="/">← Voltar ao site</a>
      @if (kind === "terms") {
        <h1>Termos de Uso</h1>
        <p>Informações gerais sobre a utilização do site da Mix Locadora de Motos.</p>
        <h2>Planos e disponibilidade</h2>
        <p>Os valores, planos e motocicletas apresentados no site são informativos e devem ser confirmados com a locadora antes da contratação.</p>
        <h2>Condições de locação</h2>
        <p>A contratação está sujeita à documentação exigida, às condições comerciais vigentes e ao contrato de locação apresentado ao cliente.</p>
        <h2>Atendimento</h2>
        <p>Em caso de dúvidas, utilize os canais de atendimento divulgados no site.</p>
      } @else {
        <h1>Política de Privacidade</h1>
        <p>A Mix Locadora de Motos respeita a privacidade dos visitantes do site.</p>
        <h2>Informações fornecidas</h2>
        <p>O formulário solicita nome, telefone e mensagem. Ele prepara uma conversa no WhatsApp, cujo envio depende da confirmação do visitante no aplicativo.</p>
        <h2>Finalidade</h2>
        <p>As informações compartilhadas são utilizadas para responder solicitações e prestar atendimento sobre os serviços da locadora.</p>
        <h2>Direitos dos titulares</h2>
        <p>Você pode solicitar informações e exercer os direitos previstos na Lei Geral de Proteção de Dados (LGPD) pelos canais de contato divulgados no site.</p>
        <h2>WhatsApp</h2>
        <p>O uso do WhatsApp também está sujeito às políticas de privacidade dessa plataforma.</p>
      }
      <p class="notice">Minuta informativa inicial: revisar e complementar os detalhes jurídicos e operacionais antes da publicação definitiva.</p>
    </main>
  `,
  styles: [`
    :host { display:block; min-height:100vh; background:#101310; color:#e8eee8; }
    .legal-page { max-width:850px; margin:0 auto; padding:clamp(48px,8vw,100px) 24px; line-height:1.85; }
    h1 { font-size:clamp(30px,5vw,48px); line-height:1.2; margin:32px 0; }
    h2 { font-size:19px; margin:30px 0 8px; color:#cfe9d3; }
    p { color:#aab8aa; }
    a { color:#48dc82; }
    .notice { margin-top:48px; padding-top:18px; border-top:1px solid #344034; font-size:12px; }
  `]
})
export class LegalPageComponent {
  readonly kind = inject(ActivatedRoute).snapshot.data["kind"] as "terms" | "privacy";
}
