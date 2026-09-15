const MODEL="@cf/meta/llama-3.1-8b-instruct-fast";
const MODEL_VISION="@cf/meta/llama-3.2-11b-vision-instruct";
const MODEL_AUDIO="@cf/openai/whisper-large-v3-turbo";
const VERSION="9.5";

const LIMITS={
  question:12000,
  imageFile:5500000,
  imageData:8000000,
  audioFile:9000000,
  audioData:16000000,
  historique:24000,
  analyzeBody:400000,
  imageBody:8500000,
  audioBody:17000000,
  documentText:30000,
  extractedInfo:20000
};

const RATE_LIMITS={
  analyze:{windowMs:60000,maxRequests:20},
  image:{windowMs:60000,maxRequests:6},
  transcribe:{windowMs:60000,maxRequests:6}
};

const rateStore=new Map();

const SOURCES={
  anef:{
    id:"anef",
    titre:"Démarches des étrangers en France",
    organisme:"Service-Public.fr",
    url:"https://www.service-public.fr/particuliers/vosdroits/R59398"
  },
  travailEtranger:{
    id:"travailEtranger",
    titre:"Autorisation de travail d'un étranger salarié en France",
    organisme:"Service-Public.fr",
    url:"https://www.service-public.fr/particuliers/vosdroits/F2728"
  },
  franceTravail:{
    id:"franceTravail",
    titre:"France Travail",
    organisme:"France Travail",
    url:"https://www.francetravail.fr/"
  },
  statut:{
    id:"statut",
    titre:"Trouver le statut juridique adapté à son activité",
    organisme:"Service Public Entreprendre",
    url:"https://entreprendre.service-public.fr/vosdroits/R18323"
  },
  guichet:{
    id:"guichet",
    titre:"Guichet des formalités des entreprises",
    organisme:"Service Public Entreprendre",
    url:"https://entreprendre.service-public.fr/vosdroits/F23571"
  }
};

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

