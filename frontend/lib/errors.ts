/** Shape of the JSON body the backend returns with an error response. */
interface ApiErrorBody {
  message?: string;
  errors?: unknown;
}

/** An Axios-style error that carries the server response body. */
interface ApiError {
  response?: { data?: ApiErrorBody };
  message?: string;
}

/**
 * Extract a user-friendly error message and optional field errors
 * from an Axios/API error response.
 *
 * The backend answers with `{ success, message, errors[] }`, but Axios wraps
 * the payload in `error.response.data`. Reading the message from there means
 * the user sees "Invalid credentials." instead of
 * "Request failed with status code 401".
 *
 * @param error - The caught error object.
 * @returns The message to display and any field-level errors.
 */
export function extractError(error: ApiError) {
  const resp = error?.response?.data;
  if (resp && typeof resp === 'object') {
    const message = resp.message || error.message || 'An unexpected error occurred.';
    const errors = resp.errors || null;
    return { message, errors };
  }
  return { message: error?.message || 'An unexpected error occurred.', errors: null };
}

export default extractError;
