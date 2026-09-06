package com.cif.microcredit.service;

/**
 * Résultat complet renvoyé par le moteur IA (endpoint /api/score).
 */
public class ScoringResult {

    private final Double scoreRisque;
    private final Double probaDefaut;
    private final String zoneDecision;
    private final Integer scoreCredit;
    private final Double perteAttendueFcfa;
    private final Double ratioEndettement;
    private final Double ratioResteAVivreFcfa;
    private final Double futureEcheanceCreditFcfa;
    private final String explicationJson;
    private final String noteDecision;

    public ScoringResult(Double scoreRisque, Double probaDefaut, String zoneDecision,
                          Integer scoreCredit, Double perteAttendueFcfa, Double ratioEndettement,
                          Double ratioResteAVivreFcfa, Double futureEcheanceCreditFcfa,
                          String explicationJson, String noteDecision) {
        this.scoreRisque = scoreRisque;
        this.probaDefaut = probaDefaut;
        this.zoneDecision = zoneDecision;
        this.scoreCredit = scoreCredit;
        this.perteAttendueFcfa = perteAttendueFcfa;
        this.ratioEndettement = ratioEndettement;
        this.ratioResteAVivreFcfa = ratioResteAVivreFcfa;
        this.futureEcheanceCreditFcfa = futureEcheanceCreditFcfa;
        this.explicationJson = explicationJson;
        this.noteDecision = noteDecision;
    }

    public Double getScoreRisque() { return scoreRisque; }
    public Double getProbaDefaut() { return probaDefaut; }
    public String getZoneDecision() { return zoneDecision; }
    public Integer getScoreCredit() { return scoreCredit; }
    public Double getPerteAttendueFcfa() { return perteAttendueFcfa; }
    public Double getRatioEndettement() { return ratioEndettement; }
    public Double getRatioResteAVivreFcfa() { return ratioResteAVivreFcfa; }
    public Double getFutureEcheanceCreditFcfa() { return futureEcheanceCreditFcfa; }
    public String getExplicationJson() { return explicationJson; }
    public String getNoteDecision() { return noteDecision; }
}
