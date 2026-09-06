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

    // --- Données comportementales connues de la banque (pré-remplissage du
    //     wizard d'instruction). Toutes nullables ; alimentées par le seeder
    //     depuis data/societaires_complet.json. ---
    private String sousSecteurActivite;
    private Boolean saisonaliteActivite;
    private Double indiceVulnerabiliteZone;
    private Integer nombreCreditsAnterieurs;
    private Double tauxRemboursementHistoriquePct;
    private Double joursRetardMoyenHistorique;
    private Double montantTotalEmprunteFcfa;
    private Double delaiUtilisationCreditJours;
    private Integer totalTransactions;
    private Double volumeDepotsFcfa;
    private Double volumeRetraitsFcfa;
    private Integer txMobileMoney;
    private Boolean possedeMobileMoney;
    private Integer frequenceTransactionsMmMois;
    private Double mmAncienneteCompteMois;
    private Double mmSoldeMoyenFcfa;
    private Double mmFluxEntrantsMensuelFcfa;
    private Integer mmNombreIncidentsCreditMm;
    private Integer nombreComptesBancaires;
    private String typeComptePrincipal;
    private Double soldeCompteBancaireFcfa;
    private Integer nombreRejetsPrelevementsCheques12m;

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

    public String getSousSecteurActivite() { return sousSecteurActivite; }
    public void setSousSecteurActivite(String v) { this.sousSecteurActivite = v; }

    public Boolean getSaisonaliteActivite() { return saisonaliteActivite; }
    public void setSaisonaliteActivite(Boolean v) { this.saisonaliteActivite = v; }

    public Double getIndiceVulnerabiliteZone() { return indiceVulnerabiliteZone; }
    public void setIndiceVulnerabiliteZone(Double v) { this.indiceVulnerabiliteZone = v; }

    public Integer getNombreCreditsAnterieurs() { return nombreCreditsAnterieurs; }
    public void setNombreCreditsAnterieurs(Integer v) { this.nombreCreditsAnterieurs = v; }

    public Double getTauxRemboursementHistoriquePct() { return tauxRemboursementHistoriquePct; }
    public void setTauxRemboursementHistoriquePct(Double v) { this.tauxRemboursementHistoriquePct = v; }

    public Double getJoursRetardMoyenHistorique() { return joursRetardMoyenHistorique; }
    public void setJoursRetardMoyenHistorique(Double v) { this.joursRetardMoyenHistorique = v; }

    public Double getMontantTotalEmprunteFcfa() { return montantTotalEmprunteFcfa; }
    public void setMontantTotalEmprunteFcfa(Double v) { this.montantTotalEmprunteFcfa = v; }

    public Double getDelaiUtilisationCreditJours() { return delaiUtilisationCreditJours; }
    public void setDelaiUtilisationCreditJours(Double v) { this.delaiUtilisationCreditJours = v; }

    public Integer getTotalTransactions() { return totalTransactions; }
    public void setTotalTransactions(Integer v) { this.totalTransactions = v; }

    public Double getVolumeDepotsFcfa() { return volumeDepotsFcfa; }
    public void setVolumeDepotsFcfa(Double v) { this.volumeDepotsFcfa = v; }

    public Double getVolumeRetraitsFcfa() { return volumeRetraitsFcfa; }
    public void setVolumeRetraitsFcfa(Double v) { this.volumeRetraitsFcfa = v; }

    public Integer getTxMobileMoney() { return txMobileMoney; }
    public void setTxMobileMoney(Integer v) { this.txMobileMoney = v; }

    public Boolean getPossedeMobileMoney() { return possedeMobileMoney; }
    public void setPossedeMobileMoney(Boolean v) { this.possedeMobileMoney = v; }

    public Integer getFrequenceTransactionsMmMois() { return frequenceTransactionsMmMois; }
    public void setFrequenceTransactionsMmMois(Integer v) { this.frequenceTransactionsMmMois = v; }

    public Double getMmAncienneteCompteMois() { return mmAncienneteCompteMois; }
    public void setMmAncienneteCompteMois(Double v) { this.mmAncienneteCompteMois = v; }

    public Double getMmSoldeMoyenFcfa() { return mmSoldeMoyenFcfa; }
    public void setMmSoldeMoyenFcfa(Double v) { this.mmSoldeMoyenFcfa = v; }

    public Double getMmFluxEntrantsMensuelFcfa() { return mmFluxEntrantsMensuelFcfa; }
    public void setMmFluxEntrantsMensuelFcfa(Double v) { this.mmFluxEntrantsMensuelFcfa = v; }

    public Integer getMmNombreIncidentsCreditMm() { return mmNombreIncidentsCreditMm; }
    public void setMmNombreIncidentsCreditMm(Integer v) { this.mmNombreIncidentsCreditMm = v; }

    public Integer getNombreComptesBancaires() { return nombreComptesBancaires; }
    public void setNombreComptesBancaires(Integer v) { this.nombreComptesBancaires = v; }

    public String getTypeComptePrincipal() { return typeComptePrincipal; }
    public void setTypeComptePrincipal(String v) { this.typeComptePrincipal = v; }

    public Double getSoldeCompteBancaireFcfa() { return soldeCompteBancaireFcfa; }
    public void setSoldeCompteBancaireFcfa(Double v) { this.soldeCompteBancaireFcfa = v; }

    public Integer getNombreRejetsPrelevementsCheques12m() { return nombreRejetsPrelevementsCheques12m; }
    public void setNombreRejetsPrelevementsCheques12m(Integer v) { this.nombreRejetsPrelevementsCheques12m = v; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }

    public List<DemandeCredit> getDemandes() { return demandes; }
    public void setDemandes(List<DemandeCredit> demandes) { this.demandes = demandes; }
}
