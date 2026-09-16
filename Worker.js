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

  const languageInstruction = {
    fr: "Répondre principalement en français.",
    ar: "Répondre principalement en arabe. Conserver les noms officiels français lorsque nécessaire et expliquer leur sens en arabe.",
    en: "Respond primarily in English. Preserve official French names when necessary and explain them in English."
  }[langue] || "Répondre principalement en français.";

  return `
Tu es Go Rare AI, un moteur d'orientation et d'intelligence de situation.

${languageInstruction}

PRINCIPES ABSOLUS :

1. Ne jamais inventer une loi, une procédure, une condition administrative,
   un délai, un droit ou une obligation.

2. Les informations certaines doivent être séparées des informations
   à vérifier et des déductions.

3. Les sources officielles sont prioritaires.

4. Le Decision Engine déterministe contrôle le parcours conversationnel.
   Le modèle IA ne doit jamais décider de remplacer une question
   déterministe par une autre.

5. Ne repose pas une question dont la réponse est déjà explicitement connue.

6. Si l'utilisateur a explicitement indiqué :
   - sans diplôme
   - sans expérience
   ne lui demande pas à nouveau ces informations.

7. Ne transforme jamais automatiquement une recherche d'emploi en création
   d'entreprise simplement parce qu'un mot comme "entreprise" apparaît.

8. Pour les questions concernant l'immigration, le séjour ou le travail
   d'un étranger, indique clairement ce qui doit être vérifié auprès
   des sources officielles.

9. Ne prétends jamais avoir consulté une source en temps réel si ce n'est
   pas réellement le cas.

10. Ne présente jamais une déduction comme un fait confirmé.

11. Si une information manque, utilise la question fournie par le
    Decision Engine.

12. Les réponses doivent être concrètes, compréhensibles et orientées
    vers les prochaines étapes.

13. Go Rare AI cherche également les transformations possibles :
    expérience informelle → compétence transférable,
    contrainte → possibilité,
    combinaison de plusieurs éléments → nouvelle piste.

14. Toute piste de transformation doit rester explicable et ne doit pas
    être présentée comme une garantie.

DECISION ACTUELLE :
${JSON.stringify(decision)}

ÉTAT :
${JSON.stringify(etat)}

Réponds de manière concise mais utile.
`;
}

/* =========================================================
   AI HELPER
   ========================================================= */

async function askAI(env, messages, options = {}) {
  const safeMessages = safeArray(messages)
    .slice(-LIMITS.messages)
    .map(message => ({
      role: message?.role === "assistant"
        ? "assistant"
        : "user",
      content: cleanText(
        message?.content || message?.text || "",
        LIMITS.message
      )
    }))
    .filter(message => message.content);

  if (!safeMessages.length) {
    return "";
  }

  const result = await env.IA.run(
    MODEL,
    {
      messages: safeMessages,
      max_tokens: Math.min(
        Number(options.max_tokens || 1600),
        3000
      ),
      temperature:
        typeof options.temperature === "number"
          ? Math.min(Math.max(options.temperature, 0), 0.5)
          : 0.15
    }
  );

  return cleanText(
    result?.response || "",
    18000
  );
}

/* =========================================================
   EMPLOYMENT ORIENTATION
   ========================================================= */

function construireOrientationEmploi(etat) {
  const info = etat.informations || {};

  return {
    domaine: "emploi",
    faits_confirmes: confirmed(etat),

    profil: {
      diplome: info.diplome || null,
      experience: info.experience || null,
      zone_recherche: info.zone_recherche || null,
      type_emploi: info.type_emploi || null,
      mobilite: info.mobilite || null,
      horaires: info.horaires || null,
      ouvert_tous_secteurs:
        info.ouvert_tous_secteurs === true
    },

    prochaines_actions: actions(etat),

    verification_documents: documents(etat),

    pistes: recommendations(etat)
  };
}

/* =========================================================
   MESSAGE MODE
   ========================================================= */

