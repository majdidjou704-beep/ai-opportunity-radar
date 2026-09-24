uconst MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const MODEL_VISION = "@cf/meta/llama-3.2-11b-vision-instruct";
const MODEL_AUDIO = "@cf/openai/whisper-large-v3-turbo";

const VERSION = "10.5.0";
const DECISION_VERSION = "10.5.0";

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
    url: "https://administration-etrangers-en-france.interieur.gouv.fr/"
  },
  travailEtranger: {
    name: "Service-Public — Travail d'un étranger en France",
    url: "https://www.service-public.fr/particuliers/vosdroits/N107"
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
  "vigneux sur seine": "Vigneux-sur-Seine",
  "vignieux sur seine": "Vigneux-sur-Seine",
  "vignieux-sur-seine": "Vigneux-sur-Seine",
  "vigneux": "Vigneux-sur-Seine",

  "paris": "Paris",
  "paris 75": "Paris",

  "draveil": "Draveil",
  "montgeron": "Montgeron",
  "juvisy": "Juvisy-sur-Orge",
  "juvisy-sur-orge": "Juvisy-sur-Orge",
  "athis mons": "Athis-Mons",
  "athis-mons": "Athis-Mons",
  "viry chatillon": "Viry-Châtillon",
  "viry-châtillon": "Viry-Châtillon",
  "savigny sur orge": "Savigny-sur-Orge",
  "savigny-sur-orge": "Savigny-sur-Orge",
  "yerres": "Yerres",
  "epinay sous senart": "Épinay-sous-Sénart",
  "epinay-sous-senart": "Épinay-sous-Sénart",
  "brunoy": "Brunoy",
  "ris orangis": "Ris-Orangis",
  "ris-orangis": "Ris-Orangis",
  "corbeil essonnes": "Corbeil-Essonnes",
  "corbeil-essonnes": "Corbeil-Essonnes",
  "evry": "Évry-Courcouronnes",
  "evry courcouronnes": "Évry-Courcouronnes",
  "créteil": "Créteil",
  "creteil": "Créteil"
};

const PARCOURS = {
  fr: {
    particulier: "Particulier",
    emploi: "Emploi",
    immigration: "Immigration",
    entreprise: "Entreprise",
    recherche: "Recherche",
    formation: "Formation",
    administratif: "Administratif",
    reconversion: "Reconversion",
    creer: "Créer",
    developper: "Développer"
  },
  ar: {
    particulier: "فرد",
    emploi: "العمل",
    immigration: "الهجرة والإقامة",
    entreprise: "مشروع / شركة",
    recherche: "البحث",
    formation: "التكوين",
    administratif: "إداري",
    reconversion: "إعادة التوجيه المهني",
    creer: "إنشاء",
    developper: "تطوير"
  },
  en: {
    particulier: "Individual",
    emploi: "Employment",
    immigration: "Immigration",
    entreprise: "Business",
    recherche: "Research",
    formation: "Training",
    administratif: "Administrative",
    reconversion: "Career change",
    creer: "Create",
    developper: "Develop"
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
    placeholder: "Décrivez votre situation...",
    particulier: "Particulier",
    situation: "Situation",
    result: "Résultat",
    confirmed: "Informations confirmées",
    verify: "Informations à vérifier",
    missing: "Informations manquantes",
    sources: "Sources officielles",
    actions: "Prochaines étapes",
    recommendations: "Pistes utiles",
    opportunities: "Opportunités trouvées",
    billing: "Compte",
    secure: "Protection",
    connect: "Connecter mon compte",
    notConnected: "Non connecté",
    searching: "Recherche en cours...",
    ready: "Prêt.",
    error: "Une erreur est survenue.",
    journey: "Parcours",
    understanding: "Compréhension",
    verification: "Vérification",
    search: "Recherche",
    comparison: "Comparaison",
    action: "Action",
    followup: "Suivi",
    officialReady: "Recherche officielle prête à être ouverte",
    offersRetrieved: "Offres récupérées",
    noOffers: "Aucune offre récupérée pour cette recherche",
    compatibility: "Compatibilité indicative",
    compatible: "Compatible avec les critères connus",
    toVerify: "À vérifier",
    lessCompatible: "Moins compatible avec les critères connus"
  },
  ar: {
    title: "Go Rare AI",
    subtitle: "نفهم وضعك. ونرى أبعد.",
    analyze: "تحليل",
    image: "صورة",
    microphone: "ميكروفون",
    stop: "إيقاف",
    placeholder: "اشرح وضعك...",
    particulier: "فرد",
    situation: "الوضعية",
    result: "النتيجة",
    confirmed: "المعلومات المؤكدة",
    verify: "معلومات يجب التحقق منها",
    missing: "معلومات ناقصة",
    sources: "المصادر الرسمية",
    actions: "الخطوات التالية",
    recommendations: "مسارات مفيدة",
    opportunities: "الفرص التي تم العثور عليها",
    billing: "الحساب",
    secure: "الحماية",
    connect: "ربط حسابي",
    notConnected: "غير متصل",
    searching: "جارٍ البحث...",
    ready: "جاهز.",
    error: "حدث خطأ.",
    journey: "المسار",
    understanding: "فهم الوضع",
    verification: "التحقق",
    search: "البحث",
    comparison: "المقارنة",
    action: "التنفيذ",
    followup: "المتابعة",
    officialReady: "البحث الرسمي جاهز للفتح",
    offersRetrieved: "تم العثور على عروض فعلية",
    noOffers: "لم يتم العثور على عروض لهذه المعايير",
    compatibility: "توافق أولي",
    compatible: "متوافق مع المعايير المعروفة",
    toVerify: "يجب التحقق",
    lessCompatible: "أقل توافقًا مع المعايير المعروفة"
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
    confirmed: "Confirmed information",
    verify: "Information to verify",
    missing: "Missing information",
    sources: "Official sources",
    actions: "Next steps",
    recommendations: "Useful paths",
    opportunities: "Opportunities found",
    billing: "Account",
    secure: "Protection",
    connect: "Connect my account",
    notConnected: "Not connected",
    searching: "Searching...",
    ready: "Ready.",
    error: "An error occurred.",
    journey: "Journey",
    understanding: "Understanding",
    verification: "Verification",
    search: "Search",
    comparison: "Comparison",
    action: "Action",
    followup: "Follow-up",
    officialReady: "Official search ready to open",
    offersRetrieved: "Offers retrieved",
    noOffers: "No offers retrieved for this search",
    compatibility: "Indicative compatibility",
    compatible: "Compatible with known criteria",
    toVerify: "To verify",
    lessCompatible: "Less compatible with known criteria"
  }
};

const QUESTIONS = {
  fr: {
    zone_recherche: "Dans quelle zone recherchez-vous ?",
    type_emploi: "Quel type de travail recherchez-vous ?",
    diplome: "Avez-vous un diplôme ou une qualification à prendre en compte ?",
    experience: "Avez-vous une expérience professionnelle à prendre en compte ?",
    mobilite: "Jusqu'où pouvez-vous vous déplacer pour travailler ?",
    horaires: "Quels horaires pouvez-vous accepter ?",
    presence_france: "Êtes-vous actuellement en France ?",
    statut_sejour: "Quel est votre statut de séjour ou de travail ?",
    entreprise: "S'agit-il d'un projet ou d'une entreprise existante ?"
  },
  ar: {
    zone_recherche: "في أي منطقة تبحث عن العمل؟",
    type_emploi: "ما نوع العمل الذي تبحث عنه؟",
    diplome: "هل لديك شهادة أو مؤهل يجب أخذه بعين الاعتبار؟",
    experience: "هل لديك خبرة مهنية يجب أخذها بعين الاعتبار؟",
    mobilite: "إلى أي مسافة يمكنك التنقل من أجل العمل؟",
    horaires: "ما هي أوقات العمل التي يمكنك قبولها؟",
    presence_france: "هل أنت حاليًا في فرنسا؟",
    statut_sejour: "ما هو وضع إقامتك أو عملك؟",
    entreprise: "هل يتعلق الأمر بمشروع أم بشركة موجودة؟"
  },
  en: {
    zone_recherche: "Which area are you looking for work in?",
    type_emploi: "What type of work are you looking for?",
    diplome: "Do you have a diploma or qualification to consider?",
    experience: "Do you have professional experience to consider?",
    mobilite: "How far can you travel for work?",
    horaires: "What working hours can you accept?",
    presence_france: "Are you currently in France?",
    statut_sejour: "What is your residence or work status?",
    entreprise: "Is this about a project or an existing company?"
  }
};

function cleanText(value, max = 12000) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, max);
}

function safeArray(value, max = 40) {
  return Array.isArray(value) ? value.slice(0, max) : [];
}

function uniqueArray(arr) {
  return [...new Set(safeArray(arr).map(x => cleanText(x, 500)).filter(Boolean))];
}

function isPlainObject(value) {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value);
}

function containsAny(text, values) {
  const t = String(text || "").toLowerCase();
  return values.some(v => t.includes(v.toLowerCase()));
}

function base64ByteLength(base64) {
  if (!base64) return 0;

  let clean = String(base64);

  const comma = clean.indexOf(",");
  if (comma >= 0) {
    clean = clean.slice(comma + 1);
  }

  clean = clean.replace(/\s/g, "");

  const padding =
    clean.endsWith("==") ? 2 :
    clean.endsWith("=") ? 1 : 0;

  return Math.max(
    0,
    Math.floor(clean.length * 3 / 4) - padding
  );
}

function normalizeLanguage(value) {
  const v = String(value || "").toLowerCase();
  return LANGUAGES.includes(v) ? v : "fr";
}

