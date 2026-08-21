import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Client, DemandeCredit } from '../../models/client.model';

@Component({
  selector: 'app-credit-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto">

      <!-- Fil d'Ariane -->
      <div class="flex items-center space-x-2 text-sm text-gray-500 mb-6">
        <a routerLink="/clients" class="hover:text-blue-700">Clients</a>
        <span>/</span>
        <span *ngIf="client" class="hover:text-blue-700 cursor-pointer">{{ client.prenom }} {{ client.nom }}</span>
        <span>/</span>
        <span class="text-gray-800 font-medium">Demande de crédit</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- COLONNE GAUCHE : Infos client & Formulaire -->
        <div class="lg:col-span-2 space-y-5">

          <!-- Fiche client (en lecture seule) -->
          <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5" *ngIf="client">
            <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Dossier client</h2>
            <div class="flex items-start space-x-4">
              <div class="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold text-lg flex-shrink-0">
                {{ client.prenom[0] }}{{ client.nom[0] }}
              </div>
              <div class="flex-1 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <div><span class="text-gray-500">Nom complet :</span> <span class="font-semibold text-gray-900">{{ client.prenom }} {{ client.nom }}</span></div>
                <div><span class="text-gray-500">Âge :</span> <span class="font-semibold text-gray-900">{{ client.age }} ans</span></div>
                <div><span class="text-gray-500">Secteur :</span> <span class="font-semibold text-gray-900">{{ client.secteurActivite || 'Non renseigné' }}</span></div>
                <div><span class="text-gray-500">Ancienneté :</span> <span class="font-semibold text-gray-900">{{ client.ancienneteActiviteAnnees }} an(s)</span></div>
              </div>
            </div>
          </div>

          <!-- Formulaire de la demande -->
          <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">Informations financières de la demande</h2>

            <div *ngIf="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {{ errorMessage }}
            </div>

            <form (ngSubmit)="soumettre()" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Revenu mensuel (FCFA) *</label>
                  <input type="number" [(ngModel)]="demande.revenuMensuelFcfa" name="revenu" required step="5000" min="0"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Charges mensuelles (FCFA) *</label>
                  <input type="number" [(ngModel)]="demande.chargesMensuellesFcfa" name="charges" required step="5000" min="0"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Montant demandé (FCFA) *</label>
                  <input type="number" [(ngModel)]="demande.montantDemandeFcfa" name="montant" required step="10000" min="0"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Durée souhaitée (mois) *</label>
                  <select [(ngModel)]="demande.dureeMois" name="duree"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option [value]="3">3 mois</option>
                    <option [value]="6">6 mois</option>
                    <option [value]="9">9 mois</option>
                    <option [value]="12">12 mois</option>
                    <option [value]="18">18 mois</option>
                    <option [value]="24">24 mois</option>
                    <option [value]="36">36 mois</option>
                  </select>
                </div>
              </div>

              <!-- Indicateurs financiers instantanés -->
              <div class="p-3.5 bg-gray-50 rounded-lg border border-gray-200 text-sm space-y-1.5" *ngIf="demande.revenuMensuelFcfa > 0">
                <div class="flex justify-between">
                  <span class="text-gray-600">Reste à vivre estimé</span>
                  <span class="font-semibold" [ngClass]="resteAVivre > 50000 ? 'text-green-700' : 'text-red-600'">
                    {{ resteAVivre | number:'1.0-0' }} FCFA/mois
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Ratio d'endettement actuel</span>
                  <span class="font-semibold" [ngClass]="ratio <= 40 ? 'text-green-700' : ratio <= 65 ? 'text-orange-600' : 'text-red-600'">
                    {{ ratio }}%
                  </span>
                </div>
                <div class="flex justify-between" *ngIf="mensualiteEstimee > 0">
                  <span class="text-gray-600">Mensualité estimée (taux 12%)</span>
                  <span class="font-semibold text-gray-800">{{ mensualiteEstimee | number:'1.0-0' }} FCFA</span>
                </div>
              </div>

              <div class="pt-2">
                <button type="submit" [disabled]="loading"
                  class="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold py-3 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2">
                  <svg *ngIf="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>{{ loading ? 'Analyse IA en cours...' : 'Soumettre au moteur d\'analyse IA' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- COLONNE DROITE : Résultat & Historique -->
        <div class="space-y-5">

          <!-- Résultat de la dernière analyse -->
          <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Décision IA</h2>

            <div *ngIf="!resultat && !loading" class="text-center py-6">
              <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <p class="text-sm text-gray-500">En attente de soumission</p>
            </div>

            <div *ngIf="loading" class="text-center py-6">
              <svg class="animate-spin w-8 h-8 text-blue-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <p class="text-sm text-gray-500">Analyse en cours...</p>
            </div>

            <div *ngIf="resultat && !loading" class="space-y-4">
              <!-- Score numérique -->
              <div class="text-center p-4 rounded-lg"
                [ngClass]="{
                  'bg-green-50 border border-green-200': resultat.statut === 'APPROUVE',
                  'bg-orange-50 border border-orange-200': resultat.statut === 'A_L_ETUDE',
                  'bg-red-50 border border-red-200': resultat.statut === 'REJETE'
                }">
                <p class="text-xs font-medium text-gray-500 mb-1">Probabilité de défaut</p>
                <p class="text-4xl font-black"
                  [ngClass]="{
                    'text-green-700': resultat.statut === 'APPROUVE',
                    'text-orange-600': resultat.statut === 'A_L_ETUDE',
                    'text-red-700': resultat.statut === 'REJETE'
                  }">
                  {{ resultat.scoreRisque | number:'1.2-2' }}%
                </p>
                <p class="text-xs text-gray-500 mt-1">Calculé par XGBoost (88.6% de précision)</p>
              </div>

              <!-- Badge de décision -->
              <div class="flex justify-center">
                <span class="px-4 py-1.5 text-sm font-bold rounded-full uppercase tracking-wider"
                  [ngClass]="{
                    'bg-green-100 text-green-800': resultat.statut === 'APPROUVE',
                    'bg-orange-100 text-orange-800': resultat.statut === 'A_L_ETUDE',
                    'bg-red-100 text-red-800': resultat.statut === 'REJETE'
                  }">
                  {{ resultat.statut === 'APPROUVE' ? '✓ Crédit Approuvé' :
                     resultat.statut === 'REJETE' ? '✕ Crédit Rejeté' : '⏳ Dossier À l\'Étude' }}
                </span>
              </div>

              <p class="text-xs text-gray-500 text-center">
                Dossier #{{ resultat.id }} enregistré le {{ resultat.dateCreation | date:'dd/MM/yyyy à HH:mm' }}
              </p>
            </div>
          </div>

          <!-- Historique des demandes du client -->
          <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Historique des demandes</h2>
            <div *ngIf="historique.length === 0" class="text-sm text-gray-400 text-center py-4">Aucune demande antérieure.</div>
            <div class="space-y-2">
              <div *ngFor="let d of historique" class="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs">
                <div>
                  <p class="font-semibold text-gray-800">{{ d.montantDemandeFcfa | number:'1.0-0' }} FCFA</p>
                  <p class="text-gray-400">{{ d.dateCreation | date:'dd/MM/yy' }} · {{ d.dureeMois }}  mois</p>
                </div>
                <span class="px-2 py-0.5 rounded-full font-bold text-[10px] uppercase"
                  [ngClass]="{
                    'bg-green-100 text-green-700': d.statut === 'APPROUVE',
                    'bg-orange-100 text-orange-700': d.statut === 'A_L_ETUDE',
                    'bg-red-100 text-red-700': d.statut === 'REJETE'
                  }">
                  {{ d.statut }}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class CreditFormComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  clientId!: number;
  client: Client | null = null;
  demande: DemandeCredit = { revenuMensuelFcfa: 0, chargesMensuellesFcfa: 0, montantDemandeFcfa: 0, dureeMois: 12 };
  resultat: DemandeCredit | null = null;
  historique: DemandeCredit[] = [];
  loading = false;
  errorMessage = '';

  get resteAVivre(): number {
    return Math.max(0, (this.demande.revenuMensuelFcfa || 0) - (this.demande.chargesMensuellesFcfa || 0));
  }

  get ratio(): number {
    if (!this.demande.revenuMensuelFcfa || this.demande.revenuMensuelFcfa <= 0) return 0;
    return Math.round((this.demande.chargesMensuellesFcfa / this.demande.revenuMensuelFcfa) * 100);
  }

  get mensualiteEstimee(): number {
    if (!this.demande.montantDemandeFcfa || !this.demande.dureeMois) return 0;
    return Math.round((this.demande.montantDemandeFcfa * 1.12) / this.demande.dureeMois);
  }

  ngOnInit() {
    this.clientId = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getClient(this.clientId).subscribe({ next: (c: Client) => this.client = c });
    this.chargerHistorique();
  }

  chargerHistorique() {
    this.api.getDemandes(this.clientId).subscribe({ next: (d: DemandeCredit[]) => this.historique = d });
  }

  soumettre() {
    if (!this.demande.revenuMensuelFcfa || !this.demande.montantDemandeFcfa) {
      this.errorMessage = 'Veuillez renseigner le revenu et le montant demandé.';
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.api.evaluerCredit(this.clientId, this.demande).subscribe({
      next: (res: DemandeCredit) => {
        this.resultat = res;
        this.loading = false;
        this.chargerHistorique();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Erreur de communication. Vérifiez que Spring Boot et le moteur IA sont allumés.';
      }
    });
  }
}
