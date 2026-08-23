/**
 * Generates the botanical illustrations used by the seed data.
 *
 * Real listings use photographs uploaded through the admin panel; the seed
 * ships drawn artwork instead so a fresh clone looks like a finished brand
 * rather than a wall of grey placeholders. Everything here is plain SVG built
 * from a handful of parametric shapes, so there is no image dependency.
 */

const PALETTE = {
  leaf: '#2E7D4F',
  leafDeep: '#1B5E3A',
  leafLight: '#5FA97C',
  forest: '#14361F',
  sage: '#DCEAD8',
  mist: '#F4F8F2',
  clay: '#C4643A',
  clayLight: '#DB8355',
  ember: '#E8722B',
  bloom: '#E15C6B',
  blossom: '#F2A0AC',
  cream: '#FBF9F3',
  lilac: '#8E7BB5',
  sun: '#F0B94A',
};

const rad = (deg) => (deg * Math.PI) / 180;
const round = (n) => Math.round(n * 100) / 100;

/** A pointed leaf drawn at the origin pointing up, then placed and rotated. */
function leaf({ x, y, length, width, angle = 0, fill, opacity = 1, rib = true }) {
  const w = width / 2;
  const path =
    `M0 0 C${-w} ${-length * 0.35} ${-w * 0.72} ${-length * 0.82} 0 ${-length} ` +
    `C${w * 0.72} ${-length * 0.82} ${w} ${-length * 0.35} 0 0 Z`;
  const midrib = rib
    ? `<path d="M0 0 Q${w * 0.1} ${-length * 0.55} 0 ${-length * 0.94}" fill="none" ` +
      `stroke="${PALETTE.forest}" stroke-opacity="0.18" stroke-width="${Math.max(1, width * 0.045)}" ` +
      'stroke-linecap="round"/>'
    : '';
  return (
    `<g transform="translate(${round(x)} ${round(y)}) rotate(${round(angle)})" opacity="${opacity}">` +
    `<path d="${path}" fill="${fill}"/>${midrib}</g>`
  );
}

/** A curved stem from a base point to an end point. */
function stem({ x1, y1, x2, y2, bow = 40, width = 6, color = PALETTE.leafDeep }) {
  const mx = (x1 + x2) / 2 + bow;
  const my = (y1 + y2) / 2;
  return (
    `<path d="M${round(x1)} ${round(y1)} Q${round(mx)} ${round(my)} ${round(x2)} ${round(y2)}" ` +
    `fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`
  );
}

/** A radially symmetric bloom built from petal leaves. */
function flower({ x, y, radius, petals = 6, fill, centre = PALETTE.sun, inner }) {
  const parts = [];
  if (inner) {
    for (let i = 0; i < petals; i += 1) {
      const angle = (360 / petals) * i + 180 / petals;
      parts.push(
        leaf({ x, y, length: radius * 0.72, width: radius * 0.7, angle, fill: inner, rib: false })
      );
    }
  }
  for (let i = 0; i < petals; i += 1) {
    const angle = (360 / petals) * i;
    parts.push(leaf({ x, y, length: radius, width: radius * 0.85, angle, fill, rib: false }));
  }
  parts.push(`<circle cx="${round(x)}" cy="${round(y)}" r="${round(radius * 0.2)}" fill="${centre}"/>`);
  return parts.join('');
}

/** Terracotta or ceramic pot, drawn with its opening at (x, y). */
function pot({ x, y, width, height, tone = 'clay' }) {
  const body = tone === 'clay' ? PALETTE.clay : PALETTE.sage;
  const rim = tone === 'clay' ? PALETTE.clayLight : PALETTE.mist;
  const w = width / 2;
  const rimH = height * 0.16;
  return (
    '<g>' +
    `<path d="M${round(x - w)} ${round(y + rimH)} L${round(x + w)} ${round(y + rimH)} ` +
    `L${round(x + w * 0.74)} ${round(y + height)} Q${round(x)} ${round(y + height + height * 0.09)} ` +
    `${round(x - w * 0.74)} ${round(y + height)} Z" fill="${body}"/>` +
    `<rect x="${round(x - w * 1.06)}" y="${round(y)}" width="${round(w * 2.12)}" height="${round(rimH)}" ` +
    `rx="${round(rimH * 0.34)}" fill="${rim}"/>` +
    `<path d="M${round(x - w * 0.5)} ${round(y + rimH * 1.6)} L${round(x - w * 0.36)} ${round(y + height * 0.86)}" ` +
    `stroke="${PALETTE.cream}" stroke-opacity="0.28" stroke-width="${round(width * 0.05)}" ` +
    'stroke-linecap="round"/>' +
    '</g>'
  );
}

