import React, { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './Help.module.scss';

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
  {
    id: 4,
    question: 'Ứng dụng có hỗ trợ Dark Mode không?',
    answer:
      'Hiện tại tính năng Dark Mode đang được phát triển và sẽ ra mắt trong phiên bản cập nhật tiếp theo.',
  },
];

const Help: React.FC = () => {
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState({ subject: '', message: '' });

  const toggleFaq = (id: number) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFeedback((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Feedback submitted:', feedback);
    alert('Cảm ơn đóng góp của bạn!');
    setFeedback({ subject: '', message: '' });
  };

  return (
    <div className={cx('help-container')}>
      <header className={cx('help-header')}>
        <h1 className={cx('title')}>Trung tâm trợ giúp</h1>
        <p className={cx('subtitle')}>Giải đáp thắc mắc và hỗ trợ kỹ thuật</p>
      </header>

      <div className={cx('content-grid')}>
        {/* Phần FAQ */}
        <section className={cx('faq-section')}>
          <h2 className={cx('section-title')}>Câu hỏi thường gặp</h2>
          <div className={cx('faq-list')}>
            {FAQ_DATA.map((item) => (
              <div
                key={item.id}
                className={cx('faq-item', { active: openFaqId === item.id })}
              >
                <div
                  className={cx('faq-question')}
                  onClick={() => toggleFaq(item.id)}
                >
                  <span>{item.question}</span>
                  <span className={cx('icon-arrow')}>
                    {openFaqId === item.id ? '−' : '+'}
                  </span>
                </div>
                <div className={cx('faq-answer')}>
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Phần Feedback */}
        <section className={cx('feedback-section')}>
          <h2 className={cx('section-title')}>Gửi phản hồi</h2>
          <form className={cx('feedback-form')} onSubmit={handleSubmit}>
            <div className={cx('form-group')}>
              <label htmlFor="subject">Tiêu đề</label>
              <input
                type="text"
                id="subject"
                name="subject"
                placeholder="Ví dụ: Lỗi hiển thị..."
                value={feedback.subject}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className={cx('form-group')}>
              <label htmlFor="message">Nội dung</label>
              <textarea
                id="message"
                name="message"
                rows={5}
                placeholder="Mô tả vấn đề..."
                value={feedback.message}
                onChange={handleInputChange}
                required
              ></textarea>
            </div>
            <button type="submit" className={cx('btn-submit')}>
              Gửi ngay
            </button>
          </form>

          <div className={cx('contact-info')}>
            <p>
              Email hỗ trợ:{' '}
              <a href="mailto:support@itask.com">support@itask.com</a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Help;
