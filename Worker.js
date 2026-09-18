const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const MODEL_VISION = "@cf/meta/llama-3.2-11b-vision-instruct";
const MODEL_AUDIO = "@cf/openai/whisper-large-v3-turbo";

const VERSION = "10.3.0";
const DECISION_VERSION = "10.3.0";

const LIMITS = {
  question: 12000,
  history: 24000,
  image: 7000000,
  audio: 12000000,
  message: 18000,
  messages: 40,
  jsonBody: 16000000
};

const RATE = {
  max: 30,
  window: 60000
};

const rateStore = new Map();

const SOURCES = {
  anef: {
    name: "ANEF",
    url: "https://administration-etrangers-en-france.interieur.gouv.fr/"
  },
  travailEtranger: {
    name: "Service-Public — Travail d'un étranger en France",
    url: "https://www.service-public.fr/particuliers/vosdroits/N107"
  },
  franceTravail: {
    name: "France Travail",
    url: "https://www.francetravail.fr/"
  },
  servicePublic: {
    name: "Service-Public.fr",
    url: "https://www.service-public.fr/"
  },
  entreprise: {
    name: "Service-Public Entreprendre",
    url: "https://entreprendre.service-public.fr/"
  },
  guichet: {
    name: "Guichet unique",
    url: "https://formalites.entreprises.gouv.fr/"
  }
};

const LANGUAGES = ["fr", "ar", "en", "es", "it", "de", "pt", "nl"];

const COUNTRY_LANGUAGE = {
  FR: "fr",
  BE: "fr",
  LU: "fr",
  CH: "fr",
  CA: "fr"
};

const LOCATION_ALIASES = {
  "vigneux-sur-seine": "Vigneux-sur-Seine",
  "vignieux sur seine": "Vigneux-sur-Seine",
  "vignieux-sur-seine": "Vigneux-sur-Seine",
  "paris": "Paris",
  "évry-courcouronnes": "Évry-Courcouronnes",
  "evry-courcouronnes": "Évry-Courcouronnes",
  "corbeil-essonnes": "Corbeil-Essonnes",
  "montgeron": "Montgeron",
  "draveil": "Draveil",
  "juvisy-sur-orge": "Juvisy-sur-Orge",
  "viry-châtillon": "Viry-Châtillon",
  "viry-chatillon": "Viry-Châtillon",
  "créteil": "Créteil",
  "creteil": "Créteil",
  "melun": "Melun",
  "massy": "Massy"
};

const PARCOURS = {
  fr: {
    particulier: "Particulier",
    emploi: "Emploi",
    immigration: "Immigration",
    entreprise: "Entreprise",
    recherche: "Recherche d'emploi",
    formation: "Formation",
    administratif: "Démarche administrative",
    reconversion: "Reconversion",
    creer: "Créer une entreprise",
    developper: "Développer une entreprise"
  },
  ar: {
    particulier: "فرد",
    emploi: "العمل",
    immigration: "الهجرة والإقامة",
    entreprise: "شركة",
    recherche: "البحث عن عمل",
    formation: "التكوين",
    administratif: "إجراء إداري",
    reconversion: "إعادة التوجيه المهني",
    creer: "إنشاء شركة",
    developper: "تطوير شركة"
  },
  en: {
    particulier: "Individual",
    emploi: "Employment",
    immigration: "Immigration",
    entreprise: "Business",
    recherche: "Job search",
    formation: "Training",
    administratif: "Administrative procedure",
    reconversion: "Career change",
    creer: "Create a business",
    developper: "Develop a business"
  }
};

const UI = {
  fr: {
    title: "Go Rare AI",
    subtitle: "Comprendre votre situation. Voir plus loin.",
    analyze: "Analyser",
    image: "Image",
    microphone: "Micro",
    placeholder: "Décrivez votre situation ou votre objectif...",
    particular: "Particulier",
    employment: "Emploi",
    immigration: "Immigration",
    business: "Entreprise",
    result: "Résultat",
    confirmed: "Informations confirmées",
    missing: "Informations nécessaires",
    sources: "Sources officielles",
    actions: "Prochaines étapes",
    recommendations: "Pistes utiles",
    connect: "Connecter mon compte",
    billing: "Compte professionnel",
    secure: "Connexion sécurisée"
  },
  ar: {
    title: "Go Rare AI",
    subtitle: "افهم وضعك. وانظر إلى أبعد.",
    analyze: "تحليل",
    image: "صورة",
    microphone: "ميكروفون",
    placeholder: "اشرح وضعك أو هدفك...",
    particular: "فرد",
    employment: "العمل",
    immigration: "الهجرة والإقامة",
    business: "شركة",
    result: "النتيجة",
    confirmed: "المعلومات المؤكدة",
    missing: "المعلومات المطلوبة",
    sources: "المصادر الرسمية",
    actions: "الخطوات التالية",
    recommendations: "مسارات مفيدة",
    connect: "ربط الحساب",
    billing: "الحساب المهني",
    secure: "اتصال آمن"
  },
  en: {
    title: "Go Rare AI",
    subtitle: "Understand your situation. See further.",
    analyze: "Analyze",
    image: "Image",
    microphone: "Microphone",
    placeholder: "Describe your situation or objective...",
    particular: "Individual",
    employment: "Employment",
    immigration: "Immigration",
    business: "Business",
    result: "Result",
    confirmed: "Confirmed information",
    missing: "Required information",
    sources: "Official sources",
    actions: "Next steps",
    recommendations: "Useful paths",
    connect: "Connect account",
    billing: "Professional account",
    secure: "Secure connection"
  }
};

