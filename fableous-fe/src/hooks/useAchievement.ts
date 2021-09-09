import { useCallback, useEffect, useState } from "react";
import { AchievementType } from "../achievement";
import { ControllerRole, WSMessage, WSMessageType } from "../data";

export default function useAchievement(config?: {
  debug?: boolean;
}): [Set<AchievementType>, (ev: MessageEvent) => void] {
  const { debug } = config || { debug: false };
  const [achievements, setAchievements] = useState<Set<AchievementType>>(
    new Set<AchievementType>()
  );

  const [allColorColors, setAllColorColors] = useState<Set<string>>(
    new Set<string>()
  );

  const doAllColor = useCallback(
    (msg: WSMessage) => {
      allColorColors.add(msg.data.color || "");
      setAllColorColors(new Set(allColorColors));
      return allColorColors.size >= 6;
    },
    [allColorColors]
  );

  const checkAchievement = useCallback(
    (type: AchievementType, msg: WSMessage) => {
      if (!achievements.has(type)) {
        switch (type) {
          case AchievementType.AllColor:
            console.log("check");
            if (
              (msg.role === ControllerRole.Character ||
                msg.role === ControllerRole.Background) &&
              doAllColor(msg)
            )
              setAchievements((prev) => {
                return new Set(prev).add(AchievementType.AllColor);
              });
            break;
          case AchievementType.FiveText:
            break;
          case AchievementType.TenText:
            break;
          case AchievementType.OnePage:
            break;
          case AchievementType.ThreePage:
            break;
          case AchievementType.FivePage:
            break;
          default:
        }
      }
    },
    [achievements, doAllColor]
  );

  const achievementHandler = (ev: MessageEvent) => {
    try {
      const msg = JSON.parse(ev.data) as WSMessage;
      switch (msg.type) {
        case WSMessageType.Paint:
          checkAchievement(AchievementType.AllColor, msg);
          break;
        default:
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (debug) console.log(achievements);
  }, [achievements, debug]);

  return [achievements, achievementHandler];
}
