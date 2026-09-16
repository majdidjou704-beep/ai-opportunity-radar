const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const MODEL_VISION = "@cf/meta/llama-3.2-11b-vision-instruct";
const MODEL_AUDIO = "@cf/openai/whisper-large-v3-turbo";

const VERSION = "10.1.2";
const DECISION_VERSION = "10.1.2";

const LIMITS = {
question: 12000,
history: 24000,
image: 7000000,
audio: 12000000,
message: 18000
};

/* =========================================================
RATE LIMIT
========================================================= */

const RATE_LIMIT = {
windowMs: 60 * 1000,
maxRequests: 30
};

const rateMap = new Map();

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

let entry = rateMap.get(ip);

if (!entry || now - entry.start > RATE_LIMIT.windowMs) {
entry = {
start: now,
count: 0
};
}

entry.count += 1;
rateMap.set(ip, entry);

if (entry.count > RATE_LIMIT.maxRequests) {
return false;
}

if (rateMap.size > 5000) {
for (const [key, value] of rateMap.entries()) {
if (now - value.start > RATE_LIMIT.windowMs) {
rateMap.delete(key);
}
}
}

return true;
}

/* =========================================================
SOURCES OFFICIELLES
========================================================= */

const SOURCES = {
anef: {
id: "anef",
titre: "Faire une demande en ligne pour un titre de séjour ou un changement de situation",
organisme: "Service-Public.fr / ANEF",
url: "https://www.service-public.fr/particuliers/vosdroits/R59398"
},

travail_etranger: {
id: "travail_etranger",
titre: "Autorisation de travail d'un salarié étranger en France",
organisme: "Service-Public.fr",
url: "https://www.service-public.fr/particuliers/vosdroits/F2728"
},

france_travail: {
id: "france_travail",
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

creation_ei: {
id: "creation_ei",
titre: "Création d'une entreprise individuelle",
organisme: "Service Public Entreprendre",
url: "https://entreprendre.service-public.fr/vosdroits/F36763"
},

guichet: {
id: "guichet",
titre: "Guichet des formalités des entreprises",
organisme: "Service Public Entreprendre",
url: "https://entreprendre.service-public.fr/vosdroits/F23571"
}
};

/* =========================================================
PARCOURS
========================================================= */

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

/* =========================================================
UTILITAIRES
========================================================= */

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

function jsonResponse(data, status = 200, extraHeaders = {}) {
return new Response(
JSON.stringify(data),
{
status,
headers: {
"content-type": "application/json; charset=utf-8",
"cache-control": "no-store",
...extraHeaders
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

function hasInfo(informations, type) {
return (informations || []).some(
item => item?.type === type && texte(item?.valeur)
);
}

function getInfo(informations, type) {
return (informations || []).find(
item => item?.type === type && texte(item?.valeur)
) || null;
}

function addInfo(list, type, valeur, confiance = "élevée") {
const v = texte(valeur, 500);

if (!v) return;

const exists = list.some(
item =>
item?.type === type &&
texte(item?.valeur).toLowerCase() === v.toLowerCase()
);

if (!exists) {
list.push({
type,
valeur: v,
confiance
});
}
}

function informationsContient(informations, type) {
return hasInfo(informations, type);
}

function dedupeInformations(informations) {
const out = [];

for (const item of informations || []) {
if (!item?.type || !texte(item?.valeur)) continue;

const exists = out.some(
x =>
x.type === item.type &&
texte(x.valeur).toLowerCase() ===
texte(item.valeur).toLowerCase()
);

if (!exists) {
out.push({
type: item.type,
valeur: texte(item.valeur, 500),
confiance: item.confiance || "moyenne"
});
}
}

return out;
}

/* =========================================================
NORMALISATION LOCALISATION
========================================================= */

function normaliserRecherche(v) {
return texte(v)
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.replace(/[’']/g, "'")
.replace(/-/g, " ")
.replace(/\s+/g, " ")
.trim();
}

const LOCATION_ALIASES = {
"vigneux sur seine": "Vigneux-sur-Seine",
"vignieux sur seine": "Vigneux-sur-Seine",

"paris": "Paris",
"creteil": "Créteil",
"evry": "Évry",
"evry courcouronnes": "Évry-Courcouronnes",
"montgeron": "Montgeron",
"draveil": "Draveil",
"athis mons": "Athis-Mons",
"juvisy sur orge": "Juvisy-sur-Orge",
"viry chatillon": "Viry-Châtillon",
"corbeil essonnes": "Corbeil-Essonnes",

"essonne": "Essonne",
"val de marne": "Val-de-Marne",
"seine et marne": "Seine-et-Marne",
"hauts de seine": "Hauts-de-Seine"
};

function trouverLocalisation(q) {
const normalise = normaliserRecherche(q);

for (const [alias, canonical] of Object.entries(LOCATION_ALIASES)) {
if (normalise.includes(alias)) {
return canonical;
}
}

return null;
}

/* =========================================================
EXTRACTION DES INFORMATIONS
========================================================= */

function extraireInformations(q) {
const result = [];
const s = texte(q, LIMITS.question);

/* France */
if (
/\bfrance\b/i.test(s) ||
/\ben france\b/i.test(s)
) {
addInfo(result, "presence_france", "France");
}

/* Diplôme */
if (
/sans diplôme|sans diplome|pas de diplôme|pas de diplome|aucun diplôme|aucun diplome/i.test(s)
) {
addInfo(result, "diplome", "Sans diplôme");
} else if (
/\b(bac|baccalauréat|baccalaureat|cap|bep|licence|master|doctorat|diplôme|diplome)\b/i.test(s)
) {
const match = s.match(
/\b(bac(?:calauréat|calaureat)?|cap|bep|licence|master|doctorat|diplôme|diplome)\b/i
);

if (match) {
addInfo(
result,
"diplome",
match[1],
"moyenne"
);
}
}

/* Expérience */
if (
/sans expérience|sans experience|pas d'expérience|pas d'experience|aucune expérience|aucune experience/i.test(s)
) {
addInfo(
result,
"experience",
"Sans expérience"
);
} else if (
/\b\d+\s*(ans?|années?|annees?)\s+d'expérience/i.test(s)
) {
const match = s.match(
/\b\d+\s*(ans?|années?|annees?)\s+d'expérience/i
);

if (match) {
addInfo(
result,
"experience",
match[0],
"élevée"
);
}
}

/* Objectif emploi */
if (
/cherche un emploi|cherche du travail|recherche un emploi|recherche du travail|trouver un emploi|trouver du travail|cherche principalement un emploi/i.test(s)
) {
addInfo(
result,
"objectif",
"Recherche d'emploi"
);
}

/* Localisation */
const localisation = trouverLocalisation(s);

if (localisation) {
addInfo(
result,
"zone_recherche",
localisation
);
}

/* =======================================================
TYPE D'EMPLOI
======================================================= */

const typeExpressions = [
{
regex:
/\bposte\s+(?:de|comme|en tant que)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’-]{2,40}(?:\s+[A-Za-zÀ-ÿ'’-]{2,40}){0,3})/i
},

{
regex:
/\bemploi\s+(?:de|comme|en tant que)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’-]{2,40}(?:\s+[A-Za-zÀ-ÿ'’-]{2,40}){0,3})/i
},

{
regex:
/\btravail\s+(?:de|comme|en tant que)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’-]{2,40}(?:\s+[A-Za-zÀ-ÿ'’-]{2,40}){0,3})/i
}
];

for (const item of typeExpressions) {
const match = s.match(item.regex);

if (match?.[1]) {
const metier = texte(match[1]).trim();

const interdit = [
"diplôme",
"diplome",
"expérience",
"experience",
"sans diplôme",
"sans diplome",
"sans expérience",
"sans experience",
"france"
];

const fauxPositif = interdit.some(
term =>
metier
.toLowerCase()
.includes(term.toLowerCase())
);

if (!fauxPositif) {
addInfo(
result,
"type_emploi",
metier,
"moyenne"
);
}

break;
}
}

/* Secteur quelconque */
if (
/n'importe quel travail|n’importe quel travail|n'importe quel emploi|n’importe quel emploi|tout type d'emploi|tout type de travail|tout secteur|tous les secteurs|peu importe le secteur|peu importe le travail|peu importe l'emploi|je suis ouvert à tout|je suis ouverte à tout|je prends tout/i.test(s)
) {
addInfo(
result,
"type_emploi",
"Ouvert à tout secteur",
"élevée"
);
}

/* Mobilité */
if (
/je peux me déplacer|je peux me deplacer|je suis mobile|je peux travailler dans les environs|je peux me rendre|je peux me déplacer pour travailler|je peux me deplacer pour travailler/i.test(s) ||
/\bmobile\b/i.test(s)
) {
addInfo(
result,
"mobilite",
"Flexible"
);
}

if (
/je ne peux pas me déplacer|je ne peux pas me deplacer|sans déplacement|sans deplacement|je ne suis pas mobile/i.test(s)
) {
addInfo(
result,
"mobilite",
"Limitée"
);
}

/* Horaires */
if (
/flexible sur les horaires|flexible pour les horaires|horaires flexibles|peu importe les horaires|peu importe l'horaire|n'importe quels horaires|n’importe quels horaires|disponible à tout moment|disponible a tout moment/i.test(s)
) {
addInfo(
result,
"horaires",
"Flexible"
);
}

/* Titre de séjour */
if (
/titre de séjour|titre de sejour|carte de séjour|carte de sejour/i.test(s)
) {
addInfo(
result,
"titre_sejour",
"Titre de séjour",
"moyenne"
);
}

/* Statut salarié */
if (
/\bsalarié\b|\bsalarie\b/i.test(s)
) {
addInfo(
result,
"statut_sejour",
"Salarié",
"moyenne"
);
}

/* Récépissé */
if (
/récépissé|recepisse/i.test(s)
) {
addInfo(
result,
"recepisse",
"Récépissé"
);
}

/* Renouvellement */
if (
/renouvellement|renouveler|expire|expiration|fin de validité|fin de validite/i.test(s)
) {
addInfo(
result,
"renouvellement",
"Renouvellement",
"moyenne"
);
}

/* Asile */
if (
/demande d'asile|demande d asile|demandeur d'asile|demandeuse d'asile/i.test(s)
) {
addInfo(
result,
"asile",
"Demande d'asile"
);
}

/* Entreprise */
if (
/créer une entreprise|creer une entreprise|création d'entreprise|creation d'entreprise|lancer mon entreprise|ouvrir une entreprise|je veux créer mon entreprise|je veux creer mon entreprise/i.test(s)
) {
addInfo(
result,
"objectif",
"Création d'entreprise"
);
}

return dedupeInformations(result);
}

/* =========================================================
CONTEXTE
========================================================= */

function detectContext(q) {
const s = normaliserRecherche(q);

return {
nettoyage:
/nettoyage|menage|proprete|cleaning/.test(s),

entreprise:
/creer|creation|lancer|ouvrir|entreprise|societe|activite/.test(s),

statut:
/statut|forme juridique|micro|micro entreprise|independant|ei|entreprise individuelle/.test(s),

travail:
/travail|emploi|salarie|contrat|employeur|licenciement|salaire|cherche un emploi|recherche un emploi/.test(s),

social:
/caf|rsa|aide|social|allocation|droits sociaux/.test(s),

administratif:
/demarche|administratif|administrative|prefecture|mairie|document officiel/.test(s),

juridique:
/avocat|juridique|justice|tribunal|loi|legal|mise en demeure/.test(s),

fiscalite:
/impot|fiscal|fiscalite|urssaf|tva|cfe|cotisation/.test(s),

immigration:
/recepisse|titre de sejour|sejour|visa|anef|prefecture|etranger|demande d asile|asile|carte de sejour/.test(s),

recepisse:
/recepisse/.test(s),

titreSejour:
/titre de sejour|carte de sejour/.test(s),

anef:
/\banef\b/.test(s),

renouvellement:
/renouvellement|renouveler|expire|expiration|fin de validite/.test(s),

premiereDemande:
/premiere demande|premier titre|premiere carte|je viens d arriver/.test(s),

asile:
/asile|demandeur d asile|demandeuse d asile/.test(s)
};
}

/* =========================================================
HISTORIQUE UTILISATEUR UNIQUEMENT
========================================================= */

function analyserHistorique(history) {
const result = [];

for (const item of (history || []).slice(-30)) {
if (!item) continue;

/*
Les messages de l'assistant ne deviennent jamais
des faits utilisateur.
*/

if (item.role !== "user") continue;

const content =
texte(
item.content,
LIMITS.question
);

if (!content) continue;

result.push(
...extraireInformations(content)
);
}

return dedupeInformations(result);
}

/* =========================================================
ÉTAT DE CONVERSATION
========================================================= */

function construireEtatConversation(options = {}) {
const history =
Array.isArray(options.history)
? options.history
: [];

const historiqueInfos =
analyserHistorique(history);

const suppliedInfos =
Array.isArray(options.informations)
? options.informations
: [];

const documentInfos =
Array.isArray(options.documentInfos)
? options.documentInfos
: [];

const currentInfos =
extraireInformations(
texte(
options.question,
LIMITS.question
)
);

const toutes =
dedupeInformations([
...historiqueInfos,
...suppliedInfos,
...documentInfos,
...currentInfos
]);

const texteGlobal = [
...history
.filter(x => x?.role === "user")
.map(x => texte(x.content, 6000)),

texte(
options.question,
LIMITS.question
)
]
.filter(Boolean)
.join("\n");

const contexte =
detectContext(texteGlobal);

/*
=======================================================
CONTEXTE STRUCTURÉ
=======================================================
*/

if (
hasInfo(toutes, "objectif") &&
/recherche d'emploi/i.test(
getInfo(
toutes,
"objectif"
)?.valeur || ""
)
) {
contexte.travail = true;
}

if (hasInfo(toutes, "titre_sejour")) {
contexte.immigration = true;
}

if (hasInfo(toutes, "recepisse")) {
contexte.immigration = true;
contexte.recepisse = true;
}

/*
=======================================================
🔒 PROTECTION DU PARCOURS EMPLOI
=======================================================

Le profil "emploi" est la sélection explicite
de l'utilisateur.

Tant que l'utilisateur est dans ce profil,
les signaux textuels "entreprise", "activité",
"services", etc. ne doivent pas faire basculer
automatiquement le moteur vers entreprise.

L'objectif ici est d'empêcher un changement de
domaine provoqué par un simple mot dans la conversation.
=======================================================
*/

const profilEmploi =
options.profil === "emploi";

const situationsEmploi = [
"offres",
"cv",
"candidature",
"annonce",
"entretien",
"entreprise",
"adapte",
"comparaison",
"autre"
];

const situationEmploi =
situationsEmploi.includes(
texte(options.situation, 100)
.toLowerCase()
);

const parcoursEmploi =
profilEmploi ||
situationEmploi;

if (parcoursEmploi) {
contexte.travail = true;

/*
Le parcours choisi explicitement
garde la priorité sur les signaux
génériques détectés dans le texte.
*/

contexte.entreprise = false;
contexte.statut = false;
}

/*
=======================================================
ENTREPRISE EXPLICITE
=======================================================
*/

if (
options.profil === "entreprise" ||
options.situation === "creation"
) {
contexte.entreprise = true;
}

/*
=======================================================
PROFIL PARTICULIER / MIGRANT
=======================================================
*/

if (options.situation === "emploi") {
contexte.travail = true;
}

return {
informations: toutes,

contexte,

questionsPosees:
unique(
Array.isArray(
options.questionsPosees
)
? options.questionsPosees
: []
),

/*
Information interne utile au moteur.
*/

parcoursEmploi,

profil:
texte(
options.profil,
100
),

situation:
texte(
options.situation,
100
)
};
}

/* =========================================================
CATALOGUE DES QUESTIONS
========================================================= */

const QUESTIONS = {

zone_recherche: {
fr: "Dans quelle ville ou zone souhaitez-vous principalement rechercher un emploi ?",
ar: "في أي مدينة أو منطقة تريد البحث عن عمل بشكل أساسي؟",
en: "In which city or area would you mainly like to look for a job?"
},

type_emploi: {
fr: "Quel type d'emploi recherchez-vous principalement ? Êtes-vous ouvert à différents secteurs ?",
ar: "ما نوع العمل الذي تبحث عنه أساساً؟ وهل أنت منفتح على قطاعات مختلفة؟",
en: "What type of job are you mainly looking for? Are you open to different sectors?"
},

mobilite: {
fr: "Êtes-vous prêt à vous déplacer pour travailler en dehors de votre zone principale ?",
ar: "هل يمكنك التنقل للعمل خارج منطقتك الرئيسية؟",
en: "Are you willing to travel outside your main area for work?"
},

horaires: {
fr: "Êtes-vous flexible concernant les horaires de travail ?",
ar: "هل أنت مرن بالنسبة إلى أوقات العمل؟",
en: "Are you flexible regarding working hours?"
},

presence_france: {
fr: "Êtes-vous actuellement en France ?",
ar: "هل أنت موجود حالياً في فرنسا؟",
en: "Are you currently in France?"
},

statut_sejour: {
fr: "Quel est votre statut ou votre titre de séjour actuel ?",
ar: "ما هو وضع إقامتك أو نوع تصريح الإقامة الحالي؟",
en: "What is your current residence status or permit?"
},

entreprise: {
fr: "Quelle activité ou quels services souhaitez-vous proposer ?",
ar: "ما النشاط أو الخدمات التي تريد تقديمها؟",
en: "What activity or services would you like to offer?"
}
};

/* =========================================================
DÉCISION ENGINE
========================================================= */

function candidatsQuestions(etat) {
const {
informations,
contexte
} = etat;

/*
=======================================================
🔒 EMPLOI PRIORITAIRE
=======================================================

Si l'utilisateur a explicitement choisi
le profil Chercheur d'emploi, le moteur commence
par les questions d'emploi.

Cela empêche un signal secondaire dans le texte
de provoquer immédiatement un passage vers
le parcours entreprise.
=======================================================
*/

if (etat.parcoursEmploi) {
return [
{
key: "zone_recherche",

required: true,

when: () =>
!hasInfo(
informations,
"zone_recherche"
)
},

{
key: "type_emploi",

required: true,

when: () =>
!hasInfo(
informations,
"type_emploi"
)
},

{
key: "mobilite",

required: false,

when: () =>
!hasInfo(
informations,
"mobilite"
)
},

{
key: "horaires",

required: false,

when: () =>
!hasInfo(
informations,
"horaires"
)
}
];
}

/*
=======================================================
IMMIGRATION
=======================================================
*/

if (
contexte.recepisse ||
contexte.immigration
) {
return [
{
key: "presence_france",

required: true,

when: () =>
!hasInfo(
informations,
"presence_france"
)
},

{
key: "statut_sejour",

required: true,

when: () =>
!hasInfo(
informations,
"statut_sejour"
) &&
!hasInfo(
informations,
"titre_sejour"
)
}
];
}

/*
=======================================================
ENTREPRISE
=======================================================
*/

if (
contexte.entreprise ||
contexte.statut
) {
return [
{
key: "entreprise",

required: true,

when: () =>
!hasInfo(
informations,
"entreprise"
)
}
];
}

/*
=======================================================
TRAVAIL GÉNÉRAL
=======================================================
*/

if (contexte.travail) {
return [
{
key: "zone_recherche",

required: true,

when: () =>
!hasInfo(
informations,
"zone_recherche"
)
},

{
key: "type_emploi",

required: true,

when: () =>
!hasInfo(
informations,
"type_emploi"
)
},

{
key: "mobilite",

required: false,

when: () =>
!hasInfo(
informations,
"mobilite"
)
},

{
key: "horaires",

required: false,

when: () =>
!hasInfo(
informations,
"horaires"
)
}
];
}

return [];
}

function langueQuestion(langue) {
const l =
texte(
langue,
10
).toLowerCase();

if (l.startsWith("ar")) {
return "ar";
}

if (l.startsWith("en")) {
return "en";
}

return "fr";
}

function construireDecision(
etat,
langue = "fr"
) {
const candidates =
candidatsQuestions(etat);

const asked =
new Set(
etat.questionsPosees || []
);

for (
const candidate
of candidates
) {
if (
asked.has(
candidate.key
)
) {
continue;
}

if (!candidate.when()) {
continue;
}

const lang =
langueQuestion(langue);

return {
etape: "question",

questionKey:
candidate.key,

question:
QUESTIONS[
candidate.key
]?.[lang] ||
QUESTIONS[
candidate.key
]?.fr ||
"",

champsManquants:
[candidate.key]
};
}

return {
etape: "orientation",

questionKey: null,

question: "",

champsManquants: []
};
}

/* =========================================================
SOURCES
========================================================= */

function selectSources(contexte) {
const ids = [];

if (contexte.travail) {
ids.push(
"france_travail"
);
}

if (contexte.immigration) {
ids.push(
"anef"
);

if (contexte.travail) {
ids.push(
"travail_etranger"
);
}
}

if (
contexte.entreprise ||
contexte.statut
) {
ids.push(
"statut"
);
}

if (
contexte.entreprise &&
contexte.statut
) {
ids.push(
"creation_ei"
);

ids.push(
"guichet"
);
}

return unique(ids)
.map(
id => SOURCES[id]
)
.filter(Boolean);
}

/* =========================================================
DOCUMENTS / ACTIONS / RECOMMANDATIONS
========================================================= */

function confirmed(
informations,
contexte
) {
const out = [];

for (
const item
of informations || []
) {
if (!item?.valeur) {
continue;
}

if (
item.type === "zone_recherche" ||
item.type === "type_emploi" ||
item.type === "mobilite" ||
item.type === "horaires" ||
item.type === "diplome" ||
item.type === "experience" ||
item.type === "objectif"
) {
out.push(
`${item.type} : ${item.valeur}`
);
}
}

if (contexte.immigration) {
out.push(
"Une question liée au séjour ou à la situation administrative a été détectée."
);
}

return unique(out);
}

function documents(
informations,
contexte
) {
const out = [];

if (contexte.immigration) {
out.push({
statut: "à vérifier",

texte:
"Le titre ou document de séjour réellement détenu et sa date de validité."
});
}

if (contexte.travail) {
out.push({
statut: "à vérifier",

texte:
"Les justificatifs éventuellement demandés pour les candidatures ou l'inscription auprès des organismes concernés."
});
}

return out;
}

function actions(
informations,
contexte
) {
const out = [];

if (contexte.travail) {

if (
hasInfo(
informations,
"zone_recherche"
)
) {
out.push(
"Rechercher les possibilités d'emploi correspondant à la zone indiquée."
);
}

if (
hasInfo(
informations,
"type_emploi"
)
) {
out.push(
"Cibler les métiers correspondant au type d'emploi indiqué."
);
}

if (
hasInfo(
informations,
"diplome"
) &&
/sans diplôme/i.test(
getInfo(
informations,
"diplome"
)?.valeur || ""
)
) {
out.push(
"Privilégier les offres dont les conditions d'accès n'exigent pas de diplôme, sous réserve des exigences de chaque poste."
);
}

if (
hasInfo(
informations,
"experience"
) &&
/sans expérience/i.test(
getInfo(
informations,
"experience"
)?.valeur || ""
)
) {
out.push(
"Privilégier les offres accessibles sans expérience, sous réserve des exigences de chaque employeur."
);
}

out.push(
"Vérifier les conditions exactes de chaque offre avant de candidater."
);
}

if (contexte.immigration) {
out.push(
"Vérifier la procédure administrative exacte à partir des documents réellement détenus."
);
}

return unique(out);
}

function recommendations(
informations,
contexte
) {
const out = [];

if (contexte.travail) {

out.push(
"Les possibilités d'emploi dépendent des exigences propres à chaque poste et employeur."
);

if (
hasInfo(
informations,
"diplome"
) &&
/sans diplôme/i.test(
getInfo(
informations,
"diplome"
)?.valeur || ""
)
) {
out.push(
"L'absence de diplôme n'empêche pas nécessairement toute candidature, mais certaines professions restent soumises à des conditions particulières."
);
}
}

if (contexte.immigration) {
out.push(
"Les droits liés au séjour ou au travail doivent être vérifiés à partir du titre ou document exact et de la procédure concernée."
);
}

return unique(out);
}

/* =========================================================
SYSTEM PROMPT
========================================================= */

function systemPrompt() {
return `
Tu es GouRare AI, un assistant d'orientation et d'analyse multi-domaines.

Tu n'es pas avocat, expert-comptable, médecin, administration ou travailleur social.

RÈGLES ABSOLUES :

1. Ne transforme jamais une hypothèse en fait.
2. Les informations utilisateur doivent provenir uniquement de ses messages ou de données explicitement fournies.
3. Une réponse précédente de l'assistant n'est jamais une preuve sur l'utilisateur.
4. Ne réinvente jamais une information que l'utilisateur n'a pas donnée.
5. Ne donne jamais de conclusion juridique non vérifiée.
6. Pour l'immigration, ne déduis jamais un droit au séjour ou au travail sans éléments confirmés.
7. Les sources officielles fournies par GouRare AI sont prioritaires.
8. Ne fabrique jamais de loi, article, montant, seuil, délai, obligation, document ou statistique.
9. Le moteur de décision détermine le parcours et la prochaine question.
10. Lorsque GouRare AI fournit une question déterministe, respecte exactement cette question.
11. Ne pose pas une question déjà résolue.
12. Si l'utilisateur a clairement indiqué qu'il est sans diplôme, ne lui redemande pas s'il possède un diplôme.
13. Si l'utilisateur a clairement indiqué qu'il est sans expérience, ne lui redemande pas son expérience.
14. Pour l'emploi, donne une orientation concrète uniquement lorsque les informations essentielles sont suffisantes.
15. Ne présente jamais une information incertaine comme confirmée.
16. Pour une image, analyse uniquement ce qui est réellement visible ou lisible.
17. Pour un message, respecte strictement le contenu fourni.
18. Ne répète pas les URL des sources dans ton texte : elles sont affichées séparément.

Objectif :

COMPRENDRE
→ IDENTIFIER
→ VÉRIFIER
→ ORIENTER
→ DONNER UNE ACTION CONCRÈTE

Réponds de manière claire, humaine, concise et pratique.
`;
}

/* =========================================================
IA
========================================================= */

async function askAI(
env,
prompt,
maxTokens = 900
) {
try {

const result =
await env.IA.run(
MODEL,
{
messages: [
{
role: "system",

content:
systemPrompt()
},

{
role: "user",

content:
texte(
prompt,
60000
)
}
],

max_tokens:
maxTokens,

temperature:
0.15
}
);

if (
typeof result === "string"
) {
return result;
}

if (result?.response) {
return result.response;
}

if (
result?.result?.response
) {
return result.result.response;
}

return "";

} catch (error) {

return "";

}
}

/* =========================================================
ORIENTATION EMPLOI
========================================================= */

function construireOrientationEmploi(
informations
) {
const zone =
getInfo(
informations,
"zone_recherche"
)?.valeur || "";

const type =
getInfo(
informations,
"type_emploi"
)?.valeur || "";

const mobilite =
getInfo(
informations,
"mobilite"
)?.valeur || "";

const horaires =
getInfo(
informations,
"horaires"
)?.valeur || "";

const diplome =
getInfo(
informations,
"diplome"
)?.valeur || "";

const experience =
getInfo(
informations,
"experience"
)?.valeur || "";

const lignes = [];

lignes.push(
`Zone de recherche : ${zone || "non précisée"}`
);

lignes.push(
`Type d'emploi : ${type || "non précisé"}`
);

lignes.push(
`Mobilité : ${mobilite || "non précisée"}`
);

lignes.push(
`Horaires : ${horaires || "non précisés"}`
);

if (diplome) {
lignes.push(
`Diplôme : ${diplome}`
);
}

if (experience) {
lignes.push(
`Expérience : ${experience}`
);
}

return lignes.join("\n");
}

/* =========================================================
MESSAGES
========================================================= */

function messagePrompt(
contenu,
mode,
langue
) {
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

return `
Langue souhaitée : ${langue || "français"}

Mode :
${instructions[mode] || instructions.analyse}

CONTENU :
${texte(
contenu,
LIMITS.message
)}
`;
}

/* =========================================================
IMAGE
========================================================= */

async function analyserImage(
env,
image,
demande = ""
) {
if (
!image ||
typeof image !== "string"
) {
throw new Error(
"Image absente."
);
}

if (
image.length >
LIMITS.image
) {
throw new Error(
"Image trop volumineuse."
);
}

const result =
await env.IA.run(
MODEL_VISION,
{
messages: [
{
role: "system",

content:
"Analyse uniquement ce qui est réellement visible ou lisible. Ne devine jamais un texte illisible. Indique clairement les éléments incertains."
},

{
role: "user",

content:
demande ||
"Lis et analyse cette image. Identifie les éléments visibles, explique leur contenu et indique ce qui reste incertain."
}
],

image,

max_tokens:
2200,

temperature:
0.1
}
);

if (
typeof result === "string"
) {
return result;
}

if (result?.response) {
return result.response;
}

if (
result?.result?.response
) {
return result.result.response;
}

return typeof result?.result === "string"
? result.result
: JSON.stringify(result);
}

/* =========================================================
AUDIO
========================================================= */

function base64FromDataURL(
value
) {
const s =
texte(
value,
LIMITS.audio
);

const index =
s.indexOf(",");

if (
s.startsWith("data:") &&
index >= 0
) {
return s.slice(
index + 1
);
}

return s;
}

async function transcrireAudio(
env,
audio,
langue = "fr"
) {
if (!audio) {
throw new Error(
"Audio absent."
);
}

if (
audio.length >
LIMITS.audio
) {
throw new Error(
"Audio trop volumineux."
);
}

const result =
await env.IA.run(
MODEL_AUDIO,
{
audio:
base64FromDataURL(
audio
),

task:
"transcribe",

language:
langue,

condition_on_previous_text:
false
}
);

const text =
result?.transcription_info?.text ||
result?.text ||
result?.response ||
result?.result?.text ||
"";

return texte(
text,
20000
);
}

/* =========================================================
ANALYSE PRINCIPALE
========================================================= */

async function analyserQuestion(
env,
question,
options = {}
) {
const baseQuestion =
texte(
question,
LIMITS.question
);

const history =
Array.isArray(
options.history
)
? options.history.slice(-30)
: [];

const informationsInitiales =
Array.isArray(
options.informations
)
? options.informations
: [];

const documentInfos =
Array.isArray(
options.documentInfos
)
? options.documentInfos
: [];

const etat =
construireEtatConversation({
question:
baseQuestion,

history,

informations:
informationsInitiales,

documentInfos,

profil:
options.profil,

situation:
options.situation,

questionsPosees:
options.questionsPosees
});

const langue =
langueQuestion(
options.langue || "fr"
);

const decision =
construireDecision(
etat,
langue
);

const sources =
selectSources(
etat.contexte
);

/*
* =======================================================
* QUESTION DÉTERMINISTE
* =======================================================
*/

if (
decision.etape === "question"
) {

const nouvellesQuestions =
unique([
...(etat.questionsPosees || []),
decision.questionKey
]);

let compris =
"Je comprends votre demande. Pour avancer correctement, j'ai besoin d'une information supplémentaire.";

if (
etat.contexte.travail &&
decision.questionKey ===
"zone_recherche"
) {
compris =
"Je comprends que vous recherchez un emploi. Je commence par préciser votre zone de recherche.";
}

if (
etat.contexte.travail &&
decision.questionKey ===
"type_emploi"
) {
compris =
"J'ai compris votre zone de recherche. Je précise maintenant le type d'emploi que vous recherchez.";
}

if (
etat.contexte.travail &&
decision.questionKey ===
"mobilite"
) {
compris =
"J'ai compris le type d'emploi recherché. Je vérifie maintenant votre possibilité de déplacement.";
}

if (
etat.contexte.travail &&
decision.questionKey ===
"horaires"
) {
compris =
"J'ai compris votre zone, votre recherche et votre mobilité. Je vérifie maintenant votre disponibilité concernant les horaires.";
}

return {
success: true,

version:
VERSION,

decisionVersion:
DECISION_VERSION,

compris,

orientation:
"Nous allons avancer étape par étape afin de construire une orientation adaptée.",

confirmed:
confirmed(
etat.informations,
etat.contexte
),

toVerify: [],

recommendations: [],

actions: [],

documents: [],

risks: [],

professional: [],

nextAction:
decision.question,

questionSuivante:
decision.question,

questionKey:
decision.questionKey,

questionsPosees:
nouvellesQuestions,

informations:
etat.informations,

etat: {
informations:
etat.informations,

questionsPosees:
nouvellesQuestions,

contexte:
etat.contexte,

parcoursEmploi:
etat.parcoursEmploi
},

decision,

sources:
sources.map(
source => ({
id:
source.id,

titre:
source.titre,

organisme:
source.organisme,

url:
source.url
})
)
};
}

/*
* =======================================================
* ORIENTATION FINALE
* =======================================================
*/

let orientation = "";

if (
etat.contexte.travail
) {

const emploiFacts =
construireOrientationEmploi(
etat.informations
);

orientation =
await askAI(
env,

`
Tu dois produire une orientation professionnelle courte et concrète.

IMPORTANT :
- Utilise uniquement les informations confirmées ci-dessous.
- Ne crée aucune information personnelle.
- Ne prétends pas connaître l'éligibilité à une offre précise.
- Ne donne pas de promesse d'emploi.
- Ne cite pas d'URL.
- Si l'utilisateur n'a pas de diplôme ou d'expérience, respecte cette information.
- Ne transforme pas "ouvert à tout secteur" en métier précis.
- Propose des pistes générales cohérentes avec les informations disponibles.

INFORMATIONS CONFIRMÉES :
${emploiFacts}

Réponds en français avec :
1. une courte synthèse ;
2. quelques pistes correspondant aux informations ;
3. une prochaine action concrète.
`,

1000
);

if (!orientation) {
orientation =
"Votre profil permet maintenant de commencer à rechercher des possibilités d'emploi correspondant à votre zone, votre recherche, votre mobilité et vos disponibilités. Les conditions exactes doivent être vérifiées pour chaque offre.";
}

} else if (
etat.contexte.immigration
) {

orientation =
await askAI(
env,

`
Analyse la situation administrative suivante.

Informations confirmées :
${JSON.stringify(
etat.informations
)}

Contexte :
${JSON.stringify(
etat.contexte
)}

Donne une orientation prudente.
Ne déduis aucun droit non confirmé.
Ne donne aucune conclusion juridique définitive.
Indique les éléments qui doivent être vérifiés.
`,

900
);

if (!orientation) {
orientation =
"La situation administrative a été identifiée. Il faut maintenant vérifier la procédure exacte et les documents réellement détenus avant toute conclusion.";
}

} else if (
etat.contexte.entreprise
) {

orientation =
await askAI(
env,

`
Analyse ce projet d'entreprise uniquement à partir des informations confirmées :

${JSON.stringify(
etat.informations
)}

Donne une orientation pratique et prudente.
Ne choisis pas automatiquement un statut juridique.
`,

900
);

if (!orientation) {
orientation =
"Votre projet d'entreprise a été identifié. La prochaine étape consiste à préciser l'activité et les formalités correspondant exactement au projet.";
}

} else {

orientation =
await askAI(
env,

`
Analyse la demande suivante :

${baseQuestion}

Informations confirmées :
${JSON.stringify(
etat.informations
)}

Donne une orientation pratique sans inventer de faits.
`,

900
);

if (!orientation) {
orientation =
"GouRare AI a identifié votre demande. Les informations disponibles permettent de poursuivre l'analyse.";
}
}

const nextAction =
etat.contexte.travail
? "Vous pouvez maintenant commencer les recherches correspondant à votre profil et vérifier les conditions de chaque opportunité."
: "Vérifiez les éléments importants et poursuivez avec l'action indiquée.";

return {
success: true,

version:
VERSION,

decisionVersion:
DECISION_VERSION,

compris:
etat.contexte.travail
? "Votre situation de recherche d'emploi est maintenant suffisamment précisée pour commencer l'orientation."
: "Votre demande a été analysée à partir des informations disponibles.",

orientation,

confirmed:
confirmed(
etat.informations,
etat.contexte
),

toVerify:
etat.contexte.immigration
? [
"Vérifier les documents et le statut exacts.",
"Vérifier la procédure officielle correspondant à votre situation."
]
: [],

recommendations:
recommendations(
etat.informations,
etat.contexte
),

actions:
actions(
etat.informations,
etat.contexte
),

documents:
documents(
etat.informations,
etat.contexte
),

risks: [],

professional: [],

nextAction,

questionSuivante:
nextAction,

questionKey: null,

questionsPosees:
etat.questionsPosees || [],

informations:
etat.informations,

etat: {
informations:
etat.informations,

questionsPosees:
etat.questionsPosees || [],

contexte:
etat.contexte,

parcoursEmploi:
etat.parcoursEmploi
},

decision,

sources:
sources.map(
source => ({
id:
source.id,

titre:
source.titre,

organisme:
source.organisme,

url:
source.url
})
)
};
}

/* =========================================================
HTML
========================================================= */

function pageHTML() {
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

*{
box-sizing:border-box;
}

body{
margin:0;
font-family:
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
Roboto,
Arial,
sans-serif;
background:#f4f6f8;
color:#111827;
}

header{
background:#111827;
color:white;
padding:28px 18px;
text-align:center;
}

header h1{
margin:0 0 8px;
font-size:32px;
}

header p{
margin:0;
opacity:.85;
}

.container{
max-width:950px;
margin:25px auto;
padding:0 15px 80px;
}

.card,
.result-card{
background:white;
border-radius:18px;
padding:20px;
margin-bottom:18px;
box-shadow:
0 8px 30px rgba(0,0,0,.07);
}

h2{
margin-top:0;
}

.welcome{
text-align:center;
}

.choices{
display:grid;
grid-template-columns:
repeat(2,1fr);
gap:14px;
}

.choice{
padding:22px 16px;
border:1px solid #e5e7eb;
border-radius:16px;
background:white;
text-align:left;
cursor:pointer;
}

.choice strong{
display:block;
font-size:19px;
margin-bottom:7px;
}

.choice span{
color:#6b7280;
}

textarea,
input,
select{
width:100%;
padding:13px;
border:1px solid #d1d5db;
border-radius:11px;
font-size:16px;
background:white;
}

textarea{
min-height:130px;
resize:vertical;
}

button{
border:0;
border-radius:11px;
padding:12px 16px;
font-size:15px;
cursor:pointer;
background:#111827;
color:white;
}

.secondary{
background:#e5e7eb;
color:#111827;
}

.back{
margin-bottom:15px;
}

.actions{
display:flex;
flex-wrap:wrap;
gap:10px;
margin-top:12px;
}

.actions button{
flex:1;
}

.result-card{
border-left:5px solid #111827;
}

.ai-result{
white-space:pre-wrap;
line-height:1.65;
}

.result-card ul{
padding-left:22px;
}

.source{
padding:11px;
background:#f3f4f6;
border-radius:10px;
margin:8px 0;
}

.source a{
color:#111827;
font-weight:600;
}

.status{
margin-top:10px;
color:#4b5563;
}

.hidden{
display:none;
}

.cancer{
position:fixed;
right:12px;
bottom:12px;
background:white;
border:1px solid #e5e7eb;
padding:10px 13px;
border-radius:999px;
box-shadow:
0 5px 20px rgba(0,0,0,.12);
font-size:13px;
z-index:20;
}

footer{
text-align:center;
color:#6b7280;
padding:25px 10px;
}

@media(max-width:650px){

.choices{
grid-template-columns:1fr;
}

header h1{
font-size:27px;
}

.actions button{
width:100%;
flex-basis:100%;
}

}

</style>

</head>

<body>

<header>
<h1>GouRare AI</h1>
<p>Votre intelligence d'orientation</p>
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

<h2>🧠 Votre demande</h2>

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

<h2>✉️ Messages et emails</h2>

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

let situation = null;

let historique = [];

let informations = [];

let documentInfos = [];

let questionsPosees = [];

let etape = 0;

let mediaRecorder = null;

let audioChunks = [];

let recording = false;


/* =======================================================
UTILITAIRES FRONTEND
======================================================= */

function esc(v){
return String(v || "")
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");
}


/* =======================================================
HOME
======================================================= */

function showHome(){

profil = null;

situation = null;

historique = [];

informations = [];

documentInfos = [];

questionsPosees = [];

etape = 0;

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

const parcoursData =
${JSON.stringify(PARCOURS)};

Object.keys(parcoursData)
.forEach(function(k){

const x =
parcoursData[k];

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
.forEach(function(button){

button.onclick =
function(){

openProfil(
button.dataset.p
);

};

});

document
.getElementById("inconnu")
.onclick =
function(){

openProfil(
"particulier"
);

question.value =
"Je ne sais pas quel parcours correspond à ma situation. Aidez-moi à m'orienter.";

outil.classList.remove(
"hidden"
);

messageCard.classList.add(
"hidden"
);

assistant.classList.add(
"hidden"
);

};

}


/* =======================================================
PROFIL
======================================================= */

function openProfil(k){

profil = k;

const parcoursData =
${JSON.stringify(PARCOURS)};

const x =
parcoursData[k];

parcours.classList.add(
"hidden"
);

outil.classList.add(
"hidden"
);

messageCard.classList.add(
"hidden"
);

assistant.classList.remove(
"hidden"
);

titre.textContent =
x.titre;

desc.textContent =
x.description;

situations.innerHTML =
"";

x.situations.forEach(
function(item){

const b =
document.createElement(
"div"
);

b.className =
"choice";

b.innerHTML =
"<strong>" +
esc(item[1]) +
"</strong>";

b.dataset.s =
item[0];

b.onclick =
function(){

openSituation(
item[0],
item[1]
);

};

situations.appendChild(
b
);

}
);

}


/* =======================================================
SITUATION
======================================================= */

function openSituation(
s,
label
){

situation = s;

historique = [];

informations = [];

documentInfos = [];

questionsPosees = [];

etape = 0;

assistant.classList.add(
"hidden"
);

outil.classList.remove(
"hidden"
);

messageCard.classList.remove(
"hidden"
);

question.value =
"";

result.innerHTML =
"";

status.textContent =
"Parcours sélectionné : " +
label;

messageMode.value =
"";

if(
s === "message" ||
s === "document"
){

messageMode.value =
"analyse";

}

}


/* =======================================================
RETOUR
======================================================= */

document
.getElementById("retour")
.onclick =
showHome;

document
.getElementById("retourOutil")
.onclick =
function(){

outil.classList.add(
"hidden"
);

messageCard.classList.add(
"hidden"
);

assistant.classList.remove(
"hidden"
);

result.innerHTML =
"";

};


showHome();


/* =======================================================
ENVOI
======================================================= */

async function analyserTexte(){

const q =
question.value.trim();

if(!q){

status.textContent =
"Veuillez écrire ou dire votre demande.";

return;

}

status.textContent =
"Analyse en cours...";

result.innerHTML =
"";

try{

const historyPayload =
historique
.slice(-30)
.map(function(item){

return {

role:
item.role,

content:
String(
item.content || ""
).slice(
0,
6000
)

};

});

const r =
await fetch(
"/api/analyze",
{

method:
"POST",

headers:{
"content-type":
"application/json"
},

body:
JSON.stringify({

type:
messageMode.value
? "message"
: "question",

question:
q,

historique:
historyPayload,

informations:
informations,

documentInfos:
documentInfos,

questionsPosees:
questionsPosees,

profil:
profil,

situation:
situation,

etape:
etape,

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

if(
!r.ok ||
!d.success
){

throw new Error(
d.error ||
"Erreur."
);

}


/*
USER uniquement.
*/

historique.push({

role:
"user",

content:
q

});


/*
Réponse assistant.
Le backend ne l'utilise jamais
comme preuve personnelle.
*/

historique.push({

role:
"assistant",

content:
d.questionSuivante ||
d.orientation ||
""

});


/*
État canonique.
*/

informations =
d.informations ||
d.etat?.informations ||
informations;

questionsPosees =
d.questionsPosees ||
d.etat?.questionsPosees ||
questionsPosees;


if(
historique.length >
40
){

historique =
historique.slice(-40);

}


etape++;

afficher(d);

question.value =
"";

status.textContent =
d.decision?.etape === "question"
? "Répondez à la question suivante pour continuer."
: "Analyse terminée.";

}catch(e){

status.textContent =
e.message ||
"Erreur.";

}

}


/* =======================================================
LISTES
======================================================= */

function liste(a){

if(
!a ||
!a.length
){

return (
"<p>Aucun élément précis à présenter à ce stade.</p>"
);

}

return (
"<ul>" +

a.map(
function(x){

const v =
typeof x === "string"
? x
: (
x?.texte ||
JSON.stringify(x)
);

return (
"<li>" +
esc(v) +
"</li>"
);

}
).join("") +

"</ul>"
);

}


/* =======================================================
AFFICHAGE
======================================================= */

function afficher(d){

let h =
"";

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

(
d.decision?.etape === "question"
? "<p style='margin-bottom:0;color:#4b5563'>" +
"Répondez à cette question dans la zone ci-dessus, puis appuyez sur « Analyser » pour continuer." +
"</p>"
: ""
) +

"</div>";


if(
d.sources &&
d.sources.length
){

h +=
"<div class='result-card'>" +
"<h2>📚 Sources consultées</h2>";

d.sources.forEach(
function(s){

h +=
"<div class='source'>" +

"<strong>" +
esc(s.organisme) +
"</strong>" +

" — " +

esc(s.titre) +

"<br>" +

"<a href='" +
esc(s.url) +
"' " +
"target='_blank' " +
"rel='noopener noreferrer'>" +

"Consulter la source officielle ↗" +

"</a>" +

"</div>";

}
);

h +=
"</div>";

}


result.innerHTML =
h;

}


/* =======================================================
BOUTON ANALYSER
======================================================= */

document
.getElementById("analyser")
.onclick =
analyserTexte;


/* =======================================================
IMAGE
======================================================= */

document
.getElementById("photo")
.onclick =
function(){

imageInput.click();

};


imageInput.onchange =
function(){

const f =
imageInput.files &&
imageInput.files[0];

if(!f) return;

if(
!f.type.startsWith(
"image/"
)
){

status.textContent =
"Veuillez sélectionner une image.";

return;

}

if(
f.size >
5500000
){

status.textContent =
"Image trop volumineuse.";

return;

}

const reader =
new FileReader();

status.textContent =
"📷 Analyse de l'image...";

reader.onloadend =
async function(){

try{

const r =
await fetch(
"/api/image",
{

method:
"POST",

headers:{
"content-type":
"application/json"
},

body:
JSON.stringify({

image:
reader.result,

demande:
question.value.trim()

})

}
);

const d =
await r.json();

if(
!r.ok ||
!d.success
){

throw new Error(
d.error ||
"Erreur image."
);

}

question.value =
d.texte || "";

await analyserTexte();

}catch(e){

status.textContent =
e.message ||
"Erreur image.";

}

};

reader.readAsDataURL(f);

};


/* =======================================================
MICROPHONE
======================================================= */

document
.getElementById("micro")
.onclick =
async function(){

if(
recording &&
mediaRecorder
){

mediaRecorder.stop();

return;

}

if(
!navigator.mediaDevices?.getUserMedia
){

status.textContent =
"Microphone indisponible.";

return;

}

try{

const stream =
await navigator.mediaDevices
.getUserMedia({
audio:true
});

audioChunks =
[];

mediaRecorder =
new MediaRecorder(
stream
);

recording =
true;

this.textContent =
"⏹️ Arrêter";

status.textContent =
"🎙️ Je vous écoute...";


mediaRecorder.ondataavailable =
function(e){

if(e.data.size){

audioChunks.push(
e.data
);

}

};


mediaRecorder.onstop =
async function(){

recording =
false;

document
.getElementById(
"micro"
)
.textContent =
"🎙️ Parler";

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


const reader =
new FileReader();


reader.onloadend =
async function(){

try{

const r =
await fetch(
"/api/transcribe",
{

method:
"POST",

headers:{
"content-type":
"application/json"
},

body:
JSON.stringify({

audio:
reader.result,

langue:
"fr"

})

}
);


const d =
await r.json();


if(
!r.ok ||
!d.success
){

throw new Error(
d.error ||
"Erreur audio."
);

}


question.value =
d.text || "";


await analyserTexte();


}catch(e){

status.textContent =
e.message ||
"Erreur audio.";

}

};


reader.readAsDataURL(
blob
);

};


mediaRecorder.start();

}catch(e){

status.textContent =
"L'accès au microphone a été refusé ou est indisponible.";

}

};

</script>

</body>

</html>`;
}

/* =========================================================
API ANALYZE
========================================================= */

async function handleAnalyze(
request,
env
) {

if(
!(
request.headers.get(
"content-type"
) || ""
).includes(
"application/json"
)
){

return jsonResponse(
{
success:false,

error:
"Le contenu doit être envoyé au format JSON."
},

415
);

}

let body;

try{

body =
await request.json();

}catch{

return jsonResponse(
{
success:false,

error:
"JSON invalide."
},

400
);

}


const q =
texte(
body.question,
LIMITS.question
);


if(!q){

return jsonResponse(
{
success:false,

error:
"Question vide."
},

400
);

}


try{

let history =
Array.isArray(
body.historique
)
? body.historique
: [];


history =
history
.slice(-30)
.map(
item => ({

role:
item?.role ===
"assistant"
? "assistant"
: "user",

content:
texte(
item?.content,
6000
)

})
)
.filter(
item =>
item.content
);


const informations =
Array.isArray(
body.informations
)
? body.informations
: [];


const documentInfos =
Array.isArray(
body.documentInfos
)
? body.documentInfos
: [];


const questionsPosees =
Array.isArray(
body.questionsPosees
)
? body.questionsPosees
: [];


return jsonResponse(
await analyserQuestion(
env,

q,

{

history,

informations,

documentInfos,

questionsPosees,

profil:
texte(
body.profil,
100
),

situation:
texte(
body.situation,
100
),

etape:
Number.isFinite(
Number(
body.etape
)
)
? Number(
body.etape
)
: 0,

messageMode:
body.type ===
"message"
? texte(
body.messageMode,
50
)
: null,

langue:
texte(
body.langue,
50
)

}
)
);

}catch(error){

return jsonResponse(
{
success:false,

error:
error?.message ||
"Erreur d'analyse.",

version:
VERSION,

decisionVersion:
DECISION_VERSION
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
){

let body;

try{

body =
await request.json();

}catch{

return jsonResponse(
{
success:false,

error:
"JSON invalide."
},

400
);

}


try{

const text =
await transcrireAudio(
env,

texte(
body.audio,
LIMITS.audio
),

texte(
body.langue,
10
) ||
"fr"
);


if(!text){

return jsonResponse(
{
success:false,

error:
"Aucun texte détecté."
},

422
);

}


return jsonResponse(
{
success:true,

text,

version:
VERSION
}
);

}catch(error){

return jsonResponse(
{
success:false,

error:
error?.message ||
"Erreur audio.",

version:
VERSION,

decisionVersion:
DECISION_VERSION
},

500
);

}

}


/* =========================================================
API IMAGE
========================================================= */

async function handleImage(
request,
env
){

let body;

try{

body =
await request.json();

}catch{

return jsonResponse(
{
success:false,

error:
"JSON invalide."
},

400
);

}


try{

const image =
texte(
body.image,
LIMITS.image
);


if(!image){

return jsonResponse(
{
success:false,

error:
"Image absente."
},

400
);

}


const text =
await analyserImage(
env,

image,

texte(
body.demande,
5000
)
);


return jsonResponse(
{
success:true,

texte:
text,

version:
VERSION
}
);

}catch(error){

return jsonResponse(
{
success:false,

error:
error?.message ||
"Erreur image.",

version:
VERSION,

decisionVersion:
DECISION_VERSION
},

500
);

}

}


/* =========================================================
ROUTER PRINCIPAL
========================================================= */

export default {

async fetch(
request,
env
) {

const url =
new URL(
request.url
);


/*
CORS preflight / OPTIONS
*/

if(
request.method ===
"OPTIONS"
){

return new Response(
null,

{
status:
204,

headers:
securityHeaders()
}
);

}


/*
Health
*/

if(
url.pathname ===
"/health"
){

return new Response(
JSON.stringify({

success:true,

service:
"GouRare AI",

status:
"OK",

version:
VERSION,

decisionVersion:
DECISION_VERSION,

modules:{

texte:true,

parcours:true,

messages:true,

image:true,

voix:true,

moteurDeDecision:true,

moteurDeVerite:true

}

}),

{

status:
200,

headers:{

...securityHeaders(),

"content-type":
"application/json; charset=utf-8"

}

}
);

}


/*
Rate limit uniquement sur les API.
*/

if(
url.pathname.startsWith(
"/api/"
)
){

if(
!checkRateLimit(
request
)
){

return jsonResponse(
{
success:false,

error:
"Trop de requêtes. Veuillez patienter quelques instants."
},

429,

{
"Retry-After":
"60"
}
);

}

}


/*
Analyze
*/

if(
url.pathname ===
"/api/analyze"
){

if(
request.method !==
"POST"
){

return jsonResponse(
{
success:false,

error:
"Méthode non autorisée."
},

405
);

}


const response =
await handleAnalyze(
request,
env
);


const headers =
new Headers(
response.headers
);


Object
.entries(
securityHeaders()
)
.forEach(
([key,value]) =>
headers.set(
key,
value
)
);


return new Response(
response.body,

{
status:
response.status,

headers
}
);

}


/*
Transcription
*/

if(
url.pathname ===
"/api/transcribe"
){

if(
request.method !==
"POST"
){

return jsonResponse(
{
success:false,

error:
"Méthode non autorisée."
},

405
);

}


const response =
await handleTranscribe(
request,
env
);

const headers =
new Headers(
response.headers
);

Object
.entries(
securityHeaders()
)
.forEach(
([key,value]) =>
headers.set(
key,
value
)
);

return new Response(
response.body,

{
status:
response.status,

headers
}
);

}


/*
Image
*/

if(
url.pathname ===
"/api/image"
){

if(
request.method !==
"POST"
){

return jsonResponse(
{
success:false,

error:
"Méthode non autorisée."
},

405
);

}


const response =
await handleImage(
request,
env
);

const headers =
new Headers(
response.headers
);

Object
.entries(
securityHeaders()
)
.forEach(
([key,value]) =>
headers.set(
key,
value
)
);

return new Response(
response.body,

{
status:
response.status,

headers
}
);

}


/*
Page principale
*/

if(
url.pathname ===
"/"
){

return new Response(
pageHTML(),

{

status:
200,

headers:{

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

status:
404,

headers:
securityHeaders()

}
);

}

};