function detectLanguage(text) {
  const t = String(text || "").toLowerCase();

  if (/[\u0600-\u06ff]/.test(t)) return "ar";

  if (/\b(the|work|job|experience|diploma|company|business)\b/.test(t)) {
    return "en";
  }

  if (/\b(travail|emploi|sans diplôme|expérience|entreprise|recherche)\b/.test(t)) {
    return "fr";
  }

  return "fr";
}

function normaliserLieu(text) {
  const t = String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  for (const [alias, canonical] of Object.entries(LOCATION_ALIASES)) {
    const normalizedAlias = alias
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (t.includes(normalizedAlias)) {
      return canonical;
    }
  }

  return null;
}

function extraireMobilite(text) {
  const t = String(text || "").toLowerCase();

  const match = t.match(
    /(\d+(?:[.,]\d+)?)\s*(km|kilom[eè]tres?|kilometers?|كم|كلم)\b/i
  );

  if (match) {
    const number = match[1].replace(",", ".");
    return `${number} km`;
  }

  if (
    containsAny(t, [
      "à pied",
      "a pied",
      "walking",
      "marche",
      "مشيا",
      "مشياً"
    ])
  ) {
    return "À pied";
  }

  if (
    containsAny(t, [
      "transport en commun",
      "transports en commun",
      "transport public",
      "bus",
      "train",
      "metro",
      "métro",
      "rer",
      "tram",
      "public transport",
      "المواصلات",
      "النقل العمومي"
    ])
  ) {
    return "Transports en commun";
  }

  if (
    containsAny(t, [
      "toute la région",
      "toute l'ile de france",
      "toute l'île-de-france",
      "toute ile de france",
      "dans toute la région",
      "anywhere in the region",
      "منطقة كاملة"
    ])
  ) {
    return "Toute la région";
  }

  if (
    containsAny(t, [
      "dans toute la france",
      "partout en france",
      "anywhere in france",
      "كل فرنسا"
    ])
  ) {
    return "Toute la France";
  }

  if (
    containsAny(t, [
      "dans la ville",
      "in the city",
      "داخل المدينة"
    ])
  ) {
    return "Dans la ville";
  }

  return null;
}

function extraireInformations(text) {
  const t = cleanText(text, LIMITS.question).toLowerCase();
  const info = {};

  if (!t) return info;

  /*
   * PATCH V10.5.1
   * Only extract information when the user's wording gives
   * reasonably explicit evidence.
   * Do not convert a simple keyword into a confirmed fact.
   */

  // ---------------------------------------------------------
  // Diploma
  // ---------------------------------------------------------

  if (
    containsAny(t, [
      "sans diplôme",
      "sans diplome",
      "pas de diplôme",
      "pas de diplome",
      "aucun diplôme",
      "aucun diplome",
      "ما عنديش شهادة",
      "ليس لدي شهادة",
      "بدون شهادة",
      "بدون دبلوم",
      "no diploma",
      "without diploma"
    ])
  ) {
    info.diplome = "Sans diplôme";
  }

  // ---------------------------------------------------------
  // Experience
  // ---------------------------------------------------------

  if (
    containsAny(t, [
      "sans expérience",
      "sans experience",
      "pas d'expérience",
      "pas d'experience",
      "aucune expérience",
      "aucune experience",
      "ما عنديش خبرة",
      "ليس لدي خبرة",
      "بدون خبرة",
      "بدون تجربة",
      "no experience",
      "without experience"
    ])
  ) {
    info.experience = "Sans expérience";
  }

  // ---------------------------------------------------------
  // Any sector / any job
  // ---------------------------------------------------------

  if (
    containsAny(t, [
      "peu importe",
      "n'importe quel travail",
      "n'importe quel emploi",
      "tous secteurs",
      "tout secteur",
      "tous les secteurs",
      "tout travail",
      "tout emploi",
      "quelque travail que ce soit",
      "أي عمل",
      "أي شغل",
      "أي وظيفة",
      "كل القطاعات",
      "لا يهم",
      "any job",
      "any work",
      "any sector",
      "doesn't matter"
    ])
  ) {
    info.secteurs = "Tous secteurs";
    info.typeEmploi = "Peu importe";
  }

  // ---------------------------------------------------------
  // Presence in France
  // ---------------------------------------------------------

  const negFrance =
    containsAny(t, [
      "je ne suis pas en france",
      "je suis pas en france",
      "je ne suis plus en france",
      "je n'habite pas en france",
      "je n'habite plus en france",
      "je vis hors de france",
      "hors de france",
      "pas en france",
      "خارج فرنسا",
      "لست في فرنسا",
      "أنا لست في فرنسا",
      "لست بفرنسا",
      "not in france",
      "outside france"
    ]);

  const posFrance =
    !negFrance &&
    containsAny(t, [
      "je suis en france",
      "j'habite en france",
      "je vis en france",
      "je travaille en france",
      "actuellement en france",
      "en france actuellement",
      "أنا في فرنسا",
      "أعيش في فرنسا",
      "أقيم في فرنسا",
      "في فرنسا",
      "in france",
      "living in france",
      "currently in france"
    ]);

  if (negFrance) {
    info.presenceFrance = "Non";
  } else if (posFrance) {
    info.presenceFrance = "Oui";
  }

  // ---------------------------------------------------------
  // Location
  // ---------------------------------------------------------

  const lieu = normaliserLieu(text);

  if (lieu) {
    info.zoneRecherche = lieu;
  }

  // ---------------------------------------------------------
  // Mobility
  // ---------------------------------------------------------

  const mobilite = extraireMobilite(text);

  if (mobilite) {
    info.mobilite = mobilite;
  }

  // ---------------------------------------------------------
  // Employment type
  // ---------------------------------------------------------

  const emploiPatterns = [
    {
      value: "Facteur / distribution",
      terms: [
        "facteur",
        "factrice",
        "distribution courrier",
        "distribution du courrier",
        "ساعي بريد",
        "عامل بريد",
        "postal delivery"
      ]
    },
    {
      value: "Livraison / livreur",
      terms: [
        "livreur",
        "livraison",
        "chauffeur livreur",
        "delivery",
        "توصيل",
        "عامل توصيل"
      ]
    },
    {
      value: "Nettoyage / entretien",
      terms: [
        "nettoyage",
        "nettoyeur",
        "nettoyeuse",
        "ménage",
        "entretien",
        "agent d'entretien",
        "تنظيف",
        "نظافة"
      ]
    },
    {
      value: "Manutention",
      terms: [
        "manutention",
        "manutentionnaire",
        "عامل مناولة"
      ]
    },
    {
      value: "Logistique",
      terms: [
        "logistique",
        "logisticien",
        "لوجستيك",
        "اللوجستيك"
      ]
    },
    {
      value: "Restauration / cuisine",
      terms: [
        "restauration",
        "restaurant",
        "cuisine",
        "cuisinier",
        "cuisinière",
        "serveur",
        "مطعم",
        "طبخ"
      ]
    },
    {
      value: "Magasin / vente",
      terms: [
        "magasin",
        "vente",
        "vendeur",
        "vendeuse",
        "commerce",
        "متجر",
        "بيع"
      ]
    },
    {
      value: "Bâtiment",
      terms: [
        "bâtiment",
        "construction",
        "chantier",
        "maçon",
        "بناء",
        "ورش"
      ]
    },
    {
      value: "Chauffeur / conduite",
      terms: [
        "chauffeur",
        "conducteur",
        "conduite",
        "conductrice",
        "سائق",
        "قيادة"
      ]
    },
    {
      value: "Préparateur de commande",
      terms: [
        "préparateur de commande",
        "préparation de commande",
        "préparatrice de commande",
        "تحضير الطلبات"
      ]
    }
  ];

  for (const pattern of emploiPatterns) {
    if (containsAny(t, pattern.terms)) {
      info.typeEmploi = pattern.value;
      break;
    }
  }

  // ---------------------------------------------------------
  // Flexible hours
  // ---------------------------------------------------------

  if (
    containsAny(t, [
      "horaires flexibles",
      "horaire flexible",
      "peu importe les horaires",
      "n'importe quels horaires",
      "tous les horaires",
      "disponible à toute heure",
      "disponible tous les jours",
      "je suis flexible",
      "je peux travailler à n'importe quelle heure",
      "أي وقت",
      "الأوقات كلها مناسبة",
      "لا يهم الوقت",
      "متاح في أي وقت",
      "flexible hours",
      "any hours",
      "available anytime"
    ])
  ) {
    info.horaires = "Flexible";
  }

  // ---------------------------------------------------------
  // Residence / immigration
  // ---------------------------------------------------------

  const residenceTerms = [
    "titre de séjour",
    "titre de sejour",
    "carte de séjour",
    "carte de sejour",
    "salarié",
    "salarie",
    "résident",
    "resident",
    "récépissé",
    "recepisse",
    "visa",
    "visa long séjour",
    "visa long sejour",
    "carte de résident",
    "carte de resident",
    "residence permit",
    "residence card",
    "permit",
    "إقامة",
    "بطاقة إقامة",
    "تصريح إقامة",
    "فيزا",
    "تأشيرة"
  ];

  if (containsAny(t, residenceTerms)) {
    info.statutSejour = "À vérifier précisément";
    info.contexteImmigration = true;
  }

  // ---------------------------------------------------------
  // Documents uncertain / absent
  // ---------------------------------------------------------

  if (
    containsAny(t, [
      "sans papiers",
      "sans papier",
      "je n'ai pas de papiers",
      "pas de papiers",
      "documents manquants",
      "sans documents",
      "pas de documents",
      "je n'ai aucun document",
      "sans titre de séjour",
      "sans titre de sejour",
      "بدون أوراق",
      "بدون وثائق",
      "ليس لدي وثائق",
      "لا أملك أوراق",
      "no papers",
      "without documents",
      "no documents"
    ])
  ) {
    info.documents = "Documents à préciser";
    info.contexteImmigration = true;
  }

  // ---------------------------------------------------------
  // Business / project
  // ---------------------------------------------------------

  if (
    containsAny(t, [
      "créer mon entreprise",
      "creer mon entreprise",
      "créer une entreprise",
      "creer une entreprise",
      "lancer mon entreprise",
      "projet d'entreprise",
      "projet entreprise",
      "entrepreneur",
      "micro-entreprise",
      "micro entreprise",
      "business",
      "إنشاء شركة",
      "مشروعي",
      "مشروع",
      "entreprise"
    ])
  ) {
    info.entreprise = "Projet ou entreprise à préciser";
  }

  return info;
}
function detectContext(text, info = {}, profile = "particulier", situation = "") {
  const t = `${text || ""} ${situation || ""}`.toLowerCase();

  const employment = containsAny(t, [
    "travail",
    "emploi",
    "job",
    "poste",
    "recrutement",
    "facteur",
    "livraison",
    "nettoyage",
    "manutention",
    "logistique",
    "chauffeur",
    "travaille",
    "work",
    "employment",
    "job"
  ]) || Boolean(
    info.typeEmploi ||
    info.diplome ||
    info.experience ||
    info.mobilite
  );

  const immigration = containsAny(t, [
    "titre de séjour",
    "titre de sejour",
    "carte de séjour",
    "carte de sejour",
    "visa",
    "immigration",
    "étranger",
    "etranger",
    "residence permit",
    "immigration",
    "إقامة",
    "هجرة"
  ]) || Boolean(info.statutSejour);

  const business = containsAny(t, [
    "entreprise",
    "société",
    "societe",
    "business",
    "company",
    "client",
    "clients",
    "vendre",
    "vente",
    "service",
    "شركة",
    "مشروع"
  ]) || Boolean(info.entreprise);

  const administrative = containsAny(t, [
    "administratif",
    "administration",
    "dossier",
    "formulaire",
    "document",
    "préfecture",
    "prefecture",
    "service public",
    "administrative",
    "وثيقة",
    "إدارة"
  ]);

  const training = containsAny(t, [
    "formation",
    "apprendre",
    "formation professionnelle",
    "training",
    "learn",
    "تكوين",
    "تعلم"
  ]);

  const reconversion = containsAny(t, [
    "reconversion",
    "changer de métier",
    "changer de metier",
    "career change",
    "تغيير المهنة"
  ]);

  return {
    employment,
    immigration,
    business,
    administrative,
    training,
    reconversion,
    sansDiplome: info.diplome === "Sans diplôme",
    sansExperience: info.experience === "Sans expérience",
    sansDocuments: info.documents === "Documents à préciser",
    profile: profile || "particulier"
  };
}

