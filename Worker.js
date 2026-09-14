const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const VERSION = "7.1";

/*
  GouRare AI V7.1
  Principe :
  - recherche ciblée dans des pages officielles connues
  - aucune information confirmée sans preuve
  - distinction entre confirmé / à vérifier / recommandation
*/

const SOURCES = [
  {
    id: "creation_ei",
    nom: "Service-Public Entreprendre",
    url: "https://entreprendre.service-public.fr/vosdroits/F36763",
    domaines: [
      "création",
      "entreprise",
      "entreprise individuelle",
      "ei",
      "micro-entreprise",
      "immatriculation",
      "formalités"
    ]
  },

  {
    id: "commerce",
    nom: "Service-Public Entreprendre",
    url: "https://entreprendre.service-public.fr/vosdroits/F23571",
    domaines: [
      "création",
      "commerce",
      "entreprise",
      "immatriculation",
      "micro-entreprise"
    ]
  },

  {
    id: "statut",
    nom: "Service-Public Entreprendre",
    url: "https://entreprendre.service-public.fr/vosdroits/R18323",
    domaines: [
      "statut",
      "forme juridique",
      "micro-entreprise",
      "ei",
      "société",
      "création"
    ]
  },

  {
    id: "service_public",
    nom: "Service-Public",
    url: "https://www.service-public.fr/",
    domaines: [
      "administratif",
      "droit",
      "démarche",
      "social",
      "travail"
    ]
  },

  {
    id: "urssaf",
    nom: "URSSAF",
    url: "https://www.urssaf.fr/",
    domaines: [
      "urssaf",
      "cotisation",
      "indépendant",
      "micro-entrepreneur",
      "social"
    ]
  },

  {
    id: "impots",
    nom: "Impôts",
    url: "https://www.impots.gouv.fr/",
    domaines: [
      "impôt",
      "fiscalité",
      "tva",
      "cfe",
      "taxe"
    ]
  }
];

function clean(value, max = 5000) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, max);
}

function arrayStrings(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => {
      if (typeof item === "string") {
        return clean(item);
      }

      if (item && typeof item === "object") {
        return clean(
          item.texte ||
          item.text ||
          item.description ||
          item.nom ||
          item.title ||
          ""
        );
      }

      return "";
    })
    .filter(Boolean);
}

function arrayFacts(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => {
      if (typeof item === "string") {
        return {
          texte: clean(item),
          source: "",
          preuve: "",
          statut: "a_verifier"
        };
      }

      if (!item || typeof item !== "object") {
        return null;
      }

      return {
        texte: clean(
          item.texte ||
          item.text ||
          item.description ||
          ""
        ),

        source: clean(
          item.source ||
          item.source_nom ||
          ""
        ),

        preuve: clean(
          item.preuve ||
          item.evidence ||
          ""
        ),

        statut: clean(
          item.statut ||
          "a_verifier"
        )
      };
    })
    .filter(item => item && item.texte);
}

function extractJSON(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {

    if (value.response !== undefined) {
      return extractJSON(value.response);
    }

    if (
      value.result &&
      value.result.response !== undefined
    ) {
      return extractJSON(value.result.response);
    }

    if (value.output !== undefined) {
      return extractJSON(value.output);
    }

    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  let text = value.trim();

  text = text
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(text);
  } catch {}

  const debut = text.indexOf("{");
  const fin = text.lastIndexOf("}");

  if (
    debut !== -1 &&
    fin !== -1 &&
    fin > debut
  ) {
    try {
      return JSON.parse(
        text.slice(debut, fin + 1)
      );
    } catch {}
  }

  return null;
}

