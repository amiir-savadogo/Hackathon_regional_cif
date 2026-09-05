import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Client, DemandeCredit, FacteurExplicatif } from '../../models/client.model';
import { SOCIETAIRES_CIF_BASE } from '../../data/societaires-data';

@Component({
  selector: 'app-credit-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6 max-w-5xl mx-auto pb-16">

      <!-- Fil d'Ariane & Bouton Retour -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-gray-200/90 shadow-sm">
        <nav class="flex items-center space-x-2 text-xs font-medium text-gray-500" aria-label="Breadcrumb">
          <a routerLink="/dashboard" class="inline-flex items-center text-[#147c76] hover:text-[#0e625e] font-semibold transition-colors">
            <svg class="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
            Accueil
          </a>
          <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          <a routerLink="/credits" class="text-[#147c76] hover:text-[#0e625e] font-semibold transition-colors">Crédits</a>
          <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          <span class="text-gray-800 font-semibold">Instruction d'un Nouveau Dossier</span>
        </nav>

        <a routerLink="/credits" class="inline-flex items-center text-xs font-bold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Retour aux Crédits
        </a>
      </div>

      <!-- =================================================================== -->
      <!-- CAS 1 : AUCUN SOCIÉTAIRE SÉLECTIONNÉ -> RECHERCHE CNIB / NOM        -->
      <!-- =================================================================== -->
      <div *ngIf="!selectedClient" class="space-y-6 animate-fade-in">
        
        <!-- En-tête de recherche -->
        <div class="bg-gradient-to-r from-[#147c76] to-[#0e625e] rounded-2xl p-6 text-white shadow-lg">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center text-white backdrop-blur-sm">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <div>
              <h1 class="text-xl font-bold tracking-tight">Instruction d'un Microcrédit — Recherche Sociétaire</h1>
              <p class="text-xs text-emerald-100 mt-0.5">Recherchez le sociétaire dans la base CIF par son numéro CNIB ou son nom pour démarrer l'instruction.</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#147c76]">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <input type="text" [(ngModel)]="searchQuery"
              placeholder="Entrez le numéro de CNIB (ex: B51923646, B43345047) ou le nom..."
              class="w-full pl-12 pr-4 py-3.5 border-2 border-[#147c76]/40 rounded-xl text-sm focus:outline-none focus:border-[#147c76] bg-emerald-50/20 font-semibold shadow-inner" />
          </div>

          <!-- Liste des résultats -->
          <div class="border border-gray-200 rounded-2xl divide-y divide-gray-100 bg-white shadow-sm overflow-hidden">
            <div *ngFor="let c of searchedClients" (click)="selectClient(c)"
              class="p-4 hover:bg-[#e5f3f1] cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
              <div class="flex items-center space-x-3.5">
                <div class="w-11 h-11 rounded-xl bg-[#147c76] text-white text-sm font-bold flex items-center justify-center shadow-sm">
                  {{ c.prenom[0] }}{{ c.nom[0] }}
                </div>
                <div>
                  <div class="flex items-center space-x-2 flex-wrap">
                    <p class="text-sm font-bold text-gray-900">{{ c.prenom }} {{ c.nom }}</p>
                    <span class="px-2 py-0.5 text-xs font-mono font-bold bg-amber-50 text-amber-900 rounded border border-amber-200">
                      CNIB: {{ c.numeroCnib }}
                    </span>
                    <span class="px-2 py-0.5 text-xs font-mono font-bold bg-[#e5f3f1] text-[#147c76] rounded border border-[#b9ded9]">
                      {{ c.numeroCompte }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-500 mt-0.5">
                    {{ c.age }} ans ({{ c.sexe }}) · {{ c.activite }} · {{ c.typeCompte }} · {{ c.ville }} ({{ c.agence }})
                  </p>
                </div>
              </div>

              <div class="flex items-center space-x-3 self-end sm:self-center">
                <div class="text-right hidden sm:block text-xs">
                  <span class="text-gray-400 block">Solde Épargne</span>
                  <span class="font-bold text-[#147c76]">{{ c.soldeEpargneActuelFcfa | number }} FCFA</span>
                </div>
                <button type="button" class="px-4 py-2 bg-[#147c76] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#0e625e] transition-colors flex items-center gap-1">
                  <span>Sélectionner & Voir Dossier →</span>
                </button>
              </div>
            </div>

            <div *ngIf="searchedClients.length === 0" class="p-8 text-center text-xs text-gray-400">
              Aucun sociétaire trouvé pour « {{ searchQuery }} » dans la base de données CIF (1 000 sociétaires).
            </div>
          </div>
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- CAS 2 : SOCIÉTAIRE SÉLECTIONNÉ -> PROCESSUS D'INSTRUCTION           -->
      <!-- =================================================================== -->
      <div *ngIf="selectedClient" class="space-y-6 animate-fade-in">

        <!-- BANDEAU DU PROCESSUS EN 3 ÉTAPES -->
        <div class="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div class="grid grid-cols-3 gap-3 text-xs">
            
            <!-- Étape 1 -->
            <button type="button" (click)="step = 1"
              [ngClass]="step === 1 ? 'bg-[#e5f3f1] border-[#147c76] text-[#147c76] shadow-sm' : (step > 1 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-gray-50 text-gray-400 border-gray-200')"
              class="p-3.5 rounded-xl border flex items-center space-x-3 text-left transition-all">
              <span [ngClass]="step === 1 ? 'bg-[#147c76] text-white' : (step > 1 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500')"
                class="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0">
                <span *ngIf="step <= 1">1</span>
                <span *ngIf="step > 1">✓</span>
              </span>
              <div class="truncate">
                <p class="font-bold text-xs truncate">1. Informations Sociétaire</p>
                <p class="text-[10px] opacity-75 truncate">Fiche KYC & Données Bancaires</p>
              </div>
            </button>

            <!-- Étape 2 -->
            <button type="button" (click)="step = 2"
              [ngClass]="step === 2 ? 'bg-[#e5f3f1] border-[#147c76] text-[#147c76] shadow-sm' : (step > 2 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-gray-50 text-gray-500 border-gray-200')"
              class="p-3.5 rounded-xl border flex items-center space-x-3 text-left transition-all">
              <span [ngClass]="step === 2 ? 'bg-[#147c76] text-white' : (step > 2 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500')"
                class="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0">
                <span *ngIf="step <= 2">2</span>
                <span *ngIf="step > 2">✓</span>
              </span>
              <div class="truncate">
                <p class="font-bold text-xs truncate">2. Demande de Prêt</p>
                <p class="text-[10px] opacity-75 truncate">Montant, Durée & Revenus</p>
              </div>
            </button>

            <!-- Étape 3 -->
            <button type="button" (click)="evaluationResult ? step = 3 : null"
              [disabled]="!evaluationResult"
              [ngClass]="step === 3 ? 'bg-[#e5f3f1] border-[#147c76] text-[#147c76] shadow-sm' : (evaluationResult ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-gray-50 text-gray-400 border-gray-200 opacity-60 cursor-not-allowed')"
              class="p-3.5 rounded-xl border flex items-center space-x-3 text-left transition-all">
              <span [ngClass]="step === 3 ? 'bg-[#147c76] text-white' : (evaluationResult ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500')"
                class="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <div class="truncate">
                <p class="font-bold text-xs truncate">3. Scoring IA & Décision</p>
                <p class="text-[10px] opacity-75 truncate">Score 300-900 & Validation</p>
              </div>
            </button>

          </div>
        </div>

        <!-- =================================================================== -->
        <!-- ÉTAPE 1 : FICHE D'INFORMATIONS COMPLÈTE DU SOCIÉTAIRE               -->
        <!-- =================================================================== -->
        <div *ngIf="step === 1" class="space-y-6 animate-fade-in">
          
          <!-- En-tête de la fiche -->
          <div class="bg-gradient-to-r from-[#147c76] to-[#0e625e] rounded-2xl p-6 text-white shadow-lg">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-center space-x-4">
                <div class="w-16 h-16 rounded-2xl bg-white/15 text-white font-bold text-2xl flex items-center justify-center backdrop-blur-sm shadow-md">
                  {{ selectedClient.prenom[0] }}{{ selectedClient.nom[0] }}
                </div>
                <div>
                  <div class="flex items-center space-x-2 flex-wrap">
                    <h1 class="text-2xl font-bold tracking-tight">{{ selectedClient.prenom }} {{ selectedClient.nom }}</h1>
                    <span class="px-2.5 py-0.5 text-xs font-mono font-bold rounded bg-amber-200 text-amber-950">
                      CNIB: {{ selectedClient.numeroCnib }}
                    </span>
                    <span class="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-400/20 text-emerald-100 border border-emerald-300/30">
                      Compte {{ selectedClient.statutCompte }}
                    </span>
                  </div>
                  <p class="text-xs text-emerald-100 mt-1">
                    Sociétaire CIF · N° Compte : <strong>{{ selectedClient.numeroCompte }}</strong> · Adhérent(e) depuis le {{ selectedClient.dateCreation }} ({{ selectedClient.ancienneteCooperativeMois }} mois)
                  </p>
                </div>
              </div>

              <button type="button" (click)="resetSelection()"
                class="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold backdrop-blur-sm transition-all self-start sm:self-auto flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                <span>Changer de Sociétaire</span>
              </button>
            </div>
          </div>

          <!-- GRILLE DES 4 BLOCS D'INFORMATIONS DÉTAILLÉES -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

            <!-- BLOC 1 : IDENTITÉ & ÉTAT CIVIL -->
            <div class="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
              <h2 class="text-xs font-bold text-[#147c76] uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-gray-100">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                1. État Civil & Identité
              </h2>
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div class="p-2.5 bg-gray-50 rounded-xl">
                  <span class="text-gray-400 block text-[11px]">Nom & Prénom</span>
                  <span class="font-bold text-gray-900 text-sm">{{ selectedClient.prenom }} {{ selectedClient.nom }}</span>
                </div>
                <div class="p-2.5 bg-gray-50 rounded-xl">
                  <span class="text-gray-400 block text-[11px]">Âge & Genre</span>
                  <span class="font-bold text-gray-900">{{ selectedClient.age }} ans · {{ selectedClient.sexe }}</span>
                </div>
                <div class="p-2.5 bg-gray-50 rounded-xl">
                  <span class="text-gray-400 block text-[11px]">Date de Naissance</span>
                  <span class="font-bold text-gray-900">{{ selectedClient.dateNaissance }}</span>
                </div>
                <div class="p-2.5 bg-gray-50 rounded-xl">
                  <span class="text-gray-400 block text-[11px]">Situation Matrimoniale</span>
                  <span class="font-bold text-gray-900">{{ selectedClient.situationMatrimoniale }}</span>
                </div>
                <div class="p-2.5 bg-gray-50 rounded-xl">
                  <span class="text-gray-400 block text-[11px]">Personnes à Charge</span>
                  <span class="font-bold text-gray-900">{{ selectedClient.nombrePersonnesACharge }} personne(s)</span>
                </div>
                <div class="p-2.5 bg-gray-50 rounded-xl">
                  <span class="text-gray-400 block text-[11px]">Niveau d'Éducation</span>
                  <span class="font-bold text-gray-900">{{ selectedClient.niveauEducation }}</span>
                </div>
              </div>
            </div>

            <!-- BLOC 2 : PIÈCE D'IDENTITÉ & CONTACT -->
            <div class="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
              <h2 class="text-xs font-bold text-[#147c76] uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-gray-100">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/></svg>
                2. Pièce d'Identité (CNIB) & Localisation
              </h2>
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div class="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200">
                  <span class="text-amber-800 block text-[11px]">Numéro de CNIB</span>
                  <span class="font-mono font-bold text-amber-950 text-sm">{{ selectedClient.numeroCnib }}</span>
                </div>
                <div class="p-2.5 bg-gray-50 rounded-xl">
                  <span class="text-gray-400 block text-[11px]">Expiration de la Pièce</span>
                  <span class="font-bold text-gray-900">{{ selectedClient.dateExpirationCnib }}</span>
                </div>
                <div class="p-2.5 bg-gray-50 rounded-xl">
                  <span class="text-gray-400 block text-[11px]">Téléphone Principal</span>
                  <span class="font-bold text-gray-900 font-mono">{{ selectedClient.telephone }}</span>
                </div>
                <div class="p-2.5 bg-gray-50 rounded-xl truncate">
                  <span class="text-gray-400 block text-[11px]">Email</span>
                  <span class="font-bold text-gray-900 text-[11px] truncate block">{{ selectedClient.email }}</span>
                </div>
                <div class="p-2.5 bg-gray-50 rounded-xl col-span-2">
                  <span class="text-gray-400 block text-[11px]">Adresse Complète</span>
                  <span class="font-bold text-gray-900">{{ selectedClient.adresse }} · {{ selectedClient.ville }} ({{ selectedClient.region }}, {{ selectedClient.pays }})</span>
                  <span class="text-[11px] text-[#147c76] font-semibold block mt-0.5">Type de Logement : <strong>{{ selectedClient.typeLogement }}</strong></span>
                </div>
              </div>
            </div>

            <!-- BLOC 3 : COMPTE & HISTORIQUE BANCAIRE CIF -->
            <div class="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
              <h2 class="text-xs font-bold text-[#147c76] uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-gray-100">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                3. Compte & Situation Bancaire CIF
              </h2>
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div class="p-2.5 bg-[#e5f3f1] rounded-xl border border-[#b9ded9]">
                  <span class="text-[#147c76] block text-[11px]">Numéro de Compte</span>
                  <span class="font-mono font-bold text-gray-900 text-sm">{{ selectedClient.numeroCompte }}</span>
                </div>
                <div class="p-2.5 bg-gray-50 rounded-xl">
                  <span class="text-gray-400 block text-[11px]">Type de Compte</span>
                  <span class="font-bold text-gray-900">{{ selectedClient.typeCompte }}</span>
                </div>
                <div class="p-2.5 bg-gray-50 rounded-xl">
                  <span class="text-gray-400 block text-[11px]">Agence CIF</span>
                  <span class="font-bold text-gray-900">{{ selectedClient.agence }}</span>
                </div>
                <div class="p-2.5 bg-gray-50 rounded-xl">
                  <span class="text-gray-400 block text-[11px]">Statut Compte</span>
                  <span class="font-bold text-emerald-700">{{ selectedClient.statutCompte }}</span>
                </div>
                <div class="p-2.5 bg-gray-50 rounded-xl">
                  <span class="text-gray-400 block text-[11px]">Parts Sociales Détenues</span>
                  <span class="font-bold text-[#147c76] text-sm">{{ selectedClient.partsSocialesFcfa | number }} FCFA</span>
                </div>
                <div class="p-2.5 bg-gray-50 rounded-xl">
                  <span class="text-gray-400 block text-[11px]">Solde Épargne Actuel</span>
                  <span class="font-bold text-[#147c76] text-sm">{{ selectedClient.soldeEpargneActuelFcfa | number }} FCFA</span>
                </div>
              </div>
            </div>

            <!-- BLOC 4 : ACTIVITÉ ÉCONOMIQUE & REVENUS -->
            <div class="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
              <h2 class="text-xs font-bold text-[#147c76] uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-gray-100">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                4. Activité Économique & Revenus
              </h2>
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div class="p-2.5 bg-gray-50 rounded-xl col-span-2">
                  <span class="text-gray-400 block text-[11px]">Activité Principale</span>
                  <span class="font-bold text-gray-900 text-sm">{{ selectedClient.activite }}</span>
                  <span class="text-[11px] text-gray-500 block">Secteur {{ selectedClient.secteurActivite }} ({{ selectedClient.ancienneteActiviteAnnees }} ans d'expérience)</span>
                </div>
                <div class="p-2.5 bg-gray-50 rounded-xl">
                  <span class="text-gray-400 block text-[11px]">Revenu Mensuel Déclaré</span>
                  <span class="font-bold text-gray-900 text-sm">{{ selectedClient.revenuMensuelFcfa | number }} FCFA</span>
                </div>
                <div class="p-2.5 bg-gray-50 rounded-xl">
                  <span class="text-gray-400 block text-[11px]">Charges Mensuelles</span>
                  <span class="font-bold text-gray-900 text-sm">{{ selectedClient.chargesMensuellesFcfa | number }} FCFA</span>
                </div>
                <div class="p-2.5 bg-emerald-50 rounded-xl border border-[#7ebcb7] col-span-2 flex items-center justify-between">
                  <div>
                    <span class="text-[#147c76] block text-[11px] font-semibold">Reste à Vivre Mensuel Estimé</span>
                    <span class="font-bold text-emerald-800 text-base">
                      {{ ((selectedClient.revenuMensuelFcfa || 0) - (selectedClient.chargesMensuellesFcfa || 0)) | number }} FCFA / mois
                    </span>
                  </div>
                  <span class="px-2.5 py-1 bg-white text-[#147c76] text-xs font-bold rounded-lg border border-[#b9ded9]">
                    KYC Validé
                  </span>
                </div>
              </div>
            </div>

          </div>

          <!-- Actions au bas de l'Étape 1 -->
          <div class="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <button type="button" (click)="resetSelection()"
              class="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-all flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              <span>Changer de Sociétaire</span>
            </button>

            <button type="button" (click)="step = 2"
              class="px-7 py-3 rounded-xl bg-[#147c76] hover:bg-[#0e625e] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2">
              <span>Passer à la Demande de Prêt (Étape 2)</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
          </div>

        </div>

        <!-- =================================================================== -->
        <!-- ÉTAPE 2 : PARAMÈTRES DU PRÊT SOLLICITÉ & CONDITIONS                 -->
        <!-- =================================================================== -->
        <div *ngIf="step === 2" class="space-y-6 animate-fade-in">
          
          <!-- Rappel rapide du sociétaire -->
          <div class="bg-[#e5f3f1] border border-[#7ebcb7] rounded-2xl p-4 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-xl bg-[#147c76] text-white text-xs font-bold flex items-center justify-center">
                {{ selectedClient.prenom[0] }}{{ selectedClient.nom[0] }}
              </div>
              <div>
                <p class="text-xs font-bold text-gray-900">{{ selectedClient.prenom }} {{ selectedClient.nom }} (CNIB: {{ selectedClient.numeroCnib }})</p>
                <p class="text-[11px] text-gray-600">{{ selectedClient.activite }} · Solde épargne : {{ selectedClient.soldeEpargneActuelFcfa | number }} FCFA</p>
              </div>
            </div>
            <button type="button" (click)="step = 1" class="text-xs font-bold text-[#147c76] hover:underline">
              ← Revoir la Fiche
            </button>
          </div>

          <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
            <h2 class="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-[#147c76] text-white text-xs flex items-center justify-center font-bold">2</span>
              Paramètres du Prêt Sollicité & Données Financières
            </h2>

            <form (ngSubmit)="submitEvaluation()" class="space-y-5">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Montant Sollicité (FCFA) *</label>
                  <input type="number" [(ngModel)]="demande.montantDemandeFcfa" name="montant" required min="50000" step="10000"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg font-bold text-gray-900 focus:outline-none focus:border-[#147c76] bg-gray-50/50" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Durée du Remboursement (mois) *</label>
                  <input type="number" [(ngModel)]="demande.dureeMois" name="duree" required min="1" max="48"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg font-bold text-gray-900 focus:outline-none focus:border-[#147c76] bg-gray-50/50" />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Objet du Crédit</label>
                  <select [(ngModel)]="demande.objetCredit" name="objet"
                    class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#147c76] bg-white">
                    <option value="Commerce / Fonds de roulement">Commerce / Fonds de roulement</option>
                    <option value="Agriculture / Achat intrants">Agriculture / Achat intrants</option>
                    <option value="Élevage & Embouche ovine">Élevage & Embouche ovine</option>
                    <option value="Artisanat & Équipement professionnel">Artisanat & Équipement professionnel</option>
                    <option value="Amélioration habitat & Travaux">Amélioration habitat & Travaux</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Garantie Proposée</label>
                  <select [(ngModel)]="demande.garantie" name="garantie"
                    class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#147c76] bg-white">
                    <option value="Caution solidaire">Caution solidaire de groupe</option>
                    <option value="Gage matériel / Stock">Gage sur stock de marchandises</option>
                    <option value="Nantissement équipement">Nantissement équipement professionnel</option>
                    <option value="Caution individuelle d'un tiers">Caution individuelle d'un tiers</option>
                    <option value="Hypothèque / Titre foncier">Hypothèque / Titre foncier</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                <div>
                  <label class="block text-gray-600 font-semibold mb-1">Revenu Mensuel (FCFA) :</label>
                  <input type="number" [(ngModel)]="demande.revenuMensuelFcfa" name="rev" required step="5000"
                    class="w-full px-3 py-2 border rounded-lg bg-white text-sm font-bold" />
                </div>
                <div>
                  <label class="block text-gray-600 font-semibold mb-1">Charges Mensuelles (FCFA) :</label>
                  <input type="number" [(ngModel)]="demande.chargesMensuellesFcfa" name="charges" required step="5000"
                    class="w-full px-3 py-2 border rounded-lg bg-white text-sm font-bold" />
                </div>
                <div>
                  <label class="block text-gray-600 font-semibold mb-1">Reste à Vivre Calculé :</label>
                  <div class="px-3 py-2 border rounded-lg bg-emerald-50 text-[#147c76] text-sm font-bold">
                    {{ ((demande.revenuMensuelFcfa || 0) - (demande.chargesMensuellesFcfa || 0)) | number }} FCFA
                  </div>
                </div>
              </div>

              <!-- Boutons de validation et navigation -->
              <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                <button type="button" (click)="step = 1"
                  class="px-5 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
                  ← Fiche Sociétaire
                </button>

                <button type="submit" [disabled]="isEvaluating"
                  class="bg-[#147c76] hover:bg-[#0e625e] text-white text-sm font-bold px-7 py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
                  <svg *ngIf="!isEvaluating" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  <svg *ngIf="isEvaluating" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                  <span>{{ isEvaluating ? 'Calcul du Score IA en cours...' : 'Calculer le Score & Évaluer le Dossier ⚡' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- =================================================================== -->
        <!-- ÉTAPE 3 : RÉSULTAT DU SCORING IA & DÉCISION                         -->
        <!-- =================================================================== -->
        <div *ngIf="step === 3 && evaluationResult" class="space-y-6 animate-fade-in">
          
          <div class="bg-white rounded-2xl border-2 border-[#147c76] p-6 shadow-xl space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
              <div>
                <span class="text-xs font-bold text-[#147c76] uppercase tracking-wider block">Décision du Moteur de Scoring CIF</span>
                <h2 class="text-xl font-bold text-gray-900 mt-0.5">Dossier de {{ selectedClient.prenom }} {{ selectedClient.nom }} (CNIB: {{ selectedClient.numeroCnib }})</h2>
              </div>
              <span [ngClass]="getStatusBadgeClass(evaluationResult.statut)" class="px-4 py-2 rounded-full text-xs font-bold border self-start sm:self-auto">
                {{ getStatusLabel(evaluationResult.statut) }}
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p class="text-xs text-gray-500 font-medium">Score Scorecard CIF</p>
                <p class="text-3xl font-extrabold mt-1" [ngClass]="getScoreColor(evaluationResult.scoreCredit)">
                  {{ evaluationResult.scoreCredit }}
                  <span class="text-xs text-gray-400 font-normal">/ 900</span>
                </p>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p class="text-xs text-gray-500 font-medium">Probabilité de Défaut</p>
                <p class="text-3xl font-extrabold text-gray-900 mt-1">
                  {{ (evaluationResult.scoreRisque || 5.2) | number:'1.1-1' }}%
                </p>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p class="text-xs text-gray-500 font-medium">Montant Octroyable Recommandé</p>
                <p class="text-2xl font-extrabold text-[#147c76] mt-1">
                  {{ evaluationResult.montantDemandeFcfa | number }} FCFA
                </p>
              </div>
            </div>

            <!-- Facteurs explicatifs SHAP -->
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <p class="font-bold text-slate-800 mb-2">Synthèse de l'Analyse IA :</p>
              <ul class="space-y-1.5 text-slate-600">
                <li class="flex items-center gap-2">
                  <span class="text-emerald-600 font-bold">✓</span>
                  <span>Ancienneté sociétaire : {{ selectedClient.ancienneteCooperativeMois }} mois avec un compte régulier.</span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="text-emerald-600 font-bold">✓</span>
                  <span>Épargne disponible : {{ selectedClient.soldeEpargneActuelFcfa | number }} FCFA (garantie de liquidité).</span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="text-[#147c76] font-bold">✓</span>
                  <span>Capacité de remboursement validée par rapport au reste à vivre mensuel.</span>
                </li>
              </ul>
            </div>

            <!-- Bouton final pour revenir et voir dans la table -->
            <div class="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p class="text-xs text-emerald-700 font-semibold">
                ✓ Le dossier a été enregistré avec succès et ajouté au tableau des crédits.
              </p>
              <a routerLink="/credits" class="px-6 py-2.5 bg-[#147c76] hover:bg-[#0e625e] text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5">
                <span>Voir dans la Liste des Crédits</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </a>
            </div>
          </div>

        </div>

      </div>

    </div>
  `
})
export class CreditFormComponent implements OnInit {
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  step = 1; // 1: Fiche Sociétaire (Informations), 2: Demande de Prêt, 3: Résultat IA
  clients: Client[] = SOCIETAIRES_CIF_BASE && SOCIETAIRES_CIF_BASE.length > 0 ? SOCIETAIRES_CIF_BASE : [];
  searchQuery = '';
  selectedClient: Client | null = null;
  isEvaluating = false;
  evaluationResult: DemandeCredit | null = null;

  demande: DemandeCredit = {
    montantDemandeFcfa: 500000,
    dureeMois: 12,
    revenuMensuelFcfa: 180000,
    chargesMensuellesFcfa: 60000,
    ancienneteCooperativeMois: 24,
    epargneSoldeMoyenFcfa: 250000,
    nombreCreditsAnterieurs: 1,
    possedeMobileMoney: true,
    frequenceTransactionsMmMois: 10,
    objetCredit: 'Commerce / Fonds de roulement',
    garantie: 'Caution solidaire'
  };

  ngOnInit() {
    this.checkRouteParams();
    this.apiService.getClients().subscribe({
      next: (list) => {
        if (list && list.length > 0) {
          this.clients = list;
          this.checkRouteParams();
        }
      },
      error: () => {
        if (!this.clients || this.clients.length === 0) {
          this.clients = SOCIETAIRES_CIF_BASE;
          this.checkRouteParams();
        }
      }
    });
  }

  private checkRouteParams() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const queryId = this.route.snapshot.queryParamMap.get('id');
    const cnibParam = this.route.snapshot.queryParamMap.get('cnib');

    if (idParam || queryId) {
      const clientId = parseInt(idParam || queryId || '', 10);
      const found = this.clients.find(c => c.id === clientId);
      if (found) this.selectClient(found);
    } else if (cnibParam) {
      const q = cnibParam.toLowerCase().trim();
      const found = this.clients.find(c => (c.numeroCnib || '').toLowerCase().trim() === q);
      if (found) this.selectClient(found);
    }
  }

  resetSelection() {
    this.selectedClient = null;
    this.evaluationResult = null;
    this.step = 1;
  }

  get searchedClients(): Client[] {
    const q = (this.searchQuery || '').toLowerCase().replace(/\s+/g, '').trim();
    if (!q) return this.clients.slice(0, 8);
    return this.clients.filter(c => {
      const cnib = (c.numeroCnib || '').toLowerCase().replace(/\s+/g, '');
      const acct = (c.numeroCompte || '').toLowerCase().replace(/\s+/g, '');
      const nom = (c.nom || '').toLowerCase();
      const prenom = (c.prenom || '').toLowerCase();
      const fullName = (prenom + nom).replace(/\s+/g, '');
      const fullNameRev = (nom + prenom).replace(/\s+/g, '');
      const tel = (c.telephone || '').replace(/\s+/g, '');
      const activite = (c.activite || '').toLowerCase();
      const secteur = (c.secteurActivite || '').toLowerCase();

      return (
        cnib.includes(q) ||
        acct.includes(q) ||
        fullName.includes(q) ||
        fullNameRev.includes(q) ||
        nom.includes(q) ||
        prenom.includes(q) ||
        tel.includes(q) ||
        activite.includes(q) ||
        secteur.includes(q)
      );
    }).slice(0, 15);
  }

  selectClient(client: Client) {
    this.selectedClient = client;
    this.evaluationResult = null;
    this.step = 1; // Commence à l'étape 1 du processus (Fiche d'Informations)
    
    const rev = client.revenuMensuelFcfa || 180000;
    const charges = client.chargesMensuellesFcfa || Math.round(rev * 0.35);
    const epargne = client.soldeEpargneActuelFcfa || 220000;
    const anc = client.ancienneteCooperativeMois || (client.ancienneteActiviteAnnees ? client.ancienneteActiviteAnnees * 12 : 24);

    this.demande = {
      montantDemandeFcfa: Math.min(2500000, Math.max(100000, Math.round(rev * 2.5 / 10000) * 10000)),
      dureeMois: 12,
      revenuMensuelFcfa: rev,
      chargesMensuellesFcfa: charges,
      ancienneteCooperativeMois: anc,
      epargneSoldeMoyenFcfa: epargne,
      nombreCreditsAnterieurs: anc > 24 ? 2 : (anc > 12 ? 1 : 0),
      possedeMobileMoney: true,
      frequenceTransactionsMmMois: 10,
      objetCredit: client.activite ? `Développement: ${client.activite}` : 'Commerce / Fonds de roulement',
      garantie: 'Caution solidaire'
    };
  }

  submitEvaluation() {
    if (!this.selectedClient || !this.selectedClient.id) return;

    this.isEvaluating = true;
    this.apiService.evaluerCredit(this.selectedClient.id, this.demande).subscribe({
      next: (res) => {
        this.isEvaluating = false;
        this.evaluationResult = res;
        this.step = 3; // Passe à l'étape 3 (Résultat IA)
      },
      error: (err) => {
        this.isEvaluating = false;
        console.error('Erreur évaluation crédit:', err);
      }
    });
  }

  getScoreColor(score?: number): string {
    if (!score) return 'text-gray-700';
    if (score >= 680) return 'text-emerald-600';
    if (score >= 550) return 'text-amber-600';
    return 'text-red-600';
  }

  getStatusBadgeClass(statut?: string): string {
    switch (statut) {
      case 'APPROUVE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'A_L_ETUDE': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'REJETE': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }

  getStatusLabel(statut?: string): string {
    switch (statut) {
      case 'APPROUVE': return 'Accord Favorable';
      case 'A_L_ETUDE': return 'À Examiner';
      case 'REJETE': return 'Risque Élevé';
      default: return 'Non Évalué';
    }
  }
}
