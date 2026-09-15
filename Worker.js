const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const MODEL_VISION = "@cf/meta/llama-3.2-11b-vision-instruct";
const MODEL_AUDIO = "@cf/openai/whisper-large-v3-turbo";
const VERSION = "8.3";

const SOURCES = {
  france_statut: {
    title: "Trouver le statut juridique adapté à son activité",
    url: "https://entreprendre.service-public.fr/vosdroits/R18323"
  },
  france_creation_ei: {
    title: "Création d'une entreprise individuelle",
    url: "https://entreprendre.service-public.fr/vosdroits/F36763"
  },
  france_guichet: {
    title: "Formalités d'immatriculation des entreprises",
    url: "https://entreprendre.service-public.fr/vosdroits/F23571"
  },
  service_public: {
    title: "Service-Public.fr",
    url: "https://www.service-public.fr/"
  },
  france_anef: {
    title: "Administration numérique pour les étrangers en France",
    url: "https://administration-etrangers-en-france.interieur.gouv.fr/"
  },
  france_travail: {
    title: "France Travail",
    url: "https://www.francetravail.fr/"
  }
};

const PARCOURS = {
  migrant: {
    titre: "🌍 Migrant / Nouveau arrivant",
    description:
      "Situation administrative, travail, logement, droits et démarches.",
    etapes: [
      {
        titre: "Dans quel pays êtes-vous ?",
        options: [
          "🇫🇷 France",
          "🇩🇪 Allemagne",
          "🇧🇪 Belgique",
          "🇪🇸 Espagne",
          "🇮🇹 Italie",
          "🌍 Autre pays"
        ]
      },
      {
        titre: "Quelle est votre situation ?",
        options: [
          "Je viens d'arriver",
          "Je cherche du travail",
          "Je cherche un logement",
          "Je dois faire mes démarches",
          "Je ne comprends pas mes documents",
          "Je veux connaître mes droits",
          "Situation irrégulière",
          "Demande d'asile / protection",
          "Autre"
        ]
      },
      {
        titre: "Quel est votre objectif ?",
        options: [
          "Comprendre ma situation",
          "Trouver une solution",
          "Faire une démarche",
          "Trouver un emploi",
          "Trouver un logement",
          "Obtenir une aide",
          "Vérifier mes droits",
          "Autre"
        ]
      }
    ]
  },

  particulier: {
    titre: "👤 Particulier / Résident",
    description:
      "Vie quotidienne, démarches, droits et problèmes.",
    etapes: [
      {
        titre: "De quoi avez-vous besoin ?",
        options: [
          "Démarches administratives",
          "Droits",
          "Logement",
          "Travail",
          "Famille",
          "Santé / orientation",
          "Aides sociales",
          "Documents",
          "Autre"
        ]
      },
      {
        titre: "Quel est votre objectif ?",
        options: [
          "Comprendre",
          "Trouver une solution",
          "Faire une démarche",
          "Comparer des options",
          "Écrire un courrier",
          "Répondre à un message",
          "Autre"
        ]
      }
    ]
  },

  emploi: {
    titre: "💼 Chercheur d'emploi",
    description:
      "Offres, CV, candidatures, entretiens et emploi.",
    etapes: [
      {
        titre: "Que recherchez-vous ?",
        options: [
          "Un emploi",
          "Une mission d'intérim",
          "Une formation",
          "Une alternance",
          "Un premier emploi",
          "Un emploi sans diplôme",
          "Autre"
        ]
      },
      {
        titre: "Quel est votre objectif ?",
        options: [
          "Trouver des offres",
          "Améliorer mon CV",
          "Écrire une candidature",
          "Répondre à une entreprise",
          "Préparer un entretien",
          "Comparer des offres",
          "Autre"
        ]
      }
    ]
  },

  entreprise: {
    titre: "🏢 Entreprise / Entrepreneur",
    description:
      "Création, gestion, développement et opportunités.",
    etapes: [
      {
        titre: "Que souhaitez-vous faire ?",
        options: [
          "Créer une entreprise",
          "Développer mon activité",
          "Résoudre un problème",
          "Trouver une opportunité",
          "Trouver des clients",
          "Comparer des fournisseurs",
          "Comprendre mes obligations",
          "Autre"
        ]
      },
      {
        titre: "Quel est votre objectif ?",
        options: [
          "Comprendre",
          "Trouver une solution",
          "Comparer",
          "Réduire mes coûts",
          "Développer mon activité",
          "Faire une démarche",
          "Autre"
        ]
      }
    ]
  }
};

