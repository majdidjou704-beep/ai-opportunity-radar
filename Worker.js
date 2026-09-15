const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const MODEL_VISION = "@cf/meta/llama-3.2-11b-vision-instruct";
const MODEL_AUDIO = "@cf/openai/whisper-large-v3-turbo";
const VERSION = "8.7";

const LIMITS = { question: 12000, image: 7000000, audio: 12000000 };

const SOURCES = {
  statut: {
    id:"statut",
    titre:"Trouver le statut juridique adapté à son activité",
    organisme:"Service Public Entreprendre",
    url:"https://entreprendre.service-public.fr/vosdroits/R18323",
    preuves:[
      "Le simulateur permet de trouver le statut juridique adapté à son activité.",
      "Pour utiliser le simulateur, il faut notamment renseigner l'activité envisagée et une estimation du chiffre d'affaires.",
      "Le simulateur permet de connaître les formes juridiques possibles pour l'activité.",
      "Le simulateur permet de comparer notamment les revenus, la couverture sociale ainsi que la gestion comptable et juridique."
    ]
  },

  creation_ei: {
    id:"creation_ei",
    titre:"Création d'une entreprise individuelle",
    organisme:"Service Public Entreprendre",
    url:"https://entreprendre.service-public.fr/vosdroits/F36763",
    preuves:[
      "La création d'une entreprise individuelle comporte notamment une formalité d'immatriculation et une déclaration d'activité.",
      "La demande d'immatriculation d'une entreprise individuelle se fait sur le Guichet des formalités des entreprises.",
      "Après son immatriculation, l'entreprise individuelle est inscrite au Registre national des entreprises.",
      "Le registre d'inscription dépend de la nature de l'activité exercée.",
      "Pour une entreprise individuelle commerciale, l'inscription concerne notamment le Registre national des entreprises et le Registre du commerce et des sociétés.",
      "Une activité réglementée peut nécessiter des justificatifs particuliers, notamment une autorisation, un diplôme ou un titre."
    ]
  },

  guichet: {
    id:"guichet",
    titre:"Formalités d'immatriculation des entreprises",
    organisme:"Service Public Entreprendre",
    url:"https://entreprendre.service-public.fr/vosdroits/F23571",
    preuves:[
      "Les formalités de création d'une entreprise sont réalisées par l'intermédiaire du Guichet des formalités des entreprises."
    ]
  },

  anef: {
    id:"anef",
    titre:"Faire une demande en ligne pour un titre de séjour ou un changement de situation",
    organisme:"Service-Public.fr / ANEF",
    url:"https://www.service-public.fr/particuliers/vosdroits/R59398",
    preuves:[
      "L'ANEF permet de réaliser certaines démarches concernant les titres de séjour et certains changements de situation.",
      "La démarche applicable dépend du type de demande et de la situation de la personne."
    ]
  },

  travail_etranger: {
    id:"travail_etranger",
    titre:"Autorisation de travail d'un salarié étranger en France",
    organisme:"Service-Public.fr",
    url:"https://www.service-public.fr/particuliers/vosdroits/F2728",
    preuves:[
      "Les règles de travail dépendent notamment du document de séjour détenu et de la situation de la personne.",
      "Dans certaines situations, un récépissé peut comporter une mention relative à l'autorisation de travailler."
    ]
  }
};

function texte(v,max=10000){
  if(v===null||v===undefined)return "";
  return String(v)
    .replace(/\u0000/g,"")
    .replace(/\r/g,"")
    .trim()
    .slice(0,max);
}

function unique(a){
  return [...new Set((a||[]).filter(Boolean))];
}

function escapeHTML(v){
  return texte(v,50000)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function jsonResponse(data,status=200){
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers:{
        "content-type":"application/json; charset=utf-8",
        "cache-control":"no-store"
      }
    }
  );
}

function securityHeaders(){
  return {
    "X-Content-Type-Options":"nosniff",
    "X-Frame-Options":"DENY",
    "Referrer-Policy":"strict-origin-when-cross-origin",
    "Permissions-Policy":"camera=(self), microphone=(self), geolocation=()",
    "Cache-Control":"no-store"
  };
}


/* =========================
   PARCOURS D'ACCUEIL
========================= */

const PARCOURS = {

  migrant:{
    titre:"🌍 Migrant / Nouveau arrivant",
    description:"Situation administrative, travail, logement, droits et démarches.",
    situations:[
      ["arrive","🆕 Je viens d'arriver"],
      ["administratif","🪪 Ma situation administrative"],
      ["emploi","💼 Je cherche un emploi"],
      ["logement","🏠 Je cherche un logement"],
      ["document","📄 Je ne comprends pas un document"],
      ["droits","⚖️ Je veux connaître mes droits"],
      ["social","🤝 Je cherche une aide sociale"],
      ["etudes","🎓 Je veux étudier"],
      ["famille","👨‍👩‍👧 Famille / regroupement familial"],
      ["asile","🛂 Asile / protection"],
      ["irreguliere","❓ Situation irrégulière"],
      ["autre","❓ Autre situation"]
    ]
  },

  particulier:{
    titre:"👤 Particulier / Résident",
    description:"Vie quotidienne, droits, démarches et problèmes personnels.",
    situations:[
      ["administratif","🧾 Démarches administratives"],
      ["emploi","💼 Travail / emploi"],
      ["logement","🏠 Logement"],
      ["finance","💰 Impôts / finances"],
      ["social","🤝 Aides sociales"],
      ["juridique","⚖️ Droits / problème juridique"],
      ["message","✉️ Lettre / email / message"],
      ["document","📷 Comprendre un document"],
      ["opportunite","🎯 Trouver une opportunité"],
      ["autre","❓ Autre"]
    ]
  },

  emploi:{
    titre:"💼 Chercheur d'emploi",
    description:"Recherche d'emploi, candidature, CV et entretien.",
    situations:[
      ["offres","🔎 Trouver des offres"],
      ["cv","📄 Créer / améliorer mon CV"],
      ["candidature","✉️ Candidature / lettre de motivation"],
      ["annonce","📩 Répondre à une annonce"],
      ["entretien","🎤 Préparer un entretien"],
      ["entreprise","🏢 Trouver une entreprise"],
      ["adapte","♿ Rechercher un emploi adapté à ma situation"],
      ["comparaison","🎯 Comparer plusieurs offres"],
      ["autre","❓ Autre"]
    ]
  },

  entreprise:{
    titre:"🏢 Entreprise / Entrepreneur",
    description:"Créer, gérer, développer et trouver des opportunités.",
    situations:[
      ["creation","🚀 Créer mon entreprise"],
      ["developpement","📈 Développer mon activité"],
      ["fiscalite","💰 Fiscalité"],
      ["comptabilite","🧾 Comptabilité / obligations"],
      ["salaries","👥 Salariés"],
      ["juridique","⚖️ Problème juridique"],
      ["fournisseurs","🔎 Trouver des fournisseurs"],
      ["offres","💶 Comparer des offres / prix"],
      ["opportunite","🎯 Trouver des opportunités"],
      ["ia","🤖 Trouver une solution IA"],
      ["autre","❓ Autre"]
    ]
  }
};


