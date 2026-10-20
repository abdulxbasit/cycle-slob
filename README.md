# VeloCity 3D - Free Ride Bicycle Adventure 🚴‍♂️💨

An interactive 3D bicycle riding experience built with modern Three.js and Vite. Ride freely across an expansive map featuring rolling hills, stunt ramps, asphalt roads, street lamps, and collectible star coins.

---

## 🎮 Features
- **Procedural 3D Bicycle Model**: Articulated mountain/sports bike with rotating spoked wheels, steerable handlebars, turning front fork, spinning crankset and pedals, and an animated cyclist who pedals and leans into turns.
- **Arcade Physics Engine**: Realistic acceleration, rolling friction, air drag, sprint boost, uphill slope resistance, gravity-assisted downhill acceleration, bunny hops, and centrifugal lean banking.
- **Expansive Map**: 1200x1200m world with undulating terrain, asphalt track circuit, launch ramps, vegetation (pine and oak trees), street lamps, and plaza arches.
- **Synthesized Web Audio**: Pure Web Audio API procedural sound effects (chain clicking, tire rolling friction, wind noise at high speed, bicycle bell ding-ding, jump whooshes, landing thumps, and coin pickup chimes) — zero external sound files required!
- **Dynamic Day / Night Cycle**: Toggle between bright sunny day and nighttime with working bicycle headlight and streetlights.
- **Multiple Camera Views**:
  - **Chase**: Dynamic 3rd person follow camera
  - **Cockpit**: 1st person handlebar view
  - **Orbit**: Cinematic isometric viewing angle
- **Sports HUD**: Digital speedometer with speed gauge, distance tracker, collectible coin counter, stunt score, minimap with real-time player location & heading.
- **Multi-platform Controls**: Full keyboard controls + touch controls for mobile/tablet screens.

---

## 🕹️ Controls

| Action | Keyboard | Touch |
|---|---|---|
| **Pedal / Accelerate** | `W` or `↑` | `▲` |
| **Brake / Reverse** | `S` or `↓` | `▼` |
| **Steer Left / Right** | `A` / `D` or `←` / `→` | `◀` / `▶` |
| **Sprint Boost** | `Shift` | `⚡` |
| **Bunny Hop (Jump)** | `Space` | `🦘` |
| **Ring Bicycle Bell** | `B` | `🔔 Bell` Button |
| **Change Camera View** | `C` | `🎥 Camera` Button |
| **Day / Night Cycle** | `N` | `🌙 / ☀️` Button |
| **Reset Position** | `R` | `🔄 Reset` Button |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Running Locally
```bash
# Clone the repository
git clone <repo-url>
cd bicycle-3d-game

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```
