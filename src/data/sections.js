// Store sections. The ids are shared by every store; each store has its own order.
export const SECTIONS = [
  { id: 'fruit', nameRu: 'Овощи и фрукты' },
  { id: 'bakery', nameRu: 'Хлеб и выпечка' },
  { id: 'dairy', nameRu: 'Молочное и яйца' },
  { id: 'meat', nameRu: 'Мясо и колбасы' },
  { id: 'fish', nameRu: 'Рыба' },
  { id: 'deli', nameRu: 'Деликатесы на развес' },
  { id: 'dry', nameRu: 'Макароны, крупы, консервы' },
  { id: 'coffee', nameRu: 'Кофе и чай' },
  { id: 'spice', nameRu: 'Специи и соусы' },
  { id: 'sweets', nameRu: 'Сладости и снеки' },
  { id: 'drinks', nameRu: 'Напитки' },
  { id: 'alco', nameRu: 'Пиво и вино' },
  { id: 'frozen', nameRu: 'Заморозка' },
  { id: 'house', nameRu: 'Бытовая химия' },
  { id: 'beauty', nameRu: 'Косметика и аптека' },
  { id: 'pets', nameRu: 'Для животных' },
  { id: 'nonfood', nameRu: 'Непродовольственное' },
];

export const OTHER = { id: 'other', nameRu: 'Другое' };

const BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));

export function sectionName(id) {
  return (BY_ID[id] || OTHER).nameRu;
}

export function isSection(id) {
  return Boolean(BY_ID[id]);
}
