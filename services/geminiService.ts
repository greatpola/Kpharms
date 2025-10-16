import { GoogleGenAI, Chat, GenerateContentResponse, Type, FunctionDeclaration, Content, GenerateContentParameters } from "@google/genai";
import type { ChatMessage } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const textModel = 'gemini-2.5-flash';

function chatHistoryToGeminiHistory(history: ChatMessage[]): Content[] {
    // Filter out any empty messages and the initial AI greeting
    const validHistory: ChatMessage[] = history.slice(1).filter(msg => msg.parts.every(part => part.text && part.text.trim() !== ''));
    
    return validHistory.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user', // Ensure correct role mapping
        parts: msg.parts.map(part => ({text: part.text})),
    }));
}

export const generateContent = async (prompt: string, config: Partial<GenerateContentParameters['config']> = {}, chatHistory: ChatMessage[] = []): Promise<string> => {
    try {
        const history = chatHistoryToGeminiHistory(chatHistory);
        const chat = ai.chats.create({
            model: textModel,
            history: history
        });
        const result = await chat.sendMessage({ message: prompt, config });

        return result.text;
    } catch (error) {
        console.error("Error generating content:", error);
        return "죄송합니다, AI 응답을 생성하는 중 오류가 발생했습니다.";
    }
};

export const generateContentWithGrounding = async (prompt: string, chatHistory: ChatMessage[] = []): Promise<GenerateContentResponse> => {
    try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        });
        return response;
    } catch (error) {
        console.error("Error generating content with grounding:", error);
        return {
          text: "죄송합니다, 실시간 검색 중 오류가 발생했습니다.",
          candidates: [],
          functionCalls: [],
        } as GenerateContentResponse;
    }
};

export const placeOrderFunctionDeclaration: FunctionDeclaration = {
    name: 'placeOrder',
    parameters: {
        type: Type.OBJECT,
        description: 'Place an order for low-stock pharmacy items from a supplier.',
        properties: {
            items: {
                type: Type.ARRAY,
                description: 'An array of items to reorder.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: {
                            type: Type.STRING,
                            description: 'The name of the item to order.'
                        },
                        quantityToOrder: {
                            type: Type.NUMBER,
                            description: 'The quantity of the item to order. Default is 50.'
                        }
                    },
                    required: ['name', 'quantityToOrder']
                }
            }
        },
        required: ['items'],
    },
};

export const createChatWithTools = () => {
    return ai.chats.create({
        model: textModel,
        config: {
            systemInstruction: 'You are Pico, a helpful and friendly AI assistant for pharmacists. Your primary goal is to assist with pharmacy management tasks.',
            tools: [{ functionDeclarations: [placeOrderFunctionDeclaration] }],
        },
    });
};