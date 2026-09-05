import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SettingsService, ObjetCreditItem, GarantieItem } from '../../services/settings.service';
import { AgentRole, AgenceCIF, CorbeilleItem } from '../../models/user.model';

export type ParamSection = 'HUB' | 'ROLES' | 'AGENCES' | 'OBJETS_CREDIT' | 'GARANTIES' | 'CORBEILLE';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto space-y-6">

      <!-- ========================================================================= -->
      <!-- BARRE DE NAVIGATION SUPÉRIEURE (ONGLETS DIRECTS & FIL D'ARIANE)           -->
      <!-- ========================================================================= -->
      <div class="bg-white rounded-2xl border border-gray-200/80 p-3 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <!-- Fil d'Ariane -->
        <nav class="flex items-center space-x-2 text-xs font-medium text-gray-500 px-2" aria-label="Breadcrumb">
          <a routerLink="/dashboard" class="inline-flex items-center text-[#147c76] hover:text-[#0e625e] font-semibold transition-colors">
            <svg class="w-3.5 h-3.5 mr-1 text-[#147c76]" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
            Accueil
          </a>
          <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          <span class="text-gray-900 font-bold">Paramètres SAMDE</span>
        </nav>

        <!-- Onglets rapides d'accès -->
        <div class="flex items-center space-x-1.5 overflow-x-auto pb-1 lg:pb-0">
          <button (click)="goToSection('HUB')"
            [ngClass]="currentSection === 'HUB' ? 'bg-slate-900 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
            <span>Hub</span>
          </button>

          <button (click)="goToSection('OBJETS_CREDIT')"
            [ngClass]="currentSection === 'OBJETS_CREDIT' ? 'bg-[#147c76] text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>Objets de Crédit</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold"
              [ngClass]="currentSection === 'OBJETS_CREDIT' ? 'bg-[#0e625e] text-white' : 'bg-gray-200 text-gray-600'">
              {{ objetsCredit.length }}
            </span>
          </button>

          <button (click)="goToSection('GARANTIES')"
            [ngClass]="currentSection === 'GARANTIES' ? 'bg-teal-700 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            <span>Types de Garanties</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold"
              [ngClass]="currentSection === 'GARANTIES' ? 'bg-teal-900 text-white' : 'bg-gray-200 text-gray-600'">
              {{ typesGaranties.length }}
            </span>
          </button>

          <button (click)="goToSection('AGENCES')"
            [ngClass]="currentSection === 'AGENCES' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            <span>Agences CIF</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold"
              [ngClass]="currentSection === 'AGENCES' ? 'bg-emerald-800 text-emerald-100' : 'bg-gray-200 text-gray-600'">
              {{ agences.length }}
            </span>
          </button>

          <button (click)="goToSection('ROLES')"
            [ngClass]="currentSection === 'ROLES' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            <span>Rôles</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold"
              [ngClass]="currentSection === 'ROLES' ? 'bg-indigo-800 text-indigo-100' : 'bg-gray-200 text-gray-600'">
              {{ roles.length }}
            </span>
          </button>

          <button (click)="goToSection('CORBEILLE')"
            [ngClass]="currentSection === 'CORBEILLE' ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            <span>Corbeille</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold"
              [ngClass]="currentSection === 'CORBEILLE' ? 'bg-amber-800 text-amber-100' : 'bg-gray-200 text-gray-600'">
              {{ trashItems.length }}
            </span>
          </button>
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
      <!-- VUE 1 : LE HUB DES PARAMÈTRES (Dashboard visuel)                          -->
      <!-- ========================================================================= -->
      <div *ngIf="currentSection === 'HUB'" class="space-y-6 animate-fade-in">
        
        <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-[#123b41] text-white rounded-3xl p-7 md:p-9 shadow-lg relative overflow-hidden">
          <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-[#147c76]/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="relative z-10 max-w-2xl">
            <span class="px-3 py-1 bg-white/10 text-[#b9ded9] text-xs font-semibold rounded-full uppercase tracking-wider backdrop-blur-sm inline-block mb-3">
              Configuration Centrale & Métier CIF
            </span>
            <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Centre de Paramétrage SAMDE</h1>
            <p class="text-slate-300 text-sm mt-2 leading-relaxed">
              Gérez les types d'objets de crédit, les types de garanties, les agences du réseau CIF, les rôles des collaborateurs et la corbeille de restauration.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          
          <!-- CARTE OBJETS DE CRÉDIT -->
          <div (click)="goToSection('OBJETS_CREDIT')"
            class="bg-white rounded-3xl border-2 border-[#147c76]/20 hover:border-[#147c76] p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden">
            <div class="absolute top-0 right-0 w-28 h-28 bg-emerald-50/60 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-300"></div>

            <div class="relative z-10">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#147c76] to-[#0e625e] text-white flex items-center justify-center mb-4 shadow-lg shadow-[#147c76]/30 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>

              <div class="flex items-center space-x-2 mb-1.5">
                <h2 class="text-lg font-bold text-gray-900 group-hover:text-[#147c76] transition-colors">Objets de Crédit</h2>
                <span class="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-[#147c76] border border-emerald-200">
                  {{ objetsCredit.length }}
                </span>
              </div>
              
              <p class="text-xs text-gray-500 leading-relaxed">
                Types de besoins financés (Commerce, Intrants Agricoles, Élevage, Artisanat, Habitat) sélectionnés lors de l'instruction.
              </p>
            </div>

            <div class="pt-5 mt-4 border-t border-gray-100 flex items-center justify-between relative z-10">
              <span class="text-xs font-bold text-[#147c76] group-hover:translate-x-1 transition-transform inline-flex items-center">
                Configurer les objets
                <svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
              </span>
              <span class="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">Prêts CIF</span>
            </div>
          </div>

          <!-- CARTE TYPES DE GARANTIES -->
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
                Sûretés exigées (Caution solidaire, Gage sur stock, Hypothèque foncière, Épargne nantie, Avaliste).
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

          <!-- CARTE AGENCES CIF -->
          <div (click)="goToSection('AGENCES')"
            class="bg-white rounded-3xl border-2 border-emerald-100 hover:border-emerald-500 p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden">
            <div class="absolute top-0 right-0 w-28 h-28 bg-emerald-50/60 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-300"></div>

            <div class="relative z-10">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>

              <div class="flex items-center space-x-2 mb-1.5">
                <h2 class="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">Agences CIF</h2>
                <span class="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {{ agences.length }}
                </span>
              </div>
              
              <p class="text-xs text-gray-500 leading-relaxed">
                Configurez les caisses régionales, agences et délégations CIF rattachées au réseau.
              </p>
            </div>

            <div class="pt-5 mt-4 border-t border-gray-100 flex items-center justify-between relative z-10">
              <span class="text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform inline-flex items-center">
                Configurer les agences
                <svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
              </span>
              <span class="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">Réseau</span>
            </div>
          </div>

          <!-- CARTE RÔLES DES AGENTS -->
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
                Créez et personnalisez les profils d'accès aux dossiers (Conseillers, Risques, Direction).
              </p>
            </div>

            <div class="pt-5 mt-4 border-t border-gray-100 flex items-center justify-between relative z-10">
              <span class="text-xs font-bold text-indigo-700 group-hover:translate-x-1 transition-transform inline-flex items-center">
                Configurer les rôles
                <svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
              </span>
              <span class="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">Accès</span>
            </div>
          </div>

          <!-- CARTE CORBEILLE -->
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
                Restaurez les objets de crédit, garanties, agences ou rôles supprimés sous 30 jours.
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
      <!-- VUE : OBJETS DE CRÉDIT (CRÉATION, MODIFICATION, SUPPRESSION)              -->
      <!-- ========================================================================= -->
      <div *ngIf="currentSection === 'OBJETS_CREDIT'" class="space-y-6 animate-fade-in">
        
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-[#e5f3f1] text-[#147c76] flex items-center justify-center font-bold">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <h2 class="text-xl font-extrabold text-gray-900">Types d'Objets de Crédit</h2>
              <p class="text-xs text-gray-500 mt-0.5">Motifs de prêts proposés aux sociétaires lors des demandes de crédit</p>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <span class="px-3 py-1 bg-[#e5f3f1] text-[#147c76] border border-[#b9ded9] rounded-full text-xs font-bold font-mono">
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

          <!-- ÉTAT VIDE -->
          <div *ngIf="objetsCredit.length === 0" class="text-center py-16 px-4 max-w-md mx-auto">
            <div class="w-20 h-20 bg-emerald-50 text-[#147c76] rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Aucun objet de crédit configuré</h3>
            <p class="text-sm text-gray-500 mb-6">
              Définissez les secteurs d'activité et objets de financement éligibles au crédit.
            </p>
            <button (click)="openCreateObjetModal()"
              class="bg-[#147c76] hover:bg-[#0e625e] text-white text-sm font-bold px-6 py-3 rounded-xl shadow-md transition-all inline-flex items-center space-x-2 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
              <span>Créer le premier objet de crédit</span>
            </button>
          </div>

          <!-- GRILLE DES OBJETS -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" *ngIf="objetsCredit.length > 0">
            <div *ngFor="let obj of objetsCredit"
              class="bg-white rounded-2xl border border-gray-200/90 hover:border-[#147c76] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div class="flex items-start justify-between mb-3 gap-2">
                  <div class="flex-1">
                    <span class="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-[#e5f3f1] text-[#147c76] border border-[#b9ded9]">
                      {{ obj.categorie }}
                    </span>
                    <h3 class="text-base font-bold text-gray-900 mt-2 leading-snug group-hover:text-[#147c76] transition-colors">
                      {{ obj.label }}
                    </h3>
                  </div>
                  <button (click)="toggleObjetActif(obj)"
                    [title]="obj.actif ? 'Désactiver cet objet' : 'Activer cet objet'"
                    [ngClass]="obj.actif ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-gray-100 text-gray-500 border-gray-200'"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors flex-shrink-0 cursor-pointer">
                    {{ obj.actif ? '● Actif' : '○ Inactif' }}
                  </button>
                </div>

                <p class="text-xs text-gray-600 line-clamp-2 mt-1 leading-relaxed min-h-[32px]">
                  {{ obj.description || 'Aucune description spécifique.' }}
                </p>

                <div class="mt-3.5 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                  <div class="bg-gray-50 rounded-xl p-2">
                    <span class="text-[10px] text-gray-400 block font-semibold">Taux indicatif</span>
                    <span class="font-bold text-gray-800">{{ obj.tauxInteretMin ? obj.tauxInteretMin + ' % / an' : 'N/A' }}</span>
                  </div>
                  <div class="bg-gray-50 rounded-xl p-2">
                    <span class="text-[10px] text-gray-400 block font-semibold">Durée max</span>
                    <span class="font-bold text-gray-800">{{ obj.dureeMaxMois ? obj.dureeMaxMois + ' mois' : 'Libre' }}</span>
                  </div>
                </div>
              </div>

              <div class="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span class="text-[11px] font-mono text-gray-400">{{ obj.code }}</span>
                <div class="flex items-center space-x-1">
                  <button (click)="openEditObjetModal(obj)" title="Modifier cet objet"
                    class="text-gray-400 hover:text-[#147c76] p-1.5 rounded-lg hover:bg-[#e5f3f1] transition-all cursor-pointer">
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
              <p class="text-xs text-gray-500 mt-0.5">Modalités de couverture de risque et garanties exigibles pour les crédits</p>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <span class="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs font-bold font-mono">
              {{ typesGaranties.length }} garantie(s)
            </span>
            <button (click)="openCreateGarantieModal()"
              class="bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-md shadow-teal-700/20 hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
              <span>Nouvelle Garantie</span>
            </button>
          </div>
        </div>

        <div class="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm">

          <!-- ÉTAT VIDE -->
          <div *ngIf="typesGaranties.length === 0" class="text-center py-16 px-4 max-w-md mx-auto">
            <div class="w-20 h-20 bg-teal-50 text-teal-700 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Aucune garantie configurée</h3>
            <p class="text-sm text-gray-500 mb-6">
              Configurez les sûretés personnelles, réelles ou financières requises lors des octrois.
            </p>
            <button (click)="openCreateGarantieModal()"
              class="bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold px-6 py-3 rounded-xl shadow-md transition-all inline-flex items-center space-x-2 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
              <span>Créer la première garantie</span>
            </button>
          </div>

          <!-- GRILLE DES GARANTIES -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" *ngIf="typesGaranties.length > 0">
            <div *ngFor="let gar of typesGaranties"
              class="bg-white rounded-2xl border border-gray-200/90 hover:border-teal-600 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div class="flex items-start justify-between mb-3 gap-2">
                  <div class="flex-1">
                    <span class="px-2.5 py-0.5 rounded-lg text-[11px] font-bold"
                      [ngClass]="{
                        'bg-blue-50 text-blue-700 border border-blue-200': gar.typeGarantie === 'PERSONNELLE',
                        'bg-amber-50 text-amber-700 border border-amber-200': gar.typeGarantie === 'REELLE_MOBILIERE',
                        'bg-purple-50 text-purple-700 border border-purple-200': gar.typeGarantie === 'REELLE_IMMOBILIERE',
                        'bg-emerald-50 text-emerald-700 border border-emerald-200': gar.typeGarantie === 'FINANCIERE'
                      }">
                      {{ getGarantieCategoryLabel(gar.typeGarantie) }}
                    </span>
                    <h3 class="text-base font-bold text-gray-900 mt-2 leading-snug group-hover:text-teal-700 transition-colors">
                      {{ gar.label }}
                    </h3>
                  </div>
                  <button (click)="toggleGarantieActif(gar)"
                    [title]="gar.actif ? 'Désactiver cette garantie' : 'Activer cette garantie'"
                    [ngClass]="gar.actif ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-gray-100 text-gray-500 border-gray-200'"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors flex-shrink-0 cursor-pointer">
                    {{ gar.actif ? '● Actif' : '○ Inactif' }}
                  </button>
                </div>

                <p class="text-xs text-gray-600 line-clamp-2 mt-1 leading-relaxed min-h-[32px]">
                  {{ gar.description || 'Aucune description spécifique.' }}
                </p>

                <div class="mt-3.5 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                  <div class="bg-gray-50 rounded-xl p-2">
                    <span class="text-[10px] text-gray-400 block font-semibold">Taux couverture</span>
                    <span class="font-bold text-gray-800">{{ gar.tauxCouvertureRecommande || 100 }} %</span>
                  </div>
                  <div class="bg-gray-50 rounded-xl p-2">
                    <span class="text-[10px] text-gray-400 block font-semibold">Justificatif</span>
                    <span class="font-bold" [ngClass]="gar.exigeDocument ? 'text-amber-700' : 'text-gray-600'">
                      {{ gar.exigeDocument ? 'Document Requis' : 'Sans Document' }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span class="text-[11px] font-mono text-gray-400">{{ gar.code }}</span>
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
      <!-- VUE 2 : MODULE AGENCES CIF (CRÉATION, MODIFICATION, SUPPRESSION, CORBEILLE) -->
      <!-- ========================================================================= -->
      <div *ngIf="currentSection === 'AGENCES'" class="space-y-6 animate-fade-in">
        
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            </div>
            <div>
              <h2 class="text-xl font-extrabold text-gray-900">Réseau des Agences CIF</h2>
              <p class="text-xs text-gray-500 mt-0.5">Points de service, délégations et caisses populaires rattachées</p>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <span class="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold font-mono">
              {{ agences.length }} agence(s)
            </span>
            <button (click)="openCreateAgenceModal()"
              class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
              <span>Nouvelle agence</span>
            </button>
          </div>
        </div>

        <div class="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm">

          <!-- ÉTAT VIDE -->
          <div *ngIf="agences.length === 0" class="text-center py-16 px-4 max-w-md mx-auto">
            <div class="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Aucune agence configurée pour l'instant</h3>
            <p class="text-sm text-gray-500 mb-6">
              Créez vos agences bancaires régionales pour pouvoir y affecter vos collaborateurs et agents de crédit.
            </p>
            <button (click)="openCreateAgenceModal()"
              class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-6 py-3 rounded-xl shadow-md transition-all inline-flex items-center space-x-2 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
              <span>Créer la première agence</span>
            </button>
          </div>

          <!-- GRILLE DES AGENCES -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" *ngIf="agences.length > 0">
            <div *ngFor="let agence of agences"
              class="bg-white rounded-2xl border border-gray-200/90 hover:border-emerald-500 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center space-x-3">
                    <div class="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base shadow-2xs">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                    </div>
                    <div>
                      <h3 class="text-base font-bold text-gray-900 leading-snug group-hover:text-emerald-700 transition-colors">{{ agence.nom }}</h3>
                      <p class="text-xs font-mono font-semibold text-emerald-700 mt-0.5">{{ agence.code }}</p>
                    </div>
                  </div>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Opérationnelle
                  </span>
                </div>

                <div class="space-y-1.5 mt-3 text-xs text-gray-600">
                  <div class="flex items-center space-x-2">
                    <svg class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span class="font-medium">{{ agence.ville }} <span class="text-gray-400">·</span> {{ agence.region }} <span *ngIf="agence.pays" class="text-emerald-700 font-bold">({{ agence.pays }})</span></span>
                  </div>
                  <div *ngIf="agence.telephone" class="flex items-center space-x-2 text-gray-500">
                    <svg class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    <span>{{ agence.telephone }}</span>
                  </div>
                  <div *ngIf="agence.adresse" class="flex items-center space-x-2 text-gray-400 italic">
                    <span class="truncate">{{ agence.adresse }}</span>
                  </div>
                </div>
              </div>

              <div class="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span class="text-[11px] text-gray-400">Créée le {{ agence.dateCreation | date:'dd/MM/yyyy' }}</span>
                <div class="flex items-center space-x-1">
                  <button (click)="openEditAgenceModal(agence)" title="Modifier cette agence"
                    class="text-gray-400 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-50 transition-all cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button (click)="confirmDeleteAgence(agence)" title="Déplacer vers la corbeille"
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
      <!-- VUE 3 : MODULE RÔLES DES AGENTS                                           -->
      <!-- ========================================================================= -->
      <div *ngIf="currentSection === 'ROLES'" class="space-y-6 animate-fade-in">
        
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            </div>
            <div>
              <h2 class="text-xl font-extrabold text-gray-900">Rôles & Habilitations</h2>
              <p class="text-xs text-gray-500 mt-0.5">Rôles attribuables lors de l'enregistrement d'un collaborateur</p>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <span class="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold font-mono">
              {{ roles.length }} rôle(s)
            </span>
            <button (click)="openCreateRoleModal()"
              class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
              <span>Nouveau rôle</span>
            </button>
          </div>
        </div>

        <div class="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm">

          <!-- ÉTAT VIDE -->
          <div *ngIf="roles.length === 0" class="text-center py-16 px-4 max-w-md mx-auto">
            <div class="w-20 h-20 bg-indigo-50 text-indigo-700 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Aucun rôle défini pour l'instant</h3>
            <p class="text-sm text-gray-500 mb-6">
              Définissez les rôles de votre coopérative pour habiliter vos collaborateurs.
            </p>
            <button (click)="openCreateRoleModal()"
              class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-3 rounded-xl shadow-md transition-all inline-flex items-center space-x-2 cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
              <span>Créer le premier rôle</span>
            </button>
          </div>

          <!-- GRILLE DES RÔLES -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" *ngIf="roles.length > 0">
            <div *ngFor="let role of roles"
              class="bg-white rounded-2xl border border-gray-200/90 hover:border-indigo-500 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
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
      <!-- VUE 4 : CORBEILLE (RÉCUPÉRATION SOUS 30 JOURS)                             -->
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
          <!-- Corbeille vide -->
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
                    'bg-[#e5f3f1] text-[#147c76]': item.type === 'OBJET_CREDIT',
                    'bg-teal-100 text-teal-800': item.type === 'GARANTIE',
                    'bg-emerald-100 text-emerald-700': item.type === 'AGENCE',
                    'bg-indigo-100 text-indigo-700': item.type === 'ROLE',
                    'bg-gray-100 text-gray-700': item.type === 'AGENT'
                  }">
                  {{ item.typeLabel }}
                </div>
                <div>
                  <div class="flex items-center space-x-2">
                    <h3 class="text-base font-bold text-gray-900">{{ item.title }}</h3>
                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                      {{ item.type }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-500 mt-0.5">{{ item.details }}</p>
                  <p class="text-[11px] text-gray-400 mt-1">Supprimé le {{ item.dateSuppression | date:'dd/MM/yyyy à HH:mm' }} · Rétention 30j</p>
                </div>
              </div>

              <div class="flex items-center space-x-2.5">
                <button (click)="restoreItem(item)"
                  class="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  <span>Restaurer</span>
                </button>
                <button (click)="permanentDeleteItem(item)"
                  class="px-3 py-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs transition-colors cursor-pointer" title="Purger définitivement">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- MODAL CRÉATION / MODIFICATION OBJET DE CRÉDIT                             -->
      <!-- ========================================================================= -->
      <div *ngIf="isObjetModalOpen" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-lg w-full p-7 md:p-8 shadow-2xl relative animate-fade-in border border-slate-100 max-h-[90vh] overflow-y-auto">
          
          <div class="flex items-center justify-between pb-5 border-b border-gray-100 mb-6">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-xl bg-[#e5f3f1] text-[#147c76] flex items-center justify-center font-bold">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900" *ngIf="isEditingObjet">Modifier l'objet de crédit</h3>
                <h3 class="text-lg font-bold text-gray-900" *ngIf="!isEditingObjet">Nouvel objet de crédit</h3>
                <p class="text-xs text-gray-500">Paramétrage du motif et des conditions de financement</p>
              </div>
            </div>
            
            <button (click)="closeObjetModal()" class="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form (ngSubmit)="submitObjetForm()" #objetForm="ngForm" class="space-y-4">
            
            <div>
              <label class="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                Intitulé de l'objet <span class="text-red-500">*</span>
              </label>
              <input type="text" [(ngModel)]="objetFormData.label" name="label" (input)="autoGenerateObjetCode()" required
                placeholder="Ex: Élevage & Embouche Bovine"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#147c76] focus:border-transparent transition-all" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                  Catégorie / Secteur <span class="text-red-500">*</span>
                </label>
                <select [(ngModel)]="objetFormData.categorie" name="categorie" required
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#147c76] focus:border-transparent transition-all bg-white font-medium">
                  <option value="Commerce & Vente">Commerce & Vente</option>
                  <option value="Agriculture">Agriculture & Intrants</option>
                  <option value="Élevage">Élevage & Pastoralisme</option>
                  <option value="Artisanat / Métiers">Artisanat / Transformation</option>
                  <option value="Habitat & Cadre de Vie">Habitat & Énergie</option>
                  <option value="Social & Famille">Social & Scolarité</option>
                  <option value="Services & Transport">Services & Transport</option>
                  <option value="Autre Secteur">Autre Secteur</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                  Code technique <span class="text-red-500">*</span>
                </label>
                <input type="text" [(ngModel)]="objetFormData.code" name="code" required
                  placeholder="CODE_TECHNIQUE"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm uppercase font-mono font-semibold bg-gray-50/70 focus:outline-none focus:ring-2 focus:ring-[#147c76] focus:border-transparent transition-all" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                  Taux d'intérêt min (% / an)
                </label>
                <input type="number" [(ngModel)]="objetFormData.tauxInteretMin" name="tauxInteretMin" step="0.1" min="1" max="30"
                  placeholder="Ex: 9.5"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#147c76] focus:border-transparent transition-all" />
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                  Durée maximale (mois)
                </label>
                <input type="number" [(ngModel)]="objetFormData.dureeMaxMois" name="dureeMaxMois" min="1" max="60"
                  placeholder="Ex: 12"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#147c76] focus:border-transparent transition-all" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                Description & Directives d'instruction
              </label>
              <textarea [(ngModel)]="objetFormData.description" name="description" rows="3"
                placeholder="Explications du besoin, typologies de biens finançables, consignes pour les agents..."
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#147c76] focus:border-transparent transition-all resize-none"></textarea>
            </div>

            <div class="pt-5 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button type="button" (click)="closeObjetModal()"
                class="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                Annuler
              </button>
              <button type="submit" [disabled]="!objetForm.form.valid"
                class="px-6 py-2.5 bg-[#147c76] hover:bg-[#0e625e] disabled:opacity-40 text-white text-sm font-bold rounded-xl shadow-md shadow-[#147c76]/20 hover:shadow-lg transition-all cursor-pointer">
                <span *ngIf="isEditingObjet">Mettre à jour</span>
                <span *ngIf="!isEditingObjet">Enregistrer l'objet</span>
              </button>
            </div>

          </form>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- MODAL CRÉATION / MODIFICATION TYPE DE GARANTIE                            -->
      <!-- ========================================================================= -->
      <div *ngIf="isGarantieModalOpen" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-lg w-full p-7 md:p-8 shadow-2xl relative animate-fade-in border border-slate-100 max-h-[90vh] overflow-y-auto">
          
          <div class="flex items-center justify-between pb-5 border-b border-gray-100 mb-6">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900" *ngIf="isEditingGarantie">Modifier le type de garantie</h3>
                <h3 class="text-lg font-bold text-gray-900" *ngIf="!isEditingGarantie">Nouveau type de garantie</h3>
                <p class="text-xs text-gray-500">Paramétrage de la sûreté et des exigences de couverture</p>
              </div>
            </div>
            
            <button (click)="closeGarantieModal()" class="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form (ngSubmit)="submitGarantieForm()" #garantieForm="ngForm" class="space-y-4">
            
            <div>
              <label class="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                Intitulé de la garantie <span class="text-red-500">*</span>
              </label>
              <input type="text" [(ngModel)]="garantieFormData.label" name="label" (input)="autoGenerateGarantieCode()" required
                placeholder="Ex: Gage sur Stock de Marchandises"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                  Nature juridique <span class="text-red-500">*</span>
                </label>
                <select [(ngModel)]="garantieFormData.typeGarantie" name="typeGarantie" required
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all bg-white font-medium">
                  <option value="PERSONNELLE">Garantie Personnelle (Caution/Aval)</option>
                  <option value="REELLE_MOBILIERE">Réelle Mobilière (Gage/Nantissement)</option>
                  <option value="REELLE_IMMOBILIERE">Réelle Immobilière (Hypothèque/PUH)</option>
                  <option value="FINANCIERE">Financière (DAT/Épargne Nantie)</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                  Code technique <span class="text-red-500">*</span>
                </label>
                <input type="text" [(ngModel)]="garantieFormData.code" name="code" required
                  placeholder="CODE_GARANTIE"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm uppercase font-mono font-semibold bg-gray-50/70 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                  Couverture recommandée (%)
                </label>
                <input type="number" [(ngModel)]="garantieFormData.tauxCouvertureRecommande" name="tauxCouvertureRecommande" min="50" max="300"
                  placeholder="Ex: 120"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all" />
              </div>

              <div class="flex items-center pt-6">
                <label class="inline-flex items-center cursor-pointer">
                  <input type="checkbox" [(ngModel)]="garantieFormData.exigeDocument" name="exigeDocument" class="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer" />
                  <span class="ml-2.5 text-xs font-bold text-gray-700">Document légal / Pièce requise</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                Description & Modalités pratiques
              </label>
              <textarea [(ngModel)]="garantieFormData.description" name="description" rows="3"
                placeholder="Ex: Inventaire physique, acte sous seing privé, vérification au cadastre..."
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all resize-none"></textarea>
            </div>

            <div class="pt-5 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button type="button" (click)="closeGarantieModal()"
                class="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                Annuler
              </button>
              <button type="submit" [disabled]="!garantieForm.form.valid"
                class="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer">
                <span *ngIf="isEditingGarantie">Mettre à jour</span>
                <span *ngIf="!isEditingGarantie">Enregistrer la garantie</span>
              </button>
            </div>

          </form>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- MODAL CRÉATION / MODIFICATION AGENCE                                      -->
      <!-- ========================================================================= -->
      <div *ngIf="isAgenceModalOpen" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-lg w-full p-7 md:p-8 shadow-2xl relative animate-fade-in border border-slate-100 max-h-[90vh] overflow-y-auto">
          
          <div class="flex items-center justify-between pb-5 border-b border-gray-100 mb-6">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900" *ngIf="isEditingAgence">Modifier l'agence</h3>
                <h3 class="text-lg font-bold text-gray-900" *ngIf="!isEditingAgence">Nouvelle agence CIF</h3>
                <p class="text-xs text-gray-500">Création ou mise à jour d'un point de service bancaire</p>
              </div>
            </div>
            
            <button (click)="closeAgenceModal()" class="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form (ngSubmit)="submitAgenceForm()" #agenceForm="ngForm" class="space-y-4">
            
            <div>
              <label class="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                Nom de l'agence <span class="text-red-500">*</span>
              </label>
              <input type="text" [(ngModel)]="agenceFormData.nom" name="nom" (input)="autoGenerateAgenceCode()" required
                placeholder="Ex: Agence Ouaga 2000"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all" />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                Code agence <span class="text-red-500">*</span>
              </label>
              <input type="text" [(ngModel)]="agenceFormData.code" name="code" required
                placeholder="AGC_OUAGA_2000"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm uppercase font-mono font-semibold bg-gray-50/70 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all" />
              <p class="text-[11px] text-gray-400 mt-1">Identifiant unique de l'agence CIF.</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                  Pays <span class="text-red-500">*</span>
                </label>
                <input type="text" [(ngModel)]="agenceFormData.pays" name="pays" required
                  placeholder="Burkina Faso"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all" />
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                  Ville <span class="text-red-500">*</span>
                </label>
                <input type="text" [(ngModel)]="agenceFormData.ville" name="ville" required
                  placeholder="Ouagadougou"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                  Région <span class="text-red-500">*</span>
                </label>
                <input type="text" [(ngModel)]="agenceFormData.region" name="region" required
                  placeholder="Centre"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all" />
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                  Téléphone agence
                </label>
                <input type="text" [(ngModel)]="agenceFormData.telephone" name="telephone"
                  placeholder="+226 25 30 00 00"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                Adresse physique
              </label>
              <input type="text" [(ngModel)]="agenceFormData.adresse" name="adresse"
                placeholder="Avenue Pascal Zagré, Secteur 15"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all" />
            </div>

            <div class="pt-5 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button type="button" (click)="closeAgenceModal()"
                class="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                Annuler
              </button>
              <button type="submit" [disabled]="!agenceForm.form.valid"
                class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer">
                <span *ngIf="isEditingAgence">Mettre à jour</span>
                <span *ngIf="!isEditingAgence">Enregistrer l'agence</span>
              </button>
            </div>

          </form>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- MODAL CRÉATION / MODIFICATION RÔLE                                        -->
      <!-- ========================================================================= -->
      <div *ngIf="isRoleModalOpen" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-lg w-full p-7 md:p-8 shadow-2xl relative animate-fade-in border border-slate-100">
          
          <div class="flex items-center justify-between pb-5 border-b border-gray-100 mb-6">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900" *ngIf="isEditingRole">Modifier le rôle</h3>
                <h3 class="text-lg font-bold text-gray-900" *ngIf="!isEditingRole">Nouveau rôle système</h3>
                <p class="text-xs text-gray-500">Profil d'attribution des agents</p>
              </div>
            </div>
            
            <button (click)="closeRoleModal()" class="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form (ngSubmit)="submitRoleForm()" #roleForm="ngForm" class="space-y-4">
            
            <div>
              <label class="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                Libellé du rôle <span class="text-red-500">*</span>
              </label>
              <input type="text" [(ngModel)]="roleFormData.label" name="label" (input)="autoGenerateCode()" required
                placeholder="Ex: Analyste Risques Senior"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all" />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                Code technique <span class="text-red-500">*</span>
              </label>
              <input type="text" [(ngModel)]="roleFormData.code" name="code" required
                placeholder="ANALYSTE_RISQUES_SENIOR"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm uppercase font-mono font-semibold bg-gray-50/70 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all" />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                Description / Missions
              </label>
              <textarea [(ngModel)]="roleFormData.description" name="description" rows="3"
                placeholder="Précisez les attributions de ce rôle..."
                class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all resize-none"></textarea>
            </div>

            <div class="pt-5 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button type="button" (click)="closeRoleModal()"
                class="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                Annuler
              </button>
              <button type="submit" [disabled]="!roleForm.form.valid"
                class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer">
                <span *ngIf="isEditingRole">Mettre à jour</span>
                <span *ngIf="!isEditingRole">Enregistrer le rôle</span>
              </button>
            </div>

          </form>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- MODALS CONFIRMATION SUPPRESSION (Vers la Corbeille)                       -->
      <!-- ========================================================================= -->
      <div *ngIf="objetToDelete" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-md w-full p-7 shadow-2xl relative animate-fade-in border border-slate-100 text-center">
          <div class="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-1.5">Déplacer l'objet vers la Corbeille ?</h3>
          <p class="text-sm text-gray-800 mb-2 font-semibold">{{ objetToDelete.label }}</p>
          <p class="text-xs text-gray-500 mb-6 leading-relaxed">
            Cet objet ne sera plus proposé dans le formulaire de crédit. Il reste restaurable pendant <strong>30 jours</strong> dans la Corbeille.
          </p>
          <div class="flex items-center justify-center space-x-3">
            <button (click)="objetToDelete = null" class="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">Annuler</button>
            <button (click)="executeDeleteObjet()" class="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors cursor-pointer">Déplacer dans la corbeille</button>
          </div>
        </div>
      </div>

      <div *ngIf="garantieToDelete" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-md w-full p-7 shadow-2xl relative animate-fade-in border border-slate-100 text-center">
          <div class="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-1.5">Déplacer la garantie vers la Corbeille ?</h3>
          <p class="text-sm text-gray-800 mb-2 font-semibold">{{ garantieToDelete.label }}</p>
          <p class="text-xs text-gray-500 mb-6 leading-relaxed">
            Ce type de garantie ne sera plus proposé dans les demandes de prêt. Il reste restaurable pendant <strong>30 jours</strong> dans la Corbeille.
          </p>
          <div class="flex items-center justify-center space-x-3">
            <button (click)="garantieToDelete = null" class="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">Annuler</button>
            <button (click)="executeDeleteGarantie()" class="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors cursor-pointer">Déplacer dans la corbeille</button>
          </div>
        </div>
      </div>

      <div *ngIf="agenceToDelete" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-md w-full p-7 shadow-2xl relative animate-fade-in border border-slate-100 text-center">
          <div class="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-1.5">Déplacer l'agence vers la Corbeille ?</h3>
          <p class="text-sm text-gray-800 mb-2 font-semibold">{{ agenceToDelete.nom }}</p>
          <p class="text-xs text-gray-500 mb-6 leading-relaxed">
            Cette agence sera retirée des choix d'affectation. Elle reste restaurable pendant <strong>30 jours</strong> dans la Corbeille.
          </p>
          <div class="flex items-center justify-center space-x-3">
            <button (click)="agenceToDelete = null" class="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">Annuler</button>
            <button (click)="executeDeleteAgence()" class="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors cursor-pointer">Déplacer dans la corbeille</button>
          </div>
        </div>
      </div>

      <div *ngIf="roleToDelete" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-md w-full p-7 shadow-2xl relative animate-fade-in border border-slate-100 text-center">
          <div class="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-1.5">Déplacer le rôle vers la Corbeille ?</h3>
          <p class="text-sm text-gray-800 mb-2 font-semibold">{{ roleToDelete.label }}</p>
          <p class="text-xs text-gray-500 mb-6 leading-relaxed">
            Ce rôle ne sera plus proposé pour les nouveaux agents. Il reste restaurable pendant <strong>30 jours</strong> dans la Corbeille.
          </p>
          <div class="flex items-center justify-center space-x-3">
            <button (click)="roleToDelete = null" class="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">Annuler</button>
            <button (click)="executeDeleteRole()" class="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors cursor-pointer">Déplacer dans la corbeille</button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class ParametresComponent implements OnInit {
  private authService = inject(AuthService);
  private settingsService = inject(SettingsService);
  private route = inject(ActivatedRoute);

  currentSection: ParamSection = 'HUB';
  roles: AgentRole[] = [];
  agences: AgenceCIF[] = [];
  objetsCredit: ObjetCreditItem[] = [];
  typesGaranties: GarantieItem[] = [];
  trashItems: CorbeilleItem[] = [];
  notificationMessage = '';
  
  // Gestion Objets de Crédit
  isObjetModalOpen = false;
  isEditingObjet = false;
  editingObjetId: any = null;
  objetToDelete: ObjetCreditItem | null = null;
  objetFormData = {
    label: '',
    code: '',
    categorie: 'Commerce & Vente',
    description: '',
    tauxInteretMin: 9.5 as number | undefined,
    dureeMaxMois: 12 as number | undefined,
    actif: true
  };

  // Gestion Garanties
  isGarantieModalOpen = false;
  isEditingGarantie = false;
  editingGarantieId: any = null;
  garantieToDelete: GarantieItem | null = null;
  garantieFormData = {
    label: '',
    code: '',
    typeGarantie: 'PERSONNELLE' as 'PERSONNELLE' | 'REELLE_MOBILIERE' | 'REELLE_IMMOBILIERE' | 'FINANCIERE',
    tauxCouvertureRecommande: 100 as number | undefined,
    description: '',
    exigeDocument: false,
    actif: true
  };

  // Gestion Rôles
  isRoleModalOpen = false;
  isEditingRole = false;
  editingRoleId: string | null = null;
  roleToDelete: AgentRole | null = null;
  roleFormData = {
    label: '',
    code: '',
    description: ''
  };

  // Gestion Agences
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
    this.settingsService.objets$.subscribe(list => this.objetsCredit = list || []);
    this.settingsService.garanties$.subscribe(list => this.typesGaranties = list || []);

    this.route.queryParamMap.subscribe(params => {
      const tab = params.get('tab');
      if (tab && ['HUB', 'ROLES', 'AGENCES', 'OBJETS_CREDIT', 'GARANTIES', 'CORBEILLE'].includes(tab)) {
        this.goToSection(tab as ParamSection);
      }
    });
  }

  goToSection(section: ParamSection) {
    this.currentSection = section;
    if (section === 'AGENCES') {
      this.agences = this.authService.getAgences() || [];
    } else if (section === 'OBJETS_CREDIT') {
      this.settingsService.refreshObjets().subscribe();
    } else if (section === 'GARANTIES') {
      this.settingsService.refreshGaranties().subscribe();
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
    this.objetFormData = {
      label: '',
      code: '',
      categorie: 'Commerce & Vente',
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
          this.notificationMessage = `Objet "${this.objetFormData.label}" mis à jour en base de données avec succès !`;
          setTimeout(() => this.notificationMessage = '', 5000);
        }
      });
    } else {
      this.settingsService.addObjet(this.objetFormData).subscribe({
        next: () => {
          this.notificationMessage = `Objet "${this.objetFormData.label}" enregistré en base de données avec succès !`;
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
      typeGarantie: 'PERSONNELLE',
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
      typeGarantie: gar.typeGarantie,
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
    if (!this.garantieFormData.label || !this.garantieFormData.code || !this.garantieFormData.typeGarantie) return;

    if (this.isEditingGarantie && this.editingGarantieId) {
      this.settingsService.updateGarantie(this.editingGarantieId, this.garantieFormData).subscribe({
        next: () => {
          this.notificationMessage = `Garantie "${this.garantieFormData.label}" mise à jour en base de données avec succès !`;
          setTimeout(() => this.notificationMessage = '', 5000);
        }
      });
    } else {
      this.settingsService.addGarantie(this.garantieFormData).subscribe({
        next: () => {
          this.notificationMessage = `Garantie "${this.garantieFormData.label}" enregistrée en base de données avec succès !`;
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
    if (item.type === 'OBJET_CREDIT') {
      this.settingsService.restoreObjet(item.data);
    } else if (item.type === 'GARANTIE') {
      this.settingsService.restoreGarantie(item.data);
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