/* =========================
   CONTEXTE
========================= */

function detectContext(q){

  const s=texte(q,12000).toLowerCase();

  return {

    nettoyage:/nettoyage|ménage|menage|propreté|proprete|cleaning/.test(s),

    entreprise:/créer|creer|création|creation|lancer|ouvrir|entreprise|société|societe|activité|activite/.test(s),

    statut:/statut|forme juridique|micro|micro-entreprise|microentreprise|indépendant|independant|\bei\b|entreprise individuelle/.test(s),

    travail:/travail|emploi|salarié|salarie|contrat|employeur|licenciement|salaire/.test(s),

    social:/caf|rsa|aide|social|allocation|droits sociaux/.test(s),

    administratif:/démarche|demarche|administratif|administrative|préfecture|prefecture|mairie|document officiel/.test(s),

    juridique:/avocat|juridique|justice|tribunal|loi|légal|legal|mise en demeure/.test(s),

    fiscalite:/impôt|impot|fiscal|fiscalité|fiscalite|urssaf|tva|cfe|cotisation/.test(s),

    immigration:/récépissé|recepisse|titre de séjour|titre de sejour|séjour|sejour|visa|anef|préfecture|prefecture|étranger|etranger|demande d'asile|asile|carte de séjour|carte de sejour/.test(s),

    recepisse:/récépissé|recepisse/.test(s),

    titreSejour:/titre de séjour|titre de sejour|carte de séjour|carte de sejour/.test(s),

    anef:/anef/.test(s),

    renouvellement:/renouvellement|renouveler|expire|expiration|fin de validité|fin de validite/.test(s),

    premiereDemande:/première demande|premiere demande|premier titre|première carte|premiere carte|je viens d'arriver|je viens d arriver/.test(s),

    asile:/asile|demandeur d'asile|demandeuse d'asile/.test(s),

    message:false
  };
}


/* =========================
   QUESTIONS INTELLIGENTES
========================= */

function prochaineQuestion(q,c,options={}){

  const reponse=texte(
    options.reponseUtilisateur || options.reponse,
    12000
  ).toLowerCase();

  const etape=Number(options.etape)||0;

  if(c.recepisse){

    if(etape===0 && !reponse){
      return "Avez-vous déjà déposé une demande de titre de séjour auprès de l’ANEF ou de la préfecture ?";
    }

    if(/\b(oui|yes)\b/.test(reponse)){
      return "Quel type de demande de titre de séjour avez-vous déjà déposé : première demande, renouvellement, changement de situation, demande d’asile ou autre ?";
    }

    if(/\b(non|pas encore)\b/.test(reponse)){
      return "Pour quel motif souhaitez-vous demander un titre de séjour : travail, famille, études, autre motif, ou vous ne savez pas encore ?";
    }

    if(etape===2){
      return "Avez-vous reçu un document après votre démarche (récépissé, attestation, confirmation ANEF ou autre) ?";
    }

    if(etape>=3){
      return "Quel est votre objectif maintenant : obtenir ou renouveler votre titre, pouvoir travailler, suivre votre dossier, ou résoudre un problème administratif ?";
    }

    return "Avez-vous déjà déposé une demande de titre de séjour auprès de l’ANEF ou de la préfecture ?";
  }

  if(c.entreprise && !c.statut){

    if(etape===0){
      return "Quelle activité ou quels services souhaitez-vous proposer ?";
    }

    return "Avez-vous déjà choisi une forme juridique ou souhaitez-vous que GouRare AI vous aide à la comparer ?";
  }

  if(c.entreprise && c.statut){
    return "Avez-vous déjà commencé les formalités de création de l’entreprise ?";
  }

  if(c.travail){

    if(etape===0){
      return "Quel est votre objectif principal : trouver un emploi, comprendre votre contrat, ou résoudre un problème avec votre employeur ?";
    }

    return "Pouvez-vous préciser votre situation actuelle et ce que vous souhaitez obtenir ?";
  }

  if(c.social){

    if(etape===0){
      return "Quelle aide ou quelle situation sociale souhaitez-vous comprendre ?";
    }

    return "Quel est le résultat que vous souhaitez obtenir exactement ?";
  }

  if(c.administratif){

    if(etape===0){
      return "Quelle démarche administrative devez-vous effectuer exactement ?";
    }

    return "Avez-vous déjà commencé cette démarche ou pas encore ?";
  }

  if(c.juridique){

    if(etape===0){
      return "Quel problème ou quelle situation juridique souhaitez-vous résoudre ?";
    }

    return "Avez-vous déjà reçu un courrier, une décision ou une mise en demeure concernant cette situation ?";
  }

  return "Quel est le résultat que vous souhaitez obtenir exactement ?";
}


