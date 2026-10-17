# 🕹️ Tetris Classic

A modern, responsive, and lightweight implementation of the classic **Tetris** puzzle game. Maneuver falling tetrominoes, clear horizontal lines, and aim for the ultimate high score!

![License](https://shields.io)
![Issues](https://shields.io)
![Stars](https://shields.io)

---

## 🚀 Features

*   **Classic Gameplay:** Authentic Tetris mechanics including rotation, line-clearing, and increasing difficulty speeds.
*   **Next Piece Preview:** Plan your strategy ahead with a dedicated sidebar showing the upcoming shape.
*   **Responsive Design:** Fully optimized to scale beautifully across smartphones, tablets, and desktop displays.
*   **Score Tracking:** Dynamic scoring system that rewards multi-line clears (Single, Double, Triple, and Tetris!).
*   **Audio FX:** Immerse yourself with nostalgic retro sound effects and background music (optional toggles included).

## 🛠️ Tech Stack

*   **Frontend:** HTML5, CSS3, JavaScript (ES6+) / TypeScript
*   **Rendering:** HTML5 Canvas API for smooth 60 FPS grid rendering
*   **State Management:** Vanilla JS object-oriented state architecture

## 🎮 How to Play

The objective is simple: manipulate the falling geometric shapes (**tetrominoes**) by moving them sideways and rotating them to create a solid horizontal line without gaps. When a line is complete, it disappears, and you earn points! 

The game ends if the pieces stack up to the top of the playing grid.

### Default Controls

| Action | Keyboard Input | Controller / Mobile |
| :--- | :--- | :--- |
| **Move Left** | `←` or `A` | Swipe Left / D-Pad Left |
| **Move Right** | `→` or `D` | Swipe Right / D-Pad Right |
| **Rotate Clockwise** | `↑` or `W` | Tap Screen / A Button |
| **Soft Drop** | `↓` or `S` | Swipe Down / D-Pad Down |
| **Hard Drop** | `Spacebar` | Double Tap / Space |
| **Pause / Resume** | `P` or `Esc` | Pause Button |

## ⚙️ Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

You only need a modern web browser (e.g., Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari).

### Installation & Launch

1.  **Clone the repository:**
    ```bash
    git clone https://github.com
    ```

2.  **Navigate into the project directory:**
    ```bash
    cd YOUR_REPO_NAME
    ```

3.  **Run the game:**
    Simply open the `index.html` file in your preferred web browser:
    ```bash
    # On macOS
    open index.html

    # On Windows
    start index.html

    # On Linux
    xdg-open index.html
    ```

## 📐 Project Structure

```text
├── assets/
│   ├── audio/          # Sound effects and background music
│   └── images/         # Game icons and application thumbnails
├── src/
│   ├── board.js        # Grid math, collision detection, and line clearing logic
│   ├── piece.js        # Tetromino matrix shapes, positioning, and rotation matrix
│   └── main.js         # Game loop initialization, event listeners, and UI handling
├── index.html          # Main application entry point
├── style.css           # Grid canvas layouts and vintage arcade theme styling
└── README.md           # Documentation
```

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
