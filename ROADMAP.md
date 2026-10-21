# VeloCity 3D Autonomous Improvement Roadmap

This file guides the autonomous agent to continuously review, improve, and expand the 3D bicycle game.

## 📋 Iteration Protocol for Autonomous Agent
On each scheduled run:
1. **Review Progress**: Read `ROADMAP.md` and check `git log -n 5` to understand recent changes and identify the next uncompleted task.
2. **Select Task**: Pick **one specific, high-quality feature or improvement** from the categories below (or an idea that improves game feel, graphics, physics, or content).
3. **Implement**: Modify or add the necessary code in `src/` or `index.html`.
4. **Verify**: Run `npm run build` to confirm there are no syntax, import, or build errors.
5. **Update Roadmap**: Check off the completed task in `ROADMAP.md` with date and description.
6. **Git Commit**: Commit the changes with a descriptive git commit message (e.g., `feat(stunts): add 360 spin and backflip air stunt detection`).

---

## 🎯 Task Backlog

### Phase 1: Gameplay & Stunts
- [x] Initial playable 3D bicycle game foundation (Three.js + Vite)
- [x] Procedural bicycle & rider with pedaling animations and leaning
- [x] Web Audio procedural sound effects (bell, chain, roll, wind, coins)
- [x] Speedometer, HUD, minimap, day/night mode
- [x] Add Mid-Air Stunt Detection (Backflip, Frontflip, 360 Spin) with combo multipliers (Completed TASK-001)
- [x] Add skid marks / tire smoke particle effects when hard braking or drifting (Completed TASK-002)
- [x] Implement Time Trial Checkpoint Circuit with countdown timer and leaderboard record (Completed TASK-003)
- [x] Add Turbo Boost pads on roads that give speed bursts when ridden over (Completed TASK-004)

### Phase 2: World & Environment
- [x] Add more terrain props: bridges across ravines, fences, tunnels, and low-poly houses/village (Completed TASK-005)
- [x] Add dynamic weather system (rain particles with wet ground reflections, fog) (Completed TASK-007)
- [x] Add interactive physics objects: traffic cones, sawhorse roadblocks, and 10 bowling pins that fly on impact with smash sound FX (Completed TASK-010)
- [ ] Add animated NPC pedestrians or fellow cyclists cruising on designated paths

### Phase 3: Customization & Progression
- [x] Bicycle customization modal (choose frame colors: neon pink, electric blue, stealth black, golden yellow) (Completed TASK-006)
- [x] Modular Frankenstein bike builder with 6 slots (Frame, Fork, Wheels, Bars, Drivetrain, Saddle) affecting Power, Aero, Handling, and Grip (Completed TASK-008)
- [x] Wheel World style arcade sports UI with Chakra Petch/Teko typography, dynamic speed streaks, and 360 showcase garage (Completed TASK-009)
- [ ] Collectible shop where collected star coins can be spent on helmet skins and bell sound variants
- [x] Speed run ghost rider recording best lap replay (Completed TASK-012: transparent glowing holographic ghost cyclist with replay recording, benchmark pacing, real-time split deltas, minimap radar icon, and Ghost Cam view)

### Phase 4: Polish & Audio/Visuals
- [x] Background procedural ambient music synthesizer (Completed TASK-011 - 3 tracks: Cyber Cruise, Neon Downhill, Sunset Glide with dynamic speed filter modulation and 'M' hotkey)
- [ ] Post-processing effects (Bloom for headlights/neon signs, subtle vignette)
- [ ] Sound effects for landing on different ground surfaces (dirt thud vs road slap)
- [ ] First-person handlebar camera head-shake / vibration at high speeds
