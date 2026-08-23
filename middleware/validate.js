const ApiError = require('../utils/ApiError');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const PHONE_PATTERN = /^[0-9+()\-\s]{7,20}$/;

const asString = (value) => (typeof value === 'string' ? value.trim() : '');

/**
 * Small hand-rolled validator. Each rule pushes a `{ field, message }` entry
 * and the collected list is returned to the client as `error.details`.
 */
function collect(rules) {
  const errors = [];
  rules.forEach(([condition, field, message]) => {
    if (condition) errors.push({ field, message });
  });
  return errors;
}

function reject(errors) {
  if (errors.length) {
    throw ApiError.badRequest('Please correct the highlighted fields.', errors);
  }
}

function validateLogin(req, _res, next) {
  const username = asString(req.body.username);
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  reject(
    collect([
      [!username, 'username', 'Enter your username.'],
      [!password, 'password', 'Enter your password.'],
      [password.length > 200, 'password', 'Password is too long.'],
    ])
  );

  req.body.username = username.toLowerCase();
  req.body.password = password;
  next();
}

function validateGalleryItem({ partial = false } = {}) {
  return (req, _res, next) => {
    const errors = [];
    const has = (key) => req.body[key] !== undefined && req.body[key] !== '';

    if (!partial || has('name')) {
      const name = asString(req.body.name);
      if (name.length < 2) errors.push({ field: 'name', message: 'Enter a product name of at least 2 characters.' });
      else if (name.length > 90) errors.push({ field: 'name', message: 'Product name must be 90 characters or fewer.' });
      else req.body.name = name;
    }

    if (!partial || has('price')) {
      const price = Number(req.body.price);
      if (!Number.isFinite(price)) errors.push({ field: 'price', message: 'Enter the price as a number.' });
      else if (price < 0) errors.push({ field: 'price', message: 'Price cannot be negative.' });
      else if (price > 10000000) errors.push({ field: 'price', message: 'Price is out of range.' });
      else req.body.price = Math.round(price * 100) / 100;
    }

    // Optional on create as well as update: no offer is the normal case.
    if (has('offerPercent')) {
      const offer = Number(req.body.offerPercent);
      if (!Number.isFinite(offer)) {
        errors.push({ field: 'offerPercent', message: 'Enter the offer as a number.' });
      } else if (offer < 0) {
        errors.push({ field: 'offerPercent', message: 'Offer cannot be negative.' });
      } else if (offer > 95) {
        errors.push({ field: 'offerPercent', message: 'Offer cannot be more than 95%.' });
      } else {
        req.body.offerPercent = Math.round(offer);
      }
    } else if (req.body.offerPercent === '' || req.body.offerPercent === null) {
      // A cleared field means "no offer", not "leave it alone".
      req.body.offerPercent = 0;
    }

    if (!partial || has('description')) {
      const description = asString(req.body.description);
      if (description.length < 10) errors.push({ field: 'description', message: 'Write a description of at least 10 characters.' });
      else if (description.length > 2000) errors.push({ field: 'description', message: 'Description must be 2000 characters or fewer.' });
      else req.body.description = description;
    }

    if (has('category')) req.body.category = asString(req.body.category);
    if (req.body.featured !== undefined) {
      req.body.featured = req.body.featured === true || req.body.featured === 'true';
    }

    reject(errors);
    next();
  };
}

function validateBanner({ partial = false } = {}) {
  return (req, _res, next) => {
    const errors = [];

    if (req.body.position !== undefined && req.body.position !== '') {
      const position = Number(req.body.position);
      if (!Number.isInteger(position) || position < 1 || position > 3) {
        errors.push({ field: 'position', message: 'Banner position must be 1, 2 or 3.' });
      } else {
        req.body.position = position;
      }
    } else if (!partial) {
      req.body.position = undefined; // controller assigns the next free slot
    }

    ['title', 'subtitle', 'alt'].forEach((field) => {
      if (req.body[field] !== undefined) req.body[field] = asString(req.body[field]);
    });

    if (req.body.title && req.body.title.length > 90) {
      errors.push({ field: 'title', message: 'Heading must be 90 characters or fewer.' });
    }
    if (req.body.subtitle && req.body.subtitle.length > 200) {
      errors.push({ field: 'subtitle', message: 'Supporting text must be 200 characters or fewer.' });
    }

    reject(errors);
    next();
  };
}

function validateContact(req, _res, next) {
  const name = asString(req.body.name);
  const email = asString(req.body.email);
  const phone = asString(req.body.phone);
  const message = asString(req.body.message);

  reject(
    collect([
      [name.length < 2, 'name', 'Enter your name.'],
      [name.length > 80, 'name', 'Name must be 80 characters or fewer.'],
      [!EMAIL_PATTERN.test(email), 'email', 'Enter a valid email address.'],
      [Boolean(phone) && !PHONE_PATTERN.test(phone), 'phone', 'Enter a valid phone number.'],
      [message.length < 10, 'message', 'Tell us a little more — at least 10 characters.'],
      [message.length > 2000, 'message', 'Message must be 2000 characters or fewer.'],
    ])
  );

  Object.assign(req.body, { name, email: email.toLowerCase(), phone, message });
  next();
}

module.exports = { validateLogin, validateGalleryItem, validateBanner, validateContact };
