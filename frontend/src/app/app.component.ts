import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { AgentUser } from './models/user.model';

interface Crumb { label: string; link?: string[]; }
interface NavItem { label: string; link: string; icon: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <ng-container *ngIf="!isAuthPage; else authPage">

    <!-- Accès clavier direct au contenu (WCAG 2.4.1) -->
    <a href="#contenu-principal" class="skip-link">Aller au contenu principal</a>

    <div class="flex h-[100dvh] overflow-hidden bg-canvas">

      <!-- ================= BARRE MOBILE ================= -->
      <header
        class="md:hidden fixed top-0 inset-x-0 z-30 h-14 px-4 flex items-center justify-between
               glass-dark text-white border-b border-white/10">
        <a routerLink="/dashboard" class="flex items-center gap-2.5 min-w-0">
          <span class="grid place-items-center w-8 h-8 rounded-xl bg-brand-600 shadow-brand flex-shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 6l3 1m0 0l-3 9a5 5 0 006 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5 5 0 006 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>
          </span>
          <span class="font-display font-extrabold tracking-tight text-[15px] flex-shrink-0">SAMDE</span>
          <span *ngIf="currentPageLabel" class="text-white/25 flex-shrink-0" aria-hidden="true">/</span>
          <span *ngIf="currentPageLabel" class="text-white/70 text-sm truncate">{{ currentPageLabel }}</span>
        </a>
        <button type="button" (click)="toggleSidebar()"
          class="on-dark -mr-2 p-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          [attr.aria-expanded]="isSidebarOpen" aria-controls="navigation-principale" aria-label="Ouvrir le menu">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
      </header>

      <!-- Voile derrière le tiroir mobile -->
      <div *ngIf="isSidebarOpen" (click)="closeSidebar()"
        class="md:hidden scrim z-40 animate-fade-in" aria-hidden="true"></div>