const soil = (x, y, width) =>
  `<ellipse cx="${round(x)}" cy="${round(y)}" rx="${round(width / 2)}" ry="${round(width * 0.08)}" ` +
  `fill="${PALETTE.forest}" opacity="0.55"/>`;

const groundShadow = (x, y, width) =>
  `<ellipse cx="${round(x)}" cy="${round(y)}" rx="${round(width)}" ry="${round(width * 0.13)}" ` +
  `fill="${PALETTE.leafDeep}" opacity="0.1"/>`;

/** Scene-setting background: soft wash plus an off-centre halo. */
function backdrop(w, h, id, tint = PALETTE.sage) {
  return (
    `<defs><linearGradient id="bg${id}" x1="0" y1="0" x2="0.35" y2="1">` +
    `<stop offset="0" stop-color="${PALETTE.cream}"/>` +
    `<stop offset="1" stop-color="${PALETTE.mist}"/></linearGradient>` +
    `<radialGradient id="halo${id}" cx="0.5" cy="0.42" r="0.55">` +
    `<stop offset="0" stop-color="${tint}" stop-opacity="0.95"/>` +
    `<stop offset="1" stop-color="${tint}" stop-opacity="0"/></radialGradient></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#bg${id})"/>` +
    `<circle cx="${w * 0.5}" cy="${h * 0.42}" r="${Math.min(w, h) * 0.42}" fill="url(#halo${id})"/>`
  );
}

const wrap = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" ` +
  `role="img" preserveAspectRatio="xMidYMid slice">${body}</svg>`;

// ── Product illustrations ────────────────────────────────────────────────────
const W = 900;
const H = 1100;
const CX = W / 2;
const POT_Y = 760;

