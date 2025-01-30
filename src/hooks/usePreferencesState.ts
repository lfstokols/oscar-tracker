import {useState} from 'react';
import {isKeyInObject, objectKeys} from '../utils/commonUtils';
import {warnToConsole} from '../utils/Logger';
import {DEFAULT_PREFERENCES} from '../config/GlobalConstants';

export default function usePreferencesState(): [
  Preferences,
  (pref: Preferences) => void,
] {
  const [preferences, setPreferences] = useState<Preferences>(
    getPreferenceStateAtStartup(DEFAULT_PREFERENCES),
  );

  //* Set a new version of setPreferences that also updates the localStorage
  const newSetPreferences = upgradeSetPreferences(setPreferences);

  return [preferences, newSetPreferences];
}

//* Returns a new version of setPreferences that also updates the localStorage
//* Similar in spirit to useUpgradeSetActiveUserId, but it should be simpler
//* because it doesn't need to coordinate with any backend data
function upgradeSetPreferences(
  setPreferences: (pref: Preferences) => void,
): (pref: Preferences) => void {
  return (pref: Preferences) => {
    setPreferences(pref);
    localStorage.setItem('preferences', JSON.stringify(pref));
  };
}

function getPreferenceStateAtStartup(
  defaultPreferences: Preferences,
): Preferences {
  const preferences = localStorage.getItem('preferences');
  if (!preferences) {
    return defaultPreferences;
  }

  const storedValsUnsafe = JSON.parse(preferences) as unknown;
  const storedVals =
    storedValsUnsafe != null && typeof storedValsUnsafe === 'object'
      ? storedValsUnsafe
      : {};

  if (!objectKeys(storedVals).every(key => key in defaultPreferences)) {
    const actual = objectKeys(storedVals).join(', ');
    const expected = objectKeys(defaultPreferences).join(', ');
    warnToConsole(
      `The preferences in localStorage are invalid. \n
        They are labeled {${actual}} \n
        but I was expecting {${expected}}.`,
    );
    return defaultPreferences;
  }

  const bestGuess = Object.fromEntries(
    objectKeys(defaultPreferences).map(key => {
      if (isKeyInObject(key, storedVals)) {
        return [key, storedVals[key]];
      }
      return [key, defaultPreferences[key]];
    }),
  ) as Preferences;

  return bestGuess;
}
