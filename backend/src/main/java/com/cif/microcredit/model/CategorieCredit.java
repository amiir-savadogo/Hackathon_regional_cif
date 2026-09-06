package com.cif.microcredit.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

/**
 * Catégorie de crédit (13 valeurs du catalogue produits).
 *
 * Le champ `label` est consommé TEL QUEL par le modèle IA (variable
 * categorie_credit). Les entrées seedées ont systeme=true : consultables et
 * paramétrables dans l'app, mais les renommer casse le signal côté modèle.
 */
@Entity
@Table(name = "categories_credit")
public class CategorieCredit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(unique = true, nullable = false)
    private String code;

    @NotBlank
    @Column(nullable = false)
    private String label;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Double tauxInteretMin;
    private Integer dureeMaxMois;
    private boolean actif = true;
    private boolean systeme = false;

    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        if (this.dateCreation == null) this.dateCreation = LocalDateTime.now();
    }

    public CategorieCredit() {}

    public CategorieCredit(String code, String label, Double tauxInteretMin, Integer dureeMaxMois, boolean systeme) {
        this.code = code;
        this.label = label;
        this.tauxInteretMin = tauxInteretMin;
        this.dureeMaxMois = dureeMaxMois;
        this.systeme = systeme;
        this.dateCreation = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Double getTauxInteretMin() { return tauxInteretMin; }
    public void setTauxInteretMin(Double tauxInteretMin) { this.tauxInteretMin = tauxInteretMin; }

    public Integer getDureeMaxMois() { return dureeMaxMois; }
    public void setDureeMaxMois(Integer dureeMaxMois) { this.dureeMaxMois = dureeMaxMois; }

    public boolean isActif() { return actif; }
    public void setActif(boolean actif) { this.actif = actif; }

    public boolean isSysteme() { return systeme; }
    public void setSysteme(boolean systeme) { this.systeme = systeme; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }
}
