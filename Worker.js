const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const MODEL_VISION = "@cf/meta/llama-3.2-11b-vision-instruct";
const MODEL_AUDIO = "@cf/openai/whisper-large-v3-turbo";

const VERSION = "8.2";

const LIMITS = {
  question: 12000,
  image: 7000000,
  audio: 12000000
};


/* =========================================================
   SOURCES OFFICIELLES
========================================================= */

const SOURCES = {

  statut: {
    id: "statut",
    organisme: "Service Public Entreprendre",
    titre: "Trouver le statut juridique adapté à son activité",
    url: "https://entreprendre.service-public.fr/vosdroits/R18323",

    preuves: [
      "Le simulateur permet de rechercher le statut juridique adapté à une activité.",
      "Le choix peut notamment être étudié selon l'activité, le chiffre d'affaires estimé, les revenus, la protection sociale et la gestion."
    ]
  },

  creation_ei: {
    id: "creation_ei",
    organisme: "Service Public Entreprendre",
    titre: "Création d'une entreprise individuelle",
    url: "https://entreprendre.service-public.fr/vosdroits/F36763",

    preuves: [
      "La création d'une entreprise individuelle comporte des formalités de déclaration ou d'immatriculation.",
      "Les formalités de création d'une entreprise individuelle sont réalisées par l'intermédiaire du Guichet des formalités des entreprises.",
      "Pour une entreprise individuelle, les justificatifs demandés peuvent notamment comprendre un justificatif de domiciliation, une déclaration sur l'honneur de non-condamnation et une pièce d'identité.",
      "Une activité réglementée peut nécessiter une autorisation, un diplôme ou un titre selon les règles applicables."
    ]
  },

  guichet: {
    id: "guichet",
    organisme: "Service Public Entreprendre",
    titre: "Formalités d'immatriculation des entreprises",
    url: "https://entreprendre.service-public.fr/vosdroits/F23571",

    preuves: [
      "Les formalités des entreprises sont réalisées par l'intermédiaire du Guichet des formalités des entreprises."
    ]
  }

};


/* =========================================================
   PARCOURS UTILISATEUR
========================================================= */

const PARCOURS = {

  migrant: {
    titre: "🌍 Migrant / Nouveau arrivant",
    description:
      "Trouvez une orientation adaptée à votre situation et à votre pays.",
    situations: [
      ["arrivee", "🛬 Je viens d'arriver"],
      ["administratif", "📄 Situation administrative"],
      ["emploi", "💼 Je cherche un emploi"],
      ["logement", "🏠 Je cherche un logement"],
      ["document", "📑 Je ne comprends pas un document"],
      ["droits", "⚖️ Je veux connaître mes droits"],
      ["social", "🤝 Je cherche une aide sociale"],
      ["etudes", "🎓 Études / formation"],
      ["famille", "👨‍👩‍👧 Famille"],
      ["asile", "🛡️ Asile / protection"],
      ["irreguliere", "🌍 Situation irrégulière"],
      ["autre", "✨ Autre situation"]
    ]
  },

  particulier: {
    titre: "👤 Particulier / Résident",
    description:
      "Démarches, travail, logement, social, documents et problèmes du quotidien.",
    situations: [
      ["administratif", "📄 Démarches administratives"],
      ["travail", "💼 Travail"],
      ["logement", "🏠 Logement"],
      ["finance", "💰 Finance"],
      ["social", "🤝 Aide sociale"],
      ["legal", "⚖️ Question juridique"],
      ["message", "✉️ Message / email"],
      ["document", "📑 Document"],
      ["opportunite", "🎯 Opportunité"],
      ["autre", "✨ Autre"]
    ]
  },

  emploi: {
    titre: "💼 Chercheur d'emploi",
    description:
      "Trouvez une orientation pour votre recherche d'emploi.",
    situations: [
      ["offres", "🔎 Recherche d'offres"],
      ["cv", "📄 CV"],
      ["candidature", "✉️ Candidature"],
      ["annonce", "📋 Comprendre une annonce"],
      ["entretien", "🎯 Entretien"],
      ["entreprise", "🏢 Trouver une entreprise"],
      ["adapte", "♿ Emploi adapté"],
      ["comparaison", "⚖️ Comparer des offres"],
      ["autre", "✨ Autre"]
    ]
  },

  entreprise: {
    titre: "🏢 Entreprise / Entrepreneur",
    description:
      "Création, gestion, fiscalité, développement, fournisseurs et opportunités.",
    situations: [
      ["creation", "🚀 Création d'entreprise"],
      ["developpement", "📈 Développement"],
      ["fiscalite", "💰 Fiscalité"],
      ["comptabilite", "🧾 Comptabilité"],
      ["salaries", "👥 Salariés"],
      ["legal", "⚖️ Juridique"],
      ["fournisseurs", "📦 Fournisseurs"],
      ["offres", "🏷️ Offres / prix"],
      ["opportunites", "🎯 Opportunités"],
      ["solution-ai", "🤖 Solution IA"],
      ["autre", "✨ Autre"]
    ]
  }

};


/* =========================================================
   OUTILS DE BASE
========================================================= */

function texte(value, maxLength) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLength || 10000);
}


function unique(items) {

  return Array.from(
    new Set(
      (items || []).filter(Boolean)
    )
  );
}


function jsonResponse(data, status) {

  return new Response(
    JSON.stringify(data),
    {
      status: status || 200,
      headers: {
        "content-type":
          "application/json; charset=utf-8",
        "cache-control":
          "no-store"
      }
    }
  );
}


function securityHeaders() {

  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy":
      "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(self), microphone=(self), geolocation=()",
    "Cache-Control": "no-store"
  };
}


