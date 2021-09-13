import { useCallback, useEffect, useState } from "react";
import { AchievementType } from "../achievement";
import { WSMessage } from "../data";
import { ControllerRole, WSMessageType } from "../constant";

export default function useAchievement(config?: {
  debug?: boolean;
}): [Set<AchievementType>, (ev: MessageEvent) => void, () => void] {
  const { debug } = config || { debug: false };
  const [achievements, setAchievements] = useState<Set<AchievementType>>(
    new Set<AchievementType>()
  );

  const [allColorColors, setAllColorColors] = useState<Set<string>>(
    new Set<string>()
  );
  const doAllColor = useCallback(
    (msg: WSMessage): boolean => {
      const newColors = new Set(allColorColors).add(msg.data.color || "");
      setAllColorColors(newColors);
      return newColors.size >= 6;
    },
    [allColorColors]
  );

  const [fiveTextIds, setFiveTextIds] = useState<Set<number>>(
    new Set<number>()
  );
  const doFiveText = useCallback(
    (msg: WSMessage): boolean => {
      if (!msg.data.text) return false;
      const newIds = new Set(fiveTextIds).add(msg.data.id || 0);
      setFiveTextIds(newIds);
      return newIds.size >= 5;
    },
    [fiveTextIds]
  );

  const [tenTextIds, setTenTextIds] = useState<Set<number>>(new Set<number>());
  const doTenText = useCallback(
    (msg: WSMessage): boolean => {
      if (!msg.data.text) return false;
      const newIds = new Set(tenTextIds).add(msg.data.id || 0);
      setTenTextIds(newIds);
      return newIds.size >= 10;
    },
    [tenTextIds]
  );

  const [onePageCount, setOnePageCount] = useState<number>(0);
  const doOnePage = useCallback((): boolean => {
    const newCount = onePageCount + 1;
    setOnePageCount(newCount);
    return newCount >= 1;
  }, [onePageCount]);

  const [threePageCount, setThreePageCount] = useState<number>(0);
  const doThreePage = useCallback((): boolean => {
    const newCount = threePageCount + 1;
    setThreePageCount(newCount);
    return newCount >= 3;
  }, [threePageCount]);

  const [fivePageCount, setFivePageCount] = useState<number>(0);
  const doFivePage = useCallback((): boolean => {
    const newCount = fivePageCount + 1;
    setFivePageCount(newCount);
    return newCount >= 5;
  }, [fivePageCount]);

  const checkAchievement = useCallback(
    (type: AchievementType, msg?: WSMessage) => {
      if (!achievements.has(type)) {
        switch (type) {
          case AchievementType.AllColor:
            if (
              msg &&
              (msg.role === ControllerRole.Character ||
                msg.role === ControllerRole.Background)
            ) {
              if (doAllColor(msg))
                setAchievements((prev) => {
                  return new Set(prev).add(type);
                });
            }
            break;
          case AchievementType.FiveText:
            if (msg && msg.role === ControllerRole.Story) {
              if (doFiveText(msg))
                setAchievements((prev) => {
                  return new Set(prev).add(type);
                });
            }
            break;
          case AchievementType.TenText:
            if (msg && msg.role === ControllerRole.Story) {
              if (doTenText(msg))
                setAchievements((prev) => {
                  return new Set(prev).add(type);
                });
            }
            break;
          case AchievementType.OnePage:
            if (doOnePage())
              setAchievements((prev) => {
                return new Set(prev).add(type);
              });
            break;
          case AchievementType.ThreePage:
            if (doThreePage())
              setAchievements((prev) => {
                return new Set(prev).add(type);
              });
            break;
          case AchievementType.FivePage:
            if (doFivePage())
              setAchievements((prev) => {
                return new Set(prev).add(type);
              });
            break;
          default:
        }
      }
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
  };

  useEffect(() => {
    if (debug) console.log(achievements);
  }, [achievements, debug]);

  return [achievements, achievementHandler, nextPageHandler];
}
