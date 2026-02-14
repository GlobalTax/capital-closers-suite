import { useState, useCallback } from "react";

interface ConfirmState {
  open: boolean;
  title: string;
  description?: string;
  onConfirm: () => void;
}

const initialState: ConfirmState = {
  open: false,
  title: "",
  description: undefined,
  onConfirm: () => {},
};

export function useConfirmAction() {
  const [state, setState] = useState<ConfirmState>(initialState);

  const requestConfirm = useCallback(
    (title: string, onConfirm: () => void, description?: string) => {
      setState({ open: true, title, description, onConfirm });
    },
    []
  );

  const close = useCallback(() => {
    setState(initialState);
  }, []);

  const handleConfirm = useCallback(() => {
    state.onConfirm();
    close();
  }, [state.onConfirm, close]);

  return {
    confirmState: state,
    requestConfirm,
    closeConfirm: close,
    handleConfirm,
  };
}
