import {
  Briefcase,
  Candy,
  CreditCard,
  Cookie,
  Dumbbell,
  FlaskConical,
  Gamepad2,
  Globe,
  Leaf,
  Droplets,
  Nut,
  Package,
  PackageCheck,
  Recycle,
  ShoppingCart,
  Sparkles,
  Sprout,
  Wheat,
  Zap,
  type LucideIcon
} from 'lucide-react'

// El contenido editable (configuracion / categorias) trae emojis como "icono".
// En la landing los reemplazamos por un set único de íconos de línea, elegido por
// palabras clave del texto (con fallback por posición). No se modifica ningún dato.
const RULES: { test: RegExp; icon: LucideIcon }[] = [
  { test: /ingrediente|natural|avena|cereal|granola/i, icon: Wheat },
  { test: /nutricionista|formulad|ciencia|balance/i, icon: FlaskConical },
  { test: /local|uruguay|producci/i, icon: Globe },
  { test: /packaging|envase|empaque|reciclab|sustentab/i, icon: Recycle },
  { test: /fitness|gimnasio|deporte|entren/i, icon: Dumbbell },
  { test: /oficina|estudiant|trabajo/i, icon: Briefcase },
  { test: /gamer|juego|focus/i, icon: Gamepad2 },
  { test: /miel|dulce|az[uú]car/i, icon: Droplets },
  { test: /prote[ií]na|energ[ií]a|energ/i, icon: Zap },
  { test: /gluten|sin |vegetar/i, icon: Leaf },
  { test: /elegi|catalogo|cat[aá]logo|carrito|favorit/i, icon: ShoppingCart },
  { test: /pag|tarjeta|transferencia|mercado/i, icon: CreditCard },
  { test: /llega|env[ií]o|casa|entrega/i, icon: PackageCheck },
  { test: /barrit|barra/i, icon: Candy },
  { test: /mix|fruto|nuez|man[ií]/i, icon: Nut },
  { test: /alfajor|galleta|cookie/i, icon: Cookie }
]

const FALLBACKS: LucideIcon[] = [Sprout, Sparkles, Package, Leaf]

export function iconFor(texto: string, index = 0): LucideIcon {
  const hit = RULES.find((r) => r.test.test(texto))
  return hit ? hit.icon : FALLBACKS[index % FALLBACKS.length]
}

export function iniciales(nombre: string): string {
  const partes = nombre
    .replace(/[^\p{L}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (partes.length === 0) return '·'
  return (partes[0][0] + (partes[1]?.[0] ?? '')).toUpperCase()
}

export function iconNode(texto: string, index = 0, className = 'h-5 w-5') {
  const Icon = iconFor(texto, index)
  return <Icon className={className} strokeWidth={1.75} aria-hidden='true' />
}
