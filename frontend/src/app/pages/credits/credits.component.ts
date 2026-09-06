import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Client, DemandeCredit } from '../../models/client.model';
import { couleurScore } from '../../models/scoring-zones';

interface CreditDossierItem {
  demande: DemandeCredit;
  client: Client;
}

@Component({
  selector: 'app-credits',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-5 sm:space-y-6 animate-fade-up">

      <!-- ================= EN-TÊTE DE PAGE ================= -->
      <header class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="min-w-0">
          <p class="eyebrow">Portefeuille</p>
          <div class="mt-1 flex flex-wrap items-center gap-3">
            <h1 class="text-2xl sm:text-3xl font-extrabold text-ink-900">Dossiers de crédit</h1>
            <span *ngIf="dossiers.length > 0" class="badge-brand">
              {{ dossiers.length }} dossier{{ dossiers.length > 1 ? 's' : '' }}
            </span>
          </div>
          <p class="section-sub max-w-2xl">
            Demandes de microcrédit instruites et évaluées par le moteur de scoring.
          </p>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <button type="button" (click)="toggleCorbeille()"
            [ngClass]="vueCorbeille ? 'btn-primary' : 'btn-secondary'"
            [attr.aria-pressed]="vueCorbeille">
            <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            <span class="hidden xs:inline">Corbeille</span>
            <span *ngIf="corbeille.length > 0"
              [ngClass]="vueCorbeille ? 'bg-white/25 text-white' : 'bg-ink-100 text-ink-600'"
              class="rounded-full px-1.5 py-0.5 text-2xs font-bold tabular-nums">{{ corbeille.length }}</span>
          </button>

          <a routerLink="/credits/nouveau" class="btn-primary">
            <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m-7-7h14"/></svg>
            <span>Nouveau crédit</span>
          </a>
        </div>
      </header>

      <!-- ================= INDICATEURS ================= -->
      <section *ngIf="!vueCorbeille" class="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4"
        aria-label="Synthèse du portefeuille">
        <article class="stat">
          <span class="absolute inset-x-0 top-0 h-1 bg-ink-300" aria-hidden="true"></span>
          <p class="stat-label">Total dossiers</p>
          <p class="stat-value">{{ dossiers.length }}</p>
          <p class="stat-sub">Évaluations enregistrées</p>
        </article>

        <article class="stat">
          <span class="absolute inset-x-0 top-0 h-1 bg-success-500" aria-hidden="true"></span>
          <p class="stat-label text-success-700">Accord favorable</p>
          <p class="stat-value text-success-700">{{ countStatus('APPROUVE') }}</p>
          <p class="stat-sub">{{ getApprovalRate() }} % de taux d'accord</p>
        </article>

        <article class="stat">
          <span class="absolute inset-x-0 top-0 h-1 bg-warning-400" aria-hidden="true"></span>
          <p class="stat-label text-warning-800">À examiner</p>
          <p class="stat-value text-warning-800">{{ countStatus('A_L_ETUDE') }}</p>
          <p class="stat-sub">Décision du comité requise</p>
        </article>

        <article class="stat">
          <span class="absolute inset-x-0 top-0 h-1 bg-danger-500" aria-hidden="true"></span>
          <p class="stat-label text-danger-700">Risque élevé</p>
          <p class="stat-value text-danger-700">{{ countStatus('REJETE') }}</p>
          <p class="stat-sub">Défaut anticipé</p>
        </article>
      </section>

      <!-- ================= RECHERCHE ET FILTRES ================= -->
      <section *ngIf="!vueCorbeille" class="card p-3 sm:p-4" aria-label="Recherche et filtres">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center">

          <!-- Recherche -->
          <div class="relative flex-1 min-w-0">
            <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-400" aria-hidden="true">
              <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </span>
            <label for="recherche-dossiers" class="sr-only">Rechercher un dossier</label>
            <input id="recherche-dossiers" type="search" [(ngModel)]="searchQuery"
              placeholder="Rechercher par nom, N° CNIB, compte ou objet…"
              class="input pl-11 pr-10" />
            <button *ngIf="searchQuery" type="button" (click)="searchQuery = ''"
              class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-ink-400 hover:text-ink-700 transition-colors"
              aria-label="Effacer la recherche">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Filtre par décision -->
          <div class="flex items-center gap-1 rounded-xl bg-ink-100 p-1 overflow-x-auto no-scrollbar"
            role="group" aria-label="Filtrer par décision">
            <button type="button" (click)="selectedStatusFilter = 'ALL'"
              [ngClass]="selectedStatusFilter === 'ALL' ? 'bg-white text-ink-900 shadow-xs' : 'text-ink-500 hover:text-ink-800'"
              [attr.aria-pressed]="selectedStatusFilter === 'ALL'"
              class="tap-sm whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200">
              Tous
            </button>
            <button type="button" (click)="selectedStatusFilter = 'APPROUVE'"
              [ngClass]="selectedStatusFilter === 'APPROUVE' ? 'bg-white text-success-700 shadow-xs' : 'text-ink-500 hover:text-ink-800'"
              [attr.aria-pressed]="selectedStatusFilter === 'APPROUVE'"
              class="tap-sm whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 inline-flex items-center gap-1.5">
              <span class="dot bg-success-500"></span> Accordés
            </button>
            <button type="button" (click)="selectedStatusFilter = 'A_L_ETUDE'"
              [ngClass]="selectedStatusFilter === 'A_L_ETUDE' ? 'bg-white text-warning-800 shadow-xs' : 'text-ink-500 hover:text-ink-800'"
              [attr.aria-pressed]="selectedStatusFilter === 'A_L_ETUDE'"
              class="tap-sm whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 inline-flex items-center gap-1.5">
              <span class="dot bg-warning-400"></span> À examiner
            </button>
            <button type="button" (click)="selectedStatusFilter = 'REJETE'"
              [ngClass]="selectedStatusFilter === 'REJETE' ? 'bg-white text-danger-700 shadow-xs' : 'text-ink-500 hover:text-ink-800'"
              [attr.aria-pressed]="selectedStatusFilter === 'REJETE'"
              class="tap-sm whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 inline-flex items-center gap-1.5">
              <span class="dot bg-danger-500"></span> Refusés
            </button>
          </div>
        </div>

        <!-- Compteur de résultats -->
        <p *ngIf="searchQuery || selectedStatusFilter !== 'ALL'" class="mt-3 text-2xs text-ink-500" aria-live="polite">
          <strong class="text-ink-800 tabular-nums">{{ filteredDossiers.length }}</strong>
          dossier{{ filteredDossiers.length > 1 ? 's' : '' }} sur {{ dossiers.length }}
        </p>
      </section>

      <!-- ================= CORBEILLE ================= -->
      <section *ngIf="vueCorbeille" class="card overflow-hidden" aria-labelledby="titre-corbeille">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 bg-ink-50/70 px-5 py-4">
          <div class="flex items-center gap-3">
            <span class="grid place-items-center w-9 h-9 rounded-xl bg-warning-50 text-warning-700 flex-shrink-0" aria-hidden="true">
              <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </span>
            <div>
              <h2 id="titre-corbeille" class="text-sm font-bold text-ink-900">Corbeille</h2>
              <p class="text-2xs text-ink-500">Dossiers retirés de la liste active, restaurables à tout moment.</p>
            </div>
          </div>
          <span class="badge-neutral tabular-nums">{{ corbeille.length }} élément{{ corbeille.length > 1 ? 's' : '' }}</span>
        </div>

        <div *ngIf="corbeille.length === 0" class="empty-state">
          <span class="empty-icon" aria-hidden="true">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </span>
          <h3 class="text-base font-bold text-ink-900">La corbeille est vide</h3>
          <p class="mt-1.5 text-sm text-ink-500 max-w-xs">Aucun dossier n'a été mis à la corbeille.</p>
        </div>

        <ul *ngIf="corbeille.length > 0" class="divide-y divide-ink-100">
          <li *ngFor="let d of corbeille"
            class="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5 hover:bg-ink-50/60 transition-colors">
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold text-ink-900 truncate">{{ d.client?.prenom }} {{ d.client?.nom }}</p>
              <p class="mt-0.5 text-xs text-ink-500 tabular-nums">
                {{ d.montantDemandeFcfa | number }} FCFA
                <span class="text-ink-300" aria-hidden="true">·</span> {{ d.dureeMois }} mois
                <span class="text-ink-300" aria-hidden="true">·</span> {{ d.objetCredit }}
              </p>
              <p class="mt-1 text-2xs text-ink-400">
                Supprimé le {{ d.dateSuppression | date:'dd/MM/yyyy à HH:mm' }}
              </p>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <button type="button" (click)="restaurer(d)" class="btn-soft btn-sm tap-sm">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.1" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v6h6M4.6 15a9 9 0 102.1-9.3L4 10"/></svg>
                Restaurer
              </button>
              <button type="button" (click)="supprimerDefinitif(d)" class="btn-danger-soft btn-sm tap-sm">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.1" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                <span class="hidden sm:inline">Supprimer définitivement</span>
                <span class="sm:hidden">Supprimer</span>
              </button>
            </div>
          </li>
        </ul>
      </section>

      <!-- ================= LISTE DES DOSSIERS ================= -->
      <section *ngIf="!vueCorbeille" class="card overflow-hidden" aria-label="Liste des dossiers">

        <ul *ngIf="filteredDossiers.length > 0" class="divide-y divide-ink-100">
          <li *ngFor="let item of filteredDossiers" class="relative">
            <!-- La ligne entière ouvre le dossier -->
            <a [routerLink]="['/credits', item.demande.id]"
              class="group block px-4 py-4 sm:px-5 hover:bg-brand-50/40 transition-colors duration-200
                     focus-visible:bg-brand-50/60 rounded-none">

              <div class="flex items-start gap-3 sm:gap-4">

                <!-- Initiales -->
                <span class="grid place-items-center w-11 h-11 flex-shrink-0 rounded-2xl
                             bg-brand-gradient text-white text-xs font-bold shadow-brand
                             transition-transform duration-300 group-hover:scale-105" aria-hidden="true">
                  {{ (item.client.prenom || '?')[0] }}{{ (item.client.nom || '?')[0] }}
                </span>

                <!-- Identité et demande -->
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    <span class="font-bold text-ink-900 leading-tight truncate group-hover:text-brand-700 transition-colors">
                      {{ item.client.prenom }} {{ item.client.nom }}
                    </span>
                    <span class="rounded-md border border-ink-200 bg-ink-50 px-1.5 py-0.5 font-mono text-2xs font-semibold text-ink-600">
                      {{ item.client.numeroCompte }}
                    </span>
                    <span [ngClass]="getStatusBadgeClass(item.demande.statut)" class="badge">
                      <span class="dot" [ngClass]="getStatusDotClass(item.demande.statut)"></span>
                      {{ getStatusLabel(item.demande.statut) }}
                    </span>
                  </div>

                  <p class="mt-1 text-xs text-ink-400 truncate">
                    CNIB {{ item.client.numeroCnib }}
                    <span class="text-ink-300" aria-hidden="true">·</span> {{ item.client.activite }}
                    <span class="text-ink-300" aria-hidden="true">·</span> {{ item.client.ville }}
                  </p>

                  <div class="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                    <span class="font-bold text-ink-900 tabular-nums text-sm">
                      {{ item.demande.montantDemandeFcfa | number }} <span class="text-2xs font-semibold text-ink-400">FCFA</span>
                    </span>
                    <span class="text-ink-500 tabular-nums">{{ item.demande.dureeMois }} mois</span>
                    <span class="rounded-md bg-ink-100 px-2 py-0.5 font-medium text-ink-600 truncate max-w-[16rem]">
                      {{ item.demande.objetCredit || 'Activité génératrice de revenus' }}
                    </span>
                    <span class="text-ink-400 tabular-nums">{{ item.demande.dateCreation | date:'dd/MM/yyyy' }}</span>
                  </div>
                </div>

                <!-- Score de risque -->
                <div class="flex flex-col items-end gap-1.5 flex-shrink-0 pr-9 sm:pr-10">
                  <div *ngIf="scoreAffiche(item.demande.scoreCredit) !== null"
                    [ngClass]="getScoreChipClass(item.demande.scoreCredit)"
                    class="rounded-2xl border px-3 py-1.5 text-center leading-none min-w-[4.25rem]"
                    [title]="'Score de risque : ' + scoreAffiche(item.demande.scoreCredit) + ' sur 100 (0 = faible risque, 100 = risque maximal)'">
                    <span class="block text-[9px] font-bold uppercase tracking-wider opacity-60">Risque</span>
                    <span class="mt-0.5 block tabular-nums">
                      <span class="text-xl font-extrabold">{{ scoreAffiche(item.demande.scoreCredit) }}</span><span class="text-2xs font-semibold opacity-60">/100</span>
                    </span>
                  </div>
                  <span *ngIf="scoreAffiche(item.demande.scoreCredit) === null"
                    class="rounded-xl border border-dashed border-ink-200 px-3 py-2 text-2xs text-ink-400">score n/d</span>
                </div>
              </div>

              <!-- Chevron -->
              <span class="pointer-events-none absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-ink-300
                           transition-all duration-200 group-hover:text-brand-600 group-hover:translate-x-0.5" aria-hidden="true">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
              </span>
            </a>

            <!-- Mise à la corbeille (hors du lien pour rester accessible) -->
            <button type="button" (click)="supprimer(item.demande, item.client)"
              class="absolute right-4 sm:right-5 top-3 rounded-lg p-1.5 text-ink-300
                     hover:bg-danger-50 hover:text-danger-600 transition-colors"
              [attr.aria-label]="'Envoyer à la corbeille le dossier de ' + item.client.prenom + ' ' + item.client.nom"
              title="Envoyer à la corbeille">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </li>
        </ul>

        <!-- Aucun dossier : sociétaire trouvé en base, ou vide complet -->
        <div *ngIf="filteredDossiers.length === 0" class="p-5 sm:p-7">

          <!-- La recherche correspond à un sociétaire sans dossier instruit -->
          <div *ngIf="matchedBankSocietaires.length > 0" class="mx-auto max-w-3xl space-y-4">
            <div class="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50/70 p-4">
              <span class="grid place-items-center w-9 h-9 flex-shrink-0 rounded-xl bg-brand-600 text-white" aria-hidden="true">
                <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </span>
              <div class="min-w-0">
                <p class="text-sm font-bold text-brand-900">
                  {{ matchedBankSocietaires.length }} sociétaire{{ matchedBankSocietaires.length > 1 ? 's' : '' }} trouvé{{ matchedBankSocietaires.length > 1 ? 's' : '' }} dans la base
                </p>
                <p class="mt-0.5 text-xs text-brand-800/75">
                  Enregistré{{ matchedBankSocietaires.length > 1 ? 's' : '' }} à la coopérative, mais aucun dossier de microcrédit n'a encore été instruit.
                </p>
              </div>
            </div>

            <ul class="space-y-3">
              <li *ngFor="let s of matchedBankSocietaires"
                class="card card-hover flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="grid place-items-center w-11 h-11 flex-shrink-0 rounded-2xl bg-brand-gradient
                               text-white text-xs font-bold shadow-brand" aria-hidden="true">
                    {{ s.prenom[0] }}{{ s.nom[0] }}
                  </span>
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="text-sm font-bold text-ink-900 truncate">{{ s.prenom }} {{ s.nom }}</p>
                      <span class="rounded-md border border-warning-200 bg-warning-50 px-1.5 py-0.5 font-mono text-2xs font-semibold text-warning-800">
                        CNIB {{ s.numeroCnib }}
                      </span>
                      <span class="rounded-md border border-ink-200 bg-ink-50 px-1.5 py-0.5 font-mono text-2xs font-semibold text-ink-600">
                        {{ s.numeroCompte }}
                      </span>
                    </div>
                    <p class="mt-1 text-xs text-ink-500 truncate">
                      {{ s.secteurActivite }}
                      <span class="text-ink-300" aria-hidden="true">·</span> {{ s.ville }}
                      <span class="text-ink-300" aria-hidden="true">·</span>
                      épargne <span class="tabular-nums">{{ s.soldeEpargneActuelFcfa | number }}</span> FCFA
                    </p>
                  </div>
                </div>
                <a [routerLink]="['/credits/nouveau']" [queryParams]="{ id: s.id, cnib: s.numeroCnib }"
                  class="btn-primary btn-sm flex-shrink-0 self-start sm:self-auto">
                  Instruire ce crédit
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7-7 7"/></svg>
                </a>
              </li>
            </ul>
          </div>

          <!-- Aucun résultat -->
          <div *ngIf="matchedBankSocietaires.length === 0" class="empty-state">
            <span class="empty-icon" aria-hidden="true">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </span>
            <h3 class="text-base font-bold text-ink-900">
              {{ searchQuery ? 'Aucun résultat pour cette recherche' : 'Aucun dossier de crédit instruit' }}
            </h3>
            <p class="mt-1.5 max-w-sm text-sm text-ink-500 leading-relaxed">
              <ng-container *ngIf="searchQuery">
                Vérifiez l'orthographe du nom ou le numéro CNIB, ou lancez une nouvelle instruction.
              </ng-container>
              <ng-container *ngIf="!searchQuery">
                Pour évaluer un prêt, cliquez sur « Nouveau crédit », recherchez le sociétaire par son numéro CNIB puis lancez l'instruction.
              </ng-container>
            </p>
            <div class="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button *ngIf="searchQuery" type="button" (click)="searchQuery = ''" class="btn-secondary btn-sm">
                Effacer la recherche
              </button>
              <a routerLink="/credits/nouveau" class="btn-primary btn-sm">Nouveau crédit</a>
            </div>
          </div>

        </div>
      </section>

      <!-- ================= CONFIRMATION ================= -->
      <div *ngIf="confirmDialog" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <div class="scrim animate-fade-in" (click)="fermerConfirmation()" aria-hidden="true"></div>
        <div role="alertdialog" aria-modal="true" aria-labelledby="titre-confirmation"
          class="relative w-full max-w-md card shadow-xl p-6 space-y-5 animate-scale-in">
          <div class="flex items-start gap-3.5">
            <span class="grid place-items-center w-11 h-11 rounded-2xl flex-shrink-0"
              [ngClass]="confirmDialog.danger ? 'bg-danger-50 text-danger-600' : 'bg-warning-50 text-warning-700'" aria-hidden="true">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </span>
            <div class="min-w-0 flex-1">
              <h3 id="titre-confirmation" class="text-base font-bold text-ink-900">{{ confirmDialog.titre }}</h3>
              <p class="mt-1.5 text-sm text-ink-600 leading-relaxed">{{ confirmDialog.message }}</p>
              <p *ngIf="confirmDialog.detail" class="mt-2 text-xs"
                [ngClass]="confirmDialog.danger ? 'font-semibold text-danger-600' : 'text-ink-500'">{{ confirmDialog.detail }}</p>
            </div>
          </div>
          <div class="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
            <button type="button" (click)="fermerConfirmation()" class="btn-ghost">Annuler</button>
            <button type="button" (click)="confirmerAction()"
              [ngClass]="confirmDialog.danger ? 'btn-danger' : 'btn-primary'">{{ confirmDialog.libelleOk }}</button>
          </div>
        </div>
      </div>

      <!-- ================= NOTIFICATION ================= -->
      <div *ngIf="toast" class="fixed bottom-4 right-4 left-4 sm:left-auto z-50 sm:max-w-sm animate-slide-in-right"
        role="status" aria-live="polite">
        <div class="flex items-start gap-3 rounded-2xl border bg-white px-4 py-3.5 shadow-lg"
          [ngClass]="toast.type === 'error' ? 'border-danger-200' : 'border-success-200'">
          <span class="grid place-items-center w-7 h-7 rounded-lg flex-shrink-0"
            [ngClass]="toast.type === 'error' ? 'bg-danger-50 text-danger-600' : 'bg-success-50 text-success-600'" aria-hidden="true">
            <svg *ngIf="toast.type === 'success'" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            <svg *ngIf="toast.type === 'error'" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </span>
          <p class="flex-1 text-sm font-medium text-ink-800 leading-snug">{{ toast.message }}</p>
          <button type="button" (click)="toast = null"
            class="-mr-1 -mt-0.5 rounded-lg p-1 text-ink-300 hover:text-ink-600 hover:bg-ink-100 transition-colors"
            aria-label="Fermer la notification">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

    </div>
  `
})
export class CreditsComponent implements OnInit {
  private apiService = inject(ApiService);

  clients: Client[] = [];
  dossiers: CreditDossierItem[] = [];
  searchQuery = '';
  selectedStatusFilter = 'ALL';
  vueCorbeille = false;
  corbeille: DemandeCredit[] = [];

  // Boîte de dialogue de confirmation (remplace window.confirm) + notification.
  confirmDialog: {
    titre: string;
    message: string;
    detail?: string;
    danger?: boolean;
    libelleOk: string;
    action: () => void;
  } | null = null;
  toast: { type: 'success' | 'error'; message: string } | null = null;
  private toastTimer?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    this.loadData();
    this.chargerCorbeille();
  }

  private notifier(type: 'success' | 'error', message: string) {
    this.toast = { type, message };
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toast = null), 3800);
  }

  fermerConfirmation() { this.confirmDialog = null; }

  confirmerAction() {
    const action = this.confirmDialog?.action;
    this.confirmDialog = null;
    action?.();
  }

  chargerCorbeille() {
    this.apiService.getCorbeille().subscribe({ next: (l) => this.corbeille = l || [] });
  }

  toggleCorbeille() {
    this.vueCorbeille = !this.vueCorbeille;
    if (this.vueCorbeille) this.chargerCorbeille();
  }

  private nomDossier(demande: DemandeCredit, client?: Client): string {
    const c = client || demande.client;
    return c ? `${c.prenom} ${c.nom}` : `dossier n°${demande.id}`;
  }

  supprimer(demande: DemandeCredit, client?: Client) {
    if (!demande.id) return;
    const id = demande.id;
    this.confirmDialog = {
      titre: 'Envoyer ce dossier à la corbeille ?',
      message: `Le dossier de ${this.nomDossier(demande, client)} sera déplacé dans la corbeille.`,
      detail: 'Vous pourrez le restaurer à tout moment depuis la corbeille.',
      libelleOk: 'Envoyer à la corbeille',
      action: () => {
        this.apiService.supprimerDemande(id).subscribe({
          next: () => { this.loadData(); this.chargerCorbeille(); this.notifier('success', 'Dossier envoyé à la corbeille.'); },
          error: (e) => { console.error('Suppression :', e); this.notifier('error', "L'envoi à la corbeille a échoué."); },
        });
      },
    };
  }

  restaurer(demande: DemandeCredit) {
    if (!demande.id) return;
    this.apiService.restaurerDemande(demande.id).subscribe({
      next: () => { this.loadData(); this.chargerCorbeille(); this.notifier('success', 'Dossier restauré.'); },
      error: (e) => { console.error('Restauration :', e); this.notifier('error', 'La restauration a échoué.'); },
    });
  }

  supprimerDefinitif(demande: DemandeCredit) {
    if (!demande.id) return;
    const id = demande.id;
    this.confirmDialog = {
      titre: 'Supprimer définitivement ?',
      message: `Le dossier de ${this.nomDossier(demande)} sera supprimé de façon définitive.`,
      detail: 'Cette action est irréversible.',
      danger: true,
      libelleOk: 'Supprimer définitivement',
      action: () => {
        this.apiService.supprimerDefinitivement(id).subscribe({
          next: () => { this.chargerCorbeille(); this.notifier('success', 'Dossier supprimé définitivement.'); },
          error: (e) => { console.error('Suppression définitive :', e); this.notifier('error', 'La suppression a échoué.'); },
        });
      },
    };
  }

  loadData() {
    this.apiService.getClients().subscribe({
      next: (list) => {
        this.clients = list || [];
        const allDossiers: CreditDossierItem[] = [];
        
        this.clients.forEach(c => {
          if (c.demandes && c.demandes.length > 0) {
            c.demandes.forEach(d => {
              allDossiers.push({ demande: d, client: c });
            });
          }
        });

        // Trier par date décroissante
        allDossiers.sort((a, b) => {
          const dateA = a.demande.dateCreation ? new Date(a.demande.dateCreation).getTime() : 0;
          const dateB = b.demande.dateCreation ? new Date(b.demande.dateCreation).getTime() : 0;
          return dateB - dateA;
        });

        this.dossiers = allDossiers;
      },
      error: (err) => {
        console.error('Erreur chargement crédits depuis la base:', err);
      }
    });
  }

  getAccountNumber(c: Client): string {
    if (!c.id) return '001';
    if (c.id < 10) return '00' + c.id;
    if (c.id < 100) return '0' + c.id;
    return c.id.toString();
  }

  get matchedBankSocietaires(): Client[] {
    const q = (this.searchQuery || '').toLowerCase().replace(/\s+/g, '').trim();
    if (!q || q.length < 2) return [];
    return this.clients.filter(c => {
      const cnib = (c.numeroCnib || '').toLowerCase().replace(/\s+/g, '');
      const acct = (c.numeroCompte || '').toLowerCase().replace(/\s+/g, '');
      const nom = (c.nom || '').toLowerCase();
      const prenom = (c.prenom || '').toLowerCase();
      const fullName = (prenom + nom).replace(/\s+/g, '');
      const fullNameRev = (nom + prenom).replace(/\s+/g, '');
      return (
        cnib.includes(q) ||
        acct.includes(q) ||
        fullName.includes(q) ||
        fullNameRev.includes(q) ||
        nom.includes(q) ||
        prenom.includes(q)
      );
    }).slice(0, 5);
  }

  get filteredDossiers(): CreditDossierItem[] {
    const q = (this.searchQuery || '').toLowerCase().replace(/\s+/g, '').trim();
    return this.dossiers.filter(item => {
      const acct = (item.client.numeroCompte || '').toLowerCase().replace(/\s+/g, '');
      const cnib = (item.client.numeroCnib || '').toLowerCase().replace(/\s+/g, '');
      const nom = (item.client.nom || '').toLowerCase();
      const prenom = (item.client.prenom || '').toLowerCase();
      const fullName = (prenom + nom).replace(/\s+/g, '');
      const fullNameRev = (nom + prenom).replace(/\s+/g, '');
      const matchQuery = !q ||
        cnib.includes(q) ||
        acct.includes(q) ||
        fullName.includes(q) ||
        fullNameRev.includes(q) ||
        nom.includes(q) ||
        prenom.includes(q) ||
        (item.demande.objetCredit && item.demande.objetCredit.toLowerCase().includes(q)) ||
        (item.demande.montantDemandeFcfa && item.demande.montantDemandeFcfa.toString().includes(q));

      const matchStatus = this.selectedStatusFilter === 'ALL' || item.demande.statut === this.selectedStatusFilter;
      return matchQuery && matchStatus;
    });
  }

  countStatus(status: string): number {
    return this.dossiers.filter(d => d.demande.statut === status).length;
  }

  getApprovalRate(): number {
    if (this.dossiers.length === 0) return 0;
    const approved = this.countStatus('APPROUVE');
    return Math.round((approved / this.dossiers.length) * 100);
  }

  // Score de RISQUE 0-100 (0 = bon, 100 = mauvais), couleurs alignées sur les
  // zones du modèle déployé (cf. models/scoring-zones.ts).
  getScoreColor(score?: number): string {
    const c = couleurScore(score);
    return c === 'gris' ? 'text-ink-700' : c === 'vert' ? 'text-success-600' : c === 'orange' ? 'text-warning-600' : 'text-danger-600';
  }

  /** Score à afficher : null si absent ou hors échelle 0-100 (ancienne donnée 300-900). */
  scoreAffiche(score?: number): number | null {
    return (score !== null && score !== undefined && score >= 0 && score <= 100)
      ? Math.round(score) : null;
  }

  /** Pastille de score : fond + texte + bordure selon la zone de décision. */
  getScoreChipClass(score?: number): string {
    const c = couleurScore(this.scoreAffiche(score));
    if (c === 'gris') return 'bg-ink-50 text-ink-400 border-ink-200';
    if (c === 'vert') return 'bg-success-50 text-success-700 border-success-200';
    if (c === 'orange') return 'bg-warning-50 text-warning-700 border-warning-200';
    return 'bg-danger-50 text-danger-700 border-danger-200';
  }

  getStatusBadgeClass(statut?: string): string {
    switch (statut) {
      case 'APPROUVE': return 'bg-success-50 text-success-700 border-success-200';
      case 'A_L_ETUDE': return 'bg-warning-50 text-warning-700 border-warning-200';
      case 'REJETE': return 'bg-danger-50 text-danger-700 border-danger-200';
      default: return 'bg-ink-100 text-ink-700 border-ink-200';
    }
  }

  getStatusDotClass(statut?: string): string {
    switch (statut) {
      case 'APPROUVE': return 'bg-success-500';
      case 'A_L_ETUDE': return 'bg-warning-500';
      case 'REJETE': return 'bg-danger-500';
      default: return 'bg-ink-400';
    }
  }

  getStatusLabel(statut?: string): string {
    switch (statut) {
      case 'APPROUVE': return 'Accord Favorable';
      case 'A_L_ETUDE': return 'À Examiner';
      case 'REJETE': return 'Risque Élevé';
      default: return statut || 'En attente';
    }
  }
}
