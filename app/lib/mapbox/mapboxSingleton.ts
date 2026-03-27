/**
 * Singleton loader for mapbox-gl.
 * All components share the same promise — the module is fetched once.
 */

let _promise: Promise<typeof import("mapbox-gl")> | null = null;

export function getMapboxGL(): Promise<typeof import("mapbox-gl")> {
  if (!_promise) {
    _promise = import("mapbox-gl");
  }
  return _promise;
}
