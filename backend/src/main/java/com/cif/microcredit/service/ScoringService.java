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
 * ScoringService - pont entre le backend Spring Boot et le moteur IA Python.
 *
 * Envoie les 56 variables BRUTES du dossier (profil client + relation
 * coopérative + historique interne + Mobile Money enrichi + comptes bancaires
 * + BIC + demande de crédit). Le service Python recalcule lui-même les 5
 * variables dérivées (indice de vulnérabilité, échéance d'annuité, ratios) et
 * renvoie : probabilité de défaut, zone de décision, score scorecard, perte
 * attendue et explication SHAP.
 */
@Service
public class ScoringService {

    private static final Logger logger = LoggerFactory.getLogger(ScoringService.class);
    private static final Duration TIMEOUT_CONNEXION = Duration.ofSeconds(5);
    private static final Duration TIMEOUT_REPONSE = Duration.ofSeconds(20);

    private final RestClient restClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ScoringService(@Value("${AI_SERVICE_URL:http://localhost:8000/api/score}") String aiServiceUrl) {
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

    private static int bit(boolean b) { return b ? 1 : 0; }

    private static String orDefault(String v, String def) {
        return (v == null || v.isBlank()) ? def : v;
    }

    public ScoringResult calculerScore(DemandeCredit demande) {
        Client client = demande.getClient();
        Map<String, Object> r = new HashMap<>();

        // --- Profil socio-démographique (porté par le client) ---
        r.put("age", client.getAge() >= 18 ? client.getAge() : 30);
        r.put("sexe", orDefault(client.getSexe(), "Femme"));
        r.put("zone", orDefault(client.getZone(), "Semi-urbaine"));
        r.put("situation_matrimoniale", orDefault(client.getSituationMatrimoniale(), "Marié(e)"));
        r.put("niveau_education", orDefault(client.getNiveauEducation(), "Primaire"));
        r.put("nombre_personnes_a_charge", client.getNombrePersonnesACharge());

        // --- Activité économique ---
        r.put("secteur_activite", orDefault(client.getSecteurActivite(), "Commerce informel"));
        r.put("sous_secteur_activite", orDefault(demande.getSousSecteurActivite(), "Non applicable"));
        r.put("saisonnalite_activite", bit(demande.isSaisonaliteActivite()));
        r.put("anciennete_activite_annees", client.getAncienneteActiviteAnnees());
        r.put("revenu_mensuel_fcfa", demande.getRevenuMensuelFcfa());
        r.put("charges_mensuelles_fcfa", demande.getChargesMensuellesFcfa());

        // --- Relation avec la coopérative ---
        r.put("anciennete_cooperative_mois", demande.getAncienneteCooperativeMois());
        r.put("membre_groupe_solidaire", bit(demande.isMembreGroupeSolidaire()));
        r.put("epargne_solde_moyen_fcfa", demande.getEpargneSoldeMoyenFcfa());
        r.put("regularite_epargne", orDefault(demande.getRegulariteEpargne(), "Aucune épargne"));

        // --- Historique de crédit interne CIF ---
        r.put("nombre_credits_anterieurs", demande.getNombreCreditsAnterieurs());
        r.put("taux_remboursement_historique_pct", demande.getTauxRemboursementHistoriquePct());
        r.put("jours_retard_moyen_historique", demande.getJoursRetardMoyenHistorique());
        r.put("montant_total_emprunte_passe", demande.getMontantTotalEmprunteFcfa());
        r.put("delai_utilisation_credit_apres_deblocage_jours", demande.getDelaiUtilisationCreditJours());

        // --- Agrégats de transactions ---
        r.put("total_transactions", demande.getTotalTransactions());
        r.put("volume_depots_fcfa", demande.getVolumeDepotsFcfa());
        r.put("volume_retraits_fcfa", demande.getVolumeRetraitsFcfa());
        r.put("tx_mobile_money", demande.getTxMobileMoney());

        // --- Mobile Money (enrichi) ---
        r.put("possede_mobile_money", bit(demande.isPossedeMobileMoney()));
        r.put("frequence_transactions_mm_mois", demande.getFrequenceTransactionsMmMois());
        r.put("mm_anciennete_compte_mois", demande.getMmAncienneteCompteMois());
        r.put("mm_anciennete_sim_mois", demande.getMmAncienneteSimMois());
        r.put("mm_nombre_mois_actifs_12m", demande.getMmNombreMoisActifs12m());
        r.put("mm_volume_transactions_mensuel_fcfa", demande.getMmVolumeTransactionsMensuelFcfa());
        r.put("mm_flux_entrants_mensuel_fcfa", demande.getMmFluxEntrantsMensuelFcfa());
        r.put("mm_flux_sortants_mensuel_fcfa", demande.getMmFluxSortantsMensuelFcfa());
        r.put("mm_montant_remboursements_mm_fcfa", demande.getMmMontantRemboursementsMmFcfa());
        r.put("mm_solde_moyen_fcfa", demande.getMmSoldeMoyenFcfa());
        r.put("mm_solde_minimum_fcfa", demande.getMmSoldeMinimumFcfa());
        r.put("mm_evolution_solde_pct", demande.getMmEvolutionSoldePct());
        r.put("mm_volatilite_flux_pct", demande.getMmVolatiliteFluxPct());
        r.put("mm_ratio_depenses_credit_appel_data_pct", demande.getMmRatioDepensesCreditAppelDataPct());

        // --- Comptes bancaires classiques ---
        r.put("nombre_comptes_bancaires", demande.getNombreComptesBancaires());
        r.put("type_compte_principal", orDefault(demande.getTypeComptePrincipal(), "Aucun"));
        r.put("solde_compte_bancaire_fcfa", demande.getSoldeCompteBancaireFcfa());
        r.put("flux_depots_bancaires_mensuel_fcfa", demande.getFluxDepotsBancairesMensuelFcfa());
        r.put("flux_retraits_bancaires_mensuel_fcfa", demande.getFluxRetraitsBancairesMensuelFcfa());
        r.put("nombre_rejets_prelevements_cheques_12m", demande.getNombreRejetsPrelevementsCheques12m());

        // --- Bureau d'Information sur le Crédit (BIC) ---
        r.put("interroge_bic", bit(demande.isInterrogeBic()));
        r.put("statut_bic", orDefault(demande.getStatutBic(), "Non consulté"));
        r.put("nombre_prets_actifs_autres_institutions", demande.getNombrePretsActifsAutresInstitutions());
        r.put("encours_credit_autres_institutions_fcfa", demande.getEncoursCreditAutresInstitutionsFcfa());
        r.put("bic_nombre_credits_soldes_ailleurs", demande.getBicNombreCreditsSoldesAilleurs());
        r.put("bic_anciennete_dernier_incident_mois", demande.getBicAncienneteDernierIncidentMois());

        // --- Demande de crédit ---
        r.put("categorie_credit", orDefault(demande.getCategorieCredit(), "Crédit commerce - fonds de roulement"));
        r.put("objet_credit", orDefault(demande.getObjetCredit(), "Fonds de roulement"));
        r.put("montant_credit_demande_fcfa", demande.getMontantDemandeFcfa());
        r.put("duree_credit_mois", demande.getDureeMois());
        r.put("taux_interet_nominal_annuel_pct",
                demande.getTauxInteretNominalAnnuelPct() != null ? demande.getTauxInteretNominalAnnuelPct() : 14.0);
        r.put("garantie", orDefault(demande.getGarantie(), "Aucune"));

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> body = restClient.post()
                    .body(r)
                    .retrieve()
                    .body(Map.class);

            if (body == null) {
                logger.warn("Moteur IA : réponse vide pour le client {}", client.getId());
                return null;
            }

            String explicationJson = null;
            Object explication = body.get("explication");
            if (explication != null) {
                explicationJson = objectMapper.writeValueAsString(explication);
            }

            return new ScoringResult(
                    toDouble(body.get("score_risque")),
                    toDouble(body.get("proba_defaut")),
                    (String) body.get("zone_decision"),
                    body.get("score_credit") != null ? Integer.valueOf(body.get("score_credit").toString()) : null,
                    toDouble(body.get("perte_attendue_fcfa")),
                    toDouble(body.get("ratio_endettement")),
                    toDouble(body.get("ratio_reste_a_vivre_absolu_fcfa")),
                    toDouble(body.get("future_echeance_credit_fcfa")),
                    explicationJson,
                    (String) body.get("note_decision"));

        } catch (RestClientException e) {
            logger.error("Appel au moteur IA échoué ({}) pour le client {}", e.getMessage(), client.getId());
            return null;
        } catch (Exception e) {
            logger.error("Erreur inattendue lors du traitement de la réponse du moteur IA (client {})",
                    client.getId(), e);
            return null;
        }
    }

    private Double toDouble(Object o) {
        return o != null ? Double.valueOf(o.toString()) : null;
    }
}