function clean(value, max = 5000) {
  if (value === undefined || value === null) return "";
  return String(value)
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, max);
}

function escapeHTML(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Cache-Control": "no-store",
      "Permissions-Policy":
        "camera=(self), microphone=(self), geolocation=()"
    }
  });
}

function detectContext(question) {
  const q = question.toLowerCase();

  return {
    migrant:
      /migrant|étranger|étrangère|nouveau arrivant|arriv[ée]e|titre de séjour|séjour|asile|irrégulière|irrégulier|immigration|visa/.test(q),

    emploi:
      /emploi|travail|job|cv|candidature|intérim|recrutement|entretien|france travail|chercheur d'emploi/.test(q),

    entreprise:
      /entreprise|entrepreneur|société|activité|commerce|client|fournisseur|business|micro-entreprise|indépendant/.test(q),

    nettoyage:
      /nettoyage|ménage|nettoyeur|nettoyeuse|propreté/.test(q),

    logement:
      /logement|appartement|maison|loyer|hébergement/.test(q),

    administratif:
      /administratif|démarche|document|formulaire|préfecture|administration/.test(q)
  };
}

function selectSources(context) {
  const ids = [];

  if (context.entreprise || context.nettoyage) {
    ids.push("france_statut", "france_guichet");
  }

  if (context.migrant) {
    ids.push("service_public", "france_anef");
  }

  if (context.emploi) {
    ids.push("france_travail");
  }

  if (context.administratif && !context.migrant) {
    ids.push("service_public");
  }

  return [...new Set(ids)];
}

function buildConfirmedFacts(context) {
  const facts = [];

  if (context.entreprise || context.nettoyage) {
    facts.push(
      "Le choix de la forme juridique peut être étudié en fonction de l'activité envisagée, du chiffre d'affaires estimé, des revenus, de la couverture sociale et de la gestion."
    );
  }

  return facts;
}

function buildDocuments(context) {
  if (!context.entreprise) {
    return [];
  }

  return [
    {
      statut: "à vérifier",
      texte:
        "Les documents nécessaires dépendent de la forme juridique et de l'activité choisies."
    }
  ];
}

function buildActions(context) {
  if (context.nettoyage) {
    return [
      "Décrire précisément les prestations de nettoyage proposées.",
      "Comparer les formes juridiques possibles.",
      "Vérifier les formalités correspondant à la forme juridique et à l'activité choisies."
    ];
  }

  if (context.entreprise) {
    return [
      "Décrire précisément l'activité envisagée.",
      "Identifier les options juridiques adaptées.",
      "Vérifier les formalités correspondant à l'activité et au statut choisi."
    ];
  }

  if (context.emploi) {
    return [
      "Préciser le métier recherché.",
      "Définir les critères importants pour l'emploi recherché.",
      "Rechercher puis comparer les offres correspondant au profil."
    ];
  }

  if (context.migrant) {
    return [
      "Préciser le pays concerné.",
      "Préciser votre situation actuelle.",
      "Préciser exactement votre objectif afin d'identifier la démarche ou l'orientation adaptée."
    ];
  }

  return [
    "Préciser votre situation.",
    "Définir votre objectif.",
    "Identifier la prochaine démarche utile."
  ];
}