const QUESTIONS = {
  fr: {
    zone_recherche: {
      key: "zone_recherche",
      text: "Dans quelle ville ou zone souhaitez-vous rechercher ?",
      field: "zoneRecherche"
    },
    type_emploi: {
      key: "type_emploi",
      text: "Quel type de travail recherchez-vous ? Vous pouvez aussi dire « peu importe ».",
      field: "typeEmploi"
    },
    diplome: {
      key: "diplome",
      text: "Avez-vous un diplôme ou souhaitez-vous rechercher sans diplôme ?",
      field: "diplome"
    },
    experience: {
      key: "experience",
      text: "Avez-vous déjà une expérience professionnelle, même courte ?",
      field: "experience"
    },
    mobilite: {
      key: "mobilite",
      text: "Jusqu'où pouvez-vous vous déplacer pour travailler ?",
      field: "mobilite"
    },
    horaires: {
      key: "horaires",
      text: "Avez-vous une préférence pour les horaires ou êtes-vous flexible ?",
      field: "horaires"
    },
    presence_france: {
      key: "presence_france",
      text: "Êtes-vous actuellement en France ?",
      field: "presenceFrance"
    },
    statut_sejour: {
      key: "statut_sejour",
      text: "Quel est votre statut de séjour en France ?",
      field: "statutSejour"
    },
    entreprise: {
      key: "entreprise",
      text: "Avez-vous déjà une entreprise ou seulement un projet ?",
      field: "entreprise"
    }
  },

  ar: {
    zone_recherche: {
      key: "zone_recherche",
      text: "في أي مدينة أو منطقة تريد البحث؟",
      field: "zoneRecherche"
    },
    type_emploi: {
      key: "type_emploi",
      text: "ما نوع العمل الذي تبحث عنه؟ يمكنك أيضًا أن تقول: لا يهم.",
      field: "typeEmploi"
    },
    diplome: {
      key: "diplome",
      text: "هل لديك شهادة؟ أم تريد البحث عن عمل بدون شهادة؟",
      field: "diplome"
    },
    experience: {
      key: "experience",
      text: "هل لديك خبرة مهنية سابقة، حتى لو كانت قصيرة؟",
      field: "experience"
    },
    mobilite: {
      key: "mobilite",
      text: "إلى أي مسافة يمكنك التنقل من أجل العمل؟",
      field: "mobilite"
    },
    horaires: {
      key: "horaires",
      text: "هل لديك تفضيل لساعات العمل أم أنك مرن؟",
      field: "horaires"
    },
    presence_france: {
      key: "presence_france",
      text: "هل أنت حاليًا في فرنسا؟",
      field: "presenceFrance"
    },
    statut_sejour: {
      key: "statut_sejour",
      text: "ما هو وضع إقامتك في فرنسا؟",
      field: "statutSejour"
    },
    entreprise: {
      key: "entreprise",
      text: "هل لديك شركة بالفعل أم مجرد مشروع؟",
      field: "entreprise"
    }
  },

  en: {
    zone_recherche: {
      key: "zone_recherche",
      text: "Which city or area would you like to search in?",
      field: "zoneRecherche"
    },
    type_emploi: {
      key: "type_emploi",
      text: "What type of work are you looking for? You can also say 'any'.",
      field: "typeEmploi"
    },
    diplome: {
      key: "diplome",
      text: "Do you have a diploma, or would you like to search for jobs without one?",
      field: "diplome"
    },
    experience: {
      key: "experience",
      text: "Do you have any professional experience, even a short one?",
      field: "experience"
    },
    mobilite: {
      key: "mobilite",
      text: "How far can you travel for work?",
      field: "mobilite"
    },
    horaires: {
      key: "horaires",
      text: "Do you have preferred working hours or are you flexible?",
      field: "horaires"
    },
    presence_france: {
      key: "presence_france",
      text: "Are you currently in France?",
      field: "presenceFrance"
    },
    statut_sejour: {
      key: "statut_sejour",
      text: "What is your residence status in France?",
      field: "statutSejour"
    },
    entreprise: {
      key: "entreprise",
      text: "Do you already have a company or only a business project?",
      field: "entreprise"
    }
  }
};

function cleanText(value, max = 10000) {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim().slice(0, max);
}

function safeArray(value, max = 40) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(x => typeof x === "string")
    .map(x => cleanText(x, 3000))
    .filter(Boolean)
    .slice(0, max);
}

function uniqueArray(arr) {
  return [...new Set(arr)];
}

function isPlainObject(value) {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value);
}

function containsAny(text, list) {
  const t = String(text || "").toLowerCase();
  return list.some(x => t.includes(x.toLowerCase()));
}

function base64ByteLength(value) {
  if (typeof value !== "string") return 0;
  const clean = value.replace(/^data:[^,]+,/, "");
  return Math.floor(clean.length * 3 / 4);
}

function normalizeLanguage(lang) {
  const x = String(lang || "").toLowerCase();
  return LANGUAGES.includes(x) ? x : "fr";
}

function detectLanguage(text, requested) {
  if (requested) return normalizeLanguage(requested);

  const t = String(text || "");

  const arabic = (t.match(/[\u0600-\u06ff]/g) || []).length;
  if (arabic >= 2) return "ar";

  const en = [
    "the", "work", "job", "employment", "without", "experience",
    "diploma", "company", "france", "need", "want"
  ];

  const fr = [
    "le", "la", "les", "travail", "emploi", "sans",
    "expérience", "diplôme", "entreprise", "france",
    "cherche", "besoin"
  ];

  const lower = t.toLowerCase();
  const enScore = en.filter(w => lower.includes(w)).length;
  const frScore = fr.filter(w => lower.includes(w)).length;

  if (enScore > frScore && enScore >= 2) return "en";
  return "fr";
}

function normaliserLieu(text) {
  const lower = String(text || "").toLowerCase();

  for (const [alias, canonical] of Object.entries(LOCATION_ALIASES)) {
    if (lower.includes(alias)) return canonical;
  }

  return "";
}

