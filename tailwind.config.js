/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // ─── PALETA PRINCIPAL (de la Guía Técnica CSS) ───
        // Navy
        'navy-dark':   '#1a2332',  // Header, fondos oscuros, botones oscuros, iconos circulares
        'navy-medium': '#2c3e50',  // Gradientes, hover oscuro, botones secundarios

        // Verde
        'primary':       '#2ecc71', // Botones primarios, acentos, saldos positivos
        'primary-hover': '#27ae60', // Hover del verde primario

        // Dorado / Amarillo
        'gold':       '#e8b341',  // Iconos en header, acentos secundarios, badges
        'gold-hover': '#f0c44e',  // Hover del dorado

        // Fondo de app
        'app-bg':     '#f5f6fa',  // Fondo general

        // Semánticos
        'danger':     '#e74c3c'   // Gastos, deducciones, indicadores negativos
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"',
          'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'
        ]
      },
      borderRadius: {
        // 'xl' y '2xl' son los usados por la guía — quedan por defecto en Tailwind
      },
      animation: {
        'fade-in':  'fadeIn  0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to':   { opacity: '1', transform: 'translateY(0)' }
        },
        scaleIn: {
          'from': { transform: 'scale(0)' },
          'to':   { transform: 'scale(1)' }
        }
      }
    }
  },
  plugins: []
}
