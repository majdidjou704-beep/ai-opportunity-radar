const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const MODEL_VISION = "@cf/meta/llama-3.2-11b-vision-instruct";
const MODEL_AUDIO = "@cf/openai/whisper-large-v3-turbo";

const VERSION = "8.1";

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
      {
        id: "STATUT_P1",
        texte:
          "Le simulateur permet de trouver le statut juridique adapté à son activité."
      },
      {
        id: "STATUT_P2",
        texte:
          "Pour utiliser le simulateur, il faut notamment renseigner l'activité envisagée et une estimation du chiffre d'affaires."
      },
      {
        id: "STATUT_P3",
        texte:
          "Le simulateur permet de connaître les formes juridiques possibles pour l'activité."
      },
      {
        id: "STATUT_P4",
        texte:
          "Le simulateur permet de comparer notamment les revenus, la couverture sociale ainsi que la gestion comptable et juridique."
      }
    ]
  },

  creation_ei: {
    id: "creation_ei",
    titre: "Création d'une entreprise individuelle",
    organisme: "Service Public Entreprendre",
    url: "https://entreprendre.service-public.fr/vosdroits/F36763",
    preuves: [
      {
        id: "EI_P1",
        texte:
          "La création d'une entreprise individuelle comporte notamment une formalité d'immatriculation et une déclaration d'activité."
      },
      {
        id: "EI_P2",
        texte:
          "La demande d'immatriculation d'une entreprise individuelle se fait sur le Guichet des formalités des entreprises."
      },
      {
        id: "EI_P3",
        texte:
          "Après son immatriculation, l'entreprise individuelle est inscrite au Registre national des entreprises."
      },
      {
        id: "EI_P4",
        texte:
          "Le registre d'inscription dépend de la nature de l'activité exercée."
      },
      {
        id: "EI_P5",
        texte:
          "Pour une entreprise individuelle commerciale, l'inscription concerne notamment le Registre national des entreprises et le Registre du commerce et des sociétés."
      },
      {
        id: "EI_P6",
        texte:
          "Pour certaines entreprises individuelles artisanales, l'inscription concerne le Registre national des entreprises."
      },
      {
        id: "EI_P7",
        texte:
          "Pour une entreprise individuelle exerçant une activité libérale, l'inscription concerne le Registre national des entreprises."
      },
      {
        id: "EI_P8",
        texte:
          "Parmi les justificatifs pouvant être demandés figurent notamment un justificatif de domiciliation, une déclaration sur l'honneur de non-condamnation et une copie d'une pièce d'identité."
      },
      {
        id: "EI_P9",
        texte:
          "Une activité réglementée peut nécessiter des justificatifs particuliers, notamment une autorisation, un diplôme ou un titre."
      }
    ]
  },

  guichet: {
    id: "guichet",
    titre: "Formalités d'immatriculation des entreprises",
    organisme: "Service Public Entreprendre",
    url: "https://entreprendre.service-public.fr/vosdroits/F23571",
    preuves: [
      {
        id: "GUICHET_P1",
        texte:
          "Les formalités de création d'une entreprise sont réalisées par l'intermédiaire du Guichet des formalités des entreprises."
      }
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

function tableau(value, max = 10) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => texte(item, 2000))
    .filter(Boolean)
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

function headers() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(self), microphone=(self), geolocation=()",
    "Cache-Control": "no-store"
  };
}


/* =========================================================
   CONTEXTE
========================================================= */

