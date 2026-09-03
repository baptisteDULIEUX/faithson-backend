# Faithson Custom — Backend (Node.js + Express + PostgreSQL)

API du site Faithson Custom. Pour l'instant : **connexion à PostgreSQL** et
**gestion des produits** (lister, créer, modifier, supprimer). Conçue pour se
brancher directement sur le frontend Vue (mêmes routes que `src/services/api.js`).

## Prérequis

- **Node.js** 18 ou plus (Node 20+ conseillé)
- **PostgreSQL** 14 ou plus

## 1. Créer la base et l'utilisateur

Dans un terminal :

```bash
# ouvre psql en tant que superutilisateur postgres
sudo -u postgres psql
```

Puis dans psql :

```sql
CREATE USER faithson WITH PASSWORD 'faithson';
CREATE DATABASE faithson OWNER faithson;
\q
```

> Adaptez le nom/mot de passe si vous voulez — il faudra juste les reporter dans `.env`.

## 2. Configurer le projet

```bash
cp .env .env      # puis ajustez DATABASE_URL si besoin
npm install
```

## 3. Initialiser les tables + les données

```bash
npm run db:init      # crée les tables et insère les 8 produits de départ
# ou pour repartir de zéro :
npm run db:reset     # supprime puis recrée tout
```

## 4. Lancer l'API

```bash
npm run dev          # rechargement auto (node --watch)
# ou
npm start
```

Test rapide :

```bash
curl http://localhost:3000/api/products
```

## Endpoints

| Méthode | Route                     | Accès  | Rôle |
|---------|---------------------------|--------|------|
| GET     | `/api/health`             | public | état du service |
| GET     | `/api/products`           | public | liste des produits (`?category=hauts` pour filtrer) |
| GET     | `/api/products/:id`       | public | un produit |
| GET     | `/api/categories`         | public | catégories disponibles |
| POST    | `/api/admin/products`     | admin  | créer un produit |
| PATCH   | `/api/admin/products/:id` | admin  | modifier un produit |
| DELETE  | `/api/admin/products/:id` | admin  | supprimer un produit |

### Exemples

Créer un produit :

```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob bucket",
    "technique": "broderie",
    "category": "accessoires",
    "price": 16,
    "badge": "Nouveau",
    "placeholder": { "shape": "cap", "color": "#b5482e" }
  }'
```

Modifier le prix :

```bash
curl -X PATCH http://localhost:3000/api/admin/products/bob-bucket \
  -H "Content-Type: application/json" \
  -d '{ "price": 18 }'
```

Supprimer :

```bash
curl -X DELETE http://localhost:3000/api/admin/products/bob-bucket
```

## Format d'un produit (réponse API)

```json
{
  "id": "tshirt-bio",
  "name": "T-shirt coton bio",
  "technique": "sérigraphie",
  "category": "hauts",
  "price": 12,
  "priceLabel": "à partir de",
  "badge": "Best-seller",
  "image": null,
  "placeholder": { "shape": "tshirt", "color": "#3a2e27" }
}
```

C'est exactement la forme attendue par le frontend (`price: null` => « sur devis »).

## Brancher le frontend Vue

Dans le projet frontend :

1. `.env` → `VITE_API_URL=http://localhost:3000/api`
2. Dans `src/services/api.js`, décommentez les lignes `request(...)` de
   `getProducts`, `createProduct`, `updateProduct`, `deleteProduct`.

Le reste du frontend n'a rien à changer.

## Protection des routes admin

Par défaut (`ADMIN_API_KEY` vide dans `.env`) les routes admin sont **ouvertes**,
pratique en développement. Si vous renseignez `ADMIN_API_KEY`, il faudra envoyer
l'en-tête `x-admin-key: <valeur>` sur les routes admin.

> Étape suivante recommandée : une vraie authentification (login + JWT) côté serveur,
> reliée au store d'auth du frontend.

## Structure

```
faithson-backend/
├── sql/
│   ├── schema.sql      # tables categories + products (+ trigger updated_at)
│   └── seed.sql        # catégories + 8 produits de départ
├── scripts/
│   └── init-db.js      # exécute schema.sql puis seed.sql
└── src/
    ├── server.js               # app Express
    ├── config.js               # variables d'environnement
    ├── db.js                   # pool PostgreSQL (pg)
    ├── routes/products.routes.js
    ├── controllers/product.controller.js
    ├── models/product.model.js # requêtes SQL + mapping
    └── middlewares/requireAdmin.js
```

## Pour aller plus loin

Prochaines tables logiques à ajouter quand tu voudras : `orders` (commandes),
`quotes` (devis), `custom_requests` (personnalisations), et une table `users`
pour l'authentification admin. La même organisation (model / controller / route)
se réutilise pour chacune.
