const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, LevelFormat, convertInchesToTwip
} = require("docx");

const NAVY = "1F3864";

const h1 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 280, after: 120 } });
const h2 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 180, after: 90 } });

const p = (text) => new Paragraph({ children: [new TextRun({ text })], spacing: { after: 140 }, alignment: AlignmentType.JUSTIFIED });

const bullet = (text) => new Paragraph({
  children: [new TextRun({ text })],
  numbering: { reference: "bullets", level: 0 },
  spacing: { after: 70 },
  alignment: AlignmentType.JUSTIFIED,
});

function cell(text, { header = false, width, shade, bold } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: shade ? { type: ShadingType.CLEAR, fill: shade } : undefined,
    children: [new Paragraph({
      children: [new TextRun({ text, bold: header || bold, color: header ? "FFFFFF" : undefined, size: 20 })],
    })],
  });
}

const metricsTable = new Table({
  width: { size: 9350, type: WidthType.DXA },
  columnWidths: [3117, 1558, 1558, 1558, 1559],
  rows: [
    new TableRow({ children: [
      cell("Modèle", { header: true, width: 3117, shade: NAVY }),
      cell("ROC-AUC", { header: true, width: 1558, shade: NAVY }),
      cell("F1 (défaut, seuil 0,5)", { header: true, width: 1558, shade: NAVY }),
      cell("Seuil optimal", { header: true, width: 1558, shade: NAVY }),
      cell("F1 (défaut, seuil optimal)", { header: true, width: 1559, shade: NAVY }),
    ]}),
    new TableRow({ children: [
      cell("Régression Logistique", { width: 3117, bold: true }),
      cell("0,710", { width: 1558 }), cell("0,32", { width: 1558 }),
      cell("0,536", { width: 1558 }), cell("0,354", { width: 1559, bold: true }),
    ]}),
    new TableRow({ children: [
      cell("Random Forest", { width: 3117 }),
      cell("0,702", { width: 1558 }), cell("0,11", { width: 1558 }),
      cell("0,332", { width: 1558 }), cell("0,339", { width: 1559 }),
    ]}),
    new TableRow({ children: [
      cell("XGBoost", { width: 3117 }),
      cell("0,710", { width: 1558 }), cell("0,12", { width: 1558 }),
      cell("0,190", { width: 1558 }), cell("0,347", { width: 1559 }),
    ]}),
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
  styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
    children: [
      new Paragraph({ children: [new TextRun({ text: "HACKATHON NATIONAL D'INNOVATION CIF – PROJET DIGICOOP-WA+", bold: true, size: 22 })], spacing: { after: 40 } }),
      new Paragraph({ children: [new TextRun({ text: "Burkina Faso · Ouagadougou · 4-6 septembre 2026", size: 20, color: "555555" })], spacing: { after: 220 } }),

      new Paragraph({ children: [new TextRun({ text: "NOTE DE PRÉSENTATION DU PROJET", bold: true, size: 26 })], spacing: { after: 60 } }),
      new Paragraph({ children: [new TextRun({ text: "CréditSûr WA — Système de scoring microcrédit adapté aux Coopératives financières", bold: true, size: 24, color: NAVY })], spacing: { after: 60 } }),
      new Paragraph({ children: [new TextRun({ text: "Thématique 02 — Scoring Microcrédit : Automatisation de l'évaluation du risque pour l'octroi de crédits", italics: true, size: 21 })], spacing: { after: 260 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY, space: 8 } } }),

      h1("1. Problème adressé"),
      p("Dans les Coopératives financières membres de la CIF, l'octroi de microcrédits repose encore largement sur une analyse manuelle du dossier de l'emprunteur : l'agent examine les pièces disponibles, discute avec le client, et tranche souvent sur la base de son expérience plutôt que d'une grille objective. Cette façon de faire a fait ses preuves humainement, mais elle a trois coûts concrets : des délais de traitement qui s'allongent lorsque l'agence est chargée, des décisions qui varient d'un agent à l'autre pour des profils pourtant comparables, et un risque d'impayés difficile à anticiper faute d'une lecture homogène du dossier."),
      p("Ce constat est renforcé par une réalité propre au terrain ouest-africain : une bonne partie des demandeurs — notamment en zone rurale — n'a ni compte bancaire classique, ni historique de crédit formel, ni trace numérique exploitable par un modèle de scoring \"à l'occidentale\". Un système pensé pour ce contexte doit donc pouvoir évaluer un dossier à partir de ce qui existe réellement sur le terrain : l'épargne suivie par la coopérative, l'activité économique déclarée, l'usage du Mobile Money quand il y en a, et l'historique des crédits déjà remboursés au sein de la même coopérative."),

      h1("2. Approche proposée"),
      p("CréditSûr WA est un prototype de scoring automatisé du risque de microcrédit que nous avons construit et testé de bout en bout pendant la préparation du dossier, pas seulement esquissé sur papier. Concrètement, nous sommes partis d'un constat simple en regardant ce qui existait déjà sur GitHub sur ce sujet : la plupart des projets de scoring crédit trouvés reprennent des jeux de données occidentaux (crédit allemand des années 90, ou données de bureau de crédit type carte bancaire) avec des variables qui n'ont tout simplement pas d'équivalent dans une coopérative ouest-africaine. Nous avons donc choisi de repartir de zéro sur les données plutôt que de recycler un de ces jeux."),

      h2("2.1. Construction du jeu de données"),
      p("Comme nous n'avons pas accès à de vraies données de coopérative (secret bancaire oblige), nous avons écrit un générateur de données simulées en Python : 4 000 dossiers de crédit fictifs, construits variable par variable à partir d'hypothèses documentées et discutées en équipe plutôt que tirés au hasard. Le profil socio-démographique (âge, sexe, zone urbaine/rurale, niveau d'éducation, charges familiales) est croisé avec l'activité économique du demandeur (commerce informel, agriculture, élevage, artisanat, salariat...), son revenu et ses charges mensuelles estimées, sa relation avec la coopérative (ancienneté, régularité de l'épargne, solde moyen), son éventuel historique de crédits déjà remboursés, son usage du Mobile Money, et enfin les caractéristiques précises de la demande en cours (montant, durée, objet, garantie proposée)."),
      p("Nous avons aussi intégré une dimension qui manque à beaucoup de projets de ce type : la consultation du Bureau d'Information sur le Crédit (BIC), le dispositif régional de partage de données de crédit qui existe réellement dans l'UEMOA — la BCEAO sert d'interface et reçoit chaque mois les données des banques, des autres établissements financiers et des SFD/IMF. Concrètement, le score tient compte du fait qu'un client ait déjà un prêt en cours ailleurs, qu'il ait déjà soldé un prêt sans incident dans une autre institution, ou qu'un incident de paiement y ait été signalé — une information que la coopérative ne peut pas connaître seule, mais qui existe déjà dans cet écosystème régional."),
      p("Le statut de \"bon payeur\" ou \"défaut\" n'a pas été tiré au hasard non plus : nous avons codé une règle de risque qui combine ces variables (ratio d'endettement élevé — recalculé pour englober les engagements détectés via le BIC —, absence d'épargne régulière, absence de garantie, faible ancienneté, mauvais historique de remboursement quand il existe, incident signalé ailleurs) puis nous avons ajouté du bruit pour que le signal reste réaliste et pas artificiellement facile à apprendre pour un modèle. Résultat : un taux de défaut global d'environ 12,6%, ce qui correspond à peu près aux ordres de grandeur qu'on retrouve dans la littérature sur la microfinance en zone UEMOA. Ce générateur est entièrement documenté dans le code (`scripts/01_generate_dataset.py`) et pourra être ré-étalonné directement avec de vraies statistiques dès qu'une coopérative partenaire accepte de partager des données anonymisées."),

      h2("2.2. Prétraitement et gestion du déséquilibre des classes"),
      p("Avec seulement 12% de dossiers en défaut, un modèle entraîné tel quel aurait tendance à \"prédire bon payeur\" presque à chaque fois et afficher une belle accuracy trompeuse. Nous avons donc traité ce déséquilibre avec SMOTE, appliqué uniquement sur les données d'entraînement pour ne pas fausser l'évaluation finale. Les variables numériques sont standardisées, les variables catégorielles encodées en one-hot, et les quelques champs qui n'existent pas pour un nouveau client sans historique de crédit (taux de remboursement passé, retards moyens) sont imputés plutôt que de faire planter le modèle — ce qui permet justement de scorer les clients sans historique, un point important vu le constat du paragraphe 1."),

      h2("2.3. Comparaison des modèles et choix final"),
      p("Nous avons entraîné et comparé trois modèles : une régression logistique, une forêt aléatoire et un XGBoost. Le tableau ci-dessous résume les résultats obtenus sur le jeu de test (20% des données, mis de côté avant tout entraînement)."),
      metricsTable,
      new Paragraph({ text: "", spacing: { after: 160 } }),
      p("Le choix ne s'est pas fait sur l'accuracy brute, qui dépasse 87% pour Random Forest et XGBoost mais cache le fait que ces deux modèles détectent très mal les dossiers réellement à risque (rappel de 6 à 7% seulement au seuil par défaut). Un crédit accordé à tort à un mauvais payeur coûte bien plus cher à la coopérative qu'un bon dossier refusé par excès de prudence : c'est ce déséquilibre de coût, pas la performance moyenne, qui doit guider le choix. En comparant le F1-score de la classe \"défaut\" une fois le seuil de décision optimisé pour chaque modèle, c'est la régression logistique qui ressort en tête (0,354), avec un ROC-AUC comparable aux deux autres modèles (0,710). Elle a en plus l'avantage d'être directement interprétable — un vrai atout quand il faut expliquer une décision à un agent de crédit qui n'a pas de formation en machine learning."),

      h2("2.4. Décision à trois niveaux et explicabilité"),
      p("Plutôt qu'une réponse binaire accordé/refusé, l'outil restitue une probabilité de défaut et la classe dans l'une de trois zones : verte (dossier plutôt sûr), orange (à examiner en comité de crédit) et rouge (risque élevé). Les seuils de ces zones sont calculés automatiquement autour du seuil de décision optimal du modèle retenu, et non fixés arbitrairement à 50%. L'agent garde la main sur la décision finale, en particulier sur les dossiers orange."),
      p("Pour chaque dossier évalué, l'application affiche également les facteurs qui ont le plus pesé sur le score, calculés avec SHAP et présentés en français plutôt que sous forme de coefficients bruts. L'objectif est qu'un agent puisse dire à un client \"votre dossier est jugé plus risqué parce que X et Y\", et pas seulement lui communiquer un chiffre."),

      h2("2.5. Application de démonstration"),
      p("Le prototype démontrable est une application Streamlit en Python, volontairement légère : elle charge le modèle une seule fois, ne fait aucun appel réseau externe et peut donc tourner sur un poste d'agence avec une connexion internet limitée ou absente. Le formulaire de saisie reprend les mêmes champs que le jeu de données d'entraînement, ce qui garantit la cohérence entre ce qui a été appris et ce qui est saisi sur le terrain."),

      h1("3. Valeur ajoutée attendue"),
      bullet("Un traitement de dossier plus rapide, avec un premier avis disponible en quelques secondes plutôt qu'après une analyse manuelle complète."),
      bullet("Une évaluation plus homogène entre agents et entre agences, sans remplacer leur jugement sur les dossiers à examiner."),
      bullet("Une meilleure prise en compte des clients sans historique bancaire formel, via des données que la coopérative détient déjà (épargne, activité, Mobile Money)."),
      bullet("Un outil explicable, donc plus facilement adopté par des agents qui doivent pouvoir justifier une décision au client."),
      bullet("Une solution qui reste utilisable dans les conditions réelles de connectivité et de ressources informatiques des Coopératives financières."),

      h1("4. Limites actuelles et prochaines étapes"),
      p("Le prototype repose pour l'instant sur des données simulées : les chiffres de performance présentés plus haut donnent une tendance et une méthodologie solide, mais devront être revalidés dès que des données réelles seront disponibles. C'est d'ailleurs la première étape que nous proposons après le hackathon : obtenir, via une coopérative partenaire, un échantillon de dossiers anonymisés pour recalibrer le générateur et ré-entraîner le modèle sur des cas réels. Viendraient ensuite l'ajout d'un import de dossiers en masse depuis un fichier Excel pour un traitement par lot en agence, puis un suivi dans le temps des décisions prises (journal des décisions) pour vérifier que le modèle reste fiable une fois en usage réel."),
      p("Un point mérite d'être clarifié dès maintenant plutôt que découvert au moment du déploiement : l'intégration réelle du BIC n'est pas un simple appel API gratuit et instantané. La consultation est facturée à la coopérative selon un barème fixé par la BCEAO, et les données remontées par les banques et les autres SFD ne sont mises à jour qu'une fois par mois (transmission le 10 de chaque mois). Cela veut dire que le statut BIC affiché pour un client peut avoir jusqu'à quatre semaines de décalage, et que la coopérative doit signer un accord d'accès avec le BIC régional avant de pouvoir l'interroger en production. Notre prototype simule ce signal pour démontrer sa valeur pour le score, mais son branchement réel demande une démarche administrative et un budget de consultation, pas seulement du développement logiciel — un point que nous proposons d'inscrire explicitement dans le plan de déploiement pilote."),

      h1("5. Composition et complémentarité de l'équipe"),
      p("L'équipe réunit trois étudiants en Master Data Science et une personne en génie logiciel, avec une répartition qui correspond à ce qui a été réellement fait sur ce prototype :"),
      bullet("Données & Feature Engineering — conception et calibration du générateur de données, documentation des variables ;"),
      bullet("Modélisation & Évaluation — prétraitement, gestion du déséquilibre des classes (SMOTE), comparaison des modèles et choix du seuil de décision ;"),
      bullet("Explicabilité & Démo — intégration de SHAP, animation de l'application de démonstration, narratif du pitch ;"),
      bullet("Intégration & Robustesse — structuration du code, packaging du modèle, tests, support technique pendant la démonstration."),
      p("Cette répartition correspond directement au critère de sélection « complémentarité et équilibre des compétences au sein de l'équipe »."),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  require("fs").writeFileSync("note_presentation_CreditSurWA_v2.docx", buf);
  console.log("OK");
});
