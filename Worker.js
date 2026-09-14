const VERSION = "7.3";
const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

/*
  GouRare AI V7.3
  Moteur de preuve contrôlé

  Principe :
  - L'IA ne crée pas les preuves.
  - Les preuves viennent uniquement de notre base officielle.
  - Une information ne peut être "confirmée" que si elle possède
    un preuve_id valide.
  - Une information conditionnelle reste conditionnelle.
*/

const SOURCES = {
  creation_ei: {
    id: "creation_ei",
    name: "Création d'une entreprise individuelle - Service Public Entreprendre",
    url: "https://entreprendre.service-public.fr/vosdroits/F36763",

    preuves: [
      {
        id: "P1",
        texte:
          "Pour créer une entreprise individuelle (EI), il y a très peu de formalités à accomplir. L'une d'entre elles est l'immatriculation. Il s'agit de la déclaration d'activité auprès de l'administration."
      },
      {
        id: "P2",
        texte:
          "La demande d'immatriculation doit être réalisée sur le site internet du guichet des formalités des entreprises, au plus tôt 1 mois avant le début d'activité ou au plus tard dans les 15 jours qui suivent la date de début d'activité."
      },
      {
        id: "P3",
        texte:
          "Une fois l'immatriculation réalisée, l'entreprise est inscrite sur le registre national des entreprises (RNE)."
      },
      {
        id: "P4",
        texte:
          "Le registre d'inscription est différent selon la nature de l'activité exercée."
      },
      {
        id: "P5",
        texte:
          "Activité commerciale : l'entreprise individuelle (EI) est inscrite au registre du commerce et des sociétés (RCS) et au registre national des entreprises (RNE)."
      },
      {
        id: "P6",
        texte:
          "Activité artisanale : pour une entreprise de moins de 11 salariés, l'entreprise individuelle (EI) est inscrite au registre national des entreprises (RNE) en tant qu'entreprise du secteur des métiers et de l'artisanat."
      },
      {
        id: "P7",
        texte:
          "Activité libérale : l'entreprise individuelle est inscrite au registre national des entreprises (RNE)."
      },
      {
        id: "P8",
        texte:
          "Lors de la demande d'immatriculation auprès du guichet des formalités des entreprises, il faut indiquer un certain nombre d'informations et joindre notamment un justificatif de domiciliation de l'entreprise, une déclaration sur l'honneur de non-condamnation et une attestation de filiation, ainsi qu'une copie de la pièce d'identité."
      },
      {
        id: "P9",
        texte:
          "Si l'entrepreneur exerce une activité réglementée, une copie de l'autorisation d'exercice de l'activité, du diplôme ou du titre peut être demandée."
      }
    ]
  },

  statut: {
    id: "statut",
    name: "Trouver le statut juridique adapté à son activité - Service Public Entreprendre",
    url: "https://entreprendre.service-public.fr/vosdroits/R18323",

    preuves: [
      {
        id: "P1",
        texte:
          "Ce questionnaire détaillé permet de choisir le statut juridique le plus adapté à son projet d'entreprise."
      },
      {
        id: "P2",
        texte:
          "Étape 1 : saisir les informations demandées : activité envisagée, chiffre d'affaires estimé."
      },
      {
        id: "P3",
        texte:
          "Étape 2 : connaître les formes juridiques possibles."
      },
      {
        id: "P4",
        texte:
          "Étape 3 : comparer les revenus, la couverture sociale et la gestion comptable et juridique avant de faire son choix."
      }
    ]
  }
};

function clean(value, max = 5000) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, max);
}

function arrayText(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => {
      if (typeof item === "string") {
        return clean(item, 1200);
      }

      if (item && typeof item === "object") {
        return clean(
          item.texte ||
          item.text ||
          item.description ||
          "",
          1200
        );
      }

      return "";
    })
    .filter(Boolean);
}

