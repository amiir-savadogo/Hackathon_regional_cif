package com.cif.microcredit.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Entité DemandeCredit - représente une demande de prêt soumise par un client.
 *
 * Contient l'intégralité des variables utilisées par le moteur de scoring IA
 * (aligné sur le prototype de recherche Samdé) : relation avec la
 * coopérative, historique de remboursement, Mobile Money, Bureau
 * d'Information sur le Crédit (BIC), et caractéristiques de la demande.
 * Le résultat renvoyé par l'IA (probabilité de défaut, zone de décision,
 * score scorecard, perte attendue, explication SHAP) est également stocké
 * pour garder une trace du dossier tel qu'il a été évalué.
 */
@Entity
@Table(name = "demandes_credit")
public class DemandeCredit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Lien vers le client propriétaire du dossier
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Client client;

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
    private String regulariteEpargne;              // "Régulière" | "Irrégulière" | "Aucune épargne"

    // --- Historique de crédit interne ---
    @PositiveOrZero
    private int nombreCreditsAnterieurs;
    @DecimalMin(value = "0.0", message = "Taux de remboursement invalide")
    @DecimalMax(value = "100.0", message = "Taux de remboursement invalide")
    private Double tauxRemboursementHistoriquePct;  // null si nouveau client
    @PositiveOrZero(message = "Le retard moyen ne peut pas être négatif")
    private Double joursRetardMoyenHistorique;      // null si nouveau client

    // --- Mobile Money ---
    private boolean possedeMobileMoney;
    @PositiveOrZero
    private int frequenceTransactionsMmMois;

    // --- Bureau d'Information sur le Crédit (BIC - dispositif régional UEMOA) ---
    private boolean interrogeBic;
    private String statutBic;                       // "Non consulté" par défaut
    @PositiveOrZero
    private int nombrePretsActifsAutresInstitutions;
    @PositiveOrZero(message = "L'encours chez d'autres institutions ne peut pas être négatif")
    private double encoursCreditAutresInstitutionsFcfa;

    // --- Demande de crédit proprement dite ---
    @NotBlank(message = "L'objet du crédit est obligatoire")
    private String objetCredit;

    @Positive(message = "Le montant demandé doit être strictement positif")
    private double montantDemandeFcfa;

    @Min(value = 1, message = "La durée doit être d'au moins 1 mois")
    @Max(value = 60, message = "La durée ne peut pas dépasser 60 mois")
    private int dureeMois;

    @NotBlank(message = "Le type de garantie est obligatoire")
    private String garantie;                         // "Caution solidaire" | "Bien matériel" | "Aval d'un tiers" | "Aucune"

    // --- Résultat du moteur IA (Régression Logistique + SHAP) ---
    private Double scoreRisque;              // probabilité de défaut en % (0-100), compat. historique
    private Double probaDefaut;              // probabilité de défaut brute (0-1)
    private String zoneDecision;             // ACCORD_FAVORABLE | A_EXAMINER | RISQUE_ELEVE
    private Integer scoreCredit;             // score scorecard 300-900
    private Double perteAttendueFcfa;        // Expected Loss = PD x LGD x EAD
    private Double ratioEndettement;
    @Column(columnDefinition = "TEXT")
    private String explicationJson;          // top facteurs SHAP, sérialisés en JSON

    // Décision finale : APPROUVE, REJETE, A_L_ETUDE, ERREUR_IA
    private String statut;

    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        this.dateCreation = LocalDateTime.now();
    }

    // --- Getters et Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Client getClient() { return client; }
    public void setClient(Client client) { this.client = client; }

    public double getRevenuMensuelFcfa() { return revenuMensuelFcfa; }
    public void setRevenuMensuelFcfa(double revenuMensuelFcfa) { this.revenuMensuelFcfa = revenuMensuelFcfa; }

    public double getChargesMensuellesFcfa() { return chargesMensuellesFcfa; }
    public void setChargesMensuellesFcfa(double chargesMensuellesFcfa) { this.chargesMensuellesFcfa = chargesMensuellesFcfa; }

    public int getAncienneteCooperativeMois() { return ancienneteCooperativeMois; }
    public void setAncienneteCooperativeMois(int ancienneteCooperativeMois) { this.ancienneteCooperativeMois = ancienneteCooperativeMois; }

    public boolean isMembreGroupeSolidaire() { return membreGroupeSolidaire; }
    public void setMembreGroupeSolidaire(boolean membreGroupeSolidaire) { this.membreGroupeSolidaire = membreGroupeSolidaire; }

    public double getEpargneSoldeMoyenFcfa() { return epargneSoldeMoyenFcfa; }
    public void setEpargneSoldeMoyenFcfa(double epargneSoldeMoyenFcfa) { this.epargneSoldeMoyenFcfa = epargneSoldeMoyenFcfa; }

    public String getRegulariteEpargne() { return regulariteEpargne; }
    public void setRegulariteEpargne(String regulariteEpargne) { this.regulariteEpargne = regulariteEpargne; }

    public int getNombreCreditsAnterieurs() { return nombreCreditsAnterieurs; }
    public void setNombreCreditsAnterieurs(int nombreCreditsAnterieurs) { this.nombreCreditsAnterieurs = nombreCreditsAnterieurs; }

    public Double getTauxRemboursementHistoriquePct() { return tauxRemboursementHistoriquePct; }
    public void setTauxRemboursementHistoriquePct(Double tauxRemboursementHistoriquePct) { this.tauxRemboursementHistoriquePct = tauxRemboursementHistoriquePct; }

    public Double getJoursRetardMoyenHistorique() { return joursRetardMoyenHistorique; }
    public void setJoursRetardMoyenHistorique(Double joursRetardMoyenHistorique) { this.joursRetardMoyenHistorique = joursRetardMoyenHistorique; }

    public boolean isPossedeMobileMoney() { return possedeMobileMoney; }
    public void setPossedeMobileMoney(boolean possedeMobileMoney) { this.possedeMobileMoney = possedeMobileMoney; }

    public int getFrequenceTransactionsMmMois() { return frequenceTransactionsMmMois; }
    public void setFrequenceTransactionsMmMois(int frequenceTransactionsMmMois) { this.frequenceTransactionsMmMois = frequenceTransactionsMmMois; }

    public boolean isInterrogeBic() { return interrogeBic; }
    public void setInterrogeBic(boolean interrogeBic) { this.interrogeBic = interrogeBic; }

    public String getStatutBic() { return statutBic; }
    public void setStatutBic(String statutBic) { this.statutBic = statutBic; }

    public int getNombrePretsActifsAutresInstitutions() { return nombrePretsActifsAutresInstitutions; }
    public void setNombrePretsActifsAutresInstitutions(int nombrePretsActifsAutresInstitutions) { this.nombrePretsActifsAutresInstitutions = nombrePretsActifsAutresInstitutions; }

    public double getEncoursCreditAutresInstitutionsFcfa() { return encoursCreditAutresInstitutionsFcfa; }
    public void setEncoursCreditAutresInstitutionsFcfa(double encoursCreditAutresInstitutionsFcfa) { this.encoursCreditAutresInstitutionsFcfa = encoursCreditAutresInstitutionsFcfa; }

    public String getObjetCredit() { return objetCredit; }
    public void setObjetCredit(String objetCredit) { this.objetCredit = objetCredit; }

    public double getMontantDemandeFcfa() { return montantDemandeFcfa; }
    public void setMontantDemandeFcfa(double montantDemandeFcfa) { this.montantDemandeFcfa = montantDemandeFcfa; }

    public int getDureeMois() { return dureeMois; }
    public void setDureeMois(int dureeMois) { this.dureeMois = dureeMois; }

    public String getGarantie() { return garantie; }
    public void setGarantie(String garantie) { this.garantie = garantie; }

    public Double getScoreRisque() { return scoreRisque; }
    public void setScoreRisque(Double scoreRisque) { this.scoreRisque = scoreRisque; }

    public Double getProbaDefaut() { return probaDefaut; }
    public void setProbaDefaut(Double probaDefaut) { this.probaDefaut = probaDefaut; }

    public String getZoneDecision() { return zoneDecision; }
    public void setZoneDecision(String zoneDecision) { this.zoneDecision = zoneDecision; }

    public Integer getScoreCredit() { return scoreCredit; }
    public void setScoreCredit(Integer scoreCredit) { this.scoreCredit = scoreCredit; }

    public Double getPerteAttendueFcfa() { return perteAttendueFcfa; }
    public void setPerteAttendueFcfa(Double perteAttendueFcfa) { this.perteAttendueFcfa = perteAttendueFcfa; }

    public Double getRatioEndettement() { return ratioEndettement; }
    public void setRatioEndettement(Double ratioEndettement) { this.ratioEndettement = ratioEndettement; }

    public String getExplicationJson() { return explicationJson; }
    public void setExplicationJson(String explicationJson) { this.explicationJson = explicationJson; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }
}
