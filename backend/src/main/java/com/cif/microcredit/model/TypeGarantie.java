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

    @Column(name = "nature_juridique_id")
    private Long natureJuridiqueId;
    private Integer tauxCouvertureRecommande;

    @Column(columnDefinition = "TEXT")
    private String description;

    private boolean exigeDocument = false;
    private boolean actif = true;
    private boolean systeme = false;

    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        if (this.dateCreation == null) {
            this.dateCreation = LocalDateTime.now();
        }
    }

    public TypeGarantie() {}

    public TypeGarantie(String code, String label, Long natureJuridiqueId, Integer tauxCouvertureRecommande, String description, boolean exigeDocument, boolean actif) {
        this.code = code;
        this.label = label;
        this.natureJuridiqueId = natureJuridiqueId;
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

    public Long getNatureJuridiqueId() { return natureJuridiqueId; }
    public void setNatureJuridiqueId(Long natureJuridiqueId) { this.natureJuridiqueId = natureJuridiqueId; }

    public Integer getTauxCouvertureRecommande() { return tauxCouvertureRecommande; }
    public void setTauxCouvertureRecommande(Integer tauxCouvertureRecommande) { this.tauxCouvertureRecommande = tauxCouvertureRecommande; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isExigeDocument() { return exigeDocument; }
    public void setExigeDocument(boolean exigeDocument) { this.exigeDocument = exigeDocument; }

    public boolean isActif() { return actif; }
    public void setActif(boolean actif) { this.actif = actif; }

    public boolean isSysteme() { return systeme; }
    public void setSysteme(boolean systeme) { this.systeme = systeme; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }
}
