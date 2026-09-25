const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const MODEL_VISION = "@cf/meta/llama-3.2-11b-vision-instruct";
const MODEL_AUDIO = "@cf/openai/whisper-large-v3-turbo";

const VERSION = "11.0.0";
const DECISION_VERSION = "11.0.0";

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
  windowMs: 60000
};

const rateStore = new Map();
const franceTravailTokenCache = new Map();

const SOURCES = {
  franceTravail: {
    name: "France Travail",
    url: "https://www.francetravail.fr/"
  },
  franceTravailOffers: {
    name: "France Travail — Offres",
    url: "https://candidat.francetravail.fr/offres/recherche"
  },
  franceTravailAPI: {
    name: "France Travail API",
    url: "https://francetravail.io/"
  },
  anef: {
    name: "ANEF",
    url: "https://administration-etrangers-en-france.interieur.gouv.fr/"
  },
  travailEtranger: {
    name: "Service-Public — Travail des étrangers",
    url: "https://www.service-public.fr/particuliers/vosdroits/N107"
  },
  servicePublic: {
    name: "Service-Public.fr",
    url: "https://www.service-public.fr/"
  },
  entreprise: {
    name: "Entreprendre.Service-Public.fr",
    url: "https://entreprendre.service-public.fr/"
  },
  guichet: {
    name: "Guichet unique",
    url: "https://formalites.entreprises.gouv.fr/"
  }
};

const LANGUAGES = ["fr", "ar", "en", "es", "it", "de", "pt", "nl"];

const UI = {
  fr: {
    title: "Go Rare AI",
    subtitle: "Comprendre votre situation. Voir plus loin.",
    analyze: "Analyser",
    image: "Image",
    microphone: "Micro",
    stop: "Stop",
    placeholder: "Décrivez votre situation...",
    particulier: "Particulier",
    situation: "Situation",
    result: "Résultat",
    confirmed: "Ce que vous avez indiqué",
    verify: "À vérifier",
    missing: "Information manquante",
    sources: "Sources",
    actions: "Prochaine action",
    recommendations: "Pistes",
    opportunities: "Opportunités",
    billing: "Compte",
    secure: "Protection et prudence",
    connect: "Connecter mon compte",
    logout: "Déconnexion",
    notConnected: "Non connecté",
    connected: "Compte connecté",
    searching: "Analyse en cours...",
    ready: "Prêt.",
    error: "Une erreur est survenue.",
    journey: "Parcours",
    understanding: "Compréhension",
    verification: "Vérification",
    search: "Recherche",
    comparison: "Comparaison",
    action: "Action",
    followup: "Suivi",
    officialReady: "Voir la recherche officielle",
    offersRetrieved: "Offres récupérées depuis la source officielle.",
    noOffers: "Aucune offre exploitable trouvée avec ces critères.",
    compatibility: "Compatibilité indicative",
    compatible: "Des éléments sont compatibles",
    toVerify: "À vérifier",
    lessCompatible: "Des éléments manquent",
    declared: "Déclaré",
    inferred: "Déduit",
    official: "Officiel",
    transformation: "Transformations possibles",
    paths: "Parcours possibles",
    nextAction: "Prochaine action",
    evidenceTrail: "Trace des preuves",
    watch: "Suivi possible",
    domain: "Domaine",
    unknown: "Encore inconnu"
  },

  ar: {
    title: "Go Rare AI",
    subtitle: "نفهم وضعك. ونرى أبعد.",
    analyze: "تحليل",
    image: "صورة",
    microphone: "ميكروفون",
    stop: "إيقاف",
    placeholder: "صف وضعك...",
    particulier: "فرد",
    situation: "الوضعية",
    result: "النتيجة",
    confirmed: "ما صرحت به",
    verify: "ما يحتاج إلى تحقق",
    missing: "معلومة ناقصة",
    sources: "المصادر",
    actions: "الخطوة التالية",
    recommendations: "مسارات ممكنة",
    opportunities: "الفرص",
    billing: "الحساب",
    secure: "الحماية والتنبيه",
    connect: "ربط الحساب",
    logout: "تسجيل الخروج",
    notConnected: "غير متصل",
    connected: "الحساب متصل",
    searching: "جارٍ التحليل...",
    ready: "جاهز.",
    error: "حدث خطأ.",
    journey: "المسار",
    understanding: "الفهم",
    verification: "التحقق",
    search: "البحث",
    comparison: "المقارنة",
    action: "الإجراء",
    followup: "المتابعة",
    officialReady: "فتح البحث الرسمي",
    offersRetrieved: "تم جلب عروض من المصدر الرسمي.",
    noOffers: "لم يتم العثور على عرض قابل للاستغلال بهذه المعايير.",
    compatibility: "التوافق الإرشادي",
    compatible: "توجد عناصر متوافقة",
    toVerify: "يحتاج إلى تحقق",
    lessCompatible: "هناك عناصر ناقصة",
    declared: "مصرح به",
    inferred: "مستنتج",
    official: "رسمي",
    transformation: "إمكانيات التحويل",
    paths: "المسارات الممكنة",
    nextAction: "الخطوة التالية",
    evidenceTrail: "سلسلة الأدلة",
    watch: "إمكانية المتابعة",
    domain: "المجال",
    unknown: "ما زال غير معروف"
  },

  en: {
    title: "Go Rare AI",
    subtitle: "Understand your situation. See further.",
    analyze: "Analyze",
    image: "Image",
    microphone: "Microphone",
    stop: "Stop",
    placeholder: "Describe your situation...",
    particulier: "Individual",
    situation: "Situation",
    result: "Result",
    confirmed: "What you stated",
    verify: "Needs verification",
    missing: "Missing information",
    sources: "Sources",
    actions: "Next action",
    recommendations: "Possible paths",
    opportunities: "Opportunities",
    billing: "Account",
    secure: "Protection and caution",
    connect: "Connect account",
    logout: "Log out",
    notConnected: "Not connected",
    connected: "Account connected",
    searching: "Analyzing...",
    ready: "Ready.",
    error: "An error occurred.",
    journey: "Journey",
    understanding: "Understanding",
    verification: "Verification",
    search: "Search",
    comparison: "Comparison",
    action: "Action",
    followup: "Follow-up",
    officialReady: "Open official search",
    offersRetrieved: "Offers retrieved from the official source.",
    noOffers: "No usable offer was found with these criteria.",
    compatibility: "Indicative compatibility",
    compatible: "Some elements are compatible",
    toVerify: "Needs verification",
    lessCompatible: "Some elements are missing",
    declared: "Declared",
    inferred: "Inferred",
    official: "Official",
    transformation: "Possible transformations",
    paths: "Possible paths",
    nextAction: "Next action",
    evidenceTrail: "Evidence trail",
    watch: "Possible monitoring",
    domain: "Domain",
    unknown: "Still unknown"
  }
};

const LOCATION_ALIASES = {
  "vigneux-sur-seine": "Vigneux-sur-Seine",
  "vignieux-sur-seine": "Vigneux-sur-Seine",
  "paris": "Paris",
  "evry": "Évry-Courcouronnes",
  "évry": "Évry-Courcouronnes",
  "évry-courcouronnes": "Évry-Courcouronnes",
  "corbeil": "Corbeil-Essonnes",
  "corbeil-essonnes": "Corbeil-Essonnes",
  "montgeron": "Montgeron",
  "draveil": "Draveil",
  "juvisy": "Juvisy-sur-Orge",
  "juvisy-sur-orge": "Juvisy-sur-Orge",
  "viry-chatillon": "Viry-Châtillon",
  "viry-châtillon": "Viry-Châtillon",
  "creteil": "Créteil",
  "créteil": "Créteil",
  "melun": "Melun",
  "massy": "Massy",
  "athis-mons": "Athis-Mons",
  "savigny-sur-orge": "Savigny-sur-Orge",
  "yerres": "Yerres",
  "brunoy": "Brunoy",
  "ris-orangis": "Ris-Orangis",
  "epinay-sous-senart": "Épinay-sous-Sénart",
  "épinay-sous-sénart": "Épinay-sous-Sénart"
};

const PARCOURS = {
  emploi: {
    label: "Emploi",
    sources: [
      SOURCES.franceTravail,
      SOURCES.franceTravailOffers
    ]
  },
  formation: {
    label: "Formation",
    sources: [
      SOURCES.franceTravail,
      SOURCES.servicePublic
    ]
  },
  immigration: {
    label: "Immigration / séjour",
    sources: [
      SOURCES.anef,
      SOURCES.travailEtranger,
      SOURCES.servicePublic
    ]
  },
  administratif: {
    label: "Administratif",
    sources: [
      SOURCES.servicePublic
    ]
  },
  entreprise: {
    label: "Entreprise",
    sources: [
      SOURCES.entreprise,
      SOURCES.guichet,
      SOURCES.servicePublic
    ]
  },
  logement: {
    label: "Logement",
    sources: [
      SOURCES.servicePublic
    ]
  },
  social: {
    label: "Social / accompagnement",
    sources: [
      SOURCES.servicePublic
    ]
  },
  etudiant: {
    label: "Étudiant / nouvel arrivant",
    sources: [
      SOURCES.servicePublic,
      SOURCES.anef,
      SOURCES.franceTravail
    ]
  },
  achat: {
    label: "Achat / vente",
    sources: []
  },
  general: {
    label: "Général",
    sources: [
      SOURCES.servicePublic
    ]
  }
};

const QUESTIONS = {
  fr: {
    zone_recherche: "Dans quelle ville ou zone souhaitez-vous agir ou rechercher ?",
    type_emploi: "Quel type de travail recherchez-vous, même sans intitulé précis ?",
    diplome: "Avez-vous un diplôme ou une formation que vous souhaitez utiliser ?",
    experience: "Quelle expérience, même informelle, avez-vous déjà ?",
    mobilite: "Êtes-vous mobile autour de votre zone de recherche ?",
    horaires: "Avez-vous des contraintes ou une flexibilité concernant les horaires ?",
    presence_france: "Êtes-vous actuellement en France ?",
    statut_sejour: "Quel document ou statut de séjour avez-vous actuellement ?",
    entreprise: "Avez-vous déjà une entreprise ou seulement un projet ?",
    formation: "Cherchez-vous une formation précise ou êtes-vous ouvert à plusieurs possibilités ?",
    logement: "Cherchez-vous un logement, une aide au logement ou une solution temporaire ?",
    etudiant: "Êtes-vous étudiant, futur étudiant ou nouvel arrivant en France ?"
  },
  ar: {
    zone_recherche: "في أي مدينة أو منطقة تريد البحث أو التحرك؟",
    type_emploi: "ما نوع العمل الذي تبحث عنه، حتى لو لم يكن لديك اسم وظيفة محدد؟",
    diplome: "هل لديك شهادة أو تكوين تريد الاستفادة منه؟",
    experience: "ما الخبرة التي لديك، حتى لو كانت غير رسمية؟",
    mobilite: "هل يمكنك التنقل حول منطقة البحث؟",
    horaires: "هل لديك قيود أو مرونة في أوقات العمل؟",
    presence_france: "هل أنت حاليًا في فرنسا؟",
    statut_sejour: "ما هي وثيقة أو وضعية الإقامة التي لديك حاليًا؟",
    entreprise: "هل لديك شركة بالفعل أم مجرد مشروع؟",
    formation: "هل تبحث عن تكوين محدد أم أنك منفتح على عدة إمكانيات؟",
    logement: "هل تبحث عن سكن أو مساعدة للسكن أو حل مؤقت؟",
    etudiant: "هل أنت طالب أو طالب مستقبلي أو وافد جديد إلى فرنسا؟"
  },
  en: {
    zone_recherche: "Which city or area do you want to search or act in?",
    type_emploi: "What kind of work are you looking for, even without an exact job title?",
    diplome: "Do you have a diploma or training you want to use?",
    experience: "What experience do you already have, including informal experience?",
    mobilite: "Can you travel around your search area?",
    horaires: "Do you have schedule constraints or flexibility?",
    presence_france: "Are you currently in France?",
    statut_sejour: "What residence document or status do you currently have?",
    entreprise: "Do you already have a company or only a project?",
    formation: "Are you looking for a specific training course or open to several possibilities?",
    logement: "Are you looking for housing, housing assistance, or a temporary solution?",
    etudiant: "Are you a student, future student, or newcomer in France?"
  }
};

function cleanText(value, max = LIMITS.message) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function safeArray(value, max = 40) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, max);
}

