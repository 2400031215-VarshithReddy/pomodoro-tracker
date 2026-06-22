# 🌟 AuraFlow // Premium Pomodoro & Habit Tracker

A modern, high-fidelity productivity dashboard combining a focus-enhancing **Pomodoro Timer** with an interactive **Weekly Habit Tracker**. Designed with luxurious glassmorphism aesthetics, fluid micro-animations, and custom audio alerts.

Perfect for hosting on GitHub Pages with zero external dependencies, compilation, or package setup.

---

## ✨ Features

### ⏱️ Pomodoro Focus Engine
- **Customizable Intervals**: Configurable sessions for **Focus**, **Short Breaks**, and **Long Breaks**.
- **Visual Circular Progress**: Beautiful SVG progress ring reflecting the precise countdown state.
- **Tab State Synchronization**: Tracks remaining time in the browser tab title.
- **Auto-Cycle Progression**: Seamless state transitions to help maintain continuous focus.

### 📅 Routine & Habit Tracker
- **Weekly Check-Off Matrix**: Track actions across Monday through Sunday.
- **Dynamic Streaks**: Multi-day streak algorithm that rewards consistency.
- **Color Coding**: 5 custom accent themes (Purple, Pink, Emerald, Amber, Blue) to categorize routines visually.
- **Interactive Progress Indicators**: Overall weekly completion metrics calculated in real-time.

### 🔊 Integrated Audio alerts
- **Built-in Synth Engine**: Synthesizes clean tone chimes programmatically using the browser's native **Web Audio API**. No static MP3 files to host, load, or cache.
- **Audio Control**: Toggle sound alerts on/off directly from the dashboard controls.

### 🔒 Local Storage Persistence
- All settings, daily checked habits, streaks, and completed focus counts are automatically persisted to the browser's `localStorage` for uninterrupted productivity.

---

## 🎨 Design Aesthetics
- **Glassmorphism Theme**: Frosted translucent layers (`backdrop-filter`) with refined borders, casting deep shadows against space-dark backgrounds.
- **Neon Ambient Accents**: Smoothly animating blurred color accents shifting in the background.
- **Responsive Layout**: Designed using CSS Flexbox and Grid, optimizing performance and readability across mobile and wide desktop views.
- **Modern Typography**: Integrated google web fonts: *Outfit* (display) and *Inter* (interface data).

---

## 🚀 Quick Start & Deployment

### Run Locally
Since this is a lightweight, frontend-only application, it has **no package dependencies**. You can run it instantly:

1. Clone this repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   ```
2. Navigate to the project directory:
   ```bash
   cd practice/pomodoro-tracker
   ```
3. Open `index.html` directly in any modern browser (Chrome, Firefox, Safari, Edge):
   - Double-click the file in your Explorer/Finder.
   - Or run a simple python local server:
     ```bash
     python -m http.server 8000
     ```
     Then open `http://localhost:8000` in your web browser.

### Deploy to GitHub Pages
You can host AuraFlow for free on GitHub Pages:
1. Push this folder to a GitHub repository.
2. In the repository settings, navigate to **Pages**.
3. Choose the branch (e.g. `main` or `master`) and select the `/` (root) folder, then click **Save**.
4. Your application will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`.

---

## 📂 Project Structure

```text
pomodoro-tracker/
├── index.html   # HTML layout, SVG structures, and metadata tags
├── style.css    # CSS styling, glassmorphic filters, and neon variables
├── app.js       # Core application logic, sound synthesis, and state persistence
└── README.md    # Portfolio documentation
```

---

## 🛠️ Built With
- **HTML5** & **CSS3** (Custom Properties, Flexbox, Grid)
- **Vanilla JavaScript** (ES6+, Web Audio API, LocalStorage API)
