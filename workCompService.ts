import { GoogleGenAI, Type } from '@google/genai';

export interface WorkCompCode {
  code: string;
  description: string;
}

const STORAGE_KEY = 'workCompCodesCache';
const CACHE_EXPIRATION_MS = 1000 * 60 * 60 * 24 * 7; // 1 week

interface CachedData {
  timestamp: number;
  codes: WorkCompCode[];
}

/**
 * Fetches a list of common workers' compensation codes from the Gemini API.
 * This is intended to populate a cache or provide a list for typeahead suggestions.
 * @returns {Promise<WorkCompCode[]>} A promise that resolves to an array of work comp codes.
 */
async function fetchCodesFromGemini(): Promise<WorkCompCode[]> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "List 100 of the most common workers compensation class codes used in the United States. For each code, provide a brief, clear description of the business or operation it represents.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            codes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: {
                    type: Type.STRING,
                    description: "The 4-digit class code.",
                  },
                  description: {
                    type: Type.STRING,
                    description: "A brief description of the class code.",
                  },
                },
                required: ["code", "description"],
              },
            },
          },
          required: ["codes"],
        },
      },
    });

    const jsonString = response.text;
    const result = JSON.parse(jsonString);
    if (result && Array.isArray(result.codes)) {
        return result.codes;
    }
    console.error("Gemini response was not in the expected format:", result);
    return [];
  } catch (error) {
    console.error("Error fetching work comp codes from Gemini:", error);
    return [];
  }
}

/**
 * Retrieves workers' compensation codes, utilizing a local cache to avoid excessive API calls.
 * If the cache is valid, it returns the cached data. Otherwise, it fetches new data
 * from the Gemini API and updates the cache.
 * @returns {Promise<WorkCompCode[]>} A promise that resolves to an array of work comp codes.
 */
export async function getWorkCompCodes(): Promise<WorkCompCode[]> {
  // Try to get data from localStorage cache first.
  const cachedItem = localStorage.getItem(STORAGE_KEY);
  if (cachedItem) {
    try {
      const cachedData: CachedData = JSON.parse(cachedItem);
      // Check if the cached data is still fresh (not expired).
      if (Date.now() - cachedData.timestamp < CACHE_EXPIRATION_MS) {
        return cachedData.codes;
      }
    } catch (e) {
      console.error("Failed to parse cached work comp codes", e);
      localStorage.removeItem(STORAGE_KEY); // Clear corrupted cache to allow for a fresh fetch.
    }
  }

  // If cache is missing or expired, fetch new codes from the API.
  const codes = await fetchCodesFromGemini();

  // If the fetch was successful, update the cache in localStorage with a new timestamp.
  if (codes.length > 0) {
      const dataToCache: CachedData = {
          timestamp: Date.now(),
          codes: codes,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToCache));
  }
  
  return codes;
}
