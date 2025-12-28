import { useState, useCallback, useRef, useEffect } from 'react';
import { message } from 'antd';

export const useRequest = (requestFn, options = {}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(options.initialData || null);
  const [error, setError] = useState(null);
  
  // 使用 useRef 来保存 requestFn 和 options，避免频繁更新
  const requestFnRef = useRef(requestFn);
  const optionsRef = useRef(options);

  // 在 effect 中更新最新的引用
  useEffect(() => {
    requestFnRef.current = requestFn;
    optionsRef.current = options;
  });

  const run = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await requestFnRef.current(...args);
      setData(result);
      optionsRef.current.onSuccess?.(result);
      return result;
    } catch (err) {
      setError(err);
      optionsRef.current.onError?.(err);
      message.error(err.message || '请求失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // 移除所有依赖，因为我们使用了 ref

  return {
    loading,
    data,
    error,
    run
  };
}; 