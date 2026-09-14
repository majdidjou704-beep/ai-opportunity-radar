export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ==========================================
    // CONFIGURATION
    // ==========================================

    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
    };

    // ==========================================
    // HEALTH CHECK
    // ==========================================

    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          success: true,
          service: "GouRare AI",
          status: "OK"
        }),
        {
          status: 200,
          headers
        }
      );
    }

    // ==========================================
    // AI ANALYSIS API
    // ==========================================

    if (url.pathname === "/api/analyze") {
      if (request.method !== "POST") {
        return new Response(
          JSON.stringify({
            error: "Méthode non autorisée."
          }),
          {
            status: 405,
            headers
          }
        );
      }

      try {
        const body = await request.json();
        const business = String(body.business || "").trim();

        // Protection des entrées
        if (!business) {
          return new Response(
            JSON.stringify({
              error: "Veuillez indiquer votre activité ou votre secteur."
            }),
            {
              status: 400,
              headers
            }
          );
        }

        if (business.length > 200) {
          return new Response(
            JSON.stringify({
              error: "Votre description est trop longue."
            }),
            {
              status: 400,
              headers
            }
          );
        }

        // ==========================================
        // IA
        // ==========================================

        const response = await env.IA.run(
          "@cf/meta/llama-3.1-8b-instruct-fast",
          {
            messages: [
              {
                role: "system",
                content:
                  "Tu es GouRare AI, un analyste stratégique spécialisé dans la détection d'opportunités commerciales, l'intelligence économique, l'IA, l'automatisation et la création de solutions numériques. " +
                  "Tu analyses les activités et secteurs avec une approche concrète, réaliste et orientée vers l'action. " +
                  "Réponds toujours en français. " +
                  "Ne présente jamais une information incertaine comme un fait. " +
                  "Ne fabrique aucune statistique, aucun pourcentage, aucun chiffre financier, aucun prix, aucune part de marché et aucune source. " +
                  "Si une information n'est pas vérifiable, présente-la comme une hypothèse ou une possibilité."
              },
              {
                role: "user",
                content:
                  "Analyse cette activité ou ce secteur : " +
                  business +
                  ".\n\n" +

                  "Ton objectif est de découvrir des problèmes réels et exploitables pouvant être transformés en services, produits, automatisations, nouvelles offres commerciales ou solutions numériques vendables.\n\n" +

                  "Les 5 opportunités doivent être réellement différentes les unes des autres. Elles doivent résoudre des problèmes différents et utiliser des approches différentes. Ne propose pas plusieurs variantes d'un même logiciel de gestion.\n\n" +

                  "Diversifie les opportunités lorsque cela est pertinent entre : réduction des coûts, acquisition de clients, fidélisation, gestion administrative, ressources humaines, qualité, productivité, opérations, nouveaux services, produits, automatisation et développement commercial.\n\n" +

                  "Une seule des cinq opportunités peut être principalement une plateforme ou un logiciel. Les autres doivent privilégier des approches différentes : service spécialisé, automatisation, produit, prestation, nouvelle offre commerciale, système interne ou méthode opérationnelle.\n\n" +

                  "Ne transforme pas automatiquement chaque problème en application, plateforme ou logiciel. Le format de la solution doit correspondre au problème identifié.\n\n" +

                  "Évite les idées génériques. Cherche des problèmes précis, des tâches répétitives, des pertes de temps, des coûts évitables, des difficultés commerciales, des problèmes opérationnels ou des services pouvant être améliorés.\n\n" +

                  "Pour chaque opportunité, donne une première action de validation immédiatement réalisable avec peu de moyens. Cette action doit être concrète : contacter quelques prospects, créer un prototype simple, tester une offre, automatiser une tâche précise ou réaliser une démonstration. Ne propose pas simplement 'faire une étude de marché'.\n\n" +

                  "Reste concis et évite les répétitions.\n\n" +

                  "Pour chaque opportunité indique :\n" +
                  "- Opportunité\n" +
                  "- Problème concret\n" +
                  "- Client cible\n" +
                  "- Solution proposée\n" +
                  "- Utilisation possible de l'IA ou de l'automatisation\n" +
                  "- Comment la solution pourrait être vendue\n" +
                  "- Première action de validation\n" +
                  "- Potentiel : Très fort, Fort, Moyen ou Faible\n\n" +

                  "Structure obligatoire :\n\n" +

                  "1. 🎯 Diagnostic stratégique\n" +
                  "Résume brièvement les principaux problèmes et les domaines présentant le plus d'opportunités.\n\n" +

                  "2. 💡 5 opportunités différentes\n" +
                  "Présente cinq opportunités réellement distinctes et évite les doublons.\n\n" +

                  "3. 🤖 Meilleure opportunité IA\n" +
                  "Choisis une seule opportunité qui bénéficie particulièrement de l'IA ou de l'automatisation et explique pourquoi.\n\n" +

                  "4. 💰 Opportunité la plus facile à vendre\n" +
                  "Choisis une seule opportunité et explique pourquoi elle pourrait être relativement facile à commercialiser.\n\n" +

                  "5. 🚀 Première action prioritaire\n" +
                  "Donne une action concrète permettant de tester rapidement l'opportunité la mieux classée avec peu de moyens.\n\n" +

                  "6. ⭐ Top 3\n" +
                  "Classe les trois meilleures opportunités selon leur intérêt commercial, leur faisabilité et leur potentiel de différenciation.\n\n" +

                  "Règles finales : sois concret, original, réaliste, court et orienté vers l'action. " +
                  "Ne présente jamais une hypothèse comme un fait."
              }
            ],
            max_tokens: 2000
          }
        );

        return new Response(
          JSON.stringify({
            success: true,
            business,
            analysis: response
          }),
          {
            status: 200,
            headers
          }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({
            error: "Une erreur est survenue pendant l'analyse."
          }),
          {
            status: 500,
            headers
          }
        );
      }
    }

    // ==========================================
    // INTERFACE GOÜRARÉ AI
    // ==========================================

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<meta
  name="description"
  content="GouRare AI — Intelligence économique et détection d'opportunités assistées par IA."
