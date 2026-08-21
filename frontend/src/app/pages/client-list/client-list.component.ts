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
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Clients</h1>
          <p class="text-sm text-gray-500 mt-0.5">Base de données des demandeurs de microcrédit</p>
        </div>
        <a routerLink="/clients/nouveau"
          class="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center space-x-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span>Nouveau client</span>
        </a>
      </div>

      <!-- Barre de recherche -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-4">
        <input type="text" [(ngModel)]="searchQuery"
          placeholder="Rechercher par nom ou prénom..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>

      <!-- Table des clients -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Demandeur</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Âge</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Secteur</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ancienneté</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Enregistré le</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let c of filteredClients" class="hover:bg-gray-50 transition-colors">
              <td class="px-5 py-3.5 text-gray-400 font-mono text-xs">#{{ c.id }}</td>
              <td class="px-5 py-3.5">
                <span class="font-semibold text-gray-900">{{ c.prenom }} {{ c.nom }}</span>
                <span *ngIf="c.telephone" class="block text-xs text-gray-400">{{ c.telephone }}</span>
              </td>
              <td class="px-5 py-3.5 text-gray-700">{{ c.age }} ans</td>
              <td class="px-5 py-3.5 text-gray-600">{{ c.secteurActivite || '-' }}</td>
              <td class="px-5 py-3.5 text-gray-600">{{ c.ancienneteActiviteAnnees }} an(s)</td>
              <td class="px-5 py-3.5 text-gray-400 text-xs">{{ c.dateCreation | date:'dd/MM/yyyy' }}</td>
              <td class="px-5 py-3.5 text-right">
                <a [routerLink]="['/clients', c.id, 'credit']"
                  class="text-blue-700 hover:text-blue-900 text-xs font-semibold hover:underline">
                  Évaluer crédit →
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
