/* =========================================================
   GouRare AI — Version 9.4
   France-first intelligent orientation assistant
   Cloudflare Workers + Workers AI
   ========================================================= */

const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const MODEL_VISION = "@cf/meta/llama-3.2-11b-vision-instruct";
const MODEL_AUDIO = "@cf/openai/whisper-large-v3-turbo";

const VERSION = "9.4";

/* =========================================================
   LIMITES
   ========================================================= */

const LIMITS = {
  question: 12000,

  imageFile: 5500000,
  imageData: 8000000,

  audioFile: 9000000,
  audioData: 16000000,

  historique: 24000,

  analyzeBody: 400000,
  imageBody: 8500000,
  audioBody: 17000000
};

/* =========================================================
   RATE LIMIT
   ========================================================= */

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

const rateStore = new Map();

function cleanupRateStore(now) {
  const stale = now - 300000;

  for (const [key, arr] of rateStore) {
    if (!arr.length || arr[arr.length - 1] < stale) {
      rateStore.delete(key);
    }
  }

  if (rateStore.size > 10000) {
    const entries = [...rateStore.entries()]
      .sort((a, b) => {
        const aa = a[1];
        const bb = b[1];

        const ta = aa.length ? aa[aa.length - 1] : 0;
        const tb = bb.length ? bb[bb.length - 1] : 0;

        return ta - tb;
      });

    const removeCount = rateStore.size - 10000;

    for (let i = 0; i < removeCount; i++) {
      rateStore.delete(entries[i][0]);
    }
  }
}

function clientKey(request) {
  return request.headers.get("CF-Connecting-IP") || "anonymous";
}

function rateLimit(request, type) {
  const cfg = RATE_LIMITS[type];

  if (!cfg) {
    return {
      allowed: true,
      retryAfter: 0
    };
  }

  const now = Date.now();

  cleanupRateStore(now);

  const key = `${type}:${clientKey(request)}`;

  let arr = rateStore.get(key);

  if (!arr) {
    arr = [];
    rateStore.set(key, arr);
  }

  const minTime = now - cfg.windowMs;

  while (arr.length && arr[0] <= minTime) {
    arr.shift();
  }

  if (arr.length >= cfg.maxRequests) {
    const retryAfter = Math.max(
      1,
      Math.ceil((arr[0] + cfg.windowMs - now) / 1000)
    );

    return {
      allowed: false,
      retryAfter
    };
  }

  arr.push(now);

  return {
    allowed: true,
    retryAfter: 0
  };
}

/* =========================================================
   OUTILS
   ========================================================= */

function texte(value, max = 12000) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, max);
}

function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function securityHeaders(extra = {}) {
  return {
    "Content-Security-Policy":
      "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",

    "X-Content-Type-Options": "nosniff",

    "X-Frame-Options": "DENY",

    "Referrer-Policy": "strict-origin-when-cross-origin",

    "Permissions-Policy":
      "camera=(), geolocation=(), microphone=(self)",

    "Cross-Origin-Opener-Policy": "same-origin",

    ...extra
  };
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: securityHeaders({
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...extraHeaders
      })
    }
  );
}

function contentLengthTooLarge(request, limit) {
  const value = Number(
    request.headers.get("Content-Length") || 0
  );

  return Number.isFinite(value) && value > limit;
}

/* =========================================================
   DATA URL VALIDATION
   ========================================================= */

function isValidImageDataURL(value) {
  return /^data:image\/(?:jpeg|jpg|png|webp);base64,/i
    .test(String(value || ""));
}

function isValidAudioDataURL(value) {
  return /^data:audio\/[^,]+;base64,/i
    .test(String(value || ""));
}

function base64FromDataURL(value) {
  const s = String(value || "");

  const i = s.indexOf(",");

  return s.startsWith("data:") && i >= 0
    ? s.slice(i + 1)
    : s;
}

/* =========================================================
   SOURCES OFFICIELLES
   ========================================================= */

const SOURCES = {
  anef: {
    title: "ANEF — démarches des étrangers",
    url:
      "https://www.service-public.fr/particuliers/vosdroits/R59398"
  },

  travailEtranger: {
    title: "Travail d'un étranger en France",
    url:
      "https://www.service-public.fr/particuliers/vosdroits/F2728"
  },

  statut: {
    title: "Statut juridique d'une entreprise",
    url:
      "https://entreprendre.service-public.fr/vosdroits/R18323"
  },

  guichet: {
    title: "Guichet unique des formalités",
    url:
      "https://entreprendre.service-public.fr/vosdroits/F23571"
  }
};

/* =========================================================
   PARCOURS
   ========================================================= */

const PARCOURS = {
  migrant: [
    ["arrive", "Je viens d'arriver en France"],
    ["administratif", "Démarches administratives"],
    ["emploi", "Je cherche un emploi"],
    ["logement", "Logement"],
    ["document", "Document / titre de séjour"],
    ["droits", "Droits sociaux"],
    ["social", "Aide sociale"],
    ["etudes", "Études / formation"],
    ["famille", "Famille"],
    ["asile", "Asile"],
    ["irreguliere", "Situation administrative difficile"],
    ["autre", "Autre"]
  ],

  particulier: [
    ["administratif", "Démarche administrative"],
    ["emploi", "Emploi"],
    ["logement", "Logement"],
    ["finance", "Finance"],
    ["social", "Social"],
    ["juridique", "Juridique"],
    ["message", "Message / courrier"],
    ["document", "Document"],
    ["opportunite", "Opportunité"],
    ["autre", "Autre"]
  ],

  emploi: [
    ["offres", "Trouver des offres"],
    ["cv", "CV"],
    ["candidature", "Candidature"],
    ["annonce", "Comprendre une annonce"],
    ["entretien", "Entretien"],
    ["entreprise", "Comprendre une entreprise"],
    ["adapte", "Emploi adapté"],
    ["comparaison", "Comparer des emplois"],
    ["autre", "Autre"]
  ],

  entreprise: [
    ["creation", "Créer une entreprise"],
    ["developpement", "Développer mon activité"],
    ["fiscalite", "Fiscalité"],
    ["comptabilite", "Comptabilité"],
    ["salaries", "Salariés"],
    ["juridique", "Juridique"],
    ["fournisseurs", "Fournisseurs"],
    ["offres", "Offres / clients"],
    ["opportunite", "Opportunité"],
    ["ia", "IA / automatisation"],
    ["autre", "Autre"]
  ]
};

/* =========================================================
   CONTEXTE
   ========================================================= */

