const genderDetection = require('gender-detection-from-name');

/**
 * Fallback to local gender detection
 */
const detectGenderLocal = (firstName) => {
  if (!firstName) return 'Male';
  const result = genderDetection.getGender(firstName);
  if (result === 'female') return 'Female';
  return 'Male';
};

/**
 * Predict genders for a list of names using genderize.io in batches
 * Falls back to local detection if the API fails or rate limits.
 * Returns a map of firstName -> 'Male' | 'Female'
 */
const bulkPredictGenders = async (names) => {
  const uniqueNames = [...new Set(names.filter(Boolean))];
  const genderMap = new Map();

  // Process in batches of 10
  const BATCH_SIZE = 10;
  for (let i = 0; i < uniqueNames.length; i += BATCH_SIZE) {
    const batch = uniqueNames.slice(i, i + BATCH_SIZE);
    try {
      const url = new URL('https://api.genderize.io/');
      batch.forEach(name => url.searchParams.append('name[]', name));
      
      const response = await fetch(url.toString(), {
        headers: { 'Accept': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`Genderize API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const results = Array.isArray(data) ? data : [data];
      
      results.forEach(result => {
        if (result && result.name) {
          if (result.gender === 'female') {
            genderMap.set(result.name, 'Female');
          } else if (result.gender === 'male') {
            genderMap.set(result.name, 'Male');
          } else {
            // Unpredictable by API
            genderMap.set(result.name, detectGenderLocal(result.name));
          }
        }
      });
    } catch (error) {
      console.warn(`[Gender Prediction] Batch failed, using local fallback: ${error.message}`);
      // Fallback for this batch
      batch.forEach(name => {
        genderMap.set(name, detectGenderLocal(name));
      });
    }
  }

  return genderMap;
};

/**
 * Simple wrapper for a single prediction combining local fallback
 */
const detectGenderWithCache = (firstName, cache = new Map()) => {
  if (!firstName) return 'Male';
  if (cache.has(firstName)) {
    return cache.get(firstName);
  }
  return detectGenderLocal(firstName);
};

module.exports = {
  detectGenderLocal,
  bulkPredictGenders,
  detectGenderWithCache,
};
