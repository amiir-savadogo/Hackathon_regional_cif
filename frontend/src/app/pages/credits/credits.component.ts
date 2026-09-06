import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Client, DemandeCredit } from '../../models/client.model';

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

      <!-- En-tête avec bouton vers la nouvelle page d'instruction -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Gestion des Crédits</h1>
          <p class="text-sm text-gray-500 mt-0.5">Dossiers de microcrédit instruits et scorés par le moteur d'IA</p>
        </div>
        <a routerLink="/credits/nouveau"
          class="bg-[#147c76] hover:bg-[#0e625e] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all flex items-center space-x-2 self-start sm:self-auto">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span>Nouveau Crédit</span>
        </a>
      </div>

      <!-- Métriques synthétiques -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p class="text-xs text-gray-500 font-medium uppercase">Total Dossiers</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ dossiers.length }}</p>
          <p class="text-xs text-gray-400 mt-0.5">Dossiers instruits</p>
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
            placeholder="Rechercher par N° CNIB ou Nom..."
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
      <div class="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-x-auto">
        <table class="w-full min-w-[900px] text-left text-sm" *ngIf="filteredDossiers.length > 0">
          <thead class="bg-gray-50/90 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <tr>
              <th class="px-5 py-3.5">Sociétaire (Client)</th>
              <th class="px-5 py-3.5">N° CNIB</th>
              <th class="px-5 py-3.5">Montant & Durée</th>
              <th class="px-5 py-3.5">Objet du prêt</th>
              <th class="px-5 py-3.5">Score IA</th>
              <th class="px-5 py-3.5">Décision</th>
              <th class="px-5 py-3.5">Date</th>
              <th class="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let item of filteredDossiers"
              [routerLink]="['/credits', item.demande.id]"
              class="hover:bg-[#e5f3f1]/40 transition-colors cursor-pointer">
              <td class="px-5 py-3.5">
                <div class="flex items-center space-x-3">
                  <div class="w-9 h-9 rounded-xl bg-[#e5f3f1] text-[#147c76] font-bold text-xs flex items-center justify-center border border-[#b9ded9]">
                    {{ item.client.prenom ? item.client.prenom[0] : '' }}{{ item.client.nom ? item.client.nom[0] : '' }}
                  </div>
                  <div>
                    <div class="flex items-center space-x-2">
                      <span class="font-bold text-gray-900 leading-tight">{{ item.client.prenom }} {{ item.client.nom }}</span>
                      <span class="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#e5f3f1] text-[#147c76] rounded border border-[#b9ded9]">
                        {{ item.client.numeroCompte }}
                      </span>
                    </div>
                    <span class="text-xs text-gray-400 block mt-0.5">{{ item.client.activite }} · {{ item.client.ville }} ({{ item.client.agence }})</span>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3.5">
                <span class="px-2 py-0.5 text-xs font-mono font-bold bg-amber-50 text-amber-900 rounded border border-amber-200 block w-max">
                  CNIB: {{ item.client.numeroCnib }}
                </span>
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
                  <span class="text-[11px] text-gray-400 font-mono">/ 100</span>
                </div>
                <span *ngIf="!item.demande.scoreCredit" class="text-xs text-gray-400">-</span>
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
              <td class="px-5 py-3.5 text-right whitespace-nowrap">
                <span class="px-3 py-1.5 rounded-lg bg-[#e5f3f1] text-[#147c76] text-xs font-semibold inline-flex items-center gap-1">
                  Ouvrir le dossier
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- État vide ou Résultats trouvés dans la base bancaire globale -->
        <div *ngIf="filteredDossiers.length === 0" class="p-8">
          
          <!-- Si la recherche correspond à un sociétaire de la banque mais sans crédit instruit -->
          <div *ngIf="matchedBankSocietaires.length > 0" class="space-y-4 max-w-2xl mx-auto">
            <div class="p-4 bg-emerald-50 rounded-2xl border border-[#7ebcb7] text-left">
              <div class="flex items-center space-x-2 text-[#147c76] font-bold text-sm mb-1">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>Sociétaire identifié dans la base CIF ({{ matchedBankSocietaires.length }} trouvé{{ matchedBankSocietaires.length > 1 ? 's' : '' }})</span>
              </div>
              <p class="text-xs text-gray-600">
                Ce sociétaire est bien enregistré à la banque CIF, mais aucun dossier de microcrédit n'a encore été instruit pour lui.
              </p>
            </div>

            <div *ngFor="let s of matchedBankSocietaires" class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-xl bg-[#147c76] text-white text-xs font-bold flex items-center justify-center">
                  {{ s.prenom[0] }}{{ s.nom[0] }}
                </div>
                <div class="text-left">
                  <div class="flex items-center space-x-2">
                    <p class="text-sm font-bold text-gray-900">{{ s.prenom }} {{ s.nom }}</p>
                    <span class="px-2 py-0.5 text-xs font-mono font-bold bg-amber-50 text-amber-900 rounded border border-amber-200">
                      CNIB: {{ s.numeroCnib }}
                    </span>
                    <span class="px-2 py-0.5 text-xs font-mono font-bold bg-[#e5f3f1] text-[#147c76] rounded border border-[#b9ded9]">
                      {{ s.numeroCompte }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-500 mt-0.5">
                    {{ s.secteurActivite }} · {{ s.ville }} · Solde épargne: {{ s.soldeEpargneActuelFcfa | number }} FCFA
                  </p>
                </div>
              </div>
              <a [routerLink]="['/credits/nouveau']" [queryParams]="{ id: s.id, cnib: s.numeroCnib }"
                class="px-4 py-2 bg-[#147c76] hover:bg-[#0e625e] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1">
                <span>+ Instruire ce Crédit</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </a>
            </div>
          </div>

          <!-- Si aucun résultat du tout -->
          <div *ngIf="matchedBankSocietaires.length === 0" class="text-center py-12">
            <div class="w-16 h-16 bg-[#e5f3f1] text-[#147c76] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <h3 class="text-base font-bold text-gray-900 mb-1">
              {{ searchQuery ? 'Aucun dossier ni sociétaire correspondant' : 'Aucun dossier de crédit instruit' }}
            </h3>
            <p class="text-xs text-gray-500 mb-5 max-w-sm mx-auto">
              Pour évaluer et octroyer un nouveau prêt, cliquez sur « Nouveau Crédit », recherchez le sociétaire par son numéro CNIB et lancez l'instruction IA.
            </p>
            <a routerLink="/credits/nouveau"
              class="inline-flex items-center gap-2 bg-[#147c76] hover:bg-[#0e625e] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              <span>+ Nouveau Crédit</span>
            </a>
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

  ngOnInit() {
    this.loadData();
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

  // Score de solvabilité 0-100, couleurs alignées sur les zones de décision.
  getScoreColor(score?: number): string {
    if (score === null || score === undefined) return 'text-gray-700';
    if (score > 81) return 'text-emerald-600';
    if (score > 56) return 'text-amber-600';
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
