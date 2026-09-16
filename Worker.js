const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const MODEL_VISION = "@cf/meta/llama-3.2-11b-vision-instruct";
const MODEL_AUDIO = "@cf/openai/whisper-large-v3-turbo";

const VERSION = "10.1.3";
const DECISION_VERSION = "10.1.3";

/* =========================================================
   GO RARE AI — CORE CONFIGURATION
   ========================================================= */

const LIMITS = {
  question: 12000,
  history: 24000,
  image: 7000000,
  audio: 12000000,
  message: 18000,
  messages: 40
};

const RATE_LIMIT = {
  max: 30,
  windowMs: 60000
};

/*
 * Rate limiting is intentionally isolate-local at this stage.
 * Global production limiting can later move to Durable Objects/KV.
 */
const rateStore = new Map();

/* =========================================================
   OFFICIAL SOURCES
   ========================================================= */

const SOURCES = {
  anef: {
    id: "anef",
    name: "ANEF",
    url: "https://administration-etrangers-en-france.interieur.gouv.fr/"
  },

  travail_etranger: {
    id: "travail_etranger",
    name: "Service-Public — Travail d'un étranger en France",
    url: "https://www.service-public.fr/particuliers/vosdroits/N107"
  },

  france_travail: {
    id: "france_travail",
    name: "France Travail",
    url: "https://www.francetravail.fr/"
  },

  statut: {
    id: "statut",
    name: "Service-Public",
    url: "https://www.service-public.fr/"
  },

  creation_ei: {
    id: "creation_ei",
    name: "Service-Public Entreprendre",
    url: "https://entreprendre.service-public.fr/"
  },

  guichet: {
    id: "guichet",
    name: "Guichet unique des formalités",
    url: "https://formalites.entreprises.gouv.fr/"
  }
};

/* =========================================================
   PARCOURS
   ========================================================= */

const PARCOURS = {
  migrant: {
    label: {
      fr: "Étranger / immigration",
      ar: "أجنبي / الهجرة",
      en: "Immigration"
    },

    situations: [
      {
        id: "titre_sejour",
        label: {
          fr: "Titre de séjour",
          ar: "تصريح الإقامة",
          en: "Residence permit"
        }
      },
      {
        id: "renouvellement",
        label: {
          fr: "Renouvellement",
          ar: "تجديد",
          en: "Renewal"
        }
      },
      {
        id: "premiere_demande",
        label: {
          fr: "Première demande",
          ar: "طلب أول",
          en: "First application"
        }
      },
      {
        id: "travail",
        label: {
          fr: "Travailler en France",
          ar: "العمل في فرنسا",
          en: "Working in France"
        }
      },
      {
        id: "anef",
        label: {
          fr: "Démarches ANEF",
          ar: "إجراءات ANEF",
          en: "ANEF procedures"
        }
      }
    ]
  },

  particulier: {
    label: {
      fr: "Particulier",
      ar: "شخص",
      en: "Individual"
    },

    situations: [
      {
        id: "emploi",
        label: {
          fr: "Recherche d'emploi",
          ar: "البحث عن عمل",
          en: "Job search"
        }
      },
      {
        id: "formation",
        label: {
          fr: "Formation",
          ar: "تكوين",
          en: "Training"
        }
      },
      {
        id: "administratif",
        label: {
          fr: "Démarche administrative",
          ar: "إجراء إداري",
          en: "Administrative procedure"
        }
      }
    ]
  },

  emploi: {
    label: {
      fr: "Emploi",
      ar: "العمل",
      en: "Employment"
    },

    situations: [
      {
        id: "emploi",
        label: {
          fr: "Trouver un emploi",
          ar: "العثور على عمل",
          en: "Find a job"
        }
      },
      {
        id: "reconversion",
        label: {
          fr: "Reconversion",
          ar: "تغيير المسار المهني",
          en: "Career change"
        }
      },
      {
        id: "formation",
        label: {
          fr: "Formation",
          ar: "تكوين",
          en: "Training"
        }
      }
    ]
  },

  entreprise: {
    label: {
      fr: "Entreprise",
      ar: "شركة / مشروع",
      en: "Business"
    },

    situations: [
      {
        id: "creation",
        label: {
          fr: "Créer une entreprise",
          ar: "إنشاء شركة",
          en: "Create a business"
        }
      },
      {
        id: "developpement",
        label: {
          fr: "Développer une entreprise",
          ar: "تطوير شركة",
          en: "Develop a business"
        }
      }
    ]
  }
};

/* =========================================================
   LANGUAGE
   ========================================================= */

const LANGUAGES = {
  fr: "fr",
  ar: "ar",
  en: "en",
  es: "es",
  it: "it",
  de: "de",
  pt: "pt",
  nl: "nl"
};

const COUNTRY_LANGUAGES = {
  FR: "fr",
  BE: "fr",
  LU: "fr",
  CH: "fr",
  CA: "fr"
};

function normalizeLanguage(value) {
  if (!value) return "fr";

  const v = String(value)
    .trim()
    .toLowerCase()
    .replace("_", "-");

  if (v.startsWith("fr")) return "fr";
  if (v.startsWith("ar")) return "ar";
  if (v.startsWith("en")) return "en";
  if (v.startsWith("es")) return "es";
  if (v.startsWith("it")) return "it";
  if (v.startsWith("de")) return "de";
  if (v.startsWith("pt")) return "pt";
  if (v.startsWith("nl")) return "nl";

  return "fr";
}

/* =========================================================
   LOCATION NORMALIZATION
   ========================================================= */

function normaliserRecherche(value) {
  if (!value) return "";

  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/[-_/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const LOCATION_ALIASES = {
  "vigneux sur seine": "Vigneux-sur-Seine",
  "vignieux sur seine": "Vigneux-sur-Seine",
  "vignieux-sur-seine": "Vigneux-sur-Seine",
  "vigneux": "Vigneux-sur-Seine",

  "paris": "Paris",
  "paris 75": "Paris",

  "evry": "Évry-Courcouronnes",
  "evry courcouronnes": "Évry-Courcouronnes",

  "corbeil essonnes": "Corbeil-Essonnes",
  "corbeil essonne": "Corbeil-Essonnes",

  "montgeron": "Montgeron",
  "draveil": "Draveil",
  "juvisy sur orge": "Juvisy-sur-Orge",
  "viry chatillon": "Viry-Châtillon",

  "creteil": "Créteil",
  "melun": "Melun",
  "mass y": "Massy",
  "massy": "Massy"
};

function trouverLocalisation(value) {
  const normalized = normaliserRecherche(value);

  if (!normalized) return null;

  if (LOCATION_ALIASES[normalized]) {
    return LOCATION_ALIASES[normalized];
  }

  return String(value).trim();
}

/* =========================================================
   SAFE TEXT HELPERS
   ========================================================= */

function cleanText(value, maxLength = 12000) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/\u0000/g, "")
    .slice(0, maxLength)
    .trim();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueArray(values) {
  return [...new Set(safeArray(values).filter(Boolean))];
}

/* =========================================================
   REQUEST SECURITY
   ========================================================= */

function getClientIP(request) {
  const connecting = request.headers.get("CF-Connecting-IP");

  if (connecting) {
    return connecting.trim();
  }

  const forwarded = request.headers.get("X-Forwarded-For");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return "unknown";
}

function checkRateLimit(request) {
  const ip = getClientIP(request);
  const now = Date.now();

  let entry = rateStore.get(ip);

  if (!entry || now - entry.startedAt >= RATE_LIMIT.windowMs) {
    entry = {
      startedAt: now,
      count: 0
    };

    rateStore.set(ip, entry);
  }

  entry.count++;

  if (entry.count > RATE_LIMIT.max) {
    return false;
  }

  /*
   * Small cleanup to prevent the isolate-local Map
   * from growing forever.
   */
  if (rateStore.size > 5000) {
    for (const [key, item] of rateStore.entries()) {
      if (now - item.startedAt >= RATE_LIMIT.windowMs) {
        rateStore.delete(key);
      }
    }
  }

  return true;
}

function securityHeaders(extra = {}) {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), geolocation=(), payment=(), usb=()",
    "Content-Security-Policy":
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: blob:; " +
      "media-src 'self' blob:; " +
      "connect-src 'self'; " +
      "font-src 'self' data:; " +
      "object-src 'none'; " +
      "base-uri 'none'; " +
      "form-action 'self'; " +
      "frame-ancestors 'none';",
    ...extra
  };
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: securityHeaders(extraHeaders)
    }
  );
}

/* =========================================================
   LANGUAGE DETECTION
   ========================================================= */

function detectLanguage(text, explicitLanguage = null) {
  if (explicitLanguage) {
    return normalizeLanguage(explicitLanguage);
  }

  const value = cleanText(text, 5000);

  if (!value) {
    return "fr";
  }

  const arabicChars = (value.match(/[\u0600-\u06FF]/g) || []).length;

  if (arabicChars >= 2) {
    return "ar";
  }

  const frenchSignals = [
    "je ",
    "j'ai",
    "emploi",
    "travail",
    "diplôme",
    "expérience",
    "france",
    "titre de séjour",
    "entreprise"
  ];

  const englishSignals = [
    "i ",
    "job",
    "work",
    "experience",
    "degree",
    "business",
    "france"
  ];

  const lower = value.toLowerCase();

  const frScore = frenchSignals.reduce(
    (score, word) => score + (lower.includes(word) ? 1 : 0),
    0
  );

  const enScore = englishSignals.reduce(
    (score, word) => score + (lower.includes(word) ? 1 : 0),
    0
  );

  if (frScore > enScore && frScore > 0) {
    return "fr";
  }

  if (enScore > frScore && enScore > 0) {
    return "en";
  }

  return "fr";
}

