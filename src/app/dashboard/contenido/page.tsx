// src/app/dashboard/contenido/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  DEFAULT_CONFIG,
  type GeneralConfig,
  type HeroConfig,
  type MarqueeConfig,
  type BeneficioItem,
  type TestimonioItem,
  type FooterConfig,
  type PagosConfig
} from '@/lib/site-config'
import { Loader2, Save, Plus, Trash2, CheckCircle, Eye, Settings, Sparkles, AlignLeft, Star, FileText, MessageSquare, Megaphone, CreditCard } from 'lucide-react'

type TabId = 'general' | 'hero' | 'marquee' | 'beneficios' | 'testimonios' | 'footer' | 'pagos'

const TABS: { id: TabId; label: string; desc: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'General', desc: 'Nombre y WhatsApp', icon: Settings },
  { id: 'hero', label: 'Hero', desc: 'Portada principal', icon: Sparkles },
  { id: 'marquee', label: 'Marquee', desc: 'Banda animada', icon: Megaphone },
  { id: 'beneficios', label: 'Beneficios', desc: 'Por qué elegirnos', icon: Star },
  { id: 'testimonios', label: 'Testimonios', desc: 'Opiniones', icon: MessageSquare },
  { id: 'footer', label: 'Footer', desc: 'Pie de página', icon: FileText },
  { id: 'pagos', label: 'Pagos', desc: 'Métodos de pago', icon: CreditCard }
]

const inp = 'w-full px-3 py-2.5 rounded-xl border border-[#f0e6d3] bg-white text-sm text-[#3d2b1f] focus:outline-none focus:ring-2 focus:ring-[#c47c2b] placeholder:text-[#c8b8a8] transition-shadow'
const ta = `${inp} resize-none`

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className='space-y-1.5'>
      <label className='block text-xs font-semibold text-[#3d2b1f] uppercase tracking-wide'>{label}</label>
      {children}
      {hint && <p className='text-xs text-[#8a7060]'>{hint}</p>}
    </div>
  )
}

