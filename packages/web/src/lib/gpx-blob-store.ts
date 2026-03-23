import { clear, createStore, get, set } from 'idb-keyval'

const store = createStore('roadtrip-gpx-blobs', 'blobs')

export async function saveGpxBlob(
  trackId: string,
  content: string
): Promise<void> {
  await set(trackId, content, store)
}

export async function getGpxBlob(trackId: string): Promise<string | undefined> {
  return get<string>(trackId, store)
}

export async function clearGpxBlobs(): Promise<void> {
  await clear(store)
}