function detectContext(question) {
  const q = texte(question, LIMITS.question).toLowerCase();

  const contexte = {
    nettoyage: false,
    entreprise: false,
    creation: false,
    statut: false,
    independant: false,
    fiscalite: false,
    travail: false,
    social: false,
    administratif: false,
    message: false,
    juridique: false
  };

  if (
    /nettoyage|ménage|menage|propreté|proprete|cleaning/.test(q)
  ) {
    contexte.nettoyage = true;
    contexte.entreprise = true;
  }

  if (
    /créer|creer|création|creation|lancer|ouvrir|entreprise|société|societe|activité|activite/.test(
      q
    )
  ) {
    contexte.entreprise = true;
  }

  if (
    /statut|forme juridique|micro|micro-entreprise|microentreprise|indépendant|independant|ei|entreprise individuelle/.test(
      q
    )
  ) {
    contexte.statut = true;
    contexte.independant = true;
  }

  if (
    /impôt|impot|fiscal|fiscalité|fiscalite|urssaf|tva|cfe|cotisation/.test(
      q
    )
  ) {
    contexte.fiscalite = true;
  }

  if (
    /travail|emploi|salarié|salarie|contrat|employeur|licenciement|salaire/.test(
      q
    )
  ) {
    contexte.travail = true;
  }

  if (
    /caf|rsa|aide|social|assistante sociale|assistance sociale|allocation|droits sociaux/.test(
      q
    )
  ) {
    contexte.social = true;
  }

  if (
    /démarche|demarche|administratif|administrative|préfecture|prefecture|mairie|document officiel/.test(
      q
    )
  ) {
    contexte.administratif = true;
  }

  if (
    /avocat|juridique|justice|tribunal|loi|légal|legal|contrat juridique|mise en demeure/.test(
      q
    )
  ) {
    contexte.juridique = true;
  }

  return contexte;
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

  /*
   * Pour une question générale de création d'entreprise,
   * le Guichet est utile comme orientation générale.
   */
  if (contexte.entreprise) {
    ids.push("guichet");
  }

  return unique(ids).map((id) => SOURCES[id]);
}

function toutesLesPreuves(sources) {
  const preuves = [];

  for (const source of sources) {
    for (const preuve of source.preuves) {
      preuves.push({
        source_id: source.id,
        source_titre: source.titre,
        organisme: source.organisme,
        url: source.url,
        preuve_id: preuve.id,
        texte: preuve.texte
      });
    }
  }

  return preuves;
}


/* =========================================================
   INFORMATIONS CONFIRMÉES
   IMPORTANT :
   Cette partie est DÉTERMINISTE.
   L'IA ne décide pas ce qui est "confirmé".
========================================================= */

