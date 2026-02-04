/* client/src/pages/Help/Help.tsx */
import React, { useState } from 'react';
import classNames from 'classnames/bind';
import { ChevronDown, MessageSquare, HelpCircle } from 'lucide-react';
import styles from './Help.module.scss';
import httpRequest from '~/utils/httpRequest';

const cx = classNames.bind(styles);

interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 1,
    question: 'Làm thế nào để tạo một Task mới?',
    answer:
      "Bạn có thể nhấp vào nút 'My Task' ở thanh bên trái, sau đó chọn biểu tượng dấu cộng (+) hoặc nút 'Create Task' ở góc trên bên phải màn hình.",
  },
  {
    id: 2,
    question: 'Tôi có thể đổi mật khẩu ở đâu?',
    answer:
      "Vui lòng truy cập vào mục 'Settings' ở thanh menu bên trái, sau đó chọn tab 'Security' để thay đổi mật khẩu.",
  },
  {
    id: 3,
    question: 'Làm sao để mời thành viên vào nhóm?',
    answer:
      "Trong trang chi tiết nhóm (Group), chọn nút 'Invite Member' và nhập địa chỉ email của người bạn muốn mời.",
  },
  // 👇 [UPDATED] Đổi nội dung hướng dẫn khôi phục Task
  {
    id: 4,
    question: 'Làm sao có thể khôi phục task vô tình xóa?',
    answer:
      "Bạn có thể truy cập vào mục 'Trash' (Thùng rác) ở thanh menu bên trái. Tại đây, tìm task bạn muốn khôi phục và nhấn nút 'Restore' để đưa nó trở lại danh sách làm việc.",
  },
];

const Help: React.FC = () => {
  const [openFaqId, setOpenFaqId] = useState<number | null>(1);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({
    subject: '',
    message: '',
    type: 'other',
  });

  const toggleFaq = (id: number) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFeedback((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await httpRequest.post('/api/feedbacks', feedback, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Cảm ơn đóng góp của bạn! Chúng tôi sẽ xem xét sớm nhất.');
      setFeedback({ subject: '', message: '', type: 'other' });
    } catch (error) {
      alert('Gửi thất bại, vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cx('help-container')}>
      <header className={cx('help-header')}>
        <h1 className={cx('title')}>Trung tâm trợ giúp</h1>
        <p className={cx('subtitle')}>
          Chúng tôi có thể giúp gì cho bạn hôm nay?
        </p>
      </header>

      <div className={cx('content-grid')}>
        {/* Phần FAQ */}
        <section className={cx('faq-section')}>
          <h2 className={cx('section-title')}>
            <HelpCircle size={24} /> Câu hỏi thường gặp
          </h2>
          <div className={cx('faq-list')}>
            {FAQ_DATA.map((item) => (
              <div
                key={item.id}
                className={cx('faq-item', { active: openFaqId === item.id })}
                onClick={() => toggleFaq(item.id)}
              >
                <div className={cx('faq-question')}>
                  <span>{item.question}</span>
                  <ChevronDown className={cx('icon-arrow')} size={20} />
                </div>
                <div className={cx('faq-answer')}>
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Phần Feedback Form */}
        <section className={cx('feedback-section')}>
          <div className={cx('feedback-card')}>
            <h2>
              <MessageSquare
                size={24}
                style={{ marginBottom: -4, marginRight: 8 }}
              />{' '}
              Gửi phản hồi
            </h2>
            <p>Báo lỗi hoặc đề xuất tính năng mới để giúp iTask tốt hơn.</p>

            <form onSubmit={handleSubmit}>
              <div className={cx('form-group')}>
                <label>Loại phản hồi</label>
                <select
                  name="type"
                  value={feedback.type}
                  onChange={handleInputChange}
                >
                  <option value="other">💡 Góp ý chung</option>
                  <option value="bug">🐛 Báo lỗi (Bug)</option>
                  <option value="feature">🚀 Đề xuất tính năng</option>
                </select>
              </div>

              <div className={cx('form-group')}>
                <label>Tiêu đề</label>
                <input
                  type="text"
                  name="subject"
                  placeholder="Tóm tắt vấn đề..."
                  value={feedback.subject}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={cx('form-group')}>
                <label>Nội dung chi tiết</label>
                <textarea
                  name="message"
                  rows={5}
                  placeholder="Mô tả chi tiết vấn đề của bạn..."
                  value={feedback.message}
                  onChange={handleInputChange}
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className={cx('btn-submit')}
                disabled={loading}
              >
                {loading ? 'Đang gửi...' : 'Gửi phản hồi'}
              </button>
            </form>

            <div className={cx('support-link')}>
              Email hỗ trợ trực tiếp:{' '}
              <a href="mailto:support@itask.com">support@itask.com</a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Help;
