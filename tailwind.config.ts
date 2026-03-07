import type { Config } from "tailwindcss"
const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");




const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx,mdx}',
    './packages/*/src/**/*.{ts,tsx}',
	],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		screens: {
  			'xs': '475px',
  			'3xl': '1920px',
  		},
  		spacing: {
  			'4.5': '1.125rem',
  			'13': '3.25rem',
  			'15': '3.75rem',
  			'18': '4.5rem',
  		},
  		maxWidth: {
  			'8xl': '88rem',
  			'9xl': '96rem',
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			'motivation-start': 'hsl(var(--motivation-start))',
  			'motivation-end': 'hsl(var(--motivation-end))',
  			'motivation-vignette': 'hsl(var(--motivation-vignette))',
  			'card-border': 'hsl(var(--card-border))',
  			'surface': 'hsl(var(--surface))',
  			'surface-muted': 'hsl(var(--surface-muted))',
  			'brand': 'hsl(var(--brand))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			// Blog Editorial - Warm Earth Palette (alpha-compatible)
  			blog: {
  				bg: 'hsl(var(--blog-bg) / <alpha-value>)',
  				primary: 'hsl(var(--blog-primary) / <alpha-value>)',
  				'primary-light': 'hsl(var(--blog-primary-light) / <alpha-value>)',
  				'primary-dark': 'hsl(var(--blog-primary-dark) / <alpha-value>)',
  				accent: 'hsl(var(--blog-accent) / <alpha-value>)',
  				'accent-light': 'hsl(var(--blog-accent-light) / <alpha-value>)',
  				gold: 'hsl(var(--blog-gold) / <alpha-value>)',
  				text: 'hsl(var(--blog-text) / <alpha-value>)',
  				'text-muted': 'hsl(var(--blog-text-muted) / <alpha-value>)',
  				surface: 'hsl(var(--blog-surface) / <alpha-value>)',
  				'surface-elevated': 'hsl(var(--blog-surface-elevated) / <alpha-value>)',
  				border: 'hsl(var(--blog-border) / <alpha-value>)',
  				'border-strong': 'hsl(var(--blog-border-strong) / <alpha-value>)',
  			}
  		},
      backgroundSize: {
        'size-200': '200% 200%',
      },
      backgroundPosition: {
        'pos-0': '0% 0%',
        'pos-100': '100% 100%',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
      },
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			scroll: {
  				to: {
  					transform: 'translate(calc(-50% - 0.5rem))'
  				}
  			},
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.5' }
        },
        'shimmer': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        'blob': {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' }
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.6)' }
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        'border-beam': {
          '100%': { offsetDistance: '100%' }
        },
        // Blog Editorial Animations
        'blog-hero-reveal': {
          '0%': { opacity: '0', transform: 'translateY(40px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' }
        },
        'blog-content-reveal': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'blog-sidebar-slide': {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        'blog-dropcap-fade': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        'blog-fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'blog-progress': {
          '0%': { width: '0%' },
          '100%': { width: 'var(--scroll-progress, 0%)' }
        },
        'blog-share-pop': {
          '0%': { opacity: '0', transform: 'scale(0.8) translateY(20px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' }
        }
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			scroll: 'scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-mobile': 'pulse-mobile 1.5s ease-in-out infinite',
        'float-medium': 'float 4s ease-in-out infinite',
        'float-fast': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'gradient-x': 'gradient-x 3s ease infinite',
        'blob': 'blob 7s infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'spin-slow': 'spin-slow 8s linear infinite',
        'border-beam': 'border-beam calc(var(--duration)*1s) infinite linear',
        'float': 'float 20s ease-in-out infinite',
        // Blog Editorial Animation Utilities
        'blog-hero': 'blog-hero-reveal 1s cubic-bezier(0.22, 1, 0.36, 1) both',
        'blog-content': 'blog-content-reveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) both',
        'blog-sidebar': 'blog-sidebar-slide 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'blog-dropcap': 'blog-dropcap-fade 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'blog-fade': 'blog-fade-in 0.4s ease-out both',
        'blog-share': 'blog-share-pop 0.3s cubic-bezier(0.22, 1, 0.36, 1) both'
  		},
      // Typography plugin configuration for consistent blog fonts
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': 'hsl(var(--blog-text))',
            '--tw-prose-headings': 'hsl(var(--blog-text))',
            '--tw-prose-links': 'hsl(var(--blog-primary))',
            '--tw-prose-bold': 'hsl(var(--blog-text))',
            '--tw-prose-quotes': 'hsl(var(--blog-text-muted))',
            '--tw-prose-quote-borders': 'hsl(var(--blog-primary))',
            fontFamily: 'var(--font-body, "Source Serif 4", Charter, Georgia, serif)',
            h1: {
              fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
              fontWeight: '700',
            },
            h2: {
              fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
              fontWeight: '700',
            },
            h3: {
              fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
              fontWeight: '600',
            },
            h4: {
              fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
              fontWeight: '600',
            },
            p: {
              fontFamily: 'var(--font-body, "Source Serif 4", Charter, Georgia, serif)',
            },
            li: {
              fontFamily: 'var(--font-body, "Source Serif 4", Charter, Georgia, serif)',
            },
            blockquote: {
              fontFamily: 'var(--font-body, "Source Serif 4", Charter, Georgia, serif)',
              fontStyle: 'italic',
            },
            strong: {
              fontFamily: 'var(--font-body, "Source Serif 4", Charter, Georgia, serif)',
              fontWeight: '600',
            },
            a: {
              fontFamily: 'var(--font-body, "Source Serif 4", Charter, Georgia, serif)',
              textDecoration: 'none',
              borderBottom: '1px solid hsla(var(--blog-primary), 0.3)',
              '&:hover': {
                borderBottomColor: 'hsl(var(--blog-primary))',
              },
            },
          },
        },
        // Dark mode prose styles
        invert: {
          css: {
            '--tw-prose-body': 'hsl(var(--blog-text) / 0.9)',
            '--tw-prose-headings': '#ffffff',
            '--tw-prose-links': 'hsl(var(--blog-primary-light))',
            '--tw-prose-bold': '#ffffff',
            '--tw-prose-quotes': 'hsl(var(--blog-text-muted))',
          },
        },
      },
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    addVariablesForColors,
    require("@tailwindcss/typography"),
  ],
} satisfies Config

function addVariablesForColors({ addBase, theme }: any) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );
 
  addBase({
    ":root": newVars,
  });
}

export default config
