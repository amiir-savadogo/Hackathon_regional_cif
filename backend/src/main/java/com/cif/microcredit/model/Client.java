package com.cif.microcredit.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
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
    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    private String prenom;

    // Contrôle correspondant au retour d'audit : sans cette borne, un mineur
    // pouvait être enregistré comme demandeur de crédit. La majorité légale
    // (18 ans) est la même contrainte que celle déjà appliquée côté moteur IA
    // (ai-service/main.py) - dupliquée ici pour que le refus arrive dès la
    // couche backend, avant même l'appel au moteur de scoring.
    @Min(value = 18, message = "Le client doit être majeur (18 ans minimum)")
    @Max(value = 100, message = "Âge invraisemblable (maximum 100 ans)")
    private int age;

    private String telephone;

    @NotBlank(message = "Le secteur d'activité est obligatoire")
    private String secteurActivite;

    @PositiveOrZero(message = "L'ancienneté d'activité ne peut pas être négative")
    @DecimalMax(value = "80.0", message = "Ancienneté d'activité invraisemblable")
    private double ancienneteActiviteAnnees;

    // Profil socio-démographique (utilisé par le moteur de scoring IA)
    @NotBlank
    private String sexe;                       // "Femme" | "Homme"
    @NotBlank
    private String zone;                       // "Urbaine" | "Semi-urbaine" | "Rurale"
    @NotBlank
    private String situationMatrimoniale;       // "Marié(e)" | "Célibataire" | "Veuf(ve)" | "Divorcé(e)"
    @NotBlank
    private String niveauEducation;             // "Aucun" | "Primaire" | "Secondaire" | "Supérieur"

    @PositiveOrZero(message = "Le nombre de personnes à charge ne peut pas être négatif")
    @Max(value = 30, message = "Nombre de personnes à charge invraisemblable")
    private int nombrePersonnesACharge;

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

    public String getSexe() { return sexe; }
    public void setSexe(String sexe) { this.sexe = sexe; }

    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }

    public String getSituationMatrimoniale() { return situationMatrimoniale; }
    public void setSituationMatrimoniale(String situationMatrimoniale) { this.situationMatrimoniale = situationMatrimoniale; }

    public String getNiveauEducation() { return niveauEducation; }
    public void setNiveauEducation(String niveauEducation) { this.niveauEducation = niveauEducation; }

    public int getNombrePersonnesACharge() { return nombrePersonnesACharge; }
    public void setNombrePersonnesACharge(int nombrePersonnesACharge) { this.nombrePersonnesACharge = nombrePersonnesACharge; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }

    public List<DemandeCredit> getDemandes() { return demandes; }
    public void setDemandes(List<DemandeCredit> demandes) { this.demandes = demandes; }
}