function messagePrompt(mode, text, langue) {
  const instructions = {
    analyse: `
Analyse le contenu fourni.
Identifie les éléments importants, les faits explicites,
les informations manquantes et les points à vérifier.
`,

    reponse: `
Rédige une réponse claire et naturelle au message fourni.
Ne crée aucune information qui n'est pas présente.
`,

    reformulation: `
Reformule le texte de manière plus claire et professionnelle
sans modifier son sens.
`,

    correction: `
Corrige les fautes de langue et améliore légèrement la formulation
sans changer le contenu.
`,

    traduction: `
Traduis fidèlement le texte.
Conserve les noms propres, noms officiels et références importantes.
`
  };

  return `
Langue : ${normalizeLanguage(langue)}

Mode :
${instructions[mode] || instructions.analyse}

Texte :
${cleanText(text, LIMITS.message)}
`;
}

/* =========================================================
   IMAGE ANALYSIS
   ========================================================= */

async function analyserImage(env, imageBase64, question = "", langue = "fr") {
  const image = cleanText(imageBase64, LIMITS.image);

  if (!image) {
    throw new Error("Image manquante.");
  }

  const prompt = `
Tu es Go Rare AI.

Analyse uniquement ce qui est réellement visible ou lisible
dans l'image.

Ne devine pas les informations illisibles.

Si l'image contient un document :
- identifier les informations visibles,
- distinguer les faits certains,
- signaler les éléments difficiles à lire,
- ne pas inventer les champs manquants.

Si l'image contient une situation visuelle :
- décrire les éléments utiles,
- identifier les indices pertinents,
- ne pas présenter une supposition comme un fait.

Langue de réponse : ${normalizeLanguage(langue)}

Question de l'utilisateur :
${cleanText(question, 5000)}
`;

  const result = await env.IA.run(
    MODEL_VISION,
    {
      messages: [
        {
          role: "system",
          content: prompt
        },
        {
          role: "user",
          content: "Analyse cette image."
        }
      ],
      image,
      max_tokens: 2200,
      temperature: 0.1
    }
  );

  return cleanText(
    result?.response || "",
    18000
  );
}

/* =========================================================
   AUDIO / WHISPER
   ========================================================= */

async function transcrireAudio(env, audioData, language = null) {
  if (!audioData) {
    throw new Error("Audio manquant.");
  }

  const payload = {
    audio: audioData,
    task: "transcribe",
    condition_on_previous_text: false
  };

  if (language) {
    payload.language = normalizeLanguage(language);
  }

  const result = await env.IA.run(
    MODEL_AUDIO,
    payload
  );

  const transcription =
    result?.transcription_info?.text ||
    result?.text ||
    "";

  return cleanText(
    transcription,
    LIMITS.question
  );
}

/* =========================================================
   MAIN QUESTION ANALYSIS
   ========================================================= */