/* =========================
   SOURCES
========================= */

function selectSources(c){

  const ids=[];

  if(c.immigration){

    ids.push("anef");

    if(c.travail){
      ids.push("travail_etranger");
    }
  }

  if(c.entreprise || c.statut){
    ids.push("statut");
  }

  if(c.entreprise && c.statut){
    ids.push("creation_ei");
  }

  if(c.entreprise){
    ids.push("guichet");
  }

  return unique(ids).map(id=>SOURCES[id]);
}


/* =========================
   INFORMATIONS CONFIRMÉES
========================= */

function confirmed(q,c,sources){

  const out=[];

  if(c.immigration && sources.some(s=>s.id==="anef")){
    out.push(
      "La demande concerne une démarche liée au séjour ou à la situation administrative d'un étranger en France."
    );
  }

  if(c.recepisse){
    out.push(
      "Le mot « récépissé » est bien identifié comme l'objet principal de la demande, mais son rôle exact dépend de la procédure engagée."
    );
  }

  if(c.entreprise && sources.some(s=>s.id==="statut")){
    out.push(
      "Le choix de la forme juridique peut être étudié en fonction de l'activité envisagée, du chiffre d'affaires estimé, des revenus, de la couverture sociale et de la gestion."
    );
  }

  if(
    c.statut &&
    /entreprise individuelle|\bei\b|micro|micro-entreprise|microentreprise/.test(q.toLowerCase()) &&
    sources.some(s=>s.id==="creation_ei")
  ){

    out.push(
      "Pour une entreprise individuelle, certaines formalités d'immatriculation et de déclaration d'activité sont prévues."
    );

    out.push(
      "La demande d'immatriculation d'une entreprise individuelle se fait sur le Guichet des formalités des entreprises."
    );
  }

  return unique(out);
}


/* =========================
   DOCUMENTS
========================= */

function documents(q,c){

  const s=texte(q).toLowerCase();

  if(c.immigration && c.recepisse){

    return [
      {
        statut:"à vérifier",
        texte:"Le document ou la preuve de dépôt déjà reçu, s'il existe."
      },
      {
        statut:"à vérifier",
        texte:"Le type exact de demande de séjour et les justificatifs demandés pour cette procédure."
      }
    ];
  }

  if(
    c.statut &&
    /entreprise individuelle|\bei\b|micro|micro-entreprise|microentreprise/.test(s)
  ){

    return [
      {
        statut:"à vérifier",
        texte:"Vérifier les justificatifs demandés pour la forme juridique choisie."
      },
      {
        statut:"conditionnel",
        texte:"Si l'activité est réglementée, vérifier les éventuels justificatifs d'autorisation, diplôme ou titre."
      }
    ];
  }

  return [];
}


/* =========================
   ACTIONS
========================= */

function actions(q,c){

  const a=[];

  if(c.immigration && c.recepisse){

    a.push(
      "Identifier la procédure exacte : première demande, renouvellement, changement de situation, demande d'asile ou autre."
    );

    a.push(
      "Vérifier si la demande a déjà été déposée et quel document ou accusé de réception a été remis."
    );

    a.push(
      "Consulter la procédure officielle correspondante sur l'ANEF ou auprès de la préfecture compétente."
    );
  }

  if(c.entreprise){
    a.push(
      "Décrire précisément les prestations ou produits proposés."
    );
  }

  if(c.entreprise && !c.statut){
    a.push(
      "Comparer les formes juridiques possibles avant de choisir un statut."
    );
  }

  if(c.entreprise && c.statut){
    a.push(
      "Vérifier les formalités correspondant exactement à la forme juridique et à l'activité choisies."
    );
  }

  return unique(a);
}


/* =========================
   RECOMMANDATIONS
========================= */

function recommendations(q,c){

  const a=[];

  if(c.immigration && c.recepisse){

    a.push(
      "Ne pas supposer qu'un récépissé est automatiquement délivré dans toutes les situations : son rôle dépend de la procédure et de l'état du dossier."
    );

    a.push(
      "Ne pas déduire votre droit au séjour ou au travail à partir du seul fait d'avoir demandé un récépissé."
    );
  }

  if(c.entreprise){
    a.push(
      "Décrire précisément l'activité avant de prendre une décision administrative ou juridique."
    );
  }

  if(c.entreprise && !c.statut){
    a.push(
      "Comparer les formes juridiques avant de retenir celle qui correspond au projet."
    );
  }

  if(c.entreprise && c.statut){
    a.push(
      "Vérifier les formalités officielles après avoir défini la forme juridique et la nature exacte de l'activité."
    );
  }

  return unique(a);
}


/* =========================
   PROCHAINE ACTION
========================= */

function nextAction(q,c,options={}){

  if(c.immigration && c.recepisse){
    return prochaineQuestion(q,c,options);
  }

  if(c.entreprise && !c.statut){
    return prochaineQuestion(q,c,options);
  }

  if(c.entreprise && c.statut){
    return prochaineQuestion(q,c,options);
  }

  if(c.message){
    return "Vérifier que le projet de réponse correspond bien au contenu et au contexte du message reçu.";
  }

  return prochaineQuestion(q,c,options);
}


/* =========================
   IA
========================= */

