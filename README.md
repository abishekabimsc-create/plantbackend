# plantbackend

REST API for **Sri Veludaiyan Nursery Garden & Coconut Mandi** (வேலுடையான் நர்சரி),
Cuddalore Main Road, Vadalur, Tamil Nadu.

Serves the plant catalogue and home carousel to the public site, and backs a
token-protected admin area for managing them. Front end lives in
[plantfrontend](https://github.com/abishekabimsc-create/plantfrontend).

---

## Tech stack

| Layer | Choice |
| ----- | ------ |
| Runtime | Node.js, Express 4 |
| Database | MongoDB with Mongoose 8 |
| Auth | JSON Web Tokens; passwords hashed with bcrypt (`bcryptjs`) |
| Uploads | Multer — disk storage, MIME + file-signature validation |
| Security | helmet, CORS allow-list, express-rate-limit |

**`bcryptjs`, not `bcrypt`** — same algorithm and hash format, but pure
JavaScript, so `npm install` never needs a native toolchain. On Windows in
particular this removes the most common setup failure.

---

## Getting started

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
```

Fill in `.env` — at minimum `MONGODB_URI`, `JWT_SECRET` and `ADMIN_PASSWORD`.
Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Confirm the database is reachable before starting:

```bash
npm run check-db
```

Then run it:

```bash
npm run dev     # nodemon, restarts on change
npm start       # plain node, for production
```

The API listens on <http://localhost:5000>. Check `/api/health`.

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | nodemon on port 5000 |
| `npm run check-db` | Verify `MONGODB_URI` connects, and name the cause if it fails |
| `npm run seed` | Load demo banners and listings |
| `npm run seed -- --reset` | Wipe banners + gallery, remove their images, reload |
| `npm run create-admin` | Create or rotate the admin account |

---

## Environment

| Variable | Example | Notes |
| -------- | ------- | ----- |
| `PORT` | `5000` | |
| `NODE_ENV` | `development` | `production` enables caching and hides stack traces |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/plant_garden` | Local or Atlas |
| `JWT_SECRET` | *(48 random bytes)* | **Required.** Refuses to boot in production with the example value |
| `JWT_EXPIRES_IN` | `2h` | Admin session length |
| `ADMIN_USERNAME` | `admin` | Seeded on first boot |
| `ADMIN_PASSWORD` | *(your password)* | Stored only as a bcrypt hash |
| `CLIENT_URL` | `http://localhost:5173` | CORS allow-list, comma-separated for several |
| `SERVER_URL` | `http://localhost:5000` | Used to build absolute image URLs |
| `MAX_UPLOAD_SIZE_MB` | `5` | Per-file ceiling |

`.env` is git-ignored and must never be committed. `.env.example` is the
template.

### MongoDB Atlas notes

- Add your IP under **Network Access → Add Current IP Address**.
- Percent-encode `@ : / ? # [ ]` in the password:
  `node -e "console.log(encodeURIComponent(process.argv[1]))" "your-password"`
- Put the database name **before** the `?`, or the driver silently uses `test`.
- `mongodb+srv://` needs a DNS SRV lookup. Where a network blocks that,
  `check-db` says so and Atlas also offers a standard `mongodb://` string.

---

## API

Base URL: `/api`

### Auth

| Method | Path | Access | Purpose |
| ------ | ---- | ------ | ------- |
| POST | `/auth/login` | Public | `{ username, password }` → JWT |
| GET | `/auth/me` | Admin | Confirm a stored token is still valid |

Rate-limited to 10 attempts per 10 minutes per IP in production. A wrong
password and an unknown username return the same `401`, so the endpoint does
not reveal which accounts exist.

### Banners

| Method | Path | Access | Purpose |
| ------ | ---- | ------ | ------- |
| GET | `/banners` | Public | All banners, ordered by slot |
| POST | `/banners` | Admin | Add one. `409` once three exist |
| PUT | `/banners/:id` | Admin | Replace the image and/or edit the captions |
| DELETE | `/banners/:id` | Admin | Remove the record and its file |

### Gallery

| Method | Path | Access | Purpose |
| ------ | ---- | ------ | ------- |
| GET | `/gallery` | Public | `?featured=true`, `?category=`, `?search=`, `?limit=` |
| GET | `/gallery/:id` | Public | A single listing |
| POST | `/gallery` | Admin | Create. Image required |
| PUT | `/gallery/:id` | Admin | Update. Omit the image to keep the current one |
| DELETE | `/gallery/:id` | Admin | Remove the record and its file |

### Contact & dashboard

| Method | Path | Access | Purpose |
| ------ | ---- | ------ | ------- |
| POST | `/contact` | Public | Submit the enquiry form |
| GET | `/contact` | Admin | List enquiries |
| PATCH | `/contact/:id/handled` | Admin | Mark one as dealt with |
| GET | `/stats` | Admin | Dashboard counters |
| GET | `/health` | Public | Uptime check |

### Responses

```json
{ "success": true, "message": "…", "data": { } }
```

Failures carry `details` for validation errors, which drives the inline
messages in the admin forms:

```json
{
  "success": false,
  "message": "Please correct the highlighted fields.",
  "details": [{ "field": "price", "message": "Price cannot be negative." }]
}
```

`200` OK · `201` created · `400` bad request · `401` unauthorized · `404` not
found · `409` conflict · `429` rate limited · `500` server error · `503`
database unreachable.

---

## Two rules worth knowing

**The hero carousel holds exactly three banners.** Enforced in three
independent places: the admin UI disables adding when full, the controller
rejects a fourth with `409`, and `position` carries a unique index so the
database itself refuses one.

**Prices store the original.** `offerPercent` is a separate field and the
discounted figure is a Mongoose virtual (`offerPrice`), so an offer can be
added or removed without ever losing the real price, and no client can round
it differently.

---

## Image uploads

Files are written to `uploads/` and served read-only at `/uploads/…`. The
database stores the relative path, and the front end builds a full URL from
`VITE_API_URL` — so moving the API to another host needs no data migration.

Validation, in order:

1. **Extension** — `.jpg`, `.jpeg`, `.png`, `.webp`
2. **Declared MIME type** — `image/jpeg`, `image/png`, `image/webp`
3. **Size** — `MAX_UPLOAD_SIZE_MB`, 5MB by default
4. **File signature** — the leading bytes are checked against the real JPEG,
   PNG and WEBP magic numbers. Browsers derive an upload's MIME type from its
   file extension, so a text file renamed `photo.png` arrives claiming to be an
   image and passes steps 1–2. This step is what actually catches it.

Stored filenames are always regenerated as `<timestamp>-<random>.<ext>`; the
client-supplied name is never used, which rules out path traversal and
collisions. Files are cleaned up on every path that could strand them — a
failed request, a replaced image, a deleted record — and deletion is restricted
to paths under `uploads/`, so a tampered database value cannot reach anything
else.

`uploads/` is git-ignored: it holds real data, not source.

---

## Deployment

- [ ] `NODE_ENV=production`
- [ ] Replace `JWT_SECRET` with 48+ random bytes
- [ ] Set a strong `ADMIN_PASSWORD`
- [ ] Point `CLIENT_URL` at the real front-end origin — in production only
      listed origins are accepted, with no localhost fallback
- [ ] Set `SERVER_URL` to the public API URL

Run under a process manager (`pm2 start server.js --name nursery-api`) or in a
container, behind nginx or Caddy terminating TLS.

### Railway / Render

There is no `.env` on a hosting platform — set the variables in the dashboard
(Railway: **service → Variables**; Render: **service → Environment**). The app
exits on boot with the list of what is missing rather than starting in a broken
state, so a crash here usually means a variable is absent, not that the code
failed.

Set at least:

```
NODE_ENV=production
MONGODB_URI=<your Atlas connection string, database name before the "?">
JWT_SECRET=<48 random bytes>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<your password>
CLIENT_URL=https://<your-frontend-domain>
SERVER_URL=https://<your-api-domain>
```

`PORT` is injected by the platform — do not set it yourself.

Two things that bite on first deploy:

- **Atlas will refuse the connection** unless the platform's egress IP is
  allowed. Railway and Render use dynamic addresses, so either allow
  `0.0.0.0/0` under **Network Access** (the credentials still gate access) or
  configure a static egress IP if your plan offers one.
- **`CLIENT_URL` must be the real front-end origin.** In production the CORS
  allow-list has no localhost fallback, so leaving it unset makes every browser
  request fail even though the API itself is healthy.

**Uploaded images will not survive a redeploy.** Railway and Render give each
deploy a fresh filesystem, so anything in `uploads/` is lost. Mount a volume,
or move uploads to S3/Cloudinary — `utils/files.js` and `middleware/upload.js`
are the only two files that touch storage.

`uploads/` holds real data and a container filesystem is ephemeral, so mount a
volume or move uploads to S3/Cloudinary — `utils/files.js` and
`middleware/upload.js` are the only two files that touch storage.

---

## License

MIT
