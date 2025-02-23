# Hazine Yolculuğu (Treasure Hunt)

A multiplayer board game where players roll dice and move around the board collecting treasures, avoiding traps, and completing challenges.

## Features

- Real-time multiplayer gameplay using Socket.IO
- Beautiful UI with animations using Framer Motion
- Responsive design for both desktop and mobile
- Turkish language support
- Interactive tutorial
- Power-ups and special abilities
- Scoreboard tracking

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + Socket.IO
- Styling: Tailwind CSS
- Animations: Framer Motion
- Icons: React Icons

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/treasure-hunt-party-game.git
cd treasure-hunt-party-game
```

2. Install dependencies:

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Start the development servers:

```bash
# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory)
npm run dev
```

4. Open http://localhost:5173 in your browser

## Game Rules

1. Players take turns rolling dice
2. Move around the board based on dice roll
3. Land on special squares:
   - Treasure: Gain points
   - Trap: Lose points
   - Power-up: Get special abilities
   - Challenge: Complete mini-games
4. First player to reach the end or highest score wins!

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

MIT
