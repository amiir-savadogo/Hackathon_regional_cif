import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { environment } from '../../environments/environment';
import { Client, DemandeCredit, DashboardStats } from '../models/client.model';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const base = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Vérifie qu'aucune requête inattendue n'a été émise par le service.
    httpMock.verify();
  });

  it('getClients() interroge GET /clients et renvoie la liste', () => {
    const mockClients: Client[] = [
      { nom: 'Ouedraogo', prenom: 'Aïcha', age: 34, ancienneteActiviteAnnees: 5 },
    ];

    service.getClients().subscribe((clients) => {
      expect(clients).toEqual(mockClients);
    });

    const req = httpMock.expectOne(`${base}/clients`);
    expect(req.request.method).toBe('GET');
    req.flush(mockClients);
  });

  it('createClient() envoie POST /clients avec le client en corps de requête', () => {
    const nouveauClient: Client = { nom: 'Sawadogo', prenom: 'Boureima', age: 40, ancienneteActiviteAnnees: 3 };
    const clientCree: Client = { ...nouveauClient, id: 1 };

    service.createClient(nouveauClient).subscribe((res) => {
      expect(res).toEqual(clientCree);
    });

    const req = httpMock.expectOne(`${base}/clients`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(nouveauClient);
    req.flush(clientCree);
  });

  it('createClient() propage une erreur 409 (doublon) sans la masquer', () => {
    const client: Client = { nom: 'Ouedraogo', prenom: 'Aïcha', age: 34, ancienneteActiviteAnnees: 5 };
    let erreurRecue: any = null;

    service.createClient(client).subscribe({
      next: () => fail('ne devrait pas réussir'),
      error: (err) => (erreurRecue = err),
    });

    const req = httpMock.expectOne(`${base}/clients`);
    req.flush(
      { erreur: 'Un client avec ce nom et prénom existe déjà dans la base.' },
      { status: 409, statusText: 'Conflict' }
    );

    expect(erreurRecue.status).toBe(409);
    expect(erreurRecue.error.erreur).toContain('existe déjà');
  });

  it('createClient() propage une erreur 400 avec le détail des champs (validation backend)', () => {
    const clientMineur: Client = { nom: 'Ouedraogo', prenom: 'Aïcha', age: 15, ancienneteActiviteAnnees: 5 };
    let erreurRecue: any = null;

    service.createClient(clientMineur).subscribe({
      next: () => fail('ne devrait pas réussir'),
      error: (err) => (erreurRecue = err),
    });

    const req = httpMock.expectOne(`${base}/clients`);
    req.flush(
      { erreur: 'Données invalides', champs: { age: 'Le client doit être majeur (18 ans minimum)' } },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(erreurRecue.status).toBe(400);
    expect(erreurRecue.error.champs.age).toContain('majeur');
  });

  it('evaluerCredit() envoie POST /clients/:id/demandes', () => {
    const demande: DemandeCredit = {
      revenuMensuelFcfa: 150000,
      chargesMensuellesFcfa: 60000,
      montantDemandeFcfa: 300000,
      dureeMois: 12,
    };
    const reponse: DemandeCredit = { ...demande, id: 1, statut: 'A_L_ETUDE', probaDefaut: 0.25 };

    service.evaluerCredit(42, demande).subscribe((res) => {
      expect(res.statut).toBe('A_L_ETUDE');
    });

    const req = httpMock.expectOne(`${base}/clients/42/demandes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(demande);
    req.flush(reponse);
  });

  it('getStats() interroge GET /dashboard/stats', () => {
    const stats: DashboardStats = { totalClients: 10, totalDemandes: 4, approuvees: 2, rejetees: 1, enEtude: 1 };

    service.getStats().subscribe((res) => {
      expect(res).toEqual(stats);
    });

    const req = httpMock.expectOne(`${base}/dashboard/stats`);
    expect(req.request.method).toBe('GET');
    req.flush(stats);
  });
});
