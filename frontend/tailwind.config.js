/** @type {import('tailwindcss').Config} */
//
// DESIGN SYSTEM SAMDE
// ===================
// Toutes les valeurs de design de la plateforme sont définies ici. Aucune
// couleur ne doit être écrite « en dur » dans les composants : on utilise les
// jetons ci-dessous (brand-600, ink-500, danger-50, ...) pour garder une
// identité cohérente et des contrastes conformes WCAG 2.1 AA.
//
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    // Points de rupture : du téléphone au mur d'écran / vidéoprojecteur.
    screens: {
      xs: '420px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1920px', // grand écran / TV de présentation
      '4xl': '2560px', // mur d'images
    },
    extend: {
      colors: {
        // --- Identité : vert-sarcelle SAMDE -----------------------------
        // Ancre = brand-600 (#147c76), la couleur historique de la marque.
        // Contraste brand-600 sur blanc : 4.9:1 (AA texte normal).
        // Contraste brand-700 sur blanc : 6.6:1 (AA large + AAA texte large).
        brand: {
          50: '#f0faf8',
          100: '#d9f2ed',
          200: '#b4e4db',
          300: '#84cfc3',
          400: '#4fb2a5',
          500: '#2b9488',
          600: '#147c76',
          700: '#0e625e',
          800: '#0d4e4b',
          900: '#0e403f',
          950: '#032726',
        },
        // --- Neutres : gris légèrement froids, lisibles à distance ------
        ink: {
          50: '#f6f8f9',
          100: '#eceff2',
          200: '#dbe1e6',
          300: '#bfcad2',
          400: '#8fa0ab',
          500: '#657986',
          600: '#4c5e6b',
          700: '#3d4c57',
          800: '#2b363f',
          900: '#1a232a',
          950: '#0e161b',
        },
        // --- Sémantique -------------------------------------------------
        success: {
          50: '#ecfdf3', 100: '#d1fae0', 200: '#a7f3c6', 300: '#6ee7a7',
          400: '#34d383', 500: '#10b968', 600: '#059552', 700: '#047744',
          800: '#065f38', 900: '#064e30',
        },
        warning: {
          50: '#fffaeb', 100: '#fef0c7', 200: '#fedf89', 300: '#fec84b',
          400: '#fdb022', 500: '#f79009', 600: '#dc6803', 700: '#b54708',
          800: '#93370d', 900: '#7a2e0e',
        },
        danger: {
          50: '#fef3f2', 100: '#fee4e2', 200: '#fecdca', 300: '#fda29b',
          400: '#f97066', 500: '#f04438', 600: '#d92d20', 700: '#b42318',
          800: '#912018', 900: '#7a271a',
        },
        info: {
          50: '#eff8ff', 100: '#d1e9ff', 200: '#b2ddff', 300: '#84caff',
          400: '#53b1fd', 500: '#2e90fa', 600: '#1570ef', 700: '#175cd3',
          800: '#1849a9', 900: '#194185',
        },
        // Fond applicatif
        canvas: '#f4f7f8',
      },
      fontFamily: {
        // Titres : caractère, un peu de personnalité.
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        // Interface / texte courant : neutre, très lisible en petit corps.
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        // Références, matricules, montants techniques.
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // Échelle typographique fluide : lisible sur mobile, confortable
        // en vidéoprojection sans changer une seule classe.
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
        xs: ['0.75rem', { lineHeight: '1.125rem' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem' }],
        base: ['0.9375rem', { lineHeight: '1.5rem' }],
        lg: ['1.0625rem', { lineHeight: '1.625rem' }],
        xl: ['1.1875rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.4375rem', { lineHeight: '2rem', letterSpacing: '-0.015em' }],
        '3xl': ['1.75rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.125rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }],
        '5xl': ['2.75rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        '6xl': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        md: '0.625rem',
        lg: '0.75rem',
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        // Ombres douces et colorées, jamais du noir pur.
        xs: '0 1px 2px 0 rgb(26 35 42 / 0.05)',
        sm: '0 1px 3px 0 rgb(26 35 42 / 0.07), 0 1px 2px -1px rgb(26 35 42 / 0.05)',
        DEFAULT: '0 2px 6px -1px rgb(26 35 42 / 0.07), 0 1px 3px -1px rgb(26 35 42 / 0.05)',
        md: '0 6px 16px -4px rgb(26 35 42 / 0.09), 0 2px 6px -2px rgb(26 35 42 / 0.05)',
        lg: '0 14px 32px -8px rgb(26 35 42 / 0.13), 0 4px 10px -4px rgb(26 35 42 / 0.06)',
        xl: '0 24px 56px -16px rgb(26 35 42 / 0.18), 0 8px 20px -8px rgb(26 35 42 / 0.08)',
        brand: '0 8px 24px -8px rgb(20 124 118 / 0.45)',
        'brand-lg': '0 16px 40px -12px rgb(20 124 118 / 0.5)',
        'inner-top': 'inset 0 1px 0 0 rgb(255 255 255 / 0.08)',
        focus: '0 0 0 3px rgb(20 124 118 / 0.22)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.32, 0.72, 0, 1)',
        bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        // `fade-in` n'anime QUE l'opacité : c'est la seule à utiliser sur un
        // conteneur de page.
        'fade-in': 'fade-in .25s cubic-bezier(0.32,0.72,0,1) both',
        // ATTENTION : les trois animations ci-dessous contiennent un `transform`
        // et sont en fill-mode `both`, donc le transform PERSISTE après coup.
        // Un élément avec un transform devient bloc conteneur de ses descendants
        // en `position: fixed` : une fenêtre modale placée à l'intérieur se
        // centrerait au milieu de TOUTE la page (potentiellement très longue)
        // au lieu de l'écran. Ne les utiliser que sur des blocs qui NE
        // CONTIENNENT PAS de fenêtre modale / d'élément fixe.
        'fade-up': 'fade-up .35s cubic-bezier(0.32,0.72,0,1) both',
        'scale-in': 'scale-in .2s cubic-bezier(0.32,0.72,0,1) both',
        'slide-in-right': 'slide-in-right .3s cubic-bezier(0.32,0.72,0,1) both',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #147c76 0%, #0e625e 55%, #0d4e4b 100%)',
        // ATTENTION : le grain est intégré ICI, en première couche du
        // background-image. Ne JAMAIS ajouter `bg-noise` à côté de
        // `bg-dark-gradient` : les deux écrivent background-image, la dernière
        // déclaration gagne et le dégradé disparaît (surface transparente).
        'dark-gradient':
          'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27140%27 height=%27140%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.85%27 numOctaves=%273%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%270.04%27/%3E%3C/svg%3E"), linear-gradient(160deg, #1a232a 0%, #0e403f 58%, #0d4e4b 100%)',
      },
      maxWidth: {
        content: '92rem',
      },
    },
  },
  plugins: [],
};
