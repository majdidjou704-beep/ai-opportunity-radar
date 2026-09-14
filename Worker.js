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
  "Ton objectif est de détecter des opportunités commerciales réellement exploitables, et pas simplement de lister des services déjà connus. " +
  "Cherche en priorité les problèmes, besoins non satisfaits, inefficacités, pertes de temps, difficultés opérationnelles, besoins technologiques et possibilités d'amélioration.\n\n" +
  "Pour chaque opportunité, explique clairement le lien entre le problème identifié, le client concerné et la solution ou le service qui pourrait être proposé.\n\n" +
  "Présente ton analyse avec cette structure :\n\n" +
  "1. 🎯 Résumé stratégique du secteur\n" +
  "Explique brièvement le fonctionnement du secteur, ses principales caractéristiques et les domaines dans lesquels des améliorations ou opportunités peuvent exister.\n\n" +
  "2. 💡 5 opportunités commerciales concrètes\n" +
  "Pour chaque opportunité, indique : le problème ou besoin identifié, la solution ou offre possible et pourquoi cette opportunité peut être intéressante.\n\n" +
  "3. 👥 Clients cibles pour chaque opportunité\n" +
  "Identifie précisément les types de clients susceptibles d'avoir ce problème ou ce besoin. Évite les catégories trop générales lorsque c'est possible.\n\n" +
  "4. 🔥 Problèmes ou besoins auxquels répondre\n" +
  "Explique les difficultés concrètes rencontrées par les clients et pourquoi elles peuvent justifier une solution.\n\n" +
  "5. 🛠️ Solution ou offre recommandée\n" +
  "Pour chaque opportunité, propose une solution concrète qui pourrait être transformée en produit, service, outil numérique ou solution basée sur l'intelligence artificielle.\n\n" +
  "6. 💰 Potentiel commercial qualitatif de chaque opportunité\n" +
  "Utilise uniquement une évaluation qualitative : Très fort, Fort, Moyen ou Faible, avec une courte justification. N'utilise aucun pourcentage, montant, chiffre de croissance, part de marché ou statistique, sauf si une donnée vérifiable a réellement été fournie dans le contexte.\n\n" +
  "7. ⚠️ Difficultés et risques à prendre en compte\n" +
  "Identifie les principales difficultés, contraintes, risques opérationnels, réglementaires ou concurrentiels.\n\n" +
  "8. 🚀 5 actions prioritaires à mettre en place\n" +
  "Donne cinq actions concrètes et réalisables pour commencer à exploiter les meilleures opportunités.\n\n" +
  "9. ⭐ Classement des 3 meilleures opportunités\n" +
  "Classe les trois opportunités les plus intéressantes et explique brièvement pourquoi elles sont prioritaires.\n\n" +
  "10. 🤖 Opportunités d'utilisation de l'IA\n" +
  "Identifie les tâches ou problèmes qui pourraient être améliorés grâce à l'intelligence artificielle, à l'automatisation ou à un outil numérique.\n\n" +
  "Règles importantes : sois concret, évite les généralités, ne présente jamais une hypothèse comme un fait, ne fabrique aucune statistique, aucun chiffre, aucune source et aucune donnée financière. " +
  "Lorsque les données réelles ne sont pas disponibles, indique clairement qu'il s'agit d'une hypothèse ou d'une estimation qualitative. " +
  "Privilégie les opportunités qui peuvent réellement conduire à une offre, un produit ou une solution vendable."
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
