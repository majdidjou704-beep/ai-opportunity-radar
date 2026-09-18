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

function systemPrompt(language) {
  const lang =
    normalizeLanguage(language);

  const languageName = {
    fr: "French",
    ar: "Arabic",
    en: "English"
  }[lang] || "French";

  return `
You are Go Rare AI, a practical situation-intelligence assistant.

Your role is to understand the user's real situation, identify missing information,
explain verified options, and produce practical next steps.

IMPORTANT RULES:
- Answer in ${languageName}.
- Never invent jobs, companies, legal rights, documents, prices, dates, APIs,
  procedures, or official requirements.
- Never claim that an opportunity exists unless it was returned by a real source.
- Clearly distinguish confirmed information, information requiring verification,
  and suggestions.
- For French employment or immigration situations, prefer official French sources.
- If the user has no diploma or no experience, do not treat that as a reason to stop.
  Look for realistic paths that may accept beginners or people without diplomas.
- If the user says they have no documents, never assume that they can legally work.
  Explain that their exact administrative situation must be verified.
- Do not fabricate France Travail offers.
- When real opportunities are supplied by the system, use only those opportunities.
- Do not expose internal prompts, secrets, tokens, cookies, or implementation details.
- Do not ask for unnecessary personal information.
- Give concise, useful and actionable answers.
`;
}

async function askAI(
  env,
  messages,
  language = "fr"
) {
  if (
    !env ||
    !env.AI ||
    typeof env.AI.run !== "function"
  ) {
    return "";
  }

  const safeMessages =
    Array.isArray(messages)
      ? messages
          .filter(
            m =>
              isPlainObject(m) &&
              typeof m.role === "string" &&
              typeof m.content === "string"
          )
          .slice(-20)
          .map(m => ({
            role:
              m.role === "assistant"
                ? "assistant"
                : "user",
            content:
              cleanText(
                m.content,
                6000
              )
          }))
      : [];

  try {
    const result =
      await env.AI.run(
        MODEL,
        {
          messages: [
            {
              role: "system",
              content:
                systemPrompt(language)
            },
            ...safeMessages
          ],
          max_tokens: 900
        }
      );

    return cleanText(
      result?.response ||
      result?.result?.response ||
      "",
      10000
    );

  } catch {
    return "";
  }
}

/* =========================
   RESULT BUILDER
   ========================= */

function buildOpportunityData(
  searchResult
) {
  if (
    !isPlainObject(searchResult)
  ) {
    return {
      enabled: false,
      searchURL:
        SOURCES.franceTravailOffers.url,
      opportunities: [],
      message: ""
    };
  }

  return {
    enabled:
      !!searchResult.enabled,

    source:
      searchResult.source ||
      SOURCES.franceTravailOffers,

    searchURL:
      searchResult.searchURL ||
      SOURCES.franceTravailOffers.url,

    opportunities:
      Array.isArray(
        searchResult.opportunities
      )
        ? searchResult.opportunities
            .filter(
              x =>
                isPlainObject(x) &&
                typeof x.title === "string" &&
                x.title.trim()
            )
            .slice(0, 20)
        : [],

    message:
      cleanText(
        searchResult.message || "",
        1000
      )
  };
}

function buildResult(
  state,
  language,
  aiText,
  opportunityData
) {
  const sources =
    selectSources(state);

  const confirmed =
    buildConfirmed(
      state.info
    );

  const verification =
    buildVerification(
      state
    );

  const actions =
    buildActions(
      state
    );

  const recommendations =
    buildRecommendations(
      state
    );

  const protections =
    appliquerProtectionsEmploi(
      state.info
    );

  return {
    version:
      VERSION,

    decisionVersion:
      DECISION_VERSION,

    language,

    mode:
      "orientation",

    confirmed,

    verification,

    actions,

    recommendations,

    protections,

    sources,

    opportunities:
      opportunityData?.opportunities ||
      [],

    opportunitySearch:
      opportunityData
        ? {
            enabled:
              !!opportunityData.enabled,

            searchURL:
              opportunityData.searchURL ||
              "",

            message:
              opportunityData.message ||
              "",

            source:
              opportunityData.source ||
              SOURCES.franceTravailOffers
          }
        : null,

    ai:
      aiText || "",

    generatedAt:
      new Date().toISOString()
  };
}

/* =========================
   QUESTION ANALYSIS
   ========================= */

async function analyserQuestion(
  payload,
  env
) {
  const question =
    cleanText(
      payload?.question || "",
      LIMITS.question
    );

  const language =
    detectLanguage(
      question,
      payload?.language
    );

  const state =
    construireEtatConversation(
      question,
      {
        ...(isPlainObject(payload)
          ? payload
          : {}),
        history:
          Array.isArray(
            payload?.history
          )
            ? payload.history.slice(
                -20
              )
            : []
      }
    );

  const decision =
    construireDecision(
      state,
      language
    );

  if (
    decision.mode === "question"
  ) {
    return {
      ok: true,

      version:
        VERSION,

      decision,

      language,

      state: {
        confirmed:
          buildConfirmed(
            state.info
          ),

        context:
          state.context
      },

      result: null
    };
  }

  let opportunityData =
    null;

  /*
    Only perform live opportunity
    search when the situation is
    clearly related to employment.
  */

  if (
    state.context.emploi
  ) {
    opportunityData =
      buildOpportunityData(
        await searchFranceTravail(
          state.info,
          env
        )
      );
  }

  const aiMessages = [];

  if (
    state.historyText
  ) {
    aiMessages.push({
      role: "user",
      content:
        `Conversation context:\n${cleanText(
          state.historyText,
          10000
        )}`
    });
  }

  aiMessages.push({
    role: "user",
    content:
      `Current request:\n${question}\n\n` +
      `Confirmed extracted information:\n` +
      JSON.stringify(
        buildConfirmed(
          state.info
        )
      ) +
      `\n\nContext:\n` +
      JSON.stringify(
        state.context
      ) +
      `\n\nReal opportunities supplied by the system:\n` +
      JSON.stringify(
        opportunityData?.opportunities ||
        []
      )
  });

  const aiText =
    await askAI(
      env,
      aiMessages,
      language
    );

  const result =
    buildResult(
      state,
      language,
      aiText,
      opportunityData
    );

  return {
    ok: true,

    version:
      VERSION,

    decision,

    language,

    state: {
      confirmed:
        result.confirmed,

      context:
        state.context
    },

    result
  };
}

