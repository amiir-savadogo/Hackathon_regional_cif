import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, forkJoin, catchError, map, tap } from 'rxjs';
import { Client, DemandeCredit, DashboardStats } from '../models/client.model';
import { environment } from '../../environments/environment';
import { SOCIETAIRES_CIF_BASE } from '../data/societaires-data';

const STORAGE_DOSSIERS_KEY = 'cif_credit_dossiers_v3';

/**
 * ApiService - point d'entrée unique vers le backend Spring Boot.
 *
 * Chaque méthode appelle l'API REST (`environment.apiUrl`). Le jeu de données
 * embarqué (`SOCIETAIRES_CIF_BASE`) et le localStorage ne servent plus que de
 * REPLI hors-ligne : si le backend répond, c'est lui qui fait foi ; s'il est
 * injoignable, l'application reste utilisable en mode dégradé (clairement
 * signalé - cf. `source: 'ESTIMATION_LOCALE'` sur les dossiers évalués).
 *
 * Les appels HTTP sont réservés au navigateur : pendant le rendu serveur (SSR),
 * on renvoie directement le jeu local pour ne pas bloquer la page sur un
 * "cold start" du backend hébergé.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private base = environment.apiUrl;

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /** true dès qu'une réponse réelle du backend a été reçue au moins une fois. */
  public backendOnline = false;

  private cachedClients: Client[] = [...SOCIETAIRES_CIF_BASE].map(c => ({ ...c, demandes: [...(c.demandes || [])] }));
  private clientsSubject = new BehaviorSubject<Client[]>(this.cachedClients);
  public clients$: Observable<Client[]> = this.clientsSubject.asObservable();

  // =====================================================================
  // SOCIÉTAIRES
  // =====================================================================

  /**
   * Liste des sociétaires, chaque client étant enrichi de ses demandes de
   * crédit (jointure faite côté client à partir de `/api/demandes`, car le
   * backend n'inclut pas `demandes` dans `/api/clients`).
   */
  getClients(): Observable<Client[]> {
    if (!this.isBrowser) {
      return of(this.offlineClients());
    }

    return forkJoin({
      clients: this.http.get<Client[]>(`${this.base}/clients`),
      demandes: this.http.get<DemandeCredit[]>(`${this.base}/demandes`).pipe(
        catchError(() => of([] as DemandeCredit[]))
      )
    }).pipe(
      map(({ clients, demandes }) => this.mergeDossiers(clients || [], demandes || [])),
      tap(list => {
        this.backendOnline = true;
        this.cachedClients = list;
        this.clientsSubject.next(list);
      }),
      catchError(err => {
        console.warn('[ApiService] Backend injoignable - bascule sur le jeu de données local.', err?.message || err);
        const fallback = this.offlineClients();
        this.cachedClients = fallback;
        this.clientsSubject.next(fallback);
        return of(fallback);
      })
    );
  }

  getClient(id: number): Observable<Client> {
    const local = this.cachedClients.find(c => c.id === id);
    if (!this.isBrowser) {
      return of(local || ({} as Client));
    }
    return this.http.get<Client>(`${this.base}/clients/${id}`).pipe(
      catchError(() => of(local || ({} as Client)))
    );
  }

  getClientByCnib(cnib: string): Observable<Client> {
    const norm = (cnib || '').trim().toLowerCase();
    const local = this.cachedClients.find(c => (c.numeroCnib || '').toLowerCase() === norm);
    if (!this.isBrowser || !cnib) {
      return of(local || ({} as Client));
    }
    return this.http.get<Client>(`${this.base}/clients/by-cnib/${encodeURIComponent(cnib.trim())}`).pipe(
      catchError(() => of(local || ({} as Client)))
    );
  }

  searchClients(query: string): Observable<Client[]> {
    const q = (query || '').toLowerCase().trim();
    const localFilter = (): Client[] => {
      if (!q) return this.cachedClients.slice(0, 20);
      return this.cachedClients.filter(c =>
        [c.numeroCnib, c.nom, c.prenom, c.numeroCompte, c.telephone]
          .some(v => (v || '').toLowerCase().includes(q))
      );
    };
    if (!this.isBrowser) {
      return of(localFilter());
    }
    return this.http.get<Client[]>(`${this.base}/clients/search`, { params: { query: q } }).pipe(
      catchError(() => of(localFilter()))
    );
  }

  /**
   * Création d'un sociétaire. Pas de `catchError` volontairement : le composant
   * appelant (client-new) a besoin des erreurs HTTP du backend (409 doublon,
   * 400 validation) pour afficher un message précis.
   */
  createClient(client: Client): Observable<Client> {
    if (!this.isBrowser) {
      return of(client);
    }
    return this.http.post<Client>(`${this.base}/clients`, client).pipe(
      tap(created => {
        this.cachedClients = [{ ...created, demandes: [] }, ...this.cachedClients];
        this.clientsSubject.next(this.cachedClients);
      })
    );
  }

  // =====================================================================
  // DEMANDES DE CRÉDIT & SCORING IA
  // =====================================================================

  getDemandes(clientId: number): Observable<DemandeCredit[]> {
    const local = (): DemandeCredit[] => this.cachedClients.find(c => c.id === clientId)?.demandes || [];
    if (!this.isBrowser) {
      return of(local());
    }
    return this.http.get<DemandeCredit[]>(`${this.base}/clients/${clientId}/demandes`).pipe(
      catchError(() => of(local()))
    );
  }

  /**
   * Une évaluation passée + son sociétaire, retrouvés par l'id de la demande.
   * S'appuie sur getClients() (qui rattache déjà chaque demande à son client),
   * donc fonctionne aussi en repli hors-ligne.
   */
  getDemandeById(id: number): Observable<{ demande: DemandeCredit; client: Client } | null> {
    return this.getClients().pipe(
      map(list => {
        for (const c of list || []) {
          const d = (c.demandes || []).find(x => x.id === id);
          if (d) return { demande: d, client: c };
        }
        return null;
      })
    );
  }

  // Dossier mémorisé le temps de naviguer de la page détail vers le formulaire
  // ("Refaire cette évaluation"). Consommé une seule fois par le formulaire.
  private dossierARefaire: DemandeCredit | null = null;

  setDossierARefaire(demande: DemandeCredit): void {
    this.dossierARefaire = demande;
  }

  consumeDossierARefaire(): DemandeCredit | null {
    const d = this.dossierARefaire;
    this.dossierARefaire = null;
    return d;
  }

  /**
   * Soumet la demande au backend, qui appelle le moteur de scoring
   * (Random Forest + SHAP). Si le backend est injoignable, on produit une
   * ESTIMATION LOCALE de repli, explicitement marquée `source: 'ESTIMATION_LOCALE'`
   * pour qu'un agent ne la confonde jamais avec une vraie prédiction du modèle.
   */
  evaluerCredit(clientId: number, demande: DemandeCredit): Observable<DemandeCredit> {
    return this.http.post<DemandeCredit>(`${this.base}/clients/${clientId}/demandes`, demande).pipe(
      map(res => ({ ...res, source: res.source || 'IA' })),
      tap(res => this.attachDemande(clientId, res)),
      catchError(err => {
        console.warn('[ApiService] Scoring backend indisponible - estimation locale de repli.', err?.message || err);
        const estimation = this.estimationLocale(clientId, demande);
        this.attachDemande(clientId, estimation);
        return of(estimation);
      })
    );
  }

  // =====================================================================
  // TABLEAU DE BORD
  // =====================================================================

  getStats(): Observable<DashboardStats> {
    if (!this.isBrowser) {
      return of(this.localStats());
    }
    return this.http.get<DashboardStats>(`${this.base}/dashboard/stats`).pipe(
      tap(() => (this.backendOnline = true)),
      catchError(() => of(this.localStats()))
    );
  }

  // =====================================================================
  // INTERNE
  // =====================================================================

  private mergeDossiers(clients: Client[], demandes: DemandeCredit[]): Client[] {
    const byId = new Map<number, Client>();
    clients.forEach(c => {
      c.demandes = [];
      if (c.id != null) byId.set(c.id, c);
    });
    [...demandes]
      .sort((a, b) => new Date(b.dateCreation || 0).getTime() - new Date(a.dateCreation || 0).getTime())
      .forEach(d => {
        const cid = d.client?.id;
        if (cid != null && byId.has(cid)) {
          byId.get(cid)!.demandes!.push(d);
        }
      });
    return clients;
  }

  private offlineClients(): Client[] {
    const source = this.cachedClients.length ? this.cachedClients : SOCIETAIRES_CIF_BASE;
    const base = source.map(c => ({ ...c, demandes: [...(c.demandes || [])] }));
    this.loadStoredDossiers().forEach(saved => {
      const c = base.find(x => x.id === saved.clientId || (!!x.numeroCnib && x.numeroCnib === saved.numeroCnib));
      if (c) {
        c.demandes = c.demandes || [];
        if (!c.demandes.some(d => d.id === saved.demande.id)) {
          c.demandes.unshift(saved.demande);
        }
      }
    });
    return base;
  }

  private attachDemande(clientId: number, demande: DemandeCredit): void {
    const c = this.cachedClients.find(x => x.id === clientId);
    if (c) {
      c.demandes = c.demandes || [];
      c.demandes.unshift(demande);
      this.clientsSubject.next(this.cachedClients);
      if (demande.source === 'ESTIMATION_LOCALE') {
        this.saveStoredDossier(clientId, c.numeroCnib || '', demande);
      }
    }
  }

  private estimationLocale(clientId: number, demande: DemandeCredit): DemandeCredit {
    const c = this.cachedClients.find(x => x.id === clientId);
    const revenu = demande.revenuMensuelFcfa || c?.revenuMensuelFcfa || 250000;
    const montant = demande.montantDemandeFcfa || 500000;
    const duree = demande.dureeMois || 12;
    const epargne = demande.epargneSoldeMoyenFcfa || c?.soldeEpargneActuelFcfa || 150000;
    const anciennete = demande.ancienneteCooperativeMois || c?.ancienneteCooperativeMois || 12;

    const ratioEndettement = (montant / duree) / Math.max(revenu, 1);
    const ratioEpargne = epargne / Math.max(montant, 1);

    let probaDefaut = 0.08;
    if (ratioEndettement > 0.4) probaDefaut += 0.12;
    if (ratioEpargne < 0.2) probaDefaut += 0.08;
    if (anciennete < 12) probaDefaut += 0.05;
    if (anciennete > 36) probaDefaut -= 0.04;
    probaDefaut = Math.max(0.02, Math.min(0.65, probaDefaut));

    // Garde-fou de capacité de remboursement, même logique que le moteur.
    const resteAVivre = revenu - (demande.chargesMensuellesFcfa || 0) - (montant / duree);

    // Score de solvabilité 0-100 = (1 - PD) x 100, comme ai-service/main.py.
    const scoreCredit = Math.round((1 - probaDefaut) * 100);
    let statut = 'APPROUVE';
    let zoneDecision = 'ACCORD_FAVORABLE';
    if (scoreCredit <= 56 || resteAVivre < 0) {
      statut = 'REJETE';
      zoneDecision = 'RISQUE_ELEVE';
    } else if (scoreCredit <= 81) {
      statut = 'A_L_ETUDE';
      zoneDecision = 'A_EXAMINER';
    }

    return {
      ...demande,
      id: Date.now(),
      scoreCredit,
      scoreRisque: Math.round(probaDefaut * 1000) / 10,
      probaDefaut: Math.round(probaDefaut * 10000) / 10000,
      ratioEndettement: Math.round(ratioEndettement * 100) / 100,
      zoneDecision,
      statut,
      source: 'ESTIMATION_LOCALE',
      explicationJson: JSON.stringify([
        { variable: 'Estimation locale (moteur IA injoignable)', contribution: 0, sens: 'NEUTRE' }
      ]),
      dateCreation: new Date().toISOString()
    };
  }

  private localStats(): DashboardStats {
    let totalDemandes = 0;
    let approuvees = 0;
    let rejetees = 0;
    let enEtude = 0;
    this.cachedClients.forEach(c => (c.demandes || []).forEach(d => {
      totalDemandes++;
      if (d.statut === 'APPROUVE') approuvees++;
      else if (d.statut === 'REJETE') rejetees++;
      else enEtude++;
    }));
    return {
      totalClients: this.cachedClients.length,
      totalDemandes,
      approuvees,
      rejetees,
      enEtude
    };
  }

  private loadStoredDossiers(): Array<{ clientId: number; numeroCnib: string; demande: DemandeCredit }> {
    if (!this.isBrowser) return [];
    try {
      const raw = localStorage.getItem(STORAGE_DOSSIERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveStoredDossier(clientId: number, numeroCnib: string, demande: DemandeCredit): void {
    if (!this.isBrowser) return;
    try {
      const current = this.loadStoredDossiers();
      current.unshift({ clientId, numeroCnib, demande });
      localStorage.setItem(STORAGE_DOSSIERS_KEY, JSON.stringify(current));
    } catch {
      /* quota / mode privé : on ignore, le repli reste en mémoire */
    }
  }
}
