/**
 * Prompt length validation to prevent unbounded AI token consumption.
 *
 * Protects against excessively large prompts being sent to AI providers,
 * which could result in high costs or timeouts.
 */

/** Default max characters (~25K tokens) */
const DEFAULT_MAX_CHARS = 100_000;

/**
 * Validate that a prompt does not exceed the maximum character length.
 * Throws an error if the prompt is too long.
 *
 * @param prompt - The prompt string to validate
 * @param maxChars - Maximum allowed characters (default: 100,000)
 * @throws Error if prompt exceeds maxChars
 */
export function validatePromptLength(
  prompt: string,
  maxChars: number = DEFAULT_MAX_CHARS
): void {
  if (prompt.length > maxChars) {
    throw new PromptTooLongError(prompt.length, maxChars);
  }
}

/**
 * Truncate a prompt to the maximum character length, preserving a trailing
 * indicator that truncation occurred.
 *
 * @param prompt - The prompt string to truncate
 * @param maxChars - Maximum allowed characters (default: 100,000)
 * @returns The truncated prompt
 */
export function truncatePrompt(
  prompt: string,
  maxChars: number = DEFAULT_MAX_CHARS
): string {
  if (prompt.length <= maxChars) {
    return prompt;
  }

  const suffix = '\n\n[Content truncated due to length]';
  return prompt.slice(0, maxChars - suffix.length) + suffix;
}

export class PromptTooLongError extends Error {
  public readonly actualLength: number;
  public readonly maxLength: number;

  constructor(actualLength: number, maxLength: number) {
    super(
      `Prompt too long: ${actualLength.toLocaleString()} characters exceeds maximum of ${maxLength.toLocaleString()}`
    );
    this.name = 'PromptTooLongError';
    this.actualLength = actualLength;
    this.maxLength = maxLength;
  }
}