function extraireInformations(text) {
  const t = cleanText(text, LIMITS.question);
  const lower = t.toLowerCase();

  const info = {};

  if (
    containsAny(lower, [
      "sans diplôme",
      "sans diplome",
      "pas de diplôme",
      "pas de diplome",
      "no diploma",
      "without diploma",
      "لا أملك شهادة",
      "بدون شهادة",
      "بدون دبلوم"
    ])
  ) {
    info.diplome = "Sans diplôme";
  }

  if (
    containsAny(lower, [
      "sans expérience",
      "sans experience",
      "pas d'expérience",
      "pas d'experience",
      "no experience",
      "without experience",
      "بدون خبرة",
      "لا أملك خبرة"
    ])
  ) {
    info.experience = "Sans expérience";
  }

  if (
    containsAny(lower, [
      "peu importe",
      "n'importe quel secteur",
      "tous secteurs",
      "tous les secteurs",
      "any sector",
      "any job",
      "anything",
      "لا يهم",
      "أي عمل",
      "أي قطاع"
    ])
  ) {
    info.secteurs = "Tous secteurs";
    info.typeEmploi = "Peu importe";
  }

  if (
    containsAny(lower, [
      "france",
      "en france",
      "in france",
      "فرنسا",
      "في فرنسا"
    ])
  ) {
    info.pays = "France";
    info.presenceFrance = "Oui";
  }

  const lieu = normaliserLieu(lower);
  if (lieu) info.zoneRecherche = lieu;

  const emploiPatterns = [
    ["facteur", "Facteur / distribution"],
    ["postal", "Facteur / distribution"],
    ["livraison", "Livraison"],
    ["livreur", "Livraison"],
    ["nettoyage", "Nettoyage"],
    ["entretien", "Entretien"],
    ["manutention", "Manutention"],
    ["logistique", "Logistique"],
    ["restauration", "Restauration"],
    ["cuisine", "Cuisine"],
    ["magasin", "Magasin"],
    ["vente", "Vente"],
    ["bâtiment", "Bâtiment"],
    ["batiment", "Bâtiment"]
  ];

  for (const [needle, value] of emploiPatterns) {
    if (lower.includes(needle)) {
      info.typeEmploi = value;
      break;
    }
  }

  if (
    containsAny(lower, [
      "titre de séjour",
      "titre de sejour",
      "carte de séjour",
      "carte de sejour",
      "salarié",
      "salarie",
      "récépissé",
      "recepisse",
      "renewal",
      "residence permit",
      "residence card",
      "إقامة",
      "بطاقة إقامة",
      "تصريح إقامة"
    ])
  ) {
    info.statutSejour = "À vérifier précisément";
  }

  if (
    containsAny(lower, [
      "anef",
      "renouvellement",
      "renew",
      "première demande",
      "premiere demande",
      "first application",
      "تجديد",
      "طلب أول"
    ])
  ) {
    info.contexteImmigration = true;
  }

  if (
    containsAny(lower, [
      "entreprise",
      "société",
      "societe",
      "company",
      "business",
      "entrepreneur",
      "شركة",
      "مشروع"
    ])
  ) {
    info.entreprise = "Projet ou entreprise à préciser";
  }

  if (
    containsAny(lower, [
      "sans papiers",
      "sans documents",
      "no documents",
      "without documents",
      "بدون وثائق",
      "لا أملك وثائق"
    ])
  ) {
    info.documents = "Documents à préciser";
  }

  if (
    containsAny(lower, [
      "peu importe les horaires",
      "horaires flexibles",
      "flexible",
      "any hours",
      "لا يهم الوقت",
      "مرن"
    ])
  ) {
    info.horaires = "Flexible";
  }

  if (
    containsAny(lower, [
      "mobile",
      "mobilité",
      "mobilite",
      "je peux me déplacer",
      "يمكنني التنقل"
    ])
  ) {
    info.mobilite = "Mobile";
  }

  return info;
}

function detectContext(text, info = {}) {
  const t = String(text || "").toLowerCase();

  return {
    emploi:
      !!info.typeEmploi ||
      !!info.zoneRecherche ||
      containsAny(t, [
        "emploi", "travail", "job", "work", "facteur",
        "livreur", "nettoyage", "manutention",
        "وظيفة", "عمل"
      ]),

    immigration:
      !!info.statutSejour ||
      !!info.contexteImmigration ||
      containsAny(t, [
        "titre de séjour", "titre de sejour",
        "résidence", "residence", "anef",
        "immigration", "إقامة", "الهجرة"
      ]),

    entreprise:
      !!info.entreprise ||
      containsAny(t, [
        "entreprise", "company", "business",
        "société", "شركة", "مشروع"
      ]),

    administratif:
      containsAny(t, [
        "démarche", "administratif", "administration",
        "document", "procedure", "إجراء", "وثيقة"
      ]),

    sansDiplome: info.diplome === "Sans diplôme",
    sansExperience: info.experience === "Sans expérience",
    sansDocuments: info.documents === "Documents à préciser"
  };
}

function analyserHistorique(history) {
  const list = Array.isArray(history) ? history : [];

  // Pour éviter qu'une réponse générée par l'IA
  // soit considérée comme une information donnée par l'utilisateur.
  return list
    .filter(item => {
      if (!isPlainObject(item)) return false;
      return item.role === "user";
    })
    .slice(-20)
    .map(item => cleanText(item.content, 4000))
    .filter(Boolean)
    .join("\n");
}

function mergeInfo(...objects) {
  const result = {};

  for (const obj of objects) {
    if (!isPlainObject(obj)) continue;

    for (const [key, value] of Object.entries(obj)) {
      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        result[key] = value;
      }
    }
  }

  return result;
}

function construireEtatConversation(question, payload) {
  const historyText = analyserHistorique(payload.history);
  const historiqueInfo = extraireInformations(historyText);
  const currentInfo = extraireInformations(question);

  const payloadInfo = isPlainObject(payload.info)
    ? payload.info
    : {};

  const info = mergeInfo(
    historiqueInfo,
    payloadInfo,
    currentInfo
  );

  const context = detectContext(
    `${historyText}\n${question}`,
    info
  );

  return {
    info,
    context,
    historyText
  };
}

function candidatsQuestions(state, language) {
  const info = state.info;
  const ctx = state.context;
  const q = QUESTIONS[language] || QUESTIONS.fr;

  const missing = [];

  if (ctx.emploi) {
    if (!info.zoneRecherche) missing.push(q.zone_recherche);
    if (!info.typeEmploi) missing.push(q.type_emploi);

    // IMPORTANT :
    // Ces deux champs font maintenant partie du moteur déterministe.
    if (!info.diplome) missing.push(q.diplome);
    if (!info.experience) missing.push(q.experience);

    if (!info.mobilite) missing.push(q.mobilite);
    if (!info.horaires) missing.push(q.horaires);
  }

  if (ctx.immigration) {
    if (!info.presenceFrance) missing.push(q.presence_france);
    if (!info.statutSejour) missing.push(q.statut_sejour);
  }

  if (ctx.entreprise && !ctx.emploi) {
    if (!info.entreprise) missing.push(q.entreprise);
  }

  return missing;
}

function construireDecision(state, language) {
  const questions = candidatsQuestions(state, language);

  if (questions.length > 0) {
    return {
      version: DECISION_VERSION,
      mode: "question",
      question: questions[0].text,
      questionKey: questions[0].key,
      field: questions[0].field,
      remaining: questions.length
    };
  }

  return {
    version: DECISION_VERSION,
    mode: "orientation",
    question: null,
    questionKey: null,
    field: null,
    remaining: 0
  };
}

