import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface CategorieItem {
  id: string;
  code: string;
  label: string;
  description?: string;
  coefficientRisque: number; // Ex: 1.0 (neutre), 0.8 (faible risque), 1.25 (risque élevé)
  tauxMin: number;           // Ex: 9.5 %
  dureeMaxMois: number;      // Ex: 12 mois
  badgeColor?: string;       // Style Tailwind
  actif: boolean;
  dateCreation?: string;
}

export interface ObjetCreditItem {
  id: string | number;
  code: string;
  label: string;
  categorie: string;         // Fait référence au label ou code d'une CategorieItem
  categorieId?: string;
  description?: string;
  actif: boolean;
  tauxInteretMin?: number;
  dureeMaxMois?: number;
  dateCreation?: string;
}

export interface GarantieItem {
  id: string | number;
  code: string;
  label: string;
  typeGarantie: 'PERSONNELLE' | 'REELLE_MOBILIERE' | 'REELLE_IMMOBILIERE' | 'FINANCIERE';
  tauxCouvertureRecommande?: number; // Ex: 100%, 120%, 150%
  description?: string;
  actif: boolean;
  exigeDocument: boolean;
  dateCreation?: string;
}

const STORAGE_CATEGORIES_KEY = 'cif_settings_categories_v2';
const STORAGE_OBJETS_KEY = 'cif_settings_objets_credit_v2';
const STORAGE_GARANTIES_KEY = 'cif_settings_garanties_v2';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private base = environment.apiUrl;

  // --- SUJETS RÉACTIFS INITIALISÉS VIDES ---
  private categoriesSubject = new BehaviorSubject<CategorieItem[]>(this.loadStoredCategories());
  public categories$: Observable<CategorieItem[]> = this.categoriesSubject.asObservable();

  private objetsSubject = new BehaviorSubject<ObjetCreditItem[]>(this.loadStoredObjets());
  public objets$: Observable<ObjetCreditItem[]> = this.objetsSubject.asObservable();

  private garantiesSubject = new BehaviorSubject<GarantieItem[]>(this.loadStoredGaranties());
  public garanties$: Observable<GarantieItem[]> = this.garantiesSubject.asObservable();

  constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('cif_settings_categories');
      localStorage.removeItem('cif_settings_objets_credit');
      localStorage.removeItem('cif_settings_garanties');
    }
    this.refreshCategories();
    this.refreshObjets().subscribe();
    this.refreshGaranties().subscribe();
  }

  // =========================================================================
  // 1. GESTION DYNAMIQUE DES CATÉGORIES DE CRÉDIT
  // =========================================================================
  private loadStoredCategories(): CategorieItem[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    const saved = localStorage.getItem(STORAGE_CATEGORIES_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  }

  refreshCategories(): CategorieItem[] {
    const list = this.loadStoredCategories();
    this.categoriesSubject.next(list);
    return list;
  }

  getCategories(): CategorieItem[] {
    return this.categoriesSubject.value;
  }

  getCategoriesActives(): CategorieItem[] {
    return this.categoriesSubject.value.filter(c => c.actif);
  }

  addCategorie(cat: Omit<CategorieItem, 'id' | 'dateCreation'>): CategorieItem {
    const newCat: CategorieItem = {
      ...cat,
      id: 'cat-' + Date.now(),
      dateCreation: new Date().toISOString()
    };
    const updated = [newCat, ...this.categoriesSubject.value];
    this.categoriesSubject.next(updated);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(updated));
    }
    return newCat;
  }

  updateCategorie(id: string, updates: Partial<CategorieItem>): void {
    const updated = this.categoriesSubject.value.map(c => c.id === id ? { ...c, ...updates } : c);
    this.categoriesSubject.next(updated);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(updated));
    }
  }

  deleteCategorie(id: string): void {
    const toDelete = this.categoriesSubject.value.find(c => c.id === id);
    if (toDelete) {
      this.authService.addToTrash({
        type: 'CATEGORIE',
        typeLabel: 'Catégorie de Prêt',
        title: toDelete.label,
        details: `Code: ${toDelete.code} · Taux Min: ${toDelete.tauxMin}% · Coeff: ${toDelete.coefficientRisque}`,
        data: toDelete
      });
    }

    const updated = this.categoriesSubject.value.filter(c => c.id !== id);
    this.categoriesSubject.next(updated);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(updated));
    }
  }

  // =========================================================================
  // 2. GESTION DYNAMIQUE DES OBJETS DE CRÉDIT
  // =========================================================================
  private loadStoredObjets(): ObjetCreditItem[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    const saved = localStorage.getItem(STORAGE_OBJETS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  }

  refreshObjets(): Observable<ObjetCreditItem[]> {
    return this.http.get<ObjetCreditItem[]>(`${this.base}/objets-credit`).pipe(
      tap(list => {
        if (list && Array.isArray(list)) {
          this.objetsSubject.next(list);
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(STORAGE_OBJETS_KEY, JSON.stringify(list));
          }
        }
      }),
      catchError(() => {
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
    const localNew: ObjetCreditItem = {
      ...objet,
      id: 'obj-' + Date.now(),
      dateCreation: new Date().toISOString()
    };
    const current = [localNew, ...this.objetsSubject.value];
    this.objetsSubject.next(current);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_OBJETS_KEY, JSON.stringify(current));
    }

    return this.http.post<ObjetCreditItem>(`${this.base}/objets-credit`, objet).pipe(
      catchError(() => of(localNew))
    );
  }

  updateObjet(id: any, updates: Partial<ObjetCreditItem>): Observable<ObjetCreditItem> {
    const current = this.objetsSubject.value.map(o => o.id === id ? { ...o, ...updates } : o);
    this.objetsSubject.next(current);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_OBJETS_KEY, JSON.stringify(current));
    }

    const updatedItem = current.find(o => o.id === id) || ({} as ObjetCreditItem);
    return this.http.put<ObjetCreditItem>(`${this.base}/objets-credit/${id}`, updates).pipe(
      catchError(() => of(updatedItem))
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

    const current = this.objetsSubject.value.filter(o => o.id !== id);
    this.objetsSubject.next(current);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_OBJETS_KEY, JSON.stringify(current));
    }

    return this.http.delete<void>(`${this.base}/objets-credit/${id}`).pipe(
      catchError(() => of(void 0))
    );
  }

  // =========================================================================
  // 3. GESTION DYNAMIQUE DES TYPES DE GARANTIES
  // =========================================================================
  private loadStoredGaranties(): GarantieItem[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    const saved = localStorage.getItem(STORAGE_GARANTIES_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  }

  refreshGaranties(): Observable<GarantieItem[]> {
    return this.http.get<GarantieItem[]>(`${this.base}/garanties`).pipe(
      tap(list => {
        if (list && Array.isArray(list)) {
          this.garantiesSubject.next(list);
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(STORAGE_GARANTIES_KEY, JSON.stringify(list));
          }
        }
      }),
      catchError(() => {
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
    const localNew: GarantieItem = {
      ...garantie,
      id: 'gar-' + Date.now(),
      dateCreation: new Date().toISOString()
    };
    const current = [localNew, ...this.garantiesSubject.value];
    this.garantiesSubject.next(current);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_GARANTIES_KEY, JSON.stringify(current));
    }

    return this.http.post<GarantieItem>(`${this.base}/garanties`, garantie).pipe(
      catchError(() => of(localNew))
    );
  }

  updateGarantie(id: any, updates: Partial<GarantieItem>): Observable<GarantieItem> {
    const current = this.garantiesSubject.value.map(g => g.id === id ? { ...g, ...updates } : g);
    this.garantiesSubject.next(current);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_GARANTIES_KEY, JSON.stringify(current));
    }

    const updatedItem = current.find(g => g.id === id) || ({} as GarantieItem);
    return this.http.put<GarantieItem>(`${this.base}/garanties/${id}`, updates).pipe(
      catchError(() => of(updatedItem))
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

    const current = this.garantiesSubject.value.filter(g => g.id !== id);
    this.garantiesSubject.next(current);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_GARANTIES_KEY, JSON.stringify(current));
    }

    return this.http.delete<void>(`${this.base}/garanties/${id}`).pipe(
      catchError(() => of(void 0))
    );
  }

  // =========================================================================
  // RÉINITIALISATION COMPLÈTE
  // =========================================================================
  clearAllParameters() {
    this.categoriesSubject.next([]);
    this.objetsSubject.next([]);
    this.garantiesSubject.next([]);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_CATEGORIES_KEY);
      localStorage.removeItem(STORAGE_OBJETS_KEY);
      localStorage.removeItem(STORAGE_GARANTIES_KEY);
      localStorage.removeItem('cif_settings_categories');
      localStorage.removeItem('cif_settings_objets_credit');
      localStorage.removeItem('cif_settings_garanties');
    }
  }
}
