const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const VERSION = "6.0";

const SOURCES_OFFICIELLES = [
  {
    nom: "Service-Public",
    domaine: "service-public.fr",
    url: "https://www.service-public.fr/"
  },
  {
    nom: "Service-Public Entreprendre",
    domaine: "entreprendre.service-public.fr",
    url: "https://entreprendre.service-public.fr/"
  },
  {
    nom: "URSSAF",
    domaine: "urssaf.fr",
    url: "https://www.urssaf.fr/"
  },
  {
    nom: "Impôts",
    domaine: "impots.gouv.fr",
    url: "https://www.impots.gouv.fr/"
  },
  {
    nom: "Économie",
    domaine: "economie.gouv.fr",
    url: "https://www.economie.gouv.fr/"
  },
  {
    nom: "Travail",
    domaine: "travail-emploi.gouv.fr",
    url: "https://travail-emploi.gouv.fr/"
  }
];

function clean(value, max = 5000) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, max);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
    }
  });
}

function html(content) {
  return new Response(content, {
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
    }
  });
}

/* -------------------------------------------------------
   SOURCES OFFICIELLES
------------------------------------------------------- */

function choisirSources(question, secteur = "", activite = "") {
  const texte = (
    question +
    " " +
    secteur +
    " " +
    activite
  ).toLowerCase();

  const sources = [];

  function ajouter(nom) {
    const source = SOURCES_OFFICIELLES.find(
      s => s.nom.toLowerCase() === nom.toLowerCase()
    );

    if (
      source &&
      !sources.some(s => s.domaine === source.domaine)
    ) {
      sources.push(source);
    }
  }

  if (
    texte.includes("impôt") ||
    texte.includes("impot") ||
    texte.includes("fiscal") ||
    texte.includes("tva") ||
    texte.includes("cfe") ||
    texte.includes("taxe")
  ) {
    ajouter("Impôts");
    ajouter("Service-Public Entreprendre");
    ajouter("URSSAF");
  }

  if (
    texte.includes("urssaf") ||
    texte.includes("cotisation") ||
    texte.includes("micro-entreprise") ||
    texte.includes("micro entrepreneur") ||
    texte.includes("indépendant") ||
    texte.includes("independant")
  ) {
    ajouter("URSSAF");
    ajouter("Service-Public Entreprendre");
    ajouter("Impôts");
  }

  if (
    texte.includes("entreprise") ||
    texte.includes("entreprendre") ||
    texte.includes("création") ||
    texte.includes("creation") ||
    texte.includes("société") ||
    texte.includes("societe")
  ) {
    ajouter("Service-Public Entreprendre");
    ajouter("URSSAF");
    ajouter("Impôts");
  }

  if (
    texte.includes("travail") ||
    texte.includes("emploi") ||
    texte.includes("salarié") ||
    texte.includes("salarie") ||
    texte.includes("contrat") ||
    texte.includes("licenciement")
  ) {
    ajouter("Service-Public");
    ajouter("Travail");
  }

  if (
    texte.includes("droit") ||
    texte.includes("juridique") ||
    texte.includes("avocat") ||
    texte.includes("administratif") ||
    texte.includes("démarche") ||
    texte.includes("demarche") ||
    texte.includes("document") ||
    texte.includes("aide")
  ) {
    ajouter("Service-Public");
  }

  if (
    texte.includes("social") ||
    texte.includes("aide sociale") ||
    texte.includes("rsa") ||
    texte.includes("logement") ||
    texte.includes("handicap") ||
    texte.includes("famille")
  ) {
    ajouter("Service-Public");
  }

  if (sources.length === 0) {
    ajouter("Service-Public");
    ajouter("Service-Public Entreprendre");
  }

  return sources.slice(0, 4);
}

/* -------------------------------------------------------
   RÉCUPÉRATION LIMITÉE DES PAGES OFFICIELLES
------------------------------------------------------- */