function analyserHistorique(history) {
  if (!Array.isArray(history)) return "";

  const usable = history
    .filter(x => isPlainObject(x))
    .slice(-20)
    .map(x => {
      const role = x.role === "assistant" ? "Assistant" : "Utilisateur";
      return `${role}: ${cleanText(x.content || "", 1500)}`;
    })
    .filter(Boolean);

  return usable.join("\n");
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

function construireEtatConversation(question, payload = {}) {
  const historyText = analyserHistorique(payload.history);

  const historyInfo = extraireInformations(historyText);
  const currentInfo = extraireInformations(question);

  const info = mergeInfo(
    historyInfo,
    isPlainObject(payload.info) ? payload.info : {},
    currentInfo
  );

  const situation = [
    historyText,
    question
  ].filter(Boolean).join("\n");

  const profile = cleanText(
    payload.profile || "particulier",
    100
  );

  const context = detectContext(
    question,
    info,
    profile,
    situation
  );

  return {
    info,
    context,
    historyText,
    profile,
    language: normalizeLanguage(
      payload.language || detectLanguage(question)
    )
  };
}

function candidatsQuestions(state) {
  const { info, context, language } = state;
  const q = QUESTIONS[language] || QUESTIONS.fr;
  const list = [];

  if (context.employment) {
    if (!info.zoneRecherche) {
      list.push({
        key: "zone_recherche",
        question: q.zone_recherche
      });
    }

    if (!info.typeEmploi) {
      list.push({
        key: "type_emploi",
        question: q.type_emploi
      });
    }

    if (!info.diplome) {
      list.push({
        key: "diplome",
        question: q.diplome
      });
    }

    if (!info.experience) {
      list.push({
        key: "experience",
        question: q.experience
      });
    }

    if (!info.mobilite) {
      list.push({
        key: "mobilite",
        question: q.mobilite
      });
    }

    if (!info.horaires) {
      list.push({
        key: "horaires",
        question: q.horaires
      });
    }
  }

  if (context.immigration && !info.presenceFrance) {
    list.push({
      key: "presence_france",
      question: q.presence_france
    });
  }

  if (
    context.immigration &&
    !info.statutSejour
  ) {
    list.push({
      key: "statut_sejour",
      question: q.statut_sejour
    });
  }

  if (
    context.business &&
    !info.entreprise
  ) {
    list.push({
      key: "entreprise",
      question: q.entreprise
    });
  }

  return list;
}

function construireDecision(state) {
  const questions = candidatsQuestions(state);

  if (questions.length > 0) {
    return {
      mode: "question",
      question: questions[0].question,
      questionKey: questions[0].key,
      progress: {
        stage: "understanding",
        completed: false
      }
    };
  }

  let stage = "action";

  if (state.context.employment) {
    stage = "search";
  }

  if (
    state.context.immigration ||
    state.context.administrative
  ) {
    stage = "verification";
  }

  return {
    mode: "orientation",
    progress: {
      stage,
      completed: false
    }
  };
}

function construireVerification(state) {
  const verify = [];

  if (state.context.immigration) {
    verify.push(
      "Le droit exact au séjour et au travail doit être vérifié selon la situation et les documents officiels."
    );
  }

  if (
    state.context.employment &&
    state.context.sansDocuments
  ) {
    verify.push(
      "Les documents nécessaires pour candidater et travailler doivent être vérifiés."
    );
  }

  if (state.context.employment) {
    verify.push(
      "Les conditions de chaque offre doivent être vérifiées individuellement."
    );
  }

  if (state.context.business) {
    verify.push(
      "Les obligations administratives et juridiques doivent être vérifiées avec les sources officielles."
    );
  }

  return uniqueArray(verify);
}

function buildConfirmed(info, language) {
  const result = [];

  const labels = {
    fr: {
      zoneRecherche: "Zone de recherche",
      typeEmploi: "Type d'emploi",
      diplome: "Diplôme",
      experience: "Expérience",
      mobilite: "Mobilité",
      horaires: "Horaires",
      presenceFrance: "Présence en France",
      statutSejour: "Statut de séjour",
      documents: "Documents",
      entreprise: "Projet / entreprise"
    },
    ar: {
      zoneRecherche: "منطقة البحث",
      typeEmploi: "نوع العمل",
      diplome: "الشهادة",
      experience: "الخبرة",
      mobilite: "التنقل",
      horaires: "الأوقات",
      presenceFrance: "الوجود في فرنسا",
      statutSejour: "وضع الإقامة",
      documents: "الوثائق",
      entreprise: "المشروع / المؤسسة"
    },
    en: {
      zoneRecherche: "Search area",
      typeEmploi: "Job type",
      diplome: "Diploma",
      experience: "Experience",
      mobilite: "Mobility",
      horaires: "Availability",
      presenceFrance: "Presence in France",
      statutSejour: "Residence status",
      documents: "Documents",
      entreprise: "Project / business"
    }
  };

  const l = labels[language] || labels.fr;

  const add = (key, value, status = "declared") => {
    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ""
    ) {
      return;
    }

    result.push({
      key,
      label: l[key] || key,
      value: cleanText(value, 1000),
      status
    });
  };

  /*
   * Important:
   * We do NOT call inferred information "confirmed".
   * Anything coming from the user's message is declared,
   * unless the value itself clearly requires verification.
   */

  add("zoneRecherche", info.zoneRecherche, "declared");
  add("typeEmploi", info.typeEmploi, "declared");
  add("diplome", info.diplome, "declared");
  add("experience", info.experience, "declared");
  add("mobilite", info.mobilite, "declared");
  add("horaires", info.horaires, "declared");
  add("presenceFrance", info.presenceFrance, "declared");

  if (info.statutSejour) {
    add(
      "statutSejour",
      info.statutSejour,
      "toVerify"
    );
  }

  if (info.documents) {
    add(
      "documents",
      info.documents,
      "toVerify"
    );
  }

  if (info.entreprise) {
    add(
      "entreprise",
      info.entreprise,
      "declared"
    );
  }

  return result;
}

function buildActions(state, language) {
  if (language === "ar") {
    if (state.context.employment) {
      return [
        "البحث عن عروض مطابقة للمنطقة والملف.",
        "مقارنة شروط عدة عروض.",
        "إعداد سيرة ذاتية بسيطة ومناسبة للملف.",
        "التحقق من شروط البداية والشهادات والخبرة لكل عرض."
      ];
    }

    return [
      "تحديد المعلومات الناقصة.",
      "التحقق من المعلومات المهمة من المصادر الرسمية.",
      "اختيار الخطوة العملية التالية."
    ];
  }

  if (language === "en") {
    if (state.context.employment) {
      return [
        "Search for offers matching the area and profile.",
        "Compare conditions across several offers.",
        "Prepare a simple CV adapted to the profile.",
        "Verify diploma, experience and eligibility requirements for each offer."
      ];
    }

    return [
      "Identify missing information.",
      "Verify important information with official sources.",
      "Choose the next practical action."
    ];
  }

  if (state.context.employment) {
    return [
      "Rechercher les offres correspondant à la zone et au profil.",
      "Comparer les conditions de plusieurs offres.",
      "Préparer un CV simple adapté au profil.",
      "Vérifier les exigences de chaque offre avant de candidater."
    ];
  }

  return [
    "Identifier les informations manquantes.",
    "Vérifier les informations importantes avec les sources officielles.",
    "Choisir la prochaine action pratique."
  ];
}