function extractJSON(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    if (value.response !== undefined) {
      return extractJSON(value.response);
    }

    if (value.result !== undefined) {
      return extractJSON(value.result);
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
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  try {
    return JSON.parse(text);
  } catch (_) {}

  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");

  if (first !== -1 && last > first) {
    try {
      return JSON.parse(
        text.substring(first, last + 1)
      );
    } catch (_) {}
  }

  return null;
}

/*
  Détection du contexte.
*/
function detectContext(question) {
  const q = question.toLowerCase();

  const creation =
    q.includes("créer une entreprise") ||
    q.includes("création d'entreprise") ||
    q.includes("creation d'entreprise") ||
    q.includes("créer mon entreprise") ||
    q.includes("lancer mon entreprise") ||
    q.includes("ouvrir mon entreprise");

  const nettoyage =
    q.includes("nettoyage") ||
    q.includes("ménage") ||
    q.includes("menage");

  const micro =
    q.includes("micro-entreprise") ||
    q.includes("micro entreprise") ||
    q.includes("microentrepreneur") ||
    q.includes("micro-entrepreneur");

  const ei =
    q.includes("entreprise individuelle") ||
    q.includes("entreprise individuelle (ei)") ||
    q.includes("statut ei");

  return {
    creation,
    nettoyage,
    micro,
    ei
  };
}

/*
  Sources autorisées selon la question.
*/
function selectSources(question) {
  const context = detectContext(question);

  const result = [];

  if (context.creation || context.nettoyage) {
    result.push(SOURCES.statut);
    result.push(SOURCES.creation_ei);
  }

  if (context.ei && !result.includes(SOURCES.creation_ei)) {
    result.push(SOURCES.creation_ei);
  }

  return result;
}

/*
  Contexte de preuve envoyé à l'IA.
*/
function buildProofContext(sources) {
  return sources.map(source => {
    const preuves = source.preuves
      .map(
        proof =>
          `[${source.id}/${proof.id}] ${proof.texte}`
      )
      .join("\n");

    return `
SOURCE_ID: ${source.id}
SOURCE: ${source.name}
URL: ${source.url}

PREUVES OFFICIELLES :
${preuves}
`;
  }).join("\n----------------------\n");
}

function systemPrompt() {
  return `
Tu es GouRare AI.

Tu aides les utilisateurs à comprendre leurs démarches,
leurs droits, leurs obligations et leurs choix.

Tu n'es pas avocat, expert-comptable, administration,
médecin ou autre professionnel réglementé.

RÈGLE ABSOLUE :

Tu ne dois jamais inventer une obligation.

Tu ne dois jamais transformer une possibilité en obligation.

Tu ne dois jamais transformer une recommandation en obligation.

Tu ne dois jamais présenter une information concernant
l'entreprise individuelle comme une obligation générale
pour toutes les formes d'entreprise.

IMPORTANT :

Si l'utilisateur dit seulement :
"Je veux créer une entreprise de nettoyage"

Tu ne dois PAS répondre :
"Vous devez créer une entreprise individuelle."

Tu dois dire que plusieurs formes juridiques peuvent exister
et que le choix du statut doit être déterminé.

Tu peux confirmer uniquement une information qui correspond
à une preuve officielle fournie.

Pour une information confirmée :
- utiliser exactement un source_id valide
- utiliser exactement un preuve_id valide

Ne jamais inventer de preuve_id.

Ne jamais écrire toi-même une preuve.

Le système remplacera automatiquement preuve_id
par le texte officiel réel.

Si une information n'est pas suffisamment démontrée :
mettre l'information dans aVerifier.

Ne mets jamais :
"L'intention de l'utilisateur n'est pas une information à vérifier."

L'intention de l'utilisateur doit rester dans "compris".

DOCUMENTS :

Utilise :
- obligatoire
- conditionnel
- a_verifier

N'écris "obligatoire" que si la preuve le démontre clairement.

Si le document dépend d'une situation :
utilise "conditionnel".

PROFESSIONNEL :

Ne recommande pas automatiquement un avocat ou expert-comptable.
Ne le recommande que si la situation le justifie réellement.

STYLE :

Simple.
Pratique.
Précis.
Pas de jargon inutile.

La prochaine action doit être réaliste.
`;
}

const SCHEMA = {
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
          source_id: {
            type: "string"
          },
          preuve_id: {
            type: "string"
          }
        },
        required: [
          "texte",
          "source_id",
          "preuve_id"
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
          }
        },
        required: [
          "texte"
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
        type: "object",
        properties: {
          texte: {
            type: "string"
          },
          statut: {
            type: "string"
          }
        },
        required: [
          "texte",
          "statut"
        ]
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
    "prochaineAction"
  ]
};

