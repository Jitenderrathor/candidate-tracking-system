const testCases = [
  "15 years",
  "8 yers",
  "9 years",
  "3",
  "4yrs",
  "10",
  "5+",
  "1.5",
  "10+ years",
  "1 Year",
  "10yr plus",
  "6 months",
  "fresher",
  "I am a fresher"
];

testCases.forEach(rawExperience => {
  let parsedExperienceYears = 0;
  let extractedExperience = '';
  
  if (/\bfresher\b/i.test(rawExperience)) {
    extractedExperience = 'Fresher';
    parsedExperienceYears = 0;
  } else {
    // Make the unit optional, and allow various spellings like "yers"
    const expMatch = rawExperience.match(/(\d+(?:\s*-\s*\d+)?(?:\.\d+)?\+?(?:\s*(?:months?|years?|yrs?|mos?|yers?))?)/i);
    if (expMatch) {
      extractedExperience = expMatch[1];
      const numStr = extractedExperience.match(/\d+(?:\.\d+)?/g).pop();
      const isMonth = /month|mo/i.test(extractedExperience);
      parsedExperienceYears = parseFloat(numStr);
      if (isMonth) parsedExperienceYears = parsedExperienceYears / 12;
    } else if (!Number.isNaN(Number(rawExperience)) && rawExperience !== '') {
      parsedExperienceYears = Number(rawExperience);
      extractedExperience = `${rawExperience} years`;
    } else {
      extractedExperience = rawExperience;
    }
  }
  
  console.log(`Raw: "${rawExperience}" -> Extracted: "${extractedExperience}", Years: ${parsedExperienceYears}`);
});
