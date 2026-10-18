export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'kvb-green-dark': '#0f5132',
        'kvb-green': '#1a7b32',
        'kvb-green-soft': '#1d8b4a',
        'kvb-green-light': 'rgba(26, 123, 50, 0.16)',
        'kvb-red': '#dc2626',
        'kvb-red-dark': '#b91c1c',
        'kvb-red-light': 'rgba(220, 38, 38, 0.14)',
        'kvb-maroon': '#7a003c',
        'kvb-gold': '#d4af37',
        'kvb-navy': '#102a43',
        'kvb-ivory': '#f7f8f4',
        'kvb-ink': '#202a2f',
        'kvb-border': '#e5e7eb',
        'kvb-card': '#ffffff',
        'kvb-muted': '#6b7280',
        'kvb-danger': '#dc2626',
        'text-main': '#0f172a',
        'text-muted': '#6b7280',
      },
      borderRadius: {
        'card-radius': '26px',
        radius: '14px',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'kvb-sm': '0 4px 15px rgba(15, 23, 42, 0.08)',
        'kvb-md': '0 10px 30px rgba(15, 23, 42, 0.12)',
        'kvb-lg': '0 30px 80px rgba(15, 23, 42, 0.22)',
      },
    },
  },
  plugins: [],
};
