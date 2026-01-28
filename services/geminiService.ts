
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMarketingContent = async (topic: string, customerName?: string, discount?: string) => {
  try {
    const prompt = `
      You are an assistant for a Printing Press business in Bangladesh.
      Write a short, professional, and catchy SMS or social media post in Bengali for the following request: "${topic}".
      ${customerName ? `Address the customer as: ${customerName}.` : ''}
      ${discount ? `Mention a special discount: ${discount}.` : ''}
      Keep it polite and inviting. Do not include placeholders.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error generating content:", error);
    return "দুঃখিত, কন্টেন্ট তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।";
  }
};

export const generateCustomOffer = async (customerName: string, offerDetails: string) => {
  try {
    const prompt = `
      Create a personalized, friendly WhatsApp offer message in Bengali for a customer named "${customerName}" from a Printing Press called "Mudran Sahayogi".
      The offer details are: "${offerDetails}".
      The message should be professional yet warm, using emojis to make it look like a WhatsApp message. 
      Keep it concise and clear. Do not use placeholders like [Price] or [Date].
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error generating offer:", error);
    return "";
  }
};

export const analyzeBusinessData = async (dataSummary: string) => {
  try {
    const prompt = `
      You are a business analyst for a printing press.
      Here is the current business summary data:
      ${dataSummary}
      
      Please provide 3 specific, actionable tips in Bengali to improve profitability or efficiency based on general printing press business logic. Keep it concise.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error analyzing data:", error);
    return "তথ্য বিশ্লেষণ করতে সমস্যা হয়েছে।";
  }
};