function getProof(sources, sourceId, proofId) {
  const source = sources.find(
    item => item.id === sourceId
  );

  if (!source) {
    return null;
  }

  const proof = source.preuves.find(
    item => item.id === proofId
  );

  if (!proof) {
    return null;
  }

  return {
    source: source.name,
    url: source.url,
    preuve: proof.texte
  };
}

/*
  Nettoyage anti-hallucination.
*/
function sanitizeAnalyse(analyse, sources, question) {

  const context = detectContext(question);

  const confirmees = [];

  for (const item of analyse.confirmees || []) {

    const proof = getProof(
      sources,
      item.source_id,
      item.preuve_id
    );

    if (!proof) {
      continue;
    }

    /*
      Interdiction de considérer EI comme choix obligatoire
      lorsque l'utilisateur ne l'a pas demandé.
    */
    if (
      !context.ei &&
      /vous devez.*entreprise individuelle|doit.*entreprise individuelle|faut.*entreprise individuelle/i
        .test(item.texte)
    ) {
      continue;
    }

    confirmees.push({
      texte: clean(item.texte, 1600),
      source: proof.source,
      url: proof.url,
      preuve: proof.preuve,
      statut: "confirmé"
    });
  }

  /*
    Supprimer les doublons.
  */
  const uniques = [];
  const dejaVu = new Set();

  for (const item of confirmees) {
    const key =
      item.texte.toLowerCase() +
      "|" +
      item.preuve.toLowerCase();

    if (!dejaVu.has(key)) {
      dejaVu.add(key);
      uniques.push(item);
    }
  }

  let aVerifier = Array.isArray(analyse.aVerifier)
    ? analyse.aVerifier
        .map(item => clean(item?.texte || "", 1500))
        .filter(Boolean)
    : [];

  /*
    Supprimer toute phrase qui parle de l'intention
    comme si elle devait être vérifiée.
  */
  aVerifier = aVerifier.filter(
    item =>
      !/l'intention de l'utilisateur|intention de l'utilisateur/i
        .test(item)
  );

  /*
    Orientation déterministe pour la création d'entreprise.
  */
  let orientation = clean(
    analyse.orientation || "",
    3000
  );

  if (context.creation || context.nettoyage) {
    orientation =
      "Le choix du statut juridique doit d'abord être déterminé. " +
      "Pour une entreprise de nettoyage, les démarches et les inscriptions " +
      "peuvent dépendre de la forme juridique et de la nature exacte de l'activité. " +
      "Le Guichet des formalités des entreprises est ensuite utilisé pour les formalités d'immatriculation.";
  }

  /*
    Action suivante déterministe.
  */
  let prochaineAction =
    clean(analyse.prochaineAction || "", 1200);

  if (context.creation || context.nettoyage) {
    prochaineAction =
      "Déterminer la forme juridique envisagée et préciser exactement l'activité de nettoyage.";
  }

  return {
    titre:
      clean(analyse.titre || "Analyse GouRare AI", 300),

    compris:
      clean(analyse.compris || "", 1800),

    orientation,

    confirmees: uniques,

    aVerifier,

    recommandations:
      arrayText(analyse.recommandations),

    actions:
      arrayText(analyse.actions),

    documents:
      Array.isArray(analyse.documents)
        ? analyse.documents
            .map(item => ({
              texte: clean(
                item?.texte || "",
                1200
              ),
              statut: clean(
                item?.statut || "a_verifier",
                30
              )
            }))
            .filter(item => item.texte)
        : [],

    risques:
      arrayText(analyse.risques),

    professionnel:
      clean(
        analyse.professionnel || "",
        1000
      ),

    prochaineAction,

    sources:
      sources.map(source => ({
        name: source.name,
        url: source.url
      }))
  };
}