/* =========================================================
   CONTEXTE
========================================================= */

function detectContext(question) {

  const q =
    question
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const entreprise =
    /entreprise|societe|société|entrepreneur|independant|indépendant|micro.?entreprise|micro.?entrepreneur|commerce|activite professionnelle|activité professionnelle/.test(q);

  const statut =
    /statut|forme juridique|entreprise individuelle|micro.?entreprise|micro.?entrepreneur|ei\b/.test(q);

  const nettoyage =
    /nettoyage|menage|ménage|proprete|propreté|cleaning/.test(q);

  const emploi =
    /emploi|travail|job|recrutement|embauche|cv|candidature|offre d'emploi/.test(q);

  const logement =
    /logement|appartement|maison|loyer|location|hebergement|hébergement/.test(q);

  const message =
    /message|email|e-mail|mail|courrier|sms|whatsapp/.test(q);

  const migrant =
    /migrant|immigre|immigré|etranger|étranger|titre de sejour|titre de séjour|visa|asile|sans papiers|situation irreguliere|situation irrégulière|nouvel arrivant/.test(q);

  const document =
    /document|courrier officiel|notification|lettre|papier/.test(q);

  return {
    entreprise,
    statut,
    nettoyage,
    emploi,
    logement,
    message,
    migrant,
    document
  };
}


/* =========================================================
   SÉLECTION DES SOURCES
========================================================= */

function selectSources(context) {

  const ids = [];

  if (context.entreprise) {
    ids.push("statut");
  }

  if (
    context.entreprise &&
    context.statut
  ) {
    ids.push("creation_ei");
    ids.push("guichet");
  }

  return unique(ids)
    .map(function(id) {
      return SOURCES[id];
    })
    .filter(Boolean);
}


/* =========================================================
   PREUVES
========================================================= */

function toutesLesPreuves(sources) {

  const result = [];

  (sources || []).forEach(
    function(source) {

      (source.preuves || []).forEach(
        function(preuve, index) {

          result.push({
            source_id: source.id,
            preuve_id:
              source.id + "_P" + (index + 1),
            texte: preuve
          });

        }
      );

    }
  );

  return result;
}


/* =========================================================
   INFORMATIONS CONFIRMÉES
========================================================= */

function buildConfirmedFacts(
  question,
  context,
  sources
) {

  const facts = [];

  if (
    context.entreprise &&
    sources.some(function(s) {
      return s.id === "statut";
    })
  ) {

    facts.push(
      "Le choix de la forme juridique peut être étudié en fonction de l'activité envisagée, du chiffre d'affaires estimé, des revenus, de la couverture sociale et de la gestion."
    );
  }

  if (
    context.entreprise &&
    context.statut &&
    sources.some(function(s) {
      return s.id === "creation_ei";
    })
  ) {

    facts.push(
      "Pour une entreprise individuelle, des formalités de déclaration ou d'immatriculation sont prévues."
    );

    facts.push(
      "Les formalités de création d'une entreprise individuelle sont réalisées par l'intermédiaire du Guichet des formalités des entreprises."
    );
  }

  return unique(facts);
}


/* =========================================================
   DOCUMENTS
========================================================= */

function buildDocuments(
  question,
  context
) {

  const documents = [];

  const q =
    question.toLowerCase();

  if (
    context.statut &&
    /entreprise individuelle|\bei\b|micro.?entreprise|micro.?entrepreneur/.test(q)
  ) {

    documents.push({
      statut: "à vérifier",
      texte:
        "Vérifier les justificatifs demandés pour la forme juridique et l'activité choisies."
    });

    documents.push({
      statut: "conditionnel",
      texte:
        "Si l'activité est réglementée, vérifier les éventuels justificatifs d'autorisation, diplôme ou titre."
    });
  }

  return documents;
}


/* =========================================================
   ACTIONS
========================================================= */

function buildActions(
  question,
  context
) {

  const actions = [];

  if (context.entreprise) {

    actions.push(
      "Décrire précisément l'activité et les prestations proposées."
    );
  }

  if (
    context.entreprise &&
    !context.statut
  ) {

    actions.push(
      "Comparer les formes juridiques possibles avant de choisir un statut."
    );
  }

  if (
    context.entreprise &&
    context.statut
  ) {

    actions.push(
      "Vérifier les formalités correspondant exactement à la forme juridique et à l'activité choisies."
    );
  }

  if (context.emploi) {

    actions.push(
      "Préciser le métier recherché, les compétences disponibles et les contraintes importantes."
    );
  }

  if (context.logement) {

    actions.push(
      "Préciser votre situation, votre budget et le type de logement recherché."
    );
  }

  return unique(actions);
}


/* =========================================================
   RECOMMANDATIONS
========================================================= */

function buildRecommendations(
  question,
  context
) {

  const recommendations = [];

  if (context.entreprise) {

    recommendations.push(
      "Décrire précisément l'activité avant de prendre une décision administrative ou juridique."
    );
  }

  if (
    context.entreprise &&
    !context.statut
  ) {

    recommendations.push(
      "Comparer les formes juridiques avant de retenir celle qui correspond au projet."
    );
  }

  if (
    context.entreprise &&
    context.statut
  ) {

    recommendations.push(
      "Vérifier les formalités officielles après avoir défini la forme juridique et la nature exacte de l'activité."
    );
  }

  return unique(recommendations);
}


/* =========================================================
   RISQUES
========================================================= */

function buildRisks() {
  return [];
}


/* =========================================================
   PROFESSIONNEL
========================================================= */

function buildProfessional() {
  return [];
}


/* =========================================================
   PROCHAINE ACTION
========================================================= */

