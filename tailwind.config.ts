import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
  			mono: ['var(--font-mono)', 'monospace'],
  		},
  		colors: {
  			'onda-teal': '#0E6F70',
  			'onda-teal-dark': '#084B4D',
  			'onda-teal-light': '#52A7A9',
  			'onda-coral': '#F46A5F',
  			'onda-coral-light': '#FF8A7C',
  			'onda-aqua': '#A9D9D5',
  			'onda-ocean': '#215E74',
  			'onda-bg': '#F6FAFA',
  			'onda-ink': '#1E1E1E',
  			onda: {
  				teal: '#0F6E71',
  				deep: '#09484A',
  				coral: '#E97063',
  				sand: '#F7F4EF',
  				slate: '#334155'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		boxShadow: {
  			soft: '0 10px 30px rgba(2,6,23,0.06)'
  		},
  		borderRadius: {
  			xl2: '1rem',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		container: {
  			center: true,
  			padding: '1rem'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
