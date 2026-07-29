# `components/ui` — Átomos visuales

Componentes pequeños, **sin lógica de negocio**, totalmente alineados con la
Guía Técnica CSS.

## Inventario

| Componente     | Spec     | Variantes |
|----------------|----------|-----------|
| `Card`         | §5       | `white` · `dark` · `stat` |
| `Button`       | §7       | `primary` · `dark` · `outline` · `gold` · `pill` |
| `Input`        | §6       | input estándar + label |
| `PinInput`     | §6       | 4 dígitos, centrado, `tracking-[0.5em]` |
| `Badge`        | §9       | `mensual` · `quincenal` · `diario` · `custom` |
| `SectionTitle` | §5       | barra de color: `gold` · `green` · `red` |
| `CircleIcon`   | §13      | tamaños `sm` · `md` · `lg` · `xl` |

## Reglas estrictas

1. **Solo Tailwind** + los colores definidos en `tailwind.config.js`.
   Prohibidos los hex codes inline: ya están alias-ados (`bg-navy-dark`,
   `text-primary`, etc.).
2. **Cero acceso a stores ni APIs**.
3. **Props con JSDoc**. Si un componente acepta más de 3 props, listarlas
   explícitamente en el bloque doc en cabecera.
4. **Default export único** por archivo.

## Cuándo crear un nuevo átomo

Si una combinación de clases Tailwind se repite ≥ 3 veces en distintas
páginas, **extraer como componente UI**. Ejemplo: si en varias páginas
aparece el mismo patrón de "input con icono a la izquierda", crear
`<IconInput>`.

## Cuándo NO crear un nuevo átomo

Si el patrón es específico de una página o de un módulo de negocio
(trabajadores, vehículos…), **debe ir en `components/domain/`**, no aquí.
