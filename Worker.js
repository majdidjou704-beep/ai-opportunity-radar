const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const MODEL_VISION = "@cf/meta/llama-3.2-11b-vision-instruct";
const MODEL_AUDIO = "@cf/openai/whisper-large-v3-turbo";

const VERSION = "8.2";

const LIMITS = {
  question: 12000,
  image: 7000000,
  audio: 12000000
};

const SOURCES = {
  statut: {
    id: "statut",
    titre: "Trouver le statut juridique adapté à son activité",
    organisme: "Service Public Entreprendre",
    url: "https://entreprendre.service-public.fr/vosdroits/R18323",
    preuves: [
      "Le simulateur permet de trouver le statut juridique adapté à son activité.",
      "Pour utiliser le simulateur, il faut notamment renseigner l'activité envisagée et une estimation du chiffre d'affaires.",
      "Le simulateur permet de connaître les formes juridiques possibles pour l'activité.",
      "Le simulateur permet de comparer notamment les revenus, la couverture sociale ainsi que la gestion comptable et juridique."
    ]
  },

  creation_ei: {
    id: "creation_ei",
    titre: "Création d'une entreprise individuelle",
    organisme: "Service Public Entreprendre",
    url: "https://entreprendre.service-public.fr/vosdroits/F36763",
    preuves: [
      "La création d'une entreprise individuelle comporte notamment une formalité d'immatriculation et une déclaration d'activité.",
      "La demande d'immatriculation d'une entreprise individuelle se fait sur le Guichet des formalités des entreprises.",
      "Après son immatriculation, l'entreprise individuelle est inscrite au Registre national des entreprises.",
      "Le registre d'inscription dépend de la nature de l'activité exercée.",
      "Pour une entreprise individuelle commerciale, l'inscription concerne notamment le Registre national des entreprises et le Registre du commerce et des sociétés.",
      "Une activité réglementée peut nécessiter des justificatifs particuliers, notamment une autorisation, un diplôme ou un titre."
    ]
  },

  guichet: {
    id: "guichet",
    titre: "Formalités d'immatriculation des entreprises",
    organisme: "Service Public Entreprendre",
    url: "https://entreprendre.service-public.fr/vosdroits/F23571",
    preuves: [
      "Les formalités de création d'une entreprise sont réalisées par l'intermédiaire du Guichet des formalités des entreprises."
    ]
  }
};


/* =========================================================
   OUTILS DE BASE
========================================================= */

function texte(value, max = 10000) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/\u0000/g, "")
    .replace(/\r/g, "")
    .trim()
    .slice(0, max);
}

function unique(items) {
  return [...new Set((items || []).filter(Boolean))];
}

function escapeHTML(value) {
  return texte(value, 50000)
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
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function securityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(self), microphone=(self), geolocation=()",
    "Cache-Control": "no-store"
  };
}


/* =========================================================
   PARCOURS D'ACCUEIL V8.2
========================================================= */

const PARCOURS = {

  migrant: {
    titre: "🌍 Migrant / Nouveau arrivant",
    description:
      "Situation administrative, travail, logement, droits et démarches.",

    situations: [
      ["arrive", "🆕 Je viens d'arriver"],
      ["administratif", "🪪 Ma situation administrative"],
      ["emploi", "💼 Je cherche un emploi"],
      ["logement", "🏠 Je cherche un logement"],
      ["document", "📄 Je ne comprends pas un document"],
      ["droits", "⚖️ Je veux connaître mes droits"],
      ["social", "🤝 Je cherche une aide sociale"],
      ["etudes", "🎓 Je veux étudier"],
      ["famille", "👨‍👩‍👧 Famille / regroupement familial"],
      ["asile", "🛂 Asile / protection"],
      ["irreguliere", "❓ Situation irrégulière"],
      ["autre", "❓ Autre situation"]
    ]
  },

  particulier: {
    titre: "👤 Particulier / Résident",
    description:
      "Vie quotidienne, droits, démarches et problèmes personnels.",

    situations: [
      ["administratif", "🧾 Démarches administratives"],
      ["emploi", "💼 Travail / emploi"],
      ["logement", "🏠 Logement"],
      ["finance", "💰 Impôts / finances"],
      ["social", "🤝 Aides sociales"],
      ["juridique", "⚖️ Droits / problème juridique"],
      ["message", "✉️ Lettre / email / message"],
      ["document", "📷 Comprendre un document"],
      ["opportunite", "🎯 Trouver une opportunité"],
      ["autre", "❓ Autre"]
    ]
  },

  emploi: {
    titre: "💼 Chercheur d'emploi",
    description:
      "Recherche d'emploi, candidature, CV et entretien.",

    situations: [
      ["offres", "🔎 Trouver des offres"],
      ["cv", "📄 Créer / améliorer mon CV"],
      ["candidature", "✉️ Candidature / lettre de motivation"],
      ["annonce", "📩 Répondre à une annonce"],
      ["entretien", "🎤 Préparer un entretien"],
      ["entreprise", "🏢 Trouver une entreprise"],
      ["adapte", "♿ Rechercher un emploi adapté à ma situation"],
      ["comparaison", "🎯 Comparer plusieurs offres"],
      ["autre", "❓ Autre"]
    ]
  },

  entreprise: {
    titre: "🏢 Entreprise / Entrepreneur",
    description:
      "Créer, gérer, développer et trouver des opportunités.",

    situations: [
      ["creation", "🚀 Créer mon entreprise"],
      ["developpement", "📈 Développer mon activité"],
      ["fiscalite", "💰 Fiscalité"],
      ["comptabilite", "🧾 Comptabilité / obligations"],
      ["salaries", "👥 Salariés"],
      ["juridique", "⚖️ Problème juridique"],
      ["fournisseurs", "🔎 Trouver des fournisseurs"],
      ["offres", "💶 Comparer des offres / prix"],
      ["opportunite", "🎯 Trouver des opportunités"],
      ["ia", "🤖 Trouver une solution IA"],
      ["autre", "❓ Autre"]
    ]
  }
};


