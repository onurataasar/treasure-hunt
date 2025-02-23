import {
  FaDice,
  FaCrown,
  FaTrophy,
  FaQuestionCircle,
  FaTimes,
  FaArrowLeft,
  FaArrowRight,
  FaUser,
} from "react-icons/fa";
import {
  GiTreasureMap,
  GiDeathSkull,
  GiPowerLightning,
  GiPerspectiveDiceSixFacesRandom,
} from "react-icons/gi";

export const GameIcons = {
  // Game Elements
  Dice: FaDice,
  Crown: FaCrown,
  Trophy: FaTrophy,
  Question: FaQuestionCircle,
  User: FaUser,

  // Board Spaces
  Treasure: GiTreasureMap,
  Trap: GiDeathSkull,
  Power: GiPowerLightning,
  Challenge: GiPerspectiveDiceSixFacesRandom,

  // Navigation
  Close: FaTimes,
  Back: FaArrowLeft,
  Forward: FaArrowRight,
} as const;

export const IconSizes = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-10 h-10",
} as const;

export type IconSize = keyof typeof IconSizes;
