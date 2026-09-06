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
    <div class="space-y-6 max-w-5xl mx-auto pb-16">

      <!-- Retour vers la liste des dossiers -->
      <div class="flex justify-end">
        <a routerLink="/credits" class="text-xs font-bold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">← Retour aux crédits</a>
      </div>

      <!-- ============ CAS 1 : recherche sociétaire ============ -->
      <div *ngIf="!selectedClient" class="space-y-5">
        <div class="bg-gradient-to-r from-[#147c76] to-[#0e625e] rounded-2xl p-6 text-white shadow-lg">
          <h1 class="text-xl font-bold">Instruction d'un microcrédit - sélection du sociétaire</h1>
          <p class="text-xs text-emerald-100 mt-1">Recherchez par numéro CNIB, nom ou numéro de compte pour démarrer.</p>
        </div>
        <div class="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
          <input type="text" [(ngModel)]="searchQuery" [ngModelOptions]="{standalone:true}"
            placeholder="N° CNIB, nom, prénom ou numéro de compte…"
            class="w-full px-4 py-3 border-2 border-[#147c76]/30 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#147c76] bg-emerald-50/20" />
          <div class="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
            <button type="button" *ngFor="let c of searchedClients" (click)="selectClient(c)"
              class="w-full text-left p-4 hover:bg-[#e5f3f1] flex items-center justify-between gap-3 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-[#147c76] text-white text-sm font-bold flex items-center justify-center">
                  {{ (c.prenom || '?')[0] }}{{ (c.nom || '?')[0] }}
                </div>
                <div>
                  <p class="text-sm font-bold text-gray-900">{{ c.prenom }} {{ c.nom }}</p>
                  <p class="text-xs text-gray-500">CNIB {{ c.numeroCnib }} · {{ c.numeroCompte }} · {{ c.secteurActivite }} · {{ c.ville }}</p>
                </div>
              </div>
              <span class="text-[#147c76] text-xs font-bold">Sélectionner →</span>
            </button>
            <div *ngIf="searchedClients.length === 0" class="p-8 text-center text-xs text-gray-400">
              Aucun sociétaire trouvé.
            </div>
          </div>
        </div>
      </div>

      <!-- ============ CAS 2 : dossier sélectionné ============ -->
      <div *ngIf="selectedClient" class="space-y-6">

        <!-- Bandeau étapes -->
        <div class="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <button type="button" (click)="step = 1"
            [ngClass]="step===1 ? 'bg-[#e5f3f1] border-[#147c76] text-[#147c76]' : (step>1 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200')"
            class="p-2.5 sm:p-3 rounded-xl border flex items-center justify-center sm:justify-start gap-2 font-bold transition-all">
            <span class="w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-white text-[11px]"
              [ngClass]="step>1 ? 'bg-emerald-600' : (step===1 ? 'bg-[#147c76]' : 'bg-gray-300')">{{ step>1 ? '✓' : '1' }}</span>
            <span class="hidden sm:inline">Fiche sociétaire</span>
          </button>
          <button type="button" (click)="step = 2"
            [ngClass]="step===2 ? 'bg-[#e5f3f1] border-[#147c76] text-[#147c76]' : (step>2 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200')"
            class="p-2.5 sm:p-3 rounded-xl border flex items-center justify-center sm:justify-start gap-2 font-bold transition-all">
            <span class="w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-white text-[11px]"
              [ngClass]="step>2 ? 'bg-emerald-600' : (step===2 ? 'bg-[#147c76]' : 'bg-gray-300')">{{ step>2 ? '✓' : '2' }}</span>
            <span class="hidden sm:inline">Historique de crédit</span>
          </button>
          <button type="button" (click)="step = 3"
            [ngClass]="step===3 ? 'bg-[#e5f3f1] border-[#147c76] text-[#147c76]' : (step>3 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200')"
            class="p-2.5 sm:p-3 rounded-xl border flex items-center justify-center sm:justify-start gap-2 font-bold transition-all">
            <span class="w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-white text-[11px]"
              [ngClass]="step>3 ? 'bg-emerald-600' : (step===3 ? 'bg-[#147c76]' : 'bg-gray-300')">{{ step>3 ? '✓' : '3' }}</span>
            <span class="hidden sm:inline">Instruction du dossier</span>
          </button>
          <button type="button" [disabled]="!evaluationResult" (click)="evaluationResult && (step = 4)"
            [ngClass]="step===4 ? 'bg-[#e5f3f1] border-[#147c76] text-[#147c76]' : (evaluationResult ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200 opacity-60 cursor-not-allowed')"
            class="p-2.5 sm:p-3 rounded-xl border flex items-center justify-center sm:justify-start gap-2 font-bold transition-all">
            <span class="w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-white text-[11px] bg-gray-300"
              [ngClass]="step===4 ? 'bg-[#147c76]' : (evaluationResult ? 'bg-emerald-600' : '')">4</span>
            <span class="hidden sm:inline">Score &amp; décision</span>
          </button>
        </div>

        <!-- ---------- ÉTAPE 1 : fiche ---------- -->
        <div *ngIf="step === 1" class="space-y-5">
          <div class="bg-gradient-to-r from-[#147c76] to-[#0e625e] rounded-2xl p-5 text-white shadow-lg flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-2xl bg-white/15 text-white font-bold text-xl flex items-center justify-center">
                {{ (selectedClient.prenom||'?')[0] }}{{ (selectedClient.nom||'?')[0] }}
              </div>
              <div>
                <h1 class="text-xl font-bold">{{ selectedClient.prenom }} {{ selectedClient.nom }}</h1>
                <p class="text-xs text-emerald-100 mt-0.5">
                  CNIB {{ selectedClient.numeroCnib }} · Compte {{ selectedClient.numeroCompte }} ·
                  Sociétaire depuis {{ dateAdhesion || '-' }} ({{ ancienneteCoopMois }} mois)
                </p>
              </div>
            </div>
            <button type="button" (click)="resetSelection()" class="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold">Changer</button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-2">
              <h2 class="text-xs font-bold text-[#147c76] uppercase tracking-wider pb-2 border-b border-gray-100">État civil</h2>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="p-2 bg-gray-50 rounded-lg"><span class="text-gray-400 block">Âge · genre</span><span class="font-bold">{{ selectedClient.age }} ans · {{ selectedClient.sexe }}</span></div>
                <div class="p-2 bg-gray-50 rounded-lg"><span class="text-gray-400 block">Situation</span><span class="font-bold">{{ selectedClient.situationMatrimoniale }}</span></div>
                <div class="p-2 bg-gray-50 rounded-lg"><span class="text-gray-400 block">Personnes à charge</span><span class="font-bold">{{ selectedClient.nombrePersonnesACharge }}</span></div>
                <div class="p-2 bg-gray-50 rounded-lg"><span class="text-gray-400 block">Éducation</span><span class="font-bold">{{ selectedClient.niveauEducation }}</span></div>
                <div class="p-2 bg-gray-50 rounded-lg"><span class="text-gray-400 block">Zone</span><span class="font-bold">{{ selectedClient.zone }}</span></div>
                <div class="p-2 bg-gray-50 rounded-lg"><span class="text-gray-400 block">Ville</span><span class="font-bold">{{ selectedClient.ville }}</span></div>
              </div>
            </div>
            <div class="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-2">
              <h2 class="text-xs font-bold text-[#147c76] uppercase tracking-wider pb-2 border-b border-gray-100">Activité & compte</h2>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="p-2 bg-gray-50 rounded-lg col-span-2"><span class="text-gray-400 block">Activité</span><span class="font-bold">{{ selectedClient.activite }}</span></div>
                <div class="p-2 bg-gray-50 rounded-lg"><span class="text-gray-400 block">Secteur</span><span class="font-bold">{{ selectedClient.secteurActivite }}</span></div>
                <div class="p-2 bg-gray-50 rounded-lg"><span class="text-gray-400 block">Expérience</span><span class="font-bold">{{ selectedClient.ancienneteActiviteAnnees }} an(s)</span></div>
                <div class="p-2 bg-[#e5f3f1] rounded-lg"><span class="text-[#147c76] block">Solde épargne</span><span class="font-bold">{{ selectedClient.soldeEpargneActuelFcfa | number }} F</span></div>
                <div class="p-2 bg-gray-50 rounded-lg"><span class="text-gray-400 block">Parts sociales</span><span class="font-bold">{{ selectedClient.partsSocialesFcfa | number }} F</span></div>
              </div>
            </div>
          </div>

          <div class="flex justify-between bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <button type="button" (click)="resetSelection()" class="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50">← Changer de sociétaire</button>
            <button type="button" (click)="step = 2" class="px-6 py-3 rounded-xl bg-[#147c76] hover:bg-[#0e625e] text-white text-sm font-bold shadow-md transition-all">Suivant : historique interne →</button>
          </div>
        </div>

        <!-- ---------- ÉTAPE 2 : HISTORIQUE DE CRÉDIT (interne + BIC, lecture seule) ---------- -->
        <div *ngIf="step === 2" class="space-y-5">
          <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
            <div>
              <span class="text-xs font-bold text-[#147c76] uppercase tracking-wider">Historique de crédit interne CIF</span>
              <h2 class="text-lg font-bold text-gray-900">{{ selectedClient.prenom }} {{ selectedClient.nom }}</h2>
              <p class="text-xs text-gray-400 mt-0.5">Données issues du système de la coopérative - non modifiables par l'agent.</p>
            </div>

            <div *ngIf="creditsInternes().length === 0" class="p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-600">
              Aucun crédit interne CIF antérieur - <strong>primo-emprunteur</strong>.
            </div>

            <ng-container *ngIf="creditsInternes().length > 0">
              <!-- synthèse -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Crédits passés</span><span class="font-bold text-sm">{{ creditsInternes().length }}</span></div>
                <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Total emprunté</span><span class="font-bold text-sm">{{ selectedClient.montantTotalEmprunteFcfa || histTotalEmprunte() | number:'1.0-0' }} F</span></div>
                <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Remboursement moyen</span><span class="font-bold text-sm">{{ selectedClient.tauxRemboursementHistoriquePct ?? histTauxRembMoyen() | number:'1.0-1' }} %</span></div>
                <div class="p-3 rounded-xl" [ngClass]="selectedClient.aDejaDefautInterne ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'">
                  <span class="block opacity-70">Défaut interne déjà constaté</span><span class="font-bold text-sm">{{ selectedClient.aDejaDefautInterne ? 'OUI' : 'Non' }}</span>
                </div>
              </div>

              <!-- une carte par crédit -->
              <div class="space-y-3">
                <div *ngFor="let c of creditsInternes()" class="rounded-xl border border-gray-200 overflow-hidden">
                  <div class="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="font-mono text-[11px] text-gray-400">{{ c.reference }}</span>
                      <span class="font-semibold text-sm text-gray-800 truncate">{{ c.objet }}</span>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-bold border" [ngClass]="statutCreditClass(c.statut)">{{ c.statut }}</span>
                  </div>
                  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-4 text-xs">
                    <div><span class="text-gray-400 block">Catégorie</span><span class="font-medium">{{ c.categorie }}</span></div>
                    <div><span class="text-gray-400 block">Montant accordé</span><span class="font-medium">{{ c.montantAccordeFcfa | number:'1.0-0' }} F</span></div>
                    <div><span class="text-gray-400 block">Taux annuel</span><span class="font-medium">{{ c.tauxInteretAnnuelPct }} %</span></div>
                    <div><span class="text-gray-400 block">Durée</span><span class="font-medium">{{ c.dureeMois }} mois</span></div>
                    <div><span class="text-gray-400 block">Échéance mensuelle</span><span class="font-medium">{{ c.echeanceMensuelleFcfa | number:'1.0-0' }} F</span></div>
                    <div><span class="text-gray-400 block">Coût total du crédit</span><span class="font-medium">{{ c.coutTotalCreditFcfa | number:'1.0-0' }} F</span></div>
                    <div><span class="text-gray-400 block">Décaissement</span><span class="font-medium">{{ c.dateDecaissement }}</span></div>
                    <div><span class="text-gray-400 block">Échéance prévue</span><span class="font-medium">{{ c.dateEcheancePrevue }}</span></div>
                    <div><span class="text-gray-400 block">Date de solde</span><span class="font-medium">{{ c.dateSolde || '-' }}</span></div>
                    <div><span class="text-gray-400 block">Total remboursé</span><span class="font-medium">{{ c.montantTotalRembourseFcfa | number:'1.0-0' }} F</span></div>
                    <div><span class="text-gray-400 block">Capital restant dû</span><span class="font-medium">{{ c.capitalRestantDuFcfa | number:'1.0-0' }} F</span></div>
                    <div><span class="text-gray-400 block">% remboursé</span><span class="font-medium" [ngClass]="(c.tauxRembourseePct || 0) < 60 ? 'text-red-600' : ((c.tauxRembourseePct || 0) < 90 ? 'text-amber-600' : 'text-emerald-600')">{{ c.tauxRembourseePct }} %</span></div>
                    <div><span class="text-gray-400 block">Échéances en retard</span><span class="font-medium">{{ c.nombreEcheancesEnRetard }}</span></div>
                    <div><span class="text-gray-400 block">Jours de retard cumulés</span><span class="font-medium">{{ c.joursRetardCumules }}</span></div>
                    <div><span class="text-gray-400 block">Retard max</span><span class="font-medium">{{ c.joursRetardMax }} j</span></div>
                    <div><span class="text-gray-400 block">Incidents de paiement</span><span class="font-medium">{{ c.nombreIncidentsPaiement }}</span></div>
                    <div><span class="text-gray-400 block">Rééchelonnements</span><span class="font-medium">{{ c.nombreReechelonnements }}</span></div>
                    <div><span class="text-gray-400 block">Délai d'utilisation</span><span class="font-medium">{{ c.delaiUtilisationApresDeblocageJours }} j</span></div>
                    <div><span class="text-gray-400 block">Garantie</span><span class="font-medium">{{ c.garantieType }}<span *ngIf="c.garantieAppelee" class="text-red-600"> · appelée</span></span></div>
                    <div><span class="text-gray-400 block">Agence</span><span class="font-medium">{{ c.agence }}</span></div>
                  </div>
                </div>
              </div>
            </ng-container>

            <!-- BIC : engagements dans les autres institutions -->
            <div class="pt-4 border-t border-gray-100 space-y-3">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-xs font-bold text-[#147c76] uppercase tracking-wider">BIC · centrale des risques UEMOA</span>
                <span class="px-2 py-0.5 rounded-full text-[11px] font-bold border" [ngClass]="bicStatutClass(selectedClient.statutBic)">{{ selectedClient.statutBic || 'Non consulté' }}</span>
                <span *ngIf="selectedClient.bicScore != null" class="text-[11px] text-gray-500">Score BIC : <strong>{{ selectedClient.bicScore }}/100</strong></span>
                <span *ngIf="selectedClient.bicInterdictionBancaire" class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">Interdiction bancaire</span>
              </div>

              <div *ngIf="bicEngagements().length === 0" class="p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-600">
                Aucun engagement de crédit dans une autre institution.
              </div>

              <ng-container *ngIf="bicEngagements().length > 0">
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Engagements</span><span class="font-bold text-sm">{{ bicEngagements().length }}</span></div>
                  <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Encours total</span><span class="font-bold text-sm">{{ bicEncoursTotal() | number:'1.0-0' }} F</span></div>
                  <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Mensualités externes</span><span class="font-bold text-sm">{{ bicMensualitesTotal() | number:'1.0-0' }} F</span></div>
                  <div class="p-3 rounded-xl" [ngClass]="(selectedClient.bicNombreContentieux || 0) > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'">
                    <span class="block opacity-70">Contentieux</span><span class="font-bold text-sm">{{ selectedClient.bicNombreContentieux || 0 }}</span>
                  </div>
                </div>

                <div class="space-y-3">
                  <div *ngFor="let e of bicEngagements()" class="rounded-xl border border-gray-200 overflow-hidden">
                    <div class="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                      <span class="font-semibold text-sm text-gray-800">{{ e.etablissement }} <span class="text-xs font-normal text-gray-400">· {{ e.typeCredit }}</span></span>
                      <span class="px-2 py-0.5 rounded-full text-[11px] font-bold border" [ngClass]="bicStatutClass(e.statut)">{{ e.statut }}</span>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-4 text-xs">
                      <div><span class="text-gray-400 block">Octroi</span><span class="font-medium">{{ e.dateOctroi }}</span></div>
                      <div><span class="text-gray-400 block">Montant initial</span><span class="font-medium">{{ e.montantInitialFcfa | number:'1.0-0' }} F</span></div>
                      <div><span class="text-gray-400 block">Encours restant</span><span class="font-medium">{{ e.encoursRestantFcfa | number:'1.0-0' }} F</span></div>
                      <div><span class="text-gray-400 block">Mensualité</span><span class="font-medium">{{ e.mensualiteFcfa | number:'1.0-0' }} F</span></div>
                      <div><span class="text-gray-400 block">Durée · taux</span><span class="font-medium">{{ e.dureeMois }} mois · {{ e.tauxInteretAnnuelPct }} %</span></div>
                      <div><span class="text-gray-400 block">Impayés</span><span class="font-medium">{{ e.nombreImpayes }}</span></div>
                      <div><span class="text-gray-400 block">Montant en retard</span><span class="font-medium">{{ e.montantEnRetardFcfa | number:'1.0-0' }} F</span></div>
                      <div><span class="text-gray-400 block">Retard max</span><span class="font-medium">{{ e.joursRetardMax }} j</span></div>
                      <div><span class="text-gray-400 block">Garantie</span><span class="font-medium">{{ e.garantie }}</span></div>
                    </div>
                  </div>
                </div>
              </ng-container>
            </div>

            <!-- Factures ONEA / SONABEL -->
            <div class="pt-4 border-t border-gray-100 space-y-3">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-xs font-bold text-[#147c76] uppercase tracking-wider">Factures ONEA (eau) &amp; SONABEL (électricité)</span>
                <span *ngIf="selectedClient.facturesTauxPaiementPct != null" class="px-2 py-0.5 rounded-full text-[11px] font-bold border"
                  [ngClass]="(selectedClient.facturesTauxPaiementPct || 0) >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ((selectedClient.facturesTauxPaiementPct || 0) >= 70 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200')">
                  {{ selectedClient.facturesTauxPaiementPct | number:'1.0-0' }} % payées
                </span>
                <span class="text-[11px] text-gray-500">{{ selectedClient.facturesNombreImpayees || 0 }} impayée(s) · retard moyen {{ selectedClient.facturesRetardMoyenJours | number:'1.0-0' }} j</span>
              </div>
              <div *ngIf="factures().length === 0" class="p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-600">Aucune facture ONEA / SONABEL enregistrée.</div>
              <div *ngIf="factures().length > 0" class="overflow-x-auto">
                <table class="w-full min-w-[520px] text-xs">
                  <thead class="text-gray-400 text-left">
                    <tr><th class="py-1.5 pr-3">Fournisseur</th><th class="py-1.5 pr-3">Période</th><th class="py-1.5 pr-3">Montant</th><th class="py-1.5 pr-3">Échéance</th><th class="py-1.5 pr-3">Statut</th><th class="py-1.5">Payé le / retard</th></tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr *ngFor="let f of facturesRecentes()">
                      <td class="py-1.5 pr-3 font-semibold">{{ f.fournisseur }}</td>
                      <td class="py-1.5 pr-3 text-gray-500">{{ f.periode }}</td>
                      <td class="py-1.5 pr-3">{{ f.montantFcfa | number:'1.0-0' }} F</td>
                      <td class="py-1.5 pr-3 text-gray-500">{{ f.dateEcheance }}</td>
                      <td class="py-1.5 pr-3">
                        <span class="px-2 py-0.5 rounded-full text-[11px] font-bold border" [ngClass]="f.statut === 'Payée' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'">{{ f.statut }}</span>
                      </td>
                      <td class="py-1.5 text-gray-500">
                        <span *ngIf="f.statut === 'Payée'">{{ f.datePaiement }}<span *ngIf="(f.joursRetard || 0) > 0" class="text-amber-600"> (+{{ f.joursRetard }} j)</span></span>
                        <span *ngIf="f.statut !== 'Payée'" class="text-red-600">impayé · {{ f.montantImpayeFcfa | number:'1.0-0' }} F · {{ f.joursRetard }} j</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Moralité / civisme (informatif) -->
            <div class="pt-4 border-t border-gray-100 space-y-2">
              <span class="text-xs font-bold text-[#147c76] uppercase tracking-wider">Moralité &amp; civisme <span class="font-normal text-gray-400">(informatif, hors modèle de score)</span></span>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div class="p-3 rounded-xl border" [ngClass]="casierClass(selectedClient.casierJudiciaire)">
                  <span class="block opacity-70">Casier judiciaire</span><span class="font-bold">{{ selectedClient.casierJudiciaire || 'Vierge' }}</span>
                </div>
                <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Infractions routières (24 m)</span><span class="font-bold text-sm">{{ selectedClient.nombreInfractionsRoutieres24m ?? 0 }}</span></div>
                <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Litiges civils</span><span class="font-bold text-sm">{{ selectedClient.nombreLitigesCivils ?? 0 }}</span></div>
                <div class="p-3 rounded-xl" [ngClass]="selectedClient.presenceListeSanctions ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'">
                  <span class="block opacity-70">Listes de sanctions</span><span class="font-bold text-sm">{{ selectedClient.presenceListeSanctions ? 'Signalé' : 'RAS' }}</span>
                </div>
              </div>
            </div>

            <div class="flex justify-between pt-2">
              <button type="button" (click)="step = 1" class="text-xs font-bold text-gray-500 hover:text-gray-800">← Retour à la fiche</button>
              <button type="button" (click)="step = 3" class="px-6 py-3 rounded-xl bg-[#147c76] hover:bg-[#0e625e] text-white text-sm font-bold shadow-md transition-all">Instruire le dossier →</button>
            </div>
          </div>
        </div>

        <!-- ---------- ÉTAPE 3 : WIZARD D'INSTRUCTION ---------- -->
        <div *ngIf="step === 3" class="space-y-5">

          <!-- rappel + progression -->
          <div class="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold text-gray-800">{{ selectedClient.prenom }} {{ selectedClient.nom }} · CNIB {{ selectedClient.numeroCnib }}</p>
              <span class="text-xs font-bold text-[#147c76]">Volet {{ volet }} / {{ volets.length }}</span>
            </div>
            <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full bg-[#147c76] rounded-full transition-all duration-300" [style.width.%]="(volet / volets.length) * 100"></div>
            </div>
            <div class="flex gap-1.5 flex-wrap">
              <button type="button" *ngFor="let v of volets" (click)="volet = v.n"
                [ngClass]="volet === v.n ? 'bg-[#147c76] text-white' : (volet > v.n ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-50 text-gray-400 border border-gray-200')"
                class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all">{{ v.n }}. {{ v.titre }}</button>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 class="text-sm font-bold text-gray-900 flex items-center gap-2 mb-1">
              <span class="w-6 h-6 rounded-full bg-[#147c76] text-white text-xs flex items-center justify-center font-bold">{{ volet }}</span>
              {{ volets[volet-1].titre }}
            </h2>
            <p class="text-xs text-gray-400 mb-5">{{ volets[volet-1].sous }}</p>

            <!-- VOLET 1 : profil & activité -->
            <div *ngIf="volet === 1" class="space-y-4">
              <div class="p-3 bg-gray-50 rounded-xl text-xs text-gray-600">
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
                <label class="flex items-center gap-2 text-sm text-gray-700 self-end pb-2">
                  <input type="checkbox" [(ngModel)]="demande.saisonaliteActivite" [ngModelOptions]="{standalone:true}" class="w-4 h-4 accent-[#147c76]" />
                  Activité à revenus <strong>saisonniers</strong>
                </label>
              </div>
            </div>

            <!-- VOLET 2 : revenus & épargne -->
            <div *ngIf="volet === 2" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="lbl">Revenu mensuel déclaré (FCFA) *</label>
                <input type="number" step="5000" min="1" class="inp"
                  [ngClass]="{'border-red-400 bg-red-50': (demande.revenuMensuelFcfa != null && demande.revenuMensuelFcfa <= 0)}"
                  [(ngModel)]="demande.revenuMensuelFcfa" [ngModelOptions]="{standalone:true}" />
                <p *ngIf="demande.revenuMensuelFcfa != null && demande.revenuMensuelFcfa <= 0" class="text-[11px] text-red-600 mt-1">
                  Le revenu doit être supérieur à 0.
                </p>
              </div>
              <div>
                <label class="lbl">Charges mensuelles (FCFA) *</label>
                <input type="number" step="5000" min="0" class="inp"
                  [ngClass]="{'border-red-400 bg-red-50': (demande.chargesMensuellesFcfa != null && demande.chargesMensuellesFcfa < 0)}"
                  [(ngModel)]="demande.chargesMensuellesFcfa" [ngModelOptions]="{standalone:true}" />
                <p *ngIf="demande.chargesMensuellesFcfa != null && demande.chargesMensuellesFcfa < 0" class="text-[11px] text-red-600 mt-1">
                  Les charges ne peuvent pas être négatives.
                </p>
              </div>
              <div class="md:col-span-2 p-3 bg-emerald-50 rounded-xl text-sm font-bold text-[#147c76]">
                Reste à vivre courant : {{ ((demande.revenuMensuelFcfa || 0) - (demande.chargesMensuellesFcfa || 0)) | number }} FCFA
              </div>
              <div>
                <label class="lbl">Ancienneté à la coopérative (mois)</label>
                <input type="text" class="inp bg-gray-100 text-gray-600 cursor-not-allowed" [value]="ancienneteCoopMois + ' mois'" readonly tabindex="-1" />
                <p class="text-[11px] text-gray-400 mt-1">Calculé automatiquement à partir de la date d'adhésion ({{ dateAdhesion || '-' }}).</p>
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
              <label class="flex items-center gap-2 text-sm text-gray-700 self-end pb-2">
                <input type="checkbox" [(ngModel)]="demande.membreGroupeSolidaire" [ngModelOptions]="{standalone:true}" class="w-4 h-4 accent-[#147c76]" />
                Membre d'un <strong>groupe solidaire</strong>
              </label>
            </div>

            <!-- VOLET 3 : Mobile Money -->
            <div *ngIf="volet === 3" class="space-y-4">
              <label class="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" [(ngModel)]="demande.possedeMobileMoney" [ngModelOptions]="{standalone:true}" class="w-4 h-4 accent-[#147c76]" />
                Le sociétaire <strong>possède un compte Mobile Money</strong>
              </label>
              <div *ngIf="demande.possedeMobileMoney" class="grid grid-cols-2 md:grid-cols-3 gap-3 animate-fade-in">
                <div><label class="lbl">Transactions / mois</label><input type="number" min="0" class="inp" [(ngModel)]="demande.frequenceTransactionsMmMois" [ngModelOptions]="{standalone:true}" /></div>
                <div><label class="lbl">Solde moyen (FCFA)</label><input type="number" step="1000" min="0" class="inp" [(ngModel)]="demande.mmSoldeMoyenFcfa" [ngModelOptions]="{standalone:true}" /></div>
                <div><label class="lbl">Flux entrants / mois (FCFA)</label><input type="number" step="1000" min="0" class="inp" [(ngModel)]="demande.mmFluxEntrantsMensuelFcfa" [ngModelOptions]="{standalone:true}" /></div>
              </div>
              <p class="text-[11px] text-gray-400">Les autres indicateurs Mobile Money (ancienneté, volatilité, flux détaillés) sont récupérés automatiquement du profil du sociétaire.</p>
            </div>

            <!-- VOLET 4 : comptes bancaires (le BIC est en étape 2, lecture seule) -->
            <div *ngIf="volet === 4" class="space-y-5">
              <p class="text-xs text-gray-400">
                Le résultat BIC (centrale des risques UEMOA) est pré-chargé et consultable à l'étape « Historique de crédit ». Ici : comptes bancaires classiques du sociétaire.
              </p>

              <div class="pt-4 border-t border-gray-100">
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
                  [ngClass]="{'border-red-400 bg-red-50': (demande.montantDemandeFcfa != null && demande.montantDemandeFcfa <= 0)}"
                  [(ngModel)]="demande.montantDemandeFcfa" [ngModelOptions]="{standalone:true}" />
                <p *ngIf="demande.montantDemandeFcfa != null && demande.montantDemandeFcfa <= 0" class="text-[11px] text-red-600 mt-1">
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
              <div class="md:col-span-2 p-4 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-2 gap-3 text-xs">
                <div><span class="text-gray-400 block">Échéance mensuelle estimée</span><span class="font-bold text-gray-900 text-sm">{{ echeanceEstimee() | number:'1.0-0' }} FCFA</span></div>
                <div><span class="text-gray-400 block">Taux d'endettement estimé</span><span class="font-bold text-sm" [ngClass]="ratioEndettementEstime() > 0.75 ? 'text-red-600' : (ratioEndettementEstime() > 0.5 ? 'text-amber-600' : 'text-emerald-600')">{{ ratioEndettementEstime() * 100 | number:'1.0-0' }} %</span></div>
              </div>
            </div>

            <!-- Contrôles de cohérence -->
            <div *ngIf="volet === volets.length && (erreursSaisie().length > 0 || erreurServeur)"
              class="mt-4 p-3 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs space-y-1">
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
            <div class="flex items-center justify-between pt-5 mt-5 border-t border-gray-100">
              <button type="button" (click)="prevVolet()" [disabled]="volet === 1"
                class="px-5 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed">← Précédent</button>

              <button *ngIf="volet < volets.length" type="button" (click)="nextVolet()"
                class="px-6 py-2.5 text-sm font-bold text-white bg-[#147c76] hover:bg-[#0e625e] rounded-xl shadow-md transition-all">
                Suivant : {{ volets[volet].titre }} →
              </button>

              <button *ngIf="volet === volets.length" type="button" (click)="submitEvaluation()"
                [disabled]="isEvaluating || !dossierComplet()"
                class="px-7 py-3 text-sm font-bold text-white bg-[#147c76] hover:bg-[#0e625e] rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                <svg *ngIf="isEvaluating" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                {{ isEvaluating ? 'Calcul du score…' : 'Lancer le scoring' }}
              </button>
            </div>
          </div>
        </div>

        <!-- ---------- ÉTAPE 3 : RÉSULTAT + SHAP ---------- -->
        <div *ngIf="step === 4 && evaluationResult" class="space-y-5">
          <div class="bg-white rounded-2xl border-2 border-[#147c76] p-6 shadow-xl space-y-6">

            <p *ngIf="evaluationResult.source === 'ESTIMATION_LOCALE'" class="text-[11px] text-gray-400 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
              Évaluation calculée en mode hors-ligne.
            </p>

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div>
                <span class="text-xs font-bold text-[#147c76] uppercase tracking-wider">Décision du moteur de scoring</span>
                <h2 class="text-xl font-bold text-gray-900">{{ selectedClient.prenom }} {{ selectedClient.nom }}</h2>
              </div>
              <span [ngClass]="badgeClass(evaluationResult.statut)" class="px-4 py-2 rounded-full text-xs font-bold border self-start">{{ statusLabel(evaluationResult.statut) }}</span>
            </div>

            <div *ngIf="evaluationResult.noteDecision" class="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs">
              <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span><strong>Règle métier appliquée.</strong> {{ evaluationResult.noteDecision }}</span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p class="text-[11px] text-gray-500">Score CIF</p>
                <p class="text-3xl font-extrabold mt-1" [ngClass]="scoreColor(evaluationResult.scoreCredit)">{{ evaluationResult.scoreCredit ?? '-' }}<span class="text-xs text-gray-400 font-normal"> / 100</span></p>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p class="text-[11px] text-gray-500">Proba. de défaut</p>
                <p class="text-3xl font-extrabold text-gray-900 mt-1">{{ (evaluationResult.scoreRisque || 0) | number:'1.1-1' }}%</p>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p class="text-[11px] text-gray-500">Échéance / mois</p>
                <p class="text-lg font-extrabold text-gray-900 mt-2">{{ evaluationResult.futureEcheanceCreditFcfa || 0 | number:'1.0-0' }} F</p>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p class="text-[11px] text-gray-500">Perte attendue</p>
                <p class="text-lg font-extrabold text-gray-900 mt-2">{{ evaluationResult.perteAttendueFcfa || 0 | number:'1.0-0' }} F</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 text-xs">
              <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Taux d'endettement retenu</span><span class="font-bold text-sm">{{ (evaluationResult.ratioEndettement || 0) * 100 | number:'1.0-0' }} %</span></div>
              <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Reste à vivre après échéance</span><span class="font-bold text-sm">{{ evaluationResult.ratioResteAVivreFcfa || 0 | number:'1.0-0' }} FCFA</span></div>
            </div>

            <!-- SHAP réel -->
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p class="font-bold text-slate-800 text-sm mb-3">Facteurs déterminants pour ce dossier <span class="text-[11px] font-normal text-slate-500">(explicabilité SHAP)</span></p>
              <div *ngIf="facteursShap().length > 0" class="space-y-2">
                <div *ngFor="let f of facteursShap()" class="flex items-center gap-3">
                  <span class="w-52 text-xs font-semibold text-slate-700 truncate" [title]="humaniser(f.variable)">{{ humaniser(f.variable) }}</span>
                  <div class="flex-1 h-3.5 bg-slate-200 rounded-full overflow-hidden relative">
                    <div class="h-full rounded-full" [ngClass]="f.contribution > 0 ? 'bg-red-500' : 'bg-emerald-500'" [style.width.%]="barWidth(f.contribution)"></div>
                  </div>
                  <span class="text-[11px] font-bold w-24 text-right" [ngClass]="f.contribution > 0 ? 'text-red-600' : 'text-emerald-600'">
                    {{ f.contribution > 0 ? '↑ risque' : '↓ risque' }}
                  </span>
                </div>
              </div>
              <p *ngIf="facteursShap().length === 0" class="text-xs text-slate-400">Explication non disponible pour ce dossier.</p>
            </div>

            <!-- Bouton vers la page d'explication détaillée -->
            <a *ngIf="evaluationResult.id" [routerLink]="['/credits', evaluationResult.id, 'explication']"
              class="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#e5f3f1] border border-[#b9ded9] text-[#147c76] text-xs font-bold hover:bg-[#cce9e5] transition-colors">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Pourquoi ce résultat ? Voir l'explication détaillée
              </span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </a>

            <!-- Appréciation de l'agent (informatif) -->
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <p class="font-bold text-slate-800 text-sm">Appréciation de l'agent <span class="text-[11px] font-normal text-slate-500">(avis manuel, n'influence pas le score)</span></p>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button *ngFor="let a of avisOptions" type="button" (click)="avisAgent = a.code; avisSaved = false"
                  [ngClass]="avisAgent === a.code ? a.actif : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'"
                  class="px-2 py-2 rounded-lg border text-[11px] font-bold transition-all">{{ a.label }}</button>
              </div>
              <div>
                <p class="text-[11px] font-bold text-gray-500 uppercase mb-1.5">Motifs (facultatif)</p>
                <div class="flex flex-wrap gap-1.5">
                  <button *ngFor="let m of avisMotifsPossibles" type="button" (click)="toggleMotif(m)"
                    [ngClass]="avisMotifs.has(m) ? 'bg-[#147c76] text-white border-[#147c76]' : 'bg-white text-gray-600 border-gray-300'"
                    class="px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all">{{ m }}</button>
                </div>
              </div>
              <textarea [(ngModel)]="avisCommentaire" [ngModelOptions]="{standalone:true}" rows="2"
                placeholder="Commentaire / motivation de l'avis…"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#147c76]/30"></textarea>
              <div class="flex items-center gap-3">
                <button type="button" (click)="enregistrerAvis()" [disabled]="!avisAgent || avisEnCours"
                  class="px-4 py-2 bg-[#147c76] hover:bg-[#0e625e] disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors">
                  {{ avisEnCours ? 'Enregistrement…' : 'Enregistrer mon avis' }}
                </button>
                <span *ngIf="avisSaved" class="text-xs font-semibold text-emerald-600">✓ Avis enregistré</span>
              </div>
            </div>

            <div class="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button type="button" (click)="step = 3" class="text-xs font-bold text-gray-500 hover:text-gray-800">← Revoir le dossier</button>
              <a routerLink="/credits" class="px-6 py-2.5 bg-[#147c76] hover:bg-[#0e625e] text-white text-xs font-bold rounded-xl shadow transition-all">Voir dans la liste des crédits →</a>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .lbl { display:block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:#4b5563; margin-bottom:4px; }
    .inp { width:100%; padding:9px 12px; border:1px solid #d1d5db; border-radius:10px; font-size:13px; background:#f9fafb; color:#111827; outline:none; }
    .inp:focus { border-color:#147c76; background:#fff; box-shadow:0 0 0 3px rgba(20,124,118,.12); }
    .animate-fade-in { animation: fade .2s ease-out; }
    @keyframes fade { from { opacity:0; transform:translateY(4px);} to { opacity:1; transform:translateY(0);} }
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
    { code: 'FAVORABLE', label: 'Favorable', actif: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    { code: 'FAVORABLE_SOUS_RESERVE', label: 'Favorable sous réserve', actif: 'bg-teal-50 text-teal-700 border-teal-300' },
    { code: 'RESERVE', label: 'Réservé', actif: 'bg-amber-50 text-amber-700 border-amber-300' },
    { code: 'DEFAVORABLE', label: 'Défavorable', actif: 'bg-red-50 text-red-700 border-red-300' },
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
      case 'Sain': return 'bg-[#e5f3f1] text-[#147c76] border-[#b9ded9]';
      case 'Soldé': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Impayé': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Souffrance':
      case 'Contentieux': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  }
  factures(): FactureServicePublic[] {
    return this.selectedClient?.facturesServicesPublics || [];
  }
  facturesRecentes(): FactureServicePublic[] {
    return [...this.factures()].reverse().slice(0, 12);
  }
  casierClass(c?: string): string {
    if (c === 'Condamnation') return 'bg-red-50 text-red-700 border-red-200';
    if (c === 'Mentions mineures') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
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
      case 'Soldé par anticipation': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'En cours': return 'bg-[#e5f3f1] text-[#147c76] border-[#b9ded9]';
      case 'Rééchelonné': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'En défaut': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
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
  // Couleurs alignées sur les zones de décision du modèle déployé
  // (cf. models/scoring-zones.ts). score = (1 - PD) x 100.
  scoreColor(s?: number) {
    const c = couleurScore(s);
    return c === 'gris' ? 'text-gray-700' : c === 'vert' ? 'text-emerald-600' : c === 'orange' ? 'text-amber-600' : 'text-red-600';
  }
  badgeClass(s?: string) {
    return s === 'APPROUVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : s === 'A_L_ETUDE' ? 'bg-amber-50 text-amber-700 border-amber-200'
      : s === 'REJETE' ? 'bg-red-50 text-red-700 border-red-200'
      : 'bg-gray-100 text-gray-700 border-gray-200';
  }
  statusLabel(s?: string) {
    return s === 'APPROUVE' ? 'Accord favorable' : s === 'A_L_ETUDE' ? 'À examiner'
      : s === 'REJETE' ? 'Risque élevé' : s === 'ERREUR_IA' ? 'Erreur moteur IA' : 'Non évalué';
  }
}
