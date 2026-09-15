const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const MODEL_VISION = "@cf/meta/llama-3.2-11b-vision-instruct";
const MODEL_AUDIO = "@cf/openai/whisper-large-v3-turbo";

const VERSION = "10.0";

const LIMITS = {
  question: 12000,
  imageFile: 5500000,
  imageData: 8000000,
  audioFile: 9000000,
  audioData: 16000000,
  historique: 24000,
  analyzeBody: 400000,
  imageBody: 8500000,
  audioBody: 17000000,
  documentText: 30000,
  extractedInfo: 20000
};

const RATE_LIMITS = {
  analyze: {
    windowMs: 60000,
    maxRequests: 20
  },
  image: {
    windowMs: 60000,
    maxRequests: 6
  },
  transcribe: {
    windowMs: 60000,
    maxRequests: 6
  }
};

const LANGUAGES = {
  ar: {
    name: "العربية",
    native: "العربية"
  },
  fr: {
    name: "Français",
    native: "Français"
  },
  es: {
    name: "Español",
    native: "Español"
  },
  en: {
    name: "English",
    native: "English"
  },
  it: {
    name: "Italiano",
    native: "Italiano"
  },
  de: {
    name: "Deutsch",
    native: "Deutsch"
  },
  pt: {
    name: "Português",
    native: "Português"
  }
};

const COUNTRY_LANGUAGES = {
  FR: "fr",
  ES: "es",
  DE: "de",
  IT: "it",
  PT: "pt",
  GB: "en",
  IE: "en",
  AT: "de",
  BE: "fr",
  LU: "fr",
  NL: "nl"
};

const SOURCES = {
  anef: {
    id: "anef",
    titre: "Démarches des étrangers en France",
    organisme: "Service-Public.fr",
    url: "https://www.service-public.fr/particuliers/vosdroits/R59398"
  },

  travailEtranger: {
    id: "travailEtranger",
    titre: "Autorisation de travail d'un étranger salarié en France",
    organisme: "Service-Public.fr",
    url: "https://www.service-public.fr/particuliers/vosdroits/F2728"
  },

  franceTravail: {
    id: "franceTravail",
    titre: "France Travail",
    organisme: "France Travail",
    url: "https://www.francetravail.fr/"
  },

  statut: {
    id: "statut",
    titre: "Trouver le statut juridique adapté à son activité",
    organisme: "Service Public Entreprendre",
    url: "https://entreprendre.service-public.fr/vosdroits/R18323"
  },

  guichet: {
    id: "guichet",
    titre: "Guichet des formalités des entreprises",
    organisme: "Service Public Entreprendre",
    url: "https://entreprendre.service-public.fr/vosdroits/F23571"
  }
};


/* =========================================================
   OUTILS DE BASE
========================================================= */

function texte(value, max = 10000) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim().slice(0, max);
}

function safeJSON(value, fallback = null) {
  try {
    if (typeof value === "string") {
      return JSON.parse(value);
    }

    return value;
  } catch {
    return fallback;
  }
}

function normalizeLang(v) {
  const s = texte(v, 50).toLowerCase();

  if (
    /^(ar|arab|arabic|العربية|عربي)/i.test(s)
  ) {
    return "ar";
  }

  if (
    /^(fr|fra|french|français|francais)/i.test(s)
  ) {
    return "fr";
  }

  if (
    /^(es|spa|spanish|español|espanol)/i.test(s)
  ) {
    return "es";
  }

  if (
    /^(en|eng|english|anglais)/i.test(s)
  ) {
    return "en";
  }

  if (
    /^(it|ita|italian|italiano)/i.test(s)
  ) {
    return "it";
  }

  if (
    /^(de|ger|german|deutsch|allemand)/i.test(s)
  ) {
    return "de";
  }

  if (
    /^(pt|por|portuguese|português|portugues)/i.test(s)
  ) {
    return "pt";
  }

  return "fr";
}

function languageName(langue) {
  return LANGUAGES[langue]?.name || LANGUAGES.fr.name;
}

function detectLanguage(text) {
  const s = texte(text, 12000);

  if (!s) {
    return "fr";
  }

  const scores = {
    ar: 0,
    fr: 0,
    es: 0,
    en: 0,
    it: 0,
    de: 0,
    pt: 0
  };

  if (/[\u0600-\u06FF]/.test(s)) {
    scores.ar += 10;
  }

  if (/\b(le|la|les|des|une|un|avec|pour|dans|vous|nous|est|pas|sur)\b/i.test(s)) {
    scores.fr += 4;
  }

  if (/\b(el|la|los|las|para|con|una|uno|está|usted|que)\b/i.test(s)) {
    scores.es += 4;
  }

  if (/\b(the|and|with|for|from|you|your|is|are|not)\b/i.test(s)) {
    scores.en += 4;
  }

  if (/\b(il|lo|gli|per|con|una|uno|sono|che|non)\b/i.test(s)) {
    scores.it += 4;
  }

  if (/\b(der|die|das|und|mit|für|eine|ein|nicht|ist)\b/i.test(s)) {
    scores.de += 4;
  }

  if (/\b(o|a|os|as|para|com|uma|um|não|não)\b/i.test(s)) {
    scores.pt += 3;
  }

  let best = "fr";
  let score = -1;

  for (const key of Object.keys(scores)) {
    if (scores[key] > score) {
      score = scores[key];
      best = key;
    }
  }

  return best;
}

function countryOfficialLanguage(country) {
  const c = texte(country, 10).toUpperCase();

  return COUNTRY_LANGUAGES[c] || "fr";
}

function truncateJSON(value, max = 20000) {
  try {
    return JSON.stringify(value).slice(0, max);
  } catch {
    return "{}";
  }
}


/* =========================================================
   SÉCURITÉ / HEADERS
========================================================= */

function securityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), geolocation=(), payment=()",
    "Content-Security-Policy":
      "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self';"
  };
}

function jsonResponse(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...securityHeaders()
      }
    }
  );
}

function htmlResponse(html, status = 200) {
  return new Response(
    html,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        ...securityHeaders()
      }
    }
  );
}


/* =========================================================
   RATE LIMIT
========================================================= */

const memoryRate = new Map();

function getClientKey(request, type) {
  const forwarded =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "anonymous";

  return `${type}:${forwarded.split(",")[0].trim()}`;
}

