/* src/context/ThemeContext.tsx */
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  color: string;
  changeTheme: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Danh sách màu (Bạn có thể thêm tùy ý)
export const THEMES = [
  { name: 'Green (Default)', value: '#40a578' }, // Màu gốc trong GlobalStyles
  { name: 'Ocean Blue', value: '#3b82f6' },
  { name: 'Purple Dream', value: '#8b5cf6' },
  { name: 'Sunset Orange', value: '#f97316' },
  { name: 'Rose Red', value: '#e11d48' },
  { name: 'Midnight', value: '#0f172a' },
];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [color, setColor] = useState('#40a578'); // Mặc định là màu xanh của bạn

  useEffect(() => {
    // Load theme đã lưu, nếu không có thì dùng màu mặc định
    const savedColor = localStorage.getItem('app_theme') || '#40a578';
    applyTheme(savedColor);
  }, []);

  const applyTheme = (colorHex: string) => {
    // 👇 [MỚI] Validate mã màu Hex trước khi áp dụng để tránh lỗi tính toán
    const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(colorHex);
    if (!isValidHex) return;

    const root = document.documentElement;

    // 1. Set màu chủ đạo
    root.style.setProperty('--primary', colorHex);

    // 2. Tính toán --primary-rgb (để dùng cho rgba trong CSS)
    const rgb = hexToRgb(colorHex);
    root.style.setProperty('--primary-rgb', rgb);

    // 3. Tính toán --primary-dark (Đậm hơn 20% cho hover)
    root.style.setProperty('--primary-dark', adjustBrightness(colorHex, -20));

    // 4. Tính toán --primary-light (Sáng hơn 20% cho gradient)
    root.style.setProperty('--primary-light', adjustBrightness(colorHex, 20));

    // 5. Tính toán --primary-bg (Siêu nhạt cho nền active)
    // Logic: Pha màu gốc với màu trắng (90% trắng)
    root.style.setProperty('--primary-bg', mixWithWhite(colorHex, 0.92));

    setColor(colorHex);
    localStorage.setItem('app_theme', colorHex);
  };

  const changeTheme = (newColor: string) => {
    applyTheme(newColor);
  };

  return (
    <ThemeContext.Provider value={{ color, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

// --- CÁC HÀM XỬ LÝ MÀU (HELPERS) ---

// Chuyển Hex sang RGB (VD: #40a578 -> "64, 165, 120")
function hexToRgb(hex: string) {
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 4) {
    r = parseInt('0x' + hex[1] + hex[1]);
    g = parseInt('0x' + hex[2] + hex[2]);
    b = parseInt('0x' + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt('0x' + hex[1] + hex[2]);
    g = parseInt('0x' + hex[3] + hex[4]);
    b = parseInt('0x' + hex[5] + hex[6]);
  }
  return `${r}, ${g}, ${b}`;
}

// Tăng/Giảm độ sáng (amount âm là tối đi, dương là sáng lên)
function adjustBrightness(col: string, amt: number) {
  let usePound = false;
  if (col[0] === '#') {
    col = col.slice(1);
    usePound = true;
  }
  let num = parseInt(col, 16);
  let r = (num >> 16) + amt;
  if (r > 255) r = 255;
  else if (r < 0) r = 0;
  let b = ((num >> 8) & 0x00ff) + amt;
  if (b > 255) b = 255;
  else if (b < 0) b = 0;
  let g = (num & 0x0000ff) + amt;
  if (g > 255) g = 255;
  else if (g < 0) g = 0;
  return (
    (usePound ? '#' : '') +
    (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0')
  );
}

// Pha màu với màu trắng (tạo màu background nhạt)
function mixWithWhite(hex: string, ratio: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const newR = Math.round(r + (255 - r) * ratio);
  const newG = Math.round(g + (255 - g) * ratio);
  const newB = Math.round(b + (255 - b) * ratio);

  return `rgb(${newR}, ${newG}, ${newB})`;
}
