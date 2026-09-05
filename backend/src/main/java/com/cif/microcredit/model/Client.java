package com.cif.microcredit.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * Entité Client - représente le profil d'un sociétaire / demandeur de microcrédit CIF.
 */
@Entity
@Table(name = "clients")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Numéro de Compte & Affiliation CIF
    private String numeroCompte;
    private String typeCompte;
    private String statutCompte;
    private Double partsSocialesFcfa;
    private String agence;
    private Integer ancienneteCooperativeMois;
    private Double soldeEpargneActuelFcfa;

    // Informations d'identité du sociétaire
    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    private String prenom;

    @Min(value = 18, message = "Le client doit être majeur (18 ans minimum)")
    @Max(value = 100, message = "Âge invraisemblable (maximum 100 ans)")
    private int age;

    private String dateNaissance;
    private String numeroCnib;
    private String dateExpirationCnib;
    private String telephone;
    private String email;

    // Localisation & Logement
    private String pays;
    private String region;
    private String ville;
    private String adresse;
    private String typeLogement;

    // Activité professionnelle
    private String secteurActivite;
    private String activite;

    @PositiveOrZero(message = "L'ancienneté d'activité ne peut pas être négative")
    @DecimalMax(value = "80.0", message = "Ancienneté d'activité invraisemblable")
    private double ancienneteActiviteAnnees;

    // Profil socio-démographique
    private String sexe;                       // "Femme" | "Homme"
    private String zone;                       // "Urbaine" | "Semi-urbaine" | "Rurale"
    private String situationMatrimoniale;       // "Marié(e)" | "Célibataire" | "Veuf(ve)" | "Divorcé(e)"
    private String niveauEducation;             // "Aucun" | "Primaire" | "Secondaire" | "Supérieur"

    @PositiveOrZero(message = "Le nombre de personnes à charge ne peut pas être négatif")
    @Max(value = 30, message = "Nombre de personnes à charge invraisemblable")
    private int nombrePersonnesACharge;

    private LocalDateTime dateCreation;

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

    public String getNumeroCompte() { return numeroCompte; }
    public void setNumeroCompte(String numeroCompte) { this.numeroCompte = numeroCompte; }

    public String getTypeCompte() { return typeCompte; }
    public void setTypeCompte(String typeCompte) { this.typeCompte = typeCompte; }

    public String getStatutCompte() { return statutCompte; }
    public void setStatutCompte(String statutCompte) { this.statutCompte = statutCompte; }

    public Double getPartsSocialesFcfa() { return partsSocialesFcfa; }
    public void setPartsSocialesFcfa(Double partsSocialesFcfa) { this.partsSocialesFcfa = partsSocialesFcfa; }

    public String getAgence() { return agence; }
    public void setAgence(String agence) { this.agence = agence; }

    public Integer getAncienneteCooperativeMois() { return ancienneteCooperativeMois; }
    public void setAncienneteCooperativeMois(Integer ancienneteCooperativeMois) { this.ancienneteCooperativeMois = ancienneteCooperativeMois; }

    public Double getSoldeEpargneActuelFcfa() { return soldeEpargneActuelFcfa; }
    public void setSoldeEpargneActuelFcfa(Double soldeEpargneActuelFcfa) { this.soldeEpargneActuelFcfa = soldeEpargneActuelFcfa; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }

    public String getDateNaissance() { return dateNaissance; }
    public void setDateNaissance(String dateNaissance) { this.dateNaissance = dateNaissance; }

    public String getNumeroCnib() { return numeroCnib; }
    public void setNumeroCnib(String numeroCnib) { this.numeroCnib = numeroCnib; }

    public String getDateExpirationCnib() { return dateExpirationCnib; }
    public void setDateExpirationCnib(String dateExpirationCnib) { this.dateExpirationCnib = dateExpirationCnib; }

    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPays() { return pays; }
    public void setPays(String pays) { this.pays = pays; }

    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }

    public String getVille() { return ville; }
    public void setVille(String ville) { this.ville = ville; }

    public String getAdresse() { return adresse; }
    public void setAdresse(String adresse) { this.adresse = adresse; }

    public String getTypeLogement() { return typeLogement; }
    public void setTypeLogement(String typeLogement) { this.typeLogement = typeLogement; }

    public String getSecteurActivite() { return secteurActivite; }
    public void setSecteurActivite(String secteurActivite) { this.secteurActivite = secteurActivite; }

    public String getActivite() { return activite; }
    public void setActivite(String activite) { this.activite = activite; }

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
