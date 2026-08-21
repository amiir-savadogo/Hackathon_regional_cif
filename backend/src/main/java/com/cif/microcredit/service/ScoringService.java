package com.cif.microcredit.service;

import com.cif.microcredit.model.DemandeCredit;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.HashMap;

/**
 * ScoringService — fait le pont entre le backend Spring Boot et le moteur IA Python.
 * Envoie les données financières du client via HTTP et retourne la probabilité de défaut.
 */
import org.springframework.beans.factory.annotation.Value;

@Service
public class ScoringService {

    private final RestTemplate restTemplate = new RestTemplate();
    
    @Value("${AI_SERVICE_URL:http://localhost:8000/api/score}")
    private String aiServiceUrl;

    public Double calculateScore(DemandeCredit demande) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("age", demande.getClient().getAge());
            request.put("revenu_mensuel_fcfa", demande.getRevenuMensuelFcfa());
            request.put("charges_mensuelles_fcfa", demande.getChargesMensuellesFcfa());
            request.put("anciennete_activite_annees", demande.getClient().getAncienneteActiviteAnnees());

            ResponseEntity<Map> response = restTemplate.postForEntity(aiServiceUrl, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Object score = response.getBody().get("score_risque");
                return Double.valueOf(score.toString());
            }
        } catch (Exception e) {
            System.err.println("Erreur lors de l'appel au moteur IA : " + e.getMessage());
        }
        return null;
    }
}