async function recupererSource(source) {
  try {
    const response = await fetch(source.url, {
      method: "GET",
      headers: {
        "User-Agent": "GouRareAI/6.0"
      }
    });

    if (!response.ok) {
      return {
        nom: source.nom,
        url: source.url,
        disponible: false,
        extrait: ""
      };
    }

    const texte = await response.text();

    const propre = texte
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      nom: source.nom,
      url: source.url,
      disponible: true,
      extrait: propre.slice(0, 7000)
    };
  } catch (error) {
    return {
      nom: source.nom,
      url: source.url,
      disponible: false,
      extrait: ""
    };
  }
}

async function recupererSources(question, secteur, activite) {
  const sources = choisirSources(
    question,
    secteur,
    activite
  );

  const resultats = await Promise.all(
    sources.map(source => recupererSource(source))
  );

  return resultats;
}

/* -------------------------------------------------------
   PROMPT PRINCIPAL
------------------------------------------------------- */

function systemPrompt() {
  return `
Tu es GouRare AI V6.

GouRare AI est une intelligence d'orientation pratique destinée aux citoyens,
salariés, demandeurs d'emploi, indépendants, micro-entrepreneurs,
entrepreneurs et petites entreprises.

Tu peux aider dans plusieurs domaines :

- démarches administratives
- droit et orientation juridique
- fiscalité
- comptabilité
- création d'entreprise
- URSSAF
- emploi et travail
- métiers et secteurs
- stratégie d'entreprise
- organisation
- problèmes professionnels
- problèmes administratifs
- orientation sociale
- droits et aides
- recherche de solutions
- opportunités économiques
- identification de problèmes dans un secteur
- préparation avant consultation d'un professionnel

IMPORTANT :

Tu n'es PAS :
- un avocat
- un expert-comptable
- un médecin
- un travailleur social
- une administration
- un organisme officiel

Tu aides à comprendre, organiser, vérifier et agir.

RÈGLE ABSOLUE :

NE JAMAIS inventer :
- une loi
- un article de loi
- une obligation
- une autorisation
- une licence
- un registre
- un seuil
- un taux
- un montant
- une pénalité
- une date limite
- une aide
- une statistique
- un chiffre
- un organisme
- une procédure officielle

Si les sources fournies ne permettent pas de confirmer une information,
dis exactement :

"Information à vérifier auprès de la source officielle compétente."

Ne transforme jamais une hypothèse en obligation.

Pour les informations françaises :
privilégie les sources officielles fournies.

Tu dois distinguer :

1. INFORMATION CONFIRMÉE
2. INFORMATION À VÉRIFIER
3. ORIENTATION / RECOMMANDATION
4. INTERVENTION D'UN PROFESSIONNEL NÉCESSAIRE

Quand une personne demande une démarche :
explique concrètement :
- ce qu'elle cherche à faire
- ce qui semble applicable
- où effectuer la démarche
- quels documents peuvent être nécessaires
- ce qui doit être vérifié
- les risques d'erreur
- la prochaine action

Pour les personnes en difficulté sociale :
ne juge jamais la personne.
Cherche à identifier :
- droits possibles
- aides possibles
- organismes compétents
- services publics
- démarches
- documents
- orientation vers un professionnel ou organisme humain si nécessaire.

Pour une opportunité commerciale :
ne fabrique pas de chiffres.
Une hypothèse doit être explicitement présentée comme hypothèse.

Pour les problèmes d'entreprise :
cherche le problème réel avant de proposer une solution.

Pour les secteurs :
ne donne pas une liste générique de logiciels.
Cherche :
- problème réel
- personne qui subit le problème
- personne qui décide
- personne qui paie
- raison de payer
- solution
- moyen de tester rapidement

Réponds en français clair.
`;
}

/* -------------------------------------------------------
   JSON SCHEMA
------------------------------------------------------- */

