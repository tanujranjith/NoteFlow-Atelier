
      // --- AMBIENT CANVAS BACKGROUND (Rebuilt) ---
      const canvas = document.getElementById('ambient-canvas');
      const ctx = canvas.getContext('2d');
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: 
reduce)').matches;
      const AMBIENT_STATIC = prefersReducedMotion;
  
      let width = 0;
      let height = 0;
      let dpr = 1;
      let time = 0;
      let lastTs = 0;
      let streakTimer = null;
      const pointerFineQuery = window.matchMedia('(pointer: fine)');
      const pointer = { x: -9999, y: -9999, active: false };
      const DOTS_PER_MEGAPIXEL = 100;
      const MIN_DOTS = 210;
      const MAX_DOTS = 950;
  
      function createDot() {
        return {
          x: Math.random(),
          y: Math.random(),
          vx: (Math.random() - 0.5) * 0.00008,
          vy: (Math.random() - 0.5) * 0.00008,
          size: Math.random() * 0.9 + 0.95,
          opacity: Math.random() * 0.32 + 0.18
        };
      }
  
      const dots = Array.from({ length: MIN_DOTS }, () => createDot());
  
      const nodes = Array.from({ length: 36 }, () => ({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.000045,
        vy: (Math.random() - 0.5) * 0.000045,
        size: Math.random() * 0.8 + 1.0,
        sx: 0,
        sy: 0
      }));
  
      const streaks = [];
      const MAX_STREAKS = 2;
      const STREAK_LINK_REACH = 260;
      const STREAK_TAIL_SEGMENTS = 3.6;
  
      function getCanvasHeight() {
        return Math.max(
          window.innerHeight,
          document.documentElement.scrollHeight,
          document.body.scrollHeight
        );
      }
  
      function targetDotCount() {
        const areaMegapixels = (width * height) / 1_000_000;
        const preferred = Math.round(areaMegapixels * DOTS_PER_MEGAPIXEL);
        return Math.max(MIN_DOTS, Math.min(MAX_DOTS, preferred));
      }
  
      function syncDotCount() {
        const target = targetDotCount();
        if (dots.length < target) {
          for (let i = dots.length; i < target; i++) {
            dots.push(createDot());
          }
        } else if (dots.length > target) {
          dots.length = target;
        }
      }
  
      function resize() {
        width = window.innerWidth;
        height = getCanvasHeight();
        syncDotCount();
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.floor(width * dpr));
        canvas.height = Math.max(1, Math.floor(height * dpr));
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        render(0);
      }
  
      function wrap01(value) {
        if (value < 0) return value + 1;
        if (value > 1) return value - 1;
        return value;
      }
  
      function updateEntities(dt) {
        const dtMs = Math.min(32, dt || 16.67);
        const scale = dtMs / 16.67;
        const repelRadiusPx = 150;
        const repelStrengthPx = 8.5;
  
        dots.forEach((dot) => {
          dot.x = wrap01(dot.x + dot.vx * scale);
          dot.y = wrap01(dot.y + dot.vy * scale);
  
          if (pointer.active && pointerFineQuery.matches) {
            const px = dot.x * width;
            const py = dot.y * height;
            const dx = px - pointer.x;
            const dy = py - pointer.y;
            const dist = Math.hypot(dx, dy);
  
            if (dist > 0.01 && dist < repelRadiusPx) {
              const falloff = 1 - dist / repelRadiusPx;
              const push = repelStrengthPx * falloff * falloff * scale;
              dot.x = wrap01(dot.x + (dx / dist) * (push / width));
              dot.y = wrap01(dot.y + (dy / dist) * (push / height));
            }
          }
        });
  
        nodes.forEach((node) => {
          node.x = wrap01(node.x + node.vx * scale);
          node.y = wrap01(node.y + node.vy * scale);
          node.sx = node.x * width;
          node.sy = node.y * height;
        });
      }
  
      function drawGrid() {
        const drift = (time * 2) % 120;
        ctx.lineWidth = 1;
  
        const drawLayer = (size, alpha) => {
          const startX = -size + drift;
          ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
          ctx.beginPath();
          for (let x = startX; x < width + size; x += size) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
          }
          for (let y = 0; y < height + size; y += size) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
          }
          ctx.stroke();
        };
  
        drawLayer(30, 0.012);
        drawLayer(60, 0.02);
        drawLayer(120, 0.032);
      }
  
      function drawDots() {
        dots.forEach((dot) => {
          const x = dot.x * width;
          const y = dot.y * height;
          const twinkle = Math.sin(time * 3 + dot.x * 30 + dot.y * 20) * 0.08;
          const alpha = Math.max(0.08, dot.opacity + twinkle);
          const radius = Math.max(1, dot.size);
  
          ctx.fillStyle = `rgba(210, 228, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        });
      }
  
      function drawNodeNetwork() {
        const connectionDist = 165;
  
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].sx - nodes[j].sx;
            const dy = nodes[i].sy - nodes[j].sy;
            const dist = Math.hypot(dx, dy);
            if (dist >= connectionDist) continue;
            const alpha = (1 - dist / connectionDist) * 0.07;
            ctx.strokeStyle = `rgba(152, 186, 255, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].sx, nodes[i].sy);
            ctx.lineTo(nodes[j].sx, nodes[j].sy);
            ctx.stroke();
          }
        }
  
        nodes.forEach((node) => {
          ctx.fillStyle = 'rgba(197, 220, 255, 0.17)';
          ctx.beginPath();
          ctx.arc(node.sx, node.sy, node.size, 0, Math.PI * 2);
          ctx.fill();
        });
      }
  
      function scheduleNextStreak() {
        if (AMBIENT_STATIC) return;
        const delay = 3400 + Math.random() * 4200;
        streakTimer = window.setTimeout(createStreak, delay);
      }
  
      function createStreak() {
        if (streaks.length >= MAX_STREAKS || nodes.length < 6) {
          scheduleNextStreak();
          return;
        }
  
        const start = nodes[Math.floor(Math.random() * nodes.length)];
        const path = [start];
        let current = start;
        const steps = 6 + Math.floor(Math.random() * 5); // 6..10
  
        for (let i = 0; i < steps; i++) {
          const candidates = nodes
            .filter((n) => !path.includes(n))
            .map((n) => {
              const dx = n.sx - current.sx;
              const dy = n.sy - current.sy;
              return { node: n, dist: Math.hypot(dx, dy) };
            })
            .filter((item) => item.dist <= STREAK_LINK_REACH)
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 6);
  
          if (!candidates.length) break;
          current = candidates[Math.floor(Math.random() * 
candidates.length)].node;
          path.push(current);
        }
  
        if (path.length > 1) {
          streaks.push({
            path,
            startedAt: performance.now(),
            duration: 950 + Math.random() * 550
          });
        }
  
        scheduleNextStreak();
      }
  
      function drawStreaks(now) {
        if (!streaks.length) return;
  
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
  
        for (let s = streaks.length - 1; s >= 0; s--) {
          const streak = streaks[s];
          const t = (now - streak.startedAt) / streak.duration;
          if (t >= 1) {
            streaks.splice(s, 1);
            continue;
          }
  
          const path = streak.path;
          const segCount = path.length - 1;
          const head = t * (segCount + STREAK_TAIL_SEGMENTS);
          const tail = head - STREAK_TAIL_SEGMENTS;
  
          for (let i = 0; i < segCount; i++) {
            const segStart = Math.max(0, Math.min(1, tail - i));
            const segEnd = Math.max(0, Math.min(1, head - i));
            if (segEnd <= segStart) continue;
  
            const a = path[i];
            const b = path[i + 1];
            const x1 = a.sx + (b.sx - a.sx) * segStart;
            const y1 = a.sy + (b.sy - a.sy) * segStart;
            const x2 = a.sx + (b.sx - a.sx) * segEnd;
            const y2 = a.sy + (b.sy - a.sy) * segEnd;
  
            const envelope = Math.sin(t * Math.PI);
            const intensity = (segEnd - segStart) * envelope;
            if (intensity <= 0) continue;
  
            const glow = ctx.createLinearGradient(x1, y1, x2, y2);
            glow.addColorStop(0, `rgba(145, 193, 255, ${0.55 * intensity})`);
            glow.addColorStop(1, `rgba(231, 245, 255, ${0.95 * intensity})`);
  
            ctx.strokeStyle = glow;
            ctx.lineWidth = 2.3;
            ctx.shadowBlur = 9;
            ctx.shadowColor = `rgba(185, 220, 255, ${0.7 * intensity})`;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
  
            ctx.shadowBlur = 0;
            ctx.strokeStyle = `rgba(255,255,255,${0.5 * intensity})`;
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
  
        ctx.restore();
      }
  
      function render(timestamp) {
        const dt = timestamp && lastTs ? timestamp - lastTs : 16.67;
        lastTs = timestamp || 0;
        if (!AMBIENT_STATIC) time += 0.003;
        const expectedHeight = getCanvasHeight();
        if (expectedHeight !== height) {
          resize();
          return;
        }
  
        const bgGrad = ctx.createRadialGradient(
          width * 0.5 + Math.sin(time * 0.45) * 40,
          height * 0.35 + Math.cos(time * 0.35) * 25,
          0,
          width * 0.5,
          height * 0.5,
          width * 1.2
        );
        bgGrad.addColorStop(0, 'rgba(12, 18, 30, 0.4)');
        bgGrad.addColorStop(1, 'rgba(2, 3, 6, 0.6)');
        ctx.fillStyle = bgGrad;
        ctx.clearRect(0, 0, width, height); // Clear first
        ctx.fillRect(0, 0, width, height);
  
        drawGrid();
  
        if (!AMBIENT_STATIC) updateEntities(dt);
        else updateEntities(0);
  
        drawNodeNetwork();
        drawDots();
        drawStreaks(performance.now());
  
        if (!AMBIENT_STATIC) {
          requestAnimationFrame(render);
        }
      }
  
      window.addEventListener('resize', resize);
      window.addEventListener('pointermove', (event) => {
        if (!pointerFineQuery.matches) return;
        pointer.x = event.pageX;
        pointer.y = event.pageY;
        pointer.active = true;
      });
      window.addEventListener('pointerleave', () => {
        pointer.active = false;
      });
      window.addEventListener('blur', () => {
        pointer.active = false;
      });
      resize();
      if (!AMBIENT_STATIC) scheduleNextStreak();
      if (AMBIENT_STATIC) render(0);
      else requestAnimationFrame(render);
  
      // --- SCROLL EFFECTS ---
      const navbar = document.getElementById('navbar');
      const staticMode = document.body.classList.contains('no-parallax');
      if (!staticMode) {
        window.addEventListener('scroll', () => {
          if(window.scrollY > 20) {
            navbar.classList.add('scrolled');
          } else {
            navbar.classList.remove('scrolled');
          }
        });
      }
  
      // Semantic reveal
      const reveals = document.querySelectorAll('.reveal');
      if (staticMode) {
        reveals.forEach(el => el.classList.add('visible'));
      } else {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if(entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  
        reveals.forEach(el => {
          observer.observe(el);
        });
      }
  
      // Workflow interactive steps
      function activateStep(el) {
        document.querySelectorAll('.workflow-step').forEach(step => 
step.classList.remove('active'));
        el.classList.add('active');
      }
  
      // Footer Year
      document.getElementById('year').textContent = new Date().getFullYear();
  
      // Rotating Phrase System
      const phrases = [
        "intentional thought",
        "deep work",
        "structured thinking",
        "creative flow",
        "clear thinking",
        "meaningful progress",
        "focused work",
        "thoughtful planning",
        "ideas that matter",
        "work that compounds",
        "thinking that scales",
        "clarity under pressure",
        "disciplined creativity",
        "ideas in motion",
        "plans that hold",
        "work with direction",
        "thoughts in structure",
        "effort with intention",
        "what matters",
        "what you build",
        "what you focus on",
        "what you create",
        "how you think",
        "how you work",
        "quiet ambition",
        "sustained focus",
        "long-term thinking",
        "mental clarity",
        "cognitive flow",
        "unfinished ideas"
      ];
  
      const phraseWrapper = document.getElementById('rotating-phrase-wrapper');
      const phraseElement = document.createElement('span');
      phraseElement.className = 'phrase';
      phraseWrapper.innerHTML = '';
      phraseWrapper.appendChild(phraseElement);
  
      let currentPhraseIndex = 0;
      let currentCharIndex = 0;
      let isDeleting = false;
      let typingSpeed = 100;
      let deletingSpeed = 50;
      let pauseAfterTyping = 2000;
      let pauseAfterDeleting = 80;
  
      function typeWriter() {
        const currentPhrase = phrases[currentPhraseIndex];
        
        if (isDeleting) {
          phraseElement.textContent = currentPhrase.substring(0, 
currentCharIndex - 1);
          currentCharIndex--;
        } else {
          phraseElement.textContent = currentPhrase.substring(0, 
currentCharIndex + 1);
          currentCharIndex++;
        }
  
        let timeoutSpeed = isDeleting ? deletingSpeed : typingSpeed;
  
        if (!isDeleting && currentCharIndex === currentPhrase.length) {
          timeoutSpeed = pauseAfterTyping;
          isDeleting = true;
        } else if (isDeleting && currentCharIndex === 0) {
          // Keep line box stable between phrases to avoid layout/scrollbar 
flicker.
          phraseElement.textContent = '\u00A0';
          isDeleting = false;
          currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
          timeoutSpeed = pauseAfterDeleting;
        }
  
        setTimeout(typeWriter, timeoutSpeed);
      }
  
      // Start typing effect
      setTimeout(typeWriter, 500);
  



