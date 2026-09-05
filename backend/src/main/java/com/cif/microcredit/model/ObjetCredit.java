package com.cif.microcredit.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(name = "objets_credit")
public class ObjetCredit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(unique = true, nullable = false)
    private String code;

    @NotBlank
    @Column(nullable = false)
    private String label;

    @NotBlank
    private String categorie;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Double tauxInteretMin;
    private Integer dureeMaxMois;
    private boolean actif = true;

    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        if (this.dateCreation == null) {
            this.dateCreation = LocalDateTime.now();
        }
    }

    public ObjetCredit() {}

    public ObjetCredit(String code, String label, String categorie, String description, Double tauxInteretMin, Integer dureeMaxMois, boolean actif) {
        this.code = code;
        this.label = label;
        this.categorie = categorie;
        this.description = description;
        this.tauxInteretMin = tauxInteretMin;
        this.dureeMaxMois = dureeMaxMois;
        this.actif = actif;
        this.dateCreation = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getCategorie() { return categorie; }
    public void setCategorie(String categorie) { this.categorie = categorie; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Double getTauxInteretMin() { return tauxInteretMin; }
    public void setTauxInteretMin(Double tauxInteretMin) { this.tauxInteretMin = tauxInteretMin; }

    public Integer getDureeMaxMois() { return dureeMaxMois; }
    public void setDureeMaxMois(Integer dureeMaxMois) { this.dureeMaxMois = dureeMaxMois; }

    public boolean isActif() { return actif; }
    public void setActif(boolean actif) { this.actif = actif; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }
}
