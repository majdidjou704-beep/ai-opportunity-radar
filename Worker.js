const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const VERSION = "7.0";

const SOURCES = [
  {
    name: "Service-Public",
    url: "https://www.service-public.fr/",
    keywords: [
      "démarche", "administratif", "administration",
      "droit", "obligation", "travail", "social"
    ]
  },
  {
    name: "Service-Public Entreprendre",
    url: "https://entreprendre.service-public.fr/",
    keywords: [
      "entreprise", "création", "entrepreneur",
      "micro-entrepreneur", "immatriculation",
      "activité", "commerce", "nettoyage"
    ]
  },
  {
    name: "URSSAF",
    url: "https://www.urssaf.fr/",
    keywords: [
      "urssaf", "cotisation", "social",
      "micro-entrepreneur", "déclaration",
      "revenu", "indépendant"
    ]
  },
  {
    name: "Impôts",
    url: "https://www.impots.gouv.fr/",
    keywords: [
      "impôt", "fiscal", "taxe", "tva",
      "cfe", "revenu", "fiscalité"
    ]
  },
  {
    name: "Économie",
    url: "https://www.economie.gouv.fr/",
    keywords: [
      "tva", "entreprise", "fiscalité",
      "prix", "obligation", "commerce"
    ]
  },
  {
    name: "Travail",
    url: "https://travail-emploi.gouv.fr/",
    keywords: [
      "salarié", "emploi", "contrat",
      "travail", "employeur", "recrutement"
    ]
  }
];

function clean(value, max = 4000) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, max);
}

function normalizeText(value) {
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    return value
      .map(normalizeText)
      .filter(Boolean)
      .join("\n");
  }

  if (value && typeof value === "object") {
    return Object.values(value)
      .map(normalizeText)
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function extractJSON(value) {
  if (value && typeof value === "object") {
    if (value.response !== undefined) {
      return extractJSON(value.response);
    }

    if (value.result && value.result.response !== undefined) {
      return extractJSON(value.result.response);
    }

    return value;
  }

  if (typeof value !== "string") return null;

  let text = value.trim();

  text = text
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(text);
  } catch {}

  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");

  if (first !== -1 && last > first) {
    try {
      return JSON.parse(text.slice(first, last + 1));
    } catch {}
  }

  return null;
}

function arrayOfObjects(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map(item => {
      if (typeof item === "string") {
        return {
          texte: clean(item),
          statut: "a_verifier",
          source: ""
        };
      }

      if (item && typeof item === "object") {
        return {
          texte: clean(
            item.texte ||
            item.text ||
            item.description ||
            item.nom ||
            item.title ||
            ""
          ),
          statut: clean(item.statut || "a_verifier"),
          source: clean(item.source || ""),
          preuve: clean(item.preuve || item.evidence || "")
        };
      }

      return null;
    })
    .filter(item => item && item.texte);
}

