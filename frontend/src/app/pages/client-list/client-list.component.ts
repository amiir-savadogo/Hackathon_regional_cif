import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Client } from '../../models/client.model';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div>
      <!-- Fil d'Ariane -->
      <nav class="flex items-center space-x-2 text-xs font-medium text-gray-500 mb-5 bg-white px-4 py-2.5 rounded-xl border border-gray-200/80 shadow-sm" aria-label="Breadcrumb">
        <a routerLink="/dashboard" class="inline-flex items-center text-gray-500 hover:text-blue-700 transition-colors">
          <svg class="w-3.5 h-3.5 mr-1.5 text-gray-400 hover:text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
          Accueil
        </a>
        <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        <span class="text-gray-800 font-semibold">Répertoire Clients</span>
        <span *ngIf="clients.length > 0" class="ml-2 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          {{ clients.length }} adhérent{{ clients.length > 1 ? 's' : '' }}
        </span>
      </nav>

      <!-- En-tête -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Répertoire des Clients</h1>
          <p class="text-sm text-gray-500 mt-0.5">Base de données des emprunteurs et adhérents de la coopérative</p>
        </div>
        <a routerLink="/clients/nouveau"
          class="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all flex items-center space-x-2 self-start sm:self-auto">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span>Nouveau client</span>
        </a>
      </div>

      <!-- Barre de recherche moderne -->
      <div class="bg-white rounded-xl border border-gray-200 p-3 shadow-sm mb-4 flex items-center">
        <div class="relative flex-1">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <input type="text" [(ngModel)]="searchQuery"
            placeholder="Rechercher par nom, prénom ou téléphone..."
            class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50" />
        </div>
      </div>

      <!-- Table des clients -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50/80 border-b border-gray-200">
            <tr>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Demandeur</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Âge</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Secteur</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ancienneté</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Enregistré le</th>
              <th class="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let c of filteredClients" class="hover:bg-blue-50/30 transition-colors">
              <td class="px-5 py-3.5 text-gray-400 font-mono text-xs">#{{ c.id }}</td>
              <td class="px-5 py-3.5">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {{ (c.prenom && c.prenom[0]) || '' }}{{ (c.nom && c.nom[0]) || '' }}
                  </div>
                  <div>
                    <span class="font-semibold text-gray-900 block leading-tight">{{ c.prenom }} {{ c.nom }}</span>
                    <span *ngIf="c.telephone" class="text-xs text-gray-400">{{ c.telephone }}</span>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3.5 text-gray-700 font-medium">{{ c.age }} ans</td>
              <td class="px-5 py-3.5 text-gray-600">
                <span class="px-2 py-0.5 text-xs rounded-md bg-gray-100 text-gray-700 font-medium">
                  {{ c.secteurActivite || 'Informel' }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-gray-600">{{ c.ancienneteActiviteAnnees }} an(s)</td>
              <td class="px-5 py-3.5 text-gray-400 text-xs">{{ c.dateCreation | date:'dd/MM/yyyy' }}</td>
              <td class="px-5 py-3.5 text-right">
                <a [routerLink]="['/clients', c.id, 'credit']"
                  class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-all border border-blue-200/60">
                  <span>Évaluer crédit</span>
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </a>
              </td>
            </tr>
            <tr *ngIf="filteredClients.length === 0">
              <td colspan="7" class="px-5 py-10 text-center text-gray-400 text-sm">
                {{ clients.length === 0 ? 'Aucun client enregistré. Commencez par en créer un.' : 'Aucun résultat pour cette recherche.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ClientListComponent implements OnInit {
  private api = inject(ApiService);
  clients: Client[] = [];
  searchQuery = '';

  get filteredClients(): Client[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.clients;
    return this.clients.filter(c =>
      c.nom.toLowerCase().includes(q) || c.prenom.toLowerCase().includes(q)
    );
  }

  ngOnInit() {
    this.api.getClients().subscribe({ next: (data) => this.clients = data });
  }
}
