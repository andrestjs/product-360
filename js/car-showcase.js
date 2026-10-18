/**
 * car-showcase.js
 * Sección inmersiva: sincroniza la reproducción del video con el scroll
 * usando GSAP + ScrollTrigger (scrub basado en currentTime).
 */
(function () {
  'use strict';

  const SELECTOR = '.car-showcase';
  const SCROLL_DISTANCE = '300%'; // distancia de scroll de la secuencia

  const section = document.querySelector(SELECTOR);
  if (!section) return;

  const video = section.querySelector('.car-showcase__video');
  const blockIntro = section.querySelector('.car-showcase__block--intro');
  const blockDescription = section.querySelector('.car-showcase__block--description');
  const blockOutro = section.querySelector('.car-showcase__block--outro');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Fallback: sin GSAP, sin metadatos o movimiento reducido ---
  // Se muestra el primer momento estático y el video permanece en pausa.
  function enableStaticFallback() {
    section.classList.add('car-showcase--static');
  }

  if (prefersReducedMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    enableStaticFallback();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  let scrollTriggerInstance = null;
  let timeline = null;
  let metadataReady = false;
  let pendingTarget = null; // seek objetivo pendiente mientras el navegador trabaja

  // Marca el frame como válido para pintar; el seek es síncrono con el scroll
  function setVideoProgress(progress) {
    if (!metadataReady || !video.duration) return;
    // Se evita el primer y último frame por redondeos de códec
    const clamped = Math.min(Math.max(progress, 0), 1);
    const target = clamped * (video.duration - 0.05);

    // Si hay un seek en curso no se encola otro: se guarda el último
    // objetivo y se aplica en el evento "seeked" (ver abajo)
    if (video.seeking) {
      pendingTarget = target;
      return;
    }
    // Solo se escribe si el salto supera umbral: evita trabajos innecesarios por frame
    if (Math.abs(video.currentTime - target) > 0.01) {
      video.currentTime = target;
    }
  }

  // Al terminar un seek se aplica el objetivo más reciente si el usuario
  // siguió desplazándose mientras el navegador decodificaba
  video.addEventListener('seeked', function () {
    if (pendingTarget === null) return;
    if (Math.abs(video.currentTime - pendingTarget) > 0.01) {
      video.currentTime = pendingTarget;
    }
    pendingTarget = null;
  });

  function buildExperience() {
    // Limpieza previa (re-inicialización tras resize o recarga)
    if (timeline) {
      timeline.scrollTrigger && timeline.scrollTrigger.kill();
      timeline.kill();
      timeline = null;
    }
    if (scrollTriggerInstance) {
      scrollTriggerInstance.kill();
      scrollTriggerInstance = null;
    }

    // Estados iniciales de los bloques de contenido
    gsap.set([blockIntro, blockDescription, blockOutro], {
      autoAlpha: 0,
      y: 40,
    });
    gsap.set(section.querySelector('.car-showcase__line'), { scaleX: 0, transformOrigin: 'center' });

    // Timeline maestro: los tres momentos reparten el progreso del scrub
    timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=' + SCROLL_DISTANCE,
        pin: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefresh(self) {
          // Recalcula la posición temporal tras cambios de tamaño
          setVideoProgress(self.progress);
        },
        onUpdate(self) {
          // Núcleo de la sincronización: progreso de scroll → currentTime del video
          setVideoProgress(self.progress);
        },
      },
    });
    scrollTriggerInstance = timeline.scrollTrigger;

    // --- Primer momento: presentación del modelo (~0 % – 30 %) ---
    timeline
      .to(blockIntro, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.02)
      .to(section.querySelector('.car-showcase__line'), { scaleX: 1, duration: 0.08 }, 0.08)
      .to(blockIntro, { autoAlpha: 0, y: -30, duration: 0.08 }, 0.26)

      // --- Segundo momento: descripción (~30 % – 65 %) ---
      .to(blockDescription, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.34)
      .to(blockDescription, { autoAlpha: 0, y: -30, duration: 0.08 }, 0.6)

      // --- Tercer momento: cierre (~65 % – 100 %) ---
      .to(blockOutro, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.68)
      .to(blockOutro, { autoAlpha: 0, y: -20, duration: 0.1 }, 0.9);

    // Estado inicial del video
    setVideoProgress(0);
  }

  // --- Carga de metadatos: se necesita la duración antes de sincronizar ---
  function init() {
    if (video.readyState >= 1) {
      metadataReady = true;
      buildExperience();
      return;
    }

    const onMetadata = function () {
      metadataReady = true;
      video.removeEventListener('loadedmetadata', onMetadata);
      video.removeEventListener('error', onError);
      buildExperience();
    };

    const onError = function () {
      // Sin video utilizable: se recurre al modo estático
      video.removeEventListener('loadedmetadata', onMetadata);
      video.removeEventListener('error', onError);
      enableStaticFallback();
    };

    video.addEventListener('loadedmetadata', onMetadata);
    video.addEventListener('error', onError);

    // Safari/iOS a veces no dispara loadedmetadata con preload hasta el seek
    video.load();
  }

  // Pausa el video en todo momento: nunca se reproduce solo
  video.pause();

  init();

  // --- Re-inicialización controlada al cambiar el tamaño ---
  let resizeTimer = null;
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', function () {
    // Solo interesa el cambio de ancho (orientación / dispositivo)
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;

    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!metadataReady) return;
      buildExperience();
      ScrollTrigger.refresh();
    }, 250);
  });
})();
