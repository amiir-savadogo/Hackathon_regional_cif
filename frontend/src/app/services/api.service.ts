import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Client, DemandeCredit, DashboardStats } from '../models/client.model';
import { environment } from '../../environments/environment';
import { SOCIETAIRES_CIF_BASE } from '../data/societaires-data';

// Référence en mémoire des sociétaires CIF
let MEMORY_SOCIETAIRES: Client[] = SOCIETAIRES_CIF_BASE && SOCIETAIRES_CIF_BASE.length > 0 ? SOCIETAIRES_CIF_BASE : [];

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // --- Clients ---
  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.base}/clients`).pipe(
      map(clients => (clients && clients.length > 0) ? clients : MEMORY_SOCIETAIRES),
      catchError(() => of(MEMORY_SOCIETAIRES))
    );
  }

  getClient(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.base}/clients/${id}`).pipe(
      catchError(() => {
        const found = MEMORY_SOCIETAIRES.find(c => c.id === id) || MEMORY_SOCIETAIRES[0];
        return of(found);
      })
    );
  }

  createClient(client: Client): Observable<Client> {
    return this.http.post<Client>(`${this.base}/clients`, client);
  }

  // --- Demandes de Crédit ---
  getDemandes(clientId: number): Observable<DemandeCredit[]> {
    return this.http.get<DemandeCredit[]>(`${this.base}/clients/${clientId}/demandes`);
  }

  evaluerCredit(clientId: number, demande: DemandeCredit): Observable<DemandeCredit> {
    return this.http.post<DemandeCredit>(`${this.base}/clients/${clientId}/demandes`, demande).pipe(
      map(result => {
        const client = MEMORY_SOCIETAIRES.find(c => c.id === clientId);
        if (client) {
          if (!client.demandes) client.demandes = [];
          client.demandes.unshift(result);
        }
        return result;
      }),
      catchError(() => {
        // Fallback simulateur de scoring IA immédiat
        const rev = demande.revenuMensuelFcfa || 200000;
        const charges = demande.chargesMensuellesFcfa || 70000;
        const epargne = demande.epargneSoldeMoyenFcfa || 200000;
        const montant = demande.montantDemandeFcfa || 500000;
        const reste = rev - charges;
        const echeance = montant / (demande.dureeMois || 12);
        
        let score = 620;
        if (epargne >= montant * 0.4) score += 60;
        if (echeance / Math.max(1, reste) < 0.40) score += 50;
        else if (echeance / Math.max(1, reste) > 0.70) score -= 90;
        if ((demande.ancienneteCooperativeMois || 0) >= 24) score += 40;
        
        score = Math.min(880, Math.max(340, score));
        const statut = score >= 680 ? 'APPROUVE' : (score >= 550 ? 'A_L_ETUDE' : 'REJETE');
        const risque = score >= 680 ? 4.5 : (score >= 550 ? 16.2 : 54.0);

        const simulated: DemandeCredit = {
          ...demande,
          id: Date.now(),
          scoreCredit: score,
          scoreRisque: risque,
          statut: statut,
          dateCreation: new Date().toISOString()
        };

        const client = MEMORY_SOCIETAIRES.find(c => c.id === clientId);
        if (client) {
          if (!client.demandes) client.demandes = [];
          client.demandes.unshift(simulated);
        }

        return of(simulated);
      })
    );
  }

  // --- Dashboard ---
  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.base}/dashboard/stats`).pipe(
      catchError(() => {
        let totalDemandes = 0;
        let approuvees = 0;
        let rejetees = 0;
        let enEtude = 0;

        MEMORY_SOCIETAIRES.forEach(c => {
          if (c.demandes && c.demandes.length > 0) {
            c.demandes.forEach(d => {
              totalDemandes++;
              if (d.statut === 'APPROUVE') approuvees++;
              else if (d.statut === 'REJETE') rejetees++;
              else enEtude++;
            });
          }
        });

        return of({
          totalClients: MEMORY_SOCIETAIRES.length,
          totalDemandes,
          approuvees,
          rejetees,
          enEtude
        });
      })
    );
  }
}
