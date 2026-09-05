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
          <div class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 6l3 1m0 0l-3 9a5 5 0 006 0M6 7l3 9m-3-9l6-2m6 2l3-1m-3 1l-3 9a5 5 0 006 0m-3-9l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <span class="brand-name">SAMDE</span>
          <span class="brand-tagline">Portail Agent</span>
          <span class="eyebrow">CIF · DigiCoop-WA+</span>
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
                placeholder="Email (ex: agent@cif.bf) ou Matricule"
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

          <div class="demo-box">
            <div class="demo-box-header">
              <span class="demo-badge">Compte Administrateur Initial</span>
            </div>
            <p class="demo-box-text">
              Compte sécurisé pour gérer la plateforme :<br/>
              Identifiant : <strong>admin@cif.bf</strong> · Mot de passe : <strong>admin123</strong>
            </p>
            <button type="button" class="demo-btn" (click)="quickDemoLogin()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Connexion Administrateur Démo</span>
            </button>
            <span class="demo-subtext">Accès sécurisé : seuls les comptes existants avec leur mot de passe exact sont acceptés.</span>
          </div>

        </div>
      </section>

      <p class="login-footer">&#64;SAMDE · Solution de scoring microcrédit · Burkina Faso</p>
    </main>
  `,
  styles: [`
    :host { display: block; }
    .login-page { min-height: 100vh; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 32px 20px 56px; background: #f4f7f8; color: #17252b; }
    .login-page::before { content: ''; position: absolute; inset: 0; opacity: .38; background-image: linear-gradient(rgba(25, 68, 70, .06) 1px, transparent 1px), linear-gradient(90deg, rgba(25, 68, 70, .06) 1px, transparent 1px); background-size: 42px 42px; mask-image: linear-gradient(to bottom, black, transparent 80%); }
    .login-glow { position: absolute; width: 460px; height: 460px; border-radius: 50%; filter: blur(2px); pointer-events: none; }
    .login-glow-left { left: -240px; top: -150px; background: rgba(15, 118, 110, .12); }
    .login-glow-right { right: -210px; bottom: -220px; background: rgba(224, 155, 54, .12); }
    .login-shell { position: relative; z-index: 1; display: block; width: min(520px, 100%); overflow: hidden; border: 1px solid rgba(28, 65, 70, .1); border-radius: 20px; background: #fff; box-shadow: 0 24px 65px rgba(31, 55, 60, .13); animation: rise-in .55s ease-out both; }
    .brand-panel { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; padding: 38px 32px 25px; border-radius: 20px 20px 42px 42px; color: #fff; background: #123b41; box-shadow: 0 12px 22px rgba(18,59,65,.16); text-align: center; }
    .brand-mark { display: grid; place-items: center; width: 46px; height: 46px; border: 1px solid rgba(255,255,255,.28); border-radius: 13px; color: #f2b95f; }
    .brand-mark svg { width: 25px; height: 25px; }
    .brand-name { margin-top: 15px; font-size: 16px; font-weight: 800; letter-spacing: .17em; }
    .brand-tagline { margin-top: 3px; color: #9cb4b4; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
    .eyebrow, .mobile-eyebrow { color: #efb75b; font-size: 10px; font-weight: 800; letter-spacing: .17em; text-transform: uppercase; }
    .brand-copy h2 { margin: 14px 0 12px; font-size: clamp(30px, 3vw, 42px); line-height: 1.08; letter-spacing: -.04em; }
    .brand-copy p { margin: 0; color: #b9cbca; font-size: 14px; line-height: 1.7; }
    .trust-row { display: flex; align-items: center; gap: 9px; margin-top: 40px; color: #b9cbca; font-size: 11px; }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; background: #64d29a; box-shadow: 0 0 0 4px rgba(100,210,154,.12); }
    .form-panel { display: flex; flex-direction: column; justify-content: center; padding: 10px clamp(32px, 8vw, 68px) 46px; background: #fff; }
    .form-heading { margin-bottom: 32px; }
    .form-heading h1 { margin: 10px 0 8px; color: #17353a; font-family: 'DM Serif Display', Georgia, serif; font-size: 38px; font-weight: 400; line-height: 1.08; letter-spacing: 0; }
    .form-heading p { margin: 0; color: #748487; font-size: 14px; }
    .mobile-eyebrow { display: none; color: #147c76; }
    .field-label { display: block; margin-bottom: 8px; color: #29484d; font-size: 12px; font-weight: 700; }
    .password-label-row { display: flex; justify-content: space-between; align-items: center; margin-top: 22px; }
    .password-label-row .field-label { margin-bottom: 8px; }
    .forgot-link { margin-bottom: 8px; padding: 0; border: 0; background: transparent; color: #147c76; cursor: pointer; font-size: 11px; font-weight: 700; }
    .forgot-link:hover { color: #0d5d59; text-decoration: underline; }
    .field-wrap { display: flex; align-items: center; min-height: 49px; border: 1px solid #d6e0e0; border-radius: 9px; background: #fbfcfc; transition: border-color .2s, box-shadow .2s, background .2s; }
    .field-wrap:focus-within { border-color: #147c76; background: #fff; box-shadow: 0 0 0 3px rgba(20,124,118,.12); }
    .field-wrap.field-invalid { border-color: #cc5b56; }
    .field-icon { flex: 0 0 auto; width: 18px; height: 18px; margin: 0 12px 0 14px; color: #829496; }
    .field-wrap input { flex: 1; min-width: 0; height: 47px; padding: 0 10px 0 0; border: 0; outline: 0; background: transparent; color: #203b40; font: inherit; font-size: 13px; }
    .field-wrap input::placeholder { color: #a9b6b7; }
    .password-toggle { display: grid; place-items: center; width: 40px; height: 42px; margin-right: 2px; border: 0; background: transparent; color: #829496; cursor: pointer; }
    .password-toggle:hover { color: #147c76; }
    .password-toggle svg { width: 18px; height: 18px; }
    .field-error { margin: 6px 0 0; color: #b34e4a; font-size: 11px; }
    .form-error { display: flex; align-items: center; gap: 8px; margin: 18px 0 0; color: #a54843; font-size: 12px; line-height: 1.4; }
    .error-mark { display: grid; flex: 0 0 auto; place-items: center; width: 17px; height: 17px; border-radius: 50%; background: #f8dedd; color: #a54843; font-size: 11px; font-weight: 800; }
    .submit-button { width: 100%; min-height: 49px; margin-top: 25px; border: 0; border-radius: 9px; background: #147c76; color: white; cursor: pointer; font: inherit; font-size: 13px; font-weight: 800; letter-spacing: .01em; box-shadow: 0 8px 18px rgba(20,124,118,.18); transition: background .2s, transform .2s, box-shadow .2s; }
    .submit-button:hover:not(:disabled) { background: #0e625e; box-shadow: 0 10px 22px rgba(20,124,118,.25); transform: translateY(-1px); }
    .submit-button:disabled { cursor: not-allowed; opacity: .52; box-shadow: none; }
    .loading-state { display: inline-flex; align-items: center; gap: 9px; }
    .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
    .security-note { display: flex; align-items: flex-start; gap: 8px; margin-top: 27px; color: #879798; font-size: 10px; line-height: 1.5; }
    .security-note svg { flex: 0 0 auto; width: 16px; height: 16px; color: #147c76; }
    .demo-hint { margin: 26px 0 0; color: #adb9ba; font-size: 10px; text-align: center; }
    .demo-hint strong { color: #718486; font-weight: 700; }
    .demo-box { margin-top: 22px; padding: 14px 16px; border-radius: 12px; background: #f0f7f6; border: 1px dashed #7ebcb7; text-align: center; }
    .demo-box-header { display: flex; align-items: center; justify-content: center; margin-bottom: 6px; }
    .demo-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 800; color: #147c76; text-transform: uppercase; letter-spacing: .05em; }
    .demo-box-text { margin: 0 0 10px; font-size: 11px; line-height: 1.4; color: #4b666a; }
    .demo-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; width: 100%; min-height: 40px; padding: 8px 14px; background: #ffffff; color: #147c76; border: 1.5px solid #147c76; border-radius: 8px; font-size: 12px; font-weight: 800; cursor: pointer; transition: all .2s ease; }
    .demo-btn:hover { background: #147c76; color: #ffffff; box-shadow: 0 4px 14px rgba(20, 124, 118, .22); transform: translateY(-1px); }
    .demo-btn svg { width: 15px; height: 15px; }
    .demo-subtext { display: block; margin-top: 8px; font-size: 10px; color: #7b9395; }
    .login-footer { position: absolute; z-index: 1; bottom: 20px; margin: 0; color: #8a9b9d; font-size: 10px; letter-spacing: .04em; }
    @keyframes rise-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 700px) { .login-page { align-items: flex-start; padding: 24px 14px 54px; } .login-shell { margin: 12px 0; border-radius: 16px; } .brand-panel { padding: 28px 26px 18px; border-radius: 16px 16px 32px 32px; } .form-panel { padding: 10px 26px 32px; } .mobile-eyebrow { display: block; } .form-heading { margin-bottom: 26px; } .form-heading h1 { font-size: 32px; } .login-footer { bottom: 14px; font-size: 9px; text-align: center; } }
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

  quickDemoLogin(): void {
    this.email = 'admin@cif.bf';
    this.password = 'admin123';
    this.submit();
  }

  showForgotMessage(): void {
    this.errorMessage = 'Contactez votre administrateur CIF pour réinitialiser votre accès.';
  }
}
