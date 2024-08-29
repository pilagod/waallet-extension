export interface Eip1193Provider {
  request<T>(args: { method: string; params?: any[] }): Promise<T>
}
