/**
 * Fills an empty database with realistic demo content: three hero banners and
 * a dozen catalogue listings, each with generated botanical artwork written
 * into backend/uploads.
 *
 *   npm run seed           add anything that is missing
 *   npm run seed -- --reset   wipe banners + gallery first
 *
 * Safe to re-run: without --reset it only tops up what is absent.
 */
const fs = require('fs/promises');
const path = require('path');

const config = require('../config/env');
const { connectDatabase, disconnectDatabase } = require('../config/db');
const Banner = require('../models/Banner');
const Gallery = require('../models/Gallery');
const { removeUpload } = require('../utils/files');
const { productArtwork, bannerArtwork } = require('./artwork');

const reset = process.argv.includes('--reset');

const BANNERS = [
  {
    position: 1,
    title: 'Bring nature into your space',
    subtitle:
      'Plants, flowering saplings and garden essentials, grown and hardened off at our nursery on the Cuddalore Main Road.',
    alt: 'Rows of nursery plants under the shade house',
  },
  {
    position: 2,
    title: 'Grown here, sold here',
    subtitle:
      'Every sapling spends weeks outdoors before it leaves the yard, so it is already used to the sun it will live under.',
    alt: 'Young potted saplings in the morning sun',
  },
  {
    position: 3,
    title: 'Coconuts, by the sack',
    subtitle:
      'Our coconut mandi supplies households, traders and farms across Cuddalore district. Walk in or call ahead for bulk.',
    alt: 'Coconuts stacked at the mandi',
  },
];

const PRODUCTS = [
  {
    art: 'rose',
    name: 'Desert Rose Bush',
    price: 649,
    offerPercent: 15,
    category: 'Flowering Plants',
    featured: true,
    description:
      'A compact hybrid tea rose that flowers from late winter through the monsoon. Ours are grafted onto hardy rootstock and grown for two full seasons before sale, so the plant you receive is already woody at the base and settles quickly. Give it six hours of direct sun, a weekly deep watering rather than daily sprinkling, and a light prune after each flush. Comes in a 20cm terracotta pot with a season of slow-release feed already mixed into the soil.',
  },
  {
    art: 'monstera',
    name: 'Monstera Deliciosa',
    price: 1299,
    category: 'Indoor Plants',
    featured: true,
    description:
      'The split-leaf classic, and still the most forgiving statement plant we sell. This one stands roughly 70cm tall with four to six mature fenestrated leaves and a moss pole already installed. It wants bright indirect light — a metre or two back from a window is ideal — and water only once the top 5cm of soil has dried out. Wipe the leaves monthly and it will push a new leaf roughly every six weeks through summer.',
  },
  {
    art: 'fern',
    name: 'Boston Fern',
    price: 549,
    offerPercent: 20,
    category: 'Indoor Plants',
    featured: true,
    description:
      'A full, arching fern that reads as pure texture in a bathroom or a shaded balcony corner. Ferns are the plant most often returned to us as "impossible", and the reason is almost always dry air rather than dry soil. Keep the potting mix consistently damp, group it with other plants to raise local humidity, and stay away from air-conditioning vents. Supplied in a 18cm ceramic pot with a drainage layer already in place.',
  },
  {
    art: 'succulent',
    name: 'Echeveria Rosette',
    price: 299,
    category: 'Indoor Plants',
    featured: true,
    description:
      'A tight blue-green rosette that holds its shape for years with almost no attention. Grown outdoors under shade net so the leaves come to you compact rather than stretched and leggy. Water deeply but rarely — every ten to fourteen days in summer and roughly monthly in winter — and always let the pot drain completely. Perfect for a sunny windowsill, a desk, or as a low-commitment gift.',
  },
  {
    art: 'lavender',
    name: 'English Lavender',
    price: 749,
    category: 'Flowering Plants',
    featured: true,
    description:
      'Silver-grey foliage, deep violet flower spikes, and the scent that makes a balcony feel like a hillside. Lavender needs sharp drainage far more than it needs rich soil, so ours are potted in a gritty free-draining mix you should keep rather than replace. Full sun, a hard prune after flowering, and it will hold its shape for five or six years. Bees find it within days of it going outside.',
  },
  {
    art: 'tulip',
    name: 'Tulip Bulb Collection',
    price: 899,
    category: 'Flowering Plants',
    featured: false,
    description:
      'Twelve pre-chilled bulbs in a warm mix of orange, coral and butter yellow, packed with planting instructions for Indian winters. Plant them in November at three times their own depth, keep the soil barely moist until shoots appear, then water regularly once growth starts. Expect flowers through February and March. Grows beautifully in pots, which also lets you move the display wherever it is most wanted.',
  },
  {
    art: 'snakePlant',
    name: 'Snake Plant Laurentii',
    price: 799,
    category: 'Indoor Plants',
    featured: false,
    description:
      'Upright architectural leaves with cream-yellow margins, and the single most durable houseplant in our catalogue. It tolerates low light, irregular watering and forgetful owners, though it grows fastest in bright indirect light. The only real way to lose one is overwatering — wait until the soil is completely dry, then water thoroughly. Height is roughly 60cm on arrival, in a matte ceramic pot.',
  },
  {
    art: 'bonsai',
    name: 'Ficus Bonsai, 6 Years',
    price: 2499,
    category: 'Indoor Plants',
    featured: true,
    description:
      'Six years of shaping in a shallow glazed tray, trained in the informal upright style with a thickened trunk and three defined canopy pads. Bonsai is a practice as much as a plant, so this one ships with a care card covering watering, pinching and the annual root prune. It wants bright light and daily attention to soil moisture — the shallow tray dries out far faster than an ordinary pot. A genuine heirloom piece.',
  },
  {
    art: 'hibiscus',
    name: 'Hibiscus Rosa-Sinensis',
    price: 549,
    category: 'Outdoor Plants',
    featured: false,
    description:
      'Large single blooms in flame orange, opening fresh each morning through most of the year in warm climates. Hibiscus flowers on new growth, so regular light pruning genuinely increases the number of blooms rather than reducing it. Give it full sun, feed fortnightly through the growing season, and keep the soil evenly moist. Grows to a comfortable 1.2m in a large pot or considerably taller in open ground.',
  },
  {
    art: 'coconut',
    name: 'Coconut Sapling (Tall Variety)',
    price: 220,
    offerPercent: 10,
    category: 'Fruit & Coconut Saplings',
    featured: true,
    description:
      'A healthy tall-variety coconut sapling raised from selected seed nuts, supplied in a nursery poly bag with the root ball intact. Plant it in a pit at least 1m across, backfilled with topsoil, coir pith and well-rotted manure, and water every other day until it establishes. Give it full sun and space — nine metres from the next palm. Bulk rates for farm and estate planting; call the mandi for a quote.',
  },
  {
    art: 'coconut',
    name: 'Mango Sapling, Grafted',
    price: 180,
    category: 'Fruit & Coconut Saplings',
    featured: false,
    description:
      'Grafted mango saplings that fruit years earlier than a seedling and stay true to the parent variety. Grown on hardy rootstock and kept in the open so they are ready for a compound or an open field. Plant before the monsoon, stake for the first year, and keep the graft union above the soil line. Ask which varieties are in stock — it changes through the season.',
  },
  {
    art: 'planter',
    name: 'Terracotta Planter Set of 3',
    price: 1199,
    offerPercent: 25,
    category: 'Planters',
    featured: false,
    description:
      'Three hand-thrown terracotta pots in graduated sizes — 12cm, 18cm and 24cm — each with a properly drilled drainage hole and a matching saucer. Unglazed terracotta breathes, which lets excess water evaporate through the walls and makes it far harder to drown a plant. The clay darkens and develops a patina over the first year. Sizes and stock change, so ask what is in the yard.',
  },
  {
    art: 'tools',
    name: 'Essential Garden Tool Kit',
    price: 1649,
    category: 'Garden Supplies',
    featured: true,
    description:
      'The four tools that cover ninety per cent of real garden work: a stainless trowel, a hand fork, bypass secateurs and a weeding knife, in a waxed canvas roll. Stainless heads mean no rust if you leave them out overnight, and the ash handles are long enough to give real leverage. We assembled this kit after watching which tools our own nursery staff actually reach for. Sharpening instructions included.',
  },
  {
    art: 'seeds',
    name: 'Kitchen Herb Seed Box',
    price: 449,
    category: 'Seeds',
    featured: false,
    description:
      'Six varieties chosen because they genuinely grow on an Indian windowsill: basil, coriander, mint, thyme, parsley and chives. Each sachet holds enough seed for two full sowings, and the box includes coir pellets and labels so you can start immediately. Sow shallowly, keep warm and damp, and expect the first cuttings within five weeks. Coriander and basil will need re-sowing every few months, which is why we included spares.',
  },
];

