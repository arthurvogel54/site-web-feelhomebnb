/**
 * biens-config.js — Configuration des biens Feel'HomeBNB
 * Données des 7 biens + logique de tarification saisonnière
 */

window.BIENS_CONFIG = {
  'studio-proche-centre': {
    id: 'studio-proche-centre',
    name: 'Studio Proche Centre',
    tagline: 'Un cocon élégant à deux pas du cœur de Nancy',
    description: 'Niché à quelques minutes à pied de la Place Stanislas, ce studio allie modernité et charme lorrain dans un écrin parfaitement équipé. Idéal pour un séjour en duo, il offre tout le confort d\'une résidence haut de gamme avec la liberté d\'une situation centrale incomparable. Chaque détail a été pensé pour rendre votre séjour aussi mémorable que reposant.',
    capacity: 2,
    surface: 25,
    beds: 1,
    bathrooms: 1,
    cleaning: 40,
    prices: { low: 75, mid: 95, high: 130 },
    amenities: [
      'Wi-Fi haut débit',
      'Climatisation',
      'Cuisine équipée',
      'Linge de maison premium',
      'Smart TV',
      'Parking à proximité',
      'Accueil personnalisé',
    ],
  },
  'havre-de-paix': {
    id: 'havre-de-paix',
    name: 'Havre de Paix',
    tagline: 'Sérénité et raffinement au cœur de la vieille ville',
    description: 'Cet appartement lumineux vous invite à la déconnexion dans un cadre soigneusement décoré, entre matériaux nobles et ambiance apaisante. Situé dans la vieille ville de Nancy, il bénéficie d\'un emplacement privilégié à portée de toutes les curiosités patrimoniales. Capacité parfaite pour trois personnes, il garantit confort et intimité tout au long du séjour.',
    capacity: 3,
    surface: 45,
    beds: 2,
    bathrooms: 1,
    cleaning: 50,
    prices: { low: 85, mid: 110, high: 150 },
    amenities: [
      'Wi-Fi haut débit',
      'Climatisation réversible',
      'Cuisine entièrement équipée',
      'Linge de maison premium',
      'Smart TV',
      'Machine à laver',
      'Terrasse privative',
      'Accueil personnalisé',
    ],
  },
  'nid-des-vosges': {
    id: 'nid-des-vosges',
    name: 'Nid des Vosges',
    tagline: 'L\'esprit montagne au cœur de la Lorraine',
    description: 'Ce grand appartement au caractère authentique évoque la douceur des chalets vosgiens transposée dans l\'élégance urbaine de Nancy. Avec ses deux chambres généreuses et sa surface de 60 m², il accueille idéalement les familles ou groupes d\'amis en quête d\'espace et d\'atmosphère. Une adresse rare qui mêle esprit de villégiature et situation citadine privilégiée.',
    capacity: 4,
    surface: 60,
    beds: 2,
    bathrooms: 1,
    cleaning: 55,
    prices: { low: 90, mid: 120, high: 160 },
    amenities: [
      'Wi-Fi haut débit',
      'Climatisation',
      'Grande cuisine ouverte',
      'Linge de maison premium',
      'Smart TV',
      'Machine à laver',
      'Parking inclus',
      'Accueil personnalisé',
    ],
  },
  'le-petit-stanislas': {
    id: 'le-petit-stanislas',
    name: 'Le Petit Stanislas',
    tagline: 'L\'élégance ducale à votre portée',
    description: 'À quelques pas de la mythique Place Stanislas, ce studio haut de gamme offre une immersion unique dans l\'histoire et l\'architecture nancéienne. Décoré avec un soin exceptionnel, il allie mobilier de caractère et équipements contemporains pour une expérience de séjour incomparable. Une adresse de prestige pour voyageurs exigeants en quête d\'authenticité lorraine.',
    capacity: 2,
    surface: 35,
    beds: 1,
    bathrooms: 1,
    cleaning: 50,
    prices: { low: 110, mid: 140, high: 190 },
    amenities: [
      'Wi-Fi haut débit',
      'Climatisation',
      'Kitchenette équipée',
      'Linge de maison haut de gamme',
      'Smart TV 4K',
      'Cafetière Nespresso',
      'Accueil personnalisé 24/7',
    ],
  },
  'le-petit-cocon': {
    id: 'le-petit-cocon',
    name: 'Le Petit Cocon',
    tagline: 'Douceur et intimité dans un nid douillet',
    description: 'Cet appartement chaleureux a été pensé pour envelopper ses hôtes dans une atmosphère cosy et bienveillante, loin de l\'agitation urbaine tout en restant à cœur de Nancy. Ses 50 m² bien agencés en font un choix parfait pour un duo ou un trio souhaitant se ressourcer dans un intérieur soigné. La décoration mêle tons doux et matières naturelles pour un confort absolu.',
    capacity: 3,
    surface: 50,
    beds: 2,
    bathrooms: 1,
    cleaning: 45,
    prices: { low: 80, mid: 105, high: 140 },
    amenities: [
      'Wi-Fi haut débit',
      'Chauffage central',
      'Cuisine équipée',
      'Linge de maison premium',
      'Smart TV',
      'Machine à laver',
      'Accueil personnalisé',
    ],
  },
  'le-vieux-nancéien': {
    id: 'le-vieux-nancéien',
    name: 'Le Vieux Nancéien',
    tagline: 'L\'âme historique de Nancy sublimée',
    description: 'Ce grand appartement de caractère plonge ses hôtes dans l\'atmosphère authentique de Nancy avec ses moulures d\'époque, ses parquets anciens et sa vue imprenable sur les toits nancéiens. Avec ses deux salles de bain et ses 65 m² généreux, il convient parfaitement aux familles ou aux groupes recherchant le grand confort historique. Un bien d\'exception qui conjugue patrimoine et équipements modernes.',
    capacity: 4,
    surface: 65,
    beds: 2,
    bathrooms: 2,
    cleaning: 65,
    prices: { low: 100, mid: 130, high: 175 },
    amenities: [
      'Wi-Fi haut débit',
      'Climatisation réversible',
      'Grande cuisine équipée',
      'Linge de maison luxe',
      'Smart TV',
      'Machine à laver / sèche-linge',
      'Cave à vin',
      'Accueil personnalisé 24/7',
    ],
  },
  'chalet-premium': {
    id: 'chalet-premium',
    name: 'Chalet Premium',
    tagline: 'L\'expérience ultime : jacuzzi privatif et grand espace',
    description: 'Le summum du luxe Feel\'HomeBNB : un chalet de 120 m² entièrement privatif, doté d\'un jacuzzi exclusif, de trois chambres somptueuses et de deux salles de bain. Conçu pour les groupes en quête d\'une expérience mémorable, il offre un cadre exceptionnel pour les occasions spéciales, week-ends entre amis ou séjours en famille haut de gamme. Chaque détail a été élaboré pour délivrer une expérience 5 étoiles à Nancy.',
    capacity: 6,
    surface: 120,
    beds: 3,
    bathrooms: 2,
    jacuzzi: true,
    cleaning: 90,
    prices: { low: 180, mid: 230, high: 300 },
    amenities: [
      'Jacuzzi privatif extérieur',
      'Wi-Fi haut débit',
      'Climatisation réversible',
      'Grande cuisine ouverte équipée',
      'Linge de maison luxe',
      'Smart TV 65" avec Netflix',
      'Machine à laver / sèche-linge',
      'Parking privé inclus',
      'Accueil personnalisé 24/7',
    ],
  },
};

