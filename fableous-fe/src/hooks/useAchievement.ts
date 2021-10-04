/* eslint-disable no-case-declarations */
import { useCallback, useEffect, useState } from "react";
import {
  Achievement,
  AchievementType,
  EmptyAchievement,
} from "../components/achievement/achievement";
import { proto as pb } from "../proto/message_pb";

export default function useAchievement(config?: {
  debug?: boolean;
}): [Achievement, (ev: MessageEvent) => void, () => void, () => void] {
  const { debug } = config || { debug: false };
  const [achievements, setAchievements] =
    useState<Achievement>(EmptyAchievement);
  const [page, setPage] = useState(0);

  const [allColorColors, setAllColorColors] = useState<Set<string>>(
    new Set<string>()
  );
  const doAllColor = useCallback(
    (msg: pb.WSMessage): number => {
      const newColors = new Set(allColorColors).add(msg.paint?.color as string);
      setAllColorColors(newColors);
      return newColors.size / 6;
    },
    [allColorColors]
  );

  const [fiveTextIds, setFiveTextIds] = useState<Set<string>>(
    new Set<string>()
  );
  const doFiveText = useCallback(
    (msg: pb.WSMessage): number => {
      if (!msg.paint?.text) return 0;
      const newIds = new Set(fiveTextIds).add(`${page}:${msg.paint?.id}`);
      setFiveTextIds(newIds);
      return newIds.size / 5;
    },
    [fiveTextIds, page]
  );

  const [tenTextIds, setTenTextIds] = useState<Set<string>>(new Set<string>());
  const doTenText = useCallback(
    (msg: pb.WSMessage): number => {
      if (!msg.paint?.text) return 0;
      const newIds = new Set(tenTextIds).add(`${page}:${msg.paint?.id}`);
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
    (type: AchievementType, msg?: pb.WSMessage) => {
      const progress = achievements[type];
      let newProgress = 0;
      if (progress < 1) {
        switch (type) {
          case AchievementType.AllColor:
            if (
              msg &&
              (msg.role === pb.ControllerRole.CHARACTER ||
                msg.role === pb.ControllerRole.BACKGROUND)
            ) {
              newProgress = doAllColor(msg);
            }
            break;
          case AchievementType.FiveText:
            if (msg && msg.role === pb.ControllerRole.STORY) {
              newProgress = doFiveText(msg);
            }
            break;
          case AchievementType.TenText:
            if (msg && msg.role === pb.ControllerRole.STORY) {
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

  const achievementHandler = async (ev: MessageEvent<ArrayBuffer>) => {
    const msg = pb.WSMessage.decode(new Uint8Array(ev.data));
    switch (msg.type) {
      case pb.WSMessageType.PAINT:
        checkAchievement(AchievementType.AllColor, msg);
        break;
      case pb.WSMessageType.FILL:
        checkAchievement(AchievementType.AllColor, msg);
        break;
      case pb.WSMessageType.TEXT:
        checkAchievement(AchievementType.FiveText, msg);
        checkAchievement(AchievementType.TenText, msg);
        break;
      default:
    }
  };

  const nextPageHandler = () => {
    checkAchievement(AchievementType.OnePage);
    checkAchievement(AchievementType.ThreePage);
    checkAchievement(AchievementType.FivePage);
    setPage(page + 1);
  };

  const resetAchievements = () => {
    setAchievements(EmptyAchievement);
    setPage(0);
    setAllColorColors(new Set<string>());
    setFiveTextIds(new Set<string>());
    setTenTextIds(new Set<string>());
    setOnePageCount(0);
    setThreePageCount(0);
    setFivePageCount(0);
  };

  useEffect(() => {
    if (debug) console.log(achievements);
  }, [achievements, debug]);

  return [achievements, achievementHandler, nextPageHandler, resetAchievements];
}