function appliquerProtectionsEmploi(info) {
  const protections = [];

  if (info.diplome === "Sans diplôme") {
    protections.push(
      "Rechercher en priorité des postes dont l'offre indique explicitement l'absence de diplôme requis."
    );
  }

  if (info.experience === "Sans expérience") {
    protections.push(
      "Rechercher en priorité les offres acceptant les débutants, les formations ou l'accompagnement à la prise de poste."
    );
  }

  if (info.documents === "Documents à préciser") {
    protections.push(
      "Ne pas supposer qu'une personne sans document peut légalement exercer un emploi : vérifier la situation exacte auprès des sources officielles."
    );
  }

  return protections;
}

function selectSources(state) {
  const ctx = state.context;
  const result = [];

  if (ctx.emploi) {
    result.push(SOURCES.franceTravail);
  }

  if (ctx.immigration) {
    result.push(SOURCES.servicePublic);
    result.push(SOURCES.travailEtranger);
  }

  if (ctx.immigration && (
    ctx.administratif ||
    state.info.contexteImmigration
  )) {
    result.push(SOURCES.anef);
  }

  if (ctx.entreprise && !ctx.emploi) {
    result.push(SOURCES.entreprise);
    result.push(SOURCES.guichet);
  }

  if (ctx.administratif && !ctx.immigration && !ctx.entreprise) {
    result.push(SOURCES.servicePublic);
  }

  return uniqueArray(
    result.map(x => JSON.stringify(x))
  ).map(x => JSON.parse(x));
}

function buildConfirmed(info) {
  const fields = [
    "objectif",
    "zoneRecherche",
    "typeEmploi",
    "diplome",
    "experience",
    "mobilite",
    "horaires",
    "presenceFrance",
    "statutSejour",
    "pays",
    "entreprise"
  ];

  const result = {};

  for (const key of fields) {
    if (info[key]) result[key] = info[key];
  }

  return result;
}

function buildDocuments(state) {
  const result = [];

  if (state.context.immigration) {
    result.push(
      "Vérifier le document de séjour exact, sa validité et les droits associés sur Service-Public et, lorsque pertinent, ANEF."
    );
  }

  if (state.context.emploi) {
    result.push(
      "Vérifier les conditions exactes indiquées par l'offre et les éventuelles conditions d'autorisation de travail."
    );
  }

  if (state.context.entreprise) {
    result.push(
      "Vérifier les formalités applicables avant toute création d'entreprise."
    );
  }

  return result;
}

function buildActions(state) {
  const actions = [];

  if (state.context.emploi) {
    actions.push(
      "Créer ou mettre à jour un profil France Travail.",
      "Rechercher les offres correspondant à la zone et au type de travail.",
      "Préparer un CV simple adapté au profil."
    );

    if (
      state.info.diplome === "Sans diplôme" ||
      state.info.experience === "Sans expérience"
    ) {
      actions.push(
        "Filtrer les offres acceptant les débutants et/ou ne demandant pas de diplôme."
      );
    }
  }

  if (state.context.immigration) {
    actions.push(
      "Vérifier la situation exacte auprès de la source officielle avant toute démarche ou prise de poste."
    );
  }

  if (state.context.entreprise) {
    actions.push(
      "Identifier le statut et les formalités correspondant réellement au projet."
    );
  }

  return actions;
}

function buildRecommendations(state) {
  const result = [];

  if (
    state.context.emploi &&
    state.info.diplome === "Sans diplôme" &&
    state.info.experience === "Sans expérience"
  ) {
    result.push(
      "Cibler les postes accessibles sans diplôme et sans expérience déclarée.",
      "Comparer plusieurs secteurs au lieu de limiter automatiquement la recherche à un seul métier."
    );
  }

  if (
    state.context.emploi &&
    state.info.secteurs === "Tous secteurs"
  ) {
    result.push(
      "Effectuer une recherche multisectorielle afin d'identifier davantage de possibilités."
    );
  }

  if (state.context.immigration) {
    result.push(
      "Ne pas déduire un droit au travail à partir du seul nom d'un titre : vérifier les conditions exactes."
    );
  }

  return result;
}

function systemPrompt(language, state, decision) {
  const languageName = {
    fr: "français",
    ar: "arabe",
    en: "English",
    es: "Spanish",
    it: "Italian",
    de: "German",
    pt: "Portuguese",
    nl: "Dutch"
  }[language] || "français";

  return `
Tu es Go Rare AI, un moteur d'intelligence de situation.

Réponds en ${languageName}.

VERSION: ${VERSION}
DECISION ENGINE: ${DECISION_VERSION}

MISSION:
Comprendre la situation réelle de l'utilisateur, identifier les informations manquantes,
puis proposer des chemins pratiques, légaux et vérifiables.

RÈGLES ABSOLUES:
- Ne jamais inventer une loi, une procédure, un salaire, une entreprise, une offre ou une condition.
- Ne jamais transformer une hypothèse en fait.
- Pour immigration, droit au travail, séjour, entreprise et démarches administratives,
  privilégier les sources officielles.
- Si une information juridique doit être vérifiée, le dire clairement.
- Ne pas promettre un résultat.
- Ne pas déduire automatiquement qu'un titre de séjour autorise une activité précise.
- Si l'utilisateur n'a pas de diplôme, ne pas le considérer comme bloqué.
- Si l'utilisateur n'a pas d'expérience, ne pas le considérer comme bloqué.
- Si l'utilisateur indique ne pas avoir de documents, ne jamais inventer une solution :
  déterminer quels documents manquent et orienter vers la vérification officielle.
- Ne pas reposer une question dont l'information est déjà confirmée.
- Le moteur déterministe contrôle les questions.
- Ton rôle est d'expliquer, structurer et proposer des étapes.
- Réponse claire, pratique et concise.

INFORMATIONS ACTUELLES:
${JSON.stringify(state.info, null, 2)}

CONTEXTE:
${JSON.stringify(state.context, null, 2)}

DECISION:
${JSON.stringify(decision, null, 2)}

Si la décision est "question", ne pose pas une autre question :
la question déterminée doit rester prioritaire.

Si la décision est "orientation", donne une orientation structurée
et distingue clairement:
1. faits connus
2. ce qui doit être vérifié
3. prochaines étapes
4. pistes possibles
`;
}

