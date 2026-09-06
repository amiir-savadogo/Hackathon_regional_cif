package com.cif.microcredit.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Un crédit CIF passé d'un sociétaire (historique interne détaillé).
 *
 * Objet de valeur, jamais une entité : stocké tel quel en JSON dans la colonne
 * {@code credits_internes_anterieurs} de {@link Client}, alimenté par le seeder
 * depuis {@code data/societaires_complet.json} (généré par
 * {@code scripts/01_generate_dataset.py}). Affiché en lecture seule dans le
 * wizard d'instruction ; l'agent de crédit ne le modifie jamais.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class CreditInterneAnterieur {

    public String reference;
    public String categorie;
    public String objet;
    public String dateDecaissement;
    public String dateEcheancePrevue;
    public String dateSolde;                 // null si crédit encore en cours
    public Long montantAccordeFcfa;
    public Double tauxInteretAnnuelPct;
    public Integer dureeMois;
    public Long echeanceMensuelleFcfa;
    public Long coutTotalCreditFcfa;
    public Long montantTotalRembourseFcfa;
    public Long capitalRestantDuFcfa;
    public String statut;                    // Soldé | Soldé par anticipation | En cours | En défaut | Rééchelonné
    public Double tauxRembourseePct;
    public Integer nombreEcheancesEnRetard;
    public Integer joursRetardCumules;
    public Double joursRetardMoyen;
    public Integer joursRetardMax;
    public Integer nombreIncidentsPaiement;
    public Integer nombreReechelonnements;
    public Integer delaiUtilisationApresDeblocageJours;
    public String garantieType;
    public Boolean garantieAppelee;
    public String agence;
    public Boolean membreGroupeSolidaire;
}
