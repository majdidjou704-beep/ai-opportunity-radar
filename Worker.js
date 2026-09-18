const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const MODEL_VISION = "@cf/meta/llama-3.2-11b-vision-instruct";
const MODEL_AUDIO = "@cf/openai/whisper-large-v3-turbo";

const VERSION = "10.4.0";
const DECISION_VERSION = "10.4.0";

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

/* =========================
   OFFICIAL SOURCES
   ========================= */

const SOURCES = {
  franceTravail: {
    name: "France Travail",
    url: "https://www.francetravail.fr/"
  },

  franceTravailOffers: {
    name: "France Travail — Recherche d'offres",
    url: "https://candidat.francetravail.fr/offres/recherche"
  },

  franceTravailAPI: {
    name: "France Travail — API",
    url: "https://francetravail.io/"
  },

  anef: {
    name: "ANEF",
    url:
      "https://administration-etrangers-en-france.interieur.gouv.fr/"
  },

  travailEtranger: {
    name: "Service-Public — Travail d'un étranger en France",
    url:
      "https://www.service-public.fr/particuliers/vosdroits/N107"
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

const LANGUAGES = [
  "fr",
  "ar",
  "en",
  "es",
  "it",
  "de",
  "pt",
  "nl"
];

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
    stop: "Arrêter",
    placeholder:
      "Décrivez votre situation ou votre objectif...",
    particular: "Particulier",
    employment: "Emploi",
    immigration: "Immigration",
    business: "Entreprise",
    situation: "Situation",
    searchJob: "Recherche d'emploi",
    training: "Formation",
    administrative: "Démarche administrative",
    reconversion: "Reconversion",
    result: "Résultat",
    confirmed: "Informations confirmées",
    verify: "Informations à vérifier",
    missing: "Informations nécessaires",
    sources: "Sources officielles",
    actions: "Prochaines étapes",
    recommendations: "Pistes utiles",
    opportunities: "Opportunités trouvées",
    billing: "Compte professionnel",
    secure: "Connexion sécurisée",
    connect: "Connecter mon compte",
    notConnected: "Compte non connecté.",
    searching: "Recherche en cours...",
    ready: "Prêt.",
    error: "Erreur"
  },

  ar: {
    title: "Go Rare AI",
    subtitle: "افهم وضعك. وانظر إلى أبعد.",
    analyze: "تحليل",
    image: "صورة",
    microphone: "ميكروفون",
    stop: "إيقاف",
    placeholder:
      "اشرح وضعك أو هدفك...",
    particular: "فرد",
    employment: "العمل",
    immigration: "الهجرة والإقامة",
    business: "شركة",
    situation: "الوضع",
    searchJob: "البحث عن عمل",
    training: "التكوين",
    administrative: "إجراء إداري",
    reconversion: "إعادة التوجيه المهني",
    result: "النتيجة",
    confirmed: "المعلومات المؤكدة",
    verify: "معلومات تحتاج إلى تحقق",
    missing: "المعلومات المطلوبة",
    sources: "المصادر الرسمية",
    actions: "الخطوات التالية",
    recommendations: "مسارات مفيدة",
    opportunities: "الفرص التي تم العثور عليها",
    billing: "الحساب المهني",
    secure: "اتصال آمن",
    connect: "ربط الحساب",
    notConnected: "الحساب غير متصل.",
    searching: "جاري البحث...",
    ready: "جاهز.",
    error: "خطأ"
  },

  en: {
    title: "Go Rare AI",
    subtitle: "Understand your situation. See further.",
    analyze: "Analyze",
    image: "Image",
    microphone: "Microphone",
    stop: "Stop",
    placeholder:
      "Describe your situation or objective...",
    particular: "Individual",
    employment: "Employment",
    immigration: "Immigration",
    business: "Business",
    situation: "Situation",
    searchJob: "Job search",
    training: "Training",
    administrative: "Administrative procedure",
    reconversion: "Career change",
    result: "Result",
    confirmed: "Confirmed information",
    verify: "Information to verify",
    missing: "Required information",
    sources: "Official sources",
    actions: "Next steps",
    recommendations: "Useful paths",
    opportunities: "Opportunities found",
    billing: "Professional account",
    secure: "Secure connection",
    connect: "Connect account",
    notConnected: "Account not connected.",
    searching: "Searching...",
    ready: "Ready.",
    error: "Error"
  }
};

const QUESTIONS = {
  fr: {
    zone_recherche: {
      key: "zone_recherche",
      text:
        "Dans quelle ville ou zone souhaitez-vous rechercher ?",
      field: "zoneRecherche"
    },

    type_emploi: {
      key: "type_emploi",
      text:
        "Quel type de travail recherchez-vous ? Vous pouvez aussi dire « peu importe ».",
      field: "typeEmploi"
    },

    diplome: {
      key: "diplome",
      text:
        "Avez-vous un diplôme ou souhaitez-vous rechercher sans diplôme ?",
      field: "diplome"
    },

    experience: {
      key: "experience",
      text:
        "Avez-vous déjà une expérience professionnelle, même courte ?",
      field: "experience"
    },

    mobilite: {
      key: "mobilite",
      text:
        "Jusqu'où pouvez-vous vous déplacer pour travailler ?",
      field: "mobilite"
    },

    horaires: {
      key: "horaires",
      text:
        "Avez-vous une préférence pour les horaires ou êtes-vous flexible ?",
      field: "horaires"
    },

    presence_france: {
      key: "presence_france",
      text:
        "Êtes-vous actuellement en France ?",
      field: "presenceFrance"
    },

    statut_sejour: {
      key: "statut_sejour",
      text:
        "Quel est votre statut de séjour en France ?",
      field: "statutSejour"
    },

    entreprise: {
      key: "entreprise",
      text:
        "Avez-vous déjà une entreprise ou seulement un projet ?",
      field: "entreprise"
    }
  },

  ar: {
    zone_recherche: {
      key: "zone_recherche",
      text:
        "في أي مدينة أو منطقة تريد البحث؟",
      field: "zoneRecherche"
    },

    type_emploi: {
      key: "type_emploi",
      text:
        "ما نوع العمل الذي تبحث عنه؟ يمكنك أيضًا أن تقول: لا يهم.",
      field: "typeEmploi"
    },

    diplome: {
      key: "diplome",
      text:
        "هل لديك شهادة؟ أم تريد البحث عن عمل بدون شهادة؟",
      field: "diplome"
    },

    experience: {
      key: "experience",
      text:
        "هل لديك خبرة مهنية سابقة، حتى لو كانت قصيرة؟",
      field: "experience"
    },

    mobilite: {
      key: "mobilite",
      text:
        "إلى أي مسافة يمكنك التنقل من أجل العمل؟",
      field: "mobilite"
    },

    horaires: {
      key: "horaires",
      text:
        "هل لديك تفضيل لساعات العمل أم أنك مرن؟",
      field: "horaires"
    },

    presence_france: {
      key: "presence_france",
      text:
        "هل أنت حاليًا في فرنسا؟",
      field: "presenceFrance"
    },

    statut_sejour: {
      key: "statut_sejour",
      text:
        "ما هو وضع إقامتك في فرنسا؟",
      field: "statutSejour"
    },

    entreprise: {
      key: "entreprise",
      text:
        "هل لديك شركة بالفعل أم مجرد مشروع؟",
      field: "entreprise"
    }
  },

  en: {
    zone_recherche: {
      key: "zone_recherche",
      text:
        "Which city or area would you like to search in?",
      field: "zoneRecherche"
    },

    type_emploi: {
      key: "type_emploi",
      text:
        "What type of work are you looking for? You can also say 'any'.",
      field: "typeEmploi"
    },

    diplome: {
      key: "diplome",
      text:
        "Do you have a diploma, or would you like to search without one?",
      field: "diplome"
    },

    experience: {
      key: "experience",
      text:
        "Do you have any professional experience, even a short one?",
      field: "experience"
    },

    mobilite: {
      key: "mobilite",
      text:
        "How far can you travel for work?",
      field: "mobilite"
    },

    horaires: {
      key: "horaires",
      text:
        "Do you have preferred working hours or are you flexible?",
      field: "horaires"
    },

    presence_france: {
      key: "presence_france",
      text:
        "Are you currently in France?",
      field: "presenceFrance"
    },

    statut_sejour: {
      key: "statut_sejour",
      text:
        "What is your residence status in France?",
      field: "statutSejour"
    },

    entreprise: {
      key: "entreprise",
      text:
        "Do you already have a company or only a business project?",
      field: "entreprise"
    }
  }
};