/* =========================================================
   CONTEXTE
========================================================= */

function detectContext(question) {

  const q = texte(question, LIMITS.question).toLowerCase();

  return {

    nettoyage:
      /nettoyage|ménage|menage|propreté|proprete|cleaning/.test(q),

    entreprise:
      /créer|creer|création|creation|lancer|ouvrir|entreprise|société|societe|activité|activite/.test(q),

    statut:
      /statut|forme juridique|micro|micro-entreprise|microentreprise|indépendant|independant|ei|entreprise individuelle/.test(q),

    travail:
      /travail|emploi|salarié|salarie|contrat|employeur|licenciement|salaire/.test(q),

    social:
      /caf|rsa|aide|social|allocation|droits sociaux/.test(q),

    administratif:
      /démarche|demarche|administratif|administrative|préfecture|prefecture|mairie|document officiel/.test(q),

    juridique:
      /avocat|juridique|justice|tribunal|loi|légal|legal|mise en demeure/.test(q),

    fiscalite:
      /impôt|impot|fiscal|fiscalité|fiscalite|urssaf|tva|cfe|cotisation/.test(q),

    message: false
  };
}


/* =========================================================
   SOURCES
========================================================= */

function selectSources(contexte) {

  const ids = [];

  if (contexte.entreprise || contexte.statut) {
    ids.push("statut");
  }

  if (contexte.entreprise && contexte.statut) {
    ids.push("creation_ei");
  }

  if (contexte.entreprise) {
    ids.push("guichet");
  }

  return unique(ids).map(function(id) {
    return SOURCES[id];
  });
}
/* =========================================================
   INFORMATIONS CONFIRMÉES
========================================================= */

function buildConfirmedFacts(question, contexte, sources) {

  const facts = [];

  if (
    contexte.entreprise &&
    sources.some(function(source) {
      return source.id === "statut";
    })
  ) {
    facts.push(
      "Le choix de la forme juridique peut être étudié en fonction de l'activité envisagée, du chiffre d'affaires estimé, des revenus, de la couverture sociale et de la gestion."
    );
  }

  if (
    contexte.statut &&
    /entreprise individuelle|\bei\b|micro|micro-entreprise|microentreprise/.test(
      question.toLowerCase()
    ) &&
    sources.some(function(source) {
      return source.id === "creation_ei";
    })
  ) {

    facts.push(
      "Pour une entreprise individuelle, certaines formalités d'immatriculation et de déclaration d'activité sont prévues."
    );

    facts.push(
      "La demande d'immatriculation d'une entreprise individuelle se fait sur le Guichet des formalités des entreprises."
    );
  }

  return unique(facts);
}


/* =========================================================
   DOCUMENTS
========================================================= */

