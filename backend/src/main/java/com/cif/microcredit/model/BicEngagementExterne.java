package com.cif.microcredit.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Un engagement de crédit du sociétaire dans une AUTRE institution, tel que
 * remonté par le BIC (centrale des risques UEMOA). Objet de valeur stocké en
 * JSON dans {@link Client#getBicEngagementsExternes()}. Lecture seule côté agent.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class BicEngagementExterne {
    public String etablissement;
    public String typeCredit;
    public String dateOctroi;
    public Long montantInitialFcfa;
    public Long encoursRestantFcfa;
    public Long mensualiteFcfa;
    public Integer dureeMois;
    public Double tauxInteretAnnuelPct;
    public String statut;                 // Sain | Impayé | Souffrance | Contentieux | Soldé
    public Integer nombreImpayes;
    public Long montantEnRetardFcfa;
    public Integer joursRetardMax;
    public String garantie;
}