const subjects = {
  rose(id) {
    const parts = [backdrop(W, H, id, '#F6DCE0'), groundShadow(CX, 1000, 250)];
    parts.push(pot({ x: CX, y: POT_Y, width: 300, height: 250 }));
    parts.push(soil(CX, POT_Y + 34, 292));
    [
      [-150, 300, -22],
      [150, 320, 22],
      [-70, 220, -8],
      [80, 240, 10],
    ].forEach(([dx, len, tilt]) => {
      parts.push(stem({ x1: CX, y1: POT_Y + 20, x2: CX + dx, y2: POT_Y - len, bow: dx * 0.4 }));
      parts.push(
        leaf({
          x: CX + dx * 0.6,
          y: POT_Y - len * 0.45,
          length: 120,
          width: 66,
          angle: tilt - 55,
          fill: PALETTE.leaf,
        })
      );
      parts.push(
        leaf({
          x: CX + dx * 0.7,
          y: POT_Y - len * 0.7,
          length: 110,
          width: 60,
          angle: tilt + 58,
          fill: PALETTE.leafLight,
        })
      );
    });
    parts.push(
      flower({ x: CX - 150, y: POT_Y - 300, radius: 96, petals: 7, fill: PALETTE.bloom, inner: PALETTE.blossom })
    );
    parts.push(
      flower({ x: CX + 150, y: POT_Y - 320, radius: 84, petals: 7, fill: PALETTE.blossom, inner: PALETTE.bloom })
    );
    parts.push(
      flower({ x: CX + 10, y: POT_Y - 430, radius: 108, petals: 8, fill: PALETTE.bloom, inner: PALETTE.blossom })
    );
    return parts.join('');
  },

  monstera(id) {
    const parts = [backdrop(W, H, id), groundShadow(CX, 1000, 260)];
    parts.push(pot({ x: CX, y: POT_Y, width: 320, height: 260 }));
    parts.push(soil(CX, POT_Y + 36, 312));
    const blades = [
      [-210, -250, -30, 250],
      [200, -270, 30, 260],
      [-60, -400, -10, 280],
      [90, -380, 14, 270],
      [0, -200, 0, 190],
    ];
    blades.forEach(([dx, dy, tilt, size], index) => {
      const bx = CX + dx;
      const by = POT_Y + dy;
      parts.push(stem({ x1: CX, y1: POT_Y + 10, x2: bx, y2: by + size * 0.35, bow: dx * 0.25, width: 9 }));
      const fill = index % 2 ? PALETTE.leaf : PALETTE.leafDeep;
      const maskId = `fen${id}${index}`;

      // Fenestrations are punched with a mask so the backdrop shows through,
      // the way real monstera holes do.
      const holes = [];
      const veins = [];
      [0.3, 0.5, 0.7, 0.87].forEach((t, row) => {
        const y = -size * 1.15 * t;
        const halfWidth = size * 0.7 * Math.sin(Math.PI * t) ** 0.55;
        [-1, 1].forEach((side) => {
          const cx = side * halfWidth * 0.58;
          const rx = halfWidth * 0.3;
          const ry = size * 0.055 + row * size * 0.004;
          const angle = side * (24 - row * 4);
          holes.push(
            `<ellipse cx="${round(cx)}" cy="${round(y)}" rx="${round(rx)}" ry="${round(ry)}" ` +
              `fill="black" transform="rotate(${angle} ${round(cx)} ${round(y)})"/>`
          );
          veins.push(
            `<path d="M0 ${round(y + size * 0.04)} L${round(side * halfWidth * 0.7)} ${round(y - size * 0.02)}" ` +
              `stroke="${PALETTE.forest}" stroke-opacity="0.16" stroke-width="${round(size * 0.018)}" ` +
              'stroke-linecap="round"/>'
          );
        });
      });

      parts.push(
        `<g transform="translate(${bx} ${by + size * 0.35}) rotate(${tilt})">` +
          `<mask id="${maskId}" maskUnits="userSpaceOnUse" x="${-size}" y="${-size * 1.3}" ` +
          `width="${size * 2}" height="${size * 1.5}">` +
          `<rect x="${-size}" y="${-size * 1.3}" width="${size * 2}" height="${size * 1.5}" fill="white"/>` +
          holes.join('') +
          '</mask>' +
          `<path d="M0 0 C${-size * 0.72} ${-size * 0.3} ${-size * 0.62} ${-size * 0.95} 0 ${-size * 1.15} ` +
          `C${size * 0.62} ${-size * 0.95} ${size * 0.72} ${-size * 0.3} 0 0 Z" fill="${fill}" ` +
          `mask="url(#${maskId})"/>` +
          `<path d="M0 0 L0 ${round(-size * 1.1)}" stroke="${PALETTE.forest}" stroke-opacity="0.2" ` +
          `stroke-width="${round(size * 0.026)}" stroke-linecap="round"/>` +
          veins.join('') +
          '</g>'
      );
    });
    return parts.join('');
  },

  fern(id) {
    const parts = [backdrop(W, H, id), groundShadow(CX, 1000, 250)];
    parts.push(pot({ x: CX, y: POT_Y, width: 300, height: 240, tone: 'ceramic' }));
    parts.push(soil(CX, POT_Y + 34, 292));
    for (let i = 0; i < 9; i += 1) {
      const spread = (i - 4) / 4;
      const angle = spread * 46;
      const length = 430 - Math.abs(spread) * 120;
      const tipX = CX + Math.sin(rad(angle)) * length;
      const tipY = POT_Y - Math.cos(rad(angle)) * length;
      parts.push(stem({ x1: CX, y1: POT_Y + 10, x2: tipX, y2: tipY, bow: spread * 60, width: 6 }));
      for (let j = 1; j <= 7; j += 1) {
        const t = j / 8;
        const px = CX + (tipX - CX) * t + spread * 60 * (t - t * t) * 2;
        const py = POT_Y + 10 + (tipY - POT_Y - 10) * t;
        const size = 92 * (1 - t * 0.55);
        const tone = i % 2 ? PALETTE.leaf : PALETTE.leafLight;
        parts.push(leaf({ x: px, y: py, length: size, width: size * 0.42, angle: angle - 68, fill: tone, rib: false }));
        parts.push(leaf({ x: px, y: py, length: size, width: size * 0.42, angle: angle + 68, fill: tone, rib: false }));
      }
    }
    return parts.join('');
  },

  succulent(id) {
    const parts = [backdrop(W, H, id), groundShadow(CX, 1000, 220)];
    parts.push(pot({ x: CX, y: POT_Y + 60, width: 280, height: 200 }));
    parts.push(soil(CX, POT_Y + 92, 272));
    const rings = [
      { count: 9, length: 250, width: 130, fill: PALETTE.leafDeep, offset: 0 },
      { count: 8, length: 195, width: 112, fill: PALETTE.leaf, offset: 22 },
      { count: 7, length: 140, width: 92, fill: PALETTE.leafLight, offset: 44 },
      { count: 5, length: 88, width: 66, fill: '#8FC7A3', offset: 66 },
    ];
    rings.forEach((ring) => {
      for (let i = 0; i < ring.count; i += 1) {
        const angle = (360 / ring.count) * i + ring.offset;
        parts.push(
          leaf({ x: CX, y: POT_Y + 78, length: ring.length, width: ring.width, angle, fill: ring.fill })
        );
      }
    });
    return parts.join('');
  },

  lavender(id) {
    const parts = [backdrop(W, H, id, '#E4DEF2'), groundShadow(CX, 1000, 240)];
    parts.push(pot({ x: CX, y: POT_Y, width: 290, height: 240, tone: 'ceramic' }));
    parts.push(soil(CX, POT_Y + 34, 282));
    // Stems rise from spread-out bases rather than a single point, so the
    // planting reads as a clump instead of a folded fan.
    for (let i = 0; i < 11; i += 1) {
      const spread = (i - 5) / 5;
      const baseX = CX + spread * 96;
      const baseY = POT_Y + 12 - Math.abs(spread) * 10;
      const angle = spread * 17 + (i % 3 === 0 ? 4 : -3);
      const length = 430 - Math.abs(spread) * 70 - (i % 3) * 26;
      const tipX = baseX + Math.sin(rad(angle)) * length;
      const tipY = baseY - Math.cos(rad(angle)) * length;

      parts.push(
        stem({ x1: baseX, y1: baseY, x2: tipX, y2: tipY, bow: spread * 26, width: 5, color: PALETTE.leafLight })
      );

      // Grey-green foliage low on the stem
      for (let k = 0; k < 3; k += 1) {
        const t = 0.1 + k * 0.12;
        parts.push(
          leaf({
            x: baseX + (tipX - baseX) * t,
            y: baseY + (tipY - baseY) * t,
            length: 78 - k * 12,
            width: 18,
            angle: angle + (k % 2 ? 62 : -62),
            fill: '#8FB69B',
            rib: false,
          })
        );
      }

      // Flower spike: small florets stacked along the top third
      for (let j = 0; j < 9; j += 1) {
        const t = 0.6 + (j / 9) * 0.4;
        const px = round(baseX + (tipX - baseX) * t);
        const py = round(baseY + (tipY - baseY) * t);
        const r = 20 - j * 1.6;
        parts.push(
          `<ellipse cx="${px}" cy="${py}" rx="${round(r * 0.5)}" ry="${round(r * 0.82)}" ` +
            `fill="${j % 2 ? PALETTE.lilac : '#A594C9'}" transform="rotate(${round(angle)} ${px} ${py})"/>`
        );
      }
    }
    return parts.join('');
  },

  tulip(id) {
    const parts = [backdrop(W, H, id, '#FBE3CF'), groundShadow(CX, 1000, 240)];
    parts.push(pot({ x: CX, y: POT_Y, width: 300, height: 240 }));
    parts.push(soil(CX, POT_Y + 34, 292));
    const blooms = [
      [-160, 340, PALETTE.ember],
      [0, 430, PALETTE.bloom],
      [160, 360, PALETTE.sun],
    ];
    blooms.forEach(([dx, len, colour]) => {
      const tipX = CX + dx;
      const tipY = POT_Y - len;
      parts.push(stem({ x1: CX + dx * 0.3, y1: POT_Y + 10, x2: tipX, y2: tipY, bow: dx * 0.15, width: 9 }));
      parts.push(
        leaf({ x: CX + dx * 0.45, y: POT_Y, length: 300, width: 76, angle: dx > 0 ? 16 : -16, fill: PALETTE.leaf })
      );
      parts.push(
        `<g transform="translate(${round(tipX)} ${round(tipY)})">` +
          `<path d="M-72 30 C-80 -60 -44 -104 0 -104 C44 -104 80 -60 72 30 C40 62 -40 62 -72 30 Z" fill="${colour}"/>` +
          `<path d="M-26 24 C-34 -52 -14 -96 0 -96 C14 -96 34 -52 26 24 Z" fill="${PALETTE.cream}" opacity="0.22"/>` +
          '</g>'
      );
    });
    return parts.join('');
  },

  snakePlant(id) {
    const parts = [backdrop(W, H, id), groundShadow(CX, 1000, 230)];
    parts.push(pot({ x: CX, y: POT_Y, width: 290, height: 250, tone: 'ceramic' }));
    parts.push(soil(CX, POT_Y + 34, 282));
    for (let i = 0; i < 7; i += 1) {
      const spread = (i - 3) / 3;
      const angle = spread * 22;
      const length = 520 - Math.abs(spread) * 110;
      const width = 74 - Math.abs(spread) * 12;
      const bx = round(CX + spread * 40);
      parts.push(
        leaf({
          x: bx,
          y: POT_Y + 16,
          length,
          width,
          angle,
          fill: i % 2 ? PALETTE.leafDeep : PALETTE.leaf,
          rib: false,
        })
      );
      parts.push(
        `<g transform="translate(${bx} ${POT_Y + 16}) rotate(${round(angle)})" opacity="0.5">` +
          `<path d="M0 ${round(-length * 0.1)} C${round(width * 0.2)} ${round(-length * 0.4)} ` +
          `${round(-width * 0.2)} ${round(-length * 0.66)} 0 ${round(-length * 0.92)}" ` +
          `fill="none" stroke="${PALETTE.sun}" stroke-width="${round(width * 0.16)}" stroke-linecap="round"/></g>`
      );
    }
    return parts.join('');
  },

  bonsai(id) {
    const parts = [backdrop(W, H, id), groundShadow(CX, 1000, 260)];
    parts.push(
      `<rect x="${CX - 190}" y="${POT_Y + 120}" width="380" height="96" rx="26" fill="${PALETTE.forest}"/>`,
      `<rect x="${CX - 205}" y="${POT_Y + 108}" width="410" height="32" rx="16" fill="#22492D"/>`
    );
    parts.push(soil(CX, POT_Y + 122, 360));
    parts.push(
      `<path d="M${CX - 10} ${POT_Y + 118} C${CX - 30} ${POT_Y - 20} ${CX - 130} ${POT_Y - 60} ${CX - 150} ${POT_Y - 170}" ` +
        'fill="none" stroke="#5B4430" stroke-width="30" stroke-linecap="round"/>',
      `<path d="M${CX - 40} ${POT_Y + 10} C${CX + 40} ${POT_Y - 40} ${CX + 130} ${POT_Y - 90} ${CX + 160} ${POT_Y - 210}" ` +
        'fill="none" stroke="#6B5138" stroke-width="20" stroke-linecap="round"/>',
      `<path d="M${CX - 60} ${POT_Y - 60} C${CX - 20} ${POT_Y - 150} ${CX + 20} ${POT_Y - 200} ${CX + 10} ${POT_Y - 330}" ` +
        'fill="none" stroke="#5B4430" stroke-width="18" stroke-linecap="round"/>'
    );
    const canopies = [
      [CX - 160, POT_Y - 190, 150],
      [CX + 170, POT_Y - 230, 130],
      [CX + 10, POT_Y - 350, 175],
    ];
    canopies.forEach(([cx, cy, r]) => {
      parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.62}" fill="${PALETTE.leafDeep}"/>`);
      parts.push(
        `<ellipse cx="${cx - r * 0.2}" cy="${cy - r * 0.18}" rx="${r * 0.72}" ry="${r * 0.44}" fill="${PALETTE.leaf}"/>`
      );
      for (let i = 0; i < 7; i += 1) {
        const a = (360 / 7) * i;
        parts.push(
          leaf({
            x: cx + Math.cos(rad(a)) * r * 0.7,
            y: cy + Math.sin(rad(a)) * r * 0.42,
            length: 56,
            width: 30,
            angle: a + 90,
            fill: PALETTE.leafLight,
            rib: false,
          })
        );
      }
    });
    return parts.join('');
  },

  coconut(id) {
    const parts = [backdrop(W, H, id), groundShadow(CX, 1010, 260)];

    // Nursery poly-bag rather than a pot: how saplings actually leave the yard.
    parts.push(
      `<path d="M${CX - 110} ${POT_Y + 40} L${CX + 110} ${POT_Y + 40} L${CX + 96} ${POT_Y + 260} ` +
        `L${CX - 96} ${POT_Y + 260} Z" fill="#2A3B2C"/>`,
      `<rect x="${CX - 116}" y="${POT_Y + 26}" width="232" height="30" rx="10" fill="#374C39"/>`,
      soil(CX, POT_Y + 46, 210)
    );

    // Short stem, then arching pinnate fronds
    parts.push(
      `<path d="M${CX} ${POT_Y + 40} L${CX} ${POT_Y - 60}" stroke="#7A5B3A" ` +
        'stroke-width="26" stroke-linecap="round"/>'
    );

    for (let i = 0; i < 7; i += 1) {
      const spread = (i - 3) / 3;
      const angle = spread * 62;
      const length = 430 - Math.abs(spread) * 90;
      const tipX = CX + Math.sin(rad(angle)) * length;
      const tipY = POT_Y - 60 - Math.cos(rad(angle)) * length * 0.78;
      const rachis = i % 2 ? PALETTE.leaf : PALETTE.leafDeep;

      parts.push(
        `<path d="M${CX} ${POT_Y - 60} Q${round((CX + tipX) / 2 + spread * 70)} ` +
          `${round((POT_Y - 60 + tipY) / 2 - 60)} ${round(tipX)} ${round(tipY)}" fill="none" ` +
          `stroke="${rachis}" stroke-width="9" stroke-linecap="round"/>`
      );

      // Leaflets along each frond
      for (let j = 1; j <= 9; j += 1) {
        const t = j / 10;
        const px = CX + (tipX - CX) * t + spread * 70 * (t - t * t) * 2;
        const py = POT_Y - 60 + (tipY - (POT_Y - 60)) * t - 60 * (t - t * t) * 2;
        const size = 118 * (1 - t * 0.5);
        parts.push(
          leaf({ x: px, y: py, length: size, width: size * 0.3, angle: angle - 74, fill: rachis, rib: false }),
          leaf({ x: px, y: py, length: size, width: size * 0.3, angle: angle + 74, fill: rachis, rib: false })
        );
      }
    }

    // A pair of nuts at the base of the crown
    [-1, 1].forEach((side) => {
      parts.push(
        `<ellipse cx="${round(CX + side * 62)}" cy="${POT_Y - 40}" rx="46" ry="54" fill="#8A6236"/>`,
        `<ellipse cx="${round(CX + side * 62 - 12)}" cy="${POT_Y - 56}" rx="16" ry="20" fill="#A67C48"/>`
      );
    });

    return parts.join('');
  },

  planter(id) {
    const parts = [backdrop(W, H, id, '#F3E2D5'), groundShadow(CX, 1000, 270)];
    const trio = [
      [CX - 230, POT_Y + 40, 210, 190],
      [CX, POT_Y - 40, 300, 280],
      [CX + 240, POT_Y + 70, 180, 160],
    ];
    trio.forEach(([x, y, w, h], index) => {
      parts.push(pot({ x, y, width: w, height: h, tone: index === 1 ? 'clay' : 'ceramic' }));
      parts.push(soil(x, y + h * 0.14, w * 0.96));
      for (let i = 0; i < 5; i += 1) {
        const angle = (i - 2) * 26;
        parts.push(
          leaf({
            x,
            y: y + 8,
            length: h * 0.9 - Math.abs(i - 2) * 18,
            width: w * 0.3,
            angle,
            fill: i % 2 ? PALETTE.leaf : PALETTE.leafLight,
          })
        );
      }
    });
    return parts.join('');
  },

  tools(id) {
    const parts = [backdrop(W, H, id, '#F3E2D5'), groundShadow(CX, 1020, 300)];

    // Foliage behind the kit
    for (let i = 0; i < 7; i += 1) {
      const spread = (i - 3) / 3;
      parts.push(
        leaf({
          x: CX + spread * 250,
          y: 900,
          length: 380 - Math.abs(spread) * 90,
          width: 130,
          angle: spread * 46,
          fill: i % 2 ? PALETTE.leafDeep : PALETTE.leaf,
          opacity: 0.9,
        })
      );
    }

    // Trowel, hand fork and secateurs standing in a canvas tool roll
    const trowel = () =>
      `<g transform="translate(${CX - 190} 250)">` +
      `<rect x="-24" y="0" width="48" height="230" rx="24" fill="${PALETTE.forest}"/>` +
      `<rect x="-20" y="10" width="40" height="86" rx="20" fill="${PALETTE.ember}"/>` +
      `<path d="M-14 230 L14 230 L20 262 L-20 262 Z" fill="#8E9A94"/>` +
      `<path d="M-46 262 L46 262 C58 340 34 402 0 424 C-34 402 -58 340 -46 262 Z" fill="#AEB8B2"/>` +
      `<path d="M0 268 L0 412" stroke="#8E9A94" stroke-width="8" stroke-linecap="round"/></g>`;

    const fork = () =>
      `<g transform="translate(${CX - 20} 268)">` +
      `<rect x="-24" y="0" width="48" height="230" rx="24" fill="${PALETTE.leafDeep}"/>` +
      `<rect x="-20" y="10" width="40" height="86" rx="20" fill="${PALETTE.ember}"/>` +
      `<path d="M-16 230 L16 230 L22 268 L-22 268 Z" fill="#8E9A94"/>` +
      [-1, 0, 1]
        .map(
          (t) =>
            `<rect x="${t * 32 - 9}" y="268" width="18" height="150" rx="9" fill="#AEB8B2"/>` +
            `<path d="M${t * 32} 418 L${t * 32 - 9} 400 L${t * 32 + 9} 400 Z" fill="#8E9A94"/>`
        )
        .join('') +
      '</g>';

    const secateurs = () =>
      `<g transform="translate(${CX + 180} 244)">` +
      `<path d="M-30 0 C-58 90 -46 190 -10 236 L10 236 C46 190 58 90 30 0 Z" fill="${PALETTE.forest}"/>` +
      `<path d="M-24 12 C-46 84 -38 160 -8 198 L8 198 C38 160 46 84 24 12 Z" fill="${PALETTE.ember}"/>` +
      `<circle cx="0" cy="252" r="22" fill="#8E9A94"/>` +
      `<path d="M-8 262 C-30 320 -30 372 -4 420 L6 414 C-14 366 -12 320 6 268 Z" fill="#AEB8B2"/>` +
      `<path d="M8 262 C30 316 26 368 2 418" fill="none" stroke="#8E9A94" stroke-width="18" stroke-linecap="round"/></g>`;

    parts.push(trowel(), fork(), secateurs());

    // Waxed canvas roll they sit in
    parts.push(
      `<path d="M${CX - 310} 620 L${CX + 310} 620 L${CX + 276} 940 L${CX - 276} 940 Z" fill="${PALETTE.clay}"/>`,
      `<rect x="${CX - 316}" y="596" width="632" height="70" rx="30" fill="${PALETTE.clayLight}"/>`,
      `<path d="M${CX - 292} 760 L${CX + 292} 760" stroke="${PALETTE.cream}" stroke-opacity="0.3" stroke-width="8" stroke-linecap="round"/>`
    );
    [-2, -1, 0, 1, 2].forEach((t) => {
      parts.push(
        `<path d="M${CX + t * 118} 666 L${CX + t * 112} 936" stroke="${PALETTE.cream}" ` +
          'stroke-opacity="0.22" stroke-width="6" stroke-linecap="round"/>'
      );
    });
    return parts.join('');
  },

  seeds(id) {
    const parts = [backdrop(W, H, id, '#F6EBD5'), groundShadow(CX, 1020, 280)];

    // A back packet peeking out from behind the front one
    parts.push(
      `<g transform="rotate(-7 ${CX} 660)">` +
        `<rect x="${CX - 300}" y="330" width="330" height="560" rx="22" fill="#EFE6D2" ` +
        `stroke="${PALETTE.sage}" stroke-width="8"/>` +
        `<rect x="${CX - 300}" y="330" width="330" height="112" rx="22" fill="${PALETTE.leaf}"/></g>`
    );

    // Front packet
    parts.push(
      `<rect x="${CX - 210}" y="300" width="440" height="620" rx="24" fill="${PALETTE.cream}" ` +
        `stroke="${PALETTE.sage}" stroke-width="8"/>`,
      `<path d="M${CX - 210} 324 A24 24 0 0 1 ${CX - 186} 300 L${CX + 206} 300 A24 24 0 0 1 ${CX + 230} 324 ` +
        `L${CX + 230} 436 L${CX - 210} 436 Z" fill="${PALETTE.leafDeep}"/>`,
      `<rect x="${CX - 210}" y="436" width="440" height="18" fill="${PALETTE.ember}"/>`
    );

    // Label lines standing in for the variety name and sowing notes
    parts.push(
      `<rect x="${CX - 170}" y="344" width="240" height="26" rx="13" fill="${PALETTE.cream}" opacity="0.92"/>`,
      `<rect x="${CX - 170}" y="386" width="150" height="16" rx="8" fill="${PALETTE.sage}" opacity="0.6"/>`
    );

    parts.push(
      flower({ x: CX + 10, y: 630, radius: 108, petals: 8, fill: PALETTE.ember, inner: PALETTE.sun, centre: PALETTE.forest })
    );

    for (let i = 0; i < 4; i += 1) {
      parts.push(
        leaf({ x: CX + 10, y: 660, length: 120, width: 46, angle: -140 + i * 26, fill: PALETTE.leaf, rib: false })
      );
    }

    parts.push(
      `<rect x="${CX - 150}" y="790" width="320" height="14" rx="7" fill="${PALETTE.sage}"/>`,
      `<rect x="${CX - 150}" y="824" width="230" height="14" rx="7" fill="${PALETTE.sage}"/>`,
      `<rect x="${CX - 150}" y="858" width="270" height="14" rx="7" fill="${PALETTE.sage}"/>`
    );

    // Loose seed spilled at the base
    for (let i = 0; i < 9; i += 1) {
      const sx = round(CX - 250 + i * 62 + (i % 2) * 18);
      const sy = round(950 + (i % 3) * 22);
      parts.push(
        `<ellipse cx="${sx}" cy="${sy}" rx="17" ry="11" fill="#7A5B3A" transform="rotate(${i * 37} ${sx} ${sy})"/>`
      );
    }
    return parts.join('');
  },

  hibiscus(id) {
    const parts = [backdrop(W, H, id, '#FBD9CE'), groundShadow(CX, 1000, 250)];
    parts.push(pot({ x: CX, y: POT_Y, width: 300, height: 250 }));
    parts.push(soil(CX, POT_Y + 34, 292));
    for (let i = 0; i < 9; i += 1) {
      const spread = (i - 4) / 4;
      parts.push(
        leaf({
          x: CX + spread * 90,
          y: POT_Y,
          length: 300 - Math.abs(spread) * 70,
          width: 130,
          angle: spread * 42,
          fill: i % 2 ? PALETTE.leafDeep : PALETTE.leaf,
        })
      );
    }
    parts.push(
      flower({ x: CX - 140, y: POT_Y - 300, radius: 110, petals: 5, fill: PALETTE.ember, inner: PALETTE.sun, centre: PALETTE.bloom })
    );
    parts.push(
      flower({ x: CX + 150, y: POT_Y - 260, radius: 96, petals: 5, fill: PALETTE.bloom, inner: PALETTE.blossom })
    );
    parts.push(
      flower({ x: CX + 10, y: POT_Y - 420, radius: 124, petals: 5, fill: PALETTE.ember, inner: PALETTE.sun, centre: PALETTE.bloom })
    );
    return parts.join('');
  },
};

