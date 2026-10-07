import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestContextStore {
  requestId: string;
}

/**
 * Contexto por requisição (AsyncLocalStorage). Permite propagar o requestId
 * para logs e eventos de integração sem passá-lo manualmente entre camadas.
 */
export class RequestContext {
  private static readonly storage =
    new AsyncLocalStorage<RequestContextStore>();

  static run<T>(store: RequestContextStore, callback: () => T): T {
    return this.storage.run(store, callback);
  }

  static get requestId(): string | undefined {
    return this.storage.getStore()?.requestId;
  }
}
