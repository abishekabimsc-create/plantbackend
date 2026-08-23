/**
 * Confirms MONGODB_URI actually works, and explains it precisely when it does
 * not. Atlas failures are almost always one of four things, and the driver's
 * own error text does not make it obvious which.
 *
 *   npm run check-db
 *
 * Prints no credentials: the connection string is masked before display.
 */
const mongoose = require('mongoose');
const config = require('../config/env');

/** Hides the password so the URI can be shown in a terminal or a screenshot. */
function maskUri(uri) {
  return String(uri).replace(/(mongodb(?:\+srv)?:\/\/[^:/@]+:)[^@]*(@)/, '$1********$2');
}

function describeTarget(uri) {
  const isAtlas = uri.startsWith('mongodb+srv://');
  const dbName = (uri.split('/').pop() || '').split('?')[0];
  return {
    isAtlas,
    kind: isAtlas ? 'MongoDB Atlas' : 'a MongoDB server',
    dbName: dbName || '(none specified — the driver will use "test")',
  };
}

const ADVICE = [
  {
    match: (error) =>
      error.name === 'MongooseServerSelectionError' && /bad auth|authentication failed/i.test(error.message),
    title: 'The username or password is wrong.',
    steps: [
      'Check the user under Atlas → Database Access.',
      'If the password contains @ : / ? # [ ] or %, it must be percent-encoded in the URI.',
      '  node -e "console.log(encodeURIComponent(process.argv[1]))" "your-password"',
      'Make sure you replaced the literal <password> placeholder Atlas gives you.',
    ],
  },
  {
    match: (error) =>
      /IP that isn'?t whitelisted|not allowed to access|whitelist/i.test(error.message),
    title: 'This machine is not on the Atlas IP access list.',
    steps: [
      'Atlas → Network Access → Add IP Address → Add Current IP Address.',
      'A new entry takes a minute or so to become active.',
    ],
  },
  {
    match: (error) => /querySrv|ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(error.message),
    title: 'The cluster hostname could not be resolved.',
    steps: [
      'Check the host part of the URI against Atlas → Connect → Drivers.',
      'mongodb+srv:// needs a DNS SRV lookup, which some networks block.',
      'If you are on a restricted network, try the standard mongodb:// string Atlas also offers.',
    ],
  },
  {
    match: (error) => /ECONNREFUSED/i.test(error.message),
    title: 'Nothing is listening at that address.',
    steps: [
      'For a local URI, start mongod (or the Docker container) first.',
      'For Atlas, confirm the URI really starts with mongodb+srv://',
    ],
  },
  {
    match: (error) => error.name === 'MongoParseError',
    title: 'The connection string is malformed.',
    steps: [
      'It should look like:',
      '  mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/plant_garden?retryWrites=true&w=majority',
      'Do not wrap it in quotes inside the .env file.',
    ],
  },
];

async function run() {
  const target = describeTarget(config.mongoUri);

  console.log('');
  console.log(`  Target    ${target.kind}`);
  console.log(`  URI       ${maskUri(config.mongoUri)}`);
  console.log(`  Database  ${target.dbName}`);
  console.log('');
  console.log('  Connecting…');

  const started = Date.now();

  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 15000 });
    await mongoose.connection.db.admin().command({ ping: 1 });

    const elapsed = Date.now() - started;
    const collections = await mongoose.connection.db.listCollections().toArray();

    console.log(`  Connected in ${elapsed}ms.`);
    console.log('');
    console.log(`  Host         ${mongoose.connection.host}`);
    console.log(`  Database     ${mongoose.connection.name}`);
    console.log(`  Collections  ${collections.length ? collections.map((c) => c.name).join(', ') : '(none yet)'}`);

    for (const name of ['banners', 'galleries', 'contacts', 'admins']) {
      if (collections.some((c) => c.name === name)) {
        const count = await mongoose.connection.db.collection(name).countDocuments();
        console.log(`    ${name.padEnd(12)} ${count} document${count === 1 ? '' : 's'}`);
      }
    }

    console.log('');
    console.log('  The database is reachable. Start the API with: npm run dev');
    console.log('');
  } catch (error) {
    console.error('');
    console.error('  Could not connect.');
    console.error(`  ${error.name}: ${error.message.split('\n')[0]}`);
    console.error('');

    const hit = ADVICE.find((entry) => entry.match(error));
    if (hit) {
      console.error(`  Likely cause: ${hit.title}`);
      hit.steps.forEach((step) => console.error(`    ${step}`));
    } else {
      console.error('  Check MONGODB_URI in backend/.env against Atlas → Connect → Drivers.');
    }

    console.error('');
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
}

run();
