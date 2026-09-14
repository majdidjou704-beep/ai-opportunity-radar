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
  "Analyse cette activité ou ce secteur : " +
  business +
  ".\n\n" +
  "Tu es un analyste stratégique spécialisé dans la détection d'opportunités commerciales, l'IA, l'automatisation et la création de solutions numériques.\n\n" +
  "Ton objectif est de découvrir des problèmes concrets pouvant être transformés en services, produits ou solutions vendables.\n\n" +
  "Recherche obligatoirement des opportunités dans des catégories différentes : réduction des coûts, automatisation, acquisition de clients, gestion des clients, gestion administrative, ressources humaines, qualité, productivité, suivi des opérations et création de nouveaux services.\n\n" +
  "IMPORTANT : les 5 opportunités doivent être réellement différentes. Ne propose jamais deux opportunités qui résolvent essentiellement le même problème. Évite les idées génériques comme 'plateforme de gestion' sans expliquer précisément le problème et la valeur créée. Une seule des cinq opportunités peut être une plateforme ou un logiciel. Les autres doivent proposer des services, automatisations, produits, modèles économiques ou méthodes différentes.\n\n" +
  "Ne transforme pas automatiquement chaque problème en application, plateforme ou logiciel. Une opportunité peut être un service, une automatisation, un produit, une prestation spécialisée, une nouvelle offre commerciale, un système interne ou un logiciel. Choisis le format de solution uniquement lorsqu'il correspond réellement au problème.\n\n" +
  "Reste très concis : chaque opportunité doit être présentée en quelques lignes maximum. Ne répète pas les mêmes explications entre les opportunités.\n\n" +
  "Les actions proposées doivent être immédiatement réalisables et concrètes. Évite les conseils vagues comme 'faire une étude de marché', 'analyser le marché' ou 'améliorer la stratégie'. Donne plutôt une action précise permettant de tester l'opportunité rapidement.\n\n" +
  "Pour chaque opportunité indique brièvement :\n" +
  "- Opportunité\n" +
  "- Problème concret\n" +
  "- Client cible\n" +
  "- Solution proposée\n" +
  "- Utilisation possible de l'IA ou de l'automatisation\n" +
  "- Comment la solution pourrait être vendue\n" +
  "- Potentiel : Très fort, Fort, Moyen ou Faible\n\n" +
  "Structure de la réponse :\n\n" +
  "1. 🎯 Diagnostic stratégique\n" +
  "Résume les principaux problèmes et les domaines présentant le plus d'opportunités.\n\n" +
  "2. 💡 5 opportunités différentes\n" +
  "Présente cinq opportunités provenant de catégories différentes et évite toute répétition.\n\n" +
  "3. 🤖 Meilleure opportunité IA\n" +
  "Choisis la solution qui pourrait bénéficier le plus de l'IA ou de l'automatisation et explique brièvement pourquoi.\n\n" +
  "4. 💰 Opportunité la plus facile à vendre\n" +
  "Choisis une seule opportunité et explique pourquoi elle pourrait être relativement simple à commercialiser.\n\n" +
  "5. 🚀 Première action\n" +
  "Donne une action concrète permettant de tester rapidement cette opportunité avec peu de moyens.\n\n" +
  "6. ⭐ Top 3\n" +
  "Classe les trois meilleures opportunités selon leur intérêt commercial, leur faisabilité et leur potentiel de différenciation.\n\n" +
  "Règles essentielles : sois concret, original, court et orienté vers l'action. " +
  "Ne fabrique aucune statistique, aucun pourcentage, aucun chiffre financier, aucun prix, aucune part de marché et aucune source. " +
  "Ne présente jamais une hypothèse comme un fait. " +
  "Si une information n'est pas vérifiable, indique clairement qu'il s'agit d'une hypothèse ou d'une possibilité."
 }
        ],
        max_tokens: 1200
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
