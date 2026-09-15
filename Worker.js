const MODEL="@cf/meta/llama-3.1-8b-instruct-fast";
const MODEL_VISION="@cf/meta/llama-3.2-11b-vision-instruct";
const MODEL_AUDIO="@cf/openai/whisper-large-v3-turbo";
const VERSION="9.3";

const LIMITS={
  question:12000,
  image:5500000,
  audio:12000000,
  historique:24000
};

const RATE_LIMITS={
  analyze:{windowMs:60000,maxRequests:20},
  image:{windowMs:60000,maxRequests:6},
  transcribe:{windowMs:60000,maxRequests:6}
};

const RATE_STORE_MAX_KEYS=5000;
const rateStore=new Map();

const SOURCES={
  anef:{
    id:"anef",
    titre:"Faire une demande en ligne pour un titre de séjour ou un changement de situation",
    organisme:"Service-Public.fr / ANEF",
    url:"https://www.service-public.fr/particuliers/vosdroits/R59398",
    preuves:[
      "L’ANEF permet de réaliser certaines démarches concernant les titres de séjour et certains changements de situation.",
      "La démarche applicable dépend du type de demande et de la situation de la personne."
    ]
  },

  travail_etranger:{
    id:"travail_etranger",
    titre:"Autorisation de travail d'un salarié étranger en France",
    organisme:"Service-Public.fr",
    url:"https://www.service-public.fr/particuliers/vosdroits/F2728",
    preuves:[
      "Les règles de travail dépendent notamment du document de séjour détenu et de la situation de la personne.",
      "Dans certaines situations, un récépissé peut comporter une mention relative à l'autorisation de travailler."
    ]
  },

  statut:{
    id:"statut",
    titre:"Trouver le statut juridique adapté à son activité",
    organisme:"Service Public Entreprendre",
    url:"https://entreprendre.service-public.fr/vosdroits/R18323",
    preuves:[
      "Le simulateur permet de trouver le statut juridique adapté à son activité.",
      "Il permet de comparer les formes juridiques possibles selon le projet."
    ]
  },

  guichet:{
    id:"guichet",
    titre:"Formalités d'immatriculation des entreprises",
    organisme:"Service Public Entreprendre",
    url:"https://entreprendre.service-public.fr/vosdroits/F23571",
    preuves:[
      "Les formalités de création d'une entreprise sont réalisées par l'intermédiaire du Guichet des formalités des entreprises."
    ]
  }
};

function texte(v,max=10000){
  return v==null
    ?""
    :String(v)
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
    .replace(/\"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function securityHeaders(){
  return{
    "X-Content-Type-Options":"nosniff",
    "X-Frame-Options":"DENY",
    "Referrer-Policy":"strict-origin-when-cross-origin",
    "Permissions-Policy":"camera=(self), microphone=(self), geolocation=()",
    "Cache-Control":"no-store",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"
  };
}

function jsonResponse(data,status=200){
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers:{
        ...securityHeaders(),
        "content-type":"application/json; charset=utf-8"
      }
    }
  );
}

function contentLengthTooLarge(r,max){
  const n=Number(r.headers.get("content-length")||0);
  return Number.isFinite(n)&&n>max;
}

function clientKey(r){
  return r.headers.get("CF-Connecting-IP")||"anonymous";
}

function cleanRateStore(now){
  if(rateStore.size<=RATE_STORE_MAX_KEYS)return;

  for(const [key,times] of rateStore){
    const type=String(key).split(":")[0];
    const config=RATE_LIMITS[type];

    if(!config){
      rateStore.delete(key);
      continue;
    }

    const recent=times.filter(
      t=>now-t<config.windowMs
    );

    if(recent.length){
      rateStore.set(key,recent);
    }else{
      rateStore.delete(key);
    }

    if(rateStore.size<=RATE_STORE_MAX_KEYS)break;
  }
}

function rateLimit(r,type){
  const c=RATE_LIMITS[type];
  if(!c)return true;

  const now=Date.now();
  cleanRateStore(now);

  const k=type+":"+clientKey(r);

  const a=(rateStore.get(k)||[])
    .filter(t=>now-t<c.windowMs);

  if(a.length>=c.maxRequests){
    rateStore.set(k,a);
    return false;
  }

  a.push(now);
  rateStore.set(k,a);

  return true;
}

const PARCOURS={
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

  return{
    entreprise:
      /créer (une )?entreprise|creer (une )?entreprise|création d.?entreprise|creation d.?entreprise|\bentreprise\b|société|societe|entrepreneur|micro.?entreprise|auto.?entrepreneur|indépendant|independant|lancer mon activité|lancer une activité|ouvrir mon entreprise|ouvrir une entreprise/.test(s),

    statut:
      /statut juridique|forme juridique|micro.?entreprise|indépendant|independant|\bei\b|entreprise individuelle/.test(s),

    travail:
      /travail|emploi|salarié|salarie|contrat|employeur|licenciement|salaire/.test(s),

    social:
      /caf|rsa|aide sociale|allocation|droits sociaux/.test(s),

    administratif:
      /démarche|demarche|administratif|administrative|préfecture|prefecture|mairie|document officiel/.test(s),

    juridique:
      /avocat|juridique|justice|tribunal|loi|légal|legal|mise en demeure/.test(s),

    fiscalite:
      /impôt|impot|fiscal|fiscalité|fiscalite|urssaf|tva|cfe|cotisation/.test(s),

    immigration:
      /récépissé|recepisse|titre de séjour|titre de sejour|séjour|sejour|visa|anef|préfecture|prefecture|étranger|etranger|demande d'asile|asile|carte de séjour|carte de sejour/.test(s),

    recepisse:
      /récépissé|recepisse/.test(s),

    message:false
  };
}

