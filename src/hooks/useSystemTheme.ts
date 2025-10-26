import {useEffect} from 'react'

/**
 * Hook that synchronizes the document's dark mode class with the system theme preference.
 * Listens for changes to the system theme and updates the 'dark' class on the HTML element.
 */
export function useSystemTheme() {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    // Set initial theme (in case the inline script didn't run)
    updateTheme(mediaQuery)

    // Listen for theme changes
    mediaQuery.addEventListener('change', updateTheme)

    return () => {
      mediaQuery.removeEventListener('change', updateTheme)
    }
  }, [])
}
