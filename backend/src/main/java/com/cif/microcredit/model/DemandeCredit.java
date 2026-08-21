package com.cif.microcredit.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Entité DemandeCredit - représente une demande de prêt soumise par un client.
 * Elle contient les données financières nécessaires au calcul du score
 * ainsi que la décision de l'IA et de l'agent.
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

    // Données financières pour le scoring IA
    private double revenuMensuelFcfa;
    private double chargesMensuellesFcfa;
    private double montantDemandeFcfa;
    private int dureeMois;

    // Résultat du modèle IA XGBoost
    private Double scoreRisque;

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

    public double getMontantDemandeFcfa() { return montantDemandeFcfa; }
    public void setMontantDemandeFcfa(double montantDemandeFcfa) { this.montantDemandeFcfa = montantDemandeFcfa; }

    public int getDureeMois() { return dureeMois; }
    public void setDureeMois(int dureeMois) { this.dureeMois = dureeMois; }

    public Double getScoreRisque() { return scoreRisque; }
    public void setScoreRisque(Double scoreRisque) { this.scoreRisque = scoreRisque; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }
}
