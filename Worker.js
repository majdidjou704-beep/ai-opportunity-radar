const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const VERSION = "7.4";

const SOURCES = {
  statut: {
    id: "statut",
    title: "Trouver le statut juridique adapté à son activité",
    url: "https://entreprendre.service-public.fr/vosdroits/R18323",
    preuves: [
      {
        id: "STATUT-P1",
        texte: "Un simulateur permet de trouver le statut juridique adapté à une activité."
      },
      {
        id: "STATUT-P2",
        texte: "Le choix du statut s'effectue notamment à partir de l'activité exercée et du chiffre d'affaires estimé."
      },
      {
        id: "STATUT-P3",
        texte: "Le simulateur permet de connaître les différentes formes juridiques possibles."
      },
      {
        id: "STATUT-P4",
        texte: "Les différentes formes peuvent être comparées notamment selon les revenus, la protection sociale, la comptabilité et la gestion juridique."
      }
    ]
  },

  creation_ei: {
    id: "creation_ei",
    title: "Création d'une entreprise individuelle : formalités d'immatriculation",
    url: "https://entreprendre.service-public.fr/vosdroits/F36763",
    preuves: [
      {
        id: "EI-P1",
        texte: "L'entreprise individuelle comporte peu de formalités de création, dont notamment l'immatriculation et la déclaration de l'activité."
      },
      {
        id: "EI-P2",
        texte: "L'immatriculation d'une entreprise individuelle se fait sur le Guichet des formalités des entreprises."
      },
      {
        id: "EI-P3",
        texte: "Après l'immatriculation, l'entreprise individuelle est inscrite au Registre national des entreprises (RNE)."
      },
      {
        id: "EI-P4",
        texte: "Le registre auquel l'entreprise individuelle est inscrite dépend de la nature de l'activité exercée."
      },
      {
        id: "EI-P5",
        texte: "Une entreprise individuelle exerçant une activité commerciale est inscrite au RCS et au RNE."
      },
      {
        id: "EI-P6",
        texte: "Une entreprise individuelle exerçant une activité artisanale est inscrite au RNE, avec des règles supplémentaires selon le nombre de salariés."
      },
      {
        id: "EI-P7",
        texte: "Une entreprise individuelle exerçant une activité libérale est inscrite au RNE."
      },
      {
        id: "EI-P8",
        texte: "Pour l'immatriculation d'une entreprise individuelle, certaines pièces peuvent être demandées, notamment un justificatif de domiciliation, une déclaration sur l'honneur de non-condamnation et une pièce d'identité."
      },
      {
        id: "EI-P9",
        texte: "Une activité réglementée peut nécessiter une autorisation, un diplôme ou un titre professionnel."
      }
    ]
  }
};

function clean(value, max = 5000) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, max);
}

function normalizeArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => clean(item, 1000))
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values)];
}

function detectContext(question) {
  const q = question.toLowerCase();

  const nettoyage =
    q.includes("nettoyage") ||
    q.includes("ménage") ||
    q.includes("menage") ||
    q.includes("entretien");

  const entreprise =
    q.includes("entreprise") ||
    q.includes("société") ||
    q.includes("societe") ||
    q.includes("créer") ||
    q.includes("creer") ||
    q.includes("création") ||
    q.includes("creation");

  const ei =
    q.includes("entreprise individuelle") ||
    q.includes("ei") ||
    q.includes("micro-entreprise") ||
    q.includes("micro entreprise") ||
    q.includes("microentreprise");

  const fiscal =
    q.includes("impôt") ||
    q.includes("impot") ||
    q.includes("fiscal") ||
    q.includes("taxe") ||
    q.includes("tva") ||
    q.includes("urssaf");

  return {
    nettoyage,
    entreprise,
    ei,
    fiscal
  };
}

function selectSources(question) {
  const contexte = detectContext(question);
  const sources = [];

  if (contexte.entreprise || contexte.ei) {
    sources.push(SOURCES.statut);
  }

  if (contexte.ei) {
    sources.push(SOURCES.creation_ei);
  }

  if (
    contexte.nettoyage &&
    contexte.entreprise &&
    !contexte.ei
  ) {
    sources.push(SOURCES.statut);
  }

  const map = new Map();

  for (const source of sources) {
    map.set(source.id, source);
  }

  return [...map.values()];
}

