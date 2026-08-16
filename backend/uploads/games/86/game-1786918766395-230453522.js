// script.js

document.addEventListener('DOMContentLoaded', () => {
  // ========== INTERACTIVE ELEMENTS ==========
  const tuneKnob = document.getElementById('tuneKnob');
  const fader1 = document.getElementById('fader1');
  const fader2 = document.getElementById('fader2');
  const startBtn = document.getElementById('startSessionBtn');
  const onlineSpan = document.getElementById('onlineCount');
  const bpmSpan = document.getElementById('bpmValue');
  const dbSpan = document.getElementById('dbValue');
  const activityEl = document.getElementById('currentActivity');
  const volumeIcon = document.getElementById('volumeIcon');
  const userMenu = document.getElementById('userMenu');
  const navItems = document.querySelectorAll('.nav-item');
  const catItems = document.querySelectorAll('.cat-item');
  const newBadge = document.getElementById('newBadge');
  const trackList = document.getElementById('trackList');
  const waveBars = document.querySelectorAll('.wave-bar');

  // ========== HELPER: RANDOM BETWEEN ==========
  const rand = (min, max) => Math.random() * (max - min) + min;

  // ========== KNOB INTERACTION ==========
  let knobRotation = 0;
  tuneKnob.addEventListener('click', (e) => {
    e.stopPropagation();
    // rotate knob indicator (visual only)
    knobRotation = (knobRotation + 30) % 360;
    tuneKnob.style.transform = `rotate(${knobRotation}deg)`;
    // additional effect: change BPM slightly
    let currentBpm = parseInt(bpmSpan.textContent);
    let newBpm = currentBpm + (Math.random() > 0.5 ? 2 : -2);
    if (newBpm < 80) newBpm = 80;
    if (newBpm > 180) newBpm = 180;
    bpmSpan.textContent = newBpm;

    // animate wave bar (extra flair)
    if (waveBars.length > 0) {
      waveBars[2].style.height = (40 + Math.random() * 70) + 'px';
      waveBars[4].style.height = (50 + Math.random() * 80) + 'px';
    }
  });

  // ========== FADER INTERACTION ==========
  function setupFader(faderEl, linkedDbSpan) {
    let isDragging = false;
    let startY, startHeight;

    const onMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const dy = e.clientY - startY;
      let newHeight = Math.min(70, Math.max(18, startHeight - dy)); // inverse because Y goes down
      faderEl.style.height = newHeight + 'px';

      // map height (18-70) to dB value (say -12 to +6)
      const minDB = -12, maxDB = 6;
      const perc = (newHeight - 18) / (70 - 18);
      const dbVal = (minDB + perc * (maxDB - minDB)).toFixed(1);
      if (linkedDbSpan) linkedDbSpan.textContent = dbVal;

      // optional: update level indicator color
      faderEl.classList.toggle('active-fader', newHeight > 44);
    };

    const onMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }
    };

    faderEl.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isDragging = true;
      startY = e.clientY;
      startHeight = parseFloat(faderEl.style.height) || 40;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  setupFader(fader1, dbSpan);      // fader1 controls main dB display
  setupFader(fader2, null);         // second fader just for fun

  // ========== START SESSION BUTTON ==========
  startBtn.addEventListener('click', () => {
    // simulate session start: update online count, activity message, and BPM
    const newOnline = (parseFloat(onlineSpan.textContent) + 0.1).toFixed(1) + 'k';
    onlineSpan.textContent = newOnline;

    const activities = [
      'beat collaboration',
      'synth jam',
      'live sampling',
      'remix session',
      'mastering prep'
    ];
    const randomAct = activities[Math.floor(Math.random() * activities.length)];
    activityEl.innerHTML = `<i class="fas fa-magic"></i>  current: ${randomAct}`;

    // randomize wave bars
    waveBars.forEach(bar => {
      bar.style.height = (40 + Math.random() * 100) + 'px';
    });

    // animate volume icon
    volumeIcon.style.color = '#ffd966';
    setTimeout(() => volumeIcon.style.color = '#9ef0da', 200);
  });

  // ========== USER MENU / PROFILE CLICK ==========
  userMenu.addEventListener('click', () => {
    // toggle some visual feedback – show midi dot pulse
    const midiDot = document.querySelector('.midi-dot');
    midiDot.style.background = '#f0e68c';
    midiDot.style.boxShadow = '0 0 15px gold';
    setTimeout(() => {
      midiDot.style.background = '#51cfb2';
      midiDot.style.boxShadow = '0 0 10px cyan';
    }, 300);
  });

  // ========== NAV ITEMS TOOLTIPS (CSS handles) + extra feedback ==========
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // led flash effect
      const led = item.querySelector('.led');
      if (led) {
        led.style.background = '#ffffff';
        led.style.boxShadow = '0 0 20px cyan';
        setTimeout(() => {
          led.style.background = '#56e0c2';
          led.style.boxShadow = '0 0 10px #30e0b0';
        }, 150);
      }
    });
  });

  // ========== CATEGORY ITEMS INTERACTION ==========
  catItems.forEach(cat => {
    cat.addEventListener('click', () => {
      // show feedback by changing border
      cat.style.borderColor = '#7cf0da';
      cat.style.boxShadow = '0 0 25px #3fe0c0';
      setTimeout(() => {
        cat.style.borderColor = '#2b3f4c';
        cat.style.boxShadow = 'none';
      }, 200);

      // update new badge and track list with dummy data
      newBadge.innerHTML = 'fresh &nbsp;⚡';
      const mockTracks = [
        'cyberdeep — "modular love"',
        'echo park — "late night"',
        'luna.hex — "static drift (remix)"',
        'algorhythm — "bit crusher"'
      ];
      const shuffled = mockTracks.sort(() => 0.5 - Math.random()).slice(0, 3);
      trackList.innerHTML = shuffled.map(t => 
        `<div><i class="fas fa-circle" style="color: #6cf0c2; font-size: 0.6rem;"></i>  ${t}</div>`
      ).join('');
    });
  });

  // ========== WAVE BARS ANIMATION ON HOVER (hero) ==========
  const waveformDiv = document.getElementById('waveformContainer');
  waveformDiv.addEventListener('mouseenter', () => {
    waveBars.forEach(bar => {
      bar.style.height = (40 + Math.random() * 100) + 'px';
    });
  });

  // ========== PERIODIC BPM / ONLINE FLUCTUATION (just for life) ==========
  setInterval(() => {
    // randomly adjust BPM by ±1
    let currentBpm = parseInt(bpmSpan.textContent);
    let delta = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
    let newBpm = currentBpm + delta;
    if (newBpm >= 80 && newBpm <= 180) bpmSpan.textContent = newBpm;

    // update online count slowly
    let currentOnline = parseFloat(onlineSpan.textContent);
    let newOnline = (currentOnline + (Math.random() * 0.02 - 0.01)).toFixed(1) + 'k';
    onlineSpan.textContent = newOnline;
  }, 5000);
});