import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';
import { AgentUser } from './models/user.model';

// SAMDE - CIF Microcrédit v1.0 (Sidebar mise à jour)
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <ng-container *ngIf="!isAuthPage; else authPage">
    <div class="flex h-screen bg-[#f4f7f8] font-sans overflow-hidden relative">

      <!-- HEADER MOBILE -->
      <div class="md:hidden absolute top-0 left-0 right-0 h-14 bg-[#123b41] text-white flex items-center justify-between px-4 z-20 shadow-md">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 bg-[#147c76] rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>
          </div>
          <span class="font-bold text-sm">SAMDE</span>
        </div>
        <button (click)="toggleSidebar()" class="p-2 text-[#b9cbca] hover:text-white focus:outline-none">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>

      <!-- BACKDROP MOBILE -->
      <div *ngIf="isSidebarOpen" (click)="closeSidebar()" class="md:hidden fixed inset-0 bg-[#123b41]/60 z-30 transition-opacity"></div>

      <!-- SIDEBAR -->
      <aside 
        [ngClass]="{
          'translate-x-0': isSidebarOpen,
          '-translate-x-full': !isSidebarOpen,
          'md:w-64': !isDesktopCollapsed,
          'md:w-20': isDesktopCollapsed
        }"
        class="fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#123b41] text-white flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out md:translate-x-0 shadow-xl md:shadow-none">
        
        <!-- Logo / Titre (Bureau) avec bouton collapse -->
        <div class="hidden md:flex py-5 border-b border-[#28565a] items-center justify-between transition-all duration-300"
          [ngClass]="isDesktopCollapsed ? 'px-4' : 'px-5'">
          <div class="flex items-center space-x-3 overflow-hidden">
            <div class="w-9 h-9 bg-[#147c76] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-[#0e625e]/30">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>
              </svg>
            </div>
            <div *ngIf="!isDesktopCollapsed" class="whitespace-nowrap transition-opacity duration-200">
              <p class="text-sm font-bold leading-tight">SAMDE</p>
              <p class="text-xs text-[#9cb4b4]">Portail Agent</p>
            </div>
          </div>
        </div>

        <!-- Bouton fermer sur mobile -->
        <div class="md:hidden flex justify-between items-center p-4 border-b border-[#28565a]">
          <span class="font-bold text-sm text-[#b9cbca] uppercase tracking-wider">Menu Principal</span>
          <button (click)="closeSidebar()" class="p-2 text-[#9cb4b4] hover:text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <a routerLink="/dashboard" routerLinkActive="bg-[#1b5558] text-white" (click)="closeSidebar()"
            [title]="isDesktopCollapsed ? 'Tableau de bord' : ''"
            [class.justify-center]="isDesktopCollapsed"
            class="flex items-center space-x-3 px-3 py-3 md:py-2.5 rounded-xl text-[#b9cbca] hover:bg-[#1b5558] hover:text-white transition-all text-sm font-medium">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            <span *ngIf="!isDesktopCollapsed" class="whitespace-nowrap">Tableau de bord</span>
          </a>

          <a routerLink="/credits" routerLinkActive="bg-[#1b5558] text-white" (click)="closeSidebar()"
            [title]="isDesktopCollapsed ? 'Crédits' : ''"
            [class.justify-center]="isDesktopCollapsed"
            class="flex items-center space-x-3 px-3 py-3 md:py-2.5 rounded-xl text-[#b9cbca] hover:bg-[#1b5558] hover:text-white transition-all text-sm font-medium">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            <span *ngIf="!isDesktopCollapsed" class="whitespace-nowrap">Crédits</span>
          </a>

          <!-- LIEN AGENTS & ÉQUIPE -->
          <a routerLink="/agents" routerLinkActive="bg-[#1b5558] text-white" (click)="closeSidebar()"
            [title]="isDesktopCollapsed ? 'Agents & Équipe' : ''"
            [class.justify-center]="isDesktopCollapsed"
            class="flex items-center space-x-3 px-3 py-3 md:py-2.5 rounded-xl text-[#b9cbca] hover:bg-[#1b5558] hover:text-white transition-all text-sm font-medium">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            <span *ngIf="!isDesktopCollapsed" class="whitespace-nowrap">Agents & Équipe</span>
          </a>

          <!-- LIEN PARAMÈTRES & CONFIGURATION GLOBALE -->
          <div class="pt-2">
            <a routerLink="/parametres" routerLinkActive="bg-[#1b5558] text-white" [routerLinkActiveOptions]="{ exact: true }" (click)="closeSidebar()"
              [title]="isDesktopCollapsed ? 'Paramètres' : ''"
              [class.justify-center]="isDesktopCollapsed"
              class="flex items-center space-x-3 px-3 py-3 md:py-2.5 rounded-xl text-[#b9cbca] hover:bg-[#1b5558] hover:text-white transition-all text-sm font-medium">
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <span *ngIf="!isDesktopCollapsed" class="whitespace-nowrap font-bold">Paramètres</span>
            </a>

            <!-- SOUS-MENUS PARAMÈTRES (Quand la sidebar est dépliée) -->
            <div *ngIf="!isDesktopCollapsed" class="ml-4 pl-3 border-l border-[#28565a] space-y-1 mt-1">
              <a routerLink="/parametres" [queryParams]="{ tab: 'OBJETS_CREDIT' }" (click)="closeSidebar()"
                class="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#9cb4b4] hover:text-white hover:bg-[#1b5558]/60 transition-colors">
                <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>Objets de Crédit</span>
              </a>

              <a routerLink="/parametres" [queryParams]="{ tab: 'GARANTIES' }" (click)="closeSidebar()"
                class="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#9cb4b4] hover:text-white hover:bg-[#1b5558]/60 transition-colors">
                <svg class="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                <span>Types de Garanties</span>
              </a>

              <a routerLink="/parametres" [queryParams]="{ tab: 'AGENCES' }" (click)="closeSidebar()"
                class="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#9cb4b4] hover:text-white hover:bg-[#1b5558]/60 transition-colors">
                <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                <span>Agences CIF</span>
              </a>

              <a routerLink="/parametres" [queryParams]="{ tab: 'ROLES' }" (click)="closeSidebar()"
                class="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#9cb4b4] hover:text-white hover:bg-[#1b5558]/60 transition-colors">
                <svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                <span>Rôles</span>
              </a>

              <a routerLink="/parametres" [queryParams]="{ tab: 'CORBEILLE' }" (click)="closeSidebar()"
                class="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#9cb4b4] hover:text-white hover:bg-[#1b5558]/60 transition-colors">
                <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                <span>Corbeille</span>
              </a>
            </div>
          </div>
        </nav>

        <div class="px-4 py-4 border-t border-[#28565a] mt-auto" *ngIf="!isDesktopCollapsed">
          <p class="text-xs text-[#b9cbca] text-center font-semibold mb-1">Équipe DataMaster</p>
          <p class="text-xs text-[#7fa3a2] text-center">CIF &copy; 2026 - Prototype v1.0</p>
        </div>
      </aside>

      <!-- CONTENU PRINCIPAL -->
      <div class="flex-1 flex flex-col overflow-hidden w-full pt-14 md:pt-0">

        <!-- TOPBAR BUREAU AVEC BOUTON BURGER / TOGGLE -->
        <header class="hidden md:flex h-16 bg-white border-b border-gray-200 items-center justify-between px-6 z-10 flex-shrink-0">
          <div class="flex items-center space-x-3">
            <!-- Bouton basculer sidebar desktop -->
            <button (click)="toggleDesktopSidebar()" 
              class="p-2 rounded-lg text-gray-500 hover:text-[#147c76] hover:bg-[#e5f3f1] transition-colors focus:outline-none" 
              [title]="isDesktopCollapsed ? 'Agrandir la barre latérale' : 'Réduire la barre latérale'">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/>
              </svg>
            </button>
          </div>

          <!-- Profil Agent Dynamique + Actions Header -->
          <div class="flex items-center space-x-3">
            <a routerLink="/agents" class="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer" title="Gérer les agents / Affecter un collaborateur">
              <div class="w-8 h-8 rounded-full bg-[#147c76] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {{ getInitials(currentAgent) }}
              </div>
              <div class="text-left">
                <p class="text-xs font-bold text-gray-800 group-hover:text-[#147c76] leading-tight transition-colors">
                  {{ currentAgent ? (currentAgent.prenom + ' ' + currentAgent.nom) : 'Portail CIF' }}
                </p>
                <p class="text-[11px] text-gray-400 leading-tight truncate max-w-[140px]">
                  {{ currentAgent ? currentAgent.roleLabel : 'Gérer les agents' }}
                </p>
              </div>
            </a>

            <button (click)="logout()" class="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Se déconnecter" aria-label="Se déconnecter">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10 17l5-5-5-5m5 5H3m10-9h5a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-5"/></svg>
            </button>
          </div>
        </header>

        <main class="flex-1 overflow-y-auto p-4 md:p-6 w-full">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
    </ng-container>
    <ng-template #authPage><router-outlet></router-outlet></ng-template>
  `,
  styles: []
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  isSidebarOpen = false;       // État du tiroir sur mobile
  isDesktopCollapsed = false;  // État réduit/étendu sur bureau
  currentAgent: AgentUser | null = null;

  constructor() {
    this.authService.currentUser$.subscribe(agent => {
      this.currentAgent = agent;
    });
  }

  getInitials(agent: AgentUser | null): string {
    if (!agent) return 'CIF';
    const p = agent.prenom ? agent.prenom[0] : '';
    const n = agent.nom ? agent.nom[0] : '';
    return (p + n).toUpperCase() || 'CIF';
  }

  get isAuthPage(): boolean {
    const url = this.router.url || '';
    const path = (typeof window !== 'undefined' && window.location) ? window.location.pathname : '';
    return url.includes('/login') || path.includes('/login') || (!this.authService.isAuthenticated() && (url === '/' || path === '/'));
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

  toggleDesktopSidebar() {
    this.isDesktopCollapsed = !this.isDesktopCollapsed;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
