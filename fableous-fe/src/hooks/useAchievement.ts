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
    (msg: WSMessage): AchievementType | null => {
      const newColors = new Set(allColorColors).add(msg.data.color || "");
      setAllColorColors(newColors);
      return newColors.size >= 6 ? AchievementType.AllColor : null;
    },
    [allColorColors]
  );

  const [fiveTextIds, setFiveTextIds] = useState<Set<number>>(
    new Set<number>()
  );
  const doFiveText = useCallback(
    (msg: WSMessage): AchievementType | null => {
      if (!msg.data.text) return null;
      const newIds = new Set(fiveTextIds).add(msg.data.id || 0);
      setFiveTextIds(newIds);
      return newIds.size >= 5 ? AchievementType.FiveText : null;
    },
    [fiveTextIds]
  );

  const [tenTextIds, setTenTextIds] = useState<Set<number>>(new Set<number>());
  const doTenText = useCallback(
    (msg: WSMessage): AchievementType | null => {
      if (!msg.data.text) return null;
      const newIds = new Set(tenTextIds).add(msg.data.id || 0);
      console.log(newIds);
      setTenTextIds(newIds);
      return newIds.size >= 10 ? AchievementType.TenText : null;
    },
    [tenTextIds]
  );

  const checkAchievement = useCallback(
    (type: AchievementType, msg: WSMessage) => {
      if (!achievements.has(type)) {
        switch (type) {
          case AchievementType.AllColor:
            if (
              msg.role === ControllerRole.Character ||
              msg.role === ControllerRole.Background
            ) {
              const res = doAllColor(msg);
              if (res)
                setAchievements((prev) => {
                  return new Set(prev).add(res);
                });
            }
            break;
          case AchievementType.FiveText:
            if (msg.role === ControllerRole.Story) {
              const res = doFiveText(msg);
              if (res)
                setAchievements((prev) => {
                  return new Set(prev).add(res);
                });
            }
            break;
          case AchievementType.TenText:
            if (msg.role === ControllerRole.Story) {
              const res = doTenText(msg);
              if (res)
                setAchievements((prev) => {
                  return new Set(prev).add(res);
                });
            }
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
    [achievements, doAllColor, doFiveText, doTenText]
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

  useEffect(() => {
    if (debug) console.log(achievements);
  }, [achievements, debug]);

  return [achievements, achievementHandler];
}
