import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { SettingsService, ObjetCreditItem, GarantieItem, CategorieCreditItem } from '../../services/settings.service';
import { Client, DemandeCredit, FacteurExplicatif, CreditInterneAnterieur, BicEngagementExterne, FactureServicePublic } from '../../models/client.model';
import { couleurScore } from '../../models/scoring-zones';
import {
  SECTEURS_ACTIVITE, SOUS_SECTEURS_FORMELS, SOUS_SECTEUR_NON_APPLICABLE,
  REGULARITES_EPARGNE, STATUTS_BIC, BIC_PRET_EN_COURS, BIC_INCIDENT,
  TYPES_COMPTE_BANCAIRE, TYPE_COMPTE_BANCAIRE_AUCUN, DUREES_STANDARD,
} from '../../data/vocabulaire';

interface Volet { n: number; titre: string; sous: string; }

@Component({
  selector: 'app-credit-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-6xl space-y-5 sm:space-y-6 pb-16 animate-fade-in">

      <!-- Retour vers la liste des dossiers -->
      <div class="flex justify-end">
        <a routerLink="/credits" class="btn-ghost btn-sm tap-sm">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Retour aux crédits
        </a>
      </div>

      <!-- ============ CAS 1 : recherche sociétaire ============ -->
      <div *ngIf="!selectedClient" class="space-y-5">
        <section class="panel-dark px-6 py-7 sm:px-8">
          <span class="glow w-80 h-80 -top-32 -right-16" aria-hidden="true"></span>
          <div class="relative max-w-2xl">
            <p class="text-2xs font-bold uppercase tracking-[0.14em] text-brand-200">Étape préalable</p>
            <h1 class="mt-2 text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              Sélection du sociétaire
            </h1>
            <p class="mt-2.5 text-sm text-brand-100/80 leading-relaxed">
              Recherchez le demandeur par numéro CNIB, nom ou numéro de compte pour démarrer l'instruction du dossier.
            </p>
          </div>
        </section>

        <section class="card card-pad space-y-4">
          <div class="relative">
            <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-ink-400" aria-hidden="true">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </span>
            <label for="recherche-societaire" class="sr-only">Rechercher un sociétaire</label>
            <input id="recherche-societaire" type="search" [(ngModel)]="searchQuery" [ngModelOptions]="{standalone:true}"
              placeholder="N° CNIB, nom, prénom ou numéro de compte…"
              class="input input-lg pl-12 font-medium" autocomplete="off" />
          </div>

          <ul *ngIf="searchedClients.length > 0" class="divide-y divide-ink-100 rounded-xl border border-ink-200 overflow-hidden">
            <li *ngFor="let c of searchedClients">
              <button type="button" (click)="selectClient(c)"
                class="group flex w-full items-center justify-between gap-3 p-4 text-left
                       hover:bg-brand-50/60 transition-colors duration-200">
                <span class="flex items-center gap-3 min-w-0">
                  <span class="grid place-items-center w-11 h-11 flex-shrink-0 rounded-2xl bg-brand-gradient
                               text-white text-xs font-bold shadow-brand
                               transition-transform duration-300 group-hover:scale-105" aria-hidden="true">
                    {{ (c.prenom || '?')[0] }}{{ (c.nom || '?')[0] }}
                  </span>
                  <span class="min-w-0">
                    <span class="block text-sm font-bold text-ink-900 truncate group-hover:text-brand-700 transition-colors">
                      {{ c.prenom }} {{ c.nom }}
                    </span>
                    <span class="mt-0.5 block text-xs text-ink-500 truncate">
                      CNIB {{ c.numeroCnib }}
                      <span class="text-ink-300" aria-hidden="true">·</span> {{ c.numeroCompte }}
                      <span class="text-ink-300" aria-hidden="true">·</span> {{ c.secteurActivite }}
                      <span class="text-ink-300" aria-hidden="true">·</span> {{ c.ville }}
                    </span>
                  </span>
                </span>
                <span class="flex items-center gap-1.5 flex-shrink-0 text-xs font-bold text-brand-600
                             transition-transform duration-200 group-hover:translate-x-0.5">
                  <span class="hidden sm:inline">Sélectionner</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                </span>
              </button>
            </li>
          </ul>

          <div *ngIf="searchedClients.length === 0" class="empty-state py-10">
            <span class="empty-icon" aria-hidden="true">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </span>
            <h2 class="text-base font-bold text-ink-900">
              {{ searchQuery ? 'Aucun sociétaire trouvé' : 'Commencez votre recherche' }}
            </h2>
            <p class="mt-1.5 max-w-sm text-sm text-ink-500 leading-relaxed">
              {{ searchQuery
                 ? 'Vérifiez le numéro CNIB ou l’orthographe du nom.'
                 : 'Saisissez au moins deux caractères pour afficher les sociétaires correspondants.' }}
            </p>
          </div>
        </section>
      </div>

      <!-- ============ CAS 2 : dossier sélectionné ============ -->
      <div *ngIf="selectedClient" class="space-y-6">

        <!-- Bandeau étapes -->
        <nav class="card p-3 sm:p-4" aria-label="Étapes de l'instruction">
          <ol class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <li>
              <button type="button" (click)="step = 1"
                [attr.aria-current]="step === 1 ? 'step' : null"
                [ngClass]="step===1 ? 'border-brand-500 bg-brand-50 text-brand-800 ring-2 ring-brand-500/20'
                          : (step>1 ? 'border-success-200 bg-success-50/70 text-success-800 hover:border-success-300'
                                    : 'border-ink-200 bg-ink-50 text-ink-400 hover:border-ink-300')"
                class="w-full flex items-center justify-center sm:justify-start gap-2.5 rounded-xl border
                       px-2.5 py-2.5 sm:px-3.5 text-xs font-bold transition-all duration-200 ease-smooth">
                <span class="grid place-items-center w-6 h-6 flex-shrink-0 rounded-full text-white text-2xs font-bold"
                  [ngClass]="step>1 ? 'bg-success-600' : (step===1 ? 'bg-brand-600' : 'bg-ink-300')" aria-hidden="true">{{ step>1 ? '✓' : '1' }}</span>
                <span class="hidden sm:inline truncate">Fiche sociétaire</span>
                <span class="sm:hidden truncate">Fiche</span>
              </button>
            </li>
            <li>
              <button type="button" (click)="step = 2"
                [attr.aria-current]="step === 2 ? 'step' : null"
                [ngClass]="step===2 ? 'border-brand-500 bg-brand-50 text-brand-800 ring-2 ring-brand-500/20'
                          : (step>2 ? 'border-success-200 bg-success-50/70 text-success-800 hover:border-success-300'
                                    : 'border-ink-200 bg-ink-50 text-ink-400 hover:border-ink-300')"
                class="w-full flex items-center justify-center sm:justify-start gap-2.5 rounded-xl border
                       px-2.5 py-2.5 sm:px-3.5 text-xs font-bold transition-all duration-200 ease-smooth">
                <span class="grid place-items-center w-6 h-6 flex-shrink-0 rounded-full text-white text-2xs font-bold"
                  [ngClass]="step>2 ? 'bg-success-600' : (step===2 ? 'bg-brand-600' : 'bg-ink-300')" aria-hidden="true">{{ step>2 ? '✓' : '2' }}</span>
                <span class="hidden sm:inline truncate">Historique de crédit</span>
                <span class="sm:hidden truncate">Historique</span>
              </button>
            </li>
            <li>
              <button type="button" (click)="step = 3"
                [attr.aria-current]="step === 3 ? 'step' : null"
                [ngClass]="step===3 ? 'border-brand-500 bg-brand-50 text-brand-800 ring-2 ring-brand-500/20'
                          : (step>3 ? 'border-success-200 bg-success-50/70 text-success-800 hover:border-success-300'
                                    : 'border-ink-200 bg-ink-50 text-ink-400 hover:border-ink-300')"
                class="w-full flex items-center justify-center sm:justify-start gap-2.5 rounded-xl border
                       px-2.5 py-2.5 sm:px-3.5 text-xs font-bold transition-all duration-200 ease-smooth">
                <span class="grid place-items-center w-6 h-6 flex-shrink-0 rounded-full text-white text-2xs font-bold"
                  [ngClass]="step>3 ? 'bg-success-600' : (step===3 ? 'bg-brand-600' : 'bg-ink-300')" aria-hidden="true">{{ step>3 ? '✓' : '3' }}</span>
                <span class="hidden sm:inline truncate">Instruction</span>
                <span class="sm:hidden truncate">Instruction</span>
              </button>
            </li>
            <li>
              <button type="button" [disabled]="!evaluationResult" (click)="evaluationResult && (step = 4)"
                [attr.aria-current]="step === 4 ? 'step' : null"
                [ngClass]="step===4 ? 'border-brand-500 bg-brand-50 text-brand-800 ring-2 ring-brand-500/20'
                          : (evaluationResult ? 'border-success-200 bg-success-50/70 text-success-800 hover:border-success-300'
                                              : 'border-ink-200 bg-ink-50 text-ink-400 opacity-60 cursor-not-allowed')"
                class="w-full flex items-center justify-center sm:justify-start gap-2.5 rounded-xl border
                       px-2.5 py-2.5 sm:px-3.5 text-xs font-bold transition-all duration-200 ease-smooth">
                <span class="grid place-items-center w-6 h-6 flex-shrink-0 rounded-full text-white text-2xs font-bold"
                  [ngClass]="step===4 ? 'bg-brand-600' : (evaluationResult ? 'bg-success-600' : 'bg-ink-300')" aria-hidden="true">4</span>
                <span class="hidden sm:inline truncate">Score &amp; décision</span>
                <span class="sm:hidden truncate">Score</span>
              </button>
            </li>
          </ol>
        </nav>

        <!-- ---------- ÉTAPE 1 : fiche ---------- -->
        <div *ngIf="step === 1" class="space-y-5">
          <div class="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-5 text-white shadow-lg flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-2xl bg-white/15 text-white font-bold text-xl flex items-center justify-center">
                {{ (selectedClient.prenom||'?')[0] }}{{ (selectedClient.nom||'?')[0] }}
              </div>
              <div>
                <h1 class="text-xl font-bold">{{ selectedClient.prenom }} {{ selectedClient.nom }}</h1>
                <p class="text-xs text-success-100 mt-0.5">
                  CNIB {{ selectedClient.numeroCnib }} · Compte {{ selectedClient.numeroCompte }} ·
                  Sociétaire depuis {{ dateAdhesion || '-' }} ({{ ancienneteCoopMois }} mois)
                </p>
              </div>
            </div>
            <button type="button" (click)="resetSelection()" class="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold">Changer</button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="bg-white rounded-2xl border border-ink-200 p-5 shadow-sm space-y-2">
              <h2 class="text-xs font-bold text-brand-600 uppercase tracking-wider pb-2 border-b border-ink-100">État civil</h2>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="p-2 bg-ink-50 rounded-lg"><span class="text-ink-400 block">Âge · genre</span><span class="font-bold">{{ selectedClient.age }} ans · {{ selectedClient.sexe }}</span></div>
                <div class="p-2 bg-ink-50 rounded-lg"><span class="text-ink-400 block">Situation</span><span class="font-bold">{{ selectedClient.situationMatrimoniale }}</span></div>
                <div class="p-2 bg-ink-50 rounded-lg"><span class="text-ink-400 block">Personnes à charge</span><span class="font-bold">{{ selectedClient.nombrePersonnesACharge }}</span></div>
                <div class="p-2 bg-ink-50 rounded-lg"><span class="text-ink-400 block">Éducation</span><span class="font-bold">{{ selectedClient.niveauEducation }}</span></div>
                <div class="p-2 bg-ink-50 rounded-lg"><span class="text-ink-400 block">Zone</span><span class="font-bold">{{ selectedClient.zone }}</span></div>
                <div class="p-2 bg-ink-50 rounded-lg"><span class="text-ink-400 block">Ville</span><span class="font-bold">{{ selectedClient.ville }}</span></div>
              </div>
            </div>
            <div class="bg-white rounded-2xl border border-ink-200 p-5 shadow-sm space-y-2">
              <h2 class="text-xs font-bold text-brand-600 uppercase tracking-wider pb-2 border-b border-ink-100">Activité & compte</h2>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="p-2 bg-ink-50 rounded-lg col-span-2"><span class="text-ink-400 block">Activité</span><span class="font-bold">{{ selectedClient.activite }}</span></div>
                <div class="p-2 bg-ink-50 rounded-lg"><span class="text-ink-400 block">Secteur</span><span class="font-bold">{{ selectedClient.secteurActivite }}</span></div>
                <div class="p-2 bg-ink-50 rounded-lg"><span class="text-ink-400 block">Expérience</span><span class="font-bold">{{ selectedClient.ancienneteActiviteAnnees }} an(s)</span></div>
                <div class="p-2 bg-brand-50 rounded-lg"><span class="text-brand-600 block">Solde épargne</span><span class="font-bold">{{ selectedClient.soldeEpargneActuelFcfa | number }} F</span></div>
                <div class="p-2 bg-ink-50 rounded-lg"><span class="text-ink-400 block">Parts sociales</span><span class="font-bold">{{ selectedClient.partsSocialesFcfa | number }} F</span></div>
              </div>
            </div>
          </div>

          <div class="flex justify-between bg-white rounded-2xl border border-ink-200 p-4 shadow-sm">
            <button type="button" (click)="resetSelection()" class="px-4 py-2.5 rounded-xl border border-ink-300 text-ink-700 text-xs font-bold hover:bg-ink-50">← Changer de sociétaire</button>
            <button type="button" (click)="step = 2" class="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md transition-all">Suivant : historique interne →</button>
          </div>
        </div>

        <!-- ---------- ÉTAPE 2 : HISTORIQUE DE CRÉDIT (interne + BIC, lecture seule) ---------- -->
        <div *ngIf="step === 2" class="space-y-5">
          <div class="bg-white rounded-2xl border border-ink-200 p-6 shadow-sm space-y-5">
            <div>
              <span class="text-xs font-bold text-brand-600 uppercase tracking-wider">Historique de crédit interne</span>
              <h2 class="text-lg font-bold text-ink-900">{{ selectedClient.prenom }} {{ selectedClient.nom }}</h2>
              <p class="text-xs text-ink-400 mt-0.5">Données issues du système de la coopérative - non modifiables par l'agent.</p>
            </div>

            <!-- sous-navigation : chaque bloc de l'historique sur sa propre "page" -->
            <div class="flex flex-wrap gap-2 border-b border-ink-100 pb-3">
              <button *ngFor="let s of sousEtapesHist" type="button" (click)="sousEtapeHist = s.id"
                [ngClass]="sousEtapeHist === s.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-ink-500 border-ink-200 hover:bg-ink-50'"
                class="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5">
                <span>{{ s.label }}</span>
                <span *ngIf="sousHistCount(s.id) !== null"
                  [ngClass]="sousEtapeHist === s.id ? 'bg-white/25' : 'bg-ink-100 text-ink-500'"
                  class="px-1.5 py-0.5 rounded-full text-[10px] font-bold">{{ sousHistCount(s.id) }}</span>
              </button>
            </div>

            <!-- ===== SECTION : crédits internes ===== -->
            <div *ngIf="sousEtapeHist === 'INTERNE'" class="space-y-5">
            <div *ngIf="creditsInternes().length === 0" class="p-4 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-600">
              Aucun crédit interne antérieur - <strong>primo-emprunteur</strong>.
            </div>

            <ng-container *ngIf="creditsInternes().length > 0">
              <!-- synthèse -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Crédits passés</span><span class="font-bold text-sm">{{ creditsInternes().length }}</span></div>
                <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Total emprunté</span><span class="font-bold text-sm">{{ selectedClient.montantTotalEmprunteFcfa || histTotalEmprunte() | number:'1.0-0' }} F</span></div>
                <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Remboursement moyen</span><span class="font-bold text-sm">{{ selectedClient.tauxRemboursementHistoriquePct ?? histTauxRembMoyen() | number:'1.0-1' }} %</span></div>
                <div class="p-3 rounded-xl" [ngClass]="selectedClient.aDejaDefautInterne ? 'bg-danger-50 text-danger-700' : 'bg-success-50 text-success-700'">
                  <span class="block opacity-70">Défaut interne déjà constaté</span><span class="font-bold text-sm">{{ selectedClient.aDejaDefautInterne ? 'OUI' : 'Non' }}</span>
                </div>
              </div>

              <!-- une carte par crédit -->
              <div class="space-y-3">
                <div *ngFor="let c of creditsInternes()" class="rounded-xl border border-ink-200 overflow-hidden">
                  <div class="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-ink-50 border-b border-ink-200">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="font-mono text-[11px] text-ink-400">{{ c.reference }}</span>
                      <span class="font-semibold text-sm text-ink-800 truncate">{{ c.objet }}</span>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-bold border" [ngClass]="statutCreditClass(c.statut)">{{ c.statut }}</span>
                  </div>
                  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-4 text-xs">
                    <div><span class="text-ink-400 block">Catégorie</span><span class="font-medium">{{ c.categorie }}</span></div>
                    <div><span class="text-ink-400 block">Montant accordé</span><span class="font-medium">{{ c.montantAccordeFcfa | number:'1.0-0' }} F</span></div>
                    <div><span class="text-ink-400 block">Taux annuel</span><span class="font-medium">{{ c.tauxInteretAnnuelPct }} %</span></div>
                    <div><span class="text-ink-400 block">Durée</span><span class="font-medium">{{ c.dureeMois }} mois</span></div>
                    <div><span class="text-ink-400 block">Échéance mensuelle</span><span class="font-medium">{{ c.echeanceMensuelleFcfa | number:'1.0-0' }} F</span></div>
                    <div><span class="text-ink-400 block">Coût total du crédit</span><span class="font-medium">{{ c.coutTotalCreditFcfa | number:'1.0-0' }} F</span></div>
                    <div><span class="text-ink-400 block">Décaissement</span><span class="font-medium">{{ c.dateDecaissement }}</span></div>
                    <div><span class="text-ink-400 block">Échéance prévue</span><span class="font-medium">{{ c.dateEcheancePrevue }}</span></div>
                    <div><span class="text-ink-400 block">Date de solde</span><span class="font-medium">{{ c.dateSolde || '-' }}</span></div>
                    <div><span class="text-ink-400 block">Total remboursé</span><span class="font-medium">{{ c.montantTotalRembourseFcfa | number:'1.0-0' }} F</span></div>
                    <div><span class="text-ink-400 block">Capital restant dû</span><span class="font-medium">{{ c.capitalRestantDuFcfa | number:'1.0-0' }} F</span></div>
                    <div><span class="text-ink-400 block">% remboursé</span><span class="font-medium" [ngClass]="(c.tauxRembourseePct || 0) < 60 ? 'text-danger-600' : ((c.tauxRembourseePct || 0) < 90 ? 'text-warning-600' : 'text-success-600')">{{ c.tauxRembourseePct }} %</span></div>
                    <div><span class="text-ink-400 block">Échéances en retard</span><span class="font-medium">{{ c.nombreEcheancesEnRetard }}</span></div>
                    <div><span class="text-ink-400 block">Jours de retard cumulés</span><span class="font-medium">{{ c.joursRetardCumules }}</span></div>
                    <div><span class="text-ink-400 block">Retard max</span><span class="font-medium">{{ c.joursRetardMax }} j</span></div>
                    <div><span class="text-ink-400 block">Incidents de paiement</span><span class="font-medium">{{ c.nombreIncidentsPaiement }}</span></div>
                    <div><span class="text-ink-400 block">Rééchelonnements</span><span class="font-medium">{{ c.nombreReechelonnements }}</span></div>
                    <div><span class="text-ink-400 block">Délai d'utilisation</span><span class="font-medium">{{ c.delaiUtilisationApresDeblocageJours }} j</span></div>
                    <div><span class="text-ink-400 block">Garantie</span><span class="font-medium">{{ c.garantieType }}<span *ngIf="c.garantieAppelee" class="text-danger-600"> · appelée</span></span></div>
                    <div><span class="text-ink-400 block">Agence</span><span class="font-medium">{{ c.agence }}</span></div>
                  </div>
                </div>
              </div>
            </ng-container>
            </div>

            <!-- ===== SECTION : BIC engagements dans les autres institutions ===== -->
            <div *ngIf="sousEtapeHist === 'BIC'" class="space-y-3">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-xs font-bold text-brand-600 uppercase tracking-wider">BIC · centrale des risques UEMOA</span>
                <span class="px-2 py-0.5 rounded-full text-[11px] font-bold border" [ngClass]="bicStatutClass(selectedClient.statutBic)">{{ selectedClient.statutBic || 'Non consulté' }}</span>
                <span *ngIf="selectedClient.bicScore != null" class="text-[11px] text-ink-500">Score BIC : <strong>{{ selectedClient.bicScore }}/100</strong></span>
                <span *ngIf="selectedClient.bicInterdictionBancaire" class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-danger-100 text-danger-700">Interdiction bancaire</span>
              </div>

              <div *ngIf="bicEngagements().length === 0" class="p-4 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-600">
                Aucun engagement de crédit dans une autre institution.
              </div>

              <ng-container *ngIf="bicEngagements().length > 0">
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Engagements</span><span class="font-bold text-sm">{{ bicEngagements().length }}</span></div>
                  <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Encours total</span><span class="font-bold text-sm">{{ bicEncoursTotal() | number:'1.0-0' }} F</span></div>
                  <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Mensualités externes</span><span class="font-bold text-sm">{{ bicMensualitesTotal() | number:'1.0-0' }} F</span></div>
                  <div class="p-3 rounded-xl" [ngClass]="(selectedClient.bicNombreContentieux || 0) > 0 ? 'bg-danger-50 text-danger-700' : 'bg-success-50 text-success-700'">
                    <span class="block opacity-70">Contentieux</span><span class="font-bold text-sm">{{ selectedClient.bicNombreContentieux || 0 }}</span>
                  </div>
                </div>

                <div class="space-y-3">
                  <div *ngFor="let e of bicEngagements()" class="rounded-xl border border-ink-200 overflow-hidden">
                    <div class="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-ink-50 border-b border-ink-200">
                      <span class="font-semibold text-sm text-ink-800">{{ e.etablissement }} <span class="text-xs font-normal text-ink-400">· {{ e.typeCredit }}</span></span>
                      <span class="px-2 py-0.5 rounded-full text-[11px] font-bold border" [ngClass]="bicStatutClass(e.statut)">{{ e.statut }}</span>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-4 text-xs">
                      <div><span class="text-ink-400 block">Octroi</span><span class="font-medium">{{ e.dateOctroi }}</span></div>
                      <div><span class="text-ink-400 block">Montant initial</span><span class="font-medium">{{ e.montantInitialFcfa | number:'1.0-0' }} F</span></div>
                      <div><span class="text-ink-400 block">Encours restant</span><span class="font-medium">{{ e.encoursRestantFcfa | number:'1.0-0' }} F</span></div>
                      <div><span class="text-ink-400 block">Mensualité</span><span class="font-medium">{{ e.mensualiteFcfa | number:'1.0-0' }} F</span></div>
                      <div><span class="text-ink-400 block">Durée · taux</span><span class="font-medium">{{ e.dureeMois }} mois · {{ e.tauxInteretAnnuelPct }} %</span></div>
                      <div><span class="text-ink-400 block">Impayés</span><span class="font-medium">{{ e.nombreImpayes }}</span></div>
                      <div><span class="text-ink-400 block">Montant en retard</span><span class="font-medium">{{ e.montantEnRetardFcfa | number:'1.0-0' }} F</span></div>
                      <div><span class="text-ink-400 block">Retard max</span><span class="font-medium">{{ e.joursRetardMax }} j</span></div>
                      <div><span class="text-ink-400 block">Garantie</span><span class="font-medium">{{ e.garantie }}</span></div>
                    </div>
                  </div>
                </div>
              </ng-container>
            </div>

            <!-- ===== SECTION : Factures ONEA / SONABEL ===== -->
            <div *ngIf="sousEtapeHist === 'FACTURES'" class="space-y-3">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-xs font-bold text-brand-600 uppercase tracking-wider">Factures ONEA (eau) &amp; SONABEL (électricité)</span>
                <span *ngIf="selectedClient.facturesTauxPaiementPct != null" class="px-2 py-0.5 rounded-full text-[11px] font-bold border"
                  [ngClass]="(selectedClient.facturesTauxPaiementPct || 0) >= 90 ? 'bg-success-50 text-success-700 border-success-200' : ((selectedClient.facturesTauxPaiementPct || 0) >= 70 ? 'bg-warning-50 text-warning-700 border-warning-200' : 'bg-danger-50 text-danger-700 border-danger-200')">
                  {{ selectedClient.facturesTauxPaiementPct | number:'1.0-0' }} % payées
                </span>
                <span class="text-[11px] text-ink-500">{{ selectedClient.facturesNombreImpayees || 0 }} impayée(s) · retard moyen {{ selectedClient.facturesRetardMoyenJours | number:'1.0-0' }} j</span>
              </div>
              <div *ngIf="factures().length === 0" class="p-4 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-600">Aucune facture ONEA / SONABEL enregistrée.</div>
              <div *ngIf="factures().length > 0" class="overflow-x-auto">
                <table class="w-full min-w-[520px] text-xs">
                  <thead class="text-ink-400 text-left">
                    <tr><th class="py-1.5 pr-3">Fournisseur</th><th class="py-1.5 pr-3">Période</th><th class="py-1.5 pr-3">Montant</th><th class="py-1.5 pr-3">Échéance</th><th class="py-1.5 pr-3">Statut</th><th class="py-1.5">Payé le / retard</th></tr>
                  </thead>
                  <tbody class="divide-y divide-ink-100">
                    <tr *ngFor="let f of facturesRecentes()">
                      <td class="py-1.5 pr-3 font-semibold">{{ f.fournisseur }}</td>
                      <td class="py-1.5 pr-3 text-ink-500">{{ f.periode }}</td>
                      <td class="py-1.5 pr-3">{{ f.montantFcfa | number:'1.0-0' }} F</td>
                      <td class="py-1.5 pr-3 text-ink-500">{{ f.dateEcheance }}</td>
                      <td class="py-1.5 pr-3">
                        <span class="px-2 py-0.5 rounded-full text-[11px] font-bold border" [ngClass]="f.statut === 'Payée' ? 'bg-success-50 text-success-700 border-success-200' : 'bg-danger-50 text-danger-700 border-danger-200'">{{ f.statut }}</span>
                      </td>
                      <td class="py-1.5 text-ink-500">
                        <span *ngIf="f.statut === 'Payée'">{{ f.datePaiement }}<span *ngIf="(f.joursRetard || 0) > 0" class="text-warning-600"> (+{{ f.joursRetard }} j)</span></span>
                        <span *ngIf="f.statut !== 'Payée'" class="text-danger-600">impayé · {{ f.montantImpayeFcfa | number:'1.0-0' }} F · {{ f.joursRetard }} j</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- ===== SECTION : Moralité / civisme (informatif) ===== -->
            <div *ngIf="sousEtapeHist === 'MORALITE'" class="space-y-2">
              <span class="text-xs font-bold text-brand-600 uppercase tracking-wider">Moralité &amp; civisme <span class="font-normal text-ink-400">(à titre indicatif)</span></span>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div class="p-3 rounded-xl border" [ngClass]="casierClass(selectedClient.casierJudiciaire)">
                  <span class="block opacity-70">Casier judiciaire</span><span class="font-bold">{{ selectedClient.casierJudiciaire || 'Vierge' }}</span>
                </div>
                <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Infractions routières (24 m)</span><span class="font-bold text-sm">{{ selectedClient.nombreInfractionsRoutieres24m ?? 0 }}</span></div>
                <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Litiges civils</span><span class="font-bold text-sm">{{ selectedClient.nombreLitigesCivils ?? 0 }}</span></div>
                <div class="p-3 rounded-xl" [ngClass]="selectedClient.presenceListeSanctions ? 'bg-danger-50 text-danger-700' : 'bg-success-50 text-success-700'">
                  <span class="block opacity-70">Listes de sanctions</span><span class="font-bold text-sm">{{ selectedClient.presenceListeSanctions ? 'Signalé' : 'RAS' }}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-ink-100">
              <button type="button" (click)="sousHistPrev()" class="text-xs font-bold text-ink-500 hover:text-ink-800">
                ← {{ sousHistIndex() === 0 ? 'Retour à la fiche' : 'Section précédente' }}
              </button>
              <div class="flex items-center gap-3">
                <span class="text-[11px] text-ink-400">{{ sousHistIndex() + 1 }} / {{ sousEtapesHist.length }}</span>
                <button type="button" (click)="sousHistNext()" class="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md transition-all">
                  {{ sousHistIndex() === sousEtapesHist.length - 1 ? 'Instruire le dossier →' : 'Section suivante →' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ---------- ÉTAPE 3 : WIZARD D'INSTRUCTION ---------- -->
        <div *ngIf="step === 3" class="space-y-5">

          <!-- rappel + progression -->
          <div class="bg-white rounded-2xl border border-ink-200 p-4 shadow-sm space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold text-ink-800">{{ selectedClient.prenom }} {{ selectedClient.nom }} · CNIB {{ selectedClient.numeroCnib }}</p>
              <span class="text-xs font-bold text-brand-600">Volet {{ volet }} / {{ volets.length }}</span>
            </div>
            <div class="h-1.5 bg-ink-100 rounded-full overflow-hidden">
              <div class="h-full bg-brand-600 rounded-full transition-all duration-300" [style.width.%]="(volet / volets.length) * 100"></div>
            </div>
            <div class="flex gap-1.5 flex-wrap">
              <button type="button" *ngFor="let v of volets" (click)="volet = v.n"
                [ngClass]="volet === v.n ? 'bg-brand-600 text-white' : (volet > v.n ? 'bg-success-50 text-success-700 border border-success-200' : 'bg-ink-50 text-ink-400 border border-ink-200')"
                class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all">{{ v.n }}. {{ v.titre }}</button>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-ink-200 p-6 shadow-sm">
            <h2 class="text-sm font-bold text-ink-900 flex items-center gap-2 mb-1">
              <span class="w-6 h-6 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-bold">{{ volet }}</span>
              {{ volets[volet-1].titre }}
            </h2>
            <p class="text-xs text-ink-400 mb-5">{{ volets[volet-1].sous }}</p>

            <!-- VOLET 1 : profil & activité -->
            <div *ngIf="volet === 1" class="space-y-4">
              <div class="p-3 bg-ink-50 rounded-xl text-xs text-ink-600">
                Profil socio-démographique issu de la fiche KYC (non modifiable ici) :
                <strong>{{ selectedClient.age }} ans, {{ selectedClient.sexe }}, {{ selectedClient.situationMatrimoniale }},
                {{ selectedClient.niveauEducation }}, {{ selectedClient.nombrePersonnesACharge }} pers. à charge,
                zone {{ selectedClient.zone }}, secteur {{ selectedClient.secteurActivite }},
                {{ selectedClient.ancienneteActiviteAnnees }} an(s) d'activité.</strong>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div *ngIf="selectedClient.secteurActivite === 'Salarié secteur formel'">
                  <label class="lbl">Sous-secteur (emploi formel)</label>
                  <select class="inp" [(ngModel)]="demande.sousSecteurActivite" [ngModelOptions]="{standalone:true}">
                    <option *ngFor="let s of sousSecteurs" [value]="s">{{ s }}</option>
                  </select>
                </div>
                <label class="flex items-center gap-2 text-sm text-ink-700 self-end pb-2">
                  <input type="checkbox" [(ngModel)]="demande.saisonaliteActivite" [ngModelOptions]="{standalone:true}" class="w-4 h-4 accent-brand-600" />
                  Activité à revenus <strong>saisonniers</strong>
                </label>
              </div>
            </div>

            <!-- VOLET 2 : revenus & épargne -->
            <div *ngIf="volet === 2" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="lbl">Revenu mensuel déclaré (FCFA) *</label>
                <input type="number" step="5000" min="1" class="inp"
                  [ngClass]="{'border-danger-400 bg-danger-50': (demande.revenuMensuelFcfa != null && demande.revenuMensuelFcfa <= 0)}"
                  [(ngModel)]="demande.revenuMensuelFcfa" [ngModelOptions]="{standalone:true}" />
                <p *ngIf="demande.revenuMensuelFcfa != null && demande.revenuMensuelFcfa <= 0" class="text-[11px] text-danger-600 mt-1">
                  Le revenu doit être supérieur à 0.
                </p>
              </div>
              <div>
                <label class="lbl">Charges mensuelles (FCFA) *</label>
                <input type="number" step="5000" min="0" class="inp"
                  [ngClass]="{'border-danger-400 bg-danger-50': (demande.chargesMensuellesFcfa != null && demande.chargesMensuellesFcfa < 0)}"
                  [(ngModel)]="demande.chargesMensuellesFcfa" [ngModelOptions]="{standalone:true}" />
                <p *ngIf="demande.chargesMensuellesFcfa != null && demande.chargesMensuellesFcfa < 0" class="text-[11px] text-danger-600 mt-1">
                  Les charges ne peuvent pas être négatives.
                </p>
              </div>
              <div class="md:col-span-2 p-3 bg-success-50 rounded-xl text-sm font-bold text-brand-600">
                Reste à vivre courant : {{ ((demande.revenuMensuelFcfa || 0) - (demande.chargesMensuellesFcfa || 0)) | number }} FCFA
              </div>
              <div>
                <label class="lbl">Ancienneté à la coopérative (mois)</label>
                <input type="text" class="inp bg-ink-100 text-ink-600 cursor-not-allowed" [value]="ancienneteCoopMois + ' mois'" readonly tabindex="-1" />
                <p class="text-[11px] text-ink-400 mt-1">Calculé automatiquement à partir de la date d'adhésion ({{ dateAdhesion || '-' }}).</p>
              </div>
              <div>
                <label class="lbl">Solde d'épargne moyen (FCFA)</label>
                <input type="number" step="5000" min="0" class="inp" [(ngModel)]="demande.epargneSoldeMoyenFcfa" [ngModelOptions]="{standalone:true}" />
              </div>
              <div>
                <label class="lbl">Régularité de l'épargne *</label>
                <select class="inp" [(ngModel)]="demande.regulariteEpargne" [ngModelOptions]="{standalone:true}">
                  <option value="" disabled>- choisir -</option>
                  <option *ngFor="let r of regularites" [value]="r">{{ r }}</option>
                </select>
              </div>
              <label class="flex items-center gap-2 text-sm text-ink-700 self-end pb-2">
                <input type="checkbox" [(ngModel)]="demande.membreGroupeSolidaire" [ngModelOptions]="{standalone:true}" class="w-4 h-4 accent-brand-600" />
                Membre d'un <strong>groupe solidaire</strong>
              </label>
            </div>

            <!-- VOLET 3 : Mobile Money -->
            <div *ngIf="volet === 3" class="space-y-4">
              <label class="flex items-center gap-2 text-sm text-ink-700">
                <input type="checkbox" [(ngModel)]="demande.possedeMobileMoney" [ngModelOptions]="{standalone:true}" class="w-4 h-4 accent-brand-600" />
                Le sociétaire <strong>possède un compte Mobile Money</strong>
              </label>
              <div *ngIf="demande.possedeMobileMoney" class="grid grid-cols-2 md:grid-cols-3 gap-3 animate-fade-in">
                <div><label class="lbl">Transactions / mois</label><input type="number" min="0" class="inp" [(ngModel)]="demande.frequenceTransactionsMmMois" [ngModelOptions]="{standalone:true}" /></div>
                <div><label class="lbl">Solde moyen (FCFA)</label><input type="number" step="1000" min="0" class="inp" [(ngModel)]="demande.mmSoldeMoyenFcfa" [ngModelOptions]="{standalone:true}" /></div>
                <div><label class="lbl">Flux entrants / mois (FCFA)</label><input type="number" step="1000" min="0" class="inp" [(ngModel)]="demande.mmFluxEntrantsMensuelFcfa" [ngModelOptions]="{standalone:true}" /></div>
              </div>
              <p class="text-[11px] text-ink-400">Les autres indicateurs Mobile Money (ancienneté, volatilité, flux détaillés) sont récupérés automatiquement du profil du sociétaire.</p>
            </div>

            <!-- VOLET 4 : comptes bancaires (le BIC est en étape 2, lecture seule) -->
            <div *ngIf="volet === 4" class="space-y-5">
              <p class="text-xs text-ink-400">
                Le résultat BIC (centrale des risques UEMOA) est pré-chargé et consultable à l'étape « Historique de crédit ». Ici : comptes bancaires classiques du sociétaire.
              </p>

              <div class="pt-4 border-t border-ink-100">
                <label class="lbl">Nombre de comptes bancaires classiques</label>
                <input type="number" min="0" class="inp max-w-[200px]" [(ngModel)]="demande.nombreComptesBancaires" [ngModelOptions]="{standalone:true}" />
                <div *ngIf="(demande.nombreComptesBancaires || 0) > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 animate-fade-in">
                  <div>
                    <label class="lbl">Type de compte principal</label>
                    <select class="inp" [(ngModel)]="demande.typeComptePrincipal" [ngModelOptions]="{standalone:true}">
                      <option *ngFor="let t of typesCompteBancaire" [value]="t">{{ t }}</option>
                    </select>
                  </div>
                  <div><label class="lbl">Solde compte (FCFA)</label><input type="number" step="10000" min="0" class="inp" [(ngModel)]="demande.soldeCompteBancaireFcfa" [ngModelOptions]="{standalone:true}" /></div>
                  <div><label class="lbl">Flux dépôts / mois (FCFA)</label><input type="number" step="10000" min="0" class="inp" [(ngModel)]="demande.fluxDepotsBancairesMensuelFcfa" [ngModelOptions]="{standalone:true}" /></div>
                  <div><label class="lbl">Flux retraits / mois (FCFA)</label><input type="number" step="10000" min="0" class="inp" [(ngModel)]="demande.fluxRetraitsBancairesMensuelFcfa" [ngModelOptions]="{standalone:true}" /></div>
                  <div><label class="lbl">Rejets prélèvements / chèques (12 mois)</label><input type="number" min="0" class="inp" [(ngModel)]="demande.nombreRejetsPrelevementsCheques12m" [ngModelOptions]="{standalone:true}" /></div>
                </div>
              </div>
            </div>

            <!-- VOLET 5 : demande & garantie -->
            <div *ngIf="volet === 5" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="lbl">Catégorie de crédit *</label>
                <select class="inp" [(ngModel)]="demande.categorieCredit" [ngModelOptions]="{standalone:true}" (ngModelChange)="onCategorieChange()">
                  <option value="" disabled>- choisir ({{ categoriesCredit.length }} catégories) -</option>
                  <option *ngFor="let c of categoriesCredit" [value]="c.label">{{ c.label }}</option>
                </select>
              </div>
              <div>
                <label class="lbl">Objet précis du crédit *</label>
                <select class="inp" [(ngModel)]="demande.objetCredit" [ngModelOptions]="{standalone:true}">
                  <option value="" disabled>- choisir ({{ objetsFiltres.length }}) -</option>
                  <option *ngFor="let o of objetsFiltres" [value]="o.label">{{ o.label }}</option>
                </select>
              </div>
              <div>
                <label class="lbl">Montant sollicité (FCFA) *</label>
                <input type="number" step="10000" min="1" class="inp text-lg font-bold"
                  [ngClass]="{'border-danger-400 bg-danger-50': (demande.montantDemandeFcfa != null && demande.montantDemandeFcfa <= 0)}"
                  [(ngModel)]="demande.montantDemandeFcfa" [ngModelOptions]="{standalone:true}" />
                <p *ngIf="demande.montantDemandeFcfa != null && demande.montantDemandeFcfa <= 0" class="text-[11px] text-danger-600 mt-1">
                  Le montant doit être supérieur à 0.
                </p>
              </div>
              <div>
                <label class="lbl">Durée (mois) *</label>
                <select class="inp" [(ngModel)]="demande.dureeMois" [ngModelOptions]="{standalone:true}">
                  <option [ngValue]="undefined" disabled>- choisir -</option>
                  <option *ngFor="let d of durees" [ngValue]="d">{{ d }} mois</option>
                </select>
              </div>
              <div>
                <label class="lbl">Taux d'intérêt nominal annuel (%)</label>
                <input type="number" step="0.1" min="0" max="60" class="inp" [(ngModel)]="demande.tauxInteretNominalAnnuelPct" [ngModelOptions]="{standalone:true}" />
              </div>
              <div class="md:col-span-2">
                <label class="lbl">Garantie proposée *</label>
                <select class="inp" [(ngModel)]="demande.garantie" [ngModelOptions]="{standalone:true}">
                  <option value="" disabled>- choisir ({{ garanties.length }}) -</option>
                  <option *ngFor="let g of garanties" [value]="g.label">{{ g.label }}</option>
                </select>
              </div>
              <div class="md:col-span-2 p-4 bg-ink-50 rounded-xl border border-ink-200 grid grid-cols-2 gap-3 text-xs">
                <div><span class="text-ink-400 block">Échéance mensuelle estimée</span><span class="font-bold text-ink-900 text-sm">{{ echeanceEstimee() | number:'1.0-0' }} FCFA</span></div>
                <div><span class="text-ink-400 block">Taux d'endettement estimé</span><span class="font-bold text-sm" [ngClass]="ratioEndettementEstime() > 0.75 ? 'text-danger-600' : (ratioEndettementEstime() > 0.5 ? 'text-warning-600' : 'text-success-600')">{{ ratioEndettementEstime() * 100 | number:'1.0-0' }} %</span></div>
              </div>
            </div>

            <!-- Contrôles de cohérence -->
            <div *ngIf="volet === volets.length && (erreursSaisie().length > 0 || erreurServeur)"
              class="mt-4 p-3 rounded-xl bg-danger-50 border border-danger-300 text-danger-800 text-xs space-y-1">
              <p class="font-bold flex items-center gap-1.5">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Impossible de lancer le scoring
              </p>
              <ul class="list-disc list-inside space-y-0.5">
                <li *ngFor="let msg of erreursSaisie()">{{ msg }}</li>
                <li *ngIf="erreurServeur">{{ erreurServeur }}</li>
              </ul>
            </div>

            <!-- navigation volets -->
            <div class="flex items-center justify-between pt-5 mt-5 border-t border-ink-100">
              <button type="button" (click)="prevVolet()" [disabled]="volet === 1"
                class="px-5 py-2.5 text-xs font-bold text-ink-600 bg-ink-100 hover:bg-ink-200 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed">← Précédent</button>

              <button *ngIf="volet < volets.length" type="button" (click)="nextVolet()"
                class="px-6 py-2.5 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-all">
                Suivant : {{ volets[volet].titre }} →
              </button>

              <button *ngIf="volet === volets.length" type="button" (click)="submitEvaluation()"
                [disabled]="isEvaluating || !dossierComplet()"
                class="px-7 py-3 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                <svg *ngIf="isEvaluating" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                {{ isEvaluating ? 'Calcul du score…' : 'Lancer le scoring' }}
              </button>
            </div>
          </div>
        </div>

        <!-- ---------- ÉTAPE 3 : RÉSULTAT + SHAP ---------- -->
        <div *ngIf="step === 4 && evaluationResult" class="space-y-5">
          <div class="bg-white rounded-2xl border-2 border-brand-600 p-6 shadow-xl space-y-6">

            <p *ngIf="evaluationResult.source === 'ESTIMATION_LOCALE'" class="text-[11px] text-ink-400 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-ink-300"></span>
              Évaluation calculée en mode hors-ligne.
            </p>

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-ink-100">
              <div>
                <span class="text-xs font-bold text-brand-600 uppercase tracking-wider">Décision du moteur de scoring</span>
                <h2 class="text-xl font-bold text-ink-900">{{ selectedClient.prenom }} {{ selectedClient.nom }}</h2>
              </div>
              <span [ngClass]="badgeClass(evaluationResult.statut)" class="px-4 py-2 rounded-full text-xs font-bold border self-start">{{ statusLabel(evaluationResult.statut) }}</span>
            </div>

            <div *ngIf="evaluationResult.noteDecision" class="flex items-start gap-2 p-3 rounded-xl bg-danger-50 border border-danger-300 text-danger-800 text-xs">
              <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span><strong>Règle métier appliquée.</strong> {{ evaluationResult.noteDecision }}</span>
            </div>

            <div class="grid grid-cols-2 gap-3 text-center" [ngClass]="estScoreVert(evaluationResult.scoreCredit) ? 'sm:grid-cols-4' : 'sm:grid-cols-3'">
              <div class="p-4 bg-ink-50 rounded-xl border border-ink-200">
                <p class="text-[11px] text-ink-500">Score de risque</p>
                <p class="text-3xl font-extrabold mt-1" [ngClass]="scoreColor(evaluationResult.scoreCredit)">{{ evaluationResult.scoreCredit ?? '-' }}<span class="text-xs text-ink-400 font-normal"> / 100</span></p>
              </div>
              <div *ngIf="estScoreVert(evaluationResult.scoreCredit)" class="p-4 bg-success-50 rounded-xl border border-success-200">
                <p class="text-[11px] text-success-700">Chances de remboursement</p>
                <p class="text-3xl font-extrabold text-success-700 mt-1">{{ 100 - (evaluationResult.scoreCredit || 0) }}<span class="text-xs text-success-500 font-normal"> %</span></p>
              </div>
              <div class="p-4 bg-ink-50 rounded-xl border border-ink-200">
                <p class="text-[11px] text-ink-500">Échéance / mois</p>
                <p class="text-lg font-extrabold text-ink-900 mt-2">{{ evaluationResult.futureEcheanceCreditFcfa || 0 | number:'1.0-0' }} F</p>
              </div>
              <div class="p-4 bg-ink-50 rounded-xl border border-ink-200">
                <p class="text-[11px] text-ink-500">Perte attendue</p>
                <p class="text-lg font-extrabold text-ink-900 mt-2">{{ evaluationResult.perteAttendueFcfa || 0 | number:'1.0-0' }} F</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 text-xs">
              <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Taux d'endettement retenu</span><span class="font-bold text-sm">{{ (evaluationResult.ratioEndettement || 0) * 100 | number:'1.0-0' }} %</span></div>
              <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Reste à vivre après échéance</span><span class="font-bold text-sm">{{ evaluationResult.ratioResteAVivreFcfa || 0 | number:'1.0-0' }} FCFA</span></div>
            </div>

            <!-- SHAP réel -->
            <div class="p-4 bg-ink-50 rounded-xl border border-ink-200">
              <p class="font-bold text-ink-800 text-sm mb-3">Facteurs déterminants pour ce dossier <span class="text-[11px] font-normal text-ink-500">(ce qui a pesé dans la décision)</span></p>
              <div *ngIf="facteursShap().length > 0" class="space-y-2">
                <div *ngFor="let f of facteursShap()" class="flex items-center gap-3">
                  <span class="w-52 text-xs font-semibold text-ink-700 truncate" [title]="humaniser(f.variable)">{{ humaniser(f.variable) }}</span>
                  <div class="flex-1 h-3.5 bg-ink-200 rounded-full overflow-hidden relative">
                    <div class="h-full rounded-full" [ngClass]="f.contribution > 0 ? 'bg-danger-500' : 'bg-success-500'" [style.width.%]="barWidth(f.contribution)"></div>
                  </div>
                  <span class="text-[11px] font-bold w-24 text-right" [ngClass]="f.contribution > 0 ? 'text-danger-600' : 'text-success-600'">
                    {{ f.contribution > 0 ? '↑ risque' : '↓ risque' }}
                  </span>
                </div>
              </div>
              <p *ngIf="facteursShap().length === 0" class="text-xs text-ink-400">Explication non disponible pour ce dossier.</p>
            </div>

            <!-- Bouton vers la page d'explication détaillée -->
            <a *ngIf="evaluationResult.id" [routerLink]="['/credits', evaluationResult.id, 'explication']"
              class="flex items-center justify-between gap-2 p-3 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 text-xs font-bold hover:bg-brand-100 transition-colors">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Pourquoi ce résultat ? Voir l'explication détaillée
              </span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </a>

            <!-- Appréciation de l'agent (informatif) -->
            <div class="p-4 bg-ink-50 rounded-xl border border-ink-200 space-y-3">
              <p class="font-bold text-ink-800 text-sm">Appréciation de l'agent <span class="text-[11px] font-normal text-ink-500">(avis manuel, n'influence pas le score)</span></p>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button *ngFor="let a of avisOptions" type="button" (click)="avisAgent = a.code; avisSaved = false"
                  [ngClass]="avisAgent === a.code ? a.actif : 'bg-white text-ink-600 border-ink-300 hover:bg-ink-50'"
                  class="px-2 py-2 rounded-lg border text-[11px] font-bold transition-all">{{ a.label }}</button>
              </div>
              <div>
                <p class="text-[11px] font-bold text-ink-500 uppercase mb-1.5">Motifs (facultatif)</p>
                <div class="flex flex-wrap gap-1.5">
                  <button *ngFor="let m of avisMotifsPossibles" type="button" (click)="toggleMotif(m)"
                    [ngClass]="avisMotifs.has(m) ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-ink-600 border-ink-300'"
                    class="px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all">{{ m }}</button>
                </div>
              </div>
              <textarea [(ngModel)]="avisCommentaire" [ngModelOptions]="{standalone:true}" rows="2"
                placeholder="Commentaire / motivation de l'avis…"
                class="input"></textarea>
              <div class="flex items-center gap-3">
                <button type="button" (click)="enregistrerAvis()" [disabled]="!avisAgent || avisEnCours"
                  class="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors">
                  {{ avisEnCours ? 'Enregistrement…' : 'Enregistrer mon avis' }}
                </button>
                <span *ngIf="avisSaved" class="text-xs font-semibold text-success-600">✓ Avis enregistré</span>
              </div>
            </div>

            <div class="pt-4 border-t border-ink-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button type="button" (click)="step = 3" class="text-xs font-bold text-ink-500 hover:text-ink-800">← Revoir le dossier</button>
              <a routerLink="/credits" class="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow transition-all">Voir dans la liste des crédits →</a>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* Champs du formulaire d'instruction, alignés sur le design system
       (cf. src/styles.css : .label / .input). Redéfinis ici car les styles
       d'un composant Angular sont encapsulés. */
    .lbl {
      display: block;
      font-size: .75rem;
      font-weight: 600;
      color: #3d4c57;
      margin-bottom: .375rem;
    }
    .inp {
      display: block;
      width: 100%;
      padding: .625rem .875rem;
      border: 1px solid #dbe1e6;
      border-radius: .75rem;
      font-size: .8125rem;
      font-family: inherit;
      color: #1a232a;
      background: #fff;
      box-shadow: 0 1px 2px 0 rgb(26 35 42 / .05);
      outline: none;
      transition: border-color .2s cubic-bezier(.32,.72,0,1),
                  box-shadow .2s cubic-bezier(.32,.72,0,1);
    }
    .inp::placeholder { color: #8fa0ab; }
    .inp:hover { border-color: #bfcad2; }
    .inp:focus {
      border-color: #2b9488;
      box-shadow: 0 0 0 4px rgb(43 148 136 / .2);
    }
    .inp:disabled, .inp[readonly] {
      background: #f6f8f9;
      color: #4c5e6b;
      cursor: default;
    }
    /* Chiffres alignés pour les montants */
    .inp[type='number'] { font-variant-numeric: tabular-nums; }
  `]
})
export class CreditFormComponent implements OnInit {
  private apiService = inject(ApiService);
  private settingsService = inject(SettingsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  step = 1;
  volet = 1;
  volets: Volet[] = [
    { n: 1, titre: 'Profil & activité', sous: 'Données KYC du sociétaire, sous-secteur et saisonnalité.' },
    { n: 2, titre: 'Revenus & épargne', sous: 'Revenus déclarés pour ce dossier, relation coopérative, épargne.' },
    { n: 3, titre: 'Mobile Money', sous: 'Usage transactionnel Mobile Money (proxy de revenu et de discipline).' },
    { n: 4, titre: 'Comptes bancaires', sous: 'Comptes bancaires classiques du sociétaire (le BIC est en étape Historique).' },
    { n: 5, titre: 'Demande & garantie', sous: 'Objet, montant, durée, taux et garantie du prêt sollicité.' },
  ];

  // Étape 2 "Historique de crédit" découpée en sections (une à la fois, plus de
  // scroll interminable). Ordre = parcours proposé à l'agent.
  sousEtapeHist: 'INTERNE' | 'BIC' | 'FACTURES' | 'MORALITE' = 'INTERNE';
  sousEtapesHist: { id: 'INTERNE' | 'BIC' | 'FACTURES' | 'MORALITE'; label: string }[] = [
    { id: 'INTERNE', label: 'Crédits internes' },
    { id: 'BIC', label: 'BIC (autres institutions)' },
    { id: 'FACTURES', label: 'Factures ONEA / SONABEL' },
    { id: 'MORALITE', label: 'Moralité & civisme' },
  ];
  sousHistIndex(): number { return this.sousEtapesHist.findIndex(s => s.id === this.sousEtapeHist); }
  sousHistCount(id: 'INTERNE' | 'BIC' | 'FACTURES' | 'MORALITE'): number | null {
    if (id === 'INTERNE') return this.creditsInternes().length;
    if (id === 'BIC') return this.bicEngagements().length;
    if (id === 'FACTURES') return this.factures().length;
    return null;
  }
  sousHistPrev(): void {
    const i = this.sousHistIndex();
    if (i > 0) this.sousEtapeHist = this.sousEtapesHist[i - 1].id;
    else this.step = 1;
  }
  sousHistNext(): void {
    const i = this.sousHistIndex();
    if (i < this.sousEtapesHist.length - 1) this.sousEtapeHist = this.sousEtapesHist[i + 1].id;
    else this.step = 3;
  }

  clients: Client[] = [];
  searchQuery = '';
  selectedClient: Client | null = null;
  isEvaluating = false;
  evaluationResult: DemandeCredit | null = null;
  erreurServeur = '';

  // Appréciation de l'agent (informatif)
  avisAgent = '';
  avisCommentaire = '';
  avisMotifs = new Set<string>();
  avisEnCours = false;
  avisSaved = false;
  avisOptions = [
    { code: 'FAVORABLE', label: 'Favorable', actif: 'bg-success-50 text-success-700 border-success-300' },
    { code: 'FAVORABLE_SOUS_RESERVE', label: 'Favorable sous réserve', actif: 'bg-teal-50 text-teal-700 border-teal-300' },
    { code: 'RESERVE', label: 'Réservé', actif: 'bg-warning-50 text-warning-700 border-warning-300' },
    { code: 'DEFAVORABLE', label: 'Défavorable', actif: 'bg-danger-50 text-danger-700 border-danger-300' },
  ];
  avisMotifsPossibles = [
    'Capacité de remboursement', 'Moralité / comportement', 'Garantie insuffisante',
    'Objet du crédit douteux', 'Saisonnalité de l\'activité', 'Historique interne',
    'Endettement externe (BIC)',
  ];

  categoriesCredit: CategorieCreditItem[] = [];
  objetsCredit: ObjetCreditItem[] = [];
  garanties: GarantieItem[] = [];

  // vocabulaire "verrouillé modèle"
  secteurs = SECTEURS_ACTIVITE;
  sousSecteurs = [SOUS_SECTEUR_NON_APPLICABLE, ...SOUS_SECTEURS_FORMELS];
  regularites = REGULARITES_EPARGNE;
  statutsBic = STATUTS_BIC.filter(s => s !== 'Non consulté');
  typesCompteBancaire = [TYPE_COMPTE_BANCAIRE_AUCUN, ...TYPES_COMPTE_BANCAIRE];
  durees = DUREES_STANDARD;
  bicPretEnCours = BIC_PRET_EN_COURS;
  bicIncident = BIC_INCIDENT;

  demande: Partial<DemandeCredit> = {};

  ngOnInit() {
    this.settingsService.categoriesCredit$.subscribe(l => this.categoriesCredit = (l || []).filter(c => c.actif !== false));
    this.settingsService.objets$.subscribe(l => this.objetsCredit = (l || []).filter(o => o.actif !== false));
    this.settingsService.garanties$.subscribe(l => this.garanties = (l || []).filter(g => g.actif !== false));
    // Rechargement à l'ouverture du dossier : si le backend n'était pas prêt au
    // démarrage de l'app, les listes seraient restées vides.
    this.settingsService.refreshCategoriesCredit().subscribe();
    this.settingsService.refreshObjets().subscribe();
    this.settingsService.refreshGaranties().subscribe();

    this.apiService.getClients().subscribe({
      next: (list) => { this.clients = list || []; this.checkRouteParams(); },
      error: (err) => console.error('Chargement clients :', err),
    });
  }

  private checkRouteParams() {
    const idParam = this.route.snapshot.paramMap.get('id') || this.route.snapshot.queryParamMap.get('id');
    const cnib = this.route.snapshot.queryParamMap.get('cnib');
    let c: Client | undefined;
    if (idParam) {
      c = this.clients.find(x => x.id === parseInt(idParam, 10));
    } else if (cnib) {
      c = this.clients.find(x => (x.numeroCnib || '').toLowerCase() === cnib.toLowerCase());
    }
    if (c) this.selectClient(c);

    // "Refaire cette évaluation" : on repart d'un dossier déjà scoré, pré-rempli.
    if (this.route.snapshot.queryParamMap.get('refaire')) {
      const source = this.apiService.consumeDossierARefaire();
      if (source) this.prefillFromDossier(source);
    }
  }

  /** Recopie les CHAMPS SAISIS d'une évaluation passée dans le formulaire, en
   *  laissant de côté les résultats du moteur (score, proba, SHAP, statut…). */
  private prefillFromDossier(d: DemandeCredit) {
    const exclure = new Set([
      'id', 'client', 'scoreRisque', 'probaDefaut', 'zoneDecision', 'scoreCredit',
      'perteAttendueFcfa', 'ratioEndettement', 'ratioResteAVivreFcfa',
      'futureEcheanceCreditFcfa', 'explicationJson', 'statut', 'dateCreation', 'source',
      'ancienneteCooperativeMois', // toujours recalculée depuis la date d'adhésion
    ]);
    const saisie: Record<string, any> = { ...this.demande };
    for (const [k, v] of Object.entries(d)) {
      if (!exclure.has(k) && v !== null && v !== undefined) {
        saisie[k] = v;
      }
    }
    this.demande = saisie as Partial<DemandeCredit>;
    this.step = 1;
    this.volet = 1;
  }

  get searchedClients(): Client[] {
    const q = (this.searchQuery || '').toLowerCase().replace(/\s+/g, '').trim();
    if (!q) return this.clients.slice(0, 8);
    return this.clients.filter(c => {
      const hay = [c.numeroCnib, c.numeroCompte, c.nom, c.prenom, (c.prenom || '') + (c.nom || ''), c.telephone]
        .map(v => (v || '').toLowerCase().replace(/\s+/g, ''));
      return hay.some(v => v.includes(q));
    }).slice(0, 15);
  }

  resetSelection() {
    this.selectedClient = null;
    this.evaluationResult = null;
    this.demande = {};
    this.step = 1;
    this.volet = 1;
  }

  /** Nombre de mois entiers écoulés entre une date (ISO) et aujourd'hui. */
  private moisDepuis(dateStr?: string): number {
    if (!dateStr) return 0;
    const debut = new Date(dateStr);
    if (isNaN(debut.getTime())) return 0;
    const now = new Date();
    let mois = (now.getFullYear() - debut.getFullYear()) * 12 + (now.getMonth() - debut.getMonth());
    if (now.getDate() < debut.getDate()) mois--;   // le mois en cours n'est pas encore complet
    return Math.max(0, mois);
  }

  /** Date d'adhésion à la coopérative (repli sur dateCreation pour les jeux de données anciens). */
  get dateAdhesion(): string | undefined {
    return this.selectedClient?.dateAdhesionCooperative || this.selectedClient?.dateCreation;
  }

  /** Ancienneté à la coopérative, recalculée depuis la date d'adhésion.
   *  Repli sur ancienneteCooperativeMois si aucune date exploitable (base non régénérée). */
  get ancienneteCoopMois(): number {
    const d = this.selectedClient?.dateAdhesionCooperative;
    if (d) return this.moisDepuis(d);
    return this.selectedClient?.ancienneteCooperativeMois ?? 0;
  }

  // --- Historique interne (lecture seule, étape 2) ---
  creditsInternes(): CreditInterneAnterieur[] {
    return this.selectedClient?.creditsInternesAnterieurs || [];
  }
  bicEngagements(): BicEngagementExterne[] {
    return this.selectedClient?.bicEngagementsExternes || [];
  }
  bicEncoursTotal(): number {
    return this.bicEngagements()
      .filter(e => e.statut !== 'Soldé')
      .reduce((s, e) => s + (e.encoursRestantFcfa || 0), 0);
  }
  bicMensualitesTotal(): number {
    return this.bicEngagements()
      .filter(e => e.statut !== 'Soldé')
      .reduce((s, e) => s + (e.mensualiteFcfa || 0), 0);
  }
  bicStatutClass(statut?: string): string {
    switch (statut) {
      case 'Sain': return 'bg-brand-50 text-brand-600 border-brand-200';
      case 'Soldé': return 'bg-success-50 text-success-700 border-success-200';
      case 'Impayé': return 'bg-warning-50 text-warning-700 border-warning-200';
      case 'Souffrance':
      case 'Contentieux': return 'bg-danger-50 text-danger-700 border-danger-200';
      default: return 'bg-ink-100 text-ink-600 border-ink-200';
    }
  }
  factures(): FactureServicePublic[] {
    return this.selectedClient?.facturesServicesPublics || [];
  }
  facturesRecentes(): FactureServicePublic[] {
    return [...this.factures()].reverse().slice(0, 12);
  }
  casierClass(c?: string): string {
    if (c === 'Condamnation') return 'bg-danger-50 text-danger-700 border-danger-200';
    if (c === 'Mentions mineures') return 'bg-warning-50 text-warning-700 border-warning-200';
    return 'bg-success-50 text-success-700 border-success-200';
  }
  histTotalEmprunte(): number {
    return this.creditsInternes().reduce((s, c) => s + (c.montantAccordeFcfa || 0), 0);
  }
  histTauxRembMoyen(): number {
    const L = this.creditsInternes();
    return L.length ? L.reduce((s, c) => s + (c.tauxRembourseePct || 0), 0) / L.length : 0;
  }
  statutCreditClass(statut?: string): string {
    switch (statut) {
      case 'Soldé':
      case 'Soldé par anticipation': return 'bg-success-50 text-success-700 border-success-200';
      case 'En cours': return 'bg-brand-50 text-brand-600 border-brand-200';
      case 'Rééchelonné': return 'bg-warning-50 text-warning-700 border-warning-200';
      case 'En défaut': return 'bg-danger-50 text-danger-700 border-danger-200';
      default: return 'bg-ink-100 text-ink-600 border-ink-200';
    }
  }

  // --- Appréciation de l'agent ---
  toggleMotif(m: string) {
    this.avisMotifs.has(m) ? this.avisMotifs.delete(m) : this.avisMotifs.add(m);
    this.avisSaved = false;
  }
  enregistrerAvis() {
    const id = this.evaluationResult?.id;
    if (!id || !this.avisAgent) return;
    this.avisEnCours = true;
    this.apiService.enregistrerAvisAgent(id, this.avisAgent, this.avisCommentaire, [...this.avisMotifs].join(', '))
      .subscribe({
        next: (res) => { this.avisEnCours = false; this.avisSaved = true; if (this.evaluationResult) this.evaluationResult = res; },
        error: () => { this.avisEnCours = false; },
      });
  }

  selectClient(c: Client) {
    this.selectedClient = c;
    this.evaluationResult = null;
    this.step = 1;
    this.volet = 1;
    this.sousEtapeHist = 'INTERNE';
    // Champs de saisie VIDES : l'agent renseigne consciemment. Les données déjà
    // connues de la banque sont réinjectées en coulisse dans submitEvaluation().
    this.demande = {
      sousSecteurActivite: c.secteurActivite === 'Salarié secteur formel'
        ? (c.sousSecteurActivite || SOUS_SECTEUR_NON_APPLICABLE) : SOUS_SECTEUR_NON_APPLICABLE,
      saisonaliteActivite: false,
      membreGroupeSolidaire: false,
      regulariteEpargne: '',
      possedeMobileMoney: false,
      interrogeBic: false,
      statutBic: 'Non consulté',
      nombreComptesBancaires: 0,
      typeComptePrincipal: TYPE_COMPTE_BANCAIRE_AUCUN,
      categorieCredit: '',
      objetCredit: '',
      garantie: '',
    };
  }

  /** Fond de dossier = ce que la banque connaît déjà sur le sociétaire.
   *  La saisie de l'agent (this.demande) le complète et prime dessus. */
  private fondDossier(c: Client): Partial<DemandeCredit> {
    return {
      ancienneteCooperativeMois: c.dateAdhesionCooperative
        ? this.moisDepuis(c.dateAdhesionCooperative)
        : (c.ancienneteCooperativeMois ?? 0),
      epargneSoldeMoyenFcfa: c.soldeEpargneActuelFcfa ?? 0,
      nombreCreditsAnterieurs: c.nombreCreditsAnterieurs ?? 0,
      tauxRemboursementHistoriquePct: c.tauxRemboursementHistoriquePct ?? null,
      joursRetardMoyenHistorique: c.joursRetardMoyenHistorique ?? null,
      montantTotalEmprunteFcfa: c.montantTotalEmprunteFcfa ?? 0,
      delaiUtilisationCreditJours: c.delaiUtilisationCreditJours ?? null,
      totalTransactions: c.totalTransactions ?? 0,
      volumeDepotsFcfa: c.volumeDepotsFcfa ?? 0,
      volumeRetraitsFcfa: c.volumeRetraitsFcfa ?? 0,
      txMobileMoney: c.txMobileMoney ?? 0,
      frequenceTransactionsMmMois: c.frequenceTransactionsMmMois ?? 0,
      mmAncienneteCompteMois: c.mmAncienneteCompteMois ?? null,
      mmSoldeMoyenFcfa: c.mmSoldeMoyenFcfa ?? 0,
      mmFluxEntrantsMensuelFcfa: c.mmFluxEntrantsMensuelFcfa ?? 0,
      nombreComptesBancaires: c.nombreComptesBancaires ?? 0,
      typeComptePrincipal: c.typeComptePrincipal || TYPE_COMPTE_BANCAIRE_AUCUN,
      soldeCompteBancaireFcfa: c.soldeCompteBancaireFcfa ?? 0,
      nombreRejetsPrelevementsCheques12m: c.nombreRejetsPrelevementsCheques12m ?? 0,
      nombrePretsActifsAutresInstitutions: 0,
      encoursCreditAutresInstitutionsFcfa: 0,
      tauxInteretNominalAnnuelPct: this.demande.tauxInteretNominalAnnuelPct ?? 14,
    };
  }

  get objetsFiltres(): ObjetCreditItem[] {
    if (!this.demande.categorieCredit) return this.objetsCredit;
    const f = this.objetsCredit.filter(o => o.categorie === this.demande.categorieCredit);
    return f.length ? f : this.objetsCredit;
  }

  onCategorieChange() {
    this.demande.objetCredit = '';
    const cat = this.categoriesCredit.find(c => c.label === this.demande.categorieCredit);
    if (cat?.tauxInteretMin) this.demande.tauxInteretNominalAnnuelPct = cat.tauxInteretMin;
  }

  echeanceEstimee(): number {
    const m = this.demande.montantDemandeFcfa || 0;
    const n = this.demande.dureeMois || 12;
    const i = ((this.demande.tauxInteretNominalAnnuelPct || 14) / 100) / 12;
    if (m <= 0) return 0;
    return i <= 0 ? m / n : m * i / (1 - Math.pow(1 + i, -n));
  }

  ratioEndettementEstime(): number {
    const rev = this.demande.revenuMensuelFcfa || 0;
    if (rev <= 0) return 0;
    // Mensualités externes : total BIC pré-chargé si dispo, sinon 9% de l'encours saisi.
    const mensExt = this.selectedClient?.bicMensualitesTotalesFcfa
      || (this.demande.encoursCreditAutresInstitutionsFcfa || 0) * 0.09;
    return Math.round(((this.demande.chargesMensuellesFcfa || 0) + this.echeanceEstimee() + mensExt) / rev * 100) / 100;
  }

  nextVolet() { if (this.volet < this.volets.length) this.volet++; }
  prevVolet() { if (this.volet > 1) this.volet--; }

  dossierComplet(): boolean {
    return !!(this.demande.revenuMensuelFcfa && this.demande.chargesMensuellesFcfa != null
      && this.demande.regulariteEpargne && this.demande.categorieCredit && this.demande.objetCredit
      && this.demande.montantDemandeFcfa && this.demande.dureeMois && this.demande.garantie)
      && this.erreursSaisie().length === 0;
  }

  /** Contrôles de cohérence sur les valeurs saisies (mêmes bornes que le
   *  backend Spring + le moteur Python). Renvoie la liste des messages d'erreur. */
  erreursSaisie(): string[] {
    const d = this.demande;
    const e: string[] = [];
    const num = (v: unknown): number | null =>
      v === null || v === undefined || v === '' || isNaN(Number(v)) ? null : Number(v);

    const revenu = num(d.revenuMensuelFcfa);
    const charges = num(d.chargesMensuellesFcfa);
    const montant = num(d.montantDemandeFcfa);
    const taux = num(d.tauxInteretNominalAnnuelPct);
    const tauxRemb = num(d.tauxRemboursementHistoriquePct);

    if (montant !== null && montant <= 0) e.push('Le montant sollicité doit être supérieur à 0 FCFA.');
    if (montant !== null && montant > 100_000_000) e.push('Le montant sollicité dépasse le plafond autorisé (100 000 000 FCFA).');
    if (revenu !== null && revenu <= 0) e.push('Le revenu mensuel déclaré doit être supérieur à 0 FCFA.');
    if (charges !== null && charges < 0) e.push('Les charges mensuelles ne peuvent pas être négatives.');
    if (taux !== null && (taux <= 0 || taux > 60)) e.push("Le taux d'intérêt annuel doit être compris entre 0 et 60 %.");
    if (tauxRemb !== null && (tauxRemb < 0 || tauxRemb > 100)) e.push("Le taux de remboursement historique doit être compris entre 0 et 100 %.");

    // Balayage générique : aucun montant / compteur / délai ne peut être négatif.
    const negatif = Object.entries(d).some(([k, v]) => {
      if (!/Fcfa$|^nombre|^total|^frequence|^tx|^volume|Jours$|Pct$|Mois$/.test(k)) return false;
      const n = num(v);
      return n !== null && n < 0;
    });
    if (negatif && !e.some(m => m.includes('négativ'))) {
      e.push('Une ou plusieurs valeurs saisies sont négatives : corrigez-les avant de lancer le scoring.');
    }
    return e;
  }

  submitEvaluation() {
    if (!this.selectedClient?.id || !this.dossierComplet()) return;
    if (this.erreursSaisie().length > 0) return;
    // saisie de l'agent, débarrassée des valeurs vides
    const saisie: Record<string, any> = {};
    for (const [k, v] of Object.entries(this.demande)) {
      if (v !== undefined && v !== null && v !== '') saisie[k] = v;
    }
    const payload = { ...this.fondDossier(this.selectedClient), ...saisie } as DemandeCredit;
    this.isEvaluating = true;
    this.erreurServeur = '';
    this.apiService.evaluerCredit(this.selectedClient.id, payload).subscribe({
      next: (res) => { this.isEvaluating = false; this.evaluationResult = res; this.step = 4; },
      error: (err) => {
        this.isEvaluating = false;
        console.error('Évaluation :', err);
        const champs = err?.error?.champs;
        this.erreurServeur = champs
          ? Object.values(champs).join(' ')
          : (err?.error?.detail || err?.error?.message || "Le serveur a refusé le dossier. Vérifiez les montants saisis.");
      },
    });
  }

  // --- SHAP ---
  facteursShap(): FacteurExplicatif[] {
    const raw = this.evaluationResult?.explicationJson;
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.slice(0, 6) : [];
    } catch { return []; }
  }

  barWidth(contribution: number): number {
    const fs = this.facteursShap();
    const max = Math.max(...fs.map(f => Math.abs(f.contribution)), 0.0001);
    return Math.max(6, Math.round(Math.abs(contribution) / max * 100));
  }

  private static LIBELLES: Record<string, string> = {
    ratio_endettement: "Taux d'endettement",
    ratio_reste_a_vivre_absolu_fcfa: 'Reste à vivre',
    ratio_couverture_echeance_epargne: 'Couverture échéance / épargne',
    future_echeance_credit_fcfa: 'Échéance mensuelle',
    epargne_solde_moyen_fcfa: "Solde d'épargne",
    regularite_epargne: "Régularité d'épargne",
    membre_groupe_solidaire: 'Groupe solidaire',
    anciennete_cooperative_mois: 'Ancienneté coopérative',
    nombre_credits_anterieurs: 'Crédits antérieurs',
    taux_remboursement_historique_pct: 'Historique de remboursement',
    jours_retard_moyen_historique: 'Retards passés',
    possede_mobile_money: 'Possède Mobile Money',
    frequence_transactions_mm_mois: 'Fréquence Mobile Money',
    mm_volatilite_flux_pct: 'Volatilité des flux',
    nombre_rejets_prelevements_cheques_12m: 'Rejets de prélèvement',
    statut_bic: 'Statut BIC',
    nombre_prets_actifs_autres_institutions: 'Prêts en cours ailleurs',
    encours_credit_autres_institutions_fcfa: 'Encours externe',
    secteur_activite: "Secteur d'activité",
    garantie: 'Garantie',
    categorie_credit: 'Catégorie de crédit',
    montant_credit_demande_fcfa: 'Montant demandé',
    duree_credit_mois: 'Durée',
    nombre_personnes_a_charge: 'Personnes à charge',
    indice_vulnerabilite_zone: 'Vulnérabilité de la zone',
    saisonnalite_activite: 'Saisonnalité',
  };

  humaniser(variable: string): string {
    for (const [k, v] of Object.entries(CreditFormComponent.LIBELLES)) {
      if (variable === k || variable.startsWith(k + '_')) {
        const suffix = variable.slice(k.length + 1);
        return suffix ? `${v} : ${suffix.replace(/_/g, ' ')}` : v;
      }
    }
    return variable.replace(/_/g, ' ');
  }

  // --- affichage statut ---
  // Score de RISQUE 0-100 (0 = bon, 100 = mauvais). Couleurs alignées sur les
  // zones du modèle déployé (cf. models/scoring-zones.ts).
  scoreColor(s?: number) {
    const c = couleurScore(s);
    return c === 'gris' ? 'text-ink-700' : c === 'vert' ? 'text-success-600' : c === 'orange' ? 'text-warning-600' : 'text-danger-600';
  }
  /** Dossier peu risqué (zone verte) : on peut afficher la proba de bon remboursement. */
  estScoreVert(s?: number) { return couleurScore(s) === 'vert'; }
  badgeClass(s?: string) {
    return s === 'APPROUVE' ? 'bg-success-50 text-success-700 border-success-200'
      : s === 'A_L_ETUDE' ? 'bg-warning-50 text-warning-700 border-warning-200'
      : s === 'REJETE' ? 'bg-danger-50 text-danger-700 border-danger-200'
      : 'bg-ink-100 text-ink-700 border-ink-200';
  }
  statusLabel(s?: string) {
    return s === 'APPROUVE' ? 'Accord favorable' : s === 'A_L_ETUDE' ? 'À examiner'
      : s === 'REJETE' ? 'Risque élevé' : s === 'ERREUR_IA' ? 'Erreur moteur IA' : 'Non évalué';
  }
}