      <!-- ================= BARRE LATÉRALE ================= -->
      <aside id="navigation-principale"
        [ngClass]="[
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          isDesktopCollapsed ? 'md:w-[5.25rem]' : 'md:w-[17rem]'
        ]"
        class="on-dark fixed md:relative inset-y-0 left-0 z-50 w-[17rem] flex flex-col flex-shrink-0
               overflow-hidden bg-ink-950 bg-dark-gradient text-white
               transition-[width,transform] duration-300 ease-smooth md:translate-x-0
               shadow-2xl md:shadow-none">

        <!-- Halo décoratif (contenu par overflow-hidden + position relative) -->
        <span class="glow w-64 h-64 -top-24 -left-20 opacity-70" aria-hidden="true"></span>

        <!-- Marque -->
        <div class="relative flex items-center gap-3 h-16 px-4 border-b border-white/10 flex-shrink-0"
          [class.justify-center]="isDesktopCollapsed">
          <span class="grid place-items-center w-10 h-10 rounded-2xl bg-brand-600 shadow-brand flex-shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 6l3 1m0 0l-3 9a5 5 0 006 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5 5 0 006 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>
          </span>
          <span *ngIf="!isDesktopCollapsed" class="min-w-0 leading-tight">
            <span class="block font-display font-extrabold tracking-tight text-[17px]">SAMDE</span>
            <span class="block text-2xs text-brand-200/80 tracking-wide">Portail agent</span>
          </span>
          <button type="button" (click)="closeSidebar()"
            class="md:hidden ml-auto p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fermer le menu">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Navigation -->
        <nav class="relative flex-1 overflow-y-auto no-scrollbar px-3 py-4" aria-label="Navigation principale">
          <p *ngIf="!isDesktopCollapsed" class="px-3 pb-2 text-2xs font-bold uppercase tracking-[0.14em] text-white/55">
            Pilotage
          </p>
          <ul class="space-y-1">
            <li *ngFor="let item of navItems">
              <a [routerLink]="item.link" routerLinkActive #rla="routerLinkActive"
                (click)="closeSidebar()"
                [attr.aria-current]="rla.isActive ? 'page' : null"
                [title]="isDesktopCollapsed ? item.label : ''"
                [ngClass]="rla.isActive
                  ? 'bg-white/10 text-white shadow-inner-top'
                  : 'text-brand-100/70 hover:text-white hover:bg-white/[0.07]'"
                class="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold
                       transition-all duration-200 ease-smooth"
                [class.justify-center]="isDesktopCollapsed">
                <!-- Repère de la page active -->
                <span *ngIf="rla.isActive"
                  class="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-brand-300" aria-hidden="true"></span>
                <svg class="w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                  fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="item.icon"/>
                </svg>
                <span *ngIf="!isDesktopCollapsed" class="truncate">{{ item.label }}</span>
              </a>
            </li>
          </ul>
        </nav>

        <!-- Pied de barre latérale -->
        <div class="relative flex-shrink-0 border-t border-white/10 p-3">
          <div *ngIf="!isDesktopCollapsed" class="rounded-xl bg-white/[0.06] px-3 py-2.5">
            <p class="text-2xs font-semibold text-white/75">Équipe DataMaster</p>
            <p class="text-2xs text-white/55 mt-0.5">Prototype v1.0 &middot; &copy; 2026</p>
          </div>
          <p *ngIf="isDesktopCollapsed" class="text-center text-2xs text-white/55">v1.0</p>
        </div>
      </aside>

      <!-- ================= COLONNE DE CONTENU ================= -->
      <div class="flex-1 min-w-0 flex flex-col overflow-hidden pt-14 md:pt-0">

        <!-- Barre supérieure (bureau) -->
        <header class="hidden md:flex h-16 flex-shrink-0 items-center justify-between gap-4 px-6
                       glass border-b border-ink-200/70 z-20">
          <div class="flex items-center gap-3 min-w-0">
            <button type="button" (click)="toggleDesktopSidebar()"
              class="btn-icon text-ink-500 hover:text-brand-700 hover:bg-brand-50 transition-colors flex-shrink-0"
              [attr.aria-expanded]="!isDesktopCollapsed" aria-controls="navigation-principale"
              [title]="isDesktopCollapsed ? 'Agrandir la barre latérale' : 'Réduire la barre latérale'"
              [attr.aria-label]="isDesktopCollapsed ? 'Agrandir la barre latérale' : 'Réduire la barre latérale'">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24"><path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h9"/></svg>
            </button>

            <span class="h-6 w-px bg-ink-200 flex-shrink-0" aria-hidden="true"></span>

            <!-- Fil d'Ariane -->
            <nav class="flex items-center gap-1.5 min-w-0 overflow-hidden" aria-label="Fil d'Ariane">
              <ol class="flex items-center gap-1.5 min-w-0">
                <li *ngFor="let crumb of breadcrumb; let last = last; let first = first"
                  class="flex items-center gap-1.5 min-w-0">
                  <svg *ngIf="!first" class="w-3.5 h-3.5 text-ink-300 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                  <a *ngIf="crumb.link && !last" [routerLink]="crumb.link"
                    class="flex items-center gap-1.5 flex-shrink-0 rounded-md px-1 py-0.5 text-sm font-medium
                           text-ink-500 hover:text-brand-700 transition-colors">
                    <svg *ngIf="first" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/></svg>
                    <span>{{ crumb.label }}</span>
                  </a>
                  <span *ngIf="!crumb.link && !last" class="text-sm text-ink-400 flex-shrink-0">{{ crumb.label }}</span>
                  <span *ngIf="last" class="text-sm font-semibold text-ink-900 truncate" aria-current="page">{{ crumb.label }}</span>
                </li>
              </ol>
            </nav>
          </div>

          <!-- Profil et déconnexion -->
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <a routerLink="/agents"
              class="group flex items-center gap-2.5 rounded-xl p-1.5 pr-3 hover:bg-ink-100 transition-colors"
              title="Gérer les agents et les affectations">
              <span class="grid place-items-center w-9 h-9 rounded-xl bg-brand-gradient text-white
                           text-xs font-bold shadow-brand flex-shrink-0" aria-hidden="true">
                {{ getInitials(currentAgent) }}
              </span>
              <span class="hidden lg:block text-left leading-tight min-w-0">
                <span class="block text-xs font-bold text-ink-900 group-hover:text-brand-700 transition-colors truncate max-w-[11rem]">
                  {{ currentAgent ? (currentAgent.prenom + ' ' + currentAgent.nom) : 'Portail agent' }}
                </span>
                <span class="block text-2xs text-ink-400 truncate max-w-[11rem]">
                  {{ currentAgent ? currentAgent.roleLabel : 'Gérer les agents' }}
                </span>
              </span>
            </a>

            <button type="button" (click)="logout()"
              class="btn-icon text-ink-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
              title="Se déconnecter" aria-label="Se déconnecter">
              <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17l5-5-5-5m5 5H9m3-9H6a2 2 0 00-2 2v14a2 2 0 002 2h6"/></svg>
            </button>
          </div>
        </header>

        <!-- Contenu -->
        <main id="contenu-principal" tabindex="-1"
          class="flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-mesh">
          <div class="container-app px-4 py-5 sm:px-6 sm:py-7 lg:px-8 3xl:px-12 3xl:py-10">
            <router-outlet></router-outlet>
          </div>
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

  /** Entrées de la navigation principale (libellé, route, tracé de l'icône). */
  navItems: NavItem[] = [
    { label: 'Tableau de bord', link: '/dashboard',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { label: 'Crédits', link: '/credits',
      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { label: 'Agents & Équipe', link: '/agents',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { label: 'Paramètres', link: '/parametres',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ];

  /** Fil d'Ariane courant, recalculé à chaque navigation. */
  breadcrumb: Crumb[] = [];
  /** Dernier segment du fil d'Ariane, pour l'en-tête mobile. */
  currentPageLabel = '';

  constructor() {
    this.authService.currentUser$.subscribe(agent => {
      this.currentAgent = agent;
    });
    this.majFilAriane(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => this.majFilAriane(e.urlAfterRedirects));
  }

  /** Libellés des sous-sections de Paramètres (paramètre d'URL `tab`). */
  private static readonly LIBELLES_PARAM: Record<string, string> = {
    CATEGORIES: 'Catégories de prêt',
    OBJETS_CREDIT: 'Objets de crédit',
    GARANTIES: 'Types de garanties',
    NATURES_JURIDIQUES: 'Natures juridiques',
    AGENCES: 'Agences',
    ROLES: 'Rôles des agents',
    CORBEILLE: 'Corbeille',
  };

  private majFilAriane(rawUrl: string): void {
    const [chemin, requete] = (rawUrl || '').split('#')[0].split('?');
    const url = chemin;
    const seg = url.split('/').filter(Boolean);
    const home: Crumb = { label: 'Accueil', link: ['/dashboard'] };
    const credits: Crumb = { label: 'Crédits', link: ['/credits'] };
    let fil: Crumb[] = [home];

    if (seg[0] === 'dashboard') fil = [home, { label: 'Tableau de bord' }];
    else if (seg[0] === 'agents') fil = [home, { label: 'Agents & Équipe' }];
    else if (seg[0] === 'parametres') {
      // La sous-section ouverte est portée par ?tab=... : on l'affiche dans le
      // fil d'Ariane, « Paramètres » ramenant à l'accueil des paramètres.
      const tab = new URLSearchParams(requete || '').get('tab') || '';
      const libelle = AppComponent.LIBELLES_PARAM[tab];
      fil = libelle
        ? [home, { label: 'Paramètres', link: ['/parametres'] }, { label: libelle }]
        : [home, { label: 'Paramètres' }];
    }
    else if (seg[0] === 'credits' || seg[0] === 'clients') {
      if (seg[0] === 'credits' && seg.length === 1) fil = [home, { label: 'Crédits' }];
      else if (seg[1] === 'nouveau') fil = [home, credits, { label: 'Nouvelle évaluation' }];
      else if (seg[0] === 'clients' && seg[2] === 'credit') fil = [home, credits, { label: 'Nouvelle évaluation' }];
      else if (seg[0] === 'credits' && seg[2] === 'explication') {
        fil = [home, credits, { label: 'Évaluation n°' + seg[1], link: ['/credits', seg[1]] }, { label: 'Pourquoi ce résultat ?' }];
      } else if (seg[0] === 'credits' && seg[1]) fil = [home, credits, { label: 'Évaluation n°' + seg[1] }];
      else fil = [home, { label: 'Crédits' }];
    }

    this.breadcrumb = fil;
    this.currentPageLabel = fil.length > 1 ? fil[fil.length - 1].label : '';
  }

  getInitials(agent: AgentUser | null): string {
    if (!agent) return 'SA';
    const p = agent.prenom ? agent.prenom[0] : '';
    const n = agent.nom ? agent.nom[0] : '';
    return (p + n).toUpperCase() || 'SA';
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