function detectContext(question) {
  const s = texte(question, LIMITS.question).toLowerCase();

  const immigration =
    /\b(
      titre de séjour|
      titre\s+de\s+sejour|
      carte de séjour|
      carte\s+de\s+sejour|
      visa|
      récépissé|
      recepisse|
      préfecture|
      prefecture|
      anef|
      étranger|
      etranger|
      immigration|
      asile|
      demande de séjour|
      demande\s+de\s+sejour
    )\b/ix.test(s);

  const workProblem =
    /\b(
      employeur|
      salarié|
      salarie|
      salariée|
      salariee|
      contrat de travail|
      salaire|
      bulletin de paie|
      licenciement|
      licencié|
      licencie|
      conditions de travail|
      heures de travail|
      patron|
      collègue|
      collegue|
      travailleur
    )\b/ix.test(s);

  const jobSearch =
    /\b(
      cherche un emploi|
      cherche du travail|
      recherche d'emploi|
      recherche d emploi|
      trouver un emploi|
      trouver du travail|
      candidature|
      candidat|
      cv|
      poste|
      recrutement|
      embauche|
      offre d'emploi|
      offre d emploi|
      intérim|
      interim
    )\b/ix.test(s);

  const businessAction =
    /\b(
      créer une entreprise|
      creer une entreprise|
      création d'entreprise|
      creation d entreprise|
      micro-entreprise|
      micro entreprise|
      auto-entrepreneur|
      auto entrepreneur|
      entrepreneur|
      lancer mon activité|
      lancer mon activite|
      développer mon activité|
      developper mon activite|
      mon activité|
      mon activite|
      mon entreprise|
      statut juridique|
      société|
      societe
    )\b/ix.test(s);

  const businessMention =
    /\b(
      entreprise|
      activité professionnelle|
      activite professionnelle|
      business
    )\b/ix.test(s);

  const entreprise =
    businessAction ||
    (
      businessMention &&
      !workProblem &&
      !jobSearch
    );

  const administratif =
    immigration ||
    /\b(
      démarche|
      demarche|
      administration|
      préfecture|
      prefecture|
      mairie|
      caf|
      cpam|
      dossier|
      formulaire
    )\b/ix.test(s);

  const logement =
    /\b(
      logement|
      appartement|
      maison|
      location|
      locataire|
      loyer|
      hébergement|
      hebergement
    )\b/ix.test(s);

  const finance =
    /\b(
      argent|
      banque|
      compte bancaire|
      crédit|
      credit|
      dette|
      paiement|
      facture|
      budget
    )\b/ix.test(s);

  const social =
    /\b(
      caf|
      rsa|
      prime|
      aide sociale|
      allocation|
      sécurité sociale|
      securite sociale|
      cpam
    )\b/ix.test(s);

  const juridique =
    /\b(
      avocat|
      tribunal|
      justice|
      juridique|
      litige|
      plainte|
      droit
    )\b/ix.test(s);

  const statut =
    /\b(
      statut juridique|
      micro-entreprise|
      micro entreprise|
      auto-entrepreneur|
      auto entrepreneur|
      sas|
      sasu|
      sarl|
      eurl|
      société|
      societe
    )\b/ix.test(s);

  return {
    immigration,
    administratif,
    logement,
    finance,
    social,
    juridique,
    travail:
      workProblem ||
      jobSearch ||
      (
        /\b(travail|emploi|poste)\b/i.test(s) &&
        !businessAction
      ),
    entreprise,
    statut,
    message:
      /\b(
        écris-moi|
        ecris-moi|
        rédige|
        redige|
        message|
        mail|
        email|
        courrier
      )\b/ix.test(s),

    image:
      /\b(
        photo|
        image|
        document|
        capture|
        screenshot
      )\b/ix.test(s),

    audio:
      false,

    recepisse:
      /\b(récépissé|recepisse|attestation)\b/i.test(s)
  };
}

/* =========================================================
   EXTRACTION D'INFORMATIONS
   ========================================================= */

function extraireInformations(question) {
  const s = texte(question, LIMITS.question);
  const l = s.toLowerCase();

  const result = [];

  if (
    /\b(
      je viens d'arriver|
      je viens d arriver|
      nouvel arrivant|
      nouvelle arrivée|
      nouvelle arrivee|
      arrivé récemment|
      arrive récemment
    )\b/ix.test(l)
  ) {
    result.push({
      type: "situation",
      valeur: "arrivée récente en France"
    });
  }

  /*
   * Important :
   * "je viens d'arriver" NE signifie PAS
   * automatiquement "première demande".
   */

  if (
    /\b(
      première demande|
      premiere demande|
      première fois|
      premiere fois|
      jamais demandé|
      jamais demande
    )\b/ix.test(l)
  ) {
    result.push({
      type: "premiere_demande",
      valeur: "oui"
    });
  }

  if (
    /\b(
      j'ai déposé|
      j ai depose|
      demande déposée|
      demande deposee|
      dossier déposé|
      dossier depose|
      j'ai fait la demande|
      j ai fait la demande
    )\b/ix.test(l)
  ) {
    result.push({
      type: "depot",
      valeur: "oui"
    });
  }

  if (
    /\b(
      je n'ai pas déposé|
      je n ai pas depose|
      aucune demande|
      pas encore déposé|
      pas encore depose
    )\b/ix.test(l)
  ) {
    result.push({
      type: "depot",
      valeur: "non"
    });
  }

  if (
    /\b(
      en ligne|
      internet|
      anef|
      en ligne sur anef
    )\b/ix.test(l)
  ) {
    result.push({
      type: "procedure",
      valeur: "en ligne / ANEF"
    });
  }

  if (
    /\b(
      préfecture|
      prefecture|
      au guichet|
      guichet
    )\b/ix.test(l)
  ) {
    result.push({
      type: "procedure",
      valeur: "préfecture / guichet"
    });
  }

  if (
    /\b(
      je n'ai rien reçu|
      je n ai rien recu|
      je n'ai pas reçu|
      je n ai pas recu|
      aucun récépissé|
      aucun recepisse|
      pas reçu de récépissé|
      pas recu de recepisse|
      pas d'attestation|
      pas d attestation
    )\b/ix.test(l)
  ) {
    result.push({
      type: "document_recu",
      valeur: "aucun document reçu"
    });
  }

  if (
    /\b(
      j'ai reçu|
      j ai recu|
      reçu un récépissé|
      recu un recepisse|
      j'ai une attestation|
      j ai une attestation|
      attestation reçue|
      attestation recue
    )\b/ix.test(l)
  ) {
    result.push({
      type: "document_recu",
      valeur: "un document a été reçu"
    });
  }

  if (
    /\b(
      cherche un emploi|
      recherche d'emploi|
      recherche d emploi|
      cherche du travail|
      trouver un emploi|
      trouver du travail|
      candidature|
      candidat|
      recrutement|
      poste
    )\b/ix.test(l)
  ) {
    result.push({
      type: "objectif_professionnel",
      valeur: "recherche d'emploi"
    });
  }

  if (
    /\b(
      employeur|
      contrat de travail|
      salaire|
      licenciement|
      bulletin de paie|
      conditions de travail
    )\b/ix.test(l)
  ) {
    result.push({
      type: "objectif_professionnel",
      valeur: "situation professionnelle"
    });
  }

  if (
    /\b(
      créer une entreprise|
      creer une entreprise|
      création d'entreprise|
      creation d entreprise|
      micro-entreprise|
      micro entreprise|
      auto-entrepreneur|
      auto entrepreneur|
      lancer mon activité|
      lancer mon activite|
      mon entreprise|
      mon activité|
      mon activite
    )\b/ix.test(l)
  ) {
    result.push({
      type: "activite",
      valeur: "projet entrepreneurial mentionné"
    });
  }

  if (
    /\b(
      cv|
      curriculum vitae
    )\b/i.test(l)
  ) {
    result.push({
      type: "document",
      valeur: "CV"
    });
  }

  return result;
}

