package com.cif.microcredit.service;

/**
 * Résultat complet renvoyé par le moteur IA (endpoint /api/score),
 * incluant la probabilité de défaut, la zone de décision, le score
 * scorecard, la perte attendue et l'explication SHAP (JSON brut).
 */
public class ScoringResult {

    private final Double scoreRisque;
    private final Double probaDefaut;
    private final String zoneDecision;
    private final Integer scoreCredit;
    private final Double perteAttendueFcfa;
    private final Double ratioEndettement;
    private final String explicationJson;

    public ScoringResult(Double scoreRisque, Double probaDefaut, String zoneDecision,
                          Integer scoreCredit, Double perteAttendueFcfa, Double ratioEndettement,
                          String explicationJson) {
        this.scoreRisque = scoreRisque;
        this.probaDefaut = probaDefaut;
        this.zoneDecision = zoneDecision;
        this.scoreCredit = scoreCredit;
        this.perteAttendueFcfa = perteAttendueFcfa;
        this.ratioEndettement = ratioEndettement;
        this.explicationJson = explicationJson;
    }

    public Double getScoreRisque() { return scoreRisque; }
    public Double getProbaDefaut() { return probaDefaut; }
    public String getZoneDecision() { return zoneDecision; }
    public Integer getScoreCredit() { return scoreCredit; }
    public Double getPerteAttendueFcfa() { return perteAttendueFcfa; }
    public Double getRatioEndettement() { return ratioEndettement; }
    public String getExplicationJson() { return explicationJson; }
}