/* =========================
   BASIC HELPERS
   ========================= */

function cleanText(value, max = 10000) {
  if (typeof value !== "string") return "";

  return value
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, max);
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
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function containsAny(text, list) {
  const t = String(text || "").toLowerCase();

  return list.some(x =>
    t.includes(x.toLowerCase())
  );
}

function base64ByteLength(value) {
  if (typeof value !== "string") return 0;

  const clean =
    value.replace(/^data:[^,]+,/, "");

  return Math.floor(
    clean.length * 3 / 4
  );
}

function normalizeLanguage(lang) {
  const x =
    String(lang || "").toLowerCase();

  return LANGUAGES.includes(x)
    ? x
    : "fr";
}

function detectLanguage(text, requested) {
  if (requested) {
    return normalizeLanguage(requested);
  }

  const t = String(text || "");

  const arabic =
    (t.match(/[\u0600-\u06ff]/g) || [])
      .length;

  if (arabic >= 2) return "ar";

  const lower =
    t.toLowerCase();

  const en = [
    "the",
    "work",
    "job",
    "employment",
    "without",
    "experience",
    "diploma",
    "company",
    "france",
    "need",
    "want"
  ];

  const fr = [
    "le",
    "la",
    "les",
    "travail",
    "emploi",
    "sans",
    "expérience",
    "diplôme",
    "entreprise",
    "france",
    "cherche",
    "besoin"
  ];

  const enScore =
    en.filter(w =>
      lower.includes(w)
    ).length;

  const frScore =
    fr.filter(w =>
      lower.includes(w)
    ).length;

  if (
    enScore > frScore &&
    enScore >= 2
  ) {
    return "en";
  }

  return "fr";
}

function normaliserLieu(text) {
  const lower =
    String(text || "")
      .toLowerCase();

  for (
    const [alias, canonical]
    of Object.entries(LOCATION_ALIASES)
  ) {
    if (
      lower.includes(alias)
    ) {
      return canonical;
    }
  }

  return "";
}

/* =========================
   INFORMATION EXTRACTION
   ========================= */

function extraireInformations(text) {
  const t =
    cleanText(
      text,
      LIMITS.question
    );

  const lower =
    t.toLowerCase();

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
    info.diplome =
      "Sans diplôme";
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
    info.experience =
      "Sans expérience";
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
    info.secteurs =
      "Tous secteurs";

    info.typeEmploi =
      "Peu importe";
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
    info.pays =
      "France";

    info.presenceFrance =
      "Oui";
  }

  const lieu =
    normaliserLieu(lower);

  if (lieu) {
    info.zoneRecherche =
      lieu;
  }

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
    ["batiment", "Bâtiment"],
    ["chauffeur", "Chauffeur / conduite"],
    ["conducteur", "Chauffeur / conduite"],
    ["préparateur de commande", "Logistique"],
    ["preparateur de commande", "Logistique"]
  ];

  for (
    const [needle, value]
    of emploiPatterns
  ) {
    if (
      lower.includes(needle)
    ) {
      info.typeEmploi =
        value;

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
      "residence permit",
      "residence card",
      "إقامة",
      "بطاقة إقامة",
      "تصريح إقامة"
    ])
  ) {
    info.statutSejour =
      "À vérifier précisément";
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
    info.contexteImmigration =
      true;
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
    info.entreprise =
      "Projet ou entreprise à préciser";
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
    info.documents =
      "Documents à préciser";
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
    info.horaires =
      "Flexible";
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
    info.mobilite =
      "Mobile";
  }

  return info;
}

/* =========================
   CONTEXT ENGINE
   ========================= */

function detectContext(
  text,
  info = {},
  profile = "",
  situation = ""
) {
  const t =
    String(text || "")
      .toLowerCase();

  const p =
    String(profile || "")
      .toLowerCase();

  const s =
    String(situation || "")
      .toLowerCase();

  const emploiByProfile =
    p === "emploi" ||
    s === "recherche" ||
    s === "emploi";

  const immigrationByProfile =
    p === "immigration";

  const entrepriseByProfile =
    p === "entreprise";

  return {
    emploi:
      emploiByProfile ||
      !!info.typeEmploi ||
      !!info.zoneRecherche ||
      containsAny(t, [
        "emploi",
        "travail",
        "job",
        "work",
        "facteur",
        "livreur",
        "nettoyage",
        "manutention",
        "logistique",
        "وظيفة",
        "عمل"
      ]),

    immigration:
      immigrationByProfile ||
      !!info.statutSejour ||
      !!info.contexteImmigration ||
      containsAny(t, [
        "titre de séjour",
        "titre de sejour",
        "résidence",
        "residence",
        "anef",
        "immigration",
        "إقامة",
        "الهجرة"
      ]),

    entreprise:
      entrepriseByProfile ||
      !!info.entreprise ||
      containsAny(t, [
        "entreprise",
        "company",
        "business",
        "société",
        "شركة",
        "مشروع"
      ]),

    administratif:
      containsAny(t, [
        "démarche",
        "administratif",
        "administration",
        "document",
        "procedure",
        "إجراء",
        "وثيقة"
      ]) ||
      s === "administratif",

    formation:
      s === "formation" ||
      containsAny(t, [
        "formation",
        "training",
        "تكوين"
      ]),

    reconversion:
      s === "reconversion" ||
      containsAny(t, [
        "reconversion",
        "career change",
        "إعادة التوجيه"
      ]),

    sansDiplome:
      info.diplome ===
      "Sans diplôme",

    sansExperience:
      info.experience ===
      "Sans expérience",

    sansDocuments:
      info.documents ===
      "Documents à préciser"
  };
}

function analyserHistorique(history) {
  const list =
    Array.isArray(history)
      ? history
      : [];

  return list
    .filter(item => {
      if (
        !isPlainObject(item)
      ) {
        return false;
      }

      return item.role === "user";
    })
    .slice(-20)
    .map(item =>
      cleanText(
        item.content,
        4000
      )
    )
    .filter(Boolean)
    .join("\n");
}

function mergeInfo(...objects) {
  const result = {};

  for (
    const obj of objects
  ) {
    if (
      !isPlainObject(obj)
    ) {
      continue;
    }

    for (
      const [key, value]
      of Object.entries(obj)
    ) {
      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        result[key] =
          value;
      }
    }
  }

  return result;
}

function construireEtatConversation(
  question,
  payload
) {
  const historyText =
    analyserHistorique(
      payload.history
    );

  const historiqueInfo =
    extraireInformations(
      historyText
    );

  const currentInfo =
    extraireInformations(
      question
    );

  const payloadInfo =
    isPlainObject(
      payload.info
    )
      ? payload.info
      : {};

  const info =
    mergeInfo(
      historiqueInfo,
      payloadInfo,
      currentInfo
    );

  const context =
    detectContext(
      `${historyText}\n${question}`,
      info,
      payload.profile,
      payload.situation
    );

  return {
    info,
    context,
    historyText
  };
}

/* =========================
   DECISION ENGINE
   ========================= */

