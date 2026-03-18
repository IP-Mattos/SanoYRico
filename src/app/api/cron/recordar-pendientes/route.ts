// src/app/api/cron/recordar-pendientes/route.ts
// Vercel Cron: se ejecuta cada hora y avisa al admin si hay pedidos pendientes viejos
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { Resend } from 'resend'

export async function GET(req: NextRequest) {
  // Verificar que viene de Vercel Cron
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || !process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Pedidos pendientes con más de 2 horas de antigüedad
  const hace2h = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  const { data: pendientes } = await supabase
    .from('pedidos')
    .select('numero, nombre, total, created_at')
    .eq('estado', 'pendiente')
    .lt('created_at', hace2h)
    .order('created_at', { ascending: true })

  if (!pendientes?.length) {
    return NextResponse.json({ ok: true, pendientes: 0 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const FROM = process.env.EMAIL_FROM ?? 'Sano y Rico <onboarding@resend.dev>'

  const filas = pendientes
    .map((p) => {
      const horas = Math.floor((Date.now() - new Date(p.created_at).getTime()) / 3_600_000)
      return `<tr style="border-bottom:1px solid #f0e6d3">
        <td style="padding:8px 12px">#${p.numero}</td>
        <td style="padding:8px 12px">${p.nombre}</td>
        <td style="padding:8px 12px;text-align:right">$${p.total}</td>
        <td style="padding:8px 12px;text-align:right;color:#c0392b">${horas}h</td>
      </tr>`
    })
    .join('')

  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `⏰ ${pendientes.length} pedido${pendientes.length > 1 ? 's' : ''} pendiente${pendientes.length > 1 ? 's' : ''} sin atender`,
    html: `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#3d2b1f">
        <div style="background:#c47c2b;padding:24px 32px;border-radius:16px 16px 0 0">
          <h1 style="margin:0;color:#fff;font-size:20px">
            ⏰ Pedidos sin atender
          </h1>
        </div>
        <div style="background:#faf6ef;padding:24px 32px;border:1px solid #f0e6d3;border-top:none">
          <p style="margin:0 0 16px;color:#5c4033">
            Tenés <b>${pendientes.length} pedido${pendientes.length > 1 ? 's' : ''}</b> en estado <b>pendiente</b> con más de 2 horas de antigüedad.
          </p>
          <table style="width:100%;border-collapse:collapse;background:white;border-radius:10px;overflow:hidden;border:1px solid #f0e6d3">
            <thead>
              <tr style="background:#f0e6d3">
                <th style="padding:8px 12px;text-align:left">Pedido</th>
                <th style="padding:8px 12px;text-align:left">Cliente</th>
                <th style="padding:8px 12px;text-align:right">Total</th>
                <th style="padding:8px 12px;text-align:right">Espera</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
        <div style="background:#f0e6d3;padding:12px 32px;border-radius:0 0 16px 16px;text-align:center">
          <p style="margin:0;font-size:12px;color:#8a7060">Sano y Rico — recordatorio automático</p>
        </div>
      </div>
    `
  })

  return NextResponse.json({ ok: true, pendientes: pendientes.length })
}
