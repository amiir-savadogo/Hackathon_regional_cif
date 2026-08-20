const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, LevelFormat, convertInchesToTwip
} = require("docx");

const BLUE = "1F4E79";
const GREEN = "2E7D32";

const heading = (text, level = HeadingLevel.HEADING_1) =>
  new Paragraph({ text, heading: level, spacing: { before: 260, after: 120 } });

const p = (text, opts = {}) =>
  new Paragraph({
    children: [new TextRun({ text, ...opts })],
    spacing: { after: 140 },
  });

const bullet = (text, bold = false) =>
  new Paragraph({
    children: [new TextRun({ text, bold })],
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 60 },
  });

function cell(text, { header = false, width, shade } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: shade ? { type: ShadingType.CLEAR, fill: shade } : undefined,
    children: [new Paragraph({
      children: [new TextRun({ text, bold: header, color: header ? "FFFFFF" : undefined, size: 20 })],
    })],
  });
}

const critTable = new Table({
  width: { size: 9350, type: WidthType.DXA },
  columnWidths: [5200, 4150],
  rows: [
    new TableRow({ children: [cell("Critère de sélection CIF", { header: true, width: 5200, shade: BLUE }), cell("Réponse de CréditSûr WA", { header: true, width: 4150, shade: BLUE })] }),
    new TableRow({ children: [cell("Pertinence / adéquation à la thématique (30%)", { width: 5200 }), cell("Scoring 100% dédié au microcrédit coopératif, variables et seuils calibrés sur le contexte UEMOA (§2-3)", { width: 4150 })] }),
    new TableRow({ children: [cell("Originalité (20%)", { width: 5200 }), cell("Variables locales (Mobile Money, groupe solidaire, épargne coopérative) au lieu de variables occidentales inadaptées (§4)", { width: 4150 })] }),
    new TableRow({ children: [cell("Faisabilité technique (20%)", { width: 5200 }), cell("Prototype fonctionnel livré : dataset, notebook, 3 modèles comparés, app Streamlit (§5-6)", { width: 4150 })] }),
    new TableRow({ children: [cell("Impact pour les IMF membres (15%)", { width: 5200 }), cell("Réduction du délai/coût de l'analyse manuelle, décision à 3 zones qui responsabilise le comité de crédit (§6-7)", { width: 4150 })] }),
    new TableRow({ children: [cell("Complémentarité de l'équipe (15%)", { width: 5200 }), cell("4 profils Data Science / Génie logiciel couvrant tout le pipeline (§8)", { width: 4150 })] }),
  ],
});

const compTable = new Table({
  width: { size: 9350, type: WidthType.DXA },
  columnWidths: [3117, 3117, 3116],
  rows: [
    new TableRow({ children: [cell("Approche", { header: true, width: 3117, shade: BLUE }), cell("Solutions génériques (Kaggle « German Credit », « Home Credit »)", { header: true, width: 3117, shade: BLUE }), cell("CréditSûr WA", { header: true, width: 3116, shade: GREEN })] }),
    new TableRow({ children: [cell("Origine des données", { width: 3117 }), cell("Allemagne 1994 / bureau de crédit occidental", { width: 3117 }), cell("Simulation calibrée sur le contexte des Coopératives financières UEMOA", { width: 3116 })] }),
    new TableRow({ children: [cell("Variables clés", { width: 3117 }), cell("Carte bancaire, scores externes (EXT_SOURCE), historique bureau de crédit", { width: 3117 }), cell("Épargne coopérative, Mobile Money, groupe solidaire, secteur informel", { width: 3116 })] }),
    new TableRow({ children: [cell("Gestion du déséquilibre", { width: 3117 }), cell("Absente ou seuil 0.5 par défaut", { width: 3117 }), cell("SMOTE + seuil optimisé sur le F1 de la classe Défaut", { width: 3116 })] }),
    new TableRow({ children: [cell("Décision", { width: 3117 }), cell("Binaire (accordé / refusé)", { width: 3117 }), cell("3 zones (vert / orange à examiner / rouge), agent reste décisionnaire", { width: 3116 })] }),
    new TableRow({ children: [cell("Explicabilité", { width: 3117 }), cell("Absente", { width: 3117 }), cell("SHAP par dossier, en français, pour l'agent de crédit", { width: 3116 })] }),
    new TableRow({ children: [cell("Contraintes terrain", { width: 3117 }), cell("Non prises en compte", { width: 3117 }), cell("App légère, fonctionne hors-ligne, sans appel API externe", { width: 3116 })] }),
  ],
});

