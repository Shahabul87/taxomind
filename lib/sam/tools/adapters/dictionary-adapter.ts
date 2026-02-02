/**
 * Dictionary External Tool Adapter
 *
 * Wraps the Free Dictionary API for word definitions, phonetics, and examples.
 * Free, no API key required. 5-second timeout.
 */

import type { ExternalToolAdapter, ExternalToolMetadata } from './tool-adapter-interface';

export interface DictionaryInput {
  word: string;
  language?: string;
}

export interface DictionaryMeaning {
  partOfSpeech: string;
  definition: string;
  example?: string;
  synonyms?: string[];
}

export interface DictionaryOutput {
  word: string;
  phonetic?: string;
  meanings: DictionaryMeaning[];
  found: boolean;
}

const TIMEOUT_MS = 5000;

export class DictionaryAdapter implements ExternalToolAdapter<DictionaryInput, DictionaryOutput> {
  readonly id = 'adapter-dictionary';
  readonly name = 'Dictionary';
  readonly category = 'reference' as const;
  readonly description = 'Look up word definitions, phonetics, examples, and synonyms.';

  isAvailable(): boolean {
    // Free Dictionary API is always available (no API key)
    return true;
  }

  async execute(input: DictionaryInput): Promise<DictionaryOutput> {
    const { word, language = 'en' } = input;
    const encodedWord = encodeURIComponent(word);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/${language}/${encodedWord}`,
        {
          headers: { 'User-Agent': 'SAM-AI-Tutor/1.0' },
          signal: controller.signal,
        },
      );

      if (response.status === 404) {
        return { word, meanings: [], found: false };
      }

      if (!response.ok) {
        throw new Error(`Dictionary API returned ${response.status}`);
      }

      const data = await response.json();
      const entry = data[0];

      const meanings: DictionaryMeaning[] = [];
      for (const meaning of entry.meanings || []) {
        for (const def of meaning.definitions || []) {
          meanings.push({
            partOfSpeech: meaning.partOfSpeech,
            definition: def.definition,
            example: def.example,
            synonyms: def.synonyms?.slice(0, 5),
          });
        }
      }

      return {
        word: entry.word,
        phonetic: entry.phonetic || entry.phonetics?.[0]?.text,
        meanings,
        found: true,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  getMetadata(): ExternalToolMetadata {
    return {
      requiresApiKey: false,
      serviceUrl: 'https://api.dictionaryapi.dev/api/v2/',
      isFree: true,
      timeoutMs: TIMEOUT_MS,
      rateLimit: 'Generous (no documented limit, be polite)',
    };
  }
}

/** Factory function for convenience */
export function createDictionaryAdapter(): DictionaryAdapter {
  return new DictionaryAdapter();
}
