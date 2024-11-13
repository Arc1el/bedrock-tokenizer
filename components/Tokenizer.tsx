'use client';

import { useState, useEffect, useCallback } from 'react';
import { Select, Input, Button, Card, message, Tabs } from 'antd';
import debounce from 'lodash/debounce';
import { ApiLogger } from './ApiLogger';
const { TextArea } = Input;
const { TabPane } = Tabs;

interface TokenVisualization {
  text: string;
  tokenIds: number[];
  tokens: string[];
  charToToken: number[];
}

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

interface ExchangeRate {
  USD: {
    KRW: number;
  };
}

const DEBOUNCE_DELAY = 1000; // 2초
const EXAMPLE_TEXT = "대한민국의 영토는 한반도와 그 부속도서로 한다. 비상계엄이 선포된 때에는 법률이 정하는 바에 의하여 영장제도, 언론·출판·집회·결사의 자유, 정부나 법원의 권한에 관하여 특별한 조치를 할 수 있다. 군인은 현역을 면한 후가 아니면 국무총리로 임명될 수 없다. 중앙선거관리위원회는 법령의 범위안에서 선거관리·국민투표관리 또는 정당사무에 관한 규을 제정할 수 있으며, 법률에 저촉되지 아니하는 범위안에서 내부규율에 관한 규칙을 제정할 수 있다.";

const PROVIDERS = [
  { key: 'anthropic', name: 'Anthropic', models: ["claude-3-5-sonnet", 'claude-3-opus', 'claude-3.5-haiku', 'claude-3-haiku'] },
  { key: 'cohere', name: 'Cohere', models: ['command-r+', 'command-r', 'command-light'] },
  { key: 'llama', name: 'Meta Llama', models: ['llama-3.2-90b', 'llama-3.2-11b', 'llama-3.2-3b', 'llama-3.2-1b', 'llama-3.1-70b', 'llama-3.1-8b', 'llama-3-70b', 'llama-3-8b'] },
  { key: 'mistral', name: 'Mistral', models: ['mistral-large-2'] },
];

