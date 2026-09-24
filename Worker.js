const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const MODEL_VISION = "@cf/meta/llama-3.2-11b-vision-instruct";
const MODEL_AUDIO = "@cf/openai/whisper-large-v3-turbo";

const VERSION = "10.5.1";
const DECISION_VERSION = "10.5.1";

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

let franceTravailTokenCache = {
accessToken: null,
expiresAt: 0
};

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
confirmed: "Informations déclarées",
verify: "Informations à vérifier",
missing: "Informations manquantes",
sources: "Sources officielles",
actions: "Prochaines étapes",
recommendations: "Pistes utiles",
opportunities: "Opportunités trouvées",
billing: "Compte",
secure: "Protection",
connect: "Connecter mon compte",
logout: "Déconnecter",
notConnected: "Non connecté",
connected: "Connecté",
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
lessCompatible: "Moins compatible avec les critères connus",
declared: "Déclaré par vous",
inferred: "Déduit par Go Rare AI",
official: "Vérifié par une source officielle"
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
confirmed: "المعلومات التي صرّحت بها",
verify: "معلومات يجب التحقق منها",
missing: "معلومات ناقصة",
sources: "المصادر الرسمية",
actions: "الخطوات التالية",
recommendations: "مسارات مفيدة",
opportunities: "الفرص التي تم العثور عليها",
billing: "الحساب",
secure: "الحماية",
connect: "ربط حسابي",
logout: "تسجيل الخروج",
notConnected: "غير متصل",
connected: "متصل",
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
lessCompatible: "أقل توافقًا مع المعايير المعروفة",
declared: "صرّحت به",
inferred: "استنتجه Go Rare AI",
official: "تم التحقق منه رسميًا"
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
confirmed: "Information you provided",
verify: "Information to verify",
missing: "Missing information",
sources: "Official sources",
actions: "Next steps",
recommendations: "Useful paths",
opportunities: "Opportunities found",
billing: "Account",
secure: "Protection",
connect: "Connect my account",
logout: "Log out",
notConnected: "Not connected",
connected: "Connected",
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
lessCompatible: "Less compatible with known criteria",
declared: "Provided by you",
inferred: "Inferred by Go Rare AI",
official: "Verified by an official source"
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
if (value === null || value === undefined) {
return "";
}

return String(value)
.replace(/\u0000/g, "")
.trim()
.slice(0, max);
}

function safeArray(value, max = 40) {
return Array.isArray(value)
? value.slice(0, max)
: [];
}

function uniqueArray(arr) {
return [
...new Set(
safeArray(arr)
.map(x => cleanText(x, 500))
.filter(Boolean)
)
];
}

function isPlainObject(value) {
return Boolean(
value &&
typeof value === "object" &&
!Array.isArray(value)
);
}

function containsAny(text, values) {
const t = String(text || "").toLowerCase();

return values.some(
value =>
t.includes(
String(value || "").toLowerCase()
)
);
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
clean.endsWith("==")
? 2
: clean.endsWith("=")
? 1
: 0;

return Math.max(
0,
Math.floor(clean.length * 3 / 4) - padding
);
}

function normalizeLanguage(value) {
const v = String(value || "")
.toLowerCase()
.trim();

return LANGUAGES.includes(v)
? v
: "fr";
}

function detectLanguage(text) {
const t = String(text || "").toLowerCase();

if (/[\u0600-\u06ff]/.test(t)) {
return "ar";
}

if (
/\b(the|work|job|experience|diploma|company|business)\b/.test(t)
) {
return "en";
}

if (
/\b(travail|emploi|sans diplôme|expérience|entreprise|recherche)\b/.test(t)
) {
return "fr";
}

return "fr";
}