function candidatsQuestions(
  state,
  language
) {
  const info =
    state.info;

  const ctx =
    state.context;

  const q =
    QUESTIONS[language] ||
    QUESTIONS.fr;

  const missing = [];

  if (ctx.emploi) {
    if (!info.zoneRecherche) {
      missing.push(
        q.zone_recherche
      );
    }

    if (!info.typeEmploi) {
      missing.push(
        q.type_emploi
      );
    }

    if (!info.diplome) {
      missing.push(
        q.diplome
      );
    }

    if (!info.experience) {
      missing.push(
        q.experience
      );
    }

    if (!info.mobilite) {
      missing.push(
        q.mobilite
      );
    }

    if (!info.horaires) {
      missing.push(
        q.horaires
      );
    }
  }

  if (ctx.immigration) {
    if (!info.presenceFrance) {
      missing.push(
        q.presence_france
      );
    }

    if (!info.statutSejour) {
      missing.push(
        q.statut_sejour
      );
    }
  }

  if (
    ctx.entreprise &&
    !ctx.emploi
  ) {
    if (!info.entreprise) {
      missing.push(
        q.entreprise
      );
    }
  }

  return missing;
}

function construireDecision(
  state,
  language
) {
  const questions =
    candidatsQuestions(
      state,
      language
    );

  if (
    questions.length > 0
  ) {
    return {
      version:
        DECISION_VERSION,

      mode:
        "question",

      question:
        questions[0].text,

      questionKey:
        questions[0].key,

      field:
        questions[0].field,

      remaining:
        questions.length
    };
  }

  return {
    version:
      DECISION_VERSION,

    mode:
      "orientation",

    question:
      null,

    questionKey:
      null,

    field:
      null,

    remaining:
      0
  };
}

/* =========================
   VERIFICATION ENGINE
   ========================= */

function buildVerification(state) {
  const result = [];

  if (
    state.context.immigration
  ) {
    result.push(
      {
        item:
          "Droit au séjour et/ou au travail",
        reason:
          "Le droit applicable dépend du document et de la situation exacte.",
        source:
          SOURCES.travailEtranger.url
      }
    );
  }

  if (
    state.context.emploi &&
    state.info.documents ===
      "Documents à préciser"
  ) {
    result.push(
      {
        item:
          "Documents nécessaires pour travailler",
        reason:
          "Les documents disponibles et les autorisations éventuelles doivent être vérifiés.",
        source:
          SOURCES.servicePublic.url
      }
    );
  }

  if (
    state.context.emploi
  ) {
    result.push(
      {
        item:
          "Conditions de chaque offre",
        reason:
          "Une offre réelle peut avoir des conditions particulières.",
        source:
          SOURCES.franceTravailOffers.url
      }
    );
  }

  return result;
}

/* =========================
   SOURCES
   ========================= */

function selectSources(state) {
  const ctx =
    state.context;

  const result = [];

  if (ctx.emploi) {
    result.push(
      SOURCES.franceTravail,
      SOURCES.franceTravailOffers
    );
  }

  if (ctx.immigration) {
    result.push(
      SOURCES.servicePublic,
      SOURCES.travailEtranger
    );
  }

  if (
    ctx.immigration &&
    (
      ctx.administratif ||
      state.info.contexteImmigration
    )
  ) {
    result.push(
      SOURCES.anef
    );
  }

  if (
    ctx.entreprise &&
    !ctx.emploi
  ) {
    result.push(
      SOURCES.entreprise,
      SOURCES.guichet
    );
  }

  if (
    ctx.administratif &&
    !ctx.immigration &&
    !ctx.entreprise
  ) {
    result.push(
      SOURCES.servicePublic
    );
  }

  return uniqueArray(
    result.map(x =>
      JSON.stringify(x)
    )
  ).map(x =>
    JSON.parse(x)
  );
}

/* =========================
   PRESENTATION DATA
   ========================= */

function buildConfirmed(info) {
  const fields = [
    "objectif",
    "zoneRecherche",
    "typeEmploi",
    "secteurs",
    "diplome",
    "experience",
    "mobilite",
    "horaires",
    "presenceFrance",
    "statutSejour",
    "pays",
    "entreprise",
    "documents"
  ];

  const result = {};

  for (
    const key of fields
  ) {
    if (info[key]) {
      result[key] =
        info[key];
    }
  }

  return result;
}

function buildActions(state) {
  const actions = [];

  if (
    state.context.emploi
  ) {
    actions.push(
      "Rechercher les offres correspondant à la zone et au profil.",
      "Comparer les conditions de plusieurs offres.",
      "Préparer un CV simple adapté au profil."
    );

    if (
      state.info.diplome ===
        "Sans diplôme" ||
      state.info.experience ===
        "Sans expérience"
    ) {
      actions.push(
        "Filtrer en priorité les offres acceptant les débutants et/ou ne demandant pas de diplôme."
      );
    }
  }

  if (
    state.context.immigration
  ) {
    actions.push(
      "Vérifier la situation exacte auprès des sources officielles avant toute démarche ou prise de poste."
    );
  }

  if (
    state.context.entreprise
  ) {
    actions.push(
      "Identifier le statut et les formalités correspondant réellement au projet."
    );
  }

  if (
    state.context.formation
  ) {
    actions.push(
      "Identifier les formations correspondant au profil et à l'objectif."
    );
  }

  if (
    state.context.reconversion
  ) {
    actions.push(
      "Identifier les métiers accessibles puis comparer les formations ou transitions nécessaires."
    );
  }

  return actions;
}

function buildRecommendations(state) {
  const result = [];

  if (
    state.context.emploi &&
    state.info.diplome ===
      "Sans diplôme" &&
    state.info.experience ===
      "Sans expérience"
  ) {
    result.push(
      "Cibler les postes accessibles sans diplôme et sans expérience déclarée.",
      "Comparer plusieurs secteurs au lieu de limiter automatiquement la recherche à un seul métier."
    );
  }

  if (
    state.context.emploi &&
    state.info.secteurs ===
      "Tous secteurs"
  ) {
    result.push(
      "Effectuer une recherche multisectorielle afin d'identifier davantage de possibilités."
    );
  }

  if (
    state.context.immigration
  ) {
    result.push(
      "Ne pas déduire un droit au travail à partir du seul nom d'un titre : vérifier les conditions exactes."
    );
  }

  return result;
}

function appliquerProtectionsEmploi(info) {
  const protections = [];

  if (
    info.diplome ===
    "Sans diplôme"
  ) {
    protections.push(
      "Rechercher en priorité les offres indiquant explicitement qu'aucun diplôme n'est requis ou acceptant les profils correspondants."
    );
  }

  if (
    info.experience ===
    "Sans expérience"
  ) {
    protections.push(
      "Rechercher les offres ouvertes aux débutants et les possibilités de formation ou d'accompagnement."
    );
  }

  if (
    info.documents ===
    "Documents à préciser"
  ) {
    protections.push(
      "Ne pas supposer qu'une personne sans document peut légalement exercer un emploi : vérifier la situation exacte auprès des sources officielles."
    );
  }

  return protections;
}

/* =========================
   FRANCE TRAVAIL SEARCH
   ========================= */

function buildFranceTravailSearchURL(
  info
) {
  const url =
    new URL(
      SOURCES.franceTravailOffers.url
    );

  if (
    info.typeEmploi &&
    info.typeEmploi !==
      "Peu importe"
  ) {
    url.searchParams.set(
      "motsCles",
      info.typeEmploi
    );
  }

  if (
    info.zoneRecherche
  ) {
    url.searchParams.set(
      "lieux",
      info.zoneRecherche
    );
  }

  url.searchParams.set(
    "offresPartenaires",
    "true"
  );

  return url.toString();
}

/*
  France Travail API:
  La recherche API est optionnelle.
  Elle ne s'active que si les secrets sont présents.

  Variables attendues:
  FT_CLIENT_ID
  FT_CLIENT_SECRET
*/

async function getFranceTravailToken(
  env
) {
  if (
    !env?.FT_CLIENT_ID ||
    !env?.FT_CLIENT_SECRET
  ) {
    return null;
  }

  try {
    const body =
      new URLSearchParams();

    body.set(
      "grant_type",
      "client_credentials"
    );

    body.set(
      "client_id",
      env.FT_CLIENT_ID
    );

    body.set(
      "client_secret",
      env.FT_CLIENT_SECRET
    );

    const response =
      await fetch(
        "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
            Accept:
              "application/json"
          },

          body
        }
      );

    if (!response.ok) {
      return null;
    }

    const data =
      await response.json();

    return (
      data?.access_token ||
      null
    );

  } catch {
    return null;
  }
}

