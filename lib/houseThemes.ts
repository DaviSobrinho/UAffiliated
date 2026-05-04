export interface HouseTheme {
  id: string;
  name: string;
  logo: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

export const HOUSE_THEMES: Record<string, HouseTheme> = {
  betano: {
    id: "betano",
    name: "Betano",
    logo: "/betano.png",
    colors: {
      primary: "#FF6B00",
      primaryLight: "#FF8533",
      primaryDark: "#CC5600",
      secondary: "#FFFFFF",
      accent: "#FFB380",
      background: "#0f172a",
    },
  },
  betfair: {
    id: "betfair",
    name: "Betfair",
    logo: "/betfair.png",
    colors: {
      primary: "#FFD700",
      primaryLight: "#FFEB3B",
      primaryDark: "#FFC300",
      secondary: "#FFFFFF",
      accent: "#FFFF00",
      background: "#0f172a",
    },
  },
  betnacional: {
    id: "betnacional",
    name: "Bet Nacional",
    logo: "/betnacional.png",
    colors: {
      primary: "#0066FF",
      primaryLight: "#3385FF",
      primaryDark: "#0052CC",
      secondary: "#FFFFFF",
      accent: "#0099FF",
      background: "#0f172a",
    },
  },
  esportivabet: {
    id: "esportivabet",
    name: "Esportivabet",
    logo: "/esportivabet.png",
    colors: {
      primary: "#FF6B00",
      primaryLight: "#FF8533",
      primaryDark: "#CC5600",
      secondary: "#FFFFFF",
      accent: "#FFB380",
      background: "#0f172a",
    },
  },
  estrelabet: {
    id: "estrelabet",
    name: "Estrelabet",
    logo: "/estrelabet.png",
    colors: {
      primary: "#FFD700",
      primaryLight: "#FFEB3B",
      primaryDark: "#FFC300",
      secondary: "#FFFFFF",
      accent: "#FFFF00",
      background: "#0f172a",
    },
  },
  novibet: {
    id: "novibet",
    name: "Novibet",
    logo: "/novibet.png",
    colors: {
      primary: "#FFFFFF",
      primaryLight: "#F5F5F5",
      primaryDark: "#E8E8E8",
      secondary: "#FFFFFF",
      accent: "#F0F0F0",
      background: "#0f172a",
    },
  },
  segurobet: {
    id: "segurobet",
    name: "Segurobet",
    logo: "/segurobet.png",
    colors: {
      primary: "#00C853",
      primaryLight: "#00E676",
      primaryDark: "#00A046",
      secondary: "#FFFFFF",
      accent: "#00FF73",
      background: "#0f172a",
    },
  },
  stake: {
    id: "stake",
    name: "Stake",
    logo: "/stake.png",
    colors: {
      primary: "#FFFFFF",
      primaryLight: "#F5F5F5",
      primaryDark: "#E8E8E8",
      secondary: "#FFFFFF",
      accent: "#F0F0F0",
      background: "#0f172a",
    },
  },
  superbet: {
    id: "superbet",
    name: "Superbet",
    logo: "/superbet.png",
    colors: {
      primary: "#FF1744",
      primaryLight: "#FF5E78",
      primaryDark: "#D01844",
      secondary: "#FFFFFF",
      accent: "#FF6E8F",
      background: "#0f172a",
    },
  },
};

export const getHouseTheme = (houseId: string): HouseTheme => {
  return HOUSE_THEMES[houseId] || HOUSE_THEMES.betano;
};
