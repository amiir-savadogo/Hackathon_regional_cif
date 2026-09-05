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
    <div class="space-y-6 max-w-5xl mx-auto pb-12">

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
          <span class="text-gray-800 font-semibold">Nouvelle Demande & Instruction IA</span>
        </nav>

        <a routerLink="/credits" class="inline-flex items-center text-xs font-bold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Retour aux Crédits
        </a>
      </div>

      <!-- En-tête de la page -->
      <div class="bg-gradient-to-r from-[#147c76] to-[#0e625e] rounded-2xl p-6 text-white shadow-lg">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center text-white backdrop-blur-sm">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          </div>
          <div>
            <h1 class="text-xl font-bold tracking-tight">Instruction d'un Dossier de Microcrédit</h1>
            <p class="text-xs text-emerald-100 mt-0.5">Recherchez le sociétaire dans la base CIF par son numéro CNIB pour pré-charger son profil bancaire et lancer l'évaluation IA.</p>
          </div>
        </div>
      </div>

      <!-- ÉTAPE 1 : RECHERCHE DU SOCIÉTAIRE PAR CNIB -->
      <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span class="w-6 h-6 rounded-full bg-[#147c76] text-white text-xs flex items-center justify-center font-bold">1</span>
          Rechercher le Sociétaire par N° de Pièce (CNIB) *
        </h2>
        
        <div class="relative" *ngIf="!selectedClient">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#147c76]">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <input type="text" [(ngModel)]="searchQuery"
            placeholder="Entrez le numéro CNIB du sociétaire (ex: B10849201) ou son nom..."
            class="w-full pl-11 pr-4 py-3 border-2 border-[#147c76]/50 rounded-xl text-sm focus:outline-none focus:border-[#147c76] bg-emerald-50/20 font-medium shadow-sm" />

          <!-- Résultats de recherche -->
          <div class="mt-3 border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white shadow-lg max-h-64 overflow-y-auto">
            <div *ngFor="let c of searchedClients" (click)="selectClient(c)"
              class="p-3.5 hover:bg-[#e5f3f1] cursor-pointer flex items-center justify-between transition-colors">
              <div class="flex items-center space-x-3.5">
                <div class="w-10 h-10 rounded-xl bg-[#147c76] text-white text-xs font-bold flex items-center justify-center shadow-sm">
                  {{ c.prenom[0] }}{{ c.nom[0] }}
                </div>
                <div>
                  <div class="flex items-center space-x-2">
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
              <span class="text-xs font-bold text-[#147c76] px-3 py-1.5 bg-white border border-[#b9ded9] rounded-lg shadow-sm">
                Sélectionner ce sociétaire →
              </span>
            </div>
            <div *ngIf="searchedClients.length === 0" class="p-4 text-center text-xs text-gray-400">
              Aucun sociétaire trouvé pour cette recherche dans la base CIF (1 000 sociétaires).
            </div>
          </div>
        </div>

        <!-- Fiche sociétaire sélectionné (Profil KYC & Bancaire complet extrait de la base) -->
        <div *ngIf="selectedClient" class="bg-[#f0f7f6] border border-[#7ebcb7] rounded-2xl p-5 shadow-sm space-y-4">
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-4">
              <div class="w-14 h-14 rounded-2xl bg-[#147c76] text-white font-bold text-lg flex items-center justify-center shadow">
                {{ selectedClient.prenom[0] }}{{ selectedClient.nom[0] }}
              </div>
              <div>
                <div class="flex items-center space-x-2 flex-wrap gap-y-1">
                  <h3 class="text-lg font-bold text-gray-900">{{ selectedClient.prenom }} {{ selectedClient.nom }}</h3>
                  <span class="px-2.5 py-0.5 text-xs font-mono font-bold rounded bg-amber-100 text-amber-900 border border-amber-300">
                    CNIB: {{ selectedClient.numeroCnib }} (Exp: {{ selectedClient.dateExpirationCnib }})
                  </span>
                  <span class="px-2.5 py-0.5 text-xs font-bold rounded-full"
                    [ngClass]="selectedClient.statutCompte === 'Actif' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'">
                    Compte {{ selectedClient.statutCompte }}
                  </span>
                </div>
                <p class="text-xs text-gray-600 mt-1">
                  {{ selectedClient.age }} ans · {{ selectedClient.sexe }} · {{ selectedClient.situationMatrimoniale }} ({{ selectedClient.nombrePersonnesACharge }} pers. à charge) · Éducation: {{ selectedClient.niveauEducation }} · {{ selectedClient.telephone }}
                </p>
                <p class="text-xs text-gray-500 mt-0.5">
                  {{ selectedClient.adresse }} · {{ selectedClient.ville }} ({{ selectedClient.region }}, {{ selectedClient.pays }}) · Logement : <strong>{{ selectedClient.typeLogement }}</strong>
                </p>
              </div>
            </div>
            <button type="button" (click)="selectedClient = null"
              class="text-xs text-gray-500 hover:text-red-600 font-semibold underline px-2 py-1">
              Changer de sociétaire
            </button>
          </div>

          <!-- Attributs bancaires extraits directement de la base CIF -->
          <div class="pt-3 border-t border-[#c5e4e0] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div class="bg-white rounded-xl p-3 border border-[#d2eae7]">
              <span class="text-gray-500 block">N° Compte & Agence :</span>
              <span class="font-bold text-gray-800 text-sm">{{ selectedClient.numeroCompte }}</span>
              <span class="text-[11px] text-gray-500 block">{{ selectedClient.agence }}</span>
              <span class="text-[10px] text-[#147c76] font-medium block">{{ selectedClient.typeCompte }}</span>
            </div>
            <div class="bg-white rounded-xl p-3 border border-[#d2eae7]">
              <span class="text-gray-500 block">Solde Épargne Actuel :</span>
              <span class="font-bold text-[#147c76] text-sm">{{ selectedClient.soldeEpargneActuelFcfa | number }} FCFA</span>
              <span class="text-[11px] text-gray-400 block">Adhésion : {{ selectedClient.dateCreation }} ({{ selectedClient.ancienneteCooperativeMois }} mois)</span>
            </div>
            <div class="bg-white rounded-xl p-3 border border-[#d2eae7]">
              <span class="text-gray-500 block">Activité Professionnelle :</span>
              <span class="font-bold text-gray-800">{{ selectedClient.activite }}</span>
              <span class="text-[11px] text-gray-500 block">Secteur {{ selectedClient.secteurActivite }} ({{ selectedClient.ancienneteActiviteAnnees }} ans d'expérience)</span>
            </div>
            <div class="bg-white rounded-xl p-3 border border-[#d2eae7]">
              <span class="text-gray-500 block">Parts Sociales CIF :</span>
              <span class="font-bold text-[#147c76] text-sm">{{ selectedClient.partsSocialesFcfa | number }} FCFA</span>
              <span class="text-[11px] text-gray-500 block">Revenu : {{ selectedClient.revenuMensuelFcfa | number }} FCFA / mois</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ÉTAPE 2 : PARAMÈTRES DU CRÉDIT & DONNÉES PRÉ-REMPLIES -->
      <div *ngIf="selectedClient" class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span class="w-6 h-6 rounded-full bg-[#147c76] text-white text-xs flex items-center justify-center font-bold">2</span>
          Paramètres du Prêt Sollicité & Données Financières
        </h2>

        <form (ngSubmit)="submitEvaluation()" class="space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Montant Sollicité (FCFA) *</label>
              <input type="number" [(ngModel)]="demande.montantDemandeFcfa" name="montant" required min="50000" step="10000"
                class="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-base font-bold text-gray-900 focus:outline-none focus:border-[#147c76] bg-gray-50/50" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Durée du Remboursement (mois) *</label>
              <input type="number" [(ngModel)]="demande.dureeMois" name="duree" required min="1" max="48"
                class="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-base font-bold text-gray-900 focus:outline-none focus:border-[#147c76] bg-gray-50/50" />
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

          <!-- Bouton d'action -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <a routerLink="/credits" class="px-5 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-800">
              Annuler
            </a>
            <button type="submit" [disabled]="isEvaluating"
              class="bg-[#147c76] hover:bg-[#0e625e] text-white text-sm font-bold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
              <svg *ngIf="!isEvaluating" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              <svg *ngIf="isEvaluating" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              <span>{{ isEvaluating ? 'Calcul du Score IA en cours...' : 'Calculer le Score & Instruire le Dossier' }}</span>
            </button>
          </div>
        </form>
      </div>

      <!-- ÉTAPE 3 : RÉSULTAT DU SCORING IA & DÉCISION -->
      <div *ngIf="evaluationResult" class="bg-white rounded-2xl border-2 border-[#147c76] p-6 shadow-xl animate-fade-in space-y-5">
        <div class="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h2 class="text-base font-bold text-gray-900">Résultat de l'Évaluation du Scoring IA</h2>
            <p class="text-xs text-gray-500">Dossier instruit pour {{ selectedClient?.prenom }} {{ selectedClient?.nom }}</p>
          </div>
          <span [ngClass]="getStatusBadgeClass(evaluationResult.statut)" class="px-3.5 py-1.5 rounded-full text-xs font-bold border">
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
            <p class="text-xs text-gray-500 font-medium">Montant Octroyable</p>
            <p class="text-2xl font-extrabold text-[#147c76] mt-1">
              {{ evaluationResult.montantDemandeFcfa | number }} FCFA
            </p>
          </div>
        </div>

        <!-- Bouton final pour revenir et voir dans la table -->
        <div class="pt-4 border-t border-gray-100 flex items-center justify-between">
          <p class="text-xs text-emerald-700 font-semibold">
            ✓ Le dossier a été enregistré avec succès et ajouté au tableau des crédits.
          </p>
          <a routerLink="/credits" class="px-6 py-2.5 bg-[#147c76] hover:bg-[#0e625e] text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5">
            <span>Voir la Liste des Crédits</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </a>
        </div>
      </div>

    </div>
  `
})
export class CreditFormComponent implements OnInit {
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

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

  getAccountNumber(c: Client): string {
    if (!c.id) return '001';
    if (c.id < 10) return '00' + c.id;
    if (c.id < 100) return '0' + c.id;
    return c.id.toString();
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
      default: return statut || 'En attente';
    }
  }
}