>

<title>GouRare AI — Intelligence & Opportunités</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    Arial,
    sans-serif;
  background:
    radial-gradient(circle at top, #1c2230 0%, #090b10 45%, #050609 100%);
  color: #f5f7fa;
  min-height: 100vh;
}

.container {
  width: min(1100px, 92%);
  margin: auto;
}

header {
  padding: 28px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.8px;
}

.logo span {
  opacity: 0.65;
  font-weight: 500;
}

.badge {
  font-size: 13px;
  padding: 8px 13px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 999px;
  background: rgba(255,255,255,.05);
  color: #cfd5df;
}

.hero {
  text-align: center;
  padding: 70px 0 45px;
}

.hero h1 {
  margin: 0 auto;
  max-width: 800px;
  font-size: clamp(38px, 7vw, 68px);
  line-height: 1.02;
  letter-spacing: -2.8px;
}

.hero h1 span {
  background: linear-gradient(90deg, #ffffff, #aeb8c9);
  -webkit-background-clip: text;
  color: transparent;
}

.hero p {
  max-width: 680px;
  margin: 25px auto 0;
  color: #aeb6c4;
  font-size: 18px;
  line-height: 1.6;
}

.analyzer {
  max-width: 760px;
  margin: 35px auto 0;
  padding: 10px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 20px;
  background: rgba(255,255,255,.055);
  backdrop-filter: blur(20px);
  display: flex;
  gap: 10px;
}

.analyzer input {
  flex: 1;
  min-width: 0;
  padding: 18px;
  border: 0;
  outline: 0;
  border-radius: 13px;
  background: rgba(0,0,0,.28);
  color: white;
  font-size: 16px;
}

.analyzer input::placeholder {
  color: #858e9d;
}

.analyzer button {
  border: 0;
  border-radius: 13px;
  padding: 0 24px;
  background: white;
  color: #080a0e;
  font-weight: 700;
  cursor: pointer;
  transition: transform .2s, opacity .2s;
}

.analyzer button:hover {
  transform: translateY(-1px);
}

.analyzer button:disabled {
  opacity: .55;
  cursor: wait;
}

.status {
  min-height: 25px;
  margin-top: 15px;
  color: #9da7b6;
  font-size: 14px;
}

.results {
  margin: 35px auto 60px;
  max-width: 900px;
}

.result-card {
  padding: 30px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 22px;
  background: rgba(255,255,255,.055);
  box-shadow: 0 20px 70px rgba(0,0,0,.25);
}

.result-card h2 {
  margin-top: 0;
}

.ai-result {
  color: #d8dde6;
  line-height: 1.75;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin: 30px auto 70px;
}

.feature {
  padding: 25px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 18px;
  background: rgba(255,255,255,.035);
}

.feature strong {
  display: block;
  margin-bottom: 8px;
  font-size: 17px;
}

.feature p {
  margin: 0;
  color: #929baa;
  line-height: 1.5;
}

footer {
  padding: 30px 0 45px;
  text-align: center;
  color: #687180;
  font-size: 13px;
}

@media (max-width: 700px) {

  header {
    padding: 20px 0;
  }

  .badge {
    display: none;
  }

  .hero {
    padding: 50px 0 30px;
  }

  .hero h1 {
    letter-spacing: -1.8px;
  }

  .hero p {
    font-size: 16px;
  }

  .analyzer {
    flex-direction: column;
    padding: 8px;
  }

  .analyzer input {
    width: 100%;
  }

  .analyzer button {
    min-height: 54px;
  }

  .features {
    grid-template-columns: 1fr;
  }

  .result-card {
    padding: 20px;
  }
}

</style>
</head>

<body>

<div class="container">

<header>
  <div class="logo">
    GouRare <span>AI</span>
  </div>

  <div class="badge">
    Intelligence économique assistée par IA
  </div>
</header>

<section class="hero">

  <h1>
    Détectez les <span>opportunités</span> avant les autres.
  </h1>

  <p>
    Identifiez les opportunités, marchés et pistes de développement
    pertinentes pour votre entreprise grâce à l'intelligence artificielle.
  </p>

  <div class="analyzer">

    <input
      id="business"
      type="text"
      maxlength="200"
      placeholder="Exemple : nettoyage, restaurant, immobilier..."
      autocomplete="off"
    >

    <button id="analyzeButton">
      Analyser les opportunités
    </button>

  </div>

  <div class="status" id="status"></div>

</section>

<section class="results" id="results"></section>

<section class="features">

  <div class="feature">
    <strong>🔎 Détection</strong>
    <p>
      Identifier les problèmes et opportunités pertinents
      pour votre activité.
    </p>
  </div>

  <div class="feature">
    <strong>📊 Analyse</strong>
    <p>
      Organiser les informations pour faciliter
      la prise de décision.
    </p>
  </div>

  <div class="feature">
    <strong>🚀 Développement</strong>
    <p>
      Transformer les opportunités détectées
      en actions concrètes.
    </p>
  </div>

</section>

<footer>
  GouRare AI — Intelligence & Opportunités
</footer>

</div>

<script>

const businessInput = document.getElementById("business");
const analyzeButton = document.getElementById("analyzeButton");
const results = document.getElementById("results");
const status = document.getElementById("status");

// Protection contre l'injection HTML
function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

analyzeButton.addEventListener("click", analyser);

businessInput.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    analyser();
  }
});

