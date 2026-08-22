package com.cif.microcredit.controller;

import com.cif.microcredit.model.Client;
import com.cif.microcredit.model.DemandeCredit;
import com.cif.microcredit.repository.ClientRepository;
import com.cif.microcredit.repository.DemandeCreditRepository;
import com.cif.microcredit.service.ScoringResult;
import com.cif.microcredit.service.ScoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * ClientController - expose les endpoints REST pour la gestion
 * des clients et de leurs demandes de crédit.
 *
 * Routes disponibles :
 *   GET    /api/clients              -> Liste tous les clients
 *   POST   /api/clients              -> Crée un nouveau profil client
 *   GET    /api/clients/{id}         -> Détail d'un client avec ses demandes
 *   POST   /api/clients/{id}/demandes -> Soumet une nouvelle demande de crédit pour un client
 *   GET    /api/clients/{id}/demandes -> Historique des demandes d'un client
 *   GET    /api/dashboard/stats      -> Statistiques pour le tableau de bord
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ClientController {

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private DemandeCreditRepository demandeCreditRepository;

    @Autowired
    private ScoringService scoringService;

    // =====================================================================
    // GESTION DES CLIENTS
    // =====================================================================

    @GetMapping("/clients")
    public ResponseEntity<List<Client>> getAllClients() {
        return ResponseEntity.ok(clientRepository.findAll());
    }

    @PostMapping("/clients")
    public ResponseEntity<?> createClient(@RequestBody Client client) {
        // Contrôle anti-doublon basé sur le nom et le prénom
        boolean exists = clientRepository.findAll().stream()
                .anyMatch(c -> c.getNom().equalsIgnoreCase(client.getNom()) && 
                               c.getPrenom().equalsIgnoreCase(client.getPrenom()));
                               
        if (exists) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(java.util.Map.of("erreur", "Un client avec ce nom et prénom existe déjà dans la base."));
        }

        Client savedClient = clientRepository.save(client);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedClient);
    }

    @GetMapping("/clients/{id}")
    public ResponseEntity<Client> getClientById(@PathVariable Long id) {
        Optional<Client> client = clientRepository.findById(id);
        return client.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    // =====================================================================
    // GESTION DES DEMANDES DE CRÉDIT
    // =====================================================================

    @GetMapping("/clients/{clientId}/demandes")
    public ResponseEntity<List<DemandeCredit>> getDemandes(@PathVariable Long clientId) {
        List<DemandeCredit> demandes = demandeCreditRepository.findByClientIdOrderByDateCreationDesc(clientId);
        return ResponseEntity.ok(demandes);
    }

    @PostMapping("/clients/{clientId}/demandes")
    public ResponseEntity<DemandeCredit> evaluerCredit(
            @PathVariable Long clientId,
            @RequestBody DemandeCredit demande) {

        Optional<Client> optClient = clientRepository.findById(clientId);
        if (optClient.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        demande.setClient(optClient.get());

        // Appel du moteur IA (Régression Logistique + SHAP) pour évaluer le dossier
        ScoringResult resultat = scoringService.calculerScore(demande);

        if (resultat != null) {
            demande.setScoreRisque(resultat.getScoreRisque());
            demande.setProbaDefaut(resultat.getProbaDefaut());
            demande.setZoneDecision(resultat.getZoneDecision());
            demande.setScoreCredit(resultat.getScoreCredit());
            demande.setPerteAttendueFcfa(resultat.getPerteAttendueFcfa());
            demande.setRatioEndettement(resultat.getRatioEndettement());
            demande.setExplicationJson(resultat.getExplicationJson());

            // La décision finale suit la zone à 3 niveaux calculée par l'IA
            // (le dossier reste toujours sous la responsabilité finale du comité de crédit)
            String zone = resultat.getZoneDecision();
            if ("ACCORD_FAVORABLE".equals(zone))      demande.setStatut("APPROUVE");
            else if ("RISQUE_ELEVE".equals(zone))     demande.setStatut("REJETE");
            else                                       demande.setStatut("A_L_ETUDE");
        } else {
            demande.setStatut("ERREUR_IA");
        }

        DemandeCredit saved = demandeCreditRepository.save(demande);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // =====================================================================
    // STATISTIQUES TABLEAU DE BORD
    // =====================================================================

    @GetMapping("/dashboard/stats")
    public ResponseEntity<?> getStats() {
        // Totaux : COUNT(*) exécuté directement par PostgreSQL (via Spring Data JPA),
        // aucune ligne n'est chargée côté application.
        long totalClients = clientRepository.count();
        long totalDemandes = demandeCreditRepository.count();

        // Répartition par statut : un seul GROUP BY côté base de données,
        // au lieu de rapatrier toutes les demandes puis de les filtrer en mémoire.
        long approuvees = 0, rejetees = 0, enEtude = 0;
        for (Object[] ligne : demandeCreditRepository.countByStatutGroup()) {
            String statut = (String) ligne[0];
            long count = (Long) ligne[1];
            if ("APPROUVE".equals(statut))       approuvees = count;
            else if ("REJETE".equals(statut))    rejetees = count;
            else if ("A_L_ETUDE".equals(statut)) enEtude = count;
        }

        java.util.Map<String, Long> stats = new java.util.HashMap<>();
        stats.put("totalClients", totalClients);
        stats.put("totalDemandes", totalDemandes);
        stats.put("approuvees", approuvees);
        stats.put("rejetees", rejetees);
        stats.put("enEtude", enEtude);
        return ResponseEntity.ok(stats);
    }
}
