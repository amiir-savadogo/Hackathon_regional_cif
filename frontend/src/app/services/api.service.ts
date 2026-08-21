import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client, DemandeCredit, DashboardStats } from '../models/client.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = 'http://localhost:8080/api';

  // --- Clients ---
  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.base}/clients`);
  }

  getClient(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.base}/clients/${id}`);
  }

  createClient(client: Client): Observable<Client> {
    return this.http.post<Client>(`${this.base}/clients`, client);
  }

  // --- Demandes de Crédit ---
  getDemandes(clientId: number): Observable<DemandeCredit[]> {
    return this.http.get<DemandeCredit[]>(`${this.base}/clients/${clientId}/demandes`);
  }

  evaluerCredit(clientId: number, demande: DemandeCredit): Observable<DemandeCredit> {
    return this.http.post<DemandeCredit>(`${this.base}/clients/${clientId}/demandes`, demande);
  }

  // --- Dashboard ---
  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.base}/dashboard/stats`);
  }
}