function buildNextAction(
  question,
  context
) {

  if (
    context.entreprise &&
    !context.statut
  ) {

    return:
      "Préciser exactement l'activité et les prestations envisagées, puis comparer les formes juridiques adaptées.";
  }

  if (
    context.entreprise &&
    context.statut
  ) {

    return:
      "Vérifier les formalités officielles correspondant exactement à la forme juridique et à l'activité choisies.";
  }

  if (context.message) {

    return:
      "Vérifier que la réponse préparée correspond bien au contenu et au contexte du message.";
  }

  if (context.migrant) {

    return:
      "Préciser le pays, votre situation actuelle et votre objectif afin d'identifier la procédure ou l'orientation adaptée.";
  }

  return:
    "Préciser votre situation et votre objectif afin de déterminer la prochaine action utile.";
}


/* =========================================================
   IA — EXPLICATION
========================================================= */

function systemPrompt() {

  return `
Tu es GouRare AI.

Tu es une intelligence d'orientation et d'analyse multi-domaines.

Tu aides les particuliers, salariés, demandeurs d'emploi,
migrants, nouveaux arrivants, indépendants, entrepreneurs
et petites entreprises.

Tu peux expliquer une situation, structurer une demande,
analyser un message, aider à préparer une réponse et expliquer
un document ou une image.

IMPORTANT :

Tu ne prétends pas être :
- avocat
- expert-comptable
- médecin
- administration
- travailleur social.

RÈGLE ABSOLUE :

N'invente jamais :
- loi
- article
- obligation
- autorisation
- permis
- diplôme
- document
- délai
- montant
- taux
- seuil
- sanction
- statistique
- prix
- revenu
- économie.

Les informations confirmées sont déterminées par GouRare AI
à partir de preuves officielles.

Ton rôle est uniquement d'expliquer la situation.

Ne transforme jamais une possibilité en obligation.

Ne crée jamais une recommandation juridique non vérifiée.

Ne donne pas d'URL dans ton explication.

Les sources officielles sont affichées séparément.

Si une information n'est pas suffisamment établie,
dis qu'elle doit être vérifiée.

Pour une situation migratoire ou administrative :
reste strictement légal et prudent.
N'explique jamais comment contourner une loi,
falsifier un document, mentir à une administration,
éviter un contrôle ou faciliter une activité illégale.

Pour une situation irrégulière :
tu peux expliquer les voies légales possibles,
les autorités compétentes, les démarches à vérifier
et les droits applicables lorsque les informations sont établies.

Pour un message :
analyse uniquement le contenu fourni.

Pour une image :
ne prétends pas lire un texte qui est illisible.

Réponse claire, courte et utile.
`;
}


