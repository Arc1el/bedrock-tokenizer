import sys
import os
import json
from typing import Dict, List, Union
from dotenv import load_dotenv

# 각 공급사의 토크나이저 라이브러리들
import anthropic
from transformers import AutoTokenizer
from mistral_common.tokens.tokenizers.mistral import MistralTokenizer
from mistral_common.protocol.instruct.messages import UserMessage
from mistral_common.protocol.instruct.request import ChatCompletionRequest
import boto3

load_dotenv()

class TokenCounter:
    def __init__(self):
        self.tokenizers = {}
        # 토큰당 가격 정보 추가 (1,000토큰 당 USD 기준)
        self.price_per_1k_tokens = {
            'anthropic': {
                'claude-3-opus': 0.015,
                'claude-3-5-sonnet': 0.003,
                'claude-3.5-haiku': 0.00025,
            },
            'cohere': {
                'command-r+': 0.003,
                'command-r': 0.0005,
                'command-light': 0.0003,
            },
            'llama': {
                'llama-3.2-90b': 0.002,
                'llama-3.2-11b': 0.00035,
                'llama-3.2-3b': 0.00015,
                'llama-3.2-1b': 0.0001,
                'llama-3.1-70b': 0.00099,
                'llama-3.1-8b': 0.00022,
                'llama-3-70b': 0.00265,
                'llama-3-8b': 0.0003,
            },
            'mistral': {
                'mistral-large-2': 0.0004,
            }
        }
        
    def _get_tokenizer(self, provider: str):
        if provider not in self.tokenizers:
            if provider == 'cohere':
                self.tokenizers[provider] = AutoTokenizer.from_pretrained(
                    "Cohere/multilingual-22-12",
                    token=os.getenv('HUGGINGFACE_TOKEN')
                )
            elif provider == 'llama':
                self.tokenizers[provider] = AutoTokenizer.from_pretrained("meta-llama/Meta-Llama-3-8B",
                    token=os.getenv('HUGGINGFACE_TOKEN'))
            elif provider == 'mistral':
                self.tokenizers[provider] = MistralTokenizer.v3()
        return self.tokenizers.get(provider)

    def calculate_price(self, token_count: int, provider: str, model: str) -> float:
        if provider not in self.price_per_1k_tokens or model not in self.price_per_1k_tokens[provider]:
            return 0.0
        price_per_1k = self.price_per_1k_tokens[provider][model]
        return round((token_count / 1000) * price_per_1k, 6)

    def count_tokens_anthropic(self, text: str, model: str) -> Dict[str, Union[int, dict, float]]:
        try:
            client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
            response = client.beta.messages.count_tokens(
                betas=["token-counting-2024-11-01"],
                model="claude-3-5-sonnet-20241022",
                system="You are a helpful assistant",
                messages=[{"role": "user", "content": text}]
            )
            
            token_count = response.input_tokens
            price = self.calculate_price(token_count, 'anthropic', model)
            
            return {
                "success": True,
                "tokenCount": token_count,
                "price": price,
                "visualization": {
                    "text": text,
                    "tokens": [],
                    "tokenIds": [],
                    "charToToken": []
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def count_tokens_cohere(self, text: str, model: str) -> Dict[str, Union[int, dict, float]]:
        try:
            tokenizer = self._get_tokenizer('cohere')
            encoding = tokenizer.encode(text, add_special_tokens=False)
            tokens = tokenizer.convert_ids_to_tokens(encoding)
            token_count = len(encoding)
            price = self.calculate_price(token_count, 'cohere', model)
            
            # 각 문자가 어떤 토큰에 속하는지 매핑
            char_to_token = []
            current_pos = 0
            for token in tokens:
                token_text = tokenizer.convert_tokens_to_string([token])
                token_len = len(token_text)
                char_to_token.extend([len(char_to_token)] * token_len)
                current_pos += token_len

            return {
                "success": True,
                "tokenCount": token_count,
                "price": price,
                "visualization": {
                    "text": text,
                    "tokens": tokens,
                    "tokenIds": encoding,
                    "charToToken": char_to_token
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def count_tokens_llama(self, text: str, model: str) -> Dict[str, Union[int, dict, float]]:
        try:
            tokenizer = self._get_tokenizer('llama')
            encoding = tokenizer.encode(text, add_special_tokens=False)
            tokens = tokenizer.convert_ids_to_tokens(encoding)
            token_count = len(encoding)
            price = self.calculate_price(token_count, 'llama', model)
            
            char_to_token = []
            current_pos = 0
            for token in tokens:
                token_text = tokenizer.convert_tokens_to_string([token])
                token_len = len(token_text)
                char_to_token.extend([len(char_to_token)] * token_len)
                current_pos += token_len

            return {
                "success": True,
                "tokenCount": token_count,
                "price": price,
                "visualization": {
                    "text": text,
                    "tokens": tokens,
                    "tokenIds": encoding,
                    "charToToken": char_to_token
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def count_tokens_mistral(self, text: str, model: str) -> Dict[str, Union[int, dict, float]]:
        try:
            tokenizer = self._get_tokenizer('mistral')
            tokenized = tokenizer.encode_chat_completion(
                ChatCompletionRequest(
                    messages=[UserMessage(content=text)],
                    model=model
                )
            )
            
            token_ids = [int(token) for token in tokenized.tokens]
            token_count = len(token_ids)
            price = self.calculate_price(token_count, 'mistral', model)
            
            debug_text = tokenized.text
            debug_text = debug_text.replace("<s>", "").replace("[INST]", "").replace("[/INST]", "")
            
            # 토큰 분리 (▁ 문자를 공백으로 변환)
            raw_tokens = debug_text.split('▁')
            tokens = [token for token in raw_tokens if token]
            
            # 문자-토큰 매핑 생성
            char_to_token = []
            current_token_idx = 0
            i = 0
            
            while i < len(debug_text):
                # ▁ 문자는 건너뛰기
                if debug_text[i] == '▁':
                    char_to_token.append(None)  # 또는 -1
                    i += 1
                    continue
                
                # 현재 문자가 어떤 토큰에 속하는지 찾기
                for token_idx, token in enumerate(tokens):
                    if debug_text[i:].startswith(token):
                        current_token_idx = token_idx
                        break
                
                char_to_token.append(current_token_idx)
                i += 1

            return {
                "success": True,
                "tokenCount": token_count,
                "price": price,
                "visualization": {
                    "text": debug_text,
                    "tokens": tokens,
                    "tokenIds": token_ids,
                    "charToToken": char_to_token
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def count_tokens(self, text: str, provider: str, model: str) -> Dict[str, Union[int, dict]]:
        try:
            if provider == 'anthropic':
                return self.count_tokens_anthropic(text, model)
            elif provider in ['cohere', 'llama', 'mistral']:
                tokenizer = self._get_tokenizer(provider)
                if not tokenizer:
                    raise ValueError(f"토크나이저 초기화 실패: {provider}")
                    
                if provider == 'cohere':
                    return self.count_tokens_cohere(text, model)
                elif provider == 'llama':
                    return self.count_tokens_llama(text, model)
                elif provider == 'mistral':
                    return self.count_tokens_mistral(text, model)
            else:
                raise ValueError(f"지원하지 않는 공급자입니다: {provider}")
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

def main():
    if len(sys.argv) < 4:
        print("Error: Missing required arguments", file=sys.stderr)
        sys.exit(1)

    text = sys.argv[1]
    provider = sys.argv[2]
    model = sys.argv[3]

    try:
        counter = TokenCounter()
        result = counter.count_tokens(text, provider, model)
        print(json.dumps(result))
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main() 