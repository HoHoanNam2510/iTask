/* src/hooks/useDebounce.ts */
import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Tạo bộ đếm giờ
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Hủy bộ đếm nếu value thay đổi trước khi hết giờ (người dùng gõ tiếp)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
