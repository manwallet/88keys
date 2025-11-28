'use client';

import { useEffect } from 'react';

export default function ErrorSuppressor() {
  useEffect(() => {
    // 抑制浏览器扩展导致的错误
    const originalError = console.error;
    console.error = (...args) => {
      const message = args[0]?.toString() || '';
      // 过滤掉钱包扩展相关的错误
      if (
        message.includes('ethereum') ||
        message.includes('tronlink') ||
        message.includes('Cannot redefine property') ||
        message.includes('chrome-extension')
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    // 全局错误处理
    const handleError = (event: ErrorEvent) => {
      const message = event.message || '';
      if (
        message.includes('ethereum') ||
        message.includes('tronlink') ||
        message.includes('Cannot redefine property')
      ) {
        event.preventDefault();
        return true;
      }
    };

    window.addEventListener('error', handleError);

    return () => {
      console.error = originalError;
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null;
}