function buildConfirmedFacts(question) {
  const contexte = detectContext(question);
  const confirmees = [];

  if (contexte.entreprise || contexte.nettoyage) {
    confirmees.push({
      texte:
        "Le choix de la forme juridique peut être étudié à partir de l'activité exercée et d'autres critères comme le chiffre d'affaires estimé, les revenus, la protection sociale et la gestion.",
      source_id: "statut",
      preuve_id: "STATUT-P2"
    });
  }

  if (contexte.ei) {
    confirmees.push({
      texte:
        "Pour une entreprise individuelle, les formalités d'immatriculation passent par le Guichet des formalités des entreprises.",
      source_id: "creation_ei",
      preuve_id: "EI-P2"
    });

    confirmees.push({
      texte:
        "Après son immatriculation, une entreprise individuelle est inscrite au Registre national des entreprises (RNE).",
      source_id: "creation_ei",
      preuve_id: "EI-P3"
    });

    confirmees.push({
      texte:
        "Les registres concernés par une entreprise individuelle dépendent de la nature de l'activité exercée.",
      source_id: "creation_ei",
      preuve_id: "EI-P4"
    });
  }

  return confirmees;
}

function buildDocuments(question) {
  const contexte = detectContext(question);

  if (!contexte.ei) {
    return [];
  }

  return [
    {
      statut: "à vérifier",
      texte:
        "Un justificatif de domiciliation peut être demandé pour l'immatriculation.",
      source_id: "creation_ei",
      preuve_id: "EI-P8"
    },
    {
      statut: "à vérifier",
      texte:
        "Une déclaration sur l'honneur de non-condamnation et une pièce d'identité peuvent être demandées.",
      source_id: "creation_ei",
      preuve_id: "EI-P8"
    }
  ];
}

function buildRisks(question) {
  // Aucun risque juridique n'est affiché automatiquement
  // sans preuve officielle spécifique.
  return [];
}

function buildNextAction(question) {
  const contexte = detectContext(question);

  if (contexte.ei) {
    return "Préciser la nature exacte de l'activité de nettoyage afin de vérifier les formalités et inscriptions applicables.";
  }

  if (contexte.nettoyage && contexte.entreprise) {
    return "Préciser la forme juridique envisagée et la nature exacte de l'activité de nettoyage.";
  }

  return "Préciser votre situation et l'objectif recherché afin d'identifier la prochaine démarche adaptée.";
}

function buildRecommendations(question) {
  const contexte = detectContext(question);

  if (contexte.nettoyage && contexte.entreprise && !contexte.ei) {
    return [
      "Comparer les formes juridiques possibles avant de choisir celle qui correspond à votre activité.",
      "Préciser si l'activité sera exercée seul ou avec d'autres personnes.",
      "Préciser la nature exacte des prestations de nettoyage envisagées."
    ];
  }

  if (contexte.ei) {
    return [
      "Vérifier la nature exacte de l'activité exercée.",
      "Vérifier les formalités correspondant à cette activité sur le Guichet des formalités des entreprises."
    ];
  }

  return [
    "Préciser les éléments importants de votre situation.",
    "Vérifier les informations spécifiques auprès de la source officielle concernée."
  ];
}

function buildActions(question) {
  const contexte = detectContext(question);

  if (contexte.nettoyage && contexte.entreprise && !contexte.ei) {
    return [
      "Définir précisément les prestations de nettoyage proposées.",
      "Comparer les formes juridiques adaptées à l'activité.",
      "Vérifier ensuite les formalités correspondant au statut choisi."
    ];
  }

  if (contexte.ei) {
    return [
      "Préciser la nature exacte de l'activité.",
      "Vérifier les formalités d'immatriculation applicables.",
      "Préparer uniquement les documents demandés pour la démarche concernée."
    ];
  }

  return [
    "Préciser votre situation.",
    "Identifier la démarche concernée.",
    "Vérifier les informations auprès de la source officielle adaptée."
  ];
}

function buildSources(question) {
  return selectSources(question).map(source => ({
    id: source.id,
    titre: source.title,
    url: source.url
  }));
}

function systemPrompt() {
  return `
Tu es GouRare AI, un assistant d'orientation intelligent.

TON RÔLE
Tu aides les citoyens, salariés, demandeurs d'emploi, indépendants,
entrepreneurs et petites entreprises à comprendre leur situation,
organiser les informations et identifier les prochaines actions.

TU NE REMPLACES PAS :
- un avocat
- un expert-comptable
- un médecin
- un travailleur social
- une administration
- un autre professionnel réglementé

RÈGLE ABSOLUE DE FIABILITÉ
Tu ne dois jamais inventer :
- lois
- articles
- obligations
- sanctions
- montants
- taux
- seuils
- délais
- documents obligatoires
- statistiques
- revenus
- économies
- prix

Les informations confirmées sont déjà construites par le moteur de vérité.
Tu ne dois PAS en créer de nouvelles.

Ton travail consiste principalement à :
1. expliquer simplement la situation ;
2. organiser les informations ;
3. distinguer ce qui est confirmé de ce qui doit être vérifié ;
4. proposer des actions pratiques ;
5. éviter les affirmations juridiques non prouvées.

Si une information n'est pas certaine :
dis "À vérifier" ou "Cela dépend de votre situation".

Ne transforme jamais une recommandation en obligation légale.

Réponds en français.

Retourne uniquement un JSON valide avec cette structure :

{
  "orientation": "texte",
  "a_verifier": ["texte"],
  "recommandations": ["texte"],
  "actions": ["texte"]
}
`;
}

