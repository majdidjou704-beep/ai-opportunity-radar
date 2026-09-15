const MODEL="@cf/meta/llama-3.1-8b-instruct-fast";
const MODEL_VISION="@cf/meta/llama-3.2-11b-vision-instruct";
const MODEL_AUDIO="@cf/openai/whisper-large-v3-turbo";
const VERSION="9.4";

const LIMITS={question:12000,imageFile:5500000,imageData:8000000,audioFile:9000000,audioData:16000000,historique:24000,analyzeBody:400000,imageBody:8500000,audioBody:17000000};
const RATE_LIMITS={analyze:{windowMs:60000,maxRequests:20},image:{windowMs:60000,maxRequests:6},transcribe:{windowMs:60000,maxRequests:6}};
const rateStore=new Map();

const SOURCES={
  anef:{id:"anef",titre:"Démarches des étrangers en France",organisme:"Service-Public.fr",url:"https://www.service-public.fr/particuliers/vosdroits/R59398"},
  travailEtranger:{id:"travailEtranger",titre:"Autorisation de travail d'un étranger salarié en France",organisme:"Service-Public.fr",url:"https://www.service-public.fr/particuliers/vosdroits/F2728"},
  statut:{id:"statut",titre:"Trouver le statut juridique adapté à son activité",organisme:"Service Public Entreprendre",url:"https://entreprendre.service-public.fr/vosdroits/R18323"},
  guichet:{id:"guichet",titre:"Guichet des formalités des entreprises",organisme:"Service Public Entreprendre",url:"https://entreprendre.service-public.fr/vosdroits/F23571"}
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
  return String(v).replace(/\u0000/g,"").replace(/\r/g,"").trim().slice(0,max)
}

function unique(a){
  return [...new Set((a||[]).filter(Boolean))]
}

function escapeHTML(v){
  return texte(v,50000)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;")
}

function jsonResponse(data,status=200,extra={}){
  return new Response(JSON.stringify(data),{
    status,
    headers:{
      "content-type":"application/json; charset=utf-8",
      "cache-control":"no-store",
      ...extra
    }
  })
}

function securityHeaders(){
  return {
    "X-Content-Type-Options":"nosniff",
    "X-Frame-Options":"DENY",
    "Referrer-Policy":"strict-origin-when-cross-origin",
    "Permissions-Policy":"camera=(self), microphone=(self), geolocation=()",
    "Cache-Control":"no-store"
  }
}

