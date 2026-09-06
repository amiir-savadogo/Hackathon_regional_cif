import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Client } from '../../models/client.model';

@Component({
  selector: 'app-client-new',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-2xl mx-auto">
      <div class="flex justify-end mb-4">
        <a routerLink="/clients" class="text-xs font-bold text-ink-600 hover:text-ink-900 px-3 py-1.5 rounded-lg bg-ink-100 hover:bg-ink-200 transition-colors">← Retour aux clients</a>
      </div>

      <div class="bg-white rounded-xl border border-ink-200 shadow-sm p-6 sm:p-8">
        <h1 class="text-xl font-bold text-ink-900 mb-1">Enregistrement d'un nouveau demandeur</h1>
        <p class="text-sm text-ink-500 mb-6">Saisissez les informations d'identité du client. Les données financières seront renseignées lors de la demande de crédit.</p>

        <div *ngIf="errorMessage" class="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">
          {{ errorMessage }}
        </div>

        <form (ngSubmit)="enregistrer()" class="space-y-5">

          <!-- SECTION : Identité -->
          <div>
            <h2 class="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-3 pb-2 border-b border-ink-100">Identité</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="label mb-1.5">Nom *</label>
                <input type="text" [(ngModel)]="client.nom" name="nom" required
                  class="input"
                  placeholder="Ex : Diop" />
              </div>
              <div>
                <label class="label mb-1.5">Prénom *</label>
                <input type="text" [(ngModel)]="client.prenom" name="prenom" required
                  class="input"
                  placeholder="Ex : Amadou" />
              </div>
              <div>
                <label class="label mb-1.5">Âge *</label>
                <input type="number" [(ngModel)]="client.age" name="age" required min="18" max="100"
                  class="input" />
              </div>
              <div>
                <label class="label mb-1.5">Téléphone</label>
                <input type="tel" [(ngModel)]="client.telephone" name="telephone"
                  class="input"
                  placeholder="Ex : +225 07 00 00 00" />
              </div>
              <div>
                <label class="label mb-1.5">Sexe *</label>
                <select [(ngModel)]="client.sexe" name="sexe" required
                  class="input">
                  <option value="">-- Sélectionner --</option>
                  <option>Femme</option>
                  <option>Homme</option>
                </select>
              </div>
              <div>
                <label class="label mb-1.5">Zone *</label>
                <select [(ngModel)]="client.zone" name="zone" required
                  class="input">
                  <option value="">-- Sélectionner --</option>
                  <option>Urbaine</option>
                  <option>Semi-urbaine</option>
                  <option>Rurale</option>
                </select>
              </div>
              <div>
                <label class="label mb-1.5">Situation matrimoniale *</label>
                <select [(ngModel)]="client.situationMatrimoniale" name="situationMatrimoniale" required
                  class="input">
                  <option value="">-- Sélectionner --</option>
                  <option>Marié(e)</option>
                  <option>Célibataire</option>
                  <option>Veuf(ve)</option>
                  <option>Divorcé(e)</option>
                </select>
              </div>
              <div>
                <label class="label mb-1.5">Niveau d'éducation *</label>
                <select [(ngModel)]="client.niveauEducation" name="niveauEducation" required
                  class="input">
                  <option value="">-- Sélectionner --</option>
                  <option>Aucun</option>
                  <option>Primaire</option>
                  <option>Secondaire</option>
                  <option>Supérieur</option>
                </select>
              </div>
              <div>
                <label class="label mb-1.5">Personnes à charge *</label>
                <input type="number" [(ngModel)]="client.nombrePersonnesACharge" name="nombrePersonnesACharge" required min="0" max="15"
                  class="input" />
              </div>
            </div>
          </div>

          <!-- SECTION : Activité économique -->
          <div>
            <h2 class="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-3 pb-2 border-b border-ink-100">Activité économique</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="label mb-1.5">Secteur d'activité</label>
                <select [(ngModel)]="client.secteurActivite" name="secteur"
                  class="input">
                  <option value="">-- Sélectionner --</option>
                  <option>Commerce informel</option>
                  <option>Agriculture</option>
                  <option>Élevage</option>
                  <option>Artisanat</option>
                  <option>Restauration/Transformation</option>
                  <option>Transport</option>
                  <option>Salarié secteur formel</option>
                  <option>Fonctionnaire</option>
                  <option>Autre service</option>
                </select>
              </div>
              <div>
                <label class="label mb-1.5">Ancienneté (années) *</label>
                <input type="number" [(ngModel)]="client.ancienneteActiviteAnnees" name="anciennete" required step="0.5" min="0"
                  class="input"
                  placeholder="Ex : 3" />
              </div>
            </div>
          </div>

          <!-- ACTIONS -->
          <div class="flex items-center justify-between pt-4 border-t border-ink-100">
            <a routerLink="/clients" class="text-sm text-ink-500 hover:text-ink-700">Annuler</a>
            <button type="submit" [disabled]="loading"
              class="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors">
              {{ loading ? 'Enregistrement...' : 'Enregistrer le client' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ClientNewComponent {
  private api = inject(ApiService);
  private router = inject(Router);

  client: Client = {
    nom: '', prenom: '', age: 0, ancienneteActiviteAnnees: 0,
    sexe: '', zone: '', situationMatrimoniale: '', niveauEducation: '', nombrePersonnesACharge: 0
  };
  loading = false;
  errorMessage = '';

  enregistrer() {
    if (!this.client.nom || !this.client.prenom || !this.client.age) {
      this.errorMessage = 'Les champs Nom, Prénom et Âge sont obligatoires.';
      return;
    }
    // Le client doit être majeur pour contracter un crédit - même contrainte
    // que côté backend (Client.java) et moteur IA (ai-service/main.py) :
    // vérifiée ici aussi pour donner un retour immédiat, sans aller-retour serveur.
    if (this.client.age < 18 || this.client.age > 100) {
      this.errorMessage = 'Le client doit être majeur (18 à 100 ans).';
      return;
    }
    if (!this.client.sexe || !this.client.zone || !this.client.situationMatrimoniale || !this.client.niveauEducation) {
      this.errorMessage = 'Veuillez compléter le profil (sexe, zone, situation matrimoniale, niveau d\'éducation) : ces informations sont utilisées par le moteur de scoring IA.';
      return;
    }
    this.loading = true;
    this.api.createClient(this.client).subscribe({
      next: (created) => {
        this.router.navigate(['/clients', created.id, 'credit']);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 409) {
          this.errorMessage = err.error.erreur || 'Un client avec ce nom et prénom existe déjà.';
        } else if (err.status === 400 && err.error?.champs) {
          // Erreurs de validation renvoyées par le backend (GlobalExceptionHandler) :
          // filet de sécurité si les contrôles ci-dessus ont été contournés.
          this.errorMessage = Object.values(err.error.champs).join(' ');
        } else {
          this.errorMessage = 'Erreur lors de la connexion au serveur. Vérifiez que Spring Boot est allumé.';
        }
      }
    });
  }
}
