import { createContext, useContext, useState, ReactNode } from 'react';

export interface Challenge {
  challenge_text: string;
  challenge_image_url: string;
}

export interface SceneResult {
  video_url: string;
  audio_url: string;
  episode_title: string;
  next_challenge: Challenge | null;
  closing_line: string | null;
}

export interface Character {
  name: string;
  styled_frame_url: string;
}

interface StoryState {
  showId: string;
  characterName: string;
  characterTraits: { loves: string; fears: string };
  characters: Character[];
  currentScene: number;
  scenes: SceneResult[];
  currentChallenge: Challenge | null;
  storyName: string;
}

interface StoryContextValue extends StoryState {
  setCharacterName: (name: string) => void;
  setCharacterTraits: (traits: { loves: string; fears: string }) => void;
  addCharacter: (char: Character) => void;
  setCurrentScene: (n: number) => void;
  addScene: (scene: SceneResult) => void;
  setCurrentChallenge: (c: Challenge | null) => void;
  setStoryName: (name: string) => void;
  resetStory: () => void;
}

const StoryContext = createContext<StoryContextValue | null>(null);

function newShowId() {
  return crypto.randomUUID();
}

const defaultState = (): StoryState => ({
  showId: newShowId(),
  characterName: '',
  characterTraits: { loves: '', fears: '' },
  characters: [],
  currentScene: 1,
  scenes: [],
  currentChallenge: null,
  storyName: '',
});

export function StoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoryState>(defaultState);

  const value: StoryContextValue = {
    ...state,
    setCharacterName: (name) => setState(s => ({ ...s, characterName: name })),
    setCharacterTraits: (traits) => setState(s => ({ ...s, characterTraits: traits })),
    addCharacter: (char) => setState(s => ({ ...s, characters: [...s.characters, char] })),
    setCurrentScene: (n) => setState(s => ({ ...s, currentScene: n })),
    addScene: (scene) => setState(s => ({ ...s, scenes: [...s.scenes, scene] })),
    setCurrentChallenge: (c) => setState(s => ({ ...s, currentChallenge: c })),
    setStoryName: (name) => setState(s => ({ ...s, storyName: name })),
    resetStory: () => setState(defaultState()),
  };

  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
}

export function useStory() {
  const ctx = useContext(StoryContext);
  if (!ctx) throw new Error('useStory must be used inside StoryProvider');
  return ctx;
}
