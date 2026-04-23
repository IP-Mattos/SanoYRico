// src/lib/email.ts
import { Resend } from 'resend'

const FROM = () => process.env.EMAIL_FROM ?? 'Sano y Rico <onboarding@resend.dev>'
const HEADERS = { 'List-Unsubscribe': '<mailto:sanoyrico.app@gmail.com?subject=unsubscribe>' }
const getResend = () => new Resend(process.env.RESEND_API_KEY!)

interface ItemEmail {
  emoji: string
  nombre: string
  cantidad: number
  subtotal: number | string
}

function filas(items: ItemEmail[]) {
  return items
    .map(
      (i) =>
        `<tr style="border-bottom:1px solid #f0e6d3">
          <td style="padding:8px 12px">${i.emoji} ${i.nombre}</td>
          <td style="padding:8px 12px;text-align:center">x${i.cantidad}</td>
          <td style="padding:8px 12px;text-align:right;font-weight:bold">$${i.subtotal}</td>
        </tr>`
    )
    .join('')
}

function filasTexto(items: ItemEmail[]) {
  return items.map((i) => `${i.emoji} ${i.nombre} x${i.cantidad} — $${i.subtotal}`).join('\n')
}

async function enviarMail(opts: { to: string; subject: string; html: string; text: string }) {
  await getResend().emails.send({
    from: FROM(),
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    headers: HEADERS
  })
}

// Simple email validation
function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function notificarClienteRecibo(pedido: {
  email: string
  numero: number
  nombre: string
  total: number
  items: ItemEmail[]
}) {
  if (!process.env.RESEND_API_KEY || !emailValido(pedido.email)) return

  const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sano-y-rico.vercel.app'

  await enviarMail({
    to: pedido.email,
    subject: `📬 Recibimos tu pedido #${pedido.numero} — Sano y Rico`,
    text: `📬 Pedido #${pedido.numero} recibido

Hola ${pedido.nombre}, recibimos tu pedido y lo estamos revisando.
En breve te confirmamos y coordinamos la entrega.

PRODUCTOS:
${filasTexto(pedido.items)}

TOTAL: $${pedido.total}

Podés ver el estado de tu pedido en ${sitio}/pedido

—
Sano y Rico · snacks naturales`,
    html: `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#3d2b1f">
        <div style="background:#3d2b1f;padding:24px 32px;border-radius:16px 16px 0 0">
          <h1 style="margin:0;color:#faf6ef;font-size:22px">
            📬 Pedido <span style="color:#c47c2b">#${pedido.numero}</span> recibido
          </h1>
        </div>
        <div style="background:#faf6ef;padding:24px 32px;border:1px solid #f0e6d3;border-top:none">
          <p style="margin:0 0 16px">Hola <b>${pedido.nombre}</b>, recibimos tu pedido y lo estamos revisando 🌿</p>
          <p style="margin:0 0 16px;color:#8a7060;font-size:14px">En breve te confirmamos y coordinamos la entrega.</p>

          <table style="width:100%;border-collapse:collapse;background:white;border-radius:10px;overflow:hidden;border:1px solid #f0e6d3">
            <thead>
              <tr style="background:#f0e6d3">
                <th style="padding:8px 12px;text-align:left">Producto</th>
                <th style="padding:8px 12px;text-align:center">Cant.</th>
                <th style="padding:8px 12px;text-align:right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${filas(pedido.items)}
              <tr style="background:#fef3d0">
                <td colspan="2" style="padding:10px 12px;font-weight:bold">Total</td>
                <td style="padding:10px 12px;text-align:right;font-weight:bold;color:#c47c2b;font-size:18px">$${pedido.total}</td>
              </tr>
            </tbody>
          </table>

          <p style="margin:16px 0 0;font-size:13px;color:#8a7060">
            Podés ver el estado de tu pedido en cualquier momento en
            <a href="${sitio}/pedido" style="color:#c47c2b">sano-y-rico.vercel.app/pedido</a>
          </p>
        </div>
        <div style="background:#f0e6d3;padding:12px 32px;border-radius:0 0 16px 16px;text-align:center">
          <p style="margin:0;font-size:12px;color:#8a7060">Sano y Rico · snacks naturales</p>
        </div>
      </div>
    `
  })
}

