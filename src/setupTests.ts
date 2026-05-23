import '@testing-library/jest-dom'
import { beforeEach, vi } from 'vitest'

// Mock firebase/auth globally so that importing firebase.ts in component tests
// does not trigger a real getAuth() call which throws auth/invalid-api-key.
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  connectAuthEmulator: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(() => vi.fn()),
}))

// Create a shared localStorage mock that persists across module imports.
// Zustand persist middleware captures the localStorage reference at module
// init time, so we must install the mock before any store modules are imported.
const localStorageStore: Record<string, string> = {}

const mockLocalStorage = {
  getItem: (key: string) => localStorageStore[key] ?? null,
  setItem: (key: string, value: string) => {
    localStorageStore[key] = value.toString()
  },
  removeItem: (key: string) => {
    delete localStorageStore[key]
  },
  clear: () => {
    Object.keys(localStorageStore).forEach((key) => {
      delete localStorageStore[key]
    })
  },
  key: (index: number) => {
    const keys = Object.keys(localStorageStore)
    return keys[index] ?? null
  },
  get length() {
    return Object.keys(localStorageStore).length
  },
}

// Install mock globally so it is present when store modules are first imported
Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
})

// Clear the store between tests to avoid cross-test contamination
beforeEach(() => {
  mockLocalStorage.clear()
})