async function analyserQuestion(env, payload) {
  const question = cleanText(
    payload?.question || "",
    LIMITS.question
  );

  if (!question) {
    throw new Error("Question vide.");
  }

  const history = safeArray(payload?.history);

  const informations =
    payload?.informations &&
    typeof payload.informations === "object"
      ? payload.informations
      : {};

  const documentInfo =
    payload?.documentInfo &&
    typeof payload.documentInfo === "object"
      ? payload.documentInfo
      : {};

  const profil = cleanText(
    payload?.profil || "",
    100
  ) || null;

  const situation = cleanText(
    payload?.situation || "",
    100
  ) || null;

  const langue = normalizeLanguage(
    payload?.langue ||
    detectLanguage(question)
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

  /* ---------------------------------------------------------
     QUESTION MODE
     --------------------------------------------------------- */

  if (decision.etape === "question") {
    return {
      version: VERSION,
      decision_version: DECISION_VERSION,

      etape: "question",

      question: decision.question,

      questionKey: decision.questionKey,

      champsManquants:
        decision.champsManquants,

      informations:
        etat.informations,

      contexte:
        etat.contexte,

      sources:
        selectSources(etat),

      confirmed:
        confirmed(etat),

      documents:
        documents(etat),

      actions:
        actions(etat),

      recommendations:
        recommendations(etat)
    };
  }

  /* ---------------------------------------------------------
     ORIENTATION MODE
     --------------------------------------------------------- */

  let orientation;

  if (
    etat.contexte.emploi ||
    etat.contexte.travail
  ) {
    orientation =
      construireOrientationEmploi(etat);
  } else {
    orientation = {
      domaine:
        etat.contexte.entreprise
          ? "entreprise"
          : etat.contexte.immigration
            ? "immigration"
            : "general",

      faits_confirmes:
        confirmed(etat),

      prochaines_actions:
        actions(etat),

      verification_documents:
        documents(etat),

      pistes:
        recommendations(etat)
    };
  }

  const aiMessages = [
    {
      role: "system",
      content: systemPrompt(
        etat,
        decision
      )
    },
    {
      role: "user",
      content: `
Voici la situation de l'utilisateur.

Produis une orientation utile à partir
des informations confirmées.

Ne repose pas les questions déjà résolues.

Structure la réponse en :
1. Compréhension de la situation
2. Ce qui est confirmé
3. Ce qui doit être vérifié
4. Prochaines étapes
5. Pistes ou transformations possibles

Situation :
${JSON.stringify(orientation)}
`
    }
  ];

  let aiResponse = "";

  try {
    aiResponse = await askAI(
      env,
      aiMessages,
      {
        max_tokens: 1800,
        temperature: 0.15
      }
    );
  } catch (error) {
    /*
     * AI failure must not destroy the deterministic result.
     */
    aiResponse = "";
  }

  return {
    version: VERSION,
    decision_version: DECISION_VERSION,

    etape: "orientation",

    informations:
      etat.informations,

    contexte:
      etat.contexte,

    confirmed:
      confirmed(etat),

    documents:
      documents(etat),

    actions:
      actions(etat),

    recommendations:
      recommendations(etat),

    orientation,

    aiResponse
  };
}

/* =========================================================
   HTML ESCAPING
   ========================================================= */

function escapeHTML(value) {
  return String(value ?? "")
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

  return `
    <div class="sources">
      <h3>Sources</h3>
      <ul>
        ${list.map(source => `
          <li>
            <a
              href="${escapeHTML(source.url)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${escapeHTML(source.name)}
            </a>
          </li>
        `).join("")}
      </ul>
    </div>
  `;
}

/* =========================================================
   RESULT HTML
   ========================================================= */

function resultHTML(data) {
  const confirmedData =
    safeArray(data.confirmed);

  const actionsData =
    safeArray(data.actions);

  const recommendationsData =
    safeArray(data.recommendations);

  const documentsData =
    safeArray(data.documents);

  let html = "";

  if (data.etape === "question") {
    html += `
      <div class="result-card question-result">
        <div class="eyebrow">Étape suivante</div>
        <h2>${escapeHTML(data.question)}</h2>

        ${
          data.champsManquants?.length
            ? `
              <div class="missing">
                Informations encore nécessaires :
                ${escapeHTML(
                  data.champsManquants.join(", ")
                )}
              </div>
            `
            : ""
        }
      </div>
    `;

    html += sourceHTML(data.sources);

    return html;
  }

  html += `
    <div class="result-card">
      <div class="eyebrow">Go Rare AI</div>
      <h2>Analyse de votre situation</h2>

      ${
        data.aiResponse
          ? `
            <div class="ai-response">
              ${escapeHTML(data.aiResponse)
                .replace(/\n/g, "<br>")}
            </div>
          `
          : ""
      }
    </div>
  `;

  if (confirmedData.length) {
    html += `
      <div class="result-card">
        <h3>Informations confirmées</h3>

        <div class="confirmed-grid">
          ${confirmedData.map(item => `
            <div class="confirmed-item">
              <strong>
                ${escapeHTML(item.label)}
              </strong>

              <span>
                ${escapeHTML(item.value)}
              </span>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  if (actionsData.length) {
    html += `
      <div class="result-card">
        <h3>Prochaines étapes</h3>

        <ul>
          ${actionsData.map(item => `
            <li>${escapeHTML(item)}</li>
          `).join("")}
        </ul>
      </div>
    `;
  }

  if (documentsData.length) {
    html += `
      <div class="result-card">
        <h3>Points à vérifier</h3>

        ${documentsData.map(group => `
          <div class="document-group">
            <strong>
              ${escapeHTML(group.title)}
            </strong>

            <ul>
              ${safeArray(group.items).map(item => `
                <li>${escapeHTML(item)}</li>
              `).join("")}
            </ul>
          </div>
        `).join("")}
      </div>
    `;
  }

  if (recommendationsData.length) {
    html += `
      <div class="result-card">
        <h3>Pistes possibles</h3>

        ${recommendationsData.map(item => `
          <div class="recommendation">
            <strong>
              ${escapeHTML(item.title)}
            </strong>

            <p>
              ${escapeHTML(item.text)}
            </p>
          </div>
        `).join("")}
      </div>
    `;
  }

  html += sourceHTML(
    data.sources ||
    []
  );

  return html;
}

/* =========================================================
   MAIN HTML PAGE
   ========================================================= */

function pageHTML() {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<title>Go Rare AI</title>

<meta
  name="description"
  content="Go Rare AI — intelligence de situation, orientation et transformation."
/>

<style>

:root{
  --bg:#f7f8fa;
  --card:#ffffff;
  --text:#111827;
  --muted:#6b7280;
  --border:#e5e7eb;
  --accent:#111827;
  --gold:#c9a227;
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
    sans-serif;
  background:var(--bg);
  color:var(--text);
}

body::selection{
  background:#111827;
  color:#fff;
}

.container{
  width:min(1100px,92%);
  margin:auto;
}

header{
  padding:34px 0 20px;
}

.brand{
  display:flex;
  align-items:center;
  gap:8px;
  font-size:28px;
  font-weight:800;
  letter-spacing:-.7px;
}

.brand .rare{
  position:relative;
}

.brand .spark{
  position:absolute;
  width:4px;
  height:4px;
  border-radius:50%;
  background:var(--gold);
  box-shadow:
    0 0 7px rgba(201,162,39,.65);
}

.brand .spark.one{
  top:-5px;
  left:1px;
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
  margin-top:7px;
  color:var(--muted);
  font-size:14px;
}

.card{
  background:var(--card);
  border:1px solid var(--border);
  border-radius:18px;
  padding:20px;
  margin:18px 0;
}

.profile-grid{
  display:grid;
  grid-template-columns:
    repeat(auto-fit,minmax(180px,1fr));
  gap:12px;
}

button,
select,
textarea{
  font:inherit;
}

button{
  border:0;
  border-radius:12px;
  padding:12px 15px;
  cursor:pointer;
}

.primary{
  background:#111827;
  color:white;
}

.secondary{
  background:#f3f4f6;
  color:#111827;
}

button:hover{
  opacity:.9;
}

textarea{
  width:100%;
  min-height:120px;
  resize:vertical;
  border:1px solid var(--border);
  border-radius:14px;
  padding:14px;
  outline:none;
}

textarea:focus{
  border-color:#9ca3af;
}

.actions{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin-top:10px;
}

.hidden{
  display:none !important;
}

/*
 * Sticky composer.
 * Kept deliberately subtle so it feels like a modern
 * conversational interface rather than an intrusive popup.
 */
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

#result{
  scroll-margin-top:20px;
}

.result-card{
  background:white;
  border:1px solid var(--border);
  border-radius:18px;
  padding:20px;
  margin:16px 0;
  scroll-margin-top:20px;
}

.result-card h2{
  margin-top:6px;
}

.result-card h3{
  margin-top:0;
}

.eyebrow{
  color:var(--muted);
  font-size:12px;
  text-transform:uppercase;
  letter-spacing:.08em;
}

.confirmed-grid{
  display:grid;
  grid-template-columns:
    repeat(auto-fit,minmax(200px,1fr));
  gap:10px;
}

.confirmed-item{
  border:1px solid var(--border);
  border-radius:12px;
  padding:12px;
}

.confirmed-item strong{
  display:block;
  font-size:13px;
  color:var(--muted);
}

.confirmed-item span{
  display:block;
  margin-top:4px;
}

.sources{
  background:#f9fafb;
  border:1px solid var(--border);
  border-radius:14px;
  padding:15px;
  margin:16px 0;
}

.sources h3{
  margin-top:0;
}

.sources a{
  color:#111827;
}

.cancer{
  position:fixed;
  right:14px;
  bottom:14px;
  z-index:30;

  background:#fff;
  border:1px solid #e5e7eb;
  border-radius:14px;
  padding:10px 13px;

  font-size:12px;
  box-shadow:0 8px 25px rgba(0,0,0,.12);
}

@media(max-width:600px){

  header{
    padding-top:24px;
  }

  .brand{
    font-size:24px;
  }

  .card,
  .result-card{
    border-radius:15px;
    padding:16px;
  }

  #outil{
    bottom:8px;
  }

  .cancer{
    right:8px;
    bottom:8px;
  }
}

</style>
</head>

<body>

<div class="container">

<header>
  <div class="brand">
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
    Comprendre votre situation. Trouver les possibilités. Agir.
  </div>
</header>

<div id="accueil" class="card">

  <h2>Que pouvons-nous comprendre ensemble ?</h2>

  <div class="profile-grid">

    <button
      class="secondary"
      onclick="openProfil('particulier')"
    >
      👤 Particulier
    </button>

    <button
      class="secondary"
      onclick="openProfil('emploi')"
    >
      💼 Emploi
    </button>

    <button
      class="secondary"
      onclick="openProfil('migrant')"
    >
      🌍 Immigration
    </button>

    <button
      class="secondary"
      onclick="openProfil('entreprise')"
    >
      🏢 Entreprise
    </button>

  </div>

</div>

<div id="outil" class="card hidden">

  <button
    class="secondary"
    onclick="retourAccueil()"
  >
    ← Retour
  </button>

  <div style="margin-top:12px">

    <textarea
      id="question"
      placeholder="Expliquez votre situation..."
    ></textarea>

    <div class="actions">

      <button
        class="primary"
        onclick="analyserTexte()"
      >
        Analyser
      </button>

      <button
        class="secondary"
        onclick="document.getElementById('imageInput').click()"
      >
        📷 Image
      </button>

      <button
        class="secondary"
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
    >

    <div
      id="status"
      style="
        margin-top:10px;
        color:#6b7280;
        font-size:13px;
      "
    ></div>

  </div>

</div>

<div id="result"></div>

</div>

<div class="cancer">
  🎗️ Avec vous contre le cancer
</div>

<script>

let profilActuel = null;
let situationActuelle = null;
let historique = [];

const question =
  document.getElementById("question");

const result =
  document.getElementById("result");

const status =
  document.getElementById("status");

const outil =
  document.getElementById("outil");

const accueil =
  document.getElementById("accueil");

const imageInput =
  document.getElementById("imageInput");

/* =======================================================
   PROFILE
   ======================================================= */

function openProfil(profil){

  profilActuel = profil;
  situationActuelle = null;

  historique = [];

  accueil.classList.add("hidden");
  outil.classList.remove("hidden");

  result.innerHTML = "";

  setTimeout(function(){

    try{
      question.focus({
        preventScroll:true
      });
    }catch(e){
      question.focus();
    }

  },100);
}

/* =======================================================
   RETURN
   ======================================================= */

function retourAccueil(){

  profilActuel = null;
  situationActuelle = null;
  historique = [];

  outil.classList.add("hidden");
  accueil.classList.remove("hidden");

  result.innerHTML = "";

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });
}

