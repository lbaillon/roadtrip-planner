export type ApiFn = <T>(url: string, options?: RequestInit) => Promise<T>
export type FlushHandler<P> = (payload: P, api: ApiFn) => Promise<void>
