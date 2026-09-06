import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
  systeme?: boolean;
  tauxInteretMin?: number;
  dureeMaxMois?: number;
  dateCreation?: string;
}

/** Catégorie de crédit (13, catalogue produits) - API /api/categories-credit.
 *  `label` est consommé par le modèle IA ; `systeme=true` => non renommable. */
export interface CategorieCreditItem {
  id: string | number;
  code: string;
  label: string;
  description?: string;
  actif: boolean;
  systeme?: boolean;
  tauxInteretMin?: number;
  dureeMaxMois?: number;
  dateCreation?: string;
}

export interface NatureJuridiqueItem {
  id: string | number;
  code: string;
  label: string;
  description?: string;
  necessiteNotaire: boolean;
  fraisEnregistrement: boolean;
  actif: boolean;
  dateCreation?: string;
}

export interface GarantieItem {
  id: string | number;
  code: string;
  label: string;
  natureJuridiqueId?: string;
  tauxCouvertureRecommande?: number; // Ex: 100%, 120%, 150%
  description?: string;
  actif: boolean;
  exigeDocument: boolean;
  dateCreation?: string;
}

const STORAGE_CATEGORIES_KEY = 'cif_settings_categories_v3';
const STORAGE_OBJETS_KEY = 'cif_settings_objets_credit_v3';
const STORAGE_GARANTIES_KEY = 'cif_settings_garanties_v3';
const STORAGE_NATURES_KEY = 'cif_settings_natures_juridiques_v1';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private base = environment.apiUrl;
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // --- SUJETS RÉACTIFS INITIALISÉS VIDES ---
  private categoriesSubject = new BehaviorSubject<CategorieItem[]>(this.loadStoredCategories());
  public categories$: Observable<CategorieItem[]> = this.categoriesSubject.asObservable();

  private objetsSubject = new BehaviorSubject<ObjetCreditItem[]>(this.loadStoredObjets());
  public objets$: Observable<ObjetCreditItem[]> = this.objetsSubject.asObservable();

  private garantiesSubject = new BehaviorSubject<GarantieItem[]>(this.loadStoredGaranties());
  public garanties$: Observable<GarantieItem[]> = this.garantiesSubject.asObservable();

  private naturesSubject = new BehaviorSubject<NatureJuridiqueItem[]>(this.loadStoredNatures());
  public naturesJuridiques$: Observable<NatureJuridiqueItem[]> = this.naturesSubject.asObservable();

  // Catégories de crédit du catalogue (API, alimente le wizard).
  private categoriesCreditSubject = new BehaviorSubject<CategorieCreditItem[]>([]);
  public categoriesCredit$: Observable<CategorieCreditItem[]> = this.categoriesCreditSubject.asObservable();

  constructor() {
    this.refreshCategories();
    if (this.isBrowser) {
      this.refreshCategoriesCredit().subscribe();
      this.refreshObjets().subscribe();
      this.refreshGaranties().subscribe();
      this.refreshNatures().subscribe();
    }
  }

  // =========================================================================
  // CATÉGORIES DE CRÉDIT (catalogue produits, via API)
  // =========================================================================
  refreshCategoriesCredit(): Observable<CategorieCreditItem[]> {
    return this.http.get<CategorieCreditItem[]>(`${this.base}/categories-credit`).pipe(
      tap(list => this.categoriesCreditSubject.next(list || [])),
      catchError(err => {
        console.error('Erreur chargement catégories de crédit', err);
        return of([] as CategorieCreditItem[]);
      })
    );
  }

  getCategoriesCredit(): CategorieCreditItem[] {
    return this.categoriesCreditSubject.value;
  }

  getCategoriesCreditActives(): CategorieCreditItem[] {
    return this.categoriesCreditSubject.value.filter(c => c.actif !== false);
  }

  addCategorieCredit(cat: Partial<CategorieCreditItem>): Observable<CategorieCreditItem> {
    return this.http.post<CategorieCreditItem>(`${this.base}/categories-credit`, cat).pipe(
      tap(saved => this.categoriesCreditSubject.next([...this.categoriesCreditSubject.value, saved]))
    );
  }

  updateCategorieCredit(id: any, updates: Partial<CategorieCreditItem>): Observable<CategorieCreditItem> {
    return this.http.put<CategorieCreditItem>(`${this.base}/categories-credit/${id}`, updates).pipe(
      tap(saved => {
        const list = this.categoriesCreditSubject.value.slice();
        const i = list.findIndex(c => c.id == id);
        if (i > -1) { list[i] = saved; this.categoriesCreditSubject.next(list); }
      })
    );
  }

  deleteCategorieCredit(id: any): Observable<void> {
    return this.http.delete<void>(`${this.base}/categories-credit/${id}`).pipe(
      tap(() => this.categoriesCreditSubject.next(
        this.categoriesCreditSubject.value.filter(c => c.id != id)))
    );
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
  // 2. GESTION DYNAMIQUE DES OBJETS DE CRÉDIT (via API)
  // =========================================================================
  private loadStoredObjets(): ObjetCreditItem[] {
    return []; // Supprimé du localStorage, les données viennent de l'API
  }

  refreshObjets(): Observable<ObjetCreditItem[]> {
    return this.http.get<ObjetCreditItem[]>(`${this.base}/objets-credit`).pipe(
      tap(list => this.objetsSubject.next(list)),
      catchError(err => {
        console.error('Erreur de chargement des objets de crédit', err);
        return of([]);
      })
    );
  }

  getObjets(): ObjetCreditItem[] {
    return this.objetsSubject.value;
  }

  getObjetsActifs(): ObjetCreditItem[] {
    return this.objetsSubject.value.filter(o => o.actif);
  }

  addObjet(objet: Partial<ObjetCreditItem>): Observable<ObjetCreditItem> {
    return this.http.post<ObjetCreditItem>(`${this.base}/objets-credit`, objet).pipe(
      tap(saved => {
        const current = this.objetsSubject.value;
        this.objetsSubject.next([...current, saved]);
      })
    );
  }

  updateObjet(id: any, updates: Partial<ObjetCreditItem>): Observable<ObjetCreditItem> {
    return this.http.put<ObjetCreditItem>(`${this.base}/objets-credit/${id}`, updates).pipe(
      tap(saved => {
        const current = this.objetsSubject.value;
        const index = current.findIndex(o => o.id == id);
        if (index > -1) {
          current[index] = saved;
          this.objetsSubject.next([...current]);
        }
      })
    );
  }

  deleteObjet(id: any): Observable<void> {
    const toDelete = this.objetsSubject.value.find(o => o.id == id);
    if (toDelete) {
      this.authService.addToTrash({
        type: 'OBJET_CREDIT',
        typeLabel: 'Objet de Crédit',
        title: toDelete.label,
        details: `Catégorie: ${toDelete.categorie} · Max: ${toDelete.dureeMaxMois} mois`,
        data: toDelete
      });
    }

    return this.http.delete<void>(`${this.base}/objets-credit/${id}`).pipe(
      tap(() => {
        const current = this.objetsSubject.value.filter(o => o.id != id);
        this.objetsSubject.next(current);
      })
    );
  }

  // =========================================================================
  // 3. GESTION DYNAMIQUE DES GARANTIES (via API)
  // =========================================================================
  private loadStoredGaranties(): GarantieItem[] {
    return []; // API
  }

  refreshGaranties(): Observable<GarantieItem[]> {
    return this.http.get<GarantieItem[]>(`${this.base}/garanties`).pipe(
      tap(list => this.garantiesSubject.next(list)),
      catchError(err => {
        console.error('Erreur chargement garanties', err);
        return of([]);
      })
    );
  }

  getGaranties(): GarantieItem[] {
    return this.garantiesSubject.value;
  }

  getGarantiesActives(): GarantieItem[] {
    return this.garantiesSubject.value.filter(g => g.actif);
  }

  addGarantie(garantie: Partial<GarantieItem>): Observable<GarantieItem> {
    return this.http.post<GarantieItem>(`${this.base}/garanties`, garantie).pipe(
      tap(saved => {
        const current = this.garantiesSubject.value;
        this.garantiesSubject.next([...current, saved]);
      })
    );
  }

  updateGarantie(id: any, updates: Partial<GarantieItem>): Observable<GarantieItem> {
    return this.http.put<GarantieItem>(`${this.base}/garanties/${id}`, updates).pipe(
      tap(saved => {
        const current = this.garantiesSubject.value;
        const index = current.findIndex(g => g.id == id);
        if (index > -1) {
          current[index] = saved;
          this.garantiesSubject.next([...current]);
        }
      })
    );
  }

  deleteGarantie(id: any): Observable<void> {
    const toDelete = this.garantiesSubject.value.find(g => g.id == id);
    if (toDelete) {
      this.authService.addToTrash({
        type: 'GARANTIE',
        typeLabel: 'Type de Garantie',
        title: toDelete.label,
        details: `Code: ${toDelete.code} · Couverture: ${toDelete.tauxCouvertureRecommande}%`,
        data: toDelete
      });
    }

    return this.http.delete<void>(`${this.base}/garanties/${id}`).pipe(
      tap(() => {
        const current = this.garantiesSubject.value.filter(g => g.id != id);
        this.garantiesSubject.next(current);
      })
    );
  }

  // =========================================================================
  // 4. GESTION DES NATURES JURIDIQUES (via API)
  // =========================================================================
  private loadStoredNatures(): NatureJuridiqueItem[] {
    return [];
  }

  refreshNatures(): Observable<NatureJuridiqueItem[]> {
    return this.http.get<NatureJuridiqueItem[]>(`${this.base}/natures-juridiques`).pipe(
      tap(list => this.naturesSubject.next(list)),
      catchError(err => {
        console.error('Erreur chargement natures', err);
        return of([]);
      })
    );
  }

  getNaturesJuridiques(): NatureJuridiqueItem[] {
    return this.naturesSubject.value;
  }

  getNaturesJuridiquesActives(): NatureJuridiqueItem[] {
    return this.naturesSubject.value.filter(n => n.actif);
  }

  addNatureJuridique(nature: Partial<NatureJuridiqueItem>): Observable<NatureJuridiqueItem> {
    return this.http.post<NatureJuridiqueItem>(`${this.base}/natures-juridiques`, nature).pipe(
      tap(saved => {
        const current = this.naturesSubject.value;
        this.naturesSubject.next([...current, saved]);
      })
    );
  }

  updateNatureJuridique(id: any, updates: Partial<NatureJuridiqueItem>): Observable<NatureJuridiqueItem> {
    return this.http.put<NatureJuridiqueItem>(`${this.base}/natures-juridiques/${id}`, updates).pipe(
      tap(saved => {
        const current = this.naturesSubject.value;
        const index = current.findIndex(n => n.id == id);
        if (index > -1) {
          current[index] = saved;
          this.naturesSubject.next([...current]);
        }
      })
    );
  }

  deleteNatureJuridique(id: any): Observable<void> {
    const toDelete = this.naturesSubject.value.find(n => n.id == id);
    if (toDelete) {
      this.authService.addToTrash({
        type: 'NATURE_JURIDIQUE',
        typeLabel: 'Nature Juridique',
        title: toDelete.label,
        details: `Code: ${toDelete.code}`,
        data: toDelete
      });
    }

    return this.http.delete<void>(`${this.base}/natures-juridiques/${id}`).pipe(
      tap(() => {
        const current = this.naturesSubject.value.filter(n => n.id != id);
        this.naturesSubject.next(current);
      })
    );
  }

  // =========================================================================
  // RÉINITIALISATION COMPLÈTE
  // =========================================================================
  clearAllParameters() {
    this.categoriesSubject.next([]);
    this.objetsSubject.next([]);
    this.garantiesSubject.next([]);
    this.naturesSubject.next([]);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_CATEGORIES_KEY);
      localStorage.removeItem(STORAGE_OBJETS_KEY);
      localStorage.removeItem(STORAGE_GARANTIES_KEY);
      localStorage.removeItem(STORAGE_NATURES_KEY);
      localStorage.removeItem('cif_settings_categories');
      localStorage.removeItem('cif_settings_objets_credit');
      localStorage.removeItem('cif_settings_garanties');
    }
  }
}
