/* server/controllers/aiController.ts */
import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Khởi tạo Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const generateSubtasks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { taskTitle } = req.body;

    if (!taskTitle) {
      res
        .status(400)
        .json({ success: false, message: 'Task title is required' });
      return;
    }

    // 👇 [FIXED] Sử dụng model mới nhất: gemini-1.5-flash
    // Model này nhanh, rẻ (free tier tốt) và thông minh hơn bản cũ
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Prompt kỹ thuật
    const prompt = `
      Bạn là một trợ lý quản lý dự án chuyên nghiệp.
      Hãy tạo ra một danh sách checklist (subtasks) gồm 3 đến 5 bước cụ thể để hoàn thành công việc có tiêu đề: "${taskTitle}".
      Quy tắc:
      1. Chỉ trả về kết quả dưới dạng JSON Array thuần túy (ví dụ: ["Bước 1", "Bước 2"]).
      2. Không dùng markdown, không có dấu \`\`\`json.
      3. Ngôn ngữ: Tiếng Việt.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean data (đôi khi AI trả về dính dấu ```json hoặc khoảng trắng)
    const cleanText = text.replace(/```json|```/g, '').trim();

    let subtasks = [];
    try {
      subtasks = JSON.parse(cleanText);
    } catch (e) {
      console.warn('AI JSON Parse Warn:', e);
      // Fallback: Nếu AI không trả về đúng JSON, tách theo dòng
      subtasks = cleanText.split('\n').filter((line) => line.trim().length > 0);
    }

    // Map sang cấu trúc object của Subtask trong DB
    const formattedSubtasks = subtasks.map((title: string) => ({
      title: title.replace(/^- /, '').replace(/^\d+\.\s*/, ''), // Xóa dấu gạch đầu dòng hoặc số thứ tự
      isCompleted: false,
    }));

    res.json({ success: true, subtasks: formattedSubtasks });
  } catch (error: any) {
    // Log chi tiết lỗi ra console server để debug
    console.error('AI Generate Error Details:', error);

    // Trả về thông báo lỗi rõ ràng hơn cho client
    res.status(500).json({
      success: false,
      message: 'Failed to generate content',
      error: error.message,
    });
  }
};