async function askAI(question, contexte) {
  const prompt = `
Question de l'utilisateur :
${question}

Contexte détecté :
${JSON.stringify(contexte)}

Important :
Les informations confirmées et les documents sont gérés séparément
par le moteur de vérité.

Tu dois éviter :
- d'inventer une obligation ;
- de dire qu'un statut est obligatoire sans preuve ;
- de présenter un document comme obligatoire sans preuve ;
- de produire des sanctions ;
- de recommander automatiquement un avocat ou un expert-comptable.

Explique la situation de manière pratique.
`;

  const response = await envIA(prompt);

  return response;
}

async function envIA(prompt) {
  throw new Error("IA_NOT_INITIALIZED");
}

function extractJSON(text) {
  if (!text) return null;

  if (typeof text === "object") {
    return text;
  }

  let value = String(text).trim();

  value = value
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(value);
  } catch {}

  const first = value.indexOf("{");
  const last = value.lastIndexOf("}");

  if (first !== -1 && last !== -1 && last > first) {
    try {
      return JSON.parse(value.slice(first, last + 1));
    } catch {}
  }

  return null;
}

function cleanAIResult(data) {
  if (!data || typeof data !== "object") {
    return {
      orientation: "",
      a_verifier: [],
      recommandations: [],
      actions: []
    };
  }

  return {
    orientation: clean(data.orientation, 3000),
    a_verifier: unique(normalizeArray(data.a_verifier)),
    recommandations: unique(normalizeArray(data.recommandations)),
    actions: unique(normalizeArray(data.actions))
  };
}

function filterAIResult(result, question) {
  const interdit = [
    "vous devez créer une entreprise individuelle",
    "vous devez créer une entreprise",
    "vous devez obligatoirement",
    "sanction",
    "pénalité",
    "amende",
    "peine",
    "expert-comptable",
    "avocat"
  ];

  function filtrer(tableau) {
    return tableau.filter(item => {
      const t = item.toLowerCase();

      return !interdit.some(mot => t.includes(mot));
    });
  }

  result.a_verifier = filtrer(result.a_verifier);
  result.recommandations = filtrer(result.recommandations);
  result.actions = filtrer(result.actions);

  return result;
}

function buildResponse(question, aiResult) {
  const contexte = detectContext(question);

  const confirmees = buildConfirmedFacts(question);
  const documents = buildDocuments(question);
  const risques = buildRisks(question);
  const sources = buildSources(question);

  let result = cleanAIResult(aiResult);

  result = filterAIResult(result, question);

  const orientation =
    result.orientation ||
    "Votre situation nécessite de préciser quelques éléments avant de déterminer les démarches adaptées.";

  let aVerifier = result.a_verifier;

  if (aVerifier.length === 0) {
    aVerifier = [
      "Les démarches exactes peuvent dépendre de la forme juridique et de la nature précise de l'activité."
    ];
  }

  return {
    success: true,
    version: VERSION,
    titre: "Analyse GouRare AI",

    compris: contexte.nettoyage
      ? "Vous souhaitez créer ou développer une activité de nettoyage en France."
      : "Votre demande a été analysée selon les informations fournies.",

    orientation,

    confirmees,

    a_verifier: aVerifier,

    recommandations:
      result.recommandations.length > 0
        ? result.recommandations
        : buildRecommendations(question),

    actions:
      result.actions.length > 0
        ? result.actions
        : buildActions(question),

    documents,

    risques,

    professionnel: [],

    prochaine_action: buildNextAction(question),

    sources,

    soutien: "🎗️ Avec vous contre le cancer"
  };
}

function htmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function pageHTML() {
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
  background: #f5f7fa;
  color: #17202a;
}

header {
  padding: 28px 20px;
  background: #111827;
  color: white;
  text-align: center;
}

header h1 {
  margin: 0;
  font-size: 32px;
}

