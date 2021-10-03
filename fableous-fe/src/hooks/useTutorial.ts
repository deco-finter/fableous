import { useCallback, useEffect, useState } from "react";
import { CallBackProps, STATUS } from "react-joyride";
import { useAdditionalNav } from "../components/AdditionalNavProvider";
import { getLocalStorage, ONE_DAY, setLocalStorage } from "../localStorage";
import { navbarTutorialButtonId } from "../tutorialTargetIds";

/**
 * Auto start tutorial upon callback returning true,
 * records usage timestamp and do not auto start it again for specified duration.
 * Navbar will have tutorial button whenever callback returns true.
 *
 * @param {() => boolean} shouldStartCallback React callback that returns true when tutorial should start
 * @param {string} localStorageKey un-namespaced localstorage key to store usage timestamp
 * @param {number} duration
 */
export default function useTutorial(config: {
  shouldStartCallback: () => boolean;
  localStorageKey: string;
  duration?: number;
}): [
  boolean,
  React.Dispatch<React.SetStateAction<boolean>>,
  (data: CallBackProps) => void
] {
  const { shouldStartCallback, localStorageKey, duration = ONE_DAY } = config;

  const [isRunning, setIsRunning] = useState(false);
  const [isNavButtonShown, setIsNavButtonShown] = useState(false);
  const [, setNavs, clearNavs] = useAdditionalNav();

  useEffect(() => {
    setIsNavButtonShown(shouldStartCallback());
  }, [shouldStartCallback]);

  // auto start tutorial when shouldStartCallback becomes true
  useEffect(() => {
    if (shouldStartCallback() && getLocalStorage(localStorageKey) === null) {
      setIsRunning(true);
    }
  }, [shouldStartCallback, localStorageKey]);

  // show tutorial button in navbar
  useEffect(() => {
    if (isNavButtonShown) {
      setNavs([
        {
          icon: "help",
          label: "Tutorial",
          buttonProps: {
            id: navbarTutorialButtonId,
            onClick: () => setIsRunning(true),
            disabled: isRunning,
          },
        },
      ]);

      return () => {
        clearNavs();
      };
    }

    return () => {};
  }, [isNavButtonShown, isRunning, setNavs, clearNavs]);

  // remember tutorial use and do not auto start it for specified duration
  useEffect(() => {
    if (isRunning) {
      // set value to be empty string to differentiate from null
      setLocalStorage(localStorageKey, "", duration);
    }
  }, [isRunning, localStorageKey, duration]);

  // handler to be passed to Joyride.callback to close it on skip or finish
  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status } = data;
      const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

      if (finishedStatuses.includes(status)) {
        setIsRunning(false);
      }
    },
    [setIsRunning]
  );

  return [isRunning, setIsRunning, handleJoyrideCallback];
}
