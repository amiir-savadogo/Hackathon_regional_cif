import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen bg-gray-100 font-sans overflow-hidden relative">

      <!-- HEADER MOBILE -->
      <div class="md:hidden absolute top-0 left-0 right-0 h-14 bg-slate-800 text-white flex items-center justify-between px-4 z-20 shadow-md">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>
          </div>
          <span class="font-bold text-sm">CréditSûr WA</span>
        </div>
        <button (click)="toggleSidebar()" class="p-2 text-slate-300 hover:text-white focus:outline-none">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>

      <!-- BACKDROP MOBILE -->
      <div *ngIf="isSidebarOpen" (click)="closeSidebar()" class="md:hidden fixed inset-0 bg-slate-900/50 z-30 transition-opacity"></div>

      <!-- SIDEBAR -->
      <aside 
        [class.translate-x-0]="isSidebarOpen" 
        [class.-translate-x-full]="!isSidebarOpen"
        class="fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-800 text-white flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out md:translate-x-0">
        
        <!-- Logo / Titre (Bureau) -->
        <div class="hidden md:flex px-6 py-5 border-b border-slate-700 items-center space-x-3">
          <div class="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-bold leading-tight">CréditSûr WA</p>
            <p class="text-xs text-slate-400">Portail Agent</p>
          </div>
        </div>

        <!-- Bouton fermer sur mobile -->
        <div class="md:hidden flex justify-between items-center p-4 border-b border-slate-700">
          <span class="font-bold text-sm text-slate-300 uppercase tracking-wider">Menu Principal</span>
          <button (click)="closeSidebar()" class="p-2 text-slate-400 hover:text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <a routerLink="/dashboard" routerLinkActive="bg-slate-700 text-white" (click)="closeSidebar()"
            class="flex items-center space-x-3 px-3 py-3 md:py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm font-medium">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            <span>Tableau de bord</span>
          </a>

          <a routerLink="/clients" routerLinkActive="bg-slate-700 text-white" (click)="closeSidebar()"
            class="flex items-center space-x-3 px-3 py-3 md:py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm font-medium">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span>Clients</span>
          </a>

          <div class="pt-6 pb-2">
            <p class="px-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Système</p>
          </div>

          <div class="flex items-center space-x-2 px-3 py-2 text-xs text-slate-400">
            <span class="w-2 h-2 rounded-full bg-green-400"></span>
            <span>Moteur IA actif</span>
          </div>
          <div class="flex items-center space-x-2 px-3 py-2 text-xs text-slate-400">
            <span class="w-2 h-2 rounded-full bg-green-400"></span>
            <span>PostgreSQL connecté</span>
          </div>
        </nav>

        <div class="px-4 py-4 border-t border-slate-700 mt-auto">
          <p class="text-xs text-slate-400 text-center font-semibold mb-1">Équipe DataMaster</p>
          <p class="text-xs text-slate-500 text-center">CIF &copy; 2026 - Prototype v1.0</p>
        </div>
      </aside>

      <!-- CONTENU PRINCIPAL -->
      <div class="flex-1 flex flex-col overflow-hidden w-full pt-14 md:pt-0">
        <main class="flex-1 overflow-y-auto p-4 md:p-6 w-full">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: []
})
export class AppComponent {
  isSidebarOpen = false;

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }
}
