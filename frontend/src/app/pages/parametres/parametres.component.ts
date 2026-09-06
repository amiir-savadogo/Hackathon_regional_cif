import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SettingsService, CategorieCreditItem, ObjetCreditItem, GarantieItem, NatureJuridiqueItem } from '../../services/settings.service';
import { AgentRole, AgenceCIF, CorbeilleItem } from '../../models/user.model';

export type ParamSection = 'HUB' | 'CATEGORIES' | 'OBJETS_CREDIT' | 'GARANTIES' | 'NATURES_JURIDIQUES' | 'AGENCES' | 'ROLES' | 'CORBEILLE';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto space-y-6">

      <!-- ========================================================================= -->
      <!-- BARRE SUPÉRIEURE ÉPURÉE AVEC FIL D'ARIANE PROPRE & RETOUR HUB             -->
      <!-- ========================================================================= -->
      <div class="bg-white rounded-2xl border border-gray-200/80 px-4 sm:px-5 py-3.5 shadow-sm flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <!-- Fil d'Ariane élégant et clair -->
        <nav class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm font-medium text-gray-500 min-w-0" aria-label="Breadcrumb">
          <a routerLink="/dashboard" class="inline-flex items-center text-gray-500 hover:text-[#147c76] transition-colors group">
            <svg class="w-4 h-4 mr-1.5 text-gray-400 group-hover:text-[#147c76] transition-colors" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
            <span>Accueil</span>
          </a>
          
          <svg class="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          
          <button type="button" (click)="goToSection('HUB')" 
            class="transition-colors cursor-pointer inline-flex items-center gap-1.5"
            [ngClass]="currentSection === 'HUB' ? 'text-gray-900 font-bold' : 'text-gray-500 hover:text-[#147c76]'">
            <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span>Paramètres</span>
          </button>

          <ng-container *ngIf="currentSection !== 'HUB'">
            <svg class="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            <span class="text-[#147c76] font-bold px-2.5 py-0.5 bg-[#e5f3f1] rounded-lg border border-[#b9ded9]">
              {{ getSectionBreadcrumbLabel() }}
            </span>
          </ng-container>
        </nav>

        <!-- Action à droite : bouton de retour épuré quand on est dans une sous-page -->
        <div class="flex items-center space-x-2">
          <button *ngIf="currentSection !== 'HUB'" (click)="goToSection('HUB')"
            class="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm">
            <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            <span>← Retour aux Paramètres</span>
          </button>

          <div *ngIf="currentSection === 'HUB'" class="flex items-center space-x-2">
            <span class="text-xs text-gray-400 font-medium hidden sm:inline">7 modules configurables</span>
            <span class="w-2 h-2 rounded-full bg-[#147c76]"></span>
          </div>
        </div>
      </div>

      <!-- Notification de succès globale -->
      <div *ngIf="notificationMessage" class="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-5 py-3 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
        <div class="flex items-center space-x-2.5">
          <svg class="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
          <span class="font-semibold">{{ notificationMessage }}</span>
        </div>
        <button (click)="notificationMessage = ''" class="text-emerald-700 hover:text-emerald-900 font-bold ml-4">✕</button>
      </div>

      <!-- ========================================================================= -->
      <!-- VUE 1 : LE HUB DES PARAMÈTRES (Dashboard visuel des 6 sections)           -->
      <!-- ========================================================================= -->
      <div *ngIf="currentSection === 'HUB'" class="space-y-6 animate-fade-in">
        
        <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-[#123b41] text-white rounded-3xl p-7 md:p-9 shadow-lg relative overflow-hidden">
          <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-[#147c76]/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="relative z-10 max-w-2xl">
            <span class="px-3 py-1 bg-white/10 text-[#b9ded9] text-xs font-semibold rounded-full uppercase tracking-wider backdrop-blur-sm inline-block mb-3">
              Configuration Centrale SAMDE · Données 100% Paramétrables
            </span>
            <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Centre de Paramétrage SAMDE</h1>
            <p class="text-slate-300 text-sm mt-2 leading-relaxed">
              Personnalisez les catégories sectorielles, les objets de crédit, les types de garanties, le réseau d'agences CIF, les rôles des agents et la corbeille de restauration.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          
          <!-- 1. CARTE CATÉGORIES DE PRÊT -->
          <div (click)="goToSection('CATEGORIES')"
            class="bg-white rounded-3xl border-2 border-[#147c76]/20 hover:border-[#147c76] p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden">
            <div class="absolute top-0 right-0 w-28 h-28 bg-[#e5f3f1]/60 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-300"></div>

            <div class="relative z-10">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#147c76] to-[#0e625e] text-white flex items-center justify-center mb-4 shadow-lg shadow-[#147c76]/30 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
              </div>

              <div class="flex items-center space-x-2 mb-1.5">
                <h2 class="text-lg font-bold text-gray-900 group-hover:text-[#147c76] transition-colors">Catégories de Prêt</h2>
                <span class="px-2 py-0.5 text-xs font-bold rounded-full bg-[#e5f3f1] text-[#147c76] border border-[#b9ded9]">
                  {{ categories.length }}
                </span>
              </div>
              
              <p class="text-xs text-gray-500 leading-relaxed">
                Familles sectorielles (Commerce, Agriculture, Élevage, Artisanat, Habitat, Social) avec coefficients de risque et taux de référence.
              </p>
            </div>

            <div class="pt-5 mt-4 border-t border-gray-100 flex items-center justify-between relative z-10">
              <span class="text-xs font-bold text-[#147c76] group-hover:translate-x-1 transition-transform inline-flex items-center">
                Configurer les catégories
                <svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
              </span>
              <span class="text-[10px] text-[#147c76] font-semibold bg-[#e5f3f1] px-2 py-0.5 rounded-full">Secteurs</span>
            </div>
          </div>

          <!-- 2. CARTE OBJETS DE CRÉDIT -->
          <div (click)="goToSection('OBJETS_CREDIT')"
            class="bg-white rounded-3xl border-2 border-emerald-100 hover:border-emerald-600 p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden">
            <div class="absolute top-0 right-0 w-28 h-28 bg-emerald-50/60 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-300"></div>

            <div class="relative z-10">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>

              <div class="flex items-center space-x-2 mb-1.5">
                <h2 class="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">Objets de Crédit</h2>
                <span class="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {{ objetsCredit.length }}
                </span>
              </div>
              
              <p class="text-xs text-gray-500 leading-relaxed">
                Motifs précis de financement rattachés aux catégories (Fonds de roulement, Intrants de campagne, Embouche bovine, Toiture...).
              </p>
            </div>

            <div class="pt-5 mt-4 border-t border-gray-100 flex items-center justify-between relative z-10">
              <span class="text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform inline-flex items-center">
                Configurer les objets
                <svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
              </span>
              <span class="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">Motifs</span>
            </div>
          </div>

          <!-- 3. CARTE TYPES DE GARANTIES -->
          <div (click)="goToSection('GARANTIES')"
            class="bg-white rounded-3xl border-2 border-teal-100 hover:border-teal-600 p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden">
            <div class="absolute top-0 right-0 w-28 h-28 bg-teal-50/60 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-300"></div>

            <div class="relative z-10">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-700 text-white flex items-center justify-center mb-4 shadow-lg shadow-teal-500/30 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>

              <div class="flex items-center space-x-2 mb-1.5">
                <h2 class="text-lg font-bold text-gray-900 group-hover:text-teal-700 transition-colors">Types de Garanties</h2>
                <span class="px-2 py-0.5 text-xs font-bold rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  {{ typesGaranties.length }}
                </span>
              </div>
              
              <p class="text-xs text-gray-500 leading-relaxed">
                Sûretés exigées (Caution solidaire, Avaliste, Gage sur stock, Épargne nantie, Hypothèque) et taux de couverture requis.
              </p>
            </div>

            <div class="pt-5 mt-4 border-t border-gray-100 flex items-center justify-between relative z-10">
              <span class="text-xs font-bold text-teal-700 group-hover:translate-x-1 transition-transform inline-flex items-center">
                Configurer les garanties
                <svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
              </span>
              <span class="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full">Sûretés</span>
            </div>
          </div>

          <!-- 4. CARTE AGENCES CIF -->
          <div (click)="goToSection('AGENCES')"
            class="bg-white rounded-3xl border-2 border-cyan-100 hover:border-cyan-600 p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden">
            <div class="absolute top-0 right-0 w-28 h-28 bg-cyan-50/60 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-300"></div>

            <div class="relative z-10">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-700 text-white flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>

              <div class="flex items-center space-x-2 mb-1.5">
                <h2 class="text-lg font-bold text-gray-900 group-hover:text-cyan-700 transition-colors">Agences CIF</h2>
                <span class="px-2 py-0.5 text-xs font-bold rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                  {{ agences.length }}
                </span>
              </div>
              
              <p class="text-xs text-gray-500 leading-relaxed">
                Caisses populaires, délégations régionales et points de service bancaires rattachés au réseau CIF.
              </p>
            </div>

            <div class="pt-5 mt-4 border-t border-gray-100 flex items-center justify-between relative z-10">
              <span class="text-xs font-bold text-cyan-700 group-hover:translate-x-1 transition-transform inline-flex items-center">
                Configurer les agences
                <svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
              </span>
              <span class="text-[10px] text-cyan-700 font-semibold bg-cyan-50 px-2 py-0.5 rounded-full">Réseau</span>
            </div>
          </div>

          <!-- 5. CARTE RÔLES DES AGENTS -->
          <div (click)="goToSection('ROLES')"
            class="bg-white rounded-3xl border-2 border-indigo-100 hover:border-indigo-500 p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden">
            <div class="absolute top-0 right-0 w-28 h-28 bg-indigo-50/60 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-300"></div>

            <div class="relative z-10">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              </div>

              <div class="flex items-center space-x-2 mb-1.5">
                <h2 class="text-lg font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">Rôles Agents</h2>
                <span class="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {{ roles.length }}
                </span>
              </div>
              
              <p class="text-xs text-gray-500 leading-relaxed">
                Profils d'accès et habilitations des collaborateurs (Conseillers, Risques, Comités, Administrateurs).
              </p>
            </div>

            <div class="pt-5 mt-4 border-t border-gray-100 flex items-center justify-between relative z-10">
              <span class="text-xs font-bold text-indigo-700 group-hover:translate-x-1 transition-transform inline-flex items-center">
                Configurer les rôles
                <svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
              </span>
              <span class="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">Habilitations</span>
            </div>
          </div>

          <!-- 6. CARTE NATURES JURIDIQUES -->
          <div (click)="goToSection('NATURES_JURIDIQUES')"
            class="bg-white rounded-3xl border-2 border-fuchsia-100 hover:border-fuchsia-500 p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden">
            <div class="absolute top-0 right-0 w-28 h-28 bg-fuchsia-50/60 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-300"></div>

            <div class="relative z-10">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-500 to-purple-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-fuchsia-500/30 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                </svg>
              </div>

              <div class="flex items-center space-x-2 mb-1.5">
                <h2 class="text-lg font-bold text-gray-900 group-hover:text-fuchsia-700 transition-colors">Natures Juridiques</h2>
                <span class="px-2 py-0.5 text-xs font-bold rounded-full bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200">
                  {{ naturesJuridiques.length }}
                </span>
              </div>
              
              <p class="text-xs text-gray-500 leading-relaxed">
                Formes légales des garanties (Acte notarié, sous seing privé, billet à ordre...)
              </p>
            </div>

            <div class="pt-5 mt-4 border-t border-gray-100 flex items-center justify-between relative z-10">
              <span class="text-xs font-bold text-fuchsia-700 group-hover:translate-x-1 transition-transform inline-flex items-center">
                Gérer les natures
                <svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
              </span>
              <span class="text-[10px] text-fuchsia-700 font-semibold bg-fuchsia-50 px-2 py-0.5 rounded-full">Légal</span>
            </div>
          </div>

          <!-- 6. CARTE CORBEILLE -->
          <div (click)="goToSection('CORBEILLE')"
            class="bg-white rounded-3xl border-2 border-amber-100 hover:border-amber-500 p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden">
            <div class="absolute top-0 right-0 w-28 h-28 bg-amber-50/60 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-300"></div>

            <div class="relative z-10">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </div>

              <div class="flex items-center space-x-2 mb-1.5">
                <h2 class="text-lg font-bold text-gray-900 group-hover:text-amber-700 transition-colors">Corbeille</h2>
                <span class="px-2 py-0.5 text-xs font-bold rounded-full"
                  [ngClass]="trashItems.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'">
                  {{ trashItems.length }}
                </span>
              </div>
              
              <p class="text-xs text-gray-500 leading-relaxed">
                Restaurez les catégories, objets de crédit, garanties, agences ou rôles supprimés sous 30 jours.
              </p>
            </div>

            <div class="pt-5 mt-4 border-t border-gray-100 flex items-center justify-between relative z-10">
              <span class="text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform inline-flex items-center">
                Consulter la corbeille
                <svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
              </span>
              <span class="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">30 jours</span>
            </div>
          </div>

        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- VUE : CATÉGORIES DE CRÉDIT (CRÉATION, MODIFICATION, SUPPRESSION)          -->
      <!-- ========================================================================= -->
      <div *ngIf="currentSection === 'CATEGORIES'" class="space-y-6 animate-fade-in">
        
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-[#e5f3f1] text-[#147c76] flex items-center justify-center font-bold">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            </div>
            <div>
              <h2 class="text-xl font-extrabold text-gray-900">Catégories & Familles de Prêt</h2>
              <p class="text-xs text-gray-500 mt-0.5">Secteurs d'activité, coefficients de risque et taux d'intérêt indicatifs</p>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <span class="px-3 py-1 bg-[#e5f3f1] text-[#147c76] border border-[#b9ded9] rounded-full text-xs font-bold font-mono">
              {{ categories.length }} catégorie(s) configurée(s)
            </span>
            <button (click)="openCreateCategorieModal()"
              class="bg-[#147c76] hover:bg-[#0e625e] text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-md shadow-[#147c76]/20 hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
              <span>Nouvelle Catégorie</span>
            </button>
          </div>
        </div>

        <div class="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm">
          
          <div *ngIf="categories.length === 0" class="text-center py-12 max-w-md mx-auto">
            <div class="w-16 h-16 bg-gray-50 text-gray-400 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            </div>
            <h3 class="text-base font-bold text-gray-900 mb-1">Aucune catégorie configurée</h3>
            <p class="text-xs text-gray-500 mb-5">Ajoutez une première catégorie sectorielle pour classifier vos objets de crédit.</p>
            <button (click)="openCreateCategorieModal()" class="bg-[#147c76] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow cursor-pointer">
              Ajouter une catégorie
            </button>
          </div>

          <!-- GRILLE DES CATÉGORIES -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" *ngIf="categories.length > 0">
            <div *ngFor="let cat of categories"
              class="bg-white rounded-2xl border border-gray-200 hover:border-[#147c76] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div class="flex items-start justify-between mb-2 gap-2">
                  <span class="px-2.5 py-0.5 rounded-lg text-xs font-bold border bg-emerald-50 text-emerald-800 border-emerald-200">
                    {{ cat.label }}
                  </span>
                  <button (click)="toggleCategorieActif(cat)" title="Activer / Désactiver"
                    class="px-2 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer transition-colors shrink-0"
                    [ngClass]="cat.actif ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'">
                    {{ cat.actif ? '✓ Actif' : 'Inactif' }}
                  </button>
                </div>

                <div class="flex items-center gap-2 mb-2">
                  <p class="text-[11px] font-mono text-gray-400">{{ cat.code }}</p>
                  <span *ngIf="cat.systeme" class="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">liée au modèle IA</span>
                </div>

                <p class="text-xs text-gray-600 line-clamp-2 leading-relaxed min-h-[32px]">
                  {{ cat.description || 'Catégorie de crédit du catalogue produits.' }}
                </p>

                <div class="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-center text-xs">
                  <div class="p-2 bg-slate-50 rounded-xl">
                    <span class="text-[10px] text-gray-400 block font-medium">Taux min.</span>
                    <span class="font-bold text-[#147c76]">{{ cat.tauxInteretMin ?? '—' }}%</span>
                  </div>
                  <div class="p-2 bg-slate-50 rounded-xl">
                    <span class="text-[10px] text-gray-400 block font-medium">Durée max.</span>
                    <span class="font-bold text-gray-800">{{ cat.dureeMaxMois ?? '—' }}m</span>
                  </div>
                </div>
              </div>

              <div class="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span class="text-[11px] text-gray-400">Créé le {{ cat.dateCreation | date:'dd/MM/yyyy' }}</span>
                <div class="flex items-center space-x-1">
                  <button (click)="openEditCategorieModal(cat)" title="Modifier cette catégorie"
                    class="text-gray-400 hover:text-[#147c76] p-1.5 rounded-lg hover:bg-emerald-50 transition-all cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button *ngIf="!cat.systeme" (click)="confirmDeleteCategorie(cat)" title="Supprimer"
                    class="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- VUE : OBJETS DE CRÉDIT (CRÉATION, MODIFICATION, SUPPRESSION)              -->
      <!-- ========================================================================= -->
      <div *ngIf="currentSection === 'OBJETS_CREDIT'" class="space-y-6 animate-fade-in">
        
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <h2 class="text-xl font-extrabold text-gray-900">Types d'Objets de Crédit</h2>
              <p class="text-xs text-gray-500 mt-0.5">Motifs de prêts proposés aux sociétaires lors des demandes de crédit</p>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <span class="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold font-mono">
              {{ objetsCredit.length }} objet(s) configuré(s)
            </span>
            <button (click)="openCreateObjetModal()"
              class="bg-[#147c76] hover:bg-[#0e625e] text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-md shadow-[#147c76]/20 hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
              <span>Nouvel Objet de Crédit</span>
            </button>
          </div>
        </div>

        <div class="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm">
          
          <div *ngIf="objetsCredit.length === 0" class="text-center py-12 max-w-md mx-auto">
            <div class="w-16 h-16 bg-gray-50 text-gray-400 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h3 class="text-base font-bold text-gray-900 mb-1">Aucun objet de crédit configuré</h3>
            <p class="text-xs text-gray-500 mb-5">Ajoutez des motifs de prêts (Commerce, Intrants, Élevage...) pour enrichir l'octroi de crédit.</p>
            <button (click)="openCreateObjetModal()" class="bg-[#147c76] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow cursor-pointer">
              Créer un objet de crédit
            </button>
          </div>

          <!-- GRILLE DES OBJETS DE CRÉDIT -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" *ngIf="objetsCredit.length > 0">
            <div *ngFor="let obj of objetsCredit"
              class="bg-white rounded-2xl border border-gray-200 hover:border-emerald-500 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div class="flex items-start justify-between mb-2">
                  <span class="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#e5f3f1] text-[#147c76] border border-[#b9ded9]">
                    {{ obj.categorie }}
                  </span>
                  <button (click)="toggleObjetActif(obj)" title="Activer / Désactiver"
                    class="px-2 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer transition-colors"
                    [ngClass]="obj.actif ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'">
                    {{ obj.actif ? '✓ Actif' : 'Inactif' }}
                  </button>
                </div>

                <h3 class="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors mt-1">
                  {{ obj.label }}
                </h3>
                <p class="text-[11px] font-mono text-gray-400 mb-2">{{ obj.code }}</p>

                <p class="text-xs text-gray-600 line-clamp-2 leading-relaxed min-h-[32px]">
                  {{ obj.description || 'Aucune description spécifique renseignée.' }}
                </p>

                <div class="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-center text-xs">
                  <div class="p-2 bg-gray-50 rounded-xl">
                    <span class="text-[10px] text-gray-400 block font-medium">Taux indicatif</span>
                    <span class="font-bold text-emerald-700">{{ obj.tauxInteretMin || 9.5 }}%</span>
                  </div>
                  <div class="p-2 bg-gray-50 rounded-xl">
                    <span class="text-[10px] text-gray-400 block font-medium">Durée max</span>
                    <span class="font-bold text-gray-800">{{ obj.dureeMaxMois || 12 }} mois</span>
                  </div>
                </div>
              </div>

              <div class="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span class="text-[11px] text-gray-400">Créé le {{ obj.dateCreation | date:'dd/MM/yyyy' }}</span>
                <div class="flex items-center space-x-1">
                  <button (click)="openEditObjetModal(obj)" title="Modifier cet objet"
                    class="text-gray-400 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-50 transition-all cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button (click)="confirmDeleteObjet(obj)" title="Déplacer vers la corbeille"
                    class="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- VUE : TYPES DE GARANTIES (CRÉATION, MODIFICATION, SUPPRESSION)            -->
      <!-- ========================================================================= -->
      <div *ngIf="currentSection === 'GARANTIES'" class="space-y-6 animate-fade-in">
        
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <div>
              <h2 class="text-xl font-extrabold text-gray-900">Types de Garanties & Sûretés</h2>
              <p class="text-xs text-gray-500 mt-0.5">Sûretés exigibles pour mitiger le risque de non-remboursement</p>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <span class="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs font-bold font-mono">
              {{ typesGaranties.length }} type(s) configuré(s)
            </span>
            <button type="button" (click)="openCreateGarantieModal()"
              class="bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-md shadow-teal-700/20 hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
              <span>Nouveau Type de Garantie</span>
            </button>
          </div>
        </div>

        <div class="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm">
          
          <div *ngIf="typesGaranties.length === 0" class="text-center py-12 max-w-md mx-auto">
            <div class="w-16 h-16 bg-gray-50 text-gray-400 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <h3 class="text-base font-bold text-gray-900 mb-1">Aucune garantie configurée</h3>
            <p class="text-xs text-gray-500 mb-5">Ajoutez des sûretés (Caution solidaire, Aval, Gage...) pour sécuriser les crédits.</p>
            <button type="button" (click)="openCreateGarantieModal()" class="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow cursor-pointer transition-colors">
              Créer une garantie
            </button>
          </div>

          <!-- GRILLE DES TYPES DE GARANTIE -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" *ngIf="typesGaranties.length > 0">
            <div *ngFor="let gar of typesGaranties"
              class="bg-white rounded-2xl border border-gray-200 hover:border-teal-500 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div class="flex items-start justify-between mb-2">
                  <span class="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-fuchsia-50 text-fuchsia-800 border border-fuchsia-200">
                    {{ getNatureLabel(gar.natureJuridiqueId) }}
                  </span>
                  <button (click)="toggleGarantieActif(gar)" title="Activer / Désactiver"
                    class="px-2 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer transition-colors"
                    [ngClass]="gar.actif ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'">
                    {{ gar.actif ? '✓ Actif' : 'Inactif' }}
                  </button>
                </div>

                <h3 class="text-sm font-bold text-gray-900 group-hover:text-teal-700 transition-colors mt-1">
                  {{ gar.label }}
                </h3>
                <p class="text-[11px] font-mono text-gray-400 mb-2">{{ gar.code }}</p>

                <p class="text-xs text-gray-600 line-clamp-2 leading-relaxed min-h-[32px]">
                  {{ gar.description || 'Aucune description spécifique renseignée.' }}
                </p>

                <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div class="flex items-center space-x-1.5">
                    <span class="w-2 h-2 rounded-full" [ngClass]="gar.exigeDocument ? 'bg-amber-500' : 'bg-gray-300'"></span>
                    <span class="text-gray-500 font-medium">{{ gar.exigeDocument ? 'Justificatif exigé' : 'Sans pièce obligatoire' }}</span>
                  </div>
                  <span class="font-bold text-teal-700 font-mono bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    {{ gar.tauxCouvertureRecommande || 100 }}% couverture
                  </span>
                </div>
              </div>

              <div class="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span class="text-[11px] text-gray-400">Créé le {{ gar.dateCreation | date:'dd/MM/yyyy' }}</span>
                <div class="flex items-center space-x-1">
                  <button (click)="openEditGarantieModal(gar)" title="Modifier cette garantie"
                    class="text-gray-400 hover:text-teal-700 p-1.5 rounded-lg hover:bg-teal-50 transition-all cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button (click)="confirmDeleteGarantie(gar)" title="Déplacer vers la corbeille"
                    class="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- VUE : NATURES JURIDIQUES (CRÉATION, MODIFICATION, SUPPRESSION)            -->
      <!-- ========================================================================= -->
      <div *ngIf="currentSection === 'NATURES_JURIDIQUES'" class="space-y-6 animate-fade-in">
        
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-fuchsia-50 text-fuchsia-700 flex items-center justify-center font-bold">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            </div>
            <div>
              <h2 class="text-xl font-extrabold text-gray-900">Natures Juridiques</h2>
              <p class="text-xs text-gray-500 mt-0.5">Formes légales sous lesquelles les garanties sont formalisées</p>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <span class="px-3 py-1 bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 rounded-full text-xs font-bold font-mono">
              {{ naturesJuridiques.length }} nature(s) configurée(s)
            </span>
            <button type="button" (click)="openCreateNatureModal()"
              class="bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-md shadow-fuchsia-600/20 hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
              <span>Nouvelle Nature</span>
            </button>
          </div>
        </div>

        <div class="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm">
          
          <div *ngIf="naturesJuridiques.length === 0" class="text-center py-12 max-w-md mx-auto">
            <div class="w-16 h-16 bg-gray-50 text-gray-400 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            </div>
            <h3 class="text-base font-bold text-gray-900 mb-1">Aucune nature juridique configurée</h3>
            <p class="text-xs text-gray-500 mb-5">Ajoutez des natures juridiques (Acte notarié, Billet à ordre...) pour classifier vos garanties.</p>
            <button type="button" (click)="openCreateNatureModal()" class="bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow cursor-pointer transition-colors">
              Créer une nature
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" *ngIf="naturesJuridiques.length > 0">
            <div *ngFor="let nat of naturesJuridiques"
              class="bg-white rounded-2xl border border-gray-200 hover:border-fuchsia-500 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div class="flex items-start justify-between mb-2">
                  <span class="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-fuchsia-50 text-fuchsia-800 border border-fuchsia-200">
                    Légal
                  </span>
                  <button (click)="toggleNatureActif(nat)" title="Activer / Désactiver"
                    class="px-2 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer transition-colors"
                    [ngClass]="nat.actif ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'">
                    {{ nat.actif ? '✓ Actif' : 'Inactif' }}
                  </button>
                </div>

                <h3 class="text-sm font-bold text-gray-900 group-hover:text-fuchsia-700 transition-colors mt-1">
                  {{ nat.label }}
                </h3>
                <p class="text-[11px] font-mono text-gray-400 mb-2">{{ nat.code }}</p>

                <p class="text-xs text-gray-600 line-clamp-2 leading-relaxed min-h-[32px]">
                  {{ nat.description || 'Aucune description.' }}
                </p>

                <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div class="flex flex-col space-y-1">
                    <span *ngIf="nat.necessiteNotaire" class="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full inline-block w-fit">Notaire requis</span>
                    <span *ngIf="nat.fraisEnregistrement" class="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full inline-block w-fit">Frais d'enregistrement</span>
                  </div>
                </div>
              </div>

              <div class="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span class="text-[11px] text-gray-400">Créé le {{ nat.dateCreation | date:'dd/MM/yyyy' }}</span>
                <div class="flex items-center space-x-1">
                  <button (click)="openEditNatureModal(nat)" title="Modifier cette nature"
                    class="text-gray-400 hover:text-fuchsia-700 p-1.5 rounded-lg hover:bg-fuchsia-50 transition-all cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button (click)="confirmDeleteNature(nat)" title="Déplacer vers la corbeille"
                    class="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- VUE : AGENCES CIF (CRÉATION, MODIFICATION, SUPPRESSION)                   -->
      <!-- ========================================================================= -->
      <div *ngIf="currentSection === 'AGENCES'" class="space-y-6 animate-fade-in">
        
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            </div>
            <div>
              <h2 class="text-xl font-extrabold text-gray-900">Agences du Réseau CIF</h2>
              <p class="text-xs text-gray-500 mt-0.5">Caisses populaires, délégations régionales et points de service bancaires</p>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <span class="px-3 py-1 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-full text-xs font-bold font-mono">
              {{ agences.length }} agence(s) active(s)
            </span>
            <button (click)="openCreateAgenceModal()"
              class="bg-cyan-700 hover:bg-cyan-800 text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-md shadow-cyan-700/20 hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
              <span>Nouvelle Agence CIF</span>
            </button>
          </div>
        </div>

        <div class="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm">
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" *ngIf="agences.length > 0">
            <div *ngFor="let ag of agences"
              class="bg-white rounded-2xl border border-gray-200 hover:border-cyan-600 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div class="flex items-start justify-between mb-2">
                  <span class="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                    {{ ag.region }}
                  </span>
                  <span class="text-[11px] font-mono font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
                    {{ ag.code }}
                  </span>
                </div>

                <h3 class="text-sm font-bold text-gray-900 group-hover:text-cyan-700 transition-colors mt-1">
                  {{ ag.nom }}
                </h3>

                <p class="text-xs text-gray-600 mt-2 flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <span class="truncate">{{ ag.ville }}, {{ ag.pays }}</span>
                </p>

                <p *ngIf="ag.adresse" class="text-[11px] text-gray-500 mt-1 pl-5 truncate">
                  {{ ag.adresse }}
                </p>

                <p *ngIf="ag.telephone" class="text-xs text-cyan-700 font-mono mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  <span>{{ ag.telephone }}</span>
                </p>
              </div>

              <div class="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span class="text-[11px] text-gray-400">Réseau CIF</span>
                <div class="flex items-center space-x-1">
                  <button (click)="openEditAgenceModal(ag)" title="Modifier cette agence"
                    class="text-gray-400 hover:text-cyan-700 p-1.5 rounded-lg hover:bg-cyan-50 transition-all cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button (click)="confirmDeleteAgence(ag)" title="Déplacer vers la corbeille"
                    class="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- VUE : RÔLES AGENTS (CRÉATION, MODIFICATION, SUPPRESSION)                  -->
      <!-- ========================================================================= -->
      <div *ngIf="currentSection === 'ROLES'" class="space-y-6 animate-fade-in">
        
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            </div>
            <div>
              <h2 class="text-xl font-extrabold text-gray-900">Rôles & Habilitations Agents</h2>
              <p class="text-xs text-gray-500 mt-0.5">Créez et personnalisez les profils d'accès aux dossiers de crédit</p>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <span class="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold font-mono">
              {{ roles.length }} rôle(s) défini(s)
            </span>
            <button (click)="openCreateRoleModal()"
              class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
              <span>Nouveau Rôle</span>
            </button>
          </div>
        </div>

        <div class="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm">
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" *ngIf="roles.length > 0">
            <div *ngFor="let role of roles"
              class="bg-white rounded-2xl border border-gray-200 hover:border-indigo-500 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div class="flex items-start justify-between mb-3">
                  <span class="px-3 py-1 rounded-xl text-xs font-bold border" [ngClass]="role.badgeColor">
                    {{ role.label }}
                  </span>
                  <span class="text-[11px] font-mono font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
                    {{ role.code }}
                  </span>
                </div>

                <p class="text-xs text-gray-600 line-clamp-2 mt-2 leading-relaxed min-h-[32px]">
                  {{ role.description || 'Aucune description spécifique renseignée.' }}
                </p>
              </div>

              <div class="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span class="text-[11px] text-gray-400">Créé le {{ role.dateCreation | date:'dd/MM/yyyy' }}</span>
                <div class="flex items-center space-x-1">
                  <button (click)="openEditRoleModal(role)" title="Modifier ce rôle"
                    class="text-gray-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition-all cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button (click)="confirmDeleteRole(role)" title="Déplacer vers la corbeille"
                    class="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- VUE : CORBEILLE (RÉCUPÉRATION SOUS 30 JOURS)                              -->
      <!-- ========================================================================= -->
      <div *ngIf="currentSection === 'CORBEILLE'" class="space-y-6 animate-fade-in">
        
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </div>
            <div>
              <h2 class="text-xl font-extrabold text-gray-900">Corbeille & Restauration</h2>
              <p class="text-xs text-gray-500 mt-0.5">Rétention de 30 jours avant purge définitive des données</p>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <span class="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold font-mono">
              {{ trashItems.length }} élément(s)
            </span>
            <button *ngIf="trashItems.length > 0" (click)="emptyTrashConfirm()"
              class="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-sm font-bold px-4 py-2 rounded-2xl transition-all cursor-pointer">
              Vider la corbeille
            </button>
          </div>
        </div>

        <div class="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm">
          
          <div *ngIf="trashItems.length === 0" class="text-center py-16 px-4 max-w-md mx-auto">
            <div class="w-20 h-20 bg-gray-50 text-gray-400 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">La corbeille est vide</h3>
            <p class="text-sm text-gray-500">
              Aucun élément n'a été mis à la corbeille récemment.
            </p>
          </div>

          <!-- Liste des éléments de la corbeille -->
          <div class="divide-y divide-gray-100 mt-2" *ngIf="trashItems.length > 0">
            <div *ngFor="let item of trashItems" class="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/70 p-3 rounded-2xl transition-colors">
              <div class="flex items-start space-x-3.5">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 text-center leading-tight px-1"
                  [ngClass]="{
                    'bg-[#e5f3f1] text-[#147c76]': item.type === 'CATEGORIE',
                    'bg-emerald-100 text-emerald-800': item.type === 'OBJET_CREDIT',
                    'bg-teal-100 text-teal-800': item.type === 'GARANTIE',
                    'bg-cyan-100 text-cyan-800': item.type === 'AGENCE',
                    'bg-indigo-100 text-indigo-700': item.type === 'ROLE',
                    'bg-gray-100 text-gray-700': item.type === 'AGENT'
                  }">
                  {{ item.typeLabel }}
                </div>
                <div>
                  <h4 class="text-sm font-bold text-gray-900">{{ item.title }}</h4>
                  <p class="text-xs text-gray-500 mt-0.5">{{ item.details }}</p>
                  <div class="flex items-center space-x-3 mt-1.5 text-[11px] text-gray-400">
                    <span>Supprimé le {{ item.dateSuppression | date:'dd/MM/yyyy HH:mm' }}</span>
                    <span>•</span>
                    <span class="text-amber-700 font-semibold">Purge auto sous {{ item.delaiJours }} jours</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center space-x-2 self-end sm:self-auto">
                <button (click)="restoreItem(item)"
                  class="bg-emerald-50 hover:bg-emerald-100 text-[#147c76] border border-[#b9ded9] text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  <span>Restaurer</span>
                </button>
                <button (click)="permanentDeleteItem(item)"
                  class="bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 p-2 rounded-xl border border-gray-200 transition-all cursor-pointer"
                  title="Purger définitivement">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

    <!-- ========================================================================= -->
    <!-- MODAL : CRÉER / MODIFIER UNE CATÉGORIE DE PRÊT                            -->
    <!-- ========================================================================= -->
    <div *ngIf="isCategorieModalOpen" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div class="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden my-auto">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-white">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-[#e5f3f1] text-[#147c76] flex items-center justify-center font-bold flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-bold text-gray-900 leading-tight">{{ isEditingCategorie ? 'Modifier la Catégorie' : 'Nouvelle Catégorie de Prêt' }}</h3>
              <p class="text-xs text-gray-500 mt-0.5">Secteur d'activité, coefficient de risque et barèmes</p>
            </div>
          </div>
          <button (click)="closeCategorieModal()" class="text-gray-400 hover:text-gray-700 text-lg font-bold p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Fermer">✕</button>
        </div>

        <form (ngSubmit)="submitCategorieForm()" class="flex flex-col flex-1 overflow-hidden">
          <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div *ngIf="editingCategorieSysteme" class="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Catégorie système : son libellé est consommé par le modèle IA et ne peut pas être renommé. Seuls le taux, la durée et l'état actif sont modifiables.
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Libellé de la Catégorie *</label>
              <input type="text" [(ngModel)]="categorieFormData.label" name="catLabel" (input)="autoGenerateCategorieCode()" required
                [disabled]="editingCategorieSysteme" placeholder="Ex: Crédit transport"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#147c76] disabled:bg-gray-100 disabled:text-gray-500" />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Code Technique (Unique) *</label>
              <input type="text" [(ngModel)]="categorieFormData.code" name="catCode" required
                [disabled]="editingCategorieSysteme" placeholder="Ex: CAT_TRANSPORT"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:border-[#147c76] bg-gray-50/50 disabled:bg-gray-100 disabled:text-gray-500" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Taux d'intérêt min. (%)</label>
                <input type="number" [(ngModel)]="categorieFormData.tauxInteretMin" name="catTaux" step="0.5" min="1" max="40"
                  class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-bold text-[#147c76]" />
              </div>
              <div>
                <label class="block text-[11px] font-bold text-gray-700 uppercase mb-1">Durée max. (mois)</label>
                <input type="number" [(ngModel)]="categorieFormData.dureeMaxMois" name="catDuree" min="1" max="120"
                  class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-800" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Description & Domaine financé</label>
              <textarea [(ngModel)]="categorieFormData.description" name="catDesc" rows="2"
                placeholder="Précisez les types d'activités couvertes..."
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#147c76]"></textarea>
            </div>

            <div class="flex items-center space-x-2 pt-1">
              <input type="checkbox" id="catActif" [(ngModel)]="categorieFormData.actif" name="catActif" class="w-4 h-4 text-[#147c76] rounded cursor-pointer" />
              <label for="catActif" class="text-xs font-medium text-gray-700 cursor-pointer">Catégorie active (proposée lors de l'ajout d'objets)</label>
            </div>
          </div>

          <div class="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
            <button type="button" (click)="closeCategorieModal()" class="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer">Annuler</button>
            <button type="submit" [disabled]="!categorieFormData.label || !categorieFormData.code"
              class="bg-[#147c76] hover:bg-[#0e625e] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all disabled:opacity-40 cursor-pointer">
              {{ isEditingCategorie ? 'Mettre à jour' : 'Enregistrer la catégorie' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL : CRÉER / MODIFIER UN OBJET DE CRÉDIT                               -->
    <!-- ========================================================================= -->
    <div *ngIf="isObjetModalOpen" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div class="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden my-auto">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-white">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-bold text-gray-900 leading-tight">{{ isEditingObjet ? 'Modifier l\'Objet de Crédit' : 'Nouvel Objet de Crédit' }}</h3>
              <p class="text-xs text-gray-500 mt-0.5">Définissez le motif, la catégorie rattachée et les barèmes</p>
            </div>
          </div>
          <button (click)="closeObjetModal()" class="text-gray-400 hover:text-gray-700 text-lg font-bold p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Fermer">✕</button>
        </div>

        <form (ngSubmit)="submitObjetForm()" class="flex flex-col flex-1 overflow-hidden">
          <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Libellé de l'Objet *</label>
              <input type="text" [(ngModel)]="objetFormData.label" name="objLabel" (input)="autoGenerateObjetCode()" required
                placeholder="Ex: Achat d'Engrais & Semences"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500" />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Code Technique (Unique) *</label>
              <input type="text" [(ngModel)]="objetFormData.code" name="objCode" required
                placeholder="Ex: AGRI_INTRANTS_CAMPAGNE"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:border-emerald-500 bg-gray-50/50" />
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">Catégorie de Rattachement *</label>
                <button type="button" (click)="closeObjetModal(); goToSection('CATEGORIES')" class="text-[11px] text-[#147c76] hover:underline font-semibold cursor-pointer">
                  + Gérer les catégories
                </button>
              </div>
              <select [(ngModel)]="objetFormData.categorie" name="objCat" required
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white">
                <option value="" disabled>-- Sélectionnez une catégorie --</option>
                <option *ngFor="let cat of categories" [value]="cat.label">
                  {{ cat.label }}
                </option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Taux Intérêt Min (%)</label>
                <input type="number" [(ngModel)]="objetFormData.tauxInteretMin" name="objTaux" step="0.5" min="1" max="30"
                  placeholder="Ex: 9.5"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-emerald-700 focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Durée Max (Mois)</label>
                <input type="number" [(ngModel)]="objetFormData.dureeMaxMois" name="objDuree" min="1" max="120"
                  placeholder="Ex: 12"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Description & Usage</label>
              <textarea [(ngModel)]="objetFormData.description" name="objDesc" rows="2"
                placeholder="Décrivez l'utilisation du crédit..."
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500"></textarea>
            </div>

            <div class="flex items-center space-x-2 pt-1">
              <input type="checkbox" id="objActif" [(ngModel)]="objetFormData.actif" name="objActif" class="w-4 h-4 text-emerald-600 rounded cursor-pointer" />
              <label for="objActif" class="text-xs font-medium text-gray-700 cursor-pointer">Objet de crédit actif (visible dans le formulaire d'octroi)</label>
            </div>
          </div>

          <div class="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
            <button type="button" (click)="closeObjetModal()" class="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer">Annuler</button>
            <button type="submit" [disabled]="!objetFormData.label || !objetFormData.code || !objetFormData.categorie"
              class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all disabled:opacity-40 cursor-pointer">
              {{ isEditingObjet ? 'Mettre à jour' : 'Enregistrer l\'objet' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL : CRÉER / MODIFIER UNE GARANTIE                                     -->
    <!-- ========================================================================= -->
    <div *ngIf="isGarantieModalOpen" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div class="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden my-auto">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-white">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-bold text-gray-900 leading-tight">{{ isEditingGarantie ? 'Modifier le Type de Garantie' : 'Nouveau Type de Garantie' }}</h3>
              <p class="text-xs text-gray-500 mt-0.5">Nature juridique, taux de couverture et justificatifs</p>
            </div>
          </div>
          <button (click)="closeGarantieModal()" class="text-gray-400 hover:text-gray-700 text-lg font-bold p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Fermer">✕</button>
        </div>

        <form (ngSubmit)="submitGarantieForm()" class="flex flex-col flex-1 overflow-hidden">
          <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Libellé de la Garantie *</label>
              <input type="text" [(ngModel)]="garantieFormData.label" name="garLabel" (input)="autoGenerateGarantieCode()" required
                placeholder="Ex: Hypothèque Foncière Notariée"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-teal-500" />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Code Technique (Unique) *</label>
              <input type="text" [(ngModel)]="garantieFormData.code" name="garCode" required
                placeholder="Ex: HYPOTHEQUE_FONCIERE"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:border-teal-500 bg-gray-50/50" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Nature Juridique *</label>
                <select [(ngModel)]="garantieFormData.natureJuridiqueId" name="garNatureId" required
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-teal-500 bg-white">
                  <option value="" disabled>Sélectionnez une nature juridique...</option>
                  <option *ngFor="let nat of naturesJuridiques" [value]="nat.id">{{ nat.label }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Taux Couverture Recommandé (%)</label>
                <input type="number" [(ngModel)]="garantieFormData.tauxCouvertureRecommande" name="garTaux" min="10" max="300"
                  placeholder="Ex: 120"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-teal-700 focus:outline-none focus:border-teal-500" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Description & Formalités</label>
              <textarea [(ngModel)]="garantieFormData.description" name="garDesc" rows="2"
                placeholder="Conditions juridiques ou pièces nécessaires..."
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-teal-500"></textarea>
            </div>

            <div class="space-y-2 pt-1">
              <div class="flex items-center space-x-2">
                <input type="checkbox" id="garDoc" [(ngModel)]="garantieFormData.exigeDocument" name="garDoc" class="w-4 h-4 text-teal-600 rounded cursor-pointer" />
                <label for="garDoc" class="text-xs font-medium text-gray-700 cursor-pointer">Exige un document ou justificatif officiel (acte signé, titre...)</label>
              </div>
              <div class="flex items-center space-x-2">
                <input type="checkbox" id="garActif" [(ngModel)]="garantieFormData.actif" name="garActif" class="w-4 h-4 text-teal-600 rounded cursor-pointer" />
                <label for="garActif" class="text-xs font-medium text-gray-700 cursor-pointer">Garantie active (disponible lors des demandes de prêt)</label>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
            <button type="button" (click)="closeGarantieModal()" class="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer">Annuler</button>
            <button type="submit" [disabled]="!garantieFormData.label || !garantieFormData.code"
              class="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all disabled:opacity-40 cursor-pointer">
              {{ isEditingGarantie ? 'Mettre à jour' : 'Enregistrer la garantie' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL : CRÉER / MODIFIER UNE AGENCE CIF                                   -->
    <!-- ========================================================================= -->
    <div *ngIf="isAgenceModalOpen" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div class="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden my-auto">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-white">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-bold text-gray-900 leading-tight">{{ isEditingAgence ? 'Modifier l\'Agence CIF' : 'Nouvelle Agence CIF' }}</h3>
              <p class="text-xs text-gray-500 mt-0.5">Ajoutez une caisse populaire ou délégation au réseau</p>
            </div>
          </div>
          <button (click)="closeAgenceModal()" class="text-gray-400 hover:text-gray-700 text-lg font-bold p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Fermer">✕</button>
        </div>

        <form (ngSubmit)="submitAgenceForm()" class="flex flex-col flex-1 overflow-hidden">
          <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Nom de l'Agence / Caisse *</label>
              <input type="text" [(ngModel)]="agenceFormData.nom" name="agenceNom" (input)="autoGenerateAgenceCode()" required
                placeholder="Ex: Caisse Populaire Koudougou Centre"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-cyan-600" />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Code Agence *</label>
              <input type="text" [(ngModel)]="agenceFormData.code" name="agenceCode" required
                placeholder="Ex: AGC_KOUDOUGOU"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:border-cyan-600 bg-gray-50/50" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Ville *</label>
                <input type="text" [(ngModel)]="agenceFormData.ville" name="agenceVille" required
                  placeholder="Ex: Koudougou"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-cyan-600" />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Région *</label>
                <input type="text" [(ngModel)]="agenceFormData.region" name="agenceRegion" required
                  placeholder="Ex: Centre-Ouest"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-cyan-600" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Pays *</label>
                <input type="text" [(ngModel)]="agenceFormData.pays" name="agencePays" required
                  placeholder="Ex: Burkina Faso"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-cyan-600" />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Téléphone</label>
                <input type="text" [(ngModel)]="agenceFormData.telephone" name="agenceTel"
                  placeholder="Ex: +226 25 44 00 00"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-cyan-600" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Adresse Géographique</label>
              <input type="text" [(ngModel)]="agenceFormData.adresse" name="agenceAdr"
                placeholder="Ex: Place Maurice Yaméogo, Secteur 3"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-cyan-600" />
            </div>
          </div>

          <div class="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
            <button type="button" (click)="closeAgenceModal()" class="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer">Annuler</button>
            <button type="submit" [disabled]="!agenceFormData.nom || !agenceFormData.code || !agenceFormData.ville || !agenceFormData.region"
              class="bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all disabled:opacity-40 cursor-pointer">
              {{ isEditingAgence ? 'Mettre à jour' : 'Créer l\'agence' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL : CRÉER / MODIFIER UN RÔLE                                          -->
    <!-- ========================================================================= -->
    <div *ngIf="isRoleModalOpen" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div class="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden my-auto">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-white">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-bold text-gray-900 leading-tight">{{ isEditingRole ? 'Modifier le Rôle' : 'Nouveau Rôle Agent' }}</h3>
              <p class="text-xs text-gray-500 mt-0.5">Intitulé et code d'habilitation</p>
            </div>
          </div>
          <button (click)="closeRoleModal()" class="text-gray-400 hover:text-gray-700 text-lg font-bold p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Fermer">✕</button>
        </div>

        <form (ngSubmit)="submitRoleForm()" class="flex flex-col flex-1 overflow-hidden">
          <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Nom du Rôle *</label>
              <input type="text" [(ngModel)]="roleFormData.label" name="roleLabel" (input)="autoGenerateCode()" required
                placeholder="Ex: Chargé de Recouvrement"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600" />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Code Technique (Unique) *</label>
              <input type="text" [(ngModel)]="roleFormData.code" name="roleCode" required
                placeholder="Ex: CHARGE_RECOUVREMENT"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:border-indigo-600 bg-gray-50/50" />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Description des prérogatives</label>
              <textarea [(ngModel)]="roleFormData.description" name="roleDesc" rows="3"
                placeholder="Description des responsabilités..."
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600"></textarea>
            </div>
          </div>

          <div class="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
            <button type="button" (click)="closeRoleModal()" class="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer">Annuler</button>
            <button type="submit" [disabled]="!roleFormData.label || !roleFormData.code"
              class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all disabled:opacity-40 cursor-pointer">
              {{ isEditingRole ? 'Mettre à jour' : 'Créer le rôle' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL : CRÉER / MODIFIER UNE NATURE JURIDIQUE                             -->
    <!-- ========================================================================= -->
    <div *ngIf="isNatureModalOpen" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div class="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden my-auto">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-white">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-fuchsia-50 text-fuchsia-700 flex items-center justify-center font-bold flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-bold text-gray-900 leading-tight">{{ isEditingNature ? 'Modifier la Nature Juridique' : 'Nouvelle Nature Juridique' }}</h3>
              <p class="text-xs text-gray-500 mt-0.5">Paramétrage légal de la garantie</p>
            </div>
          </div>
          <button (click)="closeNatureModal()" class="text-gray-400 hover:text-gray-700 text-lg font-bold p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Fermer">✕</button>
        </div>

        <form (ngSubmit)="submitNatureForm()" class="flex flex-col flex-1 overflow-hidden">
          <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Libellé de la Nature *</label>
              <input type="text" [(ngModel)]="natureFormData.label" name="natLabel" (input)="autoGenerateNatureCode()" required
                placeholder="Ex: Acte Notarié, Sous Seing Privé..."
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-fuchsia-600" />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Code Unique *</label>
              <input type="text" [(ngModel)]="natureFormData.code" name="natCode" required
                placeholder="Ex: NAT_ACTE_NOTARIE"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:border-fuchsia-600 bg-gray-50/50" />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Description</label>
              <textarea [(ngModel)]="natureFormData.description" name="natDesc" rows="2"
                placeholder="Description des implications légales..."
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-fuchsia-600"></textarea>
            </div>

            <div class="space-y-2 pt-1">
              <div class="flex items-center space-x-2">
                <input type="checkbox" id="natNotaire" [(ngModel)]="natureFormData.necessiteNotaire" name="natNotaire" class="w-4 h-4 text-fuchsia-600 rounded cursor-pointer" />
                <label for="natNotaire" class="text-xs font-medium text-gray-700 cursor-pointer">L'intervention d'un notaire est exigée</label>
              </div>
              <div class="flex items-center space-x-2">
                <input type="checkbox" id="natFrais" [(ngModel)]="natureFormData.fraisEnregistrement" name="natFrais" class="w-4 h-4 text-fuchsia-600 rounded cursor-pointer" />
                <label for="natFrais" class="text-xs font-medium text-gray-700 cursor-pointer">Soumis à des frais d'enregistrement domaniaux/fiscaux</label>
              </div>
              <div class="flex items-center space-x-2">
                <input type="checkbox" id="natActif" [(ngModel)]="natureFormData.actif" name="natActif" class="w-4 h-4 text-fuchsia-600 rounded cursor-pointer" />
                <label for="natActif" class="text-xs font-medium text-gray-700 cursor-pointer">Nature active (disponible lors du paramétrage)</label>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
            <button type="button" (click)="closeNatureModal()" class="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer">Annuler</button>
            <button type="submit" [disabled]="!natureFormData.label || !natureFormData.code"
              class="bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all disabled:opacity-40 cursor-pointer">
              {{ isEditingNature ? 'Mettre à jour' : 'Enregistrer la nature' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL CONFIRMATION SUPPRESSION NATURE JURIDIQUE -->
    <div *ngIf="natureToDelete" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-gray-100 my-auto">
        <div class="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </div>
        <div class="text-center">
          <h3 class="text-lg font-bold text-gray-900">Mettre à la corbeille ?</h3>
          <p class="text-xs text-gray-500 mt-1">
            Voulez-vous déplacer la nature <strong>"{{ natureToDelete.label }}"</strong> vers la corbeille ? Elle restera restaurable pendant 30 jours.
          </p>
        </div>
        <div class="flex items-center justify-center space-x-3 pt-2">
          <button (click)="natureToDelete = null" class="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">Annuler</button>
          <button (click)="executeDeleteNature()" class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer">
            Déplacer vers la corbeille
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL CONFIRMATION SUPPRESSION CATEGORIE -->
    <div *ngIf="categorieToDelete" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-gray-100 my-auto">
        <div class="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </div>
        <div class="text-center">
          <h3 class="text-lg font-bold text-gray-900">Mettre à la corbeille ?</h3>
          <p class="text-xs text-gray-500 mt-1">
            Voulez-vous déplacer la catégorie <strong>"{{ categorieToDelete.label }}"</strong> vers la corbeille ? Elle restera restaurable pendant 30 jours.
          </p>
        </div>
        <div class="flex items-center justify-center space-x-3 pt-2">
          <button (click)="categorieToDelete = null" class="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">Annuler</button>
          <button (click)="executeDeleteCategorie()" class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer">
            Déplacer vers la corbeille
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL CONFIRMATION SUPPRESSION OBJET -->
    <div *ngIf="objetToDelete" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-gray-100 my-auto">
        <div class="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </div>
        <div class="text-center">
          <h3 class="text-lg font-bold text-gray-900">Mettre à la corbeille ?</h3>
          <p class="text-xs text-gray-500 mt-1">
            Voulez-vous déplacer l'objet <strong>"{{ objetToDelete.label }}"</strong> vers la corbeille ? Il restera restaurable pendant 30 jours.
          </p>
        </div>
        <div class="flex items-center justify-center space-x-3 pt-2">
          <button (click)="objetToDelete = null" class="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">Annuler</button>
          <button (click)="executeDeleteObjet()" class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer">
            Déplacer vers la corbeille
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL CONFIRMATION SUPPRESSION GARANTIE -->
    <div *ngIf="garantieToDelete" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-gray-100 my-auto">
        <div class="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </div>
        <div class="text-center">
          <h3 class="text-lg font-bold text-gray-900">Mettre à la corbeille ?</h3>
          <p class="text-xs text-gray-500 mt-1">
            Voulez-vous déplacer la garantie <strong>"{{ garantieToDelete.label }}"</strong> vers la corbeille ? Elle restera restaurable pendant 30 jours.
          </p>
        </div>
        <div class="flex items-center justify-center space-x-3 pt-2">
          <button (click)="garantieToDelete = null" class="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">Annuler</button>
          <button (click)="executeDeleteGarantie()" class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer">
            Déplacer vers la corbeille
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL CONFIRMATION SUPPRESSION ROLE -->
    <div *ngIf="roleToDelete" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-gray-100 my-auto">
        <div class="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </div>
        <div class="text-center">
          <h3 class="text-lg font-bold text-gray-900">Mettre à la corbeille ?</h3>
          <p class="text-xs text-gray-500 mt-1">
            Voulez-vous déplacer le rôle <strong>"{{ roleToDelete.label }}"</strong> vers la corbeille ? Il restera restaurable pendant 30 jours.
          </p>
        </div>
        <div class="flex items-center justify-center space-x-3 pt-2">
          <button (click)="roleToDelete = null" class="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">Annuler</button>
          <button (click)="executeDeleteRole()" class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer">
            Déplacer vers la corbeille
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL CONFIRMATION SUPPRESSION AGENCE -->
    <div *ngIf="agenceToDelete" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-gray-100 my-auto">
        <div class="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </div>
        <div class="text-center">
          <h3 class="text-lg font-bold text-gray-900">Mettre à la corbeille ?</h3>
          <p class="text-xs text-gray-500 mt-1">
            Voulez-vous déplacer l'agence <strong>"{{ agenceToDelete.nom }}"</strong> vers la corbeille ? Elle restera restaurable pendant 30 jours.
          </p>
        </div>
        <div class="flex items-center justify-center space-x-3 pt-2">
          <button (click)="agenceToDelete = null" class="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">Annuler</button>
          <button (click)="executeDeleteAgence()" class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer">
            Déplacer vers la corbeille
          </button>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.25s ease-out forwards;
    }
  `]
})
export class ParametresComponent implements OnInit {
  private authService = inject(AuthService);
  private settingsService = inject(SettingsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  currentSection: ParamSection = 'HUB';
  notificationMessage = '';

  // Données dynamiques
  categories: CategorieCreditItem[] = [];
  objetsCredit: ObjetCreditItem[] = [];
  typesGaranties: GarantieItem[] = [];
  naturesJuridiques: NatureJuridiqueItem[] = [];
  roles: AgentRole[] = [];
  agences: AgenceCIF[] = [];
  trashItems: CorbeilleItem[] = [];

  // Modals & Forms : Catégories
  isCategorieModalOpen = false;
  isEditingCategorie = false;
  editingCategorieId: any = null;
  editingCategorieSysteme = false;
  categorieToDelete: CategorieCreditItem | null = null;
  categorieFormData: {
    label: string;
    code: string;
    description: string;
    tauxInteretMin: number;
    dureeMaxMois: number;
    actif: boolean;
  } = {
    label: '',
    code: '',
    description: '',
    tauxInteretMin: 10,
    dureeMaxMois: 24,
    actif: true
  };

  // Modals & Forms : Objets de Crédit
  isObjetModalOpen = false;
  isEditingObjet = false;
  editingObjetId: any = null;
  objetToDelete: ObjetCreditItem | null = null;
  objetFormData: {
    label: string;
    code: string;
    categorie: string;
    description: string;
    tauxInteretMin?: number;
    dureeMaxMois?: number;
    actif: boolean;
  } = {
    label: '',
    code: '',
    categorie: '',
    description: '',
    tauxInteretMin: 9.5,
    dureeMaxMois: 12,
    actif: true
  };

  // Modals & Forms : Types de Garanties
  isGarantieModalOpen = false;
  isEditingGarantie = false;
  editingGarantieId: any = null;
  garantieToDelete: GarantieItem | null = null;
  garantieFormData: {
    label: string;
    code: string;
    natureJuridiqueId: string;
    tauxCouvertureRecommande?: number;
    description: string;
    exigeDocument: boolean;
    actif: boolean;
  } = {
    label: '',
    code: '',
    natureJuridiqueId: '',
    tauxCouvertureRecommande: 100,
    description: '',
    exigeDocument: false,
    actif: true
  };

  // Modals & Forms : Natures Juridiques
  isNatureModalOpen = false;
  isEditingNature = false;
  editingNatureId: any = null;
  natureToDelete: NatureJuridiqueItem | null = null;
  natureFormData: {
    label: string;
    code: string;
    description: string;
    necessiteNotaire: boolean;
    fraisEnregistrement: boolean;
    actif: boolean;
  } = {
    label: '',
    code: '',
    description: '',
    necessiteNotaire: false,
    fraisEnregistrement: false,
    actif: true
  };

  // Modals & Forms : Rôles
  isRoleModalOpen = false;
  isEditingRole = false;
  editingRoleId: string | null = null;
  roleToDelete: AgentRole | null = null;
  roleFormData = {
    label: '',
    code: '',
    description: ''
  };

  // Modals & Forms : Agences
  isAgenceModalOpen = false;
  isEditingAgence = false;
  editingAgenceId: string | null = null;
  agenceToDelete: AgenceCIF | null = null;
  agenceFormData = {
    nom: '',
    code: '',
    pays: '',
    ville: '',
    region: '',
    telephone: '',
    adresse: ''
  };

  ngOnInit() {
    this.authService.roles$.subscribe(list => this.roles = list || []);
    this.authService.agences$.subscribe(list => this.agences = list || []);
    this.authService.trash$.subscribe(items => this.trashItems = items || []);
    this.settingsService.categoriesCredit$.subscribe(list => this.categories = list || []);
    this.settingsService.objets$.subscribe(list => this.objetsCredit = list || []);
    this.settingsService.garanties$.subscribe(list => this.typesGaranties = list || []);
    this.settingsService.naturesJuridiques$.subscribe(list => this.naturesJuridiques = list || []);

    this.route.queryParamMap.subscribe(params => {
      const tab = params.get('tab');
      if (tab && ['HUB', 'CATEGORIES', 'OBJETS_CREDIT', 'GARANTIES', 'NATURES_JURIDIQUES', 'AGENCES', 'ROLES', 'CORBEILLE'].includes(tab)) {
        this.currentSection = tab as ParamSection;
        this.loadSectionData(tab as ParamSection);
      } else {
        this.currentSection = 'HUB';
      }
    });
  }

  getSectionBreadcrumbLabel(): string {
    switch (this.currentSection) {
      case 'CATEGORIES': return 'Catégories de Prêt';
      case 'OBJETS_CREDIT': return 'Objets de Crédit';
      case 'GARANTIES': return 'Types de Garanties';
      case 'NATURES_JURIDIQUES': return 'Natures Juridiques';
      case 'AGENCES': return 'Agences CIF';
      case 'ROLES': return 'Rôles Agents';
      case 'CORBEILLE': return 'Corbeille';
      default: return 'Paramètres';
    }
  }

  getNatureLabel(id: string | undefined): string {
    if (!id) return 'Non définie';
    const nat = this.naturesJuridiques.find(n => n.id === id);
    return nat ? nat.label : 'Inconnue';
  }

  goToSection(section: ParamSection) {
    this.currentSection = section;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: section === 'HUB' ? {} : { tab: section }
    });
    this.loadSectionData(section);
  }

  private loadSectionData(section: ParamSection) {
    if (section === 'AGENCES') {
      this.agences = this.authService.getAgences() || [];
    } else if (section === 'CATEGORIES') {
      this.categories = this.settingsService.getCategoriesCredit() || [];
      this.settingsService.refreshCategoriesCredit().subscribe(list => {
        if (list && list.length > 0) this.categories = list;
      });
    } else if (section === 'OBJETS_CREDIT') {
      this.objetsCredit = this.settingsService.getObjets() || [];
      this.settingsService.refreshObjets().subscribe(list => {
        if (list && list.length > 0) this.objetsCredit = list;
      });
    } else if (section === 'GARANTIES') {
      this.typesGaranties = this.settingsService.getGaranties() || [];
      this.settingsService.refreshGaranties().subscribe(list => {
        if (list && list.length > 0) this.typesGaranties = list;
      });
    }
  }

  getGarantieCategoryLabel(type: string): string {
    switch (type) {
      case 'PERSONNELLE': return 'Garantie Personnelle';
      case 'REELLE_MOBILIERE': return 'Réelle Mobilière';
      case 'REELLE_IMMOBILIERE': return 'Réelle Immobilière';
      case 'FINANCIERE': return 'Sûreté Financière';
      default: return type;
    }
  }

  // =========================================================================
  // ACTIONS CATÉGORIES DE PRÊT
  // =========================================================================
  autoGenerateCategorieCode() {
    if (this.categorieFormData.label && !this.isEditingCategorie) {
      this.categorieFormData.code = 'CAT_' + this.categorieFormData.label
        .toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9]/g, '_')
        .substring(0, 24);
    }
  }

  openCreateCategorieModal() {
    this.isEditingCategorie = false;
    this.editingCategorieId = null;
    this.editingCategorieSysteme = false;
    this.categorieFormData = { label: '', code: '', description: '', tauxInteretMin: 10, dureeMaxMois: 24, actif: true };
    this.isCategorieModalOpen = true;
  }

  openEditCategorieModal(cat: CategorieCreditItem) {
    this.isEditingCategorie = true;
    this.editingCategorieId = cat.id;
    this.editingCategorieSysteme = !!cat.systeme;
    this.categorieFormData = {
      label: cat.label,
      code: cat.code,
      description: cat.description || '',
      tauxInteretMin: cat.tauxInteretMin ?? 10,
      dureeMaxMois: cat.dureeMaxMois ?? 24,
      actif: cat.actif
    };
    this.isCategorieModalOpen = true;
  }

  closeCategorieModal() {
    this.isCategorieModalOpen = false;
    this.isEditingCategorie = false;
    this.editingCategorieId = null;
  }

  submitCategorieForm() {
    if (!this.categorieFormData.label || !this.categorieFormData.code) return;
    const done = (verbe: string) => {
      this.notificationMessage = `Catégorie "${this.categorieFormData.label}" ${verbe} !`;
      this.closeCategorieModal();
      setTimeout(() => this.notificationMessage = '', 5000);
    };
    if (this.isEditingCategorie && this.editingCategorieId != null) {
      this.settingsService.updateCategorieCredit(this.editingCategorieId, this.categorieFormData)
        .subscribe({ next: () => done('mise à jour'), error: () => this.notificationMessage = 'Erreur de mise à jour.' });
    } else {
      this.settingsService.addCategorieCredit(this.categorieFormData)
        .subscribe({ next: () => done('créée'), error: () => this.notificationMessage = 'Erreur : code déjà utilisé ?' });
    }
  }

  toggleCategorieActif(cat: CategorieCreditItem) {
    this.settingsService.updateCategorieCredit(cat.id, { ...cat, actif: !cat.actif }).subscribe({
      next: () => {
        this.notificationMessage = `Catégorie "${cat.label}" ${!cat.actif ? 'activée' : 'désactivée'}.`;
        setTimeout(() => this.notificationMessage = '', 3000);
      }
    });
  }

  confirmDeleteCategorie(cat: CategorieCreditItem) {
    if (cat.systeme) {
      this.notificationMessage = `"${cat.label}" est une catégorie système (liée au modèle IA) : non supprimable.`;
      setTimeout(() => this.notificationMessage = '', 4000);
      return;
    }
    this.categorieToDelete = cat;
  }

  executeDeleteCategorie() {
    if (!this.categorieToDelete) return;
    const label = this.categorieToDelete.label;
    this.settingsService.deleteCategorieCredit(this.categorieToDelete.id).subscribe({
      next: () => {
        this.notificationMessage = `Catégorie "${label}" supprimée.`;
        setTimeout(() => this.notificationMessage = '', 4000);
      },
      error: () => this.notificationMessage = `Suppression impossible ("${label}").`
    });
    this.categorieToDelete = null;
  }

  // =========================================================================
  // ACTIONS OBJETS DE CRÉDIT
  // =========================================================================
  autoGenerateObjetCode() {
    if (this.objetFormData.label && !this.isEditingObjet) {
      this.objetFormData.code = 'OBJ_' + this.objetFormData.label
        .toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9]/g, '_')
        .substring(0, 24);
    }
  }

  openCreateObjetModal() {
    this.isEditingObjet = false;
    this.editingObjetId = null;
    const defaultCat = this.categories.length > 0 ? this.categories[0].label : '';
    this.objetFormData = {
      label: '',
      code: '',
      categorie: defaultCat,
      description: '',
      tauxInteretMin: 9.5,
      dureeMaxMois: 12,
      actif: true
    };
    this.isObjetModalOpen = true;
  }

  openEditObjetModal(obj: ObjetCreditItem) {
    this.isEditingObjet = true;
    this.editingObjetId = obj.id;
    this.objetFormData = {
      label: obj.label,
      code: obj.code,
      categorie: obj.categorie,
      description: obj.description || '',
      tauxInteretMin: obj.tauxInteretMin,
      dureeMaxMois: obj.dureeMaxMois,
      actif: obj.actif
    };
    this.isObjetModalOpen = true;
  }

  closeObjetModal() {
    this.isObjetModalOpen = false;
    this.isEditingObjet = false;
    this.editingObjetId = null;
  }

  submitObjetForm() {
    if (!this.objetFormData.label || !this.objetFormData.code || !this.objetFormData.categorie) return;

    if (this.isEditingObjet && this.editingObjetId) {
      this.settingsService.updateObjet(this.editingObjetId, this.objetFormData).subscribe({
        next: () => {
          this.notificationMessage = `Objet "${this.objetFormData.label}" mis à jour avec succès !`;
          setTimeout(() => this.notificationMessage = '', 5000);
        }
      });
    } else {
      this.settingsService.addObjet(this.objetFormData).subscribe({
        next: () => {
          this.notificationMessage = `Objet "${this.objetFormData.label}" enregistré avec succès !`;
          setTimeout(() => this.notificationMessage = '', 5000);
        }
      });
    }

    this.closeObjetModal();
  }

  toggleObjetActif(obj: ObjetCreditItem) {
    this.settingsService.updateObjet(obj.id, { actif: !obj.actif }).subscribe({
      next: () => {
        this.notificationMessage = `Objet "${obj.label}" ${!obj.actif ? 'activé' : 'désactivé'}.`;
        setTimeout(() => this.notificationMessage = '', 3000);
      }
    });
  }

  confirmDeleteObjet(obj: ObjetCreditItem) {
    this.objetToDelete = obj;
  }

  executeDeleteObjet() {
    if (!this.objetToDelete) return;
    const label = this.objetToDelete.label;
    this.settingsService.deleteObjet(this.objetToDelete.id).subscribe({
      next: () => {
        this.notificationMessage = `L'objet "${label}" a été déplacé vers la Corbeille (restaurable sous 30 jours).`;
        setTimeout(() => this.notificationMessage = '', 5000);
      }
    });
    this.objetToDelete = null;
  }

  // =========================================================================
  // ACTIONS TYPES DE GARANTIES
  // =========================================================================
  autoGenerateGarantieCode() {
    if (this.garantieFormData.label && !this.isEditingGarantie) {
      this.garantieFormData.code = 'GAR_' + this.garantieFormData.label
        .toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9]/g, '_')
        .substring(0, 24);
    }
  }

  openCreateGarantieModal() {
    this.isEditingGarantie = false;
    this.editingGarantieId = null;
    this.garantieFormData = {
      label: '',
      code: '',
      natureJuridiqueId: '',
      tauxCouvertureRecommande: 100,
      description: '',
      exigeDocument: false,
      actif: true
    };
    this.isGarantieModalOpen = true;
  }

  openEditGarantieModal(gar: GarantieItem) {
    this.isEditingGarantie = true;
    this.editingGarantieId = gar.id;
    this.garantieFormData = {
      label: gar.label,
      code: gar.code,
      natureJuridiqueId: gar.natureJuridiqueId || '',
      tauxCouvertureRecommande: gar.tauxCouvertureRecommande,
      description: gar.description || '',
      exigeDocument: gar.exigeDocument,
      actif: gar.actif
    };
    this.isGarantieModalOpen = true;
  }

  closeGarantieModal() {
    this.isGarantieModalOpen = false;
    this.isEditingGarantie = false;
    this.editingGarantieId = null;
  }

  submitGarantieForm() {
    if (!this.garantieFormData.label || !this.garantieFormData.code || !this.garantieFormData.natureJuridiqueId) return;

    if (this.isEditingGarantie && this.editingGarantieId) {
      this.settingsService.updateGarantie(this.editingGarantieId, this.garantieFormData).subscribe({
        next: () => {
          this.notificationMessage = `Garantie "${this.garantieFormData.label}" mise à jour avec succès !`;
          setTimeout(() => this.notificationMessage = '', 5000);
        }
      });
    } else {
      this.settingsService.addGarantie(this.garantieFormData).subscribe({
        next: () => {
          this.notificationMessage = `Garantie "${this.garantieFormData.label}" enregistrée avec succès !`;
          setTimeout(() => this.notificationMessage = '', 5000);
        }
      });
    }

    this.closeGarantieModal();
  }

  toggleGarantieActif(gar: GarantieItem) {
    this.settingsService.updateGarantie(gar.id, { actif: !gar.actif }).subscribe({
      next: () => {
        this.notificationMessage = `Garantie "${gar.label}" ${!gar.actif ? 'activée' : 'désactivée'}.`;
        setTimeout(() => this.notificationMessage = '', 3000);
      }
    });
  }

  confirmDeleteGarantie(gar: GarantieItem) {
    this.garantieToDelete = gar;
  }

  executeDeleteGarantie() {
    if (!this.garantieToDelete) return;
    const label = this.garantieToDelete.label;
    this.settingsService.deleteGarantie(this.garantieToDelete.id).subscribe({
      next: () => {
        this.notificationMessage = `La garantie "${label}" a été déplacée vers la Corbeille (restaurable sous 30 jours).`;
        setTimeout(() => this.notificationMessage = '', 5000);
      }
    });
    this.garantieToDelete = null;
  }

  // =========================================================================
  // ACTIONS NATURES JURIDIQUES
  // =========================================================================
  autoGenerateNatureCode() {
    if (this.natureFormData.label && !this.isEditingNature) {
      this.natureFormData.code = 'NAT_' + this.natureFormData.label
        .toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9]/g, '_')
        .substring(0, 24);
    }
  }

  openCreateNatureModal() {
    this.isEditingNature = false;
    this.editingNatureId = null;
    this.natureFormData = {
      label: '',
      code: '',
      description: '',
      necessiteNotaire: false,
      fraisEnregistrement: false,
      actif: true
    };
    this.isNatureModalOpen = true;
  }

  openEditNatureModal(nat: NatureJuridiqueItem) {
    this.isEditingNature = true;
    this.editingNatureId = nat.id;
    this.natureFormData = {
      label: nat.label,
      code: nat.code,
      description: nat.description || '',
      necessiteNotaire: nat.necessiteNotaire,
      fraisEnregistrement: nat.fraisEnregistrement,
      actif: nat.actif
    };
    this.isNatureModalOpen = true;
  }

  closeNatureModal() {
    this.isNatureModalOpen = false;
    this.isEditingNature = false;
    this.editingNatureId = null;
  }

  submitNatureForm() {
    if (!this.natureFormData.label || !this.natureFormData.code) return;

    if (this.isEditingNature && this.editingNatureId) {
      this.settingsService.updateNatureJuridique(this.editingNatureId, this.natureFormData).subscribe({
        next: () => {
          this.notificationMessage = `Nature Juridique "${this.natureFormData.label}" mise à jour avec succès !`;
          setTimeout(() => this.notificationMessage = '', 5000);
        }
      });
    } else {
      this.settingsService.addNatureJuridique(this.natureFormData).subscribe({
        next: () => {
          this.notificationMessage = `Nature Juridique "${this.natureFormData.label}" enregistrée avec succès !`;
          setTimeout(() => this.notificationMessage = '', 5000);
        }
      });
    }
    this.closeNatureModal();
  }

  toggleNatureActif(nat: NatureJuridiqueItem) {
    this.settingsService.updateNatureJuridique(nat.id, { actif: !nat.actif }).subscribe({
      next: () => {
        this.notificationMessage = `Nature Juridique "${nat.label}" ${!nat.actif ? 'activée' : 'désactivée'}.`;
        setTimeout(() => this.notificationMessage = '', 3000);
      }
    });
  }

  confirmDeleteNature(nat: NatureJuridiqueItem) {
    this.natureToDelete = nat;
  }

  executeDeleteNature() {
    if (!this.natureToDelete) return;
    const label = this.natureToDelete.label;
    this.settingsService.deleteNatureJuridique(this.natureToDelete.id).subscribe({
      next: () => {
        this.notificationMessage = `La nature juridique "${label}" a été supprimée (placée dans la corbeille).`;
        setTimeout(() => this.notificationMessage = '', 5000);
      }
    });
    this.natureToDelete = null;
  }

  // =========================================================================
  // ACTIONS RÔLES
  // =========================================================================
  autoGenerateCode() {
    if (this.roleFormData.label && !this.isEditingRole) {
      this.roleFormData.code = this.roleFormData.label
        .toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9]/g, '_')
        .substring(0, 24);
    }
  }

  openCreateRoleModal() {
    this.isEditingRole = false;
    this.editingRoleId = null;
    this.roleFormData = {
      label: '',
      code: '',
      description: ''
    };
    this.isRoleModalOpen = true;
  }

  openEditRoleModal(role: AgentRole) {
    this.isEditingRole = true;
    this.editingRoleId = role.id;
    this.roleFormData = {
      label: role.label,
      code: role.code,
      description: role.description || ''
    };
    this.isRoleModalOpen = true;
  }

  closeRoleModal() {
    this.isRoleModalOpen = false;
    this.isEditingRole = false;
    this.editingRoleId = null;
  }

  submitRoleForm() {
    if (!this.roleFormData.label || !this.roleFormData.code) return;

    if (this.isEditingRole && this.editingRoleId) {
      this.authService.updateRole(this.editingRoleId, this.roleFormData);
      this.notificationMessage = `Rôle "${this.roleFormData.label}" mis à jour avec succès !`;
    } else {
      this.authService.addRole(this.roleFormData);
      this.notificationMessage = `Rôle "${this.roleFormData.label}" créé avec succès !`;
    }

    this.closeRoleModal();
    setTimeout(() => this.notificationMessage = '', 5000);
  }

  confirmDeleteRole(role: AgentRole) {
    this.roleToDelete = role;
  }

  executeDeleteRole() {
    if (!this.roleToDelete) return;
    const roleName = this.roleToDelete.label;
    this.authService.deleteRole(this.roleToDelete.id);
    this.roleToDelete = null;
    this.notificationMessage = `Le rôle "${roleName}" a été déplacé vers la Corbeille (restaurable sous 30 jours).`;
    setTimeout(() => this.notificationMessage = '', 5000);
  }

  // =========================================================================
  // ACTIONS AGENCES
  // =========================================================================
  autoGenerateAgenceCode() {
    if (!this.isEditingAgence && this.agenceFormData.nom) {
      this.agenceFormData.code = 'AGC_' + this.agenceFormData.nom
        .toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9]/g, '_')
        .substring(0, 18);
    }
  }

  openCreateAgenceModal() {
    this.isEditingAgence = false;
    this.editingAgenceId = null;
    this.agenceFormData = {
      nom: '',
      code: '',
      pays: '',
      ville: '',
      region: '',
      telephone: '',
      adresse: ''
    };
    this.isAgenceModalOpen = true;
  }

  openEditAgenceModal(agence: AgenceCIF) {
    this.isEditingAgence = true;
    this.editingAgenceId = agence.id;
    this.agenceFormData = {
      nom: agence.nom,
      code: agence.code,
      pays: agence.pays || '',
      ville: agence.ville,
      region: agence.region,
      telephone: agence.telephone || '',
      adresse: agence.adresse || ''
    };
    this.isAgenceModalOpen = true;
  }

  closeAgenceModal() {
    this.isAgenceModalOpen = false;
    this.isEditingAgence = false;
    this.editingAgenceId = null;
  }

  submitAgenceForm() {
    if (!this.agenceFormData.nom || !this.agenceFormData.code || !this.agenceFormData.pays || !this.agenceFormData.ville || !this.agenceFormData.region) return;

    if (this.isEditingAgence && this.editingAgenceId) {
      this.authService.updateAgence(this.editingAgenceId, this.agenceFormData);
      this.notificationMessage = `Agence "${this.agenceFormData.nom}" mise à jour avec succès !`;
    } else {
      this.authService.addAgence(this.agenceFormData);
      this.notificationMessage = `Agence "${this.agenceFormData.nom}" créée avec succès !`;
    }

    this.closeAgenceModal();
    setTimeout(() => this.notificationMessage = '', 5000);
  }

  confirmDeleteAgence(agence: AgenceCIF) {
    this.agenceToDelete = agence;
  }

  executeDeleteAgence() {
    if (!this.agenceToDelete) return;
    const agenceNom = this.agenceToDelete.nom;
    this.authService.deleteAgence(this.agenceToDelete.id);
    this.agenceToDelete = null;
    this.notificationMessage = `L'agence "${agenceNom}" a été déplacée vers la Corbeille (restaurable sous 30 jours).`;
    setTimeout(() => this.notificationMessage = '', 5000);
  }

  // =========================================================================
  // ACTIONS CORBEILLE
  // =========================================================================
  restoreItem(item: CorbeilleItem) {
    this.authService.restoreItem(item.id);
    if (item.type === 'CATEGORIE') {
      this.settingsService.refreshCategoriesCredit().subscribe();
    } else if (item.type === 'OBJET_CREDIT') {
      this.settingsService.addObjet(item.data).subscribe();
    } else if (item.type === 'GARANTIE') {
      this.settingsService.addGarantie(item.data).subscribe();
    } else if (item.type === 'NATURE_JURIDIQUE') {
      this.settingsService.addNatureJuridique(item.data).subscribe();
    }
    this.notificationMessage = `"${item.title}" a été restauré avec succès dans le système !`;
    setTimeout(() => this.notificationMessage = '', 5000);
  }

  permanentDeleteItem(item: CorbeilleItem) {
    if (confirm(`Supprimer définitivement "${item.title}" ? Cette action est irréversible.`)) {
      this.authService.permanentDelete(item.id);
      this.notificationMessage = `"${item.title}" a été définitivement purgé.`;
      setTimeout(() => this.notificationMessage = '', 4000);
    }
  }

  emptyTrashConfirm() {
    if (confirm('Vider intégralement la corbeille ? Tous les éléments seront purgés définitivement.')) {
      this.authService.emptyTrash();
      this.notificationMessage = 'La corbeille a été vidée.';
      setTimeout(() => this.notificationMessage = '', 4000);
    }
  }
}
