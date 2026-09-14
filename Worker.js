const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const VERSION = "7.2";

const SOURCES = {
  creation_ei: {
    id: "creation_ei",
    name: "Création d'une entreprise individuelle",
    url: "https://entreprendre.service-public.fr/vosdroits/F36763",
    keywords: [
      "création",
      "créer",
      "entreprise",
      "immatriculation",
      "formalités",
      "activité",
      "entreprise individuelle",
      "micro-entreprise",
      "nettoyage"
    ]
  },

  statut: {
    id: "statut",
    name: "Trouver le statut juridique adapté à son activité",
    url: "https://entreprendre.service-public.fr/vosdroits/R18323",
    keywords: [
      "statut",
      "juridique",
      "forme juridique",
      "entreprise",
      "société",
      "micro-entreprise",
      "activité",
      "créer",
      "création"
    ]
  },

  service_public: {
    id: "service_public",
    name: "Service-Public.fr",
    url: "https://www.service-public.fr/",
    keywords: [
      "démarche",
      "administration",
      "droit",
      "obligation",
      "aide",
      "service public"
    ]
  },

  urssaf: {
    id: "urssaf",
    name: "URSSAF",
    url: "https://www.urssaf.fr/",
    keywords: [
      "urssaf",
      "cotisation",
      "cotisations",
      "social",
      "charges",
      "travailleur indépendant",
      "micro-entrepreneur"
    ]
  },

  impots: {
    id: "impots",
    name: "Impots.gouv.fr",
    url: "https://www.impots.gouv.fr/",
    keywords: [
      "impôt",
      "impots",
      "fiscal",
      "fiscale",
      "taxe",
      "tva",
      "cfe",
      "revenus"
    ]
  }
};

function clean(value, maxLength = 5000) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLength);
}

function arrayText(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => {
      if (typeof item === "string") return clean(item, 1500);

      if (item && typeof item === "object") {
        return clean(
          item.texte ||
          item.text ||
          item.description ||
          item.nom ||
          item.name ||
          "",
          1500
        );
      }

      return "";
    })
    .filter(Boolean);
}

function extractJSON(value) {
  if (value === null || value === undefined) return null;

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

  if (typeof value !== "string") return null;

  let text = value.trim();

  text = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(text);
  } catch (_) {}

  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");

  if (first !== -1 && last > first) {
    try {
      return JSON.parse(text.slice(first, last + 1));
    } catch (_) {}
  }

  return null;
}

function normalizeFact(item) {
  if (!item || typeof item !== "object") return null;

  const texte = clean(
    item.texte ||
    item.text ||
    item.description ||
    "",
    1800
  );

  if (!texte) return null;

  return {
    texte,
    source_id: clean(item.source_id, 100),
    preuve_id: clean(item.preuve_id, 100),
    statut: clean(item.statut, 30)
  };
}

function normalizeAnalyse(data) {
  const analyse = data && typeof data === "object" ? data : {};

  return {
    titre: clean(analyse.titre || "Analyse GouRare AI", 300),

    compris: clean(
      analyse.compris ||
      analyse.situation ||
      "",
      1800
    ),

    orientation: clean(
      analyse.orientation ||
      "",
      3000
    ),

    confirmees: Array.isArray(analyse.confirmees)
      ? analyse.confirmees.map(normalizeFact).filter(Boolean)
      : [],

    aVerifier: Array.isArray(analyse.aVerifier)
      ? analyse.aVerifier.map(normalizeFact).filter(Boolean)
      : [],

    recommandations: arrayText(analyse.recommandations),

    actions: arrayText(analyse.actions),

    documents: Array.isArray(analyse.documents)
      ? analyse.documents
          .map(item => {
            if (typeof item === "string") {
              return {
                texte: clean(item, 1500),
                statut: "a_verifier"
              };
            }

            return {
              texte: clean(
                item?.texte ||
                item?.text ||
                item?.nom ||
                item?.description ||
                "",
                1500
              ),
              statut: clean(
                item?.statut || "a_verifier",
                30
              )
            };
          })
          .filter(item => item.texte)
      : [],

    risques: arrayText(analyse.risques),

    professionnel: clean(
      analyse.professionnel || "",
      1000
    ),

    prochaineAction: clean(
      analyse.prochaineAction ||
      analyse.prochaine_action ||
      "",
      1500
    ),

    sources: []
  };
}

