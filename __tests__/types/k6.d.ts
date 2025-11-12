/**
 * Mock type definitions for k6 load testing
 * These allow TypeScript compilation to succeed without the actual k6 runtime
 */

declare module 'k6' {
  export function check(val: any, sets: Record<string, (r: any) => boolean>): boolean;
  export function group(name: string, fn: () => void): void;
  export function sleep(t: number): void;
}

declare module 'k6/http' {
  export interface Response {
    status: number;
    body: string;
    timings: {
      duration: number;
    };
    cookies: Record<string, Array<{ value: string }>>;
  }

  export interface RequestOptions {
    headers?: Record<string, string>;
    timeout?: string;
  }

  export function get(url: string, options?: RequestOptions): Response;
  export function post(url: string, body?: any, options?: RequestOptions): Response;
  export function batch(requests: any[]): Response[];

  const httpModule = {
    get,
    post,
    batch
  };

  export default httpModule;
}

declare module 'k6/options' {
  export interface Stage {
    duration: string;
    target: number;
  }

  export interface Thresholds {
    [key: string]: string[];
  }

  export interface Options {
    stages?: Stage[];
    thresholds?: Thresholds;
    noConnectionReuse?: boolean;
    userAgent?: string;
    ext?: {
      loadimpact?: {
        projectID: number;
        name: string;
      };
    };
  }
}

declare module 'k6/metrics' {
  export class Rate {
    constructor(name: string);
    add(value: boolean | number): void;
  }

  export class Trend {
    constructor(name: string);
    add(value: number): void;
  }

  export class Counter {
    constructor(name: string);
    add(value: number): void;
  }
}

declare var __ENV: Record<string, string>;