const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const VERSION = "8.0";

const SOURCES = {
  statut: {
    id: "statut",
    title: "Trouver le statut juridique adapté à son activité",
    url: "https://entreprendre.service-public.fr/vosdroits/R18323",
    preuves: [
      {
        id: "STATUT-P1",
        texte:
          "Le questionnaire permet de choisir le statut juridique le plus adapté au projet d'entreprise."
      },
      {
        id: "STATUT-P2",
        texte:
          "Le choix prend notamment en compte l'activité envisagée et le chiffre d'affaires estimé."
      },
      {
        id: "STATUT-P3",
        texte:
          "Le service permet de connaître les formes juridiques possibles."
      },
      {
        id: "STATUT-P4",
        texte:
          "Les formes juridiques peuvent être comparées selon les revenus, la couverture sociale et la gestion comptable et juridique."
      }
    ]
  },

  creation_ei: {
    id: "creation_ei",
    title:
      "Création d'une entreprise individuelle : formalités d'immatriculation",
    url: "https://entreprendre.service-public.fr/vosdroits/F36763",
    preuves: [
      {
        id: "EI-P1",
        texte:
          "Pour créer une entreprise individuelle, une des formalités est l'immatriculation."
      },
      {
        id: "EI-P2",
        texte:
          "La demande d'immatriculation d'une entreprise individuelle est réalisée sur le site du Guichet des formalités des entreprises."
      },
      {
        id: "EI-P3",
        texte:
          "Après l'immatriculation, l'entreprise individuelle est inscrite au Registre national des entreprises."
      },
      {
        id: "EI-P4",
        texte:
          "Le registre d'inscription dépend de la nature de l'activité exercée."
      },
      {
        id: "EI-P5",
        texte:
          "Une entreprise individuelle exerçant une activité commerciale est inscrite au RCS et au RNE."
      },
      {
        id: "EI-P6",
        texte:
          "Une entreprise individuelle exerçant une activité artisanale est inscrite au RNE, avec des règles dépendant notamment de l'effectif."
      },
      {
        id: "EI-P7",
        texte:
          "Une entreprise individuelle exerçant une activité libérale est inscrite au RNE."
      },
      {
        id: "EI-P8",
        texte:
          "Pour une entreprise individuelle, certains documents peuvent être demandés lors de l'immatriculation, notamment un justificatif de domiciliation, une déclaration sur l'honneur de non-condamnation avec attestation de filiation et une copie de pièce d'identité."
      },
      {
        id: "EI-P9",
        texte:
          "Pour une activité réglementée, une autorisation d'exercice, un diplôme ou un titre peut être demandé."
      }
    ]
  },

  guichet: {
    id: "guichet",
    title:
      "Formalités d'immatriculation des entreprises",
    url:
      "https://entreprendre.service-public.fr/vosdroits/F23571",
    preuves: [
      {
        id: "GUICHET-P1",
        texte:
          "Les formalités d'immatriculation s'effectuent sur le site du Guichet des formalités des entreprises, quelle que soit la forme juridique de l'entreprise."
      },
      {
        id: "GUICHET-P2",
        texte:
          "Les documents justificatifs à fournir sont différents selon le statut juridique de l'entreprise."
      }
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

function unique(array) {
  return [...new Set(array)];
}

function detectContext(question) {
  const q = question.toLowerCase();

  return {
    entreprise:
      q.includes("entreprise") ||
      q.includes("société") ||
      q.includes("societe") ||
      q.includes("créer") ||
      q.includes("creer") ||
      q.includes("création") ||
      q.includes("creation"),

    nettoyage:
      q.includes("nettoyage") ||
      q.includes("ménage") ||
      q.includes("menage") ||
      q.includes("entretien"),

    ei:
      q.includes("entreprise individuelle") ||
      q.includes("micro-entreprise") ||
      q.includes("micro entreprise") ||
      q.includes("microentreprise"),

    fiscal:
      q.includes("impôt") ||
      q.includes("impot") ||
      q.includes("fiscal") ||
      q.includes("tva") ||
      q.includes("urssaf"),

    emploi:
      q.includes("salarié") ||
      q.includes("salarie") ||
      q.includes("emploi") ||
      q.includes("travail") ||
      q.includes("embauche"),

    social:
      q.includes("aide") ||
      q.includes("social") ||
      q.includes("rsa") ||
      q.includes("prime") ||
      q.includes("handicap")
  };
}

function selectSources(question) {
  const contexte = detectContext(question);
  const result = [];

  if (contexte.entreprise || contexte.nettoyage) {
    result.push(SOURCES.statut);
    result.push(SOURCES.guichet);
  }

  if (contexte.ei) {
    result.push(SOURCES.creation_ei);
  }

  const map = new Map();

  for (const source of result) {
    map.set(source.id, source);
  }

  return [...map.values()];
}

/*
==========================================================
MOTEUR DE VÉRITÉ
==========================================================
Aucune information confirmée ne vient de l'IA.
*/

function buildConfirmedFacts(question) {
  const contexte = detectContext(question);
  const facts = [];

  if (contexte.entreprise || contexte.nettoyage) {
    facts.push({
      texte:
        "Le choix de la forme juridique peut être étudié en fonction de l'activité envisagée et d'autres critères comme le chiffre d'affaires estimé, les revenus, la couverture sociale et la gestion.",
      source_id: "statut",
      preuve_id: "STATUT-P2"
    });
  }

  if (contexte.entreprise || contexte.nettoyage) {
    facts.push({
      texte:
        "Les formalités d'immatriculation des entreprises s'effectuent sur le site du Guichet des formalités des entreprises.",
      source_id: "guichet",
      preuve_id: "GUICHET-P1"
    });
  }

  if (contexte.ei) {
    facts.push({
      texte:
        "Pour une entreprise individuelle, l'immatriculation est réalisée sur le site du Guichet des formalités des entreprises.",
      source_id: "creation_ei",
      preuve_id: "EI-P2"
    });

    facts.push({
      texte:
        "Après l'immatriculation, l'entreprise individuelle est inscrite au Registre national des entreprises (RNE).",
      source_id: "creation_ei",
      preuve_id: "EI-P3"
    });

    facts.push({
      texte:
        "Pour une entreprise individuelle, le registre d'inscription dépend de la nature de l'activité exercée.",
      source_id: "creation_ei",
      preuve_id: "EI-P4"
    });
  }

  return facts;
}

/*
==========================================================
DOCUMENTS
==========================================================
On ne met aucun document si le statut n'est pas connu.
*/

function buildDocuments(question) {
  const contexte = detectContext(question);

  if (!contexte.ei) {
    return [];
  }

  return [
    {
      statut: "à vérifier",
      texte:
        "Justificatif de domiciliation de l'entreprise.",
      source_id: "creation_ei",
      preuve_id: "EI-P8"
    },
    {
      statut: "à vérifier",
      texte:
        "Déclaration sur l'honneur de non-condamnation et attestation de filiation.",
      source_id: "creation_ei",
      preuve_id: "EI-P8"
    },
    {
      statut: "à vérifier",
      texte:
        "Copie de la pièce d'identité.",
      source_id: "creation_ei",
      preuve_id: "EI-P8"
    }
  ];
}

/*
==========================================================
ACTIONS DÉTERMINISTES
==========================================================
*/

function buildActions(question) {
  const contexte = detectContext(question);

  if (contexte.nettoyage && contexte.entreprise) {
    return [
      "Définir précisément les prestations de nettoyage proposées.",
      "Choisir ou comparer la forme juridique adaptée au projet.",
      "Vérifier les formalités correspondant à la forme juridique choisie sur le Guichet des formalités des entreprises."
    ];
  }

  if (contexte.ei) {
    return [
      "Préciser la nature exacte de l'activité.",
      "Vérifier les formalités d'immatriculation applicables.",
      "Préparer les justificatifs demandés pour la démarche concernée."
    ];
  }

  return [
    "Préciser votre situation.",
    "Identifier la démarche concernée.",
    "Vérifier la procédure auprès de la source officielle correspondante."
  ];
}

/*
==========================================================
RECOMMANDATIONS
==========================================================
*/

function buildRecommendations(question) {
  const contexte = detectContext(question);

  if (contexte.nettoyage && contexte.entreprise) {
    return [
      "Décrire précisément les prestations que vous souhaitez vendre.",
      "Comparer les formes juridiques avant de choisir celle qui correspond à votre projet.",
      "Vérifier les formalités après avoir déterminé la forme juridique."
    ];
  }

  if (contexte.ei) {
    return [
      "Préciser la nature exacte de l'activité.",
      "Vérifier les formalités correspondant à cette activité."
    ];
  }

  return [
    "Préciser les éléments importants de votre situation.",
    "Vérifier les informations spécifiques auprès de la source officielle concernée."
  ];
}

/*
==========================================================
PROCHAINE ACTION
==========================================================
*/

function buildNextAction(question) {
  const contexte = detectContext(question);

  if (contexte.nettoyage && contexte.entreprise) {
    return "Préciser la forme juridique envisagée et la nature exacte des prestations de nettoyage.";
  }

  if (contexte.ei) {
    return "Préciser la nature exacte de l'activité afin de vérifier les formalités applicables.";
  }

  return "Préciser votre situation et l'objectif recherché.";
}

/*
==========================================================
POINTS DE VIGILANCE
==========================================================
Aucun risque juridique inventé.
*/

function buildRisks() {
  return [];
}

/*
==========================================================
PROFESSIONNEL
==========================================================
Aucune recommandation automatique.
*/

function buildProfessional() {
  return [];
}

/*
==========================================================
IA
==========================================================
L'IA ne produit plus de recommandations juridiques.
Elle sert uniquement à formuler une orientation générale.
==========================================================
*/

async function askAI(env, question) {
  const contexte = detectContext(question);

  const prompt = `
Tu es l'assistant GouRare AI.

Question :
${question}

Contexte :
${JSON.stringify(contexte)}

Tu dois uniquement expliquer la demande de manière simple.

INTERDICTIONS ABSOLUES :

Ne donne aucune nouvelle obligation juridique.

Ne donne aucun :
- montant
- taux
- seuil
- délai
- sanction
- amende
- article de loi
- document obligatoire
- autorisation obligatoire
- inscription RCS obligatoire
- diplôme obligatoire

Ne recommande aucun avocat, expert-comptable ou autre professionnel.

Ne crée aucune étape administrative.

Les étapes et informations officielles sont déjà calculées par le moteur de vérité.

Réponds uniquement avec une courte orientation générale.

Format JSON obligatoire :

{
  "orientation": "texte"
}
`;

  try {
    const response = await env.IA.run(
      MODEL,
      {
        messages: [
          {
            role: "system",
            content: prompt
          },
          {
            role: "user",
            content: question
          }
        ],
        max_tokens: 500,
        temperature: 0.05
      }
    );

    if (typeof response === "string") {
      return response;
    }

    if (response && response.response) {
      return response.response;
    }

    if (
      response &&
      response.result &&
      response.result.response
    ) {
      return response.result.response;
    }

    return "";
  } catch {
    return "";
  }
}

function extractJSON(text) {
  if (!text) return null;

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

  if (first >= 0 && last > first) {
    try {
      return JSON.parse(
        value.slice(first, last + 1)
      );
    } catch {}
  }

  return null;
}

function buildOrientation(question, aiData) {
  const contexte = detectContext(question);

  if (
    contexte.nettoyage &&
    contexte.entreprise
  ) {
    return (
      "Pour créer votre activité de nettoyage, il faut d'abord préciser " +
      "la nature exacte des prestations et déterminer la forme juridique " +
      "adaptée au projet. Les formalités pourront ensuite être vérifiées " +
      "sur le Guichet des formalités des entreprises."
    );
  }

  if (contexte.ei) {
    return (
      "Vous avez indiqué une entreprise individuelle. " +
      "Il faut préciser la nature exacte de l'activité afin de vérifier " +
      "les formalités et inscriptions applicables."
    );
  }

  if (
    aiData &&
    typeof aiData.orientation === "string" &&
    aiData.orientation.trim()
  ) {
    return clean(aiData.orientation, 1200);
  }

  return (
    "Votre situation doit être précisée afin d'identifier " +
    "les informations et démarches adaptées."
  );
}

function buildSources(question) {
  return selectSources(question).map(source => ({
    id: source.id,
    titre: source.title,
    url: source.url
  }));
}

function buildFinalResponse(
  question,
  aiData
) {
  const contexte = detectContext(question);

  return {
    success: true,
    version: VERSION,

    compris:
      contexte.nettoyage &&
      contexte.entreprise
        ? "Vous souhaitez créer une entreprise de nettoyage en France."
        : "Votre demande a été analysée selon les informations fournies.",

    orientation:
      buildOrientation(question, aiData),

    confirmees:
      buildConfirmedFacts(question),

    a_verifier:
      contexte.nettoyage &&
      contexte.entreprise
        ? [
            "La forme juridique la plus adaptée à votre projet.",
            "La nature exacte de l'activité et des prestations de nettoyage.",
            "Les formalités spécifiques correspondant à la forme juridique et à l'activité choisies."
          ]
        : [
            "Les éléments spécifiques à votre situation."
          ],

    recommandations:
      buildRecommendations(question),

    actions:
      buildActions(question),

    documents:
      buildDocuments(question),

    risques:
      buildRisks(),

    professionnel:
      buildProfessional(),

    prochaine_action:
      buildNextAction(question),

    sources:
      buildSources(question),

    soutien:
      "🎗️ Avec vous contre le cancer"
  };
}

function escapeHTML(value) {
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
  background: #f4f6f8;
  color: #17202a;
}

header {
  background: #111827;
  color: white;
  text-align: center;
  padding: 28px 18px;
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
  width: 100%;
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
  min-height: 140px;
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
  line-height: 1.5;
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
  margin: 10px 0;
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
  padding: 28px 15px;
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

<textarea
id="question"
placeholder="Exemple : Je veux créer une entreprise de nettoyage en France, que dois-je faire ?"
></textarea>

<button
id="btn"
onclick="analyser()"
>
Analyser avec GouRare AI
</button>

</div>

<div id="result"></div>

</main>

<div class="badge">
🎗️ Avec vous contre le cancer
</div>

<footer>
🎗️ Notre soutien aux personnes touchées par le cancer.
<br><br>
GouRare AI — Version ${VERSION}
</footer>

<script>

async function analyser() {

  const question =
    document.getElementById("question").value.trim();

  const button =
    document.getElementById("btn");

  const result =
    document.getElementById("result");

  if (!question) {

    alert("Veuillez écrire votre question.");

    return;
  }

  button.disabled = true;

  button.textContent =
    "Analyse en cours...";

  result.innerHTML = "";

  try {

    const response =
      await fetch("/api/analyze", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          question: question
        })

      });

    const data =
      await response.json();

    if (!data.success) {
      throw new Error(
        data.error || "Erreur"
      );
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

    button.textContent =
      "Analyser avec GouRare AI";
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

  html +=
    '<div class="section">' +
    '<h2>✅ Informations confirmées</h2>';

  if (
    data.confirmees &&
    data.confirmees.length
  ) {

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

  html +=
    '<div class="section">' +
    '<h2>🔎 À vérifier</h2>';

  data.a_verifier.forEach(function(item) {

    html +=
      '<div class="item verify">' +
      escapeHTML(item) +
      '</div>';

  });

  html += '</div>';

  html +=
    '<div class="section">' +
    '<h2>💭 Recommandations</h2>';

  data.recommandations.forEach(function(item) {

    html +=
      '<div class="item">' +
      escapeHTML(item) +
      '</div>';

  });

  html += '</div>';

  html +=
    '<div class="section">' +
    '<h2>📋 Actions concrètes</h2>';

  data.actions.forEach(function(item) {

    html +=
      '<div class="item action">' +
      escapeHTML(item) +
      '</div>';

  });

  html += '</div>';

  html +=
    '<div class="section">' +
    '<h2>📄 Documents</h2>';

  if (
    data.documents &&
    data.documents.length
  ) {

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

  if (
    data.risques &&
    data.risques.length
  ) {

    html +=
      '<div class="section">' +
      '<h2>⚠️ Points de vigilance</h2>';

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

  html +=
    '<div class="section">' +
    '<h2>📚 Sources consultées</h2>';

  data.sources.forEach(function(source) {

    html +=
      '<a class="source" ' +
      'target="_blank" ' +
      'rel="noopener noreferrer" ' +
      'href="' +
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

  document.getElementById("result").innerHTML =
    html;
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

    const url =
      new URL(request.url);

    /*
    ==========================
    HEALTH
    ==========================
    */

    if (
      url.pathname === "/health"
    ) {

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
            "Content-Type":
              "application/json; charset=UTF-8"
          }
        }

      );
    }

    /*
    ==========================
    API
    ==========================
    */

    if (
      url.pathname === "/api/analyze"
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
              ...securityHeaders,
              "Content-Type":
                "application/json; charset=UTF-8"
            }
          }

        );
      }

      try {

        const contentType =
          request.headers.get(
            "content-type"
          ) || "";

        if (
          !contentType.includes(
            "application/json"
          )
        ) {

          return new Response(

            JSON.stringify({
              success: false,
              error:
                "Content-Type JSON requis."
            }),

            {
              status: 415,
              headers: {
                ...securityHeaders,
                "Content-Type":
                  "application/json; charset=UTF-8"
              }
            }

          );
        }

        const body =
          await request.json();

        const question =
          clean(
            body.question,
            5000
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
                ...securityHeaders,
                "Content-Type":
                  "application/json; charset=UTF-8"
              }
            }

          );
        }

        /*
        L'IA sert uniquement
        à formuler l'orientation.
        */

        const aiRaw =
          await askAI(
            env,
            question
          );

        const aiData =
          extractJSON(aiRaw) || {};

        /*
        Le moteur de vérité
        construit la réponse finale.
        */

        const finalResponse =
          buildFinalResponse(
            question,
            aiData
          );

        return new Response(

          JSON.stringify(
            finalResponse
          ),

          {
            headers: {
              ...securityHeaders,
              "Content-Type":
                "application/json; charset=UTF-8"
            }
          }

        );

      } catch (error) {

        return new Response(

          JSON.stringify({
            success: false,
            error:
              "Erreur interne du service.",
            version: VERSION
          }),

          {
            status: 500,
            headers: {
              ...securityHeaders,
              "Content-Type":
                "application/json; charset=UTF-8"
            }
          }

        );
      }
    }

    /*
    ==========================
    SITE
    ==========================
    */

    if (
      request.method !== "GET"
    ) {

      return new Response(
        "Méthode non autorisée.",
        {
          status: 405,
          headers:
            securityHeaders
        }
      );
    }

    return new Response(

      pageHTML(),

      {
        headers: {
          ...securityHeaders,
          "Content-Type":
            "text/html; charset=UTF-8"
        }
      }

    );
  }

};