function buildRecommendations(context) {
  if (context.nettoyage) {
    return [
      "Décrire précisément les prestations que vous souhaitez vendre.",
      "Comparer les formes juridiques avant de choisir.",
      "Vérifier les formalités après avoir déterminé la forme juridique."
    ];
  }

  if (context.migrant) {
    return [
      "Préciser votre situation avant de choisir une démarche.",
      "Vérifier les informations auprès des autorités officielles du pays concerné."
    ];
  }

  if (context.emploi) {
    return [
      "Définir clairement le métier et le type de contrat recherchés.",
      "Comparer plusieurs offres avant de candidater."
    ];
  }

  if (context.entreprise) {
    return [
      "Décrire précisément l'activité avant de prendre une décision.",
      "Comparer les options adaptées à votre projet."
    ];
  }

  return [
    "Préciser le besoin avant de choisir une démarche.",
    "Vérifier les informations importantes auprès de la source officielle concernée."
  ];
}

function buildRisks() {
  return [];
}

function buildProfessional() {
  return [];
}

function buildNextAction(context) {
  if (context.nettoyage) {
    return "Préciser exactement les prestations de nettoyage envisagées, puis comparer les formes juridiques adaptées.";
  }

  if (context.entreprise) {
    return "Préciser exactement l'activité et comparer les options juridiques adaptées.";
  }

  if (context.migrant) {
    return "Préciser le pays, votre situation actuelle et votre objectif.";
  }

  if (context.emploi) {
    return "Préciser le métier recherché et le type d'emploi souhaité.";
  }

  return "Préciser votre situation et votre objectif afin de déterminer la prochaine action utile.";
}

function buildOrientation(context, question) {
  if (context.nettoyage) {
    return (
      "Pour votre projet de nettoyage, il faut d'abord préciser exactement " +
      "les prestations envisagées et déterminer la forme juridique adaptée. " +
      "Les formalités pourront ensuite être vérifiées en fonction de ces éléments."
    );
  }

  if (context.migrant) {
    return (
      "Votre situation doit être examinée selon le pays concerné, " +
      "votre situation actuelle et votre objectif. Les règles peuvent " +
      "différer selon le pays et la situation individuelle."
    );
  }

  if (context.emploi) {
    return (
      "Pour rechercher un emploi efficacement, il faut d'abord préciser " +
      "le métier recherché, le type de contrat et les critères importants."
    );
  }

  if (context.entreprise) {
    return (
      "Pour votre projet d'entreprise, il faut d'abord préciser l'activité, " +
      "le besoin rencontré et l'objectif recherché."
    );
  }

  return (
    "GouRare AI va d'abord identifier votre situation et votre objectif " +
    "afin de déterminer l'orientation la plus pertinente."
  );
}

