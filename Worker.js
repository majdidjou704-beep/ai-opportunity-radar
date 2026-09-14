const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const VERSION = "6.1";

/* =====================================================
   SOURCES OFFICIELLES
===================================================== */

const SOURCES_OFFICIELLES = [
  {
    nom: "Service-Public",
    url: "https://www.service-public.fr/"
  },
  {
    nom: "Service-Public Entreprendre",
    url: "https://entreprendre.service-public.fr/"
  },
  {
    nom: "URSSAF",
    url: "https://www.urssaf.fr/"
  },
  {
    nom: "Impôts",
    url: "https://www.impots.gouv.fr/"
  },
  {
    nom: "Économie",
    url: "https://www.economie.gouv.fr/"
  },
  {
    nom: "Travail",
    url: "https://travail-emploi.gouv.fr/"
  }
];

/* =====================================================
   OUTILS
===================================================== */

function clean(value, max = 5000) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, max);
}

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy":
          "camera=(), microphone=(), geolocation=()"
      }
    }
  );
}

function html(content) {
  return new Response(content, {
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy":
        "camera=(), microphone=(), geolocation=()"
    }
  });
}

/* =====================================================
   NORMALISATION DES RÉPONSES IA
===================================================== */

function valeurTexte(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map(item => valeurTexte(item))
      .filter(Boolean)
      .join("\n");
  }

  if (typeof value === "object") {
    if (typeof value.text === "string") {
      return value.text;
    }

    if (typeof value.response === "string") {
      return value.response;
    }

    if (typeof value.content === "string") {
      return value.content;
    }

    return Object.entries(value)
      .map(([cle, contenu]) => {
        const texte = valeurTexte(contenu);

        if (!texte) {
          return "";
        }

        return cle + " : " + texte;
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function tableauTexte(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map(item => valeurTexte(item))
      .filter(Boolean);
  }

  const texte = valeurTexte(value);

  if (!texte) {
    return [];
  }

  return [texte];
}

/* =====================================================
   EXTRACTION JSON
===================================================== */

function extraireJSON(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    if (
      value.titre ||
      value.comprehension ||
      value.orientation ||
      value.confirme ||
      value.actions
    ) {
      return value;
    }

    if (value.response) {
      return extraireJSON(value.response);
    }

    if (value.result) {
      return extraireJSON(value.result);
    }

    if (value.output) {
      return extraireJSON(value.output);
    }

    return null;
  }

  const texte = String(value).trim();

  try {
    return JSON.parse(texte);
  } catch {}

  const debut = texte.indexOf("{");
  const fin = texte.lastIndexOf("}");

  if (debut !== -1 && fin > debut) {
    try {
      return JSON.parse(
        texte.slice(debut, fin + 1)
      );
    } catch {}
  }

  return null;
}

/* =====================================================
   FORMAT FINAL
===================================================== */

function normaliserAnalyse(data) {
  if (!data) {
    return {
      titre: "Réponse GouRare AI",
      comprehension: "",
      orientation:
        "Les informations disponibles ne permettent pas de produire une réponse structurée fiable.",
      confirme: [],
      verifier: [
        "Une vérification auprès de la source officielle compétente est nécessaire."
      ],
      actions: [],
      documents: [],
      risques: [],
      professionnel:
        "Si votre situation comporte un enjeu juridique, fiscal, comptable ou social important, demandez confirmation à un professionnel compétent.",
      prochaine_action:
        "Vérifiez votre situation auprès de la source officielle correspondant à votre démarche."
    };
  }

  return {
    titre: valeurTexte(data.titre) || "Réponse GouRare AI",

    comprehension:
      valeurTexte(data.comprehension),

    orientation:
      valeurTexte(data.orientation),

    confirme:
      tableauTexte(data.confirme),

    verifier:
      tableauTexte(data.verifier),

    actions:
      tableauTexte(data.actions),

    documents:
      tableauTexte(data.documents),

    risques:
      tableauTexte(data.risques),

    professionnel:
      valeurTexte(data.professionnel),

    prochaine_action:
      valeurTexte(data.prochaine_action)
  };
}

/* =====================================================
   SOURCES
===================================================== */

function choisirSources(
  question,
  secteur,
  activite
) {
  const texte = (
    question +
    " " +
    secteur +
    " " +
    activite
  ).toLowerCase();

  const sources = [];

  function ajouter(nom) {
    const source =
      SOURCES_OFFICIELLES.find(
        item => item.nom === nom
      );

    if (
      source &&
      !sources.some(
        item => item.nom === nom
      )
    ) {
      sources.push(source);
    }
  }

  if (
    texte.includes("impôt") ||
    texte.includes("impot") ||
    texte.includes("fiscal") ||
    texte.includes("taxe") ||
    texte.includes("tva") ||
    texte.includes("cfe")
  ) {
    ajouter("Impôts");
    ajouter("Service-Public Entreprendre");
    ajouter("URSSAF");
  }

  if (
    texte.includes("urssaf") ||
    texte.includes("cotisation") ||
    texte.includes("micro") ||
    texte.includes("indépendant") ||
    texte.includes("independant")
  ) {
    ajouter("URSSAF");
    ajouter("Service-Public Entreprendre");
  }

  if (
    texte.includes("entreprise") ||
    texte.includes("création") ||
    texte.includes("creation") ||
    texte.includes("entrepreneur")
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
    texte.includes("contrat")
  ) {
    ajouter("Service-Public");
    ajouter("Travail");
  }

  if (
    texte.includes("social") ||
    texte.includes("aide") ||
    texte.includes("rsa") ||
    texte.includes("logement") ||
    texte.includes("famille")
  ) {
    ajouter("Service-Public");
  }

  if (
    texte.includes("juridique") ||
    texte.includes("droit") ||
    texte.includes("avocat") ||
    texte.includes("démarche") ||
    texte.includes("demarche")
  ) {
    ajouter("Service-Public");
  }

  if (sources.length === 0) {
    ajouter("Service-Public");
    ajouter("Service-Public Entreprendre");
  }

  return sources.slice(0, 4);
}

async function recupererSource(source) {
  try {
    const response = await fetch(
      source.url,
      {
        method: "GET",
        headers: {
          "User-Agent": "GouRareAI/6.1"
        }
      }
    );

    if (!response.ok) {
      return {
        nom: source.nom,
        url: source.url,
        disponible: false,
        extrait: ""
      };
    }

    const contenu =
      await response.text();

    const propre =
      contenu
        .replace(
          /<script[\s\S]*?<\/script>/gi,
          " "
        )
        .replace(
          /<style[\s\S]*?<\/style>/gi,
          " "
        )
        .replace(
          /<[^>]+>/g,
          " "
        )
        .replace(
          /\s+/g,
          " "
        )
        .trim();

    return {
      nom: source.nom,
      url: source.url,
      disponible: true,
      extrait:
        propre.slice(0, 6000)
    };

  } catch {
    return {
      nom: source.nom,
      url: source.url,
      disponible: false,
      extrait: ""
    };
  }
}

async function recupererSources(
  question,
  secteur,
  activite
) {
  const sources =
    choisirSources(
      question,
      secteur,
      activite
    );

  return await Promise.all(
    sources.map(
      source => recupererSource(source)
    )
  );
}

/* =====================================================
   PROMPT SYSTÈME
===================================================== */

function systemPrompt() {
  return `
Tu es GouRare AI V6.1.

Tu es une intelligence d'orientation pratique.

Tu aides :
- citoyens
- salariés
- demandeurs d'emploi
- indépendants
- micro-entrepreneurs
- entrepreneurs
- petites entreprises

Domaines :
- administratif
- juridique
- fiscal
- comptable
- social
- emploi
- métiers
- secteurs
- entreprise
- stratégie
- organisation
- résolution de problèmes
- opportunités

Tu n'es PAS un avocat.
Tu n'es PAS un expert-comptable.
Tu n'es PAS un travailleur social.
Tu n'es PAS une administration.
Tu ne remplaces pas un professionnel réglementé.

RÈGLE ABSOLUE :

NE JAMAIS INVENTER :
- loi
- article
- organisme
- registre
- autorisation
- licence
- obligation
- seuil
- taux
- montant
- pénalité
- délai
- aide
- statistique

Si une information n'est pas suffisamment confirmée :
place-la dans "verifier".

Ne transforme jamais une hypothèse en fait.

Pour les informations françaises :
utilise en priorité les sources officielles fournies.

La réponse doit être pratique.

Toujours distinguer :
- information confirmée
- information à vérifier
- recommandation
- besoin éventuel d'un professionnel

Pour une démarche :
indique si possible :
quoi faire,
où,
documents,
points à vérifier,
risques,
prochaine action.

Pour l'orientation sociale :
cherche les droits, aides, organismes et services possibles,
mais ne promets jamais qu'une personne est éligible
sans vérification.

Pour une opportunité commerciale :
ne fabrique aucun chiffre.
Ne donne pas de faux scores.
Une hypothèse doit être clairement présentée comme hypothèse.

Pour une analyse de secteur :
cherche des problèmes concrets et différents.
Ne transforme pas toutes les opportunités en logiciel ou SaaS.

Réponds en français clair.
`;
}

/* =====================================================
   SCHÉMA
===================================================== */

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

/* =====================================================
   APPEL WORKERS AI
===================================================== */

async function askAI(
  env,
  question,
  contexteSources
) {
  const prompt = `
DEMANDE :

${question}

SOURCES OFFICIELLES DISPONIBLES :

${contexteSources ||
  "Aucune source exploitable."}

INSTRUCTIONS :

Réponds uniquement avec un objet JSON correspondant
au schéma demandé.

Ne mets aucun texte avant ou après le JSON.

Si une information n'est pas confirmée :
mets-la dans "verifier".

Si les sources ne permettent pas de confirmer une obligation,
ne présente pas cette obligation comme un fait.

Ne fabrique aucun organisme,
registre,
licence,
autorisation,
seuil,
taux,
montant,
délai ou pénalité.
`;

  const result =
    await env.IA.run(
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

  /* Plusieurs formats possibles */

  let brut = result;

  if (
    result &&
    result.response !== undefined
  ) {
    brut = result.response;
  }

  if (
    result &&
    result.result &&
    result.result.response !== undefined
  ) {
    brut =
      result.result.response;
  }

  if (
    result &&
    result.output !== undefined
  ) {
    brut = result.output;
  }

  const analyseBrute =
    extraireJSON(brut);

  if (analyseBrute) {
    return normaliserAnalyse(
      analyseBrute
    );
  }

  /* Dernier recours : convertir proprement en texte */

  const texte =
    valeurTexte(brut);

  return normaliserAnalyse({
    titre: "Réponse GouRare AI",
    comprehension: "",
    orientation: texte,
    confirme: [],
    verifier: [
      "La réponse doit être vérifiée auprès de la source officielle compétente."
    ],
    actions: [],
    documents: [],
    risques: [],
    professionnel:
      "Une confirmation professionnelle peut être nécessaire selon votre situation.",
    prochaine_action:
      "Vérifiez la démarche auprès de la source officielle compétente."
  });
}

/* =====================================================
   PROMPTS
===================================================== */

function promptGeneral(message) {
  return `
Analyse cette demande :

${message}

Détermine le domaine concerné.

Donne une orientation pratique.

Ne suppose pas des informations personnelles
qui ne sont pas données.

Indique clairement ce qui est confirmé
et ce qui doit être vérifié.
`;
}

function promptSecteur(secteur) {
  return `
Analyse le secteur :

${secteur}

Recherche exactement 5 opportunités différentes.

Pour chaque opportunité :
- problème concret
- personne qui souffre du problème
- personne qui décide
- personne qui paie
- pourquoi elle paierait
- solution
- type de solution
- rôle possible de l'IA
- difficulté de lancement
- difficulté de vente
- différenciation
- test rapide

Utilise :
faible / moyen / élevé.

NE DONNE PAS de scores numériques.

NE FABRIQUE PAS de chiffres de marché.

Ne transforme pas toutes les opportunités
en logiciels ou SaaS.

Les hypothèses doivent être indiquées comme hypothèses.
`;
}

function promptIndependant(
  activite,
  statut,
  message
) {
  return `
Situation :

Activité :
${activite}

Statut :
${statut}

Question :
${message}

Analyse la situation en France.

Si pertinent, examine :
- création
- immatriculation
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
- compte bancaire
- professionnel compétent

IMPORTANT :

Ne dis jamais automatiquement
qu'une inscription au RCS,
une licence,
une autorisation
ou une obligation particulière est nécessaire.

Si ce n'est pas confirmé :
mets-le dans "verifier".
`;
}

function promptProbleme(probleme) {
  return `
Problème :

${probleme}

Identifie :

1. problème central
2. causes possibles
3. conséquences
4. vérifications
5. solutions
6. solution simple
7. solution potentiellement efficace
8. risques
9. ordre des actions
10. prochaine action

Si le problème est administratif,
juridique,
fiscal,
social
ou lié à l'emploi,
indique ce qui doit être vérifié officiellement.
`;
}

function construirePrompt(
  type,
  message,
  secteur,
  activite,
  statut
) {
  if (type === "sector") {
    return promptSecteur(
      secteur
    );
  }

  if (type === "independent") {
    return promptIndependant(
      activite,
      statut,
      message
    );
  }

  if (type === "problem") {
    return promptProbleme(
      message
    );
  }

  return promptGeneral(
    message
  );
}

/* =====================================================
   PAGE
===================================================== */

function page() {
  return `<!DOCTYPE html>

<html lang="fr">

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width, initial-scale=1.0"
>

<title>GouRare AI</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  background:
    radial-gradient(
      circle at top,
      #18233c,
      #070b13 58%
    );

  color: #f5f7fb;
}

.container {
  width: min(1050px, 94%);
  margin: auto;
  padding: 35px 0 110px;
}

header {
  text-align: center;
  margin-bottom: 28px;
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
  margin-top: 8px;
  color: #aeb8ca;
}

.badge {
  display: inline-block;
  margin-top: 15px;
  padding: 8px 14px;
  border-radius: 999px;
  color: #c5d8ff;
  background: rgba(138,180,255,.12);
  border: 1px solid rgba(138,180,255,.2);
  font-size: 13px;
}

.panel {
  padding: 22px;
  border-radius: 22px;
  background: rgba(17,24,39,.9);
  border: 1px solid rgba(255,255,255,.08);
  box-shadow:
    0 25px 70px rgba(0,0,0,.35);
}

.tabs {
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
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
textarea {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.1);
  background: #0c1220;
  color: white;
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
}

.results {
  margin-top: 25px;
}

.result-card {
  padding: 20px;
  border-radius: 18px;
  background: rgba(10,15,27,.92);
  border: 1px solid rgba(255,255,255,.08);
}

.result-card h2 {
  margin-top: 0;
}

.section {
  margin-top: 20px;
}

.section h3 {
  color: #9fc0ff;
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

  padding: 9px 13px;
  border-radius: 999px;

  background: rgba(20,27,42,.96);
  color: #f4f6fb;

  border: 1px solid rgba(255,255,255,.12);

  text-decoration: none;
  font-size: 12px;
}

footer {
  margin-top: 35px;
  text-align: center;
  color: #7f8aa0;
  font-size: 13px;
}

@media (max-width: 700px) {

  .logo {
    font-size: 34px;
  }

  .tabs {
    grid-template-columns:
      repeat(2, 1fr);
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

<button
class="tab active"
data-mode="question"
>
Question
</button>

<button
class="tab"
data-mode="sector"
>
Secteur
</button>

<button
class="tab"
data-mode="independent"
>
Indépendant
</button>

<button
class="tab"
data-mode="problem"
>
Problème
</button>

</div>

<div
class="mode active"
id="question"
>

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

<div
class="mode"
id="sector"
>

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

<div
class="mode"
id="independent"
>

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

<div
class="mode"
id="problem"
>

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

GouRare AI — Une intelligence au service
de l'orientation, des solutions et de la vie.

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

  tab.addEventListener(
    "click",
    () => {

      tabs.forEach(t =>
        t.classList.remove("active")
      );

      modes.forEach(m =>
        m.classList.remove("active")
      );

      tab.classList.add("active");

      document
        .getElementById(
          tab.dataset.mode
        )
        .classList.add("active");

    }
  );

});

function escapeHTML(value) {

  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

function afficherListe(items) {

  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return "<p>Aucune information particulière.</p>";
  }

  return (
    "<ul>" +
    items
      .map(
        item =>
          "<li>" +
          escapeHTML(item) +
          "</li>"
      )
      .join("") +
    "</ul>"
  );
}

function afficherAnalyse(
  analyse,
  sources
) {

  const results =
    document.getElementById(
      "results"
    );

  let sourcesHTML = "";

  if (
    Array.isArray(sources) &&
    sources.length
  ) {

    sourcesHTML =
      '<div class="sources">' +
      "<h3>Sources officielles consultées</h3>" +
      "<ul>" +
      sources
        .map(source => {

          return (
            "<li>" +
            '<a href="' +
            escapeHTML(source.url) +
            '" target="_blank" rel="noopener noreferrer">' +
            escapeHTML(source.nom) +
            "</a>" +
            (
              source.disponible
                ? ""
                : " — non disponible au moment de l'analyse"
            ) +
            "</li>"
          );

        })
        .join("") +
      "</ul>" +
      "</div>";

  }

  results.innerHTML =
    '<div class="result-card">' +

    "<h2>" +
    escapeHTML(analyse.titre) +
    "</h2>" +

    '<div class="section">' +
    "<h3>Ce que j'ai compris</h3>" +
    "<p>" +
    escapeHTML(
      analyse.comprehension
    ) +
    "</p>" +
    "</div>" +

    '<div class="section">' +
    "<h3>Orientation</h3>" +
    "<p>" +
    escapeHTML(
      analyse.orientation
    ) +
    "</p>" +
    "</div>" +

    '<div class="section">' +
    "<h3>Informations confirmées</h3>" +
    afficherListe(
      analyse.confirme
    ) +
    "</div>" +

    '<div class="section">' +
    "<h3>Informations à vérifier</h3>" +
    afficherListe(
      analyse.verifier
    ) +
    "</div>" +

    '<div class="section">' +
    "<h3>Actions possibles</h3>" +
    afficherListe(
      analyse.actions
    ) +
    "</div>" +

    '<div class="section">' +
    "<h3>Documents / informations</h3>" +
    afficherListe(
      analyse.documents
    ) +
    "</div>" +

    '<div class="section">' +
    "<h3>Risques / points d'attention</h3>" +
    afficherListe(
      analyse.risques
    ) +
    "</div>" +

    '<div class="section">' +
    "<h3>Quand consulter un professionnel</h3>" +
    "<p>" +
    escapeHTML(
      analyse.professionnel
    ) +
    "</p>" +
    "</div>" +

    '<div class="next">' +
    "<strong>PROCHAINE ACTION</strong>" +
    "<p>" +
    escapeHTML(
      analyse.prochaine_action
    ) +
    "</p>" +
    "</div>" +

    sourcesHTML +

    "</div>";

  results.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}

async function analyser(mode) {

  const results =
    document.getElementById(
      "results"
    );

  results.innerHTML =
    '<div class="result-card">' +
    "<p>⏳ GouRare AI analyse votre demande...</p>" +
    "</div>";

  const payload = {
    type: mode,
    message: "",
    sector: "",
    activity: "",
    status: ""
  };

  if (mode === "question") {

    payload.message =
      document
        .getElementById(
          "questionText"
        )
        .value
        .trim();

  }

  if (mode === "sector") {

    payload.sector =
      document
        .getElementById(
          "sectorText"
        )
        .value
        .trim();

  }

  if (mode === "independent") {

    payload.activity =
      document
        .getElementById(
          "activityText"
        )
        .value
        .trim();

    payload.status =
      document
        .getElementById(
          "statusText"
        )
        .value
        .trim();

    payload.message =
      document
        .getElementById(
          "independentQuestion"
        )
        .value
        .trim();

  }

  if (mode === "problem") {

    payload.message =
      document
        .getElementById(
          "problemText"
        )
        .value
        .trim();

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
    button =>
      button.disabled = true
  );

  try {

    const response =
      await fetch(
        "/api/analyze",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(payload)
        }
      );

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
      escapeHTML(
        error.message
      ) +
      "</p>" +
      "</div>";

  } finally {

    buttons.forEach(
      button =>
        button.disabled = false
    );

  }

}

</script>

</body>

</html>`;
}

/* =====================================================
   WORKER
===================================================== */

export default {

  async fetch(
    request,
    env
  ) {

    const url =
      new URL(request.url);

    /* HEALTH */

    if (
      url.pathname ===
      "/health"
    ) {

      return json({
        success: true,
        service: "GouRare AI",
        status: "OK",
        version: VERSION
      });

    }

    /* ACCUEIL */

    if (
      url.pathname === "/" &&
      request.method === "GET"
    ) {

      return html(
        page()
      );

    }

    /* API */

    if (
      url.pathname ===
      "/api/analyze"
    ) {

      if (
        request.method !== "POST"
      ) {

        return json(
          {
            success: false,
            error:
              "Méthode non autorisée."
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
          .includes(
            "application/json"
          )
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

        body =
          await request.json();

      } catch {

        return json(
          {
            success: false,
            error:
              "JSON invalide."
          },
          400
        );

      }

      const type =
        clean(
          body.type,
          30
        );

      const message =
        clean(
          body.message,
          5000
        );

      const sector =
        clean(
          body.sector,
          150
        );

      const activity =
        clean(
          body.activity,
          200
        );

      const status =
        clean(
          body.status,
          150
        );

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

      const prompt =
        construirePrompt(
          type,
          message,
          sector,
          activity,
          status
        );

      const sources =
        await recupererSources(
          message + " " + prompt,
          sector,
          activity
        );

      const contexte =
        sources
          .filter(
            source =>
              source.disponible
          )
          .map(
            source =>
              `
SOURCE : ${source.nom}

URL : ${source.url}

CONTENU :
${source.extrait}
`
          )
          .join("\n\n");

      try {

        const analyse =
          await askAI(
            env,
            prompt,
            contexte
          );

        return json({
          success: true,
          version: VERSION,
          analyse,
          sources:
            sources.map(
              source => ({
                nom: source.nom,
                url: source.url,
                disponible:
                  source.disponible
              })
            )
        });

      } catch {

        return json(
          {
            success: false,
            error:
              "Le service d'intelligence est temporairement indisponible."
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
