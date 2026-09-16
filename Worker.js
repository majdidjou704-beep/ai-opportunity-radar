// ============================================================
// GouRare AI — V10.1
// Case Intelligence + Deterministic Decision Engine
// ============================================================

const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const MODEL_VISION = "@cf/meta/llama-3.2-11b-vision-instruct";
const MODEL_AUDIO = "@cf/openai/whisper-large-v3-turbo";

const VERSION = "10.1";
const DECISION_VERSION = "10.1";

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

const memoryRate = new Map();

// ============================================================
// LANGUES
// ============================================================

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
LU: "fr"
};

function languageName(code) {
return LANGUAGES[code]?.name || "Français";
}

function normalizeLang(lang) {
if (!lang) return "fr";

const value = String(lang)
.trim()
.toLowerCase()
.split("-")[0];

return LANGUAGES[value] ? value : "fr";
}

function countryOfficialLanguage(country) {
const code = String(country || "")
.trim()
.toUpperCase();

return COUNTRY_LANGUAGES[code] || null;
}

// ============================================================
// SOURCES OFFICIELLES
// ============================================================

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

// ============================================================
// OUTILS GÉNÉRAUX
// ============================================================

function texte(value, fallback = "") {
if (value === null || value === undefined) return fallback;
return String(value).trim();
}

function safeJSON(value, fallback = null) {
try {
return JSON.parse(value);
} catch {
return fallback;
}
}

function truncateText(value, max) {
const text = texte(value);
if (text.length <= max) return text;
return text.slice(0, max) + "…";
}

function truncateJSON(value, max = 20000) {
try {
return truncateText(JSON.stringify(value), max);
} catch {
return "";
}
}

function escapeHTML(value) {
return texte(value)
.replaceAll("&", "&amp;")
.replaceAll("<", "&lt;")
.replaceAll(">", "&gt;")
.replaceAll('"', "&quot;")
.replaceAll("'", "&#039;");
}

function uniqueStrings(values) {
return [...new Set(
(values || [])
.map(v => texte(v))
.filter(Boolean)
)];
}

// ============================================================
// DÉTECTION DE LANGUE
// ============================================================

function detectLanguage(text) {
const value = texte(text).toLowerCase();

if (!value) return "fr";

if (
/[\u0600-\u06ff]/.test(value)
) {
return "ar";
}

const scores = {
fr: 0,
en: 0,
es: 0,
it: 0,
de: 0,
pt: 0
};

const patterns = {
fr: [
/\bbonjour\b/,
/\bje\b/,
/\bavec\b/,
/\bsans\b/,
/\bemploi\b/,
/\btravail\b/,
/\bdiplôme\b/,
/\bexpérience\b/,
/\bfrance\b/,
/\bcherche\b/
],

en: [
/\bhello\b/,
/\bi am\b/,
/\bjob\b/,
/\bwork\b/,
/\bwithout\b/,
/\bexperience\b/,
/\bdegree\b/,
/\bfrance\b/
],

es: [
/\bhola\b/,
/\btrabajo\b/,
/\bempleo\b/,
/\bsin\b/,
/\bexperiencia\b/,
/\bdiploma\b/,
/\bbusco\b/
],

it: [
/\bciao\b/,
/\blavoro\b/,
/\bimpiego\b/,
/\bsenza\b/,
/\besperienza\b/,
/\bdiploma\b/,
/\bcerca\b/
],

de: [
/\bhallo\b/,
/\barbeit\b/,
/\bjob\b/,
/\bohne\b/,
/\berfahrung\b/,
/\bdiplom\b/,
/\bsuche\b/
],

pt: [
/\bolá\b/,
/\btrabalho\b/,
/\bemprego\b/,
/\bsem\b/,
/\bexperiência\b/,
/\bdiploma\b/,
/\bprocuro\b/
]
};

for (const [lang, list] of Object.entries(patterns)) {
for (const regex of list) {
if (regex.test(value)) scores[lang]++;
}
}

return Object.entries(scores)
.sort((a, b) => b[1] - a[1])[0][1] > 0
? Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]
: "fr";
}

// ============================================================
// RATE LIMIT
// ============================================================

function cleanupRateMemory() {
const now = Date.now();

for (const [key, value] of memoryRate.entries()) {
if (!value || value.resetAt <= now) {
memoryRate.delete(key);
}
}

if (memoryRate.size > 5000) {
const entries = [...memoryRate.entries()]
.sort((a, b) => a[1].resetAt - b[1].resetAt);

for (let i = 0; i < Math.floor(entries.length / 2); i++) {
memoryRate.delete(entries[i][0]);
}
}
}

function getClientIP(request) {
return (
request.headers.get("CF-Connecting-IP") ||
"anonymous"
);
}

function checkRateLimit(request, type) {
cleanupRateMemory();

const config = RATE_LIMITS[type];

if (!config) {
return {
allowed: true,
remaining: 999
};
}

const ip = getClientIP(request);
const key = `${type}:${ip}`;
const now = Date.now();

let entry = memoryRate.get(key);

if (!entry || entry.resetAt <= now) {
entry = {
count: 0,
resetAt: now + config.windowMs
};
}

entry.count++;

memoryRate.set(key, entry);

if (entry.count > config.maxRequests) {
return {
allowed: false,
remaining: 0,
retryAfter: Math.ceil(
(entry.resetAt - now) / 1000
)
};
}

return {
allowed: true,
remaining: Math.max(
0,
config.maxRequests - entry.count
)
};
}

// ============================================================
// SECURITY HEADERS
// ============================================================

