import { GoogleGenAI } from '@google/genai';
import { Item } from '../types/inventory';

const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const generateRestockSuggestion = async (lowStockItems: Item[]): Promise<string> => {
  if (!ai) {
    return 'Vui lòng cấu hình GEMINI_API_KEY trong file .env để sử dụng tính năng này.';
  }

  if (lowStockItems.length === 0) {
    return 'Không có vật tư nào sắp hết.';
  }

  const prompt = `Bạn là một chuyên gia quản lý kho vật tư xây dựng. Dưới đây là danh sách các vật tư đang sắp hết hoặc đã hết trong kho:

${lowStockItems.map(item => `- ${item.name} (Mã: ${item.code}, Đơn vị: ${item.unit}, Tồn kho hiện tại: ${item.initialStock}, Ngưỡng cảnh báo: ${item.warningThresholdLower})`).join('\n')}

Dựa trên kinh nghiệm của bạn, hãy đưa ra một đoạn phân tích ngắn gọn (khoảng 3-5 câu) về mức độ ưu tiên nhập hàng và gợi ý số lượng cần nhập thêm cho từng loại vật tư để đảm bảo tiến độ thi công không bị gián đoạn. Đừng dùng định dạng markdown phức tạp, chỉ cần văn bản thuần túy và xuống dòng hợp lý.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || 'Không thể tạo gợi ý lúc này.';
  } catch (error) {
    console.error('Error generating restock suggestion:', error);
    return 'Đã xảy ra lỗi khi gọi Gemini API.';
  }
};