export async function notificarAdminNuevoPedido(pedido: {
  numero: number
  nombre: string
  telefono: string
  direccion: string
  notas?: string | null
  metodo_pago?: string | null
  total: number
  items: ItemEmail[]
}) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || !process.env.RESEND_API_KEY) return

  const metodoLabel: Record<string, string> = {
    transferencia: '🏦 Transferencia',
    deposito: '🏧 Depósito',
    mercadopago: '💳 Mercado Pago'
  }

  await enviarMail({
    to: adminEmail,
    subject: `🛒 Nuevo pedido #${pedido.numero} — ${pedido.nombre}`,
    text: `🛒 Nuevo pedido #${pedido.numero}

Cliente: ${pedido.nombre}
Teléfono: ${pedido.telefono}
Dirección: ${pedido.direccion}
${pedido.metodo_pago ? `Pago: ${metodoLabel[pedido.metodo_pago] ?? pedido.metodo_pago}\n` : ''}${pedido.notas ? `Notas: ${pedido.notas}\n` : ''}
PRODUCTOS:
${filasTexto(pedido.items)}

TOTAL: $${pedido.total}

—
Sano y Rico — panel de administración`,
    html: `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#3d2b1f">
        <div style="background:#3d2b1f;padding:24px 32px;border-radius:16px 16px 0 0">
          <h1 style="margin:0;color:#faf6ef;font-size:22px">
            🛒 Nuevo pedido <span style="color:#c47c2b">#${pedido.numero}</span>
          </h1>
        </div>
        <div style="background:#faf6ef;padding:24px 32px;border:1px solid #f0e6d3;border-top:none">
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
            <tr><td style="padding:4px 0;color:#8a7060;width:120px">Cliente</td><td style="font-weight:bold">${pedido.nombre}</td></tr>
            <tr><td style="padding:4px 0;color:#8a7060">Teléfono</td><td>${pedido.telefono}</td></tr>
            <tr><td style="padding:4px 0;color:#8a7060">Dirección</td><td>${pedido.direccion}</td></tr>
            ${pedido.metodo_pago ? `<tr><td style="padding:4px 0;color:#8a7060">Pago</td><td>${metodoLabel[pedido.metodo_pago] ?? pedido.metodo_pago}</td></tr>` : ''}
            ${pedido.notas ? `<tr><td style="padding:4px 0;color:#8a7060">Notas</td><td>${pedido.notas}</td></tr>` : ''}
          </table>

          <table style="width:100%;border-collapse:collapse;background:white;border-radius:10px;overflow:hidden;border:1px solid #f0e6d3">
            <thead>
              <tr style="background:#f0e6d3">
                <th style="padding:8px 12px;text-align:left">Producto</th>
                <th style="padding:8px 12px;text-align:center">Cant.</th>
                <th style="padding:8px 12px;text-align:right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${filas(pedido.items)}
              <tr style="background:#fef3d0">
                <td colspan="2" style="padding:10px 12px;font-weight:bold">Total</td>
                <td style="padding:10px 12px;text-align:right;font-weight:bold;color:#c47c2b;font-size:18px">$${pedido.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="background:#f0e6d3;padding:12px 32px;border-radius:0 0 16px 16px;text-align:center">
          <p style="margin:0;font-size:12px;color:#8a7060">Sano y Rico — panel de administración</p>
        </div>
      </div>
    `
  })
}

