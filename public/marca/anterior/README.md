# Respaldo de la marca anterior

Logo e íconos que se usaban antes del cambio de marca de octubre de 2026.

| Archivo | Uso anterior |
| --- | --- |
| `logo-sano-y-rico.png` | Logo de la página, el login, los flyers y las imágenes de cupones |
| `icon.png` | Ícono de la pestaña (512×512) |
| `favicon.ico` | Ícono de la pestaña para navegadores viejos |
| `apple-icon.png` | Ícono al guardar la página en el inicio del iPhone |

## Cómo volver al logo anterior

1. Copiar `logo-sano-y-rico.png` a `public/` con un nombre nuevo (por ejemplo `logo-sano-y-rico-v3.png`), para que ningún caché sirva el logo actual.
2. Reemplazar `logo-sano-y-rico-v2.png` por ese nombre en todo el código (`src/` y `next.config.ts`).
3. Copiar `icon.png`, `favicon.ico` y `apple-icon.png` a `src/app/`, reemplazando los actuales.
