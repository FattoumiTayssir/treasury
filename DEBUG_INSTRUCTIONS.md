# 🔍 Instructions de Débogage - Actualisation des Données

## Ce que j'ai fait

### 1. **Corrigé docker-compose.yml** ✅
Supprimé la variable d'environnement codée en dur qui écrasait le fichier `.env`:
```yaml
# AVANT (❌)
environment:
  VITE_API_URL: http://localhost:8000

# APRÈS (✅)
# Pas de environment: - utilise le .env du dossier monté
```

### 2. **Vérifié le fichier .env** ✅
Le fichier `/home/mss_ds/treasury/front2/.env` contient:
```env
VITE_API_URL=/api
VITE_WS_URL=ws://localhost:8000/api/data-refresh/ws
VITE_ODOO_API_URL=https://your-odoo-instance.com
```

### 3. **Nettoyé le cache Vite** ✅
```bash
rm -rf /app/node_modules/.vite
```

### 4. **Ajouté des logs de débogage** 🔍
Dans `front2/src/services/api.ts`, j'ai ajouté:
```typescript
console.log('🔍 DEBUG - VITE_API_URL:', import.meta.env.VITE_API_URL)
console.log('🔍 DEBUG - Using baseURL:', import.meta.env.VITE_API_URL || '/api')
console.log('🔍 DEBUG - Making request to:', ...)
```

### 5. **Redémarré le frontend** ✅
```bash
docker-compose restart frontend
```

## 🧪 CE QUE VOUS DEVEZ FAIRE MAINTENANT

### Étape 1: Ouvrir la Console du Navigateur
1. **Appuyez sur F12** (ou Cmd+Option+I sur Mac)
2. **Allez dans l'onglet "Console"**
3. **Rafraîchissez la page** avec Ctrl+Shift+R (ou Cmd+Shift+R)

### Étape 2: Chercher les Messages de Debug
Vous devriez voir des messages commençant par **🔍 DEBUG**:

```
🔍 DEBUG - VITE_API_URL: /api
🔍 DEBUG - Using baseURL: /api
```

### Étape 3: Naviguer vers "Actualiser les données"
1. Cliquez sur "Actualiser les données" dans la barre latérale
2. **Regardez la console** - vous verrez les requêtes:

**✅ Si ça marche correctement, vous verrez:**
```
🔍 DEBUG - Making request to: /api/data-refresh/status
🔍 DEBUG - Making request to: /api/data-refresh/history?limit=20
```

**❌ Si ça ne marche pas, vous verrez:**
```
🔍 DEBUG - Making request to: /data-refresh/status
🔍 DEBUG - Making request to: http://localhost:8000/data-refresh/status
```

### Étape 4: Vérifier les Erreurs Réseau
1. Dans la console, allez dans **l'onglet "Network" (Réseau)**
2. Filtrez par "data-refresh"
3. Regardez les URLs appelées:
   - ✅ **CORRECT**: `http://localhost:3000/api/data-refresh/status`
   - ❌ **INCORRECT**: `http://localhost:8000/data-refresh/status`

## 📊 Que Faire Selon les Résultats

### Cas 1: VITE_API_URL est undefined ou vide
```
🔍 DEBUG - VITE_API_URL: undefined
🔍 DEBUG - Using baseURL: /api
```

**Problème:** Le fichier .env n'est pas lu par Vite

**Solution:**
```bash
cd /home/mss_ds/treasury
docker-compose down
docker-compose up -d --build
```

### Cas 2: VITE_API_URL a l'ancienne valeur
```
🔍 DEBUG - VITE_API_URL: http://localhost:8000
```

**Problème:** Cache navigateur ou Vite n'a pas rechargé

**Solution:**
1. Videz le cache du navigateur complètement
2. Ou utilisez le mode navigation privée
3. Ou redémarrez le conteneur:
```bash
docker-compose stop frontend
docker-compose rm -f frontend
docker-compose up -d frontend
```

### Cas 3: Les URLs ne contiennent pas /api
```
🔍 DEBUG - Making request to: /data-refresh/status
```

**Problème:** Le baseURL n'est pas utilisé correctement

**Solution:** Il y a un problème avec axios - vérifiez que la configuration est correcte

### Cas 4: Tout semble correct mais 404 quand même
```
🔍 DEBUG - VITE_API_URL: /api
🔍 DEBUG - Making request to: /api/data-refresh/status
❌ GET http://localhost:3000/api/data-refresh/status 404
```

**Problème:** Le proxy Vite ne fonctionne pas

**Solution:** Vérifiez `vite.config.ts` ligne 16-21:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',  // ← Doit pointer vers le backend
    changeOrigin: true,
  },
}
```

## 🎯 Objectif Final

Vous devriez voir dans la console:
```
✅ 🔍 DEBUG - VITE_API_URL: /api
✅ 🔍 DEBUG - Using baseURL: /api
✅ 🔍 DEBUG - Making request to: /api/data-refresh/status
✅ 🔍 DEBUG - Making request to: /api/data-refresh/history?limit=20
```

Et dans l'onglet Network:
```
✅ GET http://localhost:3000/api/data-refresh/status 200 OK
✅ GET http://localhost:3000/api/data-refresh/history?limit=20 200 OK
```

## 📝 Rapportez-moi les Résultats

Copiez et envoyez-moi:
1. ✏️ **Les 3 premières lignes** de la console (celles avec 🔍 DEBUG)
2. ✏️ **Les URLs** appelées dans l'onglet Network
3. ✏️ **Les codes de réponse** (200, 404, etc.)

Exemple:
```
🔍 DEBUG - VITE_API_URL: /api
🔍 DEBUG - Using baseURL: /api
🔍 DEBUG - Making request to: /api/data-refresh/status

Network Tab:
GET http://localhost:3000/api/data-refresh/status → 200 OK
```

---

**J'attends vos résultats pour diagnostiquer précisément le problème! 🔍**
