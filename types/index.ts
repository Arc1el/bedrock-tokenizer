export interface ApiLog {
  timestamp: string;
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: any;
  };
  response?: {
    status: number;
    body: any;
  };
} 