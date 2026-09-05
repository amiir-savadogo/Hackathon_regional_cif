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
  columnWidths: [2450, 1725, 1725, 1725, 1725],
  rows: [
    new TableRow({ children: [
      cell("Modèle", { header: true, width: 2450, shade: NAVY }),
      cell("ROC-AUC", { header: true, width: 1725, shade: NAVY }),
      cell("Rappel classe défaut (seuil 0,5)", { header: true, width: 1725, shade: NAVY }),
      cell("Seuil optimal", { header: true, width: 1725, shade: NAVY }),
      cell("F1 défaut (seuil optimal)", { header: true, width: 1725, shade: NAVY }),
    ]}),
    new TableRow({ children: [
      cell("Régression Logistique", { width: 2450, bold: true }),
      cell("0,693", { width: 1725 }), cell("54,0 %", { width: 1725, bold: true }),
      cell("0,616", { width: 1725 }), cell("0,359", { width: 1725, bold: true }),
    ]}),
    new TableRow({ children: [
      cell("Random Forest", { width: 2450 }),
      cell("0,687", { width: 1725 }), cell("27,6 %", { width: 1725 }),
      cell("0,408", { width: 1725 }), cell("0,335", { width: 1725 }),
    ]}),
    new TableRow({ children: [
      cell("XGBoost", { width: 2450 }),
      cell("0,716", { width: 1725 }), cell("5,3 %", { width: 1725 }),
      cell("0,344", { width: 1725 }), cell("0,353", { width: 1725 }),
    ]}),
    new TableRow({ children: [
      cell("LightGBM", { width: 2450 }),
      cell("0,709", { width: 1725 }), cell("5,3 %", { width: 1725 }),
      cell("0,358", { width: 1725 }), cell("0,343", { width: 1725 }),
    ]}),
    new TableRow({ children: [
      cell("CatBoost", { width: 2450 }),
      cell("0,718", { width: 1725 }), cell("2,6 %", { width: 1725 }),
      cell("0,292", { width: 1725 }), cell("0,339", { width: 1725 }),
    ]}),
  ],
});

