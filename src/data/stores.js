// The family's three stores. Routes are starting guesses; each person
// adjusts them on their own phone in the "Маршрут" screen.
// Lidl and Kaufland orders follow what is known about their Polish layouts
// (fruit and veg first). Auchan Piaseczno is the least certain.
export const SEED_ROUTES = {
  lidl: ['fruit', 'bakery', 'dairy', 'meat', 'fish', 'dry', 'coffee', 'spice', 'sweets', 'drinks', 'alco', 'frozen', 'house', 'beauty', 'pets', 'nonfood', 'deli'],
  kaufland: ['fruit', 'bakery', 'dairy', 'deli', 'meat', 'fish', 'dry', 'coffee', 'spice', 'sweets', 'drinks', 'alco', 'frozen', 'beauty', 'house', 'pets', 'nonfood'],
  auchan: ['nonfood', 'fruit', 'bakery', 'meat', 'fish', 'deli', 'dairy', 'dry', 'coffee', 'spice', 'sweets', 'drinks', 'alco', 'frozen', 'house', 'beauty', 'pets'],
};

export const CHAIN_NAMES = { lidl: 'Lidl', kaufland: 'Kaufland', auchan: 'Auchan' };

export const SEED_STORES = [
  { id: 'lidl', chain: 'lidl', name: 'Lidl Chyliczki', address: 'ul. Wschodnia 1, Chyliczki', hidden: ['deli'] },
  { id: 'kaufland', chain: 'kaufland', name: 'Kaufland Piaseczno', address: 'ul. Okulickiego 10, Piaseczno', hidden: [] },
  { id: 'auchan', chain: 'auchan', name: 'Auchan Piaseczno', address: 'ul. Puławska 46, Piaseczno', hidden: [] },
].map((s) => ({ ...s, route: SEED_ROUTES[s.chain].slice(), overrides: {} }));