async function askAI(
  env,
  prompt,
  maxTokens
) {

  try {

    const response =
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
              content:
                texte(
                  prompt,
                  50000
                )
            }
          ],
          max_tokens:
            maxTokens || 900,
          temperature: 0.15
        }
      );

    if (
      typeof response === "string"
    ) {
      return response;
    }

    if (
      response &&
      typeof response.response === "string"
    ) {
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


/* =========================================================
   ORIENTATION
========================================================= */

function buildOrientation(
  question,
  context
) {

  if (context.message) {

    return (
      "Le contenu fourni doit d'abord être compris précisément afin de distinguer les faits, la demande, les éléments incertains et la réponse appropriée."
    );
  }

  if (
    context.entreprise &&
    context.nettoyage
  ) {

    return (
      "Pour un projet de nettoyage, il faut d'abord préciser exactement les prestations envisagées et déterminer la forme juridique adaptée. Les formalités doivent ensuite être vérifiées en fonction de ces éléments."
    );
  }

  if (context.entreprise) {

    return (
      "Pour un projet d'entreprise, il faut d'abord préciser l'activité et déterminer la forme juridique adaptée. Les formalités doivent ensuite être vérifiées selon la situation exacte."
    );
  }

  if (context.migrant) {

    return (
      "La situation doit être examinée selon le pays concerné, la situation administrative, l'objectif de la personne et les règles applicables. GouRare AI doit distinguer les informations établies des éléments qui nécessitent une vérification officielle."
    );
  }

  return (
    "GouRare AI analyse votre situation afin d'identifier les informations utiles, les éléments à vérifier et la prochaine action."
  );
}


/* =========================================================
   ANALYSE MESSAGE
========================================================= */

function messagePrompt(
  contenu,
  mode,
  langue
) {

  const instructions = {

    analyse:
      "Analyse le message : faits, demande, éléments importants, incertitudes et réponse possible.",

    reponse:
      "Prépare une réponse claire, polie et adaptée au message. N'invente aucun fait.",

    reformulation:
      "Réécris le message de façon plus claire, naturelle et professionnelle sans changer son sens.",

    correction:
      "Corrige les fautes et améliore légèrement la formulation sans changer le sens.",

    traduction:
      "Traduis fidèlement le contenu dans la langue demandée."
  };

  return `
Langue :
${langue || "français"}

Mode :
${instructions[mode] || instructions.analyse}

CONTENU :
---
${texte(contenu, 18000)}
---

Réponds de façon précise.
N'invente aucune information.
`;
}


/* =========================================================
   IMAGE
========================================================= */

async function analyserImage(
  env,
  image,
  demande
) {

  if (!image) {
    throw new Error("Image absente.");
  }

  if (
    image.length >
    LIMITS.image
  ) {
    throw new Error(
      "Image trop volumineuse."
    );
  }

  const response =
    await env.IA.run(
      MODEL_VISION,
      {
        messages: [
          {
            role: "system",
            content:
              "Tu es le module visuel de GouRare AI. Analyse uniquement ce qui est réellement visible ou lisible. Ne devine jamais un texte illisible."
          },
          {
            role: "user",
            content:
              demande ||
              "Analyse cette image avec précision. Si elle contient un document, une lettre, une notification ou un message, lis uniquement les éléments réellement visibles et explique leur contenu."
          }
        ],
        image: image,
        max_tokens: 2200,
        temperature: 0.1
      }
    );

  if (
    typeof response === "string"
  ) {
    return response;
  }

  if (
    response &&
    typeof response.response === "string"
  ) {
    return response.response;
  }

  if (
    response &&
    response.result &&
    typeof response.result.response === "string"
  ) {
    return response.result.response;
  }

  if (
    response &&
    typeof response.result === "string"
  ) {
    return response.result;
  }

  return JSON.stringify(response);
}


/* =========================================================
   AUDIO
========================================================= */

function base64FromDataURL(value) {

  const raw =
    texte(
      value,
      LIMITS.audio
    );

  if (!raw) {
    return "";
  }

  if (
    raw.startsWith("data:")
  ) {

    const index =
      raw.indexOf(",");

    if (index !== -1) {
      return raw.slice(
        index + 1
      );
    }
  }

  return raw;
}


async function transcrireAudio(
  env,
  audio,
  langue
) {

  if (!audio) {
    throw new Error(
      "Audio absent."
    );
  }

  if (
    audio.length >
    LIMITS.audio
  ) {
    throw new Error(
      "Audio trop volumineux."
    );
  }

  const base64 =
    base64FromDataURL(
      audio
    );

  const response =
    await env.IA.run(
      MODEL_AUDIO,
      {
        audio: base64,
        task: "transcribe",
        language:
          langue || "fr",
        vad_filter: true,
        condition_on_previous_text:
          false
      }
    );

  if (
    response &&
    typeof response.text === "string"
  ) {
    return texte(
      response.text,
      20000
    );
  }

  if (
    response &&
    response.transcription_info &&
    typeof response.transcription_info.text === "string"
  ) {
    return texte(
      response.transcription_info.text,
      20000
    );
  }

  return "";
}


/* =========================================================
   ANALYSE PRINCIPALE
========================================================= */

async function analyserQuestion(
  env,
  question,
  options
) {

  const q =
    texte(
      question,
      LIMITS.question
    );

  if (!q) {
    throw new Error(
      "Question vide."
    );
  }

  const context =
    detectContext(q);

  if (
    options &&
    options.messageMode
  ) {
    context.message = true;
  }

  const sources =
    selectSources(context);

  const preuves =
    toutesLesPreuves(sources);

  let orientation =
    buildOrientation(
      q,
      context
    );


  /* -------------------------------------------------------
     MODE MESSAGE
  ------------------------------------------------------- */

  if (
    options &&
    options.messageMode
  ) {

    const messageResult =
      await askAI(
        env,
        messagePrompt(
          q,
          options.messageMode,
          options.langue
        ),
        1200
      );

    if (messageResult) {

      orientation =
        messageResult;
    }
  }


  /* -------------------------------------------------------
     MODE NORMAL
  ------------------------------------------------------- */

  else {

    const explanation =
      await askAI(
        env,
        `
Question :
${q}

Contexte :
${JSON.stringify(context)}

Preuves officielles disponibles :
${JSON.stringify(preuves)}

Explique simplement la situation.

Ne crée aucune obligation.
Ne crée aucun document.
Ne crée aucun délai.
Ne crée aucun montant.
Ne crée aucune sanction.
Ne crée aucune autorisation.
Ne donne aucune URL.

Les informations confirmées seront affichées séparément.
`,
        850
      );

    if (explanation) {

      orientation =
        orientation +
        "\n\n" +
        texte(
          explanation,
          5000
        );
    }
  }


  const confirmed =
    buildConfirmedFacts(
      q,
      context,
      sources
    );

  const documents =
    buildDocuments(
      q,
      context
    );

  const actions =
    buildActions(
      q,
      context
    );

  const recommendations =
    buildRecommendations(
      q,
      context
    );

  const risks =
    buildRisks();

  const professional =
    buildProfessional();

  const nextAction =
    buildNextAction(
      q,
      context
    );


  return {

    success: true,

    version:
      VERSION,

    compris:
      context.message
        ? "Vous souhaitez analyser ou traiter un message ou un contenu fourni."
        : q,

    orientation,

    confirmed,

    toVerify:
      buildToVerify(
        q,
        context
      ),

    recommendations,

    actions,

    documents,

    risks,

    professional,

    nextAction,

    sources:
      sources.map(
        function(source) {

          return {
            id: source.id,
            titre: source.titre,
            organisme: source.organisme,
            url: source.url
          };
        }
      )
  };
}


/* =========================================================
   À VÉRIFIER
========================================================= */

function buildToVerify(
  question,
  context
) {

  const items = [];

  if (
    context.entreprise &&
    !context.statut
  ) {

    items.push(
      "La forme juridique la plus adaptée à votre projet."
    );
  }

  if (context.entreprise) {

    items.push(
      "La nature exacte de l'activité et des prestations."
    );
  }

  if (context.migrant) {

    items.push(
      "Les règles applicables à votre situation administrative exacte."
    );
  }

  if (context.emploi) {

    items.push(
      "Les conditions précises de l'offre ou du métier recherché."
    );
  }

  return unique(items);
}


/* =========================================================
   PAGE HTML
========================================================= */

function pageHTML() {

  const parcoursJSON =
    JSON.stringify(PARCOURS)
      .replace(
        /</g,
        "\\u003c"
      );

  return `
<!doctype html>

<html lang="fr">

<head>

<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
/>

<meta
  name="theme-color"
  content="#111827"
/>

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
    Roboto,
    Arial,
    sans-serif;
  background: #f4f6f8;
  color: #111827;
}

header {
  background: #111827;
  color: white;
  text-align: center;
  padding: 28px 18px;
}

header h1 {
  margin: 0 0 8px;
  font-size: 32px;
}

header p {
  margin: 0;
  opacity: .85;
}

.container {
  max-width: 950px;
  margin: 25px auto;
  padding: 0 15px 100px;
}

.card {
  background: white;
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 18px;
  box-shadow:
    0 8px 30px rgba(0,0,0,.07);
}

.welcome-title {
  text-align: center;
  margin-bottom: 22px;
}

.welcome-title h2 {
  margin-bottom: 8px;
}

.welcome-title p {
  color: #6b7280;
}

.profiles {
  display: grid;
  grid-template-columns: repeat(2,1fr);
  gap: 15px;
}

.profile {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: .15s;
}

.profile:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 20px rgba(0,0,0,.08);
}

.profile .icon {
  font-size: 34px;
  margin-bottom: 8px;
}

.profile h3 {
  margin: 0 0 8px;
}

.profile p {
  margin: 0;
  color: #6b7280;
  line-height: 1.5;
}

#situations,
#outil {
  display: none;
}

.situation-grid {
  display: grid;
  grid-template-columns: repeat(2,1fr);
  gap: 12px;
}

.situation {
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 13px;
  padding: 15px;
  cursor: pointer;
  text-align: left;
  font-size: 15px;
}

.situation:hover {
  background: #f3f4f6;
}

textarea {
  width: 100%;
  min-height: 150px;
  resize: vertical;
  padding: 15px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 16px;
  outline: none;
}

textarea:focus {
  border-color: #111827;
}

input[type=text],
select {
  width: 100%;
  padding: 12px;
  margin-top: 8px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: white;
}

input[type=file] {
  width: 100%;
  margin-top: 10px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

button {
  border: 0;
  border-radius: 11px;
  padding: 12px 16px;
  font-size: 15px;
  cursor: pointer;
  background: #111827;
  color: white;
}

button.secondary {
  background: #e5e7eb;
  color: #111827;
}

button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.status {
  margin-top: 10px;
  color: #4b5563;
}

.result-card {
  background: white;
  border-radius: 16px;
  padding: 18px;
  margin-top: 16px;
  border-left: 5px solid #111827;
}

.result-card h2 {
  margin-top: 0;
}

.result-block {
  margin-top: 16px;
}

.result-block ul {
  padding-left: 22px;
}

.ai-result {
  white-space: pre-wrap;
  line-height: 1.65;
}

.source {
  margin: 8px 0;
  padding: 10px;
  background: #f3f4f6;
  border-radius: 10px;
}

.source a {
  color: #111827;
  font-weight: 600;
}

.cancer {
  position: fixed;
  right: 12px;
  bottom: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  padding: 10px 13px;
  border-radius: 999px;
  box-shadow:
    0 5px 20px rgba(0,0,0,.12);
  font-size: 13px;
  z-index: 20;
}

footer {
  text-align: center;
  color: #6b7280;
  padding: 25px 10px;
}

.hidden {
  display: none;
}

@media(max-width:650px) {

  header h1 {
    font-size: 27px;
  }

  .profiles,
  .situation-grid {
    grid-template-columns: 1fr;
  }

  button {
    width: 100%;
  }
}

</style>

</head>

<body>

<header>

<h1>GouRare AI</h1>

<p>
Intelligence, orientation et solutions
</p>

</header>

<div class="container">

<div id="welcome">

<div class="card">

<div class="welcome-title">

<h2>
👋 Bienvenue sur GouRare AI
</h2>

<p>
Choisissez directement votre situation.
</p>

</div>

<div class="profiles">

<div
  class="profile"
  data-profile="migrant"
>

<div class="icon">🌍</div>

<h3>
Migrant / Nouveau arrivant
</h3>

<p>
Situation administrative,
travail, logement, droits
et démarches.
</p>

</div>


<div
  class="profile"
  data-profile="particulier"
>

<div class="icon">👤</div>

<h3>
Particulier / Résident
</h3>

<p>
Vie quotidienne, démarches,
droits et problèmes.
</p>

</div>


<div
  class="profile"
  data-profile="emploi"
>

<div class="icon">💼</div>

<h3>
Chercheur d'emploi
</h3>

<p>
Offres, CV, candidatures,
entretiens et emploi.
</p>

</div>


<div
  class="profile"
  data-profile="entreprise"
>

<div class="icon">🏢</div>

<h3>
Entreprise / Entrepreneur
</h3>

<p>
Création, gestion,
développement et opportunités.
</p>

</div>

</div>

</div>

<div class="card">

<button
  id="unknown"
  class="secondary"
>
✨ Je ne sais pas où aller — GouRare AI m'oriente
</button>

</div>

</div>


<div id="situations">

<div class="card">

<button
  id="backHome"
  class="secondary"
>
← Retour
</button>

<h2 id="situationTitle">
Votre situation
</h2>

<p id="situationDescription"></p>

<div
  id="situationGrid"
  class="situation-grid"
></div>

</div>

</div>


<div id="outil">

<div class="card">

<button
  id="backSituation"
  class="secondary"
>
← Retour aux situations
</button>

<h2 id="outilTitle">
Votre demande
</h2>

<textarea
  id="question"
  placeholder="Expliquez votre situation ou votre demande..."
></textarea>

<div class="actions">

<button id="analyser">
Analyser
</button>

<button
  id="micro"
  class="secondary"
>
🎙️ Parler
</button>

<button
  id="photo"
  class="secondary"
>
📷 Analyser une image
</button>

</div>

<div
  id="status"
  class="status"
></div>

<input
  id="imageInput"
  type="file"
  accept="image/*"
  capture="environment"
  class="hidden"
/>

</div>


<div class="card">

<h2>
✉️ Messages et emails
</h2>

<select id="messageMode">

<option value="">
Mode normal
</option>

<option value="analyse">
🔎 Analyser le message
</option>

<option value="reponse">
✍️ Préparer une réponse
</option>

<option value="reformulation">
📝 Reformuler
</option>

<option value="correction">
✅ Corriger
</option>

<option value="traduction">
🌍 Traduire
</option>

</select>

<input
  id="langue"
  type="text"
  placeholder="Langue souhaitée pour une traduction"
/>

</div>

<div id="result"></div>

</div>

</div>


<div class="cancer">
🎗️ Avec vous contre le cancer
</div>

<footer>

🎗️ Notre soutien aux personnes touchées par le cancer.

<br><br>

GouRare AI — Version ${VERSION}

</footer>


<script>

const parcours =
${parcoursJSON};

let profilActuel = null;

const welcome =
document.getElementById("welcome");

const situations =
document.getElementById("situations");

const outil =
document.getElementById("outil");

const situationTitle =
document.getElementById("situationTitle");

const situationDescription =
document.getElementById("situationDescription");

const situationGrid =
document.getElementById("situationGrid");

const outilTitle =
document.getElementById("outilTitle");

const backHome =
document.getElementById("backHome");

const backSituation =
document.getElementById("backSituation");

const unknown =
document.getElementById("unknown");

const question =
document.getElementById("question");

const analyser =
document.getElementById("analyser");

const micro =
document.getElementById("micro");

const photo =
document.getElementById("photo");

const imageInput =
document.getElementById("imageInput");

const result =
document.getElementById("result");

const status =
document.getElementById("status");

const messageMode =
document.getElementById("messageMode");

const langue =
document.getElementById("langue");


document
.querySelectorAll(".profile")
.forEach(function(profile) {

  profile.addEventListener(
    "click",
    function() {

      ouvrirSituations(
        profile.dataset.profile
      );

    }
  );

});


function ouvrirSituations(nom) {

  const profil =
    parcours[nom];

  if (!profil) {
    return;
  }

  profilActuel =
    nom;

  welcome.style.display =
    "none";

  outil.style.display =
    "none";

  situations.style.display =
    "block";

  situationTitle.textContent =
    profil.titre;

  situationDescription.textContent =
    profil.description;

  situationGrid.innerHTML =
    "";

  profil.situations.forEach(
    function(item) {

      const bouton =
        document.createElement(
          "button"
        );

      bouton.className =
        "situation";

      bouton.textContent =
        item[1];

      bouton.addEventListener(
        "click",
        function() {

          ouvrirOutil(
            item[0],
            item[1]
          );

        }
      );

      situationGrid.appendChild(
        bouton
      );

    }
  );
}


unknown.addEventListener(
  "click",
  function() {

    ouvrirOutil(
      "orientation",
      "✨ GouRare AI vous oriente"
    );

  }
);


backHome.addEventListener(
  "click",
  function() {

    situations.style.display =
      "none";

    outil.style.display =
      "none";

    welcome.style.display =
      "block";

  }
);


function ouvrirOutil(
  situation,
  titre
) {

  situations.style.display =
    "none";

  welcome.style.display =
    "none";

  outil.style.display =
    "block";

  outilTitle.textContent =
    titre;

  question.value =
    "";

  result.innerHTML =
    "";

  status.textContent =
    "";

  if (
    situation === "message" ||
    situation === "document"
  ) {

    messageMode.value =
      "analyse";

  } else {

    messageMode.value =
      "";
  }

  question.focus();
}


backSituation.addEventListener(
  "click",
  function() {

    outil.style.display =
      "none";

    situations.style.display =
      "block";

  }
);


function escapeHTML(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function liste(items) {

  if (
    !items ||
    !items.length
  ) {

    return "<p>Aucun élément précis à présenter à ce stade.</p>";

  }

  return (
    "<ul>" +
    items.map(
      function(item) {

        let value = item;

        if (
          item &&
          typeof item === "object"
        ) {

          value =
            item.texte ||
            item.value ||
            JSON.stringify(item);

        }

        return (
          "<li>" +
          escapeHTML(value) +
          "</li>"
        );

      }
    ).join("") +
    "</ul>"
  );
}


function afficher(data) {

  let html = "";

  html +=
    '<div class="result-card">' +
    "<h2>🧭 Ce que j'ai compris</h2>" +
    '<div class="ai-result">' +
    escapeHTML(data.compris) +
    "</div>" +
    "</div>";

  html +=
    '<div class="result-card">' +
    "<h2>💡 Orientation</h2>" +
    '<div class="ai-result">' +
    escapeHTML(data.orientation) +
    "</div>" +
    "</div>";

  html +=
    '<div class="result-card result-block">' +
    "<h2>✅ Informations confirmées</h2>" +
    liste(data.confirmed) +
    "</div>";

  html +=
    '<div class="result-card result-block">' +
    "<h2>🔎 À vérifier</h2>" +
    liste(data.toVerify) +
    "</div>";

  html +=
    '<div class="result-card result-block">' +
    "<h2>💭 Recommandations</h2>" +
    liste(data.recommendations) +
    "</div>";

  html +=
    '<div class="result-card result-block">' +
    "<h2>📋 Actions concrètes</h2>" +
    liste(data.actions) +
    "</div>";

  html +=
    '<div class="result-card result-block">' +
    "<h2>📄 Documents</h2>";

  if (
    data.documents &&
    data.documents.length
  ) {

    html += "<ul>";

    data.documents.forEach(
      function(doc) {

        html +=
          "<li><strong>" +
          escapeHTML(
            doc.statut
          ) +
          "</strong> — " +
          escapeHTML(
            doc.texte
          ) +
          "</li>";

      }
    );

    html += "</ul>";

  } else {

    html +=
      "<p>Aucun document précis à présenter à ce stade.</p>";
  }

  html += "</div>";


  if (
    data.risks &&
    data.risks.length
  ) {

    html +=
      '<div class="result-card">' +
      "<h2>⚠️ Points de vigilance</h2>" +
      liste(data.risks) +
      "</div>";

  }


  if (
    data.professional &&
    data.professional.length
  ) {

    html +=
      '<div class="result-card">' +
      "<h2>👤 Professionnel</h2>" +
      liste(data.professional) +
      "</div>";

  }


  html +=
    '<div class="result-card">' +
    "<h2>🚀 Prochaine action</h2>" +
    '<div class="ai-result">' +
    escapeHTML(
      data.nextAction
    ) +
    "</div>" +
    "</div>";


  html +=
    '<div class="result-card">' +
    "<h2>📚 Sources consultées</h2>";

  if (
    data.sources &&
    data.sources.length
  ) {

    data.sources.forEach(
      function(source) {

        html +=
          '<div class="source">' +
          "<strong>" +
          escapeHTML(
            source.organisme
          ) +
          "</strong> — " +
          escapeHTML(
            source.titre
          ) +
          "<br>" +
          '<a href="' +
          escapeHTML(
            source.url
          ) +
          '" target="_blank" rel="noopener noreferrer">' +
          "Consulter la source officielle ↗" +
          "</a>" +
          "</div>";

      }
    );

  } else {

    html +=
      "<p>Aucune source officielle spécifique utilisée.</p>";
  }

  html += "</div>";

  result.innerHTML =
    html;
}


async function analyserTexte() {

  const q =
    question.value.trim();

  if (!q) {

    status.textContent =
      "Veuillez écrire ou dire votre demande.";

    return;
  }

  analyser.disabled =
    true;

  micro.disabled =
    true;

  photo.disabled =
    true;

  status.textContent =
    "Analyse en cours...";

  result.innerHTML =
    "";

  try {

    const mode =
      messageMode.value;

    const response =
      await fetch(
        "/api/analyze",
        {
          method: "POST",

          headers: {
            "content-type":
              "application/json"
          },

          body:
            JSON.stringify({
              type:
                mode
                  ? "message"
                  : "question",

              question:
                q,

              messageMode:
                mode || null,

              langue:
                langue.value.trim()
            })
        }
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {

      throw new Error(
        data.error ||
        "Erreur pendant l'analyse."
      );
    }

    afficher(data);

    status.textContent =
      "Analyse terminée.";

  } catch (error) {

    status.textContent =
      error.message ||
      "Une erreur est survenue.";

  } finally {

    analyser.disabled =
      false;

    micro.disabled =
      false;

    photo.disabled =
      false;
  }
}


analyser.addEventListener(
  "click",
  analyserTexte
);


/* =========================================================
   MICROPHONE
========================================================= */

let mediaRecorder = null;
let audioChunks = [];
let enregistrement = false;


micro.addEventListener(
  "click",
  async function() {

    if (
      enregistrement &&
      mediaRecorder
    ) {

      mediaRecorder.stop();

      return;
    }

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {

      status.textContent =
        "Le microphone n'est pas disponible.";

      return;
    }

    try {

      const stream =
        await navigator.mediaDevices
          .getUserMedia({
            audio: true
          });

      audioChunks = [];

      mediaRecorder =
        new MediaRecorder(
          stream
        );

      enregistrement =
        true;

      micro.textContent =
        "⏹️ Arrêter";

      status.textContent =
        "🎙️ Je vous écoute...";

      mediaRecorder.ondataavailable =
        function(event) {

          if (
            event.data &&
            event.data.size > 0
          ) {

            audioChunks.push(
              event.data
            );
          }
        };


      mediaRecorder.onstop =
        async function() {

          enregistrement =
            false;

          micro.textContent =
            "🎙️ Parler";

          stream
            .getTracks()
            .forEach(
              function(track) {
                track.stop();
              }
            );

          try {

            const blob =
              new Blob(
                audioChunks,
                {
                  type:
                    mediaRecorder.mimeType ||
                    "audio/webm"
                }
              );

            const reader =
              new FileReader();

            reader.onloadend =
              async function() {

                try {

                  status.textContent =
                    "Conversion de la voix...";

                  const response =
                    await fetch(
                      "/api/transcribe",
                      {
                        method: "POST",

                        headers: {
                          "content-type":
                            "application/json"
                        },

                        body:
                          JSON.stringify({
                            audio:
                              reader.result,

                            langue:
                              "fr"
                          })
                      }
                    );

                  const data =
                    await response.json();

                  if (
                    !response.ok ||
                    !data.success
                  ) {

                    throw new Error(
                      data.error ||
                      "Impossible de transcrire l'audio."
                    );
                  }

                  question.value =
                    data.text || "";

                  await analyserTexte();

                } catch (error) {

                  status.textContent =
                    error.message ||
                    "Erreur audio.";
                }
              };

            reader.readAsDataURL(
              blob
            );

          } catch (error) {

            status.textContent =
              "Impossible de préparer l'enregistrement.";
          }
        };

      mediaRecorder.start();

    } catch (error) {

      status.textContent =
        "L'accès au microphone a été refusé ou est indisponible.";
    }
  }
);


/* =========================================================
   IMAGE
========================================================= */

photo.addEventListener(
  "click",
  function() {

    imageInput.click();

  }
);


imageInput.addEventListener(
  "change",
  async function() {

    const file =
      imageInput.files &&
      imageInput.files[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {

      status.textContent =
        "Veuillez sélectionner une image.";

      return;
    }

    if (
      file.size > 5500000
    ) {

      status.textContent =
        "Image trop volumineuse.";

      return;
    }

    analyser.disabled =
      true;

    micro.disabled =
      true;

    photo.disabled =
      true;

    status.textContent =
      "📷 Analyse de l'image...";

    try {

      const reader =
        new FileReader();

      reader.onloadend =
        async function() {

          try {

            const response =
              await fetch(
                "/api/image",
                {
                  method: "POST",

                  headers: {
                    "content-type":
                      "application/json"
                  },

                  body:
                    JSON.stringify({
                      image:
                        reader.result,

                      demande:
                        question.value.trim()
                    })
                }
              );

            const data =
              await response.json();

            if (
              !response.ok ||
              !data.success
            ) {

              throw new Error(
                data.error ||
                "Impossible d'analyser l'image."
              );
            }

            question.value =
              data.texte || "";

            await analyserTexte();

          } catch (error) {

            status.textContent =
              error.message ||
              "Erreur image.";

          } finally {

            analyser.disabled =
              false;

            micro.disabled =
              false;

            photo.disabled =
              false;
          }
        };

      reader.readAsDataURL(
        file
      );

    } catch (error) {

      analyser.disabled =
        false;

      micro.disabled =
        false;

      photo.disabled =
        false;

      status.textContent =
        "Impossible de lire cette image.";
    }
  }
);

</script>

</body>

</html>
`;
}


/* =========================================================
   API ANALYSE
========================================================= */

async function handleAnalyze(
  request,
  env
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

  let body;

  try {

    body =
      await request.json();

  } catch (error) {

    return jsonResponse(
      {
        success: false,
        error:
          "JSON invalide."
      },
      400
    );
  }

  try {

    const data =
      await analyserQuestion(
        env,
        body.question,
        {
          messageMode:
            texte(
              body.messageMode,
              30
            ),

          langue:
            texte(
              body.langue,
              80
            )
        }
      );

    return jsonResponse(
      data,
      200
    );

  } catch (error) {

    return jsonResponse(
      {
        success: false,
        error:
          error.message ||
          "Erreur pendant l'analyse."
      },
      500
    );
  }
}


/* =========================================================
   API IMAGE
========================================================= */

async function handleImage(
  request,
  env
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

  let body;

  try {

    body =
      await request.json();

  } catch (error) {

    return jsonResponse(
      {
        success: false,
        error:
          "JSON invalide."
      },
      400
    );
  }

  try {

    const image =
      texte(
        body.image,
        LIMITS.image
      );

    const demande =
      texte(
        body.demande,
        4000
      );

    const analyse =
      await analyserImage(
        env,
        image,
        demande
      );

    return jsonResponse(
      {
        success: true,
        texte:
          analyse
      },
      200
    );

  } catch (error) {

    return jsonResponse(
      {
        success: false,
        error:
          error.message ||
          "Erreur pendant l'analyse de l'image."
      },
      500
    );
  }
}


/* =========================================================
   API AUDIO
========================================================= */

async function handleTranscribe(
  request,
  env
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

  let body;

  try {

    body =
      await request.json();

  } catch (error) {

    return jsonResponse(
      {
        success: false,
        error:
          "JSON invalide."
      },
      400
    );
  }

  try {

    const transcription =
      await transcrireAudio(
        env,
        texte(
          body.audio,
          LIMITS.audio
        ),
        texte(
          body.langue || "fr",
          20
        )
      );

    if (!transcription) {

      return jsonResponse(
        {
          success: false,
          error:
            "Aucun texte n'a pu être extrait de l'audio."
        },
        422
      );
    }

    return jsonResponse(
      {
        success: true,
        text:
          transcription
      },
      200
    );

  } catch (error) {

    return jsonResponse(
      {
        success: false,
        error:
          error.message ||
          "Erreur pendant la transcription."
      },
      500
    );
  }
}


/* =========================================================
   HEALTH
========================================================= */

function handleHealth() {

  return jsonResponse(
    {
      success: true,
      service:
        "GouRare AI",
      status:
        "OK",
      version:
        VERSION
    },
    200
  );
}


/* =========================================================
   ROUTEUR PRINCIPAL
========================================================= */

export default {

  async fetch(
    request,
    env
  ) {

    const url =
      new URL(
        request.url
      );

    let response;


    if (
      url.pathname === "/" &&
      request.method === "GET"
    ) {

      response =
        new Response(
          pageHTML(),
          {
            status: 200,
            headers: {
              "content-type":
                "text/html; charset=utf-8",
              "cache-control":
                "no-store"
            }
          }
        );

    }

    else if (
      url.pathname === "/health"
    ) {

      response =
        handleHealth();

    }

    else if (
      url.pathname === "/api/analyze"
    ) {

      response =
        await handleAnalyze(
          request,
          env
        );

    }

    else if (
      url.pathname === "/api/image"
    ) {

      response =
        await handleImage(
          request,
          env
        );

    }

    else if (
      url.pathname === "/api/transcribe"
    ) {

      response =
        await handleTranscribe(
          request,
          env
        );

    }

    else {

      response =
        jsonResponse(
          {
            success: false,
            error:
              "Route introuvable."
          },
          404
        );
    }


    const headers =
      new Headers(
        response.headers
      );

    const security =
      securityHeaders();

    Object.keys(
      security
    ).forEach(
      function(key) {

        headers.set(
          key,
          security[key]
        );

      }
    );


    return new Response(
      response.body,
      {
        status:
          response.status,

        statusText:
          response.statusText,

        headers
      }
    );
  }
};
