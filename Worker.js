const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const MODEL_VISION = "@cf/meta/llama-3.2-11b-vision-instruct";
const MODEL_AUDIO = "@cf/openai/whisper-large-v3-turbo";
const VERSION = "8.8";

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
  return String(v).replace(/\u0000/g,"").replace(/\r/g,"").trim().slice(0,max);
}
function unique(a){return [...new Set((a||[]).filter(Boolean))];}
function escapeHTML(v){return texte(v,50000).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
function jsonResponse(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
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
   PARCOURS D'ACCUEIL V8.2
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


function extraireInformations(q){
  const s=texte(q,12000);
  const l=s.toLowerCase();
  const informations=[];
  const ajouter=(type,val)=>{if(val&&!informations.some(x=>x.type===type))informations.push({type,valeur:val});};

  const nationalites={
    tunisien:"tunisienne",tunisienne:"tunisienne",algérien:"algérienne",algerien:"algérienne",algérienne:"algérienne",
    marocain:"marocaine",marocaine:"marocaine",algérien:"algérienne",algérienne:"algérienne",
    sénégalais:"sénégalaise",senegalais:"sénégalaise",ivoirien:"ivoirienne",ivoirienne:"ivoirienne"
  };
  for(const [mot,forme] of Object.entries(nationalites)){
    if(new RegExp("\\b"+mot+"\\b","i").test(l)){ajouter("nationalité",forme);break;}
  }

  const dateMatch=l.match(/(?:depuis|en|à partir de|a partir de)\s+(?:début|debut|fin|mi-)?\s*(20\d{2})(?:|\s+)?/i);
  if(dateMatch) ajouter("arrivée en France",dateMatch[0].trim());
  const mois=l.match(/(?:janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+20\d{2}/i);
  if(mois) ajouter("date d'arrivée",mois[0]);
  if(/\b(visa|visa long séjour|visa long sejour)\b/.test(l)) ajouter("visa","présence d'un visa mentionnée");
  if(/\b(je travaille|je travaille actuellement|je suis salarié|je suis salarie|j'ai un travail|j ai un travail|emploi actuel)\b/.test(l)) ajouter("travail","travail actuel mentionné");
  if(/\b(hébergé|heberge|hébergée|hebergement|hébergement|chez mon frère|chez mon frere|chez ma sœur|chez ma soeur)\b/.test(l)) ajouter("logement","hébergement mentionné");
  if(/\b(oui|j'ai déjà déposé|j ai deja depose|déjà déposé|deja depose|demande déposée|demande deposee)\b/.test(l)&&/\b(anef|préfecture|prefecture|titre de séjour|titre de sejour|demande)\b/.test(l)) ajouter("dépôt","une demande déjà déposée est mentionnée");
  if(/\b(non|pas encore|jamais)\b/.test(l)&&/\b(déposé|depose|demande|titre de séjour|titre de sejour)\b/.test(l)) ajouter("dépôt","aucun dépôt n'est mentionné ou le dépôt est nié");
  if(/\b(travail|emploi|salarié|salarie)\b/.test(l)&&/\b(titre de séjour|titre de sejour|séjour|sejour)\b/.test(l)) ajouter("motif","travail");
  if(/\b(études|etudes|étudier|etudier|étudiant|etudiant)\b/.test(l)) ajouter("motif","études");
  if(/\b(famille|conjoint|époux|epoux|épouse|epouse|regroupement familial)\b/.test(l)) ajouter("motif","famille");
  if(/\b(asile|protection internationale)\b/.test(l)) ajouter("motif","asile / protection");
  if(/\b(démarches de séjour|demarches de sejour|démarche de séjour|demarche de sejour|titre de séjour|titre de sejour|carte de séjour|carte de sejour|récépissé|recepisse)\b/.test(l)) ajouter("objectif","démarches liées au séjour");
  return informations;
}

function resumeSituation(q,options={}){
  const infos=extraireInformations([q,options.reponseUtilisateur,options.historique].filter(Boolean).join("\n"));
  if(!infos.length)return texte(q);
  const morceaux=infos.map(x=>x.type+" : "+x.valeur);
  return "J'ai identifié les éléments suivants : "+morceaux.join(" ; ")+".";
}

function prochaineQuestion(q,c,options={}){
  const base=texte(options.questionInitiale||q,12000).toLowerCase();
  const reponse=texte(options.reponseUtilisateur||options.reponse,12000).toLowerCase();
  const etape=Number(options.etape)||0;
  if(c.recepisse){
    if(etape===0 && !reponse) return "Avez-vous déjà déposé une demande de titre de séjour auprès de l’ANEF ou de la préfecture ?";
    if(/\b(oui|yes)\b/.test(reponse)) return "Quel type de demande de titre de séjour avez-vous déjà déposé : première demande, renouvellement, changement de situation, demande d’asile ou autre ?";
    if(/\b(non|pas encore)\b/.test(reponse)) return "Pour quel motif souhaitez-vous demander un titre de séjour : travail, famille, études, autre motif, ou vous ne savez pas encore ?";
    if(etape===2) return "Avez-vous reçu un document après votre démarche (récépissé, attestation, confirmation ANEF ou autre) ?";
    if(etape>=3) return "Quel est votre objectif maintenant : obtenir ou renouveler votre titre, pouvoir travailler, suivre votre dossier, ou résoudre un problème administratif ?";
    return "Avez-vous déjà déposé une demande de titre de séjour auprès de l’ANEF ou de la préfecture ?";
  }
  if(c.immigration){
    const infos=extraireInformations([base,reponse,options.historique||""].join("\n"));
    const aDejaDepose=infos.some(x=>x.type==="dépôt"&&x.valeur.includes("déposée"));
    const pasDeDepot=infos.some(x=>x.type==="dépôt"&&x.valeur.includes("aucun"));
    if(etape===0 && !aDejaDepose && !pasDeDepot) return "Avez-vous déjà déposé une demande de titre de séjour auprès de l’ANEF ou de la préfecture ?";
    if(etape===0 && pasDeDepot) return "Pour quel motif souhaitez-vous demander un titre de séjour : travail, famille, études, autre motif, ou vous ne savez pas encore ?";
    if(etape===0 && aDejaDepose) return "Quel type de demande de titre de séjour avez-vous déjà déposé ?";
    if(etape>=1 && /\b(oui|yes)\b/.test(reponse)) return "Quel type de demande de titre de séjour avez-vous déjà déposé ?";
    return "Quelle est la prochaine démarche ou le principal problème que vous souhaitez résoudre concernant votre séjour ?";
  }
  if(c.entreprise && !c.statut) return etape===0 ? "Quelle activité ou quels services souhaitez-vous proposer ?" : "Avez-vous déjà choisi une forme juridique ou souhaitez-vous que GouRare AI vous aide à la comparer ?";
  if(c.entreprise && c.statut) return "Avez-vous déjà commencé les formalités de création de l’entreprise ?";
  if(c.travail) return etape===0 ? "Quel est votre objectif principal : trouver un emploi, comprendre votre contrat, ou résoudre un problème avec votre employeur ?" : "Quel type de poste ou de situation professionnelle recherchez-vous exactement ?";
  if(c.social) return "Quelle aide ou quelle situation sociale souhaitez-vous comprendre exactement ?";
  if(c.administratif) return "Quelle démarche administrative devez-vous effectuer exactement ?";
  return "Quel est le résultat que vous souhaitez obtenir exactement ?";
}

function progression(q,c,options={}){
  const historique=texte(options.historique,24000);
  const reponse=texte(options.reponse,12000);
  const base=[q,reponse,historique].filter(Boolean).join("\n");
  const nouveau=detectContext(base);
  nouveau.message=!!options.messageMode;
  return {contexte: nouveau, historique: base};
}

function selectSources(c){
  const ids=[];
  if(c.immigration){
    ids.push("anef");
    if(c.travail)ids.push("travail_etranger");
  }
  if(c.entreprise||c.statut)ids.push("statut");
  if(c.entreprise&&c.statut)ids.push("creation_ei");
  if(c.entreprise)ids.push("guichet");
  return unique(ids).map(id=>SOURCES[id]);
}

function confirmed(q,c,sources,informations=[]){
  const out=[];
  for(const info of informations){
    if(["nationalité","arrivée en France","date d'arrivée","objectif","motif","visa","travail","logement"].includes(info.type)) out.push(info.type+" : "+info.valeur);
  }
  if(c.immigration&&sources.some(s=>s.id==="anef"))
    out.push("La demande concerne une démarche liée au séjour ou à la situation administrative d'un étranger en France.");
  if(c.recepisse)
    out.push("Le mot « récépissé » est bien identifié comme l'objet principal de la demande, mais son rôle exact dépend de la procédure engagée.");
  if(c.entreprise&&sources.some(s=>s.id==="statut"))
    out.push("Le choix de la forme juridique peut être étudié en fonction de l'activité envisagée, du chiffre d'affaires estimé, des revenus, de la couverture sociale et de la gestion.");
  if(c.statut&&/entreprise individuelle|\bei\b|micro|micro-entreprise|microentreprise/.test(q.toLowerCase())&&sources.some(s=>s.id==="creation_ei")){
    out.push("Pour une entreprise individuelle, certaines formalités d'immatriculation et de déclaration d'activité sont prévues.");
    out.push("La demande d'immatriculation d'une entreprise individuelle se fait sur le Guichet des formalités des entreprises.");
  }
  return unique(out);
}
function actions(c){
  const out=[];
  if(c.immigration){
    out.push("Identifier précisément la procédure de séjour correspondant à votre situation.");
    out.push("Vérifier la démarche applicable sur la source officielle avant d'effectuer une démarche.");
  }
  if(c.entreprise){
    out.push("Identifier précisément l'activité et la forme juridique envisagée.");
    out.push("Vérifier les formalités officielles correspondant à l'activité.");
  }
  if(c.travail){
    out.push("Préciser le type de poste ou la situation professionnelle concernée.");
  }
  if(!out.length) out.push("Préciser la situation et l'objectif afin de déterminer l'action adaptée.");
  return unique(out);
}

function recommendations(c){
  const out=[];
  if(c.immigration)
    out.push("Ne pas choisir une procédure de séjour uniquement à partir d'une information générale : vérifier la situation personnelle et la procédure officielle applicable.");
  if(c.entreprise)
    out.push("Comparer les formes juridiques et les obligations avant de finaliser la création.");
  if(c.travail)
    out.push("Vérifier les conditions liées au poste et à la situation professionnelle avant de candidater ou de signer.");
  if(!out.length)
    out.push("Continuer l'analyse avec les informations qui manquent.");
  return unique(out);
}

function documents(c){
  const out=[];
  if(c.immigration)
    out.push("Les documents nécessaires dépendent de la procédure exacte, de la nationalité et de la situation personnelle.");
  if(c.entreprise)
    out.push("Les documents nécessaires dépendent de l'activité et de la forme juridique choisie.");
  if(!out.length)
    out.push("Aucun document précis à présenter à ce stade.");
  return unique(out);
}

function buildNextAction(q,c,options={}){
  const informations=extraireInformations(
    [q,options.reponseUtilisateur,options.historique].filter(Boolean).join("\n")
  );

  if(c.recepisse){
    const depot=informations.find(x=>x.type==="dépôt");
    if(!depot)
      return "Répondre à la question sur une éventuelle demande de titre de séjour déjà déposée.";

    if(depot.valeur.includes("aucun"))
      return "Préciser le motif de la demande de titre de séjour afin d'identifier la procédure adaptée.";

    return "Préciser le type de demande déjà déposée afin de vérifier la procédure et le document correspondant.";
  }

  if(c.immigration){
    if(!informations.some(x=>x.type==="dépôt"))
      return "Déterminer si une demande de titre de séjour a déjà été déposée.";
    return "Vérifier la procédure officielle correspondant exactement à la situation.";
  }

  if(c.entreprise && !c.statut)
    return "Préciser l'activité et les prestations envisagées, puis comparer les formes juridiques adaptées.";

  if(c.entreprise && c.statut)
    return "Vérifier les formalités officielles correspondant exactement à la forme juridique et à l'activité choisies.";

  if(c.travail)
    return "Préciser le poste ou la situation professionnelle afin de déterminer la prochaine action utile.";

  return "Préciser votre situation et votre objectif afin de déterminer la prochaine action utile.";
}

function systemPrompt(q,c,sources,informations,questionSuivante){
  return `
Tu es GouRare AI, une plateforme intelligente d'orientation multi-domaines.

OBJECTIF PRINCIPAL :
Comprendre la situation réelle de l'utilisateur avant de l'orienter.

RÈGLES ABSOLUES :

1. Analyse toute la demande utilisateur.
2. Une seule phrase peut contenir plusieurs informations.
3. Extrais toutes les informations clairement présentes.
4. Ne redemande JAMAIS une information déjà donnée.
5. Ne suppose JAMAIS une information qui n'a pas été donnée.
6. Pose UNE SEULE question à la fois.
7. La question doit être la plus utile pour réduire l'incertitude.
8. Si l'utilisateur donne plusieurs nouvelles informations dans sa réponse, mets à jour la compréhension avant de poser la prochaine question.
9. Ne recommence jamais le parcours depuis le début.
10. Pour immigration, droit, fiscalité et démarches administratives, ne présente pas une hypothèse comme une certitude.
11. Utilise les sources officielles fournies.
12. Ne fabrique aucune règle juridique.
13. GouRare AI est une plateforme d'orientation et ne prétend pas remplacer un avocat, un comptable ou un autre professionnel réglementé.
14. Réponds en français.
15. Si une information essentielle manque, demande-la avec une seule question courte.

DEMANDE INITIALE :
${texte(q)}

CONTEXTE DÉTECTÉ :
${JSON.stringify(c)}

INFORMATIONS EXTRAITES :
${JSON.stringify(informations)}

SOURCES OFFICIELLES DISPONIBLES :
${JSON.stringify(sources)}

QUESTION SUIVANTE PRÉVUE :
${questionSuivante}

FORMAT DE RÉPONSE :

🧭 Ce que j'ai compris
Explique brièvement la situation en reprenant les informations réellement données.

💡 Orientation
Explique ce que la situation semble nécessiter, sans inventer.

✅ Informations confirmées
Liste uniquement les éléments réellement présents dans la demande ou confirmés.

🔎 À vérifier
Liste les éléments qui doivent encore être vérifiés ou précisés.

💭 Recommandations
Donne uniquement des recommandations prudentes et utiles.

📋 Actions concrètes
Donne les actions qui peuvent être envisagées à ce stade.

📄 Documents
Indique les documents uniquement lorsqu'ils sont pertinents. Ne fabrique pas de liste de documents.

🚀 Prochaine action
Explique clairement ce que l'utilisateur doit faire maintenant.

❓ Question suivante
Pose UNE SEULE question.
`;
}

async function callAI(env,prompt,maxTokens=1200){
  const result=await env.IA.run(MODEL,{
    messages:[
      {
        role:"system",
        content:"Tu es GouRare AI. Tu réponds avec précision, prudence et clarté. Tu ne fabriques jamais une information juridique ou administrative."
      },
      {
        role:"user",
        content:prompt
      }
    ],
    max_tokens:maxTokens,
    temperature:0.2
  });

  return result?.response || result?.result?.response || "";
}

async function analyserQuestion(env,q,options={}){
  const question=texte(q,LIMITS.question);

  if(!question){
    return {
      ok:false,
      erreur:"Veuillez expliquer votre situation."
    };
  }

  const progressionResult=progression(question,detectContext(question),{
    ...options,
    reponse:options.reponseUtilisateur||""
  });

  const c=progressionResult.contexte;
  const informations=extraireInformations([
    question,
    options.reponseUtilisateur||"",
    options.historique||""
  ].filter(Boolean).join("\n"));

  const sources=selectSources(c);

  const questionSuivante=prochaineQuestion(question,c,{
    ...options,
    historique:options.historique||"",
    reponseUtilisateur:options.reponseUtilisateur||""
  });

  const confirmees=confirmed(question,c,sources,informations);
  const recommandation=recommendations(c);
  const actionsConcretes=actions(c);
  const documentsNecessaires=documents(c);
  const prochaineAction=buildNextAction(question,c,{
    ...options,
    historique:options.historique||"",
    reponseUtilisateur:options.reponseUtilisateur||""
  });

  const prompt=systemPrompt(
    question,
    c,
    sources,
    informations,
    questionSuivante
  );

  let ia="";
  try{
    ia=await callAI(env,prompt,1400);
  }catch(error){
    ia="";
  }

  return {
    ok:true,
    version:VERSION,
    question,
    contexte:c,
    informations,
    compris:ia||resumeSituation(question,{reponseUtilisateur:options.reponseUtilisateur}),
    orientation:ia||"Une analyse complémentaire est nécessaire.",
    confirmees,
    aVerifier:questionSuivante
      ? ["La procédure exacte doit encore être déterminée à partir de votre réponse."]
      : [],
    recommandations:recommandation,
    actions:actionsConcretes,
    documents:documentsNecessaires,
    prochaineAction,
    questionSuivante,
    sources
  };
}

/* =========================
   ANALYSE IMAGE
========================= */

async function analyserImage(env,request){
  try{
    const body=await request.arrayBuffer();

    if(body.byteLength>LIMITS.image)
      return jsonResponse({ok:false,erreur:"Image trop volumineuse."},413);

    const result=await env.IA.run(MODEL_VISION,{
      image:Array.from(new Uint8Array(body)),
      messages:[
        {
          role:"user",
          content:"Analyse cette image. S'il s'agit d'un document, explique clairement ce qu'il contient sans inventer les informations illisibles. Si une information est incertaine, indique-le."
        }
      ],
      max_tokens:1200
    });

    return jsonResponse({
      ok:true,
      analyse:result?.response||result?.result?.response||"Aucune analyse disponible."
    });
  }catch(error){
    return jsonResponse({
      ok:false,
      erreur:"Impossible d'analyser cette image."
    },500);
  }
}

/* =========================
   TRANSCRIPTION AUDIO
========================= */

async function transcrireAudio(env,request){
  try{
    const body=await request.arrayBuffer();

    if(body.byteLength>LIMITS.audio)
      return jsonResponse({ok:false,erreur:"Audio trop volumineux."},413);

    const result=await env.IA.run(MODEL_AUDIO,{
      audio:Array.from(new Uint8Array(body))
    });

    return jsonResponse({
      ok:true,
      transcription:result?.text||result?.response||""
    });
  }catch(error){
    return jsonResponse({
      ok:false,
      erreur:"Impossible de transcrire cet audio."
    },500);
  }
}

/* =========================
   PAGE HTML
========================= */

function pageHTML(){
return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>GouRare AI</title>

<style>
*{box-sizing:border-box}

body{
  margin:0;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;
  background:#f5f7fb;
  color:#172033;
}

header{
  background:#111827;
  color:white;
  padding:22px 18px;
  text-align:center;
}

header h1{
  margin:0;
  font-size:28px;
}

header p{
  margin:7px 0 0;
  opacity:.82;
}

main{
  max-width:900px;
  margin:auto;
  padding:20px;
}

.card{
  background:white;
  border-radius:18px;
  padding:20px;
  margin-bottom:16px;
  box-shadow:0 8px 30px rgba(0,0,0,.06);
}

textarea{
  width:100%;
  min-height:150px;
  padding:15px;
  border:1px solid #d8deea;
  border-radius:14px;
  resize:vertical;
  font-size:16px;
}

button{
  border:0;
  border-radius:12px;
  padding:13px 17px;
  margin:6px 4px 0 0;
  background:#111827;
  color:white;
  font-size:15px;
  cursor:pointer;
}

button.secondary{
  background:#e9edf5;
  color:#172033;
}

button:disabled{
  opacity:.5;
}

.section{
  margin-top:18px;
  padding-top:15px;
  border-top:1px solid #edf0f5;
}

.section h3{
  margin:0 0 8px;
}

ul{
  padding-left:22px;
}

.source{
  padding:12px;
  background:#f7f9fc;
  border-radius:12px;
  margin:8px 0;
}

.source a{
  color:#2563eb;
  text-decoration:none;
}

.badgeCancer{
  position:fixed;
  right:12px;
  bottom:12px;
  background:white;
  border:1px solid #e3e7ef;
  box-shadow:0 5px 20px rgba(0,0,0,.08);
  padding:9px 12px;
  border-radius:999px;
  font-size:13px;
}

footer{
  text-align:center;
  padding:30px 15px 80px;
  color:#667085;
  font-size:13px;
}

.hidden{
  display:none;
}

.loading{
  opacity:.65;
}
</style>
</head>

<body>

<header>
<h1>GouRare AI</h1>
<p>Intelligence, orientation et solutions</p>
</header>

<main>

<div id="accueil" class="card">
<h2>👋 Bienvenue sur GouRare AI</h2>
<p>Choisissez directement votre situation.</p>

<button onclick="choisirProfil('migrant')">🌍 Migrant / Nouveau arrivant</button>
<button onclick="choisirProfil('particulier')">👤 Particulier / Résident</button>
<button onclick="choisirProfil('emploi')">💼 Chercheur d'emploi</button>
<button onclick="choisirProfil('entreprise')">🏢 Entreprise / Entrepreneur</button>

<button class="secondary" onclick="choisirProfil('autre')">
✨ Je ne sais pas où aller — GouRare AI m'oriente
</button>
</div>

<div id="profil" class="card hidden">
<button class="secondary" onclick="retourAccueil()">← Retour</button>

<h2 id="titreProfil"></h2>
<p id="descriptionProfil"></p>

<div id="situations"></div>
</div>

<div id="question" class="card hidden">

<button class="secondary" onclick="retourProfil()">← Retour</button>

<h2>🧠 Votre demande</h2>

<textarea id="questionTexte"
placeholder="Expliquez votre situation..."></textarea>

<div>
<button onclick="analyser()">Analyser</button>
<button class="secondary" onclick="demarrerVoix()">🎙️ Parler</button>
<button class="secondary" onclick="document.getElementById('imageInput').click()">📷 Analyser une image</button>
<input id="imageInput" type="file" accept="image/*" class="hidden" onchange="analyserImageClient(this)">
</div>

<p id="etat"></p>

<div class="section">
<h3>✉️ Messages et emails</h3>

<select id="modeMessage">
<option value="">Mode normal</option>
<option value="reponse">Répondre à un message</option>
<option value="reformulation">Reformuler</option>
<option value="correction">Corriger</option>
</select>

<br>

<select id="langue">
<option value="français">Langue souhaitée pour une traduction (français, arabe, anglais)</option>
<option value="français">Français</option>
<option value="arabe">Arabe</option>
<option value="anglais">Anglais</option>
</select>
</div>

</div>

<div id="resultat" class="card hidden"></div>

</main>

<div class="badgeCancer">🎗️ Avec vous contre le cancer</div>

<footer>
<div>🎗️ Notre soutien aux personnes touchées par le cancer.</div>
<br>
GouRare AI — Version ${VERSION}
</footer>

<script>
let profilActuel="";
let situationActuelle="";
let historique="";
let etape=0;
let questionInitiale="";
let attenteQuestion=false;

const profils=${JSON.stringify(PARCOURS)};

function esc(v){
  return String(v??"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function afficher(id,visible=true){
  const el=document.getElementById(id);
  if(el)el.classList.toggle("hidden",!visible);
}

function choisirProfil(profil){

  profilActuel=profil;

  afficher("accueil",false);
  afficher("profil",true);

  if(profil==="autre"){
    document.getElementById("titreProfil").textContent="✨ GouRare AI";
    document.getElementById("descriptionProfil").textContent="Expliquez simplement votre situation.";
    document.getElementById("situations").innerHTML=
      '<button onclick="ouvrirQuestion()">Commencer</button>';
    return;
  }

  const p=profils[profil];

  document.getElementById("titreProfil").textContent=p.titre;
  document.getElementById("descriptionProfil").textContent=p.description;

  document.getElementById("situations").innerHTML=
    p.situations.map(x=>
      '<button onclick="choisirSituation(\\''+
      esc(x[0])+
      '\\')">'+
      esc(x[1])+
      '</button>'
    ).join("");
}

function choisirSituation(situation){
  situationActuelle=situation;
  ouvrirQuestion();
}

function ouvrirQuestion(){

  afficher("profil",false);
  afficher("question",true);

  document.getElementById("questionTexte").focus();
}

function retourAccueil(){
  afficher("profil",false);
  afficher("question",false);
  afficher("resultat",false);
  afficher("accueil",true);
}

function retourProfil(){
  afficher("question",false);
  afficher("resultat",false);
  afficher("profil",true);
}

function afficherListe(titre,liste){
  if(!liste||!liste.length)return "";
  return '<div class="section"><h3>'+esc(titre)+'</h3><ul>'+
    liste.map(x=>'<li>'+esc(x)+'</li>').join("")+
    '</ul></div>';
}

function afficherSources(sources){
  if(!sources||!sources.length)return "";

  return '<div class="section"><h3>📚 Sources consultées</h3>'+
    sources.map(s=>
      '<div class="source">'+
      '<strong>'+esc(s.organisme)+'</strong><br>'+
      esc(s.titre)+'<br>'+
      '<a href="'+esc(s.url)+'" target="_blank" rel="noopener">Consulter la source officielle ↗️</a>'+
      '</div>'
    ).join("")+
    '</div>';
}

function afficherResultat(data){

  const el=document.getElementById("resultat");

  const compris=
    data.compris ||
    data.orientation ||
    "Analyse terminée.";

  el.innerHTML=
    '<button class="secondary" onclick="retourQuestion()">← Retour</button>'+
    '<div class="section"><h3>🧭 Ce que j’ai compris</h3><p>'+
    esc(compris)+'</p></div>'+
    afficherListe("💡 Orientation",[data.orientation||"Analyse en cours."])+
    afficherListe("✅ Informations confirmées",data.confirmees)+
    afficherListe("🔎 À vérifier",data.aVerifier)+
    afficherListe("💭 Recommandations",data.recommandations)+
    afficherListe("📋 Actions concrètes",data.actions)+
    afficherListe("📄 Documents",data.documents)+
    afficherListe("🚀 Prochaine action",[data.prochaineAction])+
    (data.questionSuivante?
      '<div class="section">'+
      '<h3>❓ Question suivante</h3>'+
      '<p><strong>'+esc(data.questionSuivante)+'</strong></p>'+
      '<button onclick="continuerAvecQuestion()">Répondre</button>'+
      '</div>'
      :"")+
    afficherSources(data.sources);

  afficher("question",false);
  afficher("resultat",true);

  if(data.questionSuivante){
    attenteQuestion=true;
  }else{
    attenteQuestion=false;
  }

  window.scrollTo({top:0,behavior:"smooth"});
}

function retourQuestion(){
  afficher("resultat",false);
  afficher("question",true);
}

function continuerAvecQuestion(){

  const q=document.getElementById("questionTexte");

  q.value="";

  afficher("resultat",false);
  afficher("question",true);

  q.focus();

  etape++;
}

async function analyser(){

  const zone=document.getElementById("questionTexte");
  const q=zone.value.trim();

  if(!q){
    zone.focus();
    return;
  }

  const etat=document.getElementById("etat");

  etat.textContent="Analyse en cours...";
  etat.classList.add("loading");

  if(!questionInitiale)
    questionInitiale=q;

  const reponseUtilisateur=
    attenteQuestion && historique ?
    q :
    "";

  try{

    const response=await fetch("/api/analyze",{
      method:"POST",
      headers:{
        "content-type":"application/json"
      },
      body:JSON.stringify({
        question:q,
        profil:profilActuel,
        situation:situationActuelle,
        questionInitiale,
        reponseUtilisateur,
        historique,
        etape
      })
    });

    const data=await response.json();

    if(!response.ok||!data.ok){
      throw new Error(data.erreur||"Erreur");
    }

    historique=
      (historique?
        historique+"\\n":
        "")+
      "Utilisateur : "+q+
      "\\nGouRare AI : "+(data.questionSuivante||"Analyse");

    afficherResultat(data);

    zone.value="";
    etat.textContent="Analyse terminée.";

  }catch(error){

    etat.textContent=
      "Une erreur est survenue. Veuillez réessayer.";

  }finally{
    etat.classList.remove("loading");
  }
}

async function analyserImageClient(input){

  const fichier=input.files&&input.files[0];

  if(!fichier)return;

  const etat=document.getElementById("etat");

  etat.textContent="Analyse de l'image en cours...";

  try{

    const response=await fetch("/api/image",{
      method:"POST",
      headers:{
        "content-type":fichier.type||"application/octet-stream"
      },
      body:await fichier.arrayBuffer()
    });

    const data=await response.json();

    if(!data.ok)
      throw new Error(data.erreur||"Erreur");

    document.getElementById("questionTexte").value=
      data.analyse||"";

    etat.textContent="Image analysée.";

  }catch(error){

    etat.textContent=
      "Impossible d'analyser cette image.";

  }

  input.value="";
}

async function demarrerVoix(){

  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){

    alert("La fonction audio n'est pas disponible sur cet appareil.");
    return;
  }

  alert("La fonction audio peut être utilisée lorsque le navigateur autorise le microphone.");
}
</script>

</body>
</html>`;
}

/* =========================
   ROUTEUR API
========================= */

export default {
  async fetch(request,env){

    const url=new URL(request.url);

    if(request.method==="OPTIONS"){
      return new Response(null,{
        status:204,
        headers:securityHeaders()
      });
    }

    if(url.pathname==="/health"){
      return jsonResponse({
        ok:true,
        service:"GouRare AI",
        version:VERSION
      });
    }

    if(url.pathname==="/api/analyze" && request.method==="POST"){

      try{

        const body=await request.json();

        const question=texte(body.question,LIMITS.question);

        if(!question)
          return jsonResponse({
            ok:false,
            erreur:"Veuillez expliquer votre situation."
          },400);

        const result=await analyserQuestion(env,question,{
          profil:body.profil,
          situation:body.situation,
          questionInitiale:body.questionInitiale||"",
          reponseUtilisateur:body.reponseUtilisateur||"",
          historique:body.historique||"",
          etape:body.etape||0,
          messageMode:body.messageMode||""
        });

        return jsonResponse(result);

      }catch(error){

        return jsonResponse({
          ok:false,
          erreur:"Impossible d'analyser la demande pour le moment."
        },500);
      }
    }

    if(url.pathname==="/api/image" && request.method==="POST"){
      return analyserImage(env,request);
    }

    if(url.pathname==="/api/transcribe" && request.method==="POST"){
      return transcrireAudio(env,request);
    }

    if(url.pathname==="/"){
      return new Response(pageHTML(),{
        headers:{
          ...securityHeaders(),
          "content-type":"text/html; charset=utf-8"
        }
      });
    }

    return jsonResponse({
      ok:false,
      erreur:"Route introuvable."
    },404);
  }
};
