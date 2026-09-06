import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Client, DemandeCredit, FacteurExplicatif } from '../../models/client.model';
import { couleurScore } from '../../models/scoring-zones';

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
    <div class="mx-auto max-w-5xl space-y-5 pb-16 animate-fade-up">

      <!-- Chargement -->
      <div *ngIf="loading" class="card card-pad space-y-4" aria-busy="true" aria-live="polite">
        <div class="skeleton h-6 w-1/3"></div>
        <div class="skeleton h-4 w-2/3"></div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div class="skeleton h-20"></div><div class="skeleton h-20"></div>
          <div class="skeleton h-20"></div><div class="skeleton h-20"></div>
        </div>
        <span class="sr-only">Chargement de l'évaluation…</span>
      </div>

      <!-- Introuvable -->
      <div *ngIf="!loading && !demande" class="card">
        <div class="empty-state">
          <span class="empty-icon" aria-hidden="true">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </span>
          <h1 class="text-base font-bold text-ink-900">Évaluation introuvable</h1>
          <p class="mt-1.5 text-sm text-ink-500 max-w-xs">Ce dossier n'existe plus ou a été supprimé.</p>
          <a routerLink="/credits" class="btn-primary btn-sm mt-5">Retour à la liste</a>
        </div>
      </div>

      <ng-container *ngIf="!loading && demande">

        <!-- En-tête du dossier -->
        <header class="card card-pad flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4 min-w-0">
            <span class="grid place-items-center w-14 h-14 flex-shrink-0 rounded-2xl bg-brand-gradient
                         text-white text-base font-bold shadow-brand" aria-hidden="true">
              {{ (client?.prenom || '?')[0] }}{{ (client?.nom || '?')[0] }}
            </span>
            <div class="min-w-0">
              <p class="eyebrow">Résultat de l'évaluation</p>
              <h1 class="mt-0.5 text-xl sm:text-2xl font-extrabold text-ink-900 truncate">
                {{ client?.prenom }} {{ client?.nom }}
              </h1>
              <p class="mt-1 text-xs text-ink-500">
                CNIB {{ client?.numeroCnib || '-' }}
                <span class="text-ink-300" aria-hidden="true">·</span>
                évaluée le {{ demande.dateCreation ? (demande.dateCreation | date:'dd/MM/yyyy à HH:mm') : '-' }}
              </p>
            </div>
          </div>
          <span [ngClass]="badgeClass(demande.statut)"
            class="badge self-start sm:self-auto flex-shrink-0 px-4 py-1.5 text-xs">{{ statutLabel(demande.statut) }}</span>
        </header>

        <!-- Garde-fou métier -->
        <div *ngIf="demande.noteDecision" role="alert"
          class="flex items-start gap-3 rounded-2xl border border-danger-200 bg-danger-50 p-4">
          <span class="grid place-items-center w-8 h-8 flex-shrink-0 rounded-xl bg-danger-100 text-danger-700" aria-hidden="true">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </span>
          <p class="text-xs text-danger-800 leading-relaxed">
            <strong class="font-bold">Règle métier appliquée.</strong> {{ demande.noteDecision }}
          </p>
        </div>

        <!-- Résultat -->
        <div class="card card-pad space-y-5 border-brand-200">
          <div class="grid grid-cols-2 gap-3 text-center" [ngClass]="estScoreVert(demande.scoreCredit) ? 'sm:grid-cols-4' : 'sm:grid-cols-3'">
            <div class="p-4 bg-ink-50 rounded-xl border border-ink-200">
              <p class="text-[11px] text-ink-500">Score de risque</p>
              <p class="text-3xl font-extrabold mt-1" [ngClass]="scoreColor(demande.scoreCredit)">{{ demande.scoreCredit ?? '-' }}<span class="text-xs text-ink-400 font-normal"> / 100</span></p>
            </div>
            <div *ngIf="estScoreVert(demande.scoreCredit)" class="p-4 bg-success-50 rounded-xl border border-success-200">
              <p class="text-[11px] text-success-700">Chances de remboursement</p>
              <p class="text-3xl font-extrabold text-success-700 mt-1">{{ 100 - (demande.scoreCredit || 0) }}<span class="text-xs text-success-500 font-normal"> %</span></p>
            </div>
            <div class="p-4 bg-ink-50 rounded-xl border border-ink-200">
              <p class="text-[11px] text-ink-500">Échéance / mois</p>
              <p class="text-lg font-extrabold text-ink-900 mt-2">{{ demande.futureEcheanceCreditFcfa || 0 | number:'1.0-0' }} F</p>
            </div>
            <div class="p-4 bg-ink-50 rounded-xl border border-ink-200">
              <p class="text-[11px] text-ink-500">Perte attendue</p>
              <p class="text-lg font-extrabold text-ink-900 mt-2">{{ demande.perteAttendueFcfa || 0 | number:'1.0-0' }} F</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Zone de décision</span><span class="font-bold text-sm">{{ zoneLabel(demande.zoneDecision) }}</span></div>
            <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Montant / durée</span><span class="font-bold text-sm">{{ demande.montantDemandeFcfa | number:'1.0-0' }} F · {{ demande.dureeMois }} mois</span></div>
            <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Taux d'endettement retenu</span><span class="font-bold text-sm">{{ (demande.ratioEndettement || 0) * 100 | number:'1.0-0' }} %</span></div>
            <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Reste à vivre après échéance</span><span class="font-bold text-sm">{{ demande.ratioResteAVivreFcfa || 0 | number:'1.0-0' }} FCFA</span></div>
          </div>

          <!-- SHAP -->
          <div class="p-4 bg-ink-50 rounded-xl border border-ink-200">
            <p class="font-bold text-ink-800 text-sm mb-3">Facteurs déterminants pour ce dossier <span class="text-[11px] font-normal text-ink-500">(ce qui a pesé dans la décision)</span></p>
            <div *ngIf="facteurs.length > 0" class="space-y-2">
              <div *ngFor="let f of facteurs" class="flex items-center gap-3">
                <span class="w-52 text-xs font-semibold text-ink-700 truncate" [title]="humaniser(f.variable)">{{ humaniser(f.variable) }}</span>
                <div class="flex-1 h-3.5 bg-ink-200 rounded-full overflow-hidden">
                  <div class="h-full rounded-full" [ngClass]="f.contribution > 0 ? 'bg-danger-500' : 'bg-success-500'" [style.width.%]="barWidth(f.contribution)"></div>
                </div>
                <span class="text-[11px] font-bold w-20 text-right" [ngClass]="f.contribution > 0 ? 'text-danger-600' : 'text-success-600'">{{ f.contribution > 0 ? '↑ risque' : '↓ risque' }}</span>
              </div>
            </div>
            <p *ngIf="facteurs.length === 0" class="text-xs text-ink-400">Explication non disponible pour ce dossier.</p>
          </div>
        </div>

        <!-- Dossier évalué -->
        <div class="bg-white rounded-2xl border border-ink-200 p-6 shadow-sm">
          <p class="font-bold text-ink-800 text-sm mb-3">Dossier évalué</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Catégorie</span><span class="font-semibold">{{ demande.categorieCredit || '-' }}</span></div>
            <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Objet</span><span class="font-semibold">{{ demande.objetCredit || '-' }}</span></div>
            <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Garantie</span><span class="font-semibold">{{ demande.garantie || '-' }}</span></div>
            <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Taux nominal annuel</span><span class="font-semibold">{{ demande.tauxInteretNominalAnnuelPct != null ? demande.tauxInteretNominalAnnuelPct + ' %' : '-' }}</span></div>
            <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Revenu mensuel</span><span class="font-semibold">{{ demande.revenuMensuelFcfa ? (demande.revenuMensuelFcfa | number:'1.0-0') + ' F' : '-' }}</span></div>
            <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Charges mensuelles</span><span class="font-semibold">{{ demande.chargesMensuellesFcfa != null ? (demande.chargesMensuellesFcfa | number:'1.0-0') + ' F' : '-' }}</span></div>
            <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Épargne moyenne</span><span class="font-semibold">{{ demande.epargneSoldeMoyenFcfa != null ? (demande.epargneSoldeMoyenFcfa | number:'1.0-0') + ' F' : '-' }}</span></div>
            <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Régularité d'épargne</span><span class="font-semibold">{{ demande.regulariteEpargne || '-' }}</span></div>
            <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Ancienneté coopérative</span><span class="font-semibold">{{ demande.ancienneteCooperativeMois != null ? demande.ancienneteCooperativeMois + ' mois' : '-' }}</span></div>
            <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Mobile Money</span><span class="font-semibold">{{ demande.possedeMobileMoney ? 'Oui' : 'Non' }}</span></div>
            <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Statut BIC</span><span class="font-semibold">{{ demande.statutBic || '-' }}</span></div>
            <div class="p-3 bg-ink-50 rounded-xl"><span class="text-ink-400 block">Groupe solidaire</span><span class="font-semibold">{{ demande.membreGroupeSolidaire ? 'Oui' : 'Non' }}</span></div>
          </div>
        </div>

        <a [routerLink]="['/credits', demandeId, 'explication']"
          class="flex items-center justify-between gap-2 p-3 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 text-xs font-bold hover:bg-brand-100 transition-colors">
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Pourquoi ce résultat ? Voir l'explication détaillée
          </span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </a>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
          <a routerLink="/credits" class="text-xs font-bold text-ink-500 hover:text-ink-800">← Retour à la liste</a>
          <button type="button" (click)="refaire()" class="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow transition-all">
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
    const c = couleurScore(s);
    return c === 'gris' ? 'text-ink-700' : c === 'vert' ? 'text-success-600' : c === 'orange' ? 'text-warning-600' : 'text-danger-600';
  }
  estScoreVert(s?: number) { return couleurScore(s) === 'vert'; }

  badgeClass(s?: string) {
    return s === 'APPROUVE' ? 'bg-success-50 text-success-700 border-success-200'
      : s === 'A_L_ETUDE' ? 'bg-warning-50 text-warning-700 border-warning-200'
      : s === 'REJETE' ? 'bg-danger-50 text-danger-700 border-danger-200'
      : 'bg-ink-100 text-ink-700 border-ink-200';
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