function systemPrompt() {
  return `
Tu es GouRare AI.

MISSION :
Aider les citoyens, salariés, indépendants, entrepreneurs et petites entreprises à comprendre leur situation, identifier les démarches pertinentes, trouver les bonnes informations et déterminer la prochaine action.

IMPORTANT :
Tu n'es pas avocat, expert-comptable, médecin, administration ou autre professionnel réglementé.

RÈGLE ABSOLUE DE FIABILITÉ :

1. Tu ne dois jamais inventer une obligation.
2. Tu ne dois jamais inventer un montant, taux, seuil, délai, pénalité, numéro d'article, prix, revenu ou économie.
3. Tu ne dois jamais présenter une règle conditionnelle comme une règle universelle.
4. Tu ne dois jamais dire qu'une personne doit obligatoirement s'inscrire au RCS, obtenir une TVA intracommunautaire ou fournir un document si les sources fournies ne le démontrent pas clairement pour sa situation.
5. Une information n'est "confirmée" que si un extrait fourni dans les PREUVES la soutient clairement.
6. Tu dois utiliser uniquement les identifiants source_id et preuve_id fournis.
7. Tu ne dois jamais inventer le contenu d'une preuve.
8. Tu ne dois jamais créer un preuve_id.
9. Si aucune preuve ne permet de confirmer une information, place-la dans "aVerifier".
10. L'intention de l'utilisateur n'est jamais une information à vérifier.
11. Une recommandation personnelle ne doit jamais être présentée comme une obligation légale.
12. Si le statut juridique, l'activité exacte ou une autre information déterminante manque, indique que la réponse dépend de cet élément.
13. Pour les documents, distingue :
   - obligatoire : clairement démontré
   - conditionnel : dépend de la situation
   - a_verifier : non suffisamment démontré
14. Ne recommande un professionnel que lorsqu'une raison identifiable le justifie.
15. Pour les sujets français, privilégie les sources officielles fournies.

STYLE :
Réponse claire, pratique, compréhensible.
Évite les formulations administratives inutiles.
Explique ce qui est certain et ce qui doit encore être vérifié.

La réponse doit toujours chercher à donner :
- ce que tu as compris
- l'orientation
- les informations officiellement confirmées
- ce qui reste à vérifier
- les recommandations
- les actions concrètes
- les documents pertinents
- les risques éventuels
- la prochaine action

NE PAS CONFONDRE :
"recommandé" ≠ "obligatoire"
"possible" ≠ "obligatoire"
"à vérifier" ≠ "confirmé"

À la fin, indique une PROCHAINE ACTION réaliste.
`;
}

function selectSources(question, type) {
  const q = question.toLowerCase();

  const scores = Object.values(SOURCES).map(source => {
    let score = 0;

    for (const keyword of source.keywords) {
      if (q.includes(keyword.toLowerCase())) {
        score += 2;
      }
    }

    if (
      (type === "general" || type === "question") &&
      (
        q.includes("créer une entreprise") ||
        q.includes("creation d'entreprise") ||
        q.includes("création d'entreprise") ||
        q.includes("créer mon entreprise") ||
        q.includes("entreprise de nettoyage") ||
        q.includes("entreprise de service")
      )
    ) {
      if (source.id === "creation_ei") score += 10;
      if (source.id === "statut") score += 8;
    }

    if (
      q.includes("nettoyage") &&
      source.id === "creation_ei"
    ) {
      score += 5;
    }

    if (
      q.includes("tva") ||
      q.includes("impôt") ||
      q.includes("fiscal") ||
      q.includes("taxe")
    ) {
      if (source.id === "impots") score += 8;
    }

    if (
      q.includes("urssaf") ||
      q.includes("cotisation") ||
      q.includes("social")
    ) {
      if (source.id === "urssaf") score += 8;
    }

    return {
      source,
      score
    };
  });

  return scores
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(item => item.source);
}