function buildConfirmedFacts(question, contexte, sources) {
  const facts = [];

  if (contexte.entreprise) {
    const sourceStatut = sources.find((s) => s.id === "statut");

    if (sourceStatut) {
      facts.push(
        "Le choix de la forme juridique peut être étudié en fonction de l'activité envisagée, du chiffre d'affaires estimé, des revenus, de la couverture sociale et de la gestion."
      );
    }
  }

  /*
   * On ne confirme les informations EI que si l'utilisateur
   * parle explicitement d'entreprise individuelle / EI / micro.
   */
  if (
    contexte.statut &&
    /entreprise individuelle|\bei\b|micro|micro-entreprise|microentreprise/.test(
      question.toLowerCase()
    )
  ) {
    const sourceEI = sources.find((s) => s.id === "creation_ei");

    if (sourceEI) {
      facts.push(
        "Pour une entreprise individuelle, certaines formalités d'immatriculation et de déclaration d'activité sont prévues."
      );

      facts.push(
        "La demande d'immatriculation d'une entreprise individuelle passe par le Guichet des formalités des entreprises."
      );
    }
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
      statut: "à_vérifier",
      texte:
        "Vérifier les justificatifs demandés pour l'immatriculation de la forme juridique choisie."
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

function buildActions(question, contexte) {
  const actions = [];

  if (contexte.entreprise) {
    actions.push(
      "Décrire précisément les prestations ou produits que vous souhaitez proposer."
    );
  }

  if (contexte.entreprise && !contexte.statut) {
    actions.push(
      "Comparer les formes juridiques possibles avant de choisir un statut."
    );
  }

  if (contexte.entreprise && contexte.statut) {
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

  if (contexte.entreprise && !contexte.statut) {
    recommendations.push(
      "Comparer les formes juridiques avant de retenir celle qui correspond au projet."
    );
  }

  if (contexte.entreprise && contexte.statut) {
    recommendations.push(
      "Vérifier les formalités officielles après avoir défini la forme juridique et la nature exacte de l'activité."
    );
  }

  return unique(recommendations);
}


/* =========================================================
   RISQUES
   Aucun risque juridique n'est inventé.
========================================================= */

function buildRisks() {
  return [];
}


/* =========================================================
   PROFESSIONNEL
========================================================= */

function buildProfessional(question, contexte) {
  /*
   * Aucun professionnel n'est recommandé automatiquement.
   * Une future version pourra le faire lorsqu'une situation
   * le justifie clairement.
   */
  return [];
}


/* =========================================================
   PROCHAINE ACTION
========================================================= */

function buildNextAction(question, contexte) {
  if (contexte.entreprise && !contexte.statut) {
    return "Préciser exactement l'activité et les prestations envisagées, puis comparer les formes juridiques adaptées.";
  }

  if (contexte.entreprise && contexte.statut) {
    return "Vérifier les formalités officielles correspondant exactement à la forme juridique et à l'activité choisies.";
  }

  if (contexte.message) {
    return "Vérifier que le projet de réponse correspond bien au contenu et au contexte du message reçu.";
  }

  return "Préciser votre situation et votre objectif afin de déterminer la prochaine action utile.";
}


/* =========================================================
   IA — EXPLICATION UNIQUEMENT
========================================================= */

function systemPrompt() {
  return `
Tu es GouRare AI.

Tu es un assistant d'orientation, d'analyse et d'aide à la décision.

Tu peux aider :
- citoyens
- salariés
- demandeurs d'emploi
- indépendants
- entrepreneurs
- petites entreprises
- personnes confrontées à des démarches administratives
- personnes qui reçoivent des messages, courriers ou emails.

IMPORTANT :
Tu n'es pas avocat, expert-comptable, médecin, administration ou travailleur social.

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

Si une information n'est pas confirmée par une preuve officielle fournie :
ne la présente jamais comme une information confirmée.

Pour une analyse de message :
- distingue clairement ce que le message dit réellement ;
- distingue l'interprétation ;
- distingue ce qui n'est pas certain ;
- n'invente jamais ce que l'expéditeur voulait dire.

Pour une réponse à un message :
- respecte le contexte ;
- reste poli ;
- ne crée aucun fait absent du contexte ;
- n'ajoute pas d'engagement juridique non demandé ;
- si une information manque, formule une réponse prudente.

Pour une réécriture :
- conserve le sens ;
- améliore uniquement la clarté, le ton et la structure.

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

async function askAI(env, prompt, options = {}) {
  const maxTokens = options.maxTokens || 1800;

  try {
    const response = await env.IA.run(MODEL, {
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

    return JSON.stringify(response);
  } catch (error) {
    return "Impossible de générer l'explication IA pour le moment.";
  }
}


/* =========================================================
   ORIENTATION DÉTERMINISTE
========================================================= */

function buildOrientation(question, contexte) {
  if (contexte.message) {
    return "Le contenu fourni doit d'abord être compris précisément afin de distinguer les faits, la demande de l'expéditeur, les éléments incertains et la réponse appropriée.";
  }

  if (contexte.entreprise && contexte.nettoyage) {
    return "Pour un projet de nettoyage, il faut d'abord préciser exactement les prestations envisagées et déterminer la forme juridique adaptée. Les formalités doivent ensuite être vérifiées en fonction de ces éléments.";
  }

  if (contexte.entreprise) {
    return "Pour un projet d'entreprise, il faut d'abord préciser l'activité et déterminer la forme juridique adaptée. Les formalités dépendent ensuite de la situation exacte.";
  }

  return "GouRare AI analyse votre situation afin d'identifier les informations utiles, les éléments à vérifier et la prochaine action.";
}


/* =========================================================
   ANALYSE DE MESSAGE
========================================================= */

function messagePrompt(contenu, mode, langue) {
  const instruction = {
    analyse:
      "Analyse précisément le message. Explique ce qu'il dit, ce qu'il demande, les éléments importants, les incertitudes éventuelles et les actions possibles.",
    reponse:
      "Prépare une réponse claire et appropriée au message. Ne crée aucun fait absent du contenu fourni.",
    reformulation:
      "Réécris le message de façon plus claire, naturelle et professionnelle sans changer son sens.",
    correction:
      "Corrige les fautes et améliore légèrement la formulation sans changer le sens.",
    traduction:
      "Traduis fidèlement le contenu dans la langue demandée."
  }[mode] || "Analyse précisément le message.";

  return `
Langue souhaitée : ${langue || "français"}

Mode :
${instruction}

CONTENU FOURNI PAR L'UTILISATEUR :
---
${texte(contenu, 18000)}
---

Réponds de façon structurée et précise.
`;
}


/* =========================================================
   IMAGE
========================================================= */

async function analyserImage(env, image, demande = "") {
  if (!image || typeof image !== "string") {
    throw new Error("Image absente.");
  }

  if (image.length > LIMITS.image) {
    throw new Error("Image trop volumineuse.");
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
        "Lis et analyse cette image. Si elle contient une lettre, un courrier, un email, une notification ou un document, retranscris les éléments lisibles puis explique précisément son contenu."
    }
  ];

  const response = await env.IA.run(MODEL_VISION, {
    messages,
    image,
    max_tokens: 2200,
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

  if (response && typeof response.result === "string") {
    return response.result;
  }

  return JSON.stringify(response);
}


/* =========================================================
   AUDIO
========================================================= */

function base64FromDataURL(value) {
  const raw = texte(value, LIMITS.audio);

  if (!raw) return "";

  if (raw.startsWith("data:")) {
    const index = raw.indexOf(",");
    if (index !== -1) {
      return raw.slice(index + 1);
    }
  }

  return raw;
}

async function transcrireAudio(env, audio, langue = "fr") {
  if (!audio || typeof audio !== "string") {
    throw new Error("Audio absent.");
  }

  if (audio.length > LIMITS.audio) {
    throw new Error("Audio trop volumineux.");
  }

  const base64 = base64FromDataURL(audio);

  const response = await env.IA.run(MODEL_AUDIO, {
    audio: base64,
    task: "transcribe",
    language: langue || "fr",
    vad_filter: true,
    condition_on_previous_text: false
  });

  if (response && response.text) {
    return texte(response.text, 20000);
  }

  if (
    response &&
    response.transcription_info &&
    response.transcription_info.text
  ) {
    return texte(response.transcription_info.text, 20000);
  }

  return "";
}


/* =========================================================
   ANALYSE COMPLÈTE
========================================================= */

async function analyserQuestion(env, question, options = {}) {
  const q = texte(question, LIMITS.question);

  if (!q) {
    throw new Error("Question vide.");
  }

  const contexte = detectContext(q);

  if (options.messageMode) {
    contexte.message = true;
  }

  const sources = selectSources(contexte);
  const preuves = toutesLesPreuves(sources);

  let orientation = buildOrientation(q, contexte);

  /*
   * Pour les questions classiques, l'IA peut améliorer
   * l'explication, mais elle ne contrôle jamais les faits.
   */
  if (!options.messageMode) {
    const explication = await askAI(
      env,
      `
Question utilisateur :
${q}

Contexte détecté :
${JSON.stringify(contexte)}

Informations officielles disponibles :
${JSON.stringify(preuves)}

Explique brièvement la situation de façon utile et prudente.
Ne crée aucune nouvelle obligation ou exigence.
Ne présente pas les hypothèses comme des faits.
`,
      { maxTokens: 900 }
    );

    if (explication && !/Impossible de générer/.test(explication)) {
      orientation = orientation + "\n\n" + texte(explication, 5000);
    }
  }

  const confirmed = buildConfirmedFacts(q, contexte, sources);
  const documents = buildDocuments(q, contexte);
  const actions = buildActions(q, contexte);
  const recommendations = buildRecommendations(q, contexte);
  const risks = buildRisks();
  const professional = buildProfessional(q, contexte);
  const nextAction = buildNextAction(q, contexte);

  return {
    success: true,
    version: VERSION,
    compris: contexte.message
      ? "Vous souhaitez analyser ou traiter un message ou un contenu fourni."
      : q,
    orientation,
    confirmed,
    toVerify: [
      ...(!contexte.message && contexte.entreprise && !contexte.statut
        ? ["La forme juridique la plus adaptée à votre projet."]
        : []),
      ...(contexte.entreprise
        ? ["La nature exacte de l'activité et des prestations."]
        : [])
    ],
    recommendations,
    actions,
    documents,
    risks,
    professional,
    nextAction,
    sources: sources.map((s) => ({
      id: s.id,
      titre: s.titre,
      organisme: s.organisme,
      url: s.url
    }))
  };
}


/* =========================================================
   PAGE WEB
========================================================= */

function pageHTML() {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#111827">
<title>GouRare AI</title>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
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
  max-width: 900px;
  margin: 25px auto;
  padding: 0 15px 70px;
}

.card {
  background: white;
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 18px;
  box-shadow: 0 8px 30px rgba(0,0,0,.07);
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

button.danger {
  background: #991b1b;
}

button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

input[type=file] {
  width: 100%;
  margin-top: 10px;
}

select {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  margin-top: 8px;
  background: white;
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

.cancer {
  position: fixed;
  right: 12px;
  bottom: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  padding: 10px 13px;
  border-radius: 999px;
  box-shadow: 0 5px 20px rgba(0,0,0,.12);
  font-size: 13px;
  z-index: 20;
}

.status {
  margin-top: 10px;
  font-size: 14px;
  color: #4b5563;
}

footer {
  text-align: center;
  color: #6b7280;
  padding: 25px 10px;
}

.hidden {
  display: none;
}

@media(max-width:600px) {
  header h1 {
    font-size: 27px;
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
  <p>Intelligence, orientation et solutions</p>
</header>

<div class="container">

  <div class="card">
    <h2>Que souhaitez-vous faire ?</h2>

    <textarea
      id="question"
      placeholder="Écrivez votre question ou expliquez votre situation..."
    ></textarea>

    <div class="actions">
      <button id="analyser">Analyser</button>
      <button id="micro" class="secondary">🎙️ Parler</button>
      <button id="photo" class="secondary">📷 Analyser une image</button>
    </div>

    <div class="status" id="status"></div>

    <input
      id="imageInput"
      type="file"
      accept="image/*"
      capture="environment"
      class="hidden"
    >
  </div>


  <div class="card">
    <h2>✉️ Messages et emails</h2>

    <select id="messageMode">
      <option value="">Mode normal</option>
      <option value="analyse">🔎 Analyser le message</option>
      <option value="reponse">✍️ Préparer une réponse</option>
      <option value="reformulation">📝 Reformuler</option>
      <option value="correction">✅ Corriger</option>
      <option value="traduction">🌍 Traduire</option>
    </select>

    <input
      id="langue"
      placeholder="Langue souhaitée pour une traduction (ex : français, arabe, anglais)"
      style="width:100%;margin-top:10px;padding:12px;border:1px solid #d1d5db;border-radius:10px"
    >
  </div>


  <div id="result"></div>

</div>

<div class="cancer">
  🎗️ Avec vous contre le cancer
</div>

<footer>
  🎗️ Notre soutien aux personnes touchées par le cancer.<br><br>
  GouRare AI — Version ${VERSION}
</footer>


<script>
const question = document.getElementById("question");
const analyser = document.getElementById("analyser");
const micro = document.getElementById("micro");
const photo = document.getElementById("photo");
const imageInput = document.getElementById("imageInput");
const result = document.getElementById("result");
const status = document.getElementById("status");
const messageMode = document.getElementById("messageMode");
const langue = document.getElementById("langue");

let mediaRecorder = null;
let audioChunks = [];
let enregistrement = false;


/* =========================================================
   AFFICHAGE
========================================================= */

function liste(items) {
  if (!items || !items.length) {
    return "<p>Aucun élément précis à présenter à ce stade.</p>";
  }

  return "<ul>" +
    items.map(function(item) {
      const value =
        typeof item === "string"
          ? item
          : (item.texte || item.value || JSON.stringify(item));

      return "<li>" + escapeHTML(value) + "</li>";
    }).join("") +
    "</ul>";
}

function escapeHTML(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function afficher(data) {
  const sources = data.sources || [];

  let html = "";

  html += '<div class="result-card">';
  html += "<h2>🧭 Ce que j'ai compris</h2>";
  html += '<div class="ai-result">' + escapeHTML(data.compris || "") + "</div>";
  html += "</div>";

  html += '<div class="result-card">';
  html += "<h2>💡 Orientation</h2>";
  html += '<div class="ai-result">' + escapeHTML(data.orientation || "") + "</div>";
  html += "</div>";

  html += '<div class="result-card result-block">';
  html += "<h2>✅ Informations confirmées</h2>";
  html += liste(data.confirmed);
  html += "</div>";

  html += '<div class="result-card result-block">';
  html += "<h2>🔎 À vérifier</h2>";
  html += liste(data.toVerify);
  html += "</div>";

  html += '<div class="result-card result-block">';
  html += "<h2>💭 Recommandations</h2>";
  html += liste(data.recommendations);
  html += "</div>";

  html += '<div class="result-card result-block">';
  html += "<h2>📋 Actions concrètes</h2>";
  html += liste(data.actions);
  html += "</div>";

  html += '<div class="result-card result-block">';
  html += "<h2>📄 Documents</h2>";

  if (data.documents && data.documents.length) {
    html += "<ul>";

    data.documents.forEach(function(doc) {
      html += "<li><strong>" +
        escapeHTML(doc.statut) +
        "</strong> — " +
        escapeHTML(doc.texte) +
        "</li>";
    });

    html += "</ul>";
  } else {
    html += "<p>Aucun document précis à présenter à ce stade.</p>";
  }

  html += "</div>";

  if (data.risks && data.risks.length) {
    html += '<div class="result-card result-block">';
    html += "<h2>⚠️ Points de vigilance</h2>";
    html += liste(data.risks);
    html += "</div>";
  }

  if (data.professional && data.professional.length) {
    html += '<div class="result-card result-block">';
    html += "<h2>👤 Professionnel</h2>";
    html += liste(data.professional);
    html += "</div>";
  }

  html += '<div class="result-card result-block">';
  html += "<h2>🚀 Prochaine action</h2>";
  html += '<div class="ai-result">' +
    escapeHTML(data.nextAction || "") +
    "</div>";
  html += "</div>";

  html += '<div class="result-card result-block">';
  html += "<h2>📚 Sources consultées</h2>";

  if (sources.length) {
    sources.forEach(function(source) {
      html += '<div class="source">';
      html += escapeHTML(source.organisme) +
        " — " +
        escapeHTML(source.titre) +
        "<br>";
      html += '<a href="' +
        escapeHTML(source.url) +
        '" target="_blank" rel="noopener noreferrer">' +
        "Consulter la source officielle ↗" +
        "</a>";
      html += "</div>";
    });
  } else {
    html += "<p>Aucune source officielle spécifique utilisée.</p>";
  }

  html += "</div>";

  result.innerHTML = html;
}


/* =========================================================
   ANALYSE TEXTE
========================================================= */

async function analyserTexte() {
  const q = question.value.trim();

  if (!q) {
    status.textContent = "Veuillez écrire ou dire votre demande.";
    return;
  }

  analyser.disabled = true;
  micro.disabled = true;
  photo.disabled = true;
  status.textContent = "Analyse en cours...";
  result.innerHTML = "";

  try {
    const mode = messageMode.value;

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        type: mode ? "message" : "question",
        question: q,
        messageMode: mode || null,
        langue: langue.value.trim()
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Erreur pendant l'analyse.");
    }

    afficher(data);
    status.textContent = "Analyse terminée.";
  } catch (error) {
    status.textContent = error.message || "Une erreur est survenue.";
  } finally {
    analyser.disabled = false;
    micro.disabled = false;
    photo.disabled = false;
  }
}

analyser.addEventListener("click", analyserTexte);


/* =========================================================
   MICROPHONE
========================================================= */

micro.addEventListener("click", async function() {

  if (enregistrement && mediaRecorder) {
    mediaRecorder.stop();
    return;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    status.textContent =
      "Le microphone n'est pas disponible sur cet appareil ou ce navigateur.";
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });

    audioChunks = [];

    mediaRecorder = new MediaRecorder(stream);
    enregistrement = true;

    micro.textContent = "⏹️ Arrêter l'enregistrement";
    status.textContent = "🎙️ Je vous écoute...";

    mediaRecorder.ondataavailable = function(event) {
      if (event.data && event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async function() {
      enregistrement = false;
      micro.textContent = "🎙️ Parler";

      stream.getTracks().forEach(function(track) {
        track.stop();
      });

      status.textContent = "Conversion de votre voix en texte...";

      try {
        const blob = new Blob(audioChunks, {
          type: mediaRecorder.mimeType || "audio/webm"
        });

        const reader = new FileReader();

        reader.onloadend = async function() {
          try {
            const response = await fetch("/api/transcribe", {
              method: "POST",
              headers: {
                "content-type": "application/json"
              },
              body: JSON.stringify({
                audio: reader.result,
                langue: "fr"
              })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
              throw new Error(
                data.error || "Impossible de transcrire l'audio."
              );
            }

            question.value = data.text || "";

            status.textContent =
              "Texte obtenu. Analyse en cours...";

            await analyserTexte();
          } catch (error) {
            status.textContent =
              error.message || "Erreur audio.";
          }
        };

        reader.readAsDataURL(blob);
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
});


/* =========================================================
   IMAGE
========================================================= */

photo.addEventListener("click", function() {
  imageInput.click();
});

imageInput.addEventListener("change", async function() {

  const file = imageInput.files && imageInput.files[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    status.textContent = "Veuillez sélectionner une image.";
    return;
  }

  if (file.size > 5500000) {
    status.textContent =
      "L'image est trop volumineuse. Utilisez une image plus légère.";
    return;
  }

  analyser.disabled = true;
  micro.disabled = true;
  photo.disabled = true;

  status.textContent =
    "📷 Lecture et analyse de l'image...";

  try {
    const reader = new FileReader();

    reader.onloadend = async function() {

      try {
        const response = await fetch("/api/image", {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            image: reader.result,
            demande: question.value.trim()
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "Impossible d'analyser l'image."
          );
        }

        question.value = data.texte || "";

        status.textContent =
          "Image analysée. GouRare AI prépare l'analyse complète...";

        await analyserTexte();

      } catch (error) {
        status.textContent =
          error.message || "Erreur pendant l'analyse de l'image.";
      } finally {
        analyser.disabled = false;
        micro.disabled = false;
        photo.disabled = false;
      }
    };

    reader.readAsDataURL(file);

  } catch (error) {
    analyser.disabled = false;
    micro.disabled = false;
    photo.disabled = false;

    status.textContent =
      "Impossible de lire cette image.";
  }
});
</script>

</body>
</html>`;
}


/* =========================================================
   API
========================================================= */

async function handleAnalyze(request, env) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return jsonResponse(
      {
        success: false,
        error: "Le contenu doit être envoyé au format JSON."
      },
      415
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      {
        success: false,
        error: "JSON invalide."
      },
      400
    );
  }

  const question = texte(body.question, LIMITS.question);

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
    const data = await analyserQuestion(env, question, {
      messageMode: body.type === "message"
        ? texte(body.messageMode, 50)
        : null
    });

    return jsonResponse(data);
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error.message || "Erreur pendant l'analyse."
      },
      500
    );
  }
}