function systemPrompt(){

  return `
Tu es GouRare AI, un assistant d'orientation et d'analyse multi-domaines.

Tu n'es pas avocat, expert-comptable, médecin, administration ou travailleur social.

Les choix de parcours, de situation ou de profil dans l'interface sont uniquement des éléments de navigation. Ils ne prouvent jamais un statut juridique, un titre de séjour, un droit, une nationalité, une situation irrégulière, une éligibilité ou une obligation.

Pour les sujets d'immigration et de droits, ne déduis jamais la situation légale de l'utilisateur à partir de sa sélection.

Ne transforme jamais une hypothèse en fait. Si une information manque, pose une question ciblée.

Quand l'intention est identifiable, nomme-la clairement et demande uniquement les informations nécessaires à l'étape suivante.

Pose UNE SEULE question à la fois.

Ne répète jamais une question à laquelle l'utilisateur vient de répondre.

Pour une demande concernant un récépissé, distingue notamment :
- première demande
- renouvellement
- changement de situation
- demande d'asile
- demande déjà déposée
- absence de dépôt
- document déjà reçu

Ne dis jamais qu'une personne peut séjourner, travailler, rester ou qu'elle possède un droit particulier sans éléments confirmés.

N'invente jamais de loi, article, taux, montant, seuil, sanction, obligation, autorisation, diplôme, document, statistique, prix ou délai.

Les informations officielles fournies par le moteur de vérité sont prioritaires.

Ne répète pas les URL des sources dans ton explication : elles sont affichées séparément.

Si une information n'est pas confirmée, indique qu'elle doit être vérifiée.

Pour un message, respecte strictement son contenu.

Pour une image, analyse uniquement ce qui est réellement visible ou lisible.

Ton objectif est :
Comprendre → Identifier l'intention → Vérifier → Orienter → Donner la prochaine action.
`;
}


async function askAI(env,prompt,maxTokens=900){

  try{

    const r=await env.IA.run(
      MODEL,
      {
        messages:[
          {
            role:"system",
            content:systemPrompt()
          },
          {
            role:"user",
            content:texte(prompt,60000)
          }
        ],
        max_tokens:maxTokens,
        temperature:0.15
      }
    );

    if(typeof r==="string")return r;

    if(r?.response)return r.response;

    if(r?.result?.response)return r.result.response;

    return "";

  }catch(e){

    return "";
  }
}


/* =========================
   MESSAGES
========================= */

function messagePrompt(contenu,mode,langue){

  const instructions={

    analyse:"Analyse le message : faits, demande, éléments importants, incertitudes et réponse possible.",

    reponse:"Prépare une réponse claire, polie et adaptée. N'invente aucun fait.",

    reformulation:"Réécris le message plus clairement sans changer son sens.",

    correction:"Corrige les fautes et améliore légèrement la formulation sans changer le sens.",

    traduction:"Traduis fidèlement le contenu dans la langue demandée."
  };

  return `
Langue : ${langue||"français"}

Mode :
${instructions[mode]||instructions.analyse}

CONTENU :
${texte(contenu,18000)}
`;
}


/* =========================
   IMAGE / AUDIO
========================= */

async function analyserImage(env,image,demande=""){

  if(!image || typeof image!=="string"){
    throw new Error("Image absente.");
  }

  if(image.length>LIMITS.image){
    throw new Error("Image trop volumineuse.");
  }

  const r=await env.IA.run(
    MODEL_VISION,
    {
      messages:[
        {
          role:"system",
          content:"Analyse uniquement ce qui est réellement visible ou lisible. Ne devine jamais un texte illisible."
        },
        {
          role:"user",
          content:demande||"Lis et analyse cette image. Identifie les éléments visibles, explique leur contenu et indique ce qui reste incertain."
        }
      ],
      image,
      max_tokens:2200,
      temperature:0.1
    }
  );

  if(typeof r==="string")return r;

  if(r?.response)return r.response;

  if(r?.result?.response)return r.result.response;

  return typeof r?.result==="string"
    ? r.result
    : JSON.stringify(r);
}


function base64FromDataURL(v){

  const s=texte(v,LIMITS.audio);
  const i=s.indexOf(",");

  return s.startsWith("data:") && i>=0
    ? s.slice(i+1)
    : s;
}


async function transcrireAudio(env,audio,langue="fr"){

  if(!audio){
    throw new Error("Audio absent.");
  }

  if(audio.length>LIMITS.audio){
    throw new Error("Audio trop volumineux.");
  }

  const r=await env.IA.run(
    MODEL_AUDIO,
    {
      audio:base64FromDataURL(audio),
      task:"transcribe",
      language:langue
    }
  );

  return texte(
    r?.text||r?.transcription_info?.text||"",
    20000
  );
}


/* =========================
   ANALYSE
========================= */

