export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response("AI Opportunity Radar: OK", {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    return new Response(`
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>AI Opportunity Radar</title>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #f4f7fb;
  color: #172033;
}

header {
  background: #ffffff;
  border-bottom: 1px solid #e5e9f0;
  padding: 18px 25px;
}

.logo {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.logo span {
  font-weight: 400;
}

.hero {
  max-width: 950px;
  margin: 0 auto;
  padding: 70px 20px 40px;
  text-align: center;
}

.badge {
  display: inline-block;
  background: #e9eef8;
  padding: 8px 14px;
  border-radius: 30px;
  font-size: 13px;
  margin-bottom: 18px;
}

h1 {
  font-size: 44px;
  line-height: 1.1;
  margin: 0 auto 18px;
  max-width: 800px;
}

.subtitle {
  font-size: 18px;
  line-height: 1.6;
  color: #647084;
  max-width: 700px;
  margin: auto;
}

.panel {
  max-width: 760px;
  margin: 35px auto 0;
  background: white;
  padding: 28px;
  border-radius: 20px;
  box-shadow: 0 10px 35px rgba(20, 35, 60, 0.08);
  text-align: left;
}

label {
  display: block;
  font-weight: 600;
  margin-bottom: 10px;
}

input {
  width: 100%;
  padding: 16px;
  border: 1px solid #d9dfeb;
  border-radius: 12px;
  font-size: 16px;
  outline: none;
}

input:focus {
  border-color: #6577ff;
}

button {
  width: 100%;
  margin-top: 15px;
  padding: 16px;
  border: 0;
  border-radius: 12px;
  background: #172033;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

button:hover {
  opacity: 0.92;
}

.features {
  max-width: 950px;
  margin: 20px auto 70px;
  padding: 0 20px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.card {
  background: white;
  padding: 25px;
  border-radius: 18px;
  box-shadow: 0 7px 25px rgba(20, 35, 60, 0.06);
}

.card h3 {
  margin-top: 0;
}

.card p {
  color: #697487;
  line-height: 1.5;
}

#result {
  display: none;
  margin-top: 20px;
  padding: 18px;
  background: #f1f5ff;
  border-radius: 12px;
  line-height: 1.6;
}

footer {
  text-align: center;
  padding: 30px;
  color: #8a94a6;
  font-size: 13px;
}

@media (max-width: 700px) {
  h1 {
    font-size: 34px;
  }

  .features {
    grid-template-columns: 1fr;
  }

  .hero {
    padding-top: 45px;
  }
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
    AI Opportunity Radar aide les entreprises à identifier
    de nouvelles opportunités, marchés et pistes de développement.
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

    <button onclick="analyze()">
      Analyser les opportunités
    </button>

    <div id="result">
      <strong>Analyse préparée.</strong><br>
      Votre secteur a été enregistré. Le moteur d'analyse IA sera
      connecté dans la prochaine étape.
    </div>

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
function analyze() {
  const business = document.getElementById("business").value.trim();
  const result = document.getElementById("result");

  if (!business) {
    result.style.display = "block";
    result.innerHTML =
      "<strong>Veuillez indiquer votre activité.</strong>";
    return;
  }

  result.style.display = "block";
  result.innerHTML =
    "<strong>Analyse en préparation pour :</strong> " +
    business +
    "<br><br>" +
    "Le moteur d'intelligence artificielle sera connecté dans la prochaine étape.";
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