/* =======================================================
   ANALYZE
   ======================================================= */

async function analyserTexte(){

  const text =
    question.value.trim();

  if(!text){

    status.textContent =
      "Veuillez décrire votre situation.";

    return;
  }

  status.textContent =
    "Analyse en cours…";

  const previous =
    historique.slice(-20);

  try{

    const response =
      await fetch("/api/analyze",{

        method:"POST",

        headers:{
          "Content-Type":
            "application/json"
        },

        body:JSON.stringify({

          question:text,

          history:previous,

          profil:profilActuel,

          situation:situationActuelle,

          langue:
            navigator.language || "fr"

        })

      });

    const data =
      await response.json();

    if(!response.ok){

      throw new Error(
        data?.error ||
        "Erreur d'analyse."
      );

    }

    historique.push({
      role:"user",
      content:text
    });

    if(data.question){

      historique.push({
        role:"assistant",
        content:data.question
      });

    }

    afficher(data);

    question.value = "";

    status.textContent = "";

    setTimeout(function(){

      try{
        question.focus({
          preventScroll:true
        });
      }catch(e){
        question.focus();
      }

    },500);

  }catch(error){

    status.textContent =
      error?.message ||
      "Une erreur est survenue.";
  }
}

/* =======================================================
   DISPLAY
   ======================================================= */

