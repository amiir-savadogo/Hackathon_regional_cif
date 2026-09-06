package com.cif.microcredit.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Entité DemandeCredit - une demande de prêt soumise par un client.
 *
 * Porte l'intégralité des variables BRUTES du moteur de scoring
 * (cf. scripts/01_generate_dataset.py -> COLONNES_MODELE, 58 variables brutes ;
 * les 5 dérivées - indice de vulnérabilité, échéance, ratios - sont recalculées
 * par ai-service/main.py). Le résultat du modèle est également stocké pour
 * garder la trace du dossier tel qu'il a été évalué.
 */
@Entity
@Table(name = "demandes_credit")
public class DemandeCredit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Client client;

    // --- Activité (contexte figé au moment du scoring) ---
    private String sousSecteurActivite;          // "Non applicable" hors salarié formel
    private boolean saisonaliteActivite;

    // --- Données financières de base ---
    @Positive(message = "Le revenu mensuel doit être strictement positif")
    private double revenuMensuelFcfa;
    @PositiveOrZero(message = "Les charges mensuelles ne peuvent pas être négatives")
    private double chargesMensuellesFcfa;

    // --- Relation avec la coopérative ---
    @PositiveOrZero
    private int ancienneteCooperativeMois;
    private boolean membreGroupeSolidaire;
    @PositiveOrZero(message = "Le solde d'épargne ne peut pas être négatif")
    private double epargneSoldeMoyenFcfa;
    private String regulariteEpargne;            // Régulière | Irrégulière | Aucune épargne

    // --- Historique de crédit interne CIF ---
    @PositiveOrZero
    private int nombreCreditsAnterieurs;
    @DecimalMin(value = "0.0") @DecimalMax(value = "100.0")
    private Double tauxRemboursementHistoriquePct;   // null si nouveau client
    @PositiveOrZero
    private Double joursRetardMoyenHistorique;       // null si nouveau client
    @PositiveOrZero
    private double montantTotalEmprunteFcfa;
    @PositiveOrZero
    private Double delaiUtilisationCreditJours;      // null si nouveau client

    // --- Agrégats de transactions (vue consolidée CIF) ---
    @PositiveOrZero
    private int totalTransactions;
    @PositiveOrZero
    private double volumeDepotsFcfa;
    @PositiveOrZero
    private double volumeRetraitsFcfa;
    @PositiveOrZero
    private int txMobileMoney;

    // --- Mobile Money (enrichi) ---
    private boolean possedeMobileMoney;
    @PositiveOrZero
    private int frequenceTransactionsMmMois;
    private Double mmAncienneteCompteMois;
    private Double mmAncienneteSimMois;
    private Double mmNombreMoisActifs12m;
    @PositiveOrZero
    private double mmVolumeTransactionsMensuelFcfa;
    @PositiveOrZero
    private double mmFluxEntrantsMensuelFcfa;
    @PositiveOrZero
    private double mmFluxSortantsMensuelFcfa;
    @PositiveOrZero
    private double mmMontantRemboursementsMmFcfa;
    @PositiveOrZero
    private double mmSoldeMoyenFcfa;
    @PositiveOrZero
    private double mmSoldeMinimumFcfa;
    private Double mmEvolutionSoldePct;
    private Double mmVolatiliteFluxPct;
    private Double mmRatioDepensesCreditAppelDataPct;

    // --- Comptes bancaires classiques ---
    @PositiveOrZero
    private int nombreComptesBancaires;
    private String typeComptePrincipal;          // "Aucun" | Épargne | Courant | Dépôt à terme
    @PositiveOrZero
    private double soldeCompteBancaireFcfa;
    @PositiveOrZero
    private double fluxDepotsBancairesMensuelFcfa;
    @PositiveOrZero
    private double fluxRetraitsBancairesMensuelFcfa;
    @PositiveOrZero
    private int nombreRejetsPrelevementsCheques12m;

    // --- Bureau d'Information sur le Crédit (BIC, enrichi) ---
    private boolean interrogeBic;
    private String statutBic;                    // "Non consulté" par défaut
    @PositiveOrZero
    private int nombrePretsActifsAutresInstitutions;
    @PositiveOrZero
    private double encoursCreditAutresInstitutionsFcfa;
    private Double bicNombreCreditsSoldesAilleurs;
    private Double bicAncienneteDernierIncidentMois;

    // --- Demande de crédit proprement dite ---
    private String categorieCredit;             // catégorie du catalogue produits

    @NotBlank(message = "L'objet du crédit est obligatoire")
    private String objetCredit;

    @Positive(message = "Le montant demandé doit être strictement positif")
    private double montantDemandeFcfa;

    @Min(value = 1, message = "La durée doit être d'au moins 1 mois")
    @Max(value = 60, message = "La durée ne peut pas dépasser 60 mois")
    private int dureeMois;

    @Positive
    private Double tauxInteretNominalAnnuelPct;

    @NotBlank(message = "Le type de garantie est obligatoire")
    private String garantie;

    // --- Résultat du moteur IA ---
    private Double scoreRisque;              // proba de défaut en % (0-100)
    private Double probaDefaut;             // proba de défaut brute (0-1)
    private String zoneDecision;            // ACCORD_FAVORABLE | A_EXAMINER | RISQUE_ELEVE
    private Integer scoreCredit;            // score de solvabilité 0-100 (100 = meilleur)
    private Double perteAttendueFcfa;       // Expected Loss = PD x LGD x EAD
    private Double ratioEndettement;
    private Double ratioResteAVivreFcfa;
    private Double futureEcheanceCreditFcfa;
    @Column(columnDefinition = "TEXT")
    private String explicationJson;         // top facteurs SHAP, sérialisés en JSON
    @Column(columnDefinition = "TEXT")
    private String noteDecision;            // règle métier ayant modifié la zone, le cas échéant

    private String statut;                  // APPROUVE | REJETE | A_L_ETUDE | ERREUR_IA

    private LocalDateTime dateCreation;

    // --- Appréciation de l'agent (INFORMATIF : n'entre pas dans le score) ---
    private String avisAgent;              // FAVORABLE | FAVORABLE_SOUS_RESERVE | RESERVE | DEFAVORABLE
    @Column(columnDefinition = "TEXT")
    private String avisAgentCommentaire;
    @Column(columnDefinition = "TEXT")
    private String avisAgentMotifs;        // motifs cochés, séparés par des virgules
    private LocalDateTime avisAgentDate;

    // --- Corbeille (suppression logique) ---
    private boolean supprime = false;
    private LocalDateTime dateSuppression;
    private String supprimePar;             // matricule / nom de l'agent, pour la traçabilité

    @PrePersist
    protected void onCreate() {
        this.dateCreation = LocalDateTime.now();
    }

    // --- Getters et Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Client getClient() { return client; }
    public void setClient(Client client) { this.client = client; }

    public String getSousSecteurActivite() { return sousSecteurActivite; }
    public void setSousSecteurActivite(String v) { this.sousSecteurActivite = v; }

    public boolean isSaisonaliteActivite() { return saisonaliteActivite; }
    public void setSaisonaliteActivite(boolean v) { this.saisonaliteActivite = v; }

    public double getRevenuMensuelFcfa() { return revenuMensuelFcfa; }
    public void setRevenuMensuelFcfa(double v) { this.revenuMensuelFcfa = v; }

    public double getChargesMensuellesFcfa() { return chargesMensuellesFcfa; }
    public void setChargesMensuellesFcfa(double v) { this.chargesMensuellesFcfa = v; }

    public int getAncienneteCooperativeMois() { return ancienneteCooperativeMois; }
    public void setAncienneteCooperativeMois(int v) { this.ancienneteCooperativeMois = v; }

    public boolean isMembreGroupeSolidaire() { return membreGroupeSolidaire; }
    public void setMembreGroupeSolidaire(boolean v) { this.membreGroupeSolidaire = v; }

    public double getEpargneSoldeMoyenFcfa() { return epargneSoldeMoyenFcfa; }
    public void setEpargneSoldeMoyenFcfa(double v) { this.epargneSoldeMoyenFcfa = v; }

    public String getRegulariteEpargne() { return regulariteEpargne; }
    public void setRegulariteEpargne(String v) { this.regulariteEpargne = v; }

    public int getNombreCreditsAnterieurs() { return nombreCreditsAnterieurs; }
    public void setNombreCreditsAnterieurs(int v) { this.nombreCreditsAnterieurs = v; }

    public Double getTauxRemboursementHistoriquePct() { return tauxRemboursementHistoriquePct; }
    public void setTauxRemboursementHistoriquePct(Double v) { this.tauxRemboursementHistoriquePct = v; }

    public Double getJoursRetardMoyenHistorique() { return joursRetardMoyenHistorique; }
    public void setJoursRetardMoyenHistorique(Double v) { this.joursRetardMoyenHistorique = v; }

    public double getMontantTotalEmprunteFcfa() { return montantTotalEmprunteFcfa; }
    public void setMontantTotalEmprunteFcfa(double v) { this.montantTotalEmprunteFcfa = v; }

    public Double getDelaiUtilisationCreditJours() { return delaiUtilisationCreditJours; }
    public void setDelaiUtilisationCreditJours(Double v) { this.delaiUtilisationCreditJours = v; }

    public int getTotalTransactions() { return totalTransactions; }
    public void setTotalTransactions(int v) { this.totalTransactions = v; }

    public double getVolumeDepotsFcfa() { return volumeDepotsFcfa; }
    public void setVolumeDepotsFcfa(double v) { this.volumeDepotsFcfa = v; }

    public double getVolumeRetraitsFcfa() { return volumeRetraitsFcfa; }
    public void setVolumeRetraitsFcfa(double v) { this.volumeRetraitsFcfa = v; }

    public int getTxMobileMoney() { return txMobileMoney; }
    public void setTxMobileMoney(int v) { this.txMobileMoney = v; }

    public boolean isPossedeMobileMoney() { return possedeMobileMoney; }
    public void setPossedeMobileMoney(boolean v) { this.possedeMobileMoney = v; }

    public int getFrequenceTransactionsMmMois() { return frequenceTransactionsMmMois; }
    public void setFrequenceTransactionsMmMois(int v) { this.frequenceTransactionsMmMois = v; }

    public Double getMmAncienneteCompteMois() { return mmAncienneteCompteMois; }
    public void setMmAncienneteCompteMois(Double v) { this.mmAncienneteCompteMois = v; }

    public Double getMmAncienneteSimMois() { return mmAncienneteSimMois; }
    public void setMmAncienneteSimMois(Double v) { this.mmAncienneteSimMois = v; }

    public Double getMmNombreMoisActifs12m() { return mmNombreMoisActifs12m; }
    public void setMmNombreMoisActifs12m(Double v) { this.mmNombreMoisActifs12m = v; }

    public double getMmVolumeTransactionsMensuelFcfa() { return mmVolumeTransactionsMensuelFcfa; }
    public void setMmVolumeTransactionsMensuelFcfa(double v) { this.mmVolumeTransactionsMensuelFcfa = v; }

    public double getMmFluxEntrantsMensuelFcfa() { return mmFluxEntrantsMensuelFcfa; }
    public void setMmFluxEntrantsMensuelFcfa(double v) { this.mmFluxEntrantsMensuelFcfa = v; }

    public double getMmFluxSortantsMensuelFcfa() { return mmFluxSortantsMensuelFcfa; }
    public void setMmFluxSortantsMensuelFcfa(double v) { this.mmFluxSortantsMensuelFcfa = v; }

    public double getMmMontantRemboursementsMmFcfa() { return mmMontantRemboursementsMmFcfa; }
    public void setMmMontantRemboursementsMmFcfa(double v) { this.mmMontantRemboursementsMmFcfa = v; }

    public double getMmSoldeMoyenFcfa() { return mmSoldeMoyenFcfa; }
    public void setMmSoldeMoyenFcfa(double v) { this.mmSoldeMoyenFcfa = v; }

    public double getMmSoldeMinimumFcfa() { return mmSoldeMinimumFcfa; }
    public void setMmSoldeMinimumFcfa(double v) { this.mmSoldeMinimumFcfa = v; }

    public Double getMmEvolutionSoldePct() { return mmEvolutionSoldePct; }
    public void setMmEvolutionSoldePct(Double v) { this.mmEvolutionSoldePct = v; }

    public Double getMmVolatiliteFluxPct() { return mmVolatiliteFluxPct; }
    public void setMmVolatiliteFluxPct(Double v) { this.mmVolatiliteFluxPct = v; }

    public Double getMmRatioDepensesCreditAppelDataPct() { return mmRatioDepensesCreditAppelDataPct; }
    public void setMmRatioDepensesCreditAppelDataPct(Double v) { this.mmRatioDepensesCreditAppelDataPct = v; }

    public int getNombreComptesBancaires() { return nombreComptesBancaires; }
    public void setNombreComptesBancaires(int v) { this.nombreComptesBancaires = v; }

    public String getTypeComptePrincipal() { return typeComptePrincipal; }
    public void setTypeComptePrincipal(String v) { this.typeComptePrincipal = v; }

    public double getSoldeCompteBancaireFcfa() { return soldeCompteBancaireFcfa; }
    public void setSoldeCompteBancaireFcfa(double v) { this.soldeCompteBancaireFcfa = v; }

    public double getFluxDepotsBancairesMensuelFcfa() { return fluxDepotsBancairesMensuelFcfa; }
    public void setFluxDepotsBancairesMensuelFcfa(double v) { this.fluxDepotsBancairesMensuelFcfa = v; }

    public double getFluxRetraitsBancairesMensuelFcfa() { return fluxRetraitsBancairesMensuelFcfa; }
    public void setFluxRetraitsBancairesMensuelFcfa(double v) { this.fluxRetraitsBancairesMensuelFcfa = v; }

    public int getNombreRejetsPrelevementsCheques12m() { return nombreRejetsPrelevementsCheques12m; }
    public void setNombreRejetsPrelevementsCheques12m(int v) { this.nombreRejetsPrelevementsCheques12m = v; }

    public boolean isInterrogeBic() { return interrogeBic; }
    public void setInterrogeBic(boolean v) { this.interrogeBic = v; }

    public String getStatutBic() { return statutBic; }
    public void setStatutBic(String v) { this.statutBic = v; }

    public int getNombrePretsActifsAutresInstitutions() { return nombrePretsActifsAutresInstitutions; }
    public void setNombrePretsActifsAutresInstitutions(int v) { this.nombrePretsActifsAutresInstitutions = v; }

    public double getEncoursCreditAutresInstitutionsFcfa() { return encoursCreditAutresInstitutionsFcfa; }
    public void setEncoursCreditAutresInstitutionsFcfa(double v) { this.encoursCreditAutresInstitutionsFcfa = v; }

    public Double getBicNombreCreditsSoldesAilleurs() { return bicNombreCreditsSoldesAilleurs; }
    public void setBicNombreCreditsSoldesAilleurs(Double v) { this.bicNombreCreditsSoldesAilleurs = v; }

    public Double getBicAncienneteDernierIncidentMois() { return bicAncienneteDernierIncidentMois; }
    public void setBicAncienneteDernierIncidentMois(Double v) { this.bicAncienneteDernierIncidentMois = v; }

    public String getCategorieCredit() { return categorieCredit; }
    public void setCategorieCredit(String v) { this.categorieCredit = v; }

    public String getObjetCredit() { return objetCredit; }
    public void setObjetCredit(String v) { this.objetCredit = v; }

    public double getMontantDemandeFcfa() { return montantDemandeFcfa; }
    public void setMontantDemandeFcfa(double v) { this.montantDemandeFcfa = v; }

    public int getDureeMois() { return dureeMois; }
    public void setDureeMois(int v) { this.dureeMois = v; }

    public Double getTauxInteretNominalAnnuelPct() { return tauxInteretNominalAnnuelPct; }
    public void setTauxInteretNominalAnnuelPct(Double v) { this.tauxInteretNominalAnnuelPct = v; }

    public String getGarantie() { return garantie; }
    public void setGarantie(String v) { this.garantie = v; }

    public Double getScoreRisque() { return scoreRisque; }
    public void setScoreRisque(Double v) { this.scoreRisque = v; }

    public Double getProbaDefaut() { return probaDefaut; }
    public void setProbaDefaut(Double v) { this.probaDefaut = v; }

    public String getZoneDecision() { return zoneDecision; }
    public void setZoneDecision(String v) { this.zoneDecision = v; }

    public Integer getScoreCredit() { return scoreCredit; }
    public void setScoreCredit(Integer v) { this.scoreCredit = v; }

    public Double getPerteAttendueFcfa() { return perteAttendueFcfa; }
    public void setPerteAttendueFcfa(Double v) { this.perteAttendueFcfa = v; }

    public Double getRatioEndettement() { return ratioEndettement; }
    public void setRatioEndettement(Double v) { this.ratioEndettement = v; }

    public Double getRatioResteAVivreFcfa() { return ratioResteAVivreFcfa; }
    public void setRatioResteAVivreFcfa(Double v) { this.ratioResteAVivreFcfa = v; }

    public Double getFutureEcheanceCreditFcfa() { return futureEcheanceCreditFcfa; }
    public void setFutureEcheanceCreditFcfa(Double v) { this.futureEcheanceCreditFcfa = v; }

    public String getExplicationJson() { return explicationJson; }
    public void setExplicationJson(String v) { this.explicationJson = v; }

    public String getNoteDecision() { return noteDecision; }
    public void setNoteDecision(String v) { this.noteDecision = v; }

    public String getStatut() { return statut; }
    public void setStatut(String v) { this.statut = v; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime v) { this.dateCreation = v; }

    public String getAvisAgent() { return avisAgent; }
    public void setAvisAgent(String v) { this.avisAgent = v; }

    public String getAvisAgentCommentaire() { return avisAgentCommentaire; }
    public void setAvisAgentCommentaire(String v) { this.avisAgentCommentaire = v; }

    public String getAvisAgentMotifs() { return avisAgentMotifs; }
    public void setAvisAgentMotifs(String v) { this.avisAgentMotifs = v; }

    public LocalDateTime getAvisAgentDate() { return avisAgentDate; }
    public void setAvisAgentDate(LocalDateTime v) { this.avisAgentDate = v; }

    public boolean isSupprime() { return supprime; }
    public void setSupprime(boolean v) { this.supprime = v; }

    public LocalDateTime getDateSuppression() { return dateSuppression; }
    public void setDateSuppression(LocalDateTime v) { this.dateSuppression = v; }

    public String getSupprimePar() { return supprimePar; }
    public void setSupprimePar(String v) { this.supprimePar = v; }
}