/* =========================================================
   INFORMATION EXTRACTION
   ========================================================= */

function extraireInformations(text) {
  const original = cleanText(text, LIMITS.question);
  const value = normaliserRecherche(original);

  const info = {};

  if (!value) {
    return info;
  }

  /* ---------------- France ---------------- */

  if (
    value.includes("france") ||
    value.includes("francais") ||
    value.includes("francaise")
  ) {
    info.pays = "France";
  }

  /* ---------------- Diplôme ---------------- */

  if (
    value.includes("sans diplome") ||
    value.includes("pas de diplome") ||
    value.includes("aucun diplome") ||
    value.includes("aucune qualification") ||
    value.includes("je n ai pas de diplome")
  ) {
    info.diplome = "Sans diplôme";
  } else if (
    value.includes("avec diplome") ||
    value.includes("j ai un diplome") ||
    value.includes("diplome")
  ) {
    /*
     * Do not invent the diploma itself.
     * Only record a generic presence when the text
     * explicitly indicates one.
     */
    if (!info.diplome && !value.includes("sans diplome")) {
      info.diplome = "Diplôme à préciser";
    }
  }

  /* ---------------- Expérience ---------------- */

  if (
    value.includes("sans experience") ||
    value.includes("pas d experience") ||
    value.includes("aucune experience") ||
    value.includes("je n ai pas d experience") ||
    value.includes("sans expérience")
  ) {
    info.experience = "Sans expérience";
  } else if (
    value.includes("avec experience") ||
    value.includes("j ai de l experience") ||
    value.includes("experience")
  ) {
    if (!value.includes("sans experience") &&
        !value.includes("pas d experience") &&
        !value.includes("aucune experience")) {
      info.experience = "Expérience à préciser";
    }
  }

  /* ---------------- Objectif emploi ---------------- */

  if (
    value.includes("cherche un emploi") ||
    value.includes("recherche un emploi") ||
    value.includes("chercher un emploi") ||
    value.includes("trouver un emploi") ||
    value.includes("cherche du travail") ||
    value.includes("recherche du travail") ||
    value.includes("trouver du travail") ||
    value.includes("emploi")
  ) {
    info.objectif = "Recherche d'emploi";
  }

  /* ---------------- Type d'emploi ---------------- */

  const employmentPatterns = [
    {
      pattern: "facteur",
      value: "Facteur / livraison de courrier"
    },
    {
      pattern: "livreur",
      value: "Livraison"
    },
    {
      pattern: "nettoyage",
      value: "Nettoyage"
    },
    {
      pattern: "agent d entretien",
      value: "Entretien / nettoyage"
    },
    {
      pattern: "manutention",
      value: "Manutention"
    },
    {
      pattern: "logistique",
      value: "Logistique"
    },
    {
      pattern: "restauration",
      value: "Restauration"
    },
    {
      pattern: "cuisine",
      value: "Cuisine / restauration"
    },
    {
      pattern: "magasin",
      value: "Commerce / magasin"
    },
    {
      pattern: "vente",
      value: "Vente"
    },
    {
      pattern: "batiment",
      value: "Bâtiment"
    }
  ];

  for (const item of employmentPatterns) {
    if (value.includes(item.pattern)) {
      info.type_emploi = item.value;
      break;
    }
  }

  /* ---------------- Ouverture secteurs ---------------- */

  if (
    value.includes("tous les secteurs") ||
    value.includes("tous secteurs") ||
    value.includes("n importe quel secteur") ||
    value.includes("n'importe quel secteur") ||
    value.includes("peu importe le secteur") ||
    value.includes("ouvert a tous les secteurs") ||
    value.includes("ouvert à tous les secteurs")
  ) {
    info.ouvert_tous_secteurs = true;
  }

  /* ---------------- Mobilité ---------------- */

  if (
    value.includes("mobile") ||
    value.includes("mobilite") ||
    value.includes("je peux me deplacer") ||
    value.includes("je peux me déplacer") ||
    value.includes("peu importe la distance") ||
    value.includes("partout")
  ) {
    info.mobilite = "Flexible";
  }

  /* ---------------- Horaires ---------------- */

  if (
    value.includes("peu importe les horaires") ||
    value.includes("n importe quels horaires") ||
    value.includes("n'importe quels horaires") ||
    value.includes("horaires flexibles") ||
    value.includes("flexible pour les horaires") ||
    value.includes("peu importe le temps")
  ) {
    info.horaires = "Flexible";
  }

  /* ---------------- Localisation ---------------- */

  const knownLocations = [
    "vigneux-sur-seine",
    "vignieux-sur-seine",
    "vigneux sur seine",
    "vignieux sur seine",
    "paris",
    "evry",
    "evry courcouronnes",
    "corbeil essonnes",
    "montgeron",
    "draveil",
    "juvisy sur orge",
    "viry chatillon",
    "creteil",
    "melun",
    "massy"
  ];

  for (const location of knownLocations) {
    const normalizedLocation = normaliserRecherche(location);

    if (value.includes(normalizedLocation)) {
      info.zone_recherche = trouverLocalisation(location);
      break;
    }
  }

  /* ---------------- Présence en France ---------------- */

  if (
    value.includes("je suis en france") ||
    value.includes("je vis en france") ||
    value.includes("je reside en france") ||
    value.includes("je réside en france") ||
    value.includes("je suis actuellement en france")
  ) {
    info.presence_france = true;
  }

  /* ---------------- Titre / statut séjour ---------------- */

  if (
    value.includes("titre de sejour") ||
    value.includes("titre de séjour")
  ) {
    info.titre_sejour = true;
    info.statut_sejour = "Titre de séjour";
  }

  if (
    value.includes("salarie") ||
    value.includes("salarié") ||
    value.includes("titre salarié")
  ) {
    info.statut_sejour = "Salarié";
    info.titre_sejour = true;
  }

  if (
    value.includes("recepisse") ||
    value.includes("récépissé")
  ) {
    info.recepisse = true;
    info.statut_sejour = "Récépissé";
  }

  if (
    value.includes("renouvellement") ||
    value.includes("renouveler mon titre")
  ) {
    info.renouvellement = true;
  }

  if (
    value.includes("demande d asile") ||
    value.includes("demande d'asile") ||
    value.includes("asile")
  ) {
    info.asile = true;
  }

  /* ---------------- Entreprise ---------------- */

  if (
    value.includes("creer une entreprise") ||
    value.includes("créer une entreprise") ||
    value.includes("creation d entreprise") ||
    value.includes("création d'entreprise") ||
    value.includes("creer mon entreprise") ||
    value.includes("créer mon entreprise")
  ) {
    info.creation_entreprise = true;
  }

  if (
    value.includes("mon entreprise") ||
    value.includes("mon activite") ||
    value.includes("mon activité") ||
    value.includes("entreprise")
  ) {
    info.entreprise = true;
  }

  return info;
}

/* =========================================================
   CONTEXT DETECTION
   ========================================================= */

function detectContext(text, situation = null, profil = null) {
  const value = normaliserRecherche(text);

  const context = {
    travail: false,
    emploi: false,
    nettoyage: false,
    entreprise: false,
    statut: false,
    social: false,
    administratif: false,
    juridique: false,
    fiscalite: false,
    immigration: false,
    recepisse: false,
    titreSejour: false,
    anef: false,
    renouvellement: false,
    premiereDemande: false,
    asile: false
  };

  if (
    situation === "emploi" ||
    profil === "emploi"
  ) {
    context.travail = true;
    context.emploi = true;
  }

  if (
    value.includes("emploi") ||
    value.includes("travail") ||
    value.includes("job") ||
    value.includes("facteur") ||
    value.includes("livreur") ||
    value.includes("nettoyage") ||
    value.includes("manutention")
  ) {
    context.travail = true;
    context.emploi = true;
  }

  if (
    value.includes("nettoyage") ||
    value.includes("menage") ||
    value.includes("ménage") ||
    value.includes("agent d entretien")
  ) {
    context.nettoyage = true;
  }

  if (
    profil === "entreprise" ||
    situation === "creation" ||
    situation === "developpement"
  ) {
    context.entreprise = true;
  }

  if (
    value.includes("entreprise") ||
    value.includes("societe") ||
    value.includes("société") ||
    value.includes("entrepreneur") ||
    value.includes("creation d entreprise") ||
    value.includes("création d'entreprise")
  ) {
    context.entreprise = true;
  }

  if (
    value.includes("titre de sejour") ||
    value.includes("titre de séjour") ||
    value.includes("recepisse") ||
    value.includes("récépissé") ||
    value.includes("anef") ||
    value.includes("etranger") ||
    value.includes("étranger") ||
    value.includes("immigration")
  ) {
    context.immigration = true;
    context.statut = true;
  }

  if (
    value.includes("recepisse") ||
    value.includes("récépissé")
  ) {
    context.recepisse = true;
  }

  if (
    value.includes("titre de sejour") ||
    value.includes("titre de séjour")
  ) {
    context.titreSejour = true;
  }

  if (value.includes("anef")) {
    context.anef = true;
  }

  if (
    value.includes("renouvellement") ||
    value.includes("renouveler")
  ) {
    context.renouvellement = true;
  }

  if (
    value.includes("premiere demande") ||
    value.includes("première demande")
  ) {
    context.premiereDemande = true;
  }

  if (
    value.includes("asile") ||
    value.includes("demande d asile") ||
    value.includes("demande d'asile")
  ) {
    context.asile = true;
    context.immigration = true;
  }

  if (
    value.includes("administratif") ||
    value.includes("administrative") ||
    value.includes("demarche") ||
    value.includes("démarche")
  ) {
    context.administratif = true;
  }

  if (
    value.includes("juridique") ||
    value.includes("avocat") ||
    value.includes("droit")
  ) {
    context.juridique = true;
  }

  if (
    value.includes("fiscal") ||
    value.includes("impot") ||
    value.includes("impôt") ||
    value.includes("taxe")
  ) {
    context.fiscalite = true;
  }

  if (
    value.includes("social") ||
    value.includes("aide sociale") ||
    value.includes("rsa")
  ) {
    context.social = true;
  }

  return context;
}

