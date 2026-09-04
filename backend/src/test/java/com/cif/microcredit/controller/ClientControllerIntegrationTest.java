package com.cif.microcredit.controller;

import com.cif.microcredit.model.Client;
import com.cif.microcredit.model.DemandeCredit;
import com.cif.microcredit.repository.ClientRepository;
import com.cif.microcredit.repository.DemandeCreditRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Tests d'intégration bout-en-bout du contrôleur, sur une vraie base H2 en
 * mémoire (cf. src/test/resources/application.properties) - pas de mock des
 * repositories : les requêtes JPA/SQL réellement écrites sont exercées.
 *
 * Le moteur IA (ai-service) n'est volontairement PAS démarré pendant ces
 * tests : les appels de ScoringService échouent donc et retombent sur le
 * statut "ERREUR_IA", ce qui est en soi le comportement attendu et testé
 * (cf. testEvaluerCredit_moteurIaIndisponible_degradeProprement) - la
 * validation d'entrée, elle, s'exécute AVANT tout appel au moteur IA (grâce
 * à @Valid sur les endpoints) et est donc testable indépendamment.
 *
 * NB : ce projet utilise Spring Boot 4.1 (sorti après la coupure de
 * connaissances de l'assistant qui a écrit ce fichier) - ces tests reposent
 * volontairement sur des API très stables et anciennes (@SpringBootTest,
 * TestRestTemplate) plutôt que sur les annotations de mock les plus
 * récentes, mais n'ont pas pu être compilés dans l'environnement de
 * rédaction (pas d'accès à Maven Central). À exécuter avec `mvn test` avant
 * le hackathon.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ClientControllerIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private DemandeCreditRepository demandeCreditRepository;

    @BeforeEach
    void nettoyerLaBase() {
        demandeCreditRepository.deleteAll();
        clientRepository.deleteAll();
    }

    private String url(String path) {
        return "http://localhost:" + port + "/api" + path;
    }

    /** Client valide, réutilisé comme point de départ par plusieurs tests. */
    private Client clientValide() {
        Client c = new Client();
        c.setNom("Ouedraogo");
        c.setPrenom("Aïcha");
        c.setAge(34);
        c.setSexe("Femme");
        c.setZone("Urbaine");
        c.setSituationMatrimoniale("Marié(e)");
        c.setNiveauEducation("Primaire");
        c.setNombrePersonnesACharge(3);
        c.setSecteurActivite("Commerce informel");
        c.setAncienneteActiviteAnnees(5);
        return c;
    }

    // =====================================================================
    // Validation - Client
    // =====================================================================

    @Test
    void creerClient_mineur_estRejeteAvec400() {
        // Reproduit exactement le cas signalé : un client de moins de 18 ans
        // ne doit pas pouvoir être enregistré comme demandeur de crédit.
        Client mineur = clientValide();
        mineur.setAge(15);

        ResponseEntity<Map> response = restTemplate.postForEntity(url("/clients"), mineur, Map.class);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        Map<String, Object> champs = (Map<String, Object>) response.getBody().get("champs");
        assertTrue(champs.containsKey("age"));

        assertEquals(0, clientRepository.count(), "Le client mineur ne doit pas être enregistré en base");
    }

    @Test
    void creerClient_ageInvraisemblable_estRejeteAvec400() {
        Client c = clientValide();
        c.setAge(150);

        ResponseEntity<Map> response = restTemplate.postForEntity(url("/clients"), c, Map.class);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void creerClient_nomVide_estRejeteAvec400() {
        Client c = clientValide();
        c.setNom("");

        ResponseEntity<Map> response = restTemplate.postForEntity(url("/clients"), c, Map.class);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void creerClient_valide_estAccepteAvec201() {
        ResponseEntity<Client> response = restTemplate.postForEntity(url("/clients"), clientValide(), Client.class);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertNotNull(response.getBody().getId());
        assertEquals(1, clientRepository.count());
    }

    @Test
    void creerClient_doublonNomPrenom_estRejeteAvec409() {
        restTemplate.postForEntity(url("/clients"), clientValide(), Client.class);

        // Même nom/prénom, casse différente : doit tout de même être détecté
        // (IgnoreCase), et refusé.
        Client doublon = clientValide();
        doublon.setNom("OUEDRAOGO");
        doublon.setPrenom("aïcha");

        ResponseEntity<Map> response = restTemplate.postForEntity(url("/clients"), doublon, Map.class);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals(1, clientRepository.count(), "Le doublon ne doit pas être enregistré");
    }

    @Test
    void getClientById_inexistant_renvoie404() {
        ResponseEntity<Client> response = restTemplate.getForEntity(url("/clients/99999"), Client.class);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void getAllClients_renvoieLaListeComplete() {
        restTemplate.postForEntity(url("/clients"), clientValide(), Client.class);
        Client c2 = clientValide();
        c2.setNom("Sawadogo");
        c2.setPrenom("Boureima");
        restTemplate.postForEntity(url("/clients"), c2, Client.class);

        ResponseEntity<Client[]> response = restTemplate.getForEntity(url("/clients"), Client[].class);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(2, response.getBody().length);
    }

    // =====================================================================
    // Validation - Demande de crédit
    // =====================================================================

    private Long creerClientEtRecupererId() {
        ResponseEntity<Client> response = restTemplate.postForEntity(url("/clients"), clientValide(), Client.class);
        return response.getBody().getId();
    }

    /** Demande de crédit valide de base, pour partir d'un cas passant. */
    private DemandeCredit demandeValide() {
        DemandeCredit d = new DemandeCredit();
        d.setRevenuMensuelFcfa(150000);
        d.setChargesMensuellesFcfa(60000);
        d.setAncienneteCooperativeMois(24);
        d.setMembreGroupeSolidaire(true);
        d.setEpargneSoldeMoyenFcfa(40000);
        d.setRegulariteEpargne("Régulière");
        d.setNombreCreditsAnterieurs(2);
        d.setTauxRemboursementHistoriquePct(95.0);
        d.setJoursRetardMoyenHistorique(2.0);
        d.setPossedeMobileMoney(true);
        d.setFrequenceTransactionsMmMois(15);
        d.setInterrogeBic(true);
        d.setStatutBic("Aucun incident");
        d.setNombrePretsActifsAutresInstitutions(0);
        d.setEncoursCreditAutresInstitutionsFcfa(0);
        d.setObjetCredit("Fonds de roulement");
        d.setMontantDemandeFcfa(300000);
        d.setDureeMois(12);
        d.setGarantie("Caution solidaire");
        return d;
    }

    @Test
    void evaluerCredit_montantNegatif_estRejeteAvec400() {
        Long clientId = creerClientEtRecupererId();
        DemandeCredit demande = demandeValide();
        demande.setMontantDemandeFcfa(-500000);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                url("/clients/" + clientId + "/demandes"), demande, Map.class);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals(0, demandeCreditRepository.count());
    }

    @Test
    void evaluerCredit_dureeHorsBornes_estRejeteAvec400() {
        Long clientId = creerClientEtRecupererId();
        DemandeCredit demande = demandeValide();
        demande.setDureeMois(120); // > 60 mois, plafond métier

        ResponseEntity<Map> response = restTemplate.postForEntity(
                url("/clients/" + clientId + "/demandes"), demande, Map.class);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void evaluerCredit_revenuNulOuNegatif_estRejeteAvec400() {
        Long clientId = creerClientEtRecupererId();
        DemandeCredit demande = demandeValide();
        demande.setRevenuMensuelFcfa(0);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                url("/clients/" + clientId + "/demandes"), demande, Map.class);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void evaluerCredit_clientInexistant_renvoie404() {
        DemandeCredit demande = demandeValide();

        ResponseEntity<DemandeCredit> response = restTemplate.postForEntity(
                url("/clients/99999/demandes"), demande, DemandeCredit.class);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void evaluerCredit_moteurIaIndisponible_degradeProprement() {
        // Aucun ai-service ne tourne pendant ces tests : ScoringService doit
        // échouer sans exception non gérée, et la demande doit malgré tout être
        // enregistrée avec le statut ERREUR_IA - pas de perte du dossier, pas
        // de 500 (cf. mode dégradé retiré côté ai-service/main.py : ici c'est
        // le symétrique côté backend, on n'invente pas non plus de décision).
        Long clientId = creerClientEtRecupererId();
        DemandeCredit demande = demandeValide();

        ResponseEntity<DemandeCredit> response = restTemplate.postForEntity(
                url("/clients/" + clientId + "/demandes"), demande, DemandeCredit.class);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("ERREUR_IA", response.getBody().getStatut());
        assertEquals(1, demandeCreditRepository.count(), "Le dossier doit être conservé même si l'IA est indisponible");
    }

    // =====================================================================
    // Tableau de bord
    // =====================================================================

    @Test
    void getStats_renvoieDesCompteursCoherents() {
        creerClientEtRecupererId();

        ResponseEntity<Map> response = restTemplate.getForEntity(url("/dashboard/stats"), Map.class);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, ((Number) response.getBody().get("totalClients")).intValue());
        assertEquals(0, ((Number) response.getBody().get("totalDemandes")).intValue());
    }
}
