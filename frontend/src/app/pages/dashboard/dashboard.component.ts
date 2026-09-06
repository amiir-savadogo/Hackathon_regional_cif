import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { DashboardStats } from '../../models/client.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div>
      <!-- Fil d'Ariane -->
      <nav class="flex items-center space-x-2 text-xs font-medium text-gray-500 mb-5 bg-white px-4 py-2.5 rounded-xl border border-gray-200/80 shadow-sm" aria-label="Breadcrumb">
        <span class="inline-flex items-center text-[#147c76] font-semibold">
          <svg class="w-3.5 h-3.5 mr-1.5 text-[#147c76]" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
          Accueil
        </span>
        <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        <span class="text-gray-800 font-semibold">Tableau de bord</span>
      </nav>

      <!-- En-tête de page -->
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Tableau de bord</h1>
          <p class="text-sm text-gray-500 mt-0.5">Vue d'ensemble et métriques d'évaluation du microcrédit</p>
        </div>
        <div class="flex items-center space-x-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Données en temps réel</span>
        </div>
      </div>

      <!-- Cartes de statistiques avec icônes -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" *ngIf="stats">
        <!-- Total Clients -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div class="flex items-center justify-between">
            <p class="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Clients</p>
            <div class="w-8 h-8 rounded-lg bg-[#e5f3f1] text-[#147c76] flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
          </div>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalClients }}</p>
          <p class="text-xs text-gray-400 mt-1">Adhérents enregistrés</p>
        </div>

        <!-- Demandes Total -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div class="flex items-center justify-between">
            <p class="text-xs text-gray-500 font-medium uppercase tracking-wide">Demandes Total</p>
            <div class="w-8 h-8 rounded-lg bg-[#e5f3f1] text-[#147c76] flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
          </div>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalDemandes }}</p>
          <p class="text-xs text-gray-400 mt-1">Dossiers instruits</p>
        </div>

        <!-- Approuvées -->
        <div class="bg-white rounded-xl border border-emerald-200/80 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div class="flex items-center justify-between">
            <p class="text-xs text-emerald-700 font-semibold uppercase tracking-wide">Approuvées</p>
            <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            </div>
          </div>
          <p class="text-3xl font-bold text-emerald-700 mt-2">{{ stats.approuvees }}</p>
          <p class="text-xs text-emerald-600/70 mt-1">Crédits accordés</p>
        </div>

        <!-- Rejetées -->
        <div class="bg-white rounded-xl border border-red-200/80 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div class="flex items-center justify-between">
            <p class="text-xs text-red-700 font-semibold uppercase tracking-wide">Rejetées</p>
            <div class="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </div>
          </div>
          <p class="text-3xl font-bold text-red-700 mt-2">{{ stats.rejetees }}</p>
          <p class="text-xs text-red-600/70 mt-1">Risque excessif</p>
        </div>
      </div>

      <!-- Taux d'approbation -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6" *ngIf="stats && stats.totalDemandes > 0">
        <h2 class="text-sm font-semibold text-gray-700 mb-3">Taux d'approbation global</h2>
        <div class="flex items-center space-x-4">
          <div class="flex-1 bg-gray-200 rounded-full h-3">
            <div class="bg-green-500 h-3 rounded-full transition-all duration-700"
              [style.width]="(stats.approuvees / stats.totalDemandes * 100) + '%'"></div>
          </div>
          <span class="text-sm font-bold text-gray-800 w-12">
            {{ stats.totalDemandes > 0 ? (stats.approuvees / stats.totalDemandes * 100 | number:'1.0-0') : 0 }}%
          </span>
        </div>
        <div class="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-gray-500">
          <span class="flex items-center space-x-1"><span class="w-2 h-2 rounded-full bg-green-500 inline-block"></span><span>Approuvé: {{ stats.approuvees }}</span></span>
          <span class="flex items-center space-x-1"><span class="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span><span>En étude: {{ stats.enEtude }}</span></span>
          <span class="flex items-center space-x-1"><span class="w-2 h-2 rounded-full bg-red-500 inline-block"></span><span>Rejeté: {{ stats.rejetees }}</span></span>
        </div>
      </div>

      <!-- Action rapide -->
      <div class="bg-[#e5f3f1] border border-[#b9ded9] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 class="font-semibold text-[#123b41]">Évaluer une nouvelle demande de crédit</h3>
          <p class="text-sm text-[#147c76] mt-1">Sélectionnez un sociétaire de la coopérative et lancez l'évaluation du score de risque par l'IA.</p>
        </div>
        <a routerLink="/credits/nouveau"
          class="bg-[#147c76] hover:bg-[#0e625e] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto flex items-center space-x-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          <span>Nouveau Crédit</span>
        </a>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  stats: DashboardStats | null = null;

  ngOnInit() {
    this.api.getStats().subscribe({
      next: (s: DashboardStats) => this.stats = s,
      error: () => this.stats = { totalClients: 0, totalDemandes: 0, approuvees: 0, rejetees: 0, enEtude: 0 }
    });
  }
}