function buildRecommendations(state, language) {
  if (language === "ar") {
    const recommendations = [];

    if (state.context.employment) {
      recommendations.push(
        "لا تحصر البحث تلقائيًا في مهنة واحدة إذا كان المستخدم يقبل عدة قطاعات."
      );

      if (state.context.sansDiplome) {
        recommendations.push(
          "إعطاء أولوية للعروض التي لا تشترط شهادة أو تقبل المبتدئين."
        );
      }

      if (state.context.sansExperience) {
        recommendations.push(
          "البحث عن العروض التي تقبل المبتدئين أو توفر تدريبًا."
        );
      }
    }

    recommendations.push(
      "عدم اعتبار معلومة غير مؤكدة حقيقة نهائية."
    );

    return recommendations;
  }

  if (language === "en") {
    const recommendations = [];

    if (state.context.employment) {
      recommendations.push(
        "Do not automatically limit the search to one occupation when multiple sectors are acceptable."
      );

      if (state.context.sansDiplome) {
        recommendations.push(
          "Prioritize offers explicitly open to candidates without a diploma or accepting beginners."
        );
      }

      if (state.context.sansExperience) {
        recommendations.push(
          "Look for offers accepting beginners or providing training."
        );
      }
    }

    recommendations.push(
      "Do not treat unverified information as a final fact."
    );

    return recommendations;
  }

  const recommendations = [];

  if (state.context.employment) {
    recommendations.push(
      "Comparer plusieurs secteurs au lieu de limiter automatiquement la recherche à un seul métier."
    );

    if (state.context.sansDiplome) {
      recommendations.push(
        "Cibler en priorité les offres indiquant explicitement qu'aucun diplôme n'est requis ou acceptant les débutants."
      );
    }

    if (state.context.sansExperience) {
      recommendations.push(
        "Rechercher les offres ouvertes aux débutants ou proposant une formation."
      );
    }
  }

  recommendations.push(
    "Ne pas considérer une information non vérifiée comme un fait définitif."
  );

  return recommendations;
}

function appliquerProtectionsEmploi(state, recommendations, language) {
  const result = [...safeArray(recommendations)];

  if (!state.context.employment) {
    return uniqueArray(result);
  }

  if (language === "ar") {
    result.push(
      "التحقق من شروط كل عرض بشكل منفصل، خاصة الشهادة والخبرة ووضع العمل."
    );
  } else if (language === "en") {
    result.push(
      "Verify each offer separately, especially diploma, experience and work eligibility requirements."
    );
  } else {
    result.push(
      "Vérifier chaque offre séparément, notamment les exigences de diplôme, d'expérience et de droit au travail."
    );
  }

  return uniqueArray(result);
}

function buildSources(state) {
  const sources = [
    SOURCES.servicePublic
  ];

  if (state.context.employment) {
    sources.push(
      SOURCES.franceTravail,
      SOURCES.franceTravailOffers
    );
  }

  if (state.context.immigration) {
    sources.push(
      SOURCES.anef,
      SOURCES.travailEtranger
    );
  }

  if (state.context.business) {
    sources.push(
      SOURCES.entreprise,
      SOURCES.guichet
    );
  }

  return sources;
}