header p {
  margin: 8px 0 0;
  opacity: .8;
}

main {
  max-width: 900px;
  margin: auto;
  padding: 20px;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 18px;
  box-shadow: 0 5px 20px rgba(0,0,0,.06);
}

textarea {
  width: 100%;
  min-height: 130px;
  padding: 15px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 16px;
  resize: vertical;
}

button {
  width: 100%;
  margin-top: 12px;
  padding: 15px;
  border: 0;
  border-radius: 12px;
  background: #111827;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

button:disabled {
  opacity: .5;
}

.section {
  margin-top: 20px;
}

.section h2 {
  font-size: 20px;
  margin-bottom: 10px;
}

.item {
  background: #f8fafc;
  border-radius: 10px;
  padding: 12px;
  margin: 8px 0;
}

.confirmed {
  border-left: 4px solid #16a34a;
}

.verify {
  border-left: 4px solid #f59e0b;
}

.action {
  border-left: 4px solid #2563eb;
}

.source {
  display: block;
  margin: 8px 0;
  color: #2563eb;
  text-decoration: none;
}

.badge {
  position: fixed;
  right: 12px;
  bottom: 12px;
  background: white;
  padding: 9px 12px;
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,.15);
  font-size: 13px;
}

footer {
  text-align: center;
  padding: 25px;
  color: #6b7280;
  font-size: 13px;
}
</style>
</head>

<body>

<header>
  <h1>GouRare AI</h1>
  <p>Intelligence, orientation et solutions</p>
</header>

<main>

<div class="card">
  <h2>Posez votre question</h2>

  <textarea id="question"
    placeholder="Exemple : Je veux créer une entreprise de nettoyage en France. Que dois-je faire ?"></textarea>

  <button id="btn" onclick="analyser()">
    Analyser avec GouRare AI
  </button>
</div>

<div id="result"></div>

</main>

<div class="badge">🎗️ Avec vous contre le cancer</div>

<footer>
  🎗️ Notre soutien aux personnes touchées par le cancer.
  <br><br>
  GouRare AI — Version ${VERSION}
</footer>

<script>
async function analyser() {
  const question = document.getElementById("question").value.trim();
  const button = document.getElementById("btn");
  const result = document.getElementById("result");

  if (!question) {
    alert("Veuillez écrire votre question.");
    return;
  }

  button.disabled = true;
  button.textContent = "Analyse en cours...";
  result.innerHTML = "";

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: "question",
        question: question
      })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Erreur");
    }

    afficher(data);

  } catch (error) {

    result.innerHTML =
      '<div class="card">' +
      '<h2>Erreur</h2>' +
      '<p>Une erreur est survenue. Veuillez réessayer.</p>' +
      '</div>';

  } finally {
    button.disabled = false;
    button.textContent = "Analyser avec GouRare AI";
  }
}