async function askAI(env, question, context) {
  const prompt =
    "Explique brièvement la situation de l'utilisateur. " +
    "Tu es uniquement chargé de l'explication générale. " +
    "N'invente aucune loi, obligation, chiffre, délai, prix, sanction ou document. " +
    "Ne crée aucune recommandation juridique présentée comme certaine. " +
    "Ne donne pas de source URL. " +
    "Si une information doit être vérifiée, dis-le clairement.\n\n" +
    "Question utilisateur : " +
    clean(question, 4000) +
    "\n\nContexte : " +
    JSON.stringify(context);

  try {
    const response = await env.IA.run(MODEL, {
      messages: [
        {
          role: "system",
          content:
            "Tu es le moteur d'explication de GouRare AI. " +
            "Tu ne dois jamais inventer de faits."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 900,
      temperature: 0.1
    });

    if (typeof response === "string") {
      return response;
    }

    if (response && typeof response.response === "string") {
      return response.response;
    }

    if (
      response &&
      response.result &&
      typeof response.result.response === "string"
    ) {
      return response.result.response;
    }

    return "";
  } catch (error) {
    return "";
  }
}

async function analyserQuestion(env, question, parcours = null) {
  const contexte = detectContext(question);
  const sourceIds = selectSources(contexte);
  const confirmed = buildConfirmedFacts(contexte);
  const documents = buildDocuments(contexte);
  const actions = buildActions(contexte);
  const recommendations = buildRecommendations(contexte);
  const risks = buildRisks();
  const professional = buildProfessional();
  const nextAction = buildNextAction(contexte);
  const orientation = buildOrientation(contexte, question);

  let explication = "";

  if (!contexte.nettoyage) {
    explication = await askAI(env, question, contexte);
  }

  if (explication) {
    explication = clean(explication, 5000)
      .replace(/https?:\/\/\S+/gi, "")
      .trim();
  }

  if (!explication) {
    explication = orientation;
  }

  return {
    success: true,
    version: VERSION,
    compris: clean(question, 1000),
    orientation: orientation + (explication !== orientation ? "\n\n" + explication : ""),
    confirmed,
    aVerifier: buildAverifier(contexte),
    recommendations,
    actions,
    documents,
    risks,
    professional,
    nextAction,
    sources: sourceIds.map((id) => ({
      id,
      title: SOURCES[id].title,
      url: SOURCES[id].url
    })),
    parcours
  };
}

function buildAverifier(context) {
  if (context.nettoyage) {
    return [
      "La forme juridique la plus adaptée à votre projet.",
      "La nature exacte de l'activité et des prestations.",
      "Les formalités spécifiques correspondant à la forme juridique et à l'activité choisies."
    ];
  }

  if (context.migrant) {
    return [
      "Le pays concerné.",
      "Votre situation administrative exacte.",
      "La procédure correspondant à votre objectif."
    ];
  }

  if (context.emploi) {
    return [
      "Les critères exacts du poste recherché.",
      "Les conditions de chaque offre.",
      "La compatibilité de l'offre avec votre situation."
    ];
  }

  if (context.entreprise) {
    return [
      "La forme juridique adaptée.",
      "Les obligations propres à l'activité.",
      "Les formalités applicables au projet."
    ];
  }

  return [
    "Les éléments particuliers de votre situation.",
    "Les démarches exactes applicables à votre cas."
  ];
}

async function analyserImage(env, image) {
  if (!image || image.length > 8000000) {
    throw new Error("Image absente ou trop volumineuse.");
  }

  const response = await env.IA.run(MODEL_VISION, {
    messages: [
      {
        role: "system",
        content:
          "Analyse uniquement ce qui est réellement visible. " +
          "Ne devine jamais un texte illisible. " +
          "Si un document contient des informations importantes, " +
          "indique clairement ce qui est lisible et ce qui ne l'est pas. " +
          "Explique ensuite ce que l'image semble montrer."
      },
      {
        role: "user",
        content:
          "Analyse cette image avec précision et explique les éléments visibles."
      }
    ],
    image
  });

  if (typeof response === "string") return response;

  if (response && typeof response.response === "string") {
    return response.response;
  }

  if (
    response &&
    response.result &&
    typeof response.result.response === "string"
  ) {
    return response.result.response;
  }

  return JSON.stringify(response);
}

async function transcrireAudio(env, audio) {
  if (!audio || audio.length > 10000000) {
    throw new Error("Audio absent ou trop volumineux.");
  }

  const response = await env.IA.run(MODEL_AUDIO, {
    audio
  });

  if (response && typeof response.text === "string") {
    return response.text;
  }

  if (
    response &&
    response.transcription_info &&
    typeof response.transcription_info.text === "string"
  ) {
    return response.transcription_info.text;
  }

  return "";
}

function pageHTML() {
  const parcoursJSON = JSON.stringify(PARCOURS).replace(/</g, "\\u003c");

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
  font-family: Arial, sans-serif;
  background: #f5f7fa;
  color: #17202a;
}

header {
  background: #ffffff;
  padding: 28px 18px 18px;
  text-align: center;
  border-bottom: 1px solid #e5e7eb;
}

.logo {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 1px;
}

.subtitle {
  margin-top: 8px;
  color: #68707a;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 22px 16px 120px;
}

.welcome {
  text-align: center;
  margin: 18px 0 28px;
}

.welcome h1 {
  font-size: 25px;
  margin-bottom: 8px;
}

.welcome p {
  color: #69727d;
}

.cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.card {
  background: #ffffff;
  border: 1px solid #e1e5e9;
  border-radius: 18px;
  padding: 25px;
  cursor: pointer;
  transition: transform .15s, box-shadow .15s;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,.08);
}

.card-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.card h2 {
  font-size: 19px;
  margin: 0 0 8px;
}

.card p {
  color: #68707a;
  line-height: 1.5;
  margin: 0;
}

.orienter {
  margin-top: 18px;
  background: #ffffff;
  border: 1px dashed #9aa4af;
  border-radius: 18px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
}

.step {
  display: none;
}

.step.active {
  display: block;
}

.step h2 {
  margin-top: 0;
}

.options {
  display: grid;
  gap: 12px;
}

.option {
  background: #ffffff;
  border: 1px solid #dfe4e8;
  border-radius: 14px;
  padding: 17px;
  cursor: pointer;
  font-size: 16px;
}

.option:hover {
  border-color: #68727d;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  flex-wrap: wrap;
}

button {
  border: 0;
  border-radius: 12px;
  padding: 13px 18px;
  cursor: pointer;
  font-size: 15px;
}

.primary {
  background: #17202a;
  color: #ffffff;
}

.secondary {
  background: #e9edf1;
  color: #17202a;
}

textarea {
  width: 100%;
  min-height: 130px;
  border: 1px solid #dfe4e8;
  border-radius: 14px;
  padding: 16px;
  font-size: 16px;
  resize: vertical;
}

.result {
  margin-top: 25px;
}

.result-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 14px;
  border: 1px solid #e3e7eb;
}

