import { NextRequest } from 'next/server';
import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

const getSystemPrompt = (languageInstruction: string): string => {
  // 測試模式：第一次回應就加上 [INTERVIEW_END] 標記
  const isTestMode = process.env.TEST_INTERVIEW_END === 'true';
  const testInstruction = isTestMode 
    ? '重要：請在第一次回應的結尾就加上 [INTERVIEW_END] 標記來測試面試結束功能。'
    : '';

  return `你是一位專業的面試官，正在進行技術面試。你的任務是：
1. 根據應徵者的回答提出深入的問題
2. 評估應徵者的技術能力、問題解決能力和溝通能力
3. 保持專業但友善的對話風格
4. 適時給予建設性的反饋
5. 根據回答的深度決定是否繼續深入或轉換話題
6. 當你認為已經充分評估應徵者的能力，或面試已進行足夠的對話輪次（約 8-12 輪）時，請在回應結尾加上特殊標記 [INTERVIEW_END] 來表示面試結束

${testInstruction}

重要：請直接提出問題或回應，不要重複用戶的問題內容，也不要加上「您提到...請說明：」或類似的引導性開頭。保持簡潔直接的對話風格。

${languageInstruction}，保持自然流暢的對話風格。當面試結束時，請給予簡短的總結和感謝，然後加上 [INTERVIEW_END] 標記。`;
};

const getLanguageInstruction = (langCode: string): string => {
  const languageMap: { [key: string]: string } = {
    'zho': '請用繁體中文進行對話',
    'eng': 'Please respond in English',
    'jpn': '日本語で応答してください',
    'kor': '한국어로 응답해주세요',
    'fra': 'Veuillez répondre en français',
    'deu': 'Bitte antworten Sie auf Deutsch',
    'spa': 'Por favor responda en español',
    'ita': 'Si prega di rispondere in italiano',
    'por': 'Por favor responda em português',
    'rus': 'Пожалуйста, отвечайте на русском языке',
    'ara': 'يرجى الرد بالعربية',
    'tha': 'กรุณาตอบเป็นภาษาไทย',
    'vie': 'Vui lòng trả lời bằng tiếng Việt',
  };
  return languageMap[langCode] || '請用繁體中文進行對話';
};

export async function POST(request: NextRequest) {
  try {
    const { messages, language = 'zho' } = await request.json();

    if (!process.env.GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY 未設定' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const languageInstruction = getLanguageInstruction(language);
    const systemPrompt = getSystemPrompt(languageInstruction);

    const conversationMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: conversationMessages,
      model: 'openai/gpt-oss-120b',
      temperature: 1,
      max_completion_tokens: 8192,
      top_p: 1,
      stream: true,
      reasoning_effort: 'medium',
      stop: null,
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of chatCompletion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }
          controller.close();
        } catch (error: any) {
          console.error('Streaming 錯誤:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Groq API 錯誤:', error);
    return new Response(
      JSON.stringify({ error: error.message || '處理請求時發生錯誤' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
