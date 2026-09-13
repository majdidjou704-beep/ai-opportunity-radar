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
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI Opportunity Radar</title>
<style>
body{font-family:Arial,sans-serif;margin:0;background:#f5f7fa;color:#172033}
main{max-width:800px;margin:60px auto;padding:30px;text-align:center}
h1{font-size:38px;margin-bottom:10px}
p{font-size:18px;line-height:1.6}
.card{background:white;padding:25px;margin-top:30px;border-radius:16px;box-shadow:0 5px 25px #0001}
</style>
</head>
<body>
<main>
<h1>AI Opportunity Radar</h1>
<p>Votre assistant IA pour détecter les opportunités économiques pertinentes pour votre entreprise.</p>
<div class="card">
<h2>Radar d'opportunités</h2>
<p>Détection intelligente des marchés, renouvellements et opportunités professionnelles.</p>
</div>
</main>
</body>
</html>
`, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
};
