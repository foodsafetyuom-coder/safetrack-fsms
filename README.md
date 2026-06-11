# SafeTrack FSMS — Guide d'installation PWA gratuite

## Fichiers fournis

| Fichier              | Rôle                                      |
|----------------------|-------------------------------------------|
| `manifest.json`      | Décrit l'app (nom, icône, couleur)        |
| `service-worker.js`  | Cache les pages, gère le mode hors ligne  |
| `offline.html`       | Page affichée quand pas de réseau         |
| `icons/icon-192.png` | Icône mobile 192×192                      |
| `icons/icon-512.png` | Icône mobile 512×512                      |
| `pwa-snippet.html`   | Code à coller dans tes pages HTML         |

---

## Étape 1 — Modifier tes pages HTML existantes

Dans chaque fichier (`sensibilis.html`, `admin.html`, etc.), colle le contenu
de `pwa-snippet.html` :

- Le bloc `<link rel="manifest">` et les balises `<meta>` → dans le `<head>`
- Le bloc `<script>` d'enregistrement → juste avant `</body>`

---

## Étape 2 — Déposer les fichiers sur GitHub Pages

1. Crée un compte GitHub (gratuit) sur https://github.com
2. Crée un nouveau repository, ex. `safetrack-fsms`
3. Dépose tous tes fichiers :
   - `sensibilis.html`, `admin.html`, `index.html` (tes pages existantes)
   - `manifest.json`, `service-worker.js`, `offline.html`
   - `icons/icon-192.png`, `icons/icon-512.png`
4. Va dans **Settings → Pages → Source → main branch → / (root)**
5. Ton app est disponible sur :
   `https://TON-NOM.github.io/safetrack-fsms/`

---

## Étape 3 — Installer l'app sur Android

1. Ouvre l'URL dans **Chrome pour Android**
2. Chrome affiche automatiquement une bannière « Ajouter à l'écran d'accueil »
3. L'app s'installe comme une app native (icône, plein écran, pas de barre URL)

Sur iOS (Safari) : bouton Partager → « Sur l'écran d'accueil »

---

## Étape 4 — Connecter au backend Apps Script

Tes appels `google.script.run` ne fonctionnent **que** depuis un `doGet()`
Apps Script. Pour GitHub Pages, tu dois passer par l'**URL de déploiement web** :

```javascript
// Remplace google.script.run.maFonction(data) par :
const BACKEND_URL = 'https://script.google.com/macros/s/TON_ID/exec';

fetch(BACKEND_URL + '?action=maFonction', {
  method: 'POST',
  body: JSON.stringify(data)
})
.then(r => r.json())
.then(result => { /* ... */ });
```

Dans `Code.gs`, ton `doPost(e)` reçoit les appels et route avec `routePostAction()`.

---

## Notes importantes

- Le service worker ne cache **pas** les appels Apps Script (réseau requis pour les données)
- Les assets HTML/CSS/JS sont mis en cache → l'interface charge même sans réseau
- Pour mettre à jour l'app, modifie `CACHE_NAME` dans `service-worker.js` (ex. `safetrack-v2`)
- GitHub Pages est **public** par défaut — protège `admin.html` avec un mot de passe côté Apps Script
