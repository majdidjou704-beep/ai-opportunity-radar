export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const securityHeaders = {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Cache-Control": "no-store"
    };
    try {
      if (url.pathname === "/health") {
        return new Response(
          JSON.stringify({
            success: true,
            service: "GouRare AI",
            status: "OK",
            version: "5.0"
          }),
          {
            status: 200,
            headers: {
              ...securityHeaders,
              "Content-Type": "application/json; charset=UTF-8"
            }
          }
        );
      }
      if (url.pathname === "/api/analyze") {
        if (request.method !== "POST") {
          return json(
            { success: false, error: "Méthode non autorisée." },
            405
          );
        }
        const contentType = request.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          return json(
            { success: false, error: "Format JSON requis." },
            415
          );
        }
        let data;
        try {
          data = await request.json();
        } catch {
          return json(
            { success: false, error: "Données JSON invalides." },
            400
          );
        }
        const type = clean(data.type, 30);
        const message = clean(data.message, 5000);
        const sector = clean(data.sector, 150);
        const activity = clean(data.activity, 150);
        const status = clean(data.status, 100);
        if (type === "sector") {
          if (!sector) {
            return json(
              {
                success: false,
                error: "Veuillez indiquer un secteur ou un métier."
              },
              400
            );
          }
          const analyse = await analyserSecteur(sector, env);
          return json({
            success: true,
            type: "sector",
            analyse
          });
        }
        if (type === "independent") {
          if (!activity && !message) {
            return json(
              {
                success: false,
                error: "Veuillez indiquer votre activité."
              },
              400
            );
          }
          const analyse = await assistantIndependant(
            activity,
            status,
            message,
            env
          );
          return json({
            success: true,
            type: "independent",
            analyse
          });
        }
        if (type === "problem") {
          if (!message) {
            return json(
              {
                success: false,
                error: "Veuillez décrire votre problème."
              },
              400
            );
          }
          const analyse = await analyserProbleme(message, env);
          return json({
            success: true,
            type: "problem",
            analyse
          });
        }
        if (!message) {
          return json(
            {
              success: false,
              error: "Veuillez écrire votre question."
            },
            400
          );
        }
        const analyse = await questionGenerale(message, env);
        return json({
          success: true,
          type: "general",
          analyse
        });
      }
      return new Response(pageHTML(), {
        status: 200,
        headers: {
          ...securityHeaders,
          "Content-Type": "text/html; charset=UTF-8"
        }
      });
    } catch (error) {
      return json(
        {
          success: false,
          error: "Le service GouRare AI est momentanément indisponible."
        },
        500
      );
    }
  }
};
/* =========================================================
   OUTILS
========================================================= */
function clean(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }
  return value
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLength);
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
/* =========================================================
   INTELLIGENCE GÉNÉRALE
========================================================= */
function systemPrompt() {
  return `
Tu es GouRare AI.
GouRare AI est un assistant intelligent d'orientation, d'analyse,
de résolution de problèmes et d'aide à la décision.
Il s'adresse notamment :
- aux citoyens
- aux salariés
- aux demandeurs d'emploi
- aux indépendants
- aux micro-entrepreneurs
- aux entrepreneurs
- aux petites entreprises
- aux personnes qui cherchent une démarche, une solution ou une orientation.
GouRare AI peut couvrir plusieurs domaines :
- administratif
- juridique
- fiscal
- comptable
- social
- création d'entreprise
- emploi
- métiers
- secteurs professionnels
- stratégie
- organisation
- résolution de problèmes
- opportunités économiques.
IMPORTANT :
Tu n'es pas avocat, expert-comptable, médecin, travailleur social,
administration ou autre professionnel réglementé.
Tu dois aider à comprendre, organiser, orienter et préparer.
Tu ne dois JAMAIS inventer :
- une loi
- un article de loi
- une obligation
- une autorisation
- une licence
- un seuil
- un taux
- une pénalité
- un délai
- un montant
- une statistique
- un chiffre d'affaires
- une économie
- une subvention
- une règle fiscale.
Si une information doit être vérifiée :
écris clairement "À vérifier".
Pour la France, privilégie lorsque pertinent :
- Service-Public
- Service-Public Entreprendre
- URSSAF
- impots.gouv.fr
- economie.gouv.fr
- travail-emploi.gouv.fr
- les administrations compétentes.
Distinguе toujours :
1. Information fiable / principe général
2. Point à vérifier
3. Recommandation
4. Situation nécessitant un professionnel.
Ne donne pas une réponse vague si une action concrète peut être proposée.
Le but est toujours de permettre à l'utilisateur de comprendre :
- ce qui se passe
- ce qu'il doit vérifier
- ce qu'il peut faire
- où le faire
- quels documents préparer
- quels risques éviter
- quelle est la prochaine action.
Réponds en français clair, structuré et pratique.
`;
}
/* =========================================================
   APPEL IA
========================================================= */
async function askAI(prompt, env, maxTokens = 2200) {
  if (!env || !env.IA || typeof env.IA.run !== "function") {
    throw new Error("Binding IA indisponible");
  }
  const result = await env.IA.run(
    "@cf/meta/llama-3.1-8b-instruct-fast",
    {
      messages: [
        {
          role: "system",
          content: systemPrompt()
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.12
    }
  );
  if (typeof result === "string") {
    return result;
  }
  if (result && typeof result.response === "string") {
    return result.response;
  }
  if (
    result &&
    result.result &&
    typeof result.result.response === "string"
  ) {
    return result.result.response;
  }
  return JSON.stringify(result);
}
/* =========================================================
   QUESTION GÉNÉRALE
========================================================= */
async function questionGenerale(question, env) {
  return askAI(
    `
QUESTION DE L'UTILISATEUR :
${question}
Analyse la demande avant de répondre.
Détermine si elle concerne principalement :
- une démarche administrative
- le droit
- la fiscalité
- la comptabilité
- le social
- l'emploi
- la création d'entreprise
- un métier
- un secteur
- une entreprise
- une décision
- un problème pratique
- plusieurs domaines à la fois.
Si plusieurs domaines sont concernés, combine-les.
Réponds avec cette structure :
1. CE QUE J'AI COMPRIS
Explique précisément la situation.
2. ORIENTATION
Indique le ou les domaines concernés et pourquoi.
3. CE QUI EST CERTAIN
Donne uniquement les éléments dont tu es suffisamment sûr.
4. CE QUI DOIT ÊTRE VÉRIFIÉ
Liste clairement les points nécessitant une vérification officielle.
5. CE QUE L'UTILISATEUR PEUT FAIRE
Donne les étapes dans l'ordre.
6. OÙ FAIRE LES DÉMARCHES
Indique l'organisme ou le type de service compétent lorsque tu peux le déterminer.
7. DOCUMENTS / INFORMATIONS À PRÉPARER
8. RISQUES OU ERREURS À ÉVITER
9. QUAND FAIRE APPEL À UN PROFESSIONNEL
Avocat, expert-comptable, travailleur social, conseiller, administration, etc.
10. PROCHAINE ACTION
Donne une seule prochaine action concrète et prioritaire.
Ne transforme pas une hypothèse en obligation.
Ne fabrique aucun chiffre.
`,
    env
  );
}
/* =========================================================
   ANALYSE SECTEUR / MÉTIER
========================================================= */
async function analyserSecteur(sector, env) {
  return askAI(
    `
SECTEUR OU MÉTIER À ANALYSER :
${sector}
Tu es ici l'analyste stratégique de GouRare AI.
Le but n'est PAS de produire une liste générique d'idées.
Nous voulons découvrir des problèmes économiques ou opérationnels
qui existent réellement ou qui sont plausibles dans ce secteur,
puis identifier les solutions que GouRare AI pourrait proposer.
Analyse :
1. CARTOGRAPHIE
- clients
- utilisateurs
- entreprises
- travailleurs
- fournisseurs
- intermédiaires
- décideurs
- payeurs.
2. PROBLÈMES CONCRETS
Cherche des problèmes possibles concernant :
- acquisition
- fidélisation
- temps
- déplacements
- coûts
- organisation
- personnel
- qualité
- erreurs
- retards
- communication
- documents
- administratif
- facturation
- relation client
- conformité
- risques
- productivité.
Évite les formulations vagues.
3. OPPORTUNITÉS
Trouve EXACTEMENT 5 opportunités réellement différentes.
Pour chacune :
Nom :
Problème :
Qui subit le problème :
Qui décide :
Qui paie :
Pourquoi paierait-il :
Solution :
Type de solution :
Rôle possible de l'IA :
Valeur pour le client :
Difficulté de lancement :
Difficulté de vente :
Différenciation :
Test rapide :
Obstacle principal :
Niveau de confiance : faible / moyen / élevé.
Les types peuvent être :
- service
- conseil
- organisation
- automatisation
- formation
- intermédiation
- audit
- assistance
- outil
- logiciel
- IA
- amélioration opérationnelle.
Ne transforme pas toutes les opportunités en SaaS.
4. CLASSEMENT
Classe les 5 opportunités selon :
- valeur
- facilité de lancement
- facilité de vente
- différenciation
- potentiel IA
- rapidité de validation.
5. CHOIX
Indique :
- meilleure opportunité
- plus facile à lancer
- plus facile à vendre
- meilleur potentiel IA
- opportunité sous-estimée.
6. TEST
Explique comment tester la meilleure opportunité avec très peu
ou pas de budget.
7. PROCHAINE ACTION
Donne une seule action concrète.
IMPORTANT :
Ne fabrique aucune statistique de marché.
Ne prétends pas qu'un problème est prouvé si tu ne disposes pas
de données permettant de l'affirmer.
Utilise "problème possible" ou "hypothèse à valider" lorsque nécessaire.
`,
    env,
    2600
  );
}
/* =========================================================
   ASSISTANT INDÉPENDANT
========================================================= */
async function assistantIndependant(activity, status, question, env) {
  return askAI(
    `
MODULE : ASSISTANT INDÉPENDANT — FRANCE
ACTIVITÉ :
${activity || "Non précisée"}
STATUT :
${status || "Non précisé"}
QUESTION :
${question || "Je souhaite comprendre mes obligations."}
Analyse la situation.
Couvre lorsque pertinent :
- création
- statut
- immatriculation
- SIREN / SIRET
- URSSAF
- cotisations
- impôt
- TVA
- CFE
- facturation
- déclarations
- comptabilité
- conservation des documents
- assurances
- compte bancaire
- obligations professionnelles
- relation avec un expert-comptable.
ATTENTION :
Ne dis pas automatiquement qu'une inscription au RCS est obligatoire.
Ne dis pas automatiquement qu'une licence est obligatoire.
Ne dis pas automatiquement qu'une assurance est obligatoire.
La réponse dépend de l'activité exacte.
Ne fabrique aucun seuil, taux, montant ou délai.
Structure :
1. CE QUE J'AI COMPRIS
2. DOMAINE(S) CONCERNÉ(S)
3. CE QUI PEUT S'APPLIQUER
4. CE QUI DOIT ÊTRE VÉRIFIÉ
5. CE QUE JE DOIS FAIRE
6. OÙ FAIRE CHAQUE DÉMARCHE
7. DOCUMENTS / INFORMATIONS À PRÉPARER
8. FISCALITÉ ET SOCIAL
Explique les principes sans inventer de chiffres.
9. FACTURATION / COMPTABILITÉ
10. ERREURS À ÉVITER
11. QUAND CONSULTER UN EXPERT-COMPTABLE OU UN AUTRE PROFESSIONNEL
12. PROCHAINE ACTION
Si une donnée personnelle manque pour répondre correctement,
indique exactement laquelle.
`,
    env,
    2500
  );
}
/* =========================================================
   RÉSOLUTION DE PROBLÈME
========================================================= */
async function analyserProbleme(probleme, env) {
  return askAI(
    `
MODULE : RÉSOLUTION DE PROBLÈME
PROBLÈME :
${probleme}
Ne te contente pas de reformuler le problème.
Analyse :
1. PROBLÈME CENTRAL
2. CAUSES POSSIBLES
Sépare les causes probables des hypothèses.
3. CONSÉQUENCES
4. INFORMATIONS À VÉRIFIER
5. SOLUTIONS POSSIBLES
Classe-les selon :
- simplicité
- efficacité
- coût
- risque.
6. SOLUTION LA PLUS SIMPLE
7. SOLUTION LA PLUS EFFICACE
8. SI LE PROBLÈME CONCERNE UNE DÉMARCHE ADMINISTRATIVE
Indique comment identifier :
- l'organisme compétent
- la démarche
- les documents
- les délais à vérifier
- la prochaine étape.
9. SI LE PROBLÈME CONCERNE LE DROIT, LA FISCALITÉ OU LE SOCIAL
Indique les points qui nécessitent une source officielle ou
l'intervention d'un professionnel.
10. ORDRE DES ACTIONS
11. PROCHAINE ACTION
Le résultat doit être pratique et directement utilisable.
`,
    env,
    2300
  );
}
/* =========================================================
   PAGE
========================================================= */
function pageHTML() {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GouRare AI — Intelligence & Orientation</title>
<meta
  name="description"
  content="GouRare AI — Intelligence, orientation, résolution de problèmes et aide à la décision."
>
<style>
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  background: #0b0d12;
  color: #f4f5f7;
}
.container {
  width: min(1100px, 92%);
  margin: auto;
}
header {
  padding: 42px 0 28px;
  text-align: center;
}
.logo {
  font-size: 42px;
  font-weight: 800;
  letter-spacing: -1px;
}
.badge {
  display: inline-block;
  margin-top: 12px;
  padding: 8px 14px;
  border: 1px solid #303641;
  border-radius: 999px;
  color: #cbd0d8;
  font-size: 14px;
}
.hero {
  text-align: center;
  padding: 20px 0 35px;
}
.hero h1 {
  font-size: clamp(30px, 6vw, 58px);
  margin: 10px 0;
}
.hero p {
  color: #aeb5c0;
  font-size: 17px;
  line-height: 1.6;
  max-width: 720px;
  margin: auto;
}
.tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}
.tab {
  background: #141820;
  color: #dce0e6;
  border: 1px solid #292f39;
  border-radius: 14px;
  padding: 15px 8px;
  cursor: pointer;
  font-size: 15px;
}
.tab.active {
  border-color: #697386;
  background: #1b202a;
}
.panel {
  background: #11151c;
  border: 1px solid #292f39;
  border-radius: 20px;
  padding: 24px;
}
.panel h2 {
  margin-top: 0;
}
.field {
  margin: 15px 0;
}
label {
  display: block;
  margin-bottom: 8px;
  color: #cdd2da;
}
textarea,
input,
select {
  width: 100%;
  background: #0b0e13;
  border: 1px solid #303641;
  border-radius: 12px;
  color: white;
  padding: 14px;
  font-size: 16px;
  outline: none;
}
textarea {
  min-height: 150px;
  resize: vertical;
}
button.primary {
  width: 100%;
  border: 0;
  border-radius: 12px;
  padding: 15px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  background: #f1f3f5;
  color: #101217;
}
button.primary:disabled {
  opacity: .6;
  cursor: wait;
}
.results {
  margin-top: 22px;
}
.result-card {
  background: #11151c;
  border: 1px solid #292f39;
  border-radius: 20px;
  padding: 24px;
}
.ai-result {
  white-space: pre-wrap;
  line-height: 1.7;
  color: #e2e5ea;
}
.hidden {
  display: none;
}
.footer {
  text-align: center;
  color: #777f8c;
  padding: 35px 0 20px;
  font-size: 13px;
}
.cancer-support {
  position: fixed;
  right: 14px;
  bottom: 14px;
  z-index: 20;
  background: rgba(18, 21, 28, .96);
  border: 1px solid #3a404b;
  border-radius: 999px;
  padding: 8px 12px;
  color: #e7e9ed;
  font-size: 12px;
  text-decoration: none;
  box-shadow: 0 8px 30px rgba(0,0,0,.35);
}
.cancer-support span {
  font-size: 17px;
  margin-right: 5px;
}
@media (max-width: 700px) {
  .tabs {
    grid-template-columns: repeat(2, 1fr);
  }
  .logo {
    font-size: 34px;
  }
  .panel {
    padding: 18px;
  }
}
</style>
</head>
<body>
<a
  class="cancer-support"
  href="#soutien"
  aria-label="GouRare AI soutient les personnes touchées par le cancer"
>
  <span>🎗️</span>
  Avec vous contre le cancer
</a>
<div class="container">
<header>
  <div class="logo">GouRare AI</div>
  <div class="badge">
    Intelligence & orientation assistées par IA
  </div>
</header>
<section class="hero">
  <h1>Un problème ? Trouvez le bon chemin.</h1>
  <p>
    Comprendre votre situation, trouver les solutions,
    éviter les erreurs et identifier la prochaine action.
  </p>
</section>
<div class="tabs">
  <button class="tab active" data-mode="question">
    💬 Question
  </button>
  <button class="tab" data-mode="sector">
    📊 Secteur
  </button>
  <button class="tab" data-mode="independent">
    💼 Indépendant
  </button>
  <button class="tab" data-mode="problem">
    🧭 Problème
  </button>
</div>
<section class="panel">
  <div id="questionPanel">
    <h2>Votre question</h2>
    <div class="field">
      <textarea
        id="questionInput"
        maxlength="5000"
        placeholder="Exemple : Je veux créer une activité de nettoyage en France. Que dois-je faire ?"
      ></textarea>
    </div>
    <button class="primary" id="questionButton">
      Trouver la bonne orientation
    </button>
  </div>
  <div id="sectorPanel" class="hidden">
    <h2>Secteur ou métier à analyser</h2>
    <div class="field">
      <input
        id="sectorInput"
        maxlength="150"
        placeholder="Exemple : Nettoyage, restauration, plomberie..."
      >
    </div>
    <button class="primary" id="sectorButton">
      Analyser le secteur
    </button>
  </div>
  <div id="independentPanel" class="hidden">
    <h2>Votre activité</h2>
    <div class="field">
      <input
        id="activityInput"
        maxlength="150"
        placeholder="Exemple : Nettoyage à domicile"
      >
    </div>
    <div class="field">
      <label for="statusInput">
        Votre statut
      </label>
      <select id="statusInput">
        <option value="">
          Je ne sais pas
        </option>
        <option value="Micro-entrepreneur">
          Micro-entrepreneur
        </option>
        <option value="Entreprise individuelle">
          Entreprise individuelle
        </option>
        <option value="Société">
          Société
        </option>
        <option value="Freelance">
          Freelance
        </option>
      </select>
    </div>
    <div class="field">
      <label for="independentQuestion">
        Votre question
      </label>
      <textarea
        id="independentQuestion"
        maxlength="3000"
        placeholder="Exemple : Quelles sont mes principales obligations ?"
      ></textarea>
    </div>
    <button class="primary" id="independentButton">
      M'aider dans ma situation
    </button>
  </div>
  <div id="problemPanel" class="hidden">
    <h2>Décrivez votre problème</h2>
    <div class="field">
      <textarea
        id="problemInput"
        maxlength="5000"
        placeholder="Exemple : Je perds beaucoup de temps à chercher les bonnes démarches administratives."
      ></textarea>
    </div>
    <button class="primary" id="problemButton">
      Analyser mon problème
    </button>
  </div>
</section>
<section class="results" id="results"></section>
<section class="footer" id="soutien">
  <div>
    🧭 Orientation — Comprendre quoi faire, où aller et quelle étape effectuer ensuite.
  </div>
  <div>
    ⚖️ Vigilance — Identifier les points administratifs, fiscaux ou juridiques à vérifier.
  </div>
  <div>
    💡 Solutions — Explorer des solutions adaptées à votre situation.
  </div>
  <br>
  <strong>GouRare AI — Intelligence & Orientation</strong>
  <br><br>
  <span>
    🎗️ Notre soutien aux personnes touchées par le cancer.
  </span>
</section>
</div>
<script>
const tabs = document.querySelectorAll(".tab");
const panels = {
  question: document.getElementById("questionPanel"),
  sector: document.getElementById("sectorPanel"),
  independent: document.getElementById("independentPanel"),
  problem: document.getElementById("problemPanel")
};
tabs.forEach(function(tab) {
  tab.addEventListener("click", function() {
    const mode = tab.dataset.mode;
    tabs.forEach(function(item) {
      item.classList.remove("active");
    });
    tab.classList.add("active");
    Object.keys(panels).forEach(function(key) {
      panels[key].classList.add("hidden");
    });
    panels[mode].classList.remove("hidden");
    document.getElementById("results").innerHTML = "";
  });
});
function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
async function envoyer(type, data, button) {
  button.disabled = true;
  button.textContent = "Analyse en cours...";
  const results = document.getElementById("results");
  results.innerHTML =
    '<div class="result-card">' +
      '<div class="ai-result">Analyse en cours...</div>' +
    '</div>';
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: type,
        ...data
      })
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(
        result.error || "Une erreur est survenue."
      );
    }
    const analyse =
      result.analyse ||
      "Aucune analyse disponible.";
    results.innerHTML =
      '<div class="result-card">' +
        '<h2>🤖 GouRare AI</h2>' +
        '<div class="ai-result">' +
          escapeHTML(analyse) +
        '</div>' +
      '</div>';
    results.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  } catch (error) {
    results.innerHTML =
      '<div class="result-card">' +
        '<div class="ai-result">' +
          escapeHTML(
            "Le service est momentanément indisponible. Veuillez réessayer."
          ) +
        '</div>' +
      '</div>';
  } finally {
    button.disabled = false;
    if (type === "sector") {
      button.textContent = "Analyser le secteur";
    } else if (type === "independent") {
      button.textContent = "M'aider dans ma situation";
    } else if (type === "problem") {
      button.textContent = "Analyser mon problème";
    } else {
      button.textContent = "Trouver la bonne orientation";
    }
  }
}
document
  .getElementById("questionButton")
  .addEventListener("click", function() {
    const question =
      document.getElementById("questionInput").value.trim();
    if (!question) {
      alert("Veuillez écrire votre question.");
      return;
    }
    envoyer(
      "question",
      {
        message: question
      },
      this
    );
  });
document
  .getElementById("sectorButton")
  .addEventListener("click", function() {
    const sector =
      document.getElementById("sectorInput").value.trim();
    if (!sector) {
      alert("Veuillez indiquer un secteur ou un métier.");
      return;
    }
    envoyer(
      "sector",
      {
        sector: sector
      },
      this
    );
  });
document
  .getElementById("independentButton")
  .addEventListener("click", function() {
    const activity =
      document.getElementById("activityInput").value.trim();
    const status =
      document.getElementById("statusInput").value;
    const question =
      document
        .getElementById("independentQuestion")
        .value
        .trim();
    if (!activity && !question) {
      alert("Veuillez indiquer votre activité ou votre question.");
      return;
    }
    envoyer(
      "independent",
      {
        activity: activity,
        status: status,
        message: question
      },
      this
    );
  });
document
  .getElementById("problemButton")
  .addEventListener("click", function() {
    const problem =
      document.getElementById("problemInput").value.trim();
    if (!problem) {
      alert("Veuillez décrire votre problème.");
      return;
    }
    envoyer(
      "problem",
      {
        message: problem
      },
      this
    );
  });
</script>
</body>
</html>`;
}