function normalizeSearchText(text) {
return String(text || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.replace(/[’']/g, "'")
.replace(/[-–—]/g, " ")
.replace(/\s+/g, " ")
.trim();
}

function normaliserLieu(text) {
const normalizedText =
normalizeSearchText(text);

if (!normalizedText) {
return null;
}

const aliases = Object.entries(
LOCATION_ALIASES
).sort(
([a], [b]) =>
b.length - a.length
);

for (
const [alias, canonical] of aliases
) {
const normalizedAlias =
normalizeSearchText(alias);

const escaped =
normalizedAlias.replace(
/[.*+?^${}()|[\]\\]/g,
"\\$&"
);

const pattern =
new RegExp(
`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`,
"i"
);

if (pattern.test(normalizedText)) {
return canonical;
}
}

return null;
}

function extraireMobilite(text) {
const t =
String(text || "").toLowerCase();

const match = t.match(
/(\d+(?:[.,]\d+)?)\s*(km|kilom[eè]tres?|kilometers?|كم|كلم)\b/i
);

if (match) {
return `${match[1].replace(",", ".")} km`;
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
const t =
cleanText(
text,
LIMITS.question
).toLowerCase();

const info = {};

if (!t) {
return info;
}

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
// Any job / sector
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

const mobilite =
extraireMobilite(text);

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

for (
const pattern of emploiPatterns
) {
if (
containsAny(
t,
pattern.terms
)
) {
info.typeEmploi =
pattern.value;
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

const hasResidence =
containsAny(
t,
residenceTerms
);

if (hasResidence) {
info.contexteImmigration = true;

if (
containsAny(t, [
"titre de séjour salarié",
"titre de sejour salarie",
"carte de séjour salarié",
"carte de sejour salarie",
"salarié",
"salarie",
"residence permit for work",
"work permit"
])
) {
info.statutSejour = "Salarié";
} else if (
containsAny(t, [
"carte de résident",
"carte de resident",
"résident",
"resident"
])
) {
info.statutSejour = "Résident";
} else if (
containsAny(t, [
"récépissé",
"recepisse"
])
) {
info.statutSejour = "Récépissé";
} else if (
containsAny(t, [
"visa long séjour",
"visa long sejour"
])
) {
info.statutSejour = "Visa long séjour";
} else if (
containsAny(t, [
"visa"
])
) {
info.statutSejour = "Visa";
} else {
info.statutSejour =
"Titre de séjour — type à préciser";
}
}

// ---------------------------------------------------------
// Documents
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
info.documents =
"Absence de document/titre déclarée";

info.contexteImmigration = true;
}

// ---------------------------------------------------------
// Business
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
"création d'entreprise",
"creation d'entreprise",
"إنشاء شركة",
"مشروعي",
"مشروع"
])
) {
info.entreprise =
"Projet ou entreprise à préciser";
} else if (
/\bentreprise\b/.test(t) &&
!containsAny(t, [
"emploi dans une entreprise",
"travailler dans une entreprise",
"travail en entreprise"
])
) {
info.entreprise =
"Projet ou entreprise à préciser";
}

return info;
}

function detectContext(
text,
info = {},
profile = "particulier",
situation = ""
) {
const t =
`${text || ""} ${situation || ""}`
.toLowerCase();

const employmentStrong =
containsAny(t, [
"chercher un emploi",
"recherche d'emploi",
"recherche un emploi",
"cherche du travail",
"cherche un travail",
"je veux travailler",
"je veux un travail",
"je cherche un job",
"facteur",
"livreur",
"livraison",
"nettoyage",
"manutention",
"logistique",
"chauffeur",
"job",
"emploi",
"poste"
]) ||
Boolean(info.typeEmploi);

const businessStrong =
containsAny(t, [
"créer mon entreprise",
"creer mon entreprise",
"créer une entreprise",
"creer une entreprise",
"lancer mon entreprise",
"projet d'entreprise",
"création d'entreprise",
"creation d'entreprise",
"micro-entreprise",
"entrepreneur",
"business",
"vendre mes services",
"vendre un service",
"مشروعي",
"إنشاء شركة"
]) ||
Boolean(info.entreprise);

const employment =
employmentStrong &&
!(
businessStrong &&
!info.typeEmploi
);

const immigration =
containsAny(t, [
"titre de séjour",
"titre de sejour",
"carte de séjour",
"carte de sejour",
"visa",
"immigration",
"étranger",
"etranger",
"residence permit",
"إقامة",
"هجرة"
]) ||
Boolean(
info.statutSejour ||
info.contexteImmigration
);

const business =
businessStrong &&
!(
employmentStrong &&
profile !== "entreprise" &&
!info.entreprise
);

const administrative =
containsAny(t, [
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

const training =
containsAny(t, [
"formation",
"apprendre",
"formation professionnelle",
"training",
"learn",
"تكوين",
"تعلم"
]);

const reconversion =
containsAny(t, [
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
sansDiplome:
info.diplome === "Sans diplôme",
sansExperience:
info.experience === "Sans expérience",
sansDocuments:
Boolean(info.documents),
profile:
profile || "particulier"
};
}

function analyserHistorique(history) {
if (!Array.isArray(history)) {
return "";
}

return history
.filter(
x =>
isPlainObject(x) &&
(
x.role === "user" ||
x.role === "assistant"
)
)
.slice(-20)
.map(x => {
const role =
x.role === "assistant"
? "Assistant"
: "Utilisateur";

return `${role}: ${cleanText(
x.content || "",
1500
)}`;
})
.filter(Boolean)
.join("\n");
}

function analyserHistoriqueUtilisateur(history) {
if (!Array.isArray(history)) {
return "";
}

return history
.filter(
x =>
isPlainObject(x) &&
x.role === "user"
)
.slice(-20)
.map(x =>
cleanText(
x.content || "",
1500
)
)
.filter(Boolean)
.join("\n");
}

function mergeInfo(...objects) {
const result = {};

for (const obj of objects) {
if (!isPlainObject(obj)) {
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
result[key] = value;
}
}
}

return result;
}

function construireEtatConversation(
question,
payload = {}
) {
const userHistoryText =
analyserHistoriqueUtilisateur(
payload.history
);

const fullHistoryText =
analyserHistorique(
payload.history
);

const historyInfo =
extraireInformations(
userHistoryText
);

const currentInfo =
extraireInformations(
question
);

/*
* Important:
* payload.info is NOT trusted.
*
* The server reconstructs the situation
* from the user's actual messages.
*/
const info = mergeInfo(
historyInfo,
currentInfo
);

const situation = [
userHistoryText,
question
]
.filter(Boolean)
.join("\n");

const profile = cleanText(
payload.profile ||
"particulier",
100
);

const context =
detectContext(
question,
info,
profile,
situation
);

return {
info,
context,
historyText: fullHistoryText,
userHistoryText,
profile,
language: normalizeLanguage(
payload.language ||
detectLanguage(question)
)
};
}

function candidatsQuestions(state) {
const {
info,
context,
language
} = state;

const q =
QUESTIONS[language] ||
QUESTIONS.fr;

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

if (
context.immigration &&
!info.presenceFrance
) {
list.push({
key: "presence_france",
question:
q.presence_france
});
}

if (
context.immigration &&
!info.statutSejour
) {
list.push({
key: "statut_sejour",
question:
q.statut_sejour
});
}

if (
context.business &&
!info.entreprise
) {
list.push({
key: "entreprise",
question:
q.entreprise
});
}

return list;
}

function construireDecision(state) {
const questions =
candidatsQuestions(state);

if (questions.length > 0) {
return {
mode: "question",

question:
questions[0].question,

questionKey:
questions[0].key,

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

function buildDeclaredEvidence(
info,
language
) {
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

const l =
labels[language] ||
labels.fr;

const add = (
key,
value,
status = "declared"
) => {
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

add(
"zoneRecherche",
info.zoneRecherche
);

add(
"typeEmploi",
info.typeEmploi
);

add(
"diplome",
info.diplome
);

add(
"experience",
info.experience
);

add(
"mobilite",
info.mobilite
);

add(
"horaires",
info.horaires
);

add(
"presenceFrance",
info.presenceFrance
);

if (info.statutSejour) {
add(
"statutSejour",
info.statutSejour,
"declared"
);
}

if (info.documents) {
add(
"documents",
info.documents,
"declared"
);
}

if (info.entreprise) {
add(
"entreprise",
info.entreprise
);
}

return result;
}

function buildInformationVerification(
info,
language
) {
const result = [];

if (info.statutSejour) {
result.push({
key: "statutSejour",
label:
language === "ar"
? "وضع الإقامة"
: language === "en"
? "Residence status"
: "Statut de séjour",
message:
language === "ar"
? "الوضع الذي صرّح به المستخدم يجب التحقق منه وفق الوثيقة الرسمية وشروطها الحالية."
: language === "en"
? "The residence status provided by the user must be verified against the official document and current conditions."
: "Le statut de séjour déclaré par l'utilisateur doit être vérifié selon le document officiel et les conditions applicables.",
status: "toVerify"
});
}

if (info.documents) {
result.push({
key: "documents",
label:
language === "ar"
? "الوثائق"
: language === "en"
? "Documents"
: "Documents",
message:
language === "ar"
? "حالة الوثائق يجب التحقق منها قبل استنتاج أي حق إداري أو مهني."
: language === "en"
? "The document situation must be verified before drawing conclusions about administrative or work rights."
: "La situation documentaire doit être vérifiée avant toute conclusion sur les droits administratifs ou professionnels.",
status: "toVerify"
});
}

return result;
}

function buildActions(
state,
language
) {
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

function buildRecommendations(
state,
language
) {
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

function appliquerProtectionsEmploi(
state,
recommendations,
language
) {
const result = [
...safeArray(recommendations)
];

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
const url =
new URL(
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

const now = Date.now();

if (
franceTravailTokenCache.accessToken &&
franceTravailTokenCache.expiresAt >
now + 30000
) {
return franceTravailTokenCache.accessToken;
}

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

body.set(
"scope",
"api_offresdemploiv2 o2dsoffre"
);

try {
const response =
await fetch(
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

const data =
await response.json();

if (!data?.access_token) {
return null;
}

const expiresIn =
Number(data.expires_in) || 3600;

franceTravailTokenCache = {
accessToken:
data.access_token,

expiresAt:
now +
Math.max(
60000,
(expiresIn - 60) * 1000
)
};

return data.access_token;
} catch {
return null;
}
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

function analyserCompatibiliteOffre(
offer,
state,
language
) {
const text = [
offer.title,
offer.description,
offer.experience,
offer.contract
]
.join(" ")
.toLowerCase();

const evidence = [];

let status = "toVerify";

if (state.context.sansDiplome) {
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
? "المعلومات المتاحة لا تُظهر اشتراط شهادة محددة."
: language === "en"
? "No specific diploma requirement is explicitly visible in the available information."
: "Aucune exigence explicite de diplôme spécifique n'est visible dans les informations disponibles."
);
}
}

if (state.context.sansExperience) {
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
? "العرض يشير إلى قبول المبتدئين أو إلى إمكانية التدريب."
: language === "en"
? "The offer indicates that beginners or training may be accepted."
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
(
state.context.sansDiplome &&
explicitDiplomaRequirement
) ||
(
state.context.sansExperience &&
explicitExperienceRequirement
)
) {
status = "lessCompatible";
} else if (evidence.length > 0) {
status = "compatible";
}

return {
status,
evidence:
uniqueArray(evidence)
};
}

async function searchFranceTravail(
info,
env,
state,
language
) {
const searchURL =
buildFranceTravailSearchURL(
info
);

const token =
await getFranceTravailToken(env);

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

const url =
new URL(
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
const response =
await fetch(
url.toString(),
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

const data =
await response.json();

const rawOffers =
Array.isArray(
data.resultats
)
? data.resultats
: Array.isArray(
data.offres
)
? data.offres
: [];

const offers =
rawOffers
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
} catch {
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

function journeyLabel(
stage,
language
) {
const ui =
UI[language] || UI.fr;

return {
understanding:
ui.understanding,

verification:
ui.verification,

search:
ui.search,

comparison:
ui.comparison,

action:
ui.action,

followup:
ui.followup
}[stage] ||
ui.understanding;
}

function buildOpportunityData(
search,
language
) {
if (!search) {
return null;
}

const ui =
UI[language] || UI.fr;

return {
status: search.status,

message:
search.status ===
"offers_retrieved"
? ui.offersRetrieved
: search.status ===
"official_ready"
? ui.officialReady
: ui.noOffers,

searchURL:
search.searchURL,

offers:
safeArray(
search.offers,
20
)
};
}

function systemPrompt(
language,
state
) {
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
3. Distinguish information provided by the user from information inferred by the AI.
4. Clearly identify information that must be verified.
5. Use official sources when relevant.
6. Search or prepare searches for real opportunities when available.
7. Compare options without inventing facts.
8. Identify obstacles and risks.
9. Propose concrete next steps.
10. Help the user move toward execution.

Language: ${langName}

Rules:
- Never invent an offer, employer, legal right, salary, qualification or requirement.
- Never present an inference as a user-provided fact.
- Never present an unverified assumption as an official fact.
- For legal and administrative topics, recommend verification against official sources.
- If real retrieved opportunities are supplied, distinguish them from a generic search link.
- Be concise and practical.
- Prefer numbered next steps.
- Do not claim that an API search happened if it did not.
- Do not calculate distance unless actual distance data exists.
- Do not make promises of employment or success.
- Do not infer a person's legal work authorization from keywords alone.
- Do not infer identity, nationality or legal status from an image.
- Treat residence and document information as user-declared until officially verified.

Known user-provided state:
${JSON.stringify(state.info)}

Context:
${JSON.stringify(state.context)}
`;
}

async function askAI(
env,
messages
) {
if (!env || !env.AI) {
return "";
}

const safeMessages =
safeArray(messages, 20)
.filter(isPlainObject)
.map(x => ({
role:
x.role === "assistant"
? "assistant"
: "user",

content:
cleanText(
x.content || "",
LIMITS.message
)
}));

try {
const result =
await env.AI.run(
MODEL,
{
messages:
safeMessages
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

function normalizeVerificationItem(
item
) {
if (
typeof item === "string"
) {
return {
key: "verification",
label: "À vérifier",
message: cleanText(
item,
1500
),
status: "toVerify"
};
}

if (isPlainObject(item)) {
return {
key:
cleanText(
item.key ||
item.label ||
"verification",
200
),

label:
cleanText(
item.label ||
"À vérifier",
300
),

message:
cleanText(
item.message ||
item.value ||
"",
1500
),

status:
item.status ||
"toVerify"
};
}

return null;
}

function buildOfficialEvidence(
opportunities
) {
if (
!opportunities ||
!Array.isArray(
opportunities.offers
)
) {
return [];
}

return opportunities.offers
.filter(
offer =>
isPlainObject(offer) &&
offer.id &&
offer.title
)
.slice(0, 20)
.map(offer => ({
key:
`offer:${offer.id}`,

label:
"Offre récupérée",

value:
cleanText(
offer.title,
500
),

status:
"official",

source:
safeExternalURL(
offer.url
)
}));
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
const ui =
UI[language] || UI.fr;

let stage =
decision?.progress?.stage ||
"understanding";

if (
opportunities &&
Array.isArray(
opportunities.offers
) &&
opportunities.offers.length > 0
) {
stage = "comparison";
} else if (
decision?.mode ===
"orientation" &&
Array.isArray(
verification
) &&
verification.length > 0
) {
stage = "verification";
} else if (
decision?.mode ===
"orientation"
) {
stage = "action";
}

const evidence =
buildDeclaredEvidence(
state.info,
language
);

const declared = [];
const inferred = [];
const toVerify = [];

for (
const item of evidence
) {
if (
!item ||
!item.value
) {
continue;
}

if (
item.status ===
"inferred"
) {
inferred.push(item);
} else if (
item.status ===
"toVerify"
) {
toVerify.push(item);
} else {
declared.push(item);
}
}

const informationVerification =
buildInformationVerification(
state.info,
language
);

const finalVerify = [
...toVerify,
...informationVerification,
...(Array.isArray(
verification
)
? verification
: [])
];

const uniqueVerify = [];
const verifyKeys =
new Set();

for (
const rawItem
of finalVerify
) {
const item =
normalizeVerificationItem(
rawItem
);

if (!item) {
continue;
}

const key =
item.key +
"|" +
item.message;

if (
!verifyKeys.has(key)
) {
verifyKeys.add(key);
uniqueVerify.push(item);
}
}

const official =
buildOfficialEvidence(
opportunities
);

return {
version: VERSION,

decisionVersion:
DECISION_VERSION,

language,

/*
* Canonical field.
* These are statements extracted from
* the user's own messages.
*/
declared,

/*
* Backward-compatible alias.
* Older clients expecting "confirmed"
* can still read the same records.
*/
confirmed: declared,

inferred,

verify:
uniqueVerify,

official,

missing:
decision?.mode ===
"question"
? [
{
key:
decision.questionKey,

question:
decision.question
}
]
: [],

nextQuestion:
decision?.mode ===
"question"
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

label:
journeyLabel(
stage,
language
)
},

sources,

opportunities,

ai:
aiText || null,

ui: {
result: ui.result
}
};
}

async function analyserQuestion(
payload,
env
) {
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

const state =
construireEtatConversation(
question,
payload
);

const language =
normalizeLanguage(
payload.language ||
state.language
);

state.language =
language;

const decision =
construireDecision(
state
);

const sources =
buildSources(state);

const verification =
construireVerification(
state
);

let actions =
buildActions(
state,
language
);

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
decision.mode ===
"orientation"
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
decision.mode ===
"orientation"
) {
const prompt =
systemPrompt(
language,
state
);

const history =
Array.isArray(
payload.history
)
? payload.history
: [];

const messages = [
{
role: "system",
content: prompt
},

...history
.slice(-12)
.filter(
x => isPlainObject(x)
)
.map(x => ({
role:
x.role === "assistant"
? "assistant"
: "user",

content:
cleanText(
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

return buildResult({
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
message,
status = 400
) {
return jsonResponse(
{
error:
cleanText(
message,
1000
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
(
request.headers.get(
"X-Forwarded-For"
) || ""
)
.split(",")[0]
.trim() ||
"unknown"
);
}

function checkRateLimit(
request
) {
const ip =
getClientIP(request);

const path =
new URL(
request.url
).pathname;

const key =
`${ip}:${path}`;

const now =
Date.now();

let entry =
rateStore.get(key);

if (
!entry ||
now - entry.start >
RATE.window
) {
entry = {
start: now,
count: 0
};

rateStore.set(
key,
entry
);
}

entry.count++;

if (
entry.count >
RATE.max
) {
return false;
}

if (
rateStore.size >
5000
) {
for (
const [
storedKey,
value
]
of rateStore.entries()
) {
if (
now -
value.start >
RATE.window
) {
rateStore.delete(
storedKey
);
}
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

const allowedHosts = [
"francetravail.fr",
"candidat.francetravail.fr",
"francetravail.io",
"service-public.fr",
"www.service-public.fr",
"entreprendre.service-public.fr",
"administration-etrangers-en-france.interieur.gouv.fr",
"formalites.entreprises.gouv.fr"
];

const allowed =
allowedHosts.some(
allowedHost =>
host ===
allowedHost ||
host.endsWith(
"." +
allowedHost
)
);

if (!allowed) {
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
const array =
new Uint8Array(
bytes
);

crypto.getRandomValues(
array
);

return Array
.from(array)
.map(
byte =>
byte
.toString(16)
.padStart(2, "0")
)
.join("");
}

function base64UrlEncode(
value
) {
const bytes =
typeof value ===
"string"
? new TextEncoder().encode(
value
)
: value;

let binary = "";

for (
const byte of bytes
) {
binary += String.fromCharCode(
byte
);
}

return btoa(binary)
.replace(/\+/g, "-")
.replace(/\//g, "_")
.replace(/=+$/g, "");
}

function base64UrlDecode(
value
) {
if (!value) {
return null;
}

try {
const normalized =
String(value)
.replace(/-/g, "+")
.replace(/_/g, "/");

const padded =
normalized +
"=".repeat(
(4 -
normalized.length %
4) %
4
);

const binary =
atob(padded);

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

return bytes;
} catch {
return null;
}
}

async function sha256(
value
) {
const data =
new TextEncoder().encode(
String(value)
);

const digest =
await crypto.subtle.digest(
"SHA-256",
data
);

return new Uint8Array(
digest
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
name: "HMAC",
hash: "SHA-256"
},
false,
["sign"]
);

const signature =
await crypto.subtle.sign(
"HMAC",
key,
new TextEncoder().encode(
String(value)
)
);

return base64UrlEncode(
new Uint8Array(
signature
)
);
}

async function hmacVerify(
value,
signature,
secret
) {
if (
!value ||
!signature ||
!secret
) {
return false;
}

try {
const key =
await crypto.subtle.importKey(
"raw",
new TextEncoder().encode(
String(secret)
),
{
name: "HMAC",
hash: "SHA-256"
},
false,
["verify"]
);

const sig =
base64UrlDecode(
signature
);

if (!sig) {
return false;
}

return await crypto.subtle.verify(
"HMAC",
key,
sig,
new TextEncoder().encode(
String(value)
)
);
} catch {
return false;
}
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

if (index < 0) {
continue;
}

const key =
cookie
.slice(0, index)
.trim();

if (key !== name) {
continue;
}

return decodeURIComponent(
cookie
.slice(index + 1)
.trim()
);
}

return null;
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

userinfoURL:
env?.OAUTH_USERINFO_URL || "",

redirectURL:
env?.OAUTH_REDIRECT_URL || "",

sessionSecret:
env?.SESSION_SECRET || ""
};
}

function sessionCookie(
payload,
signature
) {
return [
"grai_user=" +
encodeURIComponent(
payload +
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

function clearSessionCookie() {
return [
"grai_user=",
"HttpOnly",
"Secure",
"SameSite=Lax",
"Path=/",
"Max-Age=0"
].join("; ");
}

async function readSession(
request,
env
) {
const raw =
cookieValue(
request,
"grai_user"
);

if (!raw) {
return null;
}

const separator =
raw.lastIndexOf(".");

if (separator <= 0) {
return null;
}

const payload =
raw.slice(
0,
separator
);

const signature =
raw.slice(
separator + 1
);

const config =
oauthConfig(env);

if (!config.sessionSecret) {
return null;
}

const valid =
await hmacVerify(
payload,
signature,
config.sessionSecret
);

if (!valid) {
return null;
}

try {
const bytes =
base64UrlDecode(
payload
);

if (!bytes) {
return null;
}

const decoded =
new TextDecoder().decode(
bytes
);

const session =
JSON.parse(decoded);

if (
!session ||
session.authenticated !==
true
) {
return null;
}

if (
Number(session.expiresAt) <=
Date.now()
) {
return null;
}

return session;
} catch {
return null;
}
}

async function createSessionCookie(
sessionPayload,
secret
) {
const payload =
base64UrlEncode(
JSON.stringify(
sessionPayload
)
);

const signature =
await hmacSign(
payload,
secret
);

return sessionCookie(
payload,
signature
);
}

async function analyzeImage(
env,
payload
) {
if (
!payload ||
!payload.image
) {
throw new Error(
"IMAGE_REQUIRED"
);
}

const image =
String(payload.image);

if (
base64ByteLength(image) >
LIMITS.image
) {
throw new Error(
"IMAGE_TOO_LARGE"
);
}

if (!env?.AI) {
throw new Error(
"AI_NOT_CONFIGURED"
);
}

let imageData =
image;

const comma =
imageData.indexOf(",");

if (comma >= 0) {
imageData =
imageData.slice(
comma + 1
);
}

let bytes;

try {
const binary =
atob(
imageData
);

bytes =
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
} catch {
throw new Error(
"INVALID_IMAGE"
);
}

try {
const result =
await env.AI.run(
MODEL_VISION,
{
image:
Array.from(bytes),

prompt: `
Read only information that is visibly present in the image.

Do not invent unreadable text.
Do not infer identity.
Do not infer nationality.
Do not infer legal residence status.
Do not infer a right to work.
Do not infer facts that are not visibly supported.

Clearly distinguish readable information from information that cannot be read.
Return a concise practical transcription/description.
`
}
);

return {
text: cleanText(
result?.response ||
result?.text ||
"",
12000
)
};
} catch {
throw new Error(
"IMAGE_ANALYSIS_FAILED"
);
}
}

function extractDataURL(
value
) {
const text =
String(value || "");

const match =
text.match(
/^data:([^;,]+)?;base64,(.*)$/s
);

if (!match) {
return {
mimeType: "",
data: text
};
}

return {
mimeType:
match[1] || "",
data:
match[2] || ""
};
}

async function transcribeAudio(
env,
payload
) {
if (
!payload ||
!payload.audio
) {
throw new Error(
"AUDIO_REQUIRED"
);
}

const audio =
String(payload.audio);

if (
base64ByteLength(audio) >
LIMITS.audio
) {
throw new Error(
"AUDIO_TOO_LARGE"
);
}

if (!env?.AI) {
throw new Error(
"AI_NOT_CONFIGURED"
);
}

const extracted =
extractDataURL(
audio
);

if (
!extracted.data
) {
throw new Error(
"INVALID_AUDIO"
);
}

const language =
normalizeLanguage(
payload.language
);

try {
const result =
await env.AI.run(
MODEL_AUDIO,
{
audio:
extracted.data,

language
}
);

return {
text:
cleanText(
result?.text ||
result?.response ||
"",
12000
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

const scriptPolicy =
nonce
? `script-src 'self' 'nonce-${nonce}'`
: "script-src 'self'";

headers.set(
"Content-Security-Policy",
[
"default-src 'self'",
scriptPolicy,
"style-src 'self' 'unsafe-inline'",
"img-src 'self' data: blob:",
"connect-src 'self'",
"frame-ancestors 'none'",
"base-uri 'self'",
"form-action 'self'",
"object-src 'none'"
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
const [key, value]
of security.entries()
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
return String(value ?? "")
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

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta
name="viewport"
content="width=device-width, initial-scale=1.0"
/>
<meta
name="description"
content="Go Rare AI — Comprendre votre situation. Voir plus loin."
/>
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
}

body {
font-family:
Inter,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
sans-serif;

background:
radial-gradient(
circle at top left,
rgba(100, 120, 255, .18),
transparent 35%
),
radial-gradient(
circle at bottom right,
rgba(40, 180, 170, .12),
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
rgba(16, 25, 36, .76);

border:
1px solid rgba(255,255,255,.09);

box-shadow:
0 20px 70px
rgba(0,0,0,.28);

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

border-radius:
12px;

padding:
10px 13px;
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
rgba(85, 120, 255, .24);
}

.btn.recording {
background:
rgba(220, 70, 80, .25);
}

.journey {
margin:
0 24px 20px;

padding:
14px;

display:
flex;

gap:
8px;

overflow-x:
auto;
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

.hidden {
display:
none !important;
}

@media (max-width: 700px) {
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
<select
id="language"
aria-label="Language"
>
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
<div
class="step active"
data-stage="understanding"
>
<span id="journeyUnderstanding">
Compréhension
</span>
</div>

<div
class="step"
data-stage="verification"
>
<span id="journeyVerification">
Vérification
</span>
</div>

<div
class="step"
data-stage="search"
>
<span id="journeySearch">
Recherche
</span>
</div>

<div
class="step"
data-stage="comparison"
>
<span id="journeyComparison">
Comparaison
</span>
</div>

<div
class="step"
data-stage="action"
>
<span id="journeyAction">
Action
</span>
</div>

<div
class="step"
data-stage="followup"
>
<span id="journeyFollowup">
Suivi
</span>
</div>
</div>

<main class="glass panel">

<textarea
id="question"
maxlength="12000"
placeholder="Décrivez votre situation..."
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
/>

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

const UI = ${JSON.stringify(UI)};

const conversationHistory = [];

let mediaRecorder = null;
let audioChunks = [];
let recording = false;

const languageEl =
document.getElementById(
"language"
);

const questionEl =
document.getElementById(
"question"
);

const analyzeBtn =
document.getElementById(
"analyzeBtn"
);

const imageBtn =
document.getElementById(
"imageBtn"
);

const imageInput =
document.getElementById(
"imageInput"
);

const microBtn =
document.getElementById(
"microBtn"
);

const accountBtn =
document.getElementById(
"accountBtn"
);

const statusEl =
document.getElementById(
"status"
);

const resultEl =
document.getElementById(
"result"
);

function currentLanguage() {
return (
languageEl.value || "fr"
);
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

function safeURL(raw) {
if (!raw) {
return null;
}

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
url.hostname
.toLowerCase();

const allowed = [
"francetravail.fr",
"candidat.francetravail.fr",
"francetravail.io",
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

function setStatus(
text
) {
statusEl.textContent =
text || "";
}

function addHistory(
role,
content
) {
if (!content) {
return;
}

conversationHistory.push({
role,
content:
String(content)
.slice(0, 4000)
});

while (
conversationHistory.length >
40
) {
conversationHistory.shift();
}
}

function trimHistory() {
while (
conversationHistory.length >
40
) {
conversationHistory.shift();
}
}

function renderJourney(
stage
) {
document
.querySelectorAll(
".step"
)
.forEach(step => {
step.classList.toggle(
"active",
step.dataset.stage ===
stage
);
});
}

function renderList(
items
) {
if (
!Array.isArray(items) ||
items.length === 0
) {
return "";
}

return (
"<ul>" +
items
.map(
item =>
"<li>" +
escapeHTML(
item
) +
"</li>"
)
.join("") +
"</ul>"
);
}

function renderEvidence(
item,
fallbackStatus
) {
if (
typeof item ===
"string"
) {
return `
<div class="item">
<div class="item-value">
${escapeHTML(item)}
</div>
</div>
`;
}

if (
!item ||
typeof item !==
"object"
) {
return "";
}

const label =
item.label ||
item.key ||
"";

const value =
item.value ||
item.message ||
"";

const status =
item.status ||
fallbackStatus ||
"";

let badge =
"";

if (
status === "declared"
) {
badge =
'<span class="badge">' +
escapeHTML(
t("declared")
) +
"</span>";
} else if (
status === "inferred"
) {
badge =
'<span class="badge">' +
escapeHTML(
t("inferred")
) +
"</span>";
} else if (
status === "official"
) {
badge =
'<span class="badge">' +
escapeHTML(
t("official")
) +
"</span>";
} else if (
status === "toVerify"
) {
badge =
'<span class="badge">' +
escapeHTML(
t("toVerify")
) +
"</span>";
}

const source =
safeURL(
item.source
);

const sourceHTML =
source
? `
<div style="margin-top:7px">
<a
href="${escapeHTML(source)}"
target="_blank"
rel="noopener noreferrer"
>
${escapeHTML(
t("sources")
)}
</a>
</div>
`
: "";

return `
<div class="item">
<div class="item-label">
${escapeHTML(label)}
${badge}
</div>

<div class="item-value">
${escapeHTML(value)}
</div>

${sourceHTML}
</div>
`;
}

function renderEvidenceSection(
title,
items,
fallbackStatus
) {
if (
!Array.isArray(items) ||
items.length === 0
) {
return "";
}

return `
<div class="card">
<h3>
${escapeHTML(title)}
</h3>

${items
.map(
item =>
renderEvidence(
item,
fallbackStatus
)
)
.join("")}
</div>
`;
}

function renderVerification(
items
) {
if (
!Array.isArray(items) ||
items.length === 0
) {
return "";
}

return `
<div class="card">
<h3>
${escapeHTML(
t("verify")
)}
</h3>

${items
.map(
item =>
renderEvidence(
item,
"toVerify"
)
)
.join("")}
</div>
`;
}

function renderSources(
sources
) {
if (
!Array.isArray(sources) ||
sources.length === 0
) {
return "";
}

const rows =
sources
.map(source => {
if (
!source ||
typeof source !==
"object"
) {
return "";
}

const url =
safeURL(
source.url
);

if (!url) {
return "";
}

return `
<div class="source">
<span>
${escapeHTML(
source.name ||
"Source"
)}
</span>

<a
href="${escapeHTML(url)}"
target="_blank"
rel="noopener noreferrer"
>
Ouvrir
</a>
</div>
`;
})
.join("");

if (!rows) {
return "";
}

return `
<div class="card">
<h3>
${escapeHTML(
t("sources")
)}
</h3>

${rows}
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
data.status ===
"official_ready"
) {
const url =
safeURL(
data.searchURL
);

html += `
<div class="empty">
${escapeHTML(
data.message ||
t("officialReady")
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

html += "</div>";

return html;
}

if (
data.offers.length ===
0
) {
const url =
safeURL(
data.searchURL
);

html += `
<div class="empty">
${escapeHTML(
data.message ||
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

html += "</div>";

return html;
}

html += `
<div class="offer-meta">
${escapeHTML(
data.message ||
t("offersRetrieved")
)}
</div>
`;

data.offers
.slice(0, 20)
.forEach(
offer => {
const url =
safeURL(
offer.url
);

const compatibility =
offer.compatibility ||
{};

let compatibilityLabel =
t("toVerify");

if (
compatibility.status ===
"compatible"
) {
compatibilityLabel =
t("compatible");
} else if (
compatibility.status ===
"lessCompatible"
) {
compatibilityLabel =
t("lessCompatible");
}

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
)}
:
${escapeHTML(
compatibilityLabel
)}

${
Array.isArray(
compatibility.evidence
) &&
compatibility
.evidence
.length
? `
<ul>
${compatibility
.evidence
.map(
item =>
"<li>" +
escapeHTML(
item
) +
"</li>"
)
.join("")}
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

function renderResult(
data
) {
if (
!data ||
typeof data !==
"object"
) {
resultEl.innerHTML =
"";
return;
}

const declared =
Array.isArray(
data.declared
)
? data.declared
: Array.isArray(
data.confirmed
)
? data.confirmed
: [];

const inferred =
Array.isArray(
data.inferred
)
? data.inferred
: [];

const official =
Array.isArray(
data.official
)
? data.official
: [];

const verify =
Array.isArray(
data.verify
)
? data.verify
: [];

let html = "";

if (
data.journey
) {
renderJourney(
data.journey.stage
);
}

html +=
renderEvidenceSection(
t("confirmed"),
declared,
"declared"
);

html +=
renderEvidenceSection(
t("inferred"),
inferred,
"inferred"
);

html +=
renderVerification(
verify
);

html +=
renderEvidenceSection(
t("official"),
official,
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

${data.missing
.map(
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
)
.join("")}
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
data.recommendations
.length
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

html +=
renderOpportunities(
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

html +=
renderSources(
data.sources
);

resultEl.innerHTML =
html;
}

function updateTexts() {
const lang =
currentLanguage();

const ui =
UI[lang] || UI.fr;

document.documentElement
.lang = lang;

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
"accountBtn"
).textContent =
ui.connect;

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
questionEl.value
.trim();

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

trimHistory();

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

if (
!response.ok
) {
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
console.error(error);

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

if (!file) {
return;
}

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
file
);
}
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
image:
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
console.error(error);

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
audio: true
});

audioChunks = [];

mediaRecorder =
new MediaRecorder(
stream
);

mediaRecorder.ondataavailable =
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
method: "POST",

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
console.error(error);

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
cache: "no-store"
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
method: "POST"
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
!isPlainObject(payload)
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

const safePayload = {
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
};

return analyserQuestion(
safePayload,
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
!isPlainObject(payload)
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
!isPlainObject(payload)
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
oauthConfig(env);

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

const stateHashBytes =
await sha256(
state
);

const stateHash =
base64UrlEncode(
stateHashBytes
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
"state",
state
);

const response =
new Response(
null,
{
status: 302,
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
oauthConfig(env);

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
method: "POST",

headers: {
"Content-Type":
"application/x-www-form-urlencoded"
},

body: tokenBody
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

const cookie =
await createSessionCookie(
sessionPayload,
config.sessionSecret
);

const response =
new Response(
null,
{
status: 302,

headers: {
Location: "/",

"Set-Cookie":
cookie +
", " +
[
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
code ===
"QUESTION_REQUIRED" ||
code ===
"INVALID_PAYLOAD" ||
code ===
"INVALID_JSON"
) {
return 400;
}

if (
code ===
"IMAGE_TOO_LARGE" ||
code ===
"AUDIO_TOO_LARGE" ||
code ===
"JSON_TOO_LARGE"
) {
return 413;
}

if (
code ===
"IMAGE_REQUIRED" ||
code ===
"AUDIO_REQUIRED"
) {
return 400;
}

if (
code ===
"INVALID_IMAGE" ||
code ===
"INVALID_AUDIO"
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
code ===
"IMAGE_ANALYSIS_FAILED" ||
code ===
"AUDIO_TRANSCRIPTION_FAILED"
) {
return 502;
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
status: 204
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
status: 200,

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
const response =
jsonResponse({
status:
"ok",

version:
VERSION,

service:
"Go Rare AI"
});

return withSecurity(
response
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
return await oauthConnect(
env
);
}

if (
request.method ===
"GET" &&
pathname ===
"/oauth/callback"
) {
return await oauthCallback(
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
return await oauthLogout(
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
try {
return JSON.parse(body);
} catch {
throw new Error(
"INVALID_JSON"
);
}
}