/* =========================================================
   ÉTAT DU DOSSIER
   ========================================================= */

function etatDepot(infos) {
  const item = infos.find(x => x.type === "depot");

  if (!item) return "inconnu";

  return item.valeur === "oui"
    ? "oui"
    : item.valeur === "non"
      ? "non"
      : "inconnu";
}

/* =========================================================
   INFORMATIONS TEXTE
   ========================================================= */

function infosToText(infos) {
  if (!Array.isArray(infos) || !infos.length) {
    return "Aucune information structurée supplémentaire.";
  }

  return infos
    .map(x => `- ${x.type}: ${x.valeur}`)
    .join("\n");
}

function confirmed(infos, type) {
  return Array.isArray(infos) &&
    infos.some(x => x.type === type);
}

function documents(infos) {
  return infos
    .filter(x =>
      x.type === "document" ||
      x.type === "document_recu"
    )
    .map(x => x.valeur);
}

/* =========================================================
   PROGRESSION
   ========================================================= */

function progression(context, infos) {
  let total = 4;
  let done = 0;

  if (context.immigration) {
    total = 5;

    if (confirmed(infos, "situation")) done++;
    if (confirmed(infos, "depot")) done++;
    if (confirmed(infos, "procedure")) done++;
    if (confirmed(infos, "document_recu")) done++;
    if (confirmed(infos, "objectif_professionnel")) done++;
  } else if (context.travail) {
    total = 3;

    if (confirmed(infos, "objectif_professionnel")) done++;
    if (confirmed(infos, "document")) done++;
    if (confirmed(infos, "situation")) done++;
  } else if (context.entreprise) {
    total = 3;

    if (confirmed(infos, "activite")) done++;
    if (confirmed(infos, "statut")) done++;
    if (confirmed(infos, "document")) done++;
  }

  return {
    done,
    total,
    percent: Math.min(
      100,
      Math.round((done / total) * 100)
    )
  };
}

/* =========================================================
   PROCHAINE QUESTION
   ========================================================= */

function prochaineQuestion(context, infos, baseInfos = []) {
  const all = [
    ...(Array.isArray(baseInfos) ? baseInfos : []),
    ...(Array.isArray(infos) ? infos : [])
  ];

  const depotInfo = all.find(x => x.type === "depot");

  let depot = etatDepot(infos);

  if (depot === "inconnu") {
    const depotInitial = etatDepot(baseInfos);

    if (depotInitial !== "inconnu") {
      depot = depotInitial;
    } else if (depotInfo) {
      depot =
        depotInfo.valeur.includes("aucun")
          ? "non"
          : "oui";
    }
  }

  /*
   * IMMIGRATION
   */

  if (context.immigration) {
    if (
      depot === "inconnu" &&
      !confirmed(all, "premiere_demande")
    ) {
      return {
        question:
          "Avez-vous déjà déposé cette demande ?",
        type: "depot"
      };
    }

    if (
      depot === "oui" &&
      !confirmed(all, "procedure")
    ) {
      return {
        question:
          "La demande a-t-elle été faite en ligne sur l’ANEF ou auprès de la préfecture ?",
        type: "procedure"
      };
    }

    if (
      depot === "oui" &&
      !confirmed(all, "document_recu")
    ) {
      return {
        question:
          "Avez-vous reçu un récépissé, une attestation ou une confirmation ?",
        type: "document_recu"
      };
    }

    if (
      depot === "non" &&
      !confirmed(all, "objectif_professionnel")
    ) {
      return {
        question:
          "Quelle est votre démarche principale actuellement ?",
        type: "objectif_professionnel"
      };
    }
  }

  /*
   * EMPLOI
   */

  if (context.travail) {
    if (!confirmed(all, "objectif_professionnel")) {
      return {
        question:
          "Cherchez-vous un emploi ou avez-vous déjà un problème avec votre travail actuel ?",
        type: "objectif_professionnel"
      };
    }

    if (
      !confirmed(all, "situation") &&
      !confirmed(all, "document")
    ) {
      return {
        question:
          "Quel type de poste ou de situation professionnelle recherchez-vous ?",
        type: "situation"
      };
    }
  }

  /*
   * ENTREPRISE
   */

  if (context.entreprise) {
    if (!confirmed(all, "activite")) {
      return {
        question:
          "Quelle activité souhaitez-vous créer ou développer ?",
        type: "activite"
      };
    }

    if (
      context.statut &&
      !confirmed(all, "statut")
    ) {
      return {
        question:
          "Avez-vous déjà choisi un statut juridique pour cette activité ?",
        type: "statut"
      };
    }
  }

  /*
   * CAS GÉNÉRAL
   */

  if (
    context.logement &&
    !confirmed(all, "situation")
  ) {
    return {
      question:
        "Pouvez-vous me préciser votre situation de logement ?",
      type: "situation"
    };
  }

  if (
    context.finance &&
    !confirmed(all, "situation")
  ) {
    return {
      question:
        "Quel est votre principal problème financier actuellement ?",
      type: "situation"
    };
  }

  return null;
}

/* =========================================================
   ACTIONS
   ========================================================= */

function actions(context) {
  const result = [];

  if (context.immigration) {
    result.push(
      "Vérifier le statut de la démarche et les documents disponibles.",
      "Conserver les preuves de dépôt et les confirmations.",
      "Vérifier les informations officielles avant toute démarche."
    );
  }

  if (context.travail) {
    result.push(
      "Identifier le type de poste ou le problème professionnel.",
      "Préparer les documents utiles.",
      "Comparer les options avant de candidater ou de prendre une décision."
    );
  }

  if (context.entreprise) {
    result.push(
      "Définir précisément l'activité.",
      "Vérifier le statut juridique approprié.",
      "Préparer les formalités nécessaires."
    );
  }

  if (context.logement) {
    result.push(
      "Identifier le besoin exact.",
      "Rassembler les justificatifs disponibles."
    );
  }

  return unique(result).slice(0, 6);
}

function recommendations(context) {
  const result = [];

  if (context.immigration) {
    result.push(
      "Privilégier les informations officielles.",
      "Ne pas payer un intermédiaire simplement pour une information disponible gratuitement."
    );
  }

  if (context.travail) {
    result.push(
      "Adapter le CV à chaque candidature.",
      "Vérifier les conditions réelles de l'offre avant de s'engager."
    );
  }

  if (context.entreprise) {
    result.push(
      "Comparer les statuts avant la création.",
      "Vérifier les obligations administratives et fiscales."
    );
  }

  return unique(result).slice(0, 5);
}