function htmlToText(html) {
  return clean(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, " "),
    30000
  );
}

async function fetchSource(source) {
  try {
    const response = await fetch(source.url, {
      headers: {
        "User-Agent": "GouRareAI/7.2"
      }
    });

    if (!response.ok) {
      return {
        ...source,
        available: false,
        text: ""
      };
    }

    const html = await response.text();

    return {
      ...source,
      available: true,
      text: htmlToText(html)
    };
  } catch (_) {
    return {
      ...source,
      available: false,
      text: ""
    };
  }
}

function makeProofs(source) {
  if (!source.available || !source.text) return [];

  const text = source.text;

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length >= 50 && s.length <= 700);

  const selected = [];

  for (const sentence of sentences) {
    if (selected.length >= 10) break;

    if (
      /entreprise|immatriculation|formalités|activité|statut|document|guichet|déclarant|registre|micro/i
        .test(sentence)
    ) {
      selected.push(sentence);
    }
  }

  return selected.map((texte, index) => ({
    id: `P${index + 1}`,
    texte
  }));
}

async function buildSourceContext(sources) {
  const loaded = [];

  for (const source of sources) {
    const result = await fetchSource(source);

    if (!result.available) continue;

    const preuves = makeProofs(result);

    loaded.push({
      id: result.id,
      name: result.name,
      url: result.url,
      preuves
    });
  }

  return loaded;
}

function buildPrompt(question, type, sourceContext) {
  const sourceText = sourceContext
    .map(source => {
      const proofs = source.preuves
        .map(proof => `[${proof.id}] ${proof.texte}`)
        .join("\n");

      return `
SOURCE_ID: ${source.id}
SOURCE: ${source.name}
URL: ${source.url}

PREUVES :
${proofs || "Aucune preuve exploitable."}
`;
    })
    .join("\n-----------------------------\n");

  return `
QUESTION UTILISATEUR :
${question}

TYPE :
${type}

SOURCES ET PREUVES DISPONIBLES :
${sourceText}

CONSIGNE CENTRALE :

Pour chaque information présentée comme confirmée, tu dois fournir :
- source_id
- preuve_id

Tu ne dois jamais écrire le texte de la preuve toi-même.

Le Worker remplacera automatiquement preuve_id par le véritable extrait provenant de la source.

Si tu n'as pas une preuve suffisante :
- ne confirme pas l'information
- place-la dans aVerifier

Pour les documents :
- "obligatoire" seulement si une preuve claire le démontre
- "conditionnel" si la source indique que cela dépend d'une situation
- sinon "a_verifier"

Pour les recommandations :
Ne les présente jamais comme des obligations légales.

Si la question concerne la création d'une entreprise mais que le statut juridique n'est pas précisé :
explique que certaines démarches dépendent du statut choisi.

Ne mets pas l'intention de l'utilisateur dans aVerifier.

Retourne uniquement le JSON demandé.
`;
}

const JSON_SCHEMA = {
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
          source_id: { type: "string" },
          preuve_id: { type: "string" },
          statut: { type: "string" }
        },
        required: [
          "texte",
          "source_id",
          "preuve_id",
          "statut"
        ]
      }
    },

    aVerifier: {
      type: "array",
      items: {
        type: "object",
        properties: {
          texte: { type: "string" },
          source_id: { type: "string" },
          preuve_id: { type: "string" },
          statut: { type: "string" }
        },
        required: [
          "texte",
          "source_id",
          "preuve_id",
          "statut"
        ]
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
      items: {
        type: "object",
        properties: {
          texte: { type: "string" },
          statut: { type: "string" }
        },
        required: [
          "texte",
          "statut"
        ]
      }
    },

    risques: {
      type: "array",
      items: { type: "string" }
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

async function askAI(env, question, type, sourceContext) {
  const prompt = buildPrompt(
    question,
    type,
    sourceContext
  );

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
        json_schema: JSON_SCHEMA
      },

      max_tokens: 2200,
      temperature: 0.1
    }
  );

  const data = extractJSON(result);

  if (!data) {
    throw new Error("Réponse IA invalide.");
  }

  return normalizeAnalyse(data);
}