/* =========================================================
   USER-ONLY HISTORY
   ========================================================= */

function analyserHistorique(history) {
  const messages = safeArray(history);

  const userMessages = messages
    .filter(message => {
      if (!message || typeof message !== "object") {
        return false;
      }

      const role = String(message.role || "").toLowerCase();

      return role === "user";
    })
    .map(message => cleanText(
      message.content || message.text || "",
      5000
    ))
    .filter(Boolean);

  const limited = userMessages.slice(-20);

  const combined = limited.join("\n");

  return {
    messages: limited,
    texte: combined,
    informations: extraireInformations(combined)
  };
}

/* =========================================================
   CONVERSATION STATE
   ========================================================= */

function construireEtatConversation({
  question,
  history = [],
  informations = {},
  documentInfo = {},
  profil = null,
  situation = null,
  langue = null
}) {
  const historique = analyserHistorique(history);

  const currentQuestion = cleanText(
    question,
    LIMITS.question
  );

  const currentInfo = extraireInformations(currentQuestion);

  const mergedInfo = {
    ...historique.informations,
    ...informations,
    ...currentInfo
  };

  const contextText = [
    historique.texte,
    currentQuestion
  ]
    .filter(Boolean)
    .join("\n");

  const contexte = detectContext(
    contextText,
    situation,
    profil
  );

  /*
   * IMPORTANT:
   * If the user has explicitly established an employment path,
   * do not let a weak keyword such as "entreprise" elsewhere
   * silently switch the case to business mode.
   */
  const explicitEmployment =
    mergedInfo.objectif === "Recherche d'emploi" ||
    mergedInfo.type_emploi ||
    mergedInfo.zone_recherche ||
    situation === "emploi" ||
    profil === "emploi";

  if (explicitEmployment) {
    contexte.travail = true;
    contexte.emploi = true;
  }

  return {
    question: currentQuestion,
    history: historique.messages,
    informations: mergedInfo,
    documentInfo: documentInfo || {},
    profil,
    situation,
    langue: normalizeLanguage(
      langue || detectLanguage(
        contextText,
        langue
      )
    ),
    contexte
  };
}

/* =========================================================
   DETERMINISTIC QUESTIONS
   ========================================================= */

const QUESTIONS = {
  fr: {
    zone_recherche:
      "Dans quelle ville ou zone recherchez-vous principalement un emploi ?",

    type_emploi:
      "Quel type d'emploi recherchez-vous principalement ? Êtes-vous ouvert à différents secteurs ?",

    mobilite:
      "Êtes-vous mobile pour travailler dans les villes ou communes voisines ?",

    horaires:
      "Avez-vous des contraintes concernant les horaires de travail ?",

    presence_france:
      "Êtes-vous actuellement en France ?",

    statut_sejour:
      "Quel est votre statut ou votre titre de séjour actuel en France ?",

    entreprise:
      "Pouvez-vous me préciser votre entreprise ou votre projet d'activité ?"
  },

  ar: {
    zone_recherche:
      "في أي مدينة أو منطقة تبحث بشكل أساسي عن عمل؟",

    type_emploi:
      "ما نوع العمل الذي تبحث عنه أساسًا؟ وهل أنت منفتح على قطاعات مختلفة؟",

    mobilite:
      "هل يمكنك التنقل للعمل في المدن أو المناطق المجاورة؟",

    horaires:
      "هل لديك قيود معينة بخصوص أوقات العمل؟",

    presence_france:
      "هل أنت حاليًا في فرنسا؟",

    statut_sejour:
      "ما هو وضع إقامتك أو نوع تصريح الإقامة الحالي في فرنسا؟",

    entreprise:
      "هل يمكنك أن توضح لي شركتك أو مشروع نشاطك؟"
  },

  en: {
    zone_recherche:
      "Which city or area are you mainly looking to work in?",

    type_emploi:
      "What type of job are you mainly looking for? Are you open to different sectors?",

    mobilite:
      "Are you able to travel to nearby towns or areas for work?",

    horaires:
      "Do you have any restrictions regarding working hours?",

    presence_france:
      "Are you currently in France?",

    statut_sejour:
      "What is your current residence status or residence permit in France?",

    entreprise:
      "Could you tell me about your company or business project?"
  }
};

/* =========================================================
   QUESTION CANDIDATES
   ========================================================= */

function candidatsQuestions(etat) {
  const {
    informations,
    contexte,
    profil,
    situation
  } = etat;

  const candidates = [];

  const hasEmploymentPath =
    contexte.emploi ||
    contexte.travail ||
    profil === "emploi" ||
    situation === "emploi";

  if (hasEmploymentPath) {
    if (!informations.zone_recherche) {
      candidates.push("zone_recherche");
    }

    if (
      !informations.type_emploi &&
      !informations.ouvert_tous_secteurs
    ) {
      candidates.push("type_emploi");
    }

    if (!informations.mobilite) {
      candidates.push("mobilite");
    }

    if (!informations.horaires) {
      candidates.push("horaires");
    }
  }

  if (contexte.immigration) {
    if (
      informations.presence_france === undefined &&
      informations.titre_sejour !== true &&
      informations.recepisse !== true
    ) {
      candidates.push("presence_france");
    }

    if (
      !informations.statut_sejour &&
      informations.titre_sejour !== true
    ) {
      candidates.push("statut_sejour");
    }
  }

  /*
   * Enterprise questions are only activated when the case is
   * genuinely enterprise-oriented.
   */
  if (
    contexte.entreprise &&
    !hasEmploymentPath
  ) {
    if (!informations.entreprise) {
      candidates.push("entreprise");
    }
  }

  return uniqueArray(candidates);
}

/* =========================================================
   DETERMINISTIC DECISION ENGINE
   ========================================================= */

function construireDecision(etat) {
  const candidates = candidatsQuestions(etat);

  if (candidates.length === 0) {
    return {
      etape: "orientation",
      questionKey: null,
      question: null,
      champsManquants: []
    };
  }

  const key = candidates[0];

  const langue = normalizeLanguage(etat.langue);

  const question =
    QUESTIONS[langue]?.[key] ||
    QUESTIONS.fr[key];

  return {
    etape: "question",
    questionKey: key,
    question,
    champsManquants: candidates
  };
}

/* =========================================================
   PROTECTION AGAINST RE-ASKING EXPLICIT ANSWERS
   ========================================================= */

function appliquerProtectionsEmploi(etat, decision) {
  if (!decision || decision.etape !== "question") {
    return decision;
  }

  const info = etat.informations || {};

  /*
   * Explicitly confirmed absence of diploma must never
   * cause a diploma question later.
   */
  if (
    info.diplome === "Sans diplôme" &&
    decision.questionKey === "diplome"
  ) {
    return construireDecision({
      ...etat,
      informations: {
        ...info,
        diplome: "Sans diplôme"
      }
    });
  }

  /*
   * Same principle for experience.
   */
  if (
    info.experience === "Sans expérience" &&
    decision.questionKey === "experience"
  ) {
    return construireDecision({
      ...etat,
      informations: {
        ...info,
        experience: "Sans expérience"
      }
    });
  }

  return decision;
}

/* =========================================================
   SOURCE SELECTION
   ========================================================= */

function selectSources(etat) {
  const sources = [];

  const contexte = etat.contexte || {};

  if (
    contexte.travail ||
    contexte.emploi
  ) {
    sources.push("france_travail");

    /*
     * Only add foreign-worker information when the case
     * actually contains an immigration/work-authorization
     * dimension.
     */
    if (contexte.immigration) {
      sources.push("travail_etranger");
    }
  }

  if (
    contexte.statut ||
    contexte.immigration
  ) {
    sources.push("statut");
  }

  if (
    contexte.entreprise &&
    !contexte.emploi &&
    !contexte.travail
  ) {
    sources.push("creation_ei");
    sources.push("guichet");
  }

  if (contexte.anef) {
    sources.push("anef");
  }

  return uniqueArray(sources)
    .map(id => SOURCES[id])
    .filter(Boolean);
}

/* =========================================================
   CONFIRMED INFORMATION
   ========================================================= */

function confirmed(etat) {
  const info = etat.informations || {};
  const confirmedInfo = [];

  if (info.objectif) {
    confirmedInfo.push({
      key: "objectif",
      label: "Objectif",
      value: info.objectif
    });
  }

  if (info.zone_recherche) {
    confirmedInfo.push({
      key: "zone_recherche",
      label: "Zone de recherche",
      value: info.zone_recherche
    });
  }

  if (info.type_emploi) {
    confirmedInfo.push({
      key: "type_emploi",
      label: "Type d'emploi",
      value: info.type_emploi
    });
  }

  if (info.diplome) {
    confirmedInfo.push({
      key: "diplome",
      label: "Diplôme",
      value: info.diplome
    });
  }

  if (info.experience) {
    confirmedInfo.push({
      key: "experience",
      label: "Expérience",
      value: info.experience
    });
  }

  if (info.mobilite) {
    confirmedInfo.push({
      key: "mobilite",
      label: "Mobilité",
      value: info.mobilite
    });
  }

  if (info.horaires) {
    confirmedInfo.push({
      key: "horaires",
      label: "Horaires",
      value: info.horaires
    });
  }

  if (info.statut_sejour) {
    confirmedInfo.push({
      key: "statut_sejour",
      label: "Statut de séjour",
      value: info.statut_sejour
    });
  }

  return confirmedInfo;
}

