import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="login-page">
      <div class="login-glow login-glow-left"></div>
      <div class="login-glow login-glow-right"></div>

      <section class="login-shell" aria-labelledby="login-title">
        <div class="brand-panel">
          <div class="brand-head">
            <div class="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 6l3 1m0 0l-3 9a5 5 0 006 0M6 7l3 9m-3-9l6-2m6 2l3-1m-3 1l-3 9a5 5 0 006 0m-3-9l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <div class="brand-id">
              <span class="brand-name">SAMDE</span>
              <span class="brand-tagline">Portail agent</span>
            </div>
          </div>

          <div class="brand-copy">
            <span class="eyebrow">DigiCoop-WA+</span>
            <h2>Le microcrédit,<br />décidé sur des faits.</h2>
            <p>
              Instruisez un dossier, obtenez un score de risque explicable et
              gardez la trace de chaque décision - dans un seul espace de travail.
            </p>
          </div>

          <ul class="brand-points">
            <li><span class="point-dot" aria-hidden="true"></span>Score de risque expliqué variable par variable</li>
            <li><span class="point-dot" aria-hidden="true"></span>Capacité de remboursement vérifiée automatiquement</li>
            <li><span class="point-dot" aria-hidden="true"></span>Historique interne, BIC et factures consolidés</li>
          </ul>

          <div class="trust-row">
            <span class="status-dot" aria-hidden="true"></span>
            Moteur de scoring opérationnel
          </div>
        </div>

        <div class="form-panel">
          <div class="form-heading">
            <span class="mobile-eyebrow">ESPACE AGENT</span>
            <h1 id="login-title">Bienvenue dans SAMDE</h1>
            <p>Connectez-vous à votre espace de travail.</p>
          </div>

          <form (ngSubmit)="submit()" #loginForm="ngForm" novalidate>
            <label class="field-label" for="email">Identifiant ou Email professionnel</label>
            <div class="field-wrap" [class.field-invalid]="emailInput.invalid && emailInput.touched">
              <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input
                id="email"
                name="email"
                type="text"
                [(ngModel)]="email"
                #emailInput="ngModel"
                placeholder="Email (ex: agent&#64;cif.bf) ou Matricule"
                autocomplete="username"
                required />
            </div>
            <p class="field-error" *ngIf="emailInput.invalid && emailInput.touched">Veuillez saisir votre email ou matricule.</p>

            <div class="password-label-row">
              <label class="field-label" for="password">Mot de passe</label>
              <button type="button" class="forgot-link" (click)="showForgotMessage()">Mot de passe oublié ?</button>
            </div>
            <div class="field-wrap" [class.field-invalid]="passwordInput.invalid && passwordInput.touched">
              <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <rect x="4" y="10" width="16" height="11" rx="2" stroke-width="1.8" />
                <path stroke-linecap="round" stroke-width="1.8" d="M8 10V7a4 4 0 018 0v3" />
              </svg>
              <input
                id="password"
                name="password"
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="password"
                #passwordInput="ngModel"
                placeholder="Votre mot de passe"
                autocomplete="current-password"
                required />
              <button type="button" class="password-toggle" (click)="showPassword = !showPassword" [attr.aria-label]="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
                <svg *ngIf="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" /><circle cx="12" cy="12" r="2.5" stroke-width="1.8" /></svg>
                <svg *ngIf="showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 3l18 18M10.6 6.2A10.8 10.8 0 0112 6c6.5 0 10 6 10 6a17.4 17.4 0 01-3.1 3.7M6.2 6.8C3.5 8.7 2 12 2 12s3.5 6 10 6a10.7 10.7 0 003.4-.6" /></svg>
              </button>
            </div>

            <p class="form-error" *ngIf="errorMessage" role="alert">
              <span class="error-mark">!</span>{{ errorMessage }}
            </p>

            <button class="submit-button" type="submit" [disabled]="loginForm.invalid || loading">
              <span *ngIf="!loading">Accéder à mon espace <span aria-hidden="true">→</span></span>
              <span *ngIf="loading" class="loading-state"><span class="spinner"></span>Connexion...</span>
            </button>
          </form>

        </div>
      </section>

      <p class="login-footer">&#64;SAMDE · Solution de scoring microcrédit · Burkina Faso</p>
    </main>
  `,
  styles: [`
    /* ===================================================================
       Page de connexion - styles encapsulés.
       Les valeurs reprennent les jetons du design system (tailwind.config.js) :
       brand 600 #147c76 / 700 #0e625e, ink 200 #dbe1e6 ... 950 #0e161b.
       =================================================================== */
    :host { display: block; }

    .login-page {
      position: relative;
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 2.5rem 1.25rem 4rem;
      background: #0e161b;
      color: #1a232a;
    }
    /* Dégradés profonds + grille fine + grain : un fond travaillé, pas un aplat */
    .login-page::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(60rem 40rem at 12% -10%, rgba(20, 124, 118, .55), transparent 62%),
        radial-gradient(46rem 34rem at 92% 108%, rgba(13, 78, 75, .5), transparent 60%),
        linear-gradient(160deg, #0e161b 0%, #0e403f 58%, #0d4e4b 100%);
    }
    .login-page::after {
      content: '';
      position: absolute;
      inset: 0;
      opacity: .5;
      background-image:
        linear-gradient(rgba(255, 255, 255, .035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, .035) 1px, transparent 1px);
      background-size: 3.5rem 3.5rem;
      -webkit-mask-image: radial-gradient(70% 60% at 50% 40%, black, transparent 100%);
      mask-image: radial-gradient(70% 60% at 50% 40%, black, transparent 100%);
    }

    .login-glow {
      position: absolute;
      width: 34rem;
      height: 34rem;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
    }
    .login-glow-left  { left: -14rem; top: -12rem; background: rgba(79, 178, 165, .3); }
    .login-glow-right { right: -12rem; bottom: -16rem; background: rgba(43, 148, 136, .22); }

    .login-shell {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 1.05fr .95fr;
      width: 100%;
      max-width: 62rem;
      border-radius: 1.75rem;
      overflow: hidden;
      background: #fff;
      box-shadow: 0 32px 80px -24px rgba(3, 39, 38, .6), 0 0 0 1px rgba(255, 255, 255, .07);
      animation: rise-in .5s cubic-bezier(.32, .72, 0, 1) both;
    }

    /* ---------------- Panneau de marque ---------------- */
    .brand-panel {
      position: relative;
      display: flex;
      flex-direction: column;
      padding: 2.75rem 2.5rem;
      color: #fff;
      background: linear-gradient(155deg, #0e403f 0%, #0d4e4b 48%, #147c76 100%);
      overflow: hidden;
    }
    .brand-panel::after {
      content: '';
      position: absolute;
      width: 22rem;
      height: 22rem;
      right: -8rem;
      top: -6rem;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(132, 207, 195, .3), transparent 68%);
      pointer-events: none;
    }

    .brand-head { position: relative; display: flex; align-items: center; gap: .875rem; }
    .brand-mark {
      display: grid;
      place-items: center;
      width: 2.875rem;
      height: 2.875rem;
      flex: 0 0 auto;
      border-radius: .9rem;
      background: rgba(255, 255, 255, .12);
      border: 1px solid rgba(255, 255, 255, .18);
      color: #fff;
      backdrop-filter: blur(6px);
    }
    .brand-mark svg { width: 1.375rem; height: 1.375rem; }
    .brand-id { display: flex; flex-direction: column; line-height: 1.15; }
    .brand-name {
      font-family: 'Plus Jakarta Sans', Inter, system-ui, sans-serif;
      font-size: 1.125rem;
      font-weight: 800;
      letter-spacing: -.01em;
    }
    .brand-tagline {
      margin-top: .125rem;
      color: rgba(217, 242, 237, .72);
      font-size: .6875rem;
      letter-spacing: .06em;
      text-transform: uppercase;
    }

    .brand-copy { position: relative; margin-top: auto; padding-top: 3rem; }
    .eyebrow, .mobile-eyebrow {
      display: inline-block;
      color: #84cfc3;
      font-size: .625rem;
      font-weight: 800;
      letter-spacing: .16em;
      text-transform: uppercase;
    }
    .brand-copy h2 {
      margin: .875rem 0 .75rem;
      font-family: 'Plus Jakarta Sans', Inter, system-ui, sans-serif;
      font-size: clamp(1.75rem, 2.6vw, 2.375rem);
      font-weight: 800;
      line-height: 1.12;
      letter-spacing: -.03em;
      color: #fff;
    }
    .brand-copy p {
      margin: 0;
      max-width: 26rem;
      color: rgba(217, 242, 237, .78);
      font-size: .875rem;
      line-height: 1.65;
    }

    .brand-points {
      position: relative;
      margin: 1.75rem 0 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: .625rem;
    }
    .brand-points li {
      display: flex;
      align-items: center;
      gap: .625rem;
      color: rgba(217, 242, 237, .82);
      font-size: .75rem;
      line-height: 1.45;
    }
    .point-dot {
      flex: 0 0 auto;
      width: 1.125rem;
      height: 1.125rem;
      border-radius: 50%;
      background: rgba(255, 255, 255, .12);
      border: 1px solid rgba(132, 207, 195, .45);
      position: relative;
    }
    .point-dot::after {
      content: '';
      position: absolute;
      left: 50%;
      top: 48%;
      width: .3125rem;
      height: .5rem;
      border: solid #84cfc3;
      border-width: 0 1.6px 1.6px 0;
      transform: translate(-50%, -55%) rotate(45deg);
    }

    .trust-row {
      position: relative;
      display: flex;
      align-items: center;
      gap: .5rem;
      margin-top: 2rem;
      color: rgba(217, 242, 237, .6);
      font-size: .6875rem;
    }
    .status-dot {
      width: .4375rem;
      height: .4375rem;
      border-radius: 50%;
      background: #34d383;
      box-shadow: 0 0 0 4px rgba(52, 211, 131, .16);
    }

    /* ---------------- Panneau de formulaire ---------------- */
    .form-panel {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 2.75rem clamp(1.75rem, 4.5vw, 3.25rem);
      background: #fff;
    }
    .form-heading { margin-bottom: 1.75rem; }
    .form-heading h1 {
      margin: .5rem 0 .4375rem;
      font-family: 'Plus Jakarta Sans', Inter, system-ui, sans-serif;
      font-size: clamp(1.5rem, 2.4vw, 1.875rem);
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -.025em;
      color: #1a232a;
    }
    .form-heading p { margin: 0; color: #657986; font-size: .875rem; }
    .mobile-eyebrow { display: none; color: #147c76; }

    .field-label {
      display: block;
      margin-bottom: .4375rem;
      color: #3d4c57;
      font-size: .75rem;
      font-weight: 600;
    }
    .password-label-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-top: 1.25rem;
    }
    .forgot-link {
      padding: 0 0 .4375rem;
      border: 0;
      background: transparent;
      color: #147c76;
      cursor: pointer;
      font: inherit;
      font-size: .6875rem;
      font-weight: 700;
      border-radius: .25rem;
    }
    .forgot-link:hover { color: #0e625e; text-decoration: underline; }

    .field-wrap {
      display: flex;
      align-items: center;
      min-height: 3rem;
      border: 1px solid #dbe1e6;
      border-radius: .75rem;
      background: #fff;
      box-shadow: 0 1px 2px 0 rgba(26, 35, 42, .05);
      transition: border-color .2s cubic-bezier(.32, .72, 0, 1),
                  box-shadow .2s cubic-bezier(.32, .72, 0, 1);
    }
    .field-wrap:hover { border-color: #bfcad2; }
    .field-wrap:focus-within {
      border-color: #2b9488;
      box-shadow: 0 0 0 4px rgba(43, 148, 136, .2);
    }
    .field-wrap.field-invalid { border-color: #fda29b; }
    .field-wrap.field-invalid:focus-within { box-shadow: 0 0 0 4px rgba(240, 68, 56, .18); }

    .field-icon {
      flex: 0 0 auto;
      width: 1.0625rem;
      height: 1.0625rem;
      margin: 0 .625rem 0 .875rem;
      color: #8fa0ab;
    }
    .field-wrap input {
      flex: 1;
      min-width: 0;
      height: 2.875rem;
      padding: 0 .625rem 0 0;
      border: 0;
      outline: 0;
      background: transparent;
      color: #1a232a;
      font: inherit;
      font-size: .875rem;
    }
    .field-wrap input::placeholder { color: #8fa0ab; }

    .password-toggle {
      display: grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      margin-right: .25rem;
      border: 0;
      border-radius: .5rem;
      background: transparent;
      color: #8fa0ab;
      cursor: pointer;
      transition: color .2s, background .2s;
    }
    .password-toggle:hover { color: #147c76; background: #f0faf8; }
    .password-toggle svg { width: 1.0625rem; height: 1.0625rem; }

    .field-error { margin: .4375rem 0 0; color: #b42318; font-size: .6875rem; font-weight: 500; }
    .form-error {
      display: flex;
      align-items: center;
      gap: .5rem;
      margin: 1rem 0 0;
      padding: .625rem .75rem;
      border: 1px solid #fecdca;
      border-radius: .625rem;
      background: #fef3f2;
      color: #b42318;
      font-size: .75rem;
      line-height: 1.45;
    }
    .error-mark {
      display: grid;
      flex: 0 0 auto;
      place-items: center;
      width: 1.0625rem;
      height: 1.0625rem;
      border-radius: 50%;
      background: #d92d20;
      color: #fff;
      font-size: .6875rem;
      font-weight: 800;
    }

    .submit-button {
      width: 100%;
      min-height: 3rem;
      margin-top: 1.5rem;
      border: 0;
      border-radius: .75rem;
      background: #147c76;
      color: #fff;
      cursor: pointer;
      font: inherit;
      font-size: .875rem;
      font-weight: 700;
      box-shadow: 0 8px 24px -8px rgba(20, 124, 118, .45);
      transition: background .2s cubic-bezier(.32, .72, 0, 1),
                  transform .2s cubic-bezier(.32, .72, 0, 1),
                  box-shadow .2s cubic-bezier(.32, .72, 0, 1);
    }
    .submit-button:hover:not(:disabled) {
      background: #0e625e;
      box-shadow: 0 14px 32px -10px rgba(20, 124, 118, .55);
      transform: translateY(-1px);
    }
    .submit-button:active:not(:disabled) { transform: translateY(0) scale(.99); }
    .submit-button:disabled { cursor: not-allowed; opacity: .5; box-shadow: none; }

    .loading-state { display: inline-flex; align-items: center; gap: .5625rem; }
    .spinner {
      width: .875rem;
      height: .875rem;
      border: 2px solid rgba(255, 255, 255, .35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin .7s linear infinite;
    }

    .security-note {
      display: flex;
      align-items: flex-start;
      gap: .5rem;
      margin-top: 1.5rem;
      color: #8fa0ab;
      font-size: .625rem;
      line-height: 1.5;
    }
    .security-note svg { flex: 0 0 auto; width: 1rem; height: 1rem; color: #147c76; }
    .demo-hint { margin: 1.5rem 0 0; color: #8fa0ab; font-size: .625rem; text-align: center; }
    .demo-hint strong { color: #4c5e6b; font-weight: 700; }

    .login-footer {
      position: absolute;
      z-index: 1;
      bottom: 1.25rem;
      margin: 0;
      color: rgba(217, 242, 237, .45);
      font-size: .625rem;
      letter-spacing: .04em;
      text-align: center;
      padding: 0 1rem;
    }

    /* Anneau de focus visible partout (WCAG 2.4.7) */
    .login-page :focus-visible {
      outline: 2px solid #2b9488;
      outline-offset: 2px;
      border-radius: .375rem;
    }
    .brand-panel :focus-visible { outline-color: #84cfc3; }

    @keyframes rise-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (prefers-reduced-motion: reduce) {
      .login-shell { animation: none; }
      .spinner { animation-duration: 1.5s; }
    }

    /* ---------------- Adaptation mobile / tablette ---------------- */
    @media (max-width: 62rem) {
      .login-shell { grid-template-columns: 1fr; max-width: 30rem; }
      .brand-panel { padding: 2rem 1.75rem 1.75rem; }
      .brand-copy { padding-top: 1.5rem; }
      .brand-copy h2 { font-size: 1.5rem; }
      .brand-copy p { font-size: .8125rem; }
      .brand-points { display: none; }
      .trust-row { margin-top: 1.25rem; }
      .form-panel { padding: 2rem 1.75rem 2.25rem; }
    }
    @media (max-width: 30rem) {
      .login-page { align-items: flex-start; padding: 1.25rem .875rem 3.5rem; }
      .login-shell { border-radius: 1.25rem; }
      .brand-copy { display: none; }
      .trust-row { display: none; }
      .brand-panel { padding: 1.5rem 1.5rem; }
      .mobile-eyebrow { display: inline-block; }
      .form-heading { margin-bottom: 1.5rem; }
      .login-footer { bottom: .75rem; font-size: .5625rem; }
    }

    /* Très grand écran / vidéoprojecteur */
    @media (min-width: 120rem) {
      .login-shell { max-width: 74rem; }
      .form-panel { padding: 3.5rem 4rem; }
      .brand-panel { padding: 3.5rem 3.25rem; }
    }
  `]
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  showPassword = false;
  loading = false;
  errorMessage = '';

  submit(): void {
    this.errorMessage = '';
    this.loading = true;

    setTimeout(() => {
      if (this.auth.login(this.email, this.password)) {
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage = 'Email ou mot de passe incorrect. Vérifiez vos identifiants.';
      }
      this.loading = false;
    }, 350);
  }

  showForgotMessage(): void {
    this.errorMessage = 'Contactez votre administrateur pour réinitialiser votre accès.';
  }
}
