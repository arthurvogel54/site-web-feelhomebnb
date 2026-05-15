const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3003;
const ROOT = __dirname;

// =====================================================================
// STRIPE — remplacer la clé secrète ci-dessous (ou utiliser la variable
// d'environnement STRIPE_SECRET_KEY en production)
// =====================================================================
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || 'sk_test_VOTRE_CLE_SECRETE_ICI'; // ← remplacer

let stripe = null;
try {
  stripe = require('stripe')(STRIPE_SECRET);
  console.log('Stripe initialisé.');
} catch (e) {
  console.log('Stripe non configuré (module absent ou clé invalide) — endpoint /api/create-payment-intent retournera 503.');
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
  '.json': 'application/json',
};

http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  // ------------------------------------------------------------------
  // API : POST /api/create-payment-intent
  // ------------------------------------------------------------------
  if (req.method === 'POST' && urlPath === '/api/create-payment-intent') {
    if (!stripe) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        error: 'Stripe non configuré sur le serveur. Veuillez ajouter la variable STRIPE_SECRET_KEY.',
      }));
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { amount, propertyName, checkIn, checkOut } = data;

        if (!amount || amount <= 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Montant invalide.' }));
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount:   Math.round(amount * 100), // Stripe attend des centimes
          currency: 'eur',
          metadata: {
            property: propertyName || '',
            checkIn:  checkIn  || '',
            checkOut: checkOut || '',
          },
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ clientSecret: paymentIntent.client_secret }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Erreur serveur.' }));
      }
    });
    return;
  }

  const filePath = path.join(ROOT, urlPath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`Feel'HomeBNB → http://localhost:${PORT}`);
});
