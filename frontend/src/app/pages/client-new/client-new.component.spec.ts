import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ClientNewComponent } from './client-new.component';
import { ApiService } from '../../services/api.service';
import { Client } from '../../models/client.model';

describe('ClientNewComponent', () => {
  let component: ClientNewComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const clientMajeurValide: Client = {
    nom: 'Ouedraogo', prenom: 'Aïcha', age: 34, ancienneteActiviteAnnees: 5,
    sexe: 'Femme', zone: 'Urbaine', situationMatrimoniale: 'Marié(e)', niveauEducation: 'Primaire',
    nombrePersonnesACharge: 3,
  };

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', ['createClient']);

    await TestBed.configureTestingModule({
      imports: [ClientNewComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: apiSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ClientNewComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('refuse un client de moins de 18 ans SANS appeler le backend', () => {
    // Reproduit le cas signalé : un mineur ne doit jamais pouvoir soumettre
    // une demande, ni même déclencher l'appel réseau vers /api/clients.
    component.client = { ...clientMajeurValide, age: 15 };

    component.enregistrer();

    expect(apiSpy.createClient).not.toHaveBeenCalled();
    expect(component.errorMessage).toContain('majeur');
  });

  it('refuse un âge invraisemblable (> 100 ans)', () => {
    component.client = { ...clientMajeurValide, age: 130 };

    component.enregistrer();

    expect(apiSpy.createClient).not.toHaveBeenCalled();
    expect(component.errorMessage).toContain('majeur');
  });

  it('accepte un client valide et appelle le backend', () => {
    apiSpy.createClient.and.returnValue(of({ ...clientMajeurValide, id: 1 }));

    component.client = { ...clientMajeurValide };
    component.enregistrer();

    expect(apiSpy.createClient).toHaveBeenCalledWith(clientMajeurValide);
    expect(router.navigate).toHaveBeenCalledWith(['/clients', 1, 'credit']);
  });

  it('affiche le message du backend en cas de doublon (409)', () => {
    apiSpy.createClient.and.returnValue(
      throwError(() => ({ status: 409, error: { erreur: 'Un client avec ce nom et prénom existe déjà.' } }))
    );

    component.client = { ...clientMajeurValide };
    component.enregistrer();

    expect(component.errorMessage).toContain('existe déjà');
    expect(component.loading).toBeFalse();
  });

  it('affiche les erreurs de validation détaillées en cas de 400 (filet de sécurité serveur)', () => {
    apiSpy.createClient.and.returnValue(
      throwError(() => ({
        status: 400,
        error: { erreur: 'Données invalides', champs: { age: 'Le client doit être majeur (18 ans minimum)' } },
      }))
    );

    // Simule un contournement du contrôle frontend (ex. appel direct à l'API) :
    // la validation backend doit tout de même produire un message exploitable.
    component.client = { ...clientMajeurValide };
    component.enregistrer();

    expect(component.errorMessage).toContain('majeur');
  });
});
