// src/components/ErrorBoundary.tsx
'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className='flex flex-col items-center justify-center h-64 text-center'>
            <div className='w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4'>
              <AlertTriangle className='h-6 w-6 text-red-500' />
            </div>
            <h3 className='text-base font-bold text-[#3d2b1f] mb-1'>Algo salió mal</h3>
            <p className='text-sm text-[#8a7060] mb-4 max-w-xs'>{this.state.message || 'Ocurrió un error inesperado.'}</p>
            <button
              onClick={() => this.setState({ hasError: false, message: '' })}
              className='flex items-center gap-2 px-4 py-2 bg-[#3d2b1f] text-white rounded-xl text-sm hover:bg-[#c47c2b] transition-colors'
            >
              <RefreshCw className='h-4 w-4' />
              Reintentar
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