function afficher(data){

  result.innerHTML =
    resultHTMLClient(data);

  requestAnimationFrame(function(){

    const firstResult =
      result.querySelector(".result-card");

    if(firstResult){

      firstResult.scrollIntoView({

        behavior:"smooth",

        block:"start"

      });

    }

  });
}

/*
 * Client-side rendering.
 * We keep this separate from server-side resultHTML()
 * so user-provided content is escaped again in the browser.
 */

function resultHTMLClient(data){

  let html = "";

  if(data.etape === "question"){

    html += `
      <div class="result-card">

        <div class="eyebrow">
          Étape suivante
        </div>

        <h2>
          ${escapeClient(
            data.question || ""
          )}
        </h2>

      </div>
    `;

    if(
      Array.isArray(data.sources) &&
      data.sources.length
    ){

      html += sourcesClient(
        data.sources
      );

    }

    return html;
  }

  if(data.aiResponse){

    html += `
      <div class="result-card">

        <div class="eyebrow">
          Go Rare AI
        </div>

        <h2>
          Analyse de votre situation
        </h2>

        <div>
          ${escapeClient(
            data.aiResponse
          ).replace(/\n/g,"<br>")}
        </div>

      </div>
    `;
  }

  if(
    Array.isArray(data.confirmed) &&
    data.confirmed.length
  ){

    html += `
      <div class="result-card">

        <h3>
          Informations confirmées
        </h3>

        <div class="confirmed-grid">

          ${data.confirmed.map(item => `

            <div class="confirmed-item">

              <strong>
                ${escapeClient(
                  item.label
                )}
              </strong>

              <span>
                ${escapeClient(
                  item.value
                )}
              </span>

            </div>

          `).join("")}

        </div>

      </div>
    `;
  }

  if(
    Array.isArray(data.actions) &&
    data.actions.length
  ){

    html += `
      <div class="result-card">

        <h3>
          Prochaines étapes
        </h3>

        <ul>

          ${data.actions.map(item => `
            <li>
              ${escapeClient(item)}
            </li>
          `).join("")}

        </ul>

      </div>
    `;
  }

  if(
    Array.isArray(data.recommendations) &&
    data.recommendations.length
  ){

    html += `
      <div class="result-card">

        <h3>
          Pistes possibles
        </h3>

        ${data.recommendations.map(item => `

          <div
            style="
              margin-bottom:14px;
              padding-bottom:14px;
              border-bottom:
                1px solid #e5e7eb;
            "
          >

            <strong>
              ${escapeClient(
                item.title || ""
              )}
            </strong>

            <p>
              ${escapeClient(
                item.text || ""
              )}
            </p>

          </div>

        `).join("")}

      </div>
    `;
  }

  if(
    Array.isArray(data.sources) &&
    data.sources.length
  ){

    html += sourcesClient(
      data.sources
    );

  }

  return html;
}

