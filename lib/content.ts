// Every word on the site lives here. Ituze is a fictional development; swap the
// place, numbers and contact details here without touching components.

export const brand = {
  name: 'Ituze',
  full: 'Ituze Residence',
  place: 'Lake Kivu',
  town: 'Rubavu, Rwanda',
  meaning: 'Ituze means calm in Kinyarwanda',
  phone: '+250 788 000 000',
  phoneHref: 'tel:+250788000000',
  email: 'visit@ituze.rw',
  whatsapp: 'https://wa.me/250788000000',
  address: ['Ituze Show Residence', 'Rubona Road, Rubavu', 'Western Province, Rwanda'],
  available: 14,
};

export const nav = [
  { label: 'The residence', href: '#residence' },
  { label: 'A day here', href: '#day' },
  { label: 'Location', href: '#location' },
  { label: 'The grounds', href: '#grounds' },
  { label: 'Residences', href: '#residences' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Book a visit', href: '#visit' },
];

export const hero = {
  left: 'Where the hills',
  right: 'meet the water',
  mid: ['A collection of', 'thirty eight homes'],
  image: '/images/hero-sky.jpg',
  alt: 'White villa among palms under a wide, deep blue sky',
};

export const manifesto = {
  label: 'The residence',
  statement:
    'Ituze is a gated collection of thirty eight residences on the hills above Gisenyi, built around privacy, long light and the slow rhythm of Lake Kivu.',
  body: [
    'Every home faces west across the water. Terraces step down the slope so that no roof sits in another’s view.',
    'The gardens are planted with what already grows here: jacaranda, papyrus, avocado and frangipani, watered from the rain the roofs collect.',
  ],
  stats: [
    { value: 38, label: 'Residences' },
    { value: 4.2, label: 'Hectares of garden', decimals: 1 },
    { value: 6, label: 'Minutes to the beach' },
    { value: 2028, label: 'First keys', plain: true },
  ],
};

export const day = {
  label: 'A day at Ituze',
  intro: 'Mornings start with the boats and end with the pool still warm under the stars. Scroll through a day on the hill.',
  words: ['Life', 'slows', 'down', 'here'],
  moments: [
    {
      time: '06:40',
      title: 'First light',
      text: 'Fishing boats come home past Rubona, the crews singing the last of the night shift.',
      image: '/images/kivu-boats.jpg',
      alt: 'Traditional fishing boats with long poles on Lake Kivu',
      shape: 'tall',
    },
    {
      time: '09:15',
      title: 'Still water',
      text: 'The pool holds the colour of the sky until the lake wind picks up.',
      image: '/images/pool-palms.jpg',
      alt: 'Pool with mosaic tiles reflecting palm trees',
      shape: 'wide',
    },
    {
      time: '13:00',
      title: 'Long lunch',
      text: 'Sambaza from the morning catch under the pergola. Nobody in a hurry.',
      image: '/images/pergola-garden.jpg',
      alt: 'Timber pergola framing a green garden',
      shape: 'tall',
    },
    {
      time: '17:50',
      title: 'Golden hour',
      text: 'The sun drops behind the hills of Idjwi and the lake turns to copper.',
      image: '/images/kivu-sunset.jpg',
      alt: 'Sunset over an island on Lake Kivu',
      shape: 'tall',
    },
    {
      time: '21:00',
      title: 'Night swim',
      text: 'The water keeps the warmth of the day long after dark.',
      image: '/images/night-pool.jpg',
      alt: 'Lit pool between palms at night',
      shape: 'wide',
    },
  ],
};

export const location = {
  label: 'Location',
  title: ['The lake you wanted', 'this year'],
  script: 'yours' as const,
  body: 'Close enough to Kigali for a weekend, far enough to forget it by Sunday. The north shore of Lake Kivu, three hours west of the capital.',
  places: [
    { name: 'Volcanoes N.P.', time: '1 h 20', x: 0.06 },
    { name: 'Gisenyi beach', time: '6 min', x: 0.22 },
    { name: 'Rubavu airstrip', time: '12 min', x: 0.36 },
    { name: 'Ituze', time: '', x: 0.5, home: true },
    { name: 'Rubona peninsula', time: '9 min', x: 0.64 },
    { name: 'Kibuye', time: '2 h', x: 0.8 },
    { name: 'Kigali', time: '2 h 50', x: 0.94 },
  ],
};

export const panorama = {
  label: 'The view',
  lines: ['The lake fills every window', 'On clear nights Nyiragongo glows on the horizon'],
  image: '/images/kivu-clouds.jpg',
  alt: 'Lake Kivu under tall white clouds',
};

export const grounds = {
  label: 'The grounds',
  title: 'The grounds',
  intro: 'Six terraces, one orientation. Pick an hour to see how the sun crosses the hillside.',
  steps: [
    { title: 'The hillside', text: 'Thirty eight residences on six terraces, stepped so that no roof meets another’s view.' },
    { title: 'Pool terrace', text: 'A thirty metre lap pool cut into the fourth terrace, facing due west.' },
    { title: 'The pavilion', text: 'A residents’ pavilion with a spa, a gym, a small library and a kitchen garden.' },
    { title: 'The jetty', text: 'A private jetty for kayaks, paddle boards and the evening boat to Rubona.' },
  ],
  hours: [
    { label: '07:00', value: 0.12 },
    { label: '12:00', value: 0.5 },
    { label: '17:30', value: 0.9 },
  ],
};

export const space = {
  statement:
    'Residences range from 118 to 342 m², with single level and duplex layouts, deep terraces and rooftop solariums.',
  words: ['The space', 'to'],
  script: 'breathe' as const,
  image: '/images/living-window.jpg',
  alt: 'Calm living room with a wall of glass onto the garden',
};

export const plan = {
  label: 'Inside the Terrace House',
  title: ['Inside the', 'Terrace House'],
  phases: [
    { k: 'Plan', text: 'Three bedrooms, each opening onto its own terrace. 228 m² inside, 64 m² outside.' },
    { k: 'Volume', text: 'Ceilings of 3.2 metres and walls of lime render keep the rooms cool without machines.' },
    { k: 'Light', text: 'Morning light reaches the kitchen at the back. Evening light floods the terrace at the front.' },
  ],
};

export type Residence = {
  name: string;
  beds: number;
  interior: number;
  outside: string;
  price: string;
  left: number;
  image: string;
  alt: string;
  text: string;
};

export const residences: Residence[] = [
  {
    name: 'The Lake Villa',
    beds: 4,
    interior: 342,
    outside: '120 m² terrace, private pool',
    price: 'USD 640,000',
    left: 3,
    image: '/images/hero-villa.jpg',
    alt: 'White lake villa with an infinity pool',
    text: 'The lowest terrace, closest to the water. A long living room opens on three sides onto a pool that seems to spill into the lake.',
  },
  {
    name: 'The Penthouse',
    beds: 3,
    interior: 204,
    outside: '96 m² rooftop solarium',
    price: 'USD 520,000',
    left: 2,
    image: '/images/penthouse.jpg',
    alt: 'White modern house against a deep blue sky',
    text: 'Top of the hill, top of the building. A private stair climbs to a rooftop with an outdoor kitchen and the widest view at Ituze.',
  },
  {
    name: 'The Terrace House',
    beds: 3,
    interior: 228,
    outside: '64 m² terrace',
    price: 'USD 410,000',
    left: 5,
    image: '/images/terrace-house.jpg',
    alt: 'Stepped white terrace houses behind an umbrella pine',
    text: 'Our most requested plan. Three bedrooms, each with its own terrace, around a kitchen that runs the depth of the house.',
  },
  {
    name: 'The Garden Duplex',
    beds: 3,
    interior: 186,
    outside: '140 m² walled garden',
    price: 'USD 345,000',
    left: 4,
    image: '/images/garden-house.jpg',
    alt: 'Private garden with stepping stones and a lounge',
    text: 'Two floors around a walled garden with a frangipani at its centre. Made for children, dogs and long Sunday lunches.',
  },
  {
    name: 'The Hillside Apartment',
    beds: 2,
    interior: 118,
    outside: '32 m² loggia',
    price: 'USD 215,000',
    left: 0,
    image: '/images/living-bright.jpg',
    alt: 'Bright living room with a pale sofa',
    text: 'A deep loggia framed like a picture of the lake. The first release sold in nine days; join the list for the second.',
  },
];

export const architecture = {
  label: 'Architecture',
  word: 'Architecture',
  image: '/images/pergola-facade.jpg',
  alt: 'White facade with a timber pergola against a blue sky',
  body: 'Designed by Atelier Kivu, the residences borrow the courtyard and the deep veranda from the old lakeside houses of Gisenyi, and build them in materials found within a day’s drive.',
  quote: 'We wanted houses that feel like they have always been on the hill.',
  quoteBy: 'Atelier Kivu, architects',
  materials: [
    { name: 'Basalt', origin: 'Virunga foothills', text: 'Dark volcanic stone for walls that hold the cool of the night.', image: '/images/mat-basalt.jpg' },
    { name: 'Lime', origin: 'Trowelled by hand', text: 'A breathing render that softens with every rainy season.', image: '/images/mat-lime.jpg' },
    { name: 'Eucalyptus', origin: 'Grown in Rwanda', text: 'Pergolas and decks in timber from managed plantations.', image: '/images/mat-timber.jpg' },
    { name: 'Imigongo', origin: 'Nyakarambi artisans', text: 'Geometric panels in the tradition of eastern Rwanda.', image: null },
    { name: 'Terracotta', origin: 'Fired clay', text: 'Floors that stay cool underfoot and warm in colour.', image: '/images/mat-terracotta.jpg' },
    { name: 'Agaseke', origin: 'Weavers’ cooperatives', text: 'Sisal and sweetgrass screens, woven the way baskets are.', image: '/images/mat-weave.jpg' },
  ],
};

export const interiors = {
  label: 'Interiors',
  images: [
    { src: '/images/kitchen.jpg', alt: 'Kitchen with a stone island and garden view', caption: 'Kitchen, Terrace House' },
    { src: '/images/bath-stone.jpg', alt: 'Copper bath in a stone bathroom', caption: 'Bath, Lake Villa' },
    { src: '/images/stairs.jpg', alt: 'Lime washed stair', caption: 'Stair, Garden Duplex' },
    { src: '/images/bedroom-forest.jpg', alt: 'Bedroom opening onto trees', caption: 'Bedroom, Penthouse' },
    { src: '/images/shadows.jpg', alt: 'Leaf shadows on a white wall', caption: 'Four in the afternoon' },
  ],
};

export const visit = {
  label: 'Book a visit',
  title: ['See the light', 'for yourself'],
  body: 'The show residence is open Thursday to Sunday, 09:00 to 17:00. Boat transfers from Gisenyi pier on request.',
  cta: 'Book a private visit',
  ring: [
    '/images/hero-villa.jpg', '/images/kivu-boats.jpg', '/images/stairs.jpg', '/images/pool-palms.jpg',
    '/images/mat-weave.jpg', '/images/kivu-island.jpg', '/images/flowers.jpg', '/images/arches.jpg',
    '/images/bedroom-forest.jpg', '/images/volcano.jpg', '/images/courtyard.jpg', '/images/kivu-sunset.jpg',
    '/images/shadows.jpg', '/images/round-windows.jpg', '/images/kitchen.jpg', '/images/tea-hills.jpg',
    '/images/curve-facade.jpg', '/images/night-pool.jpg', '/images/light-blinds.jpg', '/images/kivu-hills.jpg',
  ],
};

export const footer = {
  columns: [
    { title: 'Visit', lines: brand.address },
    { title: 'Talk to us', lines: [brand.phone, brand.email, 'WhatsApp'] },
    { title: 'Hours', lines: ['Thursday to Sunday', '09:00 to 17:00', 'Or by appointment'] },
  ],
  legal: '© 2026 Ituze Development. A concept site; residences, prices and contacts are illustrative.',
  credit: 'Photography from Unsplash.',
};