async function askAI(env, language, state, decision) {
  if (!env || !env.IA || typeof env.IA.run !== "function") {
    return {
      text: "Le moteur IA n'est pas configuré.",
      error: "AI_NOT_CONFIGURED"
    };
  }

  const prompt = systemPrompt(language, state, decision);

  const response = await env.IA.run(MODEL, {
    messages: [
      {
        role: "system",
        content: prompt
      },
      {
        role: "user",
        content:
          state.historyText ||
          "Analyse la situation actuelle."
      }
    ],
    max_tokens: 3000,
    temperature: 0.15
  });

  let text = "";

  if (typeof response === "string") {
    text = response;
  } else if (response && typeof response.response === "string") {
    text = response.response;
  } else if (
    response &&
    Array.isArray(response.result)
  ) {
    text = response.result.join("\n");
  } else {
    text = JSON.stringify(response);
  }

  return {
    text: cleanText(text, 12000)
  };
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...extraHeaders
      }
    }
  );
}

function getClientIP(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function checkRateLimit(request) {
  const ip = getClientIP(request);
  const now = Date.now();

  let record = rateStore.get(ip);

  if (!record || now - record.start >= RATE.window) {
    record = {
      start: now,
      count: 0
    };
  }

  record.count++;
  rateStore.set(ip, record);

  if (record.count > RATE.max) {
    return false;
  }

  return true;
}

function securityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), geolocation=(), payment=(self)",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy":
      "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
  };
}

/* =========================
   SUPERPDP OAUTH V0.1
   ========================= */

const SUPERPDP = {
  base: "https://api.superpdp.tech",
  authorize: "/oauth2/authorize",
  token: "/oauth2/token",
  session: "/v1.beta/oauth2_sessions/me",
  cookie: "gr_oauth",
  stateTTL: 600000
};

function randomState() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map(x => x.toString(16).padStart(2, "0"))
    .join("");
}

function setCookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

function clearCookie(name) {
  return `${name}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";

  const parts = cookie.split(";");

  for (const part of parts) {
    const [k, ...v] = part.trim().split("=");

    if (k === name) {
      return decodeURIComponent(v.join("="));
    }
  }

  return "";
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hash))
    .map(x => x.toString(16).padStart(2, "0"))
    .join("");
}

async function billingStatus(request, env) {
  const token = getCookie(request, SUPERPDP.cookie);

  if (!token) {
    return {
      connected: false,
      companyVerified: false
    };
  }

  try {
    const response = await fetch(
      `${SUPERPDP.base}${SUPERPDP.session}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      }
    );

    if (!response.ok) {
      return {
        connected: false,
        companyVerified: false
      };
    }

    const data = await response.json();

    return {
      connected: true,
      companyVerified:
        data?.company_verification_status === "verified"
    };
  } catch {
    return {
      connected: false,
      companyVerified: false
    };
  }
}

async function billingConnect(request, env) {
  if (
    !env.SUPERPDP_CLIENT_ID ||
    !env.SUPERPDP_REDIRECT_URI
  ) {
    return new Response(
      "SuperPDP OAuth is not configured.",
      { status: 503 }
    );
  }

  const state = randomState();

  // V0.1: state is encoded and signed by an HMAC secret.
  // For production-wide state storage, use Durable Objects/KV.
  const statePayload = JSON.stringify({
    state,
    createdAt: Date.now()
  });

  const secret =
    env.SUPERPDP_CLIENT_SECRET ||
    env.SUPERPDP_CLIENT_ID;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(statePayload)
  );

  const sig = btoa(
    String.fromCharCode(...new Uint8Array(signature))
  );

  const packed = btoa(statePayload) + "." + sig;

  const url = new URL(
    SUPERPDP.authorize,
    SUPERPDP.base
  );

  url.searchParams.set(
    "client_id",
    env.SUPERPDP_CLIENT_ID
  );

  url.searchParams.set(
    "redirect_uri",
    env.SUPERPDP_REDIRECT_URI
  );

  url.searchParams.set(
    "response_type",
    "code"
  );

  url.searchParams.set(
    "state",
    packed
  );

  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      "Cache-Control": "no-store"
    }
  });
}

async function verifyOAuthState(packed, env) {
  if (!packed) return false;

  const parts = packed.split(".");
  if (parts.length !== 2) return false;

  try {
    const payload = atob(parts[0]);
    const signature = parts[1];

    const data = JSON.parse(payload);

    if (
      !data ||
      !data.createdAt ||
      Date.now() - data.createdAt > SUPERPDP.stateTTL
    ) {
      return false;
    }

    const secret =
      env.SUPERPDP_CLIENT_SECRET ||
      env.SUPERPDP_CLIENT_ID;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = Uint8Array.from(
      atob(signature),
      c => c.charCodeAt(0)
    );

    return await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(payload)
    );
  } catch {
    return false;
  }
}
async function billingCallback(request, env) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !(await verifyOAuthState(state, env))) {
    return new Response(
      "Invalid OAuth callback.",
      { status: 400 }
    );
  }

  if (
    !env.SUPERPDP_CLIENT_ID ||
    !env.SUPERPDP_CLIENT_SECRET ||
    !env.SUPERPDP_REDIRECT_URI
  ) {
    return new Response(
      "SuperPDP OAuth is not configured.",
      { status: 503 }
    );
  }

  try {
    const body = new URLSearchParams();

    body.set("grant_type", "authorization_code");
    body.set("code", code);
    body.set(
      "client_id",
      env.SUPERPDP_CLIENT_ID
    );
    body.set(
      "client_secret",
      env.SUPERPDP_CLIENT_SECRET
    );
    body.set(
      "redirect_uri",
      env.SUPERPDP_REDIRECT_URI
    );

    const tokenResponse = await fetch(
      `${SUPERPDP.base}${SUPERPDP.token}`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
          Accept: "application/json"
        },
        body
      }
    );

    if (!tokenResponse.ok) {
      return new Response(
        "OAuth token exchange failed.",
        { status: 502 }
      );
    }

    const tokenData = await tokenResponse.json();

    const accessToken =
      tokenData?.access_token;

    if (!accessToken) {
      return new Response(
        "No access token returned.",
        { status: 502 }
      );
    }

    const sessionResponse = await fetch(
      `${SUPERPDP.base}${SUPERPDP.session}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json"
        }
      }
    );

    if (!sessionResponse.ok) {
      return new Response(
        "Unable to verify SuperPDP session.",
        { status: 502 }
      );
    }

    const session =
      await sessionResponse.json();

    if (
      session?.company_verification_status !==
      "verified"
    ) {
      return new Response(
        "Company verification required.",
        { status: 403 }
      );
    }

    const response = new Response(
      `
      <!doctype html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Go Rare AI</title>
      </head>
      <body>
        <script>
          window.location.replace("/");
        </script>
        Connexion réussie.
      </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type":
            "text/html; charset=utf-8",
          "Cache-Control": "no-store"
        }
      }
    );

    response.headers.append(
      "Set-Cookie",
      setCookie(
        SUPERPDP.cookie,
        accessToken,
        8 * 60 * 60
      )
    );

    return response;

  } catch {
    return new Response(
      "OAuth processing error.",
      { status: 500 }
    );
  }
}