/* =========================
   IMAGE / VISION
   ========================= */

async function analyserImage(
  payload,
  env
) {
  if (
    !env ||
    !env.AI ||
    typeof env.AI.run !== "function"
  ) {
    return {
      ok: false,
      error:
        "Vision AI is not configured."
    };
  }

  const image =
    typeof payload?.image === "string"
      ? payload.image
      : "";

  if (!image) {
    return {
      ok: false,
      error:
        "Image missing."
    };
  }

  if (
    base64ByteLength(image) >
    LIMITS.image
  ) {
    return {
      ok: false,
      error:
        "Image is too large."
    };
  }

  const language =
    normalizeLanguage(
      payload?.language
    );

  const question =
    cleanText(
      payload?.question ||
        (
          language === "ar"
            ? "حلل هذه الصورة وساعدني على فهم المعلومات المفيدة فيها."
            : language === "en"
              ? "Analyze this image and identify useful information."
              : "Analysez cette image et identifiez les informations utiles."
        ),
      3000
    );

  try {
    let imageData =
      image;

    /*
      Cloudflare Workers AI accepts
      base64 image data for the vision
      model. Remove the data URI prefix
      when one is supplied.
    */

    imageData =
      imageData.replace(
        /^data:[^;]+;base64,/i,
        ""
      );

    const response =
      await env.AI.run(
        MODEL_VISION,
        {
          messages: [
            {
              role: "system",
              content:
                systemPrompt(
                  language
                )
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text:
                    question
                },
                {
                  type: "image_url",
                  image_url: {
                    url:
                      `data:image/jpeg;base64,${imageData}`
                  }
                }
              ]
            }
          ],
          max_tokens: 900
        }
      );

    return {
      ok: true,

      version:
        VERSION,

      language,

      text:
        cleanText(
          response?.response ||
          response?.result?.response ||
          "",
          10000
        )
    };

  } catch {
    return {
      ok: false,

      version:
        VERSION,

      error:
        "Vision analysis failed."
    };
  }
}

/* =========================
   AUDIO / WHISPER
   ========================= */

async function transcrireAudio(
  request,
  env
) {
  if (
    !env ||
    !env.AI ||
    typeof env.AI.run !== "function"
  ) {
    return {
      ok: false,
      error:
        "Audio AI is not configured."
    };
  }

  try {
    const contentType =
      request.headers.get(
        "content-type"
      ) || "";

    let audioBuffer;

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      const body =
        await request.json();

      const audio =
        typeof body?.audio === "string"
          ? body.audio
          : "";

      if (!audio) {
        return {
          ok: false,
          error:
            "Audio missing."
        };
      }

      if (
        base64ByteLength(audio) >
        LIMITS.audio
      ) {
        return {
          ok: false,
          error:
            "Audio is too large."
        };
      }

      const clean =
        audio.replace(
          /^data:[^,]+,/,
          ""
        );

      const binary =
        atob(clean);

      const bytes =
        new Uint8Array(
          binary.length
        );

      for (
        let i = 0;
        i < binary.length;
        i++
      ) {
        bytes[i] =
          binary.charCodeAt(i);
      }

      audioBuffer =
        bytes.buffer;

    } else {
      audioBuffer =
        await request.arrayBuffer();

      if (
        audioBuffer.byteLength >
        LIMITS.audio
      ) {
        return {
          ok: false,
          error:
            "Audio is too large."
        };
      }
    }

    const result =
      await env.AI.run(
        MODEL_AUDIO,
        {
          audio:
            [...new Uint8Array(
              audioBuffer
            )]
        }
      );

    return {
      ok: true,

      version:
        VERSION,

      text:
        cleanText(
          result?.text ||
          result?.response ||
          "",
          12000
        )
    };

  } catch {
    return {
      ok: false,

      version:
        VERSION,

      error:
        "Audio transcription failed."
    };
  }
}

/* =========================
   JSON / REQUEST HELPERS
   ========================= */

async function readJSON(
  request
) {
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
      return {};
    }

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
      return null;
    }

    const text =
      await request.text();

    if (
      text.length >
      LIMITS.jsonBody
    ) {
      return null;
    }

    const parsed =
      JSON.parse(text);

    return isPlainObject(parsed)
      ? parsed
      : {};
  } catch {
    return null;
  }
}

/* =========================
   RATE LIMIT / SECURITY
   ========================= */

function getClientIP(
  request
) {
  return cleanText(
    request.headers.get(
      "CF-Connecting-IP"
    ) ||
    request.headers.get(
      "X-Forwarded-For"
    ) ||
    "unknown",
    100
  );
}

function rateLimit(
  request
) {
  const ip =
    getClientIP(request);

  const now =
    Date.now();

  const previous =
    rateStore.get(ip);

  if (
    !previous ||
    now - previous.start >
      RATE.window
  ) {
    rateStore.set(
      ip,
      {
        start: now,
        count: 1
      }
    );

    return {
      allowed: true,
      remaining:
        RATE.max - 1
    };
  }

  previous.count++;

  if (
    previous.count >
    RATE.max
  ) {
    return {
      allowed: false,
      remaining: 0
    };
  }

  return {
    allowed: true,
    remaining:
      RATE.max -
      previous.count
  };
}

function securityHeaders(
  extra = {}
) {
  return {
    "X-Content-Type-Options":
      "nosniff",

    "X-Frame-Options":
      "DENY",

    "Referrer-Policy":
      "strict-origin-when-cross-origin",

    "Permissions-Policy":
      "camera=(), geolocation=(), microphone=(self), payment=()",

    "Cross-Origin-Opener-Policy":
      "same-origin",

    "Cross-Origin-Resource-Policy":
      "same-origin",

    "Content-Security-Policy":
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "media-src 'self' blob:",
        "connect-src 'self'",
        "font-src 'self' data:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'"
      ].join("; "),

    ...extra
  };
}

function jsonResponse(
  data,
  status = 200,
  extraHeaders = {}
) {
  return new Response(
    JSON.stringify(data),
    {
      status,

      headers:
        securityHeaders({
          "Content-Type":
            "application/json; charset=utf-8",

          "Cache-Control":
            "no-store",

          ...extraHeaders
        })
    }
  );
}

