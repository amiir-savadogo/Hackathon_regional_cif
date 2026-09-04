package com.cif.microcredit.service;

import com.cif.microcredit.model.Client;
import com.cif.microcredit.model.DemandeCredit;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * ScoringService - fait le pont entre le backend Spring Boot et le moteur IA Python.
 *
 * Envoie l'intégralité des variables du dossier (profil du client + relation
 * avec la coopérative + historique + Mobile Money + BIC + demande de crédit)
 * et récupère le résultat complet du modèle : probabilité de défaut, zone de
 * décision, score scorecard (300-900), perte attendue (Expected Loss) et
 * explication SHAP des facteurs les plus influents.
 *
 * Utilise RestClient (successeur de RestTemplate depuis Spring 6.1) avec des
 * timeouts explicites : sans eux, un moteur IA qui ne répond plus (cold start
 * Render, surcharge...) bloquerait indéfiniment la requête HTTP entrante côté
 * agent, au lieu d'échouer proprement en quelques secondes.
 */
@Service
public class ScoringService {

    private static final Logger logger = LoggerFactory.getLogger(ScoringService.class);
    private static final Duration TIMEOUT_CONNEXION = Duration.ofSeconds(5);
    // Généreux car Render (offre gratuite) peut avoir un "cold start" du service
    // Python de plusieurs secondes après une période d'inactivité.
    private static final Duration TIMEOUT_REPONSE = Duration.ofSeconds(20);

    private final RestClient restClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ScoringService(@Value("${AI_SERVICE_URL:http://localhost:8000/api/score}") String aiServiceUrl) {
        // JDK HttpClient : disponible nativement depuis Java 11, aucune dépendance
        // supplémentaire à ajouter au pom.xml (contrairement à Apache HttpClient 5).
        HttpClient jdkHttpClient = HttpClient.newBuilder()
                .connectTimeout(TIMEOUT_CONNEXION)
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(jdkHttpClient);
        requestFactory.setReadTimeout(TIMEOUT_REPONSE);

        this.restClient = RestClient.builder()
                .baseUrl(aiServiceUrl)
                .requestFactory(requestFactory)
                .build();
    }

    @SuppressWarnings("unchecked")
    public ScoringResult calculerScore(DemandeCredit demande) {
        Client client = demande.getClient();
        Map<String, Object> request = new HashMap<>();

        // Profil socio-démographique
        request.put("age", client.getAge());
        request.put("sexe", client.getSexe());
        request.put("zone", client.getZone());
        request.put("situation_matrimoniale", client.getSituationMatrimoniale());
        request.put("niveau_education", client.getNiveauEducation());
        request.put("nombre_personnes_a_charge", client.getNombrePersonnesACharge());

        // Activité économique
        request.put("secteur_activite", client.getSecteurActivite());
        request.put("anciennete_activite_annees", client.getAncienneteActiviteAnnees());
        request.put("revenu_mensuel_fcfa", demande.getRevenuMensuelFcfa());
        request.put("charges_mensuelles_fcfa", demande.getChargesMensuellesFcfa());

        // Relation avec la coopérative
        request.put("anciennete_cooperative_mois", demande.getAncienneteCooperativeMois());
        request.put("membre_groupe_solidaire", demande.isMembreGroupeSolidaire());
        request.put("epargne_solde_moyen_fcfa", demande.getEpargneSoldeMoyenFcfa());
        request.put("regularite_epargne", demande.getRegulariteEpargne());

        // Historique de crédit interne
        request.put("nombre_credits_anterieurs", demande.getNombreCreditsAnterieurs());
        request.put("taux_remboursement_historique_pct", demande.getTauxRemboursementHistoriquePct());
        request.put("jours_retard_moyen_historique", demande.getJoursRetardMoyenHistorique());

        // Mobile Money
        request.put("possede_mobile_money", demande.isPossedeMobileMoney());
        request.put("frequence_transactions_mm_mois", demande.getFrequenceTransactionsMmMois());

        // Bureau d'Information sur le Crédit (BIC)
        request.put("interroge_bic", demande.isInterrogeBic());
        request.put("statut_bic", demande.getStatutBic() != null ? demande.getStatutBic() : "Non consulté");
        request.put("nombre_prets_actifs_autres_institutions", demande.getNombrePretsActifsAutresInstitutions());
        request.put("encours_credit_autres_institutions_fcfa", demande.getEncoursCreditAutresInstitutionsFcfa());

        // Demande de crédit
        request.put("objet_credit", demande.getObjetCredit());
        request.put("montant_credit_demande_fcfa", demande.getMontantDemandeFcfa());
        request.put("duree_credit_mois", demande.getDureeMois());
        request.put("garantie", demande.getGarantie());

        try {
            Map<String, Object> body = restClient.post()
                    .body(request)
                    .retrieve()
                    .body(Map.class);

            if (body == null) {
                logger.warn("Le moteur IA a répondu sans corps exploitable pour le client {}", client.getId());
                return null;
            }

            Double scoreRisque = toDouble(body.get("score_risque"));
            Double probaDefaut = toDouble(body.get("proba_defaut"));
            String zoneDecision = (String) body.get("zone_decision");
            Integer scoreCredit = body.get("score_credit") != null
                    ? Integer.valueOf(body.get("score_credit").toString()) : null;
            Double perteAttendue = toDouble(body.get("perte_attendue_fcfa"));
            Double ratioEndettement = toDouble(body.get("ratio_endettement"));

            String explicationJson = null;
            Object explication = body.get("explication");
            if (explication != null) {
                explicationJson = objectMapper.writeValueAsString(explication);
            }

            return new ScoringResult(scoreRisque, probaDefaut, zoneDecision, scoreCredit,
                    perteAttendue, ratioEndettement, explicationJson);
        } catch (RestClientException e) {
            // Moteur IA indisponible, timeout, ou erreur HTTP (ex. 503 si ses artefacts
            // ne sont pas chargés, cf. ai-service/main.py) : on ne bloque pas l'agent, la
            // demande est enregistrée avec statut ERREUR_IA (cf. ClientController) plutôt
            // que de planter la requête entrante.
            logger.error("Appel au moteur IA échoué ({}) pour le client {}", e.getMessage(), client.getId());
            return null;
        } catch (Exception e) {
            logger.error("Erreur inattendue lors du traitement de la réponse du moteur IA pour le client {}",
                    client.getId(), e);
            return null;
        }
    }

    private Double toDouble(Object o) {
        return o != null ? Double.valueOf(o.toString()) : null;
    }
}