/* =========================================================
   DOCUMENT CHECKS
   ========================================================= */

function documents(etat) {
  const contexte = etat.contexte || {};
  const info = etat.informations || {};

  const result = [];

  if (
    contexte.immigration ||
    contexte.statut
  ) {
    result.push({
      title: "Vérification du statut",
      items: [
        "Titre ou document de séjour actuel",
        "Date de validité",
        "Éventuel récépissé ou justificatif récent",
        "Informations affichées sur ANEF si la démarche y est liée"
      ]
    });
  }

  if (
    contexte.travail &&
    info.statut_sejour
  ) {
    result.push({
      title: "Vérification liée au travail",
      items: [
        "Vérifier que le statut permet bien l'activité envisagée",
        "Vérifier les éventuelles restrictions indiquées sur le document",
        "Vérifier les règles officielles applicables au poste"
      ]
    });
  }

  return result;
}

/* =========================================================
   ACTIONS
   ========================================================= */

function actions(etat) {
  const contexte = etat.contexte || {};
  const info = etat.informations || {};

  const result = [];

  if (contexte.emploi || contexte.travail) {
    result.push(
      "Créer ou mettre à jour votre profil France Travail.",
      "Rechercher les offres correspondant à votre zone et à votre type d'emploi.",
      "Préparer un CV simple adapté aux postes visés."
    );

    if (info.diplome === "Sans diplôme") {
      result.push(
        "Privilégier également les offres accessibles sans diplôme."
      );
    }

    if (info.experience === "Sans expérience") {
      result.push(
        "Inclure les offres acceptant les débutants et les profils sans expérience."
      );
    }
  }

  if (contexte.immigration) {
    result.push(
      "Vérifier les informations officielles correspondant exactement à votre statut.",
      "Utiliser ANEF lorsque la démarche concernée y est accessible."
    );
  }

  return uniqueArray(result);
}

/* =========================================================
   RECOMMENDATIONS
   ========================================================= */

function recommendations(etat) {
  const contexte = etat.contexte || {};
  const info = etat.informations || {};

  const result = [];

  if (
    contexte.emploi ||
    contexte.travail
  ) {
    if (
      info.diplome === "Sans diplôme" &&
      info.experience === "Sans expérience"
    ) {
      result.push({
        type: "emploi",
        title: "Profil accessible aux recherches sans diplôme ni expérience",
        text:
          "La recherche peut être orientée vers les postes qui indiquent explicitement qu'aucun diplôme ou aucune expérience préalable n'est exigé."
      });
    }

    if (info.ouvert_tous_secteurs) {
      result.push({
        type: "ouverture",
        title: "Recherche multisectorielle",
        text:
          "L'analyse peut comparer plusieurs familles de métiers au lieu de limiter la recherche à un seul secteur."
      });
    }
  }

  return result;
}
/* =========================================================
   SYSTEM PROMPT
   ========================================================= */

function systemPrompt(etat, decision) {
  const langue = normalizeLanguage(etat.langue);

  return [
    "Tu es Go Rare AI, un assistant d'orientation et d'intelligence de situation.",
    "",
    "LANGUE:",
    "Réponds principalement dans la langue demandée par l'utilisateur.",
    "Si la langue est l'arabe, explique clairement en arabe.",
    "Conserve les noms officiels français lorsqu'ils sont importants.",
    "",
    "REGLE PRINCIPALE:",
    "Le moteur de décision déterministe contrôle les questions.",
    "Tu ne dois pas inventer une nouvelle question si une question déterministe est fournie.",
    "",
    "EVIDENCE:",
    "Ne présente jamais une hypothèse comme un fait confirmé.",
    "Ne fabrique jamais une loi, une procédure, une condition administrative, un salaire ou une offre d'emploi.",
    "Lorsque la vérification officielle est nécessaire, indique-le clairement.",
    "",
    "SOURCES:",
    "Privilégie les sources officielles sélectionnées par le serveur.",
    "Ne remplace pas une source officielle par une affirmation non vérifiée.",
    "",
    "EMPLOI:",
    "Si l'utilisateur cherche un emploi, respecte les informations déjà confirmées.",
    "Ne redemande jamais une information déjà fournie.",
    "Si l'utilisateur indique explicitement ne pas avoir de diplôme, considère cette information comme acquise.",
    "Si l'utilisateur indique explicitement ne pas avoir d'expérience, considère cette information comme acquise.",
    "",
    "IMMIGRATION:",
    "Ne conclus pas qu'un titre de séjour autorise une activité précise sans vérification officielle.",
    "",
    "DECISION:",
    JSON.stringify(decision || {}),
    "",
    "ETAT:",
    JSON.stringify({
      informations: etat.informations || {},
      contexte: etat.contexte || {},
      profil: etat.profil || null,
      situation: etat.situation || null
    }),
    "",
    "LANGUE INTERNE:",
    langue
  ].join("\n");
}

/* =========================================================
   AI HELPER
   ========================================================= */

async function askAI(env, messages, options = {}) {
  if (!env || !env.IA) {
    throw new Error("Binding IA indisponible.");
  }

  const maxTokens = Math.min(
    Number(options.max_tokens || 1800),
    3000
  );

  const temperature =
    typeof options.temperature === "number"
      ? options.temperature
      : 0.15;

  const response = await env.IA.run(
    MODEL,
    {
      messages: safeArray(messages),
      max_tokens: maxTokens,
      temperature
    }
  );

  if (!response) {
    return "";
  }

  if (typeof response === "string") {
    return response;
  }

  if (response.response) {
    return String(response.response);
  }

  if (
    response.result &&
    typeof response.result === "string"
  ) {
    return response.result;
  }

  return "";
}

/* =========================================================
   EMPLOYMENT ORIENTATION
   ========================================================= */

function construireOrientationEmploi(etat) {
  const info = etat.informations || {};

  const facts = [];

  if (info.objectif) {
    facts.push("Objectif : " + info.objectif);
  }

  if (info.zone_recherche) {
    facts.push("Zone : " + info.zone_recherche);
  }

  if (info.type_emploi) {
    facts.push("Type d'emploi : " + info.type_emploi);
  }

  if (info.diplome) {
    facts.push("Diplôme : " + info.diplome);
  }

  if (info.experience) {
    facts.push("Expérience : " + info.experience);
  }

  if (info.mobilite) {
    facts.push("Mobilité : " + info.mobilite);
  }

  if (info.horaires) {
    facts.push("Horaires : " + info.horaires);
  }

  if (info.ouvert_tous_secteurs) {
    facts.push("Ouvert à plusieurs secteurs : oui");
  }

  return facts.join("\n");
}

/* =========================================================
   MESSAGE MODE
   ========================================================= */

function messagePrompt(mode, text, langue) {
  const clean = cleanText(text, LIMITS.message);
  const language = normalizeLanguage(langue);

  const instructions = {
    analyse:
      "Analyse le message de manière claire et structurée. Sépare les faits, les points à vérifier et les éléments importants.",

    reponse:
      "Rédige une réponse naturelle, claire et utile au message de l'utilisateur.",

    reformulation:
      "Reformule le texte de manière plus claire et professionnelle sans changer son sens.",

    correction:
      "Corrige les fautes de langue et améliore légèrement la formulation sans changer le sens.",

    traduction:
      "Traduis fidèlement le texte. Ne rajoute pas d'informations qui ne sont pas présentes."
  };

  return [
    "Langue cible : " + language,
    instructions[mode] || instructions.reponse,
    "",
    clean
  ].join("\n");
}

/* =========================================================
   IMAGE ANALYSIS
   ========================================================= */

async function analyserImage(env, imageBase64, question, langue) {
  const image = cleanText(
    imageBase64,
    LIMITS.image
  );

  if (!image) {
    throw new Error("Image absente.");
  }

  const prompt = cleanText(
    question ||
    "Analyse cette image et identifie uniquement les informations visibles et lisibles qui peuvent être utiles à l'utilisateur.",
    5000
  );

  const language = normalizeLanguage(langue);

  const response = await env.IA.run(
    MODEL_VISION,
    {
      messages: [
        {
          role: "system",
          content:
            "Tu es un assistant d'analyse visuelle de Go Rare AI. " +
            "Analyse uniquement ce qui est réellement visible ou lisible. " +
            "Ne devine pas les informations absentes. " +
            "Signale clairement les éléments incertains."
        },
        {
          role: "user",
          content:
            "Langue de réponse : " +
            language +
            "\n\n" +
            prompt
        }
      ],
      image: image,
      max_tokens: 2200,
      temperature: 0.1
    }
  );

  if (!response) {
    return "";
  }

  if (typeof response === "string") {
    return response;
  }

  if (response.response) {
    return String(response.response);
  }

  return "";
}

/* =========================================================
   AUDIO TRANSCRIPTION
   ========================================================= */

async function transcrireAudio(env, audioBuffer, langue) {
  if (!audioBuffer || !audioBuffer.byteLength) {
    throw new Error("Audio absent.");
  }

  const language = normalizeLanguage(langue);

  const input = new Uint8Array(audioBuffer);

  const response = await env.IA.run(
    MODEL_AUDIO,
    {
      audio: input,
      task: "transcribe",
      language: language,
      condition_on_previous_text: false
    }
  );

  if (!response) {
    return "";
  }

  if (
    response.transcription_info &&
    response.transcription_info.text
  ) {
    return String(
      response.transcription_info.text
    );
  }

  if (response.text) {
    return String(response.text);
  }

  if (response.transcription) {
    return String(response.transcription);
  }

  if (response.response) {
    return String(response.response);
  }

  return "";
}