const schema = {
  type: "object",
  properties: {
    titre: {
      type: "string"
    },
    comprehension: {
      type: "string"
    },
    orientation: {
      type: "string"
    },
    confirme: {
      type: "array",
      items: {
        type: "string"
      }
    },
    verifier: {
      type: "array",
      items: {
        type: "string"
      }
    },
    actions: {
      type: "array",
      items: {
        type: "string"
      }
    },
    documents: {
      type: "array",
      items: {
        type: "string"
      }
    },
    risques: {
      type: "array",
      items: {
        type: "string"
      }
    },
    professionnel: {
      type: "string"
    },
    prochaine_action: {
      type: "string"
    }
  },
  required: [
    "titre",
    "comprehension",
    "orientation",
    "confirme",
    "verifier",
    "actions",
    "documents",
    "risques",
    "professionnel",
    "prochaine_action"
  ]
};

/* -------------------------------------------------------
   APPEL IA
------------------------------------------------------- */

async function askAI(env, question, contexteSources) {
  const prompt = `
QUESTION UTILISATEUR :

${question}

SOURCES OFFICIELLES DISPONIBLES :

${contexteSources || "Aucune source officielle exploitable."}

IMPORTANT :

Tu dois utiliser les sources uniquement comme base documentaire.

Si une information n'est pas clairement confirmée par les sources
ou par une connaissance générale très sûre :

NE L'AFFIRME PAS COMME UN FAIT.

Ne fabrique aucun organisme, registre, autorisation,
seuil, montant, taux, délai ou obligation.

Si les sources sont insuffisantes,
indique que la vérification est nécessaire.

Réponds de manière pratique et utile.
`;

  const result = await env.IA.run(
    MODEL,
    {
      messages: [
        {
          role: "system",
          content: systemPrompt()
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: schema
      },
      max_tokens: 2200,
      temperature: 0.08
    }
  );

  let response = "";

  if (typeof result === "string") {
    response = result;
  } else if (result?.response) {
    response = result.response;
  } else if (result?.result?.response) {
    response = result.result.response;
  } else {
    response = JSON.stringify(result);
  }

  try {
    return JSON.parse(response);
  } catch {
    return {
      titre: "Réponse GouRare AI",
      comprehension: "",
      orientation: response,
      confirme: [],
      verifier: [
        "La réponse structurée n'a pas pu être interprétée automatiquement."
      ],
      actions: [],
      documents: [],
      risques: [],
      professionnel:
        "Vérifiez les informations auprès de la source officielle compétente.",
      prochaine_action:
        "Consultez la source officielle correspondant à votre situation."
    };
  }
}

/* -------------------------------------------------------
   CONTEXTE POUR SECTEUR
------------------------------------------------------- */

function promptSecteur(secteur) {
  return `
Analyse le secteur suivant :

${secteur}

GouRare AI cherche à découvrir de vrais problèmes économiques
et des opportunités concrètes.

Ne donne PAS une liste générique de logiciels.

Cherche notamment :

- problèmes opérationnels
- perte de temps
- erreurs
- retards
- qualité
- organisation
- acquisition de clients
- fidélisation
- communication
- administration
- personnel
- formation
- coordination
- coûts
- risques
- tâches répétitives
- problèmes mal servis par les solutions existantes

Pour chaque opportunité :
- problème précis
- qui souffre
- qui décide
- qui paie
- pourquoi il paierait
- solution
- type de solution
- rôle éventuel de l'IA
- difficulté de lancement
- difficulté de vente
- différenciation
- test rapide

IMPORTANT :
Ne donne que 5 opportunités.
Ne donne aucun score numérique inventé.
Utilise plutôt :
faible / moyen / élevé.

Ne prétends jamais qu'une demande de marché est prouvée
sans preuve.

Présente les hypothèses comme des hypothèses.
`;
}

/* -------------------------------------------------------
   PROMPT INDÉPENDANT
------------------------------------------------------- */

function promptIndependant(
  activite,
  statut,
  question
) {
  return `
Situation :

Activité :
${activite}

Statut :
${statut}

Question :
${question}

Analyse la situation française.

Cherche notamment si pertinent :

- création
- immatriculation
- statut
- URSSAF
- fiscalité
- TVA
- CFE
- facturation
- déclarations
- comptabilité
- assurances
- obligations professionnelles
- documents
- conservation des documents
- compte bancaire
- recours à un comptable
- recours à un avocat

ATTENTION :

Ne dis jamais automatiquement :

"vous devez vous inscrire au RCS"

ou

"vous devez obtenir une licence"

ou

"vous devez obtenir une autorisation"

sans disposer d'une base permettant de confirmer
que cette obligation concerne réellement l'activité.

Si tu ne peux pas confirmer :
indique "À vérifier".

Ne donne aucun seuil, taux, montant ou délai
sans source fiable.

La réponse doit permettre à la personne
de savoir quelle est sa prochaine action.
`;
}

/* -------------------------------------------------------
   PROMPT PROBLÈME
------------------------------------------------------- */

function promptProbleme(probleme) {
  return `
Problème présenté :

${probleme}

Ne donne pas immédiatement une solution générique.

Commence par identifier :

1. le problème central
2. les causes possibles
3. les conséquences
4. ce qu'il faut vérifier
5. les solutions possibles
6. la solution la plus simple
7. la solution potentiellement la plus efficace
8. les risques
9. l'ordre des actions
10. la prochaine action concrète

Si le problème concerne :
- administration
- droit
- fiscalité
- social
- emploi

indique également quand une vérification officielle
ou l'intervention d'un professionnel est nécessaire.
`;
}

/* -------------------------------------------------------
   FORMATAGE
------------------------------------------------------- */

function creerQuestion(
  type,
  message,
  secteur,
  activite,
  statut
) {
  if (type === "sector") {
    return promptSecteur(secteur);
  }

  if (type === "independent") {
    return promptIndependant(
      activite,
      statut,
      message
    );
  }

  if (type === "problem") {
    return promptProbleme(message);
  }

  return `
Analyse cette question :

${message}

Identifie d'abord le domaine :
administratif, juridique, fiscal,
comptable, social, emploi,
entreprise, métier, secteur,
problème ou autre.

Ne suppose pas la situation personnelle
de l'utilisateur.

Donne une orientation pratique.
`;
}

/* -------------------------------------------------------
   PAGE
------------------------------------------------------- */

function page() {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>GouRare AI</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  background:
    radial-gradient(
      circle at top,
      #18223a,
      #070b13 55%
    );

  color: #f5f7fb;
  min-height: 100vh;
}

.container {
  width: min(1050px, 94%);
  margin: auto;
  padding: 35px 0 100px;
}

header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  font-size: 42px;
  font-weight: 800;
  letter-spacing: -2px;
}

