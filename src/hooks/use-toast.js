import { useState, useCallback } from "react";

// Toast 상태 관리를 위한 전역 상태
let toastState = {
  toasts: [],
  addToast: null,
  removeToast: null,
  updateToast: null,
};

// Toast 타입 정의
const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000000;

// Toast 생성 함수
const generateId = () => Math.random().toString(36).substr(2, 9);

const addToRemoveQueue = (toastId) => {
  if (toastState.toasts.find((toast) => toast.id === toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastState.toasts = toastState.toasts.filter((toast) => toast.id !== toastId);
    if (toastState.addToast) {
      toastState.addToast(toastState.toasts);
    }
  }, TOAST_REMOVE_DELAY);

  toastState.toasts = [
    ...toastState.toasts,
    { id: toastId, timeout }
  ];
};

// Toast 추가 함수
const addToast = (toast) => {
  const id = toast.id || generateId();
  const newToast = { ...toast, id };

  toastState.toasts = [
    ...toastState.toasts.filter((t) => t.id !== id),
    newToast,
  ].slice(0, TOAST_LIMIT);

  if (toastState.addToast) {
    toastState.addToast(toastState.toasts);
  }

  addToRemoveQueue(id);
  return id;
};

// Toast 제거 함수
const removeToast = (toastId) => {
  toastState.toasts = toastState.toasts.filter((toast) => toast.id !== toastId);
  if (toastState.addToast) {
    toastState.addToast(toastState.toasts);
  }
};

// Toast 업데이트 함수
const updateToast = (toastId, update) => {
  toastState.toasts = toastState.toasts.map((toast) =>
    toast.id === toastId ? { ...toast, ...update } : toast
  );
  if (toastState.addToast) {
    toastState.addToast(toastState.toasts);
  }
};

// useToast 훅
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToastCallback = useCallback((newToasts) => {
    setToasts(newToasts);
  }, []);

  // 전역 상태에 콜백 등록
  if (!toastState.addToast) {
    toastState.addToast = addToastCallback;
  }

  return {
    toasts,
    toast: addToast,
    dismiss: removeToast,
    update: updateToast,
  };
};

// toast 함수 (직접 사용 가능)
export const toast = addToast; 