function cleanupRateStore(now){
  const stale=now-300000;

  for(const [key,arr] of rateStore){
    if(!arr.length||arr[arr.length-1]<stale){
      rateStore.delete(key);
    }
  }

  if(rateStore.size>10000){
    const entries=[...rateStore.entries()]
      .sort((a,b)=>(a[1].at(-1)||0)-(b[1].at(-1)||0));

    for(let i=0;i<rateStore.size-10000;i++){
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
  return /^data:image\/(?:jpeg|jpg|png|webp);base64,/i.test(String(value||""))
}

function isValidAudioDataURL(value){
  return /^data:audio\/[^,]+;base64,/i.test(String(value||""))
}

function base64FromDataURL(v){
  const s=String(v||"");
  const i=s.indexOf(",");
  return s.startsWith("data:")&&i>=0?s.slice(i+1):s
}

function approxBytesFromBase64(b64){
  return Math.floor((String(b64||"").length*3)/4)
}

function normalizeLang(v){
  const s=texte(v,20).toLowerCase();
  return /^(ar|arab)/.test(s)?"ar":"fr"
}

function detectContext(question){
  const s=texte(question,LIMITS.question).toLowerCase();

  const immigration=
    /\b(titre de séjour|titre de sejour|carte de séjour|carte de sejour|visa|récépissé|recepisse|préfecture|prefecture|anef|étranger|etranger|immigration|asile|demande de séjour|demande de sejour)\b/i.test(s);

  const workProblem=
    /\b(employeur|salarié|salarie|salariée|salariee|contrat de travail|salaire|bulletin de paie|licenciement|licencié|licencie|conditions de travail|heures de travail|patron|collègue|collegue|travailleur)\b/i.test(s);

  const jobSearch=
    /\b(cherche un emploi|cherche du travail|recherche d'emploi|recherche d emploi|trouver un emploi|trouver du travail|candidature|candidat|cv|poste|recrutement|embauche|offre d'emploi|offre d emploi|intérim|interim)\b/i.test(s);

  const businessAction=
    /\b(créer une entreprise|creer une entreprise|création d'entreprise|creation d entreprise|micro-entreprise|micro entreprise|auto-entrepreneur|auto entrepreneur|entrepreneur|lancer mon activité|lancer mon activite|développer mon activité|developper mon activite|statut juridique|société|societe)\b/i.test(s);

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
    message:
      /\b(écris-moi|ecris-moi|rédige|redige|message|mail|email|courrier)\b/i.test(s),
    image:
      /\b(photo|image|document|capture|screenshot)\b/i.test(s),
    audio:false,
    recepisse:
      /\b(récépissé|recepisse|attestation)\b/i.test(s)
  }
}

function extraireInformations(question){
  const s=texte(question,LIMITS.question);
  const l=s.toLowerCase();
  const result=[];

  if(
    /\b(je viens d'arriver|je viens d arriver|nouvel arrivant|nouvelle arrivée|nouvelle arrivee|arrivé récemment|arrive récemment)\b/i.test(l)
  ){
    result.push({
      type:"situation",
      valeur:"arrivée récente en France"
    });
  }

  if(
    /\b(première demande|premiere demande|première fois|premiere fois|jamais demandé|jamais demande)\b/i.test(l)
  ){
    result.push({
      type:"premiere_demande",
      valeur:"oui"
    });
  }

  if(
    /\b(j'ai déposé|j ai depose|demande déposée|demande deposee|dossier déposé|dossier depose|j'ai fait la demande|j ai fait la demande)\b/i.test(l)
  ){
    result.push({
      type:"depot",
      valeur:"oui"
    });
  }

  if(
    /\b(je n'ai pas déposé|je n ai pas depose|aucune demande|pas encore déposé|pas encore depose)\b/i.test(l)
  ){
    result.push({
      type:"depot",
      valeur:"non"
    });
  }

  if(
    /\b(en ligne|internet|anef|en ligne sur anef)\b/i.test(l)
  ){
    result.push({
      type:"procedure",
      valeur:"en ligne / ANEF"
    });
  }

  if(
    /\b(préfecture|prefecture|au guichet|guichet)\b/i.test(l)
  ){
    result.push({
      type:"procedure",
      valeur:"préfecture / guichet"
    });
  }

  if(
    /\b(je n'ai rien reçu|je n ai rien recu|je n'ai pas reçu|je n ai pas recu|aucun récépissé|aucun recepisse|pas reçu de récépissé|pas recu de recepisse|pas d'attestation|pas d attestation)\b/i.test(l)
  ){
    result.push({
      type:"document_recu",
      valeur:"aucun document reçu"
    });
  }

  if(
    /\b(j'ai reçu|j ai recu|reçu un récépissé|recu un recepisse|j'ai une attestation|j ai une attestation|attestation reçue|attestation recue)\b/i.test(l)
  ){
    result.push({
      type:"document_recu",
      valeur:"un document a été reçu"
    });
  }

  if(
    /\b(cherche un emploi|recherche d'emploi|recherche d emploi|cherche du travail|trouver un emploi|trouver du travail|candidature|candidat|recrutement|poste)\b/i.test(l)
  ){
    result.push({
      type:"objectif_professionnel",
      valeur:"recherche d'emploi"
    });
  }

  if(
    /\b(employeur|contrat de travail|salaire|licenciement|bulletin de paie|conditions de travail)\b/i.test(l)
  ){
    result.push({
      type:"objectif_professionnel",
      valeur:"situation professionnelle"
    });
  }

  if(
    /\b(créer une entreprise|creer une entreprise|création d'entreprise|creation d entreprise|micro-entreprise|micro entreprise|auto-entrepreneur|auto entrepreneur|lancer mon activité|lancer mon activite|mon entreprise|mon activité|mon activite)\b/i.test(l)
  ){
    result.push({
      type:"activite",
      valeur:"projet entrepreneurial mentionné"
    });
  }

  if(
    /\b(cv|curriculum vitae)\b/i.test(l)
  ){
    result.push({
      type:"document",
      valeur:"CV"
    });
  }

  return result;
}

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

function prochaineQuestion(base,reponses){
  const info=extraireInformations(base);
  const known=new Set((reponses||[]).map(x=>x.type));

  if(
    !known.has("situation")&&
    !info.some(x=>x.type==="situation")&&
    detectContext(base).immigration
  ){
    return "Êtes-vous déjà en France actuellement ?";
  }

  let depot=etatDepot(reponses);

  if(depot==="inconnu"){
    const depotInitial=etatDepot(base);

    if(depotInitial!=="inconnu"){
      depot=depotInitial;
    }else{
      const depotInfo=info.find(x=>x.type==="depot");

      if(depotInfo){
        depot=depotInfo.valeur.includes("aucun")?"non":"oui";
      }
    }
  }

  if(
    depot==="inconnu"&&
    detectContext(base).immigration
  ){
    return "Avez-vous déjà déposé votre demande ?";
  }

  if(
    depot==="oui"&&
    !known.has("document_recu")&&
    !info.some(x=>x.type==="document_recu")
  ){
    return "Avez-vous reçu un récépissé ou une attestation ?";
  }

  if(
    detectContext(base).entreprise&&
    !known.has("activite")&&
    !info.some(x=>x.type==="activite")
  ){
    return "Quelle est l'activité exacte que vous souhaitez exercer ?";
  }

  if(
    detectContext(base).travail&&
    !known.has("objectif_professionnel")&&
    !info.some(x=>x.type==="objectif_professionnel")
  ){
    return "Quel type de poste recherchez-vous ?";
  }

  return "Quelle est votre priorité principale aujourd'hui ?";
}

function selectSources(c){
  const ids=[];

  if(c.immigration){
    ids.push("anef");
  }

  if(c.immigration&&c.travail){
    ids.push("travailEtranger");
  }

  if(c.entreprise||c.statut){
    ids.push("statut");
  }

  if(c.entreprise){
    ids.push("guichet");
  }

  return unique(ids).map(id=>SOURCES[id]);
}

function ruleConfirmed(q,c){
  const a=[];

  if(c.immigration){
    a.push("La question concerne une démarche liée à la situation d'un étranger en France.");
  }

  if(c.travail){
    a.push("La question concerne le travail, l'emploi ou la situation professionnelle.");
  }

  if(c.entreprise){
    a.push("La question concerne une activité professionnelle ou un projet d'entreprise.");
  }

  return unique(a);
}

function ruleVerify(q,c){
  const a=[];

  if(c.immigration){
    a.push("Les conditions exactes dépendent de votre titre, de votre nationalité, de votre démarche et de votre situation : vérifiez la procédure officielle.");
  }

  if(c.travail&&!c.immigration){
    a.push("Les conditions du poste, du contrat et du recrutement doivent être vérifiées selon l'offre et votre situation.");
  }

  if(c.entreprise){
    a.push("Le choix d'un statut et les formalités dépendent de l'activité exacte et de sa réglementation éventuelle.");
  }

  if(c.juridique){
    a.push("Pour une situation juridique individuelle ou un litige, une vérification professionnelle peut être nécessaire.");
  }

  return unique(a);
}

function ruleActions(q,c){
  const a=[];

  if(c.immigration){
    a.push("Identifier la démarche exacte et vérifier la procédure officielle correspondante.");
  }

  if(c.travail){
    a.push("Préciser le métier, la zone géographique et les contraintes du poste.");
  }

  if(c.entreprise){
    a.push("Décrire précisément les prestations ou produits proposés avant de choisir une forme juridique.");
  }

  if(c.message){
    a.push("Relire le message reçu et préciser l'objectif de la réponse avant de l'envoyer.");
  }

  return unique(a);
}

function ruleRecommendations(q,c){
  const a=[];

  if(c.immigration){
    a.push("Conserver les justificatifs et utiliser en priorité les informations officielles.");
  }

  if(c.travail){
    a.push("Comparer plusieurs offres et vérifier les conditions réelles du poste.");
  }

  if(c.entreprise){
    a.push("Comparer les formes juridiques avant de retenir celle qui correspond au projet.");
  }

  return unique(a);
}

function systemPrompt(langue){
  return `Tu es GouRare AI, assistant d'orientation France-first.
Tu aides à comprendre une situation et à choisir la prochaine étape.
Tu n'es pas avocat, médecin, administration ou expert-comptable.
Les sources officielles fournies par le moteur sont prioritaires.
N'invente jamais de loi, article, montant, délai, seuil, sanction, document obligatoire ou condition.
Si une information n'est pas dans les données fournies, dis qu'elle doit être vérifiée.
Réponds en ${langue==="ar"?"arabe clair":"français clair"}.
Ne donne pas de fausses citations.
Donne des conseils pratiques, prudents et compréhensibles.`;
}

async function askAI(env,prompt){
  if(!env||!env.IA){
    throw new Error("Binding IA indisponible.");
  }

  const r=await env.IA.run(MODEL,{
    messages:[
      {
        role:"system",
        content:systemPrompt("fr")
      },
      {
        role:"user",
        content:prompt
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

function safeFallback(q,c,langue){
  if(langue==="ar"){
    return "فهمت طلبك. سأساعدك خطوة بخطوة، لكن المعلومات الإدارية أو القانونية الدقيقة يجب التحقق منها في المصادر الرسمية. حدّد لي وضعك الحالي والهدف الذي تريد الوصول إليه.";
  }

  if(c.immigration){
    return "Votre demande concerne votre situation administrative en France. Je peux vous aider à identifier la démarche et la prochaine étape, mais les conditions exactes doivent être vérifiées selon votre situation.";
  }

  if(c.travail){
    return "Votre demande concerne le travail ou la recherche d'emploi. Nous pouvons préciser le poste recherché, puis déterminer les étapes utiles.";
  }

  if(c.entreprise){
    return "Votre demande concerne un projet professionnel ou entrepreneurial. Il faut d'abord préciser l'activité exacte avant de choisir les démarches ou le statut.";
  }

  return "J'ai compris votre demande. Je peux vous orienter étape par étape à partir de votre situation et de votre objectif.";
}
async function analyserQuestion(env,question,historique=[],langue="fr"){
  const q=texte(question,LIMITS.question);
  const history=texte(JSON.stringify(historique||[]),LIMITS.historique);
  const c=detectContext(q);
  const infos=extraireInformations(q);
  const sources=selectSources(c);

  const prompt=`
${systemPrompt(langue)}

QUESTION UTILISATEUR:
${q}

HISTORIQUE:
${history}

CONTEXTE DÉTECTÉ:
${JSON.stringify(c)}

INFORMATIONS EXPLICITES:
${JSON.stringify(infos)}

SOURCES OFFICIELLES PERTINENTES:
${JSON.stringify(sources)}

RÈGLES DE RÉPONSE:
- Répondre directement à la question.
- Ne pas inventer de faits.
- Ne pas présenter une hypothèse comme un fait.
- Si une information importante manque, poser UNE seule question.
- Ne jamais poser plusieurs questions dans la même réponse.
- Ne pas redemander une information déjà fournie.
- Pour une démarche administrative, expliquer la prochaine étape de façon simple.
- Pour un emploi, aider concrètement à avancer vers une candidature.
- Pour une entreprise, distinguer idée, activité, statut et formalités.
- Pour une situation juridique, rester prudent et recommander une vérification professionnelle si nécessaire.
- Si une source officielle est pertinente, la mentionner comme source à consulter.
- Ne jamais prétendre avoir effectué une démarche à la place de l'utilisateur.
- Ne jamais prétendre avoir contacté une administration ou une entreprise.
- Ne jamais promettre un résultat.
- ${langue==="ar"?"Répondre en arabe clair et naturel.":"Répondre en français clair et naturel."}

Retourne une réponse utile et concise.
`;

  try{
    const answer=await askAI(env,prompt);

    return {
      ok:true,
      version:VERSION,
      answer:texte(answer,20000),
      context:c,
      informations:infos,
      sources,
      nextQuestion:prochaineQuestion(q,infos),
      aiStatus:"disponible",
      fallback:false
    };
  }catch(error){
    console.error("GouRare AI analyse error:",error);

    return {
      ok:true,
      version:VERSION,
      answer:safeFallback(q,c,langue),
      context:c,
      informations:infos,
      sources,
      nextQuestion:prochaineQuestion(q,infos),
      aiStatus:"indisponible",
      fallback:true
    };
  }
}

async function analyserImage(env,dataURL,question="",langue="fr"){
  if(!isValidImageDataURL(dataURL)){
    throw new Error("Format d'image non autorisé.");
  }

  const b64=base64FromDataURL(dataURL);

  if(!b64||approxBytesFromBase64(b64)>LIMITS.imageData){
    throw new Error("Image trop volumineuse.");
  }

  const prompt=`
Analyse cette image pour aider l'utilisateur dans son orientation.

Question éventuelle:
${texte(question,5000)}

Consignes:
- Décris uniquement ce qui est réellement visible.
- Si c'est un document, identifie les éléments utiles sans inventer.
- Si du texte est visible mais difficile à lire, indique clairement l'incertitude.
- Ne donne pas de conseil juridique catégorique uniquement à partir de l'image.
- Si une information doit être vérifiée, indique-le.
- Réponds en ${langue==="ar"?"arabe clair":"français clair"}.
`;

  if(!env||!env.IA){
    throw new Error("Binding IA indisponible.");
  }

  const result=await env.IA.run(MODEL_VISION,{
    messages:[
      {
        role:"system",
        content:systemPrompt(langue)
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
  });

  const answer=
    typeof result==="string"
      ?result
      :(result?.response||result?.result||"");

  if(!answer){
    throw new Error("Analyse image vide.");
  }

  return {
    ok:true,
    version:VERSION,
    answer:String(answer),
    aiStatus:"disponible"
  };
}

async function transcrireAudio(env,dataURL,langue="fr"){
  if(!isValidAudioDataURL(dataURL)){
    throw new Error("Format audio non autorisé.");
  }

  const b64=base64FromDataURL(dataURL);

  if(!b64||approxBytesFromBase64(b64)>LIMITS.audioData){
    throw new Error("Audio trop volumineux.");
  }

  if(!env||!env.IA){
    throw new Error("Binding IA indisponible.");
  }

  const result=await env.IA.run(MODEL_AUDIO,{
    audio:b64
  });

  const text=
    typeof result==="string"
      ?result
      :(result?.text||result?.response||result?.result||"");

  if(!text){
    throw new Error("Transcription audio vide.");
  }

  return {
    ok:true,
    version:VERSION,
    text:texte(text,20000),
    language:langue,
    aiStatus:"disponible"
  };
}

function healthResponse(){
  return jsonResponse({
    ok:true,
    service:"GouRare AI",
    version:VERSION,
    modules:{
      text:true,
      vision:true,
      audio:true,
      orientation:true
    },
    region:"France-first"
  },200,securityHeaders());
}

function sourceHTML(sources){
  if(!sources||!sources.length){
    return "";
  }

  return `
    <section class="sources">
      <h3>Sources officielles pertinentes</h3>
      <div class="source-list">
        ${sources.map(s=>`
          <a
            class="source"
            href="${escapeHTML(s.url)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            <strong>${escapeHTML(s.organisme)}</strong>
            <span>${escapeHTML(s.titre)}</span>
          </a>
        `).join("")}
      </div>
    </section>
  `;
}

function pageHTML(){
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="GouRare AI — Votre intelligence d'orientation en France.">
<meta name="theme-color" content="#0b1020">
<title>GouRare AI</title>

<style>
:root{
  --bg:#07101f;
  --panel:#0e1729;
  --panel2:#121e34;
  --text:#f5f7fb;
  --muted:#aeb8c9;
  --accent:#8ab4ff;
  --accent2:#b9d2ff;
  --border:rgba(255,255,255,.1);
  --danger:#ff8e8e;
  --ok:#8be0ad;
}

*{
  box-sizing:border-box;
}

html{
  scroll-behavior:smooth;
}

body{
  margin:0;
  min-height:100vh;
  background:
    radial-gradient(circle at top,#172a4c 0,#07101f 42%,#040812 100%);
  color:var(--text);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
}

button,
input,
textarea{
  font:inherit;
}

button{
  cursor:pointer;
}

.container{
  width:min(1100px,calc(100% - 28px));
  margin:auto;
}

header{
  padding:22px 0 12px;
}

.brand{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:15px;
}

.logo{
  display:flex;
  align-items:center;
  gap:12px;
}

.logo-mark{
  width:46px;
  height:46px;
  border:1px solid rgba(255,255,255,.22);
  border-radius:15px;
  display:grid;
  place-items:center;
  background:linear-gradient(145deg,#1c3158,#0a1324);
  box-shadow:0 10px 30px rgba(0,0,0,.3);
}

.logo-text{
  font-size:22px;
  font-weight:800;
  letter-spacing:-.5px;
}

.version{
  color:var(--muted);
  font-size:12px;
}

.hero{
  padding:25px 0 18px;
}

.hero h1{
  margin:0 0 10px;
  font-size:clamp(30px,6vw,54px);
  line-height:1.02;
  letter-spacing:-1.8px;
}

.hero p{
  color:var(--muted);
  font-size:17px;
  line-height:1.6;
  max-width:760px;
  margin:0;
}

.cancer{
  margin:22px 0;
  padding:15px 17px;
  border:1px solid rgba(255,255,255,.1);
  border-radius:18px;
  background:rgba(255,255,255,.045);
}

.cancer strong{
  display:block;
  margin-bottom:5px;
}

.cancer span{
  color:var(--muted);
  font-size:14px;
}

.panel{
  background:rgba(14,23,41,.88);
  border:1px solid var(--border);
  border-radius:24px;
  padding:20px;
  box-shadow:0 18px 55px rgba(0,0,0,.25);
  backdrop-filter:blur(15px);
}

.roles{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:10px;
}

.role{
  border:1px solid var(--border);
  background:rgba(255,255,255,.035);
  color:var(--text);
  border-radius:17px;
  padding:15px 12px;
  text-align:left;
  min-height:92px;
  transition:.2s ease;
}

.role:hover{
  transform:translateY(-2px);
  border-color:rgba(138,180,255,.45);
  background:rgba(138,180,255,.08);
}

.role strong{
  display:block;
  margin-bottom:6px;
}

.role span{
  color:var(--muted);
  font-size:12px;
  line-height:1.4;
}

.situations{
  margin-top:20px;
}

.situations h2{
  font-size:17px;
  margin:0 0 12px;
}

.situation-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:9px;
}

.situation{
  border:1px solid var(--border);
  background:rgba(255,255,255,.025);
  color:var(--text);
  padding:12px;
  border-radius:14px;
  text-align:left;
}

.chat{
  margin-top:22px;
}

.messages{
  min-height:190px;
  max-height:52vh;
  overflow:auto;
  padding:3px;
}

.msg{
  display:flex;
  margin:10px 0;
}

.msg.user{
  justify-content:flex-end;
}

.bubble{
  max-width:min(780px,90%);
  padding:12px 14px;
  border-radius:17px;
  line-height:1.55;
  white-space:pre-wrap;
}

.msg.assistant .bubble{
  background:#17243b;
  border:1px solid rgba(255,255,255,.07);
}

.msg.user .bubble{
  background:#24416d;
}

.composer{
  display:flex;
  gap:9px;
  margin-top:12px;
}

.composer textarea{
  flex:1;
  min-height:54px;
  max-height:180px;
  resize:vertical;
  color:var(--text);
  background:#091326;
  border:1px solid var(--border);
  border-radius:17px;
  padding:14px;
  outline:none;
}

.composer textarea:focus{
  border-color:rgba(138,180,255,.6);
}

.actions{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin-top:10px;
}

.btn{
  border:1px solid var(--border);
  background:#111d31;
  color:var(--text);
  border-radius:13px;
  padding:10px 13px;
}

.btn.primary{
  background:#315b95;
  border-color:#4d7fbd;
}

.btn.recording{
  background:#713333;
  border-color:#b65a5a;
}

.btn:disabled{
  opacity:.5;
  cursor:not-allowed;
}

.file-info{
  color:var(--muted);
  font-size:12px;
  margin-top:7px;
}

.sources{
  margin-top:15px;
  border-top:1px solid var(--border);
  padding-top:15px;
}

.sources h3{
  font-size:14px;
  margin:0 0 9px;
}

.source-list{
  display:grid;
  gap:8px;
}

.source{
  text-decoration:none;
  color:var(--text);
  background:rgba(255,255,255,.035);
  border:1px solid var(--border);
  padding:10px 12px;
  border-radius:13px;
}

.source strong,
.source span{
  display:block;
}

.source span{
  color:var(--muted);
  font-size:12px;
  margin-top:3px;
}

.status{
  margin-top:10px;
  min-height:20px;
  color:var(--muted);
  font-size:12px;
}

footer{
  padding:25px 0 35px;
  color:var(--muted);
  text-align:center;
  font-size:12px;
}

.hidden{
  display:none!important;
}

@media(max-width:800px){
  .roles{
    grid-template-columns:repeat(2,1fr);
  }

  .situation-grid{
    grid-template-columns:repeat(2,1fr);
  }
}

@media(max-width:520px){
  .container{
    width:min(100% - 18px,1100px);
  }

  .panel{
    padding:14px;
    border-radius:20px;
  }

  .roles,
  .situation-grid{
    grid-template-columns:1fr;
  }

  .composer{
    flex-direction:column;
  }

  .composer .btn.primary{
    width:100%;
  }
}
</style>
</head>

<body>

<div class="container">

<header>
  <div class="brand">
    <div class="logo">
      <div class="logo-mark">G</div>
      <div>
        <div class="logo-text">GouRare AI</div>
        <div class="version">Votre intelligence d'orientation</div>
      </div>
    </div>
    <div class="version">Version ${VERSION}</div>
  </div>
</header>

<main>

<section class="hero">
  <h1>Votre intelligence d'orientation.</h1>
  <p>
    Un assistant France-first pour comprendre votre situation,
    identifier les prochaines étapes et vous orienter vers les
    informations pertinentes.
  </p>
</section>

<section class="cancer">
  <strong>🎗️ Avec vous contre le cancer</strong>
  <span>🎗️ Notre soutien aux personnes touchées par le cancer.</span>
</section>

<section class="panel">

  <div class="roles" id="roles">
    ${Object.entries(PARCOURS).map(([key,value])=>`
      <button class="role" data-role="${escapeHTML(key)}">
        <strong>${escapeHTML(value.titre)}</strong>
        <span>${escapeHTML(value.description)}</span>
      </button>
    `).join("")}
  </div>

  <div class="situations hidden" id="situations">
    <h2 id="situationTitle"></h2>
    <div class="situation-grid" id="situationGrid"></div>
  </div>

  <div class="chat">
    <div class="messages" id="messages"></div>

    <div class="composer">
      <textarea
        id="question"
        maxlength="${LIMITS.question}"
        placeholder="Décrivez votre situation ou votre question..."
      ></textarea>

      <button class="btn primary" id="sendBtn">Envoyer</button>
    </div>

    <div class="actions">
      <button class="btn" id="imageBtn">📷 Ajouter une image</button>
      <button class="btn" id="voiceBtn">🎙️ Parler</button>
      <button class="btn" id="clearBtn">Effacer</button>
    </div>

    <input
      id="imageInput"
      class="hidden"
      type="file"
      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
    >

    <div class="file-info" id="fileInfo"></div>
    <div class="status" id="status"></div>
    <div id="sources"></div>
  </div>

</section>

</main>

<footer>
  GouRare AI — Version ${VERSION}
</footer>

</div>

<script>
(function(){

const MAX_IMAGE_BYTES=${LIMITS.imageFile};
const MAX_IMAGE_DATA=${LIMITS.imageData};
const MAX_AUDIO_BYTES=${LIMITS.audioFile};
const MAX_AUDIO_DATA=${LIMITS.audioData};
const MAX_RECORDING_MS=120000;

const messages=document.getElementById("messages");
const question=document.getElementById("question");
const sendBtn=document.getElementById("sendBtn");
const imageBtn=document.getElementById("imageBtn");
const voiceBtn=document.getElementById("voiceBtn");
const clearBtn=document.getElementById("clearBtn");
const imageInput=document.getElementById("imageInput");
const status=document.getElementById("status");
const fileInfo=document.getElementById("fileInfo");
const sources=document.getElementById("sources");
const situations=document.getElementById("situations");
const situationTitle=document.getElementById("situationTitle");
const situationGrid=document.getElementById("situationGrid");

let historique=[];
let selectedRole=null;
let mediaRecorder=null;
let mediaStream=null;
let audioChunks=[];
let recordingTimer=null;
let recordingStarted=0;

function addMessage(role,text){
  const row=document.createElement("div");
  row.className="msg "+role;

  const bubble=document.createElement("div");
  bubble.className="bubble";
  bubble.textContent=text;

  row.appendChild(bubble);
  messages.appendChild(row);
  messages.scrollTop=messages.scrollHeight;
}

function setStatus(text){
  status.textContent=text||"";
}

function showSources(items){
  sources.innerHTML="";

  if(!Array.isArray(items)||!items.length){
    return;
  }

  const section=document.createElement("section");
  section.className="sources";

  const h=document.createElement("h3");
  h.textContent="Sources officielles pertinentes";
  section.appendChild(h);

  const list=document.createElement("div");
  list.className="source-list";

  items.forEach(item=>{
    if(!item||!item.url)return;

    const a=document.createElement("a");
    a.className="source";
    a.href=item.url;
    a.target="_blank";
    a.rel="noopener noreferrer";

    const strong=document.createElement("strong");
    strong.textContent=item.organisme||"Source officielle";

    const span=document.createElement("span");
    span.textContent=item.titre||"Consulter la source";

    a.appendChild(strong);
    a.appendChild(span);
    list.appendChild(a);
  });

  section.appendChild(list);
  sources.appendChild(section);
}

function showSituations(role){
  selectedRole=role;
  const data=${JSON.stringify(PARCOURS)};
  const parcours=data[role];

  if(!parcours){
    situations.classList.add("hidden");
    return;
  }

  situationTitle.textContent=parcours.titre;
  situationGrid.innerHTML="";

  parcours.situations.forEach(item=>{
    const btn=document.createElement("button");
    btn.className="situation";
    btn.textContent=item[1];

    btn.addEventListener("click",()=>{
      question.value=item[1].replace(/^[^ ]+ /,"");
      question.focus();
    });

    situationGrid.appendChild(btn);
  });

  situations.classList.remove("hidden");
}

async function sendQuestion(){
  const q=question.value.trim();

  if(!q){
    return;
  }

  addMessage("user",q);
  question.value="";
  sendBtn.disabled=true;
  setStatus("Analyse en cours...");

  try{
    const response=await fetch("/api/analyze",{
      method:"POST",
      headers:{
        "content-type":"application/json"
      },
      body:JSON.stringify({
        question:q,
        historique:historique,
        langue:"fr"
      })
    });

    const data=await response.json();

    if(!response.ok||!data.ok){
      throw new Error(data.error||"Erreur serveur.");
    }

    addMessage("assistant",data.answer||"Réponse indisponible.");

    historique.push({
      role:"user",
      content:q
    });

    historique.push({
      role:"assistant",
      content:data.answer||""
    });

    while(JSON.stringify(historique).length>${LIMITS.historique}){
      historique.shift();
    }

    showSources(data.sources||[]);

    if(data.aiStatus==="indisponible"){
      setStatus("Mode de secours actif.");
    }else{
      setStatus("");
    }

  }catch(error){
    console.error(error);
    addMessage(
      "assistant",
      "Une erreur temporaire est survenue. Vérifiez votre connexion puis réessayez."
    );
    setStatus("Erreur temporaire.");
  }finally{
    sendBtn.disabled=false;
  }
}

function readFileAsDataURL(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();

    reader.onload=()=>{
      const result=String(reader.result||"");

      if(result.length>${LIMITS.imageData}){
        reject(new Error("Image trop volumineuse."));
        return;
      }

      resolve(result);
    };

    reader.onerror=()=>{
      reject(new Error("Lecture de l'image impossible."));
    };

    reader.readAsDataURL(file);
  });
}

async function analyzeImage(file){
  if(!file){
    return;
  }

  if(file.size>MAX_IMAGE_BYTES){
    setStatus("Image trop volumineuse. Maximum 5,5 Mo.");
    return;
  }

  const allowed=[
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if(!allowed.includes(file.type)){
    setStatus("Format d'image non autorisé.");
    return;
  }

  try{
    setStatus("Analyse de l'image...");
    fileInfo.textContent=file.name;

    const dataURL=await readFileAsDataURL(file);

    if(dataURL.length>MAX_IMAGE_DATA){
      throw new Error("Image trop volumineuse.");
    }

    const response=await fetch("/api/image",{
      method:"POST",
      headers:{
        "content-type":"application/json"
      },
      body:JSON.stringify({
        image:dataURL,
        question:question.value.trim(),
        langue:"fr"
      })
    });

    const data=await response.json();

    if(!response.ok||!data.ok){
      throw new Error(data.error||"Analyse impossible.");
    }

    addMessage(
      "assistant",
      data.answer||"Je n'ai pas pu extraire suffisamment d'informations de cette image."
    );

    setStatus("");

  }catch(error){
    console.error(error);
    setStatus(error.message||"Erreur pendant l'analyse.");
  }
}

function chooseMimeType(){
  const candidates=[
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg"
  ];

  if(!window.MediaRecorder){
    return "";
  }

  return candidates.find(type=>{
    try{
      return MediaRecorder.isTypeSupported(type);
    }catch(e){
      return false;
    }
  })||"";
}

function stopRecording(){
  if(mediaRecorder&&mediaRecorder.state!=="inactive"){
    mediaRecorder.stop();
  }

  if(mediaStream){
    mediaStream.getTracks().forEach(track=>track.stop());
    mediaStream=null;
  }

  voiceBtn.classList.remove("recording");
  voiceBtn.textContent="🎙️ Parler";

  if(recordingTimer){
    clearInterval(recordingTimer);
    recordingTimer=null;
  }
}

async function startRecording(){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
    setStatus("Votre navigateur ne permet pas l'enregistrement audio.");
    return;
  }

  if(!window.MediaRecorder){
    setStatus("MediaRecorder n'est pas disponible sur ce navigateur.");
    return;
  }

  try{
    mediaStream=await navigator.mediaDevices.getUserMedia({
      audio:true
    });

    audioChunks=[];

    const mime=chooseMimeType();

    mediaRecorder=new MediaRecorder(
      mediaStream,
      mime?{mimeType:mime}:undefined
    );

    mediaRecorder.ondataavailable=event=>{
      if(event.data&&event.data.size){
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop=async()=>{
      const type=mediaRecorder?.mimeType||"audio/webm";
      const blob=new Blob(audioChunks,{type});

      if(blob.size>MAX_AUDIO_BYTES){
        setStatus("Audio trop volumineux. Maximum 9 Mo.");
        return;
      }

      try{
        setStatus("Transcription en cours...");

        const reader=new FileReader();

        const dataURL=await new Promise((resolve,reject)=>{
          reader.onload=()=>resolve(String(reader.result||""));
          reader.onerror=()=>reject(new Error("Lecture audio impossible."));
          reader.readAsDataURL(blob);
        });

        if(dataURL.length>MAX_AUDIO_DATA){
          throw new Error("Audio trop volumineux.");
        }

        const response=await fetch("/api/transcribe",{
          method:"POST",
          headers:{
            "content-type":"application/json"
          },
          body:JSON.stringify({
            audio:dataURL,
            langue:"fr"
          })
        });

        const data=await response.json();

        if(!response.ok||!data.ok){
          throw new Error(data.error||"Transcription impossible.");
        }

        if(data.text){
          question.value=data.text;
          question.focus();
          setStatus("Transcription terminée.");
        }else{
          setStatus("Aucune parole détectée.");
        }

      }catch(error){
        console.error(error);
        setStatus(error.message||"Erreur de transcription.");
      }
    };

    mediaRecorder.start(250);

    recordingStarted=Date.now();
    voiceBtn.classList.add("recording");
    voiceBtn.textContent="⏹️ Arrêter";

    recordingTimer=setInterval(()=>{
      const elapsed=Date.now()-recordingStarted;

      if(elapsed>=MAX_RECORDING_MS){
        stopRecording();
        return;
      }

      const seconds=Math.floor(elapsed/1000);
      setStatus("Enregistrement : "+seconds+" s");
    },250);

  }catch(error){
    console.error(error);
    setStatus("Accès au microphone refusé ou indisponible.");
    stopRecording();
  }
}

sendBtn.addEventListener("click",sendQuestion);

question.addEventListener("keydown",event=>{
  if(event.key==="Enter"&&!event.shiftKey){
    event.preventDefault();
    sendQuestion();
  }
});

imageBtn.addEventListener("click",()=>{
  imageInput.click();
});

imageInput.addEventListener("change",()=>{
  const file=imageInput.files&&imageInput.files[0];

  if(file){
    analyzeImage(file);
  }

  imageInput.value="";
});

voiceBtn.addEventListener("click",()=>{
  if(mediaRecorder&&mediaRecorder.state==="recording"){
    stopRecording();
  }else{
    startRecording();
  }
});

clearBtn.addEventListener("click",()=>{
  historique=[];
  messages.innerHTML="";
  sources.innerHTML="";
  question.value="";
  fileInfo.textContent="";
  setStatus("");
});

document.querySelectorAll(".role").forEach(button=>{
  button.addEventListener("click",()=>{
    showSituations(button.dataset.role);
  });
});

addMessage(
  "assistant",
  "Bonjour, je suis GouRare AI. Décrivez simplement votre situation ou choisissez une catégorie pour commencer."
);

})();
</script>

</body>
</html>`;
}

async function readJSON(request,maxBytes){
  const contentLength=Number(request.headers.get("content-length")||0);

  if(contentLength&&contentLength>maxBytes){
    throw new Error("Requête trop volumineuse.");
  }

  const text=await request.text();

  if(new TextEncoder().encode(text).byteLength>maxBytes){
    throw new Error("Requête trop volumineuse.");
  }

  if(!text){
    return {};
  }

  try{
    return JSON.parse(text);
  }catch(error){
    throw new Error("JSON invalide.");
  }
}

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

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const path=url.pathname;
    const method=request.method.toUpperCase();

    try{

      if(path==="/health"){
        if(method!=="GET"){
          return methodNotAllowed();
        }

        return healthResponse();
      }

      if(path==="/"){
        if(method!=="GET"){
          return methodNotAllowed();
        }

        return new Response(pageHTML(),{
          status:200,
          headers:{
            "content-type":"text/html; charset=utf-8",
            ...securityHeaders()
          }
        });
      }

      if(path==="/api/analyze"){
        if(method!=="POST"){
          return methodNotAllowed();
        }

        if(!rateLimit(request,"analyze")){
          return jsonResponse(
            {
              ok:false,
              error:"Trop de requêtes. Réessayez dans quelques instants."
            },
            429,
            {
              ...securityHeaders(),
              "Retry-After":"60"
            }
          );
        }

        const body=await readJSON(request,LIMITS.analyzeBody);

        const question=texte(body.question,LIMITS.question);

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

        const historique=Array.isArray(body.historique)
          ?body.historique.slice(-40)
          :[];

        const langue=normalizeLang(body.langue);

        const result=await analyserQuestion(
          env,
          question,
          historique,
          langue
        );

        return jsonResponse(
          result,
          200,
          securityHeaders()
        );
      }

      if(path==="/api/message"){
        if(method!=="POST"){
          return methodNotAllowed();
        }

        if(!rateLimit(request,"analyze")){
          return jsonResponse(
            {
              ok:false,
              error:"Trop de requêtes. Réessayez plus tard."
            },
            429,
            {
              ...securityHeaders(),
              "Retry-After":"60"
            }
          );
        }

        const body=await readJSON(request,LIMITS.analyzeBody);
        const q=texte(body.question,LIMITS.question);

        if(!q){
          return jsonResponse(
            {
              ok:false,
              error:"Message vide."
            },
            400,
            securityHeaders()
          );
        }

        const langue=normalizeLang(body.langue);

        try{
          const answer=await askAI(
            env,
            `${systemPrompt(langue)}

Réponds simplement au message suivant:

${q}`
          );

          return jsonResponse(
            {
              ok:true,
              version:VERSION,
              answer:texte(answer,20000),
              aiStatus:"disponible"
            },
            200,
            securityHeaders()
          );

        }catch(error){
          console.error("GouRare AI message error:",error);

          return jsonResponse(
            {
              ok:true,
              version:VERSION,
              answer:
                langue==="ar"
                  ?"تعذر تشغيل الذكاء الاصطناعي مؤقتًا. يرجى إعادة المحاولة."
                  :"Le service IA est momentanément indisponible. Veuillez réessayer.",
              aiStatus:"indisponible"
            },
            200,
            securityHeaders()
          );
        }
      }

      if(path==="/api/image"){
        if(method!=="POST"){
          return methodNotAllowed();
        }

        if(!rateLimit(request,"image")){
          return jsonResponse(
            {
              ok:false,
              error:"Trop de requêtes image. Réessayez plus tard."
            },
            429,
            {
              ...securityHeaders(),
              "Retry-After":"60"
            }
          );
        }

        const body=await readJSON(request,LIMITS.imageBody);

        const image=texte(body.image,LIMITS.imageData);

        if(!image){
          return jsonResponse(
            {
              ok:false,
              error:"Aucune image fournie."
            },
            400,
            securityHeaders()
          );
        }

        if(!isValidImageDataURL(image)){
          return jsonResponse(
            {
              ok:false,
              error:"Format d'image non autorisé."
            },
            400,
            securityHeaders()
          );
        }

        if(
          approxBytesFromBase64(base64FromDataURL(image))>
          LIMITS.imageData
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

        const result=await analyserImage(
          env,
          image,
          texte(body.question,5000),
          normalizeLang(body.langue)
        );

        return jsonResponse(
          result,
          200,
          securityHeaders()
        );
      }

      if(path==="/api/transcribe"){
        if(method!=="POST"){
          return methodNotAllowed();
        }

        if(!rateLimit(request,"transcribe")){
          return jsonResponse(
            {
              ok:false,
              error:"Trop de requêtes audio. Réessayez plus tard."
            },
            429,
            {
              ...securityHeaders(),
              "Retry-After":"60"
            }
          );
        }

        const body=await readJSON(request,LIMITS.audioBody);

        const audio=texte(body.audio,LIMITS.audioData);

        if(!audio){
          return jsonResponse(
            {
              ok:false,
              error:"Aucun audio fourni."
            },
            400,
            securityHeaders()
          );
        }

        if(!isValidAudioDataURL(audio)){
          return jsonResponse(
            {
              ok:false,
              error:"Format audio non autorisé."
            },
            400,
            securityHeaders()
          );
        }

        if(
          approxBytesFromBase64(base64FromDataURL(audio))>
          LIMITS.audioData
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

        const result=await transcrireAudio(
          env,
          audio,
          normalizeLang(body.langue)
        );

        return jsonResponse(
          result,
          200,
          securityHeaders()
        );
      }

      return notFound();

    }catch(error){
      console.error("GouRare AI request error:",error);

      const message=
        error?.message||
        "Erreur interne.";

      const status=
        /volumineuse|trop volumineux/i.test(message)
          ?413
          :400;

      return jsonResponse(
        {
          ok:false,
          version:VERSION,
          error:message
        },
        status,
        securityHeaders()
      );
    }
  }
};