function uniqueArray(items) {
  return [...new Set(
    safeArray(items, 1000)
      .map(x => cleanText(x, 500))
      .filter(Boolean)
  )];
}

function isPlainObject(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function containsAny(text, terms) {
  const value = normalizeSearchText(text);
  return terms.some(term =>
    value.includes(normalizeSearchText(term))
  );
}

function normalizeLanguage(language) {
  const value = String(language || "")
    .toLowerCase()
    .slice(0, 2);

  return LANGUAGES.includes(value)
    ? value
    : "fr";
}

function detectLanguage(text) {
  const value = String(text || "");

  if (
    /[\u0600-\u06ff]/.test(value)
  ) {
    return "ar";
  }

  if (
    /\b(the|and|with|job|work|student|training)\b/i.test(value)
  ) {
    return "en";
  }

  return "fr";
}

function normalizeSearchText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9\u0600-\u06ff\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normaliserLieu(value) {
  const raw = normalizeSearchText(value);

  if (!raw) return "";

  if (LOCATION_ALIASES[raw]) {
    return LOCATION_ALIASES[raw];
  }

  for (const [alias, canonical] of Object.entries(
    LOCATION_ALIASES
  )) {
    if (
      raw === alias ||
      raw.includes(alias)
    ) {
      return canonical;
    }
  }

  return cleanText(value, 120);
}

function extraireMobilite(text) {
  const value = normalizeSearchText(text);

  if (
    containsAny(value, [
      "pas mobile",
      "sans mobilite",
      "ne peux pas me deplacer",
      "transport impossible",
      "لا استطيع التنقل"
    ])
  ) {
    return "limitée";
  }

  if (
    containsAny(value, [
      "mobile",
      "peux me deplacer",
      "transport",
      "voiture",
      "permis",
      "velo",
      "bicyclette",
      "je peux me deplacer",
      "مرن في التنقل",
      "يمكنني التنقل"
    ])
  ) {
    return "oui";
  }

  return "";
}

function extraireInformations(text) {
  const value = normalizeSearchText(text);
  const info = {};

  if (
    containsAny(value, [
      "sans diplome",
      "aucun diplome",
      "pas de diplome",
      "sans qualification",
      "no diploma",
      "no degree",
      "بدون شهادة",
      "لا املك شهادة"
    ])
  ) {
    info.sansDiplome = true;
    info.diplome = "aucun diplôme déclaré";
  }

  if (
    containsAny(value, [
      "sans experience",
      "aucune experience",
      "pas d'experience",
      "no experience",
      "بدون خبرة"
    ])
  ) {
    info.sansExperience = true;
    info.experience = "aucune expérience déclarée";
  }

  if (
    containsAny(value, [
      "n'importe quel travail",
      "tous secteurs",
      "tout secteur",
      "any job",
      "any sector",
      "اي عمل",
      "اي قطاع"
    ])
  ) {
    info.ouvertTousSecteurs = true;
  }

  if (
    containsAny(value, [
      "france",
      "en france",
      "resident en france",
      "je suis en france",
      "في فرنسا"
    ])
  ) {
    info.presenceFrance = true;
  }

  if (
    containsAny(value, [
      "sans papiers",
      "sans document",
      "pas de papiers",
      "aucun document",
      "undocumented",
      "no papers",
      "بدون اوراق",
      "بدون وثائق"
    ])
  ) {
    info.sansDocuments = true;
  }

  const mobility =
    extraireMobilite(text);

  if (mobility) {
    info.mobilite = mobility;
  }

  const locationTerms =
    Object.keys(LOCATION_ALIASES);

  for (const term of locationTerms) {
    if (value.includes(term)) {
      info.zoneRecherche =
        LOCATION_ALIASES[term];
      break;
    }
  }

  const employmentPatterns = [
    ["facteur", "facteur / distribution"],
    ["postal", "distribution / postal"],
    ["livreur", "livraison"],
    ["livraison", "livraison"],
    ["nettoyage", "nettoyage / entretien"],
    ["entretien", "entretien"],
    ["menage", "ménage"],
    ["manutention", "manutention"],
    ["logistique", "logistique"],
    ["restauration", "restauration"],
    ["cuisine", "cuisine"],
    ["magasin", "vente / magasin"],
    ["vente", "vente"],
    ["batiment", "bâtiment"],
    ["chauffeur", "conduite"],
    ["conducteur", "conduite"],
    ["preparateur de commande", "préparation de commandes"]
  ];

  for (const [term, label] of employmentPatterns) {
    if (value.includes(term)) {
      info.typeEmploi = label;
      break;
    }
  }

  if (
    containsAny(value, [
      "horaires flexibles",
      "horaire flexible",
      "tous horaires",
      "peu importe l'horaire",
      "flexible",
      "flexible hours",
      "اي وقت",
      "مرن"
    ])
  ) {
    info.horaires = "flexibles";
  }

  if (
    containsAny(value, [
      "titre de sejour",
      "carte de sejour",
      "visa",
      "residence permit",
      "residence card",
      "titre salarié",
      "salarie",
      "salarié",
      "sejour",
      "إقامة",
      "بطاقة إقامة",
      "فيزا"
    ])
  ) {
    info.statutSejour =
      cleanText(text, 300);
  }

  if (
    containsAny(value, [
      "entreprise",
      "societe",
      "société",
      "micro entreprise",
      "micro-entreprise",
      "auto entrepreneur",
      "auto-entrepreneur",
      "startup",
      "business",
      "شركة",
      "مشروع"
    ])
  ) {
    info.entreprise =
      cleanText(text, 500);
  }

  if (
    containsAny(value, [
      "formation",
      "centre de formation",
      "apprentissage",
      "training",
      "formation professionnelle",
      "تكوين",
      "تدريب"
    ])
  ) {
    info.formation = true;
  }

  if (
    containsAny(value, [
      "etudiant",
      "étudiant",
      "universite",
      "université",
      "campus",
      "student",
      "student visa",
      "طالب",
      "جامعة"
    ])
  ) {
    info.etudiant = true;
  }

  if (
    containsAny(value, [
      "logement",
      "appartement",
      "studio",
      "hebergement",
      "hébergement",
      "housing",
      "rent",
      "سكن",
      "شقة"
    ])
  ) {
    info.logement = true;
  }

  return info;
}

function detectContext(info, question) {
  const value =
    normalizeSearchText(question);

  const context = {
    domain: "general",
    profile: "particulier",
    flags: {}
  };

  if (
    info.entreprise ||
    containsAny(value, [
      "creer une entreprise",
      "créer une entreprise",
      "entreprendre",
      "business",
      "societe",
      "micro entreprise",
      "شركة",
      "مشروع"
    ])
  ) {
    context.domain = "entreprise";
  } else if (
    info.etudiant ||
    containsAny(value, [
      "etudiant",
      "étudiant",
      "student",
      "nouvel arrivant",
      "newcomer",
      "طالب",
      "وافد جديد"
    ])
  ) {
    context.domain = "etudiant";
  } else if (
    info.logement ||
    containsAny(value, [
      "logement",
      "housing",
      "appartement",
      "studio",
      "سكن"
    ])
  ) {
    context.domain = "logement";
  } else if (
    info.formation ||
    containsAny(value, [
      "formation",
      "training",
      "apprentissage",
      "تكوين"
    ])
  ) {
    context.domain = "formation";
  } else if (
    containsAny(value, [
      "titre de sejour",
      "titre séjour",
      "visa",
      "prefecture",
      "préfecture",
      "anef",
      "immigration",
      "residence permit",
      "إقامة",
      "هجرة"
    ])
  ) {
    context.domain = "immigration";
  } else if (
    containsAny(value, [
      "administratif",
      "demarche",
      "démarche",
      "document",
      "formulaire",
      "service public",
      "إجراء",
      "وثيقة"
    ])
  ) {
    context.domain = "administratif";
  } else if (
    info.typeEmploi ||
    containsAny(value, [
      "emploi",
      "travail",
      "job",
      "poste",
      "embauche",
      "recrutement",
      "facteur",
      "livreur",
      "nettoyage",
      "logistique",
      "manutention",
      "وظيفة",
      "عمل"
    ])
  ) {
    context.domain = "emploi";
  }

  context.flags.sansDiplome =
    Boolean(info.sansDiplome);

  context.flags.sansExperience =
    Boolean(info.sansExperience);

  context.flags.sansDocuments =
    Boolean(info.sansDocuments);

  return context;
}

function analyserHistorique(history) {
  const text = safeArray(
    history,
    LIMITS.messages
  )
    .map(item =>
      isPlainObject(item)
        ? cleanText(item.content, 4000)
        : ""
    )
    .filter(Boolean)
    .join("\n");

  return extraireInformations(text);
}

function analyserHistoriqueUtilisateur(history) {
  return analyserHistorique(
    safeArray(history)
      .filter(
        item =>
          !isPlainObject(item) ||
          item.role === "user"
      )
  );
}

function mergeInfo(...objects) {
  const result = {};

  for (const object of objects) {
    if (!isPlainObject(object)) continue;

    for (const [key, value] of Object.entries(object)) {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        result[key] = value;
      }
    }
  }

  return result;
}

function construireEtatConversation(
  question,
  history
) {
  const historyInfo =
    analyserHistoriqueUtilisateur(
      history
    );

  const currentInfo =
    extraireInformations(
      question
    );

  const info =
    mergeInfo(
      historyInfo,
      currentInfo
    );

  const context =
    detectContext(
      info,
      question
    );

  return {
    info,
    context,
    question:
      cleanText(question, LIMITS.question)
  };
}

function questionText(
  language,
  key
) {
  const lang =
    normalizeLanguage(language);

  return (
    QUESTIONS[lang]?.[key] ||
    QUESTIONS.fr[key] ||
    ""
  );
}

function candidatsQuestions(
  state,
  language
) {
  const {
    info,
    context
  } = state;

  const candidates = [];

  if (
    ["emploi", "formation", "etudiant"].includes(
      context.domain
    ) &&
    !info.zoneRecherche
  ) {
    candidates.push("zone_recherche");
  }

  if (
    context.domain === "emploi" &&
    !info.typeEmploi &&
    !info.ouvertTousSecteurs
  ) {
    candidates.push("type_emploi");
  }

  if (
    context.domain === "emploi" &&
    info.sansDiplome === undefined &&
    info.diplome === undefined
  ) {
    candidates.push("diplome");
  }

  if (
    context.domain === "emploi" &&
    info.sansExperience === undefined &&
    info.experience === undefined
  ) {
    candidates.push("experience");
  }

  if (
    context.domain === "emploi" &&
    !info.mobilite
  ) {
    candidates.push("mobilite");
  }

  if (
    context.domain === "emploi" &&
    !info.horaires
  ) {
    candidates.push("horaires");
  }

  if (
    context.domain === "immigration" &&
    info.presenceFrance === undefined
  ) {
    candidates.push("presence_france");
  }

  if (
    context.domain === "immigration" &&
    !info.statutSejour &&
    !info.sansDocuments
  ) {
    candidates.push("statut_sejour");
  }

  if (
    context.domain === "entreprise" &&
    !info.entreprise
  ) {
    candidates.push("entreprise");
  }

  if (
    context.domain === "formation" &&
    !info.formation
  ) {
    candidates.push("formation");
  }

  if (
    context.domain === "logement" &&
    !info.logement
  ) {
    candidates.push("logement");
  }

  if (
    context.domain === "etudiant" &&
    info.etudiant === undefined
  ) {
    candidates.push("etudiant");
  }

  return uniqueArray(
    candidates
  );
}

function construireDecision(
  state,
  language
) {
  const missing =
    candidatsQuestions(
      state,
      language
    );

  if (missing.length) {
    const key = missing[0];

    return {
      type: "question",
      key,
      nextQuestion:
        questionText(
          language,
          key
        ),
      stage: "understanding"
    };
  }

  if (
    state.context.domain ===
    "emploi"
  ) {
    return {
      type: "search",
      stage: "search"
    };
  }

  if (
    [
      "immigration",
      "administratif",
      "entreprise"
    ].includes(
      state.context.domain
    )
  ) {
    return {
      type: "verification",
      stage: "verification"
    };
  }

  return {
    type: "orientation",
    stage: "comparison"
  };
}

