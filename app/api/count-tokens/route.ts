import { NextResponse } from 'next/server';
import { PythonShell } from 'python-shell';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { text, provider, model, visualize } = await req.json();

    console.log('요청 데이터:', { text, provider, model, visualize });
    if (!text || !provider || !model) {
      return NextResponse.json(
        { error: '텍스트, 공급자, 모델은 필수 입력값입니다.' },
        { status: 400 }
      );
    }

    const options = {
      mode: 'text' as const,
      pythonPath: 'python3',
      pythonOptions: ['-u'],
      scriptPath: path.join(process.cwd(), 'backend'),
      args: [text, provider, model, visualize ? 'true' : 'false']
    };

    console.log('Python 스크립트 실행 옵션:', {
      ...options,
      args: options.args.map((arg, i) => `arg${i}: ${arg}`)
    });
    
    const result = await PythonShell.run('token_counter.py', options);
    console.log('Python 스크립트 실행 결과:', result);
    
    try {
      const data = JSON.parse(result[0]);
      console.log('파싱된 데이터:', data);

      if (data.success === false) {
        throw new Error(data.error || '토큰 계산 실패');
      }

      if (data.tokenCount !== undefined) {
        return NextResponse.json({
          tokenCount: data.tokenCount,
          price: data.price,
          visualization: visualize ? data.visualization : undefined
        });
      }

      throw new Error('토큰 수 계산 결과가 없습니다.');

    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      console.log('파싱 실패한 원본 데이터:', result);
      return NextResponse.json(
        { error: parseError instanceof Error ? parseError.message : '결과 파싱 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('전체 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '토큰 계산 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 