.logo span {
  color: #8ab4ff;
}

.subtitle {
  color: #aeb8ca;
  margin-top: 10px;
}

.badge {
  display: inline-block;
  margin-top: 15px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(138,180,255,.12);
  border: 1px solid rgba(138,180,255,.25);
  color: #bcd3ff;
  font-size: 13px;
}

.panel {
  background: rgba(17,24,39,.88);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 22px;
  padding: 22px;
  box-shadow: 0 25px 70px rgba(0,0,0,.3);
}

.tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}

.tab {
  border: 1px solid rgba(255,255,255,.08);
  background: #111827;
  color: #b8c0d0;
  padding: 13px 8px;
  border-radius: 12px;
  cursor: pointer;
}

.tab.active {
  background: #253b68;
  color: white;
  border-color: #5278c9;
}

.mode {
  display: none;
}

.mode.active {
  display: block;
}

label {
  display: block;
  margin: 14px 0 7px;
  color: #dbe3f2;
  font-weight: 600;
}

input,
textarea,
select {
  width: 100%;
  border: 1px solid rgba(255,255,255,.1);
  background: #0c1220;
  color: white;
  padding: 14px;
  border-radius: 12px;
  outline: none;
  font-size: 15px;
}

textarea {
  min-height: 130px;
  resize: vertical;
}