async function analyserQuestion(env,q,options={}){

  const baseQuestion=texte(q,LIMITS.question);

  const questionInitiale=
    texte(
      options.questionInitiale || baseQuestion,
      LIMITS.question
    );

  const reponseUtilisateur=
    texte(
      options.reponseUtilisateur || options.reponse,
      12000
    );

  const historique=
    texte(
      options.historique,
      24000
    );

  const contexte=detectContext(
    [
      questionInitiale,
      reponseUtilisateur,
      historique
    ].filter(Boolean).join("\n")
  );

  contexte.message=!!options.messageMode;

  const sources=selectSources(contexte);

  let orientation="";

  if(contexte.message){

    orientation=await askAI(
      env,
      messagePrompt(
        baseQuestion,
        options.messageMode,
        options.langue
      ),
      1200
    );

  }else{

    const intention=

      contexte.recepisse
        ? "Récépissé / démarche de séjour"

      : contexte.immigration
        ? "Séjour / immigration"

      : contexte.entreprise
        ? "Projet d'entreprise"

      : contexte.travail
        ? "Emploi / travail"

      : contexte.social
        ? "Aides sociales"

      : contexte.fiscalite
        ? "Fiscalité / cotisations"

      : contexte.juridique
        ? "Question juridique"

      : contexte.administratif
        ? "Démarche administrative"

      : "Orientation générale";


    const cadre=

      contexte.recepisse

      ? "La demande concerne un récépissé. Ne pas supposer la procédure. Faire progresser l'utilisateur avec une seule question à la fois. Ne jamais parler d'une demande de récépissé comme si le récépissé était nécessairement la demande principale."

      : "Identifier l'intention réelle et poser une seule question ciblée qui permet de réduire l'incertitude avant de donner une orientation précise.";


    orientation=await askAI(
      env,
      `
Intention détectée :
${intention}

Cadre :
${cadre}

Question initiale de l'utilisateur :
${questionInitiale}

Réponse actuelle de l'utilisateur :
${reponseUtilisateur||"(aucune réponse supplémentaire)"}

Historique utile :
${historique||"(aucun)"}

Contexte détecté :
${JSON.stringify(contexte)}

Preuves officielles disponibles :
${JSON.stringify(
  sources.map(
    s=>({
      titre:s.titre,
      organisme:s.organisme,
      preuves:s.preuves
    })
  )
)}

Réponds en français.

Reformule brièvement ce que tu as compris.

Ne répète pas la question qui vient d'être posée.

Si une information essentielle manque, prépare UNE SEULE question ciblée pour la prochaine étape.

Ne donne aucune conclusion juridique non vérifiée.
`,
      1100
    );


    if(!orientation){

      orientation=

        contexte.recepisse

        ? "Je comprends que vous cherchez à savoir quelle démarche effectuer concernant un récépissé. Pour avancer correctement, il faut d'abord déterminer la procédure de titre de séjour concernée."

        : "GouRare AI a identifié votre demande et va déterminer l'information nécessaire pour la prochaine étape.";
    }
  }


  const questionSuivante=nextAction(
    baseQuestion,
    contexte,
    {
      reponse:reponseUtilisateur,
      reponseUtilisateur,
      historique,
      etape:options.etape,
      questionInitiale
    }
  );


  const aVerifier=[];


  if(contexte.recepisse){

    const tout=
      (
        questionInitiale+
        " "+
        reponseUtilisateur+
        " "+
        historique
      ).toLowerCase();


    if(
      !/\b(oui|non|pas encore)\b/.test(tout) &&
      Number(options.etape)===0
    ){

      aVerifier.push(
        "Vérifier si une demande de titre de séjour a déjà été déposée."
      );
    }

    if(Number(options.etape)>=1){

      aVerifier.push(
        "Vérifier le type exact de procédure de séjour et l'état de la demande."
      );
    }
  }


  return {

    success:true,

    version:VERSION,

    compris:
      contexte.recepisse
      ? "Votre demande concerne un récépissé et une démarche liée à votre séjour en France."

      : contexte.message
      ? "Vous souhaitez analyser ou traiter un message ou un contenu fourni."

      : questionInitiale,

    orientation,

    confirmed:
      confirmed(
        questionInitiale+
        " "+
        reponseUtilisateur+
        " "+
        historique,
        contexte,
        sources
      ),

    toVerify:aVerifier,

    recommendations:
      recommendations(
        questionInitiale,
        contexte
      ),

    actions:
      actions(
        questionInitiale,
        contexte
      ),

    documents:
      documents(
        questionInitiale,
        contexte
      ),

    risks:[],

    professional:[],

    nextAction:questionSuivante,

    questionSuivante,

    sources:
      sources.map(
        s=>({
          id:s.id,
          titre:s.titre,
          organisme:s.organisme,
          url:s.url
        })
      )
  };
}


/* =========================
   PAGE
========================= */

