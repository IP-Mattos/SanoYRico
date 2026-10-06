// src/lib/flyers/render.tsx
// Árbol JSX del flyer para Satori (next/og). Solo flexbox, display:flex explícito en contenedores.
/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og'
import type { ReactElement } from 'react'
import type { FuenteFlyer } from './assets'
import { GAP, PAD, calcularGeometria, esHorizontal, formatearPrecio } from './layout'
import type { FormatoFlyer } from './params'

export interface ProductoFlyer {
  nombre: string
  emoji: string | null
  imagen: string | null // data URI PNG/JPEG
  lista: number
  precio: number
  pct: number | null
}

export interface DatosFlyer {
  formato: FormatoFlyer
  titulo: string
  cupon: string | null
  productos: ProductoFlyer[]
  logo: string // data URI
  host: string
}

const C = {
  cafe: '#3d2b1f',
  ambar: '#c47c2b',
  crema: '#faf6ef',
  arena: '#f0e6d3',
  arenaOscura: '#e6d6b8'
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

function Anillos({ w, h }: { w: number; h: number }) {
  const anillo = (size: number, left: number, top: number, alpha: number, ancho = 3) => (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        width: size,
        height: size,
        left,
        top,
        borderRadius: 9999,
        border: `${ancho}px solid rgba(196,124,43,${alpha})`
      }}
    />
  )
  return (
    <div style={{ position: 'absolute', display: 'flex', left: 0, top: 0, width: w, height: h }}>
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          width: 620,
          height: 620,
          left: w - 380,
          top: -250,
          borderRadius: 9999,
          background: 'rgba(240,230,211,0.85)'
        }}
      />
      {anillo(760, w - 470, -330, 0.18)}
      {anillo(520, w - 350, -210, 0.14, 2)}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          width: 560,
          height: 560,
          left: -260,
          top: h - 330,
          borderRadius: 9999,
          background: 'rgba(240,230,211,0.7)'
        }}
      />
      {anillo(700, -330, h - 400, 0.16)}
      {anillo(460, -210, h - 280, 0.12, 2)}
    </div>
  )
}

function medidas(tileW: number, tileH: number) {
  const horizontal = esHorizontal(tileW, tileH)
  const ref = horizontal ? tileH * 1.15 : tileW
  const nameFs = Math.round(clamp(ref * 0.072, 26, 56))
  const pad = Math.round(clamp(ref * 0.04, 16, 28))
  return { horizontal, ref, nameFs, pad }
}

/** ¿Algún nombre necesita 2 líneas? (estimación por ancho medio de carácter) */
function necesitaDosLineas(productos: ProductoFlyer[], tileW: number, tileH: number): boolean {
  const { horizontal, nameFs, pad } = medidas(tileW, tileH)
  if (horizontal) return true
  const porLinea = Math.floor((tileW - pad * 2 - 8) / (nameFs * 0.56))
  return productos.some((p) => p.nombre.length > porLinea)
}