export async function notificarClienteEstado(pedido: {
  email: string
  numero: number
  nombre: string
  estado: 'entregado' | 'cancelado'
}) {
  if (!process.env.RESEND_API_KEY || !emailValido(pedido.email)) return

  const config = {
    entregado: {
      emoji: '📦',
      titulo: 'Tu pedido fue entregado',
      cuerpo: 'Tu pedido llegó. ¡Esperamos que lo disfrutes! 🌿',
      cuerpoTexto: 'Tu pedido llegó. ¡Esperamos que lo disfrutes!',
      color: '#4a6741'
    },
    cancelado: {
      emoji: '❌',
      titulo: 'Tu pedido fue cancelado',
      cuerpo: 'Lamentamos informarte que tu pedido fue cancelado. Si tenés dudas, contactanos.',
      cuerpoTexto: 'Lamentamos informarte que tu pedido fue cancelado. Si tenés dudas, contactanos.',
      color: '#c0392b'
    }
  }[pedido.estado]

  await enviarMail({
    to: pedido.email,
    subject: `${config.emoji} Pedido #${pedido.numero} — ${config.titulo}`,
    text: `${config.emoji} Pedido #${pedido.numero} — ${config.titulo}

Hola ${pedido.nombre},

${config.cuerpoTexto}

—
Sano y Rico · snacks naturales`,
    html: `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#3d2b1f">
        <div style="background:${config.color};padding:24px 32px;border-radius:16px 16px 0 0">
          <h1 style="margin:0;color:#fff;font-size:22px">
            ${config.emoji} Pedido <span style="opacity:0.85">#${pedido.numero}</span>
          </h1>
        </div>
        <div style="background:#faf6ef;padding:24px 32px;border:1px solid #f0e6d3;border-top:none">
          <p style="margin:0 0 8px">Hola <b>${pedido.nombre}</b>,</p>
          <p style="margin:0;color:#5c4033">${config.cuerpo}</p>
        </div>
        <div style="background:#f0e6d3;padding:12px 32px;border-radius:0 0 16px 16px;text-align:center">
          <p style="margin:0;font-size:12px;color:#8a7060">Sano y Rico · snacks naturales</p>
        </div>
      </div>
    `
  })
}

export async function notificarClienteConfirmacion(pedido: {
  email: string
  numero: number
  nombre: string
  items: ItemEmail[]
  total: number
  nroRastreo?: string
}) {
  if (!process.env.RESEND_API_KEY || !emailValido(pedido.email)) return

  await enviarMail({
    to: pedido.email,
    subject: `✅ Tu pedido #${pedido.numero} fue confirmado — Sano y Rico`,
    text: `✅ Pedido #${pedido.numero} confirmado

Hola ${pedido.nombre}, tu pedido está en preparación.

PRODUCTOS:
${filasTexto(pedido.items)}

TOTAL: $${pedido.total}
${pedido.nroRastreo ? `\n📦 Número de rastreo: ${pedido.nroRastreo}\n` : ''}
Nos comunicamos pronto para coordinar la entrega. ¡Gracias por elegirnos!

—
Sano y Rico · snacks naturales`,
    html: `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#3d2b1f">
        <div style="background:#3d2b1f;padding:24px 32px;border-radius:16px 16px 0 0">
          <h1 style="margin:0;color:#faf6ef;font-size:22px">
            ✅ Pedido <span style="color:#c47c2b">#${pedido.numero}</span> confirmado
          </h1>
        </div>
        <div style="background:#faf6ef;padding:24px 32px;border:1px solid #f0e6d3;border-top:none">
          <p style="margin:0 0 16px">Hola <b>${pedido.nombre}</b>, tu pedido está en preparación 🌿</p>

          <table style="width:100%;border-collapse:collapse;background:white;border-radius:10px;overflow:hidden;border:1px solid #f0e6d3">
            <thead>
              <tr style="background:#f0e6d3">
                <th style="padding:8px 12px;text-align:left">Producto</th>
                <th style="padding:8px 12px;text-align:center">Cant.</th>
                <th style="padding:8px 12px;text-align:right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${filas(pedido.items)}
              <tr style="background:#fef3d0">
                <td colspan="2" style="padding:10px 12px;font-weight:bold">Total</td>
                <td style="padding:10px 12px;text-align:right;font-weight:bold;color:#c47c2b;font-size:18px">$${pedido.total}</td>
              </tr>
            </tbody>
          </table>

          ${pedido.nroRastreo ? `<p style="margin:16px 0 0;background:#fff;border:1px solid #f0e6d3;border-radius:10px;padding:12px 16px">📦 <b>Número de rastreo:</b> ${pedido.nroRastreo}</p>` : ''}

          <p style="margin:16px 0 0;color:#8a7060">Nos comunicamos pronto para coordinar la entrega. ¡Gracias por elegirnos! 🎉</p>
        </div>
        <div style="background:#f0e6d3;padding:12px 32px;border-radius:0 0 16px 16px;text-align:center">
          <p style="margin:0;font-size:12px;color:#8a7060">Sano y Rico · snacks naturales</p>
        </div>
      </div>
    `
  })
}