function productArtwork(kind, id) {
  const draw = subjects[kind] || subjects.monstera;
  return wrap(W, H, draw(id));
}

// ── Hero banners ─────────────────────────────────────────────────────────────
const BW = 1920;
const BH = 1080;

function bannerArtwork(variant, id) {
  const parts = [];
  const skies = {
    1: ['#0F2E1C', '#1F5136'],
    2: ['#13361F', '#2E7D4F'],
    3: ['#1A3A24', '#3D6B45'],
  };
  const [from, to] = skies[variant] || skies[1];

  parts.push(
    `<defs><linearGradient id="sky${id}" x1="0" y1="0" x2="0.6" y2="1">` +
      `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>` +
      `<radialGradient id="glow${id}" cx="${variant === 2 ? 0.72 : 0.28}" cy="0.3" r="0.6">` +
      `<stop offset="0" stop-color="${PALETTE.sun}" stop-opacity="0.5"/>` +
      `<stop offset="1" stop-color="${PALETTE.sun}" stop-opacity="0"/></radialGradient></defs>` +
      `<rect width="${BW}" height="${BH}" fill="url(#sky${id})"/>` +
      `<rect width="${BW}" height="${BH}" fill="url(#glow${id})"/>`
  );

  // Arched glasshouse frames
  const archX = variant === 2 ? BW * 0.68 : BW * 0.66;
  [0, 1, 2].forEach((i) => {
    const x = archX + (i - 1) * 300;
    parts.push(
      `<path d="M${x - 120} ${BH} L${x - 120} 470 A120 200 0 0 1 ${x + 120} 470 L${x + 120} ${BH} Z" ` +
        `fill="${PALETTE.cream}" opacity="${0.07 + i * 0.02}"/>` +
        `<path d="M${x - 120} ${BH} L${x - 120} 470 A120 200 0 0 1 ${x + 120} 470 L${x + 120} ${BH} Z" ` +
        `fill="none" stroke="${PALETTE.cream}" stroke-opacity="0.14" stroke-width="4"/>` +
        `<line x1="${x}" y1="272" x2="${x}" y2="${BH}" stroke="${PALETTE.cream}" stroke-opacity="0.1" stroke-width="3"/>`
    );
  });

  // Foliage banks along the bottom edge
  const bank = (originX, scale, tone, count, baseY) => {
    for (let i = 0; i < count; i += 1) {
      const spread = (i - (count - 1) / 2) / ((count - 1) / 2 || 1);
      parts.push(
        leaf({
          x: originX + spread * 260 * scale,
          y: baseY,
          length: (420 - Math.abs(spread) * 130) * scale,
          width: (190 - Math.abs(spread) * 44) * scale,
          angle: spread * 52,
          fill: tone,
          opacity: 0.95,
        })
      );
    }
  };

  bank(BW * 0.08, 1.25, PALETTE.leafDeep, 7, BH + 60);
  bank(BW * 0.2, 0.95, PALETTE.leaf, 6, BH + 40);
  bank(BW * 0.88, 1.35, PALETTE.leafDeep, 7, BH + 70);
  bank(BW * 0.74, 0.85, PALETTE.leaf, 5, BH + 30);
  bank(BW * 0.5, 0.7, '#256B44', 5, BH + 20);

  // Drifting leaves for depth
  const drift = [
    [BW * 0.16, 210, 34, 0.35],
    [BW * 0.3, 380, -28, 0.22],
    [BW * 0.86, 260, 20, 0.3],
    [BW * 0.62, 170, -40, 0.18],
    [BW * 0.44, 300, 12, 0.16],
  ];
  drift.forEach(([x, y, angle, opacity]) => {
    parts.push(leaf({ x, y, length: 150, width: 70, angle, fill: PALETTE.leafLight, opacity, rib: false }));
  });

  if (variant === 3) {
    parts.push(
      flower({ x: BW * 0.14, y: BH * 0.72, radius: 90, petals: 6, fill: PALETTE.ember, inner: PALETTE.sun, centre: PALETTE.cream })
    );
    parts.push(
      flower({ x: BW * 0.87, y: BH * 0.66, radius: 72, petals: 6, fill: PALETTE.blossom, inner: PALETTE.bloom })
    );
  }

  // No scrim is baked in: the site applies its own gradient over whatever
  // image sits in a banner slot, so uploaded photos and this artwork are
  // treated identically.

  return wrap(BW, BH, parts.join(''));
}

module.exports = { productArtwork, bannerArtwork, PALETTE };