function checkRateLimit(request, type) {
  const rule = RATE_LIMITS[type];

  if (!rule) {
    return true;
  }

  const key = getClientKey(request, type);
  const now = Date.now();

  let entry = memoryRate.get(key);

  if (!entry || now - entry.start > rule.windowMs) {
    entry = {
      start: now,
      count: 0
    };
  }

  entry.count += 1;
  memoryRate.set(key, entry);

  return entry.count <= rule.maxRequests;
}


/* =========================================================
   VALIDATION
========================================================= */

function validateQuestion(question) {
  const q = texte(question, LIMITS.question);

  if (!q) {
    throw new Error("La question est vide.");
  }

  if (q.length > LIMITS.question) {
    throw new Error("La question est trop longue.");
  }

  return q;
}

async function readJSON(request, maxBytes = LIMITS.analyzeBody) {
  const length = Number(request.headers.get("content-length") || 0);

  if (length && length > maxBytes) {
    throw new Error("Requête trop volumineuse.");
  }

  const text = await request.text();

  if (text.length > maxBytes) {
    throw new Error("Requête trop volumineuse.");
  }

  const data = safeJSON(text);

  if (!data) {
    throw new Error("JSON invalide.");
  }

  return data;
}


/* =========================================================
   EXTRACTION D'INFORMATIONS DE LA CONVERSATION
========================================================= */

function info(type, valeur, source = "conversation", confiance = "forte") {
  return {
    type,
    valeur: texte(valeur, 1000),
    source,
    confiance
  };
}

function extraireInformations(question) {
  const q = texte(question, LIMITS.question);
  const lower = q.toLowerCase();

  const result = [];

  if (
    /\ben france\b/i.test(q) ||
    /\bfrance\b/i.test(q)
  ) {
    result.push(
      info("presence_france", "Oui")
    );
  }

  if (
    /sans diplôme|sans dipl[oô]me|pas de diplôme|aucun diplôme/i.test(q)
  ) {
    result.push(
      info("diplome", "Aucun diplôme déclaré")
    );
  }

  if (
    /sans expérience|sans experience|aucune expérience|aucune experience/i.test(q)
  ) {
    result.push(
      info("experience", "Aucune expérience déclarée")
    );
  }

  if (
    /titre de séjour|titre de sejour|carte de séjour|carte de sejour/i.test(q)
  ) {
    result.push(
      info("titre_sejour", "Titre de séjour mentionné")
    );
  }

  if (
    /\bsalari[ée]\b/i.test(q) ||
    /\bsalarié\b/i.test(q)
  ) {
    result.push(
      info("statut_sejour", "Salarié")
    );
  }

  const yearMatch = q.match(/\b20\d{2}\b/);

  if (
    yearMatch &&
    /titre de séjour|titre de sejour|carte de séjour|valable|valid/i.test(q)
  ) {
    result.push(
      info("validite_titre", yearMatch[0])
    );
  }

  if (
    /travail|emploi|job|poste|recrutement|embauche|travailler/i.test(q)
  ) {
    result.push(
      info("objectif", "Recherche d'emploi / travail")
    );
  }

  if (
    /cv|curriculum vitae/i.test(q)
  ) {
    result.push(
      info("cv", "CV mentionné")
    );
  }

  if (
    /entreprise|société|societe|entrepreneur|business|activité professionnelle|activité/i.test(q)
  ) {
    result.push(
      info("entreprise", "Projet ou activité professionnelle mentionné")
    );
  }

  if (
    /formation|apprendre|reconversion|qualification/i.test(q)
  ) {
    result.push(
      info("formation", "Formation / apprentissage mentionné")
    );
  }

  if (
    /préfecture|prefecture|anef|séjour|sejour|étranger|etranger|immigration|visa/i.test(q)
  ) {
    result.push(
      info("domaine", "Immigration / administration des étrangers")
    );
  }

  if (
    /logement|hébergement|hebergement|appartement|loyer/i.test(q)
  ) {
    result.push(
      info("domaine", "Logement")
    );
  }

  if (
    /caf|allocation|rsa|prime d'activité|prime d activite|aide sociale/i.test(q)
  ) {
    result.push(
      info("domaine", "Aides sociales / prestations")
    );
  }

  return result;
}


/* =========================================================
   EXTRACTION D'INFORMATIONS D'UN DOCUMENT
========================================================= */