function extraireInformations(q){
  const l=texte(q,12000).toLowerCase();
  const i=[];

  const add=(t,v)=>{
    if(v&&!i.some(x=>x.type===t)){
      i.push({
        type:t,
        valeur:v
      });
    }
  };

  const nationalites={
    tunisien:"tunisienne",
    tunisienne:"tunisienne",
    algérien:"algérienne",
    algerien:"algérienne",
    algérienne:"algérienne",
    marocain:"marocaine",
    marocaine:"marocaine",
    sénégalais:"sénégalaise",
    senegalais:"sénégalaise",
    ivoirien:"ivoirienne",
    ivoirienne:"ivoirienne",
    malien:"malienne",
    malienne:"malienne",
    guinéen:"guinéenne",
    guineen:"guinéenne",
    congolais:"congolaise",
    congolaise:"congolaise",
    camerounais:"camerounaise",
    camerounaise:"camerounaise",
    comorien:"comorienne",
    comorienne:"comorienne"
  };

  for(const[k,v]of Object.entries(nationalites)){
    if(new RegExp("\\b"+k+"\\b","i").test(l)){
      add("nationalité",v);
      break;
    }
  }

  const dm=l.match(
    /(?:je\s+)?(?:suis\s+)?(?:arrivé|arrive|arrivée|arrivee|entré|entree)\s+(?:en\s+france\s+)?(?:depuis\s+)?(?:le\s+)?(?:début|debut|fin|mi-)?\s*20\d{2}/i
  );

  if(dm){
    add(
      "arrivée en France",
      dm[0].trim()
    );
  }

  const dm2=l.match(
    /(?:depuis|à partir de|a partir de)\s+(?:le\s+)?(?:début|debut|fin|mi-)?\s*20\d{2}/i
  );

  if(dm2&&!i.some(x=>x.type==="arrivée en France")){
    add(
      "arrivée en France",
      dm2[0].trim()
    );
  }

  const mois=l.match(
    /(?:janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+20\d{2}/i
  );

  if(
    mois&&
    /arriv|entrée|entree|depuis/.test(l)
  ){
    add(
      "date d'arrivée",
      mois[0]
    );
  }

  if(/\bvisa\b/.test(l)){
    add(
      "visa",
      "présence d'un visa mentionnée"
    );
  }

  if(
    /\b(je travaille|je suis salarié|je suis salarie|j'ai un travail|j ai un travail|je travaille actuellement)\b/.test(l)
  ){
    add(
      "travail",
      "travail actuel mentionné"
    );
  }

  if(
    /\b(hébergé|heberge|hébergement|hebergement|chez mon frère|chez mon frere|chez ma soeur|chez ma sœur)\b/.test(l)
  ){
    add(
      "logement",
      "hébergement mentionné"
    );
  }

  if(
    /^\s*(oui|yes|ouais)\s*[.!?]*$/i.test(l)||
    /\b(j'ai déjà déposé|j ai deja depose|déjà déposé|deja depose|demande déposée|demande deposee)\b/.test(l)
  ){
    add(
      "dépôt",
      "une demande déjà déposée est mentionnée"
    );
  }

  if(
    /^\s*(non|pas encore|jamais)\s*[.!?]*$/i.test(l)||
    /\b(je n'ai pas déposé|je n ai pas depose|aucune demande|jamais déposé|jamais depose)\b/.test(l)
  ){
    add(
      "dépôt",
      "aucun dépôt n'est mentionné ou le dépôt est nié"
    );
  }

  if(
    /\b(première demande|premiere demande|premier titre|première carte|premiere carte|premier séjour|premier sejour)\b/.test(l)
  ){
    add(
      "procédure",
      "première demande"
    );
  }
  else if(
    /\b(renouvellement|renouveler|renouvelle)\b/.test(l)
  ){
    add(
      "procédure",
      "renouvellement"
    );
  }
  else if(
    /\b(changement de situation|changement de statut|changer de statut)\b/.test(l)
  ){
    add(
      "procédure",
      "changement de situation / statut"
    );
  }
  else if(
    /\b(demande d'asile|demande d asile|asile|protection internationale)\b/.test(l)
  ){
    add(
      "procédure",
      "demande d'asile / protection"
    );
  }

  if(
    /^\s*(travail|emploi|salarié|salarie)\s*[.!?]*$/i.test(l)||
    (
      /\b(travail|emploi|salarié|salarie)\b/.test(l)&&
      /\b(titre de séjour|titre de sejour|séjour|sejour|visa|demande)\b/.test(l)
    )
  ){
    add(
      "motif",
      "travail"
    );
  }

  if(
    /^\s*(études|etudes|étudier|etudier|étudiant|etudiant)\s*[.!?]*$/i.test(l)||
    /\b(études|etudes|étudier|etudier|étudiant|etudiant)\b/.test(l)
  ){
    add(
      "motif",
      "études"
    );
  }

  if(
    /^\s*(famille|conjoint|époux|epoux|épouse|epouse)\s*[.!?]*$/i.test(l)||
    /\b(famille|conjoint|époux|epoux|épouse|epouse|regroupement familial)\b/.test(l)
  ){
    add(
      "motif",
      "famille"
    );
  }

  if(
    /^\s*(asile|protection internationale)\s*[.!?]*$/i.test(l)||
    /\b(asile|protection internationale|demandeur d'asile|demandeuse d'asile)\b/.test(l)
  ){
    add(
      "motif",
      "asile / protection"
    );
  }

  if(
    /\b(démarches de séjour|demarches de sejour|démarche de séjour|demarche de sejour|titre de séjour|titre de sejour|carte de séjour|carte de sejour|récépissé|recepisse)\b/.test(l)
  ){
    add(
      "objectif",
      "démarches liées au séjour"
    );
  }

  return i;
}

function etatDepot(v){
  const s=texte(v,12000)
    .toLowerCase()
    .trim()
    .replace(/[.!?]+$/g,"");

  if(
    /^(oui|yes|ouais)$/.test(s)||
    /\b(j'ai déjà déposé|j ai deja depose|déjà déposé|deja depose|demande déposée|demande deposee)\b/.test(s)
  ){
    return"oui";
  }

  if(
    /^(non|pas encore|jamais)$/.test(s)||
    /\b(je n'ai pas déposé|je n ai pas depose|aucune demande|jamais déposé|jamais depose)\b/.test(s)
  ){
    return"non";
  }

  return"inconnu";
}

function etatDepotDepuisContexte(base,rep,infos){
  let depot=etatDepot(rep);

  if(depot!=="inconnu"){
    return depot;
  }

  depot=etatDepot(base);

  if(depot!=="inconnu"){
    return depot;
  }

  const info=infos.find(
    x=>x.type==="dépôt"
  );

  if(info){
    if(/aucun|nié|nie/.test(info.valeur)){
      return"non";
    }

    if(/déjà|déposée|deposee/.test(info.valeur)){
      return"oui";
    }
  }

  return"inconnu";
}

function prochaineQuestion(q,c,o={}){
  const base=texte(
    o.questionInitiale||q,
    12000
  ).toLowerCase();

  const rep=texte(
    o.reponseUtilisateur||o.reponse,
    12000
  ).toLowerCase();

  const hist=texte(
    o.historique,
    LIMITS.historique
  );

  const etape=Number(o.etape)||0;

  const infos=extraireInformations(
    [base,rep,hist]
      .filter(Boolean)
      .join("\n")
  );

  const depotInfo=infos.find(
    x=>x.type==="dépôt"
  );

  const proc=infos.find(
    x=>x.type==="procédure"
  );

  const motif=infos.find(
    x=>x.type==="motif"
  );

  const depot=etatDepotDepuisContexte(
    base,
    rep,
    infos
  );

  if(c.recepisse){

    if(depot==="inconnu"){
      return"Avez-vous déjà déposé une demande de titre de séjour auprès de l’ANEF ou de la préfecture ?";
    }

    if(depot==="oui"){

      if(!proc){
        return"Quel type de demande de titre de séjour avez-vous déposé : première demande, renouvellement, changement de situation, demande d’asile ou autre ?";
      }

      if(etape<=2){
        return"Avez-vous reçu un document après votre démarche (récépissé, attestation, confirmation ANEF ou autre) ?";
      }

      return"Quel est votre objectif maintenant : suivre votre dossier, obtenir ou renouveler votre titre, pouvoir travailler, ou résoudre un problème administratif ?";
    }

    if(depot==="non"){

      if(!motif){
        return"Pour quel motif souhaitez-vous demander un titre de séjour : travail, famille, études, demande d’asile ou autre ?";
      }

      return"Quel document ou quelle situation avez-vous actuellement concernant votre séjour (visa, passeport, ancien titre, aucun document, autre) ?";
    }
  }

  if(c.immigration){

    if(depot==="inconnu"){
      return"Avez-vous déjà déposé une demande de titre de séjour auprès de l’ANEF ou de la préfecture ?";
    }

    if(depot==="non"&&!motif){
      return"Pour quel motif souhaitez-vous demander un titre de séjour : travail, famille, études, demande d’asile ou autre ?";
    }

    if(depot==="oui"&&!proc){
      return"Quel type de demande de titre de séjour avez-vous déposé : première demande, renouvellement, changement de situation, demande d’asile ou autre ?";
    }

    if(depot==="non"&&motif){
      return"Quel document ou quelle situation avez-vous actuellement concernant votre séjour (visa, passeport, ancien titre, aucun document, autre) ?";
    }

    if(depot==="oui"&&proc){
      return"Quel est votre objectif maintenant : suivre votre dossier, obtenir ou renouveler votre titre, pouvoir travailler, ou résoudre un problème administratif ?";
    }

    return"Quelle est la prochaine démarche ou le principal problème que vous souhaitez résoudre concernant votre séjour ?";
  }

  if(c.entreprise&&!c.statut){
    return etape===0
      ?"Quelle activité ou quels services souhaitez-vous proposer ?"
      :"Avez-vous déjà choisi une forme juridique ou souhaitez-vous que GouRare AI vous aide à la comparer ?";
  }

  if(c.entreprise&&c.statut){
    return"Avez-vous déjà commencé les formalités de création de l’entreprise ?";
  }

  if(c.travail){
    return etape===0
      ?"Quel est votre objectif principal : trouver un emploi, comprendre votre contrat, ou résoudre un problème avec votre employeur ?"
      :"Quel type de poste ou de situation professionnelle recherchez-vous exactement ?";
  }

  if(c.social){
    return"Quelle aide ou quelle situation sociale souhaitez-vous comprendre exactement ?";
  }

  if(c.administratif){
    return"Quelle démarche administrative devez-vous effectuer exactement ?";
  }

  return"Quel est le résultat que vous souhaitez obtenir exactement ?";
}

function progression(q,o={}){
  const base=[
    q,
    texte(
      o.reponseUtilisateur||o.reponse,
      12000
    ),
    texte(
      o.historique,
      LIMITS.historique
    )
  ]
    .filter(Boolean)
    .join("\n");

  const c=detectContext(base);

  c.message=!!o.messageMode;

  return c;
}

function selectSources(c){
  const ids=[];

  if(c.immigration){
    ids.push("anef");

    if(c.travail){
      ids.push("travail_etranger");
    }
  }

  if(c.entreprise||c.statut){
    ids.push("statut");
  }

  if(c.entreprise){
    ids.push("guichet");
  }

  return unique(ids)
    .map(x=>SOURCES[x]);
}

function infosToText(infos,q,c){
  if(!infos.length){
    return c.message
      ?"Vous souhaitez analyser ou traiter un message ou un contenu fourni."
      :texte(q);
  }

  return infos
    .map(x=>{

      if(x.type==="nationalité"){
        return"Vous indiquez être de nationalité "+x.valeur;
      }

      if(
        x.type==="arrivée en France"||
        x.type==="date d'arrivée"
      ){
        return"Vous indiquez être arrivé en France "+x.valeur.replace(/^depuis\s*/i,"");
      }

      if(x.type==="objectif"){
        return"Votre objectif concerne "+x.valeur;
      }

      if(x.type==="motif"){
        return"Le motif mentionné est "+x.valeur;
      }

      if(x.type==="procédure"){
        return"La procédure mentionnée est "+x.valeur;
      }

      if(x.type==="visa"){
        return"Vous mentionnez un visa";
      }

      if(x.type==="travail"){
        return"Vous mentionnez un travail actuel";
      }

      if(x.type==="logement"){
        return"Vous mentionnez un hébergement";
      }

      if(x.type==="dépôt"){
        return x.valeur;
      }

      return x.type+" : "+x.valeur;
    })
    .join(". ")+"." ;
}

function confirmed(q,c,sources,infos){
  const a=infos
    .filter(x=>[
      "nationalité",
      "arrivée en France",
      "date d'arrivée",
      "objectif",
      "motif",
      "procédure",
      "visa",
      "travail",
      "logement",
      "dépôt"
    ].includes(x.type))
    .map(
      x=>x.type+" : "+x.valeur
    );

  if(c.immigration){
    a.push(
      "La demande concerne une démarche liée au séjour ou à la situation administrative d'un étranger en France."
    );
  }

  if(c.recepisse){
    a.push(
      "Le mot « récépissé » est identifié comme l'objet de la demande, mais son rôle exact dépend de la procédure engagée."
    );
  }

  if(c.entreprise){
    a.push(
      "Le projet concerne une activité ou une démarche d'entreprise."
    );
  }

  return unique(a);
}

function documents(q,c){
  if(c.immigration&&c.recepisse){
    return[
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

  return[];
}

function actions(q,c){
  const a=[];

  if(c.immigration&&c.recepisse){
    a.push(
      "Identifier la procédure exacte : première demande, renouvellement, changement de situation, demande d’asile ou autre."
    );

    a.push(
      "Vérifier si la demande a déjà été déposée et quel document ou accusé de réception a été remis."
    );

    a.push(
      "Consulter la procédure officielle correspondante sur l’ANEF ou auprès de la préfecture compétente."
    );
  }

  if(c.entreprise){
    a.push(
      "Décrire précisément les prestations ou produits proposés."
    );

    if(!c.statut){
      a.push(
        "Comparer les formes juridiques possibles avant de choisir un statut."
      );
    }
  }

  return unique(a);
}

function recommendations(q,c){
  const a=[];

  if(c.immigration&&c.recepisse){
    a.push(
      "Ne pas supposer qu'un récépissé est automatiquement délivré dans toutes les situations : son rôle dépend de la procédure et de l'état du dossier."
    );

    a.push(
      "Ne pas déduire un droit au séjour ou au travail à partir du seul fait d'avoir demandé un récépissé."
    );
  }

  if(c.entreprise){
    a.push(
      "Décrire précisément l'activité avant de prendre une décision administrative ou juridique."
    );
  }

  return unique(a);
}

function nextAction(q,c,o={}){
  if(c.message){
    return"Vérifier que le projet de réponse correspond bien au contenu et au contexte du message reçu.";
  }

  return prochaineQuestion(q,c,o);
}

function systemPrompt(){
  return`Tu es GouRare AI, un assistant d'orientation multi-domaines.

Tu n'es pas avocat, expert-comptable, médecin, administration ou travailleur social.

Ne transforme jamais une hypothèse en fait.

Les choix de l'interface ne prouvent aucun statut juridique, droit, nationalité ou éligibilité.

Pour l'immigration, ne déduis jamais une situation légale non confirmée.

Pour un récépissé, distingue demande de titre, dépôt, procédure, document reçu et objectif.

Ne dis jamais qu'une personne peut séjourner ou travailler sans éléments confirmés.

N'invente aucune loi, article, montant, délai, obligation ou document.

Les sources officielles fournies sont prioritaires.

Réponds en français.

L'objectif est :
Comprendre → Vérifier → Orienter → Donner la prochaine action.`;
}

async function askAI(env,prompt,maxTokens=700){
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
        temperature:.15
      }
    );

    return typeof r==="string"
      ?r
      :(r?.response||r?.result?.response||"");
  }catch{
    return"";
  }
}

function messagePrompt(contenu,mode,langue){
  const m={
    analyse:"Analyse le message : faits, demande, incertitudes et réponse possible.",
    reponse:"Prépare une réponse claire et polie sans inventer de faits.",
    reformulation:"Réécris le message plus clairement sans changer son sens.",
    correction:"Corrige les fautes sans changer le sens.",
    traduction:"Traduis fidèlement le contenu dans la langue demandée."
  };

  return`Langue : ${langue||"français"}
Mode : ${m[mode]||m.analyse}

CONTENU :
${texte(contenu,18000)}`;
}

async function analyserImage(env,image,demande=""){
  if(!image||typeof image!=="string"){
    throw Error("Image absente.");
  }

  if(image.length>LIMITS.image){
    throw Error("Image trop volumineuse.");
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
          content:demande||"Lis et analyse cette image. Explique uniquement ce qui est visible et indique les incertitudes."
        }
      ],
      image,
      max_tokens:2200,
      temperature:.1
    }
  );

  return typeof r==="string"
    ?r
    :(r?.response||r?.result?.response||
      (typeof r?.result==="string"
        ?r.result
        :JSON.stringify(r)));
}

function base64FromDataURL(v){
  if(typeof v!=="string"){
    return"";
  }

  const i=v.indexOf(",");

  if(
    v.startsWith("data:")&&
    i>=0
  ){
    return v.slice(i+1);
  }

  return v;
}

async function transcrireAudio(env,audio,langue="fr"){
  if(!audio||typeof audio!=="string"){
    throw Error("Audio absent.");
  }

  if(audio.length>LIMITS.audio){
    throw Error("Audio trop volumineux.");
  }

  const contenu=base64FromDataURL(audio);

  if(!contenu){
    throw Error("Données audio invalides.");
  }

  const r=await env.IA.run(
    MODEL_AUDIO,
    {
      audio:contenu,
      task:"transcribe",
      language:langue
    }
  );

  return texte(
    r?.text||
    r?.transcription_info?.text||
    "",
    20000
  );
}
async function analyserQuestion(env,q,o={}){
  const base=texte(
    o.questionInitiale||q,
    LIMITS.question
  );

  const rep=texte(
    o.reponseUtilisateur||o.reponse,
    12000
  );

  const hist=texte(
    o.historique,
    LIMITS.historique
  );

  const c=progression(
    base,
    {
      ...o,
      reponseUtilisateur:rep,
      historique:hist
    }
  );

  const infos=extraireInformations(
    [base,rep,hist]
      .filter(Boolean)
      .join("\n")
  );

  const sources=selectSources(c);

  let orientation="";

  if(c.message){

    orientation=await askAI(
      env,
      messagePrompt(
        q,
        o.messageMode,
        o.langue
      ),
      1000
    );

  }else{

    const intention=
      c.recepisse
        ?"Récépissé / séjour"
        :c.immigration
          ?"Séjour / immigration"
          :c.entreprise
            ?"Projet d'entreprise"
            :c.travail
              ?"Emploi / travail"
              :c.social
                ?"Aides sociales"
                :c.fiscalite
                  ?"Fiscalité"
                  :c.juridique
                    ?"Question juridique"
                    :"Orientation générale";

    const prompt=
      "Intention : "+intention+
      "\nDemande initiale : "+base+
      "\nRéponse actuelle : "+rep+
      "\nHistorique : "+hist+
      "\nInformations identifiées : "+JSON.stringify(infos)+
      "\nSources : "+JSON.stringify(
        sources.map(s=>({
          titre:s.titre,
          preuves:s.preuves
        }))
      )+
      "\nDonne uniquement un court paragraphe d'orientation."+
      " Ne pose aucune question dans ce paragraphe."+
      " N'affirme jamais une première demande simplement parce que l'utilisateur vient d'arriver."+
      " Ne donne aucune conclusion juridique non vérifiée.";

    orientation=await askAI(
      env,
      prompt,
      450
    );

    if(!orientation){
      orientation=c.recepisse
        ?"Votre situation concerne une démarche liée au séjour. La procédure exacte reste à déterminer à partir des informations confirmées."
        :"Votre demande a été identifiée. Les éléments encore nécessaires seront précisés étape par étape.";
    }
  }

  const next=nextAction(
    base,
    c,
    {
      reponse:rep,
      reponseUtilisateur:rep,
      historique:hist,
      etape:o.etape,
      questionInitiale:base
    }
  );

  const verify=[];

  if(c.recepisse){

    const dep=etatDepotDepuisContexte(
      base,
      rep,
      infos
    );

    const hasDep=infos.some(
      x=>x.type==="dépôt"
    );

    const hasProc=infos.some(
      x=>x.type==="procédure"
    );

    if(!hasDep){

      verify.push(
        "Vérifier si une demande de titre de séjour a déjà été déposée."
      );

    }else if(dep==="oui"&&!hasProc){

      verify.push(
        "Vérifier le type exact de procédure de séjour."
      );

    }else{

      verify.push(
        "Vérifier le document reçu et l'état réel du dossier."
      );
    }
  }

  return{
    success:true,
    version:VERSION,

    compris:infosToText(
      infos,
      base,
      c
    ),

    orientation:texte(
      orientation,
      3000
    )
      .replace(
        /^\s*(?:💡\s*)?Orientation\s*:?\s*/i,
        ""
      )
      .trim(),

    confirmed:confirmed(
      base,
      c,
      sources,
      infos
    ),

    toVerify:verify,

    recommendations:recommendations(
      base,
      c
    ),

    actions:actions(
      base,
      c
    ),

    documents:documents(
      base,
      c
    ),

    risks:[],
    professional:[],

    nextAction:next,
    questionSuivante:next,

    sources:sources.map(s=>({
      id:s.id,
      titre:s.titre,
      organisme:s.organisme,
      url:s.url
    })),

    informations:infos
  };
}

function pageHTML(){
  return`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#111827">
<title>GouRare AI</title>

<style>
*{box-sizing:border-box}

body{
margin:0;
font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
background:#f4f6f8;
color:#111827
}

header{
background:#111827;
color:#fff;
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
padding:0 15px 90px
}

.card,.result-card{
background:#fff;
border-radius:18px;
padding:20px;
margin-bottom:18px;
box-shadow:0 8px 30px rgba(0,0,0,.07)
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
background:#fff;
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
background:#fff
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
color:#fff
}

.secondary{
background:#e5e7eb;
color:#111827
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

.ai-result{
white-space:pre-wrap;
line-height:1.65
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
background:#fff;
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
<p>Votre intelligence d'orientation</p>
</header>

<div class="container">

<div id="parcours" class="card welcome"></div>

<div id="assistant" class="card hidden">
<button class="secondary" id="retour">← Retour</button>

<h2 id="titreParcours"></h2>
<p id="descriptionParcours"></p>

<div id="situations" class="choices"></div>
</div>

<div id="outil" class="card hidden">

<button class="secondary" id="retourOutil">← Retour</button>

<h2>🧠 Votre demande</h2>

<textarea
id="question"
placeholder="Expliquez votre situation..."
></textarea>

<div class="actions">

<button id="analyser">
Analyser
</button>

<button id="micro" class="secondary">
🎙️ Parler
</button>

<button id="photo" class="secondary">
📷 Analyser une image
</button>

</div>

<div id="status" class="status"></div>

<input
id="imageInput"
type="file"
accept="image/*"
capture="environment"
class="hidden"
>

</div>

<div id="messageCard" class="card hidden">

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
placeholder="Langue souhaitée pour une traduction"
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
.replace(/\"/g,"&quot;")
.replace(/'/g,"&#039;")
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
"<h2>Comment pouvons-nous vous orienter ?</h2>"+
"<p>Choisissez le parcours qui correspond le mieux à votre situation.</p>"+
"<div class='choices' id='profils'></div>"+
"<p style='margin-top:18px'>"+
"<button id='inconnu' class='secondary'>"+
"✨ Je ne sais pas où aller — GouRare AI m'oriente"+
"</button></p>";

const p=
document.getElementById("profils");

const data=${JSON.stringify(PARCOURS)};

Object.keys(data).forEach(k=>{

const x=data[k];

p.innerHTML+=
"<div class='choice' data-p='"+esc(k)+"'>"+
"<strong>"+esc(x.titre)+"</strong>"+
"<span>"+esc(x.description)+"</span>"+
"</div>";

});

p.querySelectorAll(".choice").forEach(
b=>b.onclick=()=>openProfil(b.dataset.p)
);

document.getElementById("inconnu").onclick=()=>{

openProfil("particulier");

question.value=
"Je ne sais pas quel parcours correspond à ma situation. Aidez-moi à m'orienter.";

outil.classList.remove("hidden");
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

x.situations.forEach(item=>{

const b=
document.createElement("div");

b.className="choice";

b.innerHTML=
"<strong>"+esc(item[1])+"</strong>";

b.dataset.s=item[0];

b.onclick=()=>openSituation(
item[0],
item[1]
);

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
s==="message"||
s==="document"
){
messageMode.value="analyse";
}
}

document.getElementById("retour").onclick=
showHome;

document.getElementById("retourOutil").onclick=()=>{

outil.classList.add("hidden");
messageCard.classList.add("hidden");
assistant.classList.remove("hidden");

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

const historiqueTexte=
historique
.map(x=>{

const parts=[];

if(x.questionInitiale){
parts.push(
"Question initiale : "+
x.questionInitiale
);
}

if(x.questionSuivante){
parts.push(
"Question posée : "+
x.questionSuivante
);
}

if(x.reponse){
parts.push(
"Réponse utilisateur : "+
x.reponse
);
}

return parts.join("\n");

})
.join("\n\n");

const r=
await fetch(
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

historique:historiqueTexte,

profil,

situation,

etape,

messageMode:
messageMode.value||null,

langue:
langue.value.trim()

})
}
);

const d=await r.json();

if(!r.ok||!d.success){
throw Error(
d.error||"Erreur."
);
}

historique.push({

questionInitiale:
premiere
?questionInitiale
:historique[0]?.questionInitiale||"",

question:
q,

reponse:
reponseUtilisateur,

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

return"<p>Aucun élément précis à présenter à ce stade.</p>";

}

return"<ul>"+
a.map(
x=>
"<li>"+
esc(
typeof x==="string"
?x
:(x.texte||JSON.stringify(x))
)+
"</li>"
).join("")+
"</ul>";
}

function afficher(d){

let h=

"<div class='result-card'>"+
"<h2>🧭 Ce que j'ai compris</h2>"+
"<div class='ai-result'>"+
esc(d.compris)+
"</div></div>"+

"<div class='result-card'>"+
"<h2>💡 Orientation</h2>"+
"<div class='ai-result'>"+
esc(d.orientation)+
"</div></div>"+

"<div class='result-card'>"+
"<h2>✅ Informations confirmées</h2>"+
liste(d.confirmed)+
"</div>"+

"<div class='result-card'>"+
"<h2>🔎 À vérifier</h2>"+
liste(d.toVerify)+
"</div>"+

"<div class='result-card'>"+
"<h2>💭 Recommandations</h2>"+
liste(d.recommendations)+
"</div>"+

"<div class='result-card'>"+
"<h2>📋 Actions concrètes</h2>"+
liste(d.actions)+
"</div>"+

"<div class='result-card'>"+
"<h2>📄 Documents</h2>"+

(
d.documents&&
d.documents.length
?liste(d.documents)
:"<p>Aucun document précis à présenter à ce stade.</p>"
)+

"</div>"+

"<div class='result-card'>"+
"<h2>🚀 Prochaine action</h2>"+
"<div class='ai-result'>"+
esc(d.nextAction)+
"</div>"+
"<p style='color:#4b5563'>"+
"Répondez à cette question dans la zone ci-dessus, puis appuyez sur « Analyser »."+
"</p></div>"+

"<div class='result-card'>"+
"<h2>📚 Sources consultées</h2>";

(d.sources||[]).forEach(s=>{

h+=
"<div class='source'>"+
esc(s.organisme)+
" — "+
esc(s.titre)+
"<br><a href='"+
esc(s.url)+
"' target='_blank' rel='noopener noreferrer'>"+
"Consulter la source officielle ↗"+
"</a></div>";

});

h+="</div>";

result.innerHTML=h;
}

document.getElementById("analyser").onclick=
analyserTexte;

document.getElementById("photo").onclick=()=>{
imageInput.click();
};

imageInput.onchange=()=>{

const f=
imageInput.files&&
imageInput.files[0];

if(!f)return;

if(!f.type.startsWith("image/")){

status.textContent=
"Veuillez sélectionner une image.";

imageInput.value="";

return;
}

if(f.size>5500000){

status.textContent=
"Image trop volumineuse.";

imageInput.value="";

return;
}

const rd=
new FileReader();

status.textContent=
"📷 Analyse de l'image...";

rd.onloadend=async()=>{

try{

const dataUrl=
String(rd.result||"");

if(!dataUrl){

throw Error(
"Impossible de lire l'image."
);
}

const r=
await fetch(
"/api/image",
{
method:"POST",
headers:{
"content-type":
"application/json"
},
body:JSON.stringify({
image:dataUrl,
demande:
question.value.trim()
})
}
);

const d=
await r.json();

if(!r.ok||!d.success){

throw Error(
d.error||"Erreur image."
);
}

question.value=
d.texte||"";

await analyserTexte();

}catch(e){

status.textContent=
e.message||
"Erreur image.";

}
};

rd.readAsDataURL(f);
};

document.getElementById("micro").onclick=
async function(){

if(recording&&mediaRecorder){

mediaRecorder.stop();

return;
}

if(!navigator.mediaDevices?.getUserMedia){

status.textContent=
"Microphone indisponible.";

return;
}

try{

const stream=
await navigator.mediaDevices
.getUserMedia({
audio:true
});

audioChunks=[];

mediaRecorder=
new MediaRecorder(stream);

recording=true;

this.textContent=
"⏹️ Arrêter";

status.textContent=
"🎙️ Je vous écoute...";

mediaRecorder.ondataavailable=e=>{

if(e.data.size){
audioChunks.push(e.data);
}

};

mediaRecorder.onstop=async()=>{

recording=false;

this.textContent=
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

if(blob.size>9000000){

status.textContent=
"Audio trop volumineux.";

return;
}

const rd=
new FileReader();

rd.onloadend=async()=>{

try{

const dataUrl=
String(rd.result||"");

if(!dataUrl){

throw Error(
"Impossible de lire l'audio."
);
}

const r=
await fetch(
"/api/transcribe",
{
method:"POST",
headers:{
"content-type":
"application/json"
},
body:JSON.stringify({
audio:dataUrl,
langue:"fr"
})
}
);

const d=
await r.json();

if(!r.ok||!d.success){

throw Error(
d.error||"Erreur audio."
);
}

question.value=
d.text||"";

await analyserTexte();

}catch(e){

status.textContent=
e.message||
"Erreur audio.";

}
};

rd.readAsDataURL(blob);

};

mediaRecorder.start();

}catch{

status.textContent=
"L'accès au microphone a été refusé ou est indisponible.";

}
};

</script>
</body>
</html>`;
}

async function handleAnalyze(r,env){

if(!rateLimit(r,"analyze")){

return jsonResponse(
{
success:false,
error:
"Trop de demandes. Réessayez plus tard."
},
429
);

}

if(contentLengthTooLarge(r,400000)){

return jsonResponse(
{
success:false,
error:
"Requête trop volumineuse."
},
413
);

}

if(
!(r.headers.get("content-type")||"")
.includes("application/json")
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

let b;

try{

b=await r.json();

}catch{

return jsonResponse(
{
success:false,
error:"JSON invalide."
},
400
);

}

const q=texte(
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
texte(
b.reponseUtilisateur,
12000
),

questionInitiale:
texte(
b.questionInitiale,
12000
),

historique:
texte(
b.historique,
LIMITS.historique
),

profil:
texte(
b.profil,
100
),

situation:
texte(
b.situation,
100
),

etape:
Number.isFinite(
Number(b.etape)
)
?Number(b.etape)
:0

}
)
);

}catch(e){

return jsonResponse(
{
success:false,
error:
e.message||"Erreur."
},
500
);

}
}

async function handleTranscribe(r,env){

if(!rateLimit(r,"transcribe")){

return jsonResponse(
{
success:false,
error:
"Trop de demandes audio. Réessayez plus tard."
},
429
);

}

if(contentLengthTooLarge(r,16000000)){

return jsonResponse(
{
success:false,
error:
"Requête audio trop volumineuse."
},
413
);

}

if(
!(r.headers.get("content-type")||"")
.includes("application/json")
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

let b;

try{

b=await r.json();

}catch{

return jsonResponse(
{
success:false,
error:"JSON invalide."
},
400
);

}

if(
typeof b.audio!=="string"||
!b.audio
){

return jsonResponse(
{
success:false,
error:"Audio absent."
},
400
);

}

if(
b.audio.length>LIMITS.audio
){

return jsonResponse(
{
success:false,
error:"Audio trop volumineux."
},
413
);

}

try{

const text=
await transcrireAudio(
env,
b.audio,
texte(
b.langue,
10
)||"fr"
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

return jsonResponse({
success:true,
text,
version:VERSION
});

}catch(e){

return jsonResponse(
{
success:false,
error:
e.message||"Erreur audio."
},
500
);

}
}

async function handleImage(r,env){

if(!rateLimit(r,"image")){

return jsonResponse(
{
success:false,
error:
"Trop de demandes d’image. Réessayez plus tard."
},
429
);

}

if(contentLengthTooLarge(r,7500000)){

return jsonResponse(
{
success:false,
error:
"Requête image trop volumineuse."
},
413
);

}

if(
!(r.headers.get("content-type")||"")
.includes("application/json")
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

let b;

try{

b=await r.json();

}catch{

return jsonResponse(
{
success:false,
error:"JSON invalide."
},
400
);

}

if(
typeof b.image!=="string"||
!b.image
){

return jsonResponse(
{
success:false,
error:"Image absente."
},
400
);

}

if(
b.image.length>LIMITS.image
){

return jsonResponse(
{
success:false,
error:"Image trop volumineuse."
},
413
);

}

try{

const image=b.image;

return jsonResponse({
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

});

}catch(e){

return jsonResponse(
{
success:false,
error:
e.message||"Erreur image."
},
500
);

}
}

export default{

async fetch(r,env){

const u=new URL(r.url);

if(r.method==="OPTIONS"){

return new Response(
null,
{
status:204,
headers:
securityHeaders()
}
);

}

if(u.pathname==="/health"){

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

if(u.pathname==="/api/analyze"){

if(r.method!=="POST"){

return jsonResponse(
{
success:false,
error:
"Méthode non autorisée."
},
405
);

}

return handleAnalyze(
r,
env
);

}

if(u.pathname==="/api/transcribe"){

if(r.method!=="POST"){

return jsonResponse(
{
success:false,
error:
"Méthode non autorisée."
},
405
);

}

return handleTranscribe(
r,
env
);

}

if(u.pathname==="/api/image"){

if(r.method!=="POST"){

return jsonResponse(
{
success:false,
error:
"Méthode non autorisée."
},
405
);

}

return handleImage(
r,
env
);

}

if(u.pathname==="/"){

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
headers:
securityHeaders()
}
);

}

};