function buildDeclaredEvidence(
  info
) {
  const items = [];

  const labels = {
    zoneRecherche: "Zone",
    typeEmploi: "Type de travail",
    diplome: "Diplôme / qualification",
    experience: "Expérience",
    mobilite: "Mobilité",
    horaires: "Horaires",
    statutSejour: "Statut / document",
    formation: "Formation",
    entreprise: "Projet d'entreprise",
    logement: "Logement"
  };

  for (const [
    key,
    label
  ] of Object.entries(labels)) {
    if (
      info[key] !== undefined &&
      info[key] !== ""
    ) {
      items.push({
        key,
        label,
        value:
          typeof info[key] === "string"
            ? info[key]
            : String(info[key]),
        status: "declared"
      });
    }
  }

  if (info.sansDiplome) {
    items.push({
      key: "sansDiplome",
      label: "Diplôme",
      value: "Aucun diplôme déclaré",
      status: "declared"
    });
  }

  if (info.sansExperience) {
    items.push({
      key: "sansExperience",
      label: "Expérience",
      value: "Aucune expérience déclarée",
      status: "declared"
    });
  }

  if (info.sansDocuments) {
    items.push({
      key: "sansDocuments",
      label: "Documents",
      value: "Absence de documents déclarée",
      status: "declared"
    });
  }

  return items;
}

function buildInformationVerification(
  state
) {
  const items = [];

  if (
    state.context.domain ===
    "immigration"
  ) {
    items.push({
      key: "residence",
      label: "Droit au séjour / travail",
      value:
        "Le document exact et les droits associés doivent être vérifiés sur une source officielle.",
      status: "toVerify",
      source:
        SOURCES.travailEtranger.url
    });
  }

  if (
    state.context.domain ===
    "entreprise"
  ) {
    items.push({
      key: "business",
      label: "Formalités",
      value:
        "Les obligations dépendent de la forme et de l'activité choisies.",
      status: "toVerify",
      source:
        SOURCES.entreprise.url
    });
  }

  if (
    state.context.domain ===
    "emploi"
  ) {
    items.push({
      key: "offer",
      label: "Conditions de chaque offre",
      value:
        "Les exigences doivent être vérifiées dans l'annonce officielle concernée.",
      status: "toVerify",
      source:
        SOURCES.franceTravailOffers.url
    });
  }

  return items;
}

function buildActions(
  state,
  decision
) {
  const actions = [];

  if (
    decision.type === "question"
  ) {
    actions.push(
      "Répondre à la question essentielle avant d'aller plus loin."
    );
    return actions;
  }

  switch (
    state.context.domain
  ) {
    case "emploi":
      actions.push(
        "Vérifier les offres et leurs conditions exactes."
      );
      actions.push(
        "Conserver uniquement les possibilités dont les conditions sont vérifiables."
      );
      break;

    case "formation":
      actions.push(
        "Identifier les formations accessibles selon la situation et la zone."
      );
      break;

    case "immigration":
      actions.push(
        "Vérifier le document exact et les droits applicables sur les sources officielles."
      );
      break;

    case "entreprise":
      actions.push(
        "Définir précisément l'activité avant de choisir la forme et les formalités."
      );
      break;

    case "logement":
      actions.push(
        "Préciser la zone, le budget et le type de solution recherché."
      );
      break;

    default:
      actions.push(
        "Préciser l'objectif concret afin de rechercher des possibilités vérifiables."
      );
  }

  return actions;
}

function buildRecommendations(
  state
) {
  const recommendations = [];

  if (
    state.context.flags.sansDiplome
  ) {
    recommendations.push(
      "Explorer les possibilités accessibles sans diplôme ainsi que les formations courtes pouvant ouvrir une nouvelle voie."
    );
  }

  if (
    state.context.flags.sansExperience
  ) {
    recommendations.push(
      "Prendre en compte les compétences informelles et les expériences transférables."
    );
  }

  if (
    state.context.domain === "etudiant"
  ) {
    recommendations.push(
      "Examiner ensemble les volets études, travail, logement, mobilité et démarches."
    );
  }

  if (
    state.context.domain === "immigration"
  ) {
    recommendations.push(
      "Ne pas déduire un droit à partir d'une situation similaire : vérifier le document et la règle applicables."
    );
  }

  if (
    state.context.domain === "entreprise"
  ) {
    recommendations.push(
      "Comparer plusieurs chemins de création ou de développement au lieu de partir directement d'une seule structure."
    );
  }

  return recommendations;
}

function buildSources(
  domain,
  extra = []
) {
  const pack =
    PARCOURS[domain] ||
    PARCOURS.general;

  const all = [
    ...pack.sources,
    ...safeArray(extra, 20)
  ];

  const seen = new Set();

  return all.filter(source => {
    if (
      !source?.url ||
      seen.has(source.url)
    ) {
      return false;
    }

    seen.add(source.url);
    return true;
  });
}

function appliquerProtectionsEmploi(
  state
) {
  if (
    state.context.domain !==
    "emploi"
  ) {
    return "";
  }

  if (
    state.context.flags.sansDocuments
  ) {
    return "Les droits au travail doivent être vérifiés individuellement auprès des sources officielles. Go Rare AI ne déduit pas un droit au travail à partir d'une simple description.";
  }

  return "La compatibilité d'une offre est indicative. Les conditions officielles de l'annonce restent déterminantes.";
}

function buildFranceTravailSearchURL(
  info
) {
  const url =
    new URL(
      SOURCES.franceTravailOffers.url
    );

  if (info.typeEmploi) {
    url.searchParams.set(
      "motsCles",
      info.typeEmploi
    );
  }

  if (info.zoneRecherche) {
    url.searchParams.set(
      "lieux",
      info.zoneRecherche
    );
  }

  return url.toString();
}

function normalizeOffer(
  offer
) {
  if (!isPlainObject(offer)) {
    return null;
  }

  const id =
    cleanText(
      offer.id || "",
      200
    );

  const title =
    cleanText(
      offer.intitule ||
      offer.title ||
      "Offre",
      300
    );

  const company =
    cleanText(
      offer.entreprise?.nom ||
      offer.company ||
      "",
      250
    );

  const location =
    cleanText(
      offer.lieuTravail?.libelle ||
      offer.location ||
      "",
      250
    );

  const contract =
    cleanText(
      offer.typeContrat ||
      offer.contract ||
      "",
      120
    );

  const experience =
    cleanText(
      offer.experienceLibelle ||
      offer.experience ||
      "",
      200
    );

  const description =
    cleanText(
      offer.description ||
      "",
      1800
    );

  const url =
    safeExternalURL(
      offer.url ||
      (
        id
          ? `https://candidat.francetravail.fr/offres/recherche/detail/${encodeURIComponent(id)}`
          : ""
      )
    );

  return {
    id,
    title,
    company,
    location,
    contract,
    experience,
    description,
    url
  };
}

function analyserCompatibiliteOffre(
  offer,
  info
) {
  const text =
    normalizeSearchText(
      [
        offer.title,
        offer.description,
        offer.experience,
        offer.contract
      ].join(" ")
    );

  const evidence = [];
  const missing = [];

  if (
    info.sansDiplome
  ) {
    if (
      !containsAny(text, [
        "diplome obligatoire",
        "bac exige",
        "bac+",
        "qualification obligatoire"
      ])
    ) {
      evidence.push(
        "Aucune exigence de diplôme explicite détectée dans le texte disponible."
      );
    } else {
      missing.push(
        "Une qualification ou un diplôme semble être demandé."
      );
    }
  }

  if (
    info.sansExperience
  ) {
    if (
      containsAny(text, [
        "debutant accepte",
        "debutant",
        "sans experience",
        "experience non requise"
      ])
    ) {
      evidence.push(
        "Le texte de l'offre contient un indice d'ouverture aux débutants."
      );
    } else {
      missing.push(
        "L'offre ne permet pas de confirmer l'absence d'exigence d'expérience."
      );
    }
  }

  if (
    info.zoneRecherche &&
    offer.location
  ) {
    if (
      normalizeSearchText(
        offer.location
      ).includes(
        normalizeSearchText(
          info.zoneRecherche
        )
      )
    ) {
      evidence.push(
        "La localisation correspond à la zone déclarée."
      );
    }
  }

  let status = "toVerify";

  if (
    evidence.length &&
    !missing.length
  ) {
    status = "compatible";
  } else if (
    missing.length
  ) {
    status = "lessCompatible";
  }

  return {
    status,
    evidence,
    missing
  };
}

async function getFranceTravailToken(
  env
) {
  const clientId =
    env.FRANCE_TRAVAIL_CLIENT_ID;

  const clientSecret =
    env.FRANCE_TRAVAIL_CLIENT_SECRET;

  if (
    !clientId ||
    !clientSecret
  ) {
    return null;
  }

  const cached =
    franceTravailTokenCache.get(
      clientId
    );

  if (
    cached &&
    cached.expiresAt >
      Date.now() + 30000
  ) {
    return cached.token;
  }

  const body =
    new URLSearchParams();

  body.set(
    "grant_type",
    "client_credentials"
  );

  body.set(
    "client_id",
    clientId
  );

  body.set(
    "client_secret",
    clientSecret
  );

  const response =
    await fetch(
      "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        },
        body
      }
    );

  if (
    !response.ok
  ) {
    return null;
  }

  const data =
    await response.json();

  if (
    !data.access_token
  ) {
    return null;
  }

  const expiresIn =
    Number(
      data.expires_in || 300
    );

  franceTravailTokenCache.set(
    clientId,
    {
      token:
        data.access_token,
      expiresAt:
        Date.now() +
        expiresIn * 1000
    }
  );

  return data.access_token;
}

async function searchFranceTravail(
  env,
  info
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
      status: "official_ready",
      offers: [],
      searchURL,
      message:
        "La recherche officielle reste disponible. L'accès API France Travail n'est pas configuré sur ce Worker."
    };
  }

  const apiURL =
    new URL(
      "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search"
    );

  if (info.typeEmploi) {
    apiURL.searchParams.set(
      "motsCles",
      info.typeEmploi
    );
  }

  if (info.zoneRecherche) {
    apiURL.searchParams.set(
      "commune",
      info.zoneRecherche
    );
  }

  apiURL.searchParams.set(
    "range",
    "0-19"
  );

  try {
    const response =
      await fetch(
        apiURL.toString(),
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
            Accept:
              "application/json"
          }
        }
      );

    if (
      !response.ok
    ) {
      return {
        status: "official_ready",
        offers: [],
        searchURL,
        message:
          "La recherche officielle est prête, mais la récupération API n'a pas pu être confirmée."
      };
    }

    const data =
      await response.json();

    const rawOffers =
      Array.isArray(
        data.resultats
      )
        ? data.resultats
        : [];

    const offers =
      rawOffers
        .map(normalizeOffer)
        .filter(Boolean)
        .map(offer => ({
          ...offer,
          compatibility:
            analyserCompatibiliteOffre(
              offer,
              info
            )
        }));

    return {
      status:
        offers.length
          ? "official_results"
          : "official_empty",
      offers,
      searchURL,
      message:
        offers.length
          ? `${offers.length} offre(s) récupérée(s) depuis France Travail.`
          : "Aucune offre exploitable n'a été retournée avec ces critères."
    };
  } catch {
    return {
      status: "official_ready",
      offers: [],
      searchURL,
      message:
        "La recherche officielle reste disponible, mais la récupération automatique a échoué."
    };
  }
}

function buildOpportunityData(
  state,
  searchData
) {
  if (
    state.context.domain !==
    "emploi"
  ) {
    return null;
  }

  return {
    domain: "emploi",
    ...searchData
  };
}

