// Audio System
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let globalVolume = 1.0;

function initAudio() {
    if (!audioCtx) audioCtx = new AudioContext();
}

function setVolume(v) {
    globalVolume = Math.max(0, Math.min(1, v));
}

function playSound(type) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    switch(type) {
        case 'jump':
            osc.frequency.setValueAtTime(300, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1 * globalVolume, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01 * globalVolume, audioCtx.currentTime + 0.1);
            osc.start(); osc.stop(audioCtx.currentTime + 0.1);
            break;
        case 'coin':
            osc.frequency.setValueAtTime(587, audioCtx.currentTime);
            osc.frequency.setValueAtTime(784, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1 * globalVolume, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01 * globalVolume, audioCtx.currentTime + 0.2);
            osc.start(); osc.stop(audioCtx.currentTime + 0.2);
            break;
        case 'death':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.15 * globalVolume, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01 * globalVolume, audioCtx.currentTime + 0.5);
            osc.start(); osc.stop(audioCtx.currentTime + 0.5);
            break;
        case 'levelup':
            osc.frequency.setValueAtTime(440, audioCtx.currentTime);
            osc.frequency.setValueAtTime(554, audioCtx.currentTime + 0.1);
            osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.2);
            osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.12 * globalVolume, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01 * globalVolume, audioCtx.currentTime + 0.5);
            osc.start(); osc.stop(audioCtx.currentTime + 0.5);
            break;
        case 'dash':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.12 * globalVolume, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01 * globalVolume, audioCtx.currentTime + 0.15);
            osc.start(); osc.stop(audioCtx.currentTime + 0.15);
            break;
        case 'walljump':
            osc.frequency.setValueAtTime(250, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.08);
            osc.frequency.exponentialRampToValueAtTime(700, audioCtx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.1 * globalVolume, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01 * globalVolume, audioCtx.currentTime + 0.15);
            osc.start(); osc.stop(audioCtx.currentTime + 0.15);
            break;
        case 'shoot':
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.08 * globalVolume, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01 * globalVolume, audioCtx.currentTime + 0.08);
            osc.start(); osc.stop(audioCtx.currentTime + 0.08);
            break;
    }
}
