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
      <!-- En-tête -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-2xl font-bold text-ink-900 tracking-tight">Répertoire des Clients</h1>
            <span *ngIf="clients.length > 0" class="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-brand-50 text-brand-600 border border-brand-200">
              {{ clients.length }} adhérent{{ clients.length > 1 ? 's' : '' }}
            </span>
          </div>
          <p class="text-sm text-ink-500 mt-0.5">Base de données des emprunteurs et adhérents de la coopérative</p>
        </div>
        <a routerLink="/clients/nouveau"
          class="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all flex items-center space-x-2 self-start sm:self-auto">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span>Nouveau client</span>
        </a>
      </div>

      <!-- Barre de recherche moderne -->
      <div class="bg-white rounded-xl border border-ink-200 p-3 shadow-sm mb-4 flex items-center">
        <div class="relative flex-1">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <input type="text" [(ngModel)]="searchQuery"
            placeholder="Rechercher par nom, prénom ou téléphone..."
            class="w-full pl-9 pr-4 py-2 border border-ink-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600 bg-ink-50/50" />
        </div>
      </div>

      <!-- Table des clients -->
      <div class="bg-white rounded-xl border border-ink-200 shadow-sm overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-ink-50/80 border-b border-ink-200">
            <tr>
              <th class="px-5 py-3 text-xs font-semibold text-ink-500 uppercase tracking-wide">ID</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-500 uppercase tracking-wide">Demandeur</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-500 uppercase tracking-wide">Âge</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-500 uppercase tracking-wide">Secteur</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-500 uppercase tracking-wide">Ancienneté</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-500 uppercase tracking-wide">Enregistré le</th>
              <th class="px-5 py-3 text-right text-xs font-semibold text-ink-500 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink-100">
            <tr *ngFor="let c of filteredClients" class="hover:bg-brand-50/50 transition-colors">
              <td class="px-5 py-3.5 text-ink-400 font-mono text-xs">#{{ c.id }}</td>
              <td class="px-5 py-3.5">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {{ (c.prenom && c.prenom[0]) || '' }}{{ (c.nom && c.nom[0]) || '' }}
                  </div>
                  <div>
                    <span class="font-semibold text-ink-900 block leading-tight">{{ c.prenom }} {{ c.nom }}</span>
                    <span *ngIf="c.telephone" class="text-xs text-ink-400">{{ c.telephone }}</span>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3.5 text-ink-700 font-medium">{{ c.age }} ans</td>
              <td class="px-5 py-3.5 text-ink-600">
                <span class="px-2 py-0.5 text-xs rounded-md bg-ink-100 text-ink-700 font-medium">
                  {{ c.secteurActivite || 'Informel' }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-ink-600">{{ c.ancienneteActiviteAnnees }} an(s)</td>
              <td class="px-5 py-3.5 text-ink-400 text-xs">{{ c.dateCreation | date:'dd/MM/yyyy' }}</td>
              <td class="px-5 py-3.5 text-right">
                <a [routerLink]="['/clients', c.id, 'credit']"
                  class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-600 text-xs font-semibold transition-all border border-brand-200">
                  <span>Évaluer crédit</span>
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </a>
              </td>
            </tr>
            <tr *ngIf="filteredClients.length === 0">
              <td colspan="7" class="px-5 py-10 text-center text-ink-400 text-sm">
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
