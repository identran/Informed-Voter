/**
 * Content validation utilities for candidate profiles
 * Ensures compliance with platform rules:
 * - No party affiliation mentions
 * - No opponent mentions
 * - Length limits enforced
 */

const PROHIBITED_WORDS = [
  // Party affiliations
  'democrat',
  'republican',
  'libertarian',
  'green party',
  'independent party',
  'gop',
  'dnc',
  'rnc',

  // Opponent references
  'opponent',
  'my opponent',
  'the other candidate',
  'my competitor',
  'running against',
  'versus',
  ' vs ',
];

const PROHIBITED_PATTERNS = [
  /\b(democrat|republican|gop)\b/gi,
  /\bopponent\b/gi,
  /\bmy\s+(opponent|competitor|rival)\b/gi,
  /\brunning\s+against\b/gi,
];

export interface ContentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateCandidateContent = (content: {
  bio?: string;
  goals?: string;
  reasonForRunning?: string;
}): ContentValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check bio length (max ~1000 words or ~6000 characters)
  if (content.bio) {
    if (content.bio.length > 6000) {
      errors.push('Bio exceeds maximum length of 6000 characters');
    }

    const wordCount = content.bio.split(/\s+/).length;
    if (wordCount > 1000) {
      errors.push('Bio exceeds maximum word count of 1000 words');
    }

    // Check for prohibited content
    const bioViolations = checkProhibitedContent(content.bio);
    errors.push(...bioViolations);
  }

  // Check goals length
  if (content.goals) {
    if (content.goals.length > 3000) {
      errors.push('Goals section exceeds maximum length of 3000 characters');
    }

    const goalsViolations = checkProhibitedContent(content.goals);
    errors.push(...goalsViolations);
  }

  // Check reason for running
  if (content.reasonForRunning) {
    if (content.reasonForRunning.length > 2000) {
      errors.push('Reason for running exceeds maximum length of 2000 characters');
    }

    const reasonViolations = checkProhibitedContent(content.reasonForRunning);
    errors.push(...reasonViolations);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

const checkProhibitedContent = (text: string): string[] => {
  const violations: string[] = [];
  const lowerText = text.toLowerCase();

  // Check for prohibited words
  for (const word of PROHIBITED_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      violations.push(`Prohibited content detected: "${word}"`);
    }
  }

  // Check for prohibited patterns
  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(text)) {
      violations.push(`Prohibited content pattern detected: ${pattern.source}`);
    }
  }

  return violations;
};

export const sanitizeContent = (text: string): string => {
  // Remove excessive whitespace
  let sanitized = text.replace(/\s+/g, ' ').trim();

  // Remove potentially harmful HTML/script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  return sanitized;
};

export const checkWordCount = (text: string): number => {
  return text.split(/\s+/).filter(word => word.length > 0).length;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;

  // Try to truncate at last complete word
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
};
