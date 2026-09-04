import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CreditFormComponent } from './credit-form.component';
import { ApiService } from '../../services/api.service';
import { Client, DemandeCredit } from '../../models/client.model';

describe('CreditFormComponent', () => {
  let component: CreditFormComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;

  const clientDemo: Client = {
    id: 1, nom: 'Ouedraogo', prenom: 'Aïcha', age: 34, ancienneteActiviteAnnees: 5,
  };

  const demandeValideBase: Partial<DemandeCredit> = {
    revenuMensuelFcfa: 150000,
    chargesMensuellesFcfa: 60000,
    objetCredit: 'Fonds de commerce',
    garantie: 'Caution solidaire',
    montantDemandeFcfa: 300000,
  };

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', ['getClient', 'getDemandes', 'evaluerCredit']);
    apiSpy.getClient.and.returnValue(of(clientDemo));
    apiSpy.getDemandes.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [CreditFormComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CreditFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // déclenche ngOnInit (charge le client + l'historique)
  });

  it('should create and load the client on init', () => {
    expect(component).toBeTruthy();
    expect(apiSpy.getClient).toHaveBeenCalledWith(1);
    expect(component.client).toEqual(clientDemo);
  });

  it('refuse un montant demandé négatif SANS appeler le backend', () => {
    Object.assign(component.demande, demandeValideBase, { montantDemandeFcfa: -500000 });

    component.soumettre();

    expect(apiSpy.evaluerCredit).not.toHaveBeenCalled();
    expect(component.errorMessage).toContain('positives');
  });

  it('refuse un revenu mensuel négatif SANS appeler le backend', () => {
    Object.assign(component.demande, demandeValideBase, { revenuMensuelFcfa: -1000000 });

    component.soumettre();

    expect(apiSpy.evaluerCredit).not.toHaveBeenCalled();
    expect(component.errorMessage).toContain('positives');
  });

  it('refuse des charges mensuelles négatives', () => {
    Object.assign(component.demande, demandeValideBase, { chargesMensuellesFcfa: -1 });

    component.soumettre();

    expect(apiSpy.evaluerCredit).not.toHaveBeenCalled();
    expect(component.errorMessage).toContain('négatives');
  });

  it('accepte une demande valide et transmet le résultat', () => {
    const reponse: DemandeCredit = {
      ...(demandeValideBase as DemandeCredit),
      id: 1, statut: 'A_L_ETUDE', probaDefaut: 0.42, dureeMois: 12,
    };
    apiSpy.evaluerCredit.and.returnValue(of(reponse));

    Object.assign(component.demande, demandeValideBase);
    component.soumettre();

    expect(apiSpy.evaluerCredit).toHaveBeenCalledWith(1, component.demande);
    expect(component.resultat?.statut).toBe('A_L_ETUDE');
    expect(component.loading).toBeFalse();
  });

  it('affiche un message générique si le moteur IA est indisponible (échec réseau)', () => {
    apiSpy.evaluerCredit.and.returnValue(throwError(() => ({ status: 0 })));

    Object.assign(component.demande, demandeValideBase);
    component.soumettre();

    expect(component.errorMessage).toContain('communication');
    expect(component.loading).toBeFalse();
  });

  it('affiche les erreurs de validation détaillées en cas de 400 (filet de sécurité serveur)', () => {
    apiSpy.evaluerCredit.and.returnValue(
      throwError(() => ({
        status: 400,
        error: { erreur: 'Données invalides', champs: { montantDemandeFcfa: 'Le montant demandé doit être strictement positif' } },
      }))
    );

    Object.assign(component.demande, demandeValideBase);
    component.soumettre();

    expect(component.errorMessage).toContain('positif');
  });

  it('le ratio d\'endettement est calculé correctement', () => {
    component.demande.revenuMensuelFcfa = 200000;
    component.demande.chargesMensuellesFcfa = 80000;
    expect(component.ratio).toBe(40);
  });

  it('le ratio d\'endettement est 0 si le revenu est nul (évite une division par zéro)', () => {
    component.demande.revenuMensuelFcfa = 0;
    component.demande.chargesMensuellesFcfa = 80000;
    expect(component.ratio).toBe(0);
  });
});
