import * as Person from '../domains/Person.js';
import * as ReadingList from '../domains/ReadingList.js';

// Returns a unified, deduplicated, suppression-filtered, sorted list of person names
// drawn from both the People domain and ReadingList recommenders.
// Used by any autocomplete field that accepts a person's name.
export function getPersonNameOptions() {
  const suppressed = Person.getSuppressedNames();
  const names = new Set([
    ...Person.getAllUniquePersonNamesRaw(),
    ...ReadingList.getRecommenderOptions(),
  ]);
  return [...names]
    .filter(name => !suppressed.has(name))
    .sort((a, b) => a.localeCompare(b));
}
