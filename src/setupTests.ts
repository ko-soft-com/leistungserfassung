import '@testing-library/jest-dom'
import { beforeEach } from 'vitest'

// Mock localStorage for test environment
beforeEach(() => {
  const store: Record<string, string> = {}

  const mockLocalStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach((key) => {
        delete store[key]
      })
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    },
    get length() {
      return Object.keys(store).length
    },
  }

  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  })
})
