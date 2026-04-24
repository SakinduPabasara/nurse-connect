import { toast } from "react-hot-toast";

const baseOptions = {
  duration: 3200,
  position: "top-right",
};

export const notify = {
  success: (message, options = {}) =>
    toast.success(message, { ...baseOptions, ...options }),
  error: (message, options = {}) =>
    toast.error(message, { ...baseOptions, ...options }),
  info: (message, options = {}) =>
    toast(message, { ...baseOptions, ...options }),
};