button.primary {
  width: 100%;
  margin-top: 18px;
  padding: 15px;
  border: 0;
  border-radius: 12px;
  background: #4778d9;
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

button.primary:disabled {
  opacity: .55;
  cursor: wait;
}

.results {
  margin-top: 25px;
}

.result-card {
  background: rgba(10,15,27,.9);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 18px;
  padding: 20px;
}

.result-card h2 {
  margin-top: 0;
}

.section {
  margin-top: 20px;
}

.section h3 {
  color: #9fc0ff;
  margin-bottom: 8px;
}

.section ul {
  padding-left: 20px;
}

.section li {
  margin-bottom: 8px;
  color: #d4dbea;
}

.next {
  margin-top: 22px;
  padding: 17px;
  border-radius: 14px;
  background: rgba(71,120,217,.15);
  border: 1px solid rgba(71,120,217,.3);
}

.sources {
  margin-top: 22px;
  padding: 16px;
  border-radius: 14px;
  background: rgba(255,255,255,.035);
}

.sources a {
  color: #9fc0ff;
}

.cancer-support {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 50;
  background: rgba(20,27,42,.96);
  color: #f4f6fb;
  border: 1px solid rgba(255,255,255,.12);
  padding: 9px 13px;
  border-radius: 999px;
  text-decoration: none;
  font-size: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,.3);
}

footer {
  text-align: center;
  color: #7f8aa0;
  margin-top: 35px;
  font-size: 13px;
}

@media (max-width: 700px) {

  .logo {
    font-size: 34px;
  }

  .tabs {
    grid-template-columns: repeat(2, 1fr);
  }

  .panel {
    padding: 15px;
  }

}

</style>
</head>

<body>

<div class="container">

<header>
  <div class="logo">
    Gou<span>Rare</span> AI
  </div>

  <div class="subtitle">
    Intelligence • Orientation • Solutions
  </div>

  <div class="badge">
    Intelligence vérifiée et orientation pratique
  </div>
</header>

<div class="panel">

<div class="tabs">

<button class="tab active" data-mode="question">
Question
</button>

<button class="tab" data-mode="sector">
Secteur
</button>

<button class="tab" data-mode="independent">
Indépendant
</button>

<button class="tab" data-mode="problem">
Problème
</button>

</div>

<!-- QUESTION -->

<div class="mode active" id="question">

<label>
Votre question
</label>

<textarea
id="questionText"
placeholder="Exemple : Je veux créer une entreprise de nettoyage en France. Que dois-je faire ?"
></textarea>

<button
class="primary"
onclick="analyser('question')"
>
Analyser avec GouRare AI
</button>

</div>

<!-- SECTEUR -->

<div class="mode" id="sector">

<label>
Secteur ou métier
</label>

<input
id="sectorText"
placeholder="Exemple : Nettoyage"
/>

<button
class="primary"
onclick="analyser('sector')"
>
Analyser le secteur
</button>

</div>

<!-- INDÉPENDANT -->

<div class="mode" id="independent">

<label>
Activité
</label>

<input
id="activityText"
placeholder="Exemple : Nettoyage à domicile"
/>

<label>
Statut
</label>

<input
id="statusText"
placeholder="Exemple : Micro-entrepreneur"
/>

<label>
Votre question
</label>

<textarea
id="independentQuestion"
placeholder="Exemple : Quelles sont mes obligations fiscales ?"
></textarea>

<button
class="primary"
onclick="analyser('independent')"
>
Analyser ma situation
</button>

</div>

<!-- PROBLÈME -->

<div class="mode" id="problem">

<label>
Quel est votre problème ?
</label>

<textarea
id="problemText"
placeholder="Décrivez votre problème le plus précisément possible."
></textarea>

<button
class="primary"
onclick="analyser('problem')"
>
Chercher une solution
</button>

</div>

<div
id="results"
class="results"
></div>

</div>