function afficher(data) {

  let html =
    '<div class="card">' +

    '<div class="section">' +
    '<h2>🧭 Ce que j\\'ai compris</h2>' +
    '<div class="item">' +
    escapeHTML(data.compris) +
    '</div>' +
    '</div>' +

    '<div class="section">' +
    '<h2>💡 Orientation</h2>' +
    '<div class="item">' +
    escapeHTML(data.orientation) +
    '</div>' +
    '</div>';

  html += '<div class="section"><h2>✅ Informations confirmées</h2>';

  if (data.confirmees && data.confirmees.length) {

    data.confirmees.forEach(function(item) {

      html +=
        '<div class="item confirmed">' +
        escapeHTML(item.texte) +
        '</div>';

    });

  } else {

    html +=
      '<div class="item">' +
      'Aucune information confirmée avec une preuve officielle suffisante.' +
      '</div>';
  }

  html += '</div>';

  html += '<div class="section"><h2>🔎 À vérifier</h2>';

  data.a_verifier.forEach(function(item) {

    html +=
      '<div class="item verify">' +
      escapeHTML(item) +
      '</div>';

  });

  html += '</div>';

  html += '<div class="section"><h2>💭 Recommandations</h2>';

  data.recommandations.forEach(function(item) {

    html +=
      '<div class="item">' +
      escapeHTML(item) +
      '</div>';

  });

  html += '</div>';

  html += '<div class="section"><h2>📋 Actions concrètes</h2>';

  data.actions.forEach(function(item) {

    html +=
      '<div class="item action">' +
      escapeHTML(item) +
      '</div>';

  });

  html += '</div>';

  html += '<div class="section"><h2>📄 Documents</h2>';

  if (data.documents && data.documents.length) {

    data.documents.forEach(function(doc) {

      html +=
        '<div class="item">' +
        '<strong>' +
        escapeHTML(doc.statut) +
        '</strong> — ' +
        escapeHTML(doc.texte) +
        '</div>';

    });

  } else {

    html +=
      '<div class="item">' +
      'Aucun document précis à présenter à ce stade.' +
      '</div>';
  }

  html += '</div>';

  if (data.risques && data.risques.length) {

    html += '<div class="section"><h2>⚠️ Points de vigilance</h2>';

    data.risques.forEach(function(item) {

      html +=
        '<div class="item verify">' +
        escapeHTML(item) +
        '</div>';

    });

    html += '</div>';
  }

  html +=
    '<div class="section">' +
    '<h2>🚀 Prochaine action</h2>' +
    '<div class="item action">' +
    escapeHTML(data.prochaine_action) +
    '</div>' +
    '</div>';

  html += '<div class="section"><h2>📚 Sources consultées</h2>';

  data.sources.forEach(function(source) {

    html +=
      '<a class="source" target="_blank" rel="noopener noreferrer" href="' +
      escapeHTML(source.url) +
      '">' +
      escapeHTML(source.titre) +
      ' ↗' +
      '</a>';

  });

  html +=
    '</div>' +

    '<div class="section">' +
    '<div class="item">' +
    escapeHTML(data.soutien) +
    '</div>' +
    '</div>' +

    '</div>';

  document.getElementById("result").innerHTML = html;
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
</script>

</body>
</html>`;
}

export default {
  async fetch(request, env) {

    const securityHeaders = {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Cache-Control": "no-store"
    };

    const url = new URL(request.url);

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
            ...securityHeaders,
            "Content-Type": "application/json; charset=UTF-8"
          }
        }
      );
    }

    if (url.pathname === "/api/analyze") {

      if (request.method !== "POST") {

        return new Response(
          JSON.stringify({
            success: false,
            error: "Méthode non autorisée."
          }),
          {
            status: 405,
            headers: {
              ...securityHeaders,
              "Content-Type": "application/json; charset=UTF-8"
            }
          }
        );
      }

      try {

        const contentType =
          request.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {

          return new Response(
            JSON.stringify({
              success: false,
              error: "Content-Type JSON requis."
            }),
            {
              status: 415,
              headers: {
                ...securityHeaders,
                "Content-Type": "application/json; charset=UTF-8"
              }
            }
          );
        }

        const body = await request.json();

        const question = clean(body.question, 5000);

        if (!question) {

          return new Response(
            JSON.stringify({
              success: false,
              error: "Question manquante."
            }),
            {
              status: 400,
              headers: {
                ...securityHeaders,
                "Content-Type": "application/json; charset=UTF-8"
              }
            }
          );
        }

        const contexte = detectContext(question);

        /*
         * Appel AI.
         *
         * Le binding Cloudflare reste :
         * env.IA
         */

        const aiResponse = await env.IA.run(
          MODEL,
          {
            messages: [
              {
                role: "system",
                content: systemPrompt()
              },
              {
                role: "user",
                content:
                  "Question : " +
                  question +
                  "\\n\\nContexte : " +
                  JSON.stringify(contexte)
              }
            ],
            max_tokens: 1800,
            temperature: 0.1
          }
        );

        let raw = "";

        if (typeof aiResponse === "string") {
          raw = aiResponse;
        } else if (aiResponse && aiResponse.response) {
          raw = aiResponse.response;
        } else if (
          aiResponse &&
          aiResponse.result &&
          aiResponse.result.response
        ) {
          raw = aiResponse.result.response;
        } else {
          raw = JSON.stringify(aiResponse);
        }

        const parsed = extractJSON(raw);

        const finalResponse = buildResponse(
          question,
          parsed || {}
        );

        return new Response(
          JSON.stringify(finalResponse),
          {
            headers: {
              ...securityHeaders,
              "Content-Type": "application/json; charset=UTF-8"
            }
          }
        );

      } catch (error) {

        return new Response(
          JSON.stringify({
            success: false,
            error: "Erreur interne du service.",
            version: VERSION
          }),
          {
            status: 500,
            headers: {
              ...securityHeaders,
              "Content-Type": "application/json; charset=UTF-8"
            }
          }
        );
      }
    }

    if (request.method !== "GET") {

      return new Response(
        "Méthode non autorisée.",
        {
          status: 405,
          headers: securityHeaders
        }
      );
    }

    return new Response(
      pageHTML(),
      {
        headers: {
          ...securityHeaders,
          "Content-Type": "text/html; charset=UTF-8"
        }
      }
    );
  }
};
