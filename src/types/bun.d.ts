declare module "bun:sqlite" {
  export class Database {
    constructor(filename?: string, options?: any);
    query(sql: string): {
      all(...params: any[]): any[];
      get(...params: any[]): any;
      run(...params: any[]): any;
      values(...params: any[]): any[];
    };
    run(sql: string, params?: any[]): any;
    exec(sql: string): void;
    transaction<T extends (...args: any[]) => any>(fn: T): T;
    close(throwOnError?: boolean): void;
  }
}