function pageHTML(){

return `<!doctype html>
<html lang="fr">

<head>

<meta charset="utf-8">

<meta name="viewport"
content="width=device-width,initial-scale=1">

<meta name="theme-color"
content="#111827">

<title>GouRare AI</title>

<style>

*{
box-sizing:border-box
}

body{
margin:0;
font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
background:#f4f6f8;
color:#111827
}

header{
background:#111827;
color:white;
padding:28px 18px;
text-align:center
}

header h1{
margin:0 0 8px;
font-size:32px
}

header p{
margin:0;
opacity:.85
}

.container{
max-width:950px;
margin:25px auto;
padding:0 15px 80px
}

.card,.result-card{
background:white;
border-radius:18px;
padding:20px;
margin-bottom:18px;
box-shadow:0 8px 30px rgba(0,0,0,.07)
}

h2{
margin-top:0
}

.welcome{
text-align:center
}

.choices{
display:grid;
grid-template-columns:repeat(2,1fr);
gap:14px
}

.choice{
padding:22px 16px;
border:1px solid #e5e7eb;
border-radius:16px;
background:white;
text-align:left;
cursor:pointer
}

.choice strong{
display:block;
font-size:19px;
margin-bottom:7px
}

.choice span{
color:#6b7280
}

textarea,input,select{
width:100%;
padding:13px;
border:1px solid #d1d5db;
border-radius:11px;
font-size:16px;
background:white
}

textarea{
min-height:130px;
resize:vertical
}

button{
border:0;
border-radius:11px;
padding:12px 16px;
font-size:15px;
cursor:pointer;
background:#111827;
color:white
}

.secondary{
background:#e5e7eb;
color:#111827
}

.back{
margin-bottom:15px
}

.actions{
display:flex;
flex-wrap:wrap;
gap:10px;
margin-top:12px
}

.actions button{
flex:1
}

.result-card{
border-left:5px solid #111827
}

.ai-result{
white-space:pre-wrap;
line-height:1.65
}

.result-card ul{
padding-left:22px
}

.source{
padding:11px;
background:#f3f4f6;
border-radius:10px;
margin:8px 0
}

.source a{
color:#111827;
font-weight:600
}

.status{
margin-top:10px;
color:#4b5563
}

.hidden{
display:none
}

.cancer{
position:fixed;
right:12px;
bottom:12px;
background:white;
border:1px solid #e5e7eb;
padding:10px 13px;
border-radius:999px;
box-shadow:0 5px 20px rgba(0,0,0,.12);
font-size:13px;
z-index:20
}

footer{
text-align:center;
color:#6b7280;
padding:25px 10px
}

.question-suivante{
background:#eef2ff;
border:1px solid #c7d2fe;
padding:15px;
border-radius:12px;
font-weight:600
}

@media(max-width:650px){

.choices{
grid-template-columns:1fr
}

header h1{
font-size:27px
}

.actions button{
width:100%;
flex-basis:100%
}

}

</style>

</head>

<body>

<header>

<h1>GouRare AI</h1>

<p>Intelligence, orientation et solutions</p>

</header>

<div class="container">

<div id="parcours"
class="card welcome"></div>


<div id="assistant"
class="card hidden">

<button
class="secondary back"
id="retour">
← Retour
</button>

<h2 id="titreParcours"></h2>

<p id="descriptionParcours"></p>

<div id="situations"
class="choices"></div>

</div>


<div id="outil"
class="card hidden">

<button
class="secondary back"
id="retourOutil">
← Retour
</button>

<h2>🧠 Votre demande</h2>

<textarea
id="question"
placeholder="Expliquez votre situation..."></textarea>

<div class="actions">

<button id="analyser">
Analyser
</button>

<button
id="micro"
class="secondary">
🎙️ Parler
</button>

<button
id="photo"
class="secondary">
📷 Analyser une image
</button>

</div>

<div id="status"
class="status"></div>

<input
id="imageInput"
type="file"
accept="image/*"
capture="environment"
class="hidden">

</div>


<div id="messageCard"
class="card hidden">

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
style="margin-top:10px">

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

const parcours=
document.getElementById("parcours");

const assistant=
document.getElementById("assistant");

const outil=
document.getElementById("outil");

const messageCard=
document.getElementById("messageCard");

const situations=
document.getElementById("situations");

const titre=
document.getElementById("titreParcours");

const desc=
document.getElementById("descriptionParcours");

const question=
document.getElementById("question");

const result=
document.getElementById("result");

const status=
document.getElementById("status");

const messageMode=
document.getElementById("messageMode");

const langue=
document.getElementById("langue");

const imageInput=
document.getElementById("imageInput");


let profil=null;

let situation=null;

let historique=[];

let etape=0;

let mediaRecorder=null;

let audioChunks=[];

let recording=false;


function esc(v){

return String(v||"")
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");

}


function showHome(){

profil=null;

situation=null;

historique=[];

etape=0;

parcours.classList.remove("hidden");

assistant.classList.add("hidden");

outil.classList.add("hidden");

messageCard.classList.add("hidden");

result.innerHTML="";

parcours.innerHTML=

"<h2>👋 Bienvenue sur GouRare AI</h2>"+
"<p>Choisissez directement votre situation.</p>"+
"<div class='choices' id='profils'></div>"+
"<p style='margin-top:18px'>"+
"<button id='inconnu' class='secondary'>"+
"✨ Je ne sais pas où aller — GouRare AI m'oriente"+
"</button>"+
"</p>";

const p=
document.getElementById("profils");


Object.keys(${JSON.stringify(PARCOURS)})
.forEach(function(k){

const x=${JSON.stringify(PARCOURS)}[k];

p.innerHTML+=
"<div class='choice' data-p='"+k+"'>"+
"<strong>"+esc(x.titre)+"</strong>"+
"<span>"+esc(x.description)+"</span>"+
"</div>";

});


p.querySelectorAll(".choice")
.forEach(function(b){

b.onclick=function(){

openProfil(
b.dataset.p
);

};

});


document.getElementById("inconnu")
.onclick=function(){

openProfil("particulier");

question.value=
"Je ne sais pas quel parcours correspond à ma situation. Aidez-moi à m'orienter.";

outil.classList.remove("hidden");

messageCard.classList.add("hidden");

assistant.classList.add("hidden");

};

}


function openProfil(k){

profil=k;

const x=${JSON.stringify(PARCOURS)}[k];

parcours.classList.add("hidden");

outil.classList.add("hidden");

messageCard.classList.add("hidden");

assistant.classList.remove("hidden");

titre.textContent=x.titre;

desc.textContent=x.description;

situations.innerHTML="";


x.situations.forEach(function(item){

const b=document.createElement("div");

b.className="choice";

b.innerHTML=
"<strong>"+esc(item[1])+"</strong>";

b.dataset.s=item[0];

b.onclick=function(){

openSituation(
item[0],
item[1]
);

};

situations.appendChild(b);

});

}


function openSituation(s,label){

situation=s;

historique=[];

etape=0;

assistant.classList.add("hidden");

outil.classList.remove("hidden");

messageCard.classList.remove("hidden");

question.value="";

result.innerHTML="";

status.textContent=
"Parcours sélectionné : "+label;

messageMode.value="";

if(
s==="message" ||
s==="document"
){

messageMode.value="analyse";

}

}


document.getElementById("retour")
.onclick=showHome;


document.getElementById("retourOutil")
.onclick=function(){

outil.classList.add("hidden");

messageCard.classList.add("hidden");

assistant.classList.remove("hidden");

result.innerHTML="";

};


showHome();


async function analyserTexte(){

const q=question.value.trim();

if(!q){

status.textContent=
"Veuillez écrire ou dire votre demande.";

return;

}


status.textContent=
"Analyse en cours...";

result.innerHTML="";


try{

const premiere=
historique.length===0;


const questionInitiale=
premiere
?q
:historique[0].questionInitiale;


const reponseUtilisateur=
premiere
?""
:q;


const r=await fetch(
"/api/analyze",
{
method:"POST",

headers:{
"content-type":
"application/json"
},

body:JSON.stringify({

type:
messageMode.value
?"message"
:"question",

question:q,

questionInitiale,

reponseUtilisateur,

historique:
historique
.map(function(x){

return(
"Question initiale : "+
x.questionInitiale+
"\\nQuestion : "+
x.question+
"\\nRéponse utilisateur : "+
x.reponse+
"\\nQuestion suivante : "+
x.questionSuivante
);

})
.join("\\n\\n"),

profil,

situation,

etape,

messageMode:
messageMode.value||null,

langue:
langue.value.trim()

})

});


const d=await r.json();


if(!r.ok || !d.success){

throw new Error(
d.error||"Erreur."
);

}


historique.push({

questionInitiale,

question:q,

reponse:reponseUtilisateur,

questionSuivante:
d.questionSuivante||
d.nextAction||
""

});


etape++;

afficher(d);

question.value="";


status.textContent=
"Analyse terminée. Répondez à la question suivante pour continuer.";


}catch(e){

status.textContent=
e.message||"Erreur.";

}

}


function liste(a){

if(!a||!a.length){

return "<p>Aucun élément précis à présenter à ce stade.</p>";

}

return(
"<ul>"+
a.map(function(x){

const v=
typeof x==="string"
?x
:(x.texte||JSON.stringify(x));

return "<li>"+esc(v)+"</li>";

}).join("")+
"</ul>"
);

}


function afficher(d){

let h="";


h+=
"<div class='result-card'>"+
"<h2>🧭 Ce que j'ai compris</h2>"+
"<div class='ai-result'>"+
esc(d.compris)+
"</div>"+
"</div>";


h+=
"<div class='result-card'>"+
"<h2>💡 Orientation</h2>"+
"<div class='ai-result'>"+
esc(d.orientation)+
"</div>"+
"</div>";


h+=
"<div class='result-card'>"+
"<h2>✅ Informations confirmées</h2>"+
liste(d.confirmed)+
"</div>";


h+=
"<div class='result-card'>"+
"<h2>🔎 À vérifier</h2>"+
liste(d.toVerify)+
"</div>";


h+=
"<div class='result-card'>"+
"<h2>💭 Recommandations</h2>"+
liste(d.recommendations)+
"</div>";


h+=
"<div class='result-card'>"+
"<h2>📋 Actions concrètes</h2>"+
liste(d.actions)+
"</div>";


h+=
"<div class='result-card'>"+
"<h2>📄 Documents</h2>"+
(
d.documents&&d.documents.length
?liste(d.documents)
:"<p>Aucun document précis à présenter à ce stade.</p>"
)+
"</div>";


h+=
"<div class='result-card'>"+
"<h2>🚀 Prochaine action</h2>"+
"<div class='question-suivante'>"+
esc(d.nextAction)+
"</div>"+
"<p style='margin-bottom:0;color:#4b5563'>"+
"Répondez à cette question dans la zone ci-dessus, puis appuyez sur « Analyser » pour continuer."+
"</p>"+
"</div>";


h+=
"<div class='result-card'>"+
"<h2>📚 Sources consultées</h2>";


(d.sources||[])
.forEach(function(s){

h+=
"<div class='source'>"+
esc(s.organisme)+
" — "+
esc(s.titre)+
"<br>"+
"<a href='"+esc(s.url)+"' target='_blank' rel='noopener noreferrer'>"+
"Consulter la source officielle ↗"+
"</a>"+
"</div>";

});


h+="</div>";

result.innerHTML=h;

}


document.getElementById("analyser")
.onclick=analyserTexte;


document.getElementById("photo")
.onclick=function(){

imageInput.click();

};


imageInput.onchange=function(){

const f=
imageInput.files&&
imageInput.files[0];

if(!f)return;


if(!f.type.startsWith("image/")){

status.textContent=
"Veuillez sélectionner une image.";

return;

}


if(f.size>5500000){

status.textContent=
"Image trop volumineuse.";

return;

}


const rd=
new FileReader();


status.textContent=
"📷 Analyse de l'image...";


rd.onloadend=async function(){

try{

const r=await fetch(
"/api/image",
{
method:"POST",
headers:{
"content-type":
"application/json"
},
body:JSON.stringify({
image:rd.result,
demande:question.value.trim()
})
}
);


const d=await r.json();


if(!r.ok||!d.success){

throw new Error(
d.error||"Erreur image."
);

}


question.value=d.texte||"";

await analyserTexte();


}catch(e){

status.textContent=
e.message||"Erreur image.";

}

};


rd.readAsDataURL(f);

};


document.getElementById("micro")
.onclick=async function(){

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

status.textContent=
"Microphone indisponible.";

return;

}


try{

const stream=
await navigator.mediaDevices.getUserMedia(
{audio:true}
);


audioChunks=[];

mediaRecorder=
new MediaRecorder(stream);

recording=true;

this.textContent=
"⏹️ Arrêter";

status.textContent=
"🎙️ Je vous écoute...";


mediaRecorder.ondataavailable=
function(e){

if(e.data.size){

audioChunks.push(e.data);

}

};


mediaRecorder.onstop=
async function(){

recording=false;

document.getElementById("micro")
.textContent=
"🎙️ Parler";


stream
.getTracks()
.forEach(
t=>t.stop()
);


const blob=
new Blob(
audioChunks,
{
type:
mediaRecorder.mimeType||
"audio/webm"
}
);


const rd=
new FileReader();


rd.onloadend=
async function(){

try{

const r=await fetch(
"/api/transcribe",
{
method:"POST",
headers:{
"content-type":
"application/json"
},
body:JSON.stringify({
audio:rd.result,
langue:"fr"
})
}
);


const d=await r.json();


if(!r.ok||!d.success){

throw new Error(
d.error||"Erreur audio."
);

}


question.value=
d.text||"";


await analyserTexte();


}catch(e){

status.textContent=
e.message||"Erreur audio.";

}

};


rd.readAsDataURL(blob);

};


mediaRecorder.start();


}catch(e){

status.textContent=
"L'accès au microphone a été refusé ou est indisponible.";

}

};

</script>

</body>

</html>`;
}


