export interface DeveloperTelephone {
  label: string;
  /** Lien tel: complet (format international, sans espaces). */
  href: string;
}

export interface DeveloperInfo {
  nom: string;
  tagline: string;
  email: string;
  telephones: DeveloperTelephone[];
  /** N'affichée que si renseignée. */
  facebookUrl?: string;
  /** N'affichée que si renseignée. */
  tiktokUrl?: string;
}

/**
 * Coordonnées du développeur de la plateforme, affichées en signature dans
 * le footer. Volontairement séparées des coordonnées de l'agence (Footer
 * principal) pour ne jamais les mélanger.
 */
export const DEVELOPER: DeveloperInfo = {
  nom: "GOULKAM CONSULTING",
  tagline: "Développement de plateformes web",
  email: "goulkamz@gmail.com",
  telephones: [
    { label: "+226 75 30 54 51", href: "tel:+22675305451" },
    { label: "+226 51 54 59 45", href: "tel:+22651545945" },
  ],
  // TODO: remplacer par l'URL Facebook réelle de GOULKAM CONSULTING.
  facebookUrl: "https://facebook.com/goulkamconsulting",
  // TODO: remplacer par l'URL TikTok réelle de GOULKAM CONSULTING.
  tiktokUrl: "https://tiktok.com/@goulkamconsulting",
};