async function analyser() {

  const business = businessInput.value.trim();

  if (!business) {
    status.textContent =
      "Veuillez indiquer votre activité ou votre secteur.";
    return;
  }

  if (business.length > 200) {
    status.textContent =
      "Votre description est trop longue.";
    return;
  }

  analyzeButton.disabled = true;
  status.textContent = "Analyse en cours...";
  results.innerHTML = "";

  try {

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

    if (!response.ok) {
      throw new Error(
        data.error || "Erreur pendant l'analyse."
      );
    }

    let analyse = data.analysis;

    if (
      analyse &&
      typeof analyse === "object" &&
      analyse.response
    ) {
      analyse = analyse.response;
    }

    if (
      analyse &&
      typeof analyse === "object"
    ) {
      analyse = JSON.stringify(analyse, null, 2);
    }

    const safeAnalyse = escapeHTML(analyse || "");

    results.innerHTML =
      '<div class="result-card">' +
        '<h2>🤖 Analyse IA</h2>' +
        '<div class="ai-result">' +
          safeAnalyse +
        '</div>' +
      '</div>';

    status.textContent =
      "Analyse terminée.";

  } catch (error) {

    status.textContent =
      "Impossible de terminer l'analyse.";

  } finally {

    analyzeButton.disabled = false;

  }
}

</script>

</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
      }
    });
  }
};
