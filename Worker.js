export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response("AI Opportunity Radar: OK", {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    if (url.pathname === "/api/analyze" && request.method === "POST") {
      try {
        const body = await request.json();
        const business = String(body.business || "").trim();

        if (!business) {
          return Response.json(
            { error: "Veuillez indiquer votre activité." },
            { status: 400 }
          );
        }

        const response = await env.IA.run(
          "@cf/meta/llama-3.1-8b-instruct-fast",
          {
            messages: [
  {
    role: "system",
    content:
      "Tu es un expert en intelligence économique, stratégie commerciale, analyse de marché et détection d'opportunités. " +
      "Tu analyses les activités et secteurs avec une approche concrète, structurée et orientée vers l'action. " +
      "Réponds toujours en français. " +
      "Ne présente jamais une information incertaine comme un fait. " +
      "Ne jamais inventer de statistiques, de chiffres de marché, de parts de marché, de prix, de revenus ou de montants financiers. " +
"Si aucune donnée vérifiable n'est disponible, indique clairement que l'estimation est indicative et ne donne pas de chiffre précis. " +
"Ne cite aucune source, étude ou donnée officielle que tu n'as pas réellement consultée. " +
      "Lorsque les données réelles ne sont pas disponibles, indique clairement qu'il s'agit d'une estimation ou d'une hypothèse. " +
      "Ton objectif est d'aider une entreprise à identifier les opportunités les plus intéressantes et les actions prioritaires."
  },
  {
    role: "user",
    content:
  "Analyse en profondeur cette activité ou ce secteur : " +
  business +
  ".\n\n" +
  "Ton objectif est de détecter des opportunités commerciales réellement exploitables. " +
  "Ne te contente pas de lister des services existants. Recherche des problèmes, besoins non satisfaits, pertes de temps, inefficacités, difficultés opérationnelles, besoins technologiques et possibilités d'automatisation.\n\n" +
  "Pour chaque opportunité, relie clairement le problème, le client, la solution et la possibilité de créer une offre vendable.\n\n" +
  "Présente ton analyse avec cette structure concise :\n\n" +
  "1. 🎯 Résumé stratégique\n" +
  "Donne une vision courte du secteur, de ses principales difficultés et des domaines présentant le plus de potentiel.\n\n" +
  "2. 💡 5 opportunités commerciales\n" +
  "Pour chacune des 5 opportunités, indique : opportunité, problème identifié, clients cibles, solution ou offre recommandée, utilisation possible de l'IA ou de l'automatisation, potentiel commercial qualitatif et justification courte.\n\n" +
  "3. 🔥 Besoins prioritaires du marché\n" +
  "Identifie les cinq besoins ou problèmes les plus importants à résoudre dans ce secteur.\n\n" +
  "4. 🤖 Meilleures possibilités avec l'IA\n" +
  "Identifie les trois tâches ou problèmes qui pourraient être particulièrement améliorés par l'intelligence artificielle ou l'automatisation.\n\n" +
  "5. ⚠️ Difficultés et risques\n" +
  "Indique les principaux obstacles, risques opérationnels, réglementaires, technologiques ou concurrentiels.\n\n" +
  "6. 🚀 Plan d'action\n" +
  "Donne cinq actions prioritaires et concrètes permettant de commencer à exploiter les meilleures opportunités.\n\n" +
  "7. ⭐ Top 3 des opportunités\n" +
  "Classe les trois meilleures opportunités selon leur intérêt commercial, leur faisabilité et leur potentiel de différenciation.\n\n" +
  "8. 🧠 Idée de solution innovante\n" +
  "Propose une solution combinant si possible intelligence artificielle, automatisation ou outil numérique pour résoudre un problème identifié.\n\n" +
  "Règles importantes : sois concret, précis et orienté vers l'action. Évite les généralités et les répétitions. " +
  "Ne présente jamais une hypothèse comme un fait. Ne fabrique aucune statistique, aucun pourcentage, aucun montant, aucune part de marché, aucun chiffre de croissance et aucune source. " +
  "Pour le potentiel commercial, utilise uniquement Très fort, Fort, Moyen ou Faible avec une justification qualitative. " +
  "Si les données réelles ne sont pas disponibles, indique clairement qu'il s'agit d'une hypothèse ou d'une estimation qualitative."
    }
        ],
        max_tokens: 768
      }
    );
        return Response.json({
          success: true,
          business: business,
          analysis: response
        });

      } catch (error) {
        return Response.json(
          {
            error: "Une erreur est survenue pendant l'analyse.",
            details: error.message
          },
          { status: 500 }
        );
      }
    }

    return new Response(`
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Opportunity Radar</title>

<style>
*{box-sizing:border-box}

body{
  margin:0;
  font-family:Arial,sans-serif;
  background:#f4f7fb;
  color:#172033;
}

header{
  background:white;
  border-bottom:1px solid #e5e9f0;
  padding:18px 25px;
}

.logo{
  font-size:22px;
  font-weight:700;
}

.logo span{
  font-weight:400;
}

.hero{
  max-width:950px;
  margin:auto;
  padding:65px 20px 35px;
  text-align:center;
}

.badge{
  display:inline-block;
  background:#e9eef8;
  padding:8px 14px;
  border-radius:30px;
  font-size:13px;
  margin-bottom:18px;
}

h1{
  font-size:44px;
  line-height:1.1;
  margin:0 auto 18px;
}

.subtitle{
  font-size:18px;
  line-height:1.6;
  color:#647084;
  max-width:700px;
  margin:auto;
}

.panel{
  max-width:760px;
  margin:35px auto 0;
  background:white;
  padding:28px;
  border-radius:20px;
  box-shadow:0 10px 35px rgba(20,35,60,.08);
  text-align:left;
}

label{
  display:block;
  font-weight:600;
  margin-bottom:10px;
}

input{
  width:100%;
  padding:16px;
  border:1px solid #d9dfeb;
  border-radius:12px;
  font-size:16px;
}

button{
  width:100%;
  margin-top:15px;
  padding:16px;
  border:0;
  border-radius:12px;
  background:#172033;
  color:white;
  font-size:16px;
  font-weight:600;
  cursor:pointer;
}

button:disabled{
  opacity:.6;
  cursor:wait;
}

#results{
  display:none;
  margin-top:25px;
}

.result-card{
  background:white;
  padding:20px;
  border-radius:16px;
  margin-bottom:15px;
  border:1px solid #e5e9f0;
}

.result-card h3{
  margin-top:0;
}

.ai-result{
  white-space:pre-wrap;
  line-height:1.7;
}

.features{
  max-width:950px;
  margin:20px auto 70px;
  padding:0 20px;
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:18px;
}

.card{
  background:white;
  padding:25px;
  border-radius:18px;
  box-shadow:0 7px 25px rgba(20,35,60,.06);
}

.card p{
  color:#697487;
  line-height:1.5;
}

footer{
  text-align:center;
  padding:30px;
  color:#8a94a6;
  font-size:13px;
}

@media(max-width:700px){
  h1{font-size:34px}
  .features{grid-template-columns:1fr}
}
</style>
</head>

<body>

<header>
  <div class="logo">
    AI Opportunity <span>Radar</span>
  </div>
</header>

<section class="hero">

  <div class="badge">
    Intelligence économique assistée par IA
  </div>

  <h1>
    Détectez les opportunités avant les autres.
  </h1>

  <p class="subtitle">
    Identifiez les opportunités, marchés et pistes de développement
    pertinentes pour votre entreprise.
  </p>

  <div class="panel">

    <label for="business">
      Votre activité ou secteur
    </label>

    <input
      id="business"
      type="text"
      placeholder="Exemple : nettoyage, restaurant, immobilier..."
    >

    <button id="analyzeButton" onclick="analyze()">
      Analyser les opportunités
    </button>

    <div id="results"></div>

  </div>

</section>

<section class="features">

  <div class="card">
    <h3>🔎 Détection</h3>
    <p>
      Identifier les opportunités pertinentes pour votre activité.
    </p>
  </div>

  <div class="card">
    <h3>📊 Analyse</h3>
    <p>
      Organiser les informations pour faciliter la prise de décision.
    </p>
  </div>

  <div class="card">
    <h3>🚀 Développement</h3>
    <p>
      Transformer les opportunités détectées en actions concrètes.
    </p>
  </div>

</section>

<footer>
  AI Opportunity Radar — Intelligence & Opportunités
</footer>

<script>

async function analyze(){

  const business = document.getElementById("business").value.trim();
  const results = document.getElementById("results");
  const button = document.getElementById("analyzeButton");

  if(!business){
    results.style.display = "block";
    results.innerHTML =
      '<div class="result-card">' +
      '<strong>Veuillez indiquer votre activité.</strong>' +
      '</div>';
    return;
  }

  button.disabled = true;
  button.textContent = "Analyse en cours...";

  results.style.display = "block";
  results.innerHTML =
    '<div class="result-card">' +
    '<strong>🤖 Notre intelligence artificielle analyse votre secteur...</strong>' +
    '</div>';

  try{

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        business: business
      })
    });

    const data = await response.json();

    if(!response.ok){
      throw new Error(data.details || data.error || "Erreur pendant l'analyse");
    }

    let analyse = data.analysis ;

if (typeof analyse === "object") {
  analyse = analyse.response;
}

    results.innerHTML =
      '<div class="result-card">' +
      '<h3>🤖 Analyse IA</h3>' +
      '<div class="ai-result">' +
      analyse +
      '</div>' +
      '</div>';

      } catch (error) {

  results.innerHTML =
    '<div class="result-card">' +
    '<strong>⚠️ Erreur technique :</strong>' +
    '<p>' + error.message + '</p>' +
    '</div>';



  }finally{

    button.disabled = false;
    button.textContent = "Analyser les opportunités";

  }
}

</script>

</body>
</html>
`, {
      headers: {
        "Content-Type": "text/html; charset=utf-8"
      }
    });
  }
};