/* =========================
   API
========================= */

async function handleAnalyze(request,env){

  if(
    !(request.headers.get("content-type")||"")
    .includes("application/json")
  ){

    return jsonResponse(
      {
        success:false,
        error:"Le contenu doit être envoyé au format JSON."
      },
      415
    );
  }

  let b;

  try{

    b=await request.json();

  }catch{

    return jsonResponse(
      {
        success:false,
        error:"JSON invalide."
      },
      400
    );
  }


  const q=
    texte(
      b.question,
      LIMITS.question
    );


  if(!q){

    return jsonResponse(
      {
        success:false,
        error:"Question vide."
      },
      400
    );
  }


  try{

    return jsonResponse(
      await analyserQuestion(
        env,
        q,
        {
          messageMode:
            b.type==="message"
            ?texte(b.messageMode,50)
            :null,

          langue:
            texte(b.langue,50),

          reponse:
            texte(b.reponse,12000),

          reponseUtilisateur:
            texte(b.reponseUtilisateur,12000),

          questionInitiale:
            texte(b.questionInitiale,12000),

          historique:
            texte(b.historique,24000),

          profil:
            texte(b.profil,100),

          situation:
            texte(b.situation,100),

          etape:
            Number.isFinite(Number(b.etape))
            ?Number(b.etape)
            :0
        }
      )
    );

  }catch(e){

    return jsonResponse(
      {
        success:false,
        error:e.message||"Erreur."
      },
      500
    );
  }
}