function getProof(sourceContext, sourceId, proofId) {
  const source = sourceContext.find(
    item => item.id === sourceId
  );

  if (!source) return null;

  const proof = source.preuves.find(
    item => item.id === proofId
  );

  if (!proof) return null;

  return {
    source: source.name,
    url: source.url,
    preuve: proof.texte
  };
}

function verifyFacts(analyse, sourceContext) {
  const confirmees = [];
  const aVerifier = [...analyse.aVerifier];

  for (const fact of analyse.confirmees) {
    const proof = getProof(
      sourceContext,
      fact.source_id,
      fact.preuve_id
    );

    if (!proof) {
      aVerifier.push({
        texte: fact.texte,
        source_id: "",
        preuve_id: "",
        statut: "a_verifier"
      });

      continue;
    }

    confirmees.push({
      texte: fact.texte,
      source_id: fact.source_id,
      preuve_id: fact.preuve_id,
      statut: "confirme",
      source: proof.source,
      url: proof.url,
      preuve: proof.preuve
    });
  }

  const verified = [];

  for (const fact of aVerifier) {
    const proof = getProof(
      sourceContext,
      fact.source_id,
      fact.preuve_id
    );

    if (proof) {
      verified.push({
        texte: fact.texte,
        source_id: fact.source_id,
        preuve_id: fact.preuve_id,
        statut: "a_verifier",
        source: proof.source,
        url: proof.url,
        preuve: proof.preuve
      });
    } else {
      verified.push({
        texte: fact.texte,
        source_id: "",
        preuve_id: "",
        statut: "a_verifier"
      });
    }
  }

  analyse.confirmees = confirmees;
  analyse.aVerifier = verified;

  analyse.sources = sourceContext.map(source => ({
    id: source.id,
    name: source.name,
    url: source.url
  }));

  return analyse;
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
  if (!Array.isArray(items) || items.length === 0) {
    return `<div class="empty">${escapeHTML(emptyText)}</div>`;
  }

  return items.map(item => {
    const status = item.statut
      ? `<span class="status">${escapeHTML(item.statut)}</span>`
      : "";

    const source = item.source
      ? `<div class="proof-source">Source : ${escapeHTML(item.source)}</div>`
      : "";

    const preuve = item.preuve
      ? `<div class="proof">Preuve : ${escapeHTML(item.preuve)}</div>`
      : "";

    return `
      <div class="fact">
        <div>${escapeHTML(item.texte || "")}</div>
        ${status}
        ${source}
        ${preuve}
      </div>
    `;
  }).join("");
}

function renderList(items, emptyText) {
  if (!Array.isArray(items) || items.length === 0) {
    return `<div class="empty">${escapeHTML(emptyText)}</div>`;
  }

  return `
    <ul>
      ${items
        .map(item => `<li>${escapeHTML(item)}</li>`)
        .join("")}
    </ul>
  `;
}

function renderDocuments(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return `<div class="empty">Aucun document identifié à ce stade.</div>`;
  }

  return `
    <ul>
      ${items.map(item => `
        <li>
          <strong>${escapeHTML(item.statut || "a_verifier")}</strong>
          — ${escapeHTML(item.texte || "")}
        </li>
      `).join("")}
    </ul>
  `;
}

function renderSources(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return `<div class="empty">Aucune source disponible.</div>`;
  }

  return `
    <ul>
      ${items.map(item => `
        <li>
          ${escapeHTML(item.name || "")}
          <br>
          <a
            href="${escapeHTML(item.url || "#")}"
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
  const data = normalizeAnalyse(analyse);

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">