/* =========================================================
   MAIN ANALYSIS ENGINE
   ========================================================= */

async function analyserQuestion(env, payload) {
  const question = cleanText(
    payload.question || "",
    LIMITS.question
  );

  const history = safeArray(
    payload.history
  ).slice(-20);

  const informations =
    payload.informations &&
    typeof payload.informations === "object"
      ? payload.informations
      : {};

  const documentInfo =
    payload.documentInfo &&
    typeof payload.documentInfo === "object"
      ? payload.documentInfo
      : {};

  const profil = payload.profil || null;
  const situation = payload.situation || null;

  const langue = normalizeLanguage(
    payload.langue ||
    detectLanguage(question, payload.langue)
  );

  const etat = construireEtatConversation({
    question,
    history,
    informations,
    documentInfo,
    profil,
    situation,
    langue
  });

  let decision = construireDecision(etat);

  decision = appliquerProtectionsEmploi(
    etat,
    decision
  );

  /*
   * ---------------------------------------------------------
   * DETERMINISTIC QUESTION MODE
   * ---------------------------------------------------------
   */

  if (decision.etape === "question") {
    return {
      version: VERSION,
      decisionVersion: DECISION_VERSION,
      mode: "question",
      etape: decision.etape,
      questionKey: decision.questionKey,
      question: decision.question,
      champsManquants: decision.champsManquants,
      langue: etat.langue,
      informations: etat.informations,
      confirmed: confirmed(etat),
      documents: documents(etat),
      actions: actions(etat),
      recommendations: recommendations(etat),
      sources: selectSources(etat)
    };
  }

  /*
   * ---------------------------------------------------------
   * FINAL ORIENTATION MODE
   * ---------------------------------------------------------
   */

  const selectedSources = selectSources(etat);

  const employmentPath =
    etat.contexte &&
    (
      etat.contexte.emploi ||
      etat.contexte.travail
    );

  const confirmedFacts = confirmed(etat);
  const documentChecks = documents(etat);
  const actionList = actions(etat);
  const recommendationList = recommendations(etat);

  let aiText = "";

  try {
    const basePrompt = [
      systemPrompt(etat, decision),
      "",
      "DONNEES CONFIRMEES:",
      JSON.stringify(confirmedFacts),
      "",
      "DOCUMENTS / VERIFICATIONS:",
      JSON.stringify(documentChecks),
      "",
      "ACTIONS:",
      JSON.stringify(actionList),
      "",
      "RECOMMANDATIONS:",
      JSON.stringify(recommendationList),
      "",
      employmentPath
        ? "CONTEXTE EMPLOI:"
        : "CONTEXTE GENERAL:",
      employmentPath
        ? construireOrientationEmploi(etat)
        : "Construire une orientation utile à partir des informations disponibles.",
      "",
      "Réponds de façon claire et pratique.",
      "Ne fabrique aucune information.",
      "Ne présente pas une hypothèse comme un fait."
    ].join("\n");

    aiText = await askAI(
      env,
      [
        {
          role: "system",
          content:
            "Tu es Go Rare AI. Tu fournis une orientation factuelle, prudente et actionnable."
        },
        {
          role: "user",
          content: basePrompt
        }
      ],
      {
        max_tokens: 2200,
        temperature: 0.15
      }
    );
  } catch (error) {
    aiText =
      "L'orientation automatique n'a pas pu être générée. " +
      "Les informations confirmées et les étapes de vérification restent disponibles ci-dessous.";
  }

  return {
    version: VERSION,
    decisionVersion: DECISION_VERSION,
    mode: "orientation",
    etape: "orientation",
    questionKey: null,
    question: null,
    langue: etat.langue,
    informations: etat.informations,
    confirmed: confirmedFacts,
    documents: documentChecks,
    actions: actionList,
    recommendations: recommendationList,
    sources: selectedSources,
    orientation: aiText
  };
}

/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {
  return String(value === undefined || value === null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   SOURCE HTML
   ========================================================= */

function sourceHTML(sources) {
  const list = safeArray(sources);

  if (!list.length) {
    return "";
  }

  return (
    '<div class="sources">' +
      '<div class="sources-title">Sources officielles</div>' +
      '<div class="sources-list">' +
        list.map(function(source) {
          const name = escapeHTML(
            source && source.name
              ? source.name
              : "Source officielle"
          );

          const url =
            source &&
            typeof source.url === "string" &&
            source.url.startsWith("https://")
              ? source.url
              : "#";

          return (
            '<a class="source-link" href="' +
            escapeHTML(url) +
            '" target="_blank" rel="noopener noreferrer">' +
            name +
            '</a>'
          );
        }).join("") +
      '</div>' +
    '</div>'
  );
}

/* =========================================================
   SERVER RESULT HTML
   ========================================================= */

function resultHTML(data) {
  const parts = [];

  if (data.question) {
    parts.push(
      '<div class="result-card next-question">' +
        '<div class="eyebrow">Étape suivante</div>' +
        '<h2>' +
          escapeHTML(data.question) +
        '</h2>' +
      '</div>'
    );
  }

  if (data.orientation) {
    parts.push(
      '<div class="result-card">' +
        '<div class="eyebrow">Orientation</div>' +
        '<div class="orientation-text">' +
          escapeHTML(data.orientation)
            .replace(/\n/g, "<br>") +
        '</div>' +
      '</div>'
    );
  }

  if (
    Array.isArray(data.confirmed) &&
    data.confirmed.length
  ) {
    parts.push(
      '<div class="result-card">' +
        '<div class="eyebrow">Informations confirmées</div>' +
        '<div class="info-grid">' +
          data.confirmed.map(function(item) {
            return (
              '<div class="info-item">' +
                '<div class="info-label">' +
                  escapeHTML(item.label) +
                '</div>' +
                '<div class="info-value">' +
                  escapeHTML(item.value) +
                '</div>' +
              '</div>'
            );
          }).join("") +
        '</div>' +
      '</div>'
    );
  }

  if (
    Array.isArray(data.actions) &&
    data.actions.length
  ) {
    parts.push(
      '<div class="result-card">' +
        '<div class="eyebrow">Actions proposées</div>' +
        '<ul class="action-list">' +
          data.actions.map(function(item) {
            return (
              '<li>' +
                escapeHTML(item) +
              '</li>'
            );
          }).join("") +
        '</ul>' +
      '</div>'
    );
  }

  if (
    Array.isArray(data.recommendations) &&
    data.recommendations.length
  ) {
    parts.push(
      '<div class="result-card">' +
        '<div class="eyebrow">Pistes</div>' +
        data.recommendations.map(function(item) {
          return (
            '<div class="recommendation">' +
              '<strong>' +
                escapeHTML(item.title || "") +
              '</strong>' +
              '<p>' +
                escapeHTML(item.text || "") +
              '</p>' +
            '</div>'
          );
        }).join("") +
      '</div>'
    );
  }

  if (
    Array.isArray(data.documents) &&
    data.documents.length
  ) {
    parts.push(
      '<div class="result-card">' +
        '<div class="eyebrow">Vérifications</div>' +
        data.documents.map(function(group) {
          return (
            '<div class="document-group">' +
              '<strong>' +
                escapeHTML(group.title || "") +
              '</strong>' +
              '<ul>' +
                safeArray(group.items).map(function(item) {
                  return (
                    '<li>' +
                      escapeHTML(item) +
                    '</li>'
                  );
                }).join("") +
              '</ul>' +
            '</div>'
          );
        }).join("") +
      '</div>'
    );
  }

  parts.push(
    sourceHTML(data.sources)
  );

  return parts.join("");
}

/* =========================================================
   PAGE HTML
   IMPORTANT:
   No backticks are used inside this outer template.
   ========================================================= */

function pageHTML() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="Go Rare AI — intelligence de situation, orientation et opportunités.">
<title>Go Rare AI</title>

<style>

:root{
  --gold:#c9a227;
  --gold-soft:#e8d58b;
  --dark:#101114;
  --muted:#6b7280;
  --border:#e5e7eb;
  --surface:#ffffff;
  --surface-soft:#f8fafc;
  --success:#16794b;
}

*{
  box-sizing:border-box;
}

html{
  scroll-behavior:smooth;
}

body{
  margin:0;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  color:var(--dark);
  background:
    linear-gradient(
      180deg,
      #ffffff 0%,
      #f8fafc 100%
    );
}

button,
textarea,
input{
  font:inherit;
}

button{
  cursor:pointer;
}

.container{
  width:min(1100px, calc(100% - 32px));
  margin:0 auto;
}

header{
  padding:24px 0 10px;
}

.topbar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:20px;
}

.brand{
  position:relative;
  display:inline-flex;
  align-items:center;
  gap:7px;
  font-size:24px;
  font-weight:800;
  letter-spacing:-.8px;
}

.brand .rare{
  position:relative;
}

.brand .spark{
  position:absolute;
  border-radius:50%;
  background:var(--gold);
  box-shadow:
    0 0 7px rgba(201,162,39,.65);
}

.brand .spark.one{
  top:-5px;
  left:1px;
  width:4px;
  height:4px;
}

.brand .spark.two{
  top:4px;
  left:8px;
  width:3px;
  height:3px;
}

.brand .spark.three{
  top:-1px;
  left:14px;
  width:2px;
  height:2px;
}

.tagline{
  color:var(--muted);
  font-size:14px;
}

.hero{
  padding:55px 0 35px;
}

.hero h1{
  max-width:780px;
  margin:0;
  font-size:
    clamp(38px, 7vw, 72px);
  line-height:1;
  letter-spacing:-3px;
}

.hero h1 span{
  color:var(--gold);
}

.hero p{
  max-width:700px;
  margin:22px 0 0;
  color:var(--muted);
  font-size:18px;
  line-height:1.65;
}

.card{
  background:rgba(255,255,255,.94);
  border:1px solid var(--border);
  border-radius:20px;
  padding:22px;
  box-shadow:
    0 10px 35px rgba(0,0,0,.05);
}

.profile-grid{
  display:grid;
  grid-template-columns:
    repeat(4, minmax(0,1fr));
  gap:12px;
}

.profile-btn{
  border:1px solid var(--border);
  background:#fff;
  border-radius:16px;
  padding:18px 14px;
  text-align:left;
  transition:
    transform .18s ease,
    border-color .18s ease,
    box-shadow .18s ease;
}

.profile-btn:hover{
  transform:translateY(-2px);
  border-color:var(--gold-soft);
  box-shadow:
    0 8px 22px rgba(0,0,0,.07);
}

.profile-btn strong{
  display:block;
  font-size:16px;
}

.profile-btn span{
  display:block;
  margin-top:6px;
  color:var(--muted);
  font-size:13px;
}

.hidden{
  display:none !important;
}

.situation-list{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:15px;
}

.situation-btn{
  border:1px solid var(--border);
  background:#fff;
  border-radius:999px;
  padding:11px 15px;
}

.situation-btn:hover{
  border-color:var(--gold);
}

#outil{
  position:sticky;
  bottom:12px;
  z-index:15;
  border:1px solid #e5e7eb;
  box-shadow:
    0 12px 35px rgba(0,0,0,.14);
}