async function askAI(
  env,
  question,
  type,
  sources
) {

  const proofContext =
    buildProofContext(sources);

  const prompt = `
QUESTION :
${question}

TYPE :
${type}

${proofContext}

RÈGLE :

Si l'utilisateur demande simplement comment créer
une entreprise de nettoyage, ne suppose pas qu'il a choisi
l'entreprise individuelle.

Utilise les preuves seulement lorsqu'elles correspondent
exactement au contexte.

Pour les informations confirmées :
retourne source_id et preuve_id.

Pour le reste :
mets l'information dans aVerifier.

Retourne uniquement le JSON.
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
          json_schema: SCHEMA
        },

        max_tokens: 2200,
        temperature: 0.05
      }
    );

  const data =
    extractJSON(result);

  if (!data) {
    throw new Error(
      "Réponse IA invalide."
    );
  }

  return sanitizeAnalyse(
    data,
    sources,
    question
  );
}

function escapeHTML(value) {
  return clean(value, 10000)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderFacts(items, emptyText) {

  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return `
      <div class="empty">
        ${escapeHTML(emptyText)}
      </div>
    `;
  }

  return items.map(item => `
    <div class="fact">

      <div class="fact-text">
        ${escapeHTML(item.texte || "")}
      </div>

      <div class="status">
        ${escapeHTML(item.statut || "confirmé")}
      </div>

      <div class="source">
        Source :
        ${escapeHTML(item.source || "")}
      </div>

      <div class="preuve">
        <strong>Preuve officielle :</strong><br>
        ${escapeHTML(item.preuve || "")}
      </div>

    </div>
  `).join("");
}

function renderList(items, emptyText) {

  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return `
      <div class="empty">
        ${escapeHTML(emptyText)}
      </div>
    `;
  }

  return `
    <ul>
      ${items.map(item => `
        <li>${escapeHTML(item)}</li>
      `).join("")}
    </ul>
  `;
}

function renderDocuments(items) {

  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return `
      <div class="empty">
        Aucun document identifié à ce stade.
      </div>
    `;
  }

  return `
    <ul>
      ${items.map(item => `
        <li>
          <strong>
            ${escapeHTML(item.statut)}
          </strong>
          —
          ${escapeHTML(item.texte)}
        </li>
      `).join("")}
    </ul>
  `;
}

function renderSources(items) {

  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return `
      <div class="empty">
        Aucune source disponible.
      </div>
    `;
  }

  return `
    <ul>
      ${items.map(item => `
        <li>
          <strong>
            ${escapeHTML(item.name)}
          </strong>
          <br>

          <a
            href="${escapeHTML(item.url)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Consulter la source officielle
          </a>
        </li>
      `).join("")}
    </ul>
  `;
}

function renderPage(analyse) {

  return `
<!DOCTYPE html>

<html lang="fr">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
/>

<title>
${escapeHTML(analyse.titre)}
</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family:
    Arial,
    Helvetica,
    sans-serif;

  background: #f4f6f9;
  color: #172033;
}

header {
  background: #101827;
  color: white;
  text-align: center;
  padding: 25px 15px;
}

.logo {
  font-size: 30px;
  font-weight: 800;
}

.subtitle {
  opacity: .8;
  margin-top: 5px;
}

.container {
  max-width: 980px;
  margin: auto;
  padding: 20px;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 18px;

  box-shadow:
    0 5px 20px
    rgba(0,0,0,.06);
}

h1 {
  font-size: 26px;
}

h2 {
  font-size: 19px;
  margin-top: 20px;
}

.fact {
  background: #f7f9fc;
  border-radius: 12px;
  padding: 15px;
  margin: 12px 0;
}

