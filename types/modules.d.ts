/**
 * Module declarations for third-party packages without TypeScript definitions
 */

declare module 'nodemailer' {
  export interface Transporter {
    sendMail(mailOptions: any): Promise<any>;
  }
  
  export interface MailOptions {
    from?: string;
    to?: string | string[];
    subject?: string;
    text?: string;
    html?: string;
    attachments?: any[];
  }
  
  export function createTransporter(config: any): Transporter;
  export function createTransport(config: any): Transporter;
}

declare module 'twilio' {
  export interface TwilioClient {
    messages: {
      create(options: {
        body: string;
        from: string;
        to: string;
      }): Promise<any>;
    };
  }
  
  export default function (accountSid: string, authToken: string): TwilioClient;
}

declare module '@tanstack/react-query' {
  export interface QueryClient {
    invalidateQueries(queryKey?: any): Promise<void>;
    setQueryData(queryKey: any, data: any): void;
    getQueryData(queryKey: any): any;
    refetchQueries(queryKey?: any): Promise<void>;
    prefetchQuery(options: {
      queryKey: any[];
      queryFn: () => Promise<any>;
      staleTime?: number;
    }): Promise<void>;
  }
  
  export function useQuery(options: {
    queryKey: any[];
    queryFn: () => Promise<any>;
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
    gcTime?: number;
  }): {
    data: any;
    isLoading: boolean;
    error: any;
    refetch: () => void;
  };
  
  export function useMutation(options: {
    mutationFn: (variables: any) => Promise<any>;
    onSuccess?: (data: any, variables?: any) => void;
    onError?: (error: any) => void;
  }): {
    mutate: (variables: any) => void;
    isLoading: boolean;
    error: any;
  };
  
  export function useQueryClient(): QueryClient;
  
  export class QueryClient {
    constructor(options?: any);
  }
  
  export interface QueryClientProviderProps {
    client: QueryClient;
    children: React.ReactNode;
  }
  
  export const QueryClientProvider: React.FC<QueryClientProviderProps>;
}

declare module '@tanstack/react-query-devtools' {
  export const ReactQueryDevtools: React.FC<{
    initialIsOpen?: boolean;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  }>;
}

declare module '@opentelemetry/instrumentation-redis-4' {
  export class RedisInstrumentation {
    constructor(config?: any);
  }
}

declare module 'twilio' {
  interface TwilioClient {
    messages: {
      create(options: {
        body: string;
        from: string;
        to: string;
      }): Promise<any>;
    };
  }
  
  function twilio(accountSid: string, authToken: string): TwilioClient;
  export = twilio;
  export type Twilio = TwilioClient;
}