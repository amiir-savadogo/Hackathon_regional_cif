package com.cif.microcredit.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(name = "types_garantie")
public class TypeGarantie {

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
    private String typeGarantie; // 'PERSONNELLE' | 'REELLE_MOBILIERE' | 'REELLE_IMMOBILIERE' | 'FINANCIERE'

    private Integer tauxCouvertureRecommande;

    @Column(columnDefinition = "TEXT")
    private String description;

    private boolean exigeDocument = false;
    private boolean actif = true;

    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        if (this.dateCreation == null) {
            this.dateCreation = LocalDateTime.now();
        }
    }

    public TypeGarantie() {}

    public TypeGarantie(String code, String label, String typeGarantie, Integer tauxCouvertureRecommande, String description, boolean exigeDocument, boolean actif) {
        this.code = code;
        this.label = label;
        this.typeGarantie = typeGarantie;
        this.tauxCouvertureRecommande = tauxCouvertureRecommande;
        this.description = description;
        this.exigeDocument = exigeDocument;
        this.actif = actif;
        this.dateCreation = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getTypeGarantie() { return typeGarantie; }
    public void setTypeGarantie(String typeGarantie) { this.typeGarantie = typeGarantie; }

    public Integer getTauxCouvertureRecommande() { return tauxCouvertureRecommande; }
    public void setTauxCouvertureRecommande(Integer tauxCouvertureRecommande) { this.tauxCouvertureRecommande = tauxCouvertureRecommande; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isExigeDocument() { return exigeDocument; }
    public void setExigeDocument(boolean exigeDocument) { this.exigeDocument = exigeDocument; }

    public boolean isActif() { return actif; }
    public void setActif(boolean actif) { this.actif = actif; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }
}