function buildFranceTravailSearchURL(info) {
  const url = new URL(
    SOURCES.franceTravailOffers.url
  );

  if (
    info.typeEmploi &&
    info.typeEmploi !== "Peu importe" &&
    info.typeEmploi !== "Tous secteurs"
  ) {
    url.searchParams.set(
      "motsCles",
      info.typeEmploi
    );
  }

  if (
    info.zoneRecherche &&
    info.zoneRecherche !== "Toute la France"
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

async function getFranceTravailToken(env) {
  if (
    !env ||
    !env.FT_CLIENT_ID ||
    !env.FT_CLIENT_SECRET
  ) {
    return null;
  }

  const body = new URLSearchParams();

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

  body.set(
    "scope",
    "api_offresdemploiv2 o2dsoffre"
  );

  const response = await fetch(
    "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded"
      },
      body
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  return data.access_token || null;
}

function normalizeOffer(offer) {
  if (!isPlainObject(offer)) {
    return null;
  }

  const id =
    offer.id ||
    offer.idOffre ||
    "";

  const title =
    offer.intitule ||
    offer.title ||
    "";

  const lieu =
    offer.lieuTravail?.libelle ||
    offer.lieuTravail?.commune ||
    offer.lieu ||
    "";

  const company =
    offer.entreprise?.nom ||
    offer.entreprise?.raisonSociale ||
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
    offer.datePublication ||
    "";

  const description =
    offer.description ||
    "";

  const detail =
    id
      ? `https://candidat.francetravail.fr/offres/recherche/detail/${encodeURIComponent(id)}`
      : SOURCES.franceTravailOffers.url;

  return {
    id: cleanText(id, 200),
    title: cleanText(title, 500),
    location: cleanText(lieu, 500),
    company: cleanText(company, 500),
    contract: cleanText(contract, 300),
    experience: cleanText(experience, 300),
    publication: cleanText(publication, 100),
    description: cleanText(description, 3000),
    url: detail
  };
}

function analyserCompatibiliteOffre(offer, state, language) {
  const text = [
    offer.title,
    offer.description,
    offer.experience,
    offer.contract
  ].join(" ").toLowerCase();

  const evidence = [];
  let status = "toVerify";

  if (
    state.context.sansDiplome
  ) {
    if (
      containsAny(text, [
        "sans diplôme",
        "sans diplome",
        "aucun diplôme",
        "aucun diplome",
        "débutant accepté",
        "debutant accepte",
        "formation"
      ])
    ) {
      evidence.push(
        language === "ar"
          ? "لا يظهر اشتراط شهادة محددة في المعلومات المتاحة."
          : language === "en"
            ? "No specific diploma requirement is visible in the available information."
            : "Aucune exigence de diplôme spécifique visible dans les informations disponibles."
      );
    }
  }

  if (
    state.context.sansExperience
  ) {
    if (
      containsAny(text, [
        "débutant accepté",
        "debutant accepte",
        "sans expérience",
        "sans experience",
        "formation"
      ])
    ) {
      evidence.push(
        language === "ar"
          ? "العرض يشير إلى قبول المبتدئين أو التدريب."
          : language === "en"
            ? "The offer indicates beginners or training may be accepted."
            : "L'offre indique l'ouverture aux débutants ou une possibilité de formation."
      );
    }
  }

  const explicitDiplomaRequirement =
    containsAny(text, [
      "bac+5",
      "bac + 5",
      "bac+4",
      "bac + 4",
      "diplôme obligatoire",
      "diplome obligatoire",
      "diplôme exigé",
      "diplome exige",
      "qualification obligatoire"
    ]);

  const explicitExperienceRequirement =
    containsAny(text, [
      "2 ans d'expérience",
      "2 ans d'experience",
      "3 ans d'expérience",
      "3 ans d'experience",
      "5 ans d'expérience",
      "5 ans d'experience",
      "expérience exigée",
      "experience exigee",
      "expérience obligatoire",
      "experience obligatoire"
    ]);

  if (
    (state.context.sansDiplome && explicitDiplomaRequirement) ||
    (state.context.sansExperience && explicitExperienceRequirement)
  ) {
    status = "lessCompatible";
  } else if (evidence.length > 0) {
    status = "compatible";
  }

  return {
    status,
    evidence: uniqueArray(evidence)
  };
}

async function searchFranceTravail(info, env, state, language) {
  const searchURL = buildFranceTravailSearchURL(info);

  const token = await getFranceTravailToken(env);

  if (!token) {
    return {
      enabled: false,
      offers: [],
      searchURL,
      status: "official_ready",
      message:
        language === "ar"
          ? "البحث الرسمي جاهز للفتح."
          : language === "en"
            ? "Official search is ready to open."
            : "Recherche officielle prête à être ouverte."
    };
  }

  const url = new URL(
    "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search"
  );

  if (
    info.typeEmploi &&
    info.typeEmploi !== "Peu importe" &&
    info.typeEmploi !== "Tous secteurs"
  ) {
    url.searchParams.set(
      "motsCles",
      info.typeEmploi
    );
  }

  if (
    info.zoneRecherche &&
    info.zoneRecherche !== "Toute la France"
  ) {
    url.searchParams.set(
      "commune",
      info.zoneRecherche
    );
  }

  url.searchParams.set(
    "range",
    "0-19"
  );

  try {
    const response = await fetch(
      url.toString(),
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      }
    );

    if (!response.ok) {
      return {
        enabled: true,
        offers: [],
        searchURL,
        status: "no_offers",
        message:
          language === "ar"
            ? "لم يتم استرجاع عروض من البحث."
            : language === "en"
              ? "No offers were retrieved."
              : "Aucune offre n'a été récupérée."
      };
    }

    const data = await response.json();

    const rawOffers =
      Array.isArray(data.resultats)
        ? data.resultats
        : Array.isArray(data.offres)
          ? data.offres
          : [];

    const offers = rawOffers
      .map(normalizeOffer)
      .filter(Boolean)
      .slice(0, 20)
      .map(offer => ({
        ...offer,
        compatibility:
          analyserCompatibiliteOffre(
            offer,
            state,
            language
          )
      }));

    return {
      enabled: true,
      offers,
      searchURL,
      status:
        offers.length > 0
          ? "offers_retrieved"
          : "no_offers",
      message:
        offers.length > 0
          ? (
            language === "ar"
              ? "تم استرجاع عروض فعلية."
              : language === "en"
                ? "Offers were retrieved."
                : "Offres récupérées."
          )
          : (
            language === "ar"
              ? "لم يتم العثور على عروض لهذه المعايير."
              : language === "en"
                ? "No offers were retrieved for this search."
                : "Aucune offre récupérée pour cette recherche."
          )
    };
  } catch (error) {
    return {
      enabled: true,
      offers: [],
      searchURL,
      status: "no_offers",
      message:
        language === "ar"
          ? "تعذر استرجاع العروض حاليًا."
          : language === "en"
            ? "Offers could not be retrieved right now."
            : "Les offres ne peuvent pas être récupérées actuellement."
    };
  }
}

function journeyLabel(stage, language) {
  const ui = UI[language] || UI.fr;

  return {
    understanding: ui.understanding,
    verification: ui.verification,
    search: ui.search,
    comparison: ui.comparison,
    action: ui.action,
    followup: ui.followup
  }[stage] || ui.understanding;
}

function buildOpportunityData(search, language) {
  if (!search) return null;

  const ui = UI[language] || UI.fr;

  return {
    status: search.status,
    message:
      search.status === "offers_retrieved"
        ? ui.offersRetrieved
        : search.status === "official_ready"
          ? ui.officialReady
          : ui.noOffers,
    searchURL: search.searchURL,
    offers: safeArray(search.offers, 20)
  };
}

function systemPrompt(language, state) {
  const langName =
    language === "ar"
      ? "Arabic"
      : language === "en"
        ? "English"
        : "French";

  return `
You are Go Rare AI, a practical situation-intelligence assistant.

Your mission:
1. Understand the user's situation.
2. Detect what information is missing.
3. Distinguish confirmed information from information that must be verified.
4. Use official sources when relevant.
5. Search or prepare searches for real opportunities when available.
6. Compare options without inventing facts.
7. Identify obstacles and risks.
8. Propose concrete next steps.
9. Help the user move toward execution.

Language: ${langName}

Rules:
- Never invent an offer, employer, legal right, salary, qualification or requirement.
- Never present an unverified assumption as a fact.
- For legal and administrative topics, recommend verification against official sources.
- If real retrieved opportunities are supplied, distinguish them from a generic search link.
- Be concise and practical.
- Prefer numbered next steps.
- Do not claim that an API search happened if it did not.
- Do not calculate distance unless actual distance data exists.
- Do not make promises of employment or success.

Known state:
${JSON.stringify(state.info)}

Context:
${JSON.stringify(state.context)}
`;
}

async function askAI(env, messages) {
  if (!env || !env.AI) {
    return "";
  }

  const safeMessages = safeArray(messages, 20)
    .filter(x => isPlainObject(x))
    .map(x => ({
      role:
        x.role === "assistant"
          ? "assistant"
          : "user",
      content: cleanText(
        x.content || "",
        LIMITS.message
      )
    }));

  try {
    const result = await env.AI.run(
      MODEL,
      {
        messages: safeMessages
      }
    );

    return cleanText(
      result?.response || "",
      12000
    );
  } catch {
    return "";
  }
}

function buildResult({
  language,
  state,
  decision,
  sources,
  verification,
  actions,
  recommendations,
  opportunities,
  aiText
}) {
  const ui = UI[language] || UI.fr;

  let stage =
    decision?.progress?.stage ||
    "understanding";

  if (
    opportunities &&
    opportunities.offers &&
    opportunities.offers.length > 0
  ) {
    stage = "comparison";
  } else if (
    decision?.mode === "orientation" &&
    verification.length > 0
  ) {
    stage = "verification";
  } else if (
    decision?.mode === "orientation"
  ) {
    stage = "action";
  }

  /*
   * V10.5.1 — Evidence separation
   *
   * buildConfirmed() now returns records with a status:
   *   declared
   *   inferred
   *   toVerify
   *   official
   *
   * We separate them here so the UI/API never presents
   * information requiring verification as officially confirmed.
   */

  const evidence = buildConfirmed(
    state.info,
    language
  );

  const confirmed = [];
  const inferred = [];
  const toVerify = [];
  const official = [];

  for (const item of evidence) {
    if (!item || !item.value) continue;

    if (item.status === "official") {
      official.push(item);
    } else if (item.status === "toVerify") {
      toVerify.push(item);
    } else if (item.status === "inferred") {
      inferred.push(item);
    } else {
      confirmed.push(item);
    }
  }

  /*
   * Keep verification generated by the decision engine.
   * Add information-level verification without duplicating
   * identical objects when possible.
   */

  const finalVerify = [
    ...toVerify,
    ...(Array.isArray(verification) ? verification : [])
  ];

  const uniqueVerify = [];
  const verifyKeys = new Set();

  for (const item of finalVerify) {
    const key =
      typeof item === "string"
        ? item
        : item?.key ||
          item?.label ||
          item?.message ||
          JSON.stringify(item);

    if (!verifyKeys.has(key)) {
      verifyKeys.add(key);
      uniqueVerify.push(item);
    }
  }

  return {
    version: VERSION,
    decisionVersion: DECISION_VERSION,

    language,

    /*
     * User-declared information.
     * This is NOT the same as information verified by an
     * official source.
     */
    confirmed,

    /*
     * Information inferred by Go Rare AI.
     * Kept separate from declared information.
     */
    inferred,

    /*
     * Information requiring verification.
     */
    verify: uniqueVerify,

    /*
     * Information verified through an official source.
     * Currently normally empty until official verification
     * is actually performed.
     */
    official,

    missing:
      decision?.mode === "question"
        ? [{
            key: decision.questionKey,
            question: decision.question
          }]
        : [],

    nextQuestion:
      decision?.mode === "question"
        ? decision.question
        : null,

    actions,

    recommendations,

    protection:
      language === "ar"
        ? "يجب التحقق من المعلومات الحساسة قبل اتخاذ قرار نهائي."
        : language === "en"
          ? "Sensitive information must be verified before a final decision."
          : "Les informations sensibles doivent être vérifiées avant toute décision finale.",

    journey: {
      stage,
      label: journeyLabel(stage, language)
    },

    sources,

    opportunities,

    ai: aiText || null,

    ui: {
      result: ui.result
    }
  };
}

async function analyserQuestion(payload, env) {
  const question = cleanText(
    payload.question || "",
    LIMITS.question
  );

  if (!question) {
    throw new Error("QUESTION_REQUIRED");
  }

  const state =
    construireEtatConversation(
      question,
      payload
    );

  const language =
    normalizeLanguage(
      payload.language || state.language
    );

  state.language = language;

  const decision =
    construireDecision(state);

  const sources =
    buildSources(state);

  const verification =
    construireVerification(state);

  let actions =
    buildActions(state, language);

  let recommendations =
    buildRecommendations(
      state,
      language
    );

  recommendations =
    appliquerProtectionsEmploi(
      state,
      recommendations,
      language
    );

  let opportunities = null;

  if (
    state.context.employment &&
    decision.mode === "orientation"
  ) {
    const search =
      await searchFranceTravail(
        state.info,
        env,
        state,
        language
      );

    opportunities =
      buildOpportunityData(
        search,
        language
      );
  }

  let aiText = "";

  if (
    decision.mode === "orientation"
  ) {
    const prompt =
      systemPrompt(language, state);

    const history =
      Array.isArray(payload.history)
        ? payload.history
        : [];

    const messages = [
      {
        role: "system",
        content: prompt
      },
      ...history
        .slice(-12)
        .map(x => ({
          role:
            x.role === "assistant"
              ? "assistant"
              : "user",
          content: cleanText(
            x.content || "",
            4000
          )
        })),
      {
        role: "user",
        content: question
      }
    ];

    aiText =
      await askAI(
        env,
        messages
      );
  }

  const result =
    buildResult({
      language,
      state,
      decision,
      sources,
      verification,
      actions,
      recommendations,
      opportunities,
      aiText
    });

  return result;
}

function jsonResponse(data, status = 200) {
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
  message,
  status = 400
) {
  return jsonResponse(
    {
      error: message
    },
    status
  );
}

function getClientIP(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "unknown"
  );
}

function checkRateLimit(request) {
  const ip = getClientIP(request);
  const now = Date.now();

  let entry = rateStore.get(ip);

  if (!entry || now - entry.start > RATE.window) {
    entry = {
      start: now,
      count: 0
    };

    rateStore.set(ip, entry);
  }

  entry.count++;

  if (entry.count > RATE.max) {
    return false;
  }

  if (rateStore.size > 5000) {
    for (const [
      key,
      value
    ] of rateStore.entries()) {
      if (
        now - value.start >
        RATE.window
      ) {
        rateStore.delete(key);
      }
    }
  }

  return true;
}

function securityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy":
      "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), geolocation=(), microphone=(self), payment=()",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
  };
}
function withSecurity(response) {
  const headers = new Headers(response.headers);

  const security = securityHeaders();

  for (const [key, value] of Object.entries(security)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function analyzeImage(env, payload) {
  const image = payload?.image;

  if (!image) {
    throw new Error("IMAGE_REQUIRED");
  }

  const size = base64ByteLength(image);

  if (size <= 0 || size > LIMITS.image) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  if (!env || !env.AI) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  let imageData = image;

  if (image.includes(",")) {
    imageData = image.split(",").pop();
  }

  try {
    const result = await env.AI.run(
      MODEL_VISION,
      {
        image: Array.from(
          Uint8Array.from(
            atob(imageData),
            c => c.charCodeAt(0)
          )
        ),
        prompt: `
Analyse cette image pour Go Rare AI.

Objectif :
- Identifier uniquement les informations réellement visibles.
- Ne pas inventer.
- Décrire les éléments utiles à la situation de l'utilisateur.
- Si un document apparaît, distinguer clairement ce qui est lisible de ce qui ne l'est pas.
- Ne jamais déduire une identité, un droit ou une situation juridique uniquement à partir d'une image.
- Répondre de manière courte et pratique.
`
      }
    );

    return {
      text: cleanText(
        result?.response || result?.description || "",
        12000
      )
    };
  } catch (error) {
    throw new Error("IMAGE_ANALYSIS_FAILED");
  }
}

async function transcribeAudio(env, payload) {
  const audio = payload?.audio;

  if (!audio) {
    throw new Error("AUDIO_REQUIRED");
  }

  const size = base64ByteLength(audio);

  if (size <= 0 || size > LIMITS.audio) {
    throw new Error("AUDIO_TOO_LARGE");
  }

  if (!env || !env.AI) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  let audioData = audio;

  if (audio.includes(",")) {
    audioData = audio.split(",").pop();
  }

  try {
    const bytes = Uint8Array.from(
      atob(audioData),
      c => c.charCodeAt(0)
    );

    const result = await env.AI.run(
      MODEL_AUDIO,
      {
        audio: Array.from(bytes)
      }
    );

    return {
      text: cleanText(
        result?.text || "",
        LIMITS.question
      )
    };
  } catch (error) {
    throw new Error("AUDIO_TRANSCRIPTION_FAILED");
  }
}

async function readJSON(request) {
  const contentLength =
    Number(
      request.headers.get("Content-Length") || 0
    );

  if (
    contentLength &&
    contentLength > LIMITS.jsonBody
  ) {
    throw new Error("BODY_TOO_LARGE");
  }

  const text = await request.text();

  if (!text) {
    throw new Error("EMPTY_BODY");
  }

  if (text.length > LIMITS.jsonBody) {
    throw new Error("BODY_TOO_LARGE");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("INVALID_JSON");
  }
}

function cookieValue(request, name) {
  const cookie =
    request.headers.get("Cookie") || "";

  const parts = cookie.split(";");

  for (const part of parts) {
    const [key, ...rest] =
      part.trim().split("=");

    if (key === name) {
      return decodeURIComponent(
        rest.join("=")
      );
    }
  }

  return null;
}

function randomToken(length = 32) {
  const bytes =
    new Uint8Array(length);

  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map(
      b => b.toString(16).padStart(2, "0")
    )
    .join("");
}

async function sha256(value) {
  const data =
    new TextEncoder().encode(value);

  const hash =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );

  return Array.from(
    new Uint8Array(hash)
  )
    .map(
      b => b.toString(16).padStart(2, "0")
    )
    .join("");
}

function oauthConfig(env) {
  return {
    clientId:
      env?.OAUTH_CLIENT_ID || "",
    clientSecret:
      env?.OAUTH_CLIENT_SECRET || "",
    authorizeURL:
      env?.OAUTH_AUTHORIZE_URL || "",
    tokenURL:
      env?.OAUTH_TOKEN_URL || "",
    userInfoURL:
      env?.OAUTH_USERINFO_URL || "",
    redirectURL:
      env?.OAUTH_REDIRECT_URL || ""
  };
}

async function handleOAuthConnect(request, env) {
  const config =
    oauthConfig(env);

  if (
    !config.clientId ||
    !config.authorizeURL ||
    !config.redirectURL
  ) {
    return withSecurity(
      errorResponse(
        "OAuth_NOT_CONFIGURED",
        503
      )
    );
  }

  const state =
    randomToken(32);

  const stateHash =
    await sha256(state);

  const url =
    new URL(config.authorizeURL);

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
    "state",
    state
  );

  const response =
    Response.redirect(
      url.toString(),
      302
    );

  response.headers.append(
    "Set-Cookie",
    `grai_oauth_state=${encodeURIComponent(stateHash)}; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax`
  );

  return response;
}