function jsonResponse(data,status=200,extra={}){
  return new Response(JSON.stringify(data),{
    status,
    headers:{
      "content-type":"application/json; charset=utf-8",
      "cache-control":"no-store",
      ...extra
    }
  });
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

function cleanupRateStore(now){
  const stale=now-300000;

  for(const [key,arr] of rateStore){
    const last=arr.length?arr[arr.length-1]:0;

    if(!arr.length||last<stale){
      rateStore.delete(key);
    }
  }

  if(rateStore.size>10000){
    const entries=[...rateStore.entries()]
      .sort((a,b)=>{
        const aa=a[1].length?a[1][a[1].length-1]:0;
        const bb=b[1].length?b[1][b[1].length-1]:0;
        return aa-bb;
      });

    const removeCount=rateStore.size-10000;

    for(let i=0;i<removeCount;i++){
      rateStore.delete(entries[i][0]);
    }
  }
}

function clientKey(request){
  return request.headers.get("CF-Connecting-IP")||"anonymous";
}

function rateLimit(request,name){
  const rule=RATE_LIMITS[name];

  if(!rule)return true;

  const now=Date.now();

  cleanupRateStore(now);

  const key=name+":"+clientKey(request);
  const arr=rateStore.get(key)||[];
  const min=now-rule.windowMs;

  const kept=arr.filter(t=>t>min);

  if(kept.length>=rule.maxRequests){
    rateStore.set(key,kept);
    return false;
  }

  kept.push(now);
  rateStore.set(key,kept);

  return true;
}

function isValidImageDataURL(value){
  return /^data:image\/(?:jpeg|jpg|png|webp);base64,/i.test(
    String(value||"")
  );
}

function isValidAudioDataURL(value){
  return /^data:audio\/[^,]+;base64,/i.test(
    String(value||"")
  );
}

function base64FromDataURL(v){
  const s=String(v||"");
  const i=s.indexOf(",");

  return s.startsWith("data:")&&i>=0
    ?s.slice(i+1)
    :s;
}

function approxBytesFromBase64(b64){
  return Math.floor((String(b64||"").length*3)/4);
}

function normalizeLang(v){
  const s=texte(v,20).toLowerCase();

  return /^(ar|arab)/.test(s)
    ?"ar"
    :"fr";
}

/* =========================================================
   CONTEXT DETECTION
   ========================================================= */

function detectContext(question){
  const s=texte(question,LIMITS.question).toLowerCase();

  const immigration=
    /\b(titre de séjour|titre de sejour|carte de séjour|carte de sejour|visa|récépissé|recepisse|préfecture|prefecture|anef|étranger|etranger|immigration|asile|demande de séjour|demande de sejour|autorisation de travail)\b/i.test(s);

  const workProblem=
    /\b(employeur|salarié|salarie|salariée|salariee|contrat de travail|salaire|bulletin de paie|licenciement|licencié|licencie|conditions de travail|heures de travail|patron|collègue|collegue|travailleur)\b/i.test(s);

  const jobSearch=
    /\b(cherche un emploi|cherche du travail|recherche d'emploi|recherche d emploi|trouver un emploi|trouver du travail|candidature|candidat|cv|poste|recrutement|embauche|offre d'emploi|offre d emploi|intérim|interim|france travail)\b/i.test(s);

  const businessAction=
    /\b(créer une entreprise|creer une entreprise|création d'entreprise|creation d entreprise|micro-entreprise|micro entreprise|auto-entrepreneur|auto entrepreneur|entrepreneur|lancer mon activité|lancer mon activite|développer mon activité|developper mon activite|statut juridique|société|societe|entreprise individuelle)\b/i.test(s);

  const businessMention=
    /\b(mon entreprise|mon activité|mon activite|business|activité professionnelle|activite professionnelle)\b/i.test(s);

  const entreprise=
    businessAction||
    (businessMention&&!workProblem&&!jobSearch);

  const administratif=
    immigration||
    /\b(démarche|demarche|administration|préfecture|prefecture|mairie|caf|cpam|dossier|formulaire)\b/i.test(s);

  const logement=
    /\b(logement|appartement|maison|location|locataire|loyer|hébergement|hebergement)\b/i.test(s);

  const finance=
    /\b(argent|banque|compte bancaire|crédit|credit|dette|paiement|facture|budget|impôt|impot)\b/i.test(s);

  const social=
    /\b(caf|rsa|prime|aide sociale|allocation|sécurité sociale|securite sociale|cpam)\b/i.test(s);

  const juridique=
    /\b(avocat|tribunal|justice|juridique|litige|plainte|droit|mise en demeure)\b/i.test(s);

  const statut=
    /\b(statut juridique|micro-entreprise|micro entreprise|auto-entrepreneur|auto entrepreneur|sas|sasu|sarl|eurl|société|societe|entreprise individuelle)\b/i.test(s);

  const message=
    /\b(écris-moi|ecris-moi|rédige|redige|message|mail|email|courrier|lettre)\b/i.test(s);

  const image=
    /\b(photo|image|document|capture|screenshot|pdf|pièce jointe|piece jointe)\b/i.test(s);

  return {
    immigration,
    administratif,
    logement,
    finance,
    social,
    juridique,

    travail:
      workProblem||
      jobSearch||
      (
        /\b(travail|emploi|poste)\b/i.test(s)&&
        !businessAction
      ),

    entreprise,
    statut,
    message,
    image,
    audio:false,

    recepisse:
      /\b(récépissé|recepisse|attestation)\b/i.test(s)
  };
}

/* =========================================================
   EXTRACTION DES INFORMATIONS DE LA CONVERSATION
   ========================================================= */

function extraireInformations(question){
  const s=texte(question,LIMITS.question);
  const l=s.toLowerCase();

  const result=[];

  if(
    /\b(je suis en france|j'habite en france|j habite en france|actuellement en france|je vis en france)\b/i.test(l)
  ){
    result.push({
      type:"presence_france",
      valeur:"oui",
      source:"conversation"
    });
  }

  if(
    /\b(je viens d'arriver|je viens d arriver|nouvel arrivant|nouvelle arrivée|nouvelle arrivee|arrivé récemment|arrive récemment)\b/i.test(l)
  ){
    result.push({
      type:"situation",
      valeur:"arrivée récente en France",
      source:"conversation"
    });
  }

  if(
    /\b(première demande|premiere demande|première fois|premiere fois|jamais demandé|jamais demande)\b/i.test(l)
  ){
    result.push({
      type:"premiere_demande",
      valeur:"oui",
      source:"conversation"
    });
  }

  if(
    /\b(je n'ai pas déposé|je n ai pas depose|aucune demande|pas encore déposé|pas encore depose)\b/i.test(l)
  ){
    result.push({
      type:"depot",
      valeur:"non",
      source:"conversation"
    });
  }else if(
    /\b(j'ai déposé|j ai depose|demande déposée|demande deposee|dossier déposé|dossier depose|j'ai fait la demande|j ai fait la demande)\b/i.test(l)
  ){
    result.push({
      type:"depot",
      valeur:"oui",
      source:"conversation"
    });
  }

  if(
    /\b(en ligne|internet|anef|en ligne sur anef)\b/i.test(l)
  ){
    result.push({
      type:"procedure",
      valeur:"en ligne / ANEF",
      source:"conversation"
    });
  }

  if(
    /\b(préfecture|prefecture|au guichet|guichet)\b/i.test(l)
  ){
    result.push({
      type:"procedure",
      valeur:"préfecture / guichet",
      source:"conversation"
    });
  }

  if(
    /\b(je n'ai rien reçu|je n ai rien recu|je n'ai pas reçu|je n ai pas recu|aucun récépissé|aucun recepisse|pas reçu de récépissé|pas recu de recepisse|pas d'attestation|pas d attestation)\b/i.test(l)
  ){
    result.push({
      type:"document_recu",
      valeur:"aucun document reçu",
      source:"conversation"
    });
  }else if(
    /\b(j'ai reçu|j ai recu|reçu un récépissé|recu un recepisse|j'ai une attestation|j ai une attestation|attestation reçue|attestation recue)\b/i.test(l)
  ){
    result.push({
      type:"document_recu",
      valeur:"un document a été reçu",
      source:"conversation"
    });
  }

  if(
    /\b(titre de séjour|titre de sejour)\b/i.test(l)
  ){
    const match=l.match(
      /\b(titre de séjour|titre de sejour)\b.{0,100}\b(valable|validité|validite)\b.{0,60}\b(20\d{2})\b/i
    );

    result.push({
      type:"titre_sejour",
      valeur:match
        ?texte(match[0],200)
        :"titre de séjour mentionné",
      source:"conversation"
    });
  }

  if(
    /\b(salarié|salarie|salariée|salariee)\b/i.test(l)
  ){
    result.push({
      type:"statut_sejour_ou_travail",
      valeur:"salarié",
      source:"conversation"
    });
  }

  if(
    /\b(cherche un emploi|recherche d'emploi|recherche d emploi|cherche du travail|trouver un emploi|trouver du travail|candidature|candidat|recrutement|poste)\b/i.test(l)
  ){
    result.push({
      type:"objectif_professionnel",
      valeur:"recherche d'emploi",
      source:"conversation"
    });
  }

  if(
    /\b(sans diplôme|sans diplome|aucun diplôme|aucun diplome|sans expérience|sans experience|aucune expérience|aucune experience)\b/i.test(l)
  ){
    result.push({
      type:"profil_emploi",
      valeur:"sans diplôme et/ou sans expérience",
      source:"conversation"
    });
  }

  if(
    /\b(cv|curriculum vitae)\b/i.test(l)
  ){
    result.push({
      type:"document",
      valeur:"CV",
      source:"conversation"
    });
  }

  if(
    /\b(créer une entreprise|creer une entreprise|création d'entreprise|creation d entreprise|micro-entreprise|micro entreprise|auto-entrepreneur|auto entrepreneur|lancer mon activité|lancer mon activite|mon entreprise|mon activité|mon activite)\b/i.test(l)
  ){
    result.push({
      type:"activite",
      valeur:"projet entrepreneurial mentionné",
      source:"conversation"
    });
  }

  return dedupeInformations(result);
}

/* =========================================================
   EXTRACTION D'INFORMATIONS DE DOCUMENT / MESSAGE
   ========================================================= */

function extraireInformationsDocument(text,source="document"){
  const s=texte(text,LIMITS.documentText);

  if(!s){
    return {
      confirmees:[],
      aVerifier:[],
      resume:"Aucun texte exploitable n'a été extrait."
    };
  }

  const l=s.toLowerCase();

  const confirmees=[];
  const aVerifier=[];

  function addConfirmed(type,valeur){
    if(valeur){
      confirmees.push({
        type,
        valeur:texte(valeur,500),
        source
      });
    }
  }

  function addVerify(type,valeur){
    if(valeur){
      aVerifier.push({
        type,
        valeur:texte(valeur,500),
        source
      });
    }
  }

  const dateMatches=s.match(
    /\b(?:0?[1-9]|[12]\d|3[01])[\/.-](?:0?[1-9]|1[0-2])[\/.-](?:20\d{2})\b/g
  );

  if(dateMatches&&dateMatches.length){
    addConfirmed(
      "dates_document",
      unique(dateMatches).join(", ")
    );
  }

  const referenceMatch=s.match(
    /\b(?:référence|reference|réf\.?|ref\.?|n°|no)\s*[:#-]?\s*[A-Z0-9][A-Z0-9._/-]{2,40}\b/i
  );

  if(referenceMatch){
    addConfirmed(
      "reference_document",
      referenceMatch[0]
    );
  }

  const deadlineMatch=s.match(
    /(?:avant le|au plus tard le|jusqu'au|jusqu’au|délai de|delai de)\s+.{0,80}/i
  );

  if(deadlineMatch){
    addVerify(
      "delai_ou_echeance",
      deadlineMatch[0]
    );
  }

  if(
    /\b(pièce manquante|piece manquante|document manquant|documents manquants|veuillez fournir|merci de fournir|joindre|justificatif)\b/i.test(l)
  ){
    addVerify(
      "documents_demandes",
      "Le document semble demander un ou plusieurs justificatifs."
    );
  }

  if(
    /\b(convocation|rendez-vous|rendez vous)\b/i.test(l)
  ){
    addVerify(
      "rendez_vous",
      "Le document semble contenir une convocation ou un rendez-vous."
    );
  }

  if(
    /\b(refus|rejet|décision défavorable|decision defavorable)\b/i.test(l)
  ){
    addVerify(
      "decision",
      "Le document semble mentionner un refus ou une décision défavorable."
    );
  }

  if(
    /\b(accepté|accepte|accord|favorable|validation|validé|valide)\b/i.test(l)
  ){
    addVerify(
      "decision",
      "Le document semble mentionner une acceptation ou une validation."
    );
  }

  if(
    /\b(préfecture|prefecture|service public|service-public|administration|mairie|caf|cpam|france travail|francetravail)\b/i.test(l)
  ){
    addConfirmed(
      "organisme",
      "Une administration ou un organisme public est mentionné."
    );
  }

  if(
    /\b(employeur|contrat de travail|salaire|bulletin de paie|candidature|recrutement|embauche)\b/i.test(l)
  ){
    addConfirmed(
      "domaine_travail",
      "Le document concerne probablement le travail ou l'emploi."
    );
  }

  if(
    /\b(titre de séjour|titre de sejour|visa|récépissé|recepisse|étranger|etranger|anef)\b/i.test(l)
  ){
    addConfirmed(
      "domaine_immigration",
      "Le document concerne probablement la situation administrative d'un étranger en France."
    );
  }

  if(
    /\b(entreprise|société|societe|micro-entreprise|micro entreprise|entrepreneur|guichet unique)\b/i.test(l)
  ){
    addConfirmed(
      "domaine_entreprise",
      "Le document concerne probablement une activité professionnelle ou une entreprise."
    );
  }

  const firstLines=s
    .split("\n")
    .map(x=>texte(x,500))
    .filter(Boolean)
    .slice(0,8);

  const resume=firstLines.length
    ?firstLines.join(" ")
    :"Texte détecté dans le document.";

  return {
    confirmees:dedupeInformations(confirmees),
    aVerifier:dedupeInformations(aVerifier),
    resume:texte(resume,2000)
  };
}

/* =========================================================
   DÉDUPLICATION ET FUSION DES INFORMATIONS
   ========================================================= */

function dedupeInformations(items){
  const map=new Map();

  for(const item of items||[]){
    if(!item||!item.type||!item.valeur)continue;

    const key=
      String(item.type).toLowerCase()+
      ":"+
      String(item.valeur).toLowerCase();

    if(!map.has(key)){
      map.set(key,{
        type:texte(item.type,100),
        valeur:texte(item.valeur,1000),
        source:texte(item.source||"conversation",100)
      });
    }
  }

  return [...map.values()];
}

function fusionnerInformations(...sources){
  const all=[];

  for(const source of sources){
    if(Array.isArray(source)){
      all.push(...source);
    }
  }

  return dedupeInformations(all)
    .slice(0,200);
}

function informationsTypes(informations){
  return new Set(
    (informations||[])
      .map(x=>x&&x.type)
      .filter(Boolean)
  );
}

/* =========================================================
   MÉMOIRE DE CONVERSATION
   ========================================================= */

function analyserHistorique(historique){
  const h=texte(historique,LIMITS.historique);

  if(!h){
    return [];
  }

  const informations=[];

  const lignes=h
    .split(/\n+/)
    .map(x=>x.trim())
    .filter(Boolean);

  for(const ligne of lignes){
    const infos=extraireInformations(ligne);
    informations.push(...infos);
  }

  return dedupeInformations(informations);
}

function construireEtatConversation(question,historique,documentInfos=[]){
  const infosQuestion=extraireInformations(question);
  const infosHistorique=analyserHistorique(historique);

  const toutes= fusionnerInformations(
    infosHistorique,
    infosQuestion,
    documentInfos
  );

  return {
    informations:toutes,
    types:informationsTypes(toutes),
    contexte:detectContext(
      [texte(historique,12000),texte(question,12000)].join("\n")
    )
  };
}

/* =========================================================
   ÉTAT ADMINISTRATIF / DÉPÔT
   ========================================================= */

function etatDepot(reponses){
  const s=JSON.stringify(reponses||[]).toLowerCase();

  if(
    /\b(aucune demande|pas encore déposé|pas encore depose|je n'ai pas déposé|je n ai pas depose|depot.*non)\b/.test(s)
  ){
    return "non";
  }

  if(
    /\b(j'ai déposé|demande déposée|dossier déposé|j'ai fait la demande|depot.*oui)\b/.test(s)
  ){
    return "oui";
  }

  return "inconnu";
}

/* =========================================================
   QUESTION SUIVANTE — UNE SEULE QUESTION
   ========================================================= */

function prochaineQuestion(base,reponses=[],historique="",documentInfos=[]){
  const etat=construireEtatConversation(
    base,
    historique,
    documentInfos
  );

  const info=etat.informations;
  const known=etat.types;
  const c=etat.contexte;

  if(
    c.immigration&&
    !known.has("presence_france")&&
    !known.has("situation")
  ){
    return "Êtes-vous actuellement en France ?";
  }

  if(
    c.immigration&&
    !known.has("depot")&&
    !known.has("document_recu")
  ){
    return "Avez-vous déjà déposé votre demande ?";
  }

  const depot=etatDepot(
    fusionnerInformations(
      reponses,
      info
    )
  );

  if(
    depot==="oui"&&
    !known.has("document_recu")
  ){
    return "Avez-vous reçu un récépissé ou une attestation ?";
  }

  if(
    c.entreprise&&
    !known.has("activite")
  ){
    return "Quelle est l'activité exacte que vous souhaitez exercer ?";
  }

  if(
    c.travail&&
    !known.has("objectif_professionnel")
  ){
    return "Quel type de poste recherchez-vous ?";
  }

  if(
    c.travail&&
    known.has("objectif_professionnel")&&
    !known.has("profil_emploi")
  ){
    return "Avez-vous un diplôme ou une expérience professionnelle dans ce domaine ?";
  }

  if(
    c.logement&&
    !known.has("logement")
  ){
    return "Quel type de logement recherchez-vous et dans quelle ville ?";
  }

  return "Quelle est votre priorité principale aujourd'hui ?";
}

/* =========================================================
   SOURCES OFFICIELLES
   ========================================================= */

function selectSources(c){
  const ids=[];

  if(c.immigration){
    ids.push("anef");
  }

  if(c.immigration&&c.travail){
    ids.push("travailEtranger");
  }

  if(c.travail){
    ids.push("franceTravail");
  }

  if(c.entreprise||c.statut){
    ids.push("statut");
  }

  if(c.entreprise){
    ids.push("guichet");
  }

  return unique(ids).map(id=>SOURCES[id]);
}

/* =========================================================
   RÈGLES DE SÉCURITÉ / VÉRIFICATION
   ========================================================= */

function ruleConfirmed(q,c){
  const a=[];

  if(c.immigration){
    a.push(
      "La question concerne une démarche liée à la situation d'un étranger en France."
    );
  }

  if(c.travail){
    a.push(
      "La question concerne le travail, l'emploi ou la situation professionnelle."
    );
  }

  if(c.entreprise){
    a.push(
      "La question concerne une activité professionnelle ou un projet d'entreprise."
    );
  }

  if(c.message){
    a.push(
      "L'utilisateur souhaite comprendre, rédiger ou traiter un message."
    );
  }

  return unique(a);
}

function ruleVerify(q,c){
  const a=[];

  if(c.immigration){
    a.push(
      "Les conditions exactes dépendent du titre, de la nationalité, de la démarche et de la situation personnelle : vérifier la procédure officielle."
    );
  }

  if(c.travail&&!c.immigration){
    a.push(
      "Les conditions du poste, du contrat et du recrutement doivent être vérifiées selon l'offre et la situation."
    );
  }

  if(c.entreprise){
    a.push(
      "Le choix d'un statut et les formalités dépendent de l'activité exacte et de sa réglementation éventuelle."
    );
  }

  if(c.juridique){
    a.push(
      "Pour une situation juridique individuelle ou un litige, une vérification professionnelle peut être nécessaire."
    );
  }

  return unique(a);
}

function ruleActions(q,c){
  const a=[];

  if(c.immigration){
    a.push(
      "Identifier la démarche exacte et vérifier la procédure officielle correspondante."
    );
  }

  if(c.travail){
    a.push(
      "Préciser le métier, la zone géographique et les contraintes du poste."
    );
  }

  if(c.entreprise){
    a.push(
      "Décrire précisément les prestations ou produits proposés avant de choisir une forme juridique."
    );
  }

  if(c.message){
    a.push(
      "Lire attentivement le message reçu et identifier ce qui est demandé avant d'agir."
    );
  }

  return unique(a);
}

function ruleRecommendations(q,c){
  const a=[];

  if(c.immigration){
    a.push(
      "Conserver les justificatifs et utiliser en priorité les informations officielles."
    );
  }

  if(c.travail){
    a.push(
      "Comparer plusieurs offres et vérifier les conditions réelles du poste."
    );
  }

  if(c.entreprise){
    a.push(
      "Comparer les formes juridiques avant de retenir celle qui correspond au projet."
    );
  }

  return unique(a);
}

/* =========================================================
   PROMPT IA
   ========================================================= */

function systemPrompt(langue){
  return `Tu es GouRare AI, assistant d'orientation France-first.

Ta mission est d'aider l'utilisateur à comprendre sa situation et à déterminer la prochaine étape utile.

Tu n'es pas avocat, médecin, administration, expert-comptable ou représentant officiel.

RÈGLES ESSENTIELLES :

1. Utilise les informations déjà présentes dans la conversation.
2. Ne redemande jamais une information déjà clairement fournie.
3. Si des informations importantes manquent, pose UNE SEULE question à la fois.
4. Ne pose pas plusieurs questions dans le même message.
5. Distingue clairement les informations confirmées des éléments à vérifier.
6. Si un document, une image, une capture d'écran ou un message est fourni, utilise son contenu pour comprendre la situation.
7. Ne prétends jamais qu'une information est écrite dans un document si elle n'y apparaît pas.
8. N'invente jamais de loi, article, montant, délai, seuil, sanction, obligation ou condition.
9. Les sources officielles fournies par le moteur sont prioritaires.
10. Pour les informations administratives ou juridiques sensibles, indique lorsqu'une vérification officielle est nécessaire.
11. Utilise le nom actuel France Travail et non Pôle Emploi.
12. Réponds en ${langue==="ar"?"arabe clair":"français clair"}.
13. Sois pratique, précis et compréhensible.
14. Ne donne pas de fausses citations.
15. Ne transforme pas une hypothèse en fait.

Lorsqu'un document est analysé :
- indique ce qui est clairement visible ou extrait ;
- indique ce qui doit être vérifié ;
- explique l'action potentiellement nécessaire ;
- évite de reproduire inutilement les données personnelles sensibles.`;
}

/* =========================================================
   APPEL WORKERS AI
   ========================================================= */

async function askAI(env,prompt,langue="fr"){
  if(!env||!env.IA){
    throw new Error("Binding IA indisponible.");
  }

  const r=await env.IA.run(MODEL,{
    messages:[
      {
        role:"system",
        content:systemPrompt(langue)
      },
      {
        role:"user",
        content:texte(prompt,50000)
      }
    ]
  });

  const text=
    typeof r==="string"
      ?r
      :(r?.response||r?.result||"");

  if(!text){
    throw new Error("Réponse IA vide.");
  }

  return String(text);
}

/* =========================================================
   FALLBACK SÉCURISÉ
   ========================================================= */

function safeFallback(q,c,langue){
  if(langue==="ar"){
    if(c.travail){
      return "فهمت أنك تبحث عن عمل. سأساعدك خطوة بخطوة حسب وضعك ومؤهلاتك والوظيفة التي تبحث عنها.";
    }

    if(c.immigration){
      return "فهمت أن طلبك يتعلق بوضعك الإداري في فرنسا. يمكنني مساعدتك خطوة بخطوة، مع ضرورة التحقق من الإجراءات الرسمية.";
    }

    if(c.entreprise){
      return "فهمت أن لديك مشروعًا مهنيًا أو تجاريًا. سنحدد النشاط أولًا ثم ننتقل إلى الخطوات المناسبة.";
    }

    return "فهمت طلبك. سأساعدك خطوة بخطوة انطلاقًا من وضعك وهدفك.";
  }

  if(c.immigration){
    return "Votre demande concerne votre situation administrative en France. Je vais vous orienter étape par étape et vérifier les informations importantes dans les sources officielles.";
  }

  if(c.travail){
    return "Votre demande concerne le travail ou la recherche d'emploi. Nous allons préciser votre objectif puis déterminer les prochaines étapes utiles.";
  }

  if(c.entreprise){
    return "Votre demande concerne un projet professionnel ou entrepreneurial. Nous allons d'abord préciser l'activité, puis déterminer les démarches adaptées.";
  }

  return "J'ai compris votre demande. Je vais vous orienter étape par étape à partir de votre situation et de votre objectif.";
}
/* =========================================================
   CONSTRUCTION DU DOSSIER DE SITUATION
   ========================================================= */

function construireDossier(question,historique,documentInfos=[]){
  const etat=construireEtatConversation(
    question,
    historique,
    documentInfos
  );

  const contexte=etat.contexte;

  const confirmees=fusionnerInformations(
    etat.informations,
    documentInfos?.confirmees||[]
  );

  const aVerifier=dedupeInformations(
    documentInfos?.aVerifier||[]
  );

  return {
    contexte,
    informations:confirmees,
    aVerifier,
    resumeDocument:texte(
      documentInfos?.resume||"",
      3000
    )
  };
}


/* =========================================================
   PROMPT ANALYSE PRINCIPALE
   ========================================================= */

function construirePromptAnalyse({
  question,
  historique,
  dossier,
  langue
}){
  const sources=selectSources(dossier.contexte);

  const informations=dossier.informations
    .map(x=>`- ${x.type}: ${x.valeur} [source: ${x.source}]`)
    .join("\n");

  const verification=dossier.aVerifier
    .map(x=>`- ${x.type}: ${x.valeur}`)
    .join("\n");

  const sourcesTexte=sources.length
    ?sources
      .map(x=>`- ${x.organisme}: ${x.titre} — ${x.url}`)
      .join("\n")
    :"Aucune source officielle spécifique n'a été sélectionnée par le moteur.";

  return `
SITUATION DE L'UTILISATEUR
--------------------------
${question}

HISTORIQUE DE LA CONVERSATION
-----------------------------
${texte(historique,LIMITS.historique)||"Aucun historique disponible."}

INFORMATIONS DÉJÀ IDENTIFIÉES
------------------------------
${informations||"Aucune information structurée disponible."}

ÉLÉMENTS EXTRAITS D'UN DOCUMENT OU MESSAGE
------------------------------------------
${verification||"Aucun élément nécessitant une vérification particulière."}

RÉSUMÉ DU DOCUMENT
------------------
${dossier.resumeDocument||"Aucun document analysé."}

CONTEXTE DÉTECTÉ
----------------
${JSON.stringify(dossier.contexte)}

SOURCES OFFICIELLES DISPONIBLES
--------------------------------
${sourcesTexte}

INSTRUCTION
-----------
Analyse la demande en tenant compte de toutes les informations déjà disponibles.

Si une information essentielle manque, pose UNE SEULE question courte et précise.

Ne redemande jamais une information déjà connue.

Si les informations sont suffisantes :
- explique brièvement la situation ;
- donne les prochaines étapes concrètes ;
- utilise les sources officielles pertinentes ;
- distingue les faits des éléments à vérifier.

Si un document ou message a été analysé :
- utilise les informations réellement extraites ;
- ne prétends pas voir une information qui n'a pas été extraite ;
- signale les éléments incertains ;
- explique ce que l'utilisateur devrait éventuellement faire ensuite.

Ne donne jamais plusieurs questions à la fois.

Réponds en ${langue==="ar"?"arabe clair":"français clair"}.
`;
}


/* =========================================================
   ANALYSE QUESTION
   ========================================================= */

async function analyserQuestion(env,question,historique="",langue="fr",documentInfos=null){
  const q=texte(question,LIMITS.question);

  if(!q){
    return {
      ok:false,
      error:"Question vide."
    };
  }

  const dossier=construireDossier(
    q,
    historique,
    documentInfos||{}
  );

  const contexte=dossier.contexte;

  const sources=selectSources(contexte);

  const infos=dossier.informations;

  const questionSuivante=prochaineQuestion(
    q,
    infos,
    historique,
    documentInfos||{}
  );

  const prompt=construirePromptAnalyse({
    question:q,
    historique,
    dossier,
    langue
  });

  try{
    const response=await askAI(
      env,
      prompt,
      langue
    );

    return {
      ok:true,
      version:VERSION,
      reponse:response,
      contexte,
      informations:infos,
      aVerifier:dossier.aVerifier,
      prochaineQuestion:questionSuivante,
      sources
    };
  }catch(error){
    console.error(
      "analyserQuestion:",
      error?.message||error
    );

    return {
      ok:true,
      version:VERSION,
      reponse:safeFallback(
        q,
        contexte,
        langue
      ),
      contexte,
      informations:infos,
      aVerifier:dossier.aVerifier,
      prochaineQuestion:questionSuivante,
      sources,
      aiStatus:"indisponible"
    };
  }
}


/* =========================================================
   ANALYSE IMAGE / DOCUMENT / MESSAGE
   ========================================================= */

async function analyserImage(
  env,
  dataURL,
  question="",
  historique="",
  langue="fr"
){
  if(!env||!env.IA){
    throw new Error("Binding IA indisponible.");
  }

  if(!isValidImageDataURL(dataURL)){
    throw new Error("Format image non accepté.");
  }

  const b64=base64FromDataURL(dataURL);

  if(
    !b64||
    approxBytesFromBase64(b64)>LIMITS.imageData
  ){
    throw new Error("Image trop volumineuse.");
  }

  const prompt=`
Tu es le module de lecture documentaire de GouRare AI.

Analyse l'image fournie.

Elle peut contenir :
- un document administratif ;
- une lettre ;
- un email ;
- une capture d'écran ;
- un SMS ou message ;
- une annonce ;
- un CV ;
- un formulaire ;
- tout autre texte utile.

OBJECTIF :

1. Lire uniquement ce qui est réellement visible.
2. Identifier le type probable de document ou message.
3. Extraire les informations importantes.
4. Identifier les dates visibles.
5. Identifier les références ou numéros visibles.
6. Identifier l'organisme ou l'expéditeur lorsqu'il est visible.
7. Identifier les demandes, pièces ou actions mentionnées.
8. Identifier les échéances visibles.
9. Identifier les décisions éventuelles.
10. Signaler les éléments difficiles à lire ou incertains.
11. Ne jamais inventer une information absente.

QUESTION DE L'UTILISATEUR :
${texte(question,6000)||"L'utilisateur souhaite comprendre ce document."}

HISTORIQUE :
${texte(historique,10000)}

Retourne STRICTEMENT un objet JSON valide sous cette structure :

{
  "type_document":"",
  "resume":"",
  "confirmees":[
    {
      "type":"",
      "valeur":"",
      "preuve":"visible"
    }
  ],
  "a_verifier":[
    {
      "type":"",
      "valeur":"",
      "raison":""
    }
  ],
  "actions_detectees":[],
  "dates_detectees":[],
  "references_detectees":[],
  "texte_visible":""
}

Ne retourne aucun texte avant ou après le JSON.
`;

  const result=await env.IA.run(
    MODEL_VISION,
    {
      messages:[
        {
          role:"system",
          content:"Tu es un extracteur documentaire précis. Ne fabrique aucune information."
        },
        {
          role:"user",
          content:[
            {
              type:"text",
              text:prompt
            },
            {
              type:"image_url",
              image_url:{
                url:dataURL
              }
            }
          ]
        }
      ]
    }
  );

  const raw=
    typeof result==="string"
      ?result
      :(result?.response||result?.result||"");

  if(!raw){
    throw new Error("Analyse image vide.");
  }

  let parsed=null;

  try{
    parsed=JSON.parse(
      String(raw)
        .replace(/^```json/i,"")
        .replace(/^```/i,"")
        .replace(/```$/,"")
        .trim()
    );
  }catch(error){
    parsed={
      type_document:"document ou message",
      resume:texte(raw,3000),
      confirmees:[],
      a_verifier:[
        {
          type:"analyse",
          valeur:"Le module a retourné une réponse non structurée.",
          raison:"Format JSON inattendu."
        }
      ],
      actions_detectees:[],
      dates_detectees:[],
      references_detectees:[],
      texte_visible:""
    };
  }

  const documentText=texte(
    parsed.texte_visible||
    parsed.resume||
    "",
    LIMITS.documentText
  );

  const regles=extraireInformationsDocument(
    documentText,
    "document"
  );

  const confirmees=[
    ...(Array.isArray(parsed.confirmees)
      ?parsed.confirmees
      :[]
    )
      .filter(x=>x&&x.type&&x.valeur)
      .map(x=>({
        type:x.type,
        valeur:x.valeur,
        source:"document"
      })),
    ...regles.confirmees
  ];

  const aVerifier=[
    ...(Array.isArray(parsed.a_verifier)
      ?parsed.a_verifier
      :[]
    )
      .filter(x=>x&&x.type&&x.valeur)
      .map(x=>({
        type:x.type,
        valeur:x.valeur,
        source:"document"
      })),
    ...regles.aVerifier
  ];

  return {
    ok:true,
    version:VERSION,
    typeDocument:texte(
      parsed.type_document||"Document",
      300
    ),
    resume:texte(
      parsed.resume||regles.resume,
      3000
    ),
    confirmees:dedupeInformations(confirmees),
    aVerifier:dedupeInformations(aVerifier),
    actions:Array.isArray(parsed.actions_detectees)
      ?parsed.actions_detectees.slice(0,20).map(x=>texte(x,500))
      :[],
    dates:Array.isArray(parsed.dates_detectees)
      ?parsed.dates_detectees.slice(0,20).map(x=>texte(x,200))
      :[],
    references:Array.isArray(parsed.references_detectees)
      ?parsed.references_detectees.slice(0,20).map(x=>texte(x,200))
      :[],
    texteVisible:documentText
  };
}


/* =========================================================
   TRANSCRIPTION AUDIO
   ========================================================= */

async function transcrireAudio(env,dataURL){
  if(!env||!env.IA){
    throw new Error("Binding IA indisponible.");
  }

  if(!isValidAudioDataURL(dataURL)){
    throw new Error("Format audio non accepté.");
  }

  const b64=base64FromDataURL(dataURL);

  if(
    !b64||
    approxBytesFromBase64(b64)>LIMITS.audioData
  ){
    throw new Error("Audio trop volumineux.");
  }

  const result=await env.IA.run(
    MODEL_AUDIO,
    {
      audio:b64
    }
  );

  const text=
    typeof result==="string"
      ?result
      :(
        result?.text||
        result?.transcription||
        result?.response||
        ""
      );

  if(!text){
    throw new Error("Transcription vide.");
  }

  return texte(text,LIMITS.question);
}


/* =========================================================
   HEALTH
   ========================================================= */

function healthResponse(){
  return jsonResponse({
    ok:true,
    service:"GouRare AI",
    version:VERSION,
    aiModel:MODEL,
    visionModel:MODEL_VISION,
    audioModel:MODEL_AUDIO,
    timestamp:new Date().toISOString()
  },200,securityHeaders());
}


/* =========================================================
   SOURCES HTML
   ========================================================= */

function sourceHTML(sources){
  if(!Array.isArray(sources)||!sources.length){
    return "";
  }

  return `
    <section class="sources">
      <h3>Sources officielles pertinentes</h3>
      ${sources.map(source=>`
        <a
          href="${escapeHTML(source.url)}"
          target="_blank"
          rel="noopener noreferrer"
          class="source-card"
        >
          <strong>${escapeHTML(source.organisme)}</strong>
          <span>${escapeHTML(source.titre)}</span>
        </a>
      `).join("")}
    </section>
  `;
}


/* =========================================================
   PAGE HTML
   ========================================================= */

function pageHTML(){
  const parcoursJSON=JSON.stringify(PARCOURS);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="GouRare AI — Votre intelligence d'orientation.">
<title>GouRare AI</title>

<style>
*{
  box-sizing:border-box;
}

body{
  margin:0;
  font-family:Arial,Helvetica,sans-serif;
  background:#f5f7fa;
  color:#172033;
}

header{
  padding:22px 18px;
  background:#ffffff;
  border-bottom:1px solid #e5e7eb;
}

.logo{
  font-size:30px;
  font-weight:800;
  letter-spacing:-1px;
}

.subtitle{
  color:#667085;
  margin-top:5px;
}

.version{
  font-size:12px;
  color:#98a2b3;
  margin-top:5px;
}

main{
  max-width:980px;
  margin:auto;
  padding:20px;
}

.hero{
  background:#ffffff;
  border-radius:20px;
  padding:24px;
  box-shadow:0 8px 30px rgba(16,24,40,.06);
  margin-bottom:18px;
}

.hero h1{
  margin:0 0 8px;
}

.hero p{
  line-height:1.6;
  color:#667085;
}

.cancer{
  margin-top:18px;
  padding:16px;
  border-radius:15px;
  background:#fff7f7;
  border:1px solid #f3d4d4;
}

.roles{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(210px,1fr));
  gap:12px;
  margin:18px 0;
}

.role{
  border:1px solid #e4e7ec;
  background:#fff;
  border-radius:15px;
  padding:16px;
  cursor:pointer;
  text-align:left;
}

.role:hover{
  border-color:#98a2b3;
}

.role strong{
  display:block;
  font-size:16px;
  margin-bottom:5px;
}

.role span{
  color:#667085;
  font-size:13px;
}

.situations{
  margin-top:14px;
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
  gap:9px;
}

.situation{
  border:1px solid #e4e7ec;
  background:#fff;
  border-radius:12px;
  padding:11px;
  cursor:pointer;
  text-align:left;
}

.composer{
  background:#fff;
  border-radius:18px;
  padding:16px;
  box-shadow:0 8px 30px rgba(16,24,40,.05);
}

textarea{
  width:100%;
  min-height:130px;
  resize:vertical;
  border:1px solid #d0d5dd;
  border-radius:14px;
  padding:14px;
  font-size:16px;
  outline:none;
}

textarea:focus{
  border-color:#667085;
}

.actions{
  display:flex;
  flex-wrap:wrap;
  gap:9px;
  margin-top:10px;
}

button,
.file-button{
  border:0;
  border-radius:11px;
  padding:11px 15px;
  cursor:pointer;
  font-weight:600;
  background:#172033;
  color:#fff;
}

.secondary{
  background:#eef2f6;
  color:#172033;
}

input[type=file]{
  display:none;
}

.status{
  margin-top:14px;
  color:#667085;
  font-size:14px;
}

.result{
  margin-top:18px;
  background:#fff;
  border-radius:18px;
  padding:20px;
  line-height:1.7;
  box-shadow:0 8px 30px rgba(16,24,40,.05);
}

.result pre{
  white-space:pre-wrap;
  font-family:inherit;
}

.sources{
  margin-top:18px;
  display:grid;
  gap:10px;
}

.sources h3{
  grid-column:1/-1;
}

.source-card{
  display:block;
  padding:13px;
  border:1px solid #e4e7ec;
  border-radius:12px;
  color:#172033;
  text-decoration:none;
}

.source-card span{
  display:block;
  color:#667085;
  font-size:13px;
  margin-top:4px;
}

.doc-box{
  margin-top:14px;
  padding:14px;
  border-radius:12px;
  background:#f8fafc;
  border:1px solid #e4e7ec;
}

footer{
  text-align:center;
  color:#98a2b3;
  font-size:12px;
  padding:25px;
}

@media(max-width:600px){
  main{
    padding:12px;
  }

  .hero{
    padding:18px;
  }

  .roles{
    grid-template-columns:1fr;
  }
}
</style>
</head>

<body>

<header>
  <div class="logo">GouRare AI</div>
  <div class="subtitle">Votre intelligence d'orientation</div>
  <div class="version">Version ${VERSION}</div>
</header>

<main>

<section class="hero">

<h1>Votre intelligence d'orientation.</h1>

<p>
Un assistant France-first pour comprendre votre situation,
identifier les prochaines étapes et vous orienter vers
les informations pertinentes.
</p>

<div class="cancer">
<strong>🎗️ Avec vous contre le cancer</strong>
<br>
<span>
🎗️ Notre soutien aux personnes touchées par le cancer.
</span>
</div>

</section>

<div id="roles" class="roles"></div>

<div id="situations" class="situations"></div>

<section class="composer">

<textarea
id="question"
placeholder="Décrivez votre situation ou votre question..."
></textarea>

<div class="actions">

<button id="send">
Envoyer
</button>

<label class="file-button secondary">
📷 Ajouter une image
<input
id="image"
type="file"
accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
>
</label>

<button id="voice" class="secondary">
🎙️ Parler
</button>

<button id="clear" class="secondary">
Effacer
</button>

</div>

<div id="status" class="status"></div>

</section>

<section id="result" class="result" style="display:none"></section>

</main>

<footer>
GouRare AI — Version ${VERSION}
</footer>

<script>
const PARCOURS=${parcoursJSON};

let selectedRole="";
let historique=[];
let documentInfos=null;
let mediaRecorder=null;
let audioChunks=[];
let recordingTimer=null;

const questionEl=document.getElementById("question");
const statusEl=document.getElementById("status");
const resultEl=document.getElementById("result");
const rolesEl=document.getElementById("roles");
const situationsEl=document.getElementById("situations");

function escapeClient(value){
  return String(value||"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function addHistory(role,text){
  historique.push({
    role,
    content:String(text||"")
  });

  if(historique.length>30){
    historique=historique.slice(-30);
  }
}

function historyText(){
  return historique
    .map(x=>x.role+": "+x.content)
    .join("\\n")
    .slice(-24000);
}

function renderRoles(){

  rolesEl.innerHTML="";

  Object.entries(PARCOURS).forEach(([key,value])=>{

    const button=document.createElement("button");

    button.className="role";

    button.innerHTML=
      "<strong>"+escapeClient(value.titre)+"</strong>"+
      "<span>"+escapeClient(value.description)+"</span>";

    button.onclick=()=>{
      selectedRole=key;
      renderSituations(key);
    };

    rolesEl.appendChild(button);
  });
}

function renderSituations(key){

  const parcours=PARCOURS[key];

  situationsEl.innerHTML="";

  if(!parcours){
    return;
  }

  parcours.situations.forEach(item=>{

    const button=document.createElement("button");

    button.className="situation";

    button.textContent=item[1];

    button.onclick=()=>{

      const text=item[1].replace(/^\\S+\\s/,"");

      questionEl.value=text;

      questionEl.focus();
    };

    situationsEl.appendChild(button);
  });
}

function setStatus(text){
  statusEl.textContent=text||"";
}

function showResult(data){

  resultEl.style.display="block";

  let html="";

  if(data.reponse){
    html+="<pre>"+escapeClient(data.reponse)+"</pre>";
  }

  if(data.document){

    html+=
      "<div class='doc-box'>"+
      "<strong>📄 Document analysé</strong><br>"+
      escapeClient(
        data.document.resume||
        "Le document a été analysé."
      )+
      "</div>";

    if(
      data.document.confirmees&&
      data.document.confirmees.length
    ){

      html+=
        "<div class='doc-box'>"+
        "<strong>Informations extraites</strong><br>"+
        data.document.confirmees
          .map(x=>
            "• "+
            escapeClient(x.type)+
            " : "+
            escapeClient(x.valeur)
          )
          .join("<br>")+
        "</div>";
    }

    if(
      data.document.aVerifier&&
      data.document.aVerifier.length
    ){

      html+=
        "<div class='doc-box'>"+
        "<strong>⚠️ À vérifier</strong><br>"+
        data.document.aVerifier
          .map(x=>
            "• "+
            escapeClient(x.valeur)
          )
          .join("<br>")+
        "</div>";
    }
  }

  if(data.sources&&data.sources.length){

    html+=
      "<div class='sources'>"+
      "<h3>Sources officielles pertinentes</h3>"+
      data.sources.map(source=>
        "<a class='source-card' "+
        "href='"+escapeClient(source.url)+"' "+
        "target='_blank' "+
        "rel='noopener noreferrer'>"+
        "<strong>"+
        escapeClient(source.organisme)+
        "</strong>"+
        "<span>"+
        escapeClient(source.titre)+
        "</span>"+
        "</a>"
      ).join("")+
      "</div>";
  }

  resultEl.innerHTML=html;
}

async function sendQuestion(){

  const question=questionEl.value.trim();

  if(!question){
    setStatus("Décrivez votre situation avant d'envoyer.");
    return;
  }

  setStatus("Analyse en cours...");

  try{

    const response=await fetch(
      "/api/analyze",
      {
        method:"POST",
        headers:{
          "content-type":"application/json"
        },
        body:JSON.stringify({
          question,
          historique:historyText(),
          langue:"fr",
          documentInfos
        })
      }
    );

    const data=await response.json();

    if(!response.ok){
      throw new Error(
        data?.error||
        "Erreur serveur."
      );
    }

    addHistory("Utilisateur",question);

    if(data.reponse){
      addHistory("GouRare AI",data.reponse);
    }

    showResult(data);

    questionEl.value="";

    setStatus("");

  }catch(error){

    console.error(error);

    setStatus(
      "Une erreur est survenue. Vérifiez les logs du Worker."
    );
  }
}

async function analyzeImage(file){

  if(!file){
    return;
  }

  if(file.size>5500000){

    setStatus(
      "L'image est trop volumineuse. Maximum : 5,5 Mo."
    );

    return;
  }

  setStatus(
    "Lecture du document ou de l'image en cours..."
  );

  const reader=new FileReader();

  reader.onload=async()=>{

    try{

      const response=await fetch(
        "/api/image",
        {
          method:"POST",
          headers:{
            "content-type":"application/json"
          },
          body:JSON.stringify({
            image:reader.result,
            question:questionEl.value,
            historique:historyText(),
            langue:"fr"
          })
        }
      );

      const data=await response.json();

      if(!response.ok){
        throw new Error(
          data?.error||
          "Erreur analyse image."
        );
      }

      documentInfos={
        confirmees:data.confirmees||[],
        aVerifier:data.aVerifier||[],
        resume:data.resume||""
      };

      showResult({
        document:data,
        sources:[]
      });

      setStatus(
        "Document analysé. Vous pouvez maintenant poser votre question."
      );

    }catch(error){

      console.error(error);

      setStatus(
        "Impossible d'analyser ce document."
      );
    }
  };

  reader.readAsDataURL(file);
}

async function startVoice(){

  if(!navigator.mediaDevices||
     !navigator.mediaDevices.getUserMedia){

    setStatus(
      "Le microphone n'est pas disponible sur cet appareil."
    );

    return;
  }

  try{

    const stream=
      await navigator.mediaDevices.getUserMedia({
        audio:true
      });

    const candidates=[
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg"
    ];

    const mime=
      candidates.find(type=>
        MediaRecorder.isTypeSupported(type)
      );

    mediaRecorder=
      mime
        ?new MediaRecorder(stream,{mimeType:mime})
        :new MediaRecorder(stream);

    audioChunks=[];

    mediaRecorder.ondataavailable=event=>{

      if(event.data&&event.data.size){
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop=async()=>{

      clearTimeout(recordingTimer);

      stream.getTracks().forEach(track=>
        track.stop()
      );

      const blob=
        new Blob(
          audioChunks,
          {
            type:mediaRecorder.mimeType||
              "audio/webm"
          }
        );

      if(blob.size>9000000){

        setStatus(
          "Enregistrement trop volumineux."
        );

        return;
      }

      setStatus(
        "Transcription audio en cours..."
      );

      const reader=new FileReader();

      reader.onload=async()=>{

        try{

          const response=await fetch(
            "/api/transcribe",
            {
              method:"POST",
              headers:{
                "content-type":"application/json"
              },
              body:JSON.stringify({
                audio:reader.result
              })
            }
          );

          const data=await response.json();

          if(!response.ok){
            throw new Error(
              data?.error||
              "Erreur transcription."
            );
          }

          if(data.text){

            questionEl.value=
              String(data.text);

            setStatus(
              "Transcription terminée. Vérifiez le texte puis appuyez sur Envoyer."
            );
          }else{

            setStatus(
              "Aucun texte n'a été détecté."
            );
          }

        }catch(error){

          console.error(error);

          setStatus(
            "Impossible de transcrire l'audio."
          );
        }
      };

      reader.readAsDataURL(blob);
    };

    mediaRecorder.start();

    setStatus(
      "🎙️ Enregistrement en cours... Appuyez de nouveau sur Parler pour arrêter."
    );

    recordingTimer=setTimeout(()=>{

      if(
        mediaRecorder&&
        mediaRecorder.state==="recording"
      ){
        mediaRecorder.stop();
      }

    },120000);

  }catch(error){

    console.error(error);

    setStatus(
      "Autorisation du microphone refusée ou indisponible."
    );
  }
}

document.getElementById("send")
  .addEventListener(
    "click",
    sendQuestion
  );

document.getElementById("image")
  .addEventListener(
    "change",
    event=>{
      const file=event.target.files?.[0];

      if(file){
        analyzeImage(file);
      }
    }
  );

document.getElementById("voice")
  .addEventListener(
    "click",
    ()=>{

      if(
        mediaRecorder&&
        mediaRecorder.state==="recording"
      ){
        mediaRecorder.stop();

        setStatus(
          "Arrêt de l'enregistrement..."
        );

      }else{
        startVoice();
      }
    }
  );

document.getElementById("clear")
  .addEventListener(
    "click",
    ()=>{

      questionEl.value="";
      historique=[];
      documentInfos=null;

      resultEl.innerHTML="";
      resultEl.style.display="none";

      setStatus("");
    }
  );

questionEl.addEventListener(
  "keydown",
  event=>{

    if(
      event.key==="Enter"&&
      (event.ctrlKey||event.metaKey)
    ){
      event.preventDefault();
      sendQuestion();
    }
  }
);

renderRoles();

</script>

</body>
</html>`;
}


/* =========================================================
   JSON BODY
   ========================================================= */

async function readJSON(request,maxBytes){
  const contentLength=
    Number(
      request.headers.get("content-length")||0
    );

  if(
    contentLength&&
    contentLength>maxBytes
  ){
    throw new Error("Requête trop volumineuse.");
  }

  const text=await request.text();

  if(
    new TextEncoder().encode(text).byteLength>
    maxBytes
  ){
    throw new Error("Requête trop volumineuse.");
  }

  try{
    return JSON.parse(text);
  }catch(error){
    throw new Error("JSON invalide.");
  }
}


/* =========================================================
   METHOD / ROUTES
   ========================================================= */

function methodNotAllowed(){
  return jsonResponse(
    {
      ok:false,
      error:"Méthode non autorisée."
    },
    405,
    {
      ...securityHeaders(),
      "Allow":"GET, POST"
    }
  );
}

function notFound(){
  return jsonResponse(
    {
      ok:false,
      error:"Route introuvable."
    },
    404,
    securityHeaders()
  );
}


/* =========================================================
   WORKER
   ========================================================= */

export default {

  async fetch(request,env){

    const url=new URL(request.url);

    try{

      /* -------------------------
         HEALTH
      ------------------------- */

      if(
        request.method==="GET"&&
        url.pathname==="/health"
      ){
        return healthResponse();
      }


      /* -------------------------
         PAGE
      ------------------------- */

      if(
        request.method==="GET"&&
        url.pathname==="/"
      ){

        return new Response(
          pageHTML(),
          {
            status:200,
            headers:{
              "content-type":
                "text/html; charset=utf-8",
              ...securityHeaders()
            }
          }
        );
      }


      /* -------------------------
         ANALYZE
      ------------------------- */

      if(
        url.pathname==="/api/analyze"
      ){

        if(request.method!=="POST"){
          return methodNotAllowed();
        }

        if(!rateLimit(request,"analyze")){
          return jsonResponse(
            {
              ok:false,
              error:"Trop de requêtes. Réessayez dans un instant."
            },
            429,
            securityHeaders()
          );
        }

        let body;

        try{
          body=await readJSON(
            request,
            LIMITS.analyzeBody
          );
        }catch(error){

          return jsonResponse(
            {
              ok:false,
              error:error.message
            },
            400,
            securityHeaders()
          );
        }

        const question=
          texte(
            body?.question,
            LIMITS.question
          );

        const historique=
          texte(
            body?.historique,
            LIMITS.historique
          );

        const langue=
          normalizeLang(body?.langue);

        const documentInfos=
          body?.documentInfos&&
          typeof body.documentInfos==="object"
            ?body.documentInfos
            :null;

        if(!question){

          return jsonResponse(
            {
              ok:false,
              error:"Question vide."
            },
            400,
            securityHeaders()
          );
        }

        const result=
          await analyserQuestion(
            env,
            question,
            historique,
            langue,
            documentInfos
          );

        return jsonResponse(
          result,
          200,
          securityHeaders()
        );
      }


      /* -------------------------
         MESSAGE COMPATIBILITY
      ------------------------- */

      if(
        url.pathname==="/api/message"
      ){

        if(request.method!=="POST"){
          return methodNotAllowed();
        }

        if(!rateLimit(request,"analyze")){
          return jsonResponse(
            {
              ok:false,
              error:"Trop de requêtes."
            },
            429,
            securityHeaders()
          );
        }

        let body;

        try{
          body=await readJSON(
            request,
            LIMITS.analyzeBody
          );
        }catch(error){

          return jsonResponse(
            {
              ok:false,
              error:error.message
            },
            400,
            securityHeaders()
          );
        }

        const question=
          texte(
            body?.message||
            body?.question,
            LIMITS.question
          );

        const historique=
          texte(
            body?.historique,
            LIMITS.historique
          );

        const langue=
          normalizeLang(body?.langue);

        if(!question){

          return jsonResponse(
            {
              ok:false,
              error:"Message vide."
            },
            400,
            securityHeaders()
          );
        }

        try{

          const result=
            await analyserQuestion(
              env,
              question,
              historique,
              langue,
              null
            );

          return jsonResponse(
            {
              ok:true,
              version:VERSION,
              reponse:result.reponse,
              sources:result.sources,
              contexte:result.contexte,
              informations:result.informations,
              aVerifier:result.aVerifier,
              prochaineQuestion:result.prochaineQuestion
            },
            200,
            securityHeaders()
          );

        }catch(error){

          console.error(
            "api/message:",
            error?.message||error
          );

          return jsonResponse(
            {
              ok:false,
              error:"Impossible de traiter le message."
            },
            500,
            securityHeaders()
          );
        }
      }


      /* -------------------------
         IMAGE
      ------------------------- */

      if(
        url.pathname==="/api/image"
      ){

        if(request.method!=="POST"){
          return methodNotAllowed();
        }

        if(!rateLimit(request,"image")){
          return jsonResponse(
            {
              ok:false,
              error:"Trop d'analyses d'images. Réessayez plus tard."
            },
            429,
            securityHeaders()
          );
        }

        let body;

        try{
          body=await readJSON(
            request,
            LIMITS.imageBody
          );
        }catch(error){

          return jsonResponse(
            {
              ok:false,
              error:error.message
            },
            400,
            securityHeaders()
          );
        }

        const image=
          String(body?.image||"");

        if(!isValidImageDataURL(image)){

          return jsonResponse(
            {
              ok:false,
              error:"Image invalide ou format non accepté."
            },
            400,
            securityHeaders()
          );
        }

        if(
          approxBytesFromBase64(
            base64FromDataURL(image)
          )>LIMITS.imageData
        ){

          return jsonResponse(
            {
              ok:false,
              error:"Image trop volumineuse."
            },
            413,
            securityHeaders()
          );
        }

        try{

          const result=
            await analyserImage(
              env,
              image,
              texte(body?.question,6000),
              texte(body?.historique,10000),
              normalizeLang(body?.langue)
            );

          return jsonResponse(
            result,
            200,
            securityHeaders()
          );

        }catch(error){

          console.error(
            "api/image:",
            error?.message||error
          );

          return jsonResponse(
            {
              ok:false,
              error:
                "Impossible d'analyser l'image pour le moment."
            },
            500,
            securityHeaders()
          );
        }
      }


      /* -------------------------
         TRANSCRIBE
      ------------------------- */

      if(
        url.pathname==="/api/transcribe"
      ){

        if(request.method!=="POST"){
          return methodNotAllowed();
        }

        if(!rateLimit(request,"transcribe")){
          return jsonResponse(
            {
              ok:false,
              error:"Trop de transcriptions. Réessayez plus tard."
            },
            429,
            securityHeaders()
          );
        }

        let body;

        try{
          body=await readJSON(
            request,
            LIMITS.audioBody
          );
        }catch(error){

          return jsonResponse(
            {
              ok:false,
              error:error.message
            },
            400,
            securityHeaders()
          );
        }

        const audio=
          String(body?.audio||"");

        if(!isValidAudioDataURL(audio)){

          return jsonResponse(
            {
              ok:false,
              error:"Audio invalide ou format non accepté."
            },
            400,
            securityHeaders()
          );
        }

        if(
          approxBytesFromBase64(
            base64FromDataURL(audio)
          )>LIMITS.audioData
        ){

          return jsonResponse(
            {
              ok:false,
              error:"Audio trop volumineux."
            },
            413,
            securityHeaders()
          );
        }

        try{

          const text=
            await transcrireAudio(
              env,
              audio
            );

          return jsonResponse(
            {
              ok:true,
              version:VERSION,
              text
            },
            200,
            securityHeaders()
          );

        }catch(error){

          console.error(
            "api/transcribe:",
            error?.message||error
          );

          return jsonResponse(
            {
              ok:false,
              error:
                "Impossible de transcrire l'audio pour le moment."
            },
            500,
            securityHeaders()
          );
        }
      }


      return notFound();

    }catch(error){

      console.error(
        "Worker:",
        error?.stack||
        error?.message||
        error
      );

      return jsonResponse(
        {
          ok:false,
          error:"Erreur interne du service."
        },
        500,
        securityHeaders()
      );
    }
  }
};
