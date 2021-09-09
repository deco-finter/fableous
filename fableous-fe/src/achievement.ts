export interface AchievementItem {
  name: string;
  description: string;
}

export enum AchievementType {
  AllColor = "all_color",
  FiveText = "five_text",
  TenText = "ten_text",
  OnePage = "one_page",
  ThreePage = "three_page",
  FivePage = "five_page",
}

export const AchievementMap: { [key in AchievementType]: AchievementItem } = {
  [AchievementType.AllColor]: {
    name: "Colorful",
    description: "Used all colors in the pallete",
  },
  [AchievementType.FiveText]: {
    name: "Poet",
    description: "Created 5 text elements",
  },
  [AchievementType.TenText]: {
    name: "Novelist",
    description: "Created 10 text elements",
  },
  [AchievementType.OnePage]: {
    name: "Novice Storyteller",
    description: "Completed the story with 1 page",
  },
  [AchievementType.ThreePage]: {
    name: "Advanced Storyteller",
    description: "Completed the story with 3 pages",
  },
  [AchievementType.FivePage]: {
    name: "Expert Storyteller",
    description: "Completed the story with 5 pages",
  },
};
