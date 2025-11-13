// tailwind.config.cjs
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Neón vibrantes (15+ opciones)
        neonPink: '#ff00ff',
        neonBlue: '#00ffff',
        neonGreen: '#00ff00',
        neonYellow: '#ffff00',
        neonPurple: '#bf00ff',
        neonRed: '#ff0055',
        neonCyan: '#00ffff',
        neonLime: '#ccff00',
        neonOrange: '#ff6600',
        neonMagenta: '#ff00cc',
        neonTeal: '#00ffcc',
        neonIndigo: '#4b00ff',
        neonCoral: '#ff5252',
        neonEmerald: '#50c878',
        neonSky: '#87ceeb',
        neonPlum: '#dda0dd',
        neonGold: '#ffd700',
        neonSilver: '#c0c0c0',
        // Tonos solicitados específicamente
        greenDark: '#008000',
        greenLight: '#90ee90',
        blueLight: '#add8e6',
        red: '#ff0000',
      },
    },
  },
  plugins: [],
}