function buildDocuments(question, contexte) {

  const documents = [];

  const q = question.toLowerCase();

  if (
    contexte.statut &&
    /entreprise individuelle|\bei\b|micro|micro-entreprise|microentreprise/.test(
      q
    )
  ) {

    documents.push({
      statut: "à vérifier",
      texte:
        "Vérifier les justificatifs demandés pour la forme juridique choisie."
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
   ACTIONS CONCRÈTES
========================================================= */

function buildActions(question, contexte) {

  const actions = [];

  if (contexte.entreprise) {

    actions.push(
      "Décrire précisément les prestations ou produits proposés."
    );
  }

  if (
    contexte.entreprise &&
    !contexte.statut
  ) {

    actions.push(
      "Comparer les formes juridiques possibles avant de choisir un statut."
    );
  }

  if (
    contexte.entreprise &&
    contexte.statut
  ) {

    actions.push(
      "Vérifier les formalités correspondant exactement à la forme juridique et à l'activité choisies."
    );
  }

  return unique(actions);
}


/* =========================================================
   RECOMMANDATIONS
========================================================= */

function buildRecommendations(question, contexte) {

  const recommendations = [];

  if (contexte.entreprise) {

    recommendations.push(
      "Décrire précisément l'activité avant de prendre une décision administrative ou juridique."
    );
  }

  if (
    contexte.entreprise &&
    !contexte.statut
  ) {

    recommendations.push(
      "Comparer les formes juridiques avant de retenir celle qui correspond au projet."
    );
  }

  if (
    contexte.entreprise &&
    contexte.statut
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

  /*
   * Aucun risque juridique n'est inventé.
   * Les risques seront ajoutés uniquement lorsqu'une
   * source officielle les justifie.
   */

  return [];
}


/* =========================================================
   PROFESSIONNEL
========================================================= */

function buildProfessional(question, contexte) {

  /*
   * Aucun professionnel n'est recommandé automatiquement.
   * Une future version pourra orienter vers le professionnel
   * approprié lorsque la situation le justifie.
   */

  return [];
}


/* =========================================================
   PROCHAINE ACTION
========================================================= */

function buildNextAction(question, contexte) {

  if (
    contexte.entreprise &&
    !contexte.statut
  ) {

    return (
      "Préciser exactement l'activité et les prestations envisagées, puis comparer les formes juridiques adaptées."
    );
  }

  if (
    contexte.entreprise &&
    contexte.statut
  ) {

    return (
      "Vérifier les formalités officielles correspondant exactement à la forme juridique et à l'activité choisies."
    );
  }

  if (contexte.message) {

    return (
      "Vérifier que le projet de réponse correspond bien au contenu et au contexte du message reçu."
    );
  }

  return (
    "Préciser votre situation et votre objectif afin de déterminer la prochaine action utile."
  );
}


/* =========================================================
   IA — EXPLICATION UNIQUEMENT
========================================================= */

function systemPrompt() {

  return `
Tu es GouRare AI.

Tu es un assistant d'orientation, d'analyse et d'aide à la décision.

Tu peux aider :
- les citoyens
- les salariés
- les demandeurs d'emploi
- les indépendants
- les entrepreneurs
- les petites entreprises
- les personnes confrontées à des démarches administratives
- les personnes qui reçoivent des messages, courriers ou emails.

IMPORTANT :

Tu n'es pas :
- avocat
- expert-comptable
- médecin
- administration
- travailleur social.

RÈGLE ABSOLUE :

Ne jamais inventer :
- loi
- article
- taux
- montant
- seuil
- délai
- sanction
- obligation
- autorisation
- diplôme
- document
- chiffre
- statistique
- revenu
- économie
- prix.

Les informations officielles fournies par le moteur de vérité sont prioritaires.

Ton rôle est principalement d'expliquer et de structurer la situation.

Tu ne dois pas créer de nouvelles obligations.

Tu ne dois pas transformer une hypothèse en fait.

Tu ne dois pas présenter une recommandation personnelle comme une obligation légale.

Ne répète pas les URL des sources dans ton explication.
Les sources sont affichées séparément par GouRare AI.

Pour une analyse de message :
- distingue les faits ;
- distingue la demande ;
- distingue l'interprétation ;
- distingue les éléments incertains ;
- n'invente jamais l'intention de l'expéditeur.

Pour une réponse à un message :
- respecte le contexte ;
- reste poli ;
- ne crée aucun fait absent du contenu ;
- n'ajoute aucun engagement juridique non demandé ;
- si une information manque, formule une réponse prudente.

Pour une reformulation :
- conserve le sens ;
- améliore uniquement la clarté ;
- améliore le ton ;
- améliore la structure.

Pour une correction :
- corrige les fautes ;
- conserve le sens ;
- ne transforme pas le contenu.

Pour une traduction :
- traduis fidèlement ;
- ne rajoute pas d'information.

Pour une image :
- analyse uniquement ce qui est réellement visible ou lisible ;
- si une partie est illisible, indique-le ;
- ne devine pas un texte absent.

Pour toutes les situations :
- privilégie la précision ;
- indique les incertitudes ;
- évite les affirmations absolues sans preuve.
`;
}


/* =========================================================
   APPEL IA
========================================================= */

async function askAI(env, prompt, maxTokens = 900) {

  try {

    const response = await env.IA.run(
      MODEL,
      {
        messages: [
          {
            role: "system",
            content: systemPrompt()
          },
          {
            role: "user",
            content: texte(prompt, 60000)
          }
        ],

        max_tokens: maxTokens,
        temperature: 0.15
      }
    );

    if (typeof response === "string") {
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
   ORIENTATION DÉTERMINISTE
========================================================= */

function buildOrientation(question, contexte) {

  if (contexte.message) {

    return (
      "Le contenu fourni doit d'abord être compris précisément afin de distinguer les faits, la demande de l'expéditeur, les éléments incertains et la réponse appropriée."
    );
  }

  if (
    contexte.entreprise &&
    contexte.nettoyage
  ) {

    return (
      "Pour un projet de nettoyage, il faut d'abord préciser exactement les prestations envisagées et déterminer la forme juridique adaptée. Les formalités doivent ensuite être vérifiées en fonction de ces éléments."
    );
  }

  if (contexte.entreprise) {

    return (
      "Pour un projet d'entreprise, il faut d'abord préciser l'activité et déterminer la forme juridique adaptée. Les formalités dépendent ensuite de la situation exacte."
    );
  }

  return (
    "GouRare AI analyse votre situation afin d'identifier les informations utiles, les éléments à vérifier et la prochaine action."
  );
}


/* =========================================================
   MESSAGES ET EMAILS
========================================================= */

function messagePrompt(contenu, mode, langue) {

  const instructions = {

    analyse:
      "Analyse précisément le message : faits, demande, éléments importants, incertitudes et réponse possible.",

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
Langue souhaitée :
${langue || "français"}

Mode :
${instructions[mode] || instructions.analyse}

CONTENU FOURNI PAR L'UTILISATEUR :
---
${texte(contenu, 18000)}
---

Réponds de façon structurée et précise.
`;
}


/* =========================================================
   ANALYSE D'IMAGE
========================================================= */

async function analyserImage(
  env,
  image,
  demande = ""
) {

  if (
    !image ||
    typeof image !== "string"
  ) {

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

  const messages = [

    {
      role: "system",
      content:
        "Tu es le module de lecture et d'analyse visuelle de GouRare AI. Analyse uniquement ce qui est réellement visible ou lisible. Ne devine jamais un texte illisible."
    },

    {
      role: "user",
      content:
        demande ||
        "Lis et analyse cette image. Si elle contient une lettre, un courrier, un email, une notification ou un document, retranscris uniquement les éléments lisibles puis explique précisément son contenu."
    }
  ];

  const response =
    await env.IA.run(
      MODEL_VISION,
      {
        messages,
        image,
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
  const raw = texte(value, LIMITS.audio);

  if (!raw) {
    return "";
  }

  if (raw.startsWith("data:")) {
    const index = raw.indexOf(",");

    if (index !== -1) {
      return raw.slice(index + 1);
    }
  }

  return raw;
}

async function transcrireAudio(
  env,
  audio,
  langue = "fr"
) {

  if (
    !audio ||
    typeof audio !== "string"
  ) {
    throw new Error("Audio absent.");
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
    base64FromDataURL(audio);

  if (!base64) {
    throw new Error(
      "Données audio invalides."
    );
  }

  const response =
    await env.IA.run(
      MODEL_AUDIO,
      {
        audio: base64,
        task: "transcribe",
        language: langue || "fr",
        vad_filter: true,
        condition_on_previous_text: false
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
   ANALYSE COMPLÈTE
========================================================= */

async function analyserQuestion(
  env,
  question,
  options = {}
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

  const contexte =
    detectContext(q);

  if (options.messageMode) {
    contexte.message = true;
  }

  const sources =
    selectSources(contexte);

  const preuves =
    toutesLesPreuves(sources);

  let orientation =
    buildOrientation(
      q,
      contexte
    );

  /*
   * L'IA sert uniquement à améliorer
   * l'explication.
   *
   * Elle ne contrôle jamais :
   * - les informations confirmées
   * - les documents
   * - les actions
   * - les risques
   * - les recommandations
   */

  if (
    !options.messageMode
  ) {

    const explication =
      await askAI(
        env,
        `
Question utilisateur :
${q}

Contexte détecté :
${JSON.stringify(contexte)}

Preuves officielles disponibles :
${JSON.stringify(preuves)}

Explique brièvement la situation.

RÈGLE ABSOLUE :
N'ajoute aucune obligation.
N'ajoute aucun document.
N'ajoute aucun délai.
N'ajoute aucun montant.
N'ajoute aucune sanction.
N'ajoute aucune autorisation.
N'ajoute aucune qualification.
N'ajoute aucune information qui n'est pas nécessaire à l'explication.

Ne donne pas d'URL.
Ne crée pas de recommandation juridique.
Ne transforme pas une hypothèse en fait.

Réponse courte, claire et prudente.
`,
        700
      );

    if (
      explication &&
      explication.trim()
    ) {

      orientation =
        orientation +
        "\n\n" +
        texte(
          explication,
          4500
        );
    }
  }


  const confirmed =
    buildConfirmedFacts(
      q,
      contexte,
      sources
    );

  const documents =
    buildDocuments(
      q,
      contexte
    );

  const actions =
    buildActions(
      q,
      contexte
    );

  const recommendations =
    buildRecommendations(
      q,
      contexte
    );

  const risks =
    buildRisks();

  const professional =
    buildProfessional(
      q,
      contexte
    );

  const nextAction =
    buildNextAction(
      q,
      contexte
    );


  return {

    success: true,

    version:
      VERSION,

    compris:
      contexte.message
        ? "Vous souhaitez analyser ou traiter un message ou un contenu fourni."
        : q,

    orientation,

    confirmed,

    toVerify: [
      ...(
        !contexte.message &&
        contexte.entreprise &&
        !contexte.statut
          ? [
              "La forme juridique la plus adaptée à votre projet."
            ]
          : []
      ),

      ...(
        contexte.entreprise
          ? [
              "La nature exacte de l'activité et des prestations."
            ]
          : []
      )
    ],

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
   INTERFACE — ÉCRAN D'ACCUEIL
========================================================= */

function pageHTML() {

  return `<!doctype html>

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

  padding: 28px 18px;

  text-align: center;
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

  padding:
    0 15px 80px;
}


.card {

  background: white;

  border-radius: 18px;

  padding: 20px;

  margin-bottom: 18px;

  box-shadow:
    0 8px 30px rgba(0,0,0,.07);
}


/* =========================================================
   ACCUEIL
========================================================= */

#welcome {

  display: block;
}


.welcome-title {

  text-align: center;

  margin-bottom: 20px;
}


.welcome-title h2 {

  margin-bottom: 8px;
}


.welcome-title p {

  color: #6b7280;

  margin-top: 0;
}


.profiles {

  display: grid;

  grid-template-columns:
    repeat(2, 1fr);

  gap: 15px;
}


.profile {

  background: #f9fafb;

  border:
    1px solid #e5e7eb;

  border-radius: 16px;

  padding: 20px;

  cursor: pointer;

  transition:
    transform .15s,
    box-shadow .15s;

  text-align: left;
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

  margin:
    0 0 8px;

  font-size: 19px;
}


.profile p {

  margin: 0;

  color: #6b7280;

  line-height: 1.5;
}


/* =========================================================
   SITUATIONS
========================================================= */

#situations {

  display: none;
}


.back {

  margin-bottom: 15px;
}


.situation-grid {

  display: grid;

  grid-template-columns:
    repeat(2, 1fr);

  gap: 12px;
}


.situation {

  border:
    1px solid #e5e7eb;

  background: white;

  border-radius: 13px;

  padding: 15px;

  cursor: pointer;

  font-size: 15px;

  text-align: left;
}


.situation:hover {

  background: #f3f4f6;
}


/* =========================================================
   OUTIL
========================================================= */

#outil {

  display: none;
}


textarea {

  width: 100%;

  min-height: 150px;

  resize: vertical;

  padding: 15px;

  border:
    1px solid #d1d5db;

  border-radius: 12px;

  font-size: 16px;

  outline: none;
}


textarea:focus {

  border-color: #111827;
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

  padding:
    12px 16px;

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

  font-size: 14px;

  color: #4b5563;
}


select {

  width: 100%;

  padding: 12px;

  border-radius: 10px;

  border:
    1px solid #d1d5db;

  margin-top: 8px;

  background: white;
}


input[type=text] {

  width: 100%;

  margin-top: 10px;

  padding: 12px;

  border:
    1px solid #d1d5db;

  border-radius: 10px;
}


input[type=file] {

  width: 100%;

  margin-top: 10px;
}


.hidden {

  display: none;
}


/* =========================================================
   RÉSULTATS
========================================================= */

.result-card {

  background: white;

  border-radius: 16px;

  padding: 18px;

  margin-top: 16px;

  border-left:
    5px solid #111827;
}


.result-card h2 {

  margin-top: 0;
}


.result-block {

  margin: 18px 0;
}


.result-block h3 {

  margin-bottom: 8px;
}


.result-block ul {

  padding-left: 20px;
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


/* =========================================================
   CANCER
========================================================= */

.cancer {

  position: fixed;

  right: 12px;

  bottom: 12px;

  background: white;

  border:
    1px solid #e5e7eb;

  padding:
    10px 13px;

  border-radius: 999px;

  box-shadow:
    0 5px 20px rgba(0,0,0,.12);

  font-size: 13px;

  z-index: 20;
}


footer {

  text-align: center;

  color: #6b7280;

  padding:
    25px 10px;
}


@media(max-width:650px) {

  header h1 {

    font-size: 27px;
  }

  .profiles {

    grid-template-columns:
      1fr;
  }

  .situation-grid {

    grid-template-columns:
      1fr;
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
    Votre intelligence d'orientation
  </p>

</header>


<div class="container">


<!-- ======================================================
     ÉCRAN PRINCIPAL
====================================================== -->

<div id="welcome">

  <div class="card">

    <div class="welcome-title">

      <h2>
        👋 Bienvenue sur GouRare AI
      </h2>

      <p>
        Choisissez directement votre situation
        pour accéder au domaine qui vous concerne.
      </p>

    </div>


    <div class="profiles">

      <div
        class="profile"
        data-profile="migrant"
      >

        <div class="icon">
          🌍
        </div>

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

        <div class="icon">
          👤
        </div>

        <h3>
          Particulier / Résident
        </h3>

        <p>
          Vie quotidienne,
          démarches, droits et problèmes.
        </p>

      </div>


      <div
        class="profile"
        data-profile="emploi"
      >

        <div class="icon">
          💼
        </div>

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

        <div class="icon">
          🏢
        </div>

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

</div>


<!-- ======================================================
     CHOIX DE SITUATION
====================================================== -->

<div id="situations">

  <div class="card">

    <button
      class="secondary back"
      id="backHome"
    >
      ← Retour
    </button>

    <h2 id="situationTitle">
      Votre situation
    </h2>

    <p id="situationDescription"></p>

    <div
      class="situation-grid"
      id="situationGrid"
    ></div>

  </div>

</div>


<!-- ======================================================
     OUTIL PRINCIPAL
====================================================== -->

<div id="outil">

  <div class="card">

    <button
      class="secondary"
      id="backSituation"
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
      class="status"
      id="status"
    ></div>


    <input
      id="imageInput"
      type="file"
      accept="image/*"
      capture="environment"
      class="hidden"
    >

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
    >

  </div>


  <div id="result"></div>

</div>


</div>


<div class="cancer">
  🎗️ Avec vous contre le cancer
</div>


<footer>

  🎗️ Notre soutien aux personnes touchées
  par le cancer.

  <br><br>

  GouRare AI — Version ${VERSION}

</footer>


<script>

/* =========================================================
   DONNÉES DE NAVIGATION
========================================================= */

const parcours =
  ${JSON.stringify(PARCOURS)};


let profilActuel = null;


/* =========================================================
   ÉLÉMENTS
========================================================= */

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


/* =========================================================
   CHOIX DU PROFIL
========================================================= */

document
  .querySelectorAll(".profile")
  .forEach(function(profile) {

    profile.addEventListener(
      "click",
      function() {

        const nom =
          profile.dataset.profile;

        ouvrirSituations(nom);
      }
    );

  });


/* =========================================================
   AFFICHER LES SITUATIONS
========================================================= */

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
        document.createElement("button");

      bouton.className =
        "situation";

      bouton.textContent =
        item[1];

      bouton.dataset.situation =
        item[0];

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


/* =========================================================
   RETOUR ACCUEIL
========================================================= */

backHome.addEventListener(
  "click",
  function() {

    situations.style.display =
      "none";

    outil.style.display =
      "none";

    welcome.style.display =
      "block";

    profilActuel =
      null;
  }
);


/* =========================================================
   OUVRIR OUTIL
========================================================= */

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

  /*
   * Certaines situations deviennent
   * directement un mode message.
   */

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


/* =========================================================
   RETOUR AUX SITUATIONS
========================================================= */

backSituation.addEventListener(
  "click",
  function() {

    outil.style.display =
      "none";

    situations.style.display =
      "block";
  }
);


/* =========================================================
   OUTILS DU MODULE
========================================================= */

const question =
  document.getElementById(
    "question"
  );

const analyser =
  document.getElementById(
    "analyser"
  );

const micro =
  document.getElementById(
    "micro"
  );

const photo =
  document.getElementById(
    "photo"
  );

const imageInput =
  document.getElementById(
    "imageInput"
  );

const result =
  document.getElementById(
    "result"
  );

const status =
  document.getElementById(
    "status"
  );

const messageMode =
  document.getElementById(
    "messageMode"
  );

const langue =
  document.getElementById(
    "langue"
  );


let mediaRecorder =
  null;

let audioChunks =
  [];

let enregistrement =
  false;


/* =========================================================
   AFFICHAGE DES LISTES
========================================================= */

function liste(items) {

  if (
    !items ||
    !items.length
  ) {

    return (
      "<p>Aucun élément précis à présenter à ce stade.</p>"
    );
  }

  return (
    "<ul>" +

    items
      .map(
        function(item) {

          const value =
            typeof item === "string"
              ? item
              : (
                  item.texte ||
                  item.value ||
                  JSON.stringify(item)
                );

          return (
            "<li>" +
            escapeHTML(value) +
            "</li>"
          );

        }
      )
      .join("") +

    "</ul>"
  );
}


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


/* =========================================================
   AFFICHAGE RÉSULTAT
========================================================= */

function afficher(data) {

  const sources =
    data.sources || [];

  let html = "";


  html +=
    '<div class="result-card">';

  html +=
    "<h2>🧭 Ce que j'ai compris</h2>";

  html +=
    '<div class="ai-result">' +
    escapeHTML(
      data.compris || ""
    ) +
    "</div>";

  html +=
    "</div>";


  html +=
    '<div class="result-card">';

  html +=
    "<h2>💡 Orientation</h2>";

  html +=
    '<div class="ai-result">' +
    escapeHTML(
      data.orientation || ""
    ) +
    "</div>";

  html +=
    "</div>";


  html +=
    '<div class="result-card result-block">';

  html +=
    "<h2>✅ Informations confirmées</h2>";

  html +=
    liste(
      data.confirmed
    );

  html +=
    "</div>";


  html +=
    '<div class="result-card result-block">';

  html +=
    "<h2>🔎 À vérifier</h2>";

  html +=
    liste(
      data.toVerify
    );

  html +=
    "</div>";


  html +=
    '<div class="result-card result-block">';

  html +=
    "<h2>💭 Recommandations</h2>";

  html +=
    liste(
      data.recommendations
    );

  html +=
    "</div>";


  html +=
    '<div class="result-card result-block">';

  html +=
    "<h2>📋 Actions concrètes</h2>";

  html +=
    liste(
      data.actions
    );

  html +=
    "</div>";


  html +=
    '<div class="result-card result-block">';

  html +=
    "<h2>📄 Documents</h2>";


  if (
    data.documents &&
    data.documents.length
  ) {

    html +=
      "<ul>";

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

    html +=
      "</ul>";

  } else {

    html +=
      "<p>Aucun document précis à présenter à ce stade.</p>";
  }


  html +=
    "</div>";


  if (
    data.risks &&
    data.risks.length
  ) {

    html +=
      '<div class="result-card result-block">';

    html +=
      "<h2>⚠️ Points de vigilance</h2>";

    html +=
      liste(
        data.risks
      );

    html +=
      "</div>";
  }


  if (
    data.professional &&
    data.professional.length
  ) {

    html +=
      '<div class="result-card result-block">';

    html +=
      "<h2>👤 Professionnel</h2>";

    html +=
      liste(
        data.professional
      );

    html +=
      "</div>";
  }


  html +=
    '<div class="result-card result-block">';

  html +=
    "<h2>🚀 Prochaine action</h2>";

  html +=
    '<div class="ai-result">' +
    escapeHTML(
      data.nextAction || ""
    ) +
    "</div>";

  html +=
    "</div>";


  html +=
    '<div class="result-card result-block">';

  html +=
    "<h2>📚 Sources consultées</h2>";


  if (sources.length) {

    sources.forEach(
      function(source) {

        html +=
          '<div class="source">';

        html +=
          escapeHTML(
            source.organisme
          ) +
          " — " +
          escapeHTML(
            source.titre
          ) +
          "<br>";

        html +=
          '<a href="' +
          escapeHTML(
            source.url
          ) +
          '" target="_blank" rel="noopener noreferrer">' +
          "Consulter la source officielle ↗" +
          "</a>";

        html +=
          "</div>";

      }
    );

  } else {

    html +=
      "<p>Aucune source officielle spécifique utilisée.</p>";
  }


  html +=
    "</div>";


  result.innerHTML =
    html;
}


/* =========================================================
   ANALYSE TEXTE
========================================================= */

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
        "Le microphone n'est pas disponible sur cet appareil ou ce navigateur.";

      return;
    }


    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true
        });


      audioChunks =
        [];


      mediaRecorder =
        new MediaRecorder(
          stream
        );


      enregistrement =
        true;


      micro.textContent =
        "⏹️ Arrêter l'enregistrement";


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


          status.textContent =
            "Conversion de votre voix en texte...";


          try {

            const mime =
              mediaRecorder.mimeType ||
              "audio/webm";


            const blob =
              new Blob(
                audioChunks,
                {
                  type: mime
                }
              );


            const reader =
              new FileReader();


            reader.onloadend =
              async function() {

                try {

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


                  status.textContent =
                    "Texte obtenu. Analyse en cours...";


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
      file.size >
      5500000
    ) {

      status.textContent =
        "L'image est trop volumineuse. Utilisez une image plus légère.";

      return;
    }


    analyser.disabled =
      true;

    micro.disabled =
      true;

    photo.disabled =
      true;


    status.textContent =
      "📷 Lecture et analyse de l'image...";


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


            status.textContent =
              "Image analysée. Analyse complète en cours...";


            await analyserTexte();


          } catch (error) {

            status.textContent =
              error.message ||
              "Erreur pendant l'analyse de l'image.";

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

</html>`;
}
/* =========================================================
   API — ANALYSE TEXTE
========================================================= */

async function handleAnalyze(request, env) {

  if (request.method !== "POST") {

    return jsonResponse(
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
    !contentType.includes(
      "application/json"
    )
  ) {

    return jsonResponse(
      {
        success: false,
        error: "Le contenu doit être au format JSON."
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
        error: "JSON invalide."
      },
      400
    );
  }


  const question =
    texte(
      body.question,
      LIMITS.question
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


  try {

    const data =
      await analyserQuestion(
        env,
        question,
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
   API — IMAGE
========================================================= */

async function handleImage(request, env) {

  if (request.method !== "POST") {

    return jsonResponse(
      {
        success: false,
        error: "Méthode non autorisée."
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
        error: "JSON invalide."
      },
      400
    );
  }


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


  if (!image) {

    return jsonResponse(
      {
        success: false,
        error: "Image absente."
      },
      400
    );
  }


  try {

    const analyse =
      await analyserImage(
        env,
        image,
        demande
      );


    return jsonResponse(
      {
        success: true,
        texte: analyse
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
   API — TRANSCRIPTION AUDIO
========================================================= */

async function handleTranscribe(
  request,
  env
) {

  if (request.method !== "POST") {

    return jsonResponse(
      {
        success: false,
        error: "Méthode non autorisée."
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
        error: "JSON invalide."
      },
      400
    );
  }


  const audio =
    texte(
      body.audio,
      LIMITS.audio
    );


  const langue =
    texte(
      body.langue || "fr",
      20
    );


  if (!audio) {

    return jsonResponse(
      {
        success: false,
        error: "Audio absent."
      },
      400
    );
  }


  try {

    const transcription =
      await transcrireAudio(
        env,
        audio,
        langue
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
   API — HEALTH CHECK
========================================================= */

function handleHealth() {

  return jsonResponse(
    {
      success: true,
      service: "GouRare AI",
      status: "OK",
      version: VERSION
    },
    200
  );
}


/* =========================================================
   RÉPONSE JSON
========================================================= */

function jsonResponse(
  data,
  status = 200
) {

  return new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        "content-type":
          "application/json; charset=utf-8",

        "cache-control":
          "no-store"
      }
    }
  );
}


/* =========================================================
   EN-TÊTES DE SÉCURITÉ
========================================================= */

function securityHeaders() {

  return {

    "X-Content-Type-Options":
      "nosniff",

    "X-Frame-Options":
      "DENY",

    "Referrer-Policy":
      "strict-origin-when-cross-origin",

    "Permissions-Policy":
      "camera=(self), microphone=(self), geolocation=()",

    "Cache-Control":
      "no-store"
  };
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
      new URL(request.url);


    let response;


    /* -----------------------------------------------------
       PAGE PRINCIPALE
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       HEALTH
    ----------------------------------------------------- */

    else if (
      url.pathname === "/health"
    ) {

      response =
        handleHealth();
    }


    /* -----------------------------------------------------
       ANALYSE TEXTE
    ----------------------------------------------------- */

    else if (
      url.pathname === "/api/analyze"
    ) {

      response =
        await handleAnalyze(
          request,
          env
        );
    }


    /* -----------------------------------------------------
       ANALYSE IMAGE
    ----------------------------------------------------- */

    else if (
      url.pathname === "/api/image"
    ) {

      response =
        await handleImage(
          request,
          env
        );
    }


    /* -----------------------------------------------------
       TRANSCRIPTION AUDIO
    ----------------------------------------------------- */

    else if (
      url.pathname === "/api/transcribe"
    ) {

      response =
        await handleTranscribe(
          request,
          env
        );
    }


    /* -----------------------------------------------------
       ROUTE INCONNUE
    ----------------------------------------------------- */

    else {

      response =
        jsonResponse(
          {
            success: false,
            error: "Route introuvable."
          },
          404
        );
    }


    /* =====================================================
       AJOUT DES HEADERS DE SÉCURITÉ
    ===================================================== */

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
