type NoticeRequest = {
  kind: "notice";
  tone: "success" | "error";
  title: string;
  description?: string;
};

type InputRequest = {
  kind: "input";
  title: string;
  description: string;
  placeholder?: string;
  maxLength: number;
  confirmLabel: string;
  resolve: (value: string | null) => void;
};

export type FeedbackRequest = NoticeRequest | InputRequest;
export const FEEDBACK_EVENT = "mums:feedback";

function dispatch(request: FeedbackRequest) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<FeedbackRequest>(FEEDBACK_EVENT, { detail: request }));
  }
}

export const toast = {
  success(title: string, options?: { description?: string }) {
    dispatch({ kind: "notice", tone: "success", title, description: options?.description });
  },
  error(title: string, options?: { description?: string }) {
    dispatch({ kind: "notice", tone: "error", title, description: options?.description });
  },
};

export function requestText(options: {
  title: string;
  description: string;
  placeholder?: string;
  maxLength?: number;
  confirmLabel?: string;
}) {
  return new Promise<string | null>((resolve) => {
    dispatch({
      kind: "input",
      title: options.title,
      description: options.description,
      placeholder: options.placeholder,
      maxLength: options.maxLength ?? 500,
      confirmLabel: options.confirmLabel ?? "Enviar",
      resolve,
    });
  });
}