<footer>
  GouRare AI — Une intelligence au service de l'orientation,
  des solutions et de la vie.
  <br><br>
  🎗️ Notre soutien aux personnes touchées par le cancer.
</footer>

</div>

<a
class="cancer-support"
href="#soutien"
aria-label="GouRare AI soutient les personnes touchées par le cancer"
>
🎗️ Avec vous contre le cancer
</a>

<script>

const tabs =
document.querySelectorAll(".tab");

const modes =
document.querySelectorAll(".mode");

tabs.forEach(tab => {

  tab.addEventListener("click", () => {

    tabs.forEach(t =>
      t.classList.remove("active")
    );

    modes.forEach(m =>
      m.classList.remove("active")
    );

    tab.classList.add("active");

    const mode =
      document.getElementById(
        tab.dataset.mode
      );

    mode.classList.add("active");

  });

});

function escapeHTML(value) {

  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

function liste(items) {

  if (!Array.isArray(items) || items.length === 0) {
    return "<p>Aucune information particulière.</p>";
  }

  return (
    "<ul>" +
    items
      .map(item =>
        "<li>" +
        escapeHTML(item) +
        "</li>"
      )
      .join("") +
    "</ul>"
  );

}

function afficherAnalyse(data, sources) {

  const results =
    document.getElementById("results");

  let sourceHTML = "";

  if (Array.isArray(sources) && sources.length) {

    sourceHTML =
      '<div class="sources">' +
        "<h3>Sources officielles consultées</h3>" +
        "<ul>" +
        sources.map(source => {

          return (
            "<li>" +
            '<a href="' +
            escapeHTML(source.url) +
            '" target="_blank" rel="noopener noreferrer">' +
            escapeHTML(source.nom) +
            "</a>" +
            (source.disponible
              ? ""
              : " — source non disponible au moment de l'analyse") +
            "</li>"
          );

        }).join("") +
        "</ul>" +
      "</div>";

  }

  results.innerHTML =
    '<div class="result-card">' +

      "<h2>" +
      escapeHTML(data.titre) +
      "</h2>" +

      '<div class="section">' +
        "<h3>Ce que j'ai compris</h3>" +
        "<p>" +
        escapeHTML(data.comprehension) +
        "</p>" +
      "</div>" +

      '<div class="section">' +
        "<h3>Orientation</h3>" +
        "<p>" +
        escapeHTML(data.orientation) +
        "</p>" +
      "</div>" +

      '<div class="section">' +
        "<h3>Informations confirmées</h3>" +
        liste(data.confirme) +
      "</div>" +

      '<div class="section">' +
        "<h3>Informations à vérifier</h3>" +
        liste(data.verifier) +
      "</div>" +

      '<div class="section">' +
        "<h3>Actions possibles</h3>" +
        liste(data.actions) +
      "</div>" +

      '<div class="section">' +
        "<h3>Documents / informations</h3>" +
        liste(data.documents) +
      "</div>" +

      '<div class="section">' +
        "<h3>Risques / points d'attention</h3>" +
        liste(data.risques) +
      "</div>" +

      '<div class="section">' +
        "<h3>Quand consulter un professionnel</h3>" +
        "<p>" +
        escapeHTML(data.professionnel) +
        "</p>" +
      "</div>" +

      '<div class="next">' +
        "<strong>PROCHAINE ACTION</strong>" +
        "<p>" +
        escapeHTML(data.prochaine_action) +
        "</p>" +
      "</div>" +

      sourceHTML +

    "</div>";

  results.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}

async function analyser(mode) {

  const results =
    document.getElementById("results");

  results.innerHTML =
    '<div class="result-card">' +
      "<p>⏳ GouRare AI vérifie et analyse votre demande...</p>" +
    "</div>";

  let payload = {
    type: mode,
    message: "",
    sector: "",
    activity: "",
    status: ""
  };

  if (mode === "question") {

    payload.message =
      document.getElementById(
        "questionText"
      ).value.trim();

  }

  if (mode === "sector") {

    payload.sector =
      document.getElementById(
        "sectorText"
      ).value.trim();

  }

  if (mode === "independent") {

    payload.activity =
      document.getElementById(
        "activityText"
      ).value.trim();

    payload.status =
      document.getElementById(
        "statusText"
      ).value.trim();

    payload.message =
      document.getElementById(
        "independentQuestion"
      ).value.trim();

  }

  if (mode === "problem") {

    payload.message =
      document.getElementById(
        "problemText"
      ).value.trim();

  }

  if (
    !payload.message &&
    !payload.sector &&
    !payload.activity
  ) {

    results.innerHTML =
      '<div class="result-card">' +
        "<p>Veuillez remplir votre demande.</p>" +
      "</div>";

    return;

  }

  const buttons =
    document.querySelectorAll(
      "button.primary"
    );

  buttons.forEach(
    button => button.disabled = true
  );

  try {

    const response =
      await fetch("/api/analyze", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(payload)

      });

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.error ||
        "Erreur pendant l'analyse."
      );

    }

    afficherAnalyse(
      data.analyse,
      data.sources
    );

  } catch (error) {

    results.innerHTML =
      '<div class="result-card">' +
        "<h2>Erreur</h2>" +
        "<p>" +
        escapeHTML(error.message) +
        "</p>" +
      "</div>";

  } finally {

    buttons.forEach(
      button => button.disabled = false
    );

  }

}