function buildTransformations(
  state
) {
  const result = [];

  if (
    state.context.domain ===
    "emploi"
  ) {
    if (
      state.context.flags.sansDiplome
    ) {
      result.push({
        title:
          "Compétences → emploi accessible",
        description:
          "Identifier les compétences pratiques ou informelles pouvant correspondre à des postes dont les conditions d'entrée sont vérifiables.",
        basis: [
          "absence de diplôme déclaré",
          state.info.experience
            ? "expérience déclarée"
            : "expérience encore à préciser"
        ]
      });
    }

    if (
      state.context.flags.sansExperience
    ) {
      result.push({
        title:
          "Absence d'expérience → voie d'entrée",
        description:
          "Chercher des postes débutants ou une courte formation pouvant servir de passerelle.",
        basis: [
          "absence d'expérience déclarée"
        ]
      });
    }

    if (
      state.info.mobilite ===
      "oui"
    ) {
      result.push({
        title:
          "Mobilité → élargissement des possibilités",
        description:
          "Comparer les opportunités dans la zone accessible plutôt que dans un seul lieu.",
        basis: [
          "mobilité déclarée"
        ]
      });
    }
  }

  if (
    state.context.domain ===
    "etudiant"
  ) {
    result.push({
      title:
        "Situation étudiante → combinaison de besoins",
      description:
        "Explorer ensemble études, travail, logement, mobilité et démarches plutôt que de traiter chaque sujet isolément.",
      basis: [
        "contexte étudiant / nouvel arrivant"
      ]
    });
  }

  if (
    state.context.domain ===
    "entreprise"
  ) {
    result.push({
      title:
        "Projet → plusieurs chemins de réalisation",
      description:
        "Transformer le projet en plusieurs scénarios opérationnels avant de choisir les formalités adaptées.",
      basis: [
        "projet d'entreprise déclaré"
      ]
    });
  }

  return result;
}

function buildRarePaths(
  state,
  searchData
) {
  const paths = [];

  switch (
    state.context.domain
  ) {
    case "emploi":
      paths.push({
        id: "direct",
        title:
          "Parcours A — Accès direct",
        description:
          "Rechercher les postes correspondant immédiatement aux éléments connus.",
        conditions: [
          "conditions de l'offre à vérifier"
        ],
        nextAction:
          "Examiner les offres officielles disponibles."
      });

      paths.push({
        id: "formation",
        title:
          "Parcours B — Formation courte",
        description:
          "Chercher une formation qui comble un élément manquant et ouvre de nouvelles possibilités.",
        conditions: [
          "formation accessible à confirmer",
          "durée et financement à vérifier"
        ],
        nextAction:
          "Identifier une formation pertinente dans la zone."
      });

      paths.push({
        id: "transformation",
        title:
          "Parcours C — Transformation",
        description:
          "Transformer une compétence, une contrainte ou une ressource existante en nouvelle possibilité.",
        conditions: [
          "hypothèse à vérifier"
        ],
        nextAction:
          "Identifier la compétence ou ressource transférable principale."
      });
      break;

    case "etudiant":
      paths.push({
        id: "study",
        title:
          "Parcours A — Études",
        description:
          "Structurer les démarches directement liées au parcours d'études.",
        conditions: [
          "statut et établissement à confirmer"
        ],
        nextAction:
          "Préciser la situation d'études."
      });

      paths.push({
        id: "work",
        title:
          "Parcours B — Études + travail",
        description:
          "Examiner les possibilités de travail compatibles avec la situation.",
        conditions: [
          "droits et limites à vérifier"
        ],
        nextAction:
          "Vérifier le statut et les règles applicables."
      });

      paths.push({
        id: "support",
        title:
          "Parcours C — Logement / démarches / soutien",
        description:
          "Regrouper les besoins pratiques du nouvel arrivant.",
        conditions: [
          "besoins précis à identifier"
        ],
        nextAction:
          "Définir le besoin prioritaire."
      });
      break;

    case "entreprise":
      paths.push({
        id: "launch",
        title:
          "Parcours A — Lancer",
        description:
          "Transformer le projet en activité structurée.",
        conditions: [
          "activité et forme à définir"
        ],
        nextAction:
          "Décrire précisément l'activité."
      });

      paths.push({
        id: "validate",
        title:
          "Parcours B — Valider avant de lancer",
        description:
          "Tester la demande, les clients et les contraintes avant les formalités.",
        conditions: [
          "hypothèses commerciales à vérifier"
        ],
        nextAction:
          "Définir le client et le besoin résolu."
      });
      break;

    default:
      paths.push({
        id: "clarify",
        title:
          "Parcours A — Clarifier",
        description:
          "Structurer la situation avant de rechercher.",
        conditions: [],
        nextAction:
          "Répondre à la prochaine question essentielle."
      });
  }

  return paths;
}

function buildEvidenceTrail(
  state,
  searchData
) {
  const trail = [];

  for (
    const item of buildInformationVerification(
      state
    )
  ) {
    trail.push({
      claim:
        item.value,
      source:
        item.source || null,
      status:
        "toVerify"
    });
  }

  if (
    searchData?.offers?.length
  ) {
    trail.push({
      claim:
        "Des offres ont été récupérées via France Travail.",
      source:
        SOURCES.franceTravailOffers.url,
      status:
        "official"
    });
  }

  return trail;
}

function buildWatchCandidate(
  state
) {
  if (
    !state.info.zoneRecherche &&
    state.context.domain ===
    "emploi"
  ) {
    return null;
  }

  return {
    available: true,
    domain:
      state.context.domain,
    zone:
      state.info.zoneRecherche || null,
    reason:
      "La situation peut être surveillée pour détecter de nouvelles possibilités ou changements pertinents.",
    enabled:
      false,
    note:
      "La surveillance automatique persistante nécessite un stockage et une tâche planifiée."
  };
}

function journeyLabel(
  stage,
  language
) {
  const ui =
    UI[normalizeLanguage(
      language
    )];

  return (
    ui?.[stage] ||
    UI.fr[stage] ||
    stage
  );
}

function buildOfficialEvidence(
  state
) {
  const items = [];

  const sources =
    buildSources(
      state.context.domain
    );

  for (
    const source of sources
  ) {
    items.push({
      key:
        source.name,
      label:
        source.name,
      value:
        "Source officielle pertinente pour ce domaine.",
      status:
        "official",
      source:
        source.url
    });
  }

  return items;
}

function normalizeVerificationItem(
  item
) {
  if (
    typeof item === "string"
  ) {
    return {
      label: "Vérification",
      value: item,
      status: "toVerify"
    };
  }

  if (
    !isPlainObject(item)
  ) {
    return null;
  }

  return {
    label:
      cleanText(
        item.label ||
        item.key ||
        "Vérification",
        200
      ),
    value:
      cleanText(
        item.value ||
        item.message ||
        "",
        1200
      ),
    status:
      [
        "declared",
        "inferred",
        "official",
        "toVerify"
      ].includes(
        item.status
      )
        ? item.status
        : "toVerify",
    source:
      safeExternalURL(
        item.source
      )
  };
}

async function askAI(
  env,
  state,
  language
) {
  if (
    !env?.AI
  ) {
    return "";
  }

  const lang =
    normalizeLanguage(
      language
    );

  const prompt = `
Tu es Go Rare AI.

Architecture:
- Situation Engine
- Official Evidence Engine
- Opportunity Engine
- Rare Transformation Engine
- Rare Paths
- Next Action Engine

Mission:
Comprendre la situation de l'utilisateur avant de proposer des possibilités.

Règles:
1. Ne jamais inventer une offre, une entreprise, une loi, un droit, un salaire ou une qualification.
2. Distinguer clairement les faits déclarés, les hypothèses et les éléments à vérifier.
3. Ne pas présenter une hypothèse comme une preuve.
4. Ne pas choisir à la place de l'utilisateur.
5. Proposer plusieurs chemins lorsque plusieurs chemins sont plausibles.
6. Une transformation est une hypothèse à vérifier.
7. Pour immigration, travail, administration ou entreprise, privilégier les sources officielles.
8. Réponse pratique et courte.
9. Ne poser qu'une seule question essentielle si une information bloque réellement l'étape suivante.
10. Langue: ${lang}.

Domaine:
${state.context.domain}

Informations:
${JSON.stringify(state.info)}

Question:
${state.question}
`;

  try {
    const response =
      await env.AI.run(
        MODEL,
        {
          messages: [
            {
              role: "system",
              content:
                prompt
            },
            {
              role: "user",
              content:
                state.question
            }
          ],
          max_tokens: 900,
          temperature: 0.2
        }
      );

    return cleanText(
      response?.response ||
      response?.result?.response ||
      "",
      6000
    );
  } catch {
    return "";
  }
}

function buildResult({
  state,
  decision,
  language,
  searchData,
  ai
}) {
  const declared =
    buildDeclaredEvidence(
      state.info
    );

  const inferred = [];

  if (
    state.context.domain !==
    "general"
  ) {
    inferred.push({
      label: "Domaine",
      value:
        PARCOURS[
          state.context.domain
        ]?.label ||
        state.context.domain,
      status: "inferred"
    });
  }

  const verify =
    buildInformationVerification(
      state
    )
      .map(
        normalizeVerificationItem
      )
      .filter(Boolean);

  const official =
    buildOfficialEvidence(
      state
    );

  const missing =
    candidatsQuestions(
      state,
      language
    ).map(key => ({
      key,
      question:
        questionText(
          language,
          key
        )
    }));

  const transformations =
    buildTransformations(
      state
    );

  const rarePaths =
    buildRarePaths(
      state,
      searchData
    );

  const evidenceTrail =
    buildEvidenceTrail(
      state,
      searchData
    );

  const actions =
    buildActions(
      state,
      decision
    );

  const recommendations =
    buildRecommendations(
      state
    );

  const nextAction =
    decision.type === "question"
      ? decision.nextQuestion
      : actions[0] ||
        "Préciser la prochaine action.";

  return {
    version: VERSION,
    decisionVersion:
      DECISION_VERSION,

    language,

    domain:
      state.context.domain,

    situation:
      state.info,

    declared,
    confirmed: declared,
    inferred,

    verify,
    official,

    evidenceTrail,

    missing,

    nextQuestion:
      decision.nextQuestion ||
      null,

    nextAction,

    actions,
    recommendations,

    transformations,
    rarePaths,

    watch:
      buildWatchCandidate(
        state
      ),

    protection:
      appliquerProtectionsEmploi(
        state
      ),

    journey: {
      stage:
        decision.stage,
      label:
        journeyLabel(
          decision.stage,
          language
        )
    },

    sources:
      buildSources(
        state.context.domain,
        searchData?.sources
      ),

    opportunities:
      buildOpportunityData(
        state,
        searchData
      ),

    ai
  };
}

async function analyserQuestion(
  payload,
  env
) {
  const language =
    normalizeLanguage(
      payload.language ||
      detectLanguage(
        payload.question
      )
    );

  const state =
    construireEtatConversation(
      payload.question,
      payload.history
    );

  const decision =
    construireDecision(
      state,
      language
    );

  let searchData = null;

  if (
    decision.type ===
      "search" &&
    state.context.domain ===
      "emploi"
  ) {
    searchData =
      await searchFranceTravail(
        env,
        state.info
      );
  }

  const ai =
    decision.type ===
    "question"
      ? ""
      : await askAI(
          env,
          state,
          language
        );

  return buildResult({
    state,
    decision,
    language,
    searchData,
    ai
  });
}

function base64ByteLength(
  value
) {
  const text =
    String(value || "");

  const comma =
    text.indexOf(",");

  const payload =
    comma >= 0
      ? text.slice(comma + 1)
      : text;

  return Math.floor(
    payload.replace(
      /\s/g,
      ""
    ).length * 3 / 4
  );
}

function extractDataURL(
  value,
  type
) {
  const text =
    String(value || "");

  const match =
    text.match(
      new RegExp(
        "^data:(" +
          type +
          ")\\/([a-zA-Z0-9.+-]+);base64,(.+)$"
      )
    );

  if (!match) {
    return null;
  }

  return {
    mime:
      `${match[1]}/${match[2]}`,
    data:
      match[3]
  };
}

async function analyzeImage(
  env,
  payload
) {
  if (
    !payload.image
  ) {
    throw new Error(
      "IMAGE_REQUIRED"
    );
  }

  const size =
    base64ByteLength(
      payload.image
    );

  if (
    size >
    LIMITS.image
  ) {
    throw new Error(
      "IMAGE_TOO_LARGE"
    );
  }

  const parsed =
    extractDataURL(
      payload.image,
      "image"
    );

  if (!parsed) {
    throw new Error(
      "INVALID_IMAGE"
    );
  }

  if (
    !env?.AI
  ) {
    throw new Error(
      "AI_NOT_CONFIGURED"
    );
  }

  try {
    const response =
      await env.AI.run(
        MODEL_VISION,
        {
          image:
            parsed.data,
          messages: [
            {
              role: "user",
              content:
                "Décris uniquement les informations utiles et visibles dans cette image. Ne suppose pas ce qui n'est pas visible."
            }
          ]
        }
      );

    return {
      text:
        cleanText(
          response?.response ||
          response?.result?.response ||
          "",
          6000
        )
    };
  } catch {
    throw new Error(
      "IMAGE_ANALYSIS_FAILED"
    );
  }
}

