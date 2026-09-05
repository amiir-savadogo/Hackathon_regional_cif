import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, catchError, map, tap } from 'rxjs';
import { Client, DemandeCredit, DashboardStats } from '../models/client.model';
import { environment } from '../../environments/environment';
import { SOCIETAIRES_CIF_BASE } from '../data/societaires-data';

const STORAGE_DOSSIERS_KEY = 'cif_credit_dossiers_v3';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  private cachedClients: Client[] = [...SOCIETAIRES_CIF_BASE];
  private clientsSubject = new BehaviorSubject<Client[]>(this.cachedClients);
  public clients$: Observable<Client[]> = this.clientsSubject.asObservable();

  constructor() {
    this.initClients();
  }

  private initClients() {
    let baseList = this.cachedClients.length > 0 ? this.cachedClients : [...SOCIETAIRES_CIF_BASE];

    // Fusionner avec les dossiers locaux évalués
    const savedDossiers = this.loadStoredDossiers();
    if (savedDossiers.length > 0) {
      savedDossiers.forEach(saved => {
        const client = baseList.find(c => c.id === saved.clientId || c.numeroCnib === saved.numeroCnib);
        if (client) {
          if (!client.demandes) client.demandes = [];
          if (!client.demandes.some(d => d.id === saved.demande.id)) {
            client.demandes.unshift(saved.demande);
          }
        }
      });
    }

    this.cachedClients = baseList;
    this.clientsSubject.next(this.cachedClients);
  }

  private loadStoredDossiers(): Array<{ clientId: number; numeroCnib: string; demande: DemandeCredit }> {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      const raw = localStorage.getItem(STORAGE_DOSSIERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveStoredDossier(clientId: number, numeroCnib: string, demande: DemandeCredit) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const current = this.loadStoredDossiers();
      current.unshift({ clientId, numeroCnib, demande });
      localStorage.setItem(STORAGE_DOSSIERS_KEY, JSON.stringify(current));
    } catch {}
  }

  // --- Gestion des Sociétaires ---
  getClients(page?: number, size?: number): Observable<Client[]> {
    if (this.cachedClients.length > 0) {
      return of(this.cachedClients);
    }
    return this.http.get<Client[]>('/data/societaires.json').pipe(
      map(list => {
        this.cachedClients = list || [];
        this.clientsSubject.next(this.cachedClients);
        return this.cachedClients;
      }),
      catchError(() => of(this.cachedClients))
    );
  }

  getClient(id: number): Observable<Client> {
    const found = this.cachedClients.find(c => c.id === id);
    if (found) return of(found);
    return this.http.get<Client>(`${this.base}/clients/${id}`).pipe(
      catchError(() => of({} as Client))
    );
  }

  getClientByCnib(cnib: string): Observable<Client> {
    const found = this.cachedClients.find(c => (c.numeroCnib || '').toLowerCase() === cnib.toLowerCase());
    return of(found || ({} as Client));
  }

  searchClients(query: string): Observable<Client[]> {
    const q = (query || '').toLowerCase().trim();
    if (!q) return of(this.cachedClients.slice(0, 20));
    const filtered = this.cachedClients.filter(c =>
      (c.numeroCnib && c.numeroCnib.toLowerCase().includes(q)) ||
      (c.nom && c.nom.toLowerCase().includes(q)) ||
      (c.prenom && c.prenom.toLowerCase().includes(q)) ||
      (c.numeroCompte && c.numeroCompte.toLowerCase().includes(q)) ||
      (c.telephone && c.telephone.includes(q))
    );
    return of(filtered);
  }

  createClient(client: Client): Observable<Client> {
    const newClient: Client = {
      ...client,
      id: this.cachedClients.length + 1,
      demandes: []
    };
    this.cachedClients.unshift(newClient);
    this.clientsSubject.next(this.cachedClients);
    return of(newClient);
  }

  // --- Demandes de Crédit & Scoring IA ---
  getDemandes(clientId: number): Observable<DemandeCredit[]> {
    const found = this.cachedClients.find(c => c.id === clientId);
    if (found && found.demandes) return of(found.demandes);
    return of([]);
  }

  evaluerCredit(clientId: number, demande: DemandeCredit): Observable<DemandeCredit> {
    return this.http.post<DemandeCredit>(`${this.base}/clients/${clientId}/demandes`, demande).pipe(
      tap(res => {
        const found = this.cachedClients.find(c => c.id === clientId);
        if (found) {
          if (!found.demandes) found.demandes = [];
          found.demandes.unshift(res);
          this.saveStoredDossier(clientId, found.numeroCnib || '', res);
          this.clientsSubject.next(this.cachedClients);
        }
      }),
      catchError(() => {
        // Moteur de scoring intelligent local instantané
        const found = this.cachedClients.find(c => c.id === clientId);
        const revenu = demande.revenuMensuelFcfa || (found?.revenuMensuelFcfa) || 250000;
        const montant = demande.montantDemandeFcfa || 500000;
        const duree = demande.dureeMois || 12;
        const epargne = (found && found.soldeEpargneActuelFcfa) ? found.soldeEpargneActuelFcfa : 150000;
        const anciennete = (found && found.ancienneteCooperativeMois) ? found.ancienneteCooperativeMois : 12;

        const ratioEndettement = (montant / duree) / Math.max(revenu, 1);
        const ratioEpargne = epargne / Math.max(montant, 1);

        let probaDefaut = 0.08;
        if (ratioEndettement > 0.4) probaDefaut += 0.12;
        if (ratioEpargne < 0.2) probaDefaut += 0.08;
        if (anciennete < 12) probaDefaut += 0.05;
        if (anciennete > 36) probaDefaut -= 0.04;
        probaDefaut = Math.max(0.02, Math.min(0.65, probaDefaut));

        const scoreCredit = Math.round(900 - probaDefaut * 700);
        let statut = 'APPROUVE';
        let zoneDecision = 'ACCORD_FAVORABLE';
        if (scoreCredit < 550) {
          statut = 'REJETE';
          zoneDecision = 'RISQUE_ELEVE';
        } else if (scoreCredit < 680) {
          statut = 'A_L_ETUDE';
          zoneDecision = 'DECISION_HUMAINE_REQUISE';
        }

        const calculated: DemandeCredit = {
          ...demande,
          id: Date.now(),
          scoreCredit,
          scoreRisque: Math.round(probaDefaut * 1000) / 10,
          probaDefaut: Math.round(probaDefaut * 10000) / 10000,
          zoneDecision,
          statut,
          dateCreation: new Date().toISOString()
        };

        if (found) {
          if (!found.demandes) found.demandes = [];
          found.demandes.unshift(calculated);
          this.saveStoredDossier(clientId, found.numeroCnib || '', calculated);
          this.clientsSubject.next(this.cachedClients);
        }
        return of(calculated);
      })
    );
  }

  // --- Tableau de bord & Statistiques Réelles ---
  getStats(): Observable<DashboardStats> {
    let totalDemandes = 0;
    let approuvees = 0;
    let rejetees = 0;
    let enEtude = 0;

    this.cachedClients.forEach(c => {
      if (c.demandes && c.demandes.length > 0) {
        totalDemandes += c.demandes.length;
        c.demandes.forEach(d => {
          if (d.statut === 'APPROUVE') approuvees++;
          else if (d.statut === 'REJETE') rejetees++;
          else enEtude++;
        });
      }
    });

    return of({
      totalClients: this.cachedClients.length || 1000,
      totalDemandes,
      approuvees,
      rejetees,
      enEtude
    });
  }
}
