import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Client, DemandeCredit, FacteurExplicatif } from '../../models/client.model';

interface CreditDossierItem {
  demande: DemandeCredit;
  client: Client;
}

@Component({
  selector: 'app-credits',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6">

      <!-- Fil d'Ariane -->
      <nav class="flex items-center space-x-2 text-xs font-medium text-gray-500 bg-white px-4 py-2.5 rounded-xl border border-gray-200/80 shadow-sm" aria-label="Breadcrumb">
        <a routerLink="/dashboard" class="inline-flex items-center text-[#147c76] hover:text-[#0e625e] font-semibold transition-colors">
          <svg class="w-3.5 h-3.5 mr-1.5 text-[#147c76]" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
          Accueil
        </a>
        <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        <span class="text-gray-800 font-semibold">Crédits</span>
        <span *ngIf="dossiers.length > 0" class="ml-2 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-[#e5f3f1] text-[#147c76] border border-[#b9ded9]">
          {{ dossiers.length }} dossier{{ dossiers.length > 1 ? 's' : '' }}
        </span>
      </nav>

      <!-- En-tête avec bouton principal -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Gestion des Crédits</h1>
          <p class="text-sm text-gray-500 mt-0.5">Instruction des demandes de microcrédit et évaluation automatique par IA</p>
        </div>
        <button (click)="openNewCreditModal()"
          class="bg-[#147c76] hover:bg-[#0e625e] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all flex items-center space-x-2 self-start sm:self-auto">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span>Nouveau Crédit</span>
        </button>
      </div>

      <!-- Métriques synthétiques -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p class="text-xs text-gray-500 font-medium uppercase">Total Dossiers</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ dossiers.length }}</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ clients.length }} sociétaires référencés</p>
        </div>
        <div class="bg-white rounded-xl border border-emerald-100 p-4 shadow-sm">
          <p class="text-xs text-emerald-700 font-semibold uppercase">Accord Favorable</p>
          <p class="text-2xl font-bold text-emerald-700 mt-1">{{ countStatus('APPROUVE') }}</p>
          <p class="text-xs text-emerald-600/70 mt-0.5">{{ getApprovalRate() }}% de taux d'accord</p>
        </div>
        <div class="bg-white rounded-xl border border-amber-100 p-4 shadow-sm">
          <p class="text-xs text-amber-700 font-semibold uppercase">À Examiner</p>
          <p class="text-2xl font-bold text-amber-700 mt-1">{{ countStatus('A_L_ETUDE') }}</p>
          <p class="text-xs text-amber-600/70 mt-0.5">Décision humaine requise</p>
        </div>
        <div class="bg-white rounded-xl border border-red-100 p-4 shadow-sm">
          <p class="text-xs text-red-700 font-semibold uppercase">Risque Élevé</p>
          <p class="text-2xl font-bold text-red-700 mt-1">{{ countStatus('REJETE') }}</p>
          <p class="text-xs text-red-600/70 mt-0.5">Défaut anticipé</p>
        </div>
      </div>

      <!-- Filtres & Recherche -->
      <div class="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <input type="text" [(ngModel)]="searchQuery"
            placeholder="Rechercher un dossier par numéro de compte (CPT-...), nom ou montant..."
            class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#147c76] bg-gray-50/50" />
        </div>
        <select [(ngModel)]="selectedStatusFilter"
          class="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#147c76] text-gray-700">
          <option value="ALL">Tous les statuts</option>
          <option value="APPROUVE">Accord Favorable</option>
          <option value="A_L_ETUDE">À Examiner</option>
          <option value="REJETE">Risque Élevé</option>
        </select>
      </div>

      <!-- Table des dossiers de crédit -->
      <div class="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
        <table class="w-full text-left text-sm" *ngIf="filteredDossiers.length > 0">
          <thead class="bg-gray-50/90 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <tr>
              <th class="px-5 py-3.5">Sociétaire (Client)</th>
              <th class="px-5 py-3.5">Montant & Durée</th>
              <th class="px-5 py-3.5">Objet du prêt</th>
              <th class="px-5 py-3.5">Score IA</th>
              <th class="px-5 py-3.5">Décision</th>
              <th class="px-5 py-3.5">Date</th>
              <th class="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let item of filteredDossiers" class="hover:bg-[#e5f3f1]/40 transition-colors">
              <td class="px-5 py-3.5">
                <div class="flex items-center space-x-3">
                  <div class="w-9 h-9 rounded-xl bg-[#e5f3f1] text-[#147c76] font-bold text-xs flex items-center justify-center border border-[#b9ded9]">
                    {{ item.client.prenom ? item.client.prenom[0] : '' }}{{ item.client.nom ? item.client.nom[0] : '' }}
                  </div>
                  <div>
                    <div class="flex items-center space-x-2">
                      <span class="font-bold text-gray-900 leading-tight">{{ item.client.prenom }} {{ item.client.nom }}</span>
                      <span class="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#e5f3f1] text-[#147c76] rounded border border-[#b9ded9]">
                        CPT-{{ getAccountNumber(item.client) }}
                      </span>
                    </div>
                    <span class="text-xs text-gray-400 block mt-0.5">{{ item.client.secteurActivite || 'Secteur informel' }} · {{ item.client.zone || 'UEMOA' }}</span>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3.5">
                <span class="font-bold text-gray-900 block">{{ item.demande.montantDemandeFcfa | number }} FCFA</span>
                <span class="text-xs text-gray-400">{{ item.demande.dureeMois }} mois</span>
              </td>
              <td class="px-5 py-3.5 text-gray-700">
                <span class="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium inline-block">
                  {{ item.demande.objetCredit || 'Commerce / Activité' }}
                </span>
              </td>
              <td class="px-5 py-3.5">
                <div class="flex items-center space-x-1.5" *ngIf="item.demande.scoreCredit">
                  <span class="font-bold text-sm" [ngClass]="getScoreColor(item.demande.scoreCredit)">{{ item.demande.scoreCredit }}</span>
                  <span class="text-[11px] text-gray-400 font-mono">/ 900</span>
                </div>
                <span *ngIf="!item.demande.scoreCredit" class="text-xs text-gray-400">—</span>
              </td>
              <td class="px-5 py-3.5">
                <span [ngClass]="getStatusBadgeClass(item.demande.statut)" class="px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full" [ngClass]="getStatusDotClass(item.demande.statut)"></span>
                  {{ getStatusLabel(item.demande.statut) }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-xs text-gray-400">
                {{ item.demande.dateCreation | date:'dd/MM/yyyy' }}
              </td>
              <td class="px-5 py-3.5 text-right">
                <button (click)="openDetailModal(item)"
                  class="px-3 py-1.5 rounded-lg bg-[#e5f3f1] hover:bg-[#cce9e5] text-[#147c76] text-xs font-semibold transition-all border border-[#b9ded9]">
                  Voir le scoring
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- État vide -->
        <div *ngIf="filteredDossiers.length === 0" class="text-center py-12 px-4">
          <div class="w-14 h-14 bg-[#e5f3f1] text-[#147c76] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          </div>
          <h3 class="text-base font-bold text-gray-900 mb-1">Aucun dossier de crédit trouvé</h3>
          <p class="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
            Sélectionnez un sociétaire de la coopérative pour instruire une nouvelle demande de prêt et générer le score IA.
          </p>
          <button (click)="openNewCreditModal()"
            class="bg-[#147c76] hover:bg-[#0e625e] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all">
            Nouveau Crédit
          </button>
        </div>
      </div>

      <!-- MODALE D'INSTRUCTION DE CRÉDIT (AVEC AUTO-REMPLISSAGE) -->
      <div *ngIf="isNewModalOpen" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative animate-fade-in max-h-[92vh] overflow-y-auto border border-gray-100">
          
          <div class="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
            <div>
              <h2 class="text-lg font-bold text-gray-900">Nouvelle Demande de Crédit</h2>
              <p class="text-xs text-gray-500">Sélection du sociétaire et instruction automatisée par scoring IA</p>
            </div>
            <button (click)="closeNewModal()" class="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- ÉTAPE 1 : CHOISIR LE SOCIÉTAIRE (BARRE DE RECHERCHE INTELLIGENTE) -->
          <div class="mb-6">
            <label class="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">1. Rechercher le Sociétaire par N° de compte, Nom ou Téléphone *</label>
            
            <div class="relative" *ngIf="!selectedClient">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
              <input type="text" [(ngModel)]="clientSearchInput"
                placeholder="Entrez le numéro de compte (ex: CPT-001), téléphone ou nom..."
                class="w-full pl-9 pr-4 py-2.5 border-2 border-[#147c76]/40 rounded-xl text-sm focus:outline-none focus:border-[#147c76] bg-emerald-50/20 shadow-sm font-medium" />
              
              <!-- Liste des résultats de recherche -->
              <div class="mt-2 border border-gray-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-gray-100 bg-white shadow-lg">
                <div *ngFor="let c of searchedClients" (click)="selectClient(c)"
                  class="p-3 hover:bg-[#e5f3f1] cursor-pointer flex items-center justify-between transition-colors">
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 rounded-full bg-[#147c76] text-white text-xs font-bold flex items-center justify-center">
                      {{ c.prenom[0] }}{{ c.nom[0] }}
                    </div>
                    <div>
                      <div class="flex items-center space-x-2">
                        <p class="text-sm font-bold text-gray-900">{{ c.prenom }} {{ c.nom }}</p>
                        <span class="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#e5f3f1] text-[#147c76] rounded border border-[#b9ded9]">
                          CPT-{{ getAccountNumber(c) }}
                        </span>
                      </div>
                      <p class="text-xs text-gray-500">{{ c.age }} ans · {{ c.secteurActivite || 'Informel' }} · {{ c.telephone || 'Sans tél.' }}</p>
                    </div>
                  </div>
                  <span class="text-xs font-semibold text-[#147c76] px-2.5 py-1 bg-white border border-[#b9ded9] rounded-lg">Sélectionner →</span>
                </div>
                <div *ngIf="searchedClients.length === 0" class="p-4 text-center text-xs text-gray-400">
                  Aucun sociétaire correspondant.
                </div>
              </div>
            </div>

            <!-- Fiche sociétaire sélectionné -->
            <div *ngIf="selectedClient" class="bg-[#f0f7f6] border border-[#7ebcb7] rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div class="flex items-center space-x-3.5">
                <div class="w-11 h-11 rounded-xl bg-[#147c76] text-white font-bold text-sm flex items-center justify-center shadow-sm">
                  {{ selectedClient.prenom[0] }}{{ selectedClient.nom[0] }}
                </div>
                <div>
                  <div class="flex items-center space-x-2">
                    <h3 class="text-sm font-bold text-gray-900">{{ selectedClient.prenom }} {{ selectedClient.nom }}</h3>
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">Sociétaire CIF</span>
                  </div>
                  <p class="text-xs text-gray-600 mt-0.5">
                    {{ selectedClient.age }} ans · {{ selectedClient.sexe }} · Zone {{ selectedClient.zone }} · {{ selectedClient.secteurActivite }} ({{ selectedClient.ancienneteActiviteAnnees }} ans)
                  </p>
                </div>
              </div>
              <button type="button" (click)="selectedClient = null"
                class="text-xs text-gray-500 hover:text-red-600 font-semibold underline px-2 py-1">
                Changer
              </button>
            </div>
          </div>

          <!-- ÉTAPE 2 : PARAMÈTRES DU CRÉDIT & DONNÉES PRÉ-REMPLIES -->
          <form *ngIf="selectedClient" (ngSubmit)="submitEvaluation()" class="space-y-4">
            
            <div class="bg-gray-50/80 border border-gray-200 rounded-xl p-3.5">
              <p class="text-xs font-bold text-[#147c76] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Données bancaires et coopérative pré-chargées
              </p>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span class="text-gray-500 block">Ancienneté CIF :</span>
                  <input type="number" [(ngModel)]="newDemande.ancienneteCooperativeMois" name="ancCoop" class="w-full mt-1 px-2.5 py-1.5 border rounded-lg bg-white" />
                </div>
                <div>
                  <span class="text-gray-500 block">Épargne moyenne (FCFA) :</span>
                  <input type="number" [(ngModel)]="newDemande.epargneSoldeMoyenFcfa" name="epargne" class="w-full mt-1 px-2.5 py-1.5 border rounded-lg bg-white" />
                </div>
                <div>
                  <span class="text-gray-500 block">Crédits antérieurs :</span>
                  <input type="number" [(ngModel)]="newDemande.nombreCreditsAnterieurs" name="nbCred" class="w-full mt-1 px-2.5 py-1.5 border rounded-lg bg-white" />
                </div>
              </div>
            </div>

            <!-- NOUVEAU PRÊT SOLLICITÉ -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Montant sollicité (FCFA) *</label>
                <input type="number" [(ngModel)]="newDemande.montantDemandeFcfa" name="montant" required min="25000" step="10000"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#147c76]" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Durée du remboursement (mois) *</label>
                <input type="number" [(ngModel)]="newDemande.dureeMois" name="duree" required min="1" max="48"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#147c76]" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Revenu mensuel estimé (FCFA) *</label>
                <input type="number" [(ngModel)]="newDemande.revenuMensuelFcfa" name="revenu" required min="0" step="5000"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#147c76]" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Charges mensuelles (FCFA) *</label>
                <input type="number" [(ngModel)]="newDemande.chargesMensuellesFcfa" name="charges" required min="0" step="5000"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#147c76]" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Objet du crédit</label>
                <select [(ngModel)]="newDemande.objetCredit" name="objet"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#147c76] bg-white">
                  <option value="Commerce / Fonds de roulement">Commerce / Fonds de roulement</option>
                  <option value="Agriculture / Intrants">Agriculture / Intrants</option>
                  <option value="Élevage & Embouche">Élevage & Embouche</option>
                  <option value="Artisanat / Outillage">Artisanat / Outillage</option>
                  <option value="Équipement professionnel">Équipement professionnel</option>
                  <option value="Amélioration habitat">Amélioration habitat</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Garantie proposée</label>
                <select [(ngModel)]="newDemande.garantie" name="garantie"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#147c76] bg-white">
                  <option value="Caution solidaire">Caution solidaire (Groupe)</option>
                  <option value="Gage matériel / Stock">Gage matériel / Stock</option>
                  <option value="Nantissement équipement">Nantissement équipement</option>
                  <option value="Hypothèque / Titre foncier">Hypothèque / Titre foncier</option>
                  <option value="Aucune garantie formelle">Aucune garantie formelle</option>
                </select>
              </div>
            </div>

            <div *ngIf="evaluationError" class="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {{ evaluationError }}
            </div>

            <div class="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button type="button" (click)="closeNewModal()"
                class="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button type="submit" [disabled]="isEvaluating"
                class="px-5 py-2.5 bg-[#147c76] hover:bg-[#0e625e] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-2">
                <svg *ngIf="!isEvaluating" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                <span *ngIf="!isEvaluating">Calculer le Score & Décision IA</span>
                <span *ngIf="isEvaluating">Évaluation par l'IA en cours...</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODALE DE RÉSULTAT / DÉTAIL DU SCORING IA -->
      <div *ngIf="selectedDetailDossier" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-fade-in max-h-[90vh] overflow-y-auto">
          
          <div class="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div>
              <h2 class="text-base font-bold text-gray-900">Résultat du Scoring IA</h2>
              <p class="text-xs text-gray-500">Dossier de {{ selectedDetailDossier.client.prenom }} {{ selectedDetailDossier.client.nom }}</p>
            </div>
            <button (click)="selectedDetailDossier = null" class="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
              ✕
            </button>
          </div>

          <div class="text-center py-4 bg-gray-50 rounded-xl mb-4 border border-gray-200">
            <span [ngClass]="getStatusBadgeClass(selectedDetailDossier.demande.statut)" class="px-3.5 py-1 rounded-full text-xs font-bold border inline-block mb-2">
              {{ getStatusLabel(selectedDetailDossier.demande.statut) }}
            </span>
            <div class="flex items-center justify-center space-x-2 mt-1">
              <span class="text-3xl font-extrabold" [ngClass]="getScoreColor(selectedDetailDossier.demande.scoreCredit)">
                {{ selectedDetailDossier.demande.scoreCredit || '720' }}
              </span>
              <span class="text-xs text-gray-400 font-mono">/ 900</span>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Probabilité de défaut : <strong>{{ (selectedDetailDossier.demande.scoreRisque || 12.5) | number:'1.1-1' }}%</strong>
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3 text-xs mb-4">
            <div class="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span class="text-gray-400 block">Montant demandé :</span>
              <span class="font-bold text-gray-900 text-sm">{{ selectedDetailDossier.demande.montantDemandeFcfa | number }} FCFA</span>
            </div>
            <div class="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span class="text-gray-400 block">Durée :</span>
              <span class="font-bold text-gray-900 text-sm">{{ selectedDetailDossier.demande.dureeMois }} mois</span>
            </div>
          </div>

          <div class="pt-3 border-t border-gray-100 flex justify-end">
            <button (click)="selectedDetailDossier = null"
              class="px-4 py-2 bg-[#147c76] text-white text-xs font-bold rounded-xl shadow-sm">
              Fermer
            </button>
          </div>
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

  // Modal nouveau crédit
  isNewModalOpen = false;
  clientSearchInput = '';
  selectedClient: Client | null = null;
  isEvaluating = false;
  evaluationError = '';

  selectedDetailDossier: CreditDossierItem | null = null;

  newDemande: DemandeCredit = {
    montantDemandeFcfa: 500000,
    dureeMois: 12,
    revenuMensuelFcfa: 150000,
    chargesMensuellesFcfa: 45000,
    ancienneteCooperativeMois: 24,
    epargneSoldeMoyenFcfa: 180000,
    nombreCreditsAnterieurs: 1,
    possedeMobileMoney: true,
    frequenceTransactionsMmMois: 8,
    objetCredit: 'Commerce / Fonds de roulement',
    garantie: 'Caution solidaire'
  };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.apiService.getClients().subscribe({
      next: (list) => {
        this.clients = list;
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
      error: (err) => console.error('Erreur chargement clients:', err)
    });
  }

  getAccountNumber(c: Client): string {
    if (!c.id) return '001';
    if (c.id < 10) return '00' + c.id;
    if (c.id < 100) return '0' + c.id;
    return c.id.toString();
  }

  get searchedClients(): Client[] {
    const q = this.clientSearchInput.toLowerCase().trim();
    if (!q) return this.clients.slice(0, 6);
    return this.clients.filter(c => {
      const acct = 'cpt-' + this.getAccountNumber(c);
      const rawAcct = this.getAccountNumber(c);
      const idStr = c.id ? c.id.toString() : '';
      return (
        acct.includes(q) ||
        rawAcct.includes(q) ||
        idStr === q ||
        c.nom.toLowerCase().includes(q) ||
        c.prenom.toLowerCase().includes(q) ||
        (c.telephone && c.telephone.includes(q))
      );
    }).slice(0, 8);
  }

  get filteredDossiers(): CreditDossierItem[] {
    const q = this.searchQuery.toLowerCase().trim();
    return this.dossiers.filter(item => {
      const acct = 'cpt-' + this.getAccountNumber(item.client);
      const matchQuery = !q ||
        acct.includes(q) ||
        item.client.nom.toLowerCase().includes(q) ||
        item.client.prenom.toLowerCase().includes(q) ||
        (item.demande.objetCredit && item.demande.objetCredit.toLowerCase().includes(q)) ||
        (item.demande.montantDemandeFcfa && item.demande.montantDemandeFcfa.toString().includes(q));

      const matchStatus = this.selectedStatusFilter === 'ALL' || item.demande.statut === this.selectedStatusFilter;
      return matchQuery && matchStatus;
    });
  }

  openNewCreditModal() {
    this.selectedClient = null;
    this.clientSearchInput = '';
    this.evaluationError = '';
    this.isNewModalOpen = true;
  }

  closeNewModal() {
    this.isNewModalOpen = false;
    this.selectedClient = null;
  }

  selectClient(client: Client) {
    this.selectedClient = client;
    // Auto-remplissage avec valeurs réalistes selon le profil sociétaire
    this.newDemande = {
      montantDemandeFcfa: 500000,
      dureeMois: 12,
      revenuMensuelFcfa: 180000,
      chargesMensuellesFcfa: 55000,
      ancienneteCooperativeMois: client.ancienneteActiviteAnnees ? client.ancienneteActiviteAnnees * 12 : 24,
      epargneSoldeMoyenFcfa: 200000,
      nombreCreditsAnterieurs: 1,
      possedeMobileMoney: true,
      frequenceTransactionsMmMois: 10,
      objetCredit: 'Commerce / Fonds de roulement',
      garantie: 'Caution solidaire'
    };
  }

  submitEvaluation() {
    if (!this.selectedClient || !this.selectedClient.id) {
      this.evaluationError = 'Veuillez sélectionner un sociétaire valide.';
      return;
    }

    this.isEvaluating = true;
    this.evaluationError = '';

    this.apiService.evaluerCredit(this.selectedClient.id, this.newDemande).subscribe({
      next: (result) => {
        this.isEvaluating = false;
        const newDossier: CreditDossierItem = {
          demande: result,
          client: this.selectedClient!
        };
        this.dossiers.unshift(newDossier);
        this.closeNewModal();
        this.selectedDetailDossier = newDossier;
      },
      error: (err) => {
        this.isEvaluating = false;
        this.evaluationError = 'Erreur lors du calcul du score IA. Veuillez réessayer.';
        console.error('Erreur scoring:', err);
      }
    });
  }

  openDetailModal(item: CreditDossierItem) {
    this.selectedDetailDossier = item;
  }

  countStatus(status: string): number {
    return this.dossiers.filter(d => d.demande.statut === status).length;
  }

  getApprovalRate(): number {
    if (this.dossiers.length === 0) return 0;
    const approved = this.countStatus('APPROUVE');
    return Math.round((approved / this.dossiers.length) * 100);
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

  getStatusDotClass(statut?: string): string {
    switch (statut) {
      case 'APPROUVE': return 'bg-emerald-500';
      case 'A_L_ETUDE': return 'bg-amber-500';
      case 'REJETE': return 'bg-red-500';
      default: return 'bg-gray-400';
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
