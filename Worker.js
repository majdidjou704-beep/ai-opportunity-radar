export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ==============================
    // 1. SECURITY HEADERS
    // ==============================

    const securityHeaders = {
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
    };

    // ==============================
    // 2. HEALTH CHECK
    // ==============================

    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          success: true,
          service: "GouRare AI",
          status: "OK"
        }),
        {
          status: 200,
          headers: securityHeaders
        }
      );
    }

    // ==============================
    // 3. AI ANALYSIS API
    // ==============================

    if (url.pathname === "/api/analyze") {

      // Only POST is allowed
      if (request.method !== "POST") {
        return new Response(
          JSON.stringify({
            error: "Méthode non autorisée."
          }),
          {
            status: 405,
            headers: securityHeaders
          }
        );
      }

      try {

        // ==============================
        // 4. READ REQUEST
        // ==============================

        const body = await request.json();

        const business = String(body.business || "").trim();

        // ==============================
        // 5. INPUT PROTECTION
        // ==============================

        if (!business) {
          return new Response(
            JSON.stringify({
              error: "Veuillez indiquer votre activité ou votre secteur."
            }),
            {
              status: 400,
              headers: securityHeaders
            }
          );
        }

        // Prevent extremely large inputs
        if (business.length > 200) {
          return new Response(
            JSON.stringify({
              error: "Votre activité est trop longue. Veuillez utiliser une description plus courte."
            }),
            {
              status: 400,
              headers: securityHeaders
            }
          );
        }

        // ==============================
        // 6. AI ANALYSIS
        // ==============================

        const response = await env.IA.run(
          "@cf/meta/llama-3.1-8b-instruct-fast",
          {
            messages: [

              // SYSTEM PROMPT
              {
                role: "system",

                content:
                  "Tu es GouRare AI, un analyste stratégique spécialisé dans la détection d'opportunités commerciales, l'intelligence économique, l'IA, l'automatisation et la création de solutions numériques. " +

                  "Tu analyses les activités et les secteurs avec une approche concrète, réaliste et orientée vers l'action. " +

                  "Réponds toujours en français. " +

                  "Ne présente jamais une information incertaine comme un fait. " +

                  "Ne fabrique aucune statistique, aucun pourcentage, aucun chiffre financier, aucun prix, aucune part de marché et aucune source. " +

                  "Si une information n'est pas vérifiable, présente-la clairement comme une hypothèse ou une possibilité."
              },

              // USER PROMPT
              {
                role: "user",

                content:
                  "Analyse cette activité ou ce secteur : " +
                  business +
                  ".\n\n" +

                  "Ton objectif est de découvrir des problèmes réels et exploitables pouvant être transformés en services, produits, automatisations, nouvelles offres commerciales ou solutions numériques vendables.\n\n" +

                  "Identifie des opportunités qui peuvent réellement créer de la valeur pour les entreprises ou leurs clients.\n\n" +

                  "IMPORTANT : les 5 opportunités doivent être réellement différentes les unes des autres. Elles doivent résoudre des problèmes différents et utiliser des approches différentes. Ne propose pas plusieurs variantes d'un même logiciel de gestion.\n\n" +

                  "Diversifie les opportunités lorsque cela est pertinent entre plusieurs catégories : réduction des coûts, acquisition de clients, fidélisation, gestion administrative, ressources humaines, qualité, productivité, opérations, nouveaux services, produits, automatisation ou développement commercial.\n\n" +

                  "Une seule des cinq opportunités peut être principalement une plateforme ou un logiciel. Les autres doivent privilégier des approches différentes : service spécialisé, automatisation, produit, prestation, nouvelle offre commerciale, système interne ou méthode opérationnelle.\n\n" +

                  "Ne transforme pas automatiquement chaque problème en application, plateforme ou logiciel. Le format de la solution doit correspondre au problème identifié.\n\n" +

                  "Évite les idées génériques. Cherche des problèmes précis, des tâches répétitives, des pertes de temps, des coûts évitables, des difficultés commerciales, des problèmes opérationnels ou des services pouvant être améliorés.\n\n" +

                  "Pour chaque opportunité, donne une première action de validation immédiatement réalisable avec peu de moyens. Cette action doit être concrète : contacter quelques prospects, créer un prototype simple, tester une offre, automatiser une tâche précise ou réaliser une démonstration. Ne propose pas simplement 'faire une étude de marché' ou 'analyser le marché'.\n\n" +

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

        // ==============================
        // 7. RETURN AI RESULT
        // ==============================

        return new Response(
          JSON.stringify({
            success: true,
            business: business,
            analysis: response
          }),
          {
            status: 200,
            headers: securityHeaders
          }
        );

      } catch (error) {

        // ==============================
        // 8. SAFE ERROR
        // ==============================

        return new Response(
          JSON.stringify({
            error: "Une erreur est survenue pendant l'analyse."
          }),
          {
            status: 500,
            headers: securityHeaders
          }
        );
      }
    }

    // ==============================
    // 9. DEFAULT RESPONSE
    // ==============================

    return new Response(
      JSON.stringify({
        service: "GouRare AI",
        message: "Service opérationnel."
      }),
      {
        status: 200,
        headers: securityHeaders
      }
    );
  }
};
