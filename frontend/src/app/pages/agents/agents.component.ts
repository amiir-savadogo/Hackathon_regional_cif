import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AgentUser, AgentRole, AgenceCIF } from '../../models/user.model';

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <!-- En-tête avec bouton d'ajout -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Gestion des Agents & Équipe</h1>
          <p class="text-sm text-gray-500 mt-0.5">Portail officiel d'administration des collaborateurs et agences CIF</p>
        </div>
        <div>
          <button (click)="openModal()"
            class="bg-[#147c76] hover:bg-[#0e625e] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all flex items-center space-x-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span>Nouvel agent</span>
          </button>
        </div>
      </div>

      <!-- Métriques de l'équipe (si des agents sont enregistrés) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" *ngIf="agents.length > 0">
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p class="text-xs text-gray-500 font-medium uppercase">Total Effectif</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ agents.length }}</p>
          <p class="text-xs text-gray-400 mt-0.5">Collaborateurs habilités</p>
        </div>
        <div class="bg-white rounded-xl border border-[#b9ded9]/80 p-4 shadow-sm">
          <p class="text-xs text-[#147c76] font-semibold uppercase">Agents Actifs</p>
          <p class="text-2xl font-bold text-[#147c76] mt-1">{{ countActiveAgents() }}</p>
          <p class="text-xs text-[#147c76]/70 mt-0.5">Comptes opérationnels</p>
        </div>
        <div class="bg-white rounded-xl border border-[#b9ded9] p-4 shadow-sm">
          <p class="text-xs text-[#147c76] font-semibold uppercase">Comité de crédit</p>
          <p class="text-2xl font-bold text-[#147c76] mt-1">{{ countRole('COMITE_CREDIT') }}</p>
          <p class="text-xs text-[#147c76]/70 mt-0.5">Membres habilités</p>
        </div>
        <div class="bg-white rounded-xl border border-emerald-200/80 p-4 shadow-sm">
          <p class="text-xs text-emerald-700 font-semibold uppercase">Agences couvertes</p>
          <p class="text-2xl font-bold text-emerald-700 mt-1">{{ countAgences() }}</p>
          <p class="text-xs text-emerald-600/70 mt-0.5">Points de service CIF</p>
        </div>
      </div>

      <!-- Barre de recherche et filtre (si des agents sont enregistrés) -->
      <div class="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm mb-6 flex flex-col sm:flex-row gap-3" *ngIf="agents.length > 0">
        <div class="relative flex-1">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <input type="text" [(ngModel)]="searchQuery"
            placeholder="Rechercher par nom, matricule ou agence..."
            class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#147c76]/30 bg-gray-50/50" />
        </div>
        <select [(ngModel)]="selectedRoleFilter"
          class="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#147c76]/30 text-gray-700">
          <option value="ALL">Tous les rôles</option>
          <option *ngFor="let r of roles" [value]="r.code">{{ r.label }}</option>
        </select>
      </div>

      <!-- Notification de succès de changement de profil -->
      <div *ngIf="switchNotification" class="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
        <div class="flex items-center space-x-2">
          <svg class="w-4 h-4 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
          <span>Profil actif mis à jour : <strong>{{ switchNotification }}</strong></span>
        </div>
        <button (click)="switchNotification = ''" class="text-emerald-700 hover:text-emerald-900 font-bold ml-4">✕</button>
      </div>

      <!-- ÉTAT VIDE : Aucun agent enregistré -->
      <div *ngIf="agents.length === 0" class="bg-white rounded-2xl border border-gray-200/90 p-12 text-center shadow-sm max-w-xl mx-auto my-8">
        <div class="w-16 h-16 bg-[#e5f3f1] text-[#147c76] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <h2 class="text-lg font-bold text-gray-900 mb-1">Aucun collaborateur enregistré</h2>
        <p class="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          Enregistrez les membres de votre équipe (agents de crédit, chef d'agence, membres du comité) pour leur attribuer leurs accès officiels.
        </p>
        <button (click)="openModal()"
          class="bg-[#147c76] hover:bg-[#0e625e] text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all inline-flex items-center space-x-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span>Enregistrer le premier agent</span>
        </button>
      </div>

      <!-- Grille des Agents -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" *ngIf="agents.length > 0">
        <div *ngFor="let agent of filteredAgents"
          [ngClass]="{'ring-2 ring-[#147c76] shadow-md': isCurrentAgent(agent)}"
          class="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-sm hover:shadow transition-all relative flex flex-col justify-between">
          
          <div>
            <!-- En-tête carte : Avatar + Rôle -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 rounded-xl bg-[#147c76] flex items-center justify-center text-white font-bold text-base shadow-sm">
                  {{ getInitials(agent) }}
                </div>
                <div>
                  <h3 class="text-base font-bold text-gray-900 leading-snug">{{ agent.prenom }} {{ agent.nom }}</h3>
                  <p class="text-xs font-mono text-gray-400">{{ agent.matricule }}</p>
                </div>
              </div>

              <!-- Actions: Modifier + Supprimer -->
              <div class="flex items-center space-x-1">
                <span *ngIf="isCurrentAgent(agent)" class="mr-1 px-2 py-0.5 bg-[#e5f3f1] text-[#147c76] text-[10px] font-bold rounded-full border border-[#b9ded9] uppercase tracking-wider flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#147c76] animate-pulse"></span>
                  Actif
                </span>
                <button (click)="openEditModal(agent)" title="Modifier ce collaborateur"
                  class="text-gray-400 hover:text-[#147c76] hover:bg-[#e5f3f1] p-1.5 rounded-lg transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                  </svg>
                </button>
                <button (click)="deleteAgent(agent)" title="Supprimer cet agent"
                  class="text-gray-300 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>

            <!-- Rôle et Agence -->
            <div class="space-y-2 mb-5">
              <div class="flex items-center space-x-2">
                <span [ngClass]="getRoleBadgeClass(agent.roleCode)" class="px-2.5 py-1 rounded-lg text-xs font-semibold border">
                  {{ agent.roleLabel }}
                </span>
              </div>

              <div class="flex items-center text-xs text-gray-600 space-x-1.5 pt-1">
                <svg class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                <span class="truncate font-medium">{{ agent.agence }}</span>
              </div>

              <div class="flex items-center text-xs text-gray-400 space-x-1.5" *ngIf="agent.motDePasse">
                <svg class="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                <span>Accès protégé par mot de passe</span>
              </div>
            </div>
          </div>

          <!-- Bouton d'action -->
          <div class="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span class="text-[11px] text-gray-400">Ajouté le {{ agent.dateCreation | date:'dd/MM/yyyy' }}</span>
            <button *ngIf="!isCurrentAgent(agent)" (click)="requestActivateAgent(agent)"
              class="px-3 py-1.5 bg-gray-100 hover:bg-[#e5f3f1] text-gray-700 hover:text-[#147c76] text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5">
              <svg class="w-3.5 h-3.5 text-[#147c76]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
              <span>Se connecter</span>
            </button>
            <span *ngIf="isCurrentAgent(agent)" class="text-xs font-semibold text-[#147c76] flex items-center space-x-1">
              <svg class="w-4 h-4 text-[#147c76]" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
              <span>Profil actif</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Aucun résultat de recherche -->
      <div *ngIf="agents.length > 0 && filteredAgents.length === 0" class="text-center py-12 bg-white rounded-2xl border border-gray-200 mt-6">
        <p class="text-gray-500 font-medium">Aucun collaborateur ne correspond à votre recherche.</p>
      </div>

      <!-- MODAL D'AJOUT / MODIFICATION D'UN AGENT -->
      <div *ngIf="isModalOpen" class="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-fade-in max-h-[90vh] overflow-y-auto">
          
          <div class="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
            <div>
              <h2 class="text-lg font-bold text-gray-900" *ngIf="editingAgentId">Modifier le collaborateur</h2>
              <h2 class="text-lg font-bold text-gray-900" *ngIf="!editingAgentId">Enregistrer un collaborateur</h2>
              <p class="text-xs text-gray-500" *ngIf="editingAgentId">Mettre à jour les informations et accès</p>
              <p class="text-xs text-gray-500" *ngIf="!editingAgentId">Affectation officielle à une agence CIF</p>
            </div>
            <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form (ngSubmit)="submitAgentForm()" #agentForm="ngForm" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Prénom *</label>
                <input type="text" [(ngModel)]="newAgent.prenom" name="prenom" required
                  placeholder="Prénom"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#147c76]/30" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Nom *</label>
                <input type="text" [(ngModel)]="newAgent.nom" name="nom" required
                  placeholder="Nom de famille"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#147c76]/30" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Matricule CIF *</label>
                <input type="text" [(ngModel)]="newAgent.matricule" name="matricule" required
                  placeholder="Matricule"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-[#147c76]/30" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Téléphone</label>
                <input type="text" [(ngModel)]="newAgent.telephone" name="telephone"
                  placeholder="Numéro de téléphone"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#147c76]/30" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Email professionnel</label>
              <input type="email" [(ngModel)]="newAgent.email" name="email"
                placeholder="Email professionnel"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#147c76]/30" />
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-semibold text-gray-700">{{ editingAgentId ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe de connexion *' }}</label>
                <button type="button" (click)="generateRandomPassword()" class="text-[11px] font-semibold text-[#147c76] hover:text-[#0e625e] transition-colors flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  <span>Générer un mot de passe</span>
                </button>
              </div>
              <div class="relative">
                <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="newAgent.motDePasse" name="motDePasse" [required]="!editingAgentId" [minlength]="editingAgentId ? 0 : 4"
                  [placeholder]="editingAgentId ? 'Laisser vide pour conserver le mot de passe actuel' : 'Définir un mot de passe (min. 4 car.)'"
                  class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#147c76]/30" />
                <button type="button" (click)="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  <svg *ngIf="!showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  <svg *ngIf="showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                </button>
              </div>
              <p class="text-[11px] text-gray-400 mt-1" *ngIf="editingAgentId">Laissez vide si vous ne souhaitez pas changer le mot de passe.</p>
              <p class="text-[11px] text-gray-400 mt-1" *ngIf="!editingAgentId">Requis pour que le collaborateur puisse se connecter et valider ses opérations.</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Rôle d'habilitation *</label>
                <select *ngIf="roles.length > 0" [(ngModel)]="newAgent.roleCode" name="roleCode" required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#147c76]/30 bg-white">
                  <option *ngFor="let r of roles" [value]="r.code">{{ r.label }}</option>
                </select>
                <div *ngIf="roles.length === 0" class="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <span>Aucun rôle configuré pour le moment.</span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Agence CIF *</label>
                <select *ngIf="agences.length > 0" [(ngModel)]="newAgent.agence" name="agence" required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#147c76]/30 bg-white">
                  <option *ngFor="let ag of agences" [value]="ag.nom">{{ ag.nom }} ({{ ag.ville }}{{ ag.pays ? ' · ' + ag.pays : '' }})</option>
                </select>
                <div *ngIf="agences.length === 0" class="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <span>Aucune agence configurée pour le moment.</span>
                </div>
              </div>
            </div>

            <div class="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button type="button" (click)="closeModal()"
                class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button type="submit" [disabled]="!agentForm.form.valid"
                class="px-5 py-2 bg-[#147c76] hover:bg-[#0e625e] disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">
                <span *ngIf="editingAgentId">Enregistrer les modifications</span>
                <span *ngIf="!editingAgentId">Enregistrer le collaborateur</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL DE CONNEXION AVEC MOT DE PASSE -->
      <div *ngIf="isAuthModalOpen && agentToAuth" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-fade-in text-center border border-gray-100">
          
          <div class="w-12 h-12 rounded-2xl bg-[#e5f3f1] text-[#147c76] flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>

          <h3 class="text-base font-bold text-gray-900">Connexion Collaborateur</h3>
          <p class="text-xs text-gray-500 mt-1">
            Session de <strong>{{ agentToAuth.prenom }} {{ agentToAuth.nom }}</strong>
          </p>
          <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#e5f3f1] text-[#147c76] border border-[#b9ded9]">
            Matricule : {{ agentToAuth.matricule }}
          </span>

          <form (ngSubmit)="confirmAuth()" class="mt-4 space-y-3 text-left">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Mot de passe de session *</label>
              <div class="relative">
                <input [type]="showAuthPassword ? 'text' : 'password'" [(ngModel)]="authPasswordInput" name="authPass" required autofocus
                  placeholder="Entrez le mot de passe"
                  class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#147c76]" />
                <button type="button" (click)="showAuthPassword = !showAuthPassword"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  <svg *ngIf="!showAuthPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  <svg *ngIf="showAuthPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                </button>
              </div>
            </div>

            <div *ngIf="authErrorMessage" class="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {{ authErrorMessage }}
            </div>

            <div class="pt-2 flex items-center justify-end space-x-2">
              <button type="button" (click)="closeAuthModal()"
                class="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button type="submit" [disabled]="!authPasswordInput"
                class="px-4 py-2 bg-[#147c76] hover:bg-[#0e625e] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-colors">
                Se connecter
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class AgentsComponent implements OnInit {
  private authService = inject(AuthService);

  agents: AgentUser[] = [];
  roles: AgentRole[] = [];
  agences: AgenceCIF[] = [];
  currentAgent: AgentUser | null = null;
  searchQuery = '';
  selectedRoleFilter = 'ALL';
  switchNotification = '';
  isModalOpen = false;
  showPassword = false;

  // Modale d'authentification par mot de passe
  isAuthModalOpen = false;
  agentToAuth: AgentUser | null = null;
  authPasswordInput = '';
  authErrorMessage = '';
  showAuthPassword = false;

  newAgent = {
    nom: '',
    prenom: '',
    matricule: '',
    email: '',
    motDePasse: '',
    roleCode: '',
    agence: '',
    telephone: ''
  };

  ngOnInit() {
    this.authService.agents$.subscribe(list => this.agents = list);
    this.authService.roles$.subscribe(rList => {
      this.roles = rList;
      if (this.roles.length > 0 && !this.newAgent.roleCode) {
        this.newAgent.roleCode = this.roles[0].code;
      }
    });
    this.authService.agences$.subscribe(agList => {
      this.agences = agList;
      if (this.agences.length > 0 && !this.newAgent.agence) {
        this.newAgent.agence = this.agences[0].nom;
      }
    });
    this.authService.currentUser$.subscribe(curr => this.currentAgent = curr);
  }

  get filteredAgents(): AgentUser[] {
    const q = this.searchQuery.toLowerCase().trim();
    return this.agents.filter(a => {
      const matchesQuery = !q ||
        a.nom.toLowerCase().includes(q) ||
        a.prenom.toLowerCase().includes(q) ||
        a.matricule.toLowerCase().includes(q) ||
        a.agence.toLowerCase().includes(q);

      const matchesRole = this.selectedRoleFilter === 'ALL' || a.roleCode === this.selectedRoleFilter;
      return matchesQuery && matchesRole;
    });
  }

  isCurrentAgent(agent: AgentUser): boolean {
    return this.currentAgent !== null && this.currentAgent.id === agent.id;
  }

  activateAgent(agent: AgentUser) {
    this.authService.setCurrentUser(agent.id);
    this.switchNotification = `${agent.prenom} ${agent.nom} (${agent.roleLabel} · ${agent.agence})`;
    setTimeout(() => {
      this.switchNotification = '';
    }, 4000);
  }

  deleteAgent(agent: AgentUser) {
    if (confirm(`Déplacer le collaborateur ${agent.prenom} ${agent.nom} vers la Corbeille ? (Restaurable pendant 30 jours dans Paramètres)`)) {
      this.authService.deleteAgent(agent.id);
      this.switchNotification = `${agent.prenom} ${agent.nom} déplacé vers la Corbeille (restaurable sous 30 jours).`;
      setTimeout(() => {
        this.switchNotification = '';
      }, 5000);
    }
  }

  getInitials(agent: AgentUser): string {
    const p = agent.prenom ? agent.prenom[0] : '';
    const n = agent.nom ? agent.nom[0] : '';
    return (p + n).toUpperCase() || 'AG';
  }

  countRole(code: string): number {
    return this.agents.filter(a => a.roleCode === code).length;
  }

  countActiveAgents(): number {
    return this.agents.filter(a => a.actif !== false).length;
  }

  countAgences(): number {
    const agences = new Set(this.agents.map(a => a.agence));
    return agences.size;
  }

  getRoleBadgeClass(roleCode: string): string {
    const match = this.roles.find(r => r.code === roleCode);
    return match?.badgeColor || 'bg-gray-100 text-gray-700 border-gray-200';
  }

  generateRandomPassword() {
    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowers = 'abcdefghijkmnpqrstuvwxyz';
    const digits = '23456789';
    const symbols = '@#$*!?%';

    const getRandom = (charset: string) => charset.charAt(Math.floor(Math.random() * charset.length));

    const pool = [
      getRandom(uppers),
      getRandom(uppers),
      getRandom(lowers),
      getRandom(lowers),
      getRandom(digits),
      getRandom(digits),
      getRandom(symbols),
      getRandom(symbols),
      getRandom(uppers + lowers),
      getRandom(digits + symbols)
    ];

    const shuffled = pool.sort(() => Math.random() - 0.5).join('');
    this.newAgent.motDePasse = 'CIF-' + shuffled;
    this.showPassword = true;
  }

  requestActivateAgent(agent: AgentUser) {
    if (!agent.motDePasse) {
      this.activateAgent(agent);
      return;
    }
    this.agentToAuth = agent;
    this.authPasswordInput = '';
    this.authErrorMessage = '';
    this.showAuthPassword = false;
    this.isAuthModalOpen = true;
  }

  confirmAuth() {
    if (!this.agentToAuth) return;
    if (this.authPasswordInput === this.agentToAuth.motDePasse) {
      const agent = this.agentToAuth;
      this.isAuthModalOpen = false;
      this.agentToAuth = null;
      this.activateAgent(agent);
    } else {
      this.authErrorMessage = 'Mot de passe incorrect. Veuillez vérifier vos identifiants.';
    }
  }

  closeAuthModal() {
    this.isAuthModalOpen = false;
    this.agentToAuth = null;
    this.authPasswordInput = '';
    this.authErrorMessage = '';
  }

  editingAgentId: string | null = null;

  openModal() {
    this.editingAgentId = null;
    this.newAgent = {
      nom: '',
      prenom: '',
      matricule: '',
      email: '',
      motDePasse: '',
      roleCode: this.roles.length > 0 ? this.roles[0].code : '',
      agence: this.agences.length > 0 ? this.agences[0].nom : '',
      telephone: ''
    };
    this.showPassword = false;
    this.isModalOpen = true;
  }

  openEditModal(agent: AgentUser) {
    this.editingAgentId = agent.id;
    this.newAgent = {
      nom: agent.nom,
      prenom: agent.prenom,
      matricule: agent.matricule,
      email: agent.email || '',
      motDePasse: '', // Laisser vide pour conserver le mot de passe existant sauf si modifié
      roleCode: agent.roleCode,
      agence: agent.agence,
      telephone: agent.telephone || ''
    };
    this.showPassword = false;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingAgentId = null;
  }

  submitAgentForm() {
    if (!this.newAgent.nom || !this.newAgent.prenom || !this.newAgent.matricule) return;

    if (this.editingAgentId) {
      // Mode Édition
      const updated = this.authService.updateAgent(this.editingAgentId, this.newAgent);
      this.closeModal();
      if (updated) {
        this.switchNotification = `Collaborateur ${updated.prenom} ${updated.nom} mis à jour avec succès.`;
        setTimeout(() => this.switchNotification = '', 4000);
      }
    } else {
      // Mode Nouvel Agent
      if (!this.newAgent.motDePasse) return;
      const created = this.authService.addAgent(this.newAgent);
      this.closeModal();
      this.activateAgent(created);
    }
  }
}
