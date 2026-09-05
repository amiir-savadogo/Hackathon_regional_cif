import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface ObjetCreditItem {
  id: any;
  code: string;
  label: string;
  categorie: string;
  description?: string;
  actif: boolean;
  tauxInteretMin?: number;
  dureeMaxMois?: number;
  dateCreation?: string;
}

export interface GarantieItem {
  id: any;
  code: string;
  label: string;
  typeGarantie: 'PERSONNELLE' | 'REELLE_MOBILIERE' | 'REELLE_IMMOBILIERE' | 'FINANCIERE';
  tauxCouvertureRecommande?: number;
  description?: string;
  actif: boolean;
  exigeDocument: boolean;
  dateCreation?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private base = environment.apiUrl;

  private objetsSubject = new BehaviorSubject<ObjetCreditItem[]>([]);
  public objets$: Observable<ObjetCreditItem[]> = this.objetsSubject.asObservable();

  private garantiesSubject = new BehaviorSubject<GarantieItem[]>([]);
  public garanties$: Observable<GarantieItem[]> = this.garantiesSubject.asObservable();

  constructor() {
    this.refreshObjets().subscribe();
    this.refreshGaranties().subscribe();
  }

  // =========================================================================
  // OBJETS DE CRÉDIT (API REST SPRING BOOT + POSTGRESQL)
  // =========================================================================
  refreshObjets(): Observable<ObjetCreditItem[]> {
    return this.http.get<ObjetCreditItem[]>(`${this.base}/objets-credit`).pipe(
      tap(list => this.objetsSubject.next(list || [])),
      catchError(err => {
        console.warn('API /api/objets-credit inaccessible:', err);
        return of(this.objetsSubject.value);
      })
    );
  }

  getObjets(): ObjetCreditItem[] {
    return this.objetsSubject.value;
  }

  getObjetsActifs(): ObjetCreditItem[] {
    return this.objetsSubject.value.filter(o => o.actif);
  }

  addObjet(objet: Omit<ObjetCreditItem, 'id' | 'dateCreation'>): Observable<ObjetCreditItem> {
    return this.http.post<ObjetCreditItem>(`${this.base}/objets-credit`, objet).pipe(
      tap(newObjet => {
        const current = this.objetsSubject.value;
        this.objetsSubject.next([newObjet, ...current]);
      })
    );
  }

  updateObjet(id: any, updates: Partial<ObjetCreditItem>): Observable<ObjetCreditItem> {
    return this.http.put<ObjetCreditItem>(`${this.base}/objets-credit/${id}`, updates).pipe(
      tap(updated => {
        const current = this.objetsSubject.value.map(o => o.id === id ? { ...o, ...updated } : o);
        this.objetsSubject.next(current);
      })
    );
  }

  deleteObjet(id: any): Observable<void> {
    const toDelete = this.objetsSubject.value.find(o => o.id === id);
    if (toDelete) {
      this.authService.addToTrash({
        type: 'OBJET_CREDIT',
        typeLabel: 'Objet de Crédit',
        title: toDelete.label,
        details: `Catégorie: ${toDelete.categorie} · Code: ${toDelete.code}`,
        data: toDelete
      });
    }

    return this.http.delete<void>(`${this.base}/objets-credit/${id}`).pipe(
      tap(() => {
        const current = this.objetsSubject.value.filter(o => o.id !== id);
        this.objetsSubject.next(current);
      }),
      catchError(err => {
        // Optimistic UI update
        const current = this.objetsSubject.value.filter(o => o.id !== id);
        this.objetsSubject.next(current);
        return of(void 0);
      })
    );
  }

  restoreObjet(item: ObjetCreditItem) {
    this.addObjet(item).subscribe();
  }

  // =========================================================================
  // TYPES DE GARANTIE (API REST SPRING BOOT + POSTGRESQL)
  // =========================================================================
  refreshGaranties(): Observable<GarantieItem[]> {
    return this.http.get<GarantieItem[]>(`${this.base}/garanties`).pipe(
      tap(list => this.garantiesSubject.next(list || [])),
      catchError(err => {
        console.warn('API /api/garanties inaccessible:', err);
        return of(this.garantiesSubject.value);
      })
    );
  }

  getGaranties(): GarantieItem[] {
    return this.garantiesSubject.value;
  }

  getGarantiesActives(): GarantieItem[] {
    return this.garantiesSubject.value.filter(g => g.actif);
  }

  addGarantie(garantie: Omit<GarantieItem, 'id' | 'dateCreation'>): Observable<GarantieItem> {
    return this.http.post<GarantieItem>(`${this.base}/garanties`, garantie).pipe(
      tap(newGar => {
        const current = this.garantiesSubject.value;
        this.garantiesSubject.next([newGar, ...current]);
      })
    );
  }

  updateGarantie(id: any, updates: Partial<GarantieItem>): Observable<GarantieItem> {
    return this.http.put<GarantieItem>(`${this.base}/garanties/${id}`, updates).pipe(
      tap(updated => {
        const current = this.garantiesSubject.value.map(g => g.id === id ? { ...g, ...updated } : g);
        this.garantiesSubject.next(current);
      })
    );
  }

  deleteGarantie(id: any): Observable<void> {
    const toDelete = this.garantiesSubject.value.find(g => g.id === id);
    if (toDelete) {
      this.authService.addToTrash({
        type: 'GARANTIE',
        typeLabel: 'Type de Garantie',
        title: toDelete.label,
        details: `Type: ${toDelete.typeGarantie} · Couverture: ${toDelete.tauxCouvertureRecommande || 100}%`,
        data: toDelete
      });
    }

    return this.http.delete<void>(`${this.base}/garanties/${id}`).pipe(
      tap(() => {
        const current = this.garantiesSubject.value.filter(g => g.id !== id);
        this.garantiesSubject.next(current);
      }),
      catchError(err => {
        const current = this.garantiesSubject.value.filter(g => g.id !== id);
        this.garantiesSubject.next(current);
        return of(void 0);
      })
    );
  }

  restoreGarantie(item: GarantieItem) {
    this.addGarantie(item).subscribe();
  }
}