function Tile({
  p,
  tileW,
  tileH,
  reservarPromo,
  dosLineas
}: {
  p: ProductoFlyer
  tileW: number
  tileH: number
  reservarPromo: boolean
  dosLineas: boolean
}) {
  const { horizontal, nameFs: nameBase, pad } = medidas(tileW, tileH)
  // En tarjetas horizontales la imagen no puede comerse el ancho del texto
  const imgBox = horizontal ? Math.min(tileH - pad * 2, Math.round(tileW * 0.4)) : tileW - pad * 2
  const textW = horizontal ? tileW - imgBox - pad * 3 - 8 : tileW - pad * 2 - 4
  // Ajuste al ancho disponible (ancho medio de glifo ≈ 0,6 em): sin palabras cortadas ni precios desbordados
  const palabraMasLarga = Math.max(...p.nombre.split(/\s+/).map((w) => w.length), 1)
  const nameFs = Math.round(Math.min(nameBase, textW / (palabraMasLarga * 0.6)))
  const precioTexto = formatearPrecio(p.precio)
  const priceFs = Math.round(Math.min(nameFs * (horizontal ? 2 : 1.65), textW / (precioTexto.length * 0.62)))
  const pillFs = Math.round(nameFs * 0.72)
  const promoH = reservarPromo && horizontal ? Math.round(pillFs * 1.7) + 6 : 0
  const nameH = Math.round(nameFs * 1.15) * (dosLineas ? 2 : 1)
  const priceH = Math.round(priceFs * 1.12)
  const infoH = pad * 2 + nameH + 8 + promoH + priceH

  const imgH = horizontal ? imgBox : Math.max(80, tileH - infoH - pad)
  const imgW = horizontal ? imgBox : tileW - pad * 2

  const imagen = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: imgW,
        height: imgH,
        borderRadius: 24,
        background: p.imagen ? '#ffffff' : `linear-gradient(135deg, ${C.arena}, ${C.arenaOscura})`,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {!horizontal && p.pct !== null && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            display: 'flex',
            background: C.ambar,
            color: '#ffffff',
            fontFamily: 'DM Sans',
            fontWeight: 600,
            fontSize: pillFs + 2,
            padding: '2px 14px',
            borderRadius: 9999
          }}
        >
          {`-${Math.round(p.pct)}%`}
        </div>
      )}
      {p.imagen ? (
        <img src={p.imagen} width={imgW - 16} height={imgH - 16} style={{ objectFit: 'contain' }} alt='' />
      ) : (
        <div style={{ display: 'flex', fontSize: Math.min(imgW, imgH) * 0.45 }}>{p.emoji || '🌾'}</div>
      )}
    </div>
  )

  const info = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: horizontal ? 'center' : 'flex-start',
        ...(horizontal ? { flex: 1 } : { width: tileW - pad * 2 }),
        paddingTop: horizontal ? 0 : 14,
        paddingLeft: horizontal ? 8 : 4,
        paddingRight: horizontal ? pad : 0
      }}
    >
      <div
        style={{
          display: 'flex',
          ...(horizontal ? {} : { height: nameH }),
          fontFamily: 'DM Sans',
          fontWeight: 600,
          fontSize: nameFs,
          lineHeight: 1.15,
          color: C.cafe,
          overflow: 'hidden',
          lineClamp: horizontal ? 3 : dosLineas ? 2 : 1
        }}
      >
        {p.nombre}
      </div>
      {promoH > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', height: promoH, marginTop: 8 }}>
          {p.pct !== null && (
            <>
              <div
                style={{
                  display: 'flex',
                  background: C.ambar,
                  color: '#ffffff',
                  fontFamily: 'DM Sans',
                  fontWeight: 600,
                  fontSize: pillFs,
                  padding: '2px 14px',
                  borderRadius: 9999
                }}
              >
                {`-${Math.round(p.pct)}%`}
              </div>
              <div
                style={{
                  display: 'flex',
                  marginLeft: 14,
                  fontFamily: 'DM Sans',
                  fontWeight: 400,
                  fontSize: pillFs + 2,
                  color: '#8a7565',
                  textDecoration: 'line-through'
                }}
              >
                {formatearPrecio(p.lista)}
              </div>
            </>
          )}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          height: priceH,
          marginTop: promoH > 0 ? 0 : 8
        }}
      >
        <div
          style={{
            display: 'flex',
            fontFamily: 'DM Sans',
            fontWeight: 600,
            fontSize: priceFs,
            lineHeight: 1.12,
            color: C.ambar
          }}
        >
          {precioTexto}
        </div>
        {!horizontal && p.pct !== null && (
          <div
            style={{
              display: 'flex',
              marginLeft: 12,
              marginBottom: 4,
              fontFamily: 'DM Sans',
              fontWeight: 400,
              fontSize: Math.round(priceFs * 0.5),
              color: '#8a7565',
              textDecoration: 'line-through'
            }}
          >
            {formatearPrecio(p.lista)}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: horizontal ? 'row' : 'column',
        alignItems: horizontal ? 'center' : 'stretch',
        width: tileW,
        height: tileH,
        padding: pad,
        background: '#ffffff',
        borderRadius: 36,
        border: `2px solid ${C.arena}`,
        boxShadow: '0 10px 30px rgba(61,43,31,0.10)'
      }}
    >
      {imagen}
      {info}
    </div>
  )
}