.fact-text {
  font-weight: 600;
}

.status {
  display: inline-block;
  margin-top: 8px;
  padding: 4px 9px;
  background: #e7f1e9;
  border-radius: 999px;
  font-size: 12px;
}

.source {
  margin-top: 10px;
  font-size: 13px;
  font-weight: 600;
}

.preuve {
  margin-top: 10px;
  padding: 12px;
  background: #eef4ff;
  border-left: 4px solid #4568dc;
  font-size: 14px;
  line-height: 1.5;
}

.empty {
  color: #697386;
  font-style: italic;
}

li {
  margin: 9px 0;
}

a {
  color: #2457d6;
}

.support {
  position: fixed;
  right: 14px;
  bottom: 14px;

  background: white;
  padding: 10px 14px;

  border-radius: 999px;

  box-shadow:
    0 5px 20px
    rgba(0,0,0,.12);

  font-size: 13px;
}

footer {
  text-align: center;
  padding: 30px;
  color: #697386;
}

@media(max-width:650px) {

  .container {
    padding: 12px;
  }

  .card {
    padding: 15px;
  }

  h1 {
    font-size: 22px;
  }

}

</style>

</head>

<body>

<header>

<div class="logo">
GouRare AI
</div>

<div class="subtitle">
Intelligence, orientation et solutions
</div>

</header>

<div class="container">

<div class="card">

<h1>
${escapeHTML(analyse.titre)}
</h1>

<h2>
🧭 Ce que j'ai compris
</h2>

<p>
${escapeHTML(
  analyse.compris ||
  "Situation à préciser."
)}
</p>

<h2>
💡 Orientation
</h2>

<p>
${escapeHTML(
  analyse.orientation ||
  "Orientation à préciser."
)}
</p>

</div>

<div class="card">

<h2>
✅ Informations confirmées
</h2>

${renderFacts(
  analyse.confirmees,
  "Aucune information confirmée avec une preuve officielle suffisante."
)}

</div>

<div class="card">

<h2>
🔎 À vérifier
</h2>

${renderList(
  analyse.aVerifier,
  "Aucun point particulier à vérifier."
)}

</div>

<div class="card">

<h2>
💭 Recommandations
</h2>

${renderList(
  analyse.recommandations,
  "Aucune recommandation particulière."
)}

</div>

<div class="card">

<h2>
📋 Actions concrètes
</h2>

${renderList(
  analyse.actions,
  "Aucune action précise identifiée."
)}

</div>

<div class="card">

<h2>
📄 Documents
</h2>

${renderDocuments(
  analyse.documents
)}

</div>

<div class="card">

<h2>
⚠️ Points de vigilance
</h2>

${renderList(
  analyse.risques,
  "Aucun point de vigilance particulier."
)}

</div>

<div class="card">

<h2>
👤 Professionnel
</h2>

<p>
${escapeHTML(
  analyse.professionnel ||
  "Aucun professionnel n'est recommandé à ce stade."
)}
</p>

</div>

<div class="card">

<h2>
🚀 Prochaine action
</h2>

<p>
<strong>
${escapeHTML(
  analyse.prochaineAction ||
  "Préciser votre situation."
)}
</strong>
</p>

</div>

<div class="card">

<h2>
📚 Sources consultées
</h2>

${renderSources(
  analyse.sources
)}

</div>

</div>

<div class="support">
🎗️ Avec vous contre le cancer
</div>

<footer>

🎗️ Notre soutien aux personnes touchées par le cancer.

<br><br>

GouRare AI — Version ${VERSION}

</footer>

</body>