function arrayOfStrings(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map(item => {
      if (typeof item === "string") return clean(item);

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

function normalizeAnalysis(data) {
  const source = data && typeof data === "object" ? data : {};

  return {
    titre: clean(source.titre || source.title || "Analyse GouRare AI"),

    compris: clean(
      source.compris ||
      source.ce_que_jai_compris ||
      source.summary ||
      ""
    ),

    orientation: clean(
      source.orientation ||
      source.conseil ||
      source.answer ||
      ""
    ),

    confirmees: arrayOfObjects(
      source.confirmees ||
      source.informations_confirmees ||
      source.confirmed ||
      []
    ),

    aVerifier: arrayOfObjects(
      source.aVerifier ||
      source.a_verifier ||
      source.informations_a_verifier ||
      source.verify ||
      []
    ),

    recommandations: arrayOfStrings(
      source.recommandations ||
      source.recommendations ||
      []
    ),

    actions: arrayOfStrings(
      source.actions ||
      source.prochaines_actions ||
      []
    ),

    documents: arrayOfStrings(
      source.documents ||
      source.documents_necessaires ||
      []
    ),

    risques: arrayOfStrings(
      source.risques ||
      source.risks ||
      []
    ),

    professionnel: clean(
      source.professionnel ||
      source.professional ||
      "Aucune orientation professionnelle nécessaire"
    ),

    prochaineAction: clean(
      source.prochaineAction ||
      source.prochaine_action ||
      source.next_action ||
      ""
    ),

    sources: Array.isArray(source.sources)
      ? source.sources
          .map(item => {
            if (typeof item === "string") {
              return {
                nom: clean(item),
                url: ""
              };
            }

            return {
              nom: clean(item?.nom || item?.name || ""),
              url: clean(item?.url || "")
            };
          })
          .filter(item => item.nom)
      : []
  };
}

function detectSources(question, type) {
  const text = `${question} ${type}`.toLowerCase();

  return SOURCES
    .map(source => {
      let score = 0;

      for (const keyword of source.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          score++;
        }
      }

      return {
        ...source,
        score
      };
    })
    .sort((a, b) => b.score - a.score)
    .filter(source => source.score > 0)
    .slice(0, 3);
}

async function fetchSource(source) {
  try {
    const response = await fetch(source.url, {
      method: "GET",
      headers: {
        "User-Agent": "GouRare-AI/7.0"
      }
    });

    if (!response.ok) {
      return {
        ...source,
        disponible: false,
        texte: ""
      };
    }

    const html = await response.text();

    const texte = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 12000);

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

function systemPrompt() {
  return `
Tu es GouRare AI.

Tu es un assistant d'orientation pratique pour les citoyens,
salariés, demandeurs d'emploi, indépendants, entrepreneurs
et petites entreprises.

TON OBJECTIF :

Comprendre la situation de l'utilisateur,
identifier le domaine concerné,
organiser les informations,
orienter vers les bonnes démarches,
identifier les points à vérifier,
et donner une prochaine action concrète.

REGLE ABSOLUE DE VERIFICATION :

Une information ne doit être placée dans "confirmees"
QUE SI LES SOURCES FOURNIES DANS LE CONTEXTE
LA SOUTIENNENT CLAIREMENT.

Si la source ne permet pas de confirmer une information,
place-la dans "aVerifier".

NE JAMAIS inventer :

- obligation
- loi
- article de loi
- seuil
- taux
- montant
- délai
- pénalité
- taxe
- cotisation
- numéro administratif
- document obligatoire
- autorisation
- licence
- statistique
- prix
- revenu
- économie
- pourcentage

Ne transforme jamais une possibilité en obligation.

Exemple :

Mauvais :
"Vous devez obligatoirement vous inscrire au RCS."

Correct :
"Les formalités d'immatriculation dépendent de la forme
et de la nature de l'activité. Vérifier la formalité exacte
pour cette activité."

Même principe pour la TVA, CFE, assurances,
autorisations, licences et documents.

IMPORTANT :

Ne considère jamais automatiquement qu'une entreprise
doit avoir un numéro de TVA intracommunautaire.

Ne considère jamais automatiquement que toute activité
doit être inscrite au RCS.

Ne considère jamais automatiquement qu'un document
est obligatoire.

Pour les activités réglementées, indique qu'il faut vérifier
si l'activité concernée est réglementée.

SOURCES :

Les sources officielles fournies sont prioritaires.

Si une source officielle n'est pas disponible,
ne prétends pas l'avoir consultée.

DISTINCTION :

"confirmees" = information clairement soutenue par une source.

"aVerifier" = information qui nécessite une vérification.

"recommandations" = conseil pratique de GouRare AI.

"actions" = prochaines étapes concrètes.

"documents" = documents à vérifier ou préparer,
mais ne les présente pas comme obligatoires sans preuve.

"risques" = risques généraux ou points d'attention.

PROFESSIONNEL :

Si la situation nécessite un avocat, expert-comptable,
professionnel du droit, professionnel fiscal,
travailleur social ou autre spécialiste,
indique-le clairement.

GouRare AI ne prétend jamais remplacer ces professionnels.

REPONSE :

Toujours produire une réponse pratique,
claire et compréhensible.

Terminer par une "prochaineAction".

FORMAT JSON STRICT :

{
  "titre": "",
  "compris": "",
  "orientation": "",
  "confirmees": [
    {
      "texte": "",
      "statut": "confirme",
      "source": "",
      "preuve": ""
    }
  ],
  "aVerifier": [
    {
      "texte": "",
      "statut": "a_verifier",
      "source": "",
      "preuve": ""
    }
  ],
  "recommandations": [],
  "actions": [],
  "documents": [],
  "risques": [],
  "professionnel": "",
  "prochaineAction": "",
  "sources": [
    {
      "nom": "",
      "url": ""
    }
  ]
}
`;
}

const schema = {
  type: "object",
  properties: {
    titre: { type: "string" },
    compris: { type: "string" },
    orientation: { type: "string" },

    confirmees: {
      type: "array",
      items: {
        type: "object",
        properties: {
          texte: { type: "string" },
          statut: { type: "string" },
          source: { type: "string" },
          preuve: { type: "string" }
        },
        required: ["texte", "statut", "source", "preuve"]
      }
    },

    aVerifier: {
      type: "array",
      items: {
        type: "object",
        properties: {
          texte: { type: "string" },
          statut: { type: "string" },
          source: { type: "string" },
          preuve: { type: "string" }
        },
        required: ["texte", "statut", "source", "preuve"]
      }
    },

    recommandations: {
      type: "array",
      items: { type: "string" }
    },

    actions: {
      type: "array",
      items: { type: "string" }
    },

    documents: {
      type: "array",
      items: { type: "string" }
    },

    risques: {
      type: "array",
      items: { type: "string" }
    },

    professionnel: { type: "string" },

    prochaineAction: { type: "string" },

    sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nom: { type: "string" },
          url: { type: "string" }
        },
        required: ["nom", "url"]
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

async function askAI(env, question, contexte, type) {
  const prompt = `
TYPE DE DEMANDE :
${type}

QUESTION UTILISATEUR :
${question}

CONTEXTE DES SOURCES OFFICIELLES :

${contexte}

Analyse la situation.

Ne mets dans "confirmees" que les informations
réellement soutenues par les extraits fournis.

Pour chaque information confirmée,
indique la source et une courte preuve.

Si la preuve n'existe pas,
place l'information dans "aVerifier".

Ne complète pas les informations manquantes
avec tes connaissances générales.

Réponds uniquement en JSON.
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
      temperature: 0.1
    }
  );

  const raw = extractJSON(result);

  if (!raw) {
    throw new Error("Réponse IA invalide.");
  }

  return normalizeAnalysis(raw);
}

function verifierConfirmations(analyse, sources) {
  const disponibles = sources.filter(s => s.disponible);

  const resultat = [];

  for (const item of analyse.confirmees) {
    const sourceName = clean(item.source).toLowerCase();
    const preuve = clean(item.preuve);

    const sourceExiste = disponibles.some(
      source =>
        source.name.toLowerCase() === sourceName
    );

    if (
      sourceExiste &&
      preuve.length >= 15
    ) {
      resultat.push({
        ...item,
        statut: "confirme"
      });
    } else {
      analyse.aVerifier.push({
        texte: item.texte,
        statut: "a_verifier",
        source: item.source || "",
        preuve: item.preuve || ""
      });
    }
  }

  analyse.confirmees = resultat;

  return analyse;
}

async function analyser(env, question, type) {
  const sourcesSelectionnees = detectSources(
    question,
    type
  );

  const sources = await Promise.all(
    sourcesSelectionnees.map(fetchSource)
  );

  const contexte = sources
    .filter(source => source.disponible)
    .map(source => `
SOURCE : ${source.name}
URL : ${source.url}

CONTENU :
${source.texte}
`)
    .join("\n-------------------\n");

  const analyse = await askAI(
    env,
    question,
    contexte || "Aucun contenu officiel disponible.",
    type
  );

  const resultat = verifierConfirmations(
    analyse,
    sources
  );

  resultat.sources = sources
    .filter(source => source.disponible)
    .map(source => ({
      nom: source.name,
      url: source.url
    }));

  return resultat;
}

async function handleAPI(request, env) {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Méthode non autorisée."
      }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  const contentType =
    request.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "JSON requis."
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: "JSON invalide."
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  const type = clean(body.type || "question", 100);

  const question = clean(
    body.question ||
    body.probleme ||
    "",
    3000
  );

  if (!question) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Question manquante."
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  try {
    const analyse = await analyser(
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
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Impossible de générer l'analyse.",
        detail: "Service temporairement indisponible."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}

function page() {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">

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
  padding: 28px 20px;
  text-align: center;
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
  margin-bottom: 20px;
  font-weight: bold;
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

.panel {
  background: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0,0,0,.06);
}

textarea,
input {
  width: 100%;
  padding: 14px;
  border: 1px solid #ccc;
  border-radius: 10px;
  margin-bottom: 12px;
  font-size: 16px;
}

button.primary {
  width: 100%;
  padding: 14px;
  border: 0;
  border-radius: 10px;
  background: #111;
  color: white;
  cursor: pointer;
  font-size: 16px;
}

.result-card {
  background: white;
  margin-top: 20px;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0,0,0,.06);
}

.result-card h2 {
  margin-top: 0;
}

.section {
  margin-top: 18px;
}

.section h3 {
  margin-bottom: 8px;
}

.item {
  padding: 10px;
  margin: 7px 0;
  background: #f3f3f3;
  border-radius: 8px;
}

.ai-result {
  white-space: pre-wrap;
  line-height: 1.6;
}

footer {
  text-align: center;
  padding: 25px;
  color: #666;
}

.small {
  color: #777;
  font-size: 13px;
}
</style>
</head>

<body>

<header>
  <h1>GouRare AI</h1>
  <p>L'intelligence qui vous oriente vers la bonne action.</p>
</header>

<main>

<div class="badge">
  🎗️ Avec vous contre le cancer
</div>

<div class="tabs">
  <button class="active" data-type="question">Question</button>
  <button data-type="secteur">Secteur</button>
  <button data-type="independant">Indépendant</button>
  <button data-type="probleme">Problème</button>
</div>

<div class="panel">

<div id="questionPanel">

<textarea id="question"
placeholder="Décrivez votre situation ou votre question..."></textarea>

</div>

<button class="primary" id="analyser">
Analyser avec GouRare AI
</button>

</div>

<div id="results"></div>

</main>

<footer>
  🎗️ Notre soutien aux personnes touchées par le cancer.
  <br>
  <span class="small">
    GouRare AI fournit une orientation et ne remplace pas
    un professionnel qualifié.
  </span>
</footer>

<script>
const tabs = document.querySelectorAll(".tabs button");
const analyserButton = document.getElementById("analyser");
const question = document.getElementById("question");
const results = document.getElementById("results");

let currentType = "question";

tabs.forEach(button => {
  button.addEventListener("click", () => {

    tabs.forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    currentType = button.dataset.type;
  });
});

function escapeHTML(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function listHTML(items) {
  if (!Array.isArray(items) || !items.length) {
    return "";
  }

  return items.map(item => {

    if (typeof item === "string") {
      return '<div class="item">' +
        escapeHTML(item) +
        '</div>';
    }

    return '<div class="item">' +
      '<strong>' +
      escapeHTML(item.texte || "") +
      '</strong>' +
      (item.source
        ? '<div class="small">Source : ' +
          escapeHTML(item.source) +
          '</div>'
        : '') +
      (item.preuve
        ? '<div class="small">Preuve : ' +
          escapeHTML(item.preuve) +
          '</div>'
        : '') +
      '</div>';

  }).join("");
}

function renderAnalyse(analyse) {

  results.innerHTML =
    '<div class="result-card">' +

      '<h2>' +
        escapeHTML(analyse.titre) +
      '</h2>' +

      '<div class="section">' +
        '<h3>Ce que j\\'ai compris</h3>' +
        '<div class="ai-result">' +
          escapeHTML(analyse.compris) +
        '</div>' +
      '</div>' +

      '<div class="section">' +
        '<h3>Orientation</h3>' +
        '<div class="ai-result">' +
          escapeHTML(analyse.orientation) +
        '</div>' +
      '</div>' +

      '<div class="section">' +
        '<h3>Informations confirmées</h3>' +
        listHTML(analyse.confirmees) +
      '</div>' +

      '<div class="section">' +
        '<h3>À vérifier</h3>' +
        listHTML(analyse.aVerifier) +
      '</div>' +

      '<div class="section">' +
        '<h3>Recommandations</h3>' +
        listHTML(analyse.recommandations) +
      '</div>' +

      '<div class="section">' +
        '<h3>Actions</h3>' +
        listHTML(analyse.actions) +
      '</div>' +

      '<div class="section">' +
        '<h3>Documents</h3>' +
        listHTML(analyse.documents) +
      '</div>' +

      '<div class="section">' +
        '<h3>Risques / points d\\'attention</h3>' +
        listHTML(analyse.risques) +
      '</div>' +

      '<div class="section">' +
        '<h3>Professionnel à consulter</h3>' +
        '<div class="item">' +
          escapeHTML(analyse.professionnel) +
        '</div>' +
      '</div>' +

      '<div class="section">' +
        '<h3>PROCHAINE ACTION</h3>' +
        '<div class="item">' +
          '<strong>' +
            escapeHTML(analyse.prochaineAction) +
          '</strong>' +
        '</div>' +
      '</div>' +

      '<div class="section">' +
        '<h3>Sources consultées</h3>' +
        listHTML(
          (analyse.sources || []).map(source =>
            source.nom +
            (source.url ? " — " + source.url : "")
          )
        ) +
      '</div>' +

    '</div>';
}

analyserButton.addEventListener("click", async () => {

  const value = question.value.trim();

  if (!value) {
    alert("Veuillez décrire votre situation.");
    return;
  }

  analyserButton.disabled = true;
  analyserButton.textContent = "Analyse en cours...";
  results.innerHTML = "";

  try {

    const response = await fetch("/api/analyze", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        type: currentType,
        question: value
      })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error("Analyse impossible");
    }

    renderAnalyse(data.analyse);

  } catch (error) {

    results.innerHTML =
      '<div class="result-card">' +
        '<h2>Erreur</h2>' +
        '<p>Le service est temporairement indisponible.</p>' +
      '</div>';

  } finally {

    analyserButton.disabled = false;
    analyserButton.textContent =
      "Analyser avec GouRare AI";
  }
});
</script>

</body>
</html>`;
}

export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    const headers = {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy":
        "camera=(), microphone=(), geolocation=()",
      "Cache-Control": "no-store"
    };

    if (url.pathname === "/health") {

      return new Response(
        JSON.stringify({
          success: true,
          service: "GouRare AI",
          status: "OK",
          version: VERSION
        }),
        {
          headers: {
            ...headers,
            "Content-Type": "application/json"
          }
        }
      );
    }

    if (url.pathname === "/api/analyze") {

      const response = await handleAPI(
        request,
        env
      );

      const newHeaders = new Headers(response.headers);

      for (const [key, value] of Object.entries(headers)) {
        newHeaders.set(key, value);
      }

      return new Response(
        response.body,
        {
          status: response.status,
          headers: newHeaders
        }
      );
    }

    if (request.method === "GET") {

      return new Response(
        page(),
        {
          headers: {
            ...headers,
            "Content-Type": "text/html; charset=UTF-8"
          }
        }
      );
    }

    return new Response(
      "Not Found",
      {
        status: 404,
        headers
      }
    );
  }
};