#outil::before{
  content:"";
  position:absolute;
  inset:-1px;
  border-radius:18px;
  background:rgba(255,255,255,.72);
  backdrop-filter:blur(10px);
  -webkit-backdrop-filter:blur(10px);
  z-index:-1;
}

.composer-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  margin-bottom:12px;
}

.back-btn{
  border:0;
  background:transparent;
  color:var(--muted);
  padding:6px 0;
}

textarea{
  width:100%;
  min-height:125px;
  resize:vertical;
  border:1px solid var(--border);
  border-radius:16px;
  padding:15px;
  outline:none;
  background:#fff;
}

textarea:focus{
  border-color:var(--gold);
  box-shadow:
    0 0 0 3px rgba(201,162,39,.12);
}

.actions-row{
  display:flex;
  flex-wrap:wrap;
  gap:9px;
  margin-top:11px;
}

.action-btn{
  border:1px solid var(--border);
  background:#fff;
  border-radius:12px;
  padding:10px 14px;
}

.action-btn.primary{
  border-color:var(--dark);
  background:var(--dark);
  color:#fff;
}

.action-btn:hover{
  transform:translateY(-1px);
}

.status{
  min-height:20px;
  margin-top:10px;
  color:var(--muted);
  font-size:13px;
}

.result-area{
  padding:30px 0 100px;
}

#result{
  scroll-margin-top:20px;
}

.result-card{
  scroll-margin-top:20px;
  background:#fff;
  border:1px solid var(--border);
  border-radius:18px;
  padding:22px;
  margin-bottom:14px;
  box-shadow:
    0 8px 28px rgba(0,0,0,.045);
}

.result-card h2{
  margin:8px 0 0;
  font-size:24px;
  line-height:1.35;
}

.eyebrow{
  color:var(--gold);
  font-size:12px;
  font-weight:800;
  text-transform:uppercase;
  letter-spacing:.08em;
}

.orientation-text{
  margin-top:12px;
  line-height:1.7;
}

.info-grid{
  display:grid;
  grid-template-columns:
    repeat(2,minmax(0,1fr));
  gap:10px;
  margin-top:15px;
}

.info-item{
  border:1px solid var(--border);
  border-radius:13px;
  padding:13px;
}

.info-label{
  color:var(--muted);
  font-size:12px;
}

.info-value{
  margin-top:4px;
  font-weight:700;
}

.action-list,
.document-group ul{
  margin:14px 0 0;
  padding-left:21px;
  line-height:1.7;
}

.recommendation{
  margin-top:15px;
  padding:15px;
  border-radius:14px;
  background:var(--surface-soft);
}

.recommendation p{
  margin:7px 0 0;
  color:var(--muted);
  line-height:1.6;
}

.document-group{
  margin-top:15px;
}

.sources{
  margin:18px 0 25px;
  padding:18px;
  border-radius:16px;
  background:#fafafa;
  border:1px solid var(--border);
}

.sources-title{
  font-weight:800;
  margin-bottom:10px;
}

.sources-list{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}

.source-link{
  color:#374151;
  text-decoration:none;
  border:1px solid var(--border);
  border-radius:999px;
  padding:8px 11px;
  background:#fff;
  font-size:13px;
}

.source-link:hover{
  border-color:var(--gold);
}

.cancer{
  position:fixed;
  right:16px;
  bottom:16px;
  z-index:30;
  max-width:280px;
  padding:11px 14px;
  border-radius:14px;
  background:#fff;
  border:1px solid var(--border);
  box-shadow:
    0 8px 25px rgba(0,0,0,.12);
  font-size:12px;
  color:#4b5563;
}

@media(max-width:800px){

  .profile-grid{
    grid-template-columns:
      repeat(2,minmax(0,1fr));
  }

  .hero{
    padding-top:38px;
  }

  .hero h1{
    letter-spacing:-2px;
  }

  .info-grid{
    grid-template-columns:1fr;
  }

  .container{
    width:min(100% - 20px,1100px);
  }

  #outil{
    bottom:6px;
  }

}

@media(max-width:520px){

  header{
    padding-top:16px;
  }

  .tagline{
    display:none;
  }

  .profile-grid{
    grid-template-columns:1fr;
  }

  .card{
    padding:16px;
    border-radius:16px;
  }

  textarea{
    min-height:115px;
  }

  .action-btn{
    flex:1 1 auto;
  }

  .cancer{
    left:10px;
    right:10px;
    bottom:10px;
    max-width:none;
  }

}

</style>
</head>

<body>

<header>
  <div class="container">
    <div class="topbar">

      <div class="brand" aria-label="Go Rare AI">
        <span>Go</span>

        <span class="rare">
          Rare

          <span class="spark one"></span>
          <span class="spark two"></span>
          <span class="spark three"></span>
        </span>

        <span>AI</span>
      </div>

      <div class="tagline">
        Intelligence de situation
      </div>

    </div>
  </div>
</header>

<main>

  <section class="hero">
    <div class="container">

      <h1>
        Comprendre votre situation.
        <span>Voir plus loin.</span>
      </h1>

      <p>
        Go Rare AI transforme votre situation, vos informations
        et vos objectifs en pistes concrètes, étapes et opportunités.
      </p>

    </div>
  </section>

  <section>
    <div class="container">

      <div id="profils" class="card">

        <div class="eyebrow">
          Commencer
        </div>

        <h2>
          Quel parcours vous concerne ?
        </h2>

        <div class="profile-grid">

          <button
            class="profile-btn"
            onclick="openProfil('particulier')"
          >
            <strong>Particulier</strong>
            <span>
              Emploi, formation, démarches
            </span>
          </button>

          <button
            class="profile-btn"
            onclick="openProfil('emploi')"
          >
            <strong>Emploi</strong>
            <span>
              Trouver ou changer d'emploi
            </span>
          </button>

          <button
            class="profile-btn"
            onclick="openProfil('migrant')"
          >
            <strong>Immigration</strong>
            <span>
              Séjour et démarches en France
            </span>
          </button>

          <button
            class="profile-btn"
            onclick="openProfil('entreprise')"
          >
            <strong>Entreprise</strong>
            <span>
              Création et développement
            </span>
          </button>

        </div>

        <div
          id="situations"
          class="situation-list hidden"
        ></div>

      </div>

      <div
        id="outil"
        class="card hidden"
      >

        <div class="composer-header">

          <button
            class="back-btn"
            onclick="retourProfils()"
          >
            ← Retour
          </button>

          <strong id="outilTitle">
            Votre situation
          </strong>

        </div>

        <textarea
          id="question"
          maxlength="12000"
          placeholder="Décrivez votre situation, votre objectif ou votre problème..."
        ></textarea>

        <div class="actions-row">

          <button
            id="analyserBtn"
            class="action-btn primary"
            onclick="analyserTexte()"
          >
            Analyser
          </button>

          <button
            class="action-btn"
            onclick="document.getElementById('imageInput').click()"
          >
            📷 Image
          </button>

          <button
            class="action-btn"
            onclick="activerMicro()"
          >
            🎙️ Micro
          </button>

        </div>

        <input
          id="imageInput"
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onchange="gererImage(this)"
        >

        <div
          id="status"
          class="status"
        ></div>

      </div>

    </div>
  </section>

  <section class="result-area">
    <div class="container">
      <div id="result"></div>
    </div>
  </section>

</main>

<div class="cancer">
  🎗️ Avec vous contre le cancer
</div>

<script>

var profilActuel = null;
var situationActuelle = null;
var historique = [];
var informations = {};
var langue = "fr";
var mediaRecorder = null;
var audioChunks = [];
var isRecording = false;

/* =========================================================
   CLIENT HELPERS
   ========================================================= */

