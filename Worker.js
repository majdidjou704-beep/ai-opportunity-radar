export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    // =========================================================
    // HEADERS DE SÉCURITÉ
    // =========================================================

    const securityHeaders = {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
    };

    // =========================================================
    // HEALTH CHECK
    // =========================================================

    if (url.pathname === "/health") {

      return new Response(
        JSON.stringify({
          success: true,
          service: "GouRare AI",
          status: "OK"
        }),
        {
          status: 200,
          headers: {
            ...securityHeaders,
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }

    // =========================================================
    // API ANALYSE
    // =========================================================

    if (url.pathname === "/api/analyze") {

      if (request.method !== "POST") {

        return new Response(
          JSON.stringify({
            error: "Méthode non autorisée."
          }),
          {
            status: 405,
            headers: {
              ...securityHeaders,
              "Content-Type": "application/json; charset=utf-8"
            }
          }
        );
      }

      try {

        const body = await request.json();

        const business = String(body.business || "").trim();

        // -------------------------------------------------------
        // VALIDATION DE L'ENTRÉE
        // -------------------------------------------------------

        if (!business) {

          return new Response(
            JSON.stringify({
              error: "Veuillez indiquer une activité ou un secteur."
            }),
            {
              status: 400,
              headers: {
                ...securityHeaders,
                "Content-Type": "application/json; charset=utf-8"
              }
            }
          );
        }

        if (business.length > 200) {

          return new Response(
            JSON.stringify({
              error: "Le texte est trop long."
            }),
            {
              status: 400,
              headers: {
                ...securityHeaders,
                "Content-Type": "application/json; charset=utf-8"
              }
            }
          );
        }

        // =======================================================
        // PROMPT STRATÉGIQUE GOÚRARE AI
        // =======================================================

        const systemPrompt = `
Tu es GouRare AI, un analyste stratégique spécialisé dans la détection
d'opportunités commerciales, opérationnelles et technologiques.

Ta mission n'est PAS de produire une liste générique d'idées.

Ta mission est de détecter des problèmes commerciaux suffisamment
importants pour pouvoir devenir de vraies opportunités économiques.

RÈGLES ABSOLUES :

1. Réponds uniquement en français.

2. Ne fabrique aucune statistique.

3. Ne fabrique aucun pourcentage.

4. Ne fabrique aucun chiffre financier.

5. Ne fabrique aucun prix de marché.

6. Ne fabrique aucune source.

7. Si une information ne peut pas être vérifiée avec les données fournies,
présente-la comme hypothèse ou possibilité.

8. Ne transforme pas automatiquement chaque opportunité en logiciel.

9. Les cinq opportunités doivent être réellement différentes.

10. Deux opportunités qui résolvent essentiellement le même problème
sont interdites.

11. Cherche d'abord le problème, puis la personne qui le subit,
puis la valeur économique possible, puis la solution.

12. Une opportunité doit pouvoir être transformée en offre commerciale
réelle.

13. Identifie clairement QUI pourrait payer.

14. Explique POURQUOI ce client aurait intérêt à payer.

15. Donne une première action de validation réaliste et peu coûteuse.

16. Ne recommande pas systématiquement de créer un prototype.

17. La validation peut être :
- contacter quelques entreprises ;
- proposer une offre manuelle ;
- tester une prestation ;
- créer une page d'offre ;
- demander des rendez-vous ;
- observer un processus ;
- réaliser un mini-audit ;
- proposer une démonstration ;
- effectuer un test limité.

18. Cherche des opportunités dans plusieurs catégories :
- réduction des coûts ;
- augmentation des revenus ;
- acquisition ;
- fidélisation ;
- productivité ;
- administration ;
- ressources humaines ;
- qualité ;
- opérations ;
- expérience client ;
- automatisation ;
- intelligence artificielle ;
- nouveaux services ;
- nouveaux produits ;
- réduction des erreurs ;
- réduction des risques ;
- amélioration du pilotage.

19. Une seule des cinq opportunités peut être principalement une
plateforme ou un logiciel.

20. Les autres peuvent être des services, produits, automatisations,
méthodes, offres spécialisées ou modèles commerciaux.

21. Évite les idées vagues comme :
"améliorer la communication",
"utiliser l'IA pour gagner du temps",
"créer une plateforme",
sans expliquer précisément le problème et la valeur.

22. Cherche des problèmes récurrents, coûteux, pénibles, urgents,
mal servis ou insuffisamment exploités.

23. Cherche aussi les opportunités cachées dans les tâches que les
entreprises considèrent comme normales mais qui pourraient être
améliorées.

24. Pour chaque opportunité, indique aussi :
"Pourquoi cette opportunité peut être intéressante maintenant".

25. Indique également :
"Risque principal / raison possible d'échec".

26. Le potentiel doit rester qualitatif :
Très fort / Fort / Moyen / Faible.

27. Ne prétends jamais qu'une opportunité est certaine.

28. Une opportunité doit être différente des quatre autres par son
problème, son client ou son mécanisme de création de valeur.

29. Lorsque plusieurs solutions sont possibles, privilégie celle qui
peut être testée rapidement avec peu de moyens.

30. Pense comme un entrepreneur, un consultant stratégique et un
responsable produit réunis.

IMPORTANT :
Tu dois produire une analyse exploitable par une personne qui veut
transformer une opportunité en véritable activité commerciale.
`;

        // =======================================================
        // PROMPT UTILISATEUR
        // =======================================================

        const userPrompt = `
Analyse l'activité ou le secteur suivant :

"${business}"

Construis une analyse stratégique de GouRare AI.

====================================================
1. DIAGNOSTIC STRATÉGIQUE
====================================================

Explique brièvement :

- comment fonctionne généralement cette activité ;
- où se trouvent les principales difficultés ;
- où se trouve la valeur économique ;
- quelles zones semblent sous-exploitées ;
- quels types de problèmes peuvent devenir des offres commerciales.

Ne donne aucune statistique inventée.

====================================================
2. CINQ OPPORTUNITÉS COMMERCIALES
====================================================

Trouve exactement 5 opportunités.

Elles doivent être très différentes.

Pour chaque opportunité, utilise exactement cette structure :

### Opportunité 1 — [nom précis]

**Problème réel :**
Quel problème concret existe ?

**Pourquoi ce problème compte :**
Pourquoi une entreprise ou un client chercherait-il à le résoudre ?

**Client cible :**
Qui rencontre principalement ce problème ?

**Qui paierait :**
Qui serait réellement susceptible de payer la solution ?

**Pourquoi paierait-il :**
Quelle valeur reçoit-il en échange ?

**Solution proposée :**
Décris une solution concrète.

**Type de solution :**
Service / Produit / Automatisation / IA / Logiciel / Processus /
Nouvelle offre / Autre.

**Utilisation de l'IA ou de l'automatisation :**
Seulement si elle apporte une vraie valeur.

**Comment gagner de l'argent :**
Explique le modèle commercial possible sans inventer de prix.

**Pourquoi maintenant :**
Pourquoi cette opportunité peut-elle être intéressante aujourd'hui ?

**Première validation réaliste :**
Donne une action concrète permettant de vérifier l'intérêt du marché
sans forcément développer un produit.

**Obstacle principal :**
Qu'est-ce qui pourrait faire échouer cette opportunité ?

**Potentiel :**
Très fort / Fort / Moyen / Faible.

Répète cette structure pour les 5 opportunités.

====================================================
3. COMPARAISON
====================================================

Compare les cinq opportunités selon :

- force du problème ;
- facilité de trouver des clients ;
- facilité de vendre ;
- difficulté de réalisation ;
- possibilité d'utiliser l'IA ;
- possibilité de générer des revenus récurrents ;
- possibilité de commencer avec peu de moyens ;
- potentiel d'évolution.

Utilise uniquement des appréciations qualitatives :
Très fort / Fort / Moyen / Faible.

====================================================
4. MEILLEURE OPPORTUNITÉ IA
====================================================

Choisis UNE seule opportunité.

Explique pourquoi elle est la meilleure utilisation de l'IA.

Ne choisis pas automatiquement une plateforme.

====================================================
5. OPPORTUNITÉ LA PLUS FACILE À VENDRE
====================================================

Choisis UNE seule opportunité.

Explique pourquoi une entreprise pourrait comprendre rapidement
sa valeur.

====================================================
6. OPPORTUNITÉ LA PLUS FACILE À LANCER
====================================================

Choisis UNE seule opportunité qui peut être testée rapidement
avec peu de ressources.

Explique comment commencer.

====================================================
7. PREMIÈRE ACTION PRIORITAIRE
====================================================

Donne UNE action extrêmement concrète à effectuer en premier.

Elle doit permettre d'obtenir une preuve réelle d'intérêt.

Évite la réponse générique :
"faire une étude de marché".

====================================================
8. TOP 3
====================================================

Classe les trois meilleures opportunités.

Pour chacune, donne :

1. Nom
2. Potentiel
3. Pourquoi elle mérite d'être prioritaire

====================================================
9. IDÉE CACHÉE
====================================================

Termine par une opportunité moins évidente que les autres.

Elle doit venir d'un problème secondaire, d'une tâche répétitive,
d'une inefficacité ou d'un besoin sous-estimé du secteur.

Ne transforme pas automatiquement cette idée en logiciel.

Sois concret, réaliste et concis.
`;

        // =======================================================
        // APPEL À CLOUDFLARE WORKERS AI
        // =======================================================

        const response = await env.IA.run(
          "@cf/meta/llama-3.1-8b-instruct-fast",
          {
            messages: [
              {
                role: "system",
                content: systemPrompt
              },
              {
                role: "user",
                content: userPrompt
              }
            ],
            max_tokens: 3000
          }
        );

        // =======================================================
        // RÉPONSE
        // =======================================================

        return new Response(
          JSON.stringify({
            success: true,
            business: business,
            analysis: response
          }),
          {
            status: 200,
            headers: {
              ...securityHeaders,
              "Content-Type": "application/json; charset=utf-8"
            }
          }
        );

      } catch (error) {

        // Ne jamais exposer les détails internes de l'erreur.

        return new Response(
          JSON.stringify({
            error: "Une erreur est survenue pendant l'analyse."
          }),
          {
            status: 500,
            headers: {
              ...securityHeaders,
              "Content-Type": "application/json; charset=utf-8"
            }
          }
        );
      }
    }

    // =========================================================
    // INTERFACE GOÛRARE AI
    // =========================================================

    const html = `
<!DOCTYPE html>

<html lang="fr">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<meta
name="description"
content="GouRare AI détecte les opportunités commerciales et stratégiques grâce à l'intelligence artificielle."
>

<title>GouRare AI — Intelligence & Opportunités</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  background:
    radial-gradient(circle at top, #18233d 0%, #080b12 45%, #05070b 100%);
  color: #ffffff;
  min-height: 100vh;
}

.container {
  width: min(1100px, 92%);
  margin: auto;
}

header {
  padding: 30px 0 20px;
}

.logo {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -1px;
}

.logo span {
  opacity: .55;
}

.badge {
  display: inline-block;
  margin-top: 18px;
  padding: 8px 13px;
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 999px;
  background: rgba(255,255,255,.05);
  color: #cbd5e1;
  font-size: 13px;
}

.hero {
  padding: 55px 0 35px;
  text-align: center;
}

.hero h1 {
  font-size: clamp(36px, 7vw, 70px);
  line-height: 1;
  margin: 0 auto 22px;
  max-width: 900px;
  letter-spacing: -3px;
}

.hero p {
  max-width: 700px;
  margin: auto;
  color: #aeb8ca;
  font-size: 18px;
  line-height: 1.7;
}

.panel {
  margin: 35px auto;
  max-width: 850px;
  padding: 25px;
  border-radius: 24px;
  background: rgba(255,255,255,.055);
  border: 1px solid rgba(255,255,255,.10);
  box-shadow: 0 25px 80px rgba(0,0,0,.35);
  backdrop-filter: blur(18px);
}

label {
  display: block;
  margin-bottom: 10px;
  color: #dbe4f2;
  font-weight: 600;
}

input {
  width: 100%;
  padding: 18px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(0,0,0,.28);
  color: #ffffff;
  font-size: 16px;
  outline: none;
}

input:focus {
  border-color: rgba(255,255,255,.35);
}

button {
  width: 100%;
  margin-top: 15px;
  padding: 17px;
  border: 0;
  border-radius: 14px;
  background: #ffffff;
  color: #080b12;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: .2s;
}

button:hover {
  transform: translateY(-1px);
}

button:disabled {
  opacity: .55;
  cursor: wait;
}

.status {
  min-height: 25px;
  margin-top: 15px;
  color: #aeb8ca;
  text-align: center;
}

.features {
  display: grid;
  grid-template-columns:
    repeat(3, 1fr);
  gap: 15px;
  margin: 35px 0;
}

.feature {
  padding: 22px;
  border-radius: 20px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
}

.feature h3 {
  margin-top: 0;
}

.feature p {
  color: #9ba8bc;
  line-height: 1.6;
}

.results {
  margin: 35px auto;
}

.result-card {
  padding: 28px;
  border-radius: 22px;
  background: rgba(255,255,255,.055);
  border: 1px solid rgba(255,255,255,.10);
  overflow: hidden;
}

.result-card h2,
.result-card h3 {
  margin-top: 0;
}

.ai-result {
  color: #d8dfeb;
  line-height: 1.75;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

footer {
  padding: 45px 0;
  text-align: center;
  color: #657086;
  font-size: 14px;
}

@media (max-width: 700px) {

  .hero {
    padding-top: 35px;
  }

  .hero h1 {
    letter-spacing: -2px;
  }

  .features {
    grid-template-columns: 1fr;
  }

  .panel,
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
Détectez les opportunités avant les autres.
</h1>

<p>
GouRare AI analyse une activité, détecte ses problèmes économiques
et opérationnels et transforme ces problèmes en opportunités
commerciales concrètes.
</p>

</section>

<section class="panel">

<label for="business">
Quelle activité ou quel secteur voulez-vous analyser ?
</label>

<input
id="business"
type="text"
maxlength="200"
placeholder="Exemple : Nettoyage"
autocomplete="off"
/>

<button id="analyze">
Analyser les opportunités
</button>

<div id="status" class="status"></div>

</section>

<section class="features">

<div class="feature">

<h3>🔎 Détection</h3>

<p>
Identification des problèmes, inefficacités et besoins
qui peuvent devenir de véritables opportunités.
</p>

</div>

<div class="feature">

<h3>📊 Stratégie</h3>

<p>
Comparaison des opportunités selon leur valeur,
leur facilité de vente et leur potentiel.
</p>

</div>

<div class="feature">

<h3>🚀 Développement</h3>

<p>
Une première action concrète pour tester l'idée
avant d'investir inutilement.
</p>

</div>

</section>

<section id="results" class="results"></section>

<footer>
GouRare AI — Intelligence & Opportunités
</footer>

</div>

<script>

const businessInput =
document.getElementById("business");

const analyzeButton =
document.getElementById("analyze");

const status =
document.getElementById("status");

const results =
document.getElementById("results");

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function analyzeBusiness() {

  const business =
    businessInput.value.trim();

  if (!business) {

    status.textContent =
      "Veuillez indiquer une activité ou un secteur.";

    return;
  }

  analyzeButton.disabled = true;

  status.textContent =
    "Analyse stratégique en cours...";

  results.innerHTML = "";

  try {

    const response =
      await fetch("/api/analyze", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          business: business
        })

      });

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.error ||
        "Erreur pendant l'analyse."
      );

    }

    let analyse =
      data.analysis;

    if (
      analyse &&
      typeof analyse === "object" &&
      "response" in analyse
    ) {

      analyse =
        analyse.response;

    }

    results.innerHTML = `
      <div class="result-card">
        <h2>🤖 Analyse IA</h2>
        <div class="ai-result">
          ${escapeHTML(analyse)}
        </div>
      </div>
    `;

    status.textContent =
      "Analyse terminée.";

  } catch (error) {

    results.innerHTML = "";

    status.textContent =
      "Impossible de réaliser l'analyse pour le moment.";

  } finally {

    analyzeButton.disabled = false;

  }
}

analyzeButton.addEventListener(
  "click",
  analyzeBusiness
);

businessInput.addEventListener(
  "keydown",
  function(event) {

    if (event.key === "Enter") {
      analyzeBusiness();
    }

  }
);

</script>

</body>

</html>
`;

    // =========================================================
    // RÉPONSE HTML
    // =========================================================

    return new Response(
      html,
      {
        status: 200,
        headers: {
          ...securityHeaders,
          "Content-Type": "text/html; charset=utf-8"
        }
      }
    );
  }
};
