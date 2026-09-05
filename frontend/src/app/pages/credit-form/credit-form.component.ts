import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Client, DemandeCredit, FacteurExplicatif } from '../../models/client.model';

@Component({
  selector: 'app-credit-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto">
      <!-- Fil d'Ariane -->
      <nav class="flex items-center space-x-2 text-xs font-medium text-gray-500 mb-6 bg-white px-4 py-2.5 rounded-xl border border-gray-200/80 shadow-sm overflow-x-auto" aria-label="Breadcrumb">
        <a routerLink="/dashboard" class="inline-flex items-center text-gray-500 hover:text-blue-700 transition-colors whitespace-nowrap">
          <svg class="w-3.5 h-3.5 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
          Accueil
        </a>
        <svg class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        <a routerLink="/clients" class="inline-flex items-center text-gray-500 hover:text-blue-700 transition-colors whitespace-nowrap">
          <svg class="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          Clients
        </a>
        <svg class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        <a *ngIf="client" routerLink="/clients" class="inline-flex items-center text-gray-700 hover:text-blue-700 transition-colors font-semibold whitespace-nowrap">
          {{ client.prenom }} {{ client.nom }}
        </a>
        <svg *ngIf="client" class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
          <svg class="w-3 h-3 mr-1 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          Demande de crédit
        </span>
      </nav>

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
                <div><span class="text-gray-500">Sexe / Zone :</span> <span class="font-semibold text-gray-900">{{ client.sexe || '—' }} · {{ client.zone || '—' }}</span></div>
                <div><span class="text-gray-500">Secteur :</span> <span class="font-semibold text-gray-900">{{ client.secteurActivite || 'Non renseigné' }}</span></div>
                <div><span class="text-gray-500">Ancienneté activité :</span> <span class="font-semibold text-gray-900">{{ client.ancienneteActiviteAnnees }} an(s)</span></div>
                <div><span class="text-gray-500">Personnes à charge :</span> <span class="font-semibold text-gray-900">{{ client.nombrePersonnesACharge ?? 0 }}</span></div>
              </div>
            </div>
          </div>

          <!-- Formulaire de la demande -->
          <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div *ngIf="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {{ errorMessage }}
            </div>

            <form (ngSubmit)="soumettre()" class="space-y-6">

              <!-- SECTION : Finances -->
              <div>
                <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 pb-2 border-b border-gray-100">Informations financières</h2>
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
                </div>
              </div>

              <!-- SECTION : Relation coopérative -->
              <div>
                <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 pb-2 border-b border-gray-100">Relation avec la coopérative</h2>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Ancienneté coopérative (mois)</label>
                    <input type="number" [(ngModel)]="demande.ancienneteCooperativeMois" name="ancienneteCooperativeMois" min="0"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div class="flex items-center pt-6">
                    <label class="flex items-center space-x-2 text-sm text-gray-700">
                      <input type="checkbox" [(ngModel)]="demande.membreGroupeSolidaire" name="membreGroupeSolidaire"
                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span>Membre d'un groupe de caution solidaire</span>
                    </label>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Solde moyen d'épargne (FCFA)</label>
                    <input type="number" [(ngModel)]="demande.epargneSoldeMoyenFcfa" name="epargneSoldeMoyenFcfa" min="0" step="1000"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Régularité de l'épargne</label>
                    <select [(ngModel)]="demande.regulariteEpargne" name="regulariteEpargne"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option>Aucune épargne</option>
                      <option>Irrégulière</option>
                      <option>Régulière</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- SECTION : Historique de crédit -->
              <div>
                <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 pb-2 border-b border-gray-100">Historique de crédit interne</h2>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de crédits antérieurs</label>
                    <input type="number" [(ngModel)]="demande.nombreCreditsAnterieurs" name="nombreCreditsAnterieurs" min="0"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div></div>
                  <div *ngIf="(demande.nombreCreditsAnterieurs || 0) > 0">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Taux de remboursement historique (%)</label>
                    <input type="number" [(ngModel)]="demande.tauxRemboursementHistoriquePct" name="tauxRemboursementHistoriquePct" min="0" max="100"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div *ngIf="(demande.nombreCreditsAnterieurs || 0) > 0">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Jours de retard moyen</label>
                    <input type="number" [(ngModel)]="demande.joursRetardMoyenHistorique" name="joursRetardMoyenHistorique" min="0"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <p *ngIf="(demande.nombreCreditsAnterieurs || 0) === 0" class="text-xs text-gray-400 col-span-2">
                    Nouveau client dans la coopérative : aucun historique de remboursement à saisir.
                  </p>
                </div>
              </div>

              <!-- SECTION : Mobile Money -->
              <div>
                <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 pb-2 border-b border-gray-100">Mobile Money</h2>
                <div class="grid grid-cols-2 gap-4">
                  <div class="flex items-center">
                    <label class="flex items-center space-x-2 text-sm text-gray-700">
                      <input type="checkbox" [(ngModel)]="demande.possedeMobileMoney" name="possedeMobileMoney"
                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span>Possède un compte Mobile Money</span>
                    </label>
                  </div>
                  <div *ngIf="demande.possedeMobileMoney">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Transactions Mobile Money / mois</label>
                    <input type="number" [(ngModel)]="demande.frequenceTransactionsMmMois" name="frequenceTransactionsMmMois" min="0"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              <!-- SECTION : Bureau d'Information sur le Crédit (BIC) -->
              <div>
                <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 pb-2 border-b border-gray-100">
                  Bureau d'Information sur le Crédit (BIC — dispositif régional UEMOA)
                </h2>
                <div class="grid grid-cols-2 gap-4">
                  <div class="flex items-center">
                    <label class="flex items-center space-x-2 text-sm text-gray-700">
                      <input type="checkbox" [(ngModel)]="demande.interrogeBic" name="interrogeBic"
                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span>Dossier interrogé au BIC</span>
                    </label>
                  </div>
                  <div *ngIf="demande.interrogeBic">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Statut BIC</label>
                    <select [(ngModel)]="demande.statutBic" name="statutBic"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option>Non consulté</option>
                      <option>Bon payeur ailleurs (solde sans incident)</option>
                      <option>Incident de paiement signalé</option>
                      <option>Aucun antécédent trouvé</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Prêts actifs dans d'autres institutions</label>
                    <input type="number" [(ngModel)]="demande.nombrePretsActifsAutresInstitutions" name="nombrePretsActifsAutresInstitutions" min="0"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Encours crédit autres institutions (FCFA)</label>
                    <input type="number" [(ngModel)]="demande.encoursCreditAutresInstitutionsFcfa" name="encoursCreditAutresInstitutionsFcfa" min="0" step="1000"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              <!-- SECTION : Demande de crédit -->
              <div>
                <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 pb-2 border-b border-gray-100">Caractéristiques de la demande</h2>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Objet du crédit *</label>
                    <select [(ngModel)]="demande.objetCredit" name="objetCredit" required
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="">-- Sélectionner --</option>
                      <option>Fonds de commerce</option>
                      <option>Achat d'équipement</option>
                      <option>Intrants agricoles</option>
                      <option>Élevage</option>
                      <option>Besoin de trésorerie</option>
                      <option>Événement familial</option>
                      <option>Autre</option>
                    </select>
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
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Garantie proposée *</label>
                    <select [(ngModel)]="demande.garantie" name="garantie" required
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="">-- Sélectionner --</option>
                      <option>Caution solidaire</option>
                      <option>Bien matériel</option>
                      <option>Aval d'un tiers</option>
                      <option>Aucune</option>
                    </select>
                  </div>
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
                  <span class="text-gray-600">Ratio d'endettement estimé</span>
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
                  class="w-full bg-[#147c76] hover:bg-[#0e625e] disabled:opacity-50 text-white font-semibold py-3 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2">
                  <svg *ngIf="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>{{ loading ? "Analyse IA en cours..." : "Soumettre au moteur d'analyse IA" }}</span>
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
                <p class="text-xs text-gray-500 mt-1">Régression Logistique — modèle Samdé</p>
              </div>

              <!-- Badge de zone de décision (3 niveaux) -->
              <div class="flex justify-center">
                <span class="px-4 py-1.5 text-sm font-bold rounded-full uppercase tracking-wider"
                  [ngClass]="{
                    'bg-green-100 text-green-800': resultat.statut === 'APPROUVE',
                    'bg-orange-100 text-orange-800': resultat.statut === 'A_L_ETUDE',
                    'bg-red-100 text-red-800': resultat.statut === 'REJETE'
                  }">
                  {{ resultat.statut === 'APPROUVE' ? '✓ Accord favorable' :
                     resultat.statut === 'REJETE' ? '✕ Risque élevé' : "⏳ À examiner" }}
                </span>
              </div>

              <!-- Scorecard 300-900 -->
              <div class="grid grid-cols-2 gap-3 text-center" *ngIf="resultat.scoreCredit">
                <div class="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <p class="text-[10px] text-gray-500 uppercase font-medium">Score crédit</p>
                  <p class="text-lg font-bold text-gray-900">{{ resultat.scoreCredit }}<span class="text-xs text-gray-400 font-normal"> /900</span></p>
                </div>
                <div class="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <p class="text-[10px] text-gray-500 uppercase font-medium">Perte attendue</p>
                  <p class="text-lg font-bold text-gray-900">{{ resultat.perteAttendueFcfa | number:'1.0-0' }}</p>
                  <p class="text-[10px] text-gray-400">FCFA</p>
                </div>
              </div>

              <!-- Facteurs explicatifs SHAP -->
              <div *ngIf="explication.length > 0">
                <p class="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Facteurs les plus influents</p>
                <div class="space-y-1.5">
                  <div *ngFor="let f of explication" class="flex items-center justify-between text-xs">
                    <span class="text-gray-600 truncate pr-2">{{ formatFacteur(f.variable) }}</span>
                    <span class="font-semibold flex-shrink-0" [ngClass]="f.sens === 'AUGMENTE_RISQUE' ? 'text-red-600' : 'text-green-700'">
                      {{ f.sens === 'AUGMENTE_RISQUE' ? '▲ Augmente' : '▼ Réduit' }}
                    </span>
                  </div>
                </div>
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
  demande: DemandeCredit = {
    revenuMensuelFcfa: 0,
    chargesMensuellesFcfa: 0,
    ancienneteCooperativeMois: 0,
    membreGroupeSolidaire: false,
    epargneSoldeMoyenFcfa: 0,
    regulariteEpargne: 'Aucune épargne',
    nombreCreditsAnterieurs: 0,
    tauxRemboursementHistoriquePct: null,
    joursRetardMoyenHistorique: null,
    possedeMobileMoney: false,
    frequenceTransactionsMmMois: 0,
    interrogeBic: false,
    statutBic: 'Non consulté',
    nombrePretsActifsAutresInstitutions: 0,
    encoursCreditAutresInstitutionsFcfa: 0,
    objetCredit: '',
    montantDemandeFcfa: 0,
    dureeMois: 12,
    garantie: ''
  };
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

  get explication(): FacteurExplicatif[] {
    if (!this.resultat?.explicationJson) return [];
    try {
      return JSON.parse(this.resultat.explicationJson) as FacteurExplicatif[];
    } catch {
      return [];
    }
  }

  // Traduit les noms techniques de variables (encodées one-hot côté modèle) en libellés lisibles
  formatFacteur(variable: string): string {
    return variable
      .replace(/_/g, ' ')
      .replace(/^(statut bic|regularite epargne|secteur activite|garantie|objet credit|zone|sexe|situation matrimoniale|niveau education)\s+/i, '')
      .trim();
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
    // !value ne détecte pas les montants négatifs (un nombre négatif est
    // "truthy" en JavaScript) : vérification explicite du signe, cohérente
    // avec les contraintes @Positive/@PositiveOrZero côté backend (DemandeCredit.java).
    if (this.demande.revenuMensuelFcfa <= 0 || this.demande.montantDemandeFcfa <= 0) {
      this.errorMessage = 'Le revenu et le montant demandé doivent être des valeurs positives.';
      return;
    }
    if (this.demande.chargesMensuellesFcfa != null && this.demande.chargesMensuellesFcfa < 0) {
      this.errorMessage = 'Les charges mensuelles ne peuvent pas être négatives.';
      return;
    }
    if (!this.demande.objetCredit || !this.demande.garantie) {
      this.errorMessage = "Veuillez préciser l'objet du crédit et la garantie proposée.";
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
      error: (err) => {
        this.loading = false;
        if (err.status === 400 && err.error?.champs) {
          // Erreurs de validation renvoyées par le backend (GlobalExceptionHandler) :
          // filet de sécurité si les contrôles ci-dessus ont été contournés.
          this.errorMessage = Object.values(err.error.champs).join(' ');
        } else {
          this.errorMessage = 'Erreur de communication. Vérifiez que Spring Boot et le moteur IA sont allumés.';
        }
      }
    });
  }
}
