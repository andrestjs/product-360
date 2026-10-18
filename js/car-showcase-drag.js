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

  // Píxeles de arrastre necesarios para recorrer todo el video
  const DRAG_DISTANCE = () => window.innerWidth * 1.2;
  // Amortiguación del seguimiento (más bajo = más suave, más alto = más directo)
  const SMOOTHING = 0.12;

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

    // Escribe la posición temporal del video (protección de seeks en curso)
    function setVideoProgress(progress) {
      if (!metadataReady || !video.duration) return;
      const target = progress * (video.duration - 0.05);

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
      // el video (como jalando la cinta) y a la DERECHA retrocede
      const deltaX = event.clientX - pointerStartX;
      targetProgress = clamp(progressStart - deltaX / DRAG_DISTANCE(), 0, 1);
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

    // --- Carga de metadatos ---
    function init() {
      if (video.readyState >= 1) {
        metadataReady = true;
        setVideoProgress(0);
        return;
      }

      const onMetadata = function () {
        metadataReady = true;
        video.removeEventListener('loadedmetadata', onMetadata);
        video.removeEventListener('error', onError);
        setVideoProgress(0);
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