.result-card h2 {
  margin-top: 0;
  font-size: 18px;
}

.source {
  display: block;
  margin-top: 9px;
  color: #2257a5;
  text-decoration: none;
}

.badge {
  position: fixed;
  right: 14px;
  bottom: 14px;
  background: #ffffff;
  border: 1px solid #ddd;
  padding: 10px 13px;
  border-radius: 20px;
  box-shadow: 0 5px 18px rgba(0,0,0,.12);
  z-index: 20;
}

footer {
  text-align: center;
  color: #737b84;
  font-size: 13px;
  padding: 20px;
}

@media (max-width: 650px) {
  .cards {
    grid-template-columns: 1fr;
  }

  .logo {
    font-size: 26px;
  }
}
</style>
</head>

<body>

<header>
  <div class="logo">GouRare AI</div>
  <div class="subtitle">Intelligence, orientation et solutions</div>
</header>

<main class="container">

<section id="home">
  <div class="welcome">
    <h1>👋 Bienvenue sur GouRare AI</h1>
    <p>Choisissez directement votre situation.</p>
  </div>

  <div class="cards">

    <div class="card" onclick="startParcours('migrant')">
      <div class="card-icon">🌍</div>
      <h2>Migrant / Nouveau arrivant</h2>
      <p>Situation administrative, travail, logement, droits et démarches.</p>
    </div>

    <div class="card" onclick="startParcours('particulier')">
      <div class="card-icon">👤</div>
      <h2>Particulier / Résident</h2>
      <p>Vie quotidienne, démarches, droits et problèmes.</p>
    </div>

    <div class="card" onclick="startParcours('emploi')">
      <div class="card-icon">💼</div>
      <h2>Chercheur d'emploi</h2>
      <p>Offres, CV, candidatures, entretiens et emploi.</p>
    </div>

    <div class="card" onclick="startParcours('entreprise')">
      <div class="card-icon">🏢</div>
      <h2>Entreprise / Entrepreneur</h2>
      <p>Création, gestion, développement et opportunités.</p>
    </div>

  </div>

  <div class="orienter" onclick="startOrientation()">
    ✨ Je ne sais pas où aller — GouRare AI m'oriente
  </div>