async function handleOAuthCallback(request, env) {
  const config =
    oauthConfig(env);

  const requestURL =
    new URL(request.url);

  const code =
    requestURL.searchParams.get("code");

  const state =
    requestURL.searchParams.get("state");

  if (!code || !state) {
    return withSecurity(
      errorResponse(
        "OAUTH_CALLBACK_INVALID",
        400
      )
    );
  }

  const storedState =
    cookieValue(
      request,
      "grai_oauth_state"
    );

  if (!storedState) {
    return withSecurity(
      errorResponse(
        "OAUTH_STATE_MISSING",
        400
      )
    );
  }

  const receivedHash =
    await sha256(state);

  if (receivedHash !== storedState) {
    return withSecurity(
      errorResponse(
        "OAUTH_STATE_INVALID",
        400
      )
    );
  }

  if (
    !config.clientId ||
    !config.clientSecret ||
    !config.tokenURL ||
    !config.redirectURL
  ) {
    return withSecurity(
      errorResponse(
        "OAUTH_NOT_CONFIGURED",
        503
      )
    );
  }

  const body =
    new URLSearchParams();

  body.set(
    "grant_type",
    "authorization_code"
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
    "code",
    code
  );

  body.set(
    "redirect_uri",
    config.redirectURL
  );

  try {
    const tokenResponse =
      await fetch(
        config.tokenURL,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded"
          },
          body
        }
      );

    if (!tokenResponse.ok) {
      return withSecurity(
        errorResponse(
          "OAUTH_TOKEN_FAILED",
          502
        )
      );
    }

    const tokenData =
      await tokenResponse.json();

    let userIdentity = null;

    if (
      config.userInfoURL &&
      tokenData.access_token
    ) {
      try {
        const userResponse =
          await fetch(
            config.userInfoURL,
            {
              headers: {
                Authorization:
                  `Bearer ${tokenData.access_token}`
              }
            }
          );

        if (userResponse.ok) {
          const userData =
            await userResponse.json();

          userIdentity = {
            id:
              userData.sub ||
              userData.id ||
              null
          };
        }
      } catch {
        userIdentity = null;
      }
    }

    const sessionPayload = {
      authenticated: true,
      user:
        userIdentity || {
          id: null
        },
      createdAt: Date.now()
    };

    const session =
      btoa(
        JSON.stringify(sessionPayload)
      );

    const response =
      new Response(
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
            window.location.href = "/";
          </script>
        </body>
        </html>
        `,
        {
          status: 200,
          headers: {
            "Content-Type":
              "text/html; charset=utf-8"
          }
        }
      );

    response.headers.append(
      "Set-Cookie",
      "grai_oauth_state=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax"
    );

    response.headers.append(
      "Set-Cookie",
      `grai_user=${encodeURIComponent(session)}; Max-Age=86400; Path=/; HttpOnly; Secure; SameSite=Lax`
    );

    return withSecurity(response);
  } catch {
    return withSecurity(
      errorResponse(
        "OAUTH_CALLBACK_FAILED",
        502
      )
    );
  }
}

function billingStatus(request) {
  const raw =
    cookieValue(
      request,
      "grai_user"
    );

  if (!raw) {
    return {
      authenticated: false
    };
  }

  try {
    const data =
      JSON.parse(atob(raw));

    return {
      authenticated:
        data.authenticated === true,
      hasUser:
        Boolean(data.user?.id)
    };
  } catch {
    return {
      authenticated: false
    };
  }
}

function renderHTML() {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">

<title>Go Rare AI</title>

<meta
  name="description"
  content="Go Rare AI — Comprendre votre situation. Voir plus loin."
>

<style>
:root{
  color-scheme:dark;
  --bg:#07090d;
  --panel:rgba(18,22,30,.78);
  --panel2:rgba(25,30,40,.88);
  --line:rgba(255,255,255,.09);
  --text:#f5f7fa;
  --muted:#aeb7c5;
  --accent:#ffffff;
  --danger:#ff8a8a;
}

*{
  box-sizing:border-box;
}

html,
body{
  margin:0;
  padding:0;
  min-height:100%;
  background:
    radial-gradient(
      circle at top,
      #18202d 0,
      var(--bg) 48%,
      #030407 100%
    );
  color:var(--text);
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

body{
  padding:20px;
}

.app{
  width:min(960px,100%);
  margin:0 auto;
}

header{
  text-align:center;
  padding:18px 0 24px;
}

.logo{
  font-size:30px;
  font-weight:800;
  letter-spacing:-1px;
}

.subtitle{
  color:var(--muted);
  margin-top:6px;
}

.toolbar{
  display:flex;
  gap:8px;
  justify-content:center;
  flex-wrap:wrap;
  margin-bottom:16px;
}

button,
select{
  border:1px solid var(--line);
  background:var(--panel2);
  color:var(--text);
  border-radius:12px;
  padding:10px 14px;
  cursor:pointer;
}

button:hover{
  border-color:rgba(255,255,255,.22);
}

.card{
  background:var(--panel);
  border:1px solid var(--line);
  border-radius:22px;
  padding:18px;
  margin-bottom:14px;
  backdrop-filter:blur(16px);
  box-shadow:
    0 20px 60px rgba(0,0,0,.25);
}

label{
  display:block;
  color:var(--muted);
  font-size:13px;
  margin-bottom:8px;
}

textarea{
  width:100%;
  min-height:145px;
  resize:vertical;
  border:1px solid var(--line);
  border-radius:16px;
  padding:15px;
  background:rgba(0,0,0,.22);
  color:var(--text);
  outline:none;
  font-size:16px;
  line-height:1.5;
}

textarea:focus{
  border-color:rgba(255,255,255,.25);
}

.actions{
  display:flex;
  gap:8px;
  flex-wrap:wrap;
  margin-top:12px;
}

.primary{
  background:#fff;
  color:#050609;
  font-weight:700;
}

.status{
  color:var(--muted);
  font-size:13px;
  margin-top:10px;
}

.journey{
  display:flex;
  gap:6px;
  overflow:auto;
  padding-bottom:4px;
}

.step{
  white-space:nowrap;
  padding:7px 10px;
  border-radius:999px;
  background:rgba(255,255,255,.05);
  border:1px solid var(--line);
  font-size:12px;
  color:var(--muted);
}

.step.active{
  color:var(--text);
  border-color:rgba(255,255,255,.25);
}

h2{
  font-size:18px;
  margin:0 0 12px;
}

h3{
  font-size:15px;
  margin:16px 0 8px;
}

ul{
  margin:8px 0 0;
  padding-left:20px;
}

li{
  margin:7px 0;
  color:#dce2eb;
}

.info-grid{
  display:grid;
  grid-template-columns:
    repeat(auto-fit,minmax(220px,1fr));
  gap:8px;
}

.info{
  background:rgba(255,255,255,.035);
  border:1px solid var(--line);
  border-radius:12px;
  padding:10px;
}

.info-key{
  color:var(--muted);
  font-size:12px;
}

.info-value{
  margin-top:4px;
  font-weight:600;
}

.offer{
  border:1px solid var(--line);
  border-radius:16px;
  padding:14px;
  margin-top:10px;
  background:rgba(255,255,255,.025);
}

.offer-title{
  font-weight:700;
}

.offer-meta{
  color:var(--muted);
  font-size:13px;
  margin-top:5px;
}

.badge{
  display:inline-block;
  margin-top:9px;
  padding:5px 8px;
  border-radius:999px;
  background:rgba(255,255,255,.07);
  font-size:12px;
}

a{
  color:var(--text);
}

.empty{
  color:var(--muted);
}

.error{
  color:var(--danger);
}

footer{
  text-align:center;
  color:var(--muted);
  font-size:12px;
  padding:20px 0 5px;
}

@media(max-width:600px){
  body{
    padding:12px;
  }

  .card{
    border-radius:17px;
    padding:14px;
  }

  textarea{
    min-height:125px;
  }
}
</style>
</head>

<body>
<div class="app">

<header>
  <div class="logo">Go Rare AI</div>
  <div class="subtitle">
    Comprendre votre situation. Voir plus loin.
  </div>
</header>

<div class="toolbar">
  <select id="language">
    <option value="fr">Français</option>
    <option value="ar">العربية</option>
    <option value="en">English</option>
  </select>

  <button id="connectBtn">
    Connecter mon compte
  </button>
</div>

<div class="card">
  <div class="journey" id="journey">
    <div class="step active" data-stage="understanding">
      Compréhension
    </div>
    <div class="step" data-stage="verification">
      Vérification
    </div>
    <div class="step" data-stage="search">
      Recherche
    </div>
    <div class="step" data-stage="comparison">
      Comparaison
    </div>
    <div class="step" data-stage="action">
      Action
    </div>
    <div class="step" data-stage="followup">
      Suivi
    </div>
  </div>
</div>

<div class="card">
  <label for="question">
    Situation
  </label>

  <textarea
    id="question"
    placeholder="Décrivez votre situation..."
  ></textarea>

  <div class="actions">
    <button
      class="primary"
      id="analyzeBtn"
    >
      Analyser
    </button>

    <button id="imageBtn">
      Image
    </button>

    <button id="microBtn">
      Micro
    </button>

    <input
      id="imageInput"
      type="file"
      accept="image/*"
      hidden
    >
  </div>

  <div
    class="status"
    id="status"
  >
    Prêt.
  </div>
</div>

<div
  id="result"
></div>

<footer>
  Go Rare AI · Version ${VERSION}
</footer>

</div>

<script>
const UI = ${JSON.stringify(UI)};

let conversationHistory = [];
let confirmedInfo = {};
let mediaRecorder = null;
let audioChunks = [];
let recording = false;

const questionEl =
  document.getElementById("question");

const analyzeBtn =
  document.getElementById("analyzeBtn");

const imageBtn =
  document.getElementById("imageBtn");

const microBtn =
  document.getElementById("microBtn");

const imageInput =
  document.getElementById("imageInput");

const languageEl =
  document.getElementById("language");

const statusEl =
  document.getElementById("status");

const resultEl =
  document.getElementById("result");

const connectBtn =
  document.getElementById("connectBtn");

function t(key){
  const lang =
    languageEl.value || "fr";

  return (
    UI[lang]?.[key] ||
    UI.fr[key] ||
    key
  );
}

function setStatus(text){
  statusEl.textContent = text;
}

function escapeHTML(value){
  return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function trimHistory(){
  conversationHistory =
    conversationHistory.slice(-20);

  let total = 0;

  const output = [];

  for(
    let i = conversationHistory.length - 1;
    i >= 0;
    i--
  ){
    const item =
      conversationHistory[i];

    const content =
      String(item.content || "");

    if(
      total + content.length >
      24000
    ){
      break;
    }

    output.unshift(item);
    total += content.length;
  }

  conversationHistory =
    output;
}

function addHistory(role, content){
  if(!content) return;

  conversationHistory.push({
    role,
    content:String(content).slice(0,6000)
  });

  trimHistory();
}

function renderJourney(stage){
  document
    .querySelectorAll(".step")
    .forEach(el => {
      el.classList.toggle(
        "active",
        el.dataset.stage === stage
      );
    });
}

function renderResult(data){
  const lang =
    languageEl.value || "fr";

  confirmedInfo =
    Object.assign(
      {},
      confirmedInfo,
      Object.fromEntries(
        (data.confirmed || [])
          .map(x => [
            x.key,
            x.value
          ])
      )
    );

  if(data.journey){
    renderJourney(
      data.journey.stage
    );
  }

  let html = "";

  html += '<div class="card">';
  html += "<h2>" +
    escapeHTML(t("result")) +
    "</h2>";

  if(data.nextQuestion){
    html +=
      '<div class="info">' +
      escapeHTML(data.nextQuestion) +
      "</div>";
  }

  html += "</div>";

  if(
    data.confirmed &&
    data.confirmed.length
  ){
    html +=
      '<div class="card">' +
      "<h2>" +
      escapeHTML(t("confirmed")) +
      "</h2>" +
      '<div class="info-grid">';

    data.confirmed.forEach(item => {
      html +=
        '<div class="info">' +
        '<div class="info-key">' +
        escapeHTML(item.label) +
        "</div>" +
        '<div class="info-value">' +
        escapeHTML(item.value) +
        "</div>" +
        "</div>";
    });

    html +=
      "</div></div>";
  }

  if(
    data.verify &&
    data.verify.length
  ){
    html +=
      '<div class="card">' +
      "<h2>" +
      escapeHTML(t("verify")) +
      "</h2><ul>";

    data.verify.forEach(item => {
      html +=
        "<li>" +
        escapeHTML(item) +
        "</li>";
    });

    html +=
      "</ul></div>";
  }

  if(
    data.missing &&
    data.missing.length
  ){
    html +=
      '<div class="card">' +
      "<h2>" +
      escapeHTML(t("missing")) +
      "</h2><ul>";

    data.missing.forEach(item => {
      html +=
        "<li>" +
        escapeHTML(item.question) +
        "</li>";
    });

    html +=
      "</ul></div>";
  }

  if(
    data.actions &&
    data.actions.length
  ){
    html +=
      '<div class="card">' +
      "<h2>" +
      escapeHTML(t("actions")) +
      "</h2><ul>";

    data.actions.forEach(item => {
      html +=
        "<li>" +
        escapeHTML(item) +
        "</li>";
    });

    html +=
      "</ul></div>";
  }

  if(
    data.recommendations &&
    data.recommendations.length
  ){
    html +=
      '<div class="card">' +
      "<h2>" +
      escapeHTML(
        t("recommendations")
      ) +
      "</h2><ul>";

    data.recommendations.forEach(item => {
      html +=
        "<li>" +
        escapeHTML(item) +
        "</li>";
    });

    html +=
      "</ul></div>";
  }

  if(data.opportunities){
    const opp =
      data.opportunities;

    html +=
      '<div class="card">' +
      "<h2>" +
      escapeHTML(
        t("opportunities")
      ) +
      "</h2>";

    html +=
      '<div class="status">' +
      escapeHTML(
        opp.message || ""
      ) +
      "</div>";

    if(
      opp.searchURL
    ){
      html +=
        '<p><a href="' +
        escapeHTML(
          opp.searchURL
        ) +
        '" target="_blank" rel="noopener noreferrer">' +
        escapeHTML(
          opp.status ===
          "offers_retrieved"
            ? "Ouvrir la recherche officielle"
            : t("officialReady")
        ) +
        "</a></p>";
    }

    if(
      opp.offers &&
      opp.offers.length
    ){
      opp.offers.forEach(
        offer => {
          const c =
            offer.compatibility ||
            {};

          let badge =
            t("toVerify");

          if(
            c.status ===
            "compatible"
          ){
            badge =
              t("compatible");
          }

          if(
            c.status ===
            "lessCompatible"
          ){
            badge =
              t("lessCompatible");
          }

          html +=
            '<div class="offer">' +
            '<div class="offer-title">' +
            escapeHTML(
              offer.title
            ) +
            "</div>";

          if(
            offer.company
          ){
            html +=
              '<div class="offer-meta">' +
              escapeHTML(
                offer.company
              ) +
              "</div>";
          }

          if(
            offer.location
          ){
            html +=
              '<div class="offer-meta">' +
              escapeHTML(
                offer.location
              ) +
              "</div>";
          }

          if(
            offer.contract
          ){
            html +=
              '<div class="offer-meta">' +
              escapeHTML(
                offer.contract
              ) +
              "</div>";
          }

          html +=
            '<div class="badge">' +
            escapeHTML(badge) +
            "</div>";

          if(
            offer.url
          ){
            html +=
              '<p><a href="' +
              escapeHTML(
                offer.url
              ) +
              '" target="_blank" rel="noopener noreferrer">' +
              "Voir l'offre officielle" +
              "</a></p>";
          }

          html +=
            "</div>";
        }
      );
    }

    html +=
      "</div>";
  }

  if(data.ai){
    html +=
      '<div class="card">' +
      "<h2>Go Rare AI</h2>" +
      '<div class="empty">' +
      escapeHTML(data.ai)
        .replace(/\\n/g,"<br>") +
      "</div>" +
      "</div>";
  }

  if(
    data.sources &&
    data.sources.length
  ){
    html +=
      '<div class="card">' +
      "<h2>" +
      escapeHTML(t("sources")) +
      "</h2><ul>";

    data.sources.forEach(source => {
      html +=
        "<li>" +
        '<a href="' +
        escapeHTML(source.url) +
        '" target="_blank" rel="noopener noreferrer">' +
        escapeHTML(source.name) +
        "</a>" +
        "</li>";
    });

    html +=
      "</ul></div>";
  }

  resultEl.innerHTML = html;
}

async function analyze(){
  const question =
    questionEl.value.trim();

  if(!question){
    setStatus(
      "Décrivez votre situation."
    );
    return;
  }

  analyzeBtn.disabled = true;
  setStatus("Analyse...");

  try{
    const response =
      await fetch(
        "/api/analyze",
        {
          method:"POST",
          headers:{
            "Content-Type":
              "application/json"
          },
          body:JSON.stringify({
            question,
            language:
              languageEl.value,
            profile:"particulier",
            history:
              conversationHistory,
            info:
              confirmedInfo
          })
        }
      );

    const data =
      await response.json();

    if(!response.ok){
      throw new Error(
        data.error ||
        "ERROR"
      );
    }

    renderResult(data);

    addHistory(
      "user",
      question
    );

    if(data.nextQuestion){
      addHistory(
        "assistant",
        data.nextQuestion
      );
    }else if(data.ai){
      addHistory(
        "assistant",
        data.ai
      );
    }

    questionEl.value = "";

    setStatus(
      data.journey?.label ||
      "Prêt."
    );
  }catch(error){
    console.error(error);

    setStatus(
      "Une erreur est survenue."
    );
  }finally{
    analyzeBtn.disabled = false;
  }
}

async function analyzeImageFile(file){
  if(!file) return;

  if(
    file.size >
    7000000
  ){
    setStatus(
      "Image trop volumineuse."
    );
    return;
  }

  setStatus(
    "Analyse de l'image..."
  );

  try{
    const base64 =
      await new Promise(
        (resolve,reject) => {
          const reader =
            new FileReader();

          reader.onload =
            () => resolve(
              reader.result
            );

          reader.onerror =
            reject;

          reader.readAsDataURL(file);
        }
      );

    const response =
      await fetch(
        "/api/image",
        {
          method:"POST",
          headers:{
            "Content-Type":
              "application/json"
          },
          body:JSON.stringify({
            image:base64,
            language:
              languageEl.value
          })
        }
      );

    const data =
      await response.json();

    if(!response.ok){
      throw new Error(
        data.error ||
        "IMAGE_ERROR"
      );
    }

    if(data.text){
      questionEl.value =
        data.text;

      addHistory(
        "assistant",
        data.text
      );
    }

    setStatus(
      "Image analysée."
    );
  }catch(error){
    console.error(error);

    setStatus(
      "Impossible d'analyser l'image."
    );
  }
}

async function startMicrophone(){
  if(recording){
    mediaRecorder?.stop();
    return;
  }

  if(
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ){
    setStatus(
      "Microphone non disponible."
    );
    return;
  }

  try{
    const stream =
      await navigator.mediaDevices
        .getUserMedia({
          audio:true
        });

    audioChunks = [];

    mediaRecorder =
      new MediaRecorder(stream);

    mediaRecorder.ondataavailable =
      event => {
        if(event.data.size > 0){
          audioChunks.push(
            event.data
          );
        }
      };

    mediaRecorder.onstop =
      async () => {
        stream
          .getTracks()
          .forEach(track =>
            track.stop()
          );

        recording = false;
        microBtn.textContent =
          t("microphone");

        const blob =
          new Blob(
            audioChunks,
            {
              type:
                mediaRecorder.mimeType ||
                "audio/webm"
            }
          );

        await sendAudio(blob);
      };

    mediaRecorder.start();

    recording = true;

    microBtn.textContent =
      t("stop");

    setStatus(
      "Enregistrement..."
    );
  }catch(error){
    console.error(error);

    setStatus(
      "Impossible d'utiliser le microphone."
    );
  }
}

async function sendAudio(blob){
  if(
    blob.size >
    12000000
  ){
    setStatus(
      "Audio trop volumineux."
    );
    return;
  }

  setStatus(
    "Transcription..."
  );

  try{
    const base64 =
      await new Promise(
        (resolve,reject) => {
          const reader =
            new FileReader();

          reader.onload =
            () => resolve(
              reader.result
            );

          reader.onerror =
            reject;

          reader.readAsDataURL(blob);
        }
      );

    const response =
      await fetch(
        "/api/audio",
        {
          method:"POST",
          headers:{
            "Content-Type":
              "application/json"
          },
          body:JSON.stringify({
            audio:base64,
            language:
              languageEl.value
          })
        }
      );

    const data =
      await response.json();

    if(!response.ok){
      throw new Error(
        data.error ||
        "AUDIO_ERROR"
      );
    }

    if(data.text){
      questionEl.value =
        data.text;
    }

    setStatus(
      "Transcription terminée."
    );
  }catch(error){
    console.error(error);

    setStatus(
      "Impossible de transcrire l'audio."
    );
  }
}

analyzeBtn.addEventListener(
  "click",
  analyze
);

imageBtn.addEventListener(
  "click",
  () => imageInput.click()
);

imageInput.addEventListener(
  "change",
  event => {
    const file =
      event.target.files?.[0];

    analyzeImageFile(file);
  }
);

microBtn.addEventListener(
  "click",
  startMicrophone
);

connectBtn.addEventListener(
  "click",
  () => {
    window.location.href =
      "/oauth/connect";
  }
);

questionEl.addEventListener(
  "keydown",
  event => {
    if(
      event.key === "Enter" &&
      (event.ctrlKey ||
       event.metaKey)
    ){
      event.preventDefault();
      analyze();
    }
  }
);
</script>
</body>
</html>`;
}

