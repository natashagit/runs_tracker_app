export const colors = {
  bg: '#0A0A0A',        // near-black
  card: '#161616',      // dark neutral card
  accent: '#FF4D00',    // vivid orange — primary
  accentDim: '#E63F00', // darker orange
  accent2: '#FF2D9B',   // hot pink — highlights / gradient end
  danger: '#FF2D55',    // red
  onAccent: '#0A0A0A',  // near-black text on bright buttons
  text: '#FFFFFF',      // white
  textDim: '#8A8A8A',   // neutral gray
  border: '#262626',    // subtle border
  track: '#FF2D9B',     // pink route line (legacy / fallback)
  walk: '#00E0C7',      // teal — the WALK segment of a route
  run: '#FF2D9B',       // pink — the RUN segment of a route
} as const;

// Display font (loaded in App.tsx). Use for big bold headlines, like Nike.
export const fonts = {
  display: 'Anton_400Regular',
} as const;