function nextAction(context, infos) {
  const q = prochaineQuestion(context, infos);

  return q
    ? q.question
    : "Vous pouvez maintenant préciser votre besoin pour obtenir une orientation plus ciblée.";
}

/* =========================================================
   SOURCES
   ========================================================= */

function selectSources(context) {
  const sources = [];

  if (context.immigration) {
    sources.push(SOURCES.anef);
  }

  if (
    context.immigration &&
    context.travail
  ) {
    sources.push(SOURCES.travailEtranger);
  }

  if (
    context.entreprise ||
    context.statut
  ) {
    sources.push(SOURCES.statut);
  }

  if (context.entreprise) {
    sources.push(SOURCES.guichet);
  }

  return unique(
    sources.map(x => JSON.stringify(x))
  ).map(x => JSON.parse(x));
}

/* =========================================================
   SYSTEM PROMPT
   ========================================================= */

function systemPrompt() {
  return `
Tu es GouRare AI, un assistant intelligent d'orientation.

MISSION :
Aider l'utilisateur à comprendre sa situation, identifier ses options et proposer les prochaines étapes utiles.

ZONE :
La France est le périmètre principal actuel.
Ne prétends pas offrir actuellement un service juridique ou administratif complet pour toute l'Europe.

RÈGLES :
- Une question à la fois.
- Ne redemande jamais une information déjà fournie.
- Ne déduis jamais "première demande" simplement parce que l'utilisateur dit qu'il vient d'arriver en France.
- Ne transforme pas une hypothèse en fait.
- Si une information est incertaine, indique-le clairement.
- Pour les démarches administratives, privilégie les sources officielles.
- Ne promets jamais un résultat administratif.
- Ne donne pas de fausses garanties.
- Pour une question juridique sensible, indique qu'une vérification professionnelle peut être nécessaire.
- Réponds de manière claire, pratique et structurée.
- Évite le jargon inutile.
- Si l'utilisateur cherche un emploi sans diplôme ou expérience, propose des pistes réalistes.
- Respecte la vie privée.
- Ne demande pas de mot de passe, données bancaires, codes de sécurité ou informations inutiles.

STYLE :
Français simple, professionnel, humain et direct.

GouRare AI doit aider l'utilisateur à avancer concrètement, pas seulement à recevoir une explication.
`;
}

/* =========================================================
   AI
   ========================================================= */

