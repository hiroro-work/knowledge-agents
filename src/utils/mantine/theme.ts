import { createTheme, rem } from '@mantine/core';
import type { MantineColorsTuple } from '@mantine/core';

const brandBlue: MantineColorsTuple = [
  '#e5f4ff',
  '#cde2ff',
  '#9bc2ff',
  '#64a0ff',
  '#3884fe',
  '#1d72fe',
  '#0969ff',
  '#0058e4',
  '#004ecd',
  '#0043b5',
];

export const theme = createTheme({
  fontFamily: 'Helvetica Neue, Arial, Hiragino Kaku Gothic ProN, Hiragino Sans, Meiryo, sans-serif',
  primaryColor: 'brand',
  colors: {
    brand: brandBlue,
  },
  headings: {
    fontWeight: '600',
    sizes: {
      h1: { fontSize: rem(32), lineHeight: '1.3' },
      h2: { fontSize: rem(26), lineHeight: '1.35' },
      h3: { fontSize: rem(22), lineHeight: '1.4' },
      h4: { fontSize: rem(18), lineHeight: '1.45' },
    },
  },
  radius: {
    xs: rem(4),
    sm: rem(6),
    md: rem(8),
    lg: rem(12),
    xl: rem(16),
  },
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.2)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(0, 0, 0, 0.2)',
    md: '0 4px 6px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.2)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.25), 0 4px 6px rgba(0, 0, 0, 0.2)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.3), 0 10px 10px rgba(0, 0, 0, 0.2)',
  },
  components: {
    Card: {
      defaultProps: {
        shadow: 'sm',
        radius: 'lg',
      },
    },
    Button: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        root: {
          transition: 'transform 100ms ease, box-shadow 100ms ease',
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
      },
    },
    ActionIcon: {
      defaultProps: {
        radius: 'md',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
    },
    Textarea: {
      defaultProps: {
        radius: 'md',
      },
    },
    Select: {
      defaultProps: {
        radius: 'md',
      },
    },
    Badge: {
      defaultProps: {
        radius: 'md',
      },
    },
    NavLink: {
      styles: {
        root: {
          borderRadius: 'var(--mantine-radius-md)',
          transition: 'background-color 150ms ease',
        },
      },
    },
    Modal: {
      defaultProps: {
        radius: 'lg',
        centered: true,
      },
      styles: {
        header: {
          borderBottom: '1px solid var(--mantine-color-dark-5)',
          paddingBottom: 'var(--mantine-spacing-sm)',
        },
        title: {
          fontWeight: 600,
        },
      },
    },
  },
});
