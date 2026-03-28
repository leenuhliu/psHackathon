import { createBrowserRouter } from "react-router";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { SettingSelectionScreen } from "./components/SettingSelectionScreen";
import { StoryChoiceScreen } from "./components/StoryChoiceScreen";
import { StorylineSelectionScreen } from "./components/StorylineSelectionScreen";
import { ListeningScreen } from "./components/ListeningScreen";
import { DrawingScreen } from "./components/DrawingScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { ViewingScreen } from "./components/ViewingScreen";
import { GalleryScreen } from "./components/GalleryScreen";

export const router = createBrowserRouter([
  { path: "/", Component: WelcomeScreen },
  { path: "/setting-selection", Component: SettingSelectionScreen },
  { path: "/story-choice", Component: StoryChoiceScreen },
  { path: "/storyline-selection", Component: StorylineSelectionScreen },
  { path: "/listening", Component: ListeningScreen },
  { path: "/drawing", Component: DrawingScreen },
  { path: "/settings", Component: SettingsScreen },
  { path: "/viewing", Component: ViewingScreen },
  { path: "/gallery", Component: GalleryScreen },
]);