function escapeClient(value){

  return String(
    value === undefined || value === null
      ? ""
      : value
  )
  .replace(/&/g,"&amp;")
  .replace(/</g,"&lt;")
  .replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;")
  .replace(/'/g,"&#039;");

}

function setStatus(text){

  var el = document.getElementById("status");

  if(el){
    el.textContent = text || "";
  }

}

function detectClientLanguage(){

  var browser =
    navigator.language ||
    "fr";

  if(
    browser.toLowerCase().indexOf("ar") === 0
  ){
    return "ar";
  }

  if(
    browser.toLowerCase().indexOf("en") === 0
  ){
    return "en";
  }

  return "fr";

}

/* =========================================================
   PROFILE
   ========================================================= */

function openProfil(profil){

  profilActuel = profil;
  situationActuelle = null;

  var profiles =
    document.getElementById("profils");

  var situations =
    document.getElementById("situations");

  var outil =
    document.getElementById("outil");

  var title =
    document.getElementById("outilTitle");

  profiles.classList.remove("hidden");
  situations.classList.remove("hidden");

  situations.innerHTML = "";

  var data = {
    particulier: [
      ["emploi","Recherche d'emploi"],
      ["formation","Formation"],
      ["administratif","Démarche administrative"]
    ],

    emploi: [
      ["emploi","Trouver un emploi"],
      ["reconversion","Reconversion"],
      ["formation","Formation"]
    ],

    migrant: [
      ["titre_sejour","Titre de séjour"],
      ["renouvellement","Renouvellement"],
      ["premiere_demande","Première demande"],
      ["travail","Travailler en France"],
      ["anef","Démarches ANEF"]
    ],

    entreprise: [
      ["creation","Créer une entreprise"],
      ["developpement","Développer une entreprise"]
    ]
  };

  var items =
    data[profil] || [];

  items.forEach(function(item){

    var button =
      document.createElement("button");

    button.className =
      "situation-btn";

    button.textContent =
      item[1];

    button.onclick =
      function(){

        choisirSituation(
          item[0],
          item[1]
        );

      };

    situations.appendChild(button);

  });

  if(title){

    title.textContent =
      "Votre situation";

  }

  outil.classList.add("hidden");

  situations.scrollIntoView({
    behavior:"smooth",
    block:"start"
  });

}

/* =========================================================
   SITUATION
   ========================================================= */

function choisirSituation(
  situation,
  label
){

  situationActuelle =
    situation;

  var outil =
    document.getElementById("outil");

  var situations =
    document.getElementById("situations");

  var title =
    document.getElementById("outilTitle");

  if(title){
    title.textContent =
      label || "Votre situation";
  }

  situations.classList.add("hidden");
  outil.classList.remove("hidden");

  var question =
    document.getElementById("question");

  if(question){
    question.value = "";
  }

  setStatus("");

  requestAnimationFrame(function(){

    outil.scrollIntoView({
      behavior:"smooth",
      block:"center"
    });

    setTimeout(function(){

      try{
        question.focus({
          preventScroll:true
        });
      }catch(error){
        question.focus();
      }

    },350);

  });

}

/* =========================================================
   BACK
   ========================================================= */

function retourProfils(){

  var outil =
    document.getElementById("outil");

  var situations =
    document.getElementById("situations");

  outil.classList.add("hidden");

  if(profilActuel){
    situations.classList.remove("hidden");
  }else{
    document.getElementById("profils")
      .scrollIntoView({
        behavior:"smooth",
        block:"start"
      });
  }

}

/* =========================================================
   TEXT ANALYSIS
   ========================================================= */

async function analyserTexte(){

  var input =
    document.getElementById("question");

  var text =
    (input.value || "").trim();

  if(!text){

    setStatus(
      "Décrivez d'abord votre situation."
    );

    input.focus();

    return;

  }

  var button =
    document.getElementById("analyserBtn");

  if(button){
    button.disabled = true;
    button.textContent = "Analyse...";
  }

  setStatus(
    "Analyse de votre situation..."
  );

  var payload = {

    question: text,

    history: historique,

    informations: informations,

    profil: profilActuel,

    situation: situationActuelle,

    langue: langue

  };

  try{

    var response =
      await fetch(
        "/api/analyze",
        {
          method:"POST",

          headers:{
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(payload)
        }
      );

    var data =
      await response.json();

    if(!response.ok){

      throw new Error(
        data &&
        data.error
          ? data.error
          : "Erreur d'analyse."
      );

    }

    historique.push({
      role:"user",
      content:text
    });

    historique.push({
      role:"assistant",
      content:
        data.question ||
        data.orientation ||
        ""
    });

    if(
      historique.length > 20
    ){

      historique =
        historique.slice(-20);

    }

    if(
      data.informations &&
      typeof data.informations === "object"
    ){

      informations =
        data.informations;

    }

    afficher(data);

    input.value = "";

    setStatus("");

    setTimeout(function(){

      try{

        input.focus({
          preventScroll:true
        });

      }catch(error){

        input.focus();

      }

    },500);

  }catch(error){

    setStatus(
      error &&
      error.message
        ? error.message
        : "Une erreur est survenue."
    );

  }finally{

    if(button){

      button.disabled = false;
      button.textContent = "Analyser";

    }

  }

}

/* =========================================================
   DISPLAY RESULT
   ========================================================= */

function afficher(data){

  var result =
    document.getElementById("result");

  if(!result){
    return;
  }

  var html = "";

  if(data.question){

    html +=
      '<div class="result-card next-question">' +
        '<div class="eyebrow">Étape suivante</div>' +
        '<h2>' +
          escapeClient(data.question) +
        '</h2>' +
      '</div>';

  }

  if(data.orientation){

    html +=
      '<div class="result-card">' +
        '<div class="eyebrow">Orientation</div>' +
        '<div class="orientation-text">' +
          escapeClient(data.orientation)
            .replace(/\\n/g,"<br>") +
        '</div>' +
      '</div>';

  }

  if(
    Array.isArray(data.confirmed) &&
    data.confirmed.length
  ){

    html +=
      '<div class="result-card">' +
        '<div class="eyebrow">Informations confirmées</div>' +
        '<div class="info-grid">';

    data.confirmed.forEach(function(item){

      html +=
        '<div class="info-item">' +
          '<div class="info-label">' +
            escapeClient(item.label) +
          '</div>' +
          '<div class="info-value">' +
            escapeClient(item.value) +
          '</div>' +
        '</div>';

    });

    html +=
        '</div>' +
      '</div>';

  }

  if(
    Array.isArray(data.actions) &&
    data.actions.length
  ){

    html +=
      '<div class="result-card">' +
        '<div class="eyebrow">Actions proposées</div>' +
        '<ul class="action-list">';

    data.actions.forEach(function(item){

      html +=
        '<li>' +
          escapeClient(item) +
        '</li>';

    });

    html +=
        '</ul>' +
      '</div>';

  }

  if(
    Array.isArray(data.recommendations) &&
    data.recommendations.length
  ){

    html +=
      '<div class="result-card">' +
        '<div class="eyebrow">Pistes</div>';

    data.recommendations.forEach(function(item){

      html +=
        '<div class="recommendation">' +
          '<strong>' +
            escapeClient(item.title || "") +
          '</strong>' +
          '<p>' +
            escapeClient(item.text || "") +
          '</p>' +
        '</div>';

    });

    html +=
      '</div>';

  }

  if(
    Array.isArray(data.documents) &&
    data.documents.length
  ){

    html +=
      '<div class="result-card">' +
        '<div class="eyebrow">Vérifications</div>';

    data.documents.forEach(function(group){

      html +=
        '<div class="document-group">' +
          '<strong>' +
            escapeClient(group.title || "") +
          '</strong>' +
          '<ul>';

      if(
        Array.isArray(group.items)
      ){

        group.items.forEach(function(item){

          html +=
            '<li>' +
              escapeClient(item) +
            '</li>';

        });

      }

      html +=
          '</ul>' +
        '</div>';

    });

    html +=
      '</div>';

  }

  if(
    Array.isArray(data.sources) &&
    data.sources.length
  ){

    html +=
      '<div class="sources">' +
        '<div class="sources-title">' +
          'Sources officielles' +
        '</div>' +
        '<div class="sources-list">';

    data.sources.forEach(function(source){

      var url =
        source &&
        typeof source.url === "string" &&
        source.url.indexOf("https://") === 0
          ? source.url
          : "#";

      html +=
        '<a class="source-link" href="' +
          escapeClient(url) +
          '" target="_blank" rel="noopener noreferrer">' +
          escapeClient(
            source.name ||
            "Source officielle"
          ) +
        '</a>';

    });

    html +=
        '</div>' +
      '</div>';

  }

  result.innerHTML = html;

  requestAnimationFrame(function(){

    var firstResult =
      result.querySelector(".result-card");

    if(firstResult){

      firstResult.scrollIntoView({
        behavior:"smooth",
        block:"start"
      });

    }

  });

}

/* =========================================================
   IMAGE
   ========================================================= */

async function gererImage(input){

  if(
    !input ||
    !input.files ||
    !input.files.length
  ){
    return;
  }

  var file =
    input.files[0];

  if(
    !file.type ||
    file.type.indexOf("image/") !== 0
  ){

    setStatus(
      "Veuillez sélectionner une image."
    );

    return;

  }

  if(
    file.size > 7000000
  ){

    setStatus(
      "L'image est trop volumineuse."
    );

    return;

  }

  setStatus(
    "Analyse de l'image..."
  );

  try{

    var base64 =
      await fileToBase64(file);

    var question =
      document.getElementById(
        "question"
      ).value || "";

    var response =
      await fetch(
        "/api/image",
        {
          method:"POST",

          headers:{
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              image:base64,
              question:question,
              langue:langue
            })
        }
      );

    var data =
      await response.json();

    if(!response.ok){

      throw new Error(
        data &&
        data.error
          ? data.error
          : "Erreur d'analyse de l'image."
      );

    }

    afficher({
      orientation:
        data.result ||
        data.response ||
        "Analyse terminée.",
      confirmed:[],
      actions:[],
      recommendations:[],
      documents:[],
      sources:[]
    });

    setStatus("");

  }catch(error){

    setStatus(
      error &&
      error.message
        ? error.message
        : "Erreur d'analyse de l'image."
    );

  }finally{

    input.value = "";

  }

}

function fileToBase64(file){

  return new Promise(function(resolve,reject){

    var reader =
      new FileReader();

    reader.onload =
      function(){

        var value =
          String(reader.result || "");

        var comma =
          value.indexOf(",");

        resolve(
          comma >= 0
            ? value.slice(comma + 1)
            : value
        );

      };

    reader.onerror =
      reject;

    reader.readAsDataURL(file);

  });

}

/* =========================================================
   MICROPHONE
   ========================================================= */

async function activerMicro(){

  if(
    isRecording &&
    mediaRecorder
  ){

    mediaRecorder.stop();

    return;

  }

  if(
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ){

    setStatus(
      "Le microphone n'est pas disponible sur cet appareil."
    );

    return;

  }

  try{

    var stream =
      await navigator.mediaDevices.getUserMedia({
        audio:true
      });

    audioChunks = [];

    mediaRecorder =
      new MediaRecorder(stream);

    isRecording = true;

    setStatus(
      "Enregistrement en cours... Appuyez à nouveau sur Micro pour arrêter."
    );

    mediaRecorder.ondataavailable =
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

        isRecording = false;

        stream
          .getTracks()
          .forEach(function(track){
            track.stop();
          });

        setStatus(
          "Transcription..."
        );

        var blob =
          new Blob(
            audioChunks,
            {
              type:
                mediaRecorder.mimeType ||
                "audio/webm"
            }
          );

        try{

          var arrayBuffer =
            await blob.arrayBuffer();

          var bytes =
            new Uint8Array(arrayBuffer);

          var binary = "";

          for(
            var i = 0;
            i < bytes.length;
            i++
          ){

            binary +=
              String.fromCharCode(
                bytes[i]
              );

          }

          var audioBase64 =
            btoa(binary);

          var response =
            await fetch(
              "/api/transcribe",
              {
                method:"POST",

                headers:{
                  "Content-Type":
                    "application/json"
                },

                body:
                  JSON.stringify({
                    audio:audioBase64,
                    langue:langue
                  })
              }
            );

          var data =
            await response.json();

          if(!response.ok){

            throw new Error(
              data &&
              data.error
                ? data.error
                : "Erreur de transcription."
            );

          }

          var text =
            data.text ||
            data.transcription ||
            "";

          var question =
            document.getElementById(
              "question"
            );

          question.value =
            text;

          setStatus(
            text
              ? "Transcription terminée."
              : "Aucun texte détecté."
          );

          question.focus({
            preventScroll:true
          });

        }catch(error){

          setStatus(
            error &&
            error.message
              ? error.message
              : "Erreur de transcription."
          );

        }

      };

    mediaRecorder.start();

  }catch(error){

    setStatus(
      "Autorisation du microphone refusée ou indisponible."
    );

  }

}

