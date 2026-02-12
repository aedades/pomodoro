import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('returns initial value when localStorage is empty', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial value')
    );

    expect(result.current[0]).toBe('initial value');
  });

  it('returns stored value from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('stored value'));

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial value')
    );

    expect(result.current[0]).toBe('stored value');
  });

  it('updates localStorage when value changes', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial value')
    );

    act(() => {
      result.current[1]('new value');
    });

    expect(result.current[0]).toBe('new value');
    expect(JSON.parse(localStorage.getItem('test-key')!)).toBe('new value');
  });

  it('handles objects correctly', () => {
    const initialValue = { name: 'test', count: 0 };

    const { result } = renderHook(() =>
      useLocalStorage('test-object', initialValue)
    );

    expect(result.current[0]).toEqual(initialValue);

    act(() => {
      result.current[1]({ name: 'updated', count: 5 });
    });

    expect(result.current[0]).toEqual({ name: 'updated', count: 5 });
    expect(JSON.parse(localStorage.getItem('test-object')!)).toEqual({
      name: 'updated',
      count: 5,
    });
  });

  it('handles arrays correctly', () => {
    const initialValue = [1, 2, 3];

    const { result } = renderHook(() =>
      useLocalStorage('test-array', initialValue)
    );

    expect(result.current[0]).toEqual(initialValue);

    act(() => {
      result.current[1]([...result.current[0], 4, 5]);
    });

    expect(result.current[0]).toEqual([1, 2, 3, 4, 5]);
  });

  it('handles function updater', () => {
    const { result } = renderHook(() => useLocalStorage('test-counter', 0));

    act(() => {
      result.current[1]((prev: number) => prev + 1);
    });

    expect(result.current[0]).toBe(1);

    act(() => {
      result.current[1]((prev: number) => prev + 1);
    });

    expect(result.current[0]).toBe(2);
  });

  it('handles invalid JSON in localStorage gracefully', () => {
    localStorage.setItem('test-invalid', 'not valid json{');

    const { result } = renderHook(() =>
      useLocalStorage('test-invalid', 'fallback')
    );

    expect(result.current[0]).toBe('fallback');
  });

  it('handles null values', () => {
    const { result } = renderHook(() =>
      useLocalStorage<string | null>('test-null', null)
    );

    expect(result.current[0]).toBe(null);

    act(() => {
      result.current[1]('not null');
    });

    expect(result.current[0]).toBe('not null');

    act(() => {
      result.current[1](null);
    });

    expect(result.current[0]).toBe(null);
  });

  it('uses different keys independently', () => {
    const { result: result1 } = renderHook(() =>
      useLocalStorage('key1', 'value1')
    );
    const { result: result2 } = renderHook(() =>
      useLocalStorage('key2', 'value2')
    );

    expect(result1.current[0]).toBe('value1');
    expect(result2.current[0]).toBe('value2');

    act(() => {
      result1.current[1]('updated1');
    });

    expect(result1.current[0]).toBe('updated1');
    expect(result2.current[0]).toBe('value2');
  });
});