async function askAI(env, prompt, maxTokens = 700) {
  const response = await env.IA.run(
    MODEL,
    {
      messages: [
        {
          role: "system",
          content: systemPrompt()
        },
        {
          role: "user",
          content: texte(prompt, 60000)
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.15
    }
  );

  const answer =
    typeof response === "string"
      ? response
      : (
          response?.response ||
          response?.result?.response ||
          ""
        );

  return texte(answer, 12000);
}

/* =========================================================
   MESSAGE
   ========================================================= */

async function messagePrompt(env, question) {
  try {
    const result = await askAI(
      env,
      `
L'utilisateur veut probablement rédiger ou améliorer un message.

Demande :
${texte(question, 12000)}

Produis une réponse directement utilisable en français.
Si nécessaire, propose un message court, poli et professionnel.
`,
      500
    );

    if (result) return result;

    return "Le service IA n’a pas pu traiter ce contenu pour le moment. Réessayez dans quelques instants.";
  } catch (error) {
    console.error("GouRare AI message:", error);

    return "Le service IA n’a pas pu traiter ce contenu pour le moment. Réessayez dans quelques instants.";
  }
}

/* =========================================================
   ANALYSE IMAGE
   ========================================================= */

async function analyserImage(env, image, question = "") {
  if (!isValidImageDataURL(image)) {
    throw new Error("INVALID_IMAGE_FORMAT");
  }

  if (image.length > LIMITS.imageData) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  const response = await env.IA.run(
    MODEL_VISION,
    {
      messages: [
        {
          role: "system",
          content: `
Tu es GouRare AI.
Analyse l'image avec prudence.
Ne prétends pas identifier avec certitude une information qui n'est pas lisible.
Si l'image contient un document, explique les éléments visibles et indique les points qui nécessitent une vérification officielle.
`
        },
        {
          role: "user",
          content: texte(question || "Analyse cette image et explique-moi ce qui est important.", 5000),
          image
        }
      ],
      max_tokens: 900,
      temperature: 0.1
    }
  );

  return texte(
    typeof response === "string"
      ? response
      : (
          response?.response ||
          response?.result?.response ||
          ""
        ),
    12000
  );
}

/* =========================================================
   TRANSCRIPTION AUDIO
   ========================================================= */

async function transcrireAudio(env, audio) {
  if (!isValidAudioDataURL(audio)) {
    throw new Error("INVALID_AUDIO_FORMAT");
  }

  if (audio.length > LIMITS.audioData) {
    throw new Error("AUDIO_TOO_LARGE");
  }

  const base64 = base64FromDataURL(audio);

  const response = await env.IA.run(
    MODEL_AUDIO,
    {
      audio: base64,
      task: "transcribe",
      language: "fr"
    }
  );

  return texte(
    typeof response === "string"
      ? response
      : (
          response?.text ||
          response?.result?.text ||
          ""
        ),
    LIMITS.question
  );
}

/* =========================================================
   ANALYSE QUESTION
   ========================================================= */

async function analyserQuestion(
  env,
  question,
  historique = []
) {
  const q = texte(question, LIMITS.question);

  const context = detectContext(q);

  const extracted = extraireInformations(q);

  let baseInfos = [];

  if (Array.isArray(historique)) {
    for (const item of historique) {
      if (item?.questionInitiale) {
        baseInfos.push(
          ...extraireInformations(
            item.questionInitiale
          )
        );
      }

      if (item?.reponseUtilisateur) {
        baseInfos.push(
          ...extraireInformations(
            item.reponseUtilisateur
          )
        );
      }
    }
  }

  baseInfos = unique(
    baseInfos.map(x => JSON.stringify(x))
  ).map(x => JSON.parse(x));

  const allInfos = unique(
    [...baseInfos, ...extracted]
      .map(x => JSON.stringify(x))
  ).map(x => JSON.parse(x));

  let orientation = "";
  let aiStatus = "ok";

  try {
    orientation = await askAI(
      env,
      `
QUESTION ACTUELLE :
${q}

CONTEXTE DÉTECTÉ :
${JSON.stringify(context)}

INFORMATIONS STRUCTURÉES :
${infosToText(allInfos)}

HISTORIQUE :
${texte(JSON.stringify(historique), LIMITS.historique)}

Réponds comme GouRare AI.

Structure :
1. Compréhension de la situation
2. Orientation recommandée
3. Prochaines étapes concrètes
4. Points à vérifier si nécessaire

Ne pose pas plusieurs questions.
Si une seule information manque réellement pour continuer, termine par UNE question précise.
`,
      800
    );
  } catch (error) {
    console.error("GouRare AI analyse:", error);

    aiStatus = "indisponible";

    /*
     * Fallback sûr si le modèle n'est momentanément pas disponible.
     */

    if (context.immigration) {
      orientation =
        "Votre demande semble concerner une démarche administrative liée à votre situation en France. Il faut d’abord identifier précisément la démarche et vérifier les informations officielles correspondant à votre situation.";
    } else if (context.travail) {
      orientation =
        "Votre demande semble concerner l’emploi ou votre situation professionnelle. Il faut identifier le type de poste ou le problème rencontré afin de déterminer les prochaines étapes.";
    } else if (context.entreprise) {
      orientation =
        "Votre demande semble concerner une activité professionnelle ou une entreprise. La première étape est de préciser l’activité et votre objectif.";
    } else {
      orientation =
        "Votre demande a été reçue. Pour vous orienter correctement, il faut préciser le besoin principal et l’objectif recherché.";
    }
  }

  if (!orientation) {
    aiStatus = "indisponible";

    orientation =
      "Le service IA n’a pas pu produire une analyse complète. Vous pouvez réessayer dans quelques instants.";
  }

  const next = prochaineQuestion(
    context,
    extracted,
    baseInfos
  );

  const progress = progression(
    context,
    allInfos
  );

  return {
    version: VERSION,

    question: q,

    context,

    infos: allInfos,

    orientation,

    prochaineQuestion: next,

    prochaineAction: nextAction(
      context,
      allInfos
    ),

    actions: actions(context),

    recommandations:
      recommendations(context),

    documents:
      documents(allInfos),

    progression: progress,

    sources:
      selectSources(context),

    aiStatus
  };
}

/* =========================================================
   PAGE HTML
   ========================================================= */

function pageHTML() {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#111827">

<title>GouRare AI</title>

<style>

:root{
  --bg:#f5f7fb;
  --card:#ffffff;
  --text:#111827;
  --muted:#64748b;
  --border:#e2e8f0;
  --primary:#111827;
  --primary2:#1f2937;
  --accent:#2563eb;
  --danger:#b91c1c;
  --success:#166534;
}

*{
  box-sizing:border-box;
}

body{
  margin:0;
  background:var(--bg);
  color:var(--text);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
}

main{
  width:min(960px,calc(100% - 28px));
  margin:28px auto 60px;
}

header{
  background:linear-gradient(135deg,#111827,#263449);
  color:white;
  border-radius:24px;
  padding:28px;
  box-shadow:0 15px 40px rgba(15,23,42,.14);
}

.brand{
  font-size:32px;
  font-weight:800;
  letter-spacing:-1px;
}

.subtitle{
  margin-top:8px;
  opacity:.85;
  font-size:16px;
}

.card{
  background:var(--card);
  border:1px solid var(--border);
  border-radius:20px;
  padding:22px;
  margin-top:18px;
  box-shadow:0 8px 25px rgba(15,23,42,.05);
}

h2{
  margin-top:0;
}

.profile-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
  gap:12px;
}

button{
  border:0;
  border-radius:14px;
  padding:13px 16px;
  cursor:pointer;
  font-size:15px;
  font-weight:650;
  background:var(--primary);
  color:white;
}

button.secondary{
  background:#e2e8f0;
  color:#111827;
}

button:disabled{
  opacity:.55;
  cursor:not-allowed;
}

textarea{
  width:100%;
  min-height:145px;
  resize:vertical;
  padding:15px;
  border:1px solid var(--border);
  border-radius:15px;
  font:inherit;
  outline:none;
}

textarea:focus{
  border-color:#94a3b8;
}

.actions{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:12px;
}

.hidden{
  display:none!important;
}

.situation{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(170px,1fr));
  gap:10px;
}

.situation button{
  background:white;
  color:#111827;
  border:1px solid var(--border);
  text-align:left;
}

.result-title{
  font-size:20px;
  font-weight:800;
  margin-bottom:10px;
}

.result-text{
  line-height:1.65;
  white-space:pre-wrap;
}

.progress{
  height:8px;
  border-radius:99px;
  background:#e2e8f0;
  overflow:hidden;
  margin-top:10px;
}

.progress > div{
  height:100%;
  background:#2563eb;
  width:0;
}

.badge{
  display:inline-block;
  padding:6px 10px;
  border-radius:99px;
  background:#eef2ff;
  color:#3730a3;
  font-size:12px;
  font-weight:700;
}

.warning{
  background:#fff7ed;
  color:#9a3412;
  border:1px solid #fed7aa;
  padding:12px;
  border-radius:13px;
  margin-top:12px;
}

.source{
  display:block;
  padding:12px;
  border:1px solid var(--border);
  border-radius:13px;
  margin-top:8px;
  color:#1d4ed8;
  text-decoration:none;
}

.small{
  color:var(--muted);
  font-size:13px;
}

.voice-status{
  margin-top:10px;
  color:var(--muted);
}

.cancer{
  text-align:center;
  color:#64748b;
  font-size:13px;
  line-height:1.5;
}

footer{
  margin-top:20px;
}

@media(max-width:600px){
  main{
    width:min(100% - 18px,960px);
    margin-top:10px;
  }

  header{
    padding:22px;
    border-radius:19px;
  }

  .brand{
    font-size:27px;
  }

  .card{
    padding:17px;
  }
}

</style>
</head>

<body>

<main>

<header>
  <div class="brand">GouRare AI</div>
  <div class="subtitle">
    Votre intelligence d’orientation
  </div>
</header>

<section class="card" id="profileCard">

<h2>Comment pouvons-nous vous aider ?</h2>

<div class="profile-grid">

<button onclick="chooseProfile('migrant')">
  🇫🇷 Situation en France
</button>

<button onclick="chooseProfile('particulier')">
  👤 Particulier
</button>

<button onclick="chooseProfile('emploi')">
  💼 Emploi
</button>

<button onclick="chooseProfile('entreprise')">
  🏢 Entreprise
</button>

</div>

</section>

<section class="card hidden" id="situationCard">

<h2>Choisissez votre situation</h2>

<div class="situation" id="situations"></div>

</section>

<section class="card hidden" id="questionCard">

<div class="badge" id="profileBadge"></div>

<h2>Votre situation</h2>

<textarea
  id="question"
  maxlength="12000"
  placeholder="Expliquez votre situation..."
></textarea>

<div class="actions">

<button id="analyzeBtn" onclick="analyze()">
  Analyser
</button>

<button
  class="secondary"
  id="voiceBtn"
  onclick="toggleVoice()"
>
  🎙️ Parler
</button>

<button
  class="secondary"
  onclick="document.getElementById('imageInput').click()"
>
  📷 Ajouter une image
</button>

</div>

<input
  id="imageInput"
  class="hidden"
  type="file"
  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
  onchange="handleImage(this)"
>

<div id="voiceStatus" class="voice-status"></div>

</section>

<section class="card hidden" id="resultCard">

<div id="aiWarning"></div>

<div class="result-title">
  Orientation
</div>

<div
  id="orientation"
  class="result-text"
></div>

<div id="nextBox"></div>

<div id="progressBox"></div>

<div id="actionsBox"></div>

<div id="recommendationsBox"></div>

<div id="documentsBox"></div>

<div id="sourcesBox"></div>

</section>

<section class="card hidden" id="messageCard">

<h2>Message / courrier</h2>

<textarea
  id="messageQuestion"
  maxlength="12000"
  placeholder="Écrivez votre demande..."
></textarea>

<div class="actions">

<button onclick="generateMessage()">
  Rédiger
</button>

</div>

<div
  id="messageResult"
  class="result-text"
  style="margin-top:15px"
></div>

</section>

<footer>

<div class="cancer">
  🎗️ Avec vous contre le cancer<br>
  🎗️ Notre soutien aux personnes touchées par le cancer.
</div>

<div class="cancer" style="margin-top:10px">
  GouRare AI — Version ${VERSION}
</div>

</footer>

</main>

<script>

const VERSION = "${VERSION}";

const LIMITS = {
  imageFile: 5500000,
  imageData: 8000000,
  audioFile: 9000000,
  audioData: 16000000,
  maxRecordingMs: 120000
};

let profile = "";
let situation = "";
let historique = [];

let mediaRecorder = null;
let mediaStream = null;
let audioChunks = [];
let recordingStartedAt = 0;
let recordTimer = null;
let recordTimeout = null;
let busy = false;

const parcours = ${JSON.stringify(PARCOURS)};

function $(id){
  return document.getElementById(id);
}

function escapeHTML(value){
  return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function chooseProfile(value){

  profile = value;
  situation = "";

  $("profileCard").classList.add("hidden");
  $("situationCard").classList.remove("hidden");

  const list = parcours[value] || [];

  $("situations").innerHTML =
    list.map(item =>
      \`<button onclick="chooseSituation('\${escapeHTML(item[0])}')">
        \${escapeHTML(item[1])}
      </button>\`
    ).join("");

  if(value === "particulier"){
    $("messageCard").classList.remove("hidden");
  }else{
    $("messageCard").classList.add("hidden");
  }
}

function chooseSituation(value){

  situation = value;

  $("situationCard").classList.add("hidden");
  $("questionCard").classList.remove("hidden");

  $("profileBadge").textContent =
    profile + " / " + situation;

  $("question").placeholder =
    "Expliquez votre situation. Par exemple : ce que vous cherchez, ce que vous avez déjà fait et ce qui vous bloque.";

  $("question").focus();
}

async function analyze(){

  if(busy) return;

  const q = $("question").value.trim();

  if(!q){
    $("question").focus();
    return;
  }

  busy = true;

  $("analyzeBtn").disabled = true;
  $("analyzeBtn").textContent = "Analyse en cours...";

  try{

    const current = {
      questionInitiale:
        historique.length
          ? historique[0].questionInitiale
          : q,

      reponseUtilisateur:
        historique.length
          ? q
          : "",

      profile,
      situation
    };

    const response = await fetch(
      "/api/analyze",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          question:q,
          profile,
          situation,
          historique
        })
      }
    );

    const data = await response.json();

    if(!response.ok){
      throw new Error(
        data?.error || "Erreur serveur"
      );
    }

    displayResult(data);

    historique.push(current);

    if(historique.length > 12){
      historique = historique.slice(-12);
    }

  }catch(error){

    $("resultCard").classList.remove("hidden");

    $("orientation").textContent =
      "Une erreur est survenue. Vérifiez votre connexion puis réessayez.";

    $("nextBox").innerHTML = "";
    $("progressBox").innerHTML = "";
    $("actionsBox").innerHTML = "";
    $("recommendationsBox").innerHTML = "";
    $("documentsBox").innerHTML = "";
    $("sourcesBox").innerHTML = "";

  }finally{

    busy = false;

    $("analyzeBtn").disabled = false;
    $("analyzeBtn").textContent = "Analyser";
  }
}

function displayResult(data){

  $("resultCard").classList.remove("hidden");

  $("orientation").textContent =
    data.orientation || "";

  if(data.aiStatus === "indisponible"){

    $("aiWarning").innerHTML =
      '<div class="warning">' +
      'Le service IA est momentanément indisponible. ' +
      'Une orientation de secours vous est affichée.' +
      '</div>';

  }else{
    $("aiWarning").innerHTML = "";
  }

  if(data.prochaineQuestion){

    $("nextBox").innerHTML =
      '<div class="card" style="margin-top:15px">' +
      '<strong>Prochaine question</strong>' +
      '<p>' +
      escapeHTML(data.prochaineQuestion.question) +
      '</p>' +
      '</div>';

  }else{

    $("nextBox").innerHTML =
      '<div class="card" style="margin-top:15px">' +
      '<strong>Prochaine étape</strong>' +
      '<p>' +
      escapeHTML(data.prochaineAction || "") +
      '</p>' +
      '</div>';
  }

  const p = data.progression || {};

  $("progressBox").innerHTML =
    '<div style="margin-top:18px">' +
    '<strong>Progression</strong>' +
    '<div class="progress">' +
    '<div style="width:' +
    Number(p.percent || 0) +
    '%"></div>' +
    '</div>' +
    '<div class="small">' +
    Number(p.percent || 0) +
    '% de progression' +
    '</div>' +
    '</div>';

  $("actionsBox").innerHTML =
    data.actions?.length
      ? '<h3>Actions recommandées</h3><ul>' +
        data.actions.map(
          x => '<li>' + escapeHTML(x) + '</li>'
        ).join("") +
        '</ul>'
      : "";

  $("recommendationsBox").innerHTML =
    data.recommandations?.length
      ? '<h3>Conseils</h3><ul>' +
        data.recommandations.map(
          x => '<li>' + escapeHTML(x) + '</li>'
        ).join("") +
        '</ul>'
      : "";

  $("documentsBox").innerHTML =
    data.documents?.length
      ? '<h3>Éléments détectés</h3><ul>' +
        data.documents.map(
          x => '<li>' + escapeHTML(x) + '</li>'
        ).join("") +
        '</ul>'
      : "";

  if(data.sources?.length){

    $("sourcesBox").innerHTML =
      '<h3>Sources officielles pertinentes</h3>' +
      data.sources.map(
        s =>
          '<a class="source" href="' +
          escapeHTML(s.url) +
          '" target="_blank" rel="noopener noreferrer">' +
          escapeHTML(s.title) +
          '</a>'
      ).join("");

  }else{

    $("sourcesBox").innerHTML = "";
  }

  $("resultCard").scrollIntoView({
    behavior:"smooth",
    block:"start"
  });

  $("question").placeholder =
    data.prochaineQuestion?.question ||
    "Ajoutez une précision si vous souhaitez continuer l’analyse.";
}

function dataURLSizeOK(data, max){
  return typeof data === "string" &&
    data.length <= max;
}

function readFileAsDataURL(file){

  return new Promise((resolve,reject)=>{

    const reader = new FileReader();

    reader.onload = () =>
      resolve(reader.result);

    reader.onerror = () =>
      reject(new Error("Lecture impossible"));

    reader.readAsDataURL(file);
  });
}

async function handleImage(input){

  const file = input.files?.[0];

  if(!file) return;

  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if(!allowed.includes(file.type)){
    alert("Format accepté : JPG, PNG ou WEBP.");
    input.value = "";
    return;
  }

  if(file.size > LIMITS.imageFile){
    alert("L’image doit faire au maximum 5,5 Mo.");
    input.value = "";
    return;
  }

  try{

    const dataURL =
      await readFileAsDataURL(file);

    if(!dataURLSizeOK(
      dataURL,
      LIMITS.imageData
    )){
      alert("L’image encodée est trop volumineuse.");
      input.value = "";
      return;
    }

    $("questionCard").classList.remove("hidden");

    const question =
      $("question").value.trim() ||
      "Analyse cette image et explique-moi ce qui est important.";

    const response = await fetch(
      "/api/image",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          image:dataURL,
          question
        })
      }
    );

    const data = await response.json();

    if(!response.ok){
      throw new Error(
        data?.error || "Erreur image"
      );
    }

    $("resultCard").classList.remove("hidden");

    $("aiWarning").innerHTML = "";

    $("orientation").textContent =
      data.analysis || "";

    $("nextBox").innerHTML = "";

    $("progressBox").innerHTML = "";

    $("actionsBox").innerHTML = "";

    $("recommendationsBox").innerHTML = "";

    $("documentsBox").innerHTML = "";

    $("sourcesBox").innerHTML = "";

    $("resultCard").scrollIntoView({
      behavior:"smooth"
    });

  }catch(error){

    alert(
      "Impossible d’analyser cette image pour le moment."
    );

  }finally{

    input.value = "";
  }
}

/* =========================================================
   VOICE
   ========================================================= */

function chooseRecorderMime(){

  if(
    typeof MediaRecorder === "undefined" ||
    !MediaRecorder.isTypeSupported
  ){
    return "";
  }

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg"
  ];

  return candidates.find(
    x => MediaRecorder.isTypeSupported(x)
  ) || "";
}

async function toggleVoice(){

  if(mediaRecorder &&
     mediaRecorder.state === "recording"){

    stopRecording();
    return;
  }

  await startRecording();
}

async function startRecording(){

  if(!navigator.mediaDevices ||
     !navigator.mediaDevices.getUserMedia){

    $("voiceStatus").textContent =
      "La fonction vocale n’est pas disponible sur cet appareil.";

    return;
  }

  try{

    mediaStream =
      await navigator.mediaDevices.getUserMedia({
        audio:true
      });

    const mime = chooseRecorderMime();

    mediaRecorder =
      mime
        ? new MediaRecorder(
            mediaStream,
            {mimeType:mime}
          )
        : new MediaRecorder(
            mediaStream
          );

    audioChunks = [];

    mediaRecorder.ondataavailable = event => {

      if(event.data &&
         event.data.size > 0){

        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop =
      processRecording;

    mediaRecorder.start();

    recordingStartedAt = Date.now();

    $("voiceBtn").textContent =
      "⏹️ Arrêter";

    $("voiceStatus").textContent =
      "Enregistrement... 0 s / 120 s";

    recordTimer = setInterval(()=>{

      const seconds =
        Math.floor(
          (Date.now() - recordingStartedAt) /
          1000
        );

      $("voiceStatus").textContent =
        "Enregistrement... " +
        seconds +
        " s / 120 s";

    },1000);

    recordTimeout =
      setTimeout(
        stopRecording,
        LIMITS.maxRecordingMs
      );

  }catch(error){

    $("voiceStatus").textContent =
      "Accès au microphone impossible.";
  }
}

function stopRecording(){

  if(mediaRecorder &&
     mediaRecorder.state === "recording"){

    mediaRecorder.stop();
  }

  if(recordTimer){
    clearInterval(recordTimer);
    recordTimer = null;
  }

  if(recordTimeout){
    clearTimeout(recordTimeout);
    recordTimeout = null;
  }

  if(mediaStream){

    mediaStream
      .getTracks()
      .forEach(track => track.stop());

    mediaStream = null;
  }

  $("voiceBtn").textContent =
    "🎙️ Parler";
}

async function processRecording(){

  try{

    const type =
      mediaRecorder?.mimeType ||
      "audio/webm";

    const blob =
      new Blob(
        audioChunks,
        {type}
      );

    if(blob.size > LIMITS.audioFile){

      $("voiceStatus").textContent =
        "L’enregistrement dépasse 9 Mo.";

      return;
    }

    $("voiceStatus").textContent =
      "Transcription en cours...";

    const dataURL =
      await readFileAsDataURL(blob);

    if(!dataURLSizeOK(
      dataURL,
      LIMITS.audioData
    )){

      $("voiceStatus").textContent =
        "L’audio encodé est trop volumineux.";

      return;
    }

    const response =
      await fetch(
        "/api/transcribe",
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            audio:dataURL
          })
        }
      );

    const data =
      await response.json();

    if(!response.ok){
      throw new Error(
        data?.error || "Erreur transcription"
      );
    }

    if(data.text){

      $("question").value =
        (
          $("question").value.trim()
            ? $("question").value.trim() + " "
            : ""
        ) +
        data.text;

      $("question").focus();
    }

    $("voiceStatus").textContent =
      "Transcription terminée.";

  }catch(error){

    $("voiceStatus").textContent =
      "Impossible de transcrire l’enregistrement.";

  }finally{

    audioChunks = [];
  }
}

/* =========================================================
   MESSAGE
   ========================================================= */

async function generateMessage(){

  const q =
    $("messageQuestion").value.trim();

  if(!q) return;

  $("messageResult").textContent =
    "Rédaction en cours...";

  try{

    const response =
      await fetch(
        "/api/message",
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            question:q
          })
        }
      );

    const data =
      await response.json();

    if(!response.ok){
      throw new Error(
        data?.error || "Erreur"
      );
    }

    $("messageResult").textContent =
      data.message || "";

  }catch(error){

    $("messageResult").textContent =
      "Impossible de rédiger le message pour le moment.";
  }
}

</script>

</body>
</html>`;
}

/* =========================================================
   HANDLER ANALYZE
   ========================================================= */

async function handleAnalyze(request, env) {

  const limit =
    rateLimit(request, "analyze");

  if(!limit.allowed){

    return jsonResponse(
      {
        error:
          "Trop de demandes. Réessayez plus tard."
      },
      429,
      {
        "Retry-After":
          String(limit.retryAfter)
      }
    );
  }

  if(
    contentLengthTooLarge(
      request,
      LIMITS.analyzeBody
    )
  ){

    return jsonResponse(
      {
        error:"Requête trop volumineuse."
      },
      413
    );
  }

  let body;

  try{

    body =
      await request.json();

  }catch{

    return jsonResponse(
      {
        error:"JSON invalide."
      },
      400
    );
  }

  const question =
    texte(
      body?.question,
      LIMITS.question
    );

  if(!question){

    return jsonResponse(
      {
        error:"Question vide."
      },
      400
    );
  }

  const historique =
    Array.isArray(body?.historique)
      ? body.historique.slice(-12)
      : [];

  const result =
    await analyserQuestion(
      env,
      question,
      historique
    );

  return jsonResponse(
    result
  );
}

/* =========================================================
   HANDLER MESSAGE
   ========================================================= */

async function handleMessage(request, env){

  const limit =
    rateLimit(request, "analyze");

  if(!limit.allowed){

    return jsonResponse(
      {
        error:"Trop de demandes."
      },
      429
    );
  }

  if(
    contentLengthTooLarge(
      request,
      LIMITS.analyzeBody
    )
  ){

    return jsonResponse(
      {
        error:"Requête trop volumineuse."
      },
      413
    );
  }

  let body;

  try{
    body = await request.json();
  }catch{
    return jsonResponse(
      {
        error:"JSON invalide."
      },
      400
    );
  }

  const question =
    texte(
      body?.question,
      LIMITS.question
    );

  if(!question){

    return jsonResponse(
      {
        error:"Demande vide."
      },
      400
    );
  }

  const message =
    await messagePrompt(
      env,
      question
    );

  return jsonResponse({
    version:VERSION,
    message
  });
}

/* =========================================================
   HANDLER IMAGE
   ========================================================= */

async function handleImage(request, env){

  const limit =
    rateLimit(request, "image");

  if(!limit.allowed){

    return jsonResponse(
      {
        error:
          "Trop d’analyses d’images. Réessayez plus tard."
      },
      429,
      {
        "Retry-After":
          String(limit.retryAfter)
      }
    );
  }

  if(
    contentLengthTooLarge(
      request,
      LIMITS.imageBody
    )
  ){

    return jsonResponse(
      {
        error:"Image trop volumineuse."
      },
      413
    );
  }

  let body;

  try{

    body =
      await request.json();

  }catch{

    return jsonResponse(
      {
        error:"JSON invalide."
      },
      400
    );
  }

  const image =
    String(body?.image || "");

  const question =
    texte(
      body?.question ||
      "Analyse cette image et explique-moi ce qui est important.",
      5000
    );

  if(!isValidImageDataURL(image)){

    return jsonResponse(
      {
        error:
          "Format d’image non accepté. Utilisez JPG, PNG ou WEBP."
      },
      400
    );
  }

  if(image.length > LIMITS.imageData){

    return jsonResponse(
      {
        error:"Image trop volumineuse."
      },
      413
    );
  }

  try{

    const analysis =
      await analyserImage(
        env,
        image,
        question
      );

    return jsonResponse({
      version:VERSION,
      analysis:
        analysis ||
        "Aucune analyse disponible."
    });

  }catch(error){

    console.error(
      "GouRare AI image:",
      error
    );

    return jsonResponse(
      {
        error:
          "Impossible d’analyser cette image pour le moment."
      },
      503
    );
  }
}

/* =========================================================
   HANDLER AUDIO
   ========================================================= */

async function handleTranscribe(
  request,
  env
){

  const limit =
    rateLimit(
      request,
      "transcribe"
    );

  if(!limit.allowed){

    return jsonResponse(
      {
        error:
          "Trop de transcriptions. Réessayez plus tard."
      },
      429,
      {
        "Retry-After":
          String(limit.retryAfter)
      }
    );
  }

  if(
    contentLengthTooLarge(
      request,
      LIMITS.audioBody
    )
  ){

    return jsonResponse(
      {
        error:"Audio trop volumineux."
      },
      413
    );
  }

  let body;

  try{

    body =
      await request.json();

  }catch{

    return jsonResponse(
      {
        error:"JSON invalide."
      },
      400
    );
  }

  const audio =
    String(body?.audio || "");

  if(!isValidAudioDataURL(audio)){

    return jsonResponse(
      {
        error:
          "Format audio non accepté."
      },
      400
    );
  }

  if(audio.length > LIMITS.audioData){

    return jsonResponse(
      {
        error:"Audio trop volumineux."
      },
      413
    );
  }

  try{

    const text =
      await transcrireAudio(
        env,
        audio
      );

    return jsonResponse({
      version:VERSION,
      text:
        text ||
        ""
    });

  }catch(error){

    console.error(
      "GouRare AI transcription:",
      error
    );

    return jsonResponse(
      {
        error:
          "Impossible de transcrire cet audio pour le moment."
      },
      503
    );
  }
}

/* =========================================================
   HEALTH
   ========================================================= */

function healthResponse() {

  return jsonResponse({
    ok:true,
    service:"GouRare AI",
    version:VERSION,
    country:"France",
    modules:{
      orientation:true,
      image:true,
      voice:true,
      message:true,
      officialSources:true
    }
  });
}

/* =========================================================
   FETCH
   ========================================================= */

export default {

  async fetch(request, env) {

    const url =
      new URL(request.url);

    if(
      request.method === "OPTIONS"
    ){

      return new Response(
        null,
        {
          status:204,
          headers:securityHeaders({
            "Access-Control-Allow-Origin":"*",
            "Access-Control-Allow-Methods":
              "GET,POST,OPTIONS",
            "Access-Control-Allow-Headers":
              "Content-Type"
          })
        }
      );
    }

    if(
      request.method === "GET" &&
      url.pathname === "/"
    ){

      return new Response(
        pageHTML(),
        {
          status:200,
          headers:securityHeaders({
            "Content-Type":
              "text/html; charset=utf-8",
            "Cache-Control":
              "no-store"
          })
        }
      );
    }

    if(
      request.method === "GET" &&
      url.pathname === "/health"
    ){

      return healthResponse();
    }

    if(
      request.method === "POST" &&
      url.pathname === "/api/analyze"
    ){

      return handleAnalyze(
        request,
        env
      );
    }

    if(
      request.method === "POST" &&
      url.pathname === "/api/message"
    ){

      return handleMessage(
        request,
        env
      );
    }

    if(
      request.method === "POST" &&
      url.pathname === "/api/image"
    ){

      return handleImage(
        request,
        env
      );
    }

    if(
      request.method === "POST" &&
      url.pathname === "/api/transcribe"
    ){

      return handleTranscribe(
        request,
        env
      );
    }

    return jsonResponse(
      {
        error:"Not Found"
      },
      404
    );
  }
};