</section>

<section id="parcours" class="step">
  <h2 id="parcoursTitle"></h2>
  <p id="parcoursQuestion"></p>

  <div id="options" class="options"></div>

  <div class="actions">
    <button class="secondary" onclick="previousStep()">← Retour</button>
    <button class="secondary" onclick="goHome()">Accueil</button>
  </div>
</section>

<section id="questionSection" class="step">

  <h2>🧠 Décrivez votre besoin</h2>

  <textarea id="question"
    placeholder="Expliquez votre situation ou votre question..."></textarea>

  <div class="actions">

    <button class="primary" onclick="analyser()">
      Analyser
    </button>

    <button class="secondary" onclick="startVoice()">
      🎙️ Parler
    </button>

    <label class="secondary" style="display:inline-block">
      📷 Analyser une image
      <input
        id="imageInput"
        type="file"
        accept="image/*"
        capture="environment"
        style="display:none"
        onchange="analyserImage()">
    </label>

  </div>

  <div id="status"></div>
  <div id="result" class="result"></div>

  <div class="actions">
    <button class="secondary" onclick="goHome()">← Accueil</button>
  </div>

</section>

</main>

<div class="badge">🎗️ Avec vous contre le cancer</div>

<footer>
  🎗️ Notre soutien aux personnes touchées par le cancer.
  <br><br>
  GouRare AI — Version ${VERSION}
</footer>

  if (response && typeof response.text === "string") {
    return response.text;
  }

  if (
    response &&
    response.transcription_info &&
    typeof response.transcription_info.text === "string"
  ) {
    return response.transcription_info.text;
  }

  return "";
}

function pageHTML() {
  const parcoursJSON = JSON.stringify(PARCOURS).replace(/</g, "\\u003c");

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
  font-family: Arial, sans-serif;
  background: #f5f7fa;
  color: #17202a;
}

header {
  background: #ffffff;
  padding: 28px 18px 18px;
  text-align: center;
  border-bottom: 1px solid #e5e7eb;
}

.logo {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 1px;
}

.subtitle {
  margin-top: 8px;
  color: #68707a;
}

.container {
  max-width: 900px;


let parcoursActuel = null;
let etapeActuelle = 0;
let reponses = [];

function goHome() {
  document.getElementById("home").style.display = "block";
  document.getElementById("parcours").classList.remove("active");
  document.getElementById("questionSection").classList.remove("active");
  window.scrollTo({top: 0, behavior: "smooth"});
}

function startParcours(type) {
  parcoursActuel = type;
  etapeActuelle = 0;
  reponses = [];

  document.getElementById("home").style.display = "none";
  document.getElementById("questionSection").classList.remove("active");
  document.getElementById("parcours").classList.add("active");

  afficherEtape();
}

function afficherEtape() {
  const data = parcours[parcoursActuel];
  const etape = data.etapes[etapeActuelle];

  document.getElementById("parcoursTitle").textContent = data.titre;
  document.getElementById("parcoursQuestion").textContent = etape.titre;

  const options = document.getElementById("options");
  options.innerHTML = "";

  etape.options.forEach(function(option) {
    const div = document.createElement("div");
    div.className = "option";
    div.textContent = option;

    div.onclick = function() {
      reponses.push(option);

      if (etapeActuelle < data.etapes.length - 1) {
        etapeActuelle++;
        afficherEtape();
      } else {
        ouvrirQuestion();
      }
    };

    options.appendChild(div);
  });
}

function previousStep() {
  if (etapeActuelle > 0) {
    etapeActuelle--;
    reponses.pop();
    afficherEtape();
  } else {
    goHome();
  }
}

function ouvrirQuestion() {
  document.getElementById("parcours").classList.remove("active");
  document.getElementById("questionSection").classList.add("active");

  let contexte = reponses.join(" — ");

  document.getElementById("question").value =
    contexte + "\\n\\n";

  window.scrollTo({top: 0, behavior: "smooth"});
}

function startOrientation() {
  document.getElementById("home").style.display = "none";
  document.getElementById("parcours").classList.remove("active");
  document.getElementById("questionSection").classList.add("active");

  document.getElementById("question").value = "";
  document.getElementById("question").focus();
}

async function analyser() {
  const question = document.getElementById("question").value.trim();
  const status = document.getElementById("status");
  const result = document.getElementById("result");

  if (!question) {
    status.textContent = "Veuillez écrire votre question.";
    return;
  }

  status.textContent = "Analyse en cours...";
  result.innerHTML = "";

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question: question,
        parcours: reponses
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Erreur pendant l'analyse.");
    }

    status.textContent = "Analyse terminée.";

    afficherResultat(data);

  } catch (error) {
    status.textContent = error.message;
  }
}

