// Type for our rules object. The value is an array that can hold strings or RegExp objects.
type CategoryRules = {
  [category: string]: (string | RegExp)[];
};

/**
 * Define your categorization rules here.
 * The system will check rules in the order they are defined.
 * - For simple matching, use a string (case-insensitive).
 * - For more complex matching, use a Regular Expression.
 */
export const CATEGORY_RULES: CategoryRules = {
  'Food': ["CHIPOTLE", "COFFEE BEAN", "MCDONALDS", "UBER EATS", "PIZZA", "DONUT", "TACO BELL", "RESTAURANT", "PANDA EXPRESS", "BURGER", "DOORDASH", 'STARBUCKS', "JIMMY JOHNS"],
  'Services': ['NETFLIX', 'VERIZON', 'SPOTIFY', 'ADOBE', 'GITHUB', 'AMAZON PRIME', 'SUBSCRIPTION', 'STEAM GAMES'],
  'Groceries': ["WHOLE FOODS", "TRADER JOE'S", "TRADER JOES", "SAFEWAY", "COSTCO", "KROGER", "GROCERY", "GROCERIES", "MEAL KIT"],
  'Transportation': ['GAS STATION', 'SHELL', 'CHEVRON', 'UBER RIDE', 'LYFT', 'CAR', 'TRAIN', 'FLIGHT', 'BUS'],
  'Work': ['SALARY', 'TAX', 'WORK'],
  'Transfers': ["PAYPAL", "VENMO"],
  'Online Shopping': ['AMAZON.COM', 'FLOWERS.COM', '.COM'],
  'Home': ['RENT', 'HOME DEPOT', "ELECTRIC BILL", "LOWE'S", 'GAS BILL'],
  'Shopping': ['TARGET', 'BEST BUY', 'GAMES', "MACY'S"],
  'Health': ['CVS', 'WALGREENS', 'PHARMACY', 'HEALTH']
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
        if (lowerCaseDescription.includes(rule.toLowerCase())) {
          return category;
        }
      } else if (rule instanceof RegExp) {
        if (rule.test(description)) {
          return category;
        }
      }
    }
  }

  return 'Uncategorized';
}