const roadmapTable = new Table({
  width: { size: 9350, type: WidthType.DXA },
  columnWidths: [2000, 7350],
  rows: [
    new TableRow({ children: [cell("Horizon", { header: true, width: 2000, shade: BLUE }), cell("Jalon", { header: true, width: 7350, shade: BLUE })] }),
    new TableRow({ children: [cell("J1", { width: 2000 }), cell("Recueil de 30 à 50 dossiers anonymisés réels auprès d'une Coopérative pilote pour recalibrer le générateur / le modèle", { width: 7350 })] }),
    new TableRow({ children: [cell("J1-J2", { width: 2000 }), cell("Ajout d'un mode « import Excel en masse » pour le traitement par lot des dossiers agence", { width: 7350 })] }),
    new TableRow({ children: [cell("Semaine 2-4 (mentoring)", { width: 2000 }), cell("Intégration d'un module d'audit (journal des décisions) et d'un contrôle des biais (parité femmes/hommes, zones rurales)", { width: 7350 })] }),
    new TableRow({ children: [cell("Pilote", { width: 2000 }), cell("Déploiement pilote sur poste agent (mode déconnecté) au sein d'une Coopérative financière membre de la CIF", { width: 7350 })] }),
  ],
});

const numbering = {
  config: [{
    reference: "bullets",
    levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: convertInchesToTwip(0.25), hanging: convertInchesToTwip(0.25) } } } }],
  }],
};

