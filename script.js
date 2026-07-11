// ============ mobile nav ============
const toggle = document.querySelector('.menu-toggle');
const navlinks = document.querySelector('.navlinks');
if(toggle && navlinks){
  toggle.addEventListener('click', () => {
    navlinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', navlinks.classList.contains('open'));
  });
  navlinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navlinks.classList.remove('open')));
}

// ============ terminal boot line ============
function typeTerminal(el, lines, speed = 26){
  if(!el) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(prefersReduced){
    el.textContent = lines[lines.length - 1];
    return;
  }
  let li = 0;
  function typeLine(){
    if(li >= lines.length){
      const caret = document.createElement('span');
      caret.className = 'caret';
      el.appendChild(caret);
      return;
    }
    const text = lines[li];
    let ci = 0;
    el.textContent = '';
    const iv = setInterval(() => {
      el.textContent = text.slice(0, ci + 1);
      ci++;
      if(ci >= text.length){
        clearInterval(iv);
        li++;
        setTimeout(typeLine, li >= lines.length ? 0 : 380);
      }
    }, speed);
  }
  typeLine();
}

// ============ background music (generative ambient loop) ============
// No external audio file is used — this synthesizes a soft, looping
// ambient pad + sparse "data blip" texture entirely with the Web Audio API,
// so there's nothing to host and no licensing concerns.
const SOUND_KEY = 'rh_sound_enabled';
 
let audioCtx = null;
let musicPlaying = false;
let musicTimer = null;
let chordIndex = 0;
 
// Soft minor-ish chord cycle, low register, built from simple triangle waves.
const CHORDS = [
  [130.81, 196.00, 261.63], // C3  G3  C4
  [116.54, 174.61, 233.08], // A#2 F3  A#3
  [98.00,  146.83, 196.00], // G2  D3  G3
  [123.47, 185.00, 246.94], // B2  F#3 B3
];
const CHORD_DURATION = 5.2; // seconds per chord
 
function getCtx(){
  if(!audioCtx){
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if(!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
}
 
function playPadChord(ctx, freqs, duration){
  freqs.forEach((freq, i) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.045 / (i + 1), now + duration * 0.35);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  });
}
 
function playBlip(ctx){
  const now = ctx.currentTime;
  const freq = 520 + Math.random() * 700;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.035, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.4);
}
 
function scheduleLoop(){
  if(!musicPlaying) return;
  const ctx = getCtx();
  if(!ctx) return;
 
  playPadChord(ctx, CHORDS[chordIndex % CHORDS.length], CHORD_DURATION);
  chordIndex++;
 
  // sprinkle 0-2 soft blips within this chord's window
  const blipCount = Math.random() < 0.5 ? 1 : (Math.random() < 0.3 ? 2 : 0);
  for(let i = 0; i < blipCount; i++){
    const delay = 400 + Math.random() * (CHORD_DURATION * 1000 - 800);
    setTimeout(() => { if(musicPlaying) playBlip(ctx); }, delay);
  }
 
  musicTimer = setTimeout(scheduleLoop, CHORD_DURATION * 1000);
}
 
function startMusic(){
  const ctx = getCtx();
  if(!ctx) return;
  if(ctx.state === 'suspended') ctx.resume();
  if(musicPlaying) return;
  musicPlaying = true;
  chordIndex = 0;
  scheduleLoop();
}
 
function stopMusic(){
  musicPlaying = false;
  if(musicTimer) clearTimeout(musicTimer);
  if(audioCtx){
    audioCtx.close();
    audioCtx = null;
  }
}
 
function setSoundIcon(btn, on){
  if(!btn) return;
  const off = btn.querySelector('.icon-sound-off');
  const onIcon = btn.querySelector('.icon-sound-on');
  if(off) off.style.display = on ? 'none' : 'block';
  if(onIcon) onIcon.style.display = on ? 'block' : 'none';
  btn.setAttribute('aria-pressed', on ? 'true' : 'false');
}
 
document.addEventListener('DOMContentLoaded', () => {
  const soundBtn = document.getElementById('sound-toggle');
  const soundOn = localStorage.getItem(SOUND_KEY) === 'on';
  setSoundIcon(soundBtn, soundOn);
 
  // Best-effort autoplay on load if the visitor already opted in on a previous page.
  // Browsers only allow this once the site has earned a media-engagement allowance,
  // so this may silently no-op right after enabling on a brand-new browser —
  // it will still start the moment the toggle is clicked.
  if(soundOn){
    startMusic();
  }
 
  if(soundBtn){
    soundBtn.addEventListener('click', () => {
      const nowOn = localStorage.getItem(SOUND_KEY) !== 'on';
      localStorage.setItem(SOUND_KEY, nowOn ? 'on' : 'off');
      setSoundIcon(soundBtn, nowOn);
      if(nowOn){
        startMusic(); // inside a click handler, so this is always allowed to play
      } else {
        stopMusic();
      }
    });
  }
});
 
document.addEventListener('DOMContentLoaded', () => {
  const term = document.querySelector('[data-terminal]');
  if(term){
    const lines = JSON.parse(term.getAttribute('data-terminal'));
    typeTerminal(term, lines);
  }

  // ============ scroll reveal ============
  const revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // ============ copy to clipboard ============
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const val = btn.getAttribute('data-copy');
      try{
        await navigator.clipboard.writeText(val);
        const original = btn.textContent;
        btn.textContent = 'COPIED';
        setTimeout(() => { btn.textContent = original; }, 1400);
      }catch(e){ /* clipboard unavailable, ignore silently */ }
    });
  });

  // ============ contact form -> mailto ============
  const contactForm = document.getElementById('contact-form');
  if(contactForm){
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('cf-name').value.trim();
      const email = document.getElementById('cf-email').value.trim();
      const subject = document.getElementById('cf-subject').value.trim();
      const message = document.getElementById('cf-message').value.trim();

      const to = 'rayenhajjem04@gmail.com';
      const mailSubject = `[Portfolio] ${subject}`;
      const mailBody = `${message}\n\n—\n${name}\n${email}`;

      const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;

      const status = document.getElementById('cf-status');
      if(status) status.textContent = 'Opening your email app…';

      window.location.href = mailtoUrl;
    });
  }
});
