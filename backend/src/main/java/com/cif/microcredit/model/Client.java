package com.cif.microcredit.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * Entité Client - représente le profil de base d'un demandeur de microcrédit.
 * Séparé de la demande de crédit elle-même pour permettre
 * un historique de plusieurs dossiers par client.
 */
@Entity
@Table(name = "clients")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Informations d'identité du demandeur
    private String nom;
    private String prenom;
    private int age;
    private String telephone;
    private String secteurActivite;
    private double ancienneteActiviteAnnees;

    private LocalDateTime dateCreation;

    // Un client peut avoir plusieurs demandes de crédit dans le temps
    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<DemandeCredit> demandes = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.dateCreation = LocalDateTime.now();
    }

    // --- Getters et Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }

    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }

    public String getSecteurActivite() { return secteurActivite; }
    public void setSecteurActivite(String secteurActivite) { this.secteurActivite = secteurActivite; }

    public double getAncienneteActiviteAnnees() { return ancienneteActiviteAnnees; }
    public void setAncienneteActiviteAnnees(double ancienneteActiviteAnnees) { this.ancienneteActiviteAnnees = ancienneteActiviteAnnees; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }

    public List<DemandeCredit> getDemandes() { return demandes; }
    public void setDemandes(List<DemandeCredit> demandes) { this.demandes = demandes; }
}
