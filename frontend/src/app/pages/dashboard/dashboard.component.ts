import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { DashboardStats } from '../../models/client.model';
import { SCORE_RISQUE_VERT_MAX, SCORE_RISQUE_ROUGE_MIN } from '../../models/scoring-zones';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6 sm:space-y-7 animate-fade-in">

      <!-- ================= BANDEAU D'ACCUEIL ================= -->
      <section class="panel-dark px-6 py-7 sm:px-9 sm:py-9">
        <span class="glow w-[26rem] h-[26rem] -top-40 -right-24" aria-hidden="true"></span>
        <span class="glow w-72 h-72 -bottom-32 left-1/4 opacity-60" aria-hidden="true"></span>

        <div class="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-2xl">
            <span class="badge bg-white/10 text-brand-100 border-white/15 backdrop-blur">
              <span class="dot bg-success-400"></span>
              Moteur de scoring opérationnel
            </span>
            <h1 class="mt-4 text-3xl sm:text-4xl 3xl:text-5xl font-extrabold text-white leading-[1.1]">
              Tableau de bord
            </h1>
            <p class="mt-3 text-sm sm:text-base text-brand-100/80 leading-relaxed max-w-xl">
              Vue d'ensemble du portefeuille de microcrédit : sociétaires suivis, dossiers instruits
              et répartition des décisions rendues par le moteur d'évaluation.
            </p>
          </div>

          <a routerLink="/credits/nouveau"
            class="btn btn-lg bg-white text-brand-800 shadow-xl hover:bg-brand-50 hover:shadow-2xl
                   active:scale-[.98] self-start lg:self-auto flex-shrink-0">
            <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m-7-7h14"/></svg>
            Instruire un dossier
          </a>
        </div>
      </section>

      <!-- ================= INDICATEURS CLÉS ================= -->
      <section aria-labelledby="titre-indicateurs">
        <h2 id="titre-indicateurs" class="sr-only">Indicateurs clés</h2>

        <div class="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">

          <!-- Sociétaires -->
          <article class="stat card-hover group">
            <span class="absolute inset-x-0 top-0 h-1 bg-brand-500" aria-hidden="true"></span>
            <div class="flex items-start justify-between gap-3">
              <p class="stat-label">Sociétaires</p>
              <span class="grid place-items-center w-9 h-9 rounded-xl bg-brand-50 text-brand-600
                           transition-transform duration-300 group-hover:scale-110" aria-hidden="true">
                <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </span>
            </div>
            <p class="stat-value">{{ stats ? (stats.totalClients | number) : '-' }}</p>
            <p class="stat-sub">Adhérents de la coopérative</p>
          </article>

          <!-- Dossiers -->
          <article class="stat card-hover group">
            <span class="absolute inset-x-0 top-0 h-1 bg-info-500" aria-hidden="true"></span>
            <div class="flex items-start justify-between gap-3">
              <p class="stat-label">Dossiers instruits</p>
              <span class="grid place-items-center w-9 h-9 rounded-xl bg-info-50 text-info-600
                           transition-transform duration-300 group-hover:scale-110" aria-hidden="true">
                <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </span>
            </div>
            <p class="stat-value">{{ stats ? (stats.totalDemandes | number) : '-' }}</p>
            <p class="stat-sub">Évaluations enregistrées</p>
          </article>

          <!-- Accordés -->
          <article class="stat card-hover group">
            <span class="absolute inset-x-0 top-0 h-1 bg-success-500" aria-hidden="true"></span>
            <div class="flex items-start justify-between gap-3">
              <p class="stat-label text-success-700">Accordés</p>
              <span class="grid place-items-center w-9 h-9 rounded-xl bg-success-50 text-success-600
                           transition-transform duration-300 group-hover:scale-110" aria-hidden="true">
                <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2.1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
              </span>
            </div>
            <p class="stat-value text-success-700">{{ stats ? (stats.approuvees | number) : '-' }}</p>
            <p class="stat-sub">{{ pct(stats?.approuvees) }} des dossiers</p>
          </article>

          <!-- Refusés -->
          <article class="stat card-hover group">
            <span class="absolute inset-x-0 top-0 h-1 bg-danger-500" aria-hidden="true"></span>
            <div class="flex items-start justify-between gap-3">
              <p class="stat-label text-danger-700">Refusés</p>
              <span class="grid place-items-center w-9 h-9 rounded-xl bg-danger-50 text-danger-600
                           transition-transform duration-300 group-hover:scale-110" aria-hidden="true">
                <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2.1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </span>
            </div>
            <p class="stat-value text-danger-700">{{ stats ? (stats.rejetees | number) : '-' }}</p>
            <p class="stat-sub">{{ pct(stats?.rejetees) }} des dossiers</p>
          </article>
        </div>
      </section>

      <!-- ================= RÉPARTITION + ÉCHELLE ================= -->
      <div class="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-5">

        <!-- Répartition des décisions -->
        <section class="card card-pad xl:col-span-3" aria-labelledby="titre-repartition">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="eyebrow">Portefeuille</p>
              <h2 id="titre-repartition" class="section-title mt-1">Répartition des décisions</h2>
            </div>
            <a routerLink="/credits" class="btn-ghost btn-sm tap-sm">
              Voir les dossiers
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            </a>
          </div>

          <!-- Aucun dossier -->
          <div *ngIf="!stats || stats.totalDemandes === 0" class="empty-state">
            <span class="empty-icon" aria-hidden="true">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m4 10V11m4 6V9M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
            </span>
            <h3 class="text-base font-bold text-ink-900">Aucun dossier instruit</h3>
            <p class="mt-1.5 text-sm text-ink-500 max-w-xs">
              La répartition s'affichera dès la première évaluation enregistrée.
            </p>
            <a routerLink="/credits/nouveau" class="btn-primary btn-sm mt-5">Instruire un dossier</a>
          </div>

          <ng-container *ngIf="stats && stats.totalDemandes > 0">
            <!-- Barre segmentée -->
            <div class="mt-6 flex h-3.5 w-full overflow-hidden rounded-full bg-ink-100"
              role="img"
              [attr.aria-label]="'Accordés ' + pct(stats.approuvees) + ', à l’étude ' + pct(stats.enEtude) + ', refusés ' + pct(stats.rejetees)">
              <div class="h-full bg-success-500 transition-[width] duration-700 ease-smooth"
                [style.width.%]="ratio(stats.approuvees)"></div>
              <div class="h-full bg-warning-400 transition-[width] duration-700 ease-smooth"
                [style.width.%]="ratio(stats.enEtude)"></div>
              <div class="h-full bg-danger-500 transition-[width] duration-700 ease-smooth"
                [style.width.%]="ratio(stats.rejetees)"></div>
            </div>

            <!-- Légende chiffrée -->
            <dl class="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="rounded-xl border border-success-200 bg-success-50/60 px-4 py-3">
                <dt class="flex items-center gap-2 text-2xs font-bold uppercase tracking-wider text-success-800">
                  <span class="dot bg-success-500"></span> Accordés
                </dt>
                <dd class="mt-1.5 flex items-baseline gap-2">
                  <span class="text-2xl font-extrabold text-success-800 tabular-nums">{{ stats.approuvees }}</span>
                  <span class="text-xs font-semibold text-success-700/70">{{ pct(stats.approuvees) }}</span>
                </dd>
              </div>
              <div class="rounded-xl border border-warning-200 bg-warning-50/60 px-4 py-3">
                <dt class="flex items-center gap-2 text-2xs font-bold uppercase tracking-wider text-warning-800">
                  <span class="dot bg-warning-400"></span> À l'étude
                </dt>
                <dd class="mt-1.5 flex items-baseline gap-2">
                  <span class="text-2xl font-extrabold text-warning-800 tabular-nums">{{ stats.enEtude }}</span>
                  <span class="text-xs font-semibold text-warning-700/70">{{ pct(stats.enEtude) }}</span>
                </dd>
              </div>
              <div class="rounded-xl border border-danger-200 bg-danger-50/60 px-4 py-3">
                <dt class="flex items-center gap-2 text-2xs font-bold uppercase tracking-wider text-danger-800">
                  <span class="dot bg-danger-500"></span> Refusés
                </dt>
                <dd class="mt-1.5 flex items-baseline gap-2">
                  <span class="text-2xl font-extrabold text-danger-800 tabular-nums">{{ stats.rejetees }}</span>
                  <span class="text-xs font-semibold text-danger-700/70">{{ pct(stats.rejetees) }}</span>
                </dd>
              </div>
            </dl>
          </ng-container>
        </section>

        <!-- Échelle du score de risque -->
        <section class="card card-pad xl:col-span-2" aria-labelledby="titre-echelle">
          <p class="eyebrow">Aide à la lecture</p>
          <h2 id="titre-echelle" class="section-title mt-1">Échelle du score de risque</h2>
          <p class="section-sub">0 = aucun risque &middot; 100 = risque maximal.</p>

          <!-- Règle graduée -->
          <div class="mt-7">
            <div class="h-3 w-full rounded-full overflow-hidden"
              style="background:linear-gradient(90deg,#10b968 0%,#34d383 26%,#fdb022 45%,#f79009 55%,#f04438 74%,#b42318 100%)"
              role="img" aria-label="Dégradé du vert (risque faible) au rouge (risque élevé)">
            </div>
            <!-- Repères des seuils -->
            <div class="relative h-10 mt-1">
              <div class="absolute top-0 -translate-x-1/2 flex flex-col items-center" [style.left.%]="seuilVert">
                <span class="h-2.5 w-px bg-ink-300" aria-hidden="true"></span>
                <span class="mt-1 font-mono text-2xs font-semibold text-ink-600">{{ seuilVert }}</span>
              </div>
              <div class="absolute top-0 -translate-x-1/2 flex flex-col items-center" [style.left.%]="seuilRouge">
                <span class="h-2.5 w-px bg-ink-300" aria-hidden="true"></span>
                <span class="mt-1 font-mono text-2xs font-semibold text-ink-600">{{ seuilRouge }}</span>
              </div>
              <span class="absolute top-4 left-0 text-2xs font-medium text-ink-400">0</span>
              <span class="absolute top-4 right-0 text-2xs font-medium text-ink-400">100</span>
            </div>
          </div>

          <!-- Zones -->
          <ul class="mt-3 space-y-2">
            <li class="flex items-start gap-3 rounded-xl border border-success-200 bg-success-50/50 px-3.5 py-2.5">
              <span class="dot bg-success-500 mt-1.5"></span>
              <span class="min-w-0">
                <span class="block text-sm font-bold text-success-800">Accord favorable</span>
                <span class="block text-2xs text-success-700/80">Score de 0 à {{ seuilVert }} - le dossier peut être accordé.</span>
              </span>
            </li>
            <li class="flex items-start gap-3 rounded-xl border border-warning-200 bg-warning-50/50 px-3.5 py-2.5">
              <span class="dot bg-warning-400 mt-1.5"></span>
              <span class="min-w-0">
                <span class="block text-sm font-bold text-warning-800">À examiner</span>
                <span class="block text-2xs text-warning-700/80">Score de {{ seuilVert + 1 }} à {{ seuilRouge }} - décision du comité de crédit.</span>
              </span>
            </li>
            <li class="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50/50 px-3.5 py-2.5">
              <span class="dot bg-danger-500 mt-1.5"></span>
              <span class="min-w-0">
                <span class="block text-sm font-bold text-danger-800">Risque élevé</span>
                <span class="block text-2xs text-danger-700/80">Score au-delà de {{ seuilRouge }} - dossier à refuser.</span>
              </span>
            </li>
          </ul>
        </section>
      </div>

      <!-- ================= RACCOURCIS ================= -->
      <section aria-labelledby="titre-raccourcis">
        <h2 id="titre-raccourcis" class="sr-only">Raccourcis</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">

          <a routerLink="/credits/nouveau" class="card card-pad card-hover group flex items-start gap-4">
            <span class="grid place-items-center w-11 h-11 rounded-2xl bg-brand-gradient text-white
                         shadow-brand flex-shrink-0 transition-transform duration-300 group-hover:scale-105" aria-hidden="true">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m-7-7h14"/></svg>
            </span>
            <span class="min-w-0">
              <span class="block text-sm font-bold text-ink-900 group-hover:text-brand-700 transition-colors">Nouvelle évaluation</span>
              <span class="block text-2xs text-ink-500 mt-1 leading-relaxed">Rechercher un sociétaire et instruire sa demande.</span>
            </span>
          </a>

          <a routerLink="/credits" class="card card-pad card-hover group flex items-start gap-4">
            <span class="grid place-items-center w-11 h-11 rounded-2xl bg-info-50 text-info-600
                         flex-shrink-0 transition-transform duration-300 group-hover:scale-105" aria-hidden="true">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            </span>
            <span class="min-w-0">
              <span class="block text-sm font-bold text-ink-900 group-hover:text-info-700 transition-colors">Dossiers de crédit</span>
              <span class="block text-2xs text-ink-500 mt-1 leading-relaxed">Consulter, filtrer et rouvrir les évaluations.</span>
            </span>
          </a>

          <a routerLink="/parametres" class="card card-pad card-hover group flex items-start gap-4">
            <span class="grid place-items-center w-11 h-11 rounded-2xl bg-ink-100 text-ink-600
                         flex-shrink-0 transition-transform duration-300 group-hover:scale-105" aria-hidden="true">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </span>
            <span class="min-w-0">
              <span class="block text-sm font-bold text-ink-900 group-hover:text-ink-950 transition-colors">Paramétrage</span>
              <span class="block text-2xs text-ink-500 mt-1 leading-relaxed">Catégories, garanties, agences et rôles.</span>
            </span>
          </a>
        </div>
      </section>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  stats: DashboardStats | null = null;

  /** Bornes des zones de décision, alignées sur le modèle déployé. */
  readonly seuilVert = SCORE_RISQUE_VERT_MAX;
  readonly seuilRouge = SCORE_RISQUE_ROUGE_MIN;

  ngOnInit() {
    this.api.getStats().subscribe({
      next: (s: DashboardStats) => this.stats = s,
      error: () => this.stats = { totalClients: 0, totalDemandes: 0, approuvees: 0, rejetees: 0, enEtude: 0 }
    });
  }

  /** Part d'un sous-total dans les dossiers instruits, en pourcentage brut. */
  ratio(valeur?: number): number {
    const total = this.stats?.totalDemandes || 0;
    if (!total || !valeur) return 0;
    return (valeur / total) * 100;
  }

  /** Même part, formatée pour l'affichage. */
  pct(valeur?: number): string {
    const total = this.stats?.totalDemandes || 0;
    if (!total) return '-';
    return Math.round(((valeur || 0) / total) * 100) + ' %';
  }
}
