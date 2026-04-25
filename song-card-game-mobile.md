# Project Plan - Song Card Game Mobile

## Overview
Build a digital version of the Indonesian card game "Song" for mobile using React Native and Expo.

## Project Type
**MOBILE** (Primary Agent: `mobile-developer`)

## Success Criteria
- [ ] Working card dealing and turn management.
- [ ] Automatic detection of "Song" combinations.
- [ ] Heuristic-based AI opponent.
- [ ] Smooth, touch-friendly UI at 60fps.
- [ ] Zero build errors on Android emulator.

## Tech Stack
- **Framework**: React Native + Expo
- **State Management**: Zustand
- **Animation**: React Native Reanimated
- **Styling**: Vanilla CSS (via StyleSheet)

## File Structure
```
/
├── assets/             # Card images & fonts
├── components/         # Card, Hand, Table components
├── hooks/              # useGameStore, useAI
├── logic/              # game-engine, ai-engine
├── screens/            # GameBoard, Menu
├── App.tsx             # Root component
└── app.json            # Expo config
```

## Task Breakdown

### Phase 1: Foundation (P0)
- [ ] `task-1`: Setup Expo project in current directory.
  - Agent: `mobile-developer`
  - Skill: `app-builder`
- [ ] `task-2`: Implement Core Game Engine (deck, shuffle, deal).
  - Agent: `game-developer`
  - Skill: `game-development`

### Phase 2: Logic & AI (P1)
- [ ] `task-3`: Implement "Song" combination detection logic.
  - Agent: `game-developer`
  - Skill: `game-development`
- [ ] `task-4`: Implement Single-Player AI Bot.
  - Agent: `game-developer`
  - Skill: `game-development/game-design`

### Phase 3: UI & UX (P2)
- [ ] `task-5`: Create touch-friendly Card and Hand components.
  - Agent: `mobile-developer`
  - Skill: `mobile-design`
- [ ] `task-6`: Build main GameBoard screen.
  - Agent: `mobile-developer`
  - Skill: `mobile-design`

### Phase 4: Polish & Verify (P3)
- [ ] `task-7`: Add animations and sound effects.
  - Agent: `game-developer`
  - Skill: `game-development/game-audio`
- [ ] `task-8`: Final verification & build test.
  - Agent: `mobile-developer`
  - Skill: `clean-code`

## Phase X: Verification
- [ ] Run `python .agent/scripts/verify_all.py .`
- [ ] Verify 60fps performance.
- [ ] Manual playtest against AI.