function afficherListe(titre, items) {
  if (!items || !items.length) {
    return "";
  }

  let html =
    '<div class="result-card">' +
    '<h2>' + titre + '</h2>';

  items.forEach(function(item) {

    if (typeof item === "object") {
      html +=
        '<p>' +
        escapeHTML(item.statut || "") +
        ' — ' +
        escapeHTML(item.texte || "") +
        '</p>';
    } else {
      html += '<p>' + escapeHTML(item) + '</p>';
    }

  });

  html += "</div>";

  return html;
}

function afficherResultat(data) {

  let html = "";

  html +=
    '<div class="result-card">' +
    '<h2>🧭 Ce que j\\'ai compris</h2>' +
    '<p>' + escapeHTML(data.compris) + '</p>' +
    '</div>';

  html +=
    '<div class="result-card">' +
    '<h2>💡 Orientation</h2>' +
    '<p>' +
    escapeHTML(data.orientation).replace(/\\n/g, "<br>") +
    '</p>' +
    '</div>';

  html += afficherListe(
    "✅ Informations confirmées",
    data.confirmed
  );

  html += afficherListe(
    "🔎 À vérifier",
    data.aVerifier
  );

  html += afficherListe(
    "💭 Recommandations",
    data.recommendations
  );

  html += afficherListe(
    "📋 Actions concrètes",
    data.actions
  );

  html += afficherListe(
    "📄 Documents",
    data.documents
  );

  html += afficherListe(
    "⚠️ Points de vigilance",
    data.risks
  );

  if (data.professional && data.professional.length) {
    html += afficherListe(
      "👤 Professionnel",
      data.professional
    );
  }

  html +=
    '<div class="result-card">' +
    '<h2>🚀 Prochaine action</h2>' +
    '<p>' +
    escapeHTML(data.nextAction) +
    '</p>' +
    '</div>';

  if (data.sources && data.sources.length) {

    html +=
      '<div class="result-card">' +
      '<h2>📚 Sources consultées</h2>';

    data.sources.forEach(function(source) {
      html +=
        '<a class="source" target="_blank" rel="noopener noreferrer" href="' +
        escapeHTML(source.url) +
        '">' +
        escapeHTML(source.title) +
        ' ↗️' +
        '</a>';
    });

    html += "</div>";
  }

  document.getElementById("result").innerHTML = html;
}