function normalizeOffer(
  offer
) {
  if (
    !isPlainObject(offer)
  ) {
    return null;
  }

  const id =
    offer.id ||
    offer.identifiant ||
    offer.numeroOffre;

  const title =
    offer.intitule ||
    offer.title ||
    "";

  const location =
    offer.lieuTravail?.libelle ||
    offer.lieuTravail?.commune ||
    offer.location ||
    "";

  const company =
    offer.entreprise?.nom ||
    offer.company ||
    "";

  const contract =
    offer.typeContratLibelle ||
    offer.typeContrat ||
    "";

  const experience =
    offer.experienceLibelle ||
    offer.experience ||
    "";

  const publication =
    offer.dateCreation ||
    offer.dateActualisation ||
    offer.publishedAt ||
    "";

  const description =
    offer.description ||
    "";

  if (!title) {
    return null;
  }

  let url = "";

  if (id) {
    url =
      `https://candidat.francetravail.fr/offres/recherche/detail/${encodeURIComponent(id)}`;
  }

  return {
    id:
      id || null,

    title:
      cleanText(title, 500),

    location:
      cleanText(location, 500),

    company:
      cleanText(company, 500),

    contract:
      cleanText(contract, 300),

    experience:
      cleanText(experience, 300),

    publication:
      cleanText(publication, 100),

    description:
      cleanText(description, 1000),

    url,

    source:
      "France Travail"
  };
}

