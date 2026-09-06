package com.cif.microcredit.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Une facture de service public (ONEA = eau, SONABEL = électricité) du
 * sociétaire. Historique de paiement -> proxy de discipline. Objet de valeur
 * stocké en JSON dans {@link Client#getFacturesServicesPublics()}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class FactureServicePublic {
    public String fournisseur;             // ONEA | SONABEL
    public String periode;                 // YYYY-MM
    public Long montantFcfa;
    public String dateEmission;
    public String dateEcheance;
    public String statut;                  // Payée | Impayée
    public String datePaiement;            // null si impayée
    public Integer joursRetard;
    public Long montantImpayeFcfa;
}