function extraireInformationsDocument(text, source = "document") {
  const t = texte(text, LIMITS.documentText);

  const confirmees = [];
  const aVerifier = [];
  const dates = [];
  const references = [];
  const actions = [];

  if (!t) {
    return {
      confirmees,
      aVerifier,
      dates,
      references,
      actions,
      resume: ""
    };
  }

  const dateRegex =
    /\b(?:0?[1-9]|[12]\d|3[01])[\/.-](?:0?[1-9]|1[0-2])[\/.-](?:20\d{2})\b/g;

  for (const d of t.match(dateRegex) || []) {
    dates.push(d);
  }

  const yearRegex = /\b20\d{2}\b/g;

  for (const y of t.match(yearRegex) || []) {
    if (!dates.includes(y)) {
      dates.push(y);
    }
  }

  const refRegex =
    /(?:référence|reference|n°|no|numéro|numero|dossier|réf\.?)\s*[:#]?\s*([A-Z0-9][A-Z0-9._/-]{2,})/gi;

  let match;

  while ((match = refRegex.exec(t)) !== null) {
    references.push(match[1]);
  }

  if (
    /refus|rejet|défavorable|defavorable|irrecevable/i.test(t)
  ) {
    actions.push("Décision négative ou refus à vérifier");
    aVerifier.push({
      type: "decision",
      valeur: "Refus / rejet détecté",
      raison: "Le document semble contenir une décision négative."
    });
  }

  if (
    /accepté|accepte|acceptation|favorable|accord/i.test(t)
  ) {
    actions.push("Décision favorable détectée");
  }

  if (
    /convocation|rendez-vous|rendez vous|appointment/i.test(t)
  ) {
    actions.push("Convocation ou rendez-vous détecté");
  }

  if (
    /pièces? manquantes?|documents? manquants?|justificatifs? manquants?|complément/i.test(t)
  ) {
    actions.push("Documents complémentaires potentiellement demandés");
    aVerifier.push({
      type: "documents_manquants",
      valeur: "Documents ou justificatifs complémentaires mentionnés",
      raison: "Le document doit être vérifié précisément."
    });
  }

  if (
    /délai|delai|avant le|au plus tard|date limite|échéance|echeance/i.test(t)
  ) {
    actions.push("Délai ou échéance détecté");
  }

  if (
    /autorisation de travail|travail|emploi|salarié|salarie/i.test(t)
  ) {
    confirmees.push(
      info("domaine", "Travail", source)
    );
  }

  if (
    /titre de séjour|titre de sejour|préfecture|prefecture|ANEF|étranger|etranger/i.test(t)
  ) {
    confirmees.push(
      info("domaine", "Immigration / séjour", source)
    );
  }

  if (
    /entreprise|société|societe|entrepreneur|guichet unique|formalités/i.test(t)
  ) {
    confirmees.push(
      info("domaine", "Entreprise", source)
    );
  }

  return {
    confirmees,
    aVerifier,
    dates: [...new Set(dates)].slice(0, 30),
    references: [...new Set(references)].slice(0, 20),
    actions: [...new Set(actions)].slice(0, 20),
    resume: t.slice(0, 2500)
  };
}


/* =========================================================
   DÉDUPLICATION / FUSION
========================================================= */

function dedupeInformations(items = []) {
  const map = new Map();

  for (const item of items) {
    if (!item || !item.type) {
      continue;
    }

    const key =
      `${item.type}|${texte(item.valeur, 300).toLowerCase()}`;

    if (!map.has(key)) {
      map.set(key, item);
    }
  }

  return [...map.values()];
}

function fusionnerInformations(a = [], b = []) {
  return dedupeInformations([
    ...a,
    ...b
  ]);
}

function informationsTypes(items = []) {
  return new Set(
    items
      .filter(Boolean)
      .map(x => x.type)
  );
}


/* =========================================================
   ANALYSE HISTORIQUE
========================================================= */

function analyserHistorique(historique = []) {
  const all = [];

  if (!Array.isArray(historique)) {
    return all;
  }

  for (const item of historique.slice(-30)) {
    if (!item) {
      continue;
    }

    const content =
      texte(item.content || item.text || item.message, 6000);

    if (!content) {
      continue;
    }

    all.push(
      ...extraireInformations(content)
    );
  }

  return dedupeInformations(all);
}


/* =========================================================
   CASE INTELLIGENCE
========================================================= */

function construireEtatConversation({
  question,
  historique = [],
  informations = [],
  documentInfos = []
}) {
  const conversationInfo =
    extraireInformations(question);

  const historyInfo =
    analyserHistorique(historique);

  const allInfo =
    fusionnerInformations(
      fusionnerInformations(
        historyInfo,
        informations
      ),
      conversationInfo
    );

  const documentConfirmed =
    Array.isArray(documentInfos)
      ? documentInfos.filter(x => x && x.type)
      : [];

  const finalInfo =
    fusionnerInformations(
      allInfo,
      documentConfirmed
    );

  const types =
    informationsTypes(finalInfo);

  let domaine = "orientation_generale";

  if (
    types.has("domaine") ||
    types.has("titre_sejour") ||
    types.has("statut_sejour")
  ) {
    domaine = "immigration";
  }

  if (
    types.has("objectif") &&
    !types.has("titre_sejour") &&
    !types.has("statut_sejour")
  ) {
    domaine = "emploi";
  }

  if (types.has("entreprise")) {
    domaine = "entreprise";
  }

  return {
    version: VERSION,
    domaine,
    informations: finalInfo,
    informationsConfirmees: finalInfo.filter(
      x => x.confiance !== "faible"
    ),
    questionActuelle: question,
    nombreInformations: finalInfo.length
  };
}


/* =========================================================
   SOURCES OFFICIELLES
========================================================= */

function selectSources(etat) {
  const result = [];

  const domain =
    etat?.domaine || "";

  const infos =
    etat?.informations || [];

  const types =
    informationsTypes(infos);

  if (
    domain === "immigration" ||
    types.has("titre_sejour") ||
    types.has("statut_sejour")
  ) {
    result.push(SOURCES.anef);
  }

  if (
    types.has("objectif") ||
    domain === "emploi"
  ) {
    result.push(SOURCES.franceTravail);
  }

  if (
    (
      types.has("statut_sejour") ||
      types.has("objectif")
    ) &&
    (
      domain === "immigration" ||
      domain === "emploi"
    )
  ) {
    result.push(SOURCES.travailEtranger);
  }

  if (domain === "entreprise") {
    result.push(SOURCES.statut);
    result.push(SOURCES.guichet);
  }

  const map = new Map();

  for (const source of result) {
    map.set(source.id, source);
  }

  return [...map.values()];
}


/* =========================================================
   QUESTION SUIVANTE
========================================================= */

function prochaineQuestion(etat) {
  const types =
    informationsTypes(etat?.informations || []);

  const domaine =
    etat?.domaine || "";

  if (
    domaine === "immigration" &&
    !types.has("presence_france")
  ) {
    return "Êtes-vous actuellement en France ?";
  }

  if (
    domaine === "immigration" &&
    !types.has("titre_sejour")
  ) {
    return "Quel document ou titre de séjour avez-vous actuellement ?";
  }

  if (
    domaine === "emploi" &&
    !types.has("experience")
  ) {
    return "Avez-vous déjà travaillé ou effectué une activité professionnelle, même sans contrat ?";
  }

  if (
    domaine === "emploi" &&
    !types.has("diplome")
  ) {
    return "Avez-vous un diplôme ou une qualification professionnelle ?";
  }

  if (
    domaine === "emploi" &&
    !types.has("objectif")
  ) {
    return "Quel type de travail recherchez-vous actuellement ?";
  }

  if (
    domaine === "entreprise" &&
    !types.has("entreprise")
  ) {
    return "Quelle activité souhaitez-vous créer ou développer ?";
  }

  return null;
}


/* =========================================================
   PROMPT V10
========================================================= */

function systemPrompt(
  langue = "fr",
  langueDocument = null,
  langueOfficielle = "fr"
) {
  const userLang =
    normalizeLang(langue);

  const officialLang =
    normalizeLang(langueOfficielle);

  const documentLang =
    langueDocument
      ? normalizeLang(langueDocument)
      : null;

  return `
Tu es GouRare AI, moteur d'orientation et d'intelligence de situation.

VERSION: ${VERSION}

LANGUE DE COMMUNICATION UTILISATEUR:
${languageName(userLang)}

LANGUE OFFICIELLE DU PAYS:
${languageName(officialLang)}

LANGUE DU DOCUMENT SI DISPONIBLE:
${documentLang ? languageName(documentLang) : "Non déterminée"}

RÈGLE FONDAMENTALE:
La langue de l'utilisateur et la langue du document sont deux choses différentes.

Tu dois communiquer avec l'utilisateur dans sa langue choisie.

Si un document officiel est dans une autre langue:
- explique son contenu dans la langue de l'utilisateur;
- conserve les noms officiels, intitulés administratifs et références dans leur langue originale lorsque cela est utile;
- si l'utilisateur demande une réponse destinée à une administration, rédige cette réponse dans la langue officielle appropriée;
- après avoir rédigé cette réponse, explique son sens dans la langue de l'utilisateur.

NE CHANGE JAMAIS automatiquement la langue de conversation simplement parce qu'un document est dans une autre langue.

CASE INTELLIGENCE:
Tu dois raisonner à partir de l'ensemble du dossier connu:
- informations de la conversation;
- informations précédemment confirmées;
- informations extraites de documents;
- informations à vérifier;
- objectif de l'utilisateur;
- contexte administratif;
- domaine professionnel.

NE REDemande PAS une information déjà connue.

Si une information est inconnue et indispensable, pose UNE SEULE question précise.

Ne pose jamais une longue liste de questions.

DOCUMENTS:
Tu dois distinguer:
1. ce qui est réellement visible/confirmé;
2. ce qui est probable mais doit être vérifié;
3. ce qui n'est pas disponible.

Ne fabrique jamais:
- une date;
- un montant;
- une obligation;
- une condition juridique;
- un délai;
- un numéro de dossier;
- une décision administrative.

DROIT / ADMINISTRATION:
Ne présente jamais une hypothèse comme une règle juridique certaine.

Privilégie les sources officielles.

Si une information juridique précise n'est pas suffisamment établie, indique qu'elle doit être vérifiée.

EMPLOI:
Utilise "France Travail" et non "Pôle Emploi".

STYLE:
- naturel;
- humain;
- précis;
- utile;
- pas de texte inutile;
- une question à la fois;
- pas de répétition;
- transformer progressivement les informations en plan d'action.

OBJECTIF:
Comprendre la situation → compléter uniquement les informations manquantes → analyser → proposer les prochaines étapes → orienter vers les opportunités pertinentes.

Tu n'es pas simplement un chatbot.
Tu es le moteur de compréhension de dossier de GouRare AI.
`;
}


/* =========================================================
   APPEL IA
========================================================= */

async function askAI(env, {
  langue = "fr",
  langueDocument = null,
  langueOfficielle = "fr",
  messages = []
}) {
  const system = systemPrompt(
    langue,
    langueDocument,
    langueOfficielle
  );

  const safeMessages = [
    {
      role: "system",
      content: system
    },
    ...messages.slice(-20).map(m => ({
      role:
        m.role === "assistant"
          ? "assistant"
          : "user",
      content:
        texte(m.content || m.text || "", 12000)
    }))
  ];

  const result =
    await env.IA.run(
      MODEL,
      {
        messages: safeMessages,
        max_tokens: 900
      }
    );

  return (
    result?.response ||
    result?.result?.response ||
    ""
  );
}


/* =========================================================
   FALLBACK
========================================================= */

function safeFallback(langue, etat) {
  const lang = normalizeLang(langue);

  if (lang === "ar") {
    return "فهمت وضعك. لدي بعض المعلومات عن حالتك، لكن أحتاج إلى معلومة واحدة إضافية قبل أن أعطيك التوجيه المناسب.";
  }

  if (lang === "es") {
    return "He entendido tu situación. Tengo parte de la información necesaria, pero necesito una información adicional antes de orientarte correctamente.";
  }

  if (lang === "en") {
    return "I understand your situation. I have part of the information I need, but I need one additional detail before giving you the appropriate guidance.";
  }

  if (lang === "it") {
    return "Ho compreso la tua situazione. Ho già alcune informazioni, ma mi serve un ulteriore dettaglio prima di poterti orientare correttamente.";
  }

  if (lang === "de") {
    return "Ich habe Ihre Situation verstanden. Einige Informationen liegen bereits vor, aber ich benötige noch ein Detail, bevor ich Sie richtig orientieren kann.";
  }

  return "Je comprends votre situation. J’ai déjà une partie des informations nécessaires, mais il me manque encore un élément avant de pouvoir vous orienter correctement.";
}


/* =========================================================
   ANALYSE PRINCIPALE
========================================================= */

async function analyserQuestion(env, body) {
  const question =
    validateQuestion(body.question);

  const historique =
    Array.isArray(body.historique)
      ? body.historique.slice(-30)
      : [];

  const informations =
    Array.isArray(body.informations)
      ? body.informations.slice(-100)
      : [];

  const documentInfos =
    Array.isArray(body.documentInfos)
      ? body.documentInfos.slice(-100)
      : [];

  const langue =
    normalizeLang(
      body.langue ||
      body.userLanguage ||
      detectLanguage(question)
    );

  const langueDocument =
    body.langueDocument
      ? normalizeLang(body.langueDocument)
      : null;

  const pays =
    texte(body.pays || "FR", 10).toUpperCase();

  const langueOfficielle =
    normalizeLang(
      body.langueOfficielle ||
      countryOfficialLanguage(pays)
    );

  const etat =
    construireEtatConversation({
      question,
      historique,
      informations,
      documentInfos
    });

  const sources =
    selectSources(etat);

  const nextQuestion =
    prochaineQuestion(etat);

  const dossierPrompt = `
DOSSIER ACTUEL:

${truncateJSON(etat, 20000)}

SOURCES OFFICIELLES DISPONIBLES:

${truncateJSON(sources, 10000)}

QUESTION ACTUELLE:
${question}

QUESTION SUIVANTE SUGGÉRÉE PAR LE MOTEUR:
${nextQuestion || "Aucune question obligatoire supplémentaire détectée."}

RÈGLE:
Si une question précise est nécessaire, pose uniquement cette question.
Si suffisamment d'informations sont disponibles, donne une orientation concrète.
`;

  const response =
    await askAI(env, {
      langue,
      langueDocument,
      langueOfficielle,
      messages: [
        {
          role: "user",
          content: dossierPrompt
        }
      ]
    });

  return {
    version: VERSION,
    langue,
    langueDocument,
    langueOfficielle,
    pays,
    reponse:
      texte(response, 12000) ||
      safeFallback(langue, etat),
    etat,
    prochaineQuestion: nextQuestion,
    sources
  };
}


/* =========================================================
   ANALYSE IMAGE / DOCUMENT
========================================================= */

function normalizeDataURL(data) {
  const s = texte(data, LIMITS.imageData);

  if (!s) {
    throw new Error("Image vide.");
  }

  if (
    !/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(s)
  ) {
    throw new Error(
      "Format image non supporté."
    );
  }

  return s;
}

async function analyserImage(env, body) {
  const dataURL =
    normalizeDataURL(
      body.image ||
      body.dataURL ||
      body.data
    );

  const langue =
    normalizeLang(
      body.langue ||
      detectLanguage(
        body.prompt ||
        ""
      )
    );

  const prompt = `
Analyse cette image comme un document.

Langue de communication utilisateur:
${languageName(langue)}

Objectif:
Extraire uniquement les informations réellement visibles.

Retourne UNIQUEMENT un JSON valide:

{
  "type_document":"",
  "langue_document":"",
  "resume":"",
  "confirmees":[
    {
      "type":"",
      "valeur":"",
      "preuve":"visible"
    }
  ],
  "a_verifier":[
    {
      "type":"",
      "valeur":"",
      "raison":""
    }
  ],
  "actions_detectees":[],
  "dates_detectees":[],
  "references_detectees":[],
  "texte_visible":""
}

Ne fabrique aucune information.
Si une information n'est pas lisible, ne l'invente pas.
`;

  let result;

  try {
    result =
      await env.IA.run(
        MODEL_VISION,
        {
          messages: [
            {
              role: "system",
              content:
                "Tu es un extracteur documentaire précis. Tu ne fabriques aucune information."
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt
                },
                {
                  type: "image_url",
                  image_url: {
                    url: dataURL
                  }
                }
              ]
            }
          ]
        }
      );
  } catch (error) {
    throw new Error(
      "Analyse Vision indisponible: " +
      texte(error?.message || error, 500)
    );
  }

  const raw =
    result?.response ||
    result?.result?.response ||
    "";

  const parsed =
    safeJSON(
      raw
        .replace(/^```json/i, "")
        .replace(/^```/i, "")
        .replace(/```$/i, "")
        .trim(),
      null
    );

  if (!parsed) {
    return {
      type_document: "",
      langue_document: langue,
      resume: texte(raw, 4000),
      confirmees: [],
      a_verifier: [
        {
          type: "analyse_document",
          valeur: "Résultat non structuré",
          raison: "Le moteur Vision n'a pas retourné le format JSON attendu."
        }
      ],
      actions_detectees: [],
      dates_detectees: [],
      references_detectees: [],
      texte_visible: texte(raw, 12000)
    };
  }

  const extraction =
    extraireInformationsDocument(
      parsed.texte_visible || parsed.resume || "",
      "document"
    );

  const confirmeesIA =
    Array.isArray(parsed.confirmees)
      ? parsed.confirmees.map(x => ({
          type: texte(x.type, 200),
          valeur: texte(x.valeur, 1000),
          source: "document",
          confiance: "forte"
        }))
      : [];

  const aVerifierIA =
    Array.isArray(parsed.a_verifier)
      ? parsed.a_verifier
      : [];

  return {
    type_document:
      texte(parsed.type_document, 300),

    langue_document:
      normalizeLang(
        parsed.langue_document ||
        detectLanguage(
          parsed.texte_visible ||
          parsed.resume ||
          ""
        )
      ),

    resume:
      texte(
        parsed.resume ||
        extraction.resume,
        5000
      ),

    confirmees:
      dedupeInformations([
        ...confirmeesIA,
        ...extraction.confirmees
      ]),

    a_verifier: [
      ...aVerifierIA,
      ...extraction.aVerifier
    ].slice(0, 50),

    actions_detectees:
      [
        ...(Array.isArray(parsed.actions_detectees)
          ? parsed.actions_detectees
          : []),
        ...extraction.actions
      ]
      .map(x => texte(x, 500))
      .filter(Boolean)
      .slice(0, 30),

    dates_detectees:
      [
        ...(Array.isArray(parsed.dates_detectees)
          ? parsed.dates_detectees
          : []),
        ...extraction.dates
      ]
      .map(x => texte(x, 100))
      .filter(Boolean)
      .slice(0, 30),

    references_detectees:
      [
        ...(Array.isArray(parsed.references_detectees)
          ? parsed.references_detectees
          : []),
        ...extraction.references
      ]
      .map(x => texte(x, 200))
      .filter(Boolean)
      .slice(0, 20),

    texte_visible:
      texte(
        parsed.texte_visible ||
        "",
        12000
      )
  };
}


/* =========================================================
   AUDIO
========================================================= */

async function transcrireAudio(env, body) {
  const audio =
    texte(
      body.audio ||
      body.data ||
      body.audioData,
      LIMITS.audioData
    );

  if (!audio) {
    throw new Error("Audio vide.");
  }

  let result;

  try {
    result =
      await env.IA.run(
        MODEL_AUDIO,
        {
          audio
        }
      );
  } catch (error) {
    throw new Error(
      "Transcription audio indisponible: " +
      texte(error?.message || error, 500)
    );
  }

  return {
    text:
      texte(
        result?.text ||
        result?.response ||
        result?.result?.text ||
        "",
        12000
      )
  };
}


/* =========================================================
   HEALTH
========================================================= */

function healthResponse() {
  return jsonResponse({
    ok: true,
    project: "GouRare AI",
    version: VERSION,
    service: "orientation-case-intelligence",
    time: new Date().toISOString()
  });
}


/* =========================================================
   SOURCES HTML
========================================================= */

function sourceHTML(sources = []) {
  if (!sources.length) {
    return "";
  }

  return `
    <div class="sources">
      <div class="sources-title">Sources officielles</div>
      ${sources.map(source => `
        <a
          class="source"
          href="${source.url}"
          target="_blank"
          rel="noopener noreferrer"
        >
          <strong>${escapeHTML(source.organisme)}</strong>
          <span>${escapeHTML(source.titre)}</span>
        </a>
      `).join("")}
    </div>
  `;
}

function escapeHTML(value) {
  return texte(value, 10000)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   INTERFACE
========================================================= */

const HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
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
    Arial,
    sans-serif;
  background:
    linear-gradient(
      135deg,
      #f5f7fb,
      #ffffff
    );
  color: #172033;
}

.container {
  max-width: 980px;
  margin: 0 auto;
  padding: 24px 16px 60px;
}

.header {
  text-align: center;
  padding: 30px 10px 22px;
}

.logo {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -1px;
}

.subtitle {
  margin-top: 8px;
  font-size: 17px;
  color: #687386;
}

.version {
  margin-top: 8px;
  font-size: 13px;
  color: #8993a4;
}

.support {
  margin: 20px auto;
  max-width: 700px;
  padding: 16px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #e7eaf0;
  text-align: center;
}

.support strong {
  display: block;
  margin-bottom: 5px;
}

.roles {
  display: grid;
  grid-template-columns:
    repeat(auto-fit,minmax(190px,1fr));
  gap: 12px;
  margin: 22px 0;
}

.role {
  border: 1px solid #e4e8ef;
  background: #fff;
  border-radius: 15px;
  padding: 15px;
  cursor: pointer;
  transition: .2s;
}

.role:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 25px rgba(0,0,0,.06);
}

.role strong {
  display: block;
  margin-bottom: 5px;
}

.role span {
  color: #737d8f;
  font-size: 13px;
}

.controls {
  display: grid;
  grid-template-columns:
    repeat(auto-fit,minmax(180px,1fr));
  gap: 10px;
  margin-bottom: 12px;
}

select,
textarea,
button {
  font: inherit;
}

select {
  width: 100%;
  border: 1px solid #dce1ea;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
}

.chat {
  background: #fff;
  border: 1px solid #e2e6ee;
  border-radius: 20px;
  overflow: hidden;
  box-shadow:
    0 12px 40px rgba(20,35,70,.06);
}

.messages {
  min-height: 330px;
  max-height: 560px;
  overflow-y: auto;
  padding: 18px;
}

.message {
  margin-bottom: 15px;
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.bubble {
  max-width: 86%;
  padding: 13px 15px;
  border-radius: 16px;
  line-height: 1.55;
  white-space: pre-wrap;
}

.assistant .bubble {
  background: #f1f4f8;
}

.user .bubble {
  background: #172033;
  color: #fff;
}

.composer {
  border-top: 1px solid #e8ebf1;
  padding: 14px;
}

textarea {
  width: 100%;
  min-height: 100px;
  resize: vertical;
  border: 1px solid #dce1ea;
  border-radius: 14px;
  padding: 13px;
  outline: none;
}

textarea:focus {
  border-color: #8c97aa;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

button {
  border: 0;
  border-radius: 12px;
  padding: 11px 15px;
  cursor: pointer;
  background: #172033;
  color: white;
}

button.secondary {
  background: #eef1f5;
  color: #172033;
}

button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.status {
  margin-top: 10px;
  color: #737d8f;
  font-size: 13px;
}

.sources {
  margin-top: 14px;
  padding: 13px;
  border-radius: 13px;
  background: #fff;
  border: 1px solid #e3e7ee;
}

.sources-title {
  font-weight: 700;
  margin-bottom: 8px;
}

.source {
  display: block;
  text-decoration: none;
  color: #172033;
  padding: 8px 0;
}

.source span {
  display: block;
  color: #727c8e;
  font-size: 13px;
}

.dossier {
  margin-top: 15px;
  border-radius: 15px;
  background: #fff;
  border: 1px solid #e2e6ee;
  padding: 14px;
}

.dossier-title {
  font-weight: 800;
  margin-bottom: 8px;
}

.info {
  display: inline-block;
  margin: 4px;
  padding: 6px 9px;
  border-radius: 10px;
  background: #f0f3f7;
  font-size: 12px;
}

.document {
  margin-top: 15px;
  padding: 14px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e4e8ef;
}

.document strong {
  display: block;
  margin-bottom: 6px;
}

@media(max-width:600px) {

  .container {
    padding: 12px 10px 40px;
  }

  .logo {
    font-size: 29px;
  }

  .bubble {
    max-width: 94%;
  }

}

</style>
</head>

<body>

<div class="container">

  <div class="header">
    <div class="logo">GouRare AI</div>

    <div class="subtitle">
      Votre intelligence d'orientation
    </div>

    <div class="version">
      Version ${VERSION}
    </div>
  </div>

  <div class="support">
    <strong>🎗️ Avec vous contre le cancer</strong>
    <span>
      🎗️ Notre soutien aux personnes touchées par le cancer.
    </span>
  </div>

  <div class="roles">

    <div class="role"
      onclick="setRole('migrant')">
      <strong>🌍 Migrant / Nouveau arrivant</strong>
      <span>
        Séjour, démarches, travail et intégration.
      </span>
    </div>

    <div class="role"
      onclick="setRole('particulier')">
      <strong>👤 Particulier / Résident</strong>
      <span>
        Orientation dans les démarches du quotidien.
      </span>
    </div>

    <div class="role"
      onclick="setRole('emploi')">
      <strong>💼 Chercheur d'emploi</strong>
      <span>
        Emploi, formation et opportunités.
      </span>
    </div>

    <div class="role"
      onclick="setRole('entreprise')">
      <strong>🏢 Entreprise / Entrepreneur</strong>
      <span>
        Création, activité et développement.
      </span>
    </div>

  </div>

  <div class="controls">

    <select id="language">
      <option value="fr">Français</option>
      <option value="ar">العربية</option>
      <option value="es">Español</option>
      <option value="en">English</option>
      <option value="it">Italiano</option>
      <option value="de">Deutsch</option>
      <option value="pt">Português</option>
    </select>

    <select id="country">
      <option value="FR">🇫🇷 France</option>
      <option value="ES">🇪🇸 España</option>
      <option value="DE">🇩🇪 Deutschland</option>
      <option value="IT">🇮🇹 Italia</option>
      <option value="PT">🇵🇹 Portugal</option>
      <option value="BE">🇧🇪 Belgique</option>
    </select>

  </div>

  <div class="chat">

    <div id="messages" class="messages">

      <div class="message assistant">
        <div class="bubble">
          Bonjour 👋

          Je suis GouRare AI.

          Expliquez-moi votre situation dans la langue de votre choix.

          Je vais d'abord comprendre votre situation, puis vous poser uniquement la prochaine question nécessaire.
        </div>
      </div>

    </div>

    <div class="composer">

      <textarea
        id="question"
        placeholder="Décrivez votre situation..."
      ></textarea>

      <div class="actions">

        <button
          id="sendBtn"
          onclick="sendMessage()">
          Envoyer
        </button>

        <button
          class="secondary"
          onclick="document.getElementById('imageInput').click()">
          📷 Ajouter une image
        </button>

        <button
          class="secondary"
          id="voiceBtn"
          onclick="toggleVoice()">
          🎙️ Parler
        </button>

        <button
          class="secondary"
          onclick="clearChat()">
          Effacer
        </button>

      </div>

      <input
        id="imageInput"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style="display:none"
        onchange="handleImage(event)"
      />

      <div id="status" class="status"></div>

    </div>

  </div>

  <div id="dossier"></div>

  <div id="document"></div>

</div>

<script>

let historique = [];
let informations = [];
let documentInfos = [];
let selectedRole = "";
let mediaRecorder = null;
let audioChunks = [];
let recording = false;

const messagesEl =
  document.getElementById("messages");

const questionEl =
  document.getElementById("question");

const statusEl =
  document.getElementById("status");

function setStatus(text) {
  statusEl.textContent = text || "";
}

function escapeHTML(value) {
  return String(value || "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function addMessage(role, text) {

  const wrapper =
    document.createElement("div");

  wrapper.className =
    "message " + role;

  const bubble =
    document.createElement("div");

  bubble.className =
    "bubble";

  bubble.textContent =
    text;

  wrapper.appendChild(bubble);

  messagesEl.appendChild(wrapper);

  messagesEl.scrollTop =
    messagesEl.scrollHeight;
}

function addUserMessage(text) {

  historique.push({
    role: "user",
    content: text
  });

  addMessage("user", text);
}

function addAssistantMessage(text) {

  historique.push({
    role: "assistant",
    content: text
  });

  addMessage("assistant", text);
}

function setRole(role) {

  selectedRole = role;

  const labels = {
    migrant:
      "Je suis migrant / nouveau arrivant et j'ai besoin d'orientation.",
    particulier:
      "Je suis particulier et j'ai besoin d'aide pour une démarche.",
    emploi:
      "Je cherche un emploi et je veux être orienté.",
    entreprise:
      "Je souhaite créer ou développer une activité."
  };

  questionEl.value =
    labels[role] || "";

  questionEl.focus();
}

async function sendMessage() {

  const question =
    questionEl.value.trim();

  if (!question) {
    return;
  }

  const language =
    document.getElementById("language").value;

  const country =
    document.getElementById("country").value;

  addUserMessage(question);

  questionEl.value = "";

  setStatus("Analyse de votre situation...");

  document.getElementById("sendBtn").disabled =
    true;

  try {

    const response =
      await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          question,
          langue: language,
          pays: country,
          historique,
          informations,
          documentInfos
        })
      });

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Erreur serveur."
      );
    }

    if (data.etat) {

      informations =
        data.etat.informations ||
        informations;

      renderDossier(data.etat);
    }

    addAssistantMessage(
      data.reponse ||
      "Je n'ai pas pu produire de réponse."
    );

    renderDocument(data);

    setStatus("");

  } catch (error) {

    addAssistantMessage(
      "Une erreur technique est survenue : " +
      error.message
    );

    setStatus(
      "Erreur technique."
    );

  } finally {

    document.getElementById("sendBtn").disabled =
      false;
  }
}

function renderDossier(etat) {

  const box =
    document.getElementById("dossier");

  const infos =
    etat.informations ||
    [];

  if (!infos.length) {
    box.innerHTML = "";
    return;
  }

  box.innerHTML = \`
    <div class="dossier">

      <div class="dossier-title">
        🧠 État actuel du dossier
      </div>

      <div>
        Domaine:
        <strong>
          \${escapeHTML(etat.domaine)}
        </strong>
      </div>

      <div style="margin-top:8px">
        \${infos.map(x => \`
          <span class="info">
            \${escapeHTML(x.type)}
            :
            \${escapeHTML(x.valeur)}
          </span>
        \`).join("")}
      </div>

    </div>
  \`;
}

function renderDocument(data) {

  if (!data.document) {
    return;
  }

  const d =
    data.document;

  documentInfos =
    d.confirmees ||
    [];

  document.getElementById("document").innerHTML =
  \`
    <div class="document">

      <strong>📄 Document analysé</strong>

      <div>
        \${escapeHTML(
          d.type_document ||
          "Document"
        )}
      </div>

      <div style="margin-top:7px">
        \${escapeHTML(
          d.resume || ""
        )}
      </div>

    </div>
  \`;
}

async function handleImage(event) {

  const file =
    event.target.files[0];

  if (!file) {
    return;
  }

  if (file.size > 5500000) {

    setStatus(
      "L'image est trop volumineuse."
    );

    return;
  }

  setStatus(
    "Analyse du document..."
  );

  try {

    const dataURL =
      await fileToDataURL(file);

    const language =
      document.getElementById("language").value;

    const response =
      await fetch("/api/image", {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          image: dataURL,
          langue: language
        })
      });

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Impossible d'analyser ce document."
      );
    }

    documentInfos =
      data.confirmees || [];

    renderDocument({
      document: data
    });

    setStatus(
      "Document analysé."
    );

  } catch (error) {

    setStatus(
      error.message
    );

  } finally {

    event.target.value = "";

  }
}

function fileToDataURL(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload =
        () => resolve(reader.result);

      reader.onerror =
        reject;

      reader.readAsDataURL(file);

    }
  );
}

async function toggleVoice() {

  if (recording) {

    mediaRecorder.stop();

    recording = false;

    document.getElementById("voiceBtn")
      .textContent = "🎙️ Parler";

    return;
  }

  if (!navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia) {

    setStatus(
      "La fonction audio n'est pas disponible sur cet appareil."
    );

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
      new MediaRecorder(stream);

    mediaRecorder.ondataavailable =
      event => {

        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }

      };

    mediaRecorder.onstop =
      async () => {

        stream.getTracks()
          .forEach(track => track.stop());

        const blob =
          new Blob(
            audioChunks,
            {
              type:
                mediaRecorder.mimeType ||
                "audio/webm"
            }
          );

        await transcribeBlob(blob);
      };

    mediaRecorder.start();

    recording = true;

    document.getElementById("voiceBtn")
      .textContent = "⏹️ Arrêter";

    setStatus(
      "Enregistrement..."
    );

  } catch (error) {

    setStatus(
      "Impossible d'accéder au microphone."
    );

  }
}

async function transcribeBlob(blob) {

  setStatus(
    "Transcription..."
  );

  try {

    const buffer =
      await blob.arrayBuffer();

    const bytes =
      new Uint8Array(buffer);

    let binary = "";

    const chunkSize = 0x8000;

    for (
      let i = 0;
      i < bytes.length;
      i += chunkSize
    ) {

      binary += String.fromCharCode(
        ...bytes.subarray(
          i,
          Math.min(
            i + chunkSize,
            bytes.length
          )
        )
      );

    }

    const base64 =
      btoa(binary);

    const response =
      await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          audio: base64
        })
      });

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Transcription impossible."
      );
    }

    if (data.text) {

      questionEl.value =
        data.text;

      setStatus(
        "Transcription terminée."
      );
    }

  } catch (error) {

    setStatus(
      error.message
    );

  }
}

function clearChat() {

  historique = [];
  informations = [];
  documentInfos = [];

  messagesEl.innerHTML = "";

  document.getElementById("dossier")
    .innerHTML = "";

  document.getElementById("document")
    .innerHTML = "";

  addMessage(
    "assistant",
    "Bonjour 👋\\n\\nJe suis GouRare AI.\\n\\nExpliquez-moi votre situation dans la langue de votre choix."
  );

  setStatus("");
}

questionEl.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendMessage();

    }

  }
);

</script>

</body>
</html>`;


/* =========================================================
   EXPORT HTML
========================================================= */

function homeResponse() {
  return htmlResponse(HTML);
}
export default {
  async fetch(request, env) {

    const url =
      new URL(request.url);

    const path =
      url.pathname;

    const method =
      request.method.toUpperCase();


    /* =====================================================
       HEAD / OPTIONS
    ===================================================== */

    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: securityHeaders()
      });
    }


    /* =====================================================
       PAGE PRINCIPALE
    ===================================================== */

    if (
      path === "/" &&
      method === "GET"
    ) {
      return homeResponse();
    }


    /* =====================================================
       HEALTH CHECK
    ===================================================== */

    if (
      path === "/health" &&
      method === "GET"
    ) {
      return healthResponse();
    }


    /* =====================================================
       ANALYSE CONVERSATION
    ===================================================== */

    if (
      path === "/api/analyze" &&
      method === "POST"
    ) {

      if (
        !checkRateLimit(
          request,
          "analyze"
        )
      ) {
        return jsonResponse(
          {
            error:
              "Trop de requêtes. Veuillez patienter quelques instants."
          },
          429
        );
      }

      try {

        const body =
          await readJSON(
            request,
            LIMITS.analyzeBody
          );

        const result =
          await analyserQuestion(
            env,
            body
          );

        return jsonResponse(
          result
        );

      } catch (error) {

        return jsonResponse(
          {
            error:
              texte(
                error?.message ||
                "Erreur d'analyse.",
                1000
              )
          },
          400
        );
      }
    }


    /* =====================================================
       ALIAS MESSAGE
    ===================================================== */

    if (
      path === "/api/message" &&
      method === "POST"
    ) {

      if (
        !checkRateLimit(
          request,
          "analyze"
        )
      ) {
        return jsonResponse(
          {
            error:
              "Trop de requêtes. Veuillez patienter quelques instants."
          },
          429
        );
      }

      try {

        const body =
          await readJSON(
            request,
            LIMITS.analyzeBody
          );

        const result =
          await analyserQuestion(
            env,
            body
          );

        return jsonResponse(
          result
        );

      } catch (error) {

        return jsonResponse(
          {
            error:
              texte(
                error?.message ||
                "Erreur de traitement.",
                1000
              )
          },
          400
        );
      }
    }


    /* =====================================================
       ANALYSE IMAGE
    ===================================================== */

    if (
      path === "/api/image" &&
      method === "POST"
    ) {

      if (
        !checkRateLimit(
          request,
          "image"
        )
      ) {
        return jsonResponse(
          {
            error:
              "Trop de demandes d'analyse d'image. Veuillez patienter."
          },
          429
        );
      }

      try {

        const body =
          await readJSON(
            request,
            LIMITS.imageBody
          );

        const image =
          texte(
            body.image ||
            body.dataURL ||
            body.data,
            LIMITS.imageData
          );

        if (!image) {
          throw new Error(
            "Aucune image reçue."
          );
        }

        if (
          !/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(image)
        ) {
          throw new Error(
            "Format d'image non supporté. Utilisez PNG, JPEG ou WebP."
          );
        }

        const result =
          await analyserImage(
            env,
            {
              ...body,
              image
            }
          );

        return jsonResponse(
          result
        );

      } catch (error) {

        return jsonResponse(
          {
            error:
              texte(
                error?.message ||
                "Impossible d'analyser ce document.",
                1500
              )
          },
          400
        );
      }
    }


    /* =====================================================
       TRANSCRIPTION AUDIO
    ===================================================== */

    if (
      path === "/api/transcribe" &&
      method === "POST"
    ) {

      if (
        !checkRateLimit(
          request,
          "transcribe"
        )
      ) {
        return jsonResponse(
          {
            error:
              "Trop de demandes audio. Veuillez patienter."
          },
          429
        );
      }

      try {

        const body =
          await readJSON(
            request,
            LIMITS.audioBody
          );

        const result =
          await transcrireAudio(
            env,
            body
          );

        return jsonResponse(
          result
        );

      } catch (error) {

        return jsonResponse(
          {
            error:
              texte(
                error?.message ||
                "Impossible de transcrire l'audio.",
                1500
              )
          },
          400
        );
      }
    }


    /* =====================================================
       404
    ===================================================== */

    return jsonResponse(
      {
        error:
          "Route introuvable.",
        version: VERSION
      },
      404
    );
  }
};