<title>${escapeHTML(data.titre)}</title>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #f5f7fa;
  color: #172033;
}

header {
  padding: 22px;
  background: #101827;
  color: white;
  text-align: center;
}

.logo {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: .5px;
}

.subtitle {
  margin-top: 6px;
  opacity: .8;
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
  box-shadow: 0 5px 22px rgba(0,0,0,.06);
}

h1, h2 {
  margin-top: 0;
}

h1 {
  font-size: 26px;
}

h2 {
  font-size: 19px;
}

.fact {
  padding: 14px;
  margin: 10px 0;
  background: #f7f9fc;
  border-radius: 10px;
}

.proof {
  margin-top: 10px;
  padding: 10px;
  background: #eef4ff;
  border-left: 4px solid #4568dc;
  font-size: 14px;
}

.proof-source {
  margin-top: 8px;
  font-size: 13px;
  font-weight: bold;
}

.status {
  display: inline-block;
  margin-top: 8px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #e9eef7;
  font-size: 12px;
}

.empty {
  color: #667085;
  font-style: italic;
}

ul {
  padding-left: 22px;
}

li {
  margin: 8px 0;
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
  box-shadow: 0 5px 20px rgba(0,0,0,.12);
  font-size: 13px;
  z-index: 20;
}

footer {
  text-align: center;
  padding: 30px;
  color: #667085;
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
  <div class="logo">GouRare AI</div>
  <div class="subtitle">
    Intelligence, orientation et solutions
  </div>
</header>

<div class="container">

  <div class="card">
    <h1>${escapeHTML(data.titre)}</h1>

    <h2>🧭 Ce que j'ai compris</h2>
    <p>
      ${escapeHTML(
        data.compris ||
        "La situation doit être précisée."
      )}
    </p>

    <h2>💡 Orientation</h2>
    <p>
      ${escapeHTML(
        data.orientation ||
        "Une orientation plus précise nécessite des informations complémentaires."
      )}
    </p>
  </div>

  <div class="card">
    <h2>✅ Informations confirmées</h2>

    ${renderFacts(
      data.confirmees,
      "Aucune information ne peut encore être confirmée avec une preuve suffisante."
    )}
  </div>

  <div class="card">
    <h2>🔎 À vérifier</h2>

    ${renderFacts(
      data.aVerifier,
      "Aucun point supplémentaire à vérifier n'a été identifié."
    )}
  </div>

  <div class="card">
    <h2>💭 Recommandations</h2>

    ${renderList(
      data.recommandations,
      "Aucune recommandation particulière."
    )}
  </div>

  <div class="card">
    <h2>📋 Actions concrètes</h2>

    ${renderList(
      data.actions,
      "Aucune action précise n'a encore été déterminée."
    )}
  </div>

  <div class="card">
    <h2>📄 Documents</h2>

    ${renderDocuments(data.documents)}
  </div>

  <div class="card">
    <h2>⚠️ Points de vigilance</h2>

    ${renderList(
      data.risques,
      "Aucun risque particulier identifié à ce stade."
    )}
  </div>

  <div class="card">
    <h2>👤 Professionnel</h2>

    <p>
      ${escapeHTML(
        data.professionnel ||
        "Aucun professionnel n'est recommandé à ce stade."
      )}
    </p>
  </div>

  <div class="card">
    <h2>🚀 Prochaine action</h2>

    <p>
      <strong>
        ${escapeHTML(
          data.prochaineAction ||
          "Préciser votre activité et votre situation."
        )}
      </strong>
    </p>
  </div>

  <div class="card">
    <h2>📚 Sources consultées</h2>

    ${renderSources(data.sources)}
  </div>

</div>

<div class="support">
  🎗️ Avec vous contre le cancer
</div>

<footer>
  🎗️ Notre soutien aux personnes touchées par le cancer.<br>
  GouRare AI — Version ${VERSION}
</footer>

</body>
</html>
`;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cache-Control": "no-store"
  };
}

function jsonResponse(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders(),
        "Content-Type": "application/json; charset=utf-8"
      }
    }
  );
}

function checkRequest(request) {
  if (request.method !== "POST") {
    return {
      ok: false,
      response: jsonResponse(
        {
          success: false,
          error: "Méthode non autorisée."
        },
        405
      )
    };
  }

  const contentType =
    request.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return {
      ok: false,
      response: jsonResponse(
        {
          success: false,
          error: "Le contenu doit être au format JSON."
        },
        415
      )
    };
  }

  return { ok: true };
}

export default {
  async fetch(request, env) {

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return jsonResponse({
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
      return new Response(`
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>GouRare AI</title>
<style>
body{
font-family:Arial,sans-serif;
background:#f5f7fa;
padding:30px;
color:#172033;
}
.box{
max-width:700px;
margin:auto;
background:white;
padding:30px;
border-radius:18px;
box-shadow:0 5px 25px rgba(0,0,0,.08);
}
textarea{
width:100%;
min-height:140px;
padding:14px;
border:1px solid #ccd3df;
border-radius:10px;
font-size:16px;
}
button{
margin-top:12px;
padding:13px 20px;
border:0;
border-radius:10px;
background:#172033;
color:white;
font-size:16px;
cursor:pointer;
}
#result{
margin-top:20px;
}
</style>
</head>

