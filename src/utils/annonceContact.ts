/** Préremplissage du formulaire de contact depuis une annonce (pas d'entité maison/bien à réserver). */
export function buildAnnonceContactState(titre: string) {
  return {
    sujet: `Annonce : ${titre}`,
    message: `Bonjour, je suis intéressé(e) par l'annonce « ${titre} ». Pouvez-vous me recontacter ?`,
  };
}
