export interface TranslationResponse {
    word: string;
    phonetic: string;
    definition_en: string;      // 英文释义
    definition_zh: string;      // 中文释义
    example_sentences: Array<{
        en: string;
        zh: string;
    }>;
}

export const SYSTEM_PROMPT = `You are LexiMind, an advanced language learning assistant specialized in helping users understand English words and phrases.

Your task is to provide clear, educational explanations for the given word or phrase.

Output Requirement:
You MUST return a raw valid JSON object (no markdown formatting, no code blocks) with the following structure:
{
  "word": "the word being looked up",
  "phonetic": "IPA phonetic transcription",
  "definition_en": "Clear and concise English definition",
  "definition_zh": "准确的中文释义",
  "example_sentences": [
    {"en": "Example sentence in English.", "zh": "例句的中文翻译。"},
    {"en": "Another example sentence.", "zh": "另一个例句的中文翻译。"}
  ]
}

Guidelines:
- For 'phonetic': Use standard IPA notation (e.g., /ˈeksəmpəl/)
- For 'definition_en': Keep it simple, clear, and suitable for learners
- For 'definition_zh': Provide accurate Chinese translation of the meaning
- For 'example_sentences': Generate 2 practical, easy-to-understand sentences with Chinese translations
`;

export interface APIConfig {
    apiKey: string;
    baseUrl: string;
    model: string;
}

export async function getAPIConfig(): Promise<APIConfig | null> {
    return new Promise((resolve) => {
        chrome.storage.local.get(['openaiApiKey', 'openaiModel', 'openaiBaseUrl'], (result: {
            openaiApiKey?: string;
            openaiModel?: string;
            openaiBaseUrl?: string;
        }) => {
            if (!result.openaiApiKey) {
                resolve(null);
                return;
            }

            let baseUrl = result.openaiBaseUrl?.trim() || 'https://api.openai.com/v1';
            if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
            if (!baseUrl.endsWith('/v1')) baseUrl += '/v1';

            resolve({
                apiKey: result.openaiApiKey,
                baseUrl: baseUrl,
                model: result.openaiModel || 'gpt-4o'
            });
        });
    });
}

export async function translateWord(word: string): Promise<TranslationResponse> {
    const config = await getAPIConfig();

    if (!config) {
        throw new Error('API not configured. Please set your API key in Settings.');
    }

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
            model: config.model,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `Please explain this word: "${word}"` }
            ],
            temperature: 0.7,
            max_tokens: 500
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`API request failed: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error('No response from API');
    }

    try {
        // 尝试解析 JSON 响应
        const parsed = JSON.parse(content);
        return {
            word: parsed.word || word,
            phonetic: parsed.phonetic || '',
            definition_en: parsed.definition_en || '',
            definition_zh: parsed.definition_zh || '',
            example_sentences: parsed.example_sentences || []
        };
    } catch {
        throw new Error('Failed to parse API response');
    }
}
