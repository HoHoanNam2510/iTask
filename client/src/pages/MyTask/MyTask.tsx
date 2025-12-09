import React, { useState, useRef } from 'react';
import classNames from 'classnames/bind';
import {
  Calendar,
  MoreHorizontal,
  Maximize2,
  Minimize2,
  X,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon, // Thêm icon ảnh để hiển thị placeholder đẹp hơn
  Upload, // Thêm icon upload
} from 'lucide-react';
import styles from './MyTask.module.scss';

const cx = classNames.bind(styles);

// --- Types & Mock Data ---
interface Task {
  id: string;
  title: string;
  descShort: string;
  priority: 'Extreme' | 'Moderate' | 'Low';
  status: 'Not Started' | 'In Progress' | 'Completed';
  createdDate: string;
  objective?: string;
  descriptionFull?: string;
  notes?: string[];
  deadline?: string;
  image?: string; // <--- Thêm trường này để lưu URL ảnh
}

// Đổi tên thành initialTasks để làm giá trị khởi tạo cho state
const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Submit Documents',
    descShort: 'Make sure to submit all the necessary documents...',
    priority: 'Extreme',
    status: 'Not Started',
    createdDate: '20/06/2025',
    objective: 'To submit required documents for something important.',
    descriptionFull:
      'Review the list of documents required for submission and ensure all necessary documents are ready. Organize the documents accordingly and scan them if physical copies need to be submitted digitally.',
    notes: [
      'Ensure that the documents are authentic and up-to-date.',
      'Maintain confidentiality during submission.',
      'Check specific guidelines for deadlines.',
    ],
    deadline: 'End of Day',
    // image: '...' // Có thể có ảnh mặc định nếu muốn
  },
  {
    id: '2',
    title: 'Complete Assignments',
    descShort: 'The assignments must be completed to pass final year...',
    priority: 'Moderate',
    status: 'In Progress',
    createdDate: '21/06/2025',
    objective: 'Complete all module assignments.',
    descriptionFull:
      'Finish the coding assignment for React module and write report for Database design.',
    notes: ['Double check grammar in report.'],
    deadline: 'Next Monday',
  },
  {
    id: '3',
    title: 'Team Meeting Preparation',
    descShort: 'Prepare slides for the upcoming weekly sync...',
    priority: 'Low',
    status: 'Not Started',
    createdDate: '22/06/2025',
    objective: 'Prepare slide deck.',
    descriptionFull:
      'Gather metrics from last week and put them into the slide template.',
    deadline: 'Wednesday',
  },
];

