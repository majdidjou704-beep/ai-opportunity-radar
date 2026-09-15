const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const MODEL_VISION = "@cf/meta/llama-3.2-11b-vision-instruct";
const MODEL_AUDIO = "@cf/openai/whisper-large-v3-turbo";
const VERSION = "8.3";

const LIMITS = {
  question: 12000,
  image: 7000000,
  audio: 12000000
};

/* =========================
   SOURCES OFFICIELLES
========================= */

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
  },

  service_public: {
    id: "service_public",
    titre: "Service-Public.fr",
    organisme: "Service-Public.fr",
    url: "https://www.service-public.fr/",
    preuves: [
      "Service-Public.fr est le site officiel d'information administrative de l'administration française."
    ]
  },

  anef: {
    id: "anef",
    titre: "Administration numérique pour les étrangers en France",
    organisme: "Ministère de l'Intérieur",
    url: "https://administration-etrangers-en-france.interieur.gouv.fr/",
    preuves: [
      "Le portail permet d'effectuer ou de suivre certaines démarches administratives concernant les étrangers en France."
    ]
  },

  france_travail: {
    id: "france_travail",
    titre: "France Travail",
    organisme: "France Travail",
    url: "https://www.francetravail.fr/",
    preuves: [
      "France Travail propose des services liés à la recherche d'emploi, aux offres et à l'accompagnement des demandeurs d'emploi."
    ]
  }
};

/* =========================
   OUTILS
========================= */

function texte(v, max = 10000) {
  if (v === null || v === undefined) return "";

  return String(v)
    .replace(/\u0000/g, "")
    .replace(/\r/g, "")
    .trim()
    .slice(0, max);
}

function unique(a) {
  return [...new Set((a || []).filter(Boolean))];
}

function escapeHTML(v) {
  return texte(v, 50000)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function jsonResponse(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    }
  );
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

/* =========================
   PARCOURS
========================= */