async function transcribeAudio(
  env,
  payload
) {
  if (
    !payload.audio
  ) {
    throw new Error(
      "AUDIO_REQUIRED"
    );
  }

  const size =
    base64ByteLength(
      payload.audio
    );

  if (
    size >
    LIMITS.audio
  ) {
    throw new Error(
      "AUDIO_TOO_LARGE"
    );
  }

  const parsed =
    extractDataURL(
      payload.audio,
      "audio"
    );

  if (!parsed) {
    throw new Error(
      "INVALID_AUDIO"
    );
  }

  if (
    !env?.AI
  ) {
    throw new Error(
      "AI_NOT_CONFIGURED"
    );
  }

  try {
    const bytes =
      Uint8Array.from(
        atob(
          parsed.data
        ),
        c => c.charCodeAt(0)
      );

    const response =
      await env.AI.run(
        MODEL_AUDIO,
        {
          audio: [
            ...bytes
          ]
        }
      );

    return {
      text:
        cleanText(
          response?.text ||
          response?.result?.text ||
          "",
          6000
        )
    };
  } catch {
    throw new Error(
      "AUDIO_TRANSCRIPTION_FAILED"
    );
  }
}

async function readJSON(
  request
) {
  const contentLength =
    Number(
      request.headers.get(
        "Content-Length"
      ) || 0
    );

  if (
    contentLength >
    LIMITS.jsonBody
  ) {
    throw new Error(
      "JSON_TOO_LARGE"
    );
  }

  const body =
    await request.text();

  if (
    body.length >
    LIMITS.jsonBody
  ) {
    throw new Error(
      "JSON_TOO_LARGE"
    );
  }

  if (!body.trim()) {
    throw new Error(
      "INVALID_JSON"
    );
  }

  try {
    return JSON.parse(
      body
    );
  } catch {
    throw new Error(
      "INVALID_JSON"
    );
  }
}

function jsonResponse(
  data,
  status = 200
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
        "Cache-Control":
          "no-store"
      }
    }
  );
}

function errorResponse(
  code,
  status = 500
) {
  return jsonResponse(
    {
      error:
        cleanText(
          code,
          120
        )
    },
    status
  );
}

function getClientIP(
  request
) {
  return (
    request.headers.get(
      "CF-Connecting-IP"
    ) ||
    request.headers.get(
      "X-Forwarded-For"
    )?.split(",")[0] ||
    "unknown"
  );
}

function checkRateLimit(
  request
) {
  const key =
    getClientIP(
      request
    );

  const now =
    Date.now();

  const current =
    rateStore.get(
      key
    ) || [];

  const fresh =
    current.filter(
      timestamp =>
        now - timestamp <
        RATE.windowMs
    );

  if (
    fresh.length >=
    RATE.max
  ) {
    rateStore.set(
      key,
      fresh
    );
    return false;
  }

  fresh.push(
    now
  );

  rateStore.set(
    key,
    fresh
  );

  if (
    rateStore.size >
    5000
  ) {
    const first =
      rateStore.keys()
        .next()
        .value;

    if (first) {
      rateStore.delete(
        first
      );
    }
  }

  return true;
}

function safeExternalURL(
  raw
) {
  if (!raw) {
    return null;
  }

  try {
    const url =
      new URL(
        String(raw)
      );

    if (
      url.protocol !==
      "https:"
    ) {
      return null;
    }

    const host =
      url.hostname
        .toLowerCase();

    const allowed = [
      "francetravail.fr",
      "candidat.francetravail.fr",
      "francetravail.io",
      "entreprise.francetravail.fr",
      "service-public.fr",
      "www.service-public.fr",
      "entreprendre.service-public.fr",
      "administration-etrangers-en-france.interieur.gouv.fr",
      "formalites.entreprises.gouv.fr"
    ];

    if (
      !allowed.some(
        item =>
          host === item ||
          host.endsWith(
            "." + item
          )
      )
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function randomToken(
  bytes = 32
) {
  const data =
    new Uint8Array(
      bytes
    );

  crypto.getRandomValues(
    data
  );

  return base64UrlEncode(
    data
  );
}

function base64UrlEncode(
  bytes
) {
  let binary = "";

  for (
    const byte of bytes
  ) {
    binary += String.fromCharCode(
      byte
    );
  }

  return btoa(
    binary
  )
    .replace(
      /\+/g,
      "-"
    )
    .replace(
      /\//g,
      "_"
    )
    .replace(
      /=+$/,
      ""
    );
}

function base64UrlDecode(
  value
) {
  const normalized =
    String(value || "")
      .replace(
        /-/g,
        "+"
      )
      .replace(
        /_/g,
        "/"
      );

  const padded =
    normalized +
    "=".repeat(
      (4 -
        normalized.length % 4) %
        4
    );

  const binary =
    atob(
      padded
    );

  return Uint8Array.from(
    binary,
    c =>
      c.charCodeAt(0)
  );
}

async function sha256(
  value
) {
  const data =
    new TextEncoder().encode(
      String(value)
    );

  return new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      data
    )
  );
}

async function hmacSign(
  value,
  secret
) {
  const key =
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(
        String(secret)
      ),
      {
        name:
          "HMAC",
        hash:
          "SHA-256"
      },
      false,
      [
        "sign"
      ]
    );

  return new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(
        String(value)
      )
    )
  );
}

async function hmacVerify(
  value,
  signature,
  secret
) {
  const expected =
    await hmacSign(
      value,
      secret
    );

  const incoming =
    base64UrlDecode(
      signature
    );

  if (
    expected.length !==
    incoming.length
  ) {
    return false;
  }

  let result = 0;

  for (
    let i = 0;
    i < expected.length;
    i++
  ) {
    result |=
      expected[i] ^
      incoming[i];
  }

  return result === 0;
}

function cookieValue(
  request,
  name
) {
  const header =
    request.headers.get(
      "Cookie"
    );

  if (!header) {
    return null;
  }

  const cookies =
    header.split(";");

  for (
    const cookie of cookies
  ) {
    const index =
      cookie.indexOf("=");

    if (
      index < 0
    ) continue;

    const key =
      cookie
        .slice(0, index)
        .trim();

    if (
      key !== name
    ) continue;

    return decodeURIComponent(
      cookie
        .slice(index + 1)
        .trim()
    );
  }

  return null;
}

function oauthConfig(
  env
) {
  return {
    clientId:
      env.OAUTH_CLIENT_ID ||
      env.GOOGLE_CLIENT_ID ||
      "",

    clientSecret:
      env.OAUTH_CLIENT_SECRET ||
      env.GOOGLE_CLIENT_SECRET ||
      "",

    authorizeURL:
      env.OAUTH_AUTHORIZE_URL ||
      "https://accounts.google.com/o/oauth2/v2/auth",

    tokenURL:
      env.OAUTH_TOKEN_URL ||
      "https://oauth2.googleapis.com/token",

    userinfoURL:
      env.OAUTH_USERINFO_URL ||
      "https://openidconnect.googleapis.com/v1/userinfo",

    redirectURL:
      env.OAUTH_REDIRECT_URL ||
      "",

    sessionSecret:
      env.SESSION_SECRET ||
      ""
  };
}

async function createSessionCookie(
  payload,
  secret
) {
  const encoded =
    base64UrlEncode(
      new TextEncoder().encode(
        JSON.stringify(
          payload
        )
      )
    );

  const signature =
    base64UrlEncode(
      await hmacSign(
        encoded,
        secret
      )
    );

  return [
    "grai_session=" +
      encodeURIComponent(
        encoded +
          "." +
          signature
      ),
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Path=/",
    "Max-Age=86400"
  ].join("; ");
}

async function readSession(
  request,
  env
) {
  const secret =
    oauthConfig(
      env
    ).sessionSecret;

  if (!secret) {
    return null;
  }

  const raw =
    cookieValue(
      request,
      "grai_session"
    );

  if (!raw) {
    return null;
  }

  const parts =
    raw.split(".");

  if (
    parts.length !== 2
  ) {
    return null;
  }

  const valid =
    await hmacVerify(
      parts[0],
      parts[1],
      secret
    );

  if (!valid) {
    return null;
  }

  try {
    const bytes =
      base64UrlDecode(
        parts[0]
      );

    const payload =
      JSON.parse(
        new TextDecoder()
          .decode(bytes)
      );

    if (
      !payload.expiresAt ||
      payload.expiresAt <
        Date.now()
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function clearSessionCookie() {
  return [
    "grai_session=",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Path=/",
    "Max-Age=0"
  ].join("; ");
}

function securityHeaders(
  nonce = ""
) {
  const headers =
    new Headers();

  headers.set(
    "X-Content-Type-Options",
    "nosniff"
  );

  headers.set(
    "X-Frame-Options",
    "DENY"
  );

  headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );

  headers.set(
    "X-DNS-Prefetch-Control",
    "off"
  );

  headers.set(
    "X-Permitted-Cross-Domain-Policies",
    "none"
  );

  headers.set(
    "Cross-Origin-Opener-Policy",
    "same-origin"
  );

  headers.set(
    "Cross-Origin-Resource-Policy",
    "same-origin"
  );

  headers.set(
    "Permissions-Policy",
    "camera=(), geolocation=(), microphone=(self), payment=()"
  );

  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      nonce
        ? `script-src 'self' 'nonce-${nonce}'`
        : "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ")
  );

  return headers;
}

