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
    <div class="space-y-5 sm:space-y-6 animate-fade-up">
      <!-- En-tête avec bouton d'ajout -->
      <header class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="min-w-0">
          <p class="eyebrow">Organisation</p>
          <h1 class="mt-1 text-2xl sm:text-3xl font-extrabold text-ink-900">Agents &amp; équipe</h1>
          <p class="section-sub max-w-2xl">
            Administration des collaborateurs habilités et de leur affectation aux agences.
          </p>
        </div>
        <button type="button" (click)="openModal()" class="btn-primary flex-shrink-0 self-start lg:self-auto">
          <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m-7-7h14"/></svg>
          <span>Nouvel agent</span>
        </button>
      </header>

      <!-- Métriques de l'équipe -->
      <section class="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4" *ngIf="agents.length > 0"
        aria-label="Synthèse de l'équipe">
        <article class="stat">
          <span class="absolute inset-x-0 top-0 h-1 bg-ink-300" aria-hidden="true"></span>
          <p class="stat-label">Effectif total</p>
          <p class="stat-value">{{ agents.length }}</p>
          <p class="stat-sub">Collaborateurs habilités</p>
        </article>
        <article class="stat">
          <span class="absolute inset-x-0 top-0 h-1 bg-brand-500" aria-hidden="true"></span>
          <p class="stat-label text-brand-700">Agents actifs</p>
          <p class="stat-value text-brand-700">{{ countActiveAgents() }}</p>
          <p class="stat-sub">Comptes opérationnels</p>
        </article>
        <article class="stat">
          <span class="absolute inset-x-0 top-0 h-1 bg-info-500" aria-hidden="true"></span>
          <p class="stat-label text-info-700">Comité de crédit</p>
          <p class="stat-value text-info-700">{{ countRole('COMITE_CREDIT') }}</p>
          <p class="stat-sub">Membres habilités</p>
        </article>
        <article class="stat">
          <span class="absolute inset-x-0 top-0 h-1 bg-success-500" aria-hidden="true"></span>
          <p class="stat-label text-success-700">Agences couvertes</p>
          <p class="stat-value text-success-700">{{ countAgences() }}</p>
          <p class="stat-sub">Points de service</p>
        </article>
      </section>

      <!-- Barre de recherche et filtre (si des agents sont enregistrés) -->
      <div class="bg-white rounded-xl border border-ink-200 p-3.5 shadow-sm mb-6 flex flex-col sm:flex-row gap-3" *ngIf="agents.length > 0">
        <div class="relative flex-1">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <input type="text" [(ngModel)]="searchQuery"
            placeholder="Rechercher par nom, matricule ou agence..."
            class="input pl-10" />
        </div>
        <select [(ngModel)]="selectedRoleFilter"
          class="select">
          <option value="ALL">Tous les rôles</option>
          <option *ngFor="let r of roles" [value]="r.code">{{ r.label }}</option>
        </select>
      </div>

      <!-- Notification de succès de changement de profil -->
      <div *ngIf="switchNotification" class="mb-4 bg-success-50 border border-success-200 text-success-800 text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
        <div class="flex items-center space-x-2">
          <svg class="w-4 h-4 text-success-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
          <span>Profil actif mis à jour : <strong>{{ switchNotification }}</strong></span>
        </div>
        <button (click)="switchNotification = ''" class="text-success-700 hover:text-success-900 font-bold ml-4">✕</button>
      </div>

      <!-- ÉTAT VIDE : Aucun agent enregistré -->
      <div *ngIf="agents.length === 0" class="bg-white rounded-2xl border border-ink-200/90 p-12 text-center shadow-sm max-w-xl mx-auto my-8">
        <div class="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <h2 class="text-lg font-bold text-ink-900 mb-1">Aucun collaborateur enregistré</h2>
        <p class="text-sm text-ink-500 mb-6 max-w-md mx-auto">
          Enregistrez les membres de votre équipe (agents de crédit, chef d'agence, membres du comité) pour leur attribuer leurs accès officiels.
        </p>
        <button (click)="openModal()"
          class="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all inline-flex items-center space-x-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span>Enregistrer le premier agent</span>
        </button>
      </div>

      <!-- Grille des Agents -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" *ngIf="agents.length > 0">
        <div *ngFor="let agent of filteredAgents"
          [ngClass]="{'ring-2 ring-brand-600 shadow-md': isCurrentAgent(agent)}"
          class="bg-white rounded-2xl border border-ink-200/90 p-5 shadow-sm hover:shadow transition-all relative flex flex-col justify-between">
          
          <div>
            <!-- En-tête carte : identité à gauche, actions à droite -->
            <div class="flex items-start justify-between gap-3 mb-4">
              <div class="flex items-center gap-3 min-w-0">
                <span class="grid place-items-center w-12 h-12 flex-shrink-0 rounded-2xl bg-brand-gradient
                             text-white font-bold text-sm shadow-brand" aria-hidden="true">
                  {{ getInitials(agent) }}
                </span>
                <div class="min-w-0">
                  <h3 class="text-base font-bold text-ink-900 leading-snug truncate">{{ agent.prenom }} {{ agent.nom }}</h3>
                  <p class="text-xs font-mono text-ink-400 truncate">{{ agent.matricule }}</p>
                  <span *ngIf="isCurrentAgent(agent)"
                    class="mt-1 inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50
                           px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700">
                    <span class="dot bg-brand-600"></span> Session active
                  </span>
                </div>
              </div>

              <!-- Actions : modifier / corbeille -->
              <div class="flex items-center gap-0.5 flex-shrink-0">
                <button type="button" (click)="openEditModal(agent)"
                  class="btn-icon p-2 text-ink-400 hover:text-brand-700 hover:bg-brand-50"
                  title="Modifier ce collaborateur"
                  [attr.aria-label]="'Modifier ' + agent.prenom + ' ' + agent.nom">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                  </svg>
                </button>
                <button type="button" (click)="deleteAgent(agent)"
                  class="btn-icon p-2 text-ink-300 hover:text-danger-600 hover:bg-danger-50"
                  title="Déplacer vers la corbeille"
                  [attr.aria-label]="'Déplacer ' + agent.prenom + ' ' + agent.nom + ' vers la corbeille'">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
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

              <div class="flex items-center text-xs text-ink-600 space-x-1.5 pt-1">
                <svg class="w-3.5 h-3.5 text-ink-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                <span class="truncate font-medium">{{ agent.agence }}</span>
              </div>

              <div class="flex items-center text-xs text-ink-400 space-x-1.5" *ngIf="agent.motDePasse">
                <svg class="w-3.5 h-3.5 text-success-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                <span>Accès protégé par mot de passe</span>
              </div>
            </div>
          </div>

          <!-- Bouton d'action -->
          <div class="pt-3 border-t border-ink-100 flex items-center justify-between">
            <span class="text-[11px] text-ink-400">Ajouté le {{ agent.dateCreation | date:'dd/MM/yyyy' }}</span>
            <button *ngIf="!isCurrentAgent(agent)" (click)="requestActivateAgent(agent)"
              class="px-3 py-1.5 bg-ink-100 hover:bg-brand-50 text-ink-700 hover:text-brand-600 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5">
              <svg class="w-3.5 h-3.5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
              <span>Se connecter</span>
            </button>
            <span *ngIf="isCurrentAgent(agent)" class="text-xs font-semibold text-brand-600 flex items-center space-x-1">
              <svg class="w-4 h-4 text-brand-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
              <span>Profil actif</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Aucun résultat de recherche -->
      <div *ngIf="agents.length > 0 && filteredAgents.length === 0" class="text-center py-12 bg-white rounded-2xl border border-ink-200 mt-6">
        <p class="text-ink-500 font-medium">Aucun collaborateur ne correspond à votre recherche.</p>
      </div>

      <!-- MODAL D'AJOUT / MODIFICATION D'UN AGENT -->
      <div *ngIf="isModalOpen" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="scrim animate-fade-in" (click)="closeModal()" aria-hidden="true"></div>

        <div role="dialog" aria-modal="true" aria-labelledby="titre-modale-agent"
          class="relative w-full sm:max-w-2xl max-h-[92dvh] flex flex-col overflow-hidden
                 rounded-t-3xl sm:rounded-3xl bg-white shadow-xl animate-scale-in">

          <!-- En-tête fixe -->
          <div class="flex items-start justify-between gap-3 border-b border-ink-200 px-5 py-4 sm:px-6 flex-shrink-0">
            <div class="flex items-center gap-3 min-w-0">
              <span class="grid place-items-center w-10 h-10 flex-shrink-0 rounded-2xl bg-brand-50 text-brand-600" aria-hidden="true">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              </span>
              <div class="min-w-0">
                <h2 id="titre-modale-agent" class="text-base sm:text-lg font-bold text-ink-900 truncate">
                  {{ editingAgentId ? 'Modifier le collaborateur' : 'Enregistrer un collaborateur' }}
                </h2>
                <p class="text-xs text-ink-500 truncate">
                  {{ editingAgentId ? 'Mettre à jour les informations et les accès' : 'Identité, rôle et affectation à une agence' }}
                </p>
              </div>
            </div>
            <button type="button" (click)="closeModal()"
              class="btn-icon p-2 text-ink-400 hover:text-ink-800 hover:bg-ink-100 flex-shrink-0"
              aria-label="Fermer">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form (ngSubmit)="submitAgentForm()" #agentForm="ngForm"
            class="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="label mb-1.5">Prénom *</label>
                <input type="text" [(ngModel)]="newAgent.prenom" name="prenom" required
                  placeholder="Prénom"
                  class="input" />
              </div>
              <div>
                <label class="label mb-1.5">Nom *</label>
                <input type="text" [(ngModel)]="newAgent.nom" name="nom" required
                  placeholder="Nom de famille"
                  class="input" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="label mb-1.5">Matricule *</label>
                <input type="text" [(ngModel)]="newAgent.matricule" name="matricule" required
                  placeholder="Matricule"
                  class="input" />
              </div>
              <div>
                <label class="label mb-1.5">Téléphone</label>
                <input type="text" [(ngModel)]="newAgent.telephone" name="telephone"
                  placeholder="Numéro de téléphone"
                  class="input" />
              </div>
            </div>

            <div>
              <label class="label mb-1.5">Email professionnel</label>
              <input type="email" [(ngModel)]="newAgent.email" name="email"
                placeholder="Email professionnel"
                class="input" />
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="label">{{ editingAgentId ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe de connexion *' }}</label>
                <button type="button" (click)="generateRandomPassword()" class="text-[11px] font-semibold text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  <span>Générer un mot de passe</span>
                </button>
              </div>
              <div class="relative">
                <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="newAgent.motDePasse" name="motDePasse" [required]="!editingAgentId" [minlength]="editingAgentId ? 0 : 4"
                  [placeholder]="editingAgentId ? 'Laisser vide pour conserver le mot de passe actuel' : 'Définir un mot de passe (min. 4 car.)'"
                  class="input font-mono pr-10" />
                <button type="button" (click)="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-400 hover:text-ink-600">
                  <svg *ngIf="!showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  <svg *ngIf="showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                </button>
              </div>
              <p class="text-[11px] text-ink-400 mt-1" *ngIf="editingAgentId">Laissez vide si vous ne souhaitez pas changer le mot de passe.</p>
              <p class="text-[11px] text-ink-400 mt-1" *ngIf="!editingAgentId">Requis pour que le collaborateur puisse se connecter et valider ses opérations.</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="label mb-1.5">Rôle d'habilitation *</label>
                <select *ngIf="roles.length > 0" [(ngModel)]="newAgent.roleCode" name="roleCode" required
                  class="input">
                  <option *ngFor="let r of roles" [value]="r.code">{{ r.label }}</option>
                </select>
                <div *ngIf="roles.length === 0" class="p-2 bg-warning-50 border border-warning-200 rounded-lg text-xs text-warning-800">
                  <span>Aucun rôle configuré pour le moment.</span>
                </div>
              </div>

              <div>
                <label class="label mb-1.5">Agence *</label>
                <select *ngIf="agences.length > 0" [(ngModel)]="newAgent.agence" name="agence" required
                  class="input">
                  <option *ngFor="let ag of agences" [value]="ag.nom">{{ ag.nom }} ({{ ag.ville }}{{ ag.pays ? ' · ' + ag.pays : '' }})</option>
                </select>
                <div *ngIf="agences.length === 0" class="p-2 bg-warning-50 border border-warning-200 rounded-lg text-xs text-warning-800">
                  <span>Aucune agence configurée pour le moment.</span>
                </div>
              </div>
            </div>

            <div class="pt-4 border-t border-ink-100 flex items-center justify-end space-x-3">
              <button type="button" (click)="closeModal()"
                class="btn-secondary">
                Annuler
              </button>
              <button type="submit" [disabled]="!agentForm.form.valid"
                class="px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">
                <span *ngIf="editingAgentId">Enregistrer les modifications</span>
                <span *ngIf="!editingAgentId">Enregistrer le collaborateur</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL DE CONNEXION AVEC MOT DE PASSE -->
      <div *ngIf="isAuthModalOpen && agentToAuth" class="fixed inset-0 bg-ink-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-fade-in text-center border border-ink-100">
          
          <div class="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>

          <h3 class="text-base font-bold text-ink-900">Connexion Collaborateur</h3>
          <p class="text-xs text-ink-500 mt-1">
            Session de <strong>{{ agentToAuth.prenom }} {{ agentToAuth.nom }}</strong>
          </p>
          <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-50 text-brand-600 border border-brand-200">
            Matricule : {{ agentToAuth.matricule }}
          </span>

          <form (ngSubmit)="confirmAuth()" class="mt-4 space-y-3 text-left">
            <div>
              <label class="label mb-1.5">Mot de passe de session *</label>
              <div class="relative">
                <input [type]="showAuthPassword ? 'text' : 'password'" [(ngModel)]="authPasswordInput" name="authPass" required autofocus
                  placeholder="Entrez le mot de passe"
                  class="w-full px-3 py-2 pr-10 border border-ink-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-600" />
                <button type="button" (click)="showAuthPassword = !showAuthPassword"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-400 hover:text-ink-600">
                  <svg *ngIf="!showAuthPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  <svg *ngIf="showAuthPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                </button>
              </div>
            </div>

            <div *ngIf="authErrorMessage" class="p-2.5 bg-danger-50 border border-danger-200 text-danger-700 text-xs rounded-xl font-medium">
              {{ authErrorMessage }}
            </div>

            <div class="pt-2 flex items-center justify-end space-x-2">
              <button type="button" (click)="closeAuthModal()"
                class="btn-secondary btn-sm">
                Annuler
              </button>
              <button type="submit" [disabled]="!authPasswordInput"
                class="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-colors">
                Se connecter
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ===== Boîte de dialogue de confirmation (remplace window.confirm) ===== -->
      <div *ngIf="confirmDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-ink-900/40 backdrop-blur-[1px]" (click)="fermerConfirmation()"></div>
        <div role="dialog" aria-modal="true"
          class="relative w-full max-w-md bg-white rounded-2xl border border-ink-200 shadow-2xl p-6 space-y-4">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              [ngClass]="confirmDialog.danger ? 'bg-danger-50 text-danger-600' : 'bg-brand-50 text-brand-600'">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-base font-bold text-ink-900">{{ confirmDialog.titre }}</h3>
              <p class="text-sm text-ink-600 mt-1">{{ confirmDialog.message }}</p>
              <p *ngIf="confirmDialog.detail" class="text-xs mt-1"
                [ngClass]="confirmDialog.danger ? 'text-danger-500 font-medium' : 'text-ink-400'">{{ confirmDialog.detail }}</p>
            </div>
          </div>
          <div class="flex items-center justify-end gap-2 pt-1">
            <button type="button" (click)="fermerConfirmation()"
              class="px-4 py-2 rounded-xl text-sm font-semibold text-ink-600 hover:bg-ink-100 transition-colors">Annuler</button>
            <button type="button" (click)="confirmerAction()"
              [ngClass]="confirmDialog.danger ? 'bg-danger-600 hover:bg-danger-700' : 'bg-brand-600 hover:bg-brand-700'"
              class="px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm transition-colors">{{ confirmDialog.libelleOk }}</button>
          </div>
        </div>
      </div>

      <!-- ===== Notification (toast) ===== -->
      <div *ngIf="toast" class="fixed bottom-5 right-5 z-50 max-w-sm">
        <div class="flex items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg"
          [ngClass]="toast.type === 'error' ? 'border-danger-200' : 'border-success-200'">
          <svg *ngIf="toast.type === 'success'" class="w-5 h-5 flex-shrink-0 text-success-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          <svg *ngIf="toast.type === 'error'" class="w-5 h-5 flex-shrink-0 text-danger-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
          <p class="text-sm font-medium text-ink-800 flex-1">{{ toast.message }}</p>
          <button type="button" (click)="toast = null" class="text-ink-300 hover:text-ink-500 text-sm leading-none mt-0.5">✕</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* Garde-fou anti-débordement : un nom ou un matricule long ne doit jamais
       pousser les boutons d'action hors de la carte. */
    :host h3, :host p, :host li, :host dd { overflow-wrap: anywhere; }
    :host .flex > * { min-width: 0; }
  `]
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

  // Boîte de dialogue de confirmation (remplace window.confirm) + notification.
  confirmDialog: {
    titre: string;
    message: string;
    detail?: string;
    danger?: boolean;
    libelleOk: string;
    action: () => void;
  } | null = null;
  toast: { type: 'success' | 'error'; message: string } | null = null;
  private toastTimer?: ReturnType<typeof setTimeout>;

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

  private notifier(type: 'success' | 'error', message: string) {
    this.toast = { type, message };
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toast = null), 3800);
  }

  fermerConfirmation() { this.confirmDialog = null; }

  confirmerAction() {
    const action = this.confirmDialog?.action;
    this.confirmDialog = null;
    action?.();
  }

  deleteAgent(agent: AgentUser) {
    const nom = `${agent.prenom} ${agent.nom}`;
    this.confirmDialog = {
      titre: 'Déplacer ce collaborateur vers la corbeille ?',
      message: `${nom} sera retiré de la liste des agents actifs.`,
      detail: 'Restaurable pendant 30 jours depuis Paramètres > Corbeille.',
      libelleOk: 'Déplacer vers la corbeille',
      action: () => {
        this.authService.deleteAgent(agent.id);
        this.notifier('success', `${nom} déplacé vers la corbeille.`);
      },
    };
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
    return match?.badgeColor || 'bg-ink-100 text-ink-700 border-ink-200';
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
    this.newAgent.motDePasse = 'TMP-' + shuffled;
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
        this.notifier('success', `${updated.prenom} ${updated.nom} mis à jour.`);
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
