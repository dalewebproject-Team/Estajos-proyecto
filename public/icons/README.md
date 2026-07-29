# `public/icons`

Iconos de la PWA. **Sin transparencia** (los manifestos `maskable` los
recortan en círculo y cualquier transparencia se vuelve negro feo).

## Requisitos

| Archivo        | Tamaño   | Uso |
|----------------|----------|-----|
| `icon-192.png` | 192×192  | Android `add to home screen` |
| `icon-512.png` | 512×512  | Android (splash), iOS, Lighthouse PWA |
| `favicon.ico`  | 32×32    | Pestaña del navegador (opcional) |

## Diseño recomendado

- Fondo sólido `#1a2332` (navy-dark de la paleta).
- Icono central en `#e8b341` (gold).
- Margen de seguridad ~10 % para que el recorte maskable no corte el logo.

## Generar

Puedes generar variantes automáticas con:

```bash
npx pwa-asset-generator logo.svg public/icons \
  --background "#1a2332" --opaque \
  --manifest public/manifest.webmanifest
```