function SaveBtn({ guardando, ok }: { guardando: boolean; ok: boolean }) {
  return (
    <button
      type='submit'
      disabled={guardando}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60 ${ok ? 'bg-green-500 text-white' : 'bg-[#3d2b1f] text-white hover:bg-[#c47c2b]'}`}
    >
      {guardando ? <Loader2 className='h-4 w-4 animate-spin' /> : ok ? <CheckCircle className='h-4 w-4' /> : <Save className='h-4 w-4' />}
      {guardando ? 'Guardando...' : ok ? '¡Guardado!' : 'Guardar cambios'}
    </button>
  )
}

// ── PREVIEWS ──────────────────────────────────────────────────────────────────

function PreviewGeneral({ g }: { g: GeneralConfig }) {
  return (
    <div className='space-y-3'>
      <div className='bg-[#3d2b1f] rounded-2xl p-5'>
        <p className='text-white/40 text-xs uppercase tracking-widest mb-1'>Nombre del sitio</p>
        <p className='text-white text-2xl font-bold' style={{ fontFamily: 'Georgia, serif' }}>
          {g.sitioNombre || '—'}
        </p>
      </div>
      <div className='bg-white rounded-2xl border border-[#f0e6d3] p-5'>
        <p className='text-[#8a7060] text-xs uppercase tracking-widest mb-1'>WhatsApp para pedidos</p>
        <div className='flex items-center gap-2 mt-2'>
          <div className='w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-base'>📱</div>
          <span className='font-mono text-[#3d2b1f] font-semibold'>+{g.telefono || '—'}</span>
        </div>
      </div>
      <div className='bg-[#fef3d0] rounded-2xl p-4 text-xs text-[#c47c2b] leading-relaxed'>
        <strong>¿Cómo se usa el número?</strong><br />
        Cuando un cliente confirma un pedido, se abre WhatsApp con este número para enviar la notificación automáticamente.
      </div>
    </div>
  )
}

function PreviewHero({ h }: { h: HeroConfig }) {
  return (
    <div className='bg-[#faf6ef] rounded-2xl p-6 space-y-4 overflow-hidden'>
      <div className='inline-flex items-center gap-1.5 bg-[#f0e6d3] border border-[#c47c2b]/30 text-[#c47c2b] text-[10px] font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full'>
        {h.badge || '…'}
      </div>
      <h2 className='text-2xl font-black text-[#3d2b1f] leading-tight' style={{ fontFamily: 'Georgia, serif' }}>
        {h.titulo || '…'} <em className='text-[#c47c2b]'>{h.tituloDestacado || '…'}</em>
        <br />{h.tituloCierre || '…'}
      </h2>
      <p className='text-sm text-[#8a7060] leading-relaxed'>{h.subtitulo || '…'}</p>
      <div className='flex gap-4 pt-3 border-t border-[#f0e6d3]'>
        {h.stats.map((s, i) => (
          <div key={i}>
            <div className='font-black text-[#3d2b1f] text-lg' style={{ fontFamily: 'Georgia, serif' }}>{s.valor}</div>
            <div className='text-[10px] text-[#8a7060] uppercase tracking-wide'>{s.label}</div>
          </div>
        ))}
      </div>
      <div className='flex flex-wrap gap-2'>
        {h.tags.map((t, i) => (
          <span key={i} className='bg-white border border-[#f0e6d3] rounded-full px-3 py-1 text-xs text-[#3d2b1f] font-medium shadow-sm'>
            {t.emoji} {t.texto}
          </span>
        ))}
      </div>
    </div>
  )
}

function PreviewMarquee({ items }: { items: string[] }) {
  return (
    <div className='bg-[#3d2b1f] rounded-2xl py-3 px-4 overflow-hidden'>
      <p className='text-white/40 text-[10px] uppercase tracking-widest mb-2'>Vista previa de la banda</p>
      <div className='flex flex-wrap gap-x-3 gap-y-2'>
        {items.map((item, i) => (
          <span key={i} className='flex items-center gap-1.5'>
            <span className='text-[#faf6ef]/80 text-xs font-medium tracking-widest uppercase'>{item}</span>
            <span className='text-[#c47c2b] text-xs'>✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function PreviewBeneficios({ items }: { items: BeneficioItem[] }) {
  return (
    <div className='bg-[#3d2b1f] rounded-2xl p-4 space-y-2'>
      <p className='text-white/40 text-[10px] uppercase tracking-widest mb-3'>Vista previa</p>
      {items.map((b, i) => (
        <div key={i} className='border border-white/10 rounded-xl p-4'>
          <div className='text-2xl mb-2'>{b.icono}</div>
          <p className='text-white text-sm font-bold' style={{ fontFamily: 'Georgia, serif' }}>{b.titulo || '—'}</p>
          <p className='text-white/50 text-xs mt-1 leading-relaxed'>{b.descripcion || '—'}</p>
        </div>
      ))}
    </div>
  )
}

function PreviewTestimonios({ items }: { items: TestimonioItem[] }) {
  return (
    <div className='space-y-3'>
      <p className='text-[#8a7060] text-[10px] uppercase tracking-widest'>Vista previa</p>
      {items.map((t, i) => (
        <div key={i} className='bg-[#faf6ef] rounded-2xl p-4 border border-[#f0e6d3]'>
          <div className='text-[#c47c2b] text-sm mb-2'>★★★★★</div>
          <p className='text-[#3d2b1f] text-xs italic leading-relaxed mb-3' style={{ fontFamily: 'Georgia, serif' }}>
            &ldquo;{t.texto || '…'}&rdquo;
          </p>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-8 rounded-full bg-[#f0e6d3] flex items-center justify-center text-base'>{t.avatar || '😊'}</div>
            <div>
              <p className='text-xs font-semibold text-[#3d2b1f]'>{t.nombre || 'Nombre'}</p>
              <p className='text-[10px] text-[#8a7060]'>{t.lugar || 'Ciudad'}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PreviewFooter({ f }: { f: FooterConfig }) {
  return (
    <div className='space-y-3'>
      <div className='bg-white rounded-2xl border border-[#f0e6d3] p-5 text-center'>
        <p className='text-[#8a7060] text-[10px] uppercase tracking-widest mb-3'>Sección CTA</p>
        <h3 className='text-lg font-black text-[#3d2b1f] mb-2 leading-tight' style={{ fontFamily: 'Georgia, serif' }}>{f.ctaTitulo || '—'}</h3>
        <p className='text-[#8a7060] text-xs mb-4'>{f.ctaSubtexto || '—'}</p>
        <span className='inline-block bg-[#3d2b1f] text-white text-xs px-5 py-2.5 rounded-full'>{f.ctaBoton || '—'}</span>
      </div>
      <div className='bg-[#3d2b1f] rounded-2xl p-4 flex items-center justify-between gap-3'>
        <p className='text-white text-sm font-bold' style={{ fontFamily: 'Georgia, serif' }}>
          Sano y <span className='text-[#c47c2b] italic'>Rico</span>
        </p>
        <p className='text-white/40 text-[10px] truncate'>{f.copyright}</p>
        <p className='text-white/40 text-[10px] truncate'>{f.email}</p>
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

export default function ContenidoPage() {
  const [tab, setTab] = useState<TabId>('general')
  const [loading, setLoading] = useState(true)

  const [general, setGeneral] = useState<GeneralConfig>(DEFAULT_CONFIG.general)
  const [hero, setHero] = useState<HeroConfig>(DEFAULT_CONFIG.hero)
  const [marquee, setMarquee] = useState<MarqueeConfig>(DEFAULT_CONFIG.marquee)
  const [beneficios, setBeneficios] = useState<BeneficioItem[]>(DEFAULT_CONFIG.beneficios)
  const [testimonios, setTestimonios] = useState<TestimonioItem[]>(DEFAULT_CONFIG.testimonios)
  const [footer, setFooter] = useState<FooterConfig>(DEFAULT_CONFIG.footer)

  const [pagos, setPagos] = useState<PagosConfig>(DEFAULT_CONFIG.pagos)

  const [saving, setSaving] = useState<Record<TabId, boolean>>({
    general: false, hero: false, marquee: false, beneficios: false, testimonios: false, footer: false, pagos: false
  })
  const [saved, setSaved] = useState<Record<TabId, boolean>>({
    general: false, hero: false, marquee: false, beneficios: false, testimonios: false, footer: false, pagos: false
  })

  const supabase = createClient()

  useEffect(() => {
    supabase.from('configuracion').select('clave, valor').then(({ data }) => {
      if (data) data.forEach(({ clave, valor }) => {
        if (clave === 'general') setGeneral(valor as GeneralConfig)
        if (clave === 'hero') setHero(valor as HeroConfig)
        if (clave === 'marquee') setMarquee(valor as MarqueeConfig)
        if (clave === 'beneficios') setBeneficios(valor as BeneficioItem[])
        if (clave === 'testimonios') setTestimonios(valor as TestimonioItem[])
        if (clave === 'footer') setFooter(valor as FooterConfig)
        if (clave === 'pagos') setPagos(valor as PagosConfig)
      })
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const guardar = async (clave: TabId, valor: unknown) => {
    setSaving((p) => ({ ...p, [clave]: true }))
    await supabase.from('configuracion').upsert({ clave, valor }, { onConflict: 'clave' })
    setSaving((p) => ({ ...p, [clave]: false }))
    setSaved((p) => ({ ...p, [clave]: true }))
    setTimeout(() => setSaved((p) => ({ ...p, [clave]: false })), 2500)
  }

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center py-24 gap-3'>
        <Loader2 className='h-7 w-7 animate-spin text-[#c47c2b]' />
        <p className='text-sm text-[#8a7060]'>Cargando contenido…</p>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-bold text-[#3d2b1f]'>Editor de contenido</h2>
        <p className='text-[#8a7060] text-sm mt-1'>Los cambios se reflejan en la vista previa al instante. Guardá cuando estés listo.</p>
      </div>

      {/* Tabs — tarjetas con ícono y descripción */}
      <div className='grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2'>
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all ${
                tab === t.id
                  ? 'bg-[#3d2b1f] border-[#3d2b1f] text-white shadow-lg scale-[1.02]'
                  : 'bg-white border-[#f0e6d3] text-[#8a7060] hover:border-[#c47c2b] hover:text-[#3d2b1f]'
              }`}
            >
              <Icon className='h-5 w-5' />
              <span className='text-xs font-semibold'>{t.label}</span>
              <span className={`text-[10px] leading-tight ${tab === t.id ? 'text-white/60' : 'text-[#8a7060]'}`}>{t.desc}</span>
            </button>
          )
        })}
      </div>

      {/* Layout: editor + preview */}
      <div className='grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-6 items-start'>

        {/* ── EDITOR ── */}
        <div>
          {/* GENERAL */}
          {tab === 'general' && (
            <form onSubmit={(e) => { e.preventDefault(); guardar('general', general) }} className='space-y-4'>
              <div className='bg-white rounded-2xl border border-[#f0e6d3] divide-y divide-[#f0e6d3]'>
                <div className='p-5 space-y-4'>
                  <Field label='Nombre del sitio'>
                    <input className={inp} value={general.sitioNombre} onChange={(e) => setGeneral((p) => ({ ...p, sitioNombre: e.target.value }))} placeholder='Sano y Rico' />
                  </Field>
                  <Field label='Número de WhatsApp' hint='Con código de país, sin el +. Ej: 59893644132'>
                    <div className='relative'>
                      <span className='absolute left-3 top-1/2 -translate-y-1/2 text-sm'>📱</span>
                      <input className={`${inp} pl-9`} value={general.telefono} onChange={(e) => setGeneral((p) => ({ ...p, telefono: e.target.value }))} placeholder='59893644132' />
                    </div>
                  </Field>
                </div>
              </div>
              <SaveBtn guardando={saving.general} ok={saved.general} />
            </form>
          )}

          {/* HERO */}
          {tab === 'hero' && (
            <form onSubmit={(e) => { e.preventDefault(); guardar('hero', hero) }} className='space-y-4'>
              <div className='bg-white rounded-2xl border border-[#f0e6d3] divide-y divide-[#f0e6d3]'>
                {/* Badge */}
                <div className='p-5 space-y-1'>
                  <p className='text-xs font-bold text-[#c47c2b] uppercase tracking-widest mb-3'>Badge</p>
                  <Field label='Texto del badge'>
                    <input className={inp} value={hero.badge} onChange={(e) => setHero((p) => ({ ...p, badge: e.target.value }))} />
                  </Field>
                </div>
                {/* Título */}
                <div className='p-5 space-y-3'>
                  <p className='text-xs font-bold text-[#c47c2b] uppercase tracking-widest'>Título principal</p>
                  <p className='text-xs text-[#8a7060]'>El título se compone de tres partes: <em>texto + <strong>palabra naranja</strong> + segunda línea</em></p>
                  <div className='grid grid-cols-3 gap-3'>
                    <Field label='Antes de la palabra naranja'>
                      <input className={inp} value={hero.titulo} onChange={(e) => setHero((p) => ({ ...p, titulo: e.target.value }))} placeholder='Energía' />
                    </Field>
                    <Field label='Palabra naranja (cursiva)'>
                      <input className={`${inp} border-[#c47c2b]/40 focus:ring-[#c47c2b] text-[#c47c2b] font-bold`} value={hero.tituloDestacado} onChange={(e) => setHero((p) => ({ ...p, tituloDestacado: e.target.value }))} placeholder='real' />
                    </Field>
                    <Field label='Segunda línea'>
                      <input className={inp} value={hero.tituloCierre} onChange={(e) => setHero((p) => ({ ...p, tituloCierre: e.target.value }))} placeholder='para tu día' />
                    </Field>
                  </div>
                </div>
                {/* Subtítulo */}
                <div className='p-5'>
                  <Field label='Subtítulo'>
                    <textarea className={ta} rows={3} value={hero.subtitulo} onChange={(e) => setHero((p) => ({ ...p, subtitulo: e.target.value }))} />
                  </Field>
                </div>
                {/* Stats */}
                <div className='p-5 space-y-3'>
                  <p className='text-xs font-bold text-[#c47c2b] uppercase tracking-widest'>Estadísticas</p>
                  {hero.stats.map((s, i) => (
                    <div key={i} className='flex gap-3 items-center bg-[#faf6ef] rounded-xl p-3'>
                      <div className='w-10 h-10 rounded-xl bg-[#f0e6d3] flex items-center justify-center text-[#3d2b1f] font-black text-sm' style={{ fontFamily: 'Georgia, serif' }}>
                        {s.valor || '?'}
                      </div>
                      <div className='flex gap-3 flex-1'>
                        <input className={`${inp} w-24`} value={s.valor} onChange={(e) => setHero((p) => ({ ...p, stats: p.stats.map((x, j) => j === i ? { ...x, valor: e.target.value } : x) }))} placeholder='18+' />
                        <input className={inp} value={s.label} onChange={(e) => setHero((p) => ({ ...p, stats: p.stats.map((x, j) => j === i ? { ...x, label: e.target.value } : x) }))} placeholder='Variedades' />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Tags */}
                <div className='p-5 space-y-3'>
                  <div className='flex items-center justify-between'>
                    <p className='text-xs font-bold text-[#c47c2b] uppercase tracking-widest'>Tags flotantes (máx. 4)</p>
                    {hero.tags.length < 4 && (
                      <button type='button' onClick={() => setHero((p) => ({ ...p, tags: [...p.tags, { emoji: '✨', texto: 'Nuevo tag' }] }))} className='flex items-center gap-1 text-xs text-[#c47c2b] hover:text-[#3d2b1f] font-medium'>
                        <Plus className='h-3.5 w-3.5' /> Agregar
                      </button>
                    )}
                  </div>
                  {hero.tags.map((t, i) => (
                    <div key={i} className='flex gap-2 items-center'>
                      <input className={`${inp} w-16 text-center`} value={t.emoji} onChange={(e) => setHero((p) => ({ ...p, tags: p.tags.map((x, j) => j === i ? { ...x, emoji: e.target.value } : x) }))} />
                      <input className={`${inp} flex-1`} value={t.texto} onChange={(e) => setHero((p) => ({ ...p, tags: p.tags.map((x, j) => j === i ? { ...x, texto: e.target.value } : x) }))} />
                      <button type='button' onClick={() => setHero((p) => ({ ...p, tags: p.tags.filter((_, j) => j !== i) }))} className='text-[#8a7060] hover:text-red-500 p-1'>
                        <Trash2 className='h-4 w-4' />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <SaveBtn guardando={saving.hero} ok={saved.hero} />
            </form>
          )}

          {/* MARQUEE */}
          {tab === 'marquee' && (
            <form onSubmit={(e) => { e.preventDefault(); guardar('marquee', marquee) }} className='space-y-4'>
              <div className='bg-white rounded-2xl border border-[#f0e6d3] p-5 space-y-3'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-semibold text-[#3d2b1f]'>Textos de la banda</p>
                    <p className='text-xs text-[#8a7060]'>Se repiten en loop de izquierda a derecha.</p>
                  </div>
                  <button type='button' onClick={() => setMarquee((p) => ({ items: [...p.items, 'Nuevo texto'] }))} className='flex items-center gap-1.5 text-xs bg-[#f0e6d3] text-[#3d2b1f] px-3 py-1.5 rounded-xl font-medium hover:bg-[#c47c2b] hover:text-white transition-colors'>
                    <Plus className='h-3.5 w-3.5' /> Agregar
                  </button>
                </div>
                <div className='space-y-2'>
                  {marquee.items.map((item, i) => (
                    <div key={i} className='flex gap-2 items-center group'>
                      <span className='text-[#8a7060] text-xs w-5 text-center font-mono'>{i + 1}</span>
                      <input className={`${inp} flex-1`} value={item} onChange={(e) => setMarquee((p) => ({ items: p.items.map((x, j) => j === i ? e.target.value : x) }))} />
                      <button type='button' onClick={() => setMarquee((p) => ({ items: p.items.filter((_, j) => j !== i) }))} className='text-[#8a7060] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1'>
                        <Trash2 className='h-4 w-4' />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <SaveBtn guardando={saving.marquee} ok={saved.marquee} />
            </form>
          )}

          {/* BENEFICIOS */}
          {tab === 'beneficios' && (
            <form onSubmit={(e) => { e.preventDefault(); guardar('beneficios', beneficios) }} className='space-y-4'>
              <div className='space-y-3'>
                {beneficios.map((b, i) => (
                  <div key={i} className='bg-white rounded-2xl border border-[#f0e6d3] overflow-hidden'>
                    <div className='flex items-center gap-3 px-5 py-3 bg-[#faf6ef] border-b border-[#f0e6d3]'>
                      <span className='text-2xl'>{b.icono || '⭐'}</span>
                      <span className='text-sm font-semibold text-[#3d2b1f] flex-1 truncate'>{b.titulo || 'Sin título'}</span>
                      {beneficios.length > 1 && (
                        <button type='button' onClick={() => setBeneficios((p) => p.filter((_, j) => j !== i))} className='text-[#8a7060] hover:text-red-500 p-1'>
                          <Trash2 className='h-4 w-4' />
                        </button>
                      )}
                    </div>
                    <div className='p-5 grid grid-cols-[80px,1fr] gap-3'>
                      <Field label='Icono'>
                        <input className={`${inp} text-center text-xl`} value={b.icono} onChange={(e) => setBeneficios((p) => p.map((x, j) => j === i ? { ...x, icono: e.target.value } : x))} />
                      </Field>
                      <Field label='Título'>
                        <input className={inp} value={b.titulo} onChange={(e) => setBeneficios((p) => p.map((x, j) => j === i ? { ...x, titulo: e.target.value } : x))} />
                      </Field>
                      <div className='col-span-2'>
                        <Field label='Descripción'>
                          <textarea className={`${ta}`} rows={2} value={b.descripcion} onChange={(e) => setBeneficios((p) => p.map((x, j) => j === i ? { ...x, descripcion: e.target.value } : x))} />
                        </Field>
                      </div>
                    </div>
                  </div>
                ))}
                <button type='button' onClick={() => setBeneficios((p) => [...p, { icono: '⭐', titulo: 'Nuevo beneficio', descripcion: 'Describí este beneficio.' }])} className='w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#f0e6d3] rounded-2xl text-sm text-[#8a7060] hover:border-[#c47c2b] hover:text-[#c47c2b] transition-colors'>
                  <Plus className='h-4 w-4' /> Agregar beneficio
                </button>
              </div>
              <SaveBtn guardando={saving.beneficios} ok={saved.beneficios} />
            </form>
          )}

          {/* TESTIMONIOS */}
          {tab === 'testimonios' && (
            <form onSubmit={(e) => { e.preventDefault(); guardar('testimonios', testimonios) }} className='space-y-4'>
              <div className='space-y-3'>
                {testimonios.map((t, i) => (
                  <div key={i} className='bg-white rounded-2xl border border-[#f0e6d3] overflow-hidden'>
                    <div className='flex items-center gap-3 px-5 py-3 bg-[#faf6ef] border-b border-[#f0e6d3]'>
                      <span className='w-8 h-8 rounded-full bg-[#f0e6d3] flex items-center justify-center text-lg'>{t.avatar || '😊'}</span>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-semibold text-[#3d2b1f] truncate'>{t.nombre || 'Sin nombre'}</p>
                        <p className='text-xs text-[#8a7060]'>{t.lugar || 'Sin ciudad'}</p>
                      </div>
                      <div className='text-[#c47c2b] text-xs'>★★★★★</div>
                      {testimonios.length > 1 && (
                        <button type='button' onClick={() => setTestimonios((p) => p.filter((_, j) => j !== i))} className='text-[#8a7060] hover:text-red-500 p-1'>
                          <Trash2 className='h-4 w-4' />
                        </button>
                      )}
                    </div>
                    <div className='p-5 space-y-3'>
                      <div className='grid grid-cols-3 gap-3'>
                        <Field label='Avatar (emoji)'>
                          <input className={`${inp} text-center text-xl`} value={t.avatar} onChange={(e) => setTestimonios((p) => p.map((x, j) => j === i ? { ...x, avatar: e.target.value } : x))} />
                        </Field>
                        <Field label='Nombre'>
                          <input className={inp} value={t.nombre} onChange={(e) => setTestimonios((p) => p.map((x, j) => j === i ? { ...x, nombre: e.target.value } : x))} />
                        </Field>
                        <Field label='Ciudad'>
                          <input className={inp} value={t.lugar} onChange={(e) => setTestimonios((p) => p.map((x, j) => j === i ? { ...x, lugar: e.target.value } : x))} />
                        </Field>
                      </div>
                      <Field label='Texto del testimonio'>
                        <textarea className={ta} rows={3} value={t.texto} onChange={(e) => setTestimonios((p) => p.map((x, j) => j === i ? { ...x, texto: e.target.value } : x))} />
                      </Field>
                    </div>
                  </div>
                ))}
                <button type='button' onClick={() => setTestimonios((p) => [...p, { nombre: 'Nombre Apellido', lugar: 'Ciudad', avatar: '😊', texto: 'Escribí aquí el testimonio del cliente.' }])} className='w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#f0e6d3] rounded-2xl text-sm text-[#8a7060] hover:border-[#c47c2b] hover:text-[#c47c2b] transition-colors'>
                  <Plus className='h-4 w-4' /> Agregar testimonio
                </button>
              </div>
              <SaveBtn guardando={saving.testimonios} ok={saved.testimonios} />
            </form>
          )}

          {/* PAGOS */}
          {tab === 'pagos' && (
            <form onSubmit={(e) => { e.preventDefault(); guardar('pagos', pagos) }} className='space-y-4'>
              {/* Transferencia */}
              <div className='bg-white rounded-2xl border border-[#f0e6d3] overflow-hidden'>
                <div className='flex items-center justify-between px-5 py-3 bg-[#faf6ef] border-b border-[#f0e6d3]'>
                  <div className='flex items-center gap-2'>
                    <span className='text-lg'>🏦</span>
                    <span className='text-sm font-semibold text-[#3d2b1f]'>Transferencia bancaria</span>
                  </div>
                  <label className='flex items-center gap-2 cursor-pointer'>
                    <input type='checkbox' checked={pagos.transferencia.activo} onChange={(e) => setPagos((p) => ({ ...p, transferencia: { ...p.transferencia, activo: e.target.checked } }))} className='w-4 h-4 accent-[#c47c2b]' />
                    <span className='text-xs text-[#8a7060]'>Activo</span>
                  </label>
                </div>
                {pagos.transferencia.activo && (
                  <div className='p-5 grid grid-cols-2 gap-3'>
                    <Field label='Banco'><input className={inp} value={pagos.transferencia.banco ?? ''} onChange={(e) => setPagos((p) => ({ ...p, transferencia: { ...p.transferencia, banco: e.target.value } }))} placeholder='Ej: BROU' /></Field>
                    <Field label='Titular'><input className={inp} value={pagos.transferencia.titular ?? ''} onChange={(e) => setPagos((p) => ({ ...p, transferencia: { ...p.transferencia, titular: e.target.value } }))} placeholder='Nombre y apellido' /></Field>
                    <Field label='CBU'><input className={inp} value={pagos.transferencia.cbu ?? ''} onChange={(e) => setPagos((p) => ({ ...p, transferencia: { ...p.transferencia, cbu: e.target.value } }))} placeholder='000-000000000' /></Field>
                    <Field label='Alias'><input className={inp} value={pagos.transferencia.alias ?? ''} onChange={(e) => setPagos((p) => ({ ...p, transferencia: { ...p.transferencia, alias: e.target.value } }))} placeholder='mi.alias.pago' /></Field>
                  </div>
                )}
              </div>

              {/* Depósito */}
              <div className='bg-white rounded-2xl border border-[#f0e6d3] overflow-hidden'>
                <div className='flex items-center justify-between px-5 py-3 bg-[#faf6ef] border-b border-[#f0e6d3]'>
                  <div className='flex items-center gap-2'>
                    <span className='text-lg'>🏧</span>
                    <span className='text-sm font-semibold text-[#3d2b1f]'>Depósito bancario</span>
                  </div>
                  <label className='flex items-center gap-2 cursor-pointer'>
                    <input type='checkbox' checked={pagos.deposito.activo} onChange={(e) => setPagos((p) => ({ ...p, deposito: { ...p.deposito, activo: e.target.checked } }))} className='w-4 h-4 accent-[#c47c2b]' />
                    <span className='text-xs text-[#8a7060]'>Activo</span>
                  </label>
                </div>
                {pagos.deposito.activo && (
                  <div className='p-5 grid grid-cols-2 gap-3'>
                    <Field label='Banco'><input className={inp} value={pagos.deposito.banco ?? ''} onChange={(e) => setPagos((p) => ({ ...p, deposito: { ...p.deposito, banco: e.target.value } }))} placeholder='Ej: BROU' /></Field>
                    <Field label='Titular'><input className={inp} value={pagos.deposito.titular ?? ''} onChange={(e) => setPagos((p) => ({ ...p, deposito: { ...p.deposito, titular: e.target.value } }))} placeholder='Nombre y apellido' /></Field>
                    <div className='col-span-2'>
                      <Field label='CBU / Número de cuenta'><input className={inp} value={pagos.deposito.cbu ?? ''} onChange={(e) => setPagos((p) => ({ ...p, deposito: { ...p.deposito, cbu: e.target.value } }))} placeholder='000-000000000' /></Field>
                    </div>
                  </div>
                )}
              </div>

              {/* Mercado Pago */}
              <div className='bg-white rounded-2xl border border-[#f0e6d3] overflow-hidden'>
                <div className='flex items-center justify-between px-5 py-3 bg-[#faf6ef] border-b border-[#f0e6d3]'>
                  <div className='flex items-center gap-2'>
                    <span className='text-lg'>💳</span>
                    <span className='text-sm font-semibold text-[#3d2b1f]'>Mercado Pago</span>
                  </div>
                  <label className='flex items-center gap-2 cursor-pointer'>
                    <input type='checkbox' checked={pagos.mercadopago.activo} onChange={(e) => setPagos((p) => ({ ...p, mercadopago: { ...p.mercadopago, activo: e.target.checked } }))} className='w-4 h-4 accent-[#c47c2b]' />
                    <span className='text-xs text-[#8a7060]'>Activo</span>
                  </label>
                </div>
                {pagos.mercadopago.activo && (
                  <div className='p-5'>
                    <p className='text-xs text-[#8a7060] bg-[#faf6ef] rounded-xl p-3'>
                      ✅ El cliente será redirigido automáticamente a Mercado Pago al confirmar el pedido (Checkout Pro).
                    </p>
                  </div>
                )}
              </div>

              <SaveBtn guardando={saving.pagos} ok={saved.pagos} />
            </form>
          )}

          {/* FOOTER */}
          {tab === 'footer' && (
            <form onSubmit={(e) => { e.preventDefault(); guardar('footer', footer) }} className='space-y-4'>
              <div className='bg-white rounded-2xl border border-[#f0e6d3] divide-y divide-[#f0e6d3]'>
                <div className='p-5 space-y-4'>
                  <p className='text-xs font-bold text-[#c47c2b] uppercase tracking-widest'>Sección CTA</p>
                  <Field label='Título'>
                    <input className={inp} value={footer.ctaTitulo} onChange={(e) => setFooter((p) => ({ ...p, ctaTitulo: e.target.value }))} />
                  </Field>
                  <Field label='Subtexto'>
                    <textarea className={ta} rows={2} value={footer.ctaSubtexto} onChange={(e) => setFooter((p) => ({ ...p, ctaSubtexto: e.target.value }))} />
                  </Field>
                  <Field label='Texto del botón'>
                    <input className={inp} value={footer.ctaBoton} onChange={(e) => setFooter((p) => ({ ...p, ctaBoton: e.target.value }))} />
                  </Field>
                </div>
                <div className='p-5 space-y-4'>
                  <p className='text-xs font-bold text-[#c47c2b] uppercase tracking-widest'>Pie de página</p>
                  <Field label='Email de contacto'>
                    <input className={inp} type='email' value={footer.email} onChange={(e) => setFooter((p) => ({ ...p, email: e.target.value }))} />
                  </Field>
                  <Field label='Texto de copyright'>
                    <input className={inp} value={footer.copyright} onChange={(e) => setFooter((p) => ({ ...p, copyright: e.target.value }))} />
                  </Field>
                </div>
              </div>
              <SaveBtn guardando={saving.footer} ok={saved.footer} />
            </form>
          )}
        </div>

        {/* ── PREVIEW ── */}
        <div className='lg:sticky lg:top-6 space-y-3'>
          <div className='flex items-center gap-2 text-xs text-[#8a7060] font-medium uppercase tracking-widest'>
            <Eye className='h-3.5 w-3.5' />
            Vista previa en vivo
          </div>
          {tab === 'general' && <PreviewGeneral g={general} />}
          {tab === 'hero' && <PreviewHero h={hero} />}
          {tab === 'marquee' && <PreviewMarquee items={marquee.items} />}
          {tab === 'beneficios' && <PreviewBeneficios items={beneficios} />}
          {tab === 'testimonios' && <PreviewTestimonios items={testimonios} />}
          {tab === 'footer' && <PreviewFooter f={footer} />}
          {tab === 'pagos' && (
            <div className='space-y-3'>
              <p className='text-[#8a7060] text-[10px] uppercase tracking-widest'>Así lo ve el cliente en el carrito</p>
              {[
                pagos.transferencia.activo && { label: '🏦 Transferencia', info: pagos.transferencia, tipo: 'banco' },
                pagos.deposito.activo && { label: '🏧 Depósito', info: pagos.deposito, tipo: 'banco' },
                pagos.mercadopago.activo && { label: '💳 Mercado Pago', info: pagos.mercadopago, tipo: 'mp' }
              ].filter(Boolean).map((m, i) => {
                if (!m) return null
                return (
                  <div key={i} className='bg-white rounded-2xl border border-[#f0e6d3] p-4'>
                    <p className='text-sm font-semibold text-[#3d2b1f] mb-2'>{m.label}</p>
                    {m.tipo === 'mp' ? (
                      <p className='text-xs text-[#8a7060]'>Checkout Pro — pago dinámico</p>
                    ) : (
                      <div className='text-xs text-[#8a7060] space-y-0.5'>
                        {(m.info as { banco?: string }).banco && <p>Banco: <span className='text-[#3d2b1f]'>{(m.info as { banco?: string }).banco}</span></p>}
                        {(m.info as { titular?: string }).titular && <p>Titular: <span className='text-[#3d2b1f]'>{(m.info as { titular?: string }).titular}</span></p>}
                        {(m.info as { cbu?: string }).cbu && <p>CBU: <span className='font-mono text-[#3d2b1f]'>{(m.info as { cbu?: string }).cbu}</span></p>}
                        {(m.info as { alias?: string }).alias && <p>Alias: <span className='font-mono text-[#3d2b1f]'>{(m.info as { alias?: string }).alias}</span></p>}
                      </div>
                    )}
                  </div>
                )
              })}
              {!pagos.transferencia.activo && !pagos.deposito.activo && !pagos.mercadopago.activo && (
                <div className='bg-[#faf6ef] rounded-2xl p-4 text-center text-xs text-[#8a7060]'>
                  Ningún método activo — el cliente no verá el selector de pago.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
