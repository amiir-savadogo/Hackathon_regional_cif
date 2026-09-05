import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';

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

          <!-- Bouton réduction flèche dans la sidebar -->
          <button (click)="toggleDesktopSidebar()" 
            class="p-1.5 rounded-lg text-[#9cb4b4] hover:text-white hover:bg-[#1b5558] transition-colors focus:outline-none"
            [title]="isDesktopCollapsed ? 'Agrandir le menu (Ctrl+B)' : 'Réduire le menu (Ctrl+B)'">
            <svg class="w-4 h-4 transition-transform duration-300" [class.rotate-180]="isDesktopCollapsed" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
            </svg>
          </button>
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

          <a routerLink="/clients" routerLinkActive="bg-[#1b5558] text-white" (click)="closeSidebar()"
            [title]="isDesktopCollapsed ? 'Clients' : ''"
            [class.justify-center]="isDesktopCollapsed"
            class="flex items-center space-x-3 px-3 py-3 md:py-2.5 rounded-xl text-[#b9cbca] hover:bg-[#1b5558] hover:text-white transition-all text-sm font-medium">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span *ngIf="!isDesktopCollapsed" class="whitespace-nowrap">Clients</span>
          </a>

          <div *ngIf="!isDesktopCollapsed" class="pt-6 pb-2">
            <p class="px-3 text-[10px] uppercase tracking-widest text-[#7fa3a2] font-semibold">Système</p>
          </div>

          <div class="flex items-center space-x-2 px-3 py-2 text-xs text-[#9cb4b4]"
            [class.justify-center]="isDesktopCollapsed"
            [title]="isDesktopCollapsed ? 'Moteur IA actif' : ''">
            <span class="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse"></span>
            <span *ngIf="!isDesktopCollapsed" class="whitespace-nowrap">Moteur IA actif</span>
          </div>
          <div class="flex items-center space-x-2 px-3 py-2 text-xs text-[#9cb4b4]"
            [class.justify-center]="isDesktopCollapsed"
            [title]="isDesktopCollapsed ? 'PostgreSQL connecté' : ''">
            <span class="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></span>
            <span *ngIf="!isDesktopCollapsed" class="whitespace-nowrap">PostgreSQL connecté</span>
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

            <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-[#e5f3f1] text-[#147c76] border border-[#b9ded9] flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-[#147c76] animate-pulse"></span>
              Plateforme CIF · DigiCoop-WA+
            </span>
            <span class="text-gray-300">|</span>
            <span class="text-xs text-gray-500 font-medium">Devise : <strong class="text-gray-700">FCFA (XOF)</strong></span>
          </div>

          <!-- Actions & Profil Agent -->
          <div class="flex items-center space-x-4">
            <a routerLink="/clients/nouveau" 
              class="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#147c76] hover:bg-[#0e625e] text-white rounded-lg text-xs font-semibold shadow-sm transition-all">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              <span>+ Nouveau client</span>
            </a>

            <div class="h-6 w-px bg-gray-200"></div>

            <div class="flex items-center space-x-2.5">
              <div class="w-8 h-8 rounded-full bg-[#e6ad50] flex items-center justify-center text-[#123b41] text-xs font-bold shadow-sm">
                AG
              </div>
              <div class="text-left">
                <p class="text-xs font-bold text-gray-800 leading-tight">Agent Crédit</p>
                <p class="text-[11px] text-gray-400">Coopérative CIF</p>
              </div>
              <button (click)="logout()" class="ml-2 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Se déconnecter" aria-label="Se déconnecter">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10 17l5-5-5-5m5 5H3m10-9h5a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-5"/></svg>
              </button>
            </div>
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
  private readonly auth = inject(AuthService);
  isSidebarOpen = false;       // État du tiroir sur mobile
  isDesktopCollapsed = false;  // État réduit/étendu sur bureau

  get isAuthPage(): boolean {
    return this.router.url.startsWith('/login');
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
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