function normalize(data) {
  const source =
    data && typeof data === "object"
      ? data
      : {};

  return {
    titre: clean(
      source.titre ||
      "Analyse GouRare AI"
    ),

    compris: clean(
      source.compris ||
      source.ce_que_jai_compris ||
      ""
    ),

    orientation: clean(
      source.orientation ||
      ""
    ),

    confirmees: arrayFacts(
      source.confirmees ||
      source.informations_confirmees ||
      []
    ),

    aVerifier: arrayFacts(
      source.aVerifier ||
      source.a_verifier ||
      source.informations_a_verifier ||
      []
    ),

    recommandations: arrayStrings(
      source.recommandations ||
      []
    ),

    actions: arrayStrings(
      source.actions ||
      []
    ),

    documents: arrayStrings(
      source.documents ||
      []
    ),

    risques: arrayStrings(
      source.risques ||
      []
    ),

    professionnel: clean(
      source.professionnel ||
      ""
    ),

    prochaineAction: clean(
      source.prochaineAction ||
      source.prochaine_action ||
      ""
    ),

    sources: Array.isArray(source.sources)
      ? source.sources
          .map(sourceItem => ({
            nom: clean(
              sourceItem?.nom ||
              sourceItem?.name ||
              ""
            ),

            url: clean(
              sourceItem?.url ||
              ""
            )
          }))
          .filter(item => item.nom)
      : []
  };
}

/*
  Détermine les pages les plus pertinentes.
*/
function selectionnerSources(question) {

  const texte = clean(question)
    .toLowerCase();

  const scores = SOURCES.map(source => {

    let score = 0;

    for (const domaine of source.domaines) {

      if (
        texte.includes(
          domaine.toLowerCase()
        )
      ) {
        score += 3;
      }
    }

    return {
      ...source,
      score
    };
  });

  /*
    Pour une question de création d'entreprise,
    on privilégie les pages de création.
  */

  if (
    texte.includes("créer") ||
    texte.includes("création") ||
    texte.includes("entreprise") ||
    texte.includes("micro") ||
    texte.includes("indépendant")
  ) {

    scores.forEach(source => {

      if (
        source.id === "creation_ei" ||
        source.id === "statut"
      ) {
        source.score += 8;
      }

    });
  }

  return scores
    .sort((a, b) => b.score - a.score)
    .filter(source => source.score > 0)
    .slice(0, 4);
}

/*
  Extraction simplifiée du texte d'une page officielle.
*/
function nettoyerHTML(html) {

  return html

    .replace(
      /<script[\s\S]*?<\/script>/gi,
      " "
    )

    .replace(
      /<style[\s\S]*?<\/style>/gi,
      " "
    )

    .replace(
      /<noscript[\s\S]*?<\/noscript>/gi,
      " "
    )

    .replace(
      /<[^>]+>/g,
      " "
    )

    .replace(
      /&nbsp;/gi,
      " "
    )

    .replace(
      /&amp;/gi,
      "&"
    )

    .replace(
      /\s+/g,
      " "
    )

    .trim();
}

async function recupererSource(source) {

  try {

    const response = await fetch(
      source.url,
      {
        method: "GET",

        headers: {
          "User-Agent":
            "GouRare-AI/7.1"
        }
      }
    );

    if (!response.ok) {

      return {
        ...source,
        disponible: false,
        texte: ""
      };
    }

    const html =
      await response.text();

    const texte =
      nettoyerHTML(html)
        .slice(0, 18000);

    return {
      ...source,
      disponible: true,
      texte
    };

  } catch {

    return {
      ...source,
      disponible: false,
      texte: ""
    };
  }
}

/*
  Recherche de mots importants dans le contenu.
*/
function extrairePreuves(
  texte,
  question
) {

  const motsQuestion =
    question
      .toLowerCase()
      .split(/\s+/)
      .filter(mot => mot.length >= 5)
      .slice(0, 12);

  const phrases =
    texte
      .split(/[.!?]/)
      .map(item => item.trim())
      .filter(item => item.length > 40);

  const resultats = [];

  for (const phrase of phrases) {

    const phraseLower =
      phrase.toLowerCase();

    let score = 0;

    for (const mot of motsQuestion) {

      if (
        phraseLower.includes(mot)
      ) {
        score++;
      }
    }

    if (score > 0) {

      resultats.push({
        phrase,
        score
      });
    }
  }

  return resultats
    .sort(
      (a, b) =>
        b.score - a.score
    )
    .slice(0, 12);
}