const MyTask = () => {
  // Chuyển danh sách task thành State để có thể cập nhật ảnh
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Ref để truy cập input file ẩn
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  // --- Handlers ---
  const handleSelectTask = (id: string) => {
    if (selectedTaskId === id) {
      handleCloseDetail();
    } else {
      setSelectedTaskId(id);
      setIsFullScreen(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedTaskId(null);
    setIsFullScreen(false);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // 1. Hàm kích hoạt click vào input file ẩn
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  // 2. Hàm xử lý khi người dùng chọn file
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedTaskId) {
      // Tạo URL tạm thời cho ảnh vừa upload
      const imageUrl = URL.createObjectURL(file);

      // Cập nhật state tasks
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === selectedTaskId ? { ...t, image: imageUrl } : t
        )
      );
    }
  };

  return (
    <div className={cx('wrapper')}>
      {/* --- HEADER --- */}
      {!isFullScreen && (
        <header className={cx('header')}>
          <h1 className={cx('title')}>My Tasks</h1>
          <p className={cx('subtitle')}>Quản lý chi tiết công việc của bạn</p>
        </header>
      )}

      <div className={cx('container')}>
        {/* --- LEFT COLUMN: TASK LIST --- */}
        {!isFullScreen && (
          <div className={cx('listPanel', { shrunk: !!selectedTaskId })}>
            <div className={cx('panelHeader')}>
              <h3>Danh sách công việc</h3>
            </div>

            <div className={cx('listContent')}>
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={cx('taskCard', {
                    active: selectedTaskId === task.id,
                  })}
                  onClick={() => handleSelectTask(task.id)}
                >
                  <div className={cx('cardHeader')}>
                    <div
                      className={cx(
                        'statusIcon',
                        task.status === 'Not Started'
                          ? 'notStarted'
                          : 'inProgress'
                      )}
                    >
                      {task.status === 'Not Started' ? (
                        <AlertCircle size={16} />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                    </div>
                    <MoreHorizontal size={16} className={cx('moreIcon')} />
                  </div>

                  <h4 className={cx('taskTitle')}>{task.title}</h4>
                  <p className={cx('taskDesc')}>{task.descShort}</p>

                  <div className={cx('cardFooter')}>
                    <div className={cx('meta')}>
                      <span className={cx('label')}>Priority:</span>
                      <span
                        className={cx('value', task.priority.toLowerCase())}
                      >
                        {task.priority}
                      </span>
                    </div>
                    <div className={cx('meta')}>
                      <span className={cx('label')}>Status:</span>
                      <span
                        className={cx(
                          'value',
                          task.status === 'Not Started' ? 'pending' : 'process'
                        )}
                      >
                        {task.status}
                      </span>
                    </div>
                    <div className={cx('date')}>
                      Created on: {task.createdDate}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- RIGHT COLUMN: TASK DETAIL --- */}
        {selectedTask ? (
          <div className={cx('detailPanel', { fullWidth: isFullScreen })}>
            <div className={cx('detailToolbar')}>
              <button
                className={cx('toolBtn')}
                onClick={toggleFullScreen}
                title={
                  isFullScreen
                    ? 'Thu nhỏ (Hiện danh sách)'
                    : 'Mở rộng (Ẩn danh sách)'
                }
              >
                {isFullScreen ? (
                  <Minimize2 size={20} />
                ) : (
                  <Maximize2 size={20} />
                )}
              </button>
              <button
                className={cx('toolBtn', 'close')}
                onClick={handleCloseDetail}
                title="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            <div className={cx('detailContent')}>
              {/* --- PHẦN UPLOAD ẢNH ĐÃ ĐƯỢC CẬP NHẬT --- */}
              <div
                className={cx('coverImage')}
                onClick={handleImageClick}
                style={{ cursor: 'pointer', position: 'relative' }} // Thêm cursor pointer để người dùng biết click được
                title="Bấm để thay đổi ảnh bìa"
              >
                {/* Input File Ẩn */}
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleFileChange}
                />

                {selectedTask.image ? (
                  // Hiển thị ảnh nếu đã có
                  <img
                    src={selectedTask.image}
                    alt="Task Context"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  // Placeholder nếu chưa có ảnh
                  <div className={cx('placeholderImg')}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Upload size={24} />
                      <span>Click to Upload Task Image</span>
                    </div>
                  </div>
                )}
              </div>

              <div className={cx('mainInfo')}>
                <h2 className={cx('bigTitle')}>{selectedTask.title}</h2>

                <div className={cx('tagsRow')}>
                  <span
                    className={cx('tag', selectedTask.priority.toLowerCase())}
                  >
                    Priority: {selectedTask.priority}
                  </span>
                  <span className={cx('tag', 'status')}>
                    Status: {selectedTask.status}
                  </span>
                  <span className={cx('dateInfo')}>
                    <Calendar size={14} /> {selectedTask.createdDate}
                  </span>
                </div>

                <div className={cx('section')}>
                  <h3>
                    Task Title:{' '}
                    <span className={cx('normalText')}>
                      {selectedTask.title}
                    </span>
                  </h3>
                </div>

                <div className={cx('section')}>
                  <h3>Objective:</h3>
                  <p>{selectedTask.objective}</p>
                </div>

                <div className={cx('section')}>
                  <h3>Task Description:</h3>
                  <p className={cx('justified')}>
                    {selectedTask.descriptionFull}
                  </p>
                </div>

                {selectedTask.notes && (
                  <div className={cx('section')}>
                    <h3>Additional Notes:</h3>
                    <ul className={cx('notesList')}>
                      {selectedTask.notes.map((note, idx) => (
                        <li key={idx}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedTask.deadline && (
                  <div className={cx('section', 'deadline')}>
                    <strong>Deadline for Submission:</strong>{' '}
                    {selectedTask.deadline}
                  </div>
                )}
              </div>
            </div>

            <div className={cx('detailFooter')}>
              <button className={cx('footerBtn', 'delete')}>Delete Task</button>
              <button className={cx('footerBtn', 'edit')}>Edit Task</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MyTask;