function withSecurity(
  response,
  nonce = ""
) {
  const headers =
    new Headers(
      response.headers
    );

  const security =
    securityHeaders(
      nonce
    );

  for (
    const [
      key,
      value
    ] of security
  ) {
    headers.set(
      key,
      value
    );
  }

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

function htmlEscape(
  value
) {
  return String(
    value ?? ""
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
function renderHTML() {
  const nonce =
    randomToken(24);

  const uiJSON =
    JSON.stringify(UI)
      .replace(
        /</g,
        "\\u003c"
      );

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Go Rare AI — Comprendre votre situation. Voir plus loin.">
<title>Go Rare AI</title>

<style>
* {
  box-sizing: border-box;
}

html {
  color-scheme: dark;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  background:
    radial-gradient(
      circle at top left,
      rgba(100,120,255,.18),
      transparent 35%
    ),
    radial-gradient(
      circle at bottom right,
      rgba(40,180,170,.12),
      transparent 35%
    ),
    #071018;
  color: #f4f7fb;
}

button,
textarea,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  opacity: .55;
  cursor: wait;
}

.app {
  width: min(
    1100px,
    calc(100% - 28px)
  );
  margin:
    20px auto 50px;
}

.glass {
  background:
    rgba(16,25,36,.76);
  border:
    1px solid rgba(255,255,255,.09);
  box-shadow:
    0 20px 70px rgba(0,0,0,.28);
  backdrop-filter:
    blur(20px);
  -webkit-backdrop-filter:
    blur(20px);
  border-radius:
    24px;
}

header {
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.brand h1 {
  margin: 0;
  font-size: 30px;
  letter-spacing: -.8px;
}

.brand p {
  margin: 6px 0 0;
  color: #aeb9c7;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

select,
.btn {
  border:
    1px solid rgba(255,255,255,.12);
  background:
    rgba(255,255,255,.06);
  color: #fff;
  border-radius: 12px;
  padding: 10px 13px;
}

.btn {
  transition:
    transform .15s ease,
    background .15s ease;
}

.btn:hover {
  transform:
    translateY(-1px);
  background:
    rgba(255,255,255,.1);
}

.btn.primary {
  background:
    rgba(85,120,255,.24);
}

.btn.recording {
  background:
    rgba(220,70,80,.25);
}

.journey {
  margin:
    0 24px 20px;
  padding: 14px;
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.step {
  padding:
    9px 13px;
  border-radius:
    999px;
  color:
    #8e9baa;
  background:
    rgba(255,255,255,.035);
  white-space:
    nowrap;
  font-size:
    13px;
}

.step.active {
  color:
    #fff;
  background:
    rgba(255,255,255,.11);
}

.panel {
  padding:
    24px;
}

textarea {
  width:
    100%;
  min-height:
    150px;
  resize:
    vertical;
  color:
    #fff;
  background:
    rgba(0,0,0,.18);
  border:
    1px solid rgba(255,255,255,.10);
  border-radius:
    18px;
  padding:
    16px;
  outline:
    none;
}

textarea:focus {
  border-color:
    rgba(130,160,255,.55);
}

.actions-bar {
  margin-top:
    12px;
  display:
    flex;
  gap:
    9px;
  flex-wrap:
    wrap;
}

.status {
  margin-top:
    10px;
  color:
    #9eabb9;
  min-height:
    20px;
  font-size:
    13px;
}

.result {
  margin-top:
    20px;
}

.card {
  margin-top:
    14px;
  padding:
    18px;
  border-radius:
    18px;
  background:
    rgba(255,255,255,.045);
  border:
    1px solid rgba(255,255,255,.08);
}

.card h3 {
  margin:
    0 0 13px;
  font-size:
    16px;
}

.item {
  padding:
    11px 0;
  border-bottom:
    1px solid rgba(255,255,255,.06);
}

.item:last-child {
  border-bottom:
    0;
}

.item-label {
  color:
    #8f9cab;
  font-size:
    12px;
  margin-bottom:
    3px;
}

.item-value {
  color:
    #f4f7fb;
}

.badge {
  display:
    inline-block;
  margin-left:
    7px;
  padding:
    3px 7px;
  border-radius:
    999px;
  font-size:
    10px;
  color:
    #aeb8c7;
  background:
    rgba(255,255,255,.07);
}

ul,
ol {
  margin:
    8px 0 0;
  padding-left:
    21px;
}

li {
  margin:
    8px 0;
  color:
    #dce3ea;
}

.offer {
  padding:
    15px 0;
  border-bottom:
    1px solid rgba(255,255,255,.07);
}

.offer:last-child {
  border-bottom:
    0;
}

.offer-title {
  font-weight:
    650;
  font-size:
    16px;
}

.offer-meta {
  color:
    #9ca8b7;
  font-size:
    13px;
  margin-top:
    5px;
}

.offer-description {
  color:
    #c9d1da;
  margin-top:
    8px;
  line-height:
    1.5;
  font-size:
    13px;
}

.compatibility {
  margin-top:
    9px;
  padding:
    8px 10px;
  border-radius:
    10px;
  background:
    rgba(255,255,255,.05);
  font-size:
    12px;
}

.source {
  display:
    flex;
  justify-content:
    space-between;
  gap:
    10px;
  align-items:
    center;
  padding:
    9px 0;
}

.source a,
.offer a {
  color:
    #cbd7ff;
  text-decoration:
    none;
}

.source a:hover,
.offer a:hover {
  text-decoration:
    underline;
}

.ai {
  line-height:
    1.65;
  white-space:
    pre-wrap;
  color:
    #e8edf3;
}

.warning {
  color:
    #d6cfae;
  font-size:
    13px;
  line-height:
    1.55;
}

.empty {
  color:
    #8e9baa;
  font-size:
    13px;
}

.path {
  padding:
    14px 0;
  border-bottom:
    1px solid rgba(255,255,255,.06);
}

.path:last-child {
  border-bottom:
    0;
}

.path-title {
  font-weight:
    650;
}

.path-description {
  margin-top:
    5px;
  color:
    #cbd3dc;
  line-height:
    1.5;
}

.path-action {
  margin-top:
    8px;
  color:
    #aebdff;
  font-size:
    13px;
}

.transform {
  padding:
    13px 0;
  border-bottom:
    1px solid rgba(255,255,255,.06);
}

.transform:last-child {
  border-bottom:
    0;
}

.hidden {
  display:
    none !important;
}

@media (max-width:700px) {
  header {
    align-items:
      flex-start;
    flex-direction:
      column;
  }

  .toolbar {
    width:
      100%;
    justify-content:
      flex-start;
  }

  .panel,
  header {
    padding:
      17px;
  }

  .journey {
    margin:
      0 17px 16px;
  }
}
</style>
</head>

<body>
<div class="app">

<header class="glass">
  <div class="brand">
    <h1 id="title">Go Rare AI</h1>
    <p id="subtitle">
      Comprendre votre situation. Voir plus loin.
    </p>
  </div>

  <div class="toolbar">
    <select id="language" aria-label="Language">
      <option value="fr">Français</option>
      <option value="ar">العربية</option>
      <option value="en">English</option>
    </select>

    <button
      class="btn"
      id="accountBtn"
      type="button"
    >
      Connecter mon compte
    </button>
  </div>
</header>

<div class="journey glass">
  <div class="step active" data-stage="understanding">
    <span id="journeyUnderstanding">Compréhension</span>
  </div>

  <div class="step" data-stage="verification">
    <span id="journeyVerification">Vérification</span>
  </div>

  <div class="step" data-stage="search">
    <span id="journeySearch">Recherche</span>
  </div>

  <div class="step" data-stage="comparison">
    <span id="journeyComparison">Comparaison</span>
  </div>

  <div class="step" data-stage="action">
    <span id="journeyAction">Action</span>
  </div>

  <div class="step" data-stage="followup">
    <span id="journeyFollowup">Suivi</span>
  </div>
</div>

<main class="glass panel">

  <textarea
    id="question"
    maxlength="12000"
    placeholder="Décrivez votre situation..."
    aria-label="Situation"
  ></textarea>

  <div class="actions-bar">

    <button
      class="btn primary"
      id="analyzeBtn"
      type="button"
    >
      Analyser
    </button>

    <button
      class="btn"
      id="imageBtn"
      type="button"
    >
      Image
    </button>

    <input
      id="imageInput"
      type="file"
      accept="image/*"
      hidden
    >

    <button
      class="btn"
      id="microBtn"
      type="button"
    >
      Micro
    </button>

  </div>

  <div
    class="status"
    id="status"
    aria-live="polite"
  >
    Prêt.
  </div>

  <section
    class="result"
    id="result"
  ></section>

</main>
</div>

<script nonce="${nonce}">
(() => {
"use strict";

const UI =
${uiJSON};

const conversationHistory = [];

let mediaRecorder = null;
let audioChunks = [];
let recording = false;

const languageEl =
document.getElementById("language");

const questionEl =
document.getElementById("question");

const analyzeBtn =
document.getElementById("analyzeBtn");

const imageBtn =
document.getElementById("imageBtn");

const imageInput =
document.getElementById("imageInput");

const microBtn =
document.getElementById("microBtn");

const accountBtn =
document.getElementById("accountBtn");

const statusEl =
document.getElementById("status");

const resultEl =
document.getElementById("result");

function currentLanguage() {
  return languageEl.value || "fr";
}

function t(key) {
  const lang =
    currentLanguage();

  return (
    UI[lang]?.[key] ||
    UI.fr[key] ||
    key
  );
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function safeURL(raw) {
  if (!raw) return null;

  try {
    const url =
      new URL(
        String(raw),
        window.location.origin
      );

    if (
      url.protocol !==
      "https:"
    ) {
      return null;
    }

    const host =
      url.hostname.toLowerCase();

    const allowed = [
      "francetravail.fr",
      "candidat.francetravail.fr",
      "francetravail.io",
      "entreprise.francetravail.fr",
      "service-public.fr",
      "www.service-public.fr",
      "entreprendre.service-public.fr",
      "administration-etrangers-en-france.interieur.gouv.fr",
      "formalites.entreprises.gouv.fr"
    ];

    return allowed.some(
      item =>
        host === item ||
        host.endsWith("." + item)
    )
      ? url.toString()
      : null;

  } catch {
    return null;
  }
}

function setStatus(text) {
  statusEl.textContent =
    text || "";
}

function addHistory(
  role,
  content
) {
  if (!content) return;

  conversationHistory.push({
    role,
    content:
      String(content).slice(
        0,
        4000
      )
  });

  while (
    conversationHistory.length >
    40
  ) {
    conversationHistory.shift();
  }
}

function renderJourney(stage) {
  document
    .querySelectorAll(".step")
    .forEach(step => {
      step.classList.toggle(
        "active",
        step.dataset.stage === stage
      );
    });
}

function renderList(items) {
  if (
    !Array.isArray(items) ||
    !items.length
  ) {
    return "";
  }

  return (
    "<ul>" +
    items.map(
      item =>
        "<li>" +
        escapeHTML(
          typeof item === "string"
            ? item
            : item?.description ||
              item?.title ||
              ""
        ) +
        "</li>"
    ).join("") +
    "</ul>"
  );
}

function badge(status) {
  const key =
    status === "declared"
      ? "declared"
      : status === "inferred"
      ? "inferred"
      : status === "official"
      ? "official"
      : "toVerify";

  return (
    '<span class="badge">' +
    escapeHTML(
      t(key)
    ) +
    "</span>"
  );
}

function renderEvidence(
  item,
  fallback = "toVerify"
) {
  if (
    typeof item ===
    "string"
  ) {
    return (
      '<div class="item">' +
        '<div class="item-value">' +
          escapeHTML(item) +
        "</div>" +
      "</div>"
    );
  }

  if (
    !item ||
    typeof item !==
    "object"
  ) {
    return "";
  }

  const source =
    safeURL(
      item.source
    );

  const label =
    escapeHTML(
      item.label ||
      item.key ||
      ""
    );

  const statusBadge =
    badge(
      item.status ||
      fallback
    );

  const value =
    escapeHTML(
      item.value ||
      item.message ||
      ""
    );

  const sourceHTML =
    source
      ? (
          '<div style="margin-top:7px">' +
            '<a href="' +
              escapeHTML(source) +
              '" target="_blank" rel="noopener noreferrer">' +
              escapeHTML(
                t("sources")
              ) +
            "</a>" +
          "</div>"
        )
      : "";

  return (
    '<div class="item">' +
      '<div class="item-label">' +
        label +
        statusBadge +
      "</div>" +

      '<div class="item-value">' +
        value +
      "</div>" +

      sourceHTML +

    "</div>"
  );
}

function evidenceSection(
  title,
  items,
  fallback
) {
  if (
    !Array.isArray(items) ||
    !items.length
  ) {
    return "";
  }

  const content =
    items
      .map(
        item =>
          renderEvidence(
            item,
            fallback
          )
      )
      .join("");

  return (
    '<div class="card">' +
      '<h3>' +
        escapeHTML(title) +
      "</h3>" +
      content +
    "</div>"
  );
}

function renderSources(
  sources
) {
  if (
    !Array.isArray(sources) ||
    !sources.length
  ) {
    return "";
  }

  const rows =
    sources
      .map(
        source => {
          const url =
            safeURL(
              source?.url
            );

          if (!url) {
            return "";
          }

          return (
            '<div class="source">' +
              '<span>' +
                escapeHTML(
                  source.name ||
                  "Source"
                ) +
              "</span>" +

              '<a href="' +
                escapeHTML(url) +
                '" target="_blank" rel="noopener noreferrer">' +
                "Ouvrir" +
              "</a>" +

            "</div>"
          );
        }
      )
      .join("");

  if (!rows) {
    return "";
  }

  return (
    '<div class="card">' +
      '<h3>' +
        escapeHTML(
          t("sources")
        ) +
      "</h3>" +
      rows +
    "</div>"
  );
}

function renderPaths(
  paths
) {
  if (
    !Array.isArray(paths) ||
    !paths.length
  ) {
    return "";
  }

  return `
    <div class="card">
      <h3>${escapeHTML(t("paths"))}</h3>

      ${paths.map(path => `
        <div class="path">
          <div class="path-title">
            ${escapeHTML(
              path.title || ""
            )}
          </div>

          <div class="path-description">
            ${escapeHTML(
              path.description || ""
            )}
          </div>

          ${
            path.nextAction
              ? `
                <div class="path-action">
                  ${escapeHTML(
                    t("nextAction")
                  )}:
                  ${escapeHTML(
                    path.nextAction
                  )}
                </div>
              `
              : ""
          }
        </div>
      `).join("")}
    </div>
  `;
}

function renderTransformations(
  items
) {
  if (
    !Array.isArray(items) ||
    !items.length
  ) {
    return "";
  }

  return `
    <div class="card">
      <h3>
        ${escapeHTML(
          t("transformation")
        )}
      </h3>

      ${items.map(item => `
        <div class="transform">
          <strong>
            ${escapeHTML(
              item.title || ""
            )}
          </strong>

          <div class="path-description">
            ${escapeHTML(
              item.description || ""
            )}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderOpportunities(
  data
) {
  if (
    !data ||
    !Array.isArray(
      data.offers
    )
  ) {
    return "";
  }

  let html = `
    <div class="card">
      <h3>
        ${escapeHTML(
          t("opportunities")
        )}
      </h3>
  `;

  if (
    data.message
  ) {
    html += `
      <div class="offer-meta">
        ${escapeHTML(
          data.message
        )}
      </div>
    `;
  }

  if (
    data.offers.length === 0
  ) {
    const url =
      safeURL(
        data.searchURL
      );

    html += `
      <div class="empty">
        ${escapeHTML(
          t("noOffers")
        )}
      </div>
    `;

    if (url) {
      html += `
        <div style="margin-top:10px">
          <a
            href="${escapeHTML(url)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            ${escapeHTML(
              t("officialReady")
            )}
          </a>
        </div>
      `;
    }

    return (
      html +
      "</div>"
    );
  }

  data.offers
    .slice(0,20)
    .forEach(
      offer => {
        const url =
          safeURL(
            offer.url
          );

        const compatibility =
          offer.compatibility ||
          {};

        const label =
          compatibility.status ===
          "compatible"
            ? t("compatible")
            : compatibility.status ===
              "lessCompatible"
            ? t("lessCompatible")
            : t("toVerify");

        html += `
          <div class="offer">

            <div class="offer-title">
              ${escapeHTML(
                offer.title ||
                "Offre"
              )}
            </div>

            <div class="offer-meta">
              ${
                offer.company
                  ? escapeHTML(
                      offer.company
                    )
                  : ""
              }

              ${
                offer.location
                  ? " · " +
                    escapeHTML(
                      offer.location
                    )
                  : ""
              }

              ${
                offer.contract
                  ? " · " +
                    escapeHTML(
                      offer.contract
                    )
                  : ""
              }
            </div>

            ${
              offer.experience
                ? `
                  <div class="offer-meta">
                    ${escapeHTML(
                      offer.experience
                    )}
                  </div>
                `
                : ""
            }

            ${
              offer.description
                ? `
                  <div class="offer-description">
                    ${escapeHTML(
                      offer.description
                    )}
                  </div>
                `
                : ""
            }

            <div class="compatibility">
              ${escapeHTML(
                t("compatibility")
              )}:
              ${escapeHTML(label)}

              ${
                Array.isArray(
                  compatibility.evidence
                ) &&
                compatibility.evidence.length
                  ? `
                    <ul>
                      ${compatibility.evidence.map(
                        item =>
                          "<li>" +
                          escapeHTML(item) +
                          "</li>"
                      ).join("")}
                    </ul>
                  `
                  : ""
              }
            </div>

            ${
              url
                ? `
                  <div style="margin-top:9px">
                    <a
                      href="${escapeHTML(url)}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Voir l'offre
                    </a>
                  </div>
                `
                : ""
            }

          </div>
        `;
      }
    );

  html += "</div>";

  return html;
}

function renderWatch(
  watch
) {
  if (
    !watch ||
    !watch.available
  ) {
    return "";
  }

  return `
    <div class="card">
      <h3>
        ${escapeHTML(
          t("watch")
        )}
      </h3>

      <div class="warning">
        ${escapeHTML(
          watch.reason || ""
        )}
      </div>

      <div class="empty" style="margin-top:8px">
        ${escapeHTML(
          watch.note || ""
        )}
      </div>
    </div>
  `;
}

function renderEvidenceTrail(
  items
) {
  if (
    !Array.isArray(items) ||
    !items.length
  ) {
    return "";
  }

  return `
    <div class="card">
      <h3>
        ${escapeHTML(
          t("evidenceTrail")
        )}
      </h3>

      ${items.map(
        item => `
          <div class="item">
            <div class="item-label">
              ${escapeHTML(
                item.status ||
                "toVerify"
              )}
            </div>

            <div class="item-value">
              ${escapeHTML(
                item.claim || ""
              )}
            </div>

            ${
              safeURL(item.source)
                ? `
                  <div style="margin-top:7px">
                    <a
                      href="${escapeHTML(
                        safeURL(item.source)
                      )}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ${escapeHTML(
                        t("sources")
                      )}
                    </a>
                  </div>
                `
                : ""
            }
          </div>
        `
      ).join("")}
    </div>
  `;
}

function renderResult(
  data
) {
  if (
    !data ||
    typeof data !==
    "object"
  ) {
    resultEl.innerHTML = "";
    return;
  }

  if (
    data.journey
  ) {
    renderJourney(
      data.journey.stage
    );
  }

  let html = "";

  if (
    data.domain
  ) {
    html += `
      <div class="card">
        <h3>
          ${escapeHTML(
            t("domain")
          )}
        </h3>
        <div class="item-value">
          ${escapeHTML(
            data.domain
          )}
        </div>
      </div>
    `;
  }

  html += evidenceSection(
    t("confirmed"),
    Array.isArray(
      data.declared
    )
      ? data.declared
      : data.confirmed,
    "declared"
  );

  html += evidenceSection(
    t("inferred"),
    data.inferred,
    "inferred"
  );

  html += evidenceSection(
    t("verify"),
    data.verify,
    "toVerify"
  );

  html += evidenceSection(
    t("official"),
    data.official,
    "official"
  );

  if (
    Array.isArray(
      data.missing
    ) &&
    data.missing.length
  ) {
    html += `
      <div class="card">
        <h3>
          ${escapeHTML(
            t("missing")
          )}
        </h3>

        ${data.missing.map(
          item => `
            <div class="item">
              <div class="item-value">
                ${escapeHTML(
                  item.question ||
                  ""
                )}
              </div>
            </div>
          `
        ).join("")}
      </div>
    `;
  }

  if (
    data.nextAction
  ) {
    html += `
      <div class="card">
        <h3>
          ${escapeHTML(
            t("nextAction")
          )}
        </h3>

        <div class="item-value">
          ${escapeHTML(
            data.nextAction
          )}
        </div>
      </div>
    `;
  }

  if (
    Array.isArray(
      data.actions
    ) &&
    data.actions.length
  ) {
    html += `
      <div class="card">
        <h3>
          ${escapeHTML(
            t("actions")
          )}
        </h3>

        ${renderList(
          data.actions
        )}
      </div>
    `;
  }

  if (
    Array.isArray(
      data.recommendations
    ) &&
    data.recommendations.length
  ) {
    html += `
      <div class="card">
        <h3>
          ${escapeHTML(
            t("recommendations")
          )}
        </h3>

        ${renderList(
          data.recommendations
        )}
      </div>
    `;
  }

  html += renderTransformations(
    data.transformations
  );

  html += renderPaths(
    data.rarePaths
  );

  html += renderEvidenceTrail(
    data.evidenceTrail
  );

  html += renderWatch(
    data.watch
  );

  html += renderOpportunities(
    data.opportunities
  );

  if (
    data.ai
  ) {
    html += `
      <div class="card">
        <h3>Go Rare AI</h3>
        <div class="ai">
          ${escapeHTML(
            data.ai
          )}
        </div>
      </div>
    `;
  }

  if (
    data.protection
  ) {
    html += `
      <div class="card">
        <h3>
          ${escapeHTML(
            t("secure")
          )}
        </h3>

        <div class="warning">
          ${escapeHTML(
            data.protection
          )}
        </div>
      </div>
    `;
  }

  html += renderSources(
    data.sources
  );

  resultEl.innerHTML =
    html;
}

function updateTexts() {
  const ui =
    UI[
      currentLanguage()
    ] || UI.fr;

  document.documentElement
    .lang =
      currentLanguage();

  document.getElementById(
    "title"
  ).textContent =
    ui.title;

  document.getElementById(
    "subtitle"
  ).textContent =
    ui.subtitle;

  questionEl.placeholder =
    ui.placeholder;

  analyzeBtn.textContent =
    ui.analyze;

  imageBtn.textContent =
    ui.image;

  microBtn.textContent =
    recording
      ? ui.stop
      : ui.microphone;

  document.getElementById(
    "journeyUnderstanding"
  ).textContent =
    ui.understanding;

  document.getElementById(
    "journeyVerification"
  ).textContent =
    ui.verification;

  document.getElementById(
    "journeySearch"
  ).textContent =
    ui.search;

  document.getElementById(
    "journeyComparison"
  ).textContent =
    ui.comparison;

  document.getElementById(
    "journeyAction"
  ).textContent =
    ui.action;

  document.getElementById(
    "journeyFollowup"
  ).textContent =
    ui.followup;
}

async function analyze() {
  const question =
    questionEl.value.trim();

  if (!question) {
    setStatus(
      t("error")
    );
    return;
  }

  analyzeBtn.disabled =
    true;

  setStatus(
    t("searching")
  );

  try {
    addHistory(
      "user",
      question
    );

    const response =
      await fetch(
        "/api/analyze",
        {
          method:
            "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body:
            JSON.stringify({
              question,
              language:
                currentLanguage(),
              profile:
                "particulier",
              history:
                conversationHistory
            })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
        "REQUEST_FAILED"
      );
    }

    renderResult(
      data
    );

    if (
      data.nextQuestion
    ) {
      addHistory(
        "assistant",
        data.nextQuestion
      );
    }

    if (
      data.ai
    ) {
      addHistory(
        "assistant",
        data.ai
      );
    }

    questionEl.value =
      "";

    setStatus(
      t("ready")
    );

  } catch (error) {
    console.error(
      error
    );

    setStatus(
      error?.message ||
      t("error")
    );

  } finally {
    analyzeBtn.disabled =
      false;
  }
}

async function analyzeImage() {
  const file =
    imageInput.files?.[0];

  if (!file) return;

  if (
    file.size >
    7000000
  ) {
    setStatus(
      "Image trop volumineuse."
    );

    imageInput.value =
      "";

    return;
  }

  setStatus(
    t("searching")
  );

  try {
    const dataURL =
      await new Promise(
        (resolve,reject) => {
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

    const response =
      await fetch(
        "/api/image",
        {
          method:
            "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body:
            JSON.stringify({
              image:
                dataURL,
              language:
                currentLanguage()
            })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
        "IMAGE_FAILED"
      );
    }

    const text =
      String(
        data?.text || ""
      ).trim();

    if (text) {
      questionEl.value =
        text;

      setStatus(
        t("ready")
      );
    } else {
      setStatus(
        t("error")
      );
    }

  } catch (error) {
    console.error(
      error
    );

    setStatus(
      error?.message ||
      t("error")
    );

  } finally {
    imageInput.value =
      "";
  }
}

async function toggleRecording() {
  if (
    recording &&
    mediaRecorder
  ) {
    mediaRecorder.stop();
    return;
  }

  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices
      .getUserMedia
  ) {
    setStatus(
      "Microphone non disponible."
    );
    return;
  }

  try {
    const stream =
      await navigator
        .mediaDevices
        .getUserMedia({
          audio:
            true
        });

    audioChunks = [];

    mediaRecorder =
      new MediaRecorder(
        stream
      );

    mediaRecorder
      .ondataavailable =
      event => {
        if (
          event.data &&
          event.data.size >
            0
        ) {
          audioChunks.push(
            event.data
          );
        }
      };

    mediaRecorder.onstop =
      async () => {
        recording =
          false;

        microBtn.classList
          .remove(
            "recording"
          );

        updateTexts();

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

        if (
          blob.size >
          12000000
        ) {
          setStatus(
            "Audio trop volumineux."
          );
          return;
        }

        try {
          const dataURL =
            await new Promise(
              (
                resolve,
                reject
              ) => {
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
                  blob
                );
              }
            );

          setStatus(
            t("searching")
          );

          const response =
            await fetch(
              "/api/audio",
              {
                method:
                  "POST",
                headers: {
                  "Content-Type":
                    "application/json"
                },
                body:
                  JSON.stringify({
                    audio:
                      dataURL,
                    language:
                      currentLanguage()
                  })
              }
            );

          const data =
            await response.json();

          if (
            !response.ok
          ) {
            throw new Error(
              data?.error ||
              "AUDIO_FAILED"
            );
          }

          const text =
            String(
              data?.text ||
              ""
            ).trim();

          if (text) {
            questionEl.value =
              text;

            setStatus(
              t("ready")
            );
          } else {
            setStatus(
              t("error")
            );
          }

        } catch (error) {
          console.error(
            error
          );

          setStatus(
            error?.message ||
            t("error")
          );
        }
      };

    recording =
      true;

    microBtn.classList.add(
      "recording"
    );

    updateTexts();

    mediaRecorder.start();

  } catch (error) {
    console.error(
      error
    );

    recording =
      false;

    setStatus(
      "Impossible d'accéder au microphone."
    );
  }
}

async function refreshAccount() {
  try {
    const response =
      await fetch(
        "/api/billing/status",
        {
          cache:
            "no-store"
        }
      );

    const data =
      await response.json();

    if (
      data?.authenticated
    ) {
      accountBtn.textContent =
        t("connected");

      accountBtn.dataset
        .authenticated =
        "true";
    } else {
      accountBtn.textContent =
        t("connect");

      accountBtn.dataset
        .authenticated =
        "false";
    }

  } catch {
    accountBtn.textContent =
      t("connect");
  }
}

async function accountAction() {
  const authenticated =
    accountBtn.dataset
      .authenticated ===
    "true";

  if (
    authenticated
  ) {
    try {
      await fetch(
        "/oauth/logout",
        {
          method:
            "POST"
        }
      );
    } catch {}

    accountBtn.dataset
      .authenticated =
      "false";

    updateTexts();

    await refreshAccount();

    return;
  }

  window.location.href =
    "/oauth/connect";
}

languageEl.addEventListener(
  "change",
  () => {
    updateTexts();
    refreshAccount();
  }
);

analyzeBtn.addEventListener(
  "click",
  analyze
);

imageBtn.addEventListener(
  "click",
  () =>
    imageInput.click()
);

imageInput.addEventListener(
  "change",
  analyzeImage
);

microBtn.addEventListener(
  "click",
  toggleRecording
);

accountBtn.addEventListener(
  "click",
  accountAction
);

questionEl.addEventListener(
  "keydown",
  event => {
    if (
      event.key ===
        "Enter" &&
      (
        event.ctrlKey ||
        event.metaKey
      )
    ) {
      event.preventDefault();
      analyze();
    }
  }
);

updateTexts();
refreshAccount();

})();
</script>
</body>
</html>`;

  return {
    html,
    nonce
  };
}

async function handleAnalyze(
  request,
  env
) {
  const payload =
    await readJSON(
      request
    );

  if (
    !isPlainObject(
      payload
    )
  ) {
    throw new Error(
      "INVALID_PAYLOAD"
    );
  }

  const question =
    cleanText(
      payload.question || "",
      LIMITS.question
    );

  if (!question) {
    throw new Error(
      "QUESTION_REQUIRED"
    );
  }

  const history =
    safeArray(
      payload.history,
      LIMITS.messages
    );

  return analyserQuestion(
    {
      question,
      language:
        normalizeLanguage(
          payload.language
        ),
      profile:
        cleanText(
          payload.profile ||
          "particulier",
          100
        ),
      history
    },
    env
  );
}

async function handleImage(
  request,
  env
) {
  const payload =
    await readJSON(
      request
    );

  if (
    !isPlainObject(
      payload
    )
  ) {
    throw new Error(
      "INVALID_PAYLOAD"
    );
  }

  return analyzeImage(
    env,
    payload
  );
}

async function handleAudio(
  request,
  env
) {
  const payload =
    await readJSON(
      request
    );

  if (
    !isPlainObject(
      payload
    )
  ) {
    throw new Error(
      "INVALID_PAYLOAD"
    );
  }

  return transcribeAudio(
    env,
    payload
  );
}

async function billingStatus(
  request,
  env
) {
  const session =
    await readSession(
      request,
      env
    );

  return jsonResponse({
    authenticated:
      Boolean(session),

    hasUser:
      Boolean(
        session?.user
      ),

    user:
      session?.user
        ? {
            id:
              cleanText(
                session.user.id,
                200
              )
          }
        : null
  });
}

async function oauthConnect(
  env
) {
  const config =
    oauthConfig(
      env
    );

  if (
    !config.clientId ||
    !config.authorizeURL ||
    !config.redirectURL
  ) {
    return errorResponse(
      "OAUTH_NOT_CONFIGURED",
      503
    );
  }

  const state =
    randomToken(32);

  const stateHash =
    base64UrlEncode(
      await sha256(
        state
      )
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
    "response_type",
    "code"
  );

  url.searchParams.set(
    "redirect_uri",
    config.redirectURL
  );

  url.searchParams.set(
    "scope",
    "openid email profile"
  );

  url.searchParams.set(
    "state",
    state
  );

  const response =
    new Response(
      null,
      {
        status:
          302,
        headers: {
          Location:
            url.toString(),
          "Set-Cookie":
            [
              "grai_oauth_state=" +
                encodeURIComponent(
                  stateHash
                ),
              "HttpOnly",
              "Secure",
              "SameSite=Lax",
              "Path=/",
              "Max-Age=600"
            ].join("; ")
        }
      }
    );

  return withSecurity(
    response
  );
}

async function oauthCallback(
  request,
  env
) {
  const url =
    new URL(
      request.url
    );

  const code =
    url.searchParams.get(
      "code"
    );

  const state =
    url.searchParams.get(
      "state"
    );

  if (
    !code ||
    !state
  ) {
    return errorResponse(
      "OAUTH_CALLBACK_INVALID",
      400
    );
  }

  const storedHash =
    cookieValue(
      request,
      "grai_oauth_state"
    );

  const incomingHash =
    base64UrlEncode(
      await sha256(
        state
      )
    );

  if (
    !storedHash ||
    storedHash !==
      incomingHash
  ) {
    return errorResponse(
      "OAUTH_STATE_INVALID",
      400
    );
  }

  const config =
    oauthConfig(
      env
    );

  if (
    !config.clientId ||
    !config.clientSecret ||
    !config.tokenURL ||
    !config.redirectURL ||
    !config.sessionSecret
  ) {
    return errorResponse(
      "OAUTH_NOT_CONFIGURED",
      503
    );
  }

  try {
    const tokenBody =
      new URLSearchParams();

    tokenBody.set(
      "grant_type",
      "authorization_code"
    );

    tokenBody.set(
      "client_id",
      config.clientId
    );

    tokenBody.set(
      "client_secret",
      config.clientSecret
    );

    tokenBody.set(
      "redirect_uri",
      config.redirectURL
    );

    tokenBody.set(
      "code",
      code
    );

    const tokenResponse =
      await fetch(
        config.tokenURL,
        {
          method:
            "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded"
          },
          body:
            tokenBody
        }
      );

    if (
      !tokenResponse.ok
    ) {
      return errorResponse(
        "OAUTH_TOKEN_FAILED",
        502
      );
    }

    const tokenData =
      await tokenResponse.json();

    let user = {
      id:
        cleanText(
          tokenData.sub ||
          tokenData.user_id ||
          tokenData.id ||
          "oauth-user",
          200
        )
    };

    if (
      config.userinfoURL &&
      tokenData.access_token
    ) {
      try {
        const userResponse =
          await fetch(
            config.userinfoURL,
            {
              headers: {
                Authorization:
                  `Bearer ${tokenData.access_token}`,
                Accept:
                  "application/json"
              }
            }
          );

        if (
          userResponse.ok
        ) {
          const userData =
            await userResponse.json();

          user = {
            id:
              cleanText(
                userData.sub ||
                userData.id ||
                userData.user_id ||
                user.id,
                200
              )
          };
        }
      } catch {}
    }

    const now =
      Date.now();

    const sessionPayload = {
      authenticated:
        true,
      user,
      createdAt:
        now,
      expiresAt:
        now +
        86400000
    };

    const sessionCookie =
      await createSessionCookie(
        sessionPayload,
        config.sessionSecret
      );

    const response =
      new Response(
        null,
        {
          status:
            302,
          headers: {
            Location:
              "/",
            "Set-Cookie":
              [
                sessionCookie,
                "grai_oauth_state=",
                "HttpOnly",
                "Secure",
                "SameSite=Lax",
                "Path=/",
                "Max-Age=0"
              ].join("; ")
          }
        }
      );

    return withSecurity(
      response
    );

  } catch {
    return errorResponse(
      "OAUTH_CALLBACK_FAILED",
      502
    );
  }
}

async function oauthLogout(
  request,
  env
) {
  if (
    request.method !==
    "POST"
  ) {
    return errorResponse(
      "METHOD_NOT_ALLOWED",
      405
    );
  }

  const response =
    jsonResponse({
      authenticated:
        false
    });

  const headers =
    new Headers(
      response.headers
    );

  headers.append(
    "Set-Cookie",
    clearSessionCookie()
  );

  return withSecurity(
    new Response(
      response.body,
      {
        status:
          response.status,
        headers
      }
    )
  );
}

function mapErrorStatus(
  error
) {
  const code =
    String(
      error?.message || ""
    );

  if (
    [
      "QUESTION_REQUIRED",
      "INVALID_PAYLOAD",
      "INVALID_JSON"
    ].includes(
      code
    )
  ) {
    return 400;
  }

  if (
    [
      "IMAGE_TOO_LARGE",
      "AUDIO_TOO_LARGE",
      "JSON_TOO_LARGE"
    ].includes(
      code
    )
  ) {
    return 413;
  }

  if (
    [
      "IMAGE_REQUIRED",
      "AUDIO_REQUIRED",
      "INVALID_IMAGE",
      "INVALID_AUDIO"
    ].includes(
      code
    )
  ) {
    return 400;
  }

  if (
    code ===
    "AI_NOT_CONFIGURED"
  ) {
    return 503;
  }

  if (
    [
      "IMAGE_ANALYSIS_FAILED",
      "AUDIO_TRANSCRIPTION_FAILED"
    ].includes(
      code
    )
  ) {
    return 502;
  }

  if (
    code ===
    "METHOD_NOT_ALLOWED"
  ) {
    return 405;
  }

  if (
    code ===
    "RATE_LIMITED"
  ) {
    return 429;
  }

  return 500;
}

export default {
  async fetch(
    request,
    env
  ) {
    try {

      if (
        !checkRateLimit(
          request
        )
      ) {
        return withSecurity(
          errorResponse(
            "RATE_LIMITED",
            429
          )
        );
      }

      const url =
        new URL(
          request.url
        );

      const pathname =
        url.pathname;

      if (
        request.method ===
        "OPTIONS"
      ) {
        return withSecurity(
          new Response(
            null,
            {
              status:
                204
            }
          )
        );
      }

      if (
        request.method ===
          "GET" &&
        pathname === "/"
      ) {
        const page =
          renderHTML();

        const response =
          new Response(
            page.html,
            {
              status:
                200,
              headers: {
                "Content-Type":
                  "text/html; charset=utf-8",
                "Cache-Control":
                  "no-store"
              }
            }
          );

        return withSecurity(
          response,
          page.nonce
        );
      }

      if (
        request.method ===
          "GET" &&
        pathname ===
          "/health"
      ) {
        return withSecurity(
          jsonResponse({
            status:
              "ok",
            version:
              VERSION,
            service:
              "Go Rare AI"
          })
        );
      }

      if (
        request.method ===
          "GET" &&
        pathname ===
          "/api/billing/status"
      ) {
        return withSecurity(
          await billingStatus(
            request,
            env
          )
        );
      }

      if (
        request.method ===
          "GET" &&
        pathname ===
          "/oauth/connect"
      ) {
        return oauthConnect(
          env
        );
      }

      if (
        request.method ===
          "GET" &&
        pathname ===
          "/oauth/callback"
      ) {
        return oauthCallback(
          request,
          env
        );
      }

      if (
        request.method ===
          "POST" &&
        pathname ===
          "/oauth/logout"
      ) {
        return oauthLogout(
          request,
          env
        );
      }

      if (
        request.method ===
          "POST" &&
        pathname ===
          "/api/analyze"
      ) {
        const data =
          await handleAnalyze(
            request,
            env
          );

        return withSecurity(
          jsonResponse(
            data
          )
        );
      }

      if (
        request.method ===
          "POST" &&
        pathname ===
          "/api/image"
      ) {
        const data =
          await handleImage(
            request,
            env
          );

        return withSecurity(
          jsonResponse(
            data
          )
        );
      }

      if (
        request.method ===
          "POST" &&
        pathname ===
          "/api/audio"
      ) {
        const data =
          await handleAudio(
            request,
            env
          );

        return withSecurity(
          jsonResponse(
            data
          )
        );
      }

      return withSecurity(
        errorResponse(
          "NOT_FOUND",
          404
        )
      );

    } catch (error) {

      console.error(
        "Go Rare AI error:",
        error
      );

      const status =
        mapErrorStatus(
          error
        );

      return withSecurity(
        errorResponse(
          status === 500
            ? "INTERNAL_ERROR"
            : error?.message ||
              "REQUEST_FAILED",
          status
        )
      );
    }
  }
};
