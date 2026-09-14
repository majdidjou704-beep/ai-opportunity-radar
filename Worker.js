export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    const headers = {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Cache-Control": "no-store"
    };

    function json(data, status) {
      return new Response(JSON.stringify(data), {
        status: status || 200,
        headers: {
          ...headers,
          "Content-Type": "application/json; charset=UTF-8"
        }
      });
    }

    function clean(value, maxLength) {
      return String(value || "")
        .replace(/\u0000/g, "")
        .trim()
        .slice(0, maxLength);
    }

    function systemPrompt() {
      return `
Tu es GouRare AI.

Tu es un assistant intelligent d'orientation,
de recherche, d'analyse et de résolution de problèmes.

Ton objectif est d'aider les citoyens, indépendants,
entrepreneurs et petites entreprises à :

- comprendre leur situation
- identifier les vrais problèmes
- trouver les bonnes démarches
- rechercher des solutions
- éviter les erreurs
- comparer les possibilités
- identifier les risques
- trouver la prochaine action concrète

Tu n'es pas avocat, expert-comptable, médecin ou administration.
Tu aides à comprendre et à s'orienter.

==============================
RÈGLE DE FIABILITÉ
==============================

Ne jamais inventer :

- chiffres
- statistiques
- taux
- seuils
- délais
- pénalités
- articles de loi
- obligations
- prix
- revenus
- économies

Pour les sujets juridiques, fiscaux ou administratifs,
signaler lorsque l'information doit être vérifiée.

Priorité aux sources officielles françaises :

Service-Public
Service-Public Entreprendre
URSSAF
impots.gouv.fr
economie.gouv.fr

==============================
STYLE
==============================

Répondre en français clair.

Être concret.

Éviter les généralités.

Distinguer :

- information certaine
- information à vérifier
- hypothèse
- recommandation

Toujours terminer par :

PROCHAINE ACTION

avec une action concrète.
`;
    }

    async function askAI(prompt, maxTokens) {

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
          max_tokens: maxTokens || 1800,
          temperature: 0.15
        }
      );

      if (!result) {
        throw new Error("Réponse IA vide");
      }

      if (typeof result === "string") {
        return result;
      }

      if (typeof result.response === "string") {
        return result.response;
      }

      if (
        result.result &&
        typeof result.result.response === "string"
      ) {
        return result.result.response;
      }

      return JSON.stringify(result);
    }

    /*
     * ==========================================
     * QUESTION GÉNÉRALE
     * ==========================================
     */

    async function questionGenerale(question) {

      return askAI(`
QUESTION DE L'UTILISATEUR :

${question}

Analyse le besoin réel derrière cette question.

Réponds avec :

1. CE QUE J'AI COMPRIS

2. RÉPONSE

3. CE QU'IL FAUT VÉRIFIER

4. RISQUES / ERREURS À ÉVITER

5. OPTIONS POSSIBLES

6. PROCHAINE ACTION

Si la question concerne la France,
les démarches administratives, la fiscalité,
le travail ou le droit, ne fabrique aucune règle.
`, 1800);
    }

    /*
     * ==========================================
     * ANALYSE D'UN SECTEUR
     * ==========================================
     */

    async function analyserSecteur(secteur) {

      return askAI(`
MISSION :

Analyser le secteur suivant :

${secteur}

Tu es un analyste stratégique.

IMPORTANT :

Ne produis pas une simple liste d'idées.

Tu dois d'abord chercher les problèmes économiques,
opérationnels et humains qui peuvent exister.

==============================
1. CARTOGRAPHIE DU SECTEUR
==============================

Identifie :

- clients
- entreprises
- fournisseurs
- intermédiaires
- travailleurs
- décideurs
- payeurs

==============================
2. PROBLÈMES
==============================

Cherche des problèmes différents concernant :

- acquisition de clients
- fidélisation
- coûts
- temps perdu
- qualité
- organisation
- personnel
- communication
- administration
- erreurs
- retards
- risques
- pertes
- productivité

Ne répète pas le même problème sous plusieurs formes.

==============================
3. OPPORTUNITÉS
==============================

Identifie exactement 5 opportunités réellement différentes.

Pour chaque opportunité :

NOM

PROBLÈME RÉEL

CLIENT

PAYEUR

POURQUOI LE CLIENT PAIERAIT

SOLUTION

TYPE DE SOLUTION

UTILITÉ POSSIBLE DE L'IA

VALEUR

FAISABILITÉ

DIFFICULTÉ DE VENTE

DIFFÉRENCIATION

VALIDATION RAPIDE

OBSTACLE PRINCIPAL

POTENTIEL :
Faible / Moyen / Fort / Très fort

IMPORTANT :

Ne transforme pas systématiquement les opportunités
en logiciels ou SaaS.

Une opportunité peut être :

- service
- organisation
- formation
- intermédiation
- automatisation
- audit
- assistance
- outil
- IA
- amélioration opérationnelle

==============================
4. CLASSEMENT
==============================

Classe les opportunités selon :

- valeur
- facilité de lancement
- facilité de vente
- différenciation
- potentiel IA
- rapidité de validation

==============================
5. MEILLEURS CHOIX
==============================

Indique :

MEILLEURE OPPORTUNITÉ

PLUS FACILE À LANCER

PLUS FACILE À VENDRE

MEILLEURE OPPORTUNITÉ IA

OPPORTUNITÉ LA PLUS SOUS-ESTIMÉE

==============================
6. TEST
==============================

Explique comment vérifier rapidement
si la meilleure opportunité correspond à un besoin réel.

N'invente aucun chiffre.

==============================
PROCHAINE ACTION
==============================

Donne une seule première action concrète.
`, 2400);
    }

    /*
     * ==========================================
     * ASSISTANT INDÉPENDANT
     * ==========================================
     */

    async function assistantIndependant(
      activite,
      statut,
      question
    ) {

      return askAI(`
MODULE :

ASSISTANT INDÉPENDANT — FRANCE

ACTIVITÉ :

${activite || "Non précisée"}

STATUT :

${statut || "Je ne sais pas"}

QUESTION :

${question || "Situation générale"}

Aide l'utilisateur à comprendre sa situation.

Analyse si pertinent :

- création d'activité
- statut
- URSSAF
- impôt
- TVA
- CFE
- facturation
- obligations
- déclarations
- documents
- échéances
- assurance
- comptabilité
- recours éventuel à un expert-comptable

==============================
RÈGLE ESSENTIELLE
==============================

Ne jamais inventer de chiffre,
de seuil, de taux ou de délai.

Lorsqu'une règle dépend de la situation
ou peut avoir changé, le signaler clairement.

Indiquer les sources officielles à vérifier.

==============================
FORMAT
==============================

1. CE QUE J'AI COMPRIS

2. CE QUI PEUT S'APPLIQUER

3. CE QUE VOUS DEVEZ FAIRE

4. OÙ FAIRE LA DÉMARCHE

5. DOCUMENTS À PRÉPARER

6. POINTS À VÉRIFIER

7. ERREURS À ÉVITER

8. QUAND CONSULTER UN PROFESSIONNEL

9. PROCHAINE ACTION
`, 2000);
    }

    /*
     * ==========================================
     * PROBLÈME
     * ==========================================
     */

    async function analyserProbleme(probleme) {

      return askAI(`
MODULE :

RÉSOLUTION DE PROBLÈME

PROBLÈME :

${probleme}

Ne te contente pas de reformuler.

Cherche :

1. LE PROBLÈME PRINCIPAL

2. LES CAUSES POSSIBLES

3. LES CONSÉQUENCES

4. CE QUI DOIT ÊTRE VÉRIFIÉ

5. LES SOLUTIONS POSSIBLES

6. SOLUTION LA PLUS SIMPLE

7. SOLUTION LA PLUS EFFICACE

8. RISQUES

9. ORDRE DES ACTIONS

10. PROCHAINE ACTION

Si une information manque,
indique précisément laquelle.
`, 1900);
    }

    /*
     * ==========================================
     * HEALTH
     * ==========================================
     */

    if (url.pathname === "/health") {

      return json({
        success: true,
        service: "GouRare AI",
        status: "OK",
        version: "4.0"
      });

    }

    /*
     * ==========================================
     * API
     * ==========================================
     */

    if (url.pathname === "/api/analyze") {

      if (request.method !== "POST") {

        return json({
          success: false,
          error: "Méthode non autorisée."
        }, 405);

      }

      const contentType =
        request.headers.get("content-type") || "";

      if (
        !contentType
          .toLowerCase()
          .includes("application/json")
      ) {

        return json({
          success: false,
          error: "Format invalide."
        }, 415);

      }

      let body;

      try {

        body = await request.json();

      } catch {

        return json({
          success: false,
          error: "JSON invalide."
        }, 400);

      }

      const type =
        clean(body.type, 30);

      const message =
        clean(body.message, 2000);

      const sector =
        clean(body.sector, 200);

      const activity =
        clean(body.activity, 200);

      const status =
        clean(body.status, 100);

      try {

        /*
         * SECTEUR
         */

        if (type === "sector") {

          if (!sector) {

            return json({
              success: false,
              error: "Veuillez indiquer un secteur."
            }, 400);

          }

          /*
           * Si l'utilisateur écrit une question complète
           * dans la zone secteur, on la redirige vers
           * le module général.
           */

          const looksLikeQuestion =
            sector.includes("?") ||
            sector.length > 80;

          if (looksLikeQuestion) {

            const result =
              await questionGenerale(sector);

            return json({
              success: true,
              type: "general",
              result: result
            });

          }

          const result =
            await analyserSecteur(sector);

          return json({
            success: true,
            type: "sector",
            result: result
          });
        }

        /*
         * INDÉPENDANT
         */

        if (type === "independent") {

          if (!activity && !message) {

            return json({
              success: false,
              error:
                "Veuillez préciser votre activité ou votre question."
            }, 400);

          }

          const result =
            await assistantIndependant(
              activity,
              status,
              message
            );

          return json({
            success: true,
            type: "independent",
            result: result
          });
        }

        /*
         * PROBLÈME
         */

        if (type === "problem") {

          if (!message) {

            return json({
              success: false,
              error:
                "Veuillez décrire votre problème."
            }, 400);

          }

          const result =
            await analyserProbleme(message);

          return json({
            success: true,
            type: "problem",
            result: result
          });
        }

        /*
         * QUESTION GÉNÉRALE
         */

        if (!message) {

          return json({
            success: false,
            error:
              "Veuillez saisir votre question."
          }, 400);

        }

        const result =
          await questionGenerale(message);

        return json({
          success: true,
          type: "general",
          result: result
        });

      } catch (error) {

        console.error(
          "GouRare AI error:",
          error
        );

        return json({
          success: false,
          error:
            "Le service IA est momentanément indisponible."
        }, 500);

      }
    }

    /*
     * ==========================================
     * PAGE WEB
     * ==========================================
     */

    const html = `
<!DOCTYPE html>

<html lang="fr">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>

<meta
  name="description"
  content="GouRare AI — assistant intelligent pour citoyens, indépendants et entreprises."
>

<title>
GouRare AI
</title>

<style>

* {
  box-sizing: border-box;
}

body {

  margin: 0;

  min-height: 100vh;

  background:
    radial-gradient(
      circle at top,
      #1b2430,
      #080a0e 55%,
      #050608
    );

  color: #f5f7fa;

  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Arial,
    sans-serif;
}

.container {

  width: min(
    1050px,
    calc(100% - 20px)
  );

  margin: auto;

  padding: 28px 0 35px;
}

header {

  text-align: center;

  margin-bottom: 25px;
}

.logo {

  font-size: 38px;

  font-weight: 800;

  letter-spacing: -2px;
}

.logo span {

  opacity: .5;

  font-weight: 500;
}

.badge {

  display: inline-block;

  margin-top: 10px;

  padding: 7px 13px;

  border:
    1px solid
    rgba(255,255,255,.1);

  border-radius: 999px;

  color: #b8c1ce;

  font-size: 13px;
}

h1 {

  margin:
    25px auto 12px;

  max-width: 800px;

  font-size:
    clamp(35px, 6vw, 58px);

  line-height: 1;

  letter-spacing: -2px;
}

.subtitle {

  max-width: 720px;

  margin: auto;

  color: #a5afbc;

  line-height: 1.65;
}

.panel {

  padding: 18px;

  border:
    1px solid
    rgba(255,255,255,.08);

  border-radius: 20px;

  background:
    rgba(13,17,23,.9);
}

.tabs {

  display: grid;

  grid-template-columns:
    repeat(4, 1fr);

  gap: 7px;

  margin-bottom: 17px;
}

.tab {

  padding: 12px 7px;

  border:
    1px solid
    rgba(255,255,255,.08);

  border-radius: 11px;

  background:
    rgba(255,255,255,.025);

  color: #aeb7c4;

  font-weight: 700;

  cursor: pointer;
}

.tab.active {

  background: #f5f7fa;

  color: #07090d;
}

.group {

  margin-bottom: 13px;
}

label {

  display: block;

  margin-bottom: 7px;

  color: #c8d0da;

  font-size: 14px;
}

input,
textarea,
select {

  width: 100%;

  padding: 13px;

  border:
    1px solid
    rgba(255,255,255,.1);

  border-radius: 12px;

  outline: none;

  background: #080b10;

  color: white;

  font-size: 15px;
}

textarea {

  min-height: 115px;

  resize: vertical;
}

button {

  font-family: inherit;
}

.primary {

  width: 100%;

  height: 54px;

  border: 0;

  border-radius: 12px;

  background: #f5f7fa;

  color: #07090d;

  font-weight: 800;

  cursor: pointer;
}

.primary:disabled {

  opacity: .55;

  cursor: wait;
}

.hidden {
  display: none;
}

.status {

  min-height: 22px;

  margin:
    13px 3px;

  color: #aab3c1;

  font-size: 14px;
}

.result {

  margin-top: 15px;

  padding: 22px;

  border:
    1px solid
    rgba(255,255,255,.08);

  border-radius: 17px;

  background:
    rgba(7,10,15,.82);
}

.result h2 {

  margin-top: 0;
}

.resultText {

  white-space: pre-wrap;

  word-break: break-word;

  line-height: 1.75;

  color: #dce1e9;
}

.features {

  display: grid;

  grid-template-columns:
    repeat(3, 1fr);

  gap: 10px;

  margin-top: 13px;
}

.feature {

  padding: 17px;

  border:
    1px solid
    rgba(255,255,255,.07);

  border-radius: 16px;

  background:
    rgba(255,255,255,.025);
}

.feature strong {

  display: block;

  margin-bottom: 6px;
}

.feature p {

  margin: 0;

  color: #929baa;

  font-size: 13px;

  line-height: 1.55;
}

.footer {

  padding-top: 25px;

  text-align: center;

  color: #687280;

  font-size: 12px;
}

@media (max-width: 700px) {

  .tabs {

    grid-template-columns:
      repeat(2, 1fr);
  }

  .features {

    grid-template-columns: 1fr;
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
Intelligence & orientation assistées par IA
</div>

<h1>
Un problème ? Trouvez le bon chemin.
</h1>

<p class="subtitle">
Comprendre votre situation, trouver les solutions,
éviter les erreurs et identifier la prochaine action.
</p>

</header>

<section class="panel">

<div class="tabs">

<button
  class="tab active"
  data-mode="general"
  type="button"
>
💬 Question
</button>

<button
  class="tab"
  data-mode="sector"
  type="button"
>
📊 Secteur
</button>

<button
  class="tab"
  data-mode="independent"
  type="button"
>
💼 Indépendant
</button>

<button
  class="tab"
  data-mode="problem"
  type="button"
>
🧭 Problème
</button>

</div>

<form id="form">

<div id="generalBox">

<div class="group">

<label>
Votre question
</label>

<textarea
  id="question"
  maxlength="2000"
  placeholder="Ex. Je veux créer une activité de nettoyage en France. Que dois-je faire ?"
></textarea>

</div>

</div>

<div
  id="sectorBox"
  class="hidden"
>

<div class="group">

<label>
Secteur à analyser
</label>

<input
  id="sector"
  maxlength="200"
  placeholder="Ex. Nettoyage"
/>

</div>

</div>

<div
  id="independentBox"
  class="hidden"
>

<div class="group">

<label>
Votre activité
</label>

<input
  id="activity"
  maxlength="200"
  placeholder="Ex. Nettoyage à domicile"
/>

</div>

<div class="group">

<label>
Votre statut
</label>

<select id="status">

<option value="">
Je ne sais pas
</option>

<option>
Micro-entrepreneur
</option>

<option>
Entrepreneur individuel
</option>

<option>
Freelance
</option>

<option>
Société
</option>

</select>

</div>

<div class="group">

<label>
Votre question
</label>

<textarea
  id="independentQuestion"
  maxlength="1500"
  placeholder="Ex. Quelles sont mes obligations fiscales ?"
></textarea>

</div>

</div>

<div
  id="problemBox"
  class="hidden"
>

<div class="group">

<label>
Décrivez votre problème
</label>

<textarea
  id="problem"
  maxlength="2000"
  placeholder="Expliquez votre situation simplement..."
></textarea>

</div>

</div>

<button
  class="primary"
  id="submit"
  type="submit"
>
Trouver la bonne orientation
</button>

</form>

<div
  class="status"
  id="statusMessage"
  aria-live="polite"
></div>

<div id="result"></div>

</section>

<section class="features">

<div class="feature">

<strong>
🧭 Orientation
</strong>

<p>
Comprendre quoi faire, où aller et
quelle étape effectuer ensuite.
</p>

</div>

<div class="feature">

<strong>
⚖️ Vigilance
</strong>

<p>
Identifier les points administratifs,
fiscaux ou juridiques à vérifier.
</p>

</div>

<div class="feature">

<strong>
💡 Solutions
</strong>

<p>
Explorer des solutions adaptées
à votre situation.
</p>

</div>

</section>

<footer class="footer">
GouRare AI — Intelligence & Orientation
</footer>

</div>

<script>

(function () {

  var mode = "general";

  var tabs =
    document.querySelectorAll(".tab");

  var boxes = {

    general:
      document.getElementById("generalBox"),

    sector:
      document.getElementById("sectorBox"),

    independent:
      document.getElementById("independentBox"),

    problem:
      document.getElementById("problemBox")

  };

  var form =
    document.getElementById("form");

  var button =
    document.getElementById("submit");

  var statusMessage =
    document.getElementById("statusMessage");

  var result =
    document.getElementById("result");

  function setMode(newMode) {

    mode = newMode;

    tabs.forEach(function (tab) {

      var active =
        tab.getAttribute("data-mode") === newMode;

      tab.classList.toggle(
        "active",
        active
      );

    });

    Object.keys(boxes).forEach(
      function (key) {

        boxes[key].classList.toggle(
          "hidden",
          key !== newMode
        );

      }
    );

    result.replaceChildren();

    statusMessage.textContent = "";

    if (newMode === "general") {

      button.textContent =
        "Trouver la bonne orientation";

    } else if (newMode === "sector") {

      button.textContent =
        "Analyser le secteur";

    } else if (newMode === "independent") {

      button.textContent =
        "M'aider dans ma situation";

    } else {

      button.textContent =
        "Analyser mon problème";

    }

  }

  tabs.forEach(function (tab) {

    tab.addEventListener(
      "click",
      function () {

        setMode(
          tab.getAttribute("data-mode")
        );

      }
    );

  });

  form.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();

      var payload;

      if (mode === "general") {

        payload = {

          type: "general",

          message:
            document
              .getElementById("question")
              .value
              .trim()

        };

      }

      if (mode === "sector") {

        payload = {

          type: "sector",

          sector:
            document
              .getElementById("sector")
              .value
              .trim()

        };

      }

      if (mode === "independent") {

        payload = {

          type: "independent",

          activity:
            document
              .getElementById("activity")
              .value
              .trim(),

          status:
            document
              .getElementById("status")
              .value,

          message:
            document
              .getElementById("independentQuestion")
              .value
              .trim()

        };

      }

      if (mode === "problem") {

        payload = {

          type: "problem",

          message:
            document
              .getElementById("problem")
              .value
              .trim()

        };

      }

      var hasContent = false;

      Object.keys(payload).forEach(
        function (key) {

          if (
            key !== "type" &&
            String(
              payload[key] || ""
            ).trim()
          ) {

            hasContent = true;

          }

        }
      );

      if (!hasContent) {

        statusMessage.textContent =
          "Veuillez préciser votre demande.";

        return;

      }

      button.disabled = true;

      statusMessage.textContent =
        "GouRare AI analyse votre demande...";

      result.replaceChildren();

      try {

        var response =
          await fetch(
            "/api/analyze",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify(payload)
            }
          );

        var data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {

          throw new Error(
            data.error ||
            "Erreur"
          );

        }

        statusMessage.textContent =
          "Analyse terminée.";

        var card =
          document.createElement("div");

        card.className =
          "result";

        var title =
          document.createElement("h2");

        title.textContent =
          "🤖 GouRare AI";

        var text =
          document.createElement("div");

        text.className =
          "resultText";

        text.textContent =
          String(
            data.result ||
            "Aucun résultat disponible."
          );

        card.appendChild(title);

        card.appendChild(text);

        result.appendChild(card);

      } catch (error) {

        console.error(error);

        statusMessage.textContent =
          "Le service IA est momentanément indisponible.";

      } finally {

        button.disabled = false;

      }

    }
  );

})();

</script>

</body>

</html>
`;

    return new Response(
      html,
      {
        status: 200,
        headers: {
          ...headers,
          "Content-Type":
            "text/html; charset=UTF-8"
        }
      }
    );
  }
};