/* =========================================================
   INITIALIZATION
   ========================================================= */

langue =
  detectClientLanguage();

</script>

</body>
</html>
`;
}

/* =========================================================
   API ROUTER
   ========================================================= */

async function handleAnalyze(request, env) {

  if(!checkRateLimit(request)){

    return json(
      {
        error:
          "Trop de requêtes. Veuillez patienter."
      },
      429
    );

  }

  let payload;

  try{

    payload =
      await request.json();

  }catch(error){

    return json(
      {
        error:"JSON invalide."
      },
      400
    );

  }

  if(
    !payload ||
    typeof payload !== "object"
  ){

    return json(
      {
        error:"Données invalides."
      },
      400
    );

  }

  if(
    cleanText(
      payload.question || "",
      LIMITS.question
    ).length >
    LIMITS.question
  ){

    return json(
      {
        error:"Question trop longue."
      },
      413
    );

  }

  try{

    const result =
      await analyserQuestion(
        env,
        payload
      );

    return json(
      result,
      200
    );

  }catch(error){

    return json(
      {
        error:
          "Erreur interne pendant l'analyse."
      },
      500
    );

  }

}

/* =========================================================
   API IMAGE
   ========================================================= */

async function handleImage(request, env) {

  if(!checkRateLimit(request)){

    return json(
      {
        error:
          "Trop de requêtes. Veuillez patienter."
      },
      429
    );

  }

  let payload;

  try{

    payload =
      await request.json();

  }catch(error){

    return json(
      {
        error:"JSON invalide."
      },
      400
    );

  }

  const image =
    cleanText(
      payload.image || "",
      LIMITS.image
    );

  if(!image){

    return json(
      {
        error:"Image absente."
      },
      400
    );

  }

  try{

    const result =
      await analyserImage(
        env,
        image,
        payload.question || "",
        payload.langue || "fr"
      );

    return json(
      {
        result:result
      },
      200
    );

  }catch(error){

    return json(
      {
        error:
          "Erreur pendant l'analyse de l'image."
      },
      500
    );

  }

}

/* =========================================================
   API TRANSCRIPTION
   ========================================================= */

async function handleTranscribe(
  request,
  env
) {

  if(!checkRateLimit(request)){

    return json(
      {
        error:
          "Trop de requêtes. Veuillez patienter."
      },
      429
    );

  }

  let payload;

  try{

    payload =
      await request.json();

  }catch(error){

    return json(
      {
        error:"JSON invalide."
      },
      400
    );

  }

  const audioBase64 =
    cleanText(
      payload.audio || "",
      LIMITS.audio
    );

  if(!audioBase64){

    return json(
      {
        error:"Audio absent."
      },
      400
    );

  }

  try{

    const binary =
      atob(audioBase64);

    const bytes =
      new Uint8Array(
        binary.length
      );

    for(
      let i = 0;
      i < binary.length;
      i++
    ){

      bytes[i] =
        binary.charCodeAt(i);

    }

    const text =
      await transcrireAudio(
        env,
        bytes.buffer,
        payload.langue || "fr"
      );

    return json(
      {
        text:text
      },
      200
    );

  }catch(error){

    return json(
      {
        error:
          "Erreur pendant la transcription."
      },
      500
    );

  }

}

/* =========================================================
   MAIN ROUTER
   ========================================================= */

export default {

  async fetch(request, env) {

    const url =
      new URL(request.url);

    /*
     * -------------------------------------------------------
     * SECURITY / HEALTH
     * -------------------------------------------------------
     */

    if(
      request.method === "OPTIONS"
    ){

      return new Response(
        null,
        {
          status:204,
          headers:securityHeaders({
            "Access-Control-Allow-Origin":
              url.origin,
            "Access-Control-Allow-Methods":
              "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers":
              "Content-Type"
          })
        }
      );

    }

    /*
     * -------------------------------------------------------
     * HOME
     * -------------------------------------------------------
     */

    if(
      url.pathname === "/" &&
      request.method === "GET"
    ){

      return new Response(
        pageHTML(),
        {
          status:200,
          headers:{
            "Content-Type":
              "text/html; charset=utf-8",
            "Cache-Control":
              "no-store",
            "X-Content-Type-Options":
              "nosniff",
            "X-Frame-Options":
              "DENY",
            "Referrer-Policy":
              "strict-origin-when-cross-origin",
            "Permissions-Policy":
              "camera=(), geolocation=(), payment=(), usb=()",
            "Content-Security-Policy":
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: blob:; " +
              "media-src 'self' blob:; " +
              "connect-src 'self'; " +
              "font-src 'self' data:; " +
              "object-src 'none'; " +
              "base-uri 'none'; " +
              "form-action 'self'; " +
              "frame-ancestors 'none';"
          }
        }
      );

    }

    /*
     * -------------------------------------------------------
     * HEALTH
     * -------------------------------------------------------
     */

    if(
      url.pathname === "/health" &&
      request.method === "GET"
    ){

      return json(
        {
          ok:true,
          service:"Go Rare AI",
          version:VERSION,
          decisionVersion:DECISION_VERSION
        },
        200
      );

    }

    /*
     * -------------------------------------------------------
     * ANALYZE
     * -------------------------------------------------------
     */

    if(
      url.pathname === "/api/analyze" &&
      request.method === "POST"
    ){

      return handleAnalyze(
        request,
        env
      );

    }

    /*
     * -------------------------------------------------------
     * IMAGE
     * -------------------------------------------------------
     */

    if(
      url.pathname === "/api/image" &&
      request.method === "POST"
    ){

      return handleImage(
        request,
        env
      );

    }

    /*
     * -------------------------------------------------------
     * TRANSCRIBE
     * -------------------------------------------------------
     */

    if(
      url.pathname === "/api/transcribe" &&
      request.method === "POST"
    ){

      return handleTranscribe(
        request,
        env
      );

    }

    /*
     * -------------------------------------------------------
     * 404
     * -------------------------------------------------------
     */

    return new Response(
      "Not Found",
      {
        status:404,
        headers:{
          "Content-Type":
            "text/plain; charset=utf-8",
          "Cache-Control":
            "no-store",
          "X-Content-Type-Options":
            "nosniff",
          "X-Frame-Options":
            "DENY"
        }
      }
    );

  }

};