export function flyerJsx(d: DatosFlyer): ReactElement {
  const g = calcularGeometria(d.formato, d.productos.length, !!d.cupon)
  const historia = d.formato === 'historia'
  const reservarPromo = d.productos.some((p) => p.pct !== null)
  const dosLineas = necesitaDosLineas(d.productos, g.tileW, g.tileH)
  const logoSize = historia ? 190 : 140
  const len = d.titulo.length
  const titleFs = historia
    ? len <= 20 ? 78 : len <= 32 ? 62 : 50
    : len <= 20 ? 64 : len <= 32 ? 50 : 40

  let idx = 0
  const filas = g.filas.map((cols, r) => (
    <div key={r} style={{ display: 'flex', justifyContent: 'center', marginTop: r === 0 ? 0 : GAP }}>
      {Array.from({ length: cols }, (_, c) => {
        const p = d.productos[idx++]
        return (
          <div key={c} style={{ display: 'flex', marginLeft: c === 0 ? 0 : GAP }}>
            <Tile p={p} tileW={g.tileW} tileH={g.tileH} reservarPromo={reservarPromo} dosLineas={dosLineas} />
          </div>
        )
      })}
    </div>
  ))

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: g.w,
        height: g.h,
        padding: PAD,
        background: C.crema
      }}
    >
      <Anillos w={g.w} h={g.h} />

      <div style={{ display: 'flex', alignItems: 'center', height: g.headerH, marginBottom: GAP }}>
        <img src={d.logo} width={logoSize} height={logoSize} alt='' />
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 28, flex: 1 }}>
          <div
            style={{
              display: 'flex',
              fontFamily: 'DM Sans',
              fontWeight: 600,
              fontSize: historia ? 28 : 22,
              letterSpacing: 6,
              color: C.ambar,
              marginBottom: 6
            }}
          >
            SANO Y RICO
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Playfair Display',
              fontWeight: 700,
              fontSize: titleFs,
              lineHeight: 1.1,
              color: C.cafe,
              lineClamp: 2,
              overflow: 'hidden'
            }}
          >
            {d.titulo}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: g.gridH }}>{filas}</div>

      {d.cupon && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: g.cuponH,
            marginTop: GAP,
            borderRadius: 28,
            background: C.ambar
          }}
        >
          <div style={{ display: 'flex', fontFamily: 'DM Sans', fontWeight: 600, fontSize: historia ? 38 : 32, color: C.crema }}>
            Usá el cupón
          </div>
          <div
            style={{
              display: 'flex',
              marginLeft: 20,
              padding: '4px 22px',
              borderRadius: 16,
              background: C.crema,
              border: `3px dashed ${C.cafe}`,
              fontFamily: 'DM Sans',
              fontWeight: 600,
              letterSpacing: 2,
              fontSize: historia ? 42 : 36,
              color: C.cafe
            }}
          >
            {d.cupon}
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: g.footerH,
          marginTop: GAP,
          padding: '0 40px',
          borderRadius: 9999,
          background: C.cafe
        }}
      >
        <div style={{ display: 'flex', fontFamily: 'DM Sans', fontWeight: 400, fontSize: historia ? 34 : 28, color: C.arena }}>
          Pedí online
        </div>
        <div style={{ display: 'flex', fontFamily: 'DM Sans', fontWeight: 600, fontSize: historia ? 38 : 32, color: '#e9b36a' }}>
          {d.host}
        </div>
      </div>
    </div>
  )
}

export function renderFlyer(d: DatosFlyer, fonts: FuenteFlyer[]): ImageResponse {
  const { w, h } = calcularGeometria(d.formato, d.productos.length, !!d.cupon)
  return new ImageResponse(flyerJsx(d), { width: w, height: h, fonts })
}