async function writeArtwork(filename, svg) {
  await fs.mkdir(config.uploadsDir, { recursive: true });
  await fs.writeFile(path.join(config.uploadsDir, filename), svg, 'utf8');
  return `/uploads/${filename}`;
}

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function run() {
  try {
    await connectDatabase();
    console.log('[seed] connected to MongoDB');

    if (reset) {
      // Collect the image paths first — deleting the records alone would leave
      // every admin-uploaded file behind as an orphan in uploads/.
      const [banners, products] = await Promise.all([
        Banner.find().select('imageUrl').lean(),
        Gallery.find().select('imageUrl').lean(),
      ]);
      const images = [...banners, ...products].map((doc) => doc.imageUrl);

      await Promise.all([Banner.deleteMany({}), Gallery.deleteMany({})]);
      const removed = (await Promise.all(images.map(removeUpload))).filter(Boolean).length;

      console.log(
        `[seed] reset: removed ${banners.length} banners, ${products.length} products, ${removed} image files`
      );
    }

    let bannersAdded = 0;
    for (const banner of BANNERS) {
      const exists = await Banner.exists({ position: banner.position });
      if (exists) continue;

      const imageUrl = await writeArtwork(
        `seed-banner-${banner.position}.svg`,
        bannerArtwork(banner.position, `b${banner.position}`)
      );
      await Banner.create({ ...banner, imageUrl });
      bannersAdded += 1;
    }
    console.log(`[seed] banners: ${bannersAdded} added, ${await Banner.countDocuments()} total`);

    let productsAdded = 0;
    for (const product of PRODUCTS) {
      const exists = await Gallery.exists({ name: product.name });
      if (exists) continue;

      const slug = slugify(product.name);
      const imageUrl = await writeArtwork(`seed-${slug}.svg`, productArtwork(product.art, slug.replace(/-/g, '')));
      const { art, ...fields } = product;
      await Gallery.create({ ...fields, imageUrl });
      productsAdded += 1;
    }
    console.log(`[seed] gallery: ${productsAdded} added, ${await Gallery.countDocuments()} total`);
    console.log('[seed] done');
  } catch (error) {
    console.error('[seed] failed:', error.message);
    process.exitCode = 1;
  } finally {
    await disconnectDatabase().catch(() => {});
  }
}

run();
