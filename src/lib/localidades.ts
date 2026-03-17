// src/lib/localidades.ts
// Para agregar un nuevo país: añadir un objeto al array PAISES.
// El selector de país se muestra automáticamente cuando hay más de uno.

export interface Pais {
  codigo: string
  nombre: string
  localidades: string[]
}

export const PAISES: Pais[] = [
  {
    codigo: 'UY',
    nombre: 'Uruguay 🇺🇾',
    localidades: [
      'Artigas',
      'Atlántida',
      'Barros Blancos',
      'Bella Unión',
      'Canelones',
      'Carmelo',
      'Chuy',
      'Ciudad de la Costa',
      'Colonia del Sacramento',
      'Dolores',
      'Durazno',
      'Florida',
      'Fray Bentos',
      'La Paloma',
      'La Paz',
      'Las Piedras',
      'Libertad',
      'Maldonado',
      'Melo',
      'Mercedes',
      'Minas',
      'Montevideo',
      'Nueva Palmira',
      'Pan de Azúcar',
      'Pando',
      'Paso de los Toros',
      'Paysandú',
      'Progreso',
      'Punta del Este',
      'Rivera',
      'Rocha',
      'Salto',
      'San Carlos',
      'San José de Mayo',
      'Solymar',
      'Tacuarembó',
      'Treinta y Tres',
      'Trinidad',
      'Young'
    ]
  }
  // Para agregar Argentina en el futuro:
  // {
  //   codigo: 'AR',
  //   nombre: 'Argentina 🇦🇷',
  //   localidades: ['Buenos Aires', 'Córdoba', 'Rosario', ...]
  // }
]