export default function Tokenizer() {
  const [text, setText] = useState('');
  const [tokenCounts, setTokenCounts] = useState<Record<string, number>>({});
  const [visualization, setVisualization] = useState<TokenVisualization | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState('anthropic');
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({
    anthropic: "claude-3-5-sonnet",
    cohere: 'command-r+',
    llama: 'llama-3.2-90b',
    mistral: 'mistral-large-2'
  });
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(1300); // 기본값 설정
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data: ExchangeRate = await response.json();
        setExchangeRate(data.USD.KRW);
      } catch (error) {
        console.error('환율 정보 가져오기 실패:', error);
      }
    };
    
    fetchExchangeRate();
  }, []);

  const handleCount = useCallback(async (textToAnalyze: string, provider: string) => {
    if (!textToAnalyze.trim()) {
      setTokenCounts(prev => ({ ...prev, [provider]: 0 }));
      setPrices(prev => ({ ...prev, [provider]: 0 }));
      setVisualization(null);
      return;
    }

    setLoading(true);
    const requestBody = { 
      text: textToAnalyze, 
      provider,
      model: selectedModels[provider],
      visualize: true
    };

    const newLog: ApiLog = {
      timestamp: new Date().toISOString(),
      request: {
        url: '/api/count-tokens',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody
      }
    };

    try {
      const response = await fetch('/api/count-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      
      newLog.response = {
        status: response.status,
        body: data
      };

      if (!response.ok) {
        throw new Error('토큰 계산에 실패했습니다.');
      }
      
      setTokenCounts(prev => ({
        ...prev,
        [provider]: data.tokenCount
      }));
      setPrices(prev => ({
        ...prev,
        [provider]: data.price
      }));
      if (data.visualization) {
        setVisualization(data.visualization);
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('토큰 계산 중 오류가 발생했습니다.');
    } finally {
      setApiLogs(prev => [newLog, ...prev]);
      setLoading(false);
    }
  }, [selectedModels]);

  const debouncedCount = useCallback(
    debounce((text: string, provider: string) => {
      handleCount(text, provider);
    }, DEBOUNCE_DELAY),
    [handleCount]
  );

  useEffect(() => {
    debouncedCount(text, activeProvider);
    return () => {
      debouncedCount.cancel();
    };
  }, [text, activeProvider, debouncedCount]);

  const handleClear = () => {
    setText('');
    setTokenCounts({});
    setVisualization(null);
  };

  const handleShowExample = () => {
    setText(EXAMPLE_TEXT);
  };

  return (
    <>
      <div className="w-full min-h-screen bg-white p-7 rounded-lg shadow-lg">
        <div className="max-w-7xl mx-auto bg-white p-6">
          <h1 className="flex items-center gap-2 text-3xl font-bold mb-6">
            <img 
              src="https://d3rrzw75sdtfe5.cloudfront.net/icon/bee4d136bd8eb45ab32def8604e37cd2-2a0639d9c34980d353a3da561deb6460.svg" 
              alt="Bedrock Icon"
              className="w-6 h-6"
            />
            Bedrock LLMs Tokenizer & Pricing Calculator
          </h1>
          
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="text-gray-700 space-y-2">
                <h2 className="text-lg font-semibold">언어 모델 토큰화란?</h2>
                <p>
                  언어 모델의 토큰화는 텍스트를 모델이 처리할 수 있는 작은 단위로 나누는 중요한 과정입니다.<br></br>
                  이 과정은 텍스트를 모델이 이해할 수 있는 숫자 형태로 변환하고, 대규모 텍스트 데이터를 효율적으로 처리하는 데 도움을 줍니다.<br></br><br></br>
                  토큰화는 언어 모델의 성능과 효율성을 크게 좌우하므로, 언어나 도메인의 특성을 고려하여 적절한 방식을 선택하는 것이 중요합니다.<br></br><br></br>
                  아래 도구를 사용하면 언어 모델에 따라 텍스트 조각이 어떻게 토큰화되는지, 그리고 해당 텍스트 조각에 있는 토큰의 총 개수를 파악할 수 있습니다.
                </p>
              </div>

              <TextArea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                className="w-full font-mono"
                placeholder="토큰을 계산할 텍스트를 입력하세요..."
              />
              
              <div className="flex gap-2 mb-4">
                <Button onClick={handleClear}>지우기</Button>
                <Button onClick={handleShowExample}>예제</Button>
              </div>

              <div className="flex gap-4 mb-2">
                <div className="flex-1">
                  <label className="text-sm font-medium">토큰 수</label>
                  <div className="text-2xl font-bold">{tokenCounts[activeProvider] || 0}</div>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">글자 길이</label>
                  <div className="text-2xl font-bold">{text.length}</div>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">예상 비용</label>
                  <div className="text-2xl font-bold">
                    ${(prices[activeProvider] || 0).toFixed(6)}
                    <span className="text-xs text-gray-500 ml-2"><br></br>
                      (≈ ₩{((prices[activeProvider] || 0) * exchangeRate).toFixed(2)})
                    </span>
                  </div>
                </div>
              </div>
              
              <Tabs 
                activeKey={activeProvider}
                onChange={setActiveProvider}
              >
                {PROVIDERS.map(provider => (
                  <TabPane tab={provider.name} key={provider.key}>
                    <div className="space-y-4">
                      <Select
                        value={selectedModels[provider.key]}
                        onChange={(value) => setSelectedModels(prev => ({
                          ...prev,
                          [provider.key]: value
                        }))}
                        className="w-full"
                        options={provider.models.map(model => ({
                          value: model,
                          label: model
                        }))}
                      />

                    {provider.key === 'anthropic' && (
                            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-4">
                            <p>
                                Anthropic에서 토큰화 세부 정보(토큰 목록, 토큰 ID, 문자-토큰 매핑)를 제공하지 않습니다.<br></br>
                                따라서 토큰 수만 확인 가능하며 해당 기능은 분당 최대 100회 호출가능하므로, 유의하여 사용하세요.
                            </p>
                            </div>
                        )}
                      
                      {visualization && (
                        <div className="token-visualization mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="whitespace-pre-wrap break-all">
                            {visualization.text.split('').map((char, index) => {
                              if (char === ' ' || char === '\n') {
                                return <span key={index}>{char}</span>;
                              }
                              
                              // 두 번째 ' '는 건너뛰기
                              if (char === ' ' && visualization.text[index - 1] === ' ') {
                                return null;
                              }
                              
                              const nonSpaceIndex = visualization.text
                                .slice(0, index)
                                .split('')
                                .filter(c => c !== ' ' && c !== '\n')
                                .length;
                              
                              const tokenIndex = visualization.charToToken[nonSpaceIndex];
                              
                              // 첫 번째 ' '인 경우 다음 문자와 함께 처리
                              if (char === ' ' && visualization.text[index + 1] === ' ') {
                                return (
                                  <span
                                    key={index}
                                    style={{
                                      backgroundColor: `hsl(${(tokenIndex * 37) % 360}, 70%, 90%)`,
                                      padding: '0 1px',
                                      borderRadius: '2px',
                                      margin: '0 1px'
                                    }}
                                    title={`Token: ${visualization.tokens[tokenIndex]}`}
                                  >
                                    {char + visualization.text[index + 1]}
                                  </span>
                                );
                              }
                              
                              return (
                                <span
                                  key={index}
                                  style={{
                                    backgroundColor: `hsl(${(tokenIndex * 37) % 360}, 70%, 90%)`,
                                    padding: '0 1px',
                                    borderRadius: '2px',
                                    margin: '0 1px'
                                  }}
                                  title={`Token: ${visualization.tokens[tokenIndex]}`}
                                >
                                  {char}
                                </span>
                              );
                            })}
                          </div>
                          
                          <div className="mt-4">
                            <div className="text-sm font-medium mb-2">Token IDs</div>
                            <div className="font-mono text-xs overflow-x-auto">
                              {visualization.tokenIds.join(' ')}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabPane>
                ))}
              </Tabs> 
            </div>

            <div className="space-y-4">
              <ApiLogger logs={apiLogs} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