/* =========================
   CORE ANALYSIS
   ========================= */

async function analyserQuestion(payload, env) {
  if (!isPlainObject(payload)) {
    throw new Error("Invalid JSON body");
  }

  const question = cleanText(
    payload.question,
    LIMITS.question
  );

  if (!question) {
    throw new Error("Question is required");
  }

  const history = Array.isArray(payload.history)
    ? payload.history.slice(-20)
    : [];

  const infoPayload =
    isPlainObject(payload.info)
      ? payload.info
      : {};

  const requestedLanguage =
    cleanText(payload.language, 20);

  const language =
    detectLanguage(
      question,
      requestedLanguage
    );

  const state =
    construireEtatConversation(
      question,
      {
        history,
        info: infoPayload
      }
    );

  const decision =
    construireDecision(
      state,
      language
    );

  const sources =
    selectSources(state);

  const confirmed =
    buildConfirmed(state.info);

  const documents =
    buildDocuments(state);

  const actions =
    buildActions(state);

  const recommendations =
    buildRecommendations(state);

  const protections =
    appliquerProtectionsEmploi(
      state.info
    );

  if (decision.mode === "question") {
    return {
      version: VERSION,
      decisionVersion: DECISION_VERSION,
      language,
      mode: "question",
      answer: decision.question,
      decision,
      info: state.info,
      confirmed,
      documents,
      actions,
      recommendations: [
        ...recommendations,
        ...protections
      ],
      sources
    };
  }

  const ai =
    await askAI(
      env,
      language,
      state,
      decision
    );

  return {
    version: VERSION,
    decisionVersion: DECISION_VERSION,
    language,
    mode: "orientation",
    answer: ai.text,
    decision,
    info: state.info,
    confirmed,
    documents,
    actions,
    recommendations: [
      ...recommendations,
      ...protections
    ],
    sources
  };
}

/* =========================
   VISION
   ========================= */

