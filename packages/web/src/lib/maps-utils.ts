function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent)
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function getDirectionsUrl(
  lat: number,
  lon: number,
  label?: string
): string {
  if (isAndroid()) {
    const query = label
      ? `${lat},${lon}(${encodeURIComponent(label)})`
      : `${lat},${lon}`
    return `geo:${lat},${lon}?q=${query}`
  }
  if (isIOS()) {
    return `https://maps.apple.com/?daddr=${lat},${lon}`
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`
}
