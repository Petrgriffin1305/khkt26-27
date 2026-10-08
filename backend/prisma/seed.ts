import { studyTopics } from "../src/adventure/topics.js";
import { extraQuizBank } from "./extraQuizBank.js";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
const db = new PrismaClient();
const topics = studyTopics;
const bank: Record<string, [string, string[], number, string][]> = {
  ...extraQuizBank,
  "computer-science": [
    [
      "Độ phức tạp của tìm kiếm nhị phân là gì?",
      ["O(n)", "O(log n)", "O(n²)", "O(1)"],
      1,
      "Mỗi bước giảm một nửa không gian tìm kiếm.",
    ],
    [
      "Cấu trúc nào hoạt động theo nguyên tắc LIFO?",
      ["Hàng đợi", "Mảng", "Ngăn xếp", "Cây"],
      2,
      "Phần tử vào cuối được lấy ra đầu tiên trong ngăn xếp.",
    ],
    [
      "Khóa chính trong cơ sở dữ liệu dùng để làm gì?",
      [
        "Mã hóa mật khẩu",
        "Định danh duy nhất mỗi bản ghi",
        "Sắp xếp dữ liệu",
        "Nén dữ liệu",
      ],
      1,
      "Khóa chính phải duy nhất và không rỗng.",
    ],
  ],
  biology: [
    [
      "Bào quan nào tạo ATP chủ yếu trong hô hấp tế bào?",
      ["Ribosome", "Ti thể", "Nhân", "Lysosome"],
      1,
      "Ti thể thực hiện hô hấp tế bào và tạo ATP.",
    ],
    [
      "DNA có chức năng chính nào?",
      [
        "Lưu trữ thông tin di truyền",
        "Tiêu hóa protein",
        "Vận chuyển oxy",
        "Tạo thành tế bào",
      ],
      0,
      "DNA chứa các chỉ dẫn di truyền của sinh vật.",
    ],
    [
      "Quang hợp hấp thụ khí nào?",
      ["Oxy", "Nitơ", "Carbon dioxide", "Hydrogen"],
      2,
      "Thực vật dùng CO₂ và nước để tạo đường nhờ năng lượng ánh sáng.",
    ],
  ],
  mathematics: [
    [
      "Đạo hàm của x² là gì?",
      ["x", "2x", "x³", "2"],
      1,
      "Quy tắc lũy thừa: đạo hàm xⁿ bằng n·xⁿ⁻¹.",
    ],
    [
      "Tổng các góc trong tam giác phẳng là bao nhiêu?",
      ["90°", "180°", "270°", "360°"],
      1,
      "Trong hình học Euclid, tổng ba góc là 180°.",
    ],
    [
      "Xác suất tung đồng xu cân đối ra mặt ngửa là bao nhiêu?",
      ["0", "1/4", "1/2", "1"],
      2,
      "Có hai kết quả đồng khả năng, nên xác suất là 1/2.",
    ],
  ],
};
try {
  for (const topic of topics) {
    await db.topic.upsert({
      where: { id: topic.id },
      create: topic,
      update: topic,
    });
    for (const [question, options, correct_index, explanation] of bank[
      topic.id
    ] ?? []) {
      if (
        !(await db.quizQuestion.findFirst({
          where: { topic_id: topic.id, question, source: "static" },
        }))
      )
        await db.quizQuestion.create({
          data: {
            id: randomUUID(),
            topic_id: topic.id,
            question,
            options,
            correct_index,
            explanation,
            difficulty: "medium",
          },
        });
    }
  }
} finally {
  await db.$disconnect();
}