<body>

<div class="box">

<h1>GouRare AI</h1>

<p>
Posez votre question. GouRare AI recherche les sources officielles
pertinentes et distingue les informations confirmées de celles à vérifier.
</p>

<textarea
id="question"
placeholder="Exemple : Je veux créer une entreprise de nettoyage en France, que dois-je faire ?"
></textarea>

<br>

<button onclick="analyser()">
Analyser
</button>

<div id="result"></div>

</div>

<script>
async function analyser(){

  const question =
    document.getElementById("question").value.trim();

  const result =
    document.getElementById("result");

  if(!question){
    result.innerHTML =
      "<p>Veuillez saisir une question.</p>";
    return;
  }

  result.innerHTML =
    "<p>⏳ Analyse en cours...</p>";

  try{

    const response =
      await fetch("/api/analyze", {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          type:"general",
          question:question
        })
      });

    const data =
      await response.json();

    if(!data.success){
      throw new Error(
        data.error || "Erreur."
      );
    }

    document.open();
    document.write(data.html);
    document.close();

  }catch(error){

    result.innerHTML =
      "<p>❌ Une erreur est survenue. Veuillez réessayer.</p>";

    console.error(error);
  }
}
</script>

</body>
</html>
      `, {
        headers: {
          ...corsHeaders(),
          "Content-Type":
            "text/html; charset=utf-8"
        }
      });
    }

    if (url.pathname === "/api/analyze") {

      const check = checkRequest(request);

      if (!check.ok) {
        return check.response;
      }

      try {

        const body = await request.json();

        const question = clean(
          body.question,
          5000
        );

        const type = clean(
          body.type || "general",
          50
        );

        if (!question) {
          return jsonResponse(
            {
              success: false,
              error: "Question vide."
            },
            400
          );
        }

        const selectedSources =
          selectSources(
            question,
            type
          );

        const sourceContext =
          await buildSourceContext(
            selectedSources
          );

        const analyse =
          await askAI(
            env,
            question,
            type,
            sourceContext
          );

        const verified =
          verifyFacts(
            analyse,
            sourceContext
          );

        return jsonResponse({
          success: true,
          version: VERSION,
          analyse: verified,
          html: renderPage(verified)
        });

      } catch (error) {

        return jsonResponse(
          {
            success: false,
            error: "Impossible de terminer l'analyse.",
            version: VERSION
          },
          500
        );
      }
    }

    return jsonResponse(
      {
        success: false,
        error: "Route introuvable."
      },
      404
    );
  }
};