function securityHeaders() {
return {
"X-Content-Type-Options": "nosniff",
"X-Frame-Options": "DENY",
"Referrer-Policy": "strict-origin-when-cross-origin",
"Permissions-Policy": "camera=(), geolocation=(), payment=()",
"Content-Security-Policy":
"default-src 'self'; " +
"img-src 'self' data: blob:; " +
"media-src 'self' blob:; " +
"style-src 'self' 'unsafe-inline'; " +
"script-src 'self' 'unsafe-inline'; " +
"connect-src 'self'"
};
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
return new Response(
JSON.stringify(data),
{
status,
headers: {
"Content-Type": "application/json; charset=utf-8",
...securityHeaders(),
...extraHeaders
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

// ============================================================
// BODY JSON
// ============================================================

async function readJSON(request, maxBytes) {
const contentLength = Number(
request.headers.get("content-length") || 0
);

if (contentLength && contentLength > maxBytes) {
throw new Error("Requête trop volumineuse.");
}

const body = await request.text();

if (new TextEncoder().encode(body).length > maxBytes) {
throw new Error("Requête trop volumineuse.");
}

const data = safeJSON(body);

if (!data || typeof data !== "object") {
throw new Error("JSON invalide.");
}

return data;
}

// ============================================================
// VALIDATION DATA URL
// ============================================================

function normalizeDataURL(value) {
const data = texte(value);

if (!/^data:[^;]+;base64,[A-Za-z0-9+/=\s]+$/i.test(data)) {
throw new Error("Format de fichier invalide.");
}

return data;
}

function base64Payload(dataURL) {
const index = dataURL.indexOf(",");

if (index === -1) {
throw new Error("Données base64 invalides.");
}

return dataURL.slice(index + 1).replace(/\s/g, "");
}

// ============================================================
// EXTRACTION D'INFORMATIONS — MESSAGE UTILISATEUR
// ============================================================

function extraireInformations(question) {
const q = texte(question);
const lower = q.toLowerCase();

const result = [];

function add(type, value, confiance = "forte") {
if (!value) return;

result.push({
type,
value: texte(value),
confiance,
source: "message_utilisateur"
});
}

// ----------------------------------------------------------
// FRANCE
// ----------------------------------------------------------

if (
/\bfrance\b/i.test(q) ||
/\ben france\b/i.test(q)
) {
add("presence_france", "France");
}

// ----------------------------------------------------------
// DIPLÔME
// ----------------------------------------------------------

if (
/sans diplôme/i.test(q) ||
/aucun diplôme/i.test(q) ||
/pas de diplôme/i.test(q) ||
/je n'ai pas de diplôme/i.test(q) ||
/je n’ai pas de diplôme/i.test(q)
) {
add("diplome", "Sans diplôme");
}

// ----------------------------------------------------------
// EXPÉRIENCE
// ----------------------------------------------------------

if (
/sans expérience/i.test(q) ||
/aucune expérience/i.test(q) ||
/pas d'expérience/i.test(q) ||
/pas d’expérience/i.test(q) ||
/je n'ai pas d'expérience/i.test(q) ||
/je n’ai pas d’expérience/i.test(q)
) {
add("experience", "Sans expérience");
}

// ----------------------------------------------------------
// TITRE DE SÉJOUR
// ----------------------------------------------------------

const titreMatch = q.match(
/titre\s+de\s+s[ée]jour(?:\s*[:\-]?\s*)?([A-Za-zÀ-ÿ0-9 '"-]{2,80})/i
);

if (titreMatch) {
add("titre_sejour", titreMatch[1]);
}

if (/\bsalari[ée]\b/i.test(q)) {
add("statut_sejour", "Salarié");
}

// ----------------------------------------------------------
// ANNÉE DE VALIDITÉ
// ----------------------------------------------------------

const yearMatch = q.match(
/\b(?:jusqu'en|jusqu’en|valide jusqu'en|valide jusqu’en|à|en)\s*(20\d{2})\b/i
);

if (yearMatch) {
add("validite_titre", yearMatch[1]);
}

// ----------------------------------------------------------
// OBJECTIF EMPLOI
// ----------------------------------------------------------

if (
/\bcherche(r)?\b.*\bemploi\b/i.test(q) ||
/\bcherche(r)?\b.*\btravail\b/i.test(q) ||
/\brecherche\b.*\bemploi\b/i.test(q) ||
/\brecherche\b.*\btravail\b/i.test(q) ||
/\btrouver\b.*\btravail\b/i.test(q) ||
/\btrouver\b.*\bemploi\b/i.test(q)
) {
add("objectif", "Recherche d'emploi");
}

// ----------------------------------------------------------
// ZONE DE RECHERCHE
// ----------------------------------------------------------

const locationPatterns = [
/\bà\s+([A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÿ'’-]{2,}(?:[\s-]+[A-Za-zÀ-ÿ'’-]{2,}){0,4})/,
/\bdans\s+([A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÿ'’-]{2,}(?:[\s-]+[A-Za-zÀ-ÿ'’-]{2,}){0,4})/,
/\bprès\s+de\s+([A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÿ'’-]{2,}(?:[\s-]+[A-Za-zÀ-ÿ'’-]{2,}){0,4})/i
];

for (const regex of locationPatterns) {
const match = q.match(regex);

if (match) {
const candidate = texte(match[1]);

if (
candidate &&
!/^(ce|cette|mon|ma|mes|un|une|la|le|les|tout|tous)$/i.test(candidate)
) {
add("zone_recherche", candidate);
break;
}
}
}

// Quelques lieux fréquents
const knownLocations = [
"Vigneux-sur-Seine",
"Paris",
"Créteil",
"Évry",
"Évry-Courcouronnes",
"Montgeron",
"Draveil",
"Athis-Mons",
"Juvisy-sur-Orge",
"Viry-Châtillon",
"Corbeil-Essonnes",
"Essonne",
"Val-de-Marne",
"Seine-et-Marne",
"Hauts-de-Seine"
];

for (const location of knownLocations) {
if (lower.includes(location.toLowerCase())) {
add("zone_recherche", location);
break;
}
}

// ----------------------------------------------------------
// TYPE D'EMPLOI
// ----------------------------------------------------------

if (
/n'importe quel travail/i.test(q) ||
/n’importe quel travail/i.test(q) ||
/tout secteur/i.test(q) ||
/tous les secteurs/i.test(q) ||
/peu importe le secteur/i.test(q) ||
/peu importe le travail/i.test(q)
) {
add("type_emploi", "Ouvert à tout secteur");
}

const emploiMatch = q.match(
/\b(?:cherche|recherche|veux|voudrais)\b.{0,50}\b(?:poste|emploi|travail)\b.{0,30}\b([A-Za-zÀ-ÿ' -]{3,50})/i
);

if (emploiMatch && !informationsContient(result, "type_emploi")) {
add("type_emploi", texte(emploiMatch[1]), "moyenne");
}

// ----------------------------------------------------------
// MOBILITÉ
// ----------------------------------------------------------

if (
/je peux me déplacer/i.test(q) ||
/je peux me deplacer/i.test(q) ||
/je suis mobile/i.test(q) ||
/je peux travailler partout/i.test(q) ||
/je peux me rendre/i.test(q)
) {
add("mobilite", "Flexible");
}

if (
/je ne peux pas me déplacer/i.test(q) ||
/je ne peux pas me deplacer/i.test(q) ||
/sans déplacement/i.test(q)
) {
add("mobilite", "Limitée");
}

// ----------------------------------------------------------
// HORAIRES
// ----------------------------------------------------------

if (
/peu importe les horaires/i.test(q) ||
/horaires.*peu importe/i.test(q) ||
/je suis flexible.*horaires/i.test(q) ||
/jour.*nuit.*week-end/i.test(q)
) {
add("horaires", "Flexible");
}

// ----------------------------------------------------------
// ENTREPRISE
// ----------------------------------------------------------

if (
/\bcréer une entreprise\b/i.test(q) ||
/\bcreer une entreprise\b/i.test(q) ||
/\bmon entreprise\b/i.test(q) ||
/\bactivité indépendante\b/i.test(q) ||
/\bactivite indépendante\b/i.test(q)
) {
add("entreprise", "Projet de création/développement d'entreprise");
}

// ----------------------------------------------------------
// FORMATION
// ----------------------------------------------------------

if (
/\bformation\b/i.test(q) ||
/\bapprendre un métier\b/i.test(q) ||
/\bapprendre un metier\b/i.test(q)
) {
add("formation", "Recherche de formation");
}

// ----------------------------------------------------------
// IMMIGRATION
// ----------------------------------------------------------

if (
/\btitre de séjour\b/i.test(q) ||
/\btitre de sejour\b/i.test(q) ||
/\bpréfecture\b/i.test(q) ||
/\bprefecture\b/i.test(q) ||
/\banef\b/i.test(q) ||
/\bétranger\b/i.test(q) ||
/\bétrangère\b/i.test(q)
) {
add(
"domaine",
"Immigration / administration des étrangers"
);
}

return dedupeInformations(result);
}

function informationsContient(informations, type) {
return (informations || []).some(
item => item?.type === type
);
}

// ============================================================
// EXTRACTION DOCUMENT
// ============================================================

function extraireInformationsDocument(documentText) {
const text = truncateText(documentText, LIMITS.documentText);

if (!text) return [];

const result = [];

function add(type, value, confiance = "moyenne") {
if (!value) return;

result.push({
type,
value: texte(value),
confiance,
source: "document"
});
}

const dates = text.match(
/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g
);

if (dates) {
dates.slice(0, 10).forEach(date => {
add("date_document", date, "forte");
});
}

const years = text.match(/\b20\d{2}\b/g);

if (years) {
years.slice(0, 10).forEach(year => {
add("annee_document", year, "moyenne");
});
}

const reference = text.match(
/\b(?:n[°o]|référence|reference|dossier|numéro|numero)\s*[:\-]?\s*([A-Z0-9\-\/]{3,40})/i
);

if (reference) {
add("reference_document", reference[1], "forte");
}

if (
/\brefus\b/i.test(text) ||
/\brejet\b/i.test(text) ||
/\bdéfavorable\b/i.test(text) ||
/\bdefavorable\b/i.test(text)
) {
add("decision", "Refus / décision défavorable", "forte");
}

if (
/\bfavorable\b/i.test(text) ||
/\baccord\b/i.test(text) ||
/\baccepté\b/i.test(text) ||
/\baccepte\b/i.test(text)
) {
add("decision", "Décision favorable / accord", "forte");
}

if (
/\brendez-vous\b/i.test(text) ||
/\brendez vous\b/i.test(text)
) {
add("rendez_vous", "Rendez-vous mentionné", "forte");
}

if (
/\bpièce[s]?\s+manquante[s]?\b/i.test(text) ||
/\bdocument[s]?\s+manquant[s]?\b/i.test(text)
) {
add("documents_manquants", "Documents/pièces manquants", "forte");
}

if (
/\bdate limite\b/i.test(text) ||
/\bavant le\b/i.test(text) ||
/\bau plus tard le\b/i.test(text)
) {
add("delai", "Délai/date limite mentionné", "forte");
}

if (
/\btravail\b/i.test(text) ||
/\bemploi\b/i.test(text) ||
/\bsalarié\b/i.test(text)
) {
add("domaine_document", "Travail / emploi", "moyenne");
}

if (
/\btitre de séjour\b/i.test(text) ||
/\btitre de sejour\b/i.test(text) ||
/\bpréfecture\b/i.test(text) ||
/\bprefecture\b/i.test(text)
) {
add(
"domaine_document",
"Immigration / séjour",
"forte"
);
}

if (
/\bentreprise\b/i.test(text) ||
/\bentrepreneur\b/i.test(text) ||
/\bactivité\b/i.test(text)
) {
add(
"domaine_document",
"Entreprise / activité",
"moyenne"
);
}

return dedupeInformations(result);
}

// ============================================================
// DÉDUPLICATION
// ============================================================

function dedupeInformations(informations) {
const map = new Map();

for (const info of informations || []) {
if (!info?.type || !info?.value) continue;

const key =
`${info.type}::${String(info.value).trim().toLowerCase()}`;

if (!map.has(key)) {
map.set(key, {
type: info.type,
value: info.value,
confiance: info.confiance || "moyenne",
source: info.source || "inconnu"
});
}
}

return [...map.values()];
}

function fusionnerInformations(...groups) {
return dedupeInformations(
groups.flat().filter(Boolean)
);
}

function informationsTypes(informations) {
return new Set(
(informations || [])
.map(item => item?.type)
.filter(Boolean)
);
}

// ============================================================
// HISTORIQUE
// IMPORTANT : uniquement les messages USER sont utilisés
// pour construire les faits du dossier.
// ============================================================

function analyserHistorique(history) {
const result = [];

for (const item of (history || []).slice(-30)) {
if (!item) continue;

// Protection contre la contamination par les réponses de l'IA
if (item.role !== "user") continue;

const content = texte(item.content);

if (!content) continue;

result.push(
...extraireInformations(content)
);
}

return dedupeInformations(result);
}

// ============================================================
// ÉTAT DU DOSSIER
// ============================================================

function construireEtatConversation({
historique = [],
informations = [],
documentInfos = [],
question = ""
}) {
const infosHistorique = analyserHistorique(historique);
const infosQuestion = extraireInformations(question);

const toutesInformations = fusionnerInformations(
infosHistorique,
informations,
documentInfos,
infosQuestion
);

const types = informationsTypes(
toutesInformations
);

let domaine = "orientation_generale";

const immigrationSignal =
types.has("titre_sejour") ||
types.has("statut_sejour") ||
toutesInformations.some(
x =>
x.type === "domaine" &&
/immigration/i.test(x.value)
) ||
toutesInformations.some(
x =>
x.type === "domaine_document" &&
/immigration|séjour/i.test(x.value)
);

const entrepriseSignal =
types.has("entreprise") ||
toutesInformations.some(
x =>
x.type === "domaine_document" &&
/entreprise/i.test(x.value)
);

const emploiSignal =
types.has("objectif") ||
types.has("type_emploi") ||
types.has("experience") ||
types.has("diplome") ||
types.has("zone_recherche");

if (entrepriseSignal) {
domaine = "entreprise";
}

if (emploiSignal) {
domaine = "emploi";
}

// L'immigration devient prioritaire uniquement si
// un véritable signal immigration existe.
if (immigrationSignal) {
domaine = "immigration";
}

return {
version: VERSION,
decisionVersion: DECISION_VERSION,
domaine,
informations: toutesInformations,
nombreInformations: toutesInformations.length,
types: [...types]
};
}

// ============================================================
// CATALOGUE DES QUESTIONS
// ============================================================

const QUESTION_CATALOG = {

zone_recherche: {
fr: "Dans quelle ville ou quel département cherchez-vous principalement un emploi ?",
ar: "في أي مدينة أو إقليم تبحث بشكل أساسي عن عمل؟",
en: "Which city or department are you mainly looking for work in?",
es: "¿En qué ciudad o provincia buscas principalmente trabajo?",
it: "In quale città o provincia stai principalmente cercando lavoro?",
de: "In welcher Stadt oder welchem Département suchen Sie hauptsächlich Arbeit?",
pt: "Em que cidade ou região você procura principalmente trabalho?"
},

type_emploi: {
fr: "Quel type de travail recherchez-vous principalement, ou êtes-vous ouvert à tout secteur ?",
ar: "ما نوع العمل الذي تبحث عنه أساساً، أم أنك منفتح على جميع القطاعات؟",
en: "What type of work are you mainly looking for, or are you open to any sector?",
es: "¿Qué tipo de trabajo buscas principalmente o estás abierto a cualquier sector?",
it: "Che tipo di lavoro cerchi principalmente, oppure sei aperto a qualsiasi settore?",
de: "Welche Art von Arbeit suchen Sie hauptsächlich, oder sind Sie für jeden Bereich offen?",
pt: "Que tipo de trabalho você procura principalmente, ou está aberto a qualquer setor?"
},

mobilite: {
fr: "Pouvez-vous vous déplacer pour travailler, ou préférez-vous rester proche de chez vous ?",
ar: "هل يمكنك التنقل من أجل العمل، أم تفضل البقاء بالقرب من منزلك؟",
en: "Can you travel for work, or do you prefer to stay close to home?",
es: "¿Puedes desplazarte para trabajar o prefieres quedarte cerca de casa?",
it: "Puoi spostarti per lavorare o preferisci restare vicino a casa?",
de: "Können Sie für die Arbeit pendeln, oder möchten Sie lieber in der Nähe Ihres Wohnortes bleiben?",
pt: "Você pode se deslocar para trabalhar ou prefere ficar perto de casa?"
},

horaires: {
fr: "Êtes-vous flexible sur les horaires de travail ?",
ar: "هل أنت مرن بالنسبة لساعات العمل؟",
en: "Are you flexible with working hours?",
es: "¿Tienes flexibilidad con los horarios de trabajo?",
it: "Sei flessibile per quanto riguarda gli orari di lavoro?",
de: "Sind Sie bei den Arbeitszeiten flexibel?",
pt: "Você tem flexibilidade quanto aos horários de trabalho?"
},

presence_france: {
fr: "Êtes-vous actuellement en France ?",
ar: "هل أنت حالياً في فرنسا؟",
en: "Are you currently in France?",
es: "¿Se encuentra actualmente en Francia?",
it: "Ti trovi attualmente in Francia?",
de: "Befinden Sie sich derzeit in Frankreich?",
pt: "Você está atualmente na França?"
},

titre_sejour: {
fr: "Quel document ou titre de séjour avez-vous actuellement ?",
ar: "ما هي وثيقة أو بطاقة الإقامة التي تملكها حالياً؟",
en: "What residence document or permit do you currently have?",
es: "¿Qué documento o permiso de residencia tiene actualmente?",
it: "Quale documento o permesso di soggiorno possiedi attualmente?",
de: "Welches Aufenthaltsdokument oder welchen Aufenthaltstitel haben Sie derzeit?",
pt: "Qual documento ou autorização de residência você possui atualmente?"
},

statut_sejour: {
fr: "Quel est votre statut de séjour ou votre catégorie de titre de séjour ?",
ar: "ما هو وضع إقامتك أو فئة بطاقة إقامتك؟",
en: "What is your residence status or residence permit category?",
es: "¿Cuál es su situación de residencia o categoría de permiso?",
it: "Qual è il tuo status di soggiorno o la categoria del tuo permesso?",
de: "Welchen Aufenthaltsstatus bzw. welche Kategorie Ihres Aufenthaltstitels haben Sie?",
pt: "Qual é o seu status de residência ou categoria da autorização?"
},

entreprise: {
fr: "Quelle activité souhaitez-vous créer ou développer ?",
ar: "ما النشاط الذي تريد إنشاءه أو تطويره؟",
en: "What activity would you like to create or develop?",
es: "¿Qué actividad desea crear o desarrollar?",
it: "Quale attività vuoi creare o sviluppare?",
de: "Welche Tätigkeit möchten Sie gründen oder weiterentwickeln?",
pt: "Que atividade você deseja criar ou desenvolver?"
}
};

function questionText(key, lang) {
const language = normalizeLang(lang);

return (
QUESTION_CATALOG[key]?.[language] ||
QUESTION_CATALOG[key]?.fr ||
""
);
}

// ============================================================
// DECISION ENGINE
// ============================================================

function hasInfo(etat, type) {
return (etat?.informations || []).some(
item => item?.type === type
);
}

function getInfo(etat, type) {
return (etat?.informations || []).find(
item => item?.type === type
) || null;
}

function buildQuestionCandidates(etat) {
const domaine = etat?.domaine || "orientation_generale";

if (domaine === "emploi") {
return [
{
key: "zone_recherche",
required: true,
when: state =>
!hasInfo(state, "zone_recherche")
},

{
key: "type_emploi",
required: true,
when: state =>
!hasInfo(state, "type_emploi")
},

{
key: "mobilite",
required: false,
when: state =>
!hasInfo(state, "mobilite")
},

{
key: "horaires",
required: false,
when: state =>
!hasInfo(state, "horaires")
}
];
}

if (domaine === "immigration") {
return [
{
key: "presence_france",
required: true,
when: state =>
!hasInfo(state, "presence_france")
},

{
key: "titre_sejour",
required: true,
when: state =>
!hasInfo(state, "titre_sejour")
},

{
key: "statut_sejour",
required: true,
when: state =>
!hasInfo(state, "statut_sejour") &&
!hasInfo(state, "titre_sejour")
}
];
}

if (domaine === "entreprise") {
return [
{
key: "entreprise",
required: true,
when: state =>
!hasInfo(state, "entreprise")
}
];
}

return [];
}

// ============================================================
// DÉCISION PRINCIPALE
// ============================================================

function construireDecision(
etat,
questionsPosees = [],
lang = "fr"
) {
const asked = new Set(
(questionsPosees || [])
.map(x => texte(x))
.filter(Boolean)
);

const candidates =
buildQuestionCandidates(etat);

// ----------------------------------------------------------
// IMPORTANT :
// On ne considère une question comme "déjà posée"
// que si son KEY est présent.
// ----------------------------------------------------------

for (const candidate of candidates) {

if (asked.has(candidate.key)) {
continue;
}

if (!candidate.when(etat)) {
continue;
}

return {
etape: "question",
questionKey: candidate.key,
question: questionText(
candidate.key,
lang
),
champsManquants: [
candidate.key
]
};
}

return {
etape: "orientation",
questionKey: null,
question: null,
champsManquants: []
};
}

// ============================================================
// SYSTEM PROMPT
// ============================================================

function systemPrompt(lang) {
const language = languageName(lang);

return `
Tu es GouRare AI, un moteur d'intelligence d'orientation.

Version système : ${VERSION}
Version Decision Engine : ${DECISION_VERSION}

LANGUE DE RÉPONSE :
${language}

RÈGLES FONDAMENTALES :

1. Ne jamais inventer un fait concernant l'utilisateur.
2. Ne jamais transformer une hypothèse en fait confirmé.
3. Ne jamais répéter une information déjà fournie.
4. Ne jamais demander un diplôme si l'utilisateur a déjà indiqué ne pas en avoir.
5. Ne jamais demander une expérience professionnelle si l'utilisateur a déjà indiqué ne pas avoir d'expérience.
6. Les informations provenant des messages de l'utilisateur sont prioritaires pour établir les faits du dossier.
7. Les informations provenant d'un document doivent être présentées comme provenant du document.
8. Les réponses précédentes de l'IA ne constituent PAS des faits utilisateur.
9. Si des informations importantes sont manquantes, le moteur de décision les identifie.
10. Lorsque le moteur fournit une question précise, elle doit être respectée.
11. Si le moteur indique "orientation", fournir une orientation concrète et utile.
12. Ne pas faire de promesses juridiques.
13. Pour les démarches administratives, distinguer ce qui est certain de ce qui doit être vérifié.
14. Privilégier les sources officielles lorsque des sources sont disponibles.
15. Répondre de manière claire, humaine et pratique.

Tu dois raisonner sur le dossier global et non seulement sur la dernière phrase.
`;
}

// ============================================================
// AI
// ============================================================

async function askAI(env, messages, maxTokens = 900) {
if (!env?.IA || typeof env.IA.run !== "function") {
throw new Error("La liaison Cloudflare AI n'est pas disponible.");
}

const safeMessages = (messages || []).map(message => ({
role: message.role,
content: truncateText(
typeof message.content === "string"
? message.content
: JSON.stringify(message.content),
30000
)
}));

return env.IA.run(
MODEL,
{
messages: safeMessages,
max_tokens: maxTokens
}
);
}

// ============================================================
// SOURCES
// ============================================================

function selectSources(etat) {
const selected = [];

const domaine = etat?.domaine || "";

if (domaine === "immigration") {
selected.push(SOURCES.anef);
selected.push(SOURCES.travailEtranger);
}

if (domaine === "emploi") {
selected.push(SOURCES.franceTravail);
}

if (domaine === "entreprise") {
selected.push(SOURCES.statut);
selected.push(SOURCES.guichet);
}

return selected;
}

function sourceHTML(sources) {
if (!sources?.length) return "";

return `
<div class="sources">
<div class="sources-title">Sources officielles</div>
${sources.map(source => `
<a
href="${escapeHTML(source.url)}"
target="_blank"
rel="noopener noreferrer"
>
${escapeHTML(source.titre)}
— ${escapeHTML(source.organisme)}
</a>
`).join("")}
</div>
`;
}

// ============================================================
// ANALYSE PRINCIPALE
// ============================================================

async function analyserQuestion(env, payload) {
const question = texte(payload.question);

if (!question) {
throw new Error("Veuillez saisir une question.");
}

if (question.length > LIMITS.question) {
throw new Error("Question trop longue.");
}

const historique = Array.isArray(payload.historique)
? payload.historique.slice(-30)
: [];

const informations = Array.isArray(payload.informations)
? payload.informations.slice(0, 200)
: [];

const documentInfos = Array.isArray(payload.documentInfos)
? payload.documentInfos.slice(0, 200)
: [];

const questionsPosees = Array.isArray(
payload.questionsPosees
)
? payload.questionsPosees.slice(0, 100)
: [];

const lang = normalizeLang(
payload.langue ||
detectLanguage(question)
);

const pays = texte(payload.pays);

const etat = construireEtatConversation({
historique,
informations,
documentInfos,
question
});

const decision = construireDecision(
etat,
questionsPosees,
lang
);

const sources = selectSources(etat);

// ==========================================================
// QUESTION DÉTERMINISTE
// ==========================================================

if (decision.etape === "question") {

const updatedQuestions = uniqueStrings([
...questionsPosees,
decision.questionKey
]);

return {
version: VERSION,
decisionVersion: DECISION_VERSION,

reponse: decision.question,

etat: {
...etat,
questionsPosees: updatedQuestions
},

decision: {
...decision
},

prochaineQuestion: {
key: decision.questionKey,
text: decision.question
},

questionsPosees: updatedQuestions,

sources
};
}

// ==========================================================
// ORIENTATION
// ==========================================================

const context = {
pays,
langue: languageName(lang),
domaine: etat.domaine,
informations: etat.informations,
documentInfos,
historique: historique
.filter(item => item?.role === "user")
.slice(-20)
};

const prompt = `
DOSSIER GOuRARE AI

LANGUE :
${languageName(lang)}

PAYS :
${pays || "Non précisé"}

DOMAINE :
${etat.domaine}

INFORMATIONS CONFIRMÉES / EXTRAITES :
${truncateJSON(etat.informations, LIMITS.extractedInfo)}

INFORMATIONS DOCUMENTAIRES :
${truncateJSON(documentInfos, LIMITS.documentText)}

HISTORIQUE UTILISATEUR :
${truncateJSON(
historique.filter(item => item?.role === "user"),
LIMITS.historique
)}

DÉCISION DU MOTEUR :
ORIENTATION

MISSION :

Fournis maintenant une orientation concrète.

Structure recommandée :

1. Compréhension de la situation
2. Ce qui est déjà clair
3. Les options réalistes
4. Les prochaines actions concrètes
5. Les éléments qui doivent encore être vérifiés
6. Sources officielles pertinentes lorsqu'elles existent

IMPORTANT :

- Ne demande pas une nouvelle question si le moteur a décidé ORIENTATION.
- Ne réintroduis pas une information qui n'est pas confirmée.
- Ne prétends pas avoir vérifié une source en temps réel si ce n'est pas le cas.
- Ne donne pas de conseil juridique définitif.
- Si une information est incertaine, dis clairement qu'elle doit être vérifiée.
`;

const result = await askAI(
env,
[
{
role: "system",
content: systemPrompt(lang)
},
{
role: "user",
content: prompt
}
],
900
);

const responseText =
result?.response ||
result?.text ||
result?.result ||
"Je n'ai pas pu générer une orientation.";

return {
version: VERSION,
decisionVersion: DECISION_VERSION,

reponse: texte(responseText),

etat: {
...etat,
questionsPosees
},

decision,

prochaineQuestion: null,

questionsPosees,

sources
};
}

// ============================================================
// ANALYSE IMAGE / DOCUMENT
// ============================================================

async function analyserImage(env, payload) {
const dataURL = normalizeDataURL(
payload.image
);

const base64 = base64Payload(dataURL);

const prompt = `
Tu analyses un document ou une image pour GouRare AI.

Objectif :

1. Identifier le type de document si possible.
2. Extraire uniquement les informations visibles.
3. Ne pas inventer les informations absentes.
4. Identifier les dates.
5. Identifier les références.
6. Identifier les décisions administratives.
7. Identifier les documents manquants.
8. Identifier les délais.
9. Identifier les éléments liés au travail, séjour, entreprise ou formation.

Réponds sous forme structurée en français.

Format :

TYPE_DOCUMENT:
...

TEXTE_VISIBLE:
...

INFORMATIONS:
- ...

POINTS_IMPORTANTS:
- ...

ATTENTION:
- ...

Ne fais aucune supposition non visible.
`;

const messages = [
{
role: "system",
content:
"Tu es un extracteur documentaire précis. Ne jamais inventer."
},
{
role: "user",
content: prompt
}
];

const result = await env.IA.run(
MODEL_VISION,
{
messages,
image: base64
}
);

const responseText =
result?.response ||
result?.text ||
result?.result ||
"";

const infos =
extraireInformationsDocument(
responseText
);

return {
version: VERSION,
document: {
texte: truncateText(
responseText,
LIMITS.documentText
),
confirmees: infos,
analyse: responseText
}
};
}

// ============================================================
// TRANSCRIPTION AUDIO
// ============================================================

async function transcrireAudio(env, payload) {
const dataURL = normalizeDataURL(
payload.audio
);

const audio = base64Payload(dataURL);

const result = await env.IA.run(
MODEL_AUDIO,
{
audio,
task: "transcribe",
condition_on_previous_text: false
}
);

const text =
result?.transcription_info?.text ||
result?.text ||
result?.response ||
result?.result?.text ||
"";

return {
version: VERSION,
texte: texte(text)
};
}

// ============================================================
// INTERFACE HTML
// ============================================================

function pageHTML() {
return `<!DOCTYPE html>
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
sans-serif;

background:
linear-gradient(
135deg,
#f5f7fa,
#eef1f5
);

color: #17202a;
}

.app {
width: min(1100px, 94%);
margin: 30px auto;
}

.header {
background: white;
border-radius: 24px;
padding: 28px;
box-shadow:
0 15px 45px rgba(0,0,0,.08);
}

.brand {
display: flex;
justify-content: space-between;
align-items: center;
gap: 20px;
}

.logo {
font-size: 30px;
font-weight: 800;
letter-spacing: -.8px;
}

.subtitle {
margin-top: 8px;
color: #68707a;
}

.version {
font-size: 12px;
padding: 7px 10px;
border-radius: 20px;
background: #f0f2f5;
}

.cancer {
margin-top: 18px;
padding: 14px 16px;
border-radius: 14px;
background: #fff5f8;
color: #8b3150;
}

.roles {
display: grid;
grid-template-columns:
repeat(4, 1fr);

gap: 12px;
margin-top: 20px;
}

.role {
border: 1px solid #e3e7eb;
background: white;
border-radius: 16px;
padding: 15px;
cursor: pointer;
transition: .2s;
}

.role:hover,
.role.active {
transform: translateY(-2px);
box-shadow:
0 8px 25px rgba(0,0,0,.08);
border-color: #aab3bd;
}

.settings {
display: grid;
grid-template-columns:
repeat(2, 1fr);

gap: 12px;
margin-top: 20px;
}

select {
width: 100%;
padding: 13px;
border-radius: 12px;
border: 1px solid #d9dee4;
background: white;
}

.main {
display: grid;
grid-template-columns:
minmax(0, 1fr)
300px;

gap: 18px;
margin-top: 18px;
}

.chat {
background: white;
border-radius: 24px;
padding: 18px;
min-height: 500px;
box-shadow:
0 15px 45px rgba(0,0,0,.06);
}

.messages {
min-height: 360px;
max-height: 650px;
overflow-y: auto;
padding: 8px;
}

.message {
max-width: 88%;
padding: 13px 15px;
border-radius: 17px;
margin: 10px 0;
white-space: pre-wrap;
line-height: 1.5;
}

.user {
margin-left: auto;
background: #17202a;
color: white;
}

.assistant {
background: #f1f3f5;
color: #20262d;
}

.composer {
display: flex;
gap: 8px;
margin-top: 12px;
}

textarea {
flex: 1;
resize: vertical;
min-height: 52px;
max-height: 180px;
padding: 14px;
border-radius: 14px;
border: 1px solid #d9dee4;
font: inherit;
}

button {
border: 0;
border-radius: 13px;
padding: 12px 15px;
cursor: pointer;
font: inherit;
background: #17202a;
color: white;
}

button.secondary {
background: #eef0f2;
color: #17202a;
}

button.recording {
background: #9b2c2c;
}

.actions {
display: flex;
gap: 8px;
margin-top: 9px;
flex-wrap: wrap;
}

.side {
background: white;
border-radius: 24px;
padding: 18px;
height: fit-content;
box-shadow:
0 15px 45px rgba(0,0,0,.06);
}

.side h3 {
margin-top: 0;
}

.dossier-item {
padding: 10px 0;
border-bottom:
1px solid #edf0f2;
}

.dossier-type {
font-size: 11px;
color: #7c858e;
text-transform: uppercase;
}

.dossier-value {
margin-top: 3px;
font-weight: 600;
}

.sources {
margin-top: 15px;
padding: 13px;
border-radius: 14px;
background: white;
border: 1px solid #e1e5e9;
}

.sources-title {
font-weight: 700;
margin-bottom: 8px;
}

.sources a {
display: block;
color: #2457a6;
text-decoration: none;
margin: 6px 0;
font-size: 14px;
}

.document {
margin-top: 12px;
padding: 14px;
border-radius: 14px;
background: #f7f8fa;
white-space: pre-wrap;
}

.hidden {
display: none !important;
}

.loading {
opacity: .6;
}

@media (max-width: 850px) {

.roles {
grid-template-columns:
repeat(2, 1fr);
}

.main {
grid-template-columns: 1fr;
}
}

@media (max-width: 520px) {

.app {
width: 96%;
margin: 12px auto;
}

.header,
.chat,
.side {
border-radius: 18px;
}

.roles {
grid-template-columns: 1fr;
}

.settings {
grid-template-columns: 1fr;
}

.brand {
align-items: flex-start;
}

.composer {
flex-direction: column;
}
}

</style>
</head>

<body>

<div class="app">

<header class="header">

<div class="brand">

<div>
<div class="logo">
GouRare AI
</div>

<div class="subtitle">
Votre intelligence d'orientation
</div>
</div>

<div class="version">
V10.1
</div>

</div>

<div class="cancer">
🎗️ Avec vous contre le cancer<br>
🎗️ Notre soutien aux personnes touchées par le cancer.
</div>

<div class="roles">

<button
class="role"
data-role="personne"
>
👤<br>
Personne
</button>

<button
class="role"
data-role="emploi"
>
💼<br>
Emploi
</button>

<button
class="role"
data-role="entreprise"
>
🏢<br>
Entreprise
</button>

<button
class="role"
data-role="formation"
>
🎓<br>
Formation
</button>

</div>

<div class="settings">

<select id="language">

<option value="fr">
Français
</option>

<option value="ar">
العربية
</option>

<option value="en">
English
</option>

<option value="es">
Español
</option>

<option value="it">
Italiano
</option>

<option value="de">
Deutsch
</option>

<option value="pt">
Português
</option>

</select>

<select id="country">

<option value="FR">
France
</option>

<option value="ES">
Espagne
</option>

<option value="DE">
Allemagne
</option>

<option value="IT">
Italie
</option>

<option value="PT">
Portugal
</option>

<option value="GB">
Royaume-Uni
</option>

<option value="BE">
Belgique
</option>

<option value="LU">
Luxembourg
</option>

</select>

</div>

</header>

<div class="main">

<section class="chat">

<div
id="messages"
class="messages"
></div>

<div class="composer">

<textarea
id="question"
placeholder="Expliquez-moi votre situation..."
></textarea>

<button id="send">
Envoyer
</button>

</div>

<div class="actions">

<button
id="imageBtn"
class="secondary"
>
🖼️ Document / Image
</button>

<button
id="voiceBtn"
class="secondary"
>
🎙️ Parler
</button>

<button
id="clearBtn"
class="secondary"
>
Effacer
</button>

<input
id="imageInput"
type="file"
accept="image/*"
class="hidden"
>

</div>

</section>

<aside class="side">

<h3>
📁 Votre dossier
</h3>

<div id="dossier">
Aucune information confirmée pour le moment.
</div>

<div id="document"></div>

</aside>

</div>

</div>

<script>

let historique = [];
let informations = [];
let documentInfos = [];
let questionsPosees = [];

let selectedRole = "";

let mediaRecorder = null;
let audioChunks = [];
let recording = false;

const messagesEl =
document.getElementById("messages");

const questionEl =
document.getElementById("question");

const languageEl =
document.getElementById("language");

const countryEl =
document.getElementById("country");

const dossierEl =
document.getElementById("dossier");

const documentEl =
document.getElementById("document");

const sendBtn =
document.getElementById("send");

const voiceBtn =
document.getElementById("voiceBtn");

function escapeHTML(value) {

return String(value || "")
.replaceAll("&", "&amp;")
.replaceAll("<", "&lt;")
.replaceAll(">", "&gt;")
.replaceAll('"', "&quot;")
.replaceAll("'", "&#039;");
}

function addMessage(role, content) {

const div =
document.createElement("div");

div.className =
"message " +
(role === "user"
? "user"
: "assistant");

div.textContent =
content || "";

messagesEl.appendChild(div);

messagesEl.scrollTop =
messagesEl.scrollHeight;
}

function renderDossier(etat) {

const infos =
etat?.informations || [];

if (!infos.length) {

dossierEl.innerHTML =
"Aucune information confirmée pour le moment.";

return;
}

dossierEl.innerHTML =
infos
.slice(0, 30)
.map(info => {

return \`
<div class="dossier-item">

<div class="dossier-type">
\${escapeHTML(info.type)}
</div>

<div class="dossier-value">
\${escapeHTML(info.value)}
</div>

</div>
\`;

})
.join("");
}

function renderDocument(data) {

if (!data?.document) {

documentEl.innerHTML = "";

return;
}

const document =
data.document;

documentEl.innerHTML = \`
<div class="document">

<strong>
📄 Analyse du document
</strong>

<br><br>

\${escapeHTML(
document.analyse ||
document.texte ||
""
)}

</div>
\`;
}

async function sendMessage() {

const question =
questionEl.value.trim();

if (!question) return;

addMessage(
"user",
question
);

historique.push({
role: "user",
content: question
});

questionEl.value = "";

sendBtn.disabled = true;
sendBtn.classList.add("loading");

try {

const body = {

question,

langue:
languageEl.value,

pays:
countryEl.value,

role:
selectedRole,

historique:
historique
.slice(-20)
.map(item => ({
role: item.role,
content:
String(item.content || "")
.slice(0, 4000)
})),

informations:
informations.slice(0, 200),

documentInfos:
documentInfos.slice(0, 200),

questionsPosees:
questionsPosees.slice(0, 100)

};

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
JSON.stringify(body)
}
);

const data =
await response.json();

if (!response.ok) {
throw new Error(
data?.error ||
"Erreur serveur."
);
}

addMessage(
"assistant",
data.reponse || ""
);

historique.push({
role: "assistant",
content:
data.reponse || ""
});

// IMPORTANT :
// Les clés de questions sont conservées,
// pas les formulations exactes.
questionsPosees =
data.questionsPosees ||
data.etat?.questionsPosees ||
questionsPosees;

informations =
data.etat?.informations ||
informations;

renderDossier(
data.etat
);

} catch (error) {

addMessage(
"assistant",
"Une erreur est survenue : " +
error.message
);

} finally {

sendBtn.disabled = false;
sendBtn.classList.remove("loading");

}
}

sendBtn.addEventListener(
"click",
sendMessage
);

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

// ============================================================
// RÔLES
// ============================================================

document
.querySelectorAll(".role")
.forEach(button => {

button.addEventListener(
"click",
() => {

document
.querySelectorAll(".role")
.forEach(item =>
item.classList.remove("active")
);

button.classList.add("active");

selectedRole =
button.dataset.role || "";

}
);

});

// ============================================================
// IMAGE
// ============================================================

const imageBtn =
document.getElementById("imageBtn");

const imageInput =
document.getElementById("imageInput");

imageBtn.addEventListener(
"click",
() => imageInput.click()
);

imageInput.addEventListener(
"change",
async () => {

const file =
imageInput.files?.[0];

if (!file) return;

if (
file.size >
5500000
) {

addMessage(
"assistant",
"L'image est trop volumineuse."
);

return;
}

const reader =
new FileReader();

reader.onload =
async () => {

try {

addMessage(
"assistant",
"Analyse du document en cours..."
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
reader.result,
langue:
languageEl.value
})
}
);

const data =
await response.json();

if (!response.ok) {

throw new Error(
data?.error ||
"Erreur lors de l'analyse."
);
}

documentInfos =
data.document?.confirmees ||
[];

renderDocument({
document:
data.document
});

informations =
[
...informations,
...documentInfos
];

addMessage(
"assistant",
data.document?.analyse ||
data.document?.texte ||
"Document analysé."
);

} catch (error) {

addMessage(
"assistant",
"Impossible d'analyser le document : " +
error.message
);

}

};

reader.readAsDataURL(file);

}
);

// ============================================================
// AUDIO
// ============================================================

voiceBtn.addEventListener(
"click",
async () => {

if (recording) {

if (mediaRecorder) {
mediaRecorder.stop();
}

return;
}

if (
!navigator.mediaDevices ||
!navigator.mediaDevices.getUserMedia
) {

addMessage(
"assistant",
"La fonction microphone n'est pas disponible sur cet appareil."
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

recording = true;

voiceBtn.classList.add(
"recording"
);

voiceBtn.textContent =
"⏹️ Arrêter";

mediaRecorder.ondataavailable =
event => {

if (event.data.size > 0) {
audioChunks.push(
event.data
);
}

};

mediaRecorder.onstop =
async () => {

recording = false;

voiceBtn.classList.remove(
"recording"
);

voiceBtn.textContent =
"🎙️ Parler";

stream
.getTracks()
.forEach(track =>
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
9000000
) {

addMessage(
"assistant",
"L'enregistrement est trop volumineux."
);

return;
}

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
"Erreur de transcription."
);
}

const text =
data.texte || "";

if (text) {

questionEl.value =
text;

await sendMessage();

}

} catch (error) {

addMessage(
"assistant",
"Impossible de transcrire l'audio : " +
error.message
);

}

};

reader.readAsDataURL(blob);

};

mediaRecorder.start();

} catch (error) {

recording = false;

voiceBtn.classList.remove(
"recording"
);

voiceBtn.textContent =
"🎙️ Parler";

addMessage(
"assistant",
"Accès au microphone refusé ou indisponible."
);

}

}
);

// ============================================================
// CLEAR
// ============================================================

document
.getElementById("clearBtn")
.addEventListener(
"click",
() => {

historique = [];
informations = [];
documentInfos = [];
questionsPosees = [];

messagesEl.innerHTML = "";

dossierEl.innerHTML =
"Aucune information confirmée pour le moment.";

documentEl.innerHTML = "";

questionEl.value = "";

}
);

// ============================================================
// MESSAGE INITIAL
// ============================================================

addMessage(
"assistant",
"Bonjour. Je suis GouRare AI. Expliquez-moi votre situation et je vais d'abord la comprendre avant de vous orienter."
);

</script>

</body>
</html>`;
}

// ============================================================
// ROUTER
// ============================================================

export default {
async fetch(request, env) {

try {

const url =
new URL(request.url);

// ------------------------------------------------------
// PAGE PRINCIPALE
// ------------------------------------------------------

if (
request.method === "GET" &&
url.pathname === "/"
) {
return htmlResponse(
pageHTML()
);
}

// ------------------------------------------------------
// HEALTH
// ------------------------------------------------------

if (
request.method === "GET" &&
url.pathname === "/health"
) {

return jsonResponse({
ok: true,
service: "GouRare AI",
version: VERSION,
decisionVersion:
DECISION_VERSION
});

}

// ------------------------------------------------------
// ANALYZE
// ------------------------------------------------------

if (
request.method === "POST" &&
url.pathname === "/api/analyze"
) {

const rate =
checkRateLimit(
request,
"analyze"
);

if (!rate.allowed) {

return jsonResponse(
{
error:
"Trop de requêtes. Veuillez patienter.",
retryAfter:
rate.retryAfter
},
429,
{
"Retry-After":
String(rate.retryAfter)
}
);

}

const payload =
await readJSON(
request,
LIMITS.analyzeBody
);

const result =
await analyserQuestion(
env,
payload
);

return jsonResponse(
result
);
}

// ------------------------------------------------------
// IMAGE
// ------------------------------------------------------

if (
request.method === "POST" &&
url.pathname === "/api/image"
) {

const rate =
checkRateLimit(
request,
"image"
);

if (!rate.allowed) {

return jsonResponse(
{
error:
"Trop de demandes d'analyse d'image. Veuillez patienter.",
retryAfter:
rate.retryAfter
},
429,
{
"Retry-After":
String(rate.retryAfter)
}
);

}

const payload =
await readJSON(
request,
LIMITS.imageBody
);

const result =
await analyserImage(
env,
payload
);

return jsonResponse(
result
);
}

// ------------------------------------------------------
// AUDIO
// ------------------------------------------------------

if (
request.method === "POST" &&
url.pathname === "/api/transcribe"
) {

const rate =
checkRateLimit(
request,
"transcribe"
);

if (!rate.allowed) {

return jsonResponse(
{
error:
"Trop de demandes audio. Veuillez patienter.",
retryAfter:
rate.retryAfter
},
429,
{
"Retry-After":
String(rate.retryAfter)
}
);

}

const payload =
await readJSON(
request,
LIMITS.audioBody
);

const result =
await transcrireAudio(
env,
payload
);

return jsonResponse(
result
);
}

return jsonResponse(
{
error: "Route introuvable."
},
404
);

} catch (error) {

console.error(
"GouRare AI error:",
error
);

const message =
error?.message ||
"Erreur interne.";

const status =
/volumineuse|invalide|Veuillez/i.test(
message
)
? 400
: 500;

return jsonResponse(
{
error: message,
version: VERSION
},
status
);
}
}
};