async function analyserImage(payload, env) {
  const image = cleanText(
    payload?.image,
    10000000
  );

  if (!image) {
    throw new Error("Image is required");
  }

  const size =
    base64ByteLength(image);

  if (size > LIMITS.image) {
    throw new Error("Image too large");
  }

  if (
    !env?.IA ||
    typeof env.IA.run !== "function"
  ) {
    throw new Error("AI not configured");
  }

  const prompt = cleanText(
    payload?.prompt ||
    "Analyse uniquement ce qui est réellement visible ou lisible dans cette image. Ne devine pas les informations manquantes.",
    5000
  );

  const result =
    await env.IA.run(
      MODEL_VISION,
      {
        messages: [
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
                  url: image.startsWith("data:")
                    ? image
                    : `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      }
    );

  return {
    version: VERSION,
    answer:
      typeof result?.response === "string"
        ? result.response
        : JSON.stringify(result)
  };
}

/* =========================
   AUDIO
   ========================= */

async function transcrireAudio(payload, env) {
  const audio = cleanText(
    payload?.audio,
    16000000
  );

  if (!audio) {
    throw new Error("Audio is required");
  }

  if (
    base64ByteLength(audio) >
    LIMITS.audio
  ) {
    throw new Error("Audio too large");
  }

  if (
    !env?.IA ||
    typeof env.IA.run !== "function"
  ) {
    throw new Error("AI not configured");
  }

  const result =
    await env.IA.run(
      MODEL_AUDIO,
      {
        audio:
          audio.replace(
            /^data:[^,]+,/,
            ""
          )
      }
    );

  return {
    version: VERSION,
    text:
      typeof result?.text === "string"
        ? result.text
        : typeof result?.response === "string"
          ? result.response
          : JSON.stringify(result)
  };
}

/* =========================
   HTML APPLICATION
   ========================= */

function htmlPage() {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport"
      content="width=device-width,initial-scale=1">

<title>Go Rare AI</title>

<meta name="description"
      content="Go Rare AI — Comprendre votre situation. Voir plus loin.">

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
  background: #f6f7f9;
  color: #111;
}

main {
  width: min(900px, 94%);
  margin: auto;
  padding: 35px 0 60px;
}

header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -1px;
}

.subtitle {
  color: #666;
  margin-top: 8px;
}

.card {
  background: white;
  border-radius: 20px;
  padding: 22px;
  margin-top: 18px;
  box-shadow:
    0 8px 30px rgba(0,0,0,.06);
}

.profiles,
.situations {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

button {
  border: 0;
  border-radius: 12px;
  padding: 12px 16px;
  cursor: pointer;
  background: #eee;
  font-size: 15px;
}

button.active {
  background: #111;
  color: white;
}

textarea {
  width: 100%;
  min-height: 150px;
  resize: vertical;
  border: 1px solid #ddd;
  border-radius: 14px;
  padding: 15px;
  font-size: 16px;
  outline: none;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.primary {
  background: #111;
  color: white;
}

.result {
  white-space: pre-wrap;
  line-height: 1.65;
}

.item {
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.item:last-child {
  border-bottom: 0;
}

.source a {
  color: inherit;
  word-break: break-all;
}

.small {
  font-size: 13px;
  color: #777;
}

.lang {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.lang button {
  padding: 7px 10px;
  font-size: 12px;
}

[dir="rtl"] {
  text-align: right;
}

@media(max-width:600px) {
  main {
    padding-top: 20px;
  }

  .card {
    padding: 16px;
  }

  button {
    width: 100%;
  }

  .lang button {
    width: auto;
  }
}
</style>
</head>

<body>

<main>

<div class="lang">
  <button onclick="setLang('fr')">FR</button>
  <button onclick="setLang('ar')">AR</button>
  <button onclick="setLang('en')">EN</button>
</div>

<header>
  <div class="logo">Go Rare AI</div>
  <div class="subtitle" id="subtitle">
    Comprendre votre situation. Voir plus loin.
  </div>
</header>

<div class="card">
  <h3 id="profileTitle">Votre parcours</h3>

  <div class="profiles">
    <button data-profile="particulier"
            onclick="selectProfile('particulier')">
      Particulier
    </button>

    <button data-profile="emploi"
            onclick="selectProfile('emploi')">
      Emploi
    </button>

    <button data-profile="immigration"
            onclick="selectProfile('immigration')">
      Immigration
    </button>

    <button data-profile="entreprise"
            onclick="selectProfile('entreprise')">
      Entreprise
    </button>
  </div>
</div>

<div class="card">
  <h3 id="situationTitle">Situation</h3>

  <div class="situations">
    <button onclick="setSituation('recherche')">
      Recherche d'emploi
    </button>

    <button onclick="setSituation('formation')">
      Formation
    </button>

    <button onclick="setSituation('administratif')">
      Démarche administrative
    </button>

    <button onclick="setSituation('reconversion')">
      Reconversion
    </button>
  </div>
</div>

<div class="card">

<textarea
 id="question"
 placeholder="Décrivez votre situation ou votre objectif..."
></textarea>

<div class="actions">

<button class="primary"
        onclick="analyze()"
        id="analyzeBtn">
  Analyser
</button>

<button onclick="chooseImage()">
  Image
</button>

<button onclick="startAudio()">
  Micro
</button>

<input
 id="imageInput"
 type="file"
 accept="image/*"
 capture="environment"
 style="display:none"
 onchange="sendImage(this)"
>

</div>

<div id="status"
     class="small"
     style="margin-top:12px">
</div>

</div>

<div class="card">
<h3 id="resultTitle">Résultat</h3>

<div id="answer"
     class="result">
</div>
</div>

<div class="card">
<h3>Informations confirmées</h3>
<div id="confirmed"></div>
</div>

<div class="card">
<h3>Prochaines étapes</h3>
<div id="actions"></div>
</div>

<div class="card">
<h3>Pistes utiles</h3>
<div id="recommendations"></div>
</div>

<div class="card">
<h3>Sources officielles</h3>
<div id="sources"></div>
</div>

<div class="card">
<h3 id="billingTitle">Compte professionnel</h3>

<p class="small">
Connexion sécurisée. Les fonctions de facturation restent
désactivées tant que la vérification du compte n'est pas terminée.
</p>

<button onclick="connectBilling()">
Connecter mon compte
</button>

<div id="billingStatus"
     class="small"
     style="margin-top:10px">
</div>
</div>

</main>

<script>
const UI = ${JSON.stringify(UI)};
const PARCOURS = ${JSON.stringify(PARCOURS)};

let langue = "fr";
let profilActuel = "";
let situationActuelle = "";
let historique = [];
let informations = {};

function setLang(lang) {
  langue = lang;

  const ui = UI[lang] || UI.fr;

  document.documentElement.lang = lang;
  document.documentElement.dir =
    lang === "ar" ? "rtl" : "ltr";

  document.getElementById("subtitle").textContent =
    ui.subtitle;

  document.getElementById("analyzeBtn").textContent =
    ui.analyze;

  document.getElementById("question").placeholder =
    ui.placeholder;

  document.getElementById("resultTitle").textContent =
    ui.result;

  document.getElementById("billingTitle").textContent =
    ui.billing;

  updateProfileLabels();
}

function updateProfileLabels() {
  const p = PARCOURS[langue] || PARCOURS.fr;

  const map = {
    particulier: p.particulier,
    emploi: p.emploi,
    immigration: p.immigration,
    entreprise: p.entreprise
  };

  document
    .querySelectorAll("[data-profile]")
    .forEach(btn => {
      btn.textContent =
        map[btn.dataset.profile];
    });
}

function selectProfile(profile) {
  profilActuel = profile;

  document
    .querySelectorAll("[data-profile]")
    .forEach(btn => {
      btn.classList.toggle(
        "active",
        btn.dataset.profile === profile
      );
    });
}

function setSituation(value) {
  situationActuelle = value;
}

function chooseImage() {
  document
    .getElementById("imageInput")
    .click();
}

function setStatus(text) {
  document.getElementById("status").textContent =
    text || "";
}

function addUserHistory(text) {
  historique.push({
    role: "user",
    content: text
  });

  historique =
    historique.slice(-20);
}

function renderList(id, values) {
  const el =
    document.getElementById(id);

  el.innerHTML = "";

  if (!Array.isArray(values) ||
      values.length === 0) {
    el.textContent = "—";
    return;
  }

  values.forEach(value => {
    const div =
      document.createElement("div");

    div.className = "item";
    div.textContent = value;

    el.appendChild(div);
  });
}

function renderConfirmed(data) {
  const el =
    document.getElementById("confirmed");

  el.innerHTML = "";

  const obj =
    data.confirmed || {};

  const entries =
    Object.entries(obj);

  if (!entries.length) {
    el.textContent = "—";
    return;
  }

  entries.forEach(([key, value]) => {
    const div =
      document.createElement("div");

    div.className = "item";

    const strong =
      document.createElement("strong");

    strong.textContent =
      key + ": ";

    div.appendChild(strong);

    div.appendChild(
      document.createTextNode(value)
    );

    el.appendChild(div);
  });
}

function renderSources(values) {
  const el =
    document.getElementById("sources");

  el.innerHTML = "";

  if (!Array.isArray(values) ||
      !values.length) {
    el.textContent = "—";
    return;
  }

  values.forEach(source => {
    const div =
      document.createElement("div");

    div.className =
      "item source";

    const a =
      document.createElement("a");

    a.href = source.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent =
      source.name;

    div.appendChild(a);
    el.appendChild(div);
  });
}

async function analyze() {
  const input =
    document.getElementById("question");

  const question =
    input.value.trim();

  if (!question) {
    setStatus(
      langue === "ar"
        ? "اكتب وضعك أولاً."
        : langue === "en"
          ? "Describe your situation first."
          : "Décrivez votre situation d'abord."
    );

    return;
  }

  setStatus(
    langue === "ar"
      ? "جاري التحليل..."
      : langue === "en"
        ? "Analyzing..."
        : "Analyse en cours..."
  );

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
          history: historique,
          info: informations,
          profile: profilActuel,
          situation: situationActuelle,
          language: langue
        })
      });

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
        "Request failed"
      );
    }

    informations =
      data.info || informations;

    addUserHistory(question);

    document.getElementById("answer")
      .textContent =
      data.answer || "";

    renderConfirmed(data);
    renderList(
      "actions",
      data.actions
    );

    renderList(
      "recommendations",
      data.recommendations
    );

    renderSources(
      data.sources
    );

    setStatus(
      data.mode === "question"
        ? (langue === "ar"
            ? "هناك معلومة إضافية مطلوبة."
            : langue === "en"
              ? "One more detail is needed."
              : "Une information supplémentaire est nécessaire.")
        : ""
    );

    input.value = "";

  } catch (error) {
    setStatus(
      "Erreur: " +
      (error.message || "Unknown error")
    );
  }
}

async function sendImage(input) {
  const file =
    input.files?.[0];

  if (!file) return;

  setStatus(
    langue === "ar"
      ? "تحليل الصورة..."
      : langue === "en"
        ? "Analyzing image..."
        : "Analyse de l'image..."
  );

  try {
    const reader =
      new FileReader();

    reader.onload =
      async function() {

        const response =
          await fetch("/api/image", {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              image: reader.result,
              prompt:
                "Analyse uniquement les informations visibles ou lisibles. Ne devine pas."
            })
          });

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
            "Image analysis failed"
          );
        }

        document.getElementById("answer")
          .textContent =
          data.answer || "";

        setStatus("");
      };

    reader.readAsDataURL(file);

  } catch (error) {
    setStatus(
      "Erreur: " +
      error.message
    );
  }
}

let recorder = null;
let audioChunks = [];

async function startAudio() {
  if (!navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia) {
    setStatus(
      "Microphone non disponible."
    );
    return;
  }

  try {
    const stream =
      await navigator.mediaDevices
        .getUserMedia({
          audio: true
        });

    recorder =
      new MediaRecorder(stream);

    audioChunks = [];

    recorder.ondataavailable =
      event => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

    recorder.onstop =
      async () => {

        stream.getTracks()
          .forEach(track =>
            track.stop()
          );

        const blob =
          new Blob(
            audioChunks,
            { type: "audio/webm" }
          );

        const reader =
          new FileReader();

        reader.onload =
          async () => {

            try {
              const response =
                await fetch(
                  "/api/transcribe",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type":
                        "application/json"
                    },
                    body:
                      JSON.stringify({
                        audio:
                          reader.result
                      })
                  }
                );

              const data =
                await response.json();

              if (!response.ok) {
                throw new Error(
                  data?.error ||
                  "Transcription failed"
                );
              }

              document
                .getElementById("question")
                .value =
                data.text || "";

              setStatus("");
            } catch (error) {
              setStatus(
                "Erreur: " +
                error.message
              );
            }
          };

        reader.readAsDataURL(blob);
      };

    recorder.start();

    setStatus(
      langue === "ar"
        ? "تحدث الآن... اضغط Micro مرة أخرى للإيقاف."
        : langue === "en"
          ? "Speak now... press Micro again to stop."
          : "Parlez maintenant... appuyez à nouveau sur Micro pour arrêter."
    );

    setTimeout(() => {
      if (
        recorder &&
        recorder.state === "recording"
      ) {
        recorder.stop();
      }
    }, 30000);

  } catch {
    setStatus(
      "Impossible d'accéder au microphone."
    );
  }
}

async function connectBilling() {
  window.location.href =
    "/api/billing/connect";
}

async function loadBillingStatus() {
  try {
    const response =
      await fetch(
        "/api/billing/status"
      );

    const data =
      await response.json();

    const el =
      document.getElementById(
        "billingStatus"
      );

    if (data.connected &&
        data.companyVerified) {
      el.textContent =
        langue === "ar"
          ? "الحساب متصل وتم التحقق من الشركة."
          : langue === "en"
            ? "Account connected and company verified."
            : "Compte connecté et entreprise vérifiée.";
    } else {
      el.textContent =
        langue === "ar"
          ? "الحساب غير متصل."
          : langue === "en"
            ? "Account not connected."
            : "Compte non connecté.";
    }
  } catch {}
}

setLang("fr");
loadBillingStatus();
</script>

</body>
</html>`;
}

/* =========================
   REQUEST ROUTER
   ========================= */

export default {
  async fetch(request, env) {

    const method =
      request.method.toUpperCase();

    const url =
      new URL(request.url);

    const headers =
      securityHeaders();

    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers
      });
    }

    if (!checkRateLimit(request)) {
      return json(
        {
          error:
            "Too many requests. Please try again later."
        },
        429,
        headers
      );
    }

    try {

      if (
        method === "GET" &&
        url.pathname === "/"
      ) {
        return new Response(
          htmlPage(),
          {
            status: 200,
            headers: {
              "Content-Type":
                "text/html; charset=utf-8",
              "Cache-Control":
                "no-store",
              ...headers
            }
          }
        );
      }

      if (
        method === "GET" &&
        url.pathname === "/health"
      ) {
        return json(
          {
            ok: true,
            app: "Go Rare AI",
            version: VERSION,
            decisionVersion:
              DECISION_VERSION
          },
          200,
          headers
        );
      }

      if (
        method === "POST" &&
        url.pathname === "/api/analyze"
      ) {
        const length =
          Number(
            request.headers.get(
              "Content-Length"
            ) || 0
          );

        if (
          length > LIMITS.jsonBody
        ) {
          return json(
            {
              error:
                "Request body too large."
            },
            413,
            headers
          );
        }

        const payload =
          await request.json();

        const result =
          await analyserQuestion(
            payload,
            env
          );

        return json(
          result,
          200,
          headers
        );
      }

      if (
        method === "POST" &&
        url.pathname === "/api/image"
      ) {
        const payload =
          await request.json();

        const result =
          await analyserImage(
            payload,
            env
          );

        return json(
          result,
          200,
          headers
        );
      }

      if (
        method === "POST" &&
        url.pathname === "/api/transcribe"
      ) {
        const payload =
          await request.json();

        const result =
          await transcrireAudio(
            payload,
            env
          );

        return json(
          result,
          200,
          headers
        );
      }

      if (
        method === "GET" &&
        url.pathname ===
          "/api/billing/status"
      ) {
        const result =
          await billingStatus(
            request,
            env
          );

        return json(
          result,
          200,
          headers
        );
      }

      if (
        method === "GET" &&
        url.pathname ===
          "/api/billing/connect"
      ) {
        return billingConnect(
          request,
          env
        );
      }

      if (
        method === "GET" &&
        url.pathname ===
          "/api/billing/callback"
      ) {
        return billingCallback(
          request,
          env
        );
      }

      return json(
        {
          error: "Not found",
          version: VERSION
        },
        404,
        headers
      );

    } catch (error) {

      return json(
        {
          error:
            error?.message ||
            "Internal server error",
          version: VERSION
        },
        500,
        headers
      );
    }
  }
};