function startVoice() {

  if (!navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia) {

    alert("La fonction microphone n'est pas disponible sur cet appareil ou ce navigateur.");
    return;
  }

  alert(
    "La fonction vocale est prête. Autorisez le microphone puis parlez."
  );

  navigator.mediaDevices.getUserMedia({
    audio: true
  })
  .then(function(stream) {

    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = function(event) {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = async function() {

      stream.getTracks().forEach(function(track) {
        track.stop();
      });

      const blob = new Blob(chunks, {
        type: "audio/webm"
      });

      const reader = new FileReader();

      reader.onloadend = async function() {

        const base64 = reader.result;

        try {

          document.getElementById("status").textContent =
            "Transcription en cours...";

          const response = await fetch("/api/transcribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              audio: base64
            })
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(
              data.error || "Erreur de transcription."
            );
          }

          document.getElementById("question").value =
            data.text || "";

          document.getElementById("status").textContent =
            "Transcription terminée.";

        } catch (error) {

          document.getElementById("status").textContent =
            error.message;
        }
      };

      reader.readAsDataURL(blob);
    };

    recorder.start();

    setTimeout(function() {
      if (recorder.state === "recording") {
        recorder.stop();
      }
    }, 10000);

  })
  .catch(function(error) {

    alert(
      "Impossible d'accéder au microphone : " +
      error.message
    );
  });
}

async function analyserImage() {

  const input = document.getElementById("imageInput");

  if (!input.files || !input.files[0]) {
    return;
  }

  const file = input.files[0];
  const reader = new FileReader();

  document.getElementById("status").textContent =
    "Analyse de l'image en cours...";

  reader.onloadend = async function() {

    try {

      const response = await fetch("/api/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image: reader.result
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Erreur d'analyse de l'image."
        );
      }

      document.getElementById("question").value =
        data.text || "";

      document.getElementById("status").textContent =
        "Analyse de l'image terminée.";

    } catch (error) {

      document.getElementById("status").textContent =
        error.message;
    }
  };

  reader.readAsDataURL(file);
}
</script>

</body>
</html>`;
}

export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return new Response(pageHTML(), {
        headers: {
          "Content-Type": "text/html; charset=UTF-8",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "Referrer-Policy":
            "strict-origin-when-cross-origin",
          "Cache-Control": "no-store",
          "Permissions-Policy":
            "camera=(self), microphone=(self), geolocation=()"
        }
      });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return jsonResponse({
        success: true,
        service: "GouRare AI",
        status: "OK",
        version: VERSION
      });
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/analyze"
    ) {

      try {

        const contentType =
          request.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          return jsonResponse(
            {
              success: false,
              error: "Content-Type JSON requis."
            },
            415
          );
        }

        const body = await request.json();

        const question = clean(
          body.question,
          5000
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

        const parcours = Array.isArray(body.parcours)
          ? body.parcours
              .slice(0, 10)
              .map((item) => clean(item, 300))
          : [];

        const result = await analyserQuestion(
          env,
          question,
          parcours
        );

        return jsonResponse(result);

      } catch (error) {

        return jsonResponse(
          {
            success: false,
            error: "Erreur pendant l'analyse."
          },
          500
        );
      }
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/image"
    ) {

      try {

        const body = await request.json();
        const image = clean(body.image, 8000000);

        if (!image) {
          return jsonResponse(
            {
              success: false,
              error: "Image absente."
            },
            400
          );
        }

        const text = await analyserImage(
          env,
          image
        );

        return jsonResponse({
          success: true,
          text: clean(text, 7000)
        });

      } catch (error) {

        return jsonResponse(
          {
            success: false,
            error: "Impossible d'analyser l'image."
          },
          500
        );
      }
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/transcribe"
    ) {

      try {

        const body = await request.json();
        const audio = clean(body.audio, 10000000);

        if (!audio) {
          return jsonResponse(
            {
              success: false,
              error: "Audio absent."
            },
            400
          );
        }

        const text = await transcrireAudio(
          env,
          audio
        );

        return jsonResponse({
          success: true,
          text: clean(text, 5000)
        });

      } catch (error) {

        return jsonResponse(
          {
            success: false,
            error: "Impossible de transcrire l'audio."
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
