/* eslint-disable no-param-reassign */
/* eslint-disable no-bitwise */
export const colors = {
  orange: {
    light: "#FF857B",
    main: "#E45D3F",
    dark: "#FF594B",
  },
  blue: {
    light: "#1583D8",
    main: "#1E5DDD",
    dark: "#0D44BA",
  },
  red: {
    main: "#DD2222",
  },
  white: "#FFFFFF",
  gray: {
    light: "#DDDDDD",
    main: "#AAAAAA",
  },
  black: "#000000",
  green: "#43A047",
};

export const generateColor = (seed: string): string => {
  const hash = Math.abs(
    seed.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0)
  );
  return `#${Math.floor(
    Math.abs(Math.cos(hash / Math.PI ** 2) * 16777215) % 16777215
  ).toString(16)}`;
};

export const getBestTextColor = (color: string): string => {
  const rgb = color
    .replace(/^#/, "")
    .match(/.{2}/g)
    ?.map((v) => parseInt(v, 16));
  if (!rgb || rgb.length !== 3) {
    return colors.black;
  }
  const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
  return brightness > 128 ? colors.black : colors.white;
};