</html>
`;
}

function corsHeaders() {

  return {

    "Access-Control-Allow-Origin": "*",

    "Access-Control-Allow-Methods":
      "GET, POST, OPTIONS",

    "Access-Control-Allow-Headers":
      "Content-Type",

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
}

function jsonResponse(data, status = 200) {

  return new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        ...corsHeaders(),

        "Content-Type":
          "application/json; charset=utf-8"
      }
    }
  );
}

export default {

  async fetch(request, env) {

    if (
      request.method === "OPTIONS"
    ) {

      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });

    }

    const url =
      new URL(request.url);

    if (
      url.pathname === "/health"
    ) {

      return jsonResponse({

        success: true,

        service:
          "GouRare AI",

        status:
          "OK",

        version:
          VERSION

      });

    }

    if (
      url.pathname === "/api/analyze"
    ) {

      if (
        request.method !== "POST"
      ) {

        return jsonResponse(
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
        !contentType.includes(
          "application/json"
        )
      ) {

        return jsonResponse(
          {
            success: false,
            error:
              "Le contenu doit être au format JSON."
          },
          415
        );

      }

      try {

        const body =
          await request.json();

        const question =
          clean(
            body.question,
            5000
          );

        const type =
          clean(
            body.type || "general",
            50
          );

        if (!question) {

          return jsonResponse(
            {
              success: false,
              error:
                "Question vide."
            },
            400
          );

        }

        const sources =
          selectSources(
            question
          );

        const analyse =
          await askAI(
            env,
            question,
            type,
            sources
          );

        return jsonResponse({

          success: true,

          version:
            VERSION,

          analyse,

          html:
            renderPage(analyse)

        });

      } catch (error) {

        return jsonResponse(
          {
            success: false,
            error:
              "Impossible de terminer l'analyse.",
            version:
              VERSION
          },
          500
        );

      }
    }

    if (
      url.pathname === "/"
    ) {

      return new Response(
`
<!DOCTYPE html>

<html lang="fr">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
/>

<title>
GouRare AI
</title>

<style>

body {
  margin: 0;
  padding: 25px;

  font-family:
    Arial,
    sans-serif;

  background:
    #f4f6f9;

  color:
    #172033;
}

.box {

  max-width:
    750px;

  margin:
    auto;

  background:
    white;

  padding:
    25px;

  border-radius:
    18px;

  box-shadow:
    0 5px 25px
    rgba(0,0,0,.08);

}

textarea {

  width:
    100%;

  min-height:
    150px;

  padding:
    14px;

  border:
    1px solid #ccd3df;

  border-radius:
    10px;

  font-size:
    16px;

  resize:
    vertical;

}

button {

  margin-top:
    12px;

  padding:
    13px 22px;

  border:
    0;

  border-radius:
    10px;

  background:
    #101827;

  color:
    white;

  font-size:
    16px;

}

#result {

  margin-top:
    20px;

}

</style>

</head>

<body>

<div class="box">

<h1>
GouRare AI
</h1>

<p>
Intelligence, orientation et solutions
</p>

<textarea
id="question"
placeholder="Exemple : Je veux créer une entreprise de nettoyage en France, que dois-je faire ?"
></textarea>

<br>

<button
onclick="analyser()"
>
Analyser
</button>

<div id="result"></div>

</div>

<script>

async function analyser() {

  const question =
    document
      .getElementById("question")
      .value
      .trim();

  const result =
    document
      .getElementById("result");

  if (!question) {

    result.innerHTML =
      "<p>Veuillez saisir une question.</p>";

    return;
  }

  result.innerHTML =
    "<p>⏳ Analyse en cours...</p>";

  try {

    const response =
      await fetch(
        "/api/analyze",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              type:
                "general",

              question:
                question
            })
        }
      );

    const data =
      await response.json();

    if (!data.success) {
      throw new Error(
        data.error ||
        "Erreur"
      );
    }

    document.open();

    document.write(
      data.html
    );

    document.close();

  } catch (error) {

    result.innerHTML =
      "<p>❌ Une erreur est survenue. Veuillez réessayer.</p>";

  }

}

</script>

</body>

</html>
`,
        {
          headers: {
            ...corsHeaders(),

            "Content-Type":
              "text/html; charset=utf-8"
          }
        }
      );

    }

    return jsonResponse(
      {
        success: false,
        error:
          "Route introuvable."
      },
      404
    );

  }

};
