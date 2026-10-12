# API Témoignages — contrat attendu par le frontend

Ce document décrit le contrat que `src/api/temoignages.ts` attend du futur
endpoint backend. Il n'existe **pas encore côté Spring** : le frontend
utilise aujourd'hui `MOCK_TEMOIGNAGES` (données fictives locales) en
attendant. Ce fichier sert de spécification pour l'implémentation backend.

Placé dans `frontend/docs/` (et non dans le dépôt backend) pour ne rien
modifier côté backend tant que ce n'est pas implémenté — à copier/adapter
dans le dépôt backend au moment du développement.

## Endpoint proposé

```
GET /api/temoignages
```

- **Rôle** : public (`permitAll`), pas d'authentification requise — les
  témoignages sont affichés sur la page d'accueil, visible par tout
  visiteur.
- **Pagination** : aucune pour l'instant. Vu le faible volume attendu
  (quelques dizaines de témoignages maximum, sélectionnés/validés par un
  agent), un tableau simple suffit — même logique que
  `GET /api/stats/public/annonces` qui renvoie un tableau brut sans
  pagination. Si le volume devient important, on pourra faire évoluer vers
  `PagedResponse<Temoignage>` (`?page=&size=`) sans changer la forme des
  éléments eux-mêmes.
- **Tri** : par date décroissante côté backend (les plus récents en
  premier), le frontend ne re-trie pas.

### Publication et modération

- **Publication automatique** : un témoignage soumis (par le client ou saisi
  par un agent, selon ce que vous déciderez pour la collecte) est visible
  immédiatement sur `GET /api/temoignages`, sans validation manuelle
  préalable.
- **Désactivation par un admin** : un admin peut retirer un témoignage de
  l'affichage public a posteriori. Recommandation, cohérente avec le reste
  du backend (soft delete via `is_deleted`/`flag_actif`, cf. `RG4` dans le
  cahier des charges) : ajouter un champ `flag_actif` (ou équivalent) sur
  l'entité `Temoignage`, filtré côté service pour `GET /api/temoignages`
  (`WHERE flag_actif = true`), avec un endpoint admin dédié pour basculer ce
  flag (ex. `PATCH /api/admin/temoignages/{id}/statut`, sur le même modèle
  que `PATCH /api/admin/users/{id}/status`). Ce champ n'a pas besoin d'être
  exposé dans la réponse publique — un témoignage désactivé n'apparaît
  simplement plus dans `data[]`, le frontend n'a rien à gérer de spécial.

### Réponse (succès), enveloppe standard du projet

```json
{
  "success": true,
  "message": "Liste des témoignages",
  "code": "TEMOIGNAGE_LIST",
  "timestamp": "2026-09-29T12:00:00.000Z",
  "data": [
    {
      "idTemoignage": 1,
      "nomAuteur": "Fatou Ouédraogo",
      "role": "PROPRIETAIRE",
      "texte": "Depuis que j'ai confié la gestion de ma cour à l'agence, je reçois mes loyers sans retard...",
      "note": 5,
      "photoUrl": null,
      "date": "2026-08-12"
    }
  ]
}
```

### Champ `data[]` — type `Temoignage`

| Champ | Type | Requis | Description |
|---|---|---|---|
| `idTemoignage` | number | oui | Identifiant unique |
| `nomAuteur` | string | oui | Nom affiché (pas de lien vers un compte `User` exposé) |
| `role` | `"PROPRIETAIRE" \| "LOCATAIRE" \| "AGENCE" \| "AUTRE"` | oui | Catégorie affichée sous le nom (voir libellés ci-dessous) |
| `texte` | string | oui | Contenu du témoignage |
| `note` | number (1 à 5) | non | Note sur 5 ; absente si le témoignage n'est pas noté (le frontend n'affiche alors pas d'étoiles) |
| `photoUrl` | string \| null | non | URL de la photo/avatar ; `null`/absent → avatar par initiales généré côté frontend |
| `date` | string (`yyyy-MM-dd`) | oui | Date du témoignage |

Libellés affichés pour `role` (mapping côté frontend, `utils/temoignage.ts`) :
`PROPRIETAIRE` → "Propriétaire", `LOCATAIRE` → "Locataire", `AGENCE` →
"Équipe de l'agence", `AUTRE` → "Client".

### Réponse (erreur)

Même enveloppe d'erreur que le reste de l'API (`success: false`, `code`,
`message`, `timestamp`). Le frontend traite toute erreur (4xx/5xx, timeout,
réseau) de la même façon : la section "Ils nous font confiance" disparaît
silencieusement de la page d'accueil (log en `console.warn` uniquement en
dev), sans jamais casser le reste de la page.

## Ce qui change côté frontend quand l'endpoint sera prêt

Un seul fichier à modifier : `src/api/temoignages.ts`. Remplacer le corps
de `getTemoignages()` par un appel HTTP suivant le même modèle que
`src/api/public.ts` :

```ts
import { http } from "./http";
import type { ApiSuccessResponse, Temoignage } from "./types";

export async function getTemoignages(): Promise<Temoignage[]> {
  const { data } = await http.get<ApiSuccessResponse<Temoignage[]>>("/temoignages");
  return data.data ?? [];
}
```

Aucun changement nécessaire dans `hooks/queries/useTemoignages.ts`, le
composant `modules/public/components/TestimonialsSection.tsx`, ni le type
`Temoignage` (`src/api/types.ts`) — ils sont déjà écrits contre ce contrat.
