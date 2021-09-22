export interface AchievementItem {
  name: string;
  description: string;
  icon: string;
}

export enum AchievementType {
  AllColor = "all_color",
  FiveText = "five_text",
  TenText = "ten_text",
  OnePage = "one_page",
  ThreePage = "three_page",
  FivePage = "five_page",
}

export const AchievementDetail: { [key in AchievementType]: AchievementItem } =
  {
    [AchievementType.AllColor]: {
      name: "Colorful",
      description: "Used all colors in the pallete",
      icon: "palette",
    },
    [AchievementType.FiveText]: {
      name: "Poet",
      description: "Created 5 text elements",
      icon: "text_fields",
    },
    [AchievementType.TenText]: {
      name: "Novelist",
      description: "Created 10 text elements",
      icon: "history_edu",
    },
    [AchievementType.OnePage]: {
      name: "Novice Storyteller",
      description: "Completed the story with 1 page",
      icon: "note",
    },
    [AchievementType.ThreePage]: {
      name: "Advanced Storyteller",
      description: "Completed the story with 3 pages",
      icon: "menu_book",
    },
    [AchievementType.FivePage]: {
      name: "Expert Storyteller",
      description: "Completed the story with 5 pages",
      icon: "book",
    },
  };

export type Achievement = { [key in AchievementType]: number };

export const EmptyAchievement: Achievement = {
  [AchievementType.AllColor]: 0,
  [AchievementType.FiveText]: 0,
  [AchievementType.TenText]: 0,
  [AchievementType.OnePage]: 0,
  [AchievementType.ThreePage]: 0,
  [AchievementType.FivePage]: 0,
};