function construireContexte(
  sources,
  question
) {

  const blocs = [];

  for (const source of sources) {

    if (!source.disponible) {
      continue;
    }

    const preuves =
      extrairePreuves(
        source.texte,
        question
      );

    blocs.push(
      `
SOURCE OFFICIELLE
Nom : ${source.nom}
URL : ${source.url}

EXTRAITS PERTINENTS :
${preuves
  .map(item => "- " + item.phrase)
  .join("\n")}

CONTENU SOURCE :
${source.texte.slice(0, 12000)}
`
    );
  }

  if (!blocs.length) {

    return `
AUCUNE SOURCE OFFICIELLE
N'A PU ÊTRE RECUPEREE.
`;
  }

  return blocs.join(
    "\n========================\n"
  );
}

const schema = {

  type: "object",

  properties: {

    titre: {
      type: "string"
    },

    compris: {
      type: "string"
    },

    orientation: {
      type: "string"
    },

    confirmees: {

      type: "array",

      items: {

        type: "object",

        properties: {

          texte: {
            type: "string"
          },

          source: {
            type: "string"
          },

          preuve: {
            type: "string"
          },

          statut: {
            type: "string"
          }

        },

        required: [
          "texte",
          "source",
          "preuve",
          "statut"
        ]
      }
    },

    aVerifier: {

      type: "array",

      items: {

        type: "object",

        properties: {

          texte: {
            type: "string"
          },

          source: {
            type: "string"
          },

          preuve: {
            type: "string"
          },

          statut: {
            type: "string"
          }

        },

        required: [
          "texte",
          "source",
          "preuve",
          "statut"
        ]
      }
    },

    recommandations: {
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

    prochaineAction: {
      type: "string"
    },

    sources: {

      type: "array",

      items: {

        type: "object",

        properties: {

          nom: {
            type: "string"
          },

          url: {
            type: "string"
          }

        },

        required: [
          "nom",
          "url"
        ]
      }
    }
  },

  required: [
    "titre",
    "compris",
    "orientation",
    "confirmees",
    "aVerifier",
    "recommandations",
    "actions",
    "documents",
    "risques",
    "professionnel",
    "prochaineAction",
    "sources"
  ]
};

function promptSysteme() {

  return `
Tu es GouRare AI.

Tu aides l'utilisateur à comprendre une situation
et à trouver la prochaine action utile.

Tu ne remplaces jamais :
- avocat
- expert-comptable
- médecin
- travailleur social
- administration
- autre professionnel réglementé.

REGLE CRITIQUE :

Tu as reçu des sources officielles.

Tu dois utiliser UNIQUEMENT les informations
contenues dans ces sources pour déclarer
une information comme "confirmee".

Une information confirmée doit avoir :

1. un texte réellement présent ou clairement
   déductible du passage fourni ;

2. une source officielle identifiable ;

3. une preuve courte provenant réellement
   du contenu fourni.

INTERDICTION ABSOLUE :

Tu ne dois jamais inventer une preuve.

Tu ne dois jamais inventer une obligation.

Tu ne dois jamais inventer :
- taux
- prix
- montant
- délai
- pénalité
- numéro
- taxe
- cotisation
- document obligatoire
- licence
- autorisation
- diplôme
- registre
- régime fiscal.

IMPORTANT :

Ne dis jamais automatiquement :

"RCS obligatoire"

"TVA obligatoire"

"expert-comptable obligatoire"

"avocat obligatoire"

"document X obligatoire"

si la source fournie ne le dit pas
pour la situation précise.

Si une information dépend :
- du statut
- de l'activité
- du chiffre d'affaires
- du nombre de salariés
- de la nature exacte de l'activité
- de la situation personnelle

alors elle doit être placée dans
"aVerifier" si les sources ne permettent
pas de déterminer le cas précis.

Pour "documents", indique seulement :
- documents clairement indiqués par la source
OU
- "à vérifier selon le statut et l'activité".

Pour "professionnel", ne recommande pas
un professionnel sans raison identifiable.

Si l'utilisateur demande simplement comment
créer une entreprise, la réponse doit commencer
par les étapes concrètes.

Tu dois éviter les réponses vagues.

Pour une création d'entreprise, cherche notamment :

- forme juridique
- activité
- formalités
- guichet des formalités
- immatriculation
- domiciliation
- documents
- fiscalité
- cotisations
- TVA
- activité réglementée

mais ne transforme jamais ces thèmes
en obligations universelles.

Le champ "compris" doit simplement reformuler
la demande de l'utilisateur.

Le champ "orientation" doit donner
une orientation pratique.

La "prochaineAction" doit être UNE action
réaliste et immédiatement utile.

Réponds uniquement en JSON.
`;
}

async function demanderIA(
  env,
  question,
  contexte
) {

  const prompt = `
QUESTION UTILISATEUR :

${question}

SOURCES OFFICIELLES ET EXTRAITS :

${contexte}

Produis une analyse pratique.

ATTENTION :

Si une information n'est pas prouvée
dans les extraits, elle ne doit PAS être
dans "confirmees".

Elle doit aller dans "aVerifier".

Une preuve doit être un extrait réel
du contenu fourni.

Ne fabrique jamais de preuve.

Réponds uniquement en JSON.
`;

  const result =
    await env.IA.run(
      MODEL,
      {

        messages: [

          {
            role: "system",
            content: promptSysteme()
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

        max_tokens: 2400,

        temperature: 0.05
      }
    );

  const data =
    extractJSON(result);

  if (!data) {
    throw new Error(
      "Réponse IA invalide"
    );
  }

  return normalize(data);
}

/*
  Vérification finale.
  Une confirmation sans source/preuve
  est automatiquement déplacée vers
  "À vérifier".
*/
function verifierAnalyse(
  analyse,
  sources
) {

  const nomsSources =
    sources
      .filter(source =>
        source.disponible
      )
      .map(source =>
        source.nom.toLowerCase()
      );

  const confirmees = [];

  const aVerifier =
    Array.isArray(analyse.aVerifier)
      ? [...analyse.aVerifier]
      : [];

  for (
    const information
    of analyse.confirmees
  ) {

    const source =
      clean(
        information.source
      );

    const preuve =
      clean(
        information.preuve
      );

    const sourceValide =
      nomsSources.some(
        nom =>
          source
            .toLowerCase()
            .includes(nom)
      );

    const preuveValide =
      preuve.length >= 20;

    if (
      sourceValide &&
      preuveValide
    ) {

      confirmees.push({
        texte:
          information.texte,

        source:
          information.source,

        preuve:
          information.preuve,

        statut:
          "confirme"
      });

    } else {

      aVerifier.push({

        texte:
          information.texte,

        source:
          information.source || "",

        preuve:
          information.preuve || "",

        statut:
          "a_verifier"
      });
    }
  }

  analyse.confirmees =
    confirmees;

  analyse.aVerifier =
    aVerifier;

  return analyse;
}

async function analyser(
  env,
  question,
  type
) {

  const sourcesChoisies =
    selectionnerSources(
      question
    );

  const sources =
    await Promise.all(
      sourcesChoisies.map(
        recupererSource
      )
    );

  const contexte =
    construireContexte(
      sources,
      question
    );

  const analyse =
    await demanderIA(
      env,
      question,
      contexte
    );

  const resultat =
    verifierAnalyse(
      analyse,
      sources
    );

  resultat.sources =
    sources
      .filter(source =>
        source.disponible
      )
      .map(source => ({
        nom: source.nom,
        url: source.url
      }));

  return resultat;
}

async function api(
  request,
  env
) {

  if (
    request.method !== "POST"
  ) {

    return new Response(
      JSON.stringify({
        success: false,
        error:
          "Méthode non autorisée."
      }),
      {
        status: 405,

        headers: {
          "Content-Type":
            "application/json"
        }
      }
    );
  }

  let body;

  try {

    body =
      await request.json();

  } catch {

    return new Response(
      JSON.stringify({
        success: false,
        error:
          "JSON invalide."
      }),
      {
        status: 400,

        headers: {
          "Content-Type":
            "application/json"
        }
      }
    );
  }

  const question =
    clean(
      body.question ||
      body.probleme ||
      ""
    );

  const type =
    clean(
      body.type ||
      "question",
      100
    );

  if (!question) {

    return new Response(
      JSON.stringify({
        success: false,
        error:
          "Question manquante."
      }),
      {
        status: 400,

        headers: {
          "Content-Type":
            "application/json"
        }
      }
    );
  }

  try {

    const analyse =
      await analyser(
        env,
        question,
        type
      );

    return new Response(
      JSON.stringify({
        success: true,
        version: VERSION,
        analyse
      }),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/json"
        }
      }
    );

  } catch {

    return new Response(
      JSON.stringify({
        success: false,
        error:
          "Le service est temporairement indisponible."
      }),
      {
        status: 500,

        headers: {
          "Content-Type":
            "application/json"
        }
      }
    );
  }
}

function interfaceHTML() {

  return `<!DOCTYPE html>

<html lang="fr">

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width,initial-scale=1"
>

<title>GouRare AI</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #f5f6f8;
  color: #151515;
}

header {
  background: #111;
  color: white;
  text-align: center;
  padding: 30px 20px;
}

header h1 {
  margin: 0 0 8px;
  font-size: 34px;
}

header p {
  margin: 0;
  opacity: .8;
}

main {
  max-width: 900px;
  margin: 25px auto;
  padding: 0 15px 50px;
}

.badge {
  text-align: center;
  font-weight: bold;
  margin-bottom: 20px;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.tabs button {
  border: 0;
  padding: 12px 15px;
  border-radius: 10px;
  cursor: pointer;
  background: #ddd;
}

.tabs button.active {
  background: #111;
  color: white;
}

.panel,
.result-card {
  background: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow:
    0 5px 20px rgba(0,0,0,.06);
}

textarea {
  width: 100%;
  min-height: 150px;
  padding: 14px;
  border: 1px solid #ccc;
  border-radius: 10px;
  resize: vertical;
  font-size: 16px;
}

.primary {
  width: 100%;
  margin-top: 12px;
  padding: 14px;
  border: 0;
  border-radius: 10px;
  background: #111;
  color: white;
  font-size: 16px;
  cursor: pointer;
}

.primary:disabled {
  opacity: .6;
}

.result-card {
  margin-top: 20px;
}

.result-card h2 {
  margin-top: 0;
}

.section {
  margin-top: 20px;
}

.section h3 {
  margin-bottom: 8px;
}

.item {
  background: #f2f2f2;
  padding: 11px;
  border-radius: 9px;
  margin: 7px 0;
  line-height: 1.5;
}

.small {
  color: #666;
  font-size: 13px;
  margin-top: 5px;
}

footer {
  text-align: center;
  color: #666;
  padding: 25px;
}

</style>

</head>

<body>

<header>

<h1>GouRare AI</h1>

<p>
L'intelligence qui vous oriente vers la bonne action.
</p>

</header>

<main>

<div class="badge">
🎗️ Avec vous contre le cancer
</div>

<div class="tabs">

<button
class="active"
data-type="question"
>
Question
</button>

<button data-type="secteur">
Secteur
</button>

<button data-type="independant">
Indépendant
</button>

<button data-type="probleme">
Problème
</button>

</div>

<div class="panel">

<textarea
id="question"
placeholder="Décrivez votre situation ou votre question..."
></textarea>

<button
id="analyser"
class="primary"
>
Analyser avec GouRare AI
</button>

</div>

<div id="results"></div>

</main>

<footer>

🎗️ Notre soutien aux personnes touchées par le cancer.

<br>

<span class="small">

GouRare AI fournit une orientation
et ne remplace pas un professionnel qualifié.

</span>

</footer>

<script>

const tabs =
  document.querySelectorAll(
    ".tabs button"
  );

const question =
  document.getElementById(
    "question"
  );

const analyserButton =
  document.getElementById(
    "analyser"
  );

const results =
  document.getElementById(
    "results"
  );

let currentType =
  "question";

tabs.forEach(button => {

  button.addEventListener(
    "click",
    () => {

      tabs.forEach(item => {
        item.classList.remove(
          "active"
        );
      });

      button.classList.add(
        "active"
      );

      currentType =
        button.dataset.type;
    }
  );

});

function escapeHTML(value) {

  return String(
    value || ""
  )
  .replace(
    /&/g,
    "&amp;"
  )
  .replace(
    /</g,
    "&lt;"
  )
  .replace(
    />/g,
    "&gt;"
  )
  .replace(
    /"/g,
    "&quot;"
  )
  .replace(
    /'/g,
    "&#039;"
  );
}

function factsHTML(items) {

  if (
    !Array.isArray(items) ||
    !items.length
  ) {
    return
      '<div class="small">Aucune information.</div>';
  }

  return items
    .map(item => {

      if (
        typeof item === "string"
      ) {

        return (
          '<div class="item">' +
          escapeHTML(item) +
          '</div>'
        );
      }

      return (
        '<div class="item">' +

        '<strong>' +
        escapeHTML(
          item.texte || ""
        ) +
        '</strong>' +

        (
          item.source
            ? '<div class="small">' +
              'Source : ' +
              escapeHTML(
                item.source
              ) +
              '</div>'
            : ""
        ) +

        (
          item.preuve
            ? '<div class="small">' +
              'Preuve : ' +
              escapeHTML(
                item.preuve
              ) +
              '</div>'
            : ""
        ) +

        '</div>'
      );

    })
    .join("");
}

function stringsHTML(items) {

  if (
    !Array.isArray(items) ||
    !items.length
  ) {
    return
      '<div class="small">Aucune information.</div>';
  }

  return items
    .map(item =>
      '<div class="item">' +
      escapeHTML(item) +
      '</div>'
    )
    .join("");
}

function render(analyse) {

  results.innerHTML =

    '<div class="result-card">' +

    '<h2>' +
    escapeHTML(
      analyse.titre
    ) +
    '</h2>' +

    '<div class="section">' +

    '<h3>Ce que j\\'ai compris</h3>' +

    '<div class="item">' +
    escapeHTML(
      analyse.compris
    ) +
    '</div>' +

    '</div>' +

    '<div class="section">' +

    '<h3>Orientation</h3>' +

    '<div class="item">' +
    escapeHTML(
      analyse.orientation
    ) +
    '</div>' +

    '</div>' +

    '<div class="section">' +

    '<h3>Informations confirmées</h3>' +

    factsHTML(
      analyse.confirmees
    ) +

    '</div>' +

    '<div class="section">' +

    '<h3>À vérifier</h3>' +

    factsHTML(
      analyse.aVerifier
    ) +

    '</div>' +

    '<div class="section">' +

    '<h3>Recommandations</h3>' +

    stringsHTML(
      analyse.recommandations
    ) +

    '</div>' +

    '<div class="section">' +

    '<h3>Actions</h3>' +

    stringsHTML(
      analyse.actions
    ) +

    '</div>' +

    '<div class="section">' +

    '<h3>Documents</h3>' +

    stringsHTML(
      analyse.documents
    ) +

    '</div>' +

    '<div class="section">' +

    '<h3>Risques / points d\\'attention</h3>' +

    stringsHTML(
      analyse.risques
    ) +

    '</div>' +

    '<div class="section">' +

    '<h3>Professionnel à consulter</h3>' +

    '<div class="item">' +
    escapeHTML(
      analyse.professionnel
    ) +
    '</div>' +

    '</div>' +

    '<div class="section">' +

    '<h3>PROCHAINE ACTION</h3>' +

    '<div class="item">' +

    '<strong>' +
    escapeHTML(
      analyse.prochaineAction
    ) +
    '</strong>' +

    '</div>' +

    '</div>' +

    '<div class="section">' +

    '<h3>Sources consultées</h3>' +

    (
      Array.isArray(
        analyse.sources
      )
      ? analyse.sources
          .map(source =>
            '<div class="item">' +
            escapeHTML(
              source.nom
            ) +
            (
              source.url
                ? '<div class="small">' +
                  escapeHTML(
                    source.url
                  ) +
                  '</div>'
                : ""
            ) +
            '</div>'
          )
          .join("")
      : ""
    ) +

    '</div>' +

    '</div>';
}

analyserButton.addEventListener(
  "click",
  async () => {

    const value =
      question.value.trim();

    if (!value) {

      alert(
        "Veuillez décrire votre situation."
      );

      return;
    }

    analyserButton.disabled =
      true;

    analyserButton.textContent =
      "Analyse et vérification en cours...";

    results.innerHTML = "";

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
              JSON.stringify({
                type:
                  currentType,

                question:
                  value
              })
          }
        );

      const data =
        await response.json();

      if (!data.success) {
        throw new Error(
          "Analyse impossible"
        );
      }

      render(
        data.analyse
      );

    } catch {

      results.innerHTML =
        '<div class="result-card">' +

        '<h2>Erreur</h2>' +

        '<p>' +
        'Le service est temporairement indisponible.' +
        '</p>' +

        '</div>';
    }

    analyserButton.disabled =
      false;

    analyserButton.textContent =
      "Analyser avec GouRare AI";
  }
);

</script>

</body>

</html>`;
}

export default {

  async fetch(
    request,
    env
  ) {

    const url =
      new URL(request.url);

    const securityHeaders = {

      "X-Content-Type-Options":
        "nosniff",

      "X-Frame-Options":
        "DENY",

      "Referrer-Policy":
        "strict-origin-when-cross-origin",

      "Permissions-Policy":
        "camera=(), microphone=(), geolocation=()",

      "Cache-Control":
        "no-store"
    };

    if (
      url.pathname === "/health"
    ) {

      return new Response(

        JSON.stringify({

          success: true,

          service:
            "GouRare AI",

          status:
            "OK",

          version:
            VERSION

        }),

        {
          status: 200,

          headers: {

            ...securityHeaders,

            "Content-Type":
              "application/json"
          }
        }
      );
    }

    if (
      url.pathname === "/api/analyze"
    ) {

      const response =
        await api(
          request,
          env
        );

      const headers =
        new Headers(
          response.headers
        );

      for (
        const [
          key,
          value
        ]
        of Object.entries(
          securityHeaders
        )
      ) {

        headers.set(
          key,
          value
        );
      }

      return new Response(
        response.body,
        {
          status:
            response.status,

          headers
        }
      );
    }

    if (
      request.method === "GET"
    ) {

      return new Response(
        interfaceHTML(),
        {
          status: 200,

          headers: {

            ...securityHeaders,

            "Content-Type":
              "text/html; charset=UTF-8"
          }
        }
      );
    }

    return new Response(
      "Not Found",
      {
        status: 404,
        headers:
          securityHeaders
      }
    );
  }
};
