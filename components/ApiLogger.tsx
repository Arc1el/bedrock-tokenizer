interface ApiLog {
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
  
  interface ApiLoggerProps {
    logs: ApiLog[];
  }
  
  export function ApiLogger({ logs }: ApiLoggerProps) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">API 로그</h2>
        <div className="space-y-4">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs text-gray-500 mb-2">{log.timestamp}</div>
                
                <div className="mb-4">
                  <div className="font-semibold mb-1">요청</div>
                  <div className="text-sm bg-gray-50 p-2 rounded">
                    <div>{log.request.method} {log.request.url}</div>
                    <pre className="text-xs mt-2 overflow-y-auto max-h-[200px]">
                      {JSON.stringify(log.request.body, null, 2)}
                    </pre>
                  </div>
                </div>

                {log.response && (
                  <div>
                    <div className="font-semibold mb-1">응답</div>
                    <div className="text-sm bg-gray-50 p-2 rounded">
                      <div>Status: {log.response.status}</div>
                      <pre className="text-xs mt-2 overflow-y-auto max-h-[800px]">
                        {JSON.stringify(log.response.body, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="mb-4">
                <div className="font-semibold mb-1">요청</div>
                <div className="text-sm bg-gray-50 p-2 rounded h-[200px] flex items-center justify-center text-gray-400">
                  요청 데이터가 여기에 표시됩니다
                </div>
              </div>

              <div>
                <div className="font-semibold mb-1">응답</div>
                <div className="text-sm bg-gray-50 p-2 rounded h-[800px] flex items-center justify-center text-gray-400">
                  응답 데이터가 여기에 표시됩니다
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }