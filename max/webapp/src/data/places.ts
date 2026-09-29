import type { Place } from '../types/places';

// Демо-данные для Москвы: адреса и координаты приблизительные.
// Когда появится бэкенд, этот файл заменяется ответом GET /api/places.
export const PLACES: Place[] = [
  { id: 'gorky', name: 'Парк Горького', category: 'walk', metro: 'Октябрьская', address: 'ул. Крымский Вал, 9', lat: 55.7298, lon: 37.6017, indoor: false, price: 1, maxGroup: 20, blurb: 'Набережная, прокат великов, площадки и летние веранды.' },
  { id: 'muzeon', name: 'Парк «Музеон»', category: 'walk', metro: 'Парк культуры', address: 'ул. Крымский Вал, 2', lat: 55.7345, lon: 37.6035, indoor: false, price: 1, maxGroup: 20, blurb: 'Парк скульптур рядом с набережной, удобно гулять большой компанией.' },
  { id: 'zaryadye', name: 'Парк «Зарядье»', category: 'walk', metro: 'Китай-город', address: 'ул. Варварка, 6', lat: 55.7514, lon: 37.6288, indoor: false, price: 1, maxGroup: 20, blurb: 'Парящий мост, виды на Кремль и Москву-реку.' },
  { id: 'vdnh', name: 'ВДНХ', category: 'walk', metro: 'ВДНХ', address: 'проспект Мира, 119', lat: 55.8264, lon: 37.6377, indoor: false, price: 1, maxGroup: 30, blurb: 'Фонтаны, павильоны и аллеи, места хватит всем.' },
  { id: 'patriarshie', name: 'Патриаршие пруды', category: 'walk', metro: 'Маяковская', address: 'Большой Патриарший пер.', lat: 55.7643, lon: 37.5931, indoor: false, price: 1, maxGroup: 10, blurb: 'Тихий пруд и кофе с собой, кафе вокруг.' },
  { id: 'hermitage', name: 'Сад «Эрмитаж»', category: 'walk', metro: 'Чеховская', address: 'ул. Каретный Ряд, 3', lat: 55.7717, lon: 37.6098, indoor: false, price: 1, maxGroup: 15, blurb: 'Зелёный сад в центре с летней сценой и верандами.' },
  { id: 'vorobyovy', name: 'Воробьёвы горы', category: 'walk', metro: 'Воробьёвы горы', address: 'Смотровая площадка', lat: 55.7100, lon: 37.5530, indoor: false, price: 1, maxGroup: 20, blurb: 'Смотровая площадка с панорамой города.' },
  { id: 'kolomenskoe', name: 'Коломенское', category: 'walk', metro: 'Коломенская', address: 'проспект Андропова, 39', lat: 55.6674, lon: 37.6689, indoor: false, price: 1, maxGroup: 25, blurb: 'Большой парк на высоком берегу, старинные постройки.' },
  { id: 'tsaritsyno', name: 'Царицыно', category: 'walk', metro: 'Царицыно', address: 'ул. Дольская, 1', lat: 55.6155, lon: 37.6864, indoor: false, price: 1, maxGroup: 25, blurb: 'Дворцовый ансамбль, пруды и длинные аллеи.' },
  { id: 'arbat', name: 'Старый Арбат', category: 'walk', metro: 'Арбатская', address: 'ул. Арбат', lat: 55.7495, lon: 37.5910, indoor: false, price: 1, maxGroup: 10, blurb: 'Пешеходная улица с кофейнями и уличными музыкантами.' },
  { id: 'chistye', name: 'Чистые пруды', category: 'walk', metro: 'Чистые пруды', address: 'Чистопрудный бульвар', lat: 55.7645, lon: 37.6446, indoor: false, price: 1, maxGroup: 10, blurb: 'Бульвар вокруг пруда, много кафе и баров рядом.' },
  { id: 'garage', name: 'Музей «Гараж»', category: 'culture', metro: 'Парк культуры', address: 'ул. Крымский Вал, 9, стр. 32', lat: 55.7285, lon: 37.6014, indoor: true, price: 2, maxGroup: 8, blurb: 'Современное искусство в Парке Горького.' },
  { id: 'tretyakov', name: 'Третьяковская галерея', category: 'culture', metro: 'Третьяковская', address: 'Лаврушинский пер., 10', lat: 55.7415, lon: 37.6208, indoor: true, price: 2, maxGroup: 8, blurb: 'Русская живопись от икон до XX века.' },
  { id: 'mediaart', name: 'Мультимедиа Арт Музей', category: 'culture', metro: 'Кропоткинская', address: 'ул. Остоженка, 16', lat: 55.7421, lon: 37.6025, indoor: true, price: 2, maxGroup: 8, blurb: 'Выставки фотографии и медиаискусства.' },
  { id: 'planetarium', name: 'Московский планетарий', category: 'culture', metro: 'Баррикадная', address: 'Садовая-Кудринская ул., 5', lat: 55.7609, lon: 37.5831, indoor: true, price: 2, maxGroup: 12, blurb: 'Купольные шоу и музей звёздного неба.' },
  { id: 'vinzavod', name: 'Винзавод', category: 'culture', metro: 'Курская', address: '4-й Сыромятнический пер., 1/8', lat: 55.7580, lon: 37.6700, indoor: true, price: 1, maxGroup: 10, blurb: 'Галереи и мастерские на территории бывшего завода.' },
  { id: 'depo', name: 'Гастромаркет «Депо»', category: 'food', metro: 'Белорусская', address: 'ул. Лесная, 20', lat: 55.7800, lon: 37.5940, indoor: true, price: 2, maxGroup: 12, blurb: 'Десятки кухонь под одной крышей, каждый берёт своё.' },
  { id: 'danilovsky', name: 'Даниловский рынок', category: 'food', metro: 'Тульская', address: 'ул. Мытная, 74', lat: 55.7105, lon: 37.6275, indoor: true, price: 2, maxGroup: 12, blurb: 'Фермерский рынок с едой на месте и общими столами.' },
  { id: 'pushkin', name: 'Кафе «Пушкинъ»', category: 'food', metro: 'Пушкинская', address: 'Тверской бул., 26А', lat: 55.7648, lon: 37.6041, indoor: true, price: 3, maxGroup: 10, blurb: 'Классический ресторан для особого повода.' },
  { id: 'strelka', name: 'Бар Strelka', category: 'bar', metro: 'Кропоткинская', address: 'Берсеневская наб., 14', lat: 55.7430, lon: 37.6100, indoor: true, price: 2, maxGroup: 10, blurb: 'Бар с видом на Москву-реку и Кремль.' },
  { id: 'redoct', name: 'Красный Октябрь', category: 'bar', metro: 'Кропоткинская', address: 'Берсеневская наб., 6', lat: 55.7412, lon: 37.6078, indoor: true, price: 2, maxGroup: 15, blurb: 'Бары и рестораны на территории бывшей фабрики.' },
  { id: 'moskvarium', name: 'Москвариум', category: 'fun', metro: 'ВДНХ', address: 'проспект Мира, 119, стр. 37', lat: 55.8262, lon: 37.6355, indoor: true, price: 2, maxGroup: 20, blurb: 'Океанариум: рыбы, акулы и шоу с морскими животными.' },
  { id: 'zoo', name: 'Московский зоопарк', category: 'fun', metro: 'Баррикадная', address: 'ул. Большая Грузинская, 1', lat: 55.7614, lon: 37.5779, indoor: false, price: 2, maxGroup: 20, blurb: 'Старейший зоопарк города, лучше идти в сухую погоду.' },
];