async function handleAnalyze(request, env) {
  const payload =
    await readJSON(request);

  if (!isPlainObject(payload)) {
    throw new Error("INVALID_PAYLOAD");
  }

  if (
    payload.question &&
    String(payload.question).length >
    LIMITS.question
  ) {
    throw new Error("QUESTION_TOO_LONG");
  }

  if (
    payload.history &&
    !Array.isArray(payload.history)
  ) {
    throw new Error("INVALID_HISTORY");
  }

  if (
    payload.info &&
    !isPlainObject(payload.info)
  ) {
    throw new Error("INVALID_INFO");
  }

  const result =
    await analyserQuestion(
      payload,
      env
    );

  return jsonResponse(
    result,
    200
  );
}

async function handleImage(request, env) {
  const payload =
    await readJSON(request);

  const result =
    await analyzeImage(
      env,
      payload
    );

  return jsonResponse(
    result,
    200
  );
}

async function handleAudio(request, env) {
  const payload =
    await readJSON(request);

  const result =
    await transcribeAudio(
      env,
      payload
    );

  return jsonResponse(
    result,
    200
  );
}

export default {
  async fetch(request, env) {
    try {
      if (
        request.method === "OPTIONS"
      ) {
        return withSecurity(
          new Response(null, {
            status:204
          })
        );
      }

      if (
        !checkRateLimit(request)
      ) {
        return withSecurity(
          errorResponse(
            "RATE_LIMITED",
            429
          )
        );
      }

      const url =
        new URL(request.url);

      if (
        request.method === "GET" &&
        url.pathname === "/"
      ) {
        return withSecurity(
          new Response(
            renderHTML(),
            {
              status:200,
              headers:{
                "Content-Type":
                  "text/html; charset=utf-8",
                "Cache-Control":
                  "no-store"
              }
            }
          )
        );
      }

      if (
        request.method === "GET" &&
        url.pathname === "/health"
      ) {
        return withSecurity(
          jsonResponse({
            ok:true,
            service:"Go Rare AI",
            version:VERSION,
            decisionVersion:
              DECISION_VERSION,
            timestamp:
              new Date().toISOString()
          })
        );
      }

      if (
        request.method === "GET" &&
        url.pathname ===
          "/api/billing/status"
      ) {
        return withSecurity(
          jsonResponse(
            billingStatus(request)
          )
        );
      }

      if (
        request.method === "GET" &&
        url.pathname ===
          "/oauth/connect"
      ) {
        return handleOAuthConnect(
          request,
          env
        );
      }

      if (
        request.method === "GET" &&
        url.pathname ===
          "/oauth/callback"
      ) {
        return handleOAuthCallback(
          request,
          env
        );
      }

      if (
        request.method === "POST" &&
        url.pathname ===
          "/api/analyze"
      ) {
        return withSecurity(
          await handleAnalyze(
            request,
            env
          )
        );
      }

      if (
        request.method === "POST" &&
        url.pathname ===
          "/api/image"
      ) {
        return withSecurity(
          await handleImage(
            request,
            env
          )
        );
      }

      if (
        request.method === "POST" &&
        url.pathname ===
          "/api/audio"
      ) {
        return withSecurity(
          await handleAudio(
            request,
            env
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

      const message =
        error?.message ||
        "INTERNAL_ERROR";

      const status =
        message ===
          "BODY_TOO_LARGE" ||
        message ===
          "QUESTION_TOO_LONG" ||
        message ===
          "IMAGE_TOO_LARGE" ||
        message ===
          "AUDIO_TOO_LARGE"
          ? 413
          : message ===
              "QUESTION_REQUIRED"
            ? 400
            : 500;

      return withSecurity(
        errorResponse(
          message,
          status
        )
      );
    }
  }
};