const PARCOURS = {
  migrant: {
    titre: "🌍 Migrant / Nouveau arrivant",
    description: "Situation administrative, travail, logement, droits et démarches.",
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
    description: "Vie quotidienne, droits, démarches et problèmes personnels.",
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
    description: "Recherche d'emploi, candidature, CV et entretien.",
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
    description: "Créer, gérer, développer et trouver des opportunités.",
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

/* =========================
   DETECTION
========================= */

function detectContext(q) {
  const s = texte(q, 12000).toLowerCase();

  return {
    nettoyage: /nettoyage|ménage|menage|propreté|proprete|cleaning/.test(s),

    entreprise: /créer|creer|création|creation|lancer|ouvrir|entreprise|société|societe|activité|activite/.test(s),

    statut: /statut|forme juridique|micro|micro-entreprise|microentreprise|indépendant|independant|ei|entreprise individuelle/.test(s),

    travail: /travail|emploi|salarié|salarie|contrat|employeur|licenciement|salaire/.test(s),

    social: /caf|rsa|aide|social|allocation|droits sociaux/.test(s),

    administratif: /démarche|demarche|administratif|administrative|préfecture|prefecture|mairie|document officiel/.test(s),

    juridique: /avocat|juridique|justice|tribunal|loi|légal|legal|mise en demeure/.test(s),

    fiscalite: /impôt|impot|fiscal|fiscalité|fiscalite|urssaf|tva|cfe|cotisation/.test(s),

    migrant: /migrant|nouveau arrivant|étranger|etranger|titre de séjour|titre de sejour|asile|préfecture|prefecture|irrégulière|irreguliere/.test(s),

    message: false
  };
}

function selectSources(c) {
  const ids = [];

  if (c.entreprise || c.statut) {
    ids.push("statut");
  }

  if (c.entreprise && c.statut) {
    ids.push("creation_ei");
  }

  if (c.entreprise) {
    ids.push("guichet");
  }

  if (c.migrant || c.administratif) {
    ids.push("service_public");
    ids.push("anef");
  }

  if (c.travail) {
    ids.push("france_travail");
  }

  return unique(ids).map(function(id) {
    return SOURCES[id];
  });
}

/* =========================
   MOTEUR DE VERITE
========================= */

function confirmed(q, c, sources) {
  const out = [];

  if (
    c.entreprise &&
    sources.some(function(s) {
      return s.id === "statut";
    })
  ) {
    out.push(
      "Le choix de la forme juridique peut être étudié en fonction de l'activité envisagée, du chiffre d'affaires estimé, des revenus, de la couverture sociale et de la gestion."
    );
  }

  if (
    c.statut &&
    /entreprise individuelle|\bei\b|micro|micro-entreprise|microentreprise/.test(
      q.toLowerCase()
    ) &&
    sources.some(function(s) {
      return s.id === "creation_ei";
    })
  ) {
    out.push(
      "Pour une entreprise individuelle, certaines formalités d'immatriculation et de déclaration d'activité sont prévues."
    );

    out.push(
      "La demande d'immatriculation d'une entreprise individuelle se fait sur le Guichet des formalités des entreprises."
    );
  }

  return unique(out);
}

function documents(q, c) {
  if (
    c.statut &&
    /entreprise individuelle|\bei\b|micro|micro-entreprise|microentreprise/.test(
      q.toLowerCase()
    )
  ) {
    return [
      {
        statut: "à vérifier",
        texte: "Vérifier les justificatifs demandés pour la forme juridique choisie."
      },
      {
        statut: "conditionnel",
        texte: "Si l'activité est réglementée, vérifier les éventuels justificatifs d'autorisation, diplôme ou titre."
      }
    ];
  }

  return [];
}

function actions(q, c) {
  const a = [];

  if (c.entreprise) {
    a.push("Décrire précisément les prestations ou produits proposés.");
  }

  if (c.entreprise && !c.statut) {
    a.push("Comparer les formes juridiques possibles avant de choisir un statut.");
  }

  if (c.entreprise && c.statut) {
    a.push(
      "Vérifier les formalités correspondant exactement à la forme juridique et à l'activité choisies."
    );
  }

  if (c.migrant) {
    a.push(
      "Préciser le pays, la situation administrative et l'objectif afin d'identifier la démarche adaptée."
    );
  }

  if (c.travail) {
    a.push(
      "Préciser le métier recherché, la situation actuelle et les contraintes éventuelles."
    );
  }

  return unique(a);
}

function recommendations(q, c) {
  const a = [];

  if (c.entreprise) {
    a.push(
      "Décrire précisément l'activité avant de prendre une décision administrative ou juridique."
    );
  }

  if (c.entreprise && !c.statut) {
    a.push(
      "Comparer les formes juridiques avant de retenir celle qui correspond au projet."
    );
  }

  if (c.entreprise && c.statut) {
    a.push(
      "Vérifier les formalités officielles après avoir défini la forme juridique et la nature exacte de l'activité."
    );
  }

  if (c.migrant) {
    a.push(
      "Ne pas déduire votre situation juridique à partir d'informations générales : vérifier les règles correspondant exactement à votre situation."
    );
  }

  return unique(a);
}

function nextAction(q, c) {
  if (c.entreprise && !c.statut) {
    return "Préciser exactement l'activité et les prestations envisagées, puis comparer les formes juridiques adaptées.";
  }

  if (c.entreprise && c.statut) {
    return "Vérifier les formalités officielles correspondant exactement à la forme juridique et à l'activité choisies.";
  }

  if (c.message) {
    return "Vérifier que le projet de réponse correspond bien au contenu et au contexte du message reçu.";
  }

  if (c.migrant) {
    return "Préciser votre pays, votre situation actuelle et votre objectif afin d'identifier la prochaine démarche utile.";
  }

  if (c.travail) {
    return "Préciser le métier ou le type d'emploi recherché afin d'identifier les prochaines possibilités.";
  }

  return "Préciser votre situation et votre objectif afin de déterminer la prochaine action utile.";
}

/* =========================
   IA
========================= */

function systemPrompt() {
  return `
Tu es GouRare AI, un assistant intelligent d'orientation et d'analyse.

Tu n'es pas avocat, expert-comptable, médecin, administration ou travailleur social.

Ton rôle est d'aider l'utilisateur à comprendre sa situation, identifier les informations utiles, vérifier les points importants et déterminer une prochaine action.

REGLES ABSOLUES :

1. Ne jamais inventer de fait concernant l'utilisateur.
2. Ne jamais supposer son statut administratif, son droit au séjour, sa nationalité, son emploi, son logement, son revenu ou sa situation familiale.
3. Ne jamais transformer une hypothèse en fait.
4. Ne jamais inventer de loi, article, taux, montant, seuil, délai, sanction, obligation, autorisation, diplôme, document, statistique ou prix.
5. Les informations officielles fournies par le moteur de vérité sont prioritaires.
6. Si une information n'est pas confirmée, indique clairement qu'elle doit être vérifiée.
7. Pour une situation migratoire ou administrative, rester neutre et légal.
8. Pour une situation irrégulière, fournir uniquement une orientation légale et sûre : droits, procédures officielles, organismes compétents et possibilités de conseil juridique.
9. Ne jamais expliquer comment contourner une loi, falsifier un document, éviter un contrôle ou tromper une administration.
10. Ne répète pas les URL dans ton texte : elles sont affichées séparément.
11. Pour un message ou un email, respecte strictement son contenu.
12. Pour une image, analyse uniquement ce qui est réellement visible ou lisible.
13. Si l'utilisateur n'a pas fourni une information, dis qu'elle manque au lieu de la deviner.
`;
}

async function askAI(env, prompt, maxTokens = 900) {
  try {
    const r = await env.IA.run(
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

    if (typeof r === "string") return r;
    if (r?.response) return r.response;
    if (r?.result?.response) return r.result.response;

    return "";
  } catch (e) {
    return "";
  }
}

/* =========================
   MESSAGES
========================= */

function messagePrompt(contenu, mode, langue) {
  const instructions = {
    analyse:
      "Analyse le message : faits, demande, éléments importants, incertitudes et réponse possible.",

    reponse:
      "Prépare une réponse claire, polie et adaptée. N'invente aucun fait.",

    reformulation:
      "Réécris le message plus clairement sans changer son sens.",

    correction:
      "Corrige les fautes et améliore légèrement la formulation sans changer le sens.",

    traduction:
      "Traduis fidèlement le contenu dans la langue demandée."
  };

  return (
    "Langue : " +
    (langue || "français") +
    "\nMode : " +
    (instructions[mode] || instructions.analyse) +
    "\nCONTENU :\n" +
    texte(contenu, 18000)
  );
}

/* =========================
   IMAGE
========================= */

async function analyserImage(env, image, demande = "") {
  if (!image || typeof image !== "string") {
    throw new Error("Image absente.");
  }

  if (image.length > LIMITS.image) {
    throw new Error("Image trop volumineuse.");
  }

  const r = await env.IA.run(
    MODEL_VISION,
    {
      messages: [
        {
          role: "system",
          content:
            "Analyse uniquement ce qui est réellement visible ou lisible. Ne devine jamais un texte illisible. Si un document est visible, distingue clairement ce qui est lisible de ce qui ne l'est pas."
        },
        {
          role: "user",
          content:
            demande ||
            "Lis et analyse cette image. Identifie les éléments visibles, explique leur contenu et indique ce qui reste incertain."
        }
      ],
      image,
      max_tokens: 2200,
      temperature: 0.1
    }
  );

  if (typeof r === "string") return r;
  if (r?.response) return r.response;
  if (r?.result?.response) return r.result.response;

  return typeof r?.result === "string"
    ? r.result
    : JSON.stringify(r);
}

function base64FromDataURL(v) {
  const s = texte(v, LIMITS.audio);
  const i = s.indexOf(",");

  return s.startsWith("data:") && i >= 0
    ? s.slice(i + 1)
    : s;
}

async function transcrireAudio(env, audio, langue = "fr") {
  if (!audio) {
    throw new Error("Audio absent.");
  }

  if (audio.length > LIMITS.audio) {
    throw new Error("Audio trop volumineux.");
  }

  const r = await env.IA.run(
    MODEL_AUDIO,
    {
      audio: base64FromDataURL(audio),
      task: "transcribe",
      language: langue
    }
  );

  return texte(
    r?.text ||
    r?.transcription_info?.text ||
    "",
    20000
  );
}

/* =========================
   ANALYSE PRINCIPALE
========================= */

async function analyserQuestion(env, q, options = {}) {
  const contexte = detectContext(q);

  contexte.message = !!options.messageMode;

  const sources = selectSources(contexte);

  let orientation = "";

  if (contexte.message) {
    orientation = await askAI(
      env,
      messagePrompt(
        q,
        options.messageMode,
        options.langue
      ),
      1200
    );
  } else {
    if (contexte.entreprise && contexte.nettoyage) {
      orientation =
        "Pour un projet de nettoyage, il faut d'abord préciser les prestations envisagées et déterminer la forme juridique adaptée. Les formalités doivent ensuite être vérifiées en fonction de ces éléments.";
    } else if (contexte.entreprise) {
      orientation =
        "Pour un projet d'entreprise, il faut d'abord préciser l'activité et déterminer la forme juridique adaptée. Les formalités dépendent ensuite de la situation exacte.";
    } else if (contexte.migrant) {
      orientation =
        "Pour une situation concernant un migrant ou un nouvel arrivant, GouRare AI commence par identifier le pays, la situation actuelle et l'objectif avant d'orienter vers les informations ou démarches pertinentes.";
    } else if (contexte.travail) {
      orientation =
        "Pour une recherche d'emploi, GouRare AI commence par identifier le type d'emploi recherché, la situation actuelle et les éventuelles contraintes afin de proposer une orientation adaptée.";
    } else {
      orientation =
        "GouRare AI analyse votre situation afin d'identifier les informations utiles, les éléments à vérifier et la prochaine action.";
    }

    /*
      L'IA complète uniquement l'orientation.
      Elle ne remplace jamais les faits déterministes
      produits par le moteur de vérité.
    */

    const ai = await askAI(
      env,
      "Question utilisateur :\n" +
        q +
        "\n\nContexte détecté :\n" +
        JSON.stringify(contexte) +
        "\n\nInformations officielles disponibles :\n" +
        JSON.stringify(
          sources.map(function(s) {
            return {
              titre: s.titre,
              organisme: s.organisme,
              preuves: s.preuves
            };
          })
        ) +
        "\n\nDonne une explication courte et prudente. " +
        "Ne suppose aucune information absente. " +
        "N'ajoute aucune obligation ou fait nouveau. " +
        "Si les informations manquent, indique ce qui doit être précisé.",
      700
    );

    if (ai) {
      orientation += "\n\n" + ai;
    }
  }

  return {
    success: true,
    version: VERSION,

    compris: contexte.message
      ? "Vous souhaitez analyser ou traiter un message ou un contenu fourni."
      : q,

    orientation,

    confirmed: confirmed(
      q,
      contexte,
      sources
    ),

    toVerify: contexte.message
      ? []
      : [
          ...(contexte.entreprise && !contexte.statut
            ? ["La forme juridique la plus adaptée à votre projet."]
            : []),

          ...(contexte.entreprise
            ? ["La nature exacte de l'activité et des prestations."]
            : []),

          ...(contexte.migrant
            ? ["Les règles exactes correspondant à votre situation administrative."]
            : [])
        ],

    recommendations:
      recommendations(
        q,
        contexte
      ),

    actions:
      actions(
        q,
        contexte
      ),

    documents:
      documents(
        q,
        contexte
      ),

    risks: [],

    professional: [],

    nextAction:
      nextAction(
        q,
        contexte
      ),

    sources: sources.map(function(s) {
      return {
        id: s.id,
        titre: s.titre,
        organisme: s.organisme,
        url: s.url
      };
    })
  };
}

/* =========================
   PAGE WEB
========================= */

function pageHTML() {
  const parcoursJSON = JSON.stringify(PARCOURS);

  return `<!doctype html>
<html lang="fr">

<head>

<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<meta
  name="theme-color"
  content="#111827"
>

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
  padding: 0 15px 100px;
}

.card,
.result-card {
  background: white;
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 18px;
  box-shadow:
    0 8px 30px rgba(0,0,0,.07);
}

.welcome {
  text-align: center;
}

h2 {
  margin-top: 0;
}

.choices {
  display: grid;
  grid-template-columns:
    repeat(2, 1fr);
  gap: 14px;
}

.choice {
  padding: 22px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: white;
  text-align: left;
  cursor: pointer;
  transition: .15s;
}

.choice:hover {
  transform: translateY(-1px);
  box-shadow:
    0 5px 18px rgba(0,0,0,.06);
}

.choice strong {
  display: block;
  font-size: 19px;
  margin-bottom: 7px;
}

.choice span {
  color: #6b7280;
}

textarea,
input,
select {
  width: 100%;
  padding: 13px;
  border: 1px solid #d1d5db;
  border-radius: 11px;
  font-size: 16px;
  background: white;
}

textarea {
  min-height: 130px;
  resize: vertical;
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

.secondary {
  background: #e5e7eb;
  color: #111827;
}

.back {
  margin-bottom: 15px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.actions button {
  flex: 1;
}

.result-card {
  border-left:
    5px solid #111827;
}

.ai-result {
  white-space: pre-wrap;
  line-height: 1.65;
}

.result-card ul {
  padding-left: 22px;
}

.source {
  padding: 11px;
  background: #f3f4f6;
  border-radius: 10px;
  margin: 8px 0;
}

.source a {
  color: #111827;
  font-weight: 600;
}

.status {
  margin-top: 10px;
  color: #4b5563;
}

.hidden {
  display: none;
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

@media(max-width:650px) {

  .choices {
    grid-template-columns: 1fr;
  }

  header h1 {
    font-size: 27px;
  }

  .actions button {
    width: 100%;
    flex-basis: 100%;
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

<div
  id="parcours"
  class="card welcome"
></div>

<div
  id="assistant"
  class="card hidden"
>

<button
  class="secondary back"
  id="retour"
>
← Retour
</button>

<h2 id="titreParcours"></h2>

<p id="descriptionParcours"></p>

<div
  id="situations"
  class="choices"
></div>

</div>

<div
  id="outil"
  class="card hidden"
>

<button
  class="secondary back"
  id="retourOutil"
>
← Retour
</button>

<h2>
🧠 Votre demande
</h2>

<textarea
  id="question"
  placeholder="Expliquez votre situation..."
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
>

</div>

<div
  id="messageCard"
  class="card hidden"
>

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
  placeholder="Langue souhaitée pour une traduction (français, arabe, anglais)"
  style="margin-top:10px"
>

</div>

<div id="result"></div>

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

const PARCOURS_DATA = ${parcoursJSON};

const parcours =
  document.getElementById("parcours");

const assistant =
  document.getElementById("assistant");

const outil =
  document.getElementById("outil");

const messageCard =
  document.getElementById("messageCard");

const situations =
  document.getElementById("situations");

const titre =
  document.getElementById("titreParcours");

const desc =
  document.getElementById("descriptionParcours");

const question =
  document.getElementById("question");

const result =
  document.getElementById("result");

const status =
  document.getElementById("status");

const messageMode =
  document.getElementById("messageMode");

const langue =
  document.getElementById("langue");

const imageInput =
  document.getElementById("imageInput");

let profil = null;

let mediaRecorder = null;

let audioChunks = [];

let recording = false;

/* =========================
   SECURITE HTML
========================= */

function esc(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}

/* =========================
   ACCUEIL
========================= */

function showHome() {

  profil = null;

  parcours.classList.remove("hidden");

  assistant.classList.add("hidden");

  outil.classList.add("hidden");

  messageCard.classList.add("hidden");

  result.innerHTML = "";

  parcours.innerHTML =
    "<h2>Comment pouvons-nous vous orienter ?</h2>" +
    "<p>Choisissez le parcours qui correspond le mieux à votre situation.</p>" +
    "<div class='choices' id='profils'></div>" +
    "<p style='margin-top:18px'>" +
    "<button id='inconnu' class='secondary'>" +
    "✨ Je ne sais pas où aller — GouRare AI m'oriente" +
    "</button>" +
    "</p>";

  const p =
    document.getElementById("profils");

  Object.keys(PARCOURS_DATA)
    .forEach(function(k) {

      const x =
        PARCOURS_DATA[k];

      p.innerHTML +=
        "<div class='choice' data-p='" +
        esc(k) +
        "'>" +
        "<strong>" +
        esc(x.titre) +
        "</strong>" +
        "<span>" +
        esc(x.description) +
        "</span>" +
        "</div>";

    });

  p.querySelectorAll(".choice")
    .forEach(function(b) {

      b.onclick = function() {

        openProfil(
          b.dataset.p
        );

      };

    });

  document
    .getElementById("inconnu")
    .onclick = function() {

      profil = "particulier";

      parcours.classList.add("hidden");

      assistant.classList.add("hidden");

      outil.classList.remove("hidden");

      messageCard.classList.add("hidden");

      question.value =
        "Je ne sais pas quel parcours correspond à ma situation. Aidez-moi à m'orienter.";

      status.textContent =
        "GouRare AI va vous orienter.";

    };

}

/* =========================
   PROFIL
========================= */

function openProfil(k) {

  profil = k;

  const x =
    PARCOURS_DATA[k];

  if (!x) {

    showHome();

    return;

  }

  parcours.classList.add("hidden");

  outil.classList.add("hidden");

  messageCard.classList.add("hidden");

  assistant.classList.remove("hidden");

  titre.textContent =
    x.titre;

  desc.textContent =
    x.description;

  situations.innerHTML = "";

  x.situations.forEach(
    function(item) {

      const b =
        document.createElement("div");

      b.className = "choice";

      b.innerHTML =
        "<strong>" +
        esc(item[1]) +
        "</strong>";

      b.dataset.s =
        item[0];

      b.onclick =
        function() {

          openSituation(
            item[0],
            item[1]
          );

        };

      situations.appendChild(b);

    }
  );

}

/* =========================
   SITUATION
========================= */

function openSituation(
  s,
  label
) {

  assistant.classList.add("hidden");

  outil.classList.remove("hidden");

  result.innerHTML = "";

  question.value = "";

  status.textContent =
    "Parcours sélectionné : " +
    label;

  messageMode.value = "";

  messageCard.classList.add("hidden");

  if (
    s === "message" ||
    s === "document"
  ) {

    messageCard.classList.remove("hidden");

    messageMode.value =
      "analyse";

  }

}

/* =========================
   RETOUR
========================= */

document
  .getElementById("retour")
  .onclick = showHome;

document
  .getElementById("retourOutil")
  .onclick = function() {

    outil.classList.add("hidden");

    messageCard.classList.add("hidden");

    assistant.classList.remove("hidden");

    result.innerHTML = "";

  };

/* =========================
   ANALYSE TEXTE
========================= */

async function analyserTexte() {

  const q =
    question.value.trim();

  if (!q) {

    status.textContent =
      "Veuillez écrire ou dire votre demande.";

    return;

  }

  status.textContent =
    "Analyse en cours...";

  result.innerHTML = "";

  try {

    const r =
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
                messageMode.value
                  ? "message"
                  : "question",

              question: q,

              messageMode:
                messageMode.value ||
                null,

              langue:
                langue.value.trim()
            })
        }
      );

    const d =
      await r.json();

    if (
      !r.ok ||
      !d.success
    ) {

      throw new Error(
        d.error ||
        "Erreur."
      );

    }

    afficher(d);

    status.textContent =
      "Analyse terminée.";

  } catch (e) {

    status.textContent =
      e.message ||
      "Erreur.";

  }

}

/* =========================
   LISTE
========================= */

function liste(a) {

  if (
    !a ||
    !a.length
  ) {

    return (
      "<p>Aucun élément précis à présenter à ce stade.</p>"
    );

  }

  return (
    "<ul>" +
    a.map(function(x) {

      const v =
        typeof x === "string"
          ? x
          : (
              x.texte ||
              JSON.stringify(x)
            );

      return (
        "<li>" +
        esc(v) +
        "</li>"
      );

    }).join("") +
    "</ul>"
  );

}

/* =========================
   AFFICHAGE RESULTAT
========================= */

function afficher(d) {

  let h = "";

  h +=
    "<div class='result-card'>" +
    "<h2>🧭 Ce que j'ai compris</h2>" +
    "<div class='ai-result'>" +
    esc(d.compris) +
    "</div>" +
    "</div>";

  h +=
    "<div class='result-card'>" +
    "<h2>💡 Orientation</h2>" +
    "<div class='ai-result'>" +
    esc(d.orientation) +
    "</div>" +
    "</div>";

  h +=
    "<div class='result-card'>" +
    "<h2>✅ Informations confirmées</h2>" +
    liste(d.confirmed) +
    "</div>";

  h +=
    "<div class='result-card'>" +
    "<h2>🔎 À vérifier</h2>" +
    liste(d.toVerify) +
    "</div>";

  h +=
    "<div class='result-card'>" +
    "<h2>💭 Recommandations</h2>" +
    liste(d.recommendations) +
    "</div>";

  h +=
    "<div class='result-card'>" +
    "<h2>📋 Actions concrètes</h2>" +
    liste(d.actions) +
    "</div>";

  h +=
    "<div class='result-card'>" +
    "<h2>📄 Documents</h2>" +
    (
      d.documents &&
      d.documents.length
        ? liste(d.documents)
        : "<p>Aucun document précis à présenter à ce stade.</p>"
    ) +
    "</div>";

  h +=
    "<div class='result-card'>" +
    "<h2>🚀 Prochaine action</h2>" +
    "<div class='ai-result'>" +
    esc(d.nextAction) +
    "</div>" +
    "</div>";

  h +=
    "<div class='result-card'>" +
    "<h2>📚 Sources consultées</h2>";

  (d.sources || [])
    .forEach(function(s) {

      h +=
        "<div class='source'>" +
        esc(s.organisme) +
        " — " +
        esc(s.titre) +
        "<br>" +
        "<a href='" +
        esc(s.url) +
        "' target='_blank' rel='noopener noreferrer'>" +
        "Consulter la source officielle ↗" +
        "</a>" +
        "</div>";

    });

  h +=
    "</div>";

  result.innerHTML =
    h;

}

/* =========================
   ANALYSER
========================= */

document
  .getElementById("analyser")
  .onclick =
  analyserTexte;

/* =========================
   IMAGE
========================= */

document
  .getElementById("photo")
  .onclick =
  function() {

    imageInput.click();

  };

imageInput.onchange =
  function() {

    const f =
      imageInput.files &&
      imageInput.files[0];

    if (!f) return;

    if (
      !f.type.startsWith("image/")
    ) {

      status.textContent =
        "Veuillez sélectionner une image.";

      return;

    }

    if (
      f.size > 5500000
    ) {

      status.textContent =
        "Image trop volumineuse.";

      return;

    }

    const rd =
      new FileReader();

    status.textContent =
      "📷 Analyse de l'image...";

    rd.onloadend =
      async function() {

        try {

          const r =
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
                      rd.result,

                    demande:
                      question.value.trim()
                  })
              }
            );

          const d =
            await r.json();

          if (
            !r.ok ||
            !d.success
          ) {

            throw new Error(
              d.error ||
              "Erreur image."
            );

          }

          question.value =
            d.texte || "";

          await analyserTexte();

        } catch (e) {

          status.textContent =
            e.message ||
            "Erreur image.";

        }

      };

    rd.readAsDataURL(f);

  };

/* =========================
   MICROPHONE
========================= */

document
  .getElementById("micro")
  .onclick =
  async function() {

    if (
      recording &&
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
        "Microphone indisponible.";

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

      recording = true;

      this.textContent =
        "⏹️ Arrêter";

      status.textContent =
        "🎙️ Je vous écoute...";

      mediaRecorder.ondataavailable =
        function(e) {

          if (e.data.size) {

            audioChunks.push(
              e.data
            );

          }

        };

      mediaRecorder.onstop =
        async function() {

          recording = false;

          document
            .getElementById("micro")
            .textContent =
            "🎙️ Parler";

          stream
            .getTracks()
            .forEach(
              function(t) {
                t.stop();
              }
            );

          const blob =
            new Blob(
              audioChunks,
              {
                type:
                  mediaRecorder.mimeType ||
                  "audio/webm"
              }
            );

          const rd =
            new FileReader();

          rd.onloadend =
            async function() {

              try {

                const r =
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
                            rd.result,

                          langue:
                            "fr"
                        })
                    }
                  );

                const d =
                  await r.json();

                if (
                  !r.ok ||
                  !d.success
                ) {

                  throw new Error(
                    d.error ||
                    "Erreur audio."
                  );

                }

                question.value =
                  d.text || "";

                await analyserTexte();

              } catch (e) {

                status.textContent =
                  e.message ||
                  "Erreur audio.";

              }

            };

          rd.readAsDataURL(
            blob
          );

        };

      mediaRecorder.start();

    } catch (e) {

      status.textContent =
        "L'accès au microphone a été refusé ou est indisponible.";

    }

  };

/* =========================
   DEMARRAGE
========================= */

showHome();

</script>

</body>

</html>`;
}

/* =========================
   API ANALYSE
========================= */

async function handleAnalyze(
  request,
  env
) {

  if (
    !(request.headers.get("content-type") || "")
      .includes("application/json")
  ) {

    return jsonResponse(
      {
        success: false,
        error:
          "Le contenu doit être envoyé au format JSON."
      },
      415
    );

  }

  let b;

  try {

    b =
      await request.json();

  } catch {

    return jsonResponse(
      {
        success: false,
        error:
          "JSON invalide."
      },
      400
    );

  }

  const q =
    texte(
      b.question,
      LIMITS.question
    );

  if (!q) {

    return jsonResponse(
      {
        success: false,
        error:
          "Question vide."
      },
      400
    );

  }

  try {

    return jsonResponse(
      await analyserQuestion(
        env,
        q,
        {
          messageMode:
            b.type === "message"
              ? texte(
                  b.messageMode,
                  50
                )
              : null,

          langue:
            texte(
              b.langue,
              50
            )
        }
      )
    );

  } catch (e) {

    return jsonResponse(
      {
        success: false,
        error:
          e.message ||
          "Erreur."
      },
      500
    );

  }

}

/* =========================
   API AUDIO
========================= */

async function handleTranscribe(
  request,
  env
) {

  let b;

  try {

    b =
      await request.json();

  } catch {

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

    const text =
      await transcrireAudio(
        env,
        texte(
          b.audio,
          LIMITS.audio
        ),
        texte(
          b.langue,
          10
        ) || "fr"
      );

    if (!text) {

      return jsonResponse(
        {
          success: false,
          error:
            "Aucun texte détecté."
        },
        422
      );

    }

    return jsonResponse(
      {
        success: true,
        text,
        version: VERSION
      }
    );

  } catch (e) {

    return jsonResponse(
      {
        success: false,
        error:
          e.message ||
          "Erreur audio."
      },
      500
    );

  }

}

/* =========================
   API IMAGE
========================= */

async function handleImage(
  request,
  env
) {

  let b;

  try {

    b =
      await request.json();

  } catch {

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
        b.image,
        LIMITS.image
      );

    if (!image) {

      return jsonResponse(
        {
          success: false,
          error:
            "Image absente."
        },
        400
      );

    }

    return jsonResponse(
      {
        success: true,

        texte:
          await analyserImage(
            env,
            image,
            texte(
              b.demande,
              5000
            )
          ),

        version: VERSION
      }
    );

  } catch (e) {

    return jsonResponse(
      {
        success: false,
        error:
          e.message ||
          "Erreur image."
      },
      500
    );

  }

}

/* =========================
   WORKER
========================= */

export default {

  async fetch(
    request,
    env
  ) {

    const url =
      new URL(
        request.url
      );

    if (
      request.method ===
      "OPTIONS"
    ) {

      return new Response(
        null,
        {
          status: 204,
          headers:
            securityHeaders()
        }
      );

    }

    if (
      url.pathname ===
      "/health"
    ) {

      return new Response(
        JSON.stringify({
          success: true,
          service: "GouRare AI",
          status: "OK",
          version: VERSION,

          modules: {
            texte: true,
            parcours: true,
            messages: true,
            image: true,
            voix: true,
            moteurDeVerite: true
          }
        }),
        {
          headers: {
            ...securityHeaders(),
            "content-type":
              "application/json; charset=utf-8"
          }
        }
      );

    }

    if (
      url.pathname ===
      "/api/analyze"
    ) {

      if (
        request.method !==
        "POST"
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

      const r =
        await handleAnalyze(
          request,
          env
        );

      const h =
        new Headers(
          r.headers
        );

      Object.entries(
        securityHeaders()
      ).forEach(
        function(entry) {

          h.set(
            entry[0],
            entry[1]
          );

        }
      );

      return new Response(
        r.body,
        {
          status:
            r.status,

          headers: h
        }
      );

    }

    if (
      url.pathname ===
      "/api/transcribe"
    ) {

      if (
        request.method !==
        "POST"
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

      return handleTranscribe(
        request,
        env
      );

    }

    if (
      url.pathname ===
      "/api/image"
    ) {

      if (
        request.method !==
        "POST"
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

      return handleImage(
        request,
        env
      );

    }

    if (
      url.pathname ===
      "/"
    ) {

      return new Response(
        pageHTML(),
        {
          headers: {
            ...securityHeaders(),
            "content-type":
              "text/html; charset=utf-8"
          }
        }
      );

    }

    return new Response(
      "GouRare AI",
      {
        status: 404,
        headers:
          securityHeaders()
      }
    );

  }

};
