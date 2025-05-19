import type { Type } from "io-ts";
import { vsprintf } from "sprintf-js";
import { isRight } from "fp-ts/Either";

type JobCondition = (response: Record<string, any>) => boolean;

export interface Job<TJob = any> {
  failCondition?: JobCondition;
  messageTemplate: Record<string, any>;
  returnType: Type<TJob>; // TODO: Hier müsste noch der returnType des jeweiligen Jobs aus Settings rein
}

export interface Settings<TState, TJobs extends Record<string, Job>> {
  jobs: TJobs;
  exceptionCondition: JobCondition;
  startState: TState;
}

export class WebsocketStateClient<TState, TJobs extends Record<string, Job>> {
  websocket: WebSocket | undefined = $state();
  settings: Settings<TState, TJobs>;

  state: TState = $state<TState>() as TState;

  messageListeners: ((response: Record<string, any>) => void)[] = [];
  exceptionListeners: ((response: Record<string, any>) => void)[] = [];
  errorListeners: ((response: Error) => void)[] = [];
  closeListeners: (() => void)[] = [];

  isConnected: boolean = $derived(
    this.websocket?.readyState === WebSocket.OPEN
  );

  private _setupEvents() {
    this.websocket?.addEventListener("message", (e) => {
      try {
        const jsonData = JSON.parse(e.data);

        if (this.settings.exceptionCondition(jsonData)) {
          for (const listener of this.exceptionListeners) {
            listener(jsonData);
          }

          return;
        }

        for (const listener of this.messageListeners) {
          listener(jsonData);
        }
      } catch (er) {
        this._error(er as Error);
      }
    });

    this.websocket?.addEventListener("close", () => {
      for (const listener of this.closeListeners) {
        listener();
      }
    });
  }

  private _error(er: Error) {
    for (const listener of this.errorListeners) {
      listener(er);
    }
  }

  connect(url: string | URL): Promise<undefined | Event> {
    this.disconnect();
    this.websocket = new WebSocket(url);
    return new Promise((resolve, reject) => {
      this.websocket!.onopen = () => {
        this._setupEvents();
        resolve(undefined);
      };
      this.websocket!.onerror = (e) => {
        this.disconnect();
        reject(e);
      };
    });
  }

  disconnect() {
    this.websocket?.close();
    this.websocket = undefined;
    this.state = this.settings.startState;
  }

  runJob<K extends keyof TJobs>(
    name: K,
    ...values: string[]
  ): Promise<TJobs[K] extends Job<infer R> ? R : never> {
    const jobData = this.settings.jobs[name];
    return new Promise((resolve, reject) => {
      if (!this.websocket) reject(new Error("Websocket is not connected"));

      const listener = (e: MessageEvent) => {
        try {
          const jsonData = JSON.parse(e.data);

          // Check if message matches failure condition → reject
          if (jobData.failCondition) {
            if (jobData.failCondition(jsonData)) {
              this.websocket!.removeEventListener("message", listener);
              return reject(jsonData);
            }
          } else {
            if (this.settings.exceptionCondition(jsonData)) {
              this.websocket!.removeEventListener("message", listener);
              return reject(jsonData);
            }
          }

          // Check if message matches returnType → resolve
          const decoded = jobData.returnType.decode(jsonData);
          if (isRight(decoded)) {
            this.websocket!.removeEventListener("message", listener);
            return resolve(jsonData);
          }
        } catch {}
      };

      const messageTemplate = JSON.stringify(jobData.messageTemplate);
      const message = vsprintf(
        messageTemplate,
        values.map(
          (v) =>
            v
              .replace(/\\/g, "\\\\") // Escape backslashes
              .replace(/"/g, '\\"') // Escape double quotes
              .replace(/\n/g, "\\n") // Escape newlines
              .replace(/\r/g, "\\r") // Escape carriage returns
              .replace(/\t/g, "\\t") // Escape tabs
        )
      );

      this.websocket!.send(message);
      this.websocket!.addEventListener("message", listener);
    });
  }

  addMessageListener(listener: (typeof this.messageListeners)[0]) {
    this.messageListeners.push(listener);
  }

  addExceptionListener(listener: (typeof this.exceptionListeners)[0]) {
    this.exceptionListeners.push(listener);
  }

  addCloseListener(listener: (typeof this.closeListeners)[0]) {
    this.closeListeners.push(listener);
  }

  addErrorListener(listener: (typeof this.errorListeners)[0]) {
    this.errorListeners.push(listener);
  }

  removeListeners(
    ...listeners:
      | typeof this.errorListeners
      | typeof this.messageListeners
      | typeof this.closeListeners
      | typeof this.errorListeners
  ) {
    function rm(list: any[], item: (typeof listeners)[0]) {
      const index = list.indexOf(list as any);
      if (index !== -1) list.splice(index, 1);
    }

    for (const list of listeners) {
      rm(this.errorListeners, list);
      rm(this.messageListeners, list);
      rm(this.exceptionListeners, list);
      rm(this.closeListeners, list);
    }
  }

  constructor(settings: Settings<TState, TJobs>) {
    this.settings = settings;
    this.state = settings.startState;
  }
}

export type ReturnTypeOfJob<
  C extends { settings: { jobs: Record<string, Job> } },
  JobName extends keyof C["settings"]["jobs"]
> = Promise<C["settings"]["jobs"][JobName] extends Job<infer R> ? R : never>;
