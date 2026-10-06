// src/lib/imagenes/render.tsx
// Tarjetas de cupón y promo para Satori (next/og). Solo flexbox; display:flex en todos los contenedores.
/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og'
import type { ReactElement, ReactNode } from 'react'
import type { FuenteFlyer } from '@/lib/flyers/assets'
import { DIMENSIONES } from '@/lib/flyers/layout'
import type { FormatoFlyer } from '@/lib/flyers/params'
import { condicionesCupon, descuentoCupon, lineaFechasPromo, NO_APLICA_PROMO, subtituloPromo, titularCupon, titularPromo, type DatosCuponImagen } from './condiciones'

const C = {
  cafe: '#3d2b1f',
  ambar: '#c47c2b',
  crema: '#faf6ef',
  arena: '#f0e6d3'
}

export interface DatosCuponCard extends DatosCuponImagen {
  codigo: string
  saludo: string
  formato: FormatoFlyer
  logo: string
  host: string
}

export interface DatosPromoCard {
  pct: number
  minimo: number
  desde: string | null
  hasta: string | null
  formato: FormatoFlyer
  logo: string
  host: string
}

function Circulo({ size, left, top, fondo, borde }: { size: number; left: number; top: number; fondo?: string; borde?: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        width: size,
        height: size,
        left,
        top,
        borderRadius: 9999,
        background: fondo ?? 'transparent',
        border: borde ?? '0px solid transparent'
      }}
    />
  )
}

function Marco({ formato, logo, host, children }: { formato: FormatoFlyer; logo: string; host: string; children: ReactNode }) {
  const { w, h } = DIMENSIONES[formato]
  const historia = formato === 'historia'
  const logoSize = historia ? 220 : 150
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: w,
        height: h,
        padding: 52,
        background: C.crema
      }}
    >
      <Circulo size={620} left={w - 380} top={-250} fondo='rgba(240,230,211,0.85)' />
      <Circulo size={760} left={w - 470} top={-330} borde='3px solid rgba(196,124,43,0.18)' />
      <Circulo size={560} left={-260} top={h - 330} fondo='rgba(240,230,211,0.7)' />
      <Circulo size={700} left={-330} top={h - 400} borde='3px solid rgba(196,124,43,0.16)' />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={logo} width={logoSize} height={logoSize} alt='' />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, width: '100%' }}>
        {children}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: historia ? 110 : 76,
          padding: '0 40px',
          borderRadius: 9999,
          background: C.cafe
        }}
      >
        <div style={{ display: 'flex', fontFamily: 'DM Sans', fontWeight: 400, fontSize: historia ? 34 : 28, color: C.arena }}>
          Pedí online
        </div>
        <div style={{ display: 'flex', fontFamily: 'DM Sans', fontWeight: 600, fontSize: historia ? 38 : 32, color: '#e9b36a' }}>{host}</div>
      </div>
    </div>
  )
}

function Texto({ children, size, peso = 400, color = C.cafe, familia = 'DM Sans', mt = 0, centrado = true }: {
  children: ReactNode
  size: number
  peso?: 400 | 600 | 700
  color?: string
  familia?: string
  mt?: number
  centrado?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: centrado ? 'center' : 'flex-start',
        textAlign: centrado ? 'center' : 'left',
        fontFamily: familia,
        fontWeight: peso,
        fontSize: size,
        color,
        marginTop: mt,
        lineHeight: 1.15
      }}
    >
      {children}
    </div>
  )
}

export function cuponJsx(d: DatosCuponCard): ReactElement {
  const historia = d.formato === 'historia'
  const titular = titularCupon(d.saludo)
  const titularFs = (historia ? 66 : 52) - (titular.length > 28 ? 10 : 0)
  const condiciones = condicionesCupon(d)
  const descuento = descuentoCupon(d.tipo, d.valor)
  const base = historia ? 200 : 150
  const descuentoFs = descuento.length > 8 ? Math.floor((base * 8) / descuento.length) : base
  const codigoFs = d.codigo.length > 14 ? (historia ? 64 : 52) : historia ? 92 : 76
  return (
    <Marco formato={d.formato} logo={d.logo} host={d.host}>
      <Texto size={titularFs} peso={700} familia='Playfair Display'>{titular}</Texto>
      <Texto size={descuentoFs} peso={700} familia='Playfair Display' color={C.ambar} mt={historia ? 30 : 10}>
        {descuento}
      </Texto>
      <Texto size={historia ? 34 : 28} peso={600} mt={historia ? 24 : 12}>Usá este código al pedir</Texto>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: historia ? 30 : 18,
          padding: historia ? '28px 56px' : '18px 44px',
          borderRadius: 28,
          background: '#ffffff',
          border: `6px dashed ${C.ambar}`,
          fontFamily: 'DM Sans',
          fontWeight: 600,
          letterSpacing: 4,
          fontSize: codigoFs,
          color: C.cafe
        }}
      >
        {d.codigo}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: historia ? 44 : 24 }}>
        {condiciones.map((c) => (
          <Texto key={c} size={historia ? 30 : 25} color='#7a6454' mt={6}>{c}</Texto>
        ))}
      </div>
    </Marco>
  )
}

export function promoJsx(d: DatosPromoCard): ReactElement {
  const historia = d.formato === 'historia'
  const fechas = lineaFechasPromo(d.desde, d.hasta)
  return (
    <Marco formato={d.formato} logo={d.logo} host={d.host}>
      <Texto size={historia ? 40 : 32} peso={600} color={C.ambar}>PROMO ESPECIAL</Texto>
      <Texto size={historia ? 230 : 170} peso={700} familia='Playfair Display' mt={historia ? 24 : 8}>{titularPromo(d.pct)}</Texto>
      <Texto size={historia ? 56 : 44} peso={600} mt={historia ? 16 : 8}>{subtituloPromo(d.minimo)}</Texto>
      {fechas && (
        <div
          style={{
            display: 'flex',
            marginTop: historia ? 44 : 28,
            padding: historia ? '14px 40px' : '10px 32px',
            borderRadius: 9999,
            background: C.ambar,
            fontFamily: 'DM Sans',
            fontWeight: 600,
            fontSize: historia ? 38 : 30,
            color: C.crema
          }}
        >
          {fechas}
        </div>
      )}
      <Texto size={historia ? 30 : 25} color='#7a6454' mt={historia ? 44 : 26}>{NO_APLICA_PROMO}</Texto>
    </Marco>
  )
}

export function renderCupon(d: DatosCuponCard, fonts: FuenteFlyer[]): ImageResponse {
  const { w, h } = DIMENSIONES[d.formato]
  return new ImageResponse(cuponJsx(d), { width: w, height: h, fonts })
}

export function renderPromo(d: DatosPromoCard, fonts: FuenteFlyer[]): ImageResponse {
  const { w, h } = DIMENSIONES[d.formato]
  return new ImageResponse(promoJsx(d), { width: w, height: h, fonts })
}
