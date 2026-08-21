import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClientRequest, ClientResponse } from '../models/client.model';

@Injectable({
  providedIn: 'root'
})
export class ScoringService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/clients';

  /**
   * Envoie une nouvelle demande de crédit au backend Spring Boot
   * pour évaluation par l'IA et enregistrement en base.
   */
  evaluerCredit(client: ClientRequest): Observable<ClientResponse> {
    return this.http.post<ClientResponse>(`${this.apiUrl}/score`, client);
  }

  /**
   * Récupère l'historique complet des évaluations enregistrées en base.
   */
  getHistorique(): Observable<ClientResponse[]> {
    return this.http.get<ClientResponse[]>(`${this.apiUrl}/history`);
  }
}