/**
 * Définition des saisons (mois 0-indexés)
 * low  : jan(0), fév(1), mar(2), nov(10)
 * high : juin(5), juil(6), août(7), déc(11)
 * mid  : le reste
 */
window.SEASONS = {
  low:  [0, 1, 2, 10],
  high: [5, 6, 7, 11],
  // mid = tout le reste
};

/**
 * Retourne le prix par nuit pour un bien à une date donnée.
 * @param {string} bienId
 * @param {Date} date
 * @returns {number} prix par nuit
 */
window.getPriceForDate = function(bienId, date) {
  const bien = window.BIENS_CONFIG[bienId];
  if (!bien) return 0;
  const month = date.getMonth(); // 0-indexé
  if (window.SEASONS.high.includes(month)) return bien.prices.high;
  if (window.SEASONS.low.includes(month))  return bien.prices.low;
  return bien.prices.mid;
};

/**
 * Calcule le total d'une réservation.
 * @param {string} bienId
 * @param {Date|string} checkIn
 * @param {Date|string} checkOut
 * @returns {{nights: number, subtotal: number, cleaning: number, total: number, pricePerNight: number}}
 */
window.calculateTotal = function(bienId, checkIn, checkOut) {
  const bien = window.BIENS_CONFIG[bienId];
  if (!bien) return null;

  const start = checkIn  instanceof Date ? checkIn  : new Date(checkIn);
  const end   = checkOut instanceof Date ? checkOut : new Date(checkOut);
  const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));
  if (nights < 1) return null;

  // Calcul nuit par nuit pour tenir compte des saisons qui changent en milieu de séjour
  let subtotal = 0;
  for (let i = 0; i < nights; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    subtotal += window.getPriceForDate(bienId, d);
  }

  const cleaning = bien.cleaning;
  const total    = subtotal + cleaning;

  // Prix par nuit moyen (pour affichage)
  const pricePerNight = Math.round(subtotal / nights);

  return { nights, subtotal, cleaning, total, pricePerNight };
};
