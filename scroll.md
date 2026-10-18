Quiero desarrollar una sección interactiva de presentación de un automóvil utilizando HTML, SCSS y JavaScript, integrando GSAP y su plugin ScrollTrigger.

Antes de comenzar, analiza la estructura existente del proyecto, identifica cómo están organizados los componentes, los estilos y los archivos JavaScript, y sigue las convenciones actuales del proyecto. No modifiques archivos ajenos a esta funcionalidad.

### 1. Estructura y dimensiones de la sección

Crea una sección inmersiva para presentar un automóvil con las siguientes características:

* La sección debe ocupar el 100% del ancho del viewport (`100vw`) y tener una altura mínima de `800px`.
* Su altura inicial debe ser de `100vh`, respetando la altura mínima indicada.
* El video debe cubrir completamente el área visible, utilizando `width: 100%`, `height: 100%` y `object-fit: cover`.
* El video debe estar ubicado dentro de la carpeta `video` del proyecto. Antes de implementar la funcionalidad, identifica el archivo disponible y utiliza su ruta real, sin inventar nombres ni rutas.
* El video debe permanecer visualmente fijo durante la secuencia de scroll, mientras los elementos de texto aparecen progresivamente sobre él.
* Implementa una capa superpuesta con un degradado oscuro sutil para garantizar que los textos sean legibles sin ocultar los detalles del vehículo.
* El diseño debe transmitir una estética premium, minimalista y cinematográfica, similar a las webs modernas de presentación de automóviles de alta gama.

### 2. Control del video mediante scroll

Esta es la funcionalidad principal.

Utiliza GSAP y ScrollTrigger para sincronizar la reproducción del video con el desplazamiento vertical del usuario.

Requisitos:

* El video NO debe reproducirse automáticamente en tiempo real.
* El video debe comenzar en una posición inicial determinada y avanzar progresivamente según el scroll.
* Cuando el usuario haga scroll hacia abajo, el video debe avanzar.
* Cuando el usuario haga scroll hacia arriba, el video debe retroceder hasta la posición correspondiente.
* La reproducción debe estar vinculada al progreso de ScrollTrigger, de manera que la posición temporal del video dependa directamente del progreso de la animación.
* El video debe permanecer fijado visualmente durante la secuencia mediante `pin`.
* Configura una distancia de scroll suficiente para que la experiencia sea fluida y permita visualizar los diferentes estados de la presentación.
* Utiliza `scrub` para sincronizar el progreso del video con el scroll.
* Evita que el video se reproduzca de forma independiente mientras el usuario permanece quieto.
* Gestiona correctamente la carga de metadatos del video para conocer su duración antes de intentar sincronizar su reproducción.
* Considera las políticas de los navegadores respecto a los videos, incluyendo `muted`, `playsinline` y `preload`, cuando corresponda.
* Evita saltos visuales, bloqueos y comportamientos inesperados durante la inicialización.

Importante: utiliza la propiedad `currentTime` del elemento de video para sincronizar su posición temporal con el progreso de ScrollTrigger. No implementes una reproducción convencional mediante `video.play()` como mecanismo principal de control.

### 3. Aparición progresiva del contenido

Durante la secuencia de scroll, deben aparecer diferentes elementos de contenido sobre el video.

Organiza la experiencia en tres momentos:

**Primer momento: presentación del modelo**

Al comenzar el scroll, muestra progresivamente:

* Una pequeña etiqueta con la marca del fabricante.
* El nombre del modelo del automóvil, como elemento tipográfico principal.
* Una línea decorativa o un pequeño indicador visual.

La animación debe combinar un desplazamiento vertical sutil con un efecto de opacidad (`opacity`).

**Segundo momento: descripción del vehículo**

A medida que continúa el scroll:

* El nombre del modelo debe desaparecer progresivamente o cambiar de posición.
* Debe aparecer una breve descripción del automóvil.
* Añade una composición tipográfica elegante, con un ancho de lectura controlado.
* La descripción debe entrar con una transición suave, sin movimientos exagerados.

**Tercer momento: cierre de la presentación**

En una fase posterior del scroll:

* Muestra una frase destacada relacionada con el diseño, el rendimiento o la personalidad del vehículo.
* Incluye un enlace o botón visual para explorar el automóvil.
* El contenido debe desaparecer progresivamente al finalizar la secuencia, permitiendo continuar con la siguiente sección de la página.

Utiliza GSAP Timeline para coordinar las diferentes animaciones y evitar que los elementos aparezcan de forma desordenada.

Los textos son contenido de ejemplo y deben poder sustituirse fácilmente por los datos reales del automóvil.

### 4. Dirección visual y animaciones

El resultado debe sentirse como una presentación cinematográfica de un automóvil.

Aplica estos criterios:

* Tipografía moderna y elegante.
* Jerarquía visual clara entre marca, modelo y descripción.
* Animaciones suaves, precisas y controladas.
* Transiciones basadas principalmente en `opacity` y `transform`.
* Evita efectos excesivos, rebotes, rotaciones innecesarias o animaciones que distraigan de la imagen del automóvil.
* Mantén una composición visual limpia, con suficiente espacio negativo.
* Asegura que los textos permanezcan correctamente posicionados mientras el contenedor está fijado.
* Utiliza valores de `z-index` coherentes para organizar el video, la capa superpuesta y los elementos de contenido.

### 5. Arquitectura del código

Organiza la implementación siguiendo la arquitectura existente del proyecto.

Si el proyecto utiliza WordPress con un tema personalizado:

* Mantén el HTML dentro del componente o template correspondiente.
* Escribe los estilos en el archivo SCSS apropiado.
* Implementa la lógica en un módulo JavaScript independiente si esa es la convención del proyecto.
* Reutiliza las dependencias GSAP y ScrollTrigger si ya están instaladas.
* No instales librerías adicionales si no son necesarias.
* Evita introducir estilos inline innecesarios.
* Mantén el código modular, legible y fácil de mantener.

Utiliza nombres de clases semánticos y coherentes con la metodología de nomenclatura existente, como BEM si el proyecto ya la utiliza.

### 6. Rendimiento y compatibilidad

La experiencia debe estar optimizada para evitar problemas de rendimiento.

* No cargues el video completo de manera innecesaria.
* Gestiona correctamente los eventos de carga y los metadatos del video.
* Evita crear múltiples instancias de ScrollTrigger para la misma sección.
* Utiliza `invalidateOnRefresh` cuando sea necesario para recalcular las dimensiones.
* Implementa la limpieza de animaciones y listeners cuando el componente se destruya o se vuelva a inicializar.
* Comprueba el comportamiento al cambiar el tamaño de la ventana.
* Añade una alternativa visual para los navegadores o dispositivos en los que no pueda ejecutarse correctamente la experiencia.
* Respeta las preferencias de movimiento reducido mediante `prefers-reduced-motion`.
* Evita ejecutar cálculos o actualizaciones innecesarias en cada evento de scroll.

### 7. Diseño responsive

En escritorio, conserva la experiencia cinematográfica completa.

En dispositivos móviles:

* Mantén el video adaptado al viewport.
* Ajusta el tamaño de la tipografía y la posición de los textos.
* Evita que el contenido quede fuera de la pantalla.
* Revisa si la duración y la distancia de scroll necesitan ajustarse.
* Considera una experiencia simplificada si la sincronización del video produce problemas de rendimiento.

No presupongas que el video tendrá la misma composición en todos los tamaños de pantalla.

### 8. Criterios de aceptación

La implementación estará terminada cuando:

1. El video cubra correctamente la sección y respete sus dimensiones.
2. El video no avance por sí solo mientras el usuario permanece quieto.
3. El scroll hacia abajo avance el video y el scroll hacia arriba lo haga retroceder.
4. La sección permanezca fijada durante la secuencia prevista.
5. El nombre del modelo aparezca en el momento adecuado.
6. La descripción y el contenido final se revelen en diferentes fases del scroll.
7. Las transiciones sean fluidas y estén coordinadas mediante GSAP.
8. La sección funcione correctamente en escritorio y móvil.
9. La implementación no genere errores en la consola ni afecte otras secciones de la página.

Antes de finalizar, verifica el código implementado, comprueba las dependencias existentes y explica brevemente qué archivos se crearon o modificaron y cómo funciona la sincronización entre el video y ScrollTrigger.