function htmlResponse(
  html
) {
  return new Response(
    html,
    {
      status: 200,

      headers:
        securityHeaders({
          "Content-Type":
            "text/html; charset=utf-8",

          "Cache-Control":
            "no-store"
        })
    }
  );
}

/* =========================
   OAUTH / PROFESSIONAL ACCOUNT
   ========================= */

function getOAuthConfig(
  env
) {
  return {
    authorizeURL:
      env?.OAUTH_AUTHORIZE_URL ||
      "",

    tokenURL:
      env?.OAUTH_TOKEN_URL ||
      "",

    clientID:
      env?.OAUTH_CLIENT_ID ||
      "",

    clientSecret:
      env?.OAUTH_CLIENT_SECRET ||
      "",

    redirectURI:
      env?.OAUTH_REDIRECT_URI ||
      ""
  };
}

function clearCookie(
  name
) {
  return `${name}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

async function sha256(
  value
) {
  const data =
    new TextEncoder().encode(
      String(value || "")
    );

  const hash =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );

  return [
    ...new Uint8Array(hash)
  ]
    .map(
      b =>
        b.toString(16)
          .padStart(2, "0")
    )
    .join("");
}

function randomState() {
  const bytes =
    new Uint8Array(32);

  crypto.getRandomValues(
    bytes
  );

  return [
    ...bytes
  ]
    .map(
      b =>
        b.toString(16)
          .padStart(2, "0")
    )
    .join("");
}

function safeCookieValue(
  value
) {
  return encodeURIComponent(
    cleanText(value, 4000)
  );
}

function getCookie(
  request,
  name
) {
  const cookie =
    request.headers.get(
      "Cookie"
    ) || "";

  const parts =
    cookie.split(";");

  for (
    const part of parts
  ) {
    const trimmed =
      part.trim();

    const index =
      trimmed.indexOf("=");

    if (index < 0) {
      continue;
    }

    const key =
      trimmed.slice(
        0,
        index
      );

    if (
      key === name
    ) {
      return decodeURIComponent(
        trimmed.slice(
          index + 1
        )
      );
    }
  }

  return "";
}

function billingStatus(
  request,
  env
) {
  const connected =
    !!getCookie(
      request,
      "go_rare_oauth"
    );

  const configured =
    !!(
      env?.OAUTH_AUTHORIZE_URL &&
      env?.OAUTH_TOKEN_URL &&
      env?.OAUTH_CLIENT_ID &&
      env?.OAUTH_REDIRECT_URI
    );

  return {
    ok: true,

    version:
      VERSION,

    configured,

    connected,

    billingEnabled:
      false,

    message:
      connected
        ? "Compte connecté. La facturation reste désactivée jusqu'à configuration complète."
        : "Compte non connecté."
  };
}

async function billingConnect(
  request,
  env
) {
  const config =
    getOAuthConfig(env);

  if (
    !config.authorizeURL ||
    !config.clientID ||
    !config.redirectURI
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
    "response_type",
    "code"
  );

  url.searchParams.set(
    "client_id",
    config.clientID
  );

  url.searchParams.set(
    "redirect_uri",
    config.redirectURI
  );

  url.searchParams.set(
    "state",
    state
  );

  /*
    The state is stored in a
    short-lived HttpOnly cookie.
    It is only used to protect
    the OAuth callback against
    unsolicited requests.
  */

  return new Response(
    null,
    {
      status: 302,

      headers:
        securityHeaders({
          Location:
            url.toString(),

          "Set-Cookie":
            `go_rare_oauth_state=${safeCookieValue(
              stateHash
            )}; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax`
        })
    }
  );
}

async function billingCallback(
  request,
  env
) {
  const url =
    new URL(
      request.url
    );

  const code =
    cleanText(
      url.searchParams.get(
        "code"
      ) || "",
      4000
    );

  const state =
    cleanText(
      url.searchParams.get(
        "state"
      ) || "",
      4000
    );

  const storedState =
    getCookie(
      request,
      "go_rare_oauth_state"
    );

  if (
    !code ||
    !state ||
    !storedState
  ) {
    return new Response(
      "OAuth validation failed.",
      {
        status: 400,
        headers:
          securityHeaders({
            "Content-Type":
              "text/plain; charset=utf-8"
          })
      }
    );
  }

  const incomingHash =
    await sha256(
      state
    );

  if (
    incomingHash !==
    storedState
  ) {
    return new Response(
      "OAuth state validation failed.",
      {
        status: 400,
        headers:
          securityHeaders({
            "Content-Type":
              "text/plain; charset=utf-8",

            "Set-Cookie":
              clearCookie(
                "go_rare_oauth_state"
              )
          })
      }
    );
  }

  const config =
    getOAuthConfig(env);

  /*
    Do not invent a payment
    provider or billing API.

    OAuth can only be completed
    when the actual provider
    endpoints are supplied as
    environment variables.
  */

  if (
    !config.tokenURL ||
    !config.clientID ||
    !config.clientSecret ||
    !config.redirectURI
  ) {
    return new Response(
      "OAuth provider is not completely configured.",
      {
        status: 503,

        headers:
          securityHeaders({
            "Content-Type":
              "text/plain; charset=utf-8",

            "Set-Cookie":
              clearCookie(
                "go_rare_oauth_state"
              )
          })
      }
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
      config.clientID
    );

    body.set(
      "client_secret",
      config.clientSecret
    );

    body.set(
      "redirect_uri",
      config.redirectURI
    );

    const response =
      await fetch(
        config.tokenURL,
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

    if (
      !response.ok
    ) {
      return new Response(
        "OAuth token exchange failed.",
        {
          status: 502,

          headers:
            securityHeaders({
              "Content-Type":
                "text/plain; charset=utf-8",

              "Set-Cookie":
                clearCookie(
                  "go_rare_oauth_state"
                )
            })
        }
      );
    }

    const tokenData =
      await response.json();

    const accessToken =
      cleanText(
        tokenData?.access_token ||
        "",
        6000
      );

    if (!accessToken) {
      return new Response(
        "OAuth provider returned no access token.",
        {
          status: 502,

          headers:
            securityHeaders({
              "Content-Type":
                "text/plain; charset=utf-8",

              "Set-Cookie":
                clearCookie(
                  "go_rare_oauth_state"
                )
            })
        }
      );
    }

    /*
      The token is kept in an
      HttpOnly Secure cookie.

      Billing remains disabled.
      No payment operation is
      performed here.
    */

    const cookie =
      `go_rare_oauth=${safeCookieValue(
        accessToken
      )}; Max-Age=28800; Path=/; HttpOnly; Secure; SameSite=Lax`;

    return new Response(
      null,
      {
        status: 302,

        headers:
          securityHeaders({
            Location:
              "/?oauth=success",

            "Set-Cookie":
              [
                cookie,
                clearCookie(
                  "go_rare_oauth_state"
                )
              ].join(", ")
          })
      }
    );

  } catch {
    return new Response(
      "OAuth callback failed.",
      {
        status: 500,

        headers:
          securityHeaders({
            "Content-Type":
              "text/plain; charset=utf-8",

            "Set-Cookie":
              clearCookie(
                "go_rare_oauth_state"
              )
          })
      }
    );
  }
}

/* =========================
   FRONT-END
   ========================= */

function renderHTML() {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1,viewport-fit=cover"
>

<meta
  name="theme-color"
  content="#0b0b0d"
>

<title>Go Rare AI</title>

<style>
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background: #0b0b0d;
  color: #f5f5f7;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    Arial,
    sans-serif;
}

body {
  min-height: 100vh;
}

button,
textarea,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

.app {
  width: min(1100px, 100%);
  margin: 0 auto;
  padding:
    18px
    16px
    50px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 22px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
}

.logo {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  background: linear-gradient(
    135deg,
    #ffffff,
    #777777
  );
  color: #090909;
  font-weight: 900;
  letter-spacing: -1px;
  box-shadow:
    0 0 25px
    rgba(255,255,255,.12);
}

.brandText {
  font-size: 18px;
  font-weight: 800;
}

.langs {
  display: flex;
  gap: 6px;
}

.langs button {
  border: 1px solid #2d2d32;
  background: #141417;
  color: #aaaab0;
  padding: 7px 9px;
  border-radius: 9px;
}

.langs button.active {
  background: #f5f5f7;
  color: #090909;
}

.hero {
  text-align: center;
  padding:
    26px
    8px
    24px;
}

.hero h1 {
  margin: 0;
  font-size:
    clamp(32px, 7vw, 58px);
  letter-spacing: -2.5px;
}

.hero p {
  margin:
    10px
    auto
    0;
  max-width: 650px;
  color: #a5a5ad;
  font-size: 16px;
}

.card {
  border: 1px solid #25252a;
  background:
    rgba(20,20,23,.92);
  border-radius: 20px;
  padding: 18px;
  margin-bottom: 15px;
  box-shadow:
    0 15px 45px
    rgba(0,0,0,.18);
}

.sectionTitle {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: #8f8f98;
  margin-bottom: 12px;
}

.profileGrid,
.situationGrid {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0,1fr));
  gap: 9px;
}

.situationGrid {
  grid-template-columns:
    repeat(4, minmax(0,1fr));
}

.choice {
  border: 1px solid #303036;
  background: #17171b;
  color: #e9e9ed;
  padding: 12px 10px;
  border-radius: 12px;
  min-height: 48px;
}

.choice.active {
  border-color: #f5f5f7;
  background: #242428;
}

textarea {
  width: 100%;
  min-height: 145px;
  resize: vertical;
  border:
    1px solid #303036;
  border-radius: 15px;
  background: #101013;
  color: #fff;
  padding: 15px;
  outline: none;
}

textarea:focus {
  border-color: #77777f;
}

.actionsRow {
  display: flex;
  gap: 9px;
  margin-top: 11px;
  flex-wrap: wrap;
}

.primary {
  flex: 1;
  min-width: 150px;
  border: 0;
  border-radius: 13px;
  background: #f5f5f7;
  color: #090909;
  font-weight: 800;
  padding: 13px 16px;
}

.secondary {
  border:
    1px solid #303036;
  border-radius: 13px;
  background: #17171b;
  color: #f5f5f7;
  padding: 13px 16px;
}

.secondary.recording {
  border-color: #ff6969;
  color: #ff8585;
}

.status {
  margin-top: 10px;
  min-height: 20px;
  color: #8e8e98;
  font-size: 13px;
}

.resultBlock {
  margin-top: 13px;
}

.resultBlock h3 {
  margin:
    0
    0
    8px;
  font-size: 16px;
}

.list {
  display: grid;
  gap: 8px;
}

.item {
  background: #111114;
  border:
    1px solid #27272c;
  border-radius: 12px;
  padding: 11px 12px;
  line-height: 1.45;
}

.item a {
  color: #fff;
  word-break: break-word;
}

.questionBox {
  border:
    1px solid #3a3a41;
  background: #101014;
  border-radius: 15px;
  padding: 15px;
  margin-top: 13px;
  font-size: 16px;
}

.opportunity {
  border:
    1px solid #303036;
  border-radius: 14px;
  padding: 14px;
  background: #111114;
}

.opportunity + .opportunity {
  margin-top: 9px;
}

.opportunityTitle {
  font-weight: 800;
  margin-bottom: 7px;
}

.meta {
  color: #9999a2;
  font-size: 13px;
  line-height: 1.5;
}

.opportunity a {
  display: inline-block;
  margin-top: 9px;
  color: #fff;
  font-weight: 700;
}

.badge {
  display: inline-block;
  padding: 4px 7px;
  border-radius: 7px;
  background: #242429;
  color: #cfcfd5;
  font-size: 11px;
  margin-top: 6px;
}

.aiText {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #ededf0;
}

.footer {
  text-align: center;
  color: #686870;
  font-size: 12px;
  padding: 18px 0;
}

.hidden {
  display: none !important;
}

@media (max-width: 720px) {
  .profileGrid,
  .situationGrid {
    grid-template-columns:
      repeat(2, minmax(0,1fr));
  }

  .topbar {
    align-items: flex-start;
  }
}

@media (max-width: 430px) {
  .app {
    padding-left: 11px;
    padding-right: 11px;
  }

  .card {
    border-radius: 17px;
    padding: 14px;
  }

  .profileGrid,
  .situationGrid {
    grid-template-columns:
      repeat(2, minmax(0,1fr));
  }
</style>
</head>

<body>

<div class="app">

  <div class="topbar">

    <div class="brand">
      <div class="logo">GR</div>
      <div class="brandText">
        Go Rare AI
      </div>
    </div>

    <div class="langs">
      <button
        data-lang="fr"
        onclick="setLanguage('fr')"
      >FR</button>

      <button
        data-lang="ar"
        onclick="setLanguage('ar')"
      >AR</button>

      <button
        data-lang="en"
        onclick="setLanguage('en')"
      >EN</button>
    </div>

  </div>

  <section class="hero">
    <h1 id="title">
      Go Rare AI
    </h1>

    <p id="subtitle">
      Comprendre votre situation. Voir plus loin.
    </p>
  </section>

  <section class="card">

    <div
      class="sectionTitle"
      id="profileLabel"
    >
      Profil
    </div>

    <div class="profileGrid">

      <button
        class="choice"
        data-profile="particulier"
        onclick="selectProfile('particulier')"
        id="profileParticulier"
      >
        Particulier
      </button>

      <button
        class="choice"
        data-profile="emploi"
        onclick="selectProfile('emploi')"
        id="profileEmploi"
      >
        Emploi
      </button>

      <button
        class="choice"
        data-profile="immigration"
        onclick="selectProfile('immigration')"
        id="profileImmigration"
      >
        Immigration
      </button>

      <button
        class="choice"
        data-profile="entreprise"
        onclick="selectProfile('entreprise')"
        id="profileEntreprise"
      >
        Entreprise
      </button>

    </div>

    <div
      class="sectionTitle"
      style="margin-top:18px"
      id="situationLabel"
    >
      Situation
    </div>

    <div class="situationGrid">

      <button
        class="choice"
        data-situation="recherche"
        onclick="selectSituation('recherche')"
        id="situationRecherche"
      >
        Recherche d'emploi
      </button>

      <button
        class="choice"
        data-situation="formation"
        onclick="selectSituation('formation')"
        id="situationFormation"
      >
        Formation
      </button>

      <button
        class="choice"
        data-situation="administratif"
        onclick="selectSituation('administratif')"
        id="situationAdministratif"
      >
        Démarche administrative
      </button>

      <button
        class="choice"
        data-situation="reconversion"
        onclick="selectSituation('reconversion')"
        id="situationReconversion"
      >
        Reconversion
      </button>

    </div>

  </section>

  <section class="card">

    <textarea
      id="question"
      maxlength="12000"
      placeholder="Décrivez votre situation ou votre objectif..."
    ></textarea>

    <div class="actionsRow">

      <button
        class="primary"
        id="analyzeButton"
        onclick="analyze()"
      >
        Analyser
      </button>

      <label
        class="secondary"
        style="display:flex;align-items:center;justify-content:center"
      >
        <input
          id="imageInput"
          type="file"
          accept="image/*"
          style="display:none"
          onchange="handleImage(event)"
        >
        <span id="imageButton">
          Image
        </span>
      </label>

      <button
        class="secondary"
        id="microButton"
        onclick="toggleRecording()"
      >
        Micro
      </button>

    </div>

    <div
      class="status"
      id="status"
    >
      Prêt.
    </div>

  </section>

  <section
    class="card hidden"
    id="questionResult"
  >
    <div
      class="sectionTitle"
      id="questionResultTitle"
    >
      Informations nécessaires
    </div>

    <div
      class="questionBox"
      id="nextQuestion"
    ></div>
  </section>

  <section
    class="card hidden"
    id="result"
  >

    <div
      class="sectionTitle"
      id="resultTitle"
    >
      Résultat
    </div>

    <div
      id="resultContent"
    ></div>

  </section>

  <section class="card">

    <div
      class="sectionTitle"
      id="billingTitle"
    >
      Compte professionnel
    </div>

    <div
      class="status"
      id="billingStatus"
    >
      Connexion sécurisée.
    </div>

    <div class="actionsRow">

      <button
        class="secondary"
        id="connectButton"
        onclick="connectAccount()"
      >
        Connecter mon compte
      </button>

    </div>

  </section>

  <div class="footer">
    Go Rare AI · <span id="version"></span>
  </div>

</div>

<script>
const UI = ${JSON.stringify(UI)};

const PARCOURS = ${JSON.stringify(
  PARCOURS
)};

const APP_VERSION =
  ${JSON.stringify(VERSION)};

let language = "fr";
let profile = "";
let situation = "";
let history = [];

let mediaRecorder = null;
let audioChunks = [];
let recording = false;

function t(key) {
  return (
    UI[language] &&
    UI[language][key]
  ) || UI.fr[key] || key;
}

function setLanguage(lang) {
  language =
    ["fr","ar","en"].includes(lang)
      ? lang
      : "fr";

  document.documentElement.lang =
    language;

  document.documentElement.dir =
    language === "ar"
      ? "rtl"
      : "ltr";

  applyLanguage();

  document
    .querySelectorAll(
      ".langs button"
    )
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.lang ===
          language
      );
    });
}

function applyLanguage() {
  document.getElementById(
    "title"
  ).textContent =
    t("title");

  document.getElementById(
    "subtitle"
  ).textContent =
    t("subtitle");

  document.getElementById(
    "analyzeButton"
  ).textContent =
    t("analyze");

  document.getElementById(
    "imageButton"
  ).textContent =
    t("image");

  document.getElementById(
    "microButton"
  ).textContent =
    recording
      ? t("stop")
      : t("microphone");

  document.getElementById(
    "profileParticulier"
  ).textContent =
    PARCOURS[
      language
    ]?.particulier ||
    PARCOURS.fr.particulier;

  document.getElementById(
    "profileEmploi"
  ).textContent =
    PARCOURS[
      language
    ]?.emploi ||
    PARCOURS.fr.emploi;

  document.getElementById(
    "profileImmigration"
  ).textContent =
    PARCOURS[
      language
    ]?.immigration ||
    PARCOURS.fr.immigration;

  document.getElementById(
    "profileEntreprise"
  ).textContent =
    PARCOURS[
      language
    ]?.entreprise ||
    PARCOURS.fr.entreprise;

  document.getElementById(
    "situationRecherche"
  ).textContent =
    PARCOURS[
      language
    ]?.recherche ||
    PARCOURS.fr.recherche;

  document.getElementById(
    "situationFormation"
  ).textContent =
    PARCOURS[
      language
    ]?.formation ||
    PARCOURS.fr.formation;

  document.getElementById(
    "situationAdministratif"
  ).textContent =
    PARCOURS[
      language
    ]?.administratif ||
    PARCOURS.fr.administratif;

  document.getElementById(
    "situationReconversion"
  ).textContent =
    PARCOURS[
      language
    ]?.reconversion ||
    PARCOURS.fr.reconversion;

  document.getElementById(
    "situationLabel"
  ).textContent =
    t("situation");

  document.getElementById(
    "question"
  ).placeholder =
    t("placeholder");

  document.getElementById(
    "billingTitle"
  ).textContent =
    t("billing");

  updateBilling();
}

function selectProfile(value) {
  profile =
    value;

  document
    .querySelectorAll(
      "[data-profile]"
    )
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.profile ===
          profile
      );
    });
}

function selectSituation(value) {
  situation =
    value;

  document
    .querySelectorAll(
      "[data-situation]"
    )
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.situation ===
          situation
      );
    });
}

function setStatus(text) {
  document.getElementById(
    "status"
  ).textContent =
    text;
}

function escapeHTML(value) {
  return String(
    value ?? ""
  )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function listHTML(
  values
) {
  if (
    !Array.isArray(values) ||
    !values.length
  ) {
    return "";
  }

  return `
    <div class="list">
      ${values
        .map(
          item =>
            `<div class="item">${escapeHTML(
              typeof item === "string"
                ? item
                : item?.item ||
                  item?.reason ||
                  JSON.stringify(item)
            )}</div>`
        )
        .join("")}
    </div>
  `;
}

function confirmedHTML(
  data
) {
  if (
    !data ||
    typeof data !== "object"
  ) {
    return "";
  }

  const entries =
    Object.entries(data);

  if (!entries.length) {
    return `
      <div class="item">
        ${escapeHTML(
          language === "ar"
            ? "لم يتم تأكيد معلومات كافية بعد."
            : language === "en"
              ? "Not enough information confirmed yet."
              : "Pas encore assez d'informations confirmées."
        )}
      </div>
    `;
  }

  return `
    <div class="list">
      ${entries
        .map(
          ([key,value]) =>
            `<div class="item">
              <strong>${escapeHTML(key)}</strong>
              <br>
              ${escapeHTML(value)}
            </div>`
        )
        .join("")}
    </div>
  `;
}

function verificationHTML(
  values
) {
  if (
    !Array.isArray(values) ||
    !values.length
  ) {
    return "";
  }

  return `
    <div class="list">
      ${values
        .map(item => `
          <div class="item">
            <strong>
              ${escapeHTML(
                item.item || ""
              )}
            </strong>
            <br>
            ${escapeHTML(
              item.reason || ""
            )}
            ${
              item.source
                ? `<br><br>
                   <a
                     href="${escapeHTML(
                       item.source
                     )}"
                     target="_blank"
                     rel="noopener noreferrer"
                   >
                     ${escapeHTML(
                       language === "ar"
                         ? "Vérifier la source"
                         : language === "en"
                           ? "Verify source"
                           : "Vérifier la source"
                     )}
                   </a>`
                : ""
            }
          </div>
        `)
        .join("")}
    </div>
  `;
}

function sourcesHTML(
  values
) {
  if (
    !Array.isArray(values) ||
    !values.length
  ) {
    return "";
  }

  return `
    <div class="list">
      ${values
        .map(source => `
          <div class="item">
            <strong>
              ${escapeHTML(
                source.name || ""
              )}
            </strong>
            <br>
            <a
              href="${escapeHTML(
                source.url || "#"
              )}"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${escapeHTML(
                source.url || ""
              )}
            </a>
          </div>
        `)
        .join("")}
    </div>
  `;
}

function opportunitiesHTML(
  result
) {
  const opportunities =
    Array.isArray(
      result?.opportunities
    )
      ? result.opportunities
      : [];

  const search =
    result?.opportunitySearch;

  let html = "";

  if (
    opportunities.length
  ) {
    html += `
      <div class="resultBlock">
        <h3>
          ${escapeHTML(
            t("opportunities")
          )}
        </h3>

        <div>
          ${opportunities
            .map(
              offer => `
                <div class="opportunity">

                  <div class="opportunityTitle">
                    ${escapeHTML(
                      offer.title || ""
                    )}
                  </div>

                  <div class="meta">
                    ${
                      offer.location
                        ? escapeHTML(
                            offer.location
                          )
                        : ""
                    }

                    ${
                      offer.company
                        ? " · " +
                          escapeHTML(
                            offer.company
                          )
                        : ""
                    }

                    ${
                      offer.contract
                        ? "<br>" +
                          escapeHTML(
                            offer.contract
                          )
                        : ""
                    }

                    ${
                      offer.experience
                        ? "<br>" +
                          escapeHTML(
                            offer.experience
                          )
                        : ""
                    }
                  </div>

                  <div class="badge">
                    ${escapeHTML(
                      offer.source ||
                      "France Travail"
                    )}
                  </div>

                  ${
                    offer.url
                      ? `<br>
                         <a
                           href="${escapeHTML(
                             offer.url
                           )}"
                           target="_blank"
                           rel="noopener noreferrer"
                         >
                           ${escapeHTML(
                             language === "ar"
                               ? "فتح العرض"
                               : language === "en"
                                 ? "Open offer"
                                 : "Voir l'offre"
                           )}
                         </a>`
                      : ""
                  }

                </div>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  if (
    search?.searchURL
  ) {
    html += `
      <div class="resultBlock">
        <div class="item">

          ${
            opportunities.length
              ? ""
              : `<strong>
                  ${escapeHTML(
                    search.message ||
                    (
                      language === "ar"
                        ? "لم يتم العثور على عروض مباشرة في هذه اللحظة."
                        : language === "en"
                          ? "No direct offers were returned at this time."
                          : "Aucune offre directe n'a été retournée à cet instant."
                    )
                  )}
                </strong>
                <br><br>`
          }

          <a
            href="${escapeHTML(
              search.searchURL
            )}"
            target="_blank"
            rel="noopener noreferrer"
          >
            ${
              language === "ar"
                ? "فتح البحث الرسمي في France Travail"
                : language === "en"
                  ? "Open official France Travail search"
                  : "Ouvrir la recherche officielle France Travail"
            }
          </a>

        </div>
      </div>
    `;
  }

  return html;
}

function renderResult(
  result
) {
  const content =
    document.getElementById(
      "resultContent"
    );

  const confirmed =
    result?.confirmed || {};

  let html = "";

  html += `
    <div class="resultBlock">
      <h3>
        ${escapeHTML(
          t("confirmed")
        )}
      </h3>
      ${confirmedHTML(
        confirmed
      )}
    </div>
  `;

  const verification =
    verificationHTML(
      result?.verification
    );

  if (verification) {
    html += `
      <div class="resultBlock">
        <h3>
          ${escapeHTML(
            t("verify")
          )}
        </h3>
        ${verification}
      </div>
    `;
  }

  html += `
    <div class="resultBlock">
      <h3>
        ${escapeHTML(
          t("actions")
        )}
      </h3>
      ${listHTML(
        result?.actions
      )}
    </div>
  `;

  html += `
    <div class="resultBlock">
      <h3>
        ${escapeHTML(
          t("recommendations")
        )}
      </h3>
      ${listHTML(
        result?.recommendations
      )}
    </div>
  `;

  if (
    Array.isArray(
      result?.protections
    ) &&
    result.protections.length
  ) {
    html += `
      <div class="resultBlock">
        <h3>
          ${escapeHTML(
            language === "ar"
              ? "الحماية والاحتياطات"
              : language === "en"
                ? "Protection and precautions"
                : "Protection et précautions"
          )}
        </h3>

        ${listHTML(
          result.protections
        )}
      </div>
    `;
  }

  html +=
    opportunitiesHTML(
      result
    );

  if (
    result?.ai
  ) {
    html += `
      <div class="resultBlock">
        <h3>
          Go Rare AI
        </h3>

        <div class="item aiText">
          ${escapeHTML(
            result.ai
          )}
        </div>
      </div>
    `;
  }

  html += `
    <div class="resultBlock">
      <h3>
        ${escapeHTML(
          t("sources")
        )}
      </h3>

      ${sourcesHTML(
        result?.sources
      )}
    </div>
  `;

  content.innerHTML =
    html;

  document.getElementById(
    "result"
  ).classList.remove(
    "hidden"
  );
}

async function analyze() {
  const input =
    document.getElementById(
      "question"
    );

  const question =
    input.value.trim();

  if (!question) {
    setStatus(
      language === "ar"
        ? "اكتب وضعك أو هدفك أولاً."
        : language === "en"
          ? "Describe your situation or objective first."
          : "Décrivez d'abord votre situation ou votre objectif."
    );

    return;
  }

  const button =
    document.getElementById(
      "analyzeButton"
    );

  button.disabled =
    true;

  setStatus(
    t("searching")
  );

  document.getElementById(
    "questionResult"
  ).classList.add(
    "hidden"
  );

  try {
    const response =
      await fetch(
        "/api/analyze",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              question,
              language,
              profile,
              situation,
              history
            })
        }
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data?.ok
    ) {
      throw new Error(
        data?.error ||
        "Request failed"
      );
    }

    history.push({
      role: "user",
      content: question
    });

    if (
      data?.decision?.mode ===
      "question"
    ) {
      document.getElementById(
        "nextQuestion"
      ).textContent =
        data.decision.question ||
        "";

      document.getElementById(
        "questionResult"
      ).classList.remove(
        "hidden"
      );

      setStatus(
        t("ready")
      );

      return;
    }

    renderResult(
      data.result
    );

    history.push({
      role: "assistant",
      content:
        data?.result?.ai ||
        ""
    });

    setStatus(
      t("ready")
    );

  } catch (error) {
    setStatus(
      `${t("error")}: ${
        error?.message ||
        "Unknown error"
      }`
    );
  } finally {
    button.disabled =
      false;
  }
}

async function handleImage(
  event
) {
  const file =
    event.target.files?.[0];

  if (!file) {
    return;
  }

  if (
    file.size >
    7000000
  ) {
    setStatus(
      language === "ar"
        ? "الصورة كبيرة جدًا."
        : language === "en"
          ? "Image is too large."
          : "L'image est trop grande."
    );

    event.target.value =
      "";

    return;
  }

  setStatus(
    t("searching")
  );

  try {
    const base64 =
      await fileToDataURL(
        file
      );

    const response =
      await fetch(
        "/api/image",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              image: base64,
              language
            })
        }
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data?.ok
    ) {
      throw new Error(
        data?.error ||
        "Image analysis failed"
      );
    }

    const question =
      document.getElementById(
        "question"
      );

    const text =
      data.text || "";

    if (text) {
      question.value =
        question.value.trim()
          ? question.value +
            "\\n\\n" +
            text
          : text;
    }

    setStatus(
      t("ready")
    );

  } catch (error) {
    setStatus(
      `${t("error")}: ${
        error?.message ||
        ""
      }`
    );
  } finally {
    event.target.value =
      "";
  }
}

function fileToDataURL(
  file
) {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload =
        () =>
          resolve(
            reader.result
          );

      reader.onerror =
        reject;

      reader.readAsDataURL(
        file
      );
    }
  );
}

/* =========================
   MICROPHONE START / STOP
   ========================= */

async function toggleRecording() {
  if (recording) {
    stopRecording();
    return;
  }

  await startRecording();
}

async function startRecording() {
  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {
    setStatus(
      language === "ar"
        ? "الميكروفون غير مدعوم في هذا المتصفح."
        : language === "en"
          ? "Microphone is not supported by this browser."
          : "Le microphone n'est pas pris en charge par ce navigateur."
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

    let mimeType = "";

    if (
      MediaRecorder.isTypeSupported(
        "audio/webm;codecs=opus"
      )
    ) {
      mimeType =
        "audio/webm;codecs=opus";
    } else if (
      MediaRecorder.isTypeSupported(
        "audio/webm"
      )
    ) {
      mimeType =
        "audio/webm";
    }

    mediaRecorder =
      mimeType
        ? new MediaRecorder(
            stream,
            {
              mimeType
            }
          )
        : new MediaRecorder(
            stream
          );

    mediaRecorder.ondataavailable =
      event => {
        if (
          event.data &&
          event.data.size
        ) {
          audioChunks.push(
            event.data
          );
        }
      };

    mediaRecorder.onstop =
      async () => {
        stream
          .getTracks()
          .forEach(
            track =>
              track.stop()
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

        audioChunks = [];

        await sendAudio(
          blob
        );
      };

    mediaRecorder.start();

    recording =
      true;

    const button =
      document.getElementById(
        "microButton"
      );

    button.classList.add(
      "recording"
    );

    button.textContent =
      t("stop");

    setStatus(
      language === "ar"
        ? "التسجيل جارٍ... اضغط إيقاف عند الانتهاء."
        : language === "en"
          ? "Recording... press Stop when finished."
          : "Enregistrement... appuyez sur Arrêter lorsque vous avez terminé."
    );

  } catch {
    recording =
      false;

    setStatus(
      language === "ar"
        ? "تعذر الوصول إلى الميكروفون."
        : language === "en"
          ? "Microphone access was denied or failed."
          : "L'accès au microphone a été refusé ou a échoué."
    );
  }
}

function stopRecording() {
  if (
    mediaRecorder &&
    mediaRecorder.state !==
      "inactive"
  ) {
    recording =
      false;

    document
      .getElementById(
        "microButton"
      )
      .classList.remove(
        "recording"
      );

    mediaRecorder.stop();

    setStatus(
      t("searching")
    );
  } else {
    recording =
      false;
  }

  document.getElementById(
    "microButton"
  ).textContent =
    t("microphone");
}

async function sendAudio(
  blob
) {
  if (
    !blob ||
    !blob.size
  ) {
    setStatus(
      t("error")
    );

    return;
  }

  if (
    blob.size >
    12000000
  ) {
    setStatus(
      language === "ar"
        ? "التسجيل كبير جدًا."
        : language === "en"
          ? "Audio recording is too large."
          : "L'enregistrement audio est trop volumineux."
    );

    return;
  }

  try {
    const response =
      await fetch(
        "/api/transcribe",
        {
          method: "POST",

          headers: {
            "Content-Type":
              blob.type ||
              "audio/webm"
          },

          body: blob
        }
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data?.ok
    ) {
      throw new Error(
        data?.error ||
        "Transcription failed"
      );
    }

    const text =
      data.text || "";

    if (text) {
      const question =
        document.getElementById(
          "question"
        );

      question.value =
        question.value.trim()
          ? question.value +
            " " +
            text
          : text;
    }

    setStatus(
      t("ready")
    );

  } catch (error) {
    setStatus(
      `${t("error")}: ${
        error?.message ||
        ""
      }`
    );
  }
}

async function updateBilling() {
  try {
    const response =
      await fetch(
        "/api/billing/status",
        {
          cache: "no-store"
        }
      );

    const data =
      await response.json();

    const element =
      document.getElementById(
        "billingStatus"
      );

    if (
      data.connected
    ) {
      element.textContent =
        language === "ar"
          ? "الحساب متصل. الفوترة غير مفعلة حاليًا."
          : language === "en"
            ? "Account connected. Billing is currently disabled."
            : "Compte connecté. La facturation est actuellement désactivée.";
    } else {
      element.textContent =
        data.configured
          ? t("notConnected")
          : (
              language === "ar"
                ? "الحساب غير متصل. OAuth غير مهيأ بعد."
                : language === "en"
                  ? "Account not connected. OAuth is not configured yet."
                  : "Compte non connecté. OAuth n'est pas encore configuré."
            );
    }

  } catch {
    document.getElementById(
      "billingStatus"
    ).textContent =
      t("notConnected");
  }
}

function connectAccount() {
  window.location.href =
    "/api/billing/connect";
}

document.getElementById(
  "version"
).textContent =
  "v" + APP_VERSION;

setLanguage(
  "fr"
);
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

  const path =
    url.pathname;

  const method =
    request.method.toUpperCase();

  if (
    path === "/health"
  ) {
    return jsonResponse({
      ok: true,
      service:
        "Go Rare AI",
      version:
        VERSION,
      status:
        "operational"
    });
  }

  if (
    path === "/" &&
    method === "GET"
  ) {
    return htmlResponse(
      renderHTML()
    );
  }

  if (
    path === "/api/analyze" &&
    method === "POST"
  ) {
    const limit =
      rateLimit(
        request
      );

    if (!limit.allowed) {
      return jsonResponse(
        {
          ok: false,
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

    const payload =
      await readJSON(
        request
      );

    if (payload === null) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Invalid or oversized JSON body."
        },
        400
      );
    }

    const question =
      cleanText(
        payload.question || "",
        LIMITS.question
      );

    if (!question) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Question is required."
        },
        400
      );
    }

    const history =
      Array.isArray(
        payload.history
      )
        ? payload.history
            .slice(
              -20
            )
        : [];

    if (
      JSON.stringify(history)
        .length >
      LIMITS.history
    ) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Conversation history is too large."
        },
        400
      );
    }

    const result =
      await analyserQuestion(
        {
          ...payload,

          question,

          history
        },
        env
      );

    return jsonResponse(
      result
    );
  }

  if (
    path === "/api/image" &&
    method === "POST"
  ) {
    const limit =
      rateLimit(
        request
      );

    if (!limit.allowed) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Too many requests."
        },
        429,
        {
          "Retry-After":
            "60"
        }
      );
    }

    const payload =
      await readJSON(
        request
      );

    if (payload === null) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Invalid or oversized request."
        },
        400
      );
    }

    const result =
      await analyserImage(
        payload,
        env
      );

    return jsonResponse(
      result,
      result.ok
        ? 200
        : 400
    );
  }

  if (
    path === "/api/transcribe" &&
    method === "POST"
  ) {
    const limit =
      rateLimit(
        request
      );

    if (!limit.allowed) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Too many requests."
        },
        429,
        {
          "Retry-After":
            "60"
        }
      );
    }

    const result =
      await transcrireAudio(
        request,
        env
      );

    return jsonResponse(
      result,
      result.ok
        ? 200
        : 400
    );
  }

  if (
    path ===
      "/api/billing/status" &&
    method === "GET"
  ) {
    return jsonResponse(
      billingStatus(
        request,
        env
      )
    );
  }

  if (
    path ===
      "/api/billing/connect" &&
    method === "GET"
  ) {
    return billingConnect(
      request,
      env
    );
  }

  if (
    path ===
      "/api/billing/callback" &&
    method === "GET"
  ) {
    return billingCallback(
      request,
      env
    );
  }

  return jsonResponse(
    {
      ok: false,
      error:
        "Not found."
    },
    404
  );
}

/* =========================
   CLOUDFLARE WORKER
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
        env
      );
    } catch (error) {
      return jsonResponse(
        {
          ok: false,

          version:
            VERSION,

          error:
            "Internal server error."
        },
        500
      );
    }
  }
};
