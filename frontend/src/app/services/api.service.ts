import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client, DemandeCredit, DashboardStats } from '../models/client.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // --- Clients & Sociétaires (Spring Boot API + PostgreSQL) ---
  getClients(page?: number, size?: number): Observable<Client[]> {
    const params = (page !== undefined && size !== undefined) ? `?page=${page}&size=${size}` : '';
    return this.http.get<Client[]>(`${this.base}/clients${params}`);
  }

  getClient(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.base}/clients/${id}`);
  }

  createClient(client: Client): Observable<Client> {
    return this.http.post<Client>(`${this.base}/clients`, client);
  }

  // --- Demandes de Crédit & Scoring IA ---
  getDemandes(clientId: number): Observable<DemandeCredit[]> {
    return this.http.get<DemandeCredit[]>(`${this.base}/clients/${clientId}/demandes`);
  }

  evaluerCredit(clientId: number, demande: DemandeCredit): Observable<DemandeCredit> {
    return this.http.post<DemandeCredit>(`${this.base}/clients/${clientId}/demandes`, demande);
  }

  // --- Tableau de bord & Statistiques Réelles ---
  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.base}/dashboard/stats`);
  }
}
