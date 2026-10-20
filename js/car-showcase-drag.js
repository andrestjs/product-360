/**
 * car-showcase-drag.js
 * Versión 2: los videos de fondo se controlan arrastrando horizontalmente
 * el mouse (o el dedo). Cada .car-showcase--drag es una instancia
 * independiente: su propio progreso, su propio seek y su propio icono.
 */
(function () {
  'use strict';

  const sections = document.querySelectorAll('.car-showcase--drag');
  if (!sections.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Distancia base de arrastre; se multiplica según el movimiento detectado
  const BASE_DRAG_DISTANCE = () => window.innerWidth * 1.2;
  // Amortiguación del seguimiento (más bajo = más suave, más alto = más directo)
  const SMOOTHING = 0.12;

  // --- Detección automática de movimiento del video ---
  // Muestrea N fotogramas en un canvas diminuto y mide la diferencia
  // media entre pares consecutivos. Un plano casi estático da un score
  // bajo (~0-2); cámara en movimiento, alto (~5+). El score escala la
  // distancia de arrastre para que la velocidad percibida se nivele
  // entre videos distintos sin configuración manual.
  const SAMPLE_COUNT = 6;
  const SAMPLE_WIDTH = 64;
  const SAMPLE_HEIGHT = 36;
  // Multiplicador = score / MOTION_REF. Calibrado empíricamente: un plano
  // estable tipo "video del auto" da ~20 (≈1x) y cámara en movimiento
  // tipo "prueba" ~38 (≈2x), nivelando la sensación de velocidad.
  const MOTION_REF = 19;
  const MOTION_DRAG_MIN = 0.9;
  const MOTION_DRAG_MAX = 3;

  function estimateMotionScore(video, shouldAbort) {
    return new Promise(function (resolve) {
      if (!video.duration || !isFinite(video.duration)) {
        resolve(null);
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = SAMPLE_WIDTH;
      canvas.height = SAMPLE_HEIGHT;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(null);
        return;
      }

      const timestamps = [];
      for (let i = 0; i < SAMPLE_COUNT; i++) {
        timestamps.push(video.duration * ((i + 0.5) / SAMPLE_COUNT));
      }

      let prevData = null;
      let totalDiff = 0;
      let pairs = 0;
      let idx = 0;
      let settled = false;

      function finish(score) {
        if (settled) return;
        settled = true;
        video.removeEventListener('seeked', onSeeked);
        resolve(score);
      }

      function onSeeked() {
        // El usuario empezó a arrastrar: se aborta y se respeta su interacción
        if (shouldAbort()) {
          finish(null);
          return;
        }
        try {
          ctx.drawImage(video, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
          const data = ctx.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data;
          if (prevData) {
            let sum = 0;
            for (let p = 0; p < data.length; p += 4) {
              sum += Math.abs(data[p] - prevData[p]);
              sum += Math.abs(data[p + 1] - prevData[p + 1]);
              sum += Math.abs(data[p + 2] - prevData[p + 2]);
            }
            totalDiff += sum / (SAMPLE_WIDTH * SAMPLE_HEIGHT * 3);
            pairs++;
          }
          prevData = data;
        } catch (e) {
          // Canvas protegido (vídeo cross-origin) u otro error: sin ajuste
          finish(null);
          return;
        }
        idx++;
        if (idx >= timestamps.length) {
          finish(pairs > 0 ? totalDiff / pairs : null);
          return;
        }
        video.currentTime = timestamps[idx];
      }

      video.addEventListener('seeked', onSeeked);
      video.currentTime = timestamps[0];
    });
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  // Cada sección se inicializa por separado; no comparten estado
  function initShowcase(section) {
    const video = section.querySelector('.car-showcase__video');
    const dragHint = section.querySelector('.car-showcase__drag-hint');

    // --- Fallback: movimiento reducido — primer frame estático ---
    if (prefersReducedMotion) {
      section.classList.add('car-showcase--static');
      return;
    }

    let metadataReady = false;
    let dragging = false;
    let pointerStartX = 0;
    let progressStart = 0;
    let targetProgress = 0; // progreso deseado según la posición del puntero
    let currentProgress = 0; // progreso mostrado (suavizado)
    let pendingTarget = null; // seek objetivo pendiente mientras el navegador trabaja
    let rafId = null;
    let dragMultiplier = 1; // se ajusta tras detectar el movimiento del video

    // Distancia de arrastre efectiva de esta instancia
    function dragDistance() {
      return BASE_DRAG_DISTANCE() * dragMultiplier;
    }

    // Escribe la posición temporal del video (protección de seeks en curso)
    function setVideoProgress(progress) {
      if (!metadataReady || !video.duration) return;
      // Envoltorio circular: al pasar del final el video se reinicia
      // (y al pasar antes del inicio, va al final) — el arrastre sigue
      // respondiendo en la misma dirección
      const wrapped = ((progress % 1) + 1) % 1;
      const target = wrapped * (video.duration - 0.05);

      if (video.seeking) {
        pendingTarget = target;
        return;
      }
      if (Math.abs(video.currentTime - target) > 0.01) {
        video.currentTime = target;
      }
    }

    video.addEventListener('seeked', function () {
      if (pendingTarget === null) return;
      if (Math.abs(video.currentTime - pendingTarget) > 0.01) {
        video.currentTime = pendingTarget;
      }
      pendingTarget = null;
    });

    function render() {
      currentProgress += (targetProgress - currentProgress) * SMOOTHING;

      // Se da por alcanzado para detener el bucle y no consumir CPU en vano
      if (Math.abs(targetProgress - currentProgress) < 0.0005) {
        currentProgress = targetProgress;
        rafId = null;
        setVideoProgress(currentProgress);
        return;
      }

      setVideoProgress(currentProgress);
      rafId = requestAnimationFrame(render);
    }

    function requestRender() {
      if (rafId === null) {
        rafId = requestAnimationFrame(render);
      }
    }

    // --- Eventos de puntero (ratón, lápiz y táctil) ---

    function onPointerDown(event) {
      if (!metadataReady) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      // El icono de invitación desaparece en la primera interacción
      if (dragHint) {
        dragHint.classList.add('car-showcase__drag-hint--hidden');
      }

      dragging = true;
      section.classList.add('is-dragging');
      section.setPointerCapture(event.pointerId);

      pointerStartX = event.clientX;
      progressStart = currentProgress;
    }

    function onPointerMove(event) {
      if (!dragging) return;
      event.preventDefault();

      // Dirección invertida a propósito: arrastrar a la IZQUIERDA avanza
      // el video (como jalando la cinta) y a la DERECHA retrocede.
      // El progreso no se limita a [0,1]: es continuo y el envoltorio
      // ocurre al convertirlo a currentTime, de modo que al agotar el
      // video este se reinicia y el arrastre sigue de forma natural
      const deltaX = event.clientX - pointerStartX;
      targetProgress = progressStart - deltaX / dragDistance();
      requestRender();
    }

    function endDrag(event) {
      if (!dragging) return;
      dragging = false;
      section.classList.remove('is-dragging');
      if (event && section.hasPointerCapture(event.pointerId)) {
        section.releasePointerCapture(event.pointerId);
      }
    }

    section.addEventListener('pointerdown', onPointerDown);
    section.addEventListener('pointermove', onPointerMove);
    section.addEventListener('pointerup', endDrag);
    section.addEventListener('pointercancel', endDrag);

    // Las imágenes arrastrables nativas de algunos navegadores interfieren
    section.addEventListener('dragstart', function (event) {
      event.preventDefault();
    });

    // Tras los metadatos se mide el movimiento del video y se ajusta la
    // distancia de arrastre; se descarta si el usuario ya está arrastrando
    function calibrateDragDistance() {
      setTimeout(function () {
        if (dragging) return;
        estimateMotionScore(video, function () {
          return dragging;
        }).then(function (score) {
          // La posición vuelve al punto donde estaba el usuario
          setVideoProgress(currentProgress);
          if (score === null || dragging) return;
          dragMultiplier = clamp(score / MOTION_REF, MOTION_DRAG_MIN, MOTION_DRAG_MAX);
          // Visible para depuración / inspección
          section.dataset.motionScore = score.toFixed(2);
          section.dataset.dragMultiplier = dragMultiplier.toFixed(2);
        });
      }, 250);
    }

    // --- Carga de metadatos ---
    function init() {
      if (video.readyState >= 1) {
        metadataReady = true;
        setVideoProgress(0);
        calibrateDragDistance();
        return;
      }

      const onMetadata = function () {
        metadataReady = true;
        video.removeEventListener('loadedmetadata', onMetadata);
        video.removeEventListener('error', onError);
        setVideoProgress(0);
        calibrateDragDistance();
      };

      const onError = function () {
        video.removeEventListener('loadedmetadata', onMetadata);
        video.removeEventListener('error', onError);
        section.classList.add('car-showcase--static');
      };

      video.addEventListener('loadedmetadata', onMetadata);
      video.addEventListener('error', onError);
      video.load();
    }

    // Pausa permanente: el video nunca se reproduce solo
    video.pause();
    init();
  }

  // Inicializa todas las secciones presentes en la página
  sections.forEach(initShowcase);
})();
