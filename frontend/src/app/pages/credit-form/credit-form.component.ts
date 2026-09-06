import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { SettingsService, ObjetCreditItem, GarantieItem, CategorieCreditItem } from '../../services/settings.service';
import { Client, DemandeCredit, FacteurExplicatif } from '../../models/client.model';
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

      <!-- Fil d'Ariane -->
      <div class="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-gray-200 shadow-sm">
        <nav class="flex items-center gap-2 text-xs font-medium text-gray-500">
          <a routerLink="/dashboard" class="text-[#147c76] font-semibold hover:underline">Accueil</a>
          <span class="text-gray-300">/</span>
          <a routerLink="/credits" class="text-[#147c76] font-semibold hover:underline">Crédits</a>
          <span class="text-gray-300">/</span>
          <span class="text-gray-800 font-semibold">Instruction d'un dossier</span>
        </nav>
        <a routerLink="/credits" class="text-xs font-bold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">← Retour</a>
      </div>

      <!-- ============ CAS 1 : recherche sociétaire ============ -->
      <div *ngIf="!selectedClient" class="space-y-5">
        <div class="bg-gradient-to-r from-[#147c76] to-[#0e625e] rounded-2xl p-6 text-white shadow-lg">
          <h1 class="text-xl font-bold">Instruction d'un microcrédit — sélection du sociétaire</h1>
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
        <div class="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm grid grid-cols-3 gap-3 text-xs">
          <button type="button" (click)="step = 1"
            [ngClass]="step===1 ? 'bg-[#e5f3f1] border-[#147c76] text-[#147c76]' : (step>1 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200')"
            class="p-3 rounded-xl border flex items-center gap-2 font-bold transition-all">
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px]"
              [ngClass]="step>1 ? 'bg-emerald-600' : (step===1 ? 'bg-[#147c76]' : 'bg-gray-300')">{{ step>1 ? '✓' : '1' }}</span>
            Fiche sociétaire
          </button>
          <button type="button" (click)="step = 2"
            [ngClass]="step===2 ? 'bg-[#e5f3f1] border-[#147c76] text-[#147c76]' : (step>2 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200')"
            class="p-3 rounded-xl border flex items-center gap-2 font-bold transition-all">
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px]"
              [ngClass]="step>2 ? 'bg-emerald-600' : (step===2 ? 'bg-[#147c76]' : 'bg-gray-300')">{{ step>2 ? '✓' : '2' }}</span>
            Instruction du dossier
          </button>
          <button type="button" [disabled]="!evaluationResult" (click)="evaluationResult && (step = 3)"
            [ngClass]="step===3 ? 'bg-[#e5f3f1] border-[#147c76] text-[#147c76]' : (evaluationResult ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200 opacity-60 cursor-not-allowed')"
            class="p-3 rounded-xl border flex items-center gap-2 font-bold transition-all">
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] bg-gray-300"
              [ngClass]="step===3 ? 'bg-[#147c76]' : (evaluationResult ? 'bg-emerald-600' : '')">3</span>
            Score & décision
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
                  Sociétaire depuis {{ selectedClient.dateCreation }} ({{ selectedClient.ancienneteCooperativeMois }} mois)
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
              <h2 class="text-xs font-bold text-[#147c76] uppercase tracking-wider pb-2 border-b border-gray-100">Activité & compte CIF</h2>
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
            <button type="button" (click)="step = 2" class="px-6 py-3 rounded-xl bg-[#147c76] hover:bg-[#0e625e] text-white text-sm font-bold shadow-md transition-all">Instruire le dossier →</button>
          </div>
        </div>

        <!-- ---------- ÉTAPE 2 : WIZARD 6 VOLETS ---------- -->
        <div *ngIf="step === 2" class="space-y-5">

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
                <input type="number" step="5000" class="inp" [(ngModel)]="demande.revenuMensuelFcfa" [ngModelOptions]="{standalone:true}" />
              </div>
              <div>
                <label class="lbl">Charges mensuelles (FCFA) *</label>
                <input type="number" step="5000" class="inp" [(ngModel)]="demande.chargesMensuellesFcfa" [ngModelOptions]="{standalone:true}" />
              </div>
              <div class="md:col-span-2 p-3 bg-emerald-50 rounded-xl text-sm font-bold text-[#147c76]">
                Reste à vivre courant : {{ ((demande.revenuMensuelFcfa || 0) - (demande.chargesMensuellesFcfa || 0)) | number }} FCFA
              </div>
              <div>
                <label class="lbl">Ancienneté à la coopérative (mois)</label>
                <input type="number" class="inp" [(ngModel)]="demande.ancienneteCooperativeMois" [ngModelOptions]="{standalone:true}" />
              </div>
              <div>
                <label class="lbl">Solde d'épargne moyen (FCFA)</label>
                <input type="number" step="5000" class="inp" [(ngModel)]="demande.epargneSoldeMoyenFcfa" [ngModelOptions]="{standalone:true}" />
              </div>
              <div>
                <label class="lbl">Régularité de l'épargne *</label>
                <select class="inp" [(ngModel)]="demande.regulariteEpargne" [ngModelOptions]="{standalone:true}">
                  <option value="" disabled>— choisir —</option>
                  <option *ngFor="let r of regularites" [value]="r">{{ r }}</option>
                </select>
              </div>
              <label class="flex items-center gap-2 text-sm text-gray-700 self-end pb-2">
                <input type="checkbox" [(ngModel)]="demande.membreGroupeSolidaire" [ngModelOptions]="{standalone:true}" class="w-4 h-4 accent-[#147c76]" />
                Membre d'un <strong>groupe solidaire</strong>
              </label>
            </div>

            <!-- VOLET 3 : historique interne -->
            <div *ngIf="volet === 3" class="space-y-4">
              <p class="text-xs text-gray-400">Chiffres issus des dossiers de crédit CIF du sociétaire. Corrigez si nécessaire.</p>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="lbl">Crédits CIF antérieurs</label>
                  <input type="number" min="0" class="inp" [(ngModel)]="demande.nombreCreditsAnterieurs" [ngModelOptions]="{standalone:true}" />
                </div>
                <div *ngIf="(demande.nombreCreditsAnterieurs || 0) > 0">
                  <label class="lbl">Taux de remboursement (%)</label>
                  <input type="number" min="0" max="100" step="0.1" class="inp" [(ngModel)]="demande.tauxRemboursementHistoriquePct" [ngModelOptions]="{standalone:true}" />
                </div>
                <div *ngIf="(demande.nombreCreditsAnterieurs || 0) > 0">
                  <label class="lbl">Jours de retard moyen</label>
                  <input type="number" min="0" class="inp" [(ngModel)]="demande.joursRetardMoyenHistorique" [ngModelOptions]="{standalone:true}" />
                </div>
              </div>
              <p *ngIf="(demande.nombreCreditsAnterieurs || 0) === 0" class="text-xs text-gray-400">Nouveau sociétaire : aucun historique de crédit interne.</p>
            </div>

            <!-- VOLET 4 : Mobile Money -->
            <div *ngIf="volet === 4" class="space-y-4">
              <label class="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" [(ngModel)]="demande.possedeMobileMoney" [ngModelOptions]="{standalone:true}" class="w-4 h-4 accent-[#147c76]" />
                Le sociétaire <strong>possède un compte Mobile Money</strong>
              </label>
              <div *ngIf="demande.possedeMobileMoney" class="grid grid-cols-2 md:grid-cols-3 gap-3 animate-fade-in">
                <div><label class="lbl">Transactions / mois</label><input type="number" class="inp" [(ngModel)]="demande.frequenceTransactionsMmMois" [ngModelOptions]="{standalone:true}" /></div>
                <div><label class="lbl">Solde moyen (FCFA)</label><input type="number" step="1000" class="inp" [(ngModel)]="demande.mmSoldeMoyenFcfa" [ngModelOptions]="{standalone:true}" /></div>
                <div><label class="lbl">Flux entrants / mois (FCFA)</label><input type="number" step="1000" class="inp" [(ngModel)]="demande.mmFluxEntrantsMensuelFcfa" [ngModelOptions]="{standalone:true}" /></div>
                <div><label class="lbl">Incidents sur crédits Mobile Money</label><input type="number" min="0" class="inp" [(ngModel)]="demande.mmNombreIncidentsCreditMm" [ngModelOptions]="{standalone:true}" /></div>
              </div>
              <p class="text-[11px] text-gray-400">Les autres indicateurs Mobile Money (ancienneté, volatilité, flux détaillés) sont récupérés automatiquement du profil du sociétaire.</p>
            </div>

            <!-- VOLET 5 : BIC + comptes bancaires -->
            <div *ngIf="volet === 5" class="space-y-5">
              <div>
                <label class="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" [(ngModel)]="demande.interrogeBic" [ngModelOptions]="{standalone:true}" class="w-4 h-4 accent-[#147c76]" />
                  Le <strong>BIC (centrale des risques UEMOA)</strong> a été consulté
                </label>
                <div *ngIf="demande.interrogeBic" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 animate-fade-in">
                  <div class="md:col-span-2">
                    <label class="lbl">Résultat BIC</label>
                    <select class="inp" [(ngModel)]="demande.statutBic" [ngModelOptions]="{standalone:true}">
                      <option *ngFor="let s of statutsBic" [value]="s">{{ s }}</option>
                    </select>
                  </div>
                  <div *ngIf="demande.statutBic === bicPretEnCours">
                    <label class="lbl">Nb prêts actifs ailleurs</label>
                    <input type="number" min="0" class="inp" [(ngModel)]="demande.nombrePretsActifsAutresInstitutions" [ngModelOptions]="{standalone:true}" />
                  </div>
                  <div *ngIf="demande.statutBic === bicPretEnCours">
                    <label class="lbl">Encours crédit ailleurs (FCFA)</label>
                    <input type="number" step="10000" class="inp" [(ngModel)]="demande.encoursCreditAutresInstitutionsFcfa" [ngModelOptions]="{standalone:true}" />
                  </div>
                  <div *ngIf="demande.statutBic === bicIncident">
                    <label class="lbl">Ancienneté du dernier incident (mois)</label>
                    <input type="number" min="0" class="inp" [(ngModel)]="demande.bicAncienneteDernierIncidentMois" [ngModelOptions]="{standalone:true}" />
                  </div>
                  <div>
                    <label class="lbl">Crédits déjà soldés ailleurs</label>
                    <input type="number" min="0" class="inp" [(ngModel)]="demande.bicNombreCreditsSoldesAilleurs" [ngModelOptions]="{standalone:true}" />
                  </div>
                </div>
              </div>

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
                  <div><label class="lbl">Solde compte (FCFA)</label><input type="number" step="10000" class="inp" [(ngModel)]="demande.soldeCompteBancaireFcfa" [ngModelOptions]="{standalone:true}" /></div>
                  <div><label class="lbl">Flux dépôts / mois (FCFA)</label><input type="number" step="10000" class="inp" [(ngModel)]="demande.fluxDepotsBancairesMensuelFcfa" [ngModelOptions]="{standalone:true}" /></div>
                  <div><label class="lbl">Flux retraits / mois (FCFA)</label><input type="number" step="10000" class="inp" [(ngModel)]="demande.fluxRetraitsBancairesMensuelFcfa" [ngModelOptions]="{standalone:true}" /></div>
                  <div><label class="lbl">Rejets prélèvements / chèques (12 mois)</label><input type="number" min="0" class="inp" [(ngModel)]="demande.nombreRejetsPrelevementsCheques12m" [ngModelOptions]="{standalone:true}" /></div>
                </div>
              </div>
            </div>

            <!-- VOLET 6 : demande & garantie -->
            <div *ngIf="volet === 6" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="lbl">Catégorie de crédit *</label>
                <select class="inp" [(ngModel)]="demande.categorieCredit" [ngModelOptions]="{standalone:true}" (ngModelChange)="onCategorieChange()">
                  <option value="" disabled>— choisir ({{ categoriesCredit.length }} catégories) —</option>
                  <option *ngFor="let c of categoriesCredit" [value]="c.label">{{ c.label }}</option>
                </select>
              </div>
              <div>
                <label class="lbl">Objet précis du crédit *</label>
                <select class="inp" [(ngModel)]="demande.objetCredit" [ngModelOptions]="{standalone:true}">
                  <option value="" disabled>— choisir ({{ objetsFiltres.length }}) —</option>
                  <option *ngFor="let o of objetsFiltres" [value]="o.label">{{ o.label }}</option>
                </select>
              </div>
              <div>
                <label class="lbl">Montant sollicité (FCFA) *</label>
                <input type="number" step="10000" class="inp text-lg font-bold" [(ngModel)]="demande.montantDemandeFcfa" [ngModelOptions]="{standalone:true}" (ngModelChange)="onMontantChange()" />
              </div>
              <div>
                <label class="lbl">Durée (mois) *</label>
                <select class="inp" [(ngModel)]="demande.dureeMois" [ngModelOptions]="{standalone:true}">
                  <option [ngValue]="undefined" disabled>— choisir —</option>
                  <option *ngFor="let d of durees" [ngValue]="d">{{ d }} mois</option>
                </select>
              </div>
              <div>
                <label class="lbl">Taux d'intérêt nominal annuel (%)</label>
                <input type="number" step="0.1" class="inp" [(ngModel)]="demande.tauxInteretNominalAnnuelPct" [ngModelOptions]="{standalone:true}" />
              </div>
              <div>
                <label class="lbl">Frais de dossier (FCFA)</label>
                <input type="number" step="500" class="inp" [(ngModel)]="demande.fraisDossierFcfa" [ngModelOptions]="{standalone:true}" />
              </div>
              <div class="md:col-span-2">
                <label class="lbl">Garantie proposée *</label>
                <select class="inp" [(ngModel)]="demande.garantie" [ngModelOptions]="{standalone:true}">
                  <option value="" disabled>— choisir ({{ garanties.length }}) —</option>
                  <option *ngFor="let g of garanties" [value]="g.label">{{ g.label }}</option>
                </select>
              </div>
              <div class="md:col-span-2 p-4 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-2 gap-3 text-xs">
                <div><span class="text-gray-400 block">Échéance mensuelle estimée</span><span class="font-bold text-gray-900 text-sm">{{ echeanceEstimee() | number:'1.0-0' }} FCFA</span></div>
                <div><span class="text-gray-400 block">Taux d'endettement estimé</span><span class="font-bold text-sm" [ngClass]="ratioEndettementEstime() > 0.75 ? 'text-red-600' : (ratioEndettementEstime() > 0.5 ? 'text-amber-600' : 'text-emerald-600')">{{ ratioEndettementEstime() * 100 | number:'1.0-0' }} %</span></div>
              </div>
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
        <div *ngIf="step === 3 && evaluationResult" class="space-y-5">
          <div class="bg-white rounded-2xl border-2 border-[#147c76] p-6 shadow-xl space-y-6">

            <div *ngIf="evaluationResult.source === 'ESTIMATION_LOCALE'" class="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs">
              <span class="font-bold">⚠</span>
              <span><strong>Estimation locale de repli</strong> — le moteur IA n'a pas pu être contacté. Résultat indicatif, sans valeur de prédiction du modèle. Relancez une fois la connexion rétablie.</span>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div>
                <span class="text-xs font-bold text-[#147c76] uppercase tracking-wider">Décision du moteur de scoring</span>
                <h2 class="text-xl font-bold text-gray-900">{{ selectedClient.prenom }} {{ selectedClient.nom }}</h2>
              </div>
              <span [ngClass]="badgeClass(evaluationResult.statut)" class="px-4 py-2 rounded-full text-xs font-bold border self-start">{{ statusLabel(evaluationResult.statut) }}</span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p class="text-[11px] text-gray-500">Score CIF</p>
                <p class="text-3xl font-extrabold mt-1" [ngClass]="scoreColor(evaluationResult.scoreCredit)">{{ evaluationResult.scoreCredit || '—' }}<span class="text-xs text-gray-400 font-normal"> / 900</span></p>
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

            <div class="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button type="button" (click)="step = 2" class="text-xs font-bold text-gray-500 hover:text-gray-800">← Revoir le dossier</button>
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
    { n: 3, titre: 'Historique interne', sous: 'Crédits CIF antérieurs, remboursement, retards.' },
    { n: 4, titre: 'Mobile Money', sous: 'Usage transactionnel Mobile Money (proxy de revenu et de discipline).' },
    { n: 5, titre: 'BIC & banque', sous: 'Centrale des risques UEMOA et comptes bancaires classiques.' },
    { n: 6, titre: 'Demande & garantie', sous: 'Objet, montant, durée, taux et garantie du prêt sollicité.' },
  ];

  clients: Client[] = [];
  searchQuery = '';
  selectedClient: Client | null = null;
  isEvaluating = false;
  evaluationResult: DemandeCredit | null = null;

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
    if (idParam) {
      const c = this.clients.find(x => x.id === parseInt(idParam, 10));
      if (c) this.selectClient(c);
    } else if (cnib) {
      const c = this.clients.find(x => (x.numeroCnib || '').toLowerCase() === cnib.toLowerCase());
      if (c) this.selectClient(c);
    }
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
      ancienneteCooperativeMois: c.ancienneteCooperativeMois ?? 0,
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
      mmNombreIncidentsCreditMm: c.mmNombreIncidentsCreditMm ?? 0,
      nombreComptesBancaires: c.nombreComptesBancaires ?? 0,
      typeComptePrincipal: c.typeComptePrincipal || TYPE_COMPTE_BANCAIRE_AUCUN,
      soldeCompteBancaireFcfa: c.soldeCompteBancaireFcfa ?? 0,
      nombreRejetsPrelevementsCheques12m: c.nombreRejetsPrelevementsCheques12m ?? 0,
      nombrePretsActifsAutresInstitutions: 0,
      encoursCreditAutresInstitutionsFcfa: 0,
      tauxInteretNominalAnnuelPct: this.demande.tauxInteretNominalAnnuelPct ?? 14,
      fraisDossierFcfa: this.demande.fraisDossierFcfa ?? 0,
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

  onMontantChange() {
    if (this.demande.montantDemandeFcfa && !this.demande.fraisDossierFcfa) {
      this.demande.fraisDossierFcfa = Math.min(25000, Math.max(500, Math.round(this.demande.montantDemandeFcfa * 0.02 / 100) * 100));
    }
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
    const mensExt = (this.demande.encoursCreditAutresInstitutionsFcfa || 0) * 0.09;
    return Math.round(((this.demande.chargesMensuellesFcfa || 0) + this.echeanceEstimee() + mensExt) / rev * 100) / 100;
  }

  nextVolet() { if (this.volet < this.volets.length) this.volet++; }
  prevVolet() { if (this.volet > 1) this.volet--; }

  dossierComplet(): boolean {
    return !!(this.demande.revenuMensuelFcfa && this.demande.chargesMensuellesFcfa != null
      && this.demande.regulariteEpargne && this.demande.categorieCredit && this.demande.objetCredit
      && this.demande.montantDemandeFcfa && this.demande.dureeMois && this.demande.garantie);
  }

  submitEvaluation() {
    if (!this.selectedClient?.id || !this.dossierComplet()) return;
    // saisie de l'agent, débarrassée des valeurs vides
    const saisie: Record<string, any> = {};
    for (const [k, v] of Object.entries(this.demande)) {
      if (v !== undefined && v !== null && v !== '') saisie[k] = v;
    }
    const payload = { ...this.fondDossier(this.selectedClient), ...saisie } as DemandeCredit;
    this.isEvaluating = true;
    this.apiService.evaluerCredit(this.selectedClient.id, payload).subscribe({
      next: (res) => { this.isEvaluating = false; this.evaluationResult = res; this.step = 3; },
      error: (err) => { this.isEvaluating = false; console.error('Évaluation :', err); },
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
    mm_nombre_incidents_credit_mm: 'Incidents crédit Mobile Money',
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
  scoreColor(s?: number) { return !s ? 'text-gray-700' : s >= 680 ? 'text-emerald-600' : s >= 550 ? 'text-amber-600' : 'text-red-600'; }
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