</script>

</body>
</html>`;
}

/* -------------------------------------------------------
   WORKER
------------------------------------------------------- */

export default {

  async fetch(request, env) {

    const url =
      new URL(request.url);

    if (url.pathname === "/health") {

      return json({
        success: true,
        service: "GouRare AI",
        status: "OK",
        version: VERSION
      });

    }

    if (
      url.pathname === "/" &&
      request.method === "GET"
    ) {

      return html(page());

    }

    if (
      url.pathname === "/api/analyze"
    ) {

      if (request.method !== "POST") {

        return json(
          {
            success: false,
            error: "Méthode non autorisée."
          },
          405
        );

      }

      const contentType =
        request.headers.get(
          "content-type"
        ) || "";

      if (
        !contentType
          .toLowerCase()
          .includes("application/json")
      ) {

        return json(
          {
            success: false,
            error:
              "Le contenu doit être envoyé en JSON."
          },
          415
        );

      }

      let body;

      try {

        body = await request.json();

      } catch {

        return json(
          {
            success: false,
            error: "JSON invalide."
          },
          400
        );

      }

      const type =
        clean(body.type, 30);

      const message =
        clean(body.message, 5000);

      const sector =
        clean(body.sector, 150);

      const activity =
        clean(body.activity, 200);

      const status =
        clean(body.status, 150);

      if (
        !message &&
        !sector &&
        !activity
      ) {

        return json(
          {
            success: false,
            error:
              "Veuillez fournir une demande."
          },
          400
        );

      }

      const question =
        creerQuestion(
          type,
          message,
          sector,
          activity,
          status
        );

      const sources =
        await recupererSources(
          message + " " + question,
          sector,
          activity
        );

      const sourcesDisponibles =
        sources
          .filter(s => s.disponible)
          .map(s =>
            `
SOURCE :
${s.nom}

URL :
${s.url}

CONTENU :
${s.extrait}
`
          )
          .join("\n\n");

      try {

        const analyse =
          await askAI(
            env,
            question,
            sourcesDisponibles
          );

        return json({
          success: true,
          version: VERSION,
          analyse,
          sources: sources.map(source => ({
            nom: source.nom,
            url: source.url,
            disponible: source.disponible
          }))
        });

      } catch (error) {

        return json(
          {
            success: false,
            error:
              "Le service d'intelligence est temporairement indisponible.",
            details:
              "Veuillez réessayer."
          },
          500
        );

      }

    }

    return new Response(
      "GouRare AI",
      {
        status: 404,
        headers: {
          "Content-Type":
            "text/plain; charset=UTF-8"
        }
      }
    );

  }

};
