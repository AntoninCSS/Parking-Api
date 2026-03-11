// middlewares/security.js
const helmet = require("helmet");

const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"], // Bloque tout par défaut
      scriptSrc: ["'none'"], // Aucun script autorisé
      styleSrc: ["'none'"],
      imgSrc: ["'none'"],
      connectSrc: ["'self'"], // Fetch/XHR uniquement vers soi-même
      fontSrc: ["'none'"],
      objectSrc: ["'none'"], // Bloque <object>, <embed>, <applet>
      frameAncestors: ["'none'"], // Personne ne peut embedder l'API dans un iframe
      formAction: ["'none'"], // Bloque les soumissions de formulaire
      upgradeInsecureRequests: [], // Force HTTPS sur les ressources HTTP
    },
  },

  // Empêche le chargement de ressources cross-origin non explicitement autorisées
  crossOriginEmbedderPolicy: { policy: "require-corp" },

  // Isole le contexte de navigation (protection Spectre/side-channel attacks)
  crossOriginOpenerPolicy: { policy: "same-origin" },

  // Empêche d'autres origines de lire les réponses de ton API
  crossOriginResourcePolicy: { policy: "cross-origin" },

  // Désactive le prefetch DNS du navigateur (évite des fuites d'infos)
  dnsPrefetchControl: { allow: false },

  // Empêche l'API d'être chargée dans un <iframe> → protection clickjacking
  frameguard: { action: "deny" },

  // Supprime le header "X-Powered-By: Express" qui donne des infos à un attaquant
  hidePoweredBy: true,

  // Force les navigateurs à utiliser HTTPS pendant 1 an
  hsts: {
    maxAge: 31536000, // 1 an en secondes
    includeSubDomains: true, // Appliqué aussi aux sous-domaines
    preload: true, // Peut être soumis à la preload list HSTS
  },

  permissionsPolicy: {
    features: {
      // ─── Capteurs & Hardware ──────────────────────────────────────────
      camera: [], // Bloque accès caméra
      microphone: [], // Bloque accès micro
      geolocation: [], // Bloque accès GPS
      accelerometer: [], // Bloque capteur d'accélération
      gyroscope: [], // Bloque gyroscope
      magnetometer: [], // Bloque boussole
      ambientLightSensor: [], // Bloque capteur de luminosité

      // ─── Affichage ────────────────────────────────────────────────────
      fullscreen: [], // Bloque le mode plein écran
      pictureInPicture: [], // Bloque le picture-in-picture
      displayCapture: [], // Bloque la capture d'écran

      // ─── APIs sensibles ───────────────────────────────────────────────
      payment: [], // Bloque l'API Web Payments
      usb: [], // Bloque l'accès USB (WebUSB)
      bluetooth: [], // Bloque le Bluetooth
      serial: [], // Bloque l'accès ports série
      midi: [], // Bloque l'accès MIDI

      // ─── Tracking & Fingerprinting ────────────────────────────────────
      interestCohort: [], // Bloque FLoC (tracking Google, déprécié)
      idleDetection: [], // Bloque la détection d'inactivité utilisateur
      browsingTopics: [], // Bloque Topics API (successeur FLoC)

      // ─── Misc ─────────────────────────────────────────────────────────
      autoplay: [], // Bloque l'autoplay vidéo/audio
      encryptedMedia: [], // Bloque DRM (Netflix-style)
      syncXhr: [], // Bloque les XHR synchrones (bloquants)
      clipboardRead: [], // Bloque la lecture du presse-papier
      clipboardWrite: [], // Bloque l'écriture dans le presse-papier
    },
  },

  // Empêche IE d'exécuter les téléchargements dans le contexte du site
  ieNoOpen: true,

  // Empêche le navigateur de deviner le Content-Type (MIME sniffing)
  noSniff: true,

  // Isole l'origine dans son propre agent cluster (isolation mémoire)
  originAgentCluster: true,

  // Bloque Adobe Flash/Acrobat d'accéder aux données cross-domain
  permittedCrossDomainPolicies: { permittedPolicies: "none" },

  // Contrôle les infos envoyées dans le header Referer
  referrerPolicy: { policy: "no-referrer" },

  // Header legacy, désactivé volontairement car il peut introduire des vulnérabilités
  xssFilter: false,
});

module.exports = { helmetConfig };
