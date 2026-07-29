# `components/layout` — Componentes de layout

Estructuras macro que **aparecen una sola vez por página** y dan forma a la
pantalla.

## Inventario

| Componente      | Aparece en        | Spec en la Guía CSS |
|-----------------|-------------------|---------------------|
| `Header`        | Todas las páginas | §3 — Header principal |
| `ToggleAuth`    | LoginPage         | §4 — Toggle Trabajador/Encargado |
| `HorizontalNav` | `/central/*`      | §8 — Navegación horizontal Central |

## Patrón obligatorio

El **Header siempre va primero** y es sticky (`sticky top-0 z-40`). Bajo él:

- Si es Login → `ToggleAuth`
- Si es Central → `HorizontalNav`
- Si es Trabajador o Encargado → directo al contenido

## Por qué no hay sidebar

La app es **mobile-first**. La navegación lateral está prohibida: rompería el
ancho de 400 px y la experiencia táctil. Toda la navegación es:

- Botones de pantalla a pantalla (verde, sección 7 de la guía).
- `HorizontalNav` con scroll horizontal en el Central.
- El botón derecho del Header (`CENTRAL`, `Salir`, `Volver`).
