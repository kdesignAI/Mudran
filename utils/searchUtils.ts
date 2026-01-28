
/**
 * Performs an enhanced search on an array of objects.
 * It matches if all words in the search term exist in any of the specified keys.
 * Supports partial matching, case-insensitivity, and phone number normalization.
 */
export const smartSearch = <T>(items: T[], term: string, keys: string[]): T[] => {
  if (!term) return items;

  const lowerTerm = term.toLowerCase().trim();
  const searchParts = lowerTerm.split(/\s+/).filter(part => part.length > 0);

  if (searchParts.length === 0) return items;

  return items.filter(item => {
    // Construct a single searchable string from all specified keys
    const itemStrings = keys.map(key => {
      const value = key.split('.').reduce((obj: any, k) => obj?.[k], item);
      const strVal = String(value || '').toLowerCase();
      
      // If the field is a phone number, create a normalized version (digits only)
      if (key.toLowerCase().includes('phone') || /^\+?[\d\s-]{7,}$/.test(strVal)) {
        return strVal + ' ' + strVal.replace(/\D/g, '');
      }
      return strVal;
    });

    const combinedItemString = itemStrings.join(' ');

    // Check if every part of the search term exists in the item string
    return searchParts.every(part => {
      // For phone number parts, also check against normalized digits
      const normalizedPart = part.replace(/\D/g, '');
      if (normalizedPart.length >= 3 && combinedItemString.includes(normalizedPart)) {
        return true;
      }
      return combinedItemString.includes(part);
    });
  });
};
