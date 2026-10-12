/**
 * `POST /api/auth/signup` ignore le `idRole` envoyé et force toujours
 * ROLE_CLIENT côté serveur (`UserService.createUser`, confirmé en lecture
 * du code backend) — le champ reste `@NotNull` côté validation Bean, donc
 * on doit envoyer une valeur, mais elle n'a aucun effet sur le rôle réel.
 * Les comptes bailleur sont créés par un agent/admin, jamais en self-signup.
 *
 * Id correspondant à ROLE_CLIENT dans la table `role` (SystemImmo.sql,
 * séquence démarrant à 1) : ROLE_CLIENT=1.
 */
export const SIGNUP_DEFAULT_ROLE_ID = 1;
