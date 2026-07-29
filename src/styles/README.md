# `src/styles`

Carpeta reservada para CSS auxiliar (tokens, animaciones complejas,
overrides puntuales).

Actualmente **el estilado vive 100 % en**:

- `src/index.css` → directivas de Tailwind + utilidades de la Guía CSS
- `tailwind.config.js` → paleta + animaciones

> Si en algún momento se introducen CSS modules o un sistema de tokens
> JSON, deberían vivir aquí.

## No duplicar estilos

Antes de añadir CSS:

1. Comprobar si una clase de Tailwind ya lo hace.
2. Comprobar si una utilidad de `@layer components` en `index.css` ya
   existe (`.card`, `.input-base`, `.label-base`).
3. Si nada existe, añadirlo a `@layer components` en `index.css` con un
   nombre semántico — **no** crear un archivo CSS suelto.
