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
      <!-- En-tête de page -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p class="text-sm text-gray-500 mt-0.5">Vue d'ensemble des activités de crédit</p>
      </div>

      <!-- Cartes de statistiques -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" *ngIf="stats">
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p class="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Clients</p>
          <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats.totalClients }}</p>
          <p class="text-xs text-gray-400 mt-1">Enregistrés dans la base</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p class="text-xs text-gray-500 font-medium uppercase tracking-wide">Demandes Total</p>
          <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats.totalDemandes }}</p>
          <p class="text-xs text-gray-400 mt-1">Tous statuts confondus</p>
        </div>
        <div class="bg-white rounded-xl border border-green-200 p-5 shadow-sm">
          <p class="text-xs text-green-600 font-medium uppercase tracking-wide">Approuvées</p>
          <p class="text-3xl font-bold text-green-700 mt-1">{{ stats.approuvees }}</p>
          <p class="text-xs text-gray-400 mt-1">Crédits accordés</p>
        </div>
        <div class="bg-white rounded-xl border border-red-200 p-5 shadow-sm">
          <p class="text-xs text-red-600 font-medium uppercase tracking-wide">Rejetées</p>
          <p class="text-3xl font-bold text-red-700 mt-1">{{ stats.rejetees }}</p>
          <p class="text-xs text-gray-400 mt-1">Dossiers refusés</p>
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
        <div class="flex space-x-6 mt-3 text-xs text-gray-500">
          <span class="flex items-center space-x-1"><span class="w-2 h-2 rounded-full bg-green-500 inline-block"></span><span>Approuvé: {{ stats.approuvees }}</span></span>
          <span class="flex items-center space-x-1"><span class="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span><span>En étude: {{ stats.enEtude }}</span></span>
          <span class="flex items-center space-x-1"><span class="w-2 h-2 rounded-full bg-red-500 inline-block"></span><span>Rejeté: {{ stats.rejetees }}</span></span>
        </div>
      </div>

      <!-- Action rapide -->
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-6 flex items-center justify-between">
        <div>
          <h3 class="font-semibold text-blue-900">Enregistrer un nouveau demandeur</h3>
          <p class="text-sm text-blue-700 mt-1">Créez d'abord le profil du client, puis soumettez sa demande de crédit.</p>
        </div>
        <a routerLink="/clients/nouveau"
          class="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap">
          + Nouveau client
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
