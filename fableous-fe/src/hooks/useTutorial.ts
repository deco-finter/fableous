import { useCallback, useEffect, useMemo, useState } from "react";
import { CallBackProps, STATUS } from "react-joyride";
import { useCustomNav } from "../components/CustomNavProvider";
import { getLocalStorage, ONE_DAY, setLocalStorage } from "../storage";
import { TutorialTargetId } from "../tutorialTargetIds";

enum TutorialState {
  Off = 0,
  AutomaticallyStarted,
  ManuallyStarted,
}

/**
 * Auto start tutorial upon showTutorialButton changing to true,
 * records usage timestamp and do not auto start it again for specified duration.
 * Navbar will have tutorial button whenever showTutorialButton is true.
 *
 * @param {boolean} showTutorialButton true when tutorial is accessible
 * @param {string} localStorageKey un-namespaced localstorage key to store usage timestamp
 * @param {() => {}} onManualStartCallback custom logic to run on navbar tutorial button click
 * @param {number} duration duration in milliseconds to not automatically start tutorial from most recent use
 *
 * @return {[boolean, (data: CallBackProps) => void]} tutorial running state and callback function to pass to Joyride component
 */
export default function useTutorial(config: {
  showTutorialButton: boolean;
  localStorageKey: string;
  onManualStartCallback: () => void;
  duration?: number;
}): [boolean, (data: CallBackProps) => void] {
  const {
    showTutorialButton,
    localStorageKey,
    onManualStartCallback,
    duration = ONE_DAY,
  } = config;

  const [tutorialState, setTutorialState] = useState<TutorialState>(
    TutorialState.Off
  );
  const [, setAdditionalNavs] = useCustomNav();

  // state to expose is only boolean
  const isRunning = useMemo(() => {
    return tutorialState !== TutorialState.Off;
  }, [tutorialState]);

  // auto start tutorial when showTutorialButton becomes true
  useEffect(() => {
    if (showTutorialButton && getLocalStorage(localStorageKey) === null) {
      setTutorialState(TutorialState.AutomaticallyStarted);
    }

    if (!showTutorialButton) {
      setTutorialState(TutorialState.Off);
    }
  }, [showTutorialButton, localStorageKey]);

  // show tutorial button in navbar anytime showTutorialButton is true
  useEffect(() => {
    if (showTutorialButton) {
      setAdditionalNavs([
        {
          icon: "help",
          label: "Tutorial",
          buttonProps: {
            id: TutorialTargetId.NavbarTutorial,
            onClick: () => {
              setTutorialState(TutorialState.ManuallyStarted);
            },
            disabled: isRunning,
            classes: { root: "mr-4" },
          },
        },
      ]);

      return () => {
        setAdditionalNavs([]);
      };
    }

    return () => {};
  }, [showTutorialButton, isRunning, setAdditionalNavs, onManualStartCallback]);

  // remember tutorial use
  useEffect(() => {
    if (isRunning) {
      // set value to be empty string to differentiate from null
      setLocalStorage(localStorageKey, "", duration);
    }
  }, [isRunning, localStorageKey, duration]);

  // exec passed custom logic on manually starting tutorial
  useEffect(() => {
    if (tutorialState === TutorialState.ManuallyStarted) {
      onManualStartCallback();
    }
  }, [tutorialState, onManualStartCallback]);

  // handler to be passed to Joyride.callback to close it on skip or finish
  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status } = data;
      const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

      if (finishedStatuses.includes(status)) {
        setTutorialState(TutorialState.Off);
      }
    },
    [setTutorialState]
  );

  return [isRunning, handleJoyrideCallback];
}
