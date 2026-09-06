import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Client, DemandeCredit, FacteurExplicatif } from '../../models/client.model';

/**
 * EvaluationDetailComponent - page dédiée d'une évaluation passée (/credits/:id).
 *
 * Affiche l'intégralité d'un dossier déjà scoré : la demande instruite, le
 * résultat du moteur (score, proba, zone, ratios) et l'explication SHAP.
 * Le bouton "Refaire cette évaluation" ré-ouvre le formulaire d'instruction
 * pré-rempli avec les mêmes données (l'évaluation d'origine reste en base).
 */
@Component({
  selector: 'app-evaluation-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto space-y-5 pb-16">

      <nav class="flex items-center gap-2 text-xs font-medium text-gray-500 bg-white px-4 py-2.5 rounded-xl border border-gray-200/80 shadow-sm">
        <a routerLink="/credits" class="text-[#147c76] font-semibold hover:underline">Crédits</a>
        <span class="text-gray-300">/</span>
        <span class="text-gray-800 font-semibold">Évaluation n°{{ demandeId }}</span>
      </nav>

      <div *ngIf="loading" class="p-10 text-center text-sm text-gray-400">Chargement…</div>

      <div *ngIf="!loading && !demande" class="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-3">
        <p class="text-sm text-gray-600">Cette évaluation est introuvable.</p>
        <a routerLink="/credits" class="inline-block px-4 py-2 bg-[#147c76] text-white text-xs font-bold rounded-xl">← Retour à la liste</a>
      </div>

      <ng-container *ngIf="!loading && demande">

        <!-- En-tête -->
        <div class="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span class="text-xs font-bold text-[#147c76] uppercase tracking-wider">Résultat de l'évaluation</span>
            <h1 class="text-xl font-bold text-gray-900">{{ client?.prenom }} {{ client?.nom }}</h1>
            <p class="text-xs text-gray-400 mt-0.5">
              CNIB {{ client?.numeroCnib || '-' }} · évaluée le {{ demande.dateCreation ? (demande.dateCreation | date:'dd/MM/yyyy HH:mm') : '-' }}
            </p>
          </div>
          <span [ngClass]="badgeClass(demande.statut)" class="px-4 py-2 rounded-full text-xs font-bold border self-start">{{ statutLabel(demande.statut) }}</span>
        </div>

        <div *ngIf="demande.noteDecision" class="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs">
          <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span><strong>Règle métier appliquée.</strong> {{ demande.noteDecision }}</span>
        </div>

        <!-- Résultat -->
        <div class="bg-white rounded-2xl border-2 border-[#147c76]/30 p-6 shadow-sm space-y-5">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p class="text-[11px] text-gray-500">Score CIF</p>
              <p class="text-3xl font-extrabold mt-1" [ngClass]="scoreColor(demande.scoreCredit)">{{ demande.scoreCredit ?? '-' }}<span class="text-xs text-gray-400 font-normal"> / 100</span></p>
            </div>
            <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p class="text-[11px] text-gray-500">Proba. de défaut</p>
              <p class="text-3xl font-extrabold text-gray-900 mt-1">{{ (demande.scoreRisque || 0) | number:'1.1-1' }}%</p>
            </div>
            <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p class="text-[11px] text-gray-500">Échéance / mois</p>
              <p class="text-lg font-extrabold text-gray-900 mt-2">{{ demande.futureEcheanceCreditFcfa || 0 | number:'1.0-0' }} F</p>
            </div>
            <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p class="text-[11px] text-gray-500">Perte attendue</p>
              <p class="text-lg font-extrabold text-gray-900 mt-2">{{ demande.perteAttendueFcfa || 0 | number:'1.0-0' }} F</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Zone de décision</span><span class="font-bold text-sm">{{ zoneLabel(demande.zoneDecision) }}</span></div>
            <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Montant / durée</span><span class="font-bold text-sm">{{ demande.montantDemandeFcfa | number:'1.0-0' }} F · {{ demande.dureeMois }} mois</span></div>
            <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Taux d'endettement retenu</span><span class="font-bold text-sm">{{ (demande.ratioEndettement || 0) * 100 | number:'1.0-0' }} %</span></div>
            <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Reste à vivre après échéance</span><span class="font-bold text-sm">{{ demande.ratioResteAVivreFcfa || 0 | number:'1.0-0' }} FCFA</span></div>
          </div>

          <!-- SHAP -->
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p class="font-bold text-slate-800 text-sm mb-3">Facteurs déterminants pour ce dossier <span class="text-[11px] font-normal text-slate-500">(explicabilité SHAP)</span></p>
            <div *ngIf="facteurs.length > 0" class="space-y-2">
              <div *ngFor="let f of facteurs" class="flex items-center gap-3">
                <span class="w-52 text-xs font-semibold text-slate-700 truncate" [title]="humaniser(f.variable)">{{ humaniser(f.variable) }}</span>
                <div class="flex-1 h-3.5 bg-slate-200 rounded-full overflow-hidden">
                  <div class="h-full rounded-full" [ngClass]="f.contribution > 0 ? 'bg-red-500' : 'bg-emerald-500'" [style.width.%]="barWidth(f.contribution)"></div>
                </div>
                <span class="text-[11px] font-bold w-20 text-right" [ngClass]="f.contribution > 0 ? 'text-red-600' : 'text-emerald-600'">{{ f.contribution > 0 ? '↑ risque' : '↓ risque' }}</span>
              </div>
            </div>
            <p *ngIf="facteurs.length === 0" class="text-xs text-slate-400">Explication non disponible pour ce dossier.</p>
          </div>
        </div>

        <!-- Dossier évalué -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <p class="font-bold text-gray-800 text-sm mb-3">Dossier évalué</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Catégorie</span><span class="font-semibold">{{ demande.categorieCredit || '-' }}</span></div>
            <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Objet</span><span class="font-semibold">{{ demande.objetCredit || '-' }}</span></div>
            <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Garantie</span><span class="font-semibold">{{ demande.garantie || '-' }}</span></div>
            <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Taux nominal annuel</span><span class="font-semibold">{{ demande.tauxInteretNominalAnnuelPct != null ? demande.tauxInteretNominalAnnuelPct + ' %' : '-' }}</span></div>
            <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Revenu mensuel</span><span class="font-semibold">{{ demande.revenuMensuelFcfa ? (demande.revenuMensuelFcfa | number:'1.0-0') + ' F' : '-' }}</span></div>
            <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Charges mensuelles</span><span class="font-semibold">{{ demande.chargesMensuellesFcfa != null ? (demande.chargesMensuellesFcfa | number:'1.0-0') + ' F' : '-' }}</span></div>
            <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Épargne moyenne</span><span class="font-semibold">{{ demande.epargneSoldeMoyenFcfa != null ? (demande.epargneSoldeMoyenFcfa | number:'1.0-0') + ' F' : '-' }}</span></div>
            <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Régularité d'épargne</span><span class="font-semibold">{{ demande.regulariteEpargne || '-' }}</span></div>
            <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Ancienneté coopérative</span><span class="font-semibold">{{ demande.ancienneteCooperativeMois != null ? demande.ancienneteCooperativeMois + ' mois' : '-' }}</span></div>
            <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Mobile Money</span><span class="font-semibold">{{ demande.possedeMobileMoney ? 'Oui' : 'Non' }}</span></div>
            <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Statut BIC</span><span class="font-semibold">{{ demande.statutBic || '-' }}</span></div>
            <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Groupe solidaire</span><span class="font-semibold">{{ demande.membreGroupeSolidaire ? 'Oui' : 'Non' }}</span></div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
          <a routerLink="/credits" class="text-xs font-bold text-gray-500 hover:text-gray-800">← Retour à la liste</a>
          <button type="button" (click)="refaire()" class="px-6 py-2.5 bg-[#147c76] hover:bg-[#0e625e] text-white text-xs font-bold rounded-xl shadow transition-all">
            Refaire cette évaluation →
          </button>
        </div>

      </ng-container>
    </div>
  `
})
export class EvaluationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);

  demandeId = 0;
  loading = true;
  demande: DemandeCredit | null = null;
  client: Client | null = null;
  facteurs: FacteurExplicatif[] = [];

  ngOnInit() {
    this.demandeId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.demandeId) {
      this.loading = false;
      return;
    }
    this.apiService.getDemandeById(this.demandeId).subscribe({
      next: (res) => {
        this.loading = false;
        if (res) {
          this.demande = res.demande;
          this.client = res.client;
          this.facteurs = this.parseShap(res.demande.explicationJson);
        }
      },
      error: () => { this.loading = false; },
    });
  }

  refaire() {
    if (!this.demande) return;
    this.apiService.setDossierARefaire(this.demande);
    this.router.navigate(['/credits/nouveau'], {
      queryParams: { id: this.client?.id ?? undefined, refaire: 1 },
    });
  }

  private parseShap(raw?: string): FacteurExplicatif[] {
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.slice(0, 6) : [];
    } catch {
      return [];
    }
  }

  barWidth(contribution: number): number {
    const max = Math.max(...this.facteurs.map(f => Math.abs(f.contribution)), 0.0001);
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
    for (const [k, v] of Object.entries(EvaluationDetailComponent.LIBELLES)) {
      if (variable === k || variable.startsWith(k + '_')) {
        const suffix = variable.slice(k.length + 1);
        return suffix ? `${v} : ${suffix.replace(/_/g, ' ')}` : v;
      }
    }
    return variable.replace(/_/g, ' ');
  }

  scoreColor(s?: number) {
    if (s === null || s === undefined) return 'text-gray-700';
    return s > 81 ? 'text-emerald-600' : s > 56 ? 'text-amber-600' : 'text-red-600';
  }

  badgeClass(s?: string) {
    return s === 'APPROUVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : s === 'A_L_ETUDE' ? 'bg-amber-50 text-amber-700 border-amber-200'
      : s === 'REJETE' ? 'bg-red-50 text-red-700 border-red-200'
      : 'bg-gray-100 text-gray-700 border-gray-200';
  }

  statutLabel(s?: string) {
    return s === 'APPROUVE' ? 'Accord favorable' : s === 'A_L_ETUDE' ? 'À examiner'
      : s === 'REJETE' ? 'Risque élevé' : s === 'ERREUR_IA' ? 'Erreur moteur IA' : 'Non évalué';
  }

  zoneLabel(z?: string) {
    return z === 'ACCORD_FAVORABLE' ? 'Accord favorable'
      : z === 'RISQUE_ELEVE' ? 'Risque élevé'
      : z === 'A_EXAMINER' ? 'À examiner'
      : (z || '-');
  }
}
