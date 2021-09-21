/* eslint-disable no-case-declarations */
import { useCallback, useEffect, useState } from "react";
import {
  Achievement,
  AchievementType,
  EmptyAchievement,
} from "../components/achievement/achievement";
import { WSMessage } from "../data";
import { ControllerRole, WSMessageType } from "../constant";

export default function useAchievement(config?: {
  debug?: boolean;
}): [Achievement, (ev: MessageEvent) => void, () => void] {
  const { debug } = config || { debug: false };
  const [achievements, setAchievements] =
    useState<Achievement>(EmptyAchievement);
  const [page, setPage] = useState(0);

  const [allColorColors, setAllColorColors] = useState<Set<string>>(
    new Set<string>()
  );
  const doAllColor = useCallback(
    (msg: WSMessage): number => {
      const newColors = new Set(allColorColors).add(msg.data.color || "");
      setAllColorColors(newColors);
      return newColors.size / 6;
    },
    [allColorColors]
  );

  const [fiveTextIds, setFiveTextIds] = useState<Set<string>>(
    new Set<string>()
  );
  const doFiveText = useCallback(
    (msg: WSMessage): number => {
      if (!msg.data.text) return 0;
      const newIds = new Set(fiveTextIds).add(`${page}:${msg.data.id || 0}`);
      setFiveTextIds(newIds);
      return newIds.size / 5;
    },
    [fiveTextIds, page]
  );

  const [tenTextIds, setTenTextIds] = useState<Set<string>>(new Set<string>());
  const doTenText = useCallback(
    (msg: WSMessage): number => {
      if (!msg.data.text) return 0;
      const newIds = new Set(tenTextIds).add(`${page}:${msg.data.id || 0}`);
      setTenTextIds(newIds);
      return newIds.size / 10;
    },
    [tenTextIds, page]
  );

  const [onePageCount, setOnePageCount] = useState<number>(0);
  const doOnePage = useCallback((): number => {
    const newCount = onePageCount + 1;
    setOnePageCount(newCount);
    return newCount / 1;
  }, [onePageCount]);

  const [threePageCount, setThreePageCount] = useState<number>(0);
  const doThreePage = useCallback((): number => {
    const newCount = threePageCount + 1;
    setThreePageCount(newCount);
    return newCount / 3;
  }, [threePageCount]);

  const [fivePageCount, setFivePageCount] = useState<number>(0);
  const doFivePage = useCallback((): number => {
    const newCount = fivePageCount + 1;
    setFivePageCount(newCount);
    return newCount / 5;
  }, [fivePageCount]);

  const checkAchievement = useCallback(
    (type: AchievementType, msg?: WSMessage) => {
      const progress = achievements[type];
      let newProgress = 0;
      if (progress < 1) {
        switch (type) {
          case AchievementType.AllColor:
            if (
              msg &&
              (msg.role === ControllerRole.Character ||
                msg.role === ControllerRole.Background)
            ) {
              newProgress = doAllColor(msg);
            }
            break;
          case AchievementType.FiveText:
            if (msg && msg.role === ControllerRole.Story) {
              newProgress = doFiveText(msg);
            }
            break;
          case AchievementType.TenText:
            if (msg && msg.role === ControllerRole.Story) {
              newProgress = doTenText(msg);
            }
            break;
          case AchievementType.OnePage:
            newProgress = doOnePage();
            break;
          case AchievementType.ThreePage:
            newProgress = doThreePage();
            break;
          case AchievementType.FivePage:
            newProgress = doFivePage();
            break;
          default:
        }
      }
      if (newProgress > progress)
        setAchievements((prev) => ({
          ...prev,
          [type]: newProgress,
        }));
    },
    [
      achievements,
      doAllColor,
      doFivePage,
      doFiveText,
      doOnePage,
      doTenText,
      doThreePage,
    ]
  );

  const achievementHandler = (ev: MessageEvent) => {
    try {
      const msg = JSON.parse(ev.data) as WSMessage;
      switch (msg.type) {
        case WSMessageType.Paint:
          checkAchievement(AchievementType.AllColor, msg);
          break;
        case WSMessageType.Text:
          checkAchievement(AchievementType.FiveText, msg);
          checkAchievement(AchievementType.TenText, msg);
          break;
        default:
      }
    } catch (e) {
      console.error(e);
    }
  };

  const nextPageHandler = () => {
    checkAchievement(AchievementType.OnePage);
    checkAchievement(AchievementType.ThreePage);
    checkAchievement(AchievementType.FivePage);
    setPage(page + 1);
  };

  useEffect(() => {
    if (debug) console.log(achievements);
  }, [achievements, debug]);

  return [achievements, achievementHandler, nextPageHandler];
}
