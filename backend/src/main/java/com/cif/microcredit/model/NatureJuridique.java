package com.cif.microcredit.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(name = "natures_juridique")
public class NatureJuridique {

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

    private boolean necessiteNotaire = false;
    private boolean fraisEnregistrement = false;
    private boolean actif = true;

    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        if (this.dateCreation == null) {
            this.dateCreation = LocalDateTime.now();
        }
    }

    public NatureJuridique() {}

    public NatureJuridique(String code, String label, String description, boolean necessiteNotaire, boolean fraisEnregistrement, boolean actif) {
        this.code = code;
        this.label = label;
        this.description = description;
        this.necessiteNotaire = necessiteNotaire;
        this.fraisEnregistrement = fraisEnregistrement;
        this.actif = actif;
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

    public boolean isNecessiteNotaire() { return necessiteNotaire; }
    public void setNecessiteNotaire(boolean necessiteNotaire) { this.necessiteNotaire = necessiteNotaire; }

    public boolean isFraisEnregistrement() { return fraisEnregistrement; }
    public void setFraisEnregistrement(boolean fraisEnregistrement) { this.fraisEnregistrement = fraisEnregistrement; }

    public boolean isActif() { return actif; }
    public void setActif(boolean actif) { this.actif = actif; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }
}
