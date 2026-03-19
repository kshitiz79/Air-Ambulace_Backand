// services/translateService.js
// Uses Google Cloud Translation API v2 (Basic)
// Set GOOGLE_TRANSLATE_API_KEY in .env

const { Translate } = require('@google-cloud/translate').v2;

const translate = new Translate({ key: process.env.GOOGLE_TRANSLATE_API_KEY });

/**
 * Translate a single string to the target language.
 * Returns original text if API key is missing or translation fails.
 */
async function translateText(text, targetLang) {
  if (!text || !text.toString().trim()) return text;
  if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
    console.warn('[translateService] GOOGLE_TRANSLATE_API_KEY not set — skipping translation');
    return text;
  }
  try {
    const [translation] = await translate.translate(text.toString(), targetLang);
    return translation;
  } catch (err) {
    console.error(`[translateService] Failed to translate "${text}" to ${targetLang}:`, err.message);
    return text; // fallback to original
  }
}

/**
 * Given an object of field values, translate all non-empty string values
 * to both 'en' and 'hi'. Returns { en: {...}, hi: {...} }.
 *
 * @param {Object} fields  - { fieldName: value, ... }
 * @param {string} sourceLang - 'en' or 'hi' (the language the user typed in)
 */
async function translateFields(fields, sourceLang = 'en') {
  const targetLang = sourceLang === 'hi' ? 'en' : 'hi';

  const translated = {};
  const entries = Object.entries(fields).filter(([, v]) => v && typeof v === 'string' && v.trim());

  await Promise.all(
    entries.map(async ([key, value]) => {
      translated[key] = await translateText(value, targetLang);
    })
  );

  // Build both language objects
  const enFields = {};
  const hiFields = {};

  for (const [key, value] of Object.entries(fields)) {
    if (sourceLang === 'en') {
      enFields[key] = value;
      hiFields[key] = translated[key] ?? value;
    } else {
      hiFields[key] = value;
      enFields[key] = translated[key] ?? value;
    }
  }

  return { en: enFields, hi: hiFields };
}

module.exports = { translateText, translateFields };