/* =======================================================
   SAFE CLIENT ESCAPE
   ======================================================= */

function escapeClient(value){

  return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

/* =======================================================
   SOURCES
   ======================================================= */

function sourcesClient(sources){

  return `
    <div class="sources">

      <h3>
        Sources
      </h3>

      <ul>

        ${sources.map(source => `

          <li>

            <a
              href="${escapeClient(
                source.url || "#"
              )}"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${escapeClient(
                source.name || ""
              )}
            </a>

          </li>

        `).join("")}

      </ul>

    </div>
  `;
}

/* =======================================================
   IMAGE
   ======================================================= */

imageInput.addEventListener(
  "change",
  async function(){

    const file =
      imageInput.files?.[0];

    if(!file){
      return;
    }

    status.textContent =
      "Analyse de l'image…";

    try{

      const base64 =
        await fileToBase64(file);

      const response =
        await fetch("/api/image",{

          method:"POST",

          headers:{
            "Content-Type":
              "application/json"
          },

          body:JSON.stringify({

            image:base64,

            question:
              question.value.trim(),

            langue:
              navigator.language || "fr"

          })

        });

      const data =
        await response.json();

      if(!response.ok){

        throw new Error(
          data?.error ||
          "Impossible d'analyser l'image."
        );

      }

      result.innerHTML = `
        <div class="result-card">

          <div class="eyebrow">
            Analyse visuelle
          </div>

          <h2>
            Résultat
          </h2>

          <div>
            ${escapeClient(
              data.response || ""
            ).replace(/\n/g,"<br>")}
          </div>

        </div>
      `;

      requestAnimationFrame(function(){

        const firstResult =
          result.querySelector(".result-card");

        if(firstResult){

          firstResult.scrollIntoView({

            behavior:"smooth",

            block:"start"

          });

        }

      });

    }catch(error){

      status.textContent =
        error?.message ||
        "Erreur lors de l'analyse de l'image.";

    }finally{

      imageInput.value = "";

    }

  }
);