async function handleTranscribe(request,env){

  let b;

  try{

    b=await request.json();

  }catch{

    return jsonResponse(
      {
        success:false,
        error:"JSON invalide."
      },
      400
    );
  }


  try{

    const text=
      await transcrireAudio(
        env,
        texte(
          b.audio,
          LIMITS.audio
        ),
        texte(
          b.langue,
          10
        )||"fr"
      );


    if(!text){

      return jsonResponse(
        {
          success:false,
          error:"Aucun texte détecté."
        },
        422
      );
    }


    return jsonResponse(
      {
        success:true,
        text,
        version:VERSION
      }
    );


  }catch(e){

    return jsonResponse(
      {
        success:false,
        error:e.message||"Erreur audio."
      },
      500
    );
  }
}


async function handleImage(request,env){

  let b;

  try{

    b=await request.json();

  }catch{

    return jsonResponse(
      {
        success:false,
        error:"JSON invalide."
      },
      400
    );
  }


  try{

    const image=
      texte(
        b.image,
        LIMITS.image
      );


    if(!image){

      return jsonResponse(
        {
          success:false,
          error:"Image absente."
        },
        400
      );
    }


    return jsonResponse(
      {
        success:true,
        texte:
          await analyserImage(
            env,
            image,
            texte(
              b.demande,
              5000
            )
          ),
        version:VERSION
      }
    );


  }catch(e){

    return jsonResponse(
      {
        success:false,
        error:e.message||"Erreur image."
      },
      500
    );
  }
}


export default {

  async fetch(request,env){

    const url=
      new URL(request.url);


    if(request.method==="OPTIONS"){

      return new Response(
        null,
        {
          status:204,
          headers:securityHeaders()
        }
      );
    }


    if(url.pathname==="/health"){

      return new Response(
        JSON.stringify({
          success:true,
          service:"GouRare AI",
          status:"OK",
          version:VERSION,

          modules:{
            texte:true,
            parcours:true,
            messages:true,
            image:true,
            voix:true,
            moteurDeVerite:true
          }
        }),
        {
          headers:{
            ...securityHeaders(),
            "content-type":
              "application/json; charset=utf-8"
          }
        }
      );
    }


    if(url.pathname==="/api/analyze"){

      if(request.method!=="POST"){

        return jsonResponse(
          {
            success:false,
            error:"Méthode non autorisée."
          },
          405
        );
      }


      const r=
        await handleAnalyze(
          request,
          env
        );


      const h=
        new Headers(
          r.headers
        );


      Object.entries(
        securityHeaders()
      ).forEach(
        ([k,v])=>h.set(k,v)
      );


      return new Response(
        r.body,
        {
          status:r.status,
          headers:h
        }
      );
    }


    if(url.pathname==="/api/transcribe"){

      if(request.method!=="POST"){

        return jsonResponse(
          {
            success:false,
            error:"Méthode non autorisée."
          },
          405
        );
      }

      return handleTranscribe(
        request,
        env
      );
    }


    if(url.pathname==="/api/image"){

      if(request.method!=="POST"){

        return jsonResponse(
          {
            success:false,
            error:"Méthode non autorisée."
          },
          405
        );
      }

      return handleImage(
        request,
        env
      );
    }


    if(url.pathname==="/"){

      return new Response(
        pageHTML(),
        {
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
        status:404,
        headers:securityHeaders()
      }
    );

  }

};
