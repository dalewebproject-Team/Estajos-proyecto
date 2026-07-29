import { X } from 'lucide-react'

/**
 * Modal — Diálogo modal centrado, estilo card de la guía.
 *
 * Props:
 *  · open      bool
 *  · title     string
 *  · onClose   fn
 *  · children  ReactNode
 */
export default function Modal({ open, title, onClose, children }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 modal-overlay"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-5 shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-navy-dark font-bold text-sm uppercase">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-navy-dark active:scale-90 transition-transform duration-160"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
