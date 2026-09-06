import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Client, DemandeCredit, FacteurExplicatif } from '../../models/client.model';
import { PD_SEUIL_VERT, PD_SEUIL_ROUGE } from '../../models/scoring-zones';

/**
 * Page "Pourquoi ce résultat ?" - explication détaillée et en clair d'une
 * évaluation : logique de décision, seuils, contribution de chaque variable
 * (SHAP), ratios calculés, garde-fous appliqués, avis de l'agent.
 */
@Component({
  selector: 'app-evaluation-explication',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-3xl mx-auto space-y-5 pb-16">

      <div *ngIf="loading" class="p-10 text-center text-sm text-gray-400">Chargement…</div>
      <div *ngIf="!loading && !demande" class="bg-white rounded-2xl border border-gray-200 p-10 text-center text-sm text-gray-600">
        Évaluation introuvable. <a routerLink="/credits" class="text-[#147c76] font-bold">Retour</a>
      </div>

      <ng-container *ngIf="!loading && demande">
        <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h1 class="text-xl font-bold text-gray-900">Pourquoi ce résultat ?</h1>
          <p class="text-sm text-gray-500 mt-1">{{ client?.prenom }} {{ client?.nom }} · dossier de {{ demande.montantDemandeFcfa | number:'1.0-0' }} FCFA sur {{ demande.dureeMois }} mois</p>
        </div>

        <!-- 1. La décision -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-3">
          <p class="text-xs font-bold text-[#147c76] uppercase tracking-wider">1. La décision</p>
          <p class="text-sm text-gray-700">
            Le moteur estime une <strong>probabilité de défaut de {{ (demande.scoreRisque || 0) | number:'1.1-1' }}%</strong>
            (score de solvabilité <strong>{{ demande.scoreCredit ?? '-' }}/100</strong>). Cette probabilité est comparée à deux seuils :
          </p>
          <div class="space-y-1.5 text-xs">
            <div class="flex items-center gap-2" [class.font-bold]="zone === 'ACCORD_FAVORABLE'">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> PD &lt; {{ pdSeuilVertPct }}% → Accord favorable
            </div>
            <div class="flex items-center gap-2" [class.font-bold]="zone === 'A_EXAMINER'">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> {{ pdSeuilVertPct }}% ≤ PD &lt; {{ pdSeuilRougePct }}% → À examiner (comité)
            </div>
            <div class="flex items-center gap-2" [class.font-bold]="zone === 'RISQUE_ELEVE'">
              <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span> PD ≥ {{ pdSeuilRougePct }}% → Risque élevé
            </div>
          </div>
          <p class="text-sm text-gray-700">
            Ici : <strong>{{ zoneLabel(zone) }}</strong>.
          </p>
          <div *ngIf="demande.noteDecision" class="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
            <strong>Une règle métier a modifié la décision :</strong> {{ demande.noteDecision }}
          </div>
        </div>

        <!-- 2. Les variables qui ont pesé -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-3">
          <p class="text-xs font-bold text-[#147c76] uppercase tracking-wider">2. Les variables qui ont pesé</p>
          <p class="text-xs text-gray-500">Chaque phrase indique dans quel sens la variable a poussé la décision pour CE dossier (méthode SHAP).</p>
          <ul class="space-y-2">
            <li *ngFor="let f of facteurs" class="flex items-start gap-2 text-sm">
              <span class="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                [ngClass]="f.contribution > 0 ? 'bg-red-500' : 'bg-emerald-500'">{{ f.contribution > 0 ? '+' : '−' }}</span>
              <span class="text-gray-700">
                <strong>{{ humaniser(f.variable) }}</strong>
                {{ f.contribution > 0 ? 'a augmenté le risque' : 'a réduit le risque' }}
                pour ce dossier<span class="text-gray-400"> (poids {{ pct(f.contribution) }})</span>.
              </span>
            </li>
          </ul>
          <p *ngIf="facteurs.length === 0" class="text-xs text-gray-400">Explication variable par variable non disponible pour ce dossier.</p>
        </div>

        <!-- 3. La capacité de remboursement -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-2">
          <p class="text-xs font-bold text-[#147c76] uppercase tracking-wider">3. La capacité de remboursement (calculée)</p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Échéance / mois</span><span class="font-bold text-sm">{{ demande.futureEcheanceCreditFcfa || 0 | number:'1.0-0' }} F</span></div>
            <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Taux d'endettement</span><span class="font-bold text-sm">{{ (demande.ratioEndettement || 0) * 100 | number:'1.0-0' }} %</span></div>
            <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Reste à vivre</span><span class="font-bold text-sm">{{ demande.ratioResteAVivreFcfa || 0 | number:'1.0-0' }} F</span></div>
            <div class="p-3 bg-gray-50 rounded-xl"><span class="text-gray-400 block">Perte attendue</span><span class="font-bold text-sm">{{ demande.perteAttendueFcfa || 0 | number:'1.0-0' }} F</span></div>
          </div>
          <p class="text-xs text-gray-500 leading-relaxed">
            Taux d'endettement = (charges + échéance du nouveau prêt + mensualités externes) ÷ revenu.
            Reste à vivre = revenu − charges − échéance. Perte attendue = probabilité de défaut × taux de perte selon la garantie × montant.
          </p>
        </div>

        <!-- 4. Avis de l'agent -->
        <div *ngIf="demande.avisAgent" class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-2">
          <p class="text-xs font-bold text-[#147c76] uppercase tracking-wider">4. Appréciation de l'agent <span class="font-normal text-gray-400">(informatif, hors modèle)</span></p>
          <p class="text-sm text-gray-800 font-bold">{{ avisLabel(demande.avisAgent) }}</p>
          <p *ngIf="demande.avisAgentMotifs" class="text-xs text-gray-500">Motifs : {{ demande.avisAgentMotifs }}</p>
          <p *ngIf="demande.avisAgentCommentaire" class="text-sm text-gray-700 italic">« {{ demande.avisAgentCommentaire }} »</p>
        </div>

        <a [routerLink]="['/credits', demandeId]" class="inline-block text-xs font-bold text-gray-500 hover:text-gray-800">← Retour au dossier</a>
      </ng-container>
    </div>
  `
})
export class EvaluationExplicationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);

  demandeId = 0;
  loading = true;
  demande: DemandeCredit | null = null;
  client: Client | null = null;
  facteurs: FacteurExplicatif[] = [];
  zone = '';
  // Seuils du modèle déployé, en % (cf. models/scoring-zones.ts).
  pdSeuilVertPct = Math.round(PD_SEUIL_VERT * 100);
  pdSeuilRougePct = Math.round(PD_SEUIL_ROUGE * 100);

  ngOnInit() {
    this.demandeId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.demandeId) { this.loading = false; return; }
    this.apiService.getDemandeById(this.demandeId).subscribe({
      next: (res) => {
        this.loading = false;
        if (res) {
          this.demande = res.demande;
          this.client = res.client;
          this.zone = res.demande.zoneDecision || '';
          this.facteurs = this.parseShap(res.demande.explicationJson);
        }
      },
      error: () => { this.loading = false; },
    });
  }

  private parseShap(raw?: string): FacteurExplicatif[] {
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.slice(0, 8) : [];
    } catch { return []; }
  }

  pct(c: number): string {
    const max = Math.max(...this.facteurs.map(f => Math.abs(f.contribution)), 0.0001);
    return Math.round(Math.abs(c) / max * 100) + ' %';
  }

  zoneLabel(z: string) {
    return z === 'ACCORD_FAVORABLE' ? 'Accord favorable'
      : z === 'RISQUE_ELEVE' ? 'Risque élevé'
      : z === 'A_EXAMINER' ? 'À examiner' : (z || '-');
  }

  avisLabel(a?: string) {
    return a === 'FAVORABLE' ? 'Favorable'
      : a === 'FAVORABLE_SOUS_RESERVE' ? 'Favorable sous réserve'
      : a === 'RESERVE' ? 'Réservé'
      : a === 'DEFAVORABLE' ? 'Défavorable' : (a || '-');
  }

  private static LIBELLES: Record<string, string> = {
    ratio_endettement: "Taux d'endettement",
    ratio_reste_a_vivre_absolu_fcfa: 'Reste à vivre',
    ratio_couverture_echeance_epargne: 'Couverture échéance / épargne',
    ratio_montant_demande_sur_max_anterieur: 'Montant demandé vs plus gros crédit passé',
    future_echeance_credit_fcfa: 'Échéance mensuelle',
    epargne_solde_moyen_fcfa: "Solde d'épargne",
    regularite_epargne: "Régularité d'épargne",
    membre_groupe_solidaire: 'Groupe solidaire',
    anciennete_cooperative_mois: 'Ancienneté coopérative',
    nombre_credits_anterieurs: 'Crédits antérieurs',
    taux_remboursement_historique_pct: 'Historique de remboursement',
    taux_remboursement_dernier_credit_pct: 'Remboursement du dernier crédit',
    jours_retard_moyen_historique: 'Retards passés (moyenne)',
    jours_retard_max_historique: 'Pire retard passé',
    a_deja_defaut_interne: 'A déjà fait défaut en interne',
    nombre_reechelonnements_total: 'Rééchelonnements passés',
    anciennete_dernier_credit_mois: 'Récence du dernier crédit',
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
    for (const [k, v] of Object.entries(EvaluationExplicationComponent.LIBELLES)) {
      if (variable === k || variable.startsWith(k + '_')) {
        const suffix = variable.slice(k.length + 1);
        return suffix ? `${v} : ${suffix.replace(/_/g, ' ')}` : v;
      }
    }
    return variable.replace(/_/g, ' ');
  }
}