/* =========================================================
   API TRANSCRIPTION
========================================================= */

async function handleTranscribe(request, env) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return jsonResponse(
      {
        success: false,
        error: "Le contenu doit être envoyé au format JSON."
      },
      415
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      {
        success: false,
        error: "JSON invalide."
      },
      400
    );
  }

  try {
    const audio = texte(body.audio, LIMITS.audio);
    const langue = texte(body.langue, 10) || "fr";

    const text = await transcrireAudio(
      env,
      audio,
      langue
    );

    if (!text) {
      return jsonResponse(
        {
          success: false,
          error: "Aucun texte n'a pu être détecté dans l'enregistrement."
        },
        422
      );
    }

    return jsonResponse({
      success: true,
      text,
      version: VERSION
    });

  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error:
          error.message ||
          "Erreur pendant la transcription audio."
      },
      500
    );
  }
}


/* =========================================================
   API IMAGE
========================================================= */

async function handleImage(request, env) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return jsonResponse(
      {
        success: false,
        error: "Le contenu doit être envoyé au format JSON."
      },
      415
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      {
        success: false,
        error: "JSON invalide."
      },
      400
    );
  }

  try {
    const image = texte(body.image, LIMITS.image);
    const demande = texte(body.demande, 5000);

    if (!image) {
      return jsonResponse(
        {
          success: false,
          error: "Image absente."
        },
        400
      );
    }

    const analyse = await analyserImage(
      env,
      image,
      demande
    );

    return jsonResponse({
      success: true,
      texte: analyse,
      version: VERSION
    });

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
   WORKER
========================================================= */

export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: headers()
      });
    }

    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          success: true,
          service: "GouRare AI",
          status: "OK",
          version: VERSION,
          modules: {
            texte: true,
            messages: true,
            image: true,
            voix: true,
            moteurDeVerite: true
          }
        }),
        {
          status: 200,
          headers: {
            ...headers(),
            "content-type": "application/json; charset=utf-8"
          }
        }
      );
    }

    if (url.pathname === "/api/analyze") {
      if (request.method !== "POST") {
        return jsonResponse(
          {
            success: false,
            error: "Méthode non autorisée."
          },
          405
        );
      }

      const response = await handleAnalyze(request, env);

      const newHeaders = new Headers(response.headers);

      Object.entries(headers()).forEach(function(entry) {
        newHeaders.set(entry[0], entry[1]);
      });

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders
      });
    }

    if (url.pathname === "/api/transcribe") {
      if (request.method !== "POST") {
        return jsonResponse(
          {
            success: false,
            error: "Méthode non autorisée."
          },
          405
        );
      }

      return handleTranscribe(request, env);
    }

    if (url.pathname === "/api/image") {
      if (request.method !== "POST") {
        return jsonResponse(
          {
            success: false,
            error: "Méthode non autorisée."
          },
          405
        );
      }

      return handleImage(request, env);
    }

    if (url.pathname === "/") {
      return new Response(pageHTML(), {
        status: 200,
        headers: {
          ...headers(),
          "content-type": "text/html; charset=utf-8"
        }
      });
    }

    return new Response("GouRare AI", {
      status: 404,
      headers: headers()
    });
  }
};