const costTable = new Table({
  width: { size: 9350, type: WidthType.DXA },
  columnWidths: [3117, 2411, 2411, 1411],
  rows: [
    new TableRow({ children: [
      cell("Modèle", { header: true, width: 3117, shade: NAVY }),
      cell("Seuil financier optimal", { header: true, width: 2411, shade: NAVY }),
      cell("Coût attendu (FCFA, 600 dossiers validation)", { header: true, width: 2411, shade: NAVY }),
      cell("Déployable ?", { header: true, width: 1411, shade: NAVY }),
    ]}),
    new TableRow({ children: [
      cell("Régression Logistique", { width: 3117, bold: true }),
      cell("0,74", { width: 2411 }), cell("8 116 400", { width: 2411, bold: true }),
      cell("Oui - retenu", { width: 1411, bold: true }),
    ]}),
    new TableRow({ children: [
      cell("Stacking (benchmark)", { width: 3117 }),
      cell("0,30", { width: 2411 }), cell("8 773 260", { width: 2411 }),
      cell("Non (SHAP)", { width: 1411 }),
    ]}),
    new TableRow({ children: [
      cell("LightGBM", { width: 3117 }),
      cell("0,36", { width: 2411 }), cell("8 852 590", { width: 2411 }),
      cell("Oui", { width: 1411 }),
    ]}),
    new TableRow({ children: [
      cell("XGBoost", { width: 3117 }),
      cell("0,34", { width: 2411 }), cell("8 861 610", { width: 2411 }),
      cell("Oui", { width: 1411 }),
    ]}),
    new TableRow({ children: [
      cell("Random Forest", { width: 3117 }),
      cell("0,50", { width: 2411 }), cell("8 894 760", { width: 2411 }),
      cell("Oui", { width: 1411 }),
    ]}),
    new TableRow({ children: [
      cell("CatBoost", { width: 3117 }),
      cell("0,39", { width: 2411 }), cell("9 034 940", { width: 2411 }),
      cell("Oui", { width: 1411 }),
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
      new Paragraph({ children: [new TextRun({ text: "SAMDE - Système de scoring microcrédit adapté aux Coopératives financières", bold: true, size: 24, color: NAVY })], spacing: { after: 60 } }),
      new Paragraph({ children: [new TextRun({ text: "Thématique 02 - Scoring Microcrédit : Automatisation de l'évaluation du risque pour l'octroi de crédits", italics: true, size: 21 })], spacing: { after: 260 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY, space: 8 } } }),

      h1("1. Problème adressé"),
      p("Dans les Coopératives financières membres de la CIF, l'octroi de microcrédits repose encore largement sur une analyse manuelle du dossier de l'emprunteur : l'agent examine les pièces disponibles, discute avec le client, et tranche souvent sur la base de son expérience plutôt que d'une grille objective. Cette façon de faire a fait ses preuves humainement, mais elle a trois coûts concrets : des délais de traitement qui s'allongent lorsque l'agence est chargée, des décisions qui varient d'un agent à l'autre pour des profils pourtant comparables, et un risque d'impayés difficile à anticiper faute d'une lecture homogène du dossier."),
      p("Ce constat est renforcé par une réalité propre au terrain ouest-africain : une bonne partie des demandeurs - notamment en zone rurale - n'a ni compte bancaire classique, ni historique de crédit formel, ni trace numérique exploitable par un modèle de scoring \"à l'occidentale\". Un système pensé pour ce contexte doit donc pouvoir évaluer un dossier à partir de ce qui existe réellement sur le terrain : l'épargne suivie par la coopérative, l'activité économique déclarée, l'usage du Mobile Money quand il y en a, et l'historique des crédits déjà remboursés au sein de la même coopérative."),

      h1("2. Approche proposée"),
      p("SAMDE est un prototype de scoring automatisé du risque de microcrédit que nous avons construit et testé de bout en bout pendant la préparation du dossier, pas seulement esquissé sur papier. Concrètement, nous sommes partis d'un constat simple en regardant ce qui existait déjà sur GitHub sur ce sujet : la plupart des projets de scoring crédit trouvés reprennent des jeux de données occidentaux (crédit allemand des années 90, ou données de bureau de crédit type carte bancaire) avec des variables qui n'ont tout simplement pas d'équivalent dans une coopérative ouest-africaine. Nous avons donc choisi de repartir de zéro sur les données plutôt que de recycler un de ces jeux."),

      h2("2.1. Construction du jeu de données"),
      p("Ce choix de repartir de zéro a été fait consciemment, et pas par défaut faute de mieux : plutôt que de présenter un modèle entraîné sur des variables occidentales sans équivalent local (crédit allemand, historique de carte bancaire), nous avons préféré construire un jeu de données synthétique mais documenté, ancré dans les réalités des coopératives ouest-africaines, en sachant dès le départ qu'il devrait être recalibré sur des données réelles avant toute mise en production - ce que nous détaillons au chapitre 4."),
      p("Comme nous n'avons pas accès à de vraies données de coopérative (secret bancaire oblige), nous avons écrit un générateur de données simulées en Python : 4 000 dossiers de crédit fictifs, construits variable par variable à partir d'hypothèses documentées et discutées en équipe plutôt que tirés au hasard. Le profil socio-démographique (âge, sexe, zone urbaine/rurale, niveau d'éducation, charges familiales) est croisé avec l'activité économique du demandeur (commerce informel, agriculture, élevage, artisanat, salariat...), son revenu et ses charges mensuelles estimées, sa relation avec la coopérative (ancienneté, régularité de l'épargne, solde moyen), son éventuel historique de crédits déjà remboursés, son usage du Mobile Money, et enfin les caractéristiques précises de la demande en cours (montant, durée, objet, garantie proposée)."),
      p("Nous avons aussi intégré une dimension qui manque à beaucoup de projets de ce type : la consultation du Bureau d'Information sur le Crédit (BIC), le dispositif régional de partage de données de crédit qui existe réellement dans l'UEMOA - la BCEAO sert d'interface et reçoit chaque mois les données des banques, des autres établissements financiers et des SFD/IMF. Concrètement, le score tient compte du fait qu'un client ait déjà un prêt en cours ailleurs, qu'il ait déjà soldé un prêt sans incident dans une autre institution, ou qu'un incident de paiement y ait été signalé - une information que la coopérative ne peut pas connaître seule, mais qui existe déjà dans cet écosystème régional."),
      p("Le statut de \"bon payeur\" ou \"défaut\" n'a pas été tiré au hasard non plus : nous avons codé une règle de risque qui combine ces variables (ratio d'endettement élevé - recalculé pour englober les engagements détectés via le BIC -, absence d'épargne régulière, absence de garantie, faible ancienneté, mauvais historique de remboursement quand il existe, incident signalé ailleurs) puis nous avons ajouté du bruit pour que le signal reste réaliste et pas artificiellement facile à apprendre pour un modèle. Résultat : un taux de défaut global d'environ 12,6%, ce qui correspond à peu près aux ordres de grandeur qu'on retrouve dans la littérature sur la microfinance en zone UEMOA. Ce générateur est entièrement documenté dans le code (`scripts/01_generate_dataset.py`) et pourra être ré-étalonné directement avec de vraies statistiques dès qu'une coopérative partenaire accepte de partager des données anonymisées."),

      h2("2.2. Prétraitement et gestion du déséquilibre des classes"),
      p("Avec seulement 12% de dossiers en défaut, un modèle entraîné tel quel aurait tendance à \"prédire bon payeur\" presque à chaque fois et afficher une belle accuracy trompeuse. Nous avons donc traité ce déséquilibre avec SMOTE, appliqué uniquement sur les données d'entraînement pour ne pas fausser l'évaluation finale. Les variables numériques sont standardisées, les variables catégorielles encodées en one-hot, et les quelques champs qui n'existent pas pour un nouveau client sans historique de crédit (taux de remboursement passé, retards moyens) sont imputés plutôt que de faire planter le modèle - ce qui permet justement de scorer les clients sans historique, un point important vu le constat du paragraphe 1."),

      h2("2.3. Comparaison des modèles et choix final"),
      p("Nous avons entraîné et comparé cinq modèles - une régression logistique, une forêt aléatoire, XGBoost, LightGBM et CatBoost - plus un stacking combinant les cinq. Les données sont réparties en trois sous-ensembles disjoints, mis de côté avant tout entraînement : 70% pour l'entraînement (2800 dossiers), 15% pour la validation (600 dossiers, utilisée pour choisir le seuil de décision et le modèle final) et 15% pour le test (600 dossiers, utilisée une seule fois, à la toute fin, pour publier une performance honnête - méthodologie détaillée en 2.4). Le tableau ci-dessous résume les résultats obtenus sur la validation, pour la version de chaque modèle optimisée sur le F1-score de la classe défaut."),
      metricsTable,
      new Paragraph({ text: "", spacing: { after: 160 } }),
      p("Le choix ne s'est pas fait sur l'accuracy brute (83-87% pour les modèles à base d'arbres contre 67% pour la régression logistique), qui est ici un indicateur trompeur : avec seulement 12,6% de dossiers en défaut dans le jeu de données, un modèle qui prédit systématiquement \"bon payeur\" affiche déjà une accuracy élevée sans être utile. La preuve la plus directe de ce problème est le rappel de la classe défaut au seuil de décision par défaut (0,5) : la régression logistique détecte 54,0% des dossiers réellement en défaut à ce seuil, contre 2,6 à 27,6% pour les modèles à base d'arbres. Ces derniers, dominés par la classe majoritaire à seuil non calibré, se replient presque systématiquement sur \"bon payeur\" et laissent passer l'essentiel des mauvais payeurs - or dans une coopérative, laisser passer un mauvais payeur coûte structurellement plus cher qu'examiner un bon dossier avec un peu plus de prudence."),
      p("Une fois le seuil de décision optimisé séparément pour chaque modèle (recherche du seuil qui maximise le F1-score sur la classe défaut) et les hyperparamètres réglés par recherche bayésienne plutôt que fixés à la main (2.4), la régression logistique conserve l'avantage (F1 = 0,359) sur XGBoost (0,353), LightGBM (0,343), CatBoost (0,339) et Random Forest (0,335). Elle minimise également le coût métier attendu (FN/FP, méthodologie en 2.4), avec une marge nette sur les autres modèles. À performance technique favorable, elle a donc été retenue à la fois pour de bonnes raisons statistiques et parce qu'elle reste directement interprétable via ses coefficients, ce qui rend l'explication SHAP (LinearExplainer, cf. 2.5) plus simple et plus fidèle à restituer à un agent de crédit sans formation en machine learning qu'un modèle à base d'arbres."),

      h2("2.4. Optimisation des hyperparamètres, du seuil de décision et protocole d'évaluation"),
      p("Dans une version antérieure de ce travail, les hyperparamètres de chaque modèle (nombre d'arbres, profondeur, taux d'apprentissage...) avaient été fixés \"à dire d'expert\", sans recherche ni référence documentée - une lacune méthodologique que nous avons corrigée. Chaque modèle est maintenant réglé par recherche bayésienne (Optuna, TPESampler - Akiba et al., 2019), sur un espace de recherche dont les bornes sont documentées en commentaire dans le code (`scripts/02_train_model.py`) et justifiées par la littérature du credit scoring : échelle logarithmique de régularisation pour la régression logistique (Lessmann et al., 2015 ; Siddiqi, 2017), profondeur d'arbre limitée pour Random Forest (Brown & Mues, 2012), arbres peu profonds et sous-échantillonnage pour les boosting XGBoost/LightGBM/CatBoost (Chen & Guestrin, 2016 ; Xia et al., 2017 ; Ke et al., 2017 ; Prokhorenkova et al., 2018). Le prétraitement (imputation, standardisation, encodage) et SMOTE sont tous deux imbriqués à l'intérieur de chaque pipeline de modèle et réappliqués à chaque pli de validation croisée - et non plus ajustés une fois pour toutes avant la recherche - pour éviter toute fuite d'information entre les plis d'entraînement et de validation."),
      p("Deuxième amélioration, plus structurelle : une relecture externe du projet a identifié qu'une version antérieure de ce script utilisait le jeu de test à la fois pour choisir le seuil de décision ET pour choisir le modèle final - ce qui revient à évaluer une décision de sélection sur les mêmes données que celles utilisées pour la prendre, et biaise optimistement la performance annoncée. Nous avons corrigé le protocole en 3 sous-ensembles disjoints (2.3) : la recherche Optuna optimise sur des plis de validation croisée internes au TRAIN, le choix du modèle et du seuil se fait sur VALIDATION, et TEST n'intervient plus qu'une seule fois, à la toute fin, pour un chiffre honnête (paragraphe suivant)."),
      p("Troisième amélioration : au-delà du F1-score, chaque modèle est aussi optimisé sur un critère de coût métier attendu, qui distingue explicitement le coût d'un faux négatif (crédit accordé à un mauvais payeur) de celui d'un faux positif (bon dossier refusé à tort) - ces deux erreurs n'ayant pas le même impact financier pour la coopérative. Le coût d'un faux négatif est estimé comme le montant du crédit multiplié par la perte en cas de défaut (LGD - Loss Given Default), en réutilisant la même table LGD par type de garantie déjà utilisée par le moteur IA pour afficher la perte attendue à l'agent (35% pour un bien matériel, 40% pour une caution solidaire, 45% pour l'aval d'un tiers, 65% en l'absence de garantie), plutôt que d'introduire une deuxième hypothèse LGD qui aurait divergé de celle déjà en production. Le coût d'un faux positif est estimé comme la marge d'intérêt non perçue (12% du montant, cohérent avec la formule de mensualité du générateur de données). Ces hypothèses de coût restent, comme le reste du dataset, à recalibrer avec les données réelles de recouvrement d'une coopérative partenaire."),
      costTable,
      new Paragraph({ text: "", spacing: { after: 160 } }),
      p("La régression logistique minimise ce coût attendu sur validation (8,12 millions FCFA sur 600 dossiers, contre 8,77 à 9,03 millions pour les autres modèles), avec un gain de 2,88 millions FCFA par rapport à un seuil de décision fixé arbitrairement à 0,5. Le stacking fait légèrement mieux que les modèles à base d'arbres, mais n'a pas été retenu pour le déploiement : c'est un méta-modèle combinant les sorties de cinq modèles, sans explication SHAP native et fidèle par variable au niveau d'un dossier individuel, ce qui casserait l'engagement d'explicabilité pris en 2.5. Il reste documenté ici à titre de référence."),
      p("Résultat final, sur le test tenu à l'écart de toute décision (600 dossiers, jamais regardés avant cette évaluation) : ROC-AUC = 0,752 (en hausse par rapport à la validation - fluctuation normale sur un échantillon de cette taille, à ne pas sur-interpréter), mais le seuil optimisé sur validation (0,74) fait légèrement moins bien sur ce test que le seuil naïf 0,5 (coût de 9,13 millions FCFA, contre un gain positif attendu sur validation). Nous préférons publier ce résultat tel quel plutôt que de le lisser : avec seulement 600 dossiers de validation (dont environ 76 en défaut), le seuil optimal exact est estimé avec un vrai bruit d'échantillonnage, et ce type d'écart entre validation et test est un signal attendu, pas une anomalie à corriger a posteriori. Une piste d'amélioration documentée en section 4 est de stabiliser ce seuil par validation croisée répétée (bootstrap) plutôt que par un unique point de validation, une fois un volume de données réel plus important disponible."),

      h2("2.5. Décision à trois niveaux et explicabilité"),
      p("Plutôt qu'une réponse binaire accordé/refusé, l'outil restitue une probabilité de défaut et la classe dans l'une de trois zones : verte (dossier plutôt sûr), orange (à examiner en comité de crédit) et rouge (risque élevé). Les seuils de ces zones sont calculés automatiquement autour du seuil de décision optimal du modèle retenu, et non fixés arbitrairement à 50%. L'agent garde la main sur la décision finale, en particulier sur les dossiers orange."),
      p("Pour chaque dossier évalué, l'application affiche également les facteurs qui ont le plus pesé sur le score, calculés avec SHAP et présentés en français plutôt que sous forme de coefficients bruts. L'objectif est qu'un agent puisse dire à un client \"votre dossier est jugé plus risqué parce que X et Y\", et pas seulement lui communiquer un chiffre."),

      h2("2.6. Illustration : un dossier concret"),
      p("Pour rendre ce fonctionnement tangible, voici un exemple de dossier tel qu'il serait traité par l'application (chiffres calculés en faisant réellement passer ce profil dans le pipeline entraîné - préprocesseur, régression logistique retenue et explainer SHAP - pas des valeurs de façade) :"),
      new Table({
        width: { size: 9350, type: WidthType.DXA },
        columnWidths: [3117, 6233],
        rows: [
          new TableRow({ children: [
            cell("Profil", { header: true, width: 3117, shade: NAVY }),
            cell("Détail", { header: true, width: 6233, shade: NAVY }),
          ]}),
          new TableRow({ children: [cell("Demandeuse", { width: 3117, bold: true }), cell("Commerçante, secteur informel, zone urbaine, membre de la coopérative depuis 6 mois, épargne irrégulière, Mobile Money actif, aucun historique de crédit interne (nouvelle emprunteuse), un prêt actif ailleurs (50 000 FCFA d'encours)", { width: 6233 })]}),
          new TableRow({ children: [cell("Demande", { width: 3117, bold: true }), cell("600 000 FCFA sur 12 mois, objet \"Fonds de commerce\", garantie proposée : caution solidaire", { width: 6233 })]}),
          new TableRow({ children: [cell("Probabilité de défaut", { width: 3117, bold: true }), cell("71,5 % - au-dessus du seuil vert (59%) mais en-dessous du seuil rouge (84%)", { width: 6233 })]}),
          new TableRow({ children: [cell("Score crédit (scorecard)", { width: 3117, bold: true }), cell("573 / 900", { width: 6233 })]}),
          new TableRow({ children: [cell("Perte attendue", { width: 3117, bold: true }), cell("171 600 FCFA (= probabilité de défaut x 40% de perte en cas de défaut pour une caution solidaire x montant demandé)", { width: 6233 })]}),
          new TableRow({ children: [cell("Facteurs défavorables (SHAP)", { width: 3117, bold: true }), cell("Absence d'historique de crédit interne (nouvelle emprunteuse), montant demandé élevé compte tenu du profil, prêt actif dans une autre institution, secteur d'activité informel", { width: 6233 })]}),
          new TableRow({ children: [cell("Facteurs favorables (SHAP)", { width: 3117, bold: true }), cell("Appartenance à un groupe solidaire, garantie par caution solidaire", { width: 6233 })]}),
          new TableRow({ children: [cell("Décision affichée", { width: 3117, bold: true }), cell("Zone orange - \"À examiner en comité de crédit\" (l'agent garde la main, éclairé par les éléments ci-dessus)", { width: 6233 })]}),
        ],
      }),
      new Paragraph({ text: "", spacing: { after: 160 } }),
      p("Ce cas illustre l'apport concret de l'outil pour l'agent : au lieu d'un simple \"oui/non\", il dispose en quelques secondes d'une probabilité de défaut, d'un chiffrage du risque financier (perte attendue en FCFA) et d'une explication en langage clair des éléments qui ont pesé dans un sens ou dans l'autre - de quoi nourrir une discussion argumentée en comité de crédit plutôt qu'une décision opaque. Avec une régression logistique, cette explication SHAP (LinearExplainer) reste directement lisible comme un poids stable par variable, cohérent d'un dossier à l'autre - un atout pour la formation des agents, à la différence d'un modèle à base d'arbres où l'importance d'une même variable peut varier selon ses interactions avec le reste du profil."),

      h2("2.7. Application de démonstration"),
      p("Le prototype démontrable est une application Streamlit en Python, volontairement légère : elle charge le modèle une seule fois, ne fait aucun appel réseau externe et peut donc tourner sur un poste d'agence avec une connexion internet limitée ou absente. Le formulaire de saisie reprend les mêmes champs que le jeu de données d'entraînement, ce qui garantit la cohérence entre ce qui a été appris et ce qui est saisi sur le terrain."),

      h1("3. Valeur ajoutée attendue"),
      bullet("Un traitement de dossier plus rapide, avec un premier avis disponible en quelques secondes plutôt qu'après une analyse manuelle complète."),
      bullet("Une évaluation plus homogène entre agents et entre agences, sans remplacer leur jugement sur les dossiers à examiner."),
      bullet("Une meilleure prise en compte des clients sans historique bancaire formel, via des données que la coopérative détient déjà (épargne, activité, Mobile Money)."),
      bullet("Un outil explicable, donc plus facilement adopté par des agents qui doivent pouvoir justifier une décision au client."),
      bullet("Une solution qui reste utilisable dans les conditions réelles de connectivité et de ressources informatiques des Coopératives financières."),

      h1("4. Limites actuelles et prochaines étapes"),
      p("Le prototype repose pour l'instant sur des données simulées : les chiffres de performance présentés plus haut donnent une tendance et une méthodologie solide, mais devront être revalidés dès que des données réelles seront disponibles. C'est d'ailleurs la première étape que nous proposons après le hackathon : obtenir, via une coopérative partenaire, un échantillon de dossiers anonymisés pour recalibrer le générateur et ré-entraîner le modèle sur des cas réels. Viendraient ensuite l'ajout d'un import de dossiers en masse depuis un fichier Excel pour un traitement par lot en agence, puis un suivi dans le temps des décisions prises (journal des décisions) pour vérifier que le modèle reste fiable une fois en usage réel."),
      p("Un point mérite d'être clarifié dès maintenant plutôt que découvert au moment du déploiement : l'intégration réelle du BIC n'est pas un simple appel API gratuit et instantané. La consultation est facturée à la coopérative selon un barème fixé par la BCEAO, et les données remontées par les banques et les autres SFD ne sont mises à jour qu'une fois par mois (transmission le 10 de chaque mois). Cela veut dire que le statut BIC affiché pour un client peut avoir jusqu'à quatre semaines de décalage, et que la coopérative doit signer un accord d'accès avec le BIC régional avant de pouvoir l'interroger en production. Notre prototype simule ce signal pour démontrer sa valeur pour le score, mais son branchement réel demande une démarche administrative et un budget de consultation, pas seulement du développement logiciel - un point que nous proposons d'inscrire explicitement dans le plan de déploiement pilote."),
      p("Une piste d'amélioration distincte, à explorer une fois des données réelles disponibles, est l'ajout de variables dites \"non structurelles\" ou alternatives - c'est-à-dire des signaux qui ne viennent pas d'un formulaire structuré classique. Dans le contexte des coopératives ouest-africaines, les plus pertinentes seraient : (i) des features comportementales dérivées de l'historique Mobile Money (régularité et volatilité des transactions dans le temps, pas seulement leur fréquence moyenne comme actuellement), que la coopérative détient déjà en partie via l'opérateur Mobile Money et qui ne posent pas de difficulté de collecte nouvelle ; (ii) les notes de terrain de l'agent de crédit (texte libre), qui demanderaient un traitement NLP dédié ; (iii) des données de géolocalisation de l'activité économique ; (iv) un questionnaire psychométrique, utilisé par certains acteurs de la microfinance (ex. Entrepreneurial Finance Lab) pour scorer des emprunteurs sans historique. Nous n'avons pas ajouté ces variables au générateur synthétique actuel : les fabriquer artificiellement dans un dataset déjà simulé aurait ajouté une deuxième couche de données inventées sans valeur démonstrative réelle, et (ii) à (iv) soulèvent des questions de consentement et de conformité à la loi burkinabè sur la protection des données à caractère personnel qui dépassent le cadre de ce prototype. La priorité que nous recommandons, dans l'ordre, est donc : d'abord recalibrer le générateur et le modèle sur des données réelles de coopérative (étape déjà planifiée ci-dessus), puis enrichir les features Mobile Money existantes (faisabilité immédiate, pas de nouvelle collecte), et seulement ensuite étudier les données de terrain plus lourdes à mettre en place (iii et iv), en associant dès cette étape le référent protection des données de la coopérative partenaire."),
      p("Enfin, comme signalé en 2.4, le seuil de décision déployé (0,74) est actuellement choisi à partir d'un unique jeu de validation de 600 dossiers, ce qui laisse une marge d'incertitude visible sur le jeu de test (le seuil optimisé y fait légèrement moins bien qu'un seuil naïf de 0,5). Une fois un volume de données réelles suffisant disponible, nous recommandons de stabiliser ce choix par validation croisée répétée ou bootstrap (estimer le seuil optimal sur plusieurs ré-échantillonnages plutôt que sur un seul jeu de validation, puis retenir la médiane ou la moyenne), une pratique standard pour réduire la variance d'un seuil de décision estimé sur un échantillon de taille modeste."),

      h1("5. Composition et complémentarité de l'équipe"),
      p("L'équipe réunit trois étudiants en Master Data Science et une personne en génie logiciel, avec une répartition qui correspond à ce qui a été réellement fait sur ce prototype :"),
      bullet("Données & Feature Engineering - conception et calibration du générateur de données, documentation des variables ;"),
      bullet("Modélisation & Évaluation - prétraitement, gestion du déséquilibre des classes (SMOTE), comparaison des modèles et choix du seuil de décision ;"),
      bullet("Explicabilité & Démo - intégration de SHAP, animation de l'application de démonstration, narratif du pitch ;"),
      bullet("Intégration & Robustesse - structuration du code, packaging du modèle, tests, support technique pendant la démonstration."),
      p("Cette répartition correspond directement au critère de sélection « complémentarité et équilibre des compétences au sein de l'équipe »."),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  require("fs").writeFileSync("note_presentation_CreditSurWA_v2.docx", buf);
  console.log("OK");
});
