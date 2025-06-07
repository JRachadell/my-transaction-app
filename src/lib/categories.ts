// Type for our rules object. The value is an array that can hold strings or RegExp objects.
type CategoryRules = {
  [category: string]: (string | RegExp)[];
};

/**
 * Define your categorization rules here.
 * The system will check rules in the order they are defined.
 * - For simple matching, use a string (case-insensitive).
 * - For more complex matching, use a Regular Expression.
 *
 * Example:
 * const CATEGORY_RULES: CategoryRules = {
 *   'Coffee': ['STARBUCKS', 'PEETS', 'PHILZ'],
 *   'Groceries': ["WHOLE FOODS", "Trader Joe's", "SAFEWAY"],
 *   'Tech Services': [/\bAWS\b/i, /AMAZON.COM\*WEBSERVICES/i] // Use \b for whole word matching
 * };
 */
const CATEGORY_RULES: CategoryRules = {
  // TODO: Fill this object with your own categories and keywords.
};

/**
 * Categorizes a transaction based on its description.
 * @param description The transaction description string.
 * @returns The determined category name or "Uncategorized".
 */
export function getCategory(description: string): string {
  const lowerCaseDescription = description.toLowerCase();

  for (const [category, rules] of Object.entries(CATEGORY_RULES)) {
    for (const rule of rules) {
      if (typeof rule === 'string') {
        // Simple string matching (case-insensitive)
        if (lowerCaseDescription.includes(rule.toLowerCase())) {
          return category;
        }
      } else if (rule instanceof RegExp) {
        // Regular expression matching
        if (rule.test(description)) {
          return category;
        }
      }
    }
  }

  return 'Uncategorized'; // Default category if no match is found
}