/* =======================================================
   FILE → BASE64
   ======================================================= */

function fileToBase64(file){

  return new Promise(
    function(resolve,reject){

      const reader =
        new FileReader();

      reader.onload =
        function(){

          const value =
            String(reader.result || "");

          const comma =
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

    }
  );
}

/* =======================================================
   MICROPHONE
   ======================================================= */

async function activerMicro(){

  if(!navigator.mediaDevices?.getUserMedia){

    status.textContent =
      "Le microphone n'est pas disponible sur cet appareil.";

    return;
  }

  status.textContent =
    "Préparation du microphone…";

  let stream;

  try{

    stream =
      await navigator.mediaDevices.getUserMedia({
        audio:true
      });

    const recorder =
      new MediaRecorder(stream);

    const chunks = [];

    recorder.ondataavailable =
      function(event){

        if(event.data.size){
          chunks.push(event.data);
        }

      };

    recorder.onstop =
      async function(){

        stream
          .getTracks()
          .forEach(track => track.stop());

        const blob =
          new Blob(
            chunks,
            {
              type:
                recorder.mimeType ||
                "audio/webm"
            }
          );

        status.textContent =
          "Transcription…";

        try{

          const base64 =
            await blobToBase64(blob);

          const response =
            await fetch(
              "/api/transcribe",
              {

                method:"POST",

                headers:{
                  "Content-Type":
                    "application/json"
                },

                body:JSON.stringify({

                  audio:base64,

                  language:
                    navigator.language || "fr"

                })

              }
            );

          const data =
            await response.json();

          if(!response.ok){

            throw new Error(
              data?.error ||
              "Erreur de transcription."
            );

          }

          question.value =
            data.text || "";

          status.textContent =
            "Transcription terminée.";

          try{
            question.focus({
              preventScroll:true
            });
          }catch(e){
            question.focus();
          }

        }catch(error){

          status.textContent =
            error?.message ||
            "Erreur de transcription.";

        }

      };

    recorder.start();

    status.textContent =
      "🎙️ Enregistrement… Appuyez de nouveau sur Micro pour arrêter.";

    window.__goRareRecorder =
      recorder;

    window.__goRareRecording =
      true;

  }catch(error){

    status.textContent =
      "Autorisation microphone refusée ou indisponible.";

  }
}

/*
 * Second press stops the current recording.
 */
const originalMicro =
  activerMicro;

window.activerMicro =
  function(){

    if(
      window.__goRareRecording &&
      window.__goRareRecorder
    ){

      window.__goRareRecorder.stop();

      window.__goRareRecorder = null;
      window.__goRareRecording = false;

      return;
    }

    originalMicro();

  };

/* =======================================================
   BLOB → BASE64
   ======================================================= */

function blobToBase64(blob){

  return new Promise(
    function(resolve,reject){

      const reader =
        new FileReader();

      reader.onload =
        function(){

          const value =
            String(reader.result || "");

          const comma =
            value.indexOf(",");

          resolve(
            comma >= 0
              ? value.slice(comma + 1)
              : value
          );

        };

      reader.onerror =
        reject;

      reader.readAsDataURL(blob);

    }
  );
}

</script>

</body>
</html>`;
}

/* =========================================================
   ROUTER
   ========================================================= */

export default {

  async fetch(request, env) {

    const url =
      new URL(request.url);

    const method =
      request.method.toUpperCase();

    /*
     * Basic rate limiting for API endpoints.
     */
    if(
      url.pathname.startsWith("/api/") &&
      !checkRateLimit(request)
    ){

      return json(
        {
          error:
            "Trop de requêtes. Veuillez patienter."
        },
        429,
        {
          "Retry-After":"60"
        }
      );

    }

    /* -----------------------------------------------------
       HOME
       ----------------------------------------------------- */

    if(
      url.pathname === "/" &&
      method === "GET"
    ){

      return new Response(
        pageHTML(),
        {
          status:200,
          headers:{
            ...securityHeaders(),
            "Content-Type":
              "text/html; charset=utf-8"
          }
        }
      );

    }

    /* -----------------------------------------------------
       HEALTH
       ----------------------------------------------------- */

    if(
      url.pathname === "/health" &&
      method === "GET"
    ){

      return json({

        ok:true,

        service:"Go Rare AI",

        version:VERSION,

        decision_version:
          DECISION_VERSION,

        models:{
          text:MODEL,
          vision:MODEL_VISION,
          audio:MODEL_AUDIO
        }

      });

    }

    /* -----------------------------------------------------
       ANALYZE
       ----------------------------------------------------- */

    if(
      url.pathname === "/api/analyze" &&
      method === "POST"
    ){

      try{

        const payload =
          await request.json();

        const result =
          await analyserQuestion(
            env,
            payload
          );

        return json(result);

      }catch(error){

        return json(
          {
            error:
              error?.message ||
              "Erreur d'analyse."
          },
          400
        );

      }

    }

    /* -----------------------------------------------------
       IMAGE
       ----------------------------------------------------- */

    if(
      url.pathname === "/api/image" &&
      method === "POST"
    ){

      try{

        const payload =
          await request.json();

        const image =
          cleanText(
            payload?.image || "",
            LIMITS.image
          );

        if(!image){

          return json(
            {
              error:"Image manquante."
            },
            400
          );

        }

        const response =
          await analyserImage(
            env,
            image,
            payload?.question || "",
            payload?.langue || "fr"
          );

        return json({
          response
        });

      }catch(error){

        return json(
          {
            error:
              error?.message ||
              "Erreur d'analyse de l'image."
          },
          400
        );

      }

    }

    /* -----------------------------------------------------
       TRANSCRIBE
       ----------------------------------------------------- */

    if(
      url.pathname === "/api/transcribe" &&
      method === "POST"
    ){

      try{

        const payload =
          await request.json();

        const audio =
          payload?.audio || "";

        if(!audio){

          return json(
            {
              error:"Audio manquant."
            },
            400
          );

        }

        const text =
          await transcrireAudio(
            env,
            audio,
            payload?.language || null
          );

        return json({
          text
        });

      }catch(error){

        return json(
          {
            error:
              error?.message ||
              "Erreur de transcription."
          },
          400
        );

      }

    }

    /* -----------------------------------------------------
       404
       ----------------------------------------------------- */

    return json(
      {
        error:"Not found"
      },
      404
    );

  }

};