const doc = new Document({
  numbering,
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
    children: [
      new Paragraph({ children: [new TextRun({ text: "CréditSûr WA", bold: true, size: 44, color: BLUE })], spacing: { after: 40 } }),
      new Paragraph({ children: [new TextRun({ text: "Note de présentation de l'idée / solution", size: 26, italics: true, color: "555555" })], spacing: { after: 60 } }),
      new Paragraph({ children: [new TextRun({ text: "Hackathon National d'Innovation CIF — Projet DigiCoop-WA+ · Thématique 02 : Scoring Microcrédit", size: 20, color: "777777" })], spacing: { after: 40 } }),
      new Paragraph({ children: [new TextRun({ text: "Burkina Faso · Ouagadougou · 4-6 septembre 2026", size: 20, color: "777777" })], spacing: { after: 260 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 8 } } }),

      heading("1. Problème adressé"),
      p("Dans les Coopératives financières (Institutions de Microfinance) d'Afrique de l'Ouest, l'octroi de microcrédit repose encore largement sur une analyse manuelle et subjective du dossier du demandeur. Cela génère des délais de traitement longs, des décisions peu homogènes d'un agent à l'autre, un risque d'impayés mal maîtrisé et des coûts opérationnels élevés — pénalisant en premier lieu les Coopératives aux ressources informatiques et à la connectivité les plus limitées."),

      heading("2. Approche proposée"),
      p("CréditSûr WA est un prototype de scoring automatisé du risque de microcrédit, pensé dès la conception pour le contexte réel d'une Coopérative financière ouest-africaine plutôt que pour transposer un modèle bancaire occidental. Trois choix structurent l'approche :"),
      bullet("Des variables réellement disponibles localement : épargne et ancienneté à la coopérative, participation à un groupe de caution solidaire, usage du Mobile Money, secteur d'activité (y compris informel), garantie proposée — et non des données bureau de crédit ou carte bancaire absentes du contexte local.", false),
      bullet("Une gestion explicite du déséquilibre des classes (SMOTE) et un seuil de décision optimisé sur le coût métier réel : refuser à tort un bon payeur coûte moins cher à la coopérative qu'accorder un crédit à un mauvais payeur.", false),
      bullet("Une décision à trois zones (favorable / à examiner / risque élevé), assortie d'une explication SHAP dossier par dossier en français, pour que l'agent de crédit garde la décision finale et comprenne le score plutôt que de le subir.", false),

      heading("3. Valeur ajoutée attendue"),
      bullet("Réduction du délai et du coût de l'analyse manuelle des dossiers de microcrédit.", false),
      bullet("Décision plus homogène et objectivée entre agents et entre agences.", false),
      bullet("Meilleure maîtrise du risque d'impayés grâce à une évaluation systématique du profil de risque.", false),
      bullet("Outil explicable et pédagogique, qui renforce la confiance des agents plutôt qu'une « boîte noire ».", false),
      bullet("Architecture légère et fonctionnant hors-ligne, adaptée aux contraintes de connectivité et de ressources informatiques modestes des Coopératives financières.", false),

      heading("4. Différenciation vis-à-vis des solutions existantes"),
      p("Une recherche préalable sur des dépôts publics de scoring crédit a mis en évidence deux limites récurrentes : l'utilisation de jeux de données occidentaux (German Credit, Home Credit Default Risk) et de variables absentes du contexte de la microfinance ouest-africaine (score bureau de crédit, historique de carte bancaire). Le tableau ci-dessous résume les différences avec notre approche."),
      compTable,
      new Paragraph({ text: "", spacing: { after: 200 } }),

      heading("5. Données"),
      p("En l'absence d'accès à des données réelles de coopérative (secret bancaire), un générateur de données synthétiques paramétrable a été développé : 4 000 dossiers simulés selon des lois de distribution et des règles métier réalistes (taux de défaut de base ≈ 11-12%, poids du secteur informel, rôle du cautionnement solidaire, revenus asymétriques typiques de l'économie informelle). Ce générateur, documenté et reproductible, pourra être ré-étalonné avec des données réelles anonymisées lors d'un déploiement pilote, sans changer l'architecture du modèle."),

      heading("6. Architecture technique et résultats du prototype"),
      p("Pipeline : génération/chargement des données → prétraitement (imputation, encodage) → rééquilibrage SMOTE → entraînement et comparaison de 3 modèles (Régression Logistique, Random Forest, XGBoost) → sélection sur le F1-score de la classe Défaut au seuil optimisé → explicabilité SHAP → application Streamlit de démonstration."),
      p("Sur le jeu de données simulé, la Régression Logistique a été retenue (F1 classe Défaut ≈ 0,36 au seuil optimisé, ROC-AUC ≈ 0,74) : ses performances sont comparables aux modèles plus complexes tout en offrant une interprétabilité directe, un atout pour l'adoption par des agents de crédit non-experts en Machine Learning. Le notebook d'analyse compare les 3 modèles avec métriques et courbes ROC/Précision-Rappel complètes."),

      heading("7. Livrables du prototype"),
      bullet("Dataset synthétique documenté (data/credit_wa_dataset.csv) et script de génération reproductible.", false),
      bullet("Notebook d'analyse exploratoire, prétraitement, comparaison des 3 modèles et explicabilité SHAP.", false),
      bullet("Modèle final sauvegardé (pipeline complet) et application Streamlit de démonstration pour les agents de crédit.", false),
      bullet("Documentation technique (README) et présente note de candidature.", false),

      heading("8. Équipe et complémentarité des compétences"),
      p("Équipe CréditSûr WA — 4 membres (3 profils Master Data Science, 1 profil Génie logiciel) couvrant l'ensemble de la chaîne de valeur du prototype :"),
      bullet("Données & Feature Engineering — génération, calibration et documentation du dataset.", false),
      bullet("Modélisation & Évaluation — comparaison des modèles, SMOTE, choix du seuil de décision.", false),
      bullet("Explicabilité & Démo — SHAP, animation de l'application de démonstration, pitch.", false),
      bullet("Intégration & Robustesse — packaging du modèle, API/application, tests, support démo.", false),

      heading("9. Feuille de route post-hackathon"),
      roadmapTable,
      new Paragraph({ text: "", spacing: { after: 200 } }),

      heading("10. Correspondance avec les critères de sélection CIF"),
      critTable,
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  require("fs").writeFileSync("note_presentation_CreditSurWA.docx", buf);
  console.log("OK");
});