async function searchFranceTravail(
  info,
  env
) {
  const searchURL =
    buildFranceTravailSearchURL(
      info
    );

  const token =
    await getFranceTravailToken(
      env
    );

  if (!token) {
    return {
      enabled: false,
      source:
        SOURCES.franceTravailOffers,
      searchURL,
      opportunities: [],
      message:
        "API France Travail non configurée. Recherche officielle prête à être ouverte."
    };
  }

  try {
    const params =
      new URLSearchParams();

    if (
      info.typeEmploi &&
      info.typeEmploi !==
        "Peu importe"
    ) {
      params.set(
        "motsCles",
        info.typeEmploi
      );
    }

    if (
      info.zoneRecherche
    ) {
      params.set(
        "commune",
        info.zoneRecherche
      );
    }

    params.set(
      "range",
      "0-19"
    );

    const response =
      await fetch(
        `https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search?${params.toString()}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
            Accept:
              "application/json"
          }
        }
      );

    if (!response.ok) {
      return {
        enabled: true,
        source:
          SOURCES.franceTravailAPI,
        searchURL,
        opportunities: [],
        message:
          "La recherche API France Travail n'a pas pu être exécutée."
      };
    }

    const data =
      await response.json();

    const raw =
      Array.isArray(
        data?.resultats
      )
        ? data.resultats
        : [];

    const opportunities =
      raw
        .map(normalizeOffer)
        .filter(Boolean)
        .slice(0, 20);

    return {
      enabled: true,
      source:
        SOURCES.franceTravailAPI,
      searchURL,
      opportunities
    };

  } catch {
    return {
      enabled: true,
      source:
        SOURCES.franceTravailAPI,
      searchURL,
      opportunities: [],
      message:
        "Erreur pendant la recherche France Travail."
    };
  }
}
/* =========================
   AI ENGINE
   ========================= */

function systemPrompt(language, state) {
  const langName =
    language === "ar"
      ? "Arabic"
      : language === "en"
        ? "English"
        : "French";

  return [
    "You are Go Rare AI, a practical situation-intelligence assistant.",
    "Answer in " + langName + ".",
    "Use only information supported by the user's message, verified data, or official sources supplied by the application.",
    "Never invent job offers, legal rights, documents, prices, deadlines, companies, or procedures.",
    "When a legal, immigration, employment, or administrative point depends on the exact situation, say that it must be verified.",
    "For job searches, distinguish clearly between real retrieved opportunities and a search link; never present a search link as a found offer.",
    "Prefer concise, practical, numbered next steps.",
    "User context: " + JSON.stringify(state.info),
    "Detected context: " + JSON.stringify(state.context)
  ].join("\n");
}

async function askAI(env, messages) {
  if (!env?.AI?.run) {
    throw new Error(
      "AI binding is not configured."
    );
  }

  const result =
    await env.AI.run(
      MODEL,
      {
        messages:
          messages.slice(-20)
      }
    );

  return cleanText(
    result?.response ||
      result?.result?.response ||
      result?.output_text ||
      "",
    LIMITS.message
  );
}

function buildOpportunityData(
  searchResult
) {
  const result =
    searchResult || {};

  const opportunities =
    Array.isArray(
      result.opportunities
    )
      ? result.opportunities
          .filter(isPlainObject)
          .slice(0, 20)
      : [];

  return {
    enabled:
      result.enabled === true,

    source:
      result.source ||
      SOURCES.franceTravailOffers,

    searchURL:
      result.searchURL || "",

    opportunities,

    count:
      opportunities.length,

    message:
      result.message || ""
  };
}

function buildResult(
  state,
  decision,
  sources,
  verification,
  opportunities,
  answer
) {
  return {
    version:
      VERSION,

    decisionVersion:
      DECISION_VERSION,

    ok: true,

    mode:
      decision.mode,

    question:
      decision.question,

    questionKey:
      decision.questionKey,

    field:
      decision.field,

    remaining:
      decision.remaining,

    language:
      state.language,

    context:
      state.context,

    confirmed:
      buildConfirmed(
        state.info
      ),

    verification,

    sources,

    actions:
      buildActions(state),

    recommendations:
      buildRecommendations(
        state
      ),

    protections:
      appliquerProtectionsEmploi(
        state.info
      ),

    opportunities,

    answer:
      answer || ""
  };
}

async function analyserQuestion(
  payload,
  env
) {
  const question =
    cleanText(
      payload?.question,
      LIMITS.question
    );

  const stateBase =
    construireEtatConversation(
      question,
      payload || {}
    );

  const language =
    detectLanguage(
      question,
      payload?.language
    );

  const decision =
    construireDecision(
      stateBase,
      language
    );

  const sources =
    selectSources(
      stateBase
    );

  const verification =
    buildVerification(
      stateBase
    );

  let opportunities =
    buildOpportunityData(
      null
    );

  /*
    Recherche réelle France Travail
    uniquement lorsque les informations
    nécessaires sont disponibles.
  */
  if (
    stateBase.context.emploi &&
    decision.mode ===
      "orientation"
  ) {
    opportunities =
      buildOpportunityData(
        await searchFranceTravail(
          stateBase.info,
          env
        )
      );
  }

  /*
    Tant qu'une information importante
    manque, Go Rare AI pose une question
    au lieu d'inventer une réponse.
  */
  let answer =
    decision.question || "";

  if (
    decision.mode ===
    "orientation"
  ) {
    const prompt =
      systemPrompt(
        language,
        stateBase
      );

    const userMessage =
      [
        "User request:",
        question,

        "Confirmed information:",
        JSON.stringify(
          buildConfirmed(
            stateBase.info
          )
        ),

        "Verification items:",
        JSON.stringify(
          verification
        ),

        "Official sources:",
        JSON.stringify(
          sources
        ),

        "Retrieved opportunities:",
        JSON.stringify(
          opportunities.opportunities
        ),

        "Search URL:",
        opportunities.searchURL,

        "Return a useful practical answer. Do not invent anything."
      ].join("\n");

    answer =
      await askAI(
        env,
        [
          {
            role:
              "system",
            content:
              prompt
          },

          {
            role:
              "user",
            content:
              userMessage
          }
        ]
      );
  }

  return buildResult(
    {
      ...stateBase,
      language
    },

    decision,

    sources,

    verification,

    opportunities,

    answer
  );
}

/* =========================
   IMAGE ANALYSIS
   ========================= */

async function analyserImage(
  payload,
  env
) {
  if (!env?.AI?.run) {
    throw new Error(
      "AI binding is not configured."
    );
  }

  const image =
    cleanText(
      payload?.image,
      LIMITS.image
    );

  if (!image) {
    throw new Error(
      "Image missing."
    );
  }

  if (
    base64ByteLength(image) >
    LIMITS.image
  ) {
    throw new Error(
      "Image too large."
    );
  }

  const question =
    cleanText(
      payload?.question ||
        "Analyze this image and explain what useful situation or information can be identified.",
      LIMITS.question
    );

  const language =
    detectLanguage(
      question,
      payload?.language
    );

  const result =
    await env.AI.run(
      MODEL_VISION,
      {
        messages: [
          {
            role:
              "system",

            content:
              "You are Go Rare AI. Analyze the supplied image carefully. Do not invent text or facts. State uncertainty when the image is unclear. Answer in " +
              (
                language === "ar"
                  ? "Arabic"
                  : language === "en"
                    ? "English"
                    : "French"
              ) +
              "."
          },

          {
            role:
              "user",

            content: [
              {
                type:
                  "text",

                text:
                  question
              },

              {
                type:
                  "image_url",

                image_url: {
                  url:
                    image
                }
              }
            ]
          }
        ]
      }
    );

  return {
    ok: true,

    version:
      VERSION,

    language,

    answer:
      cleanText(
        result?.response ||
          result?.result
            ?.response ||
          "",
        LIMITS.message
      )
  };
}

/* =========================
   AUDIO TRANSCRIPTION
   ========================= */

async function transcrireAudio(
  payload,
  env
) {
  if (!env?.AI?.run) {
    throw new Error(
      "AI binding is not configured."
    );
  }

  const audio =
    cleanText(
      payload?.audio,
      LIMITS.audio
    );

  if (!audio) {
    throw new Error(
      "Audio missing."
    );
  }

  if (
    base64ByteLength(audio) >
    LIMITS.audio
  ) {
    throw new Error(
      "Audio too large."
    );
  }

  const clean =
    audio.replace(
      /^data:[^;]+;base64,/,
      ""
    );

  const binary =
    Uint8Array.from(
      atob(clean),
      function (c) {
        return c.charCodeAt(0);
      }
    );

  const result =
    await env.AI.run(
      MODEL_AUDIO,
      {
        audio:
          [...binary]
      }
    );

  return {
    ok: true,

    version:
      VERSION,

    text:
      cleanText(
        result?.text ||
          result?.transcription ||
          result?.result?.text ||
          "",
        LIMITS.question
      )
  };
}

/* =========================
   REQUEST HELPERS
   ========================= */

async function readJSON(
  request
) {
  const length =
    Number(
      request.headers.get(
        "content-length"
      ) || 0
    );

  if (
    length >
    LIMITS.jsonBody
  ) {
    throw new Error(
      "Request body too large."
    );
  }

  const text =
    await request.text();

  if (
    text.length >
    LIMITS.jsonBody
  ) {
    throw new Error(
      "Request body too large."
    );
  }

  if (!text.trim()) {
    return {};
  }

  let data;

  try {
    data =
      JSON.parse(text);
  } catch {
    throw new Error(
      "Invalid JSON."
    );
  }

  if (
    !isPlainObject(data)
  ) {
    throw new Error(
      "JSON body must be an object."
    );
  }

  return data;
}

function getClientIP(
  request
) {
  return cleanText(
    request.headers.get(
      "CF-Connecting-IP"
    ) ||
      request.headers.get(
        "x-forwarded-for"
      ) ||
      "unknown",
    100
  )
    .split(",")[0]
    .trim();
}

function rateLimit(
  request
) {
  const ip =
    getClientIP(
      request
    );

  const now =
    Date.now();

  const current =
    rateStore.get(ip);

  if (
    !current ||
    now - current.start >=
      RATE.window
  ) {
    rateStore.set(
      ip,
      {
        start:
          now,

        count:
          1
      }
    );

    return true;
  }

  if (
    current.count >=
    RATE.max
  ) {
    return false;
  }

  current.count += 1;

  return true;
}

function securityHeaders() {
  return {
    "X-Content-Type-Options":
      "nosniff",

    "X-Frame-Options":
      "DENY",

    "Referrer-Policy":
      "strict-origin-when-cross-origin",

    "Permissions-Policy":
      "camera=(), geolocation=(), microphone=(self), payment=()",

    "Content-Security-Policy":
      "default-src 'self'; connect-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  };
}

function jsonResponse(
  data,
  status = 200,
  extraHeaders = {}
) {
  const headers =
    new Headers({
      "Content-Type":
        "application/json; charset=utf-8",

      ...securityHeaders(),

      ...extraHeaders
    });

  return new Response(
    JSON.stringify(data),
    {
      status,

      headers
    }
  );
}

function htmlResponse(
  html,
  status = 200,
  extraHeaders = {}
) {
  const headers =
    new Headers({
      "Content-Type":
        "text/html; charset=utf-8",

      ...securityHeaders(),

      ...extraHeaders
    });

  return new Response(
    html,
    {
      status,

      headers
    }
  );
}

/* =========================
   OAUTH / ACCOUNT
   ========================= */

function getOAuthConfig(
  env
) {
  return {
    clientId:
      cleanText(
        env?.OAUTH_CLIENT_ID,
        500
      ),

    clientSecret:
      cleanText(
        env?.OAUTH_CLIENT_SECRET,
        1000
      ),

    authorizeURL:
      cleanText(
        env?.OAUTH_AUTHORIZE_URL,
        2000
      ),

    tokenURL:
      cleanText(
        env?.OAUTH_TOKEN_URL,
        2000
      ),

    userInfoURL:
      cleanText(
        env?.OAUTH_USERINFO_URL,
        2000
      ),

    redirectURL:
      cleanText(
        env?.OAUTH_REDIRECT_URL,
        2000
      )
  };
}

function clearCookie(
  name
) {
  return (
    name +
    "=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax"
  );
}

async function sha256(
  value
) {
  const data =
    new TextEncoder().encode(
      value
    );

  const hash =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );

  return Array.from(
    new Uint8Array(hash)
  )
    .map(function (b) {
      return b
        .toString(16)
        .padStart(2, "0");
    })
    .join("");
}

function randomState() {
  const bytes =
    new Uint8Array(24);

  crypto.getRandomValues(
    bytes
  );

  return Array.from(
    bytes
  )
    .map(function (b) {
      return b
        .toString(16)
        .padStart(2, "0");
    })
    .join("");
}

function safeCookieValue(
  value
) {
  return encodeURIComponent(
    cleanText(
      value,
      4000
    )
  );
}

function getCookie(
  request,
  name
) {
  const header =
    request.headers.get(
      "Cookie"
    ) || "";

  const parts =
    header.split(";");

  for (
    const part of parts
  ) {
    const index =
      part.indexOf("=");

    if (index < 0) {
      continue;
    }

    const key =
      part
        .slice(0, index)
        .trim();

    if (key === name) {
      return decodeURIComponent(
        part
          .slice(index + 1)
          .trim()
      );
    }
  }

  return "";
}

function billingStatus(
  request,
  env
) {
  const user =
    getCookie(
      request,
      "grai_user"
    );

  return {
    ok: true,

    version:
      VERSION,

    connected:
      !!user,

    user:
      user || null,

    billing: {
      enabled:
        env?.BILLING_ENABLED ===
        "true",

      provider:
        cleanText(
          env?.BILLING_PROVIDER,
          100
        ) || null,

      status:
        "not_configured"
    }
  };
}

async function billingConnect(
  request,
  env
) {
  const config =
    getOAuthConfig(
      env
    );

  if (
    !config.clientId ||
    !config.authorizeURL ||
    !config.redirectURL
  ) {
    return jsonResponse(
      {
        ok: false,

        version:
          VERSION,

        error:
          "OAuth is not configured."
      },
      503
    );
  }

  const state =
    randomState();

  const stateHash =
    await sha256(
      state
    );

  const url =
    new URL(
      config.authorizeURL
    );

  url.searchParams.set(
    "client_id",
    config.clientId
  );

  url.searchParams.set(
    "redirect_uri",
    config.redirectURL
  );

  url.searchParams.set(
    "response_type",
    "code"
  );

  url.searchParams.set(
    "state",
    state
  );

  url.searchParams.set(
    "scope",
    env.OAUTH_SCOPE ||
      "openid profile email"
  );

  return new Response(
    null,
    {
      status: 302,

      headers: {
        Location:
          url.toString(),

        ...securityHeaders(),

        "Set-Cookie":
          "grai_oauth_state=" +
          safeCookieValue(
            stateHash
          ) +
          "; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax"
      }
    }
  );
}

async function billingCallback(
  request,
  env
) {
  const config =
    getOAuthConfig(
      env
    );

  const url =
    new URL(
      request.url
    );

  const code =
    cleanText(
      url.searchParams.get(
        "code"
      ),
      4000
    );

  const returnedState =
    cleanText(
      url.searchParams.get(
        "state"
      ),
      4000
    );

  const storedStateHash =
    getCookie(
      request,
      "grai_oauth_state"
    );

  if (
    !code ||
    !returnedState ||
    !storedStateHash
  ) {
    return jsonResponse(
      {
        ok: false,

        version:
          VERSION,

        error:
          "Invalid OAuth callback."
      },
      400
    );
  }

  const returnedHash =
    await sha256(
      returnedState
    );

  if (
    returnedHash !==
    storedStateHash
  ) {
    return jsonResponse(
      {
        ok: false,

        version:
          VERSION,

        error:
          "OAuth state validation failed."
      },
      400
    );
  }

  if (
    !config.clientId ||
    !config.clientSecret ||
    !config.tokenURL
  ) {
    return jsonResponse(
      {
        ok: false,

        version:
          VERSION,

        error:
          "OAuth token configuration is incomplete."
      },
      503
    );
  }

  try {
    const body =
      new URLSearchParams();

    body.set(
      "grant_type",
      "authorization_code"
    );

    body.set(
      "code",
      code
    );

    body.set(
      "client_id",
      config.clientId
    );

    body.set(
      "client_secret",
      config.clientSecret
    );

    body.set(
      "redirect_uri",
      config.redirectURL
    );

    const tokenResponse =
      await fetch(
        config.tokenURL,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",

            Accept:
              "application/json"
          },

          body
        }
      );

    if (
      !tokenResponse.ok
    ) {
      return jsonResponse(
        {
          ok: false,

          version:
            VERSION,

          error:
            "OAuth token exchange failed."
        },
        502
      );
    }

    const tokenData =
      await tokenResponse.json();

    let identity =
      null;

    if (
      config.userInfoURL &&
      tokenData?.access_token
    ) {
      const userResponse =
        await fetch(
          config.userInfoURL,
          {
            headers: {
              Authorization:
                "Bearer " +
                tokenData.access_token,

              Accept:
                "application/json"
            }
          }
        );

      if (
        userResponse.ok
      ) {
        identity =
          await userResponse.json();
      }
    }

    const userValue =
      identity?.sub ||
      identity?.id ||
      identity?.email ||
      "connected";

    return new Response(
      null,
      {
        status: 302,

        headers: {
          Location:
            "/?oauth=success",

          ...securityHeaders(),

          "Set-Cookie":
            [
              "grai_user=" +
                safeCookieValue(
                  String(
                    userValue
                  )
                ) +
                "; Max-Age=28800; Path=/; HttpOnly; Secure; SameSite=Lax",

              clearCookie(
                "grai_oauth_state"
              )
            ].join(", ")
        }
      }
    );
  } catch {
    return jsonResponse(
      {
        ok: false,

        version:
          VERSION,

        error:
          "OAuth callback error."
      },
      502
    );
  }
}

/* =========================
   HTML UI
   =========================
   IMPORTANT:
   No nested backticks are used
   inside the HTML template.
   ========================= */

function renderHTML() {
  const uiJSON =
    JSON.stringify(
      UI
    ).replace(
      /</g,
      "\\u003c"
    );

  const parcoursJSON =
    JSON.stringify(
      PARCOURS
    ).replace(
      /</g,
      "\\u003c"
    );

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0b1020">
<title>Go Rare AI</title>

<style>
:root{
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  background:#0b1020;
  color:#f5f7ff;
}

*{
  box-sizing:border-box;
}

body{
  margin:0;
  min-height:100vh;

  background:
    linear-gradient(
      135deg,
      #0b1020,
      #151d35
    );

  padding:20px;
}

.wrap{
  max-width:980px;
  margin:0 auto;
}

.card{
  background:
    rgba(255,255,255,.07);

  border:
    1px solid
    rgba(255,255,255,.12);

  border-radius:24px;

  padding:20px;

  backdrop-filter:
    blur(14px);

  box-shadow:
    0 20px 60px
    rgba(0,0,0,.25);
}

h1{
  margin:0;
  font-size:32px;
}

.sub{
  margin:
    6px 0 20px;

  opacity:.75;
}

.row{
  display:flex;
  gap:10px;
  flex-wrap:wrap;
}

.select,
.input,
.textarea,
button{
  border-radius:14px;

  border:
    1px solid
    rgba(255,255,255,.15);

  background:
    rgba(0,0,0,.2);

  color:inherit;

  padding:12px;

  font:inherit;
}

.input,
.textarea{
  width:100%;
}

.textarea{
  min-height:140px;
  resize:vertical;
}

.grow{
  flex:1;
  min-width:220px;
}

button{
  cursor:pointer;
  background:
    rgba(255,255,255,.12);
}

button:hover{
  background:
    rgba(255,255,255,.18);
}

button.primary{
  background:#fff;
  color:#111827;
  font-weight:700;
}

.toolbar{
  margin:
    12px 0;
}

.status{
  min-height:24px;
  margin:10px 0;
  opacity:.8;
}

.result{
  margin-top:18px;
}

.section{
  margin-top:16px;
}

.section h3{
  margin-bottom:8px;
}

.list{
  display:grid;
  gap:8px;
}

.item{
  padding:
    10px 12px;

  border-radius:12px;

  background:
    rgba(255,255,255,.06);
}

.op{
  padding:14px;

  border:
    1px solid
    rgba(255,255,255,.12);

  border-radius:14px;

  margin-bottom:10px;
}

.op a{
  color:inherit;
}

.small{
  font-size:13px;
  opacity:.7;
}

.hidden{
  display:none;
}

.pill{
  display:inline-block;

  padding:
    6px 10px;

  border-radius:999px;

  background:
    rgba(255,255,255,.08);

  margin:3px;

  font-size:13px;
}

@media(max-width:600px){
  body{
    padding:10px;
  }

  .card{
    padding:15px;
  }

  h1{
    font-size:27px;
  }
}
</style>
</head>

<body>

<div class="wrap">

<div class="card">

<h1 id="title">
Go Rare AI
</h1>

<div
  class="sub"
  id="subtitle">
</div>

<div class="row">

<select
  id="language"
  class="select"
  aria-label="Language">

  <option value="fr">
    Français
  </option>

  <option value="ar">
    العربية
  </option>

  <option value="en">
    English
  </option>

</select>

<select
  id="profile"
  class="select">

  <option value="particulier">
    Particulier
  </option>

  <option value="emploi">
    Emploi
  </option>

  <option value="immigration">
    Immigration
  </option>

  <option value="entreprise">
    Entreprise
  </option>

</select>

<select
  id="situation"
  class="select">

  <option value="situation">
    Situation
  </option>

  <option value="recherche">
    Recherche d'emploi
  </option>

  <option value="formation">
    Formation
  </option>

  <option value="administratif">
    Démarche administrative
  </option>

  <option value="reconversion">
    Reconversion
  </option>

  <option value="creer">
    Créer une entreprise
  </option>

  <option value="developper">
    Développer une entreprise
  </option>

</select>

</div>

<div class="toolbar">

<textarea
  id="question"
  class="textarea"
  maxlength="12000">
</textarea>

</div>

<div class="row">

<button
  id="analyze"
  class="primary">
</button>

<button
  id="imageBtn">
</button>

<button
  id="micBtn">
</button>

<button
  id="connectBtn">
</button>

<input
  id="imageInput"
  type="file"
  accept="image/*"
  class="hidden">

</div>

<div
  id="status"
  class="status">
</div>

<div
  id="result"
  class="result">
</div>

</div>
</div>

<script>

const UI_DATA =
  ${uiJSON};

const PARCOURS_DATA =
  ${parcoursJSON};

let mediaRecorder =
  null;

let audioChunks =
  [];

let recording =
  false;

let selectedImage =
  "";

function currentLanguage(){
  return (
    document.getElementById(
      "language"
    ).value ||
    "fr"
  );
}

function t(key){
  return (
    UI_DATA[
      currentLanguage()
    ] ||
    UI_DATA.fr
  )[key] || key;
}

function setStatus(text){
  document.getElementById(
    "status"
  ).textContent =
    text || "";
}

function escapeHTML(value){
  return String(
    value == null
      ? ""
      : value
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

function listHTML(values){

  if(
    !Array.isArray(values) ||
    !values.length
  ){
    return "";
  }

  let html =
    '<div class="list">';

  values.forEach(
    function(item){

      const text =
        typeof item ===
        "string"

          ? item

          : (
              item &&
              item.item
            ) ||

            (
              item &&
              item.reason
            ) ||

            JSON.stringify(
              item
            );

      html +=
        '<div class="item">' +
        escapeHTML(
          text
        ) +
        "</div>";
    }
  );

  return (
    html +
    "</div>"
  );
}

function sourcesHTML(
  values
){

  if(
    !Array.isArray(values) ||
    !values.length
  ){
    return "";
  }

  let html =
    '<div class="list">';

  values.forEach(
    function(source){

      if(!source){
        return;
      }

      html +=
        '<div class="item">' +

        '<a ' +
        'target="_blank" ' +
        'rel="noopener noreferrer" ' +
        'href="' +
        escapeHTML(
          source.url ||
          "#"
        ) +
        '">' +

        escapeHTML(
          source.name ||
          source.url ||
          "Source"
        ) +

        "</a>" +

        "</div>";
    }
  );

  return (
    html +
    "</div>"
  );
}

function opportunitiesHTML(
  data
){

  const ops =
    data &&
    Array.isArray(
      data.opportunities
    )

      ? data.opportunities

      : [];

  let html = "";

  if(!ops.length){

    if(
      data &&
      data.searchURL
    ){

      html +=
        '<div class="item">' +

        '<a ' +
        'target="_blank" ' +
        'rel="noopener noreferrer" ' +
        'href="' +
        escapeHTML(
          data.searchURL
        ) +
        '">' +

        escapeHTML(
          t("searching")
        ) +

        ": France Travail" +

        "</a>" +

        "</div>";
    }

    if(
      data &&
      data.message
    ){

      html +=
        '<div class="small">' +
        escapeHTML(
          data.message
        ) +
        "</div>";
    }

    return html;
  }

  ops.forEach(
    function(op){

      html +=
        '<div class="op">';

      html +=
        "<strong>" +
        escapeHTML(
          op.title ||
          ""
        ) +
        "</strong>";

      if(op.company){

        html +=
          "<div>" +
          escapeHTML(
            op.company
          ) +
          "</div>";
      }

      if(op.location){

        html +=
          "<div>" +
          escapeHTML(
            op.location
          ) +
          "</div>";
      }

      if(op.contract){

        html +=
          '<div class="small">' +
          escapeHTML(
            op.contract
          ) +
          "</div>";
      }

      if(op.experience){

        html +=
          '<div class="small">' +
          escapeHTML(
            op.experience
          ) +
          "</div>";
      }

      if(op.description){

        html +=
          "<p>" +
          escapeHTML(
            op.description
          ) +
          "</p>";
      }

      if(op.url){

        html +=
          '<a ' +
          'target="_blank" ' +
          'rel="noopener noreferrer" ' +
          'href="' +
          escapeHTML(
            op.url
          ) +
          '">' +
          "Voir l'offre" +
          "</a>";
      }

      html +=
        "</div>";
    }
  );

  return html;
}

function confirmedHTML(
  obj
){

  if(
    !obj ||
    typeof obj !==
      "object"
  ){

    return "";
  }

  let html =
    '<div class="list">';

  Object.keys(
    obj
  ).forEach(
    function(key){

      html +=
        '<div class="item">' +

        "<strong>" +

        escapeHTML(
          key
        ) +

        "</strong>: " +

        escapeHTML(
          obj[key]
        ) +

        "</div>";
    }
  );

  return (
    html +
    "</div>"
  );
}

function renderResult(
  data
){

  const root =
    document.getElementById(
      "result"
    );

  let html = "";

  if(data.answer){

    html +=
      '<div class="section">' +

      "<h3>" +

      escapeHTML(
        t("result")
      ) +

      "</h3>" +

      '<div class="item">' +

      escapeHTML(
        data.answer
      )
        .replaceAll(
          "\\n",
          "<br>"
        ) +

      "</div>" +

      "</div>";
  }

  if(data.confirmed){

    html +=
      '<div class="section">' +

      "<h3>" +

      escapeHTML(
        t("confirmed")
      ) +

      "</h3>" +

      confirmedHTML(
        data.confirmed
      ) +

      "</div>";
  }

  if(
    data.verification &&
    data.verification.length
  ){

    html +=
      '<div class="section">' +

      "<h3>" +

      escapeHTML(
        t("verify")
      ) +

      "</h3>" +

      listHTML(
        data.verification
      ) +

      "</div>";
  }

  if(
    data.actions &&
    data.actions.length
  ){

    html +=
      '<div class="section">' +

      "<h3>" +

      escapeHTML(
        t("actions")
      ) +

      "</h3>" +

      listHTML(
        data.actions
      ) +

      "</div>";
  }

  if(
    data.recommendations &&
    data.recommendations.length
  ){

    html +=
      '<div class="section">' +

      "<h3>" +

      escapeHTML(
        t("recommendations")
      ) +

      "</h3>" +

      listHTML(
        data.recommendations
      ) +

      "</div>";
  }

  if(
    data.protections &&
    data.protections.length
  ){

    html +=
      '<div class="section">' +

      "<h3>" +
      "Protection" +
      "</h3>" +

      listHTML(
        data.protections
      ) +

      "</div>";
  }

  if(data.opportunities){

    html +=
      '<div class="section">' +

      "<h3>" +

      escapeHTML(
        t("opportunities")
      ) +

      "</h3>" +

      opportunitiesHTML(
        data.opportunities
      ) +

      "</div>";
  }

  if(data.sources){

    html +=
      '<div class="section">' +

      "<h3>" +

      escapeHTML(
        t("sources")
      ) +

      "</h3>" +

      sourcesHTML(
        data.sources
      ) +

      "</div>";
  }

  root.innerHTML =
    html;
}

function applyLanguage(){

  const u =
    UI_DATA[
      currentLanguage()
    ] ||
    UI_DATA.fr;

  document.documentElement.lang =
    currentLanguage();

  document.getElementById(
    "title"
  ).textContent =
    u.title;

  document.getElementById(
    "subtitle"
  ).textContent =
    u.subtitle;

  document.getElementById(
    "analyze"
  ).textContent =
    u.analyze;

  document.getElementById(
    "imageBtn"
  ).textContent =
    u.image;

  document.getElementById(
    "micBtn"
  ).textContent =
    recording
      ? u.stop
      : u.microphone;

  document.getElementById(
    "connectBtn"
  ).textContent =
    u.connect;

  document.getElementById(
    "question"
  ).placeholder =
    u.placeholder;
}

async function postJSON(
  url,
  body
){

  const response =
    await fetch(
      url,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(
            body
          )
      }
    );

  let data =
    null;

  try{

    data =
      await response.json();

  }catch(e){

    data = {
      ok:false,

      error:
        "Invalid server response."
    };
  }

  if(
    !response.ok ||
    data.ok === false
  ){

    throw new Error(
      data.error ||
      "Request failed."
    );
  }

  return data;
}

async function analyze(){

  const question =
    document.getElementById(
      "question"
    ).value.trim();

  if(
    !question &&
    !selectedImage
  ){

    setStatus(
      t("missing")
    );

    return;
  }

  setStatus(
    t("searching")
  );

  try{

    let data;

    if(
      selectedImage
    ){

      data =
        await postJSON(
          "/api/image",
          {
            question:
              question,

            image:
              selectedImage,

            language:
              currentLanguage()
          }
        );

    }else{

      data =
        await postJSON(
          "/api/analyze",
          {
            question:
              question,

            language:
              currentLanguage(),

            profile:
              document.getElementById(
                "profile"
              ).value,

            situation:
              document.getElementById(
                "situation"
              ).value
          }
        );
    }

    renderResult(
      data
    );

    setStatus(
      t("ready")
    );

  }catch(error){

    setStatus(
      t("error") +
      ": " +
      (
        error &&
        error.message
          ? error.message
          : "Unknown error"
      )
    );
  }
}

function fileToDataURL(
  file
){

  return new Promise(
    function(
      resolve,
      reject
    ){

      const reader =
        new FileReader();

      reader.onload =
        function(){

          resolve(
            String(
              reader.result ||
              ""
            )
          );
        };

      reader.onerror =
        reject;

      reader.readAsDataURL(
        file
      );
    }
  );
}

async function chooseImage(
  event
){

  const file =
    event.target.files &&
    event.target.files[0];

  if(!file){
    return;
  }

  if(
    file.size >
    7000000
  ){

    setStatus(
      t("error") +
      ": Image too large."
    );

    return;
  }

  try{

    selectedImage =
      await fileToDataURL(
        file
      );

    setStatus(
      t("ready")
    );

  }catch(e){

    setStatus(
      t("error")
    );
  }
}

async function toggleMic(){

  if(recording){

    if(
      mediaRecorder
    ){

      mediaRecorder.stop();
    }

    return;
  }

  if(
    !navigator.mediaDevices ||
    !navigator.mediaDevices
      .getUserMedia
  ){

    setStatus(
      t("error") +
      ": Microphone unavailable."
    );

    return;
  }

  try{

    const stream =
      await navigator.mediaDevices
        .getUserMedia(
          {
            audio:true
          }
        );

    audioChunks =
      [];

    mediaRecorder =
      new MediaRecorder(
        stream
      );

    mediaRecorder
      .ondataavailable =
      function(event){

        if(
          event.data &&
          event.data.size
        ){

          audioChunks.push(
            event.data
          );
        }
      };

    mediaRecorder.onstop =
      async function(){

        recording =
          false;

        applyLanguage();

        stream
          .getTracks()
          .forEach(
            function(track){
              track.stop();
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

        try{

          setStatus(
            t("searching")
          );

          const reader =
            new FileReader();

          reader.onload =
            async function(){

              try{

                const data =
                  await postJSON(
                    "/api/audio",
                    {
                      audio:
                        String(
                          reader.result ||
                          ""
                        ),

                      language:
                        currentLanguage()
                    }
                  );

                const text =
                  data.text ||
                  "";

                const q =
                  document.getElementById(
                    "question"
                  );

                q.value =
                  q.value.trim()
                    ? q.value +
                      "\\n\\n" +
                      text
                    : text;

                setStatus(
                  t("ready")
                );

              }catch(error){

                setStatus(
                  t("error") +
                  ": " +
                  (
                    error &&
                    error.message
                      ? error.message
                      : "Unknown error"
                  )
                );
              }
            };

          reader.readAsDataURL(
            blob
          );

        }catch(e){

          setStatus(
            t("error")
          );
        }
      };

    mediaRecorder.start();

    recording =
      true;

    applyLanguage();

    setStatus(
      t("microphone")
    );

  }catch(e){

    setStatus(
      t("error") +
      ": Microphone permission denied or unavailable."
    );
  }
}

async function connectAccount(){

  window.location.href =
    "/oauth/connect";
}

document
  .getElementById(
    "language"
  )
  .addEventListener(
    "change",
    applyLanguage
  );

document
  .getElementById(
    "analyze"
  )
  .addEventListener(
    "click",
    analyze
  );

document
  .getElementById(
    "imageBtn"
  )
  .addEventListener(
    "click",
    function(){
      document
        .getElementById(
          "imageInput"
        )
        .click();
    }
  );

document
  .getElementById(
    "imageInput"
  )
  .addEventListener(
    "change",
    chooseImage
  );

document
  .getElementById(
    "micBtn"
  )
  .addEventListener(
    "click",
    toggleMic
  );

document
  .getElementById(
    "connectBtn"
  )
  .addEventListener(
    "click",
    connectAccount
  );

applyLanguage();

</script>

</body>
</html>`;
}

/* =========================
   ROUTER
   ========================= */

async function handleRequest(
  request,
  env
) {
  const url =
    new URL(
      request.url
    );

  const method =
    request.method.toUpperCase();

  if(
    method ===
    "OPTIONS"
  ){

    return new Response(
      null,
      {
        status:204,

        headers:
          securityHeaders()
      }
    );
  }

  if(
    !rateLimit(
      request
    )
  ){

    return jsonResponse(
      {
        ok:false,

        version:
          VERSION,

        error:
          "Too many requests. Please try again later."
      },

      429,

      {
        "Retry-After":
          "60"
      }
    );
  }

  if(
    method === "GET" &&
    url.pathname === "/"
  ){

    return htmlResponse(
      renderHTML()
    );
  }

  if(
    method === "GET" &&
    url.pathname === "/health"
  ){

    return jsonResponse(
      {
        ok:true,

        version:
          VERSION,

        service:
          "Go Rare AI"
      }
    );
  }

  if(
    method === "GET" &&
    url.pathname ===
      "/api/billing/status"
  ){

    return jsonResponse(
      billingStatus(
        request,
        env
      )
    );
  }

  if(
    method === "GET" &&
    url.pathname ===
      "/oauth/connect"
  ){

    return billingConnect(
      request,
      env
    );
  }

  if(
    method === "GET" &&
    url.pathname ===
      "/oauth/callback"
  ){

    return billingCallback(
      request,
      env
    );
  }

  if(
    method !== "POST"
  ){

    return jsonResponse(
      {
        ok:false,

        version:
          VERSION,

        error:
          "Method not allowed."
      },

      405,

      {
        Allow:
          "GET, POST, OPTIONS"
      }
    );
  }

  if(
    url.pathname ===
    "/api/analyze"
  ){

    const payload =
      await readJSON(
        request
      );

    return jsonResponse(
      await analyserQuestion(
        payload,
        env
      )
    );
  }

  if(
    url.pathname ===
    "/api/image"
  ){

    const payload =
      await readJSON(
        request
      );

    return jsonResponse(
      await analyserImage(
        payload,
        env
      )
    );
  }

  if(
    url.pathname ===
    "/api/audio"
  ){

    const payload =
      await readJSON(
        request
      );

    return jsonResponse(
      await transcrireAudio(
        payload,
        env
      )
    );
  }

  return jsonResponse(
    {
      ok:false,

      version:
        VERSION,

      error:
        "Not found."
    },

    404
  );
}

/* =========================
   WORKER EXPORT
   ========================= */

export default {

  async fetch(
    request,
    env,
    ctx
  ) {

    try {

      return await handleRequest(
        request,
        env,
        ctx
      );

    } catch (error) {

      return jsonResponse(
        {
          ok:false,

          version:
            VERSION,

          error:
            error?.message ||
            "Internal server error."
        },

        500
      );
    }
  }
};
