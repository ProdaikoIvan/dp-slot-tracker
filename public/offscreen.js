// Offscreen document script for playing audio in Chrome MV3 without autoplay policy restrictions

function playChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Melodic sequence: C5, E5, G5, C6 repeated 3 times
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const repeatCount = 3;
    const repeatInterval = 0.75; // seconds between chime sequences

    for (let rep = 0; rep < repeatCount; rep++) {
      const repStart = ctx.currentTime + rep * repeatInterval;
      notes.forEach((freq, idx) => {
        const noteStart = repStart + idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);
        gain.gain.setValueAtTime(0, noteStart);
        gain.gain.linearRampToValueAtTime(0.35, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + 0.42);
      });
    }
  } catch (err) {
    console.error('[DP Offscreen] Audio playback error:', err);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'PLAY_OFFSCREEN_AUDIO') {
    playChime();
    sendResponse?.({ success: true });
  }
});
