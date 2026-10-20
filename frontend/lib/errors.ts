/**
 * Extract a user-friendly error message and optional field errors
 * from an Axios/API error response.
 *
 * The backend answers with `{ success, message, errors[] }`, but Axios wraps
 * the payload in `error.response.data`. Reading the message from there means
 * the user sees "Invalid credentials." instead of
 * "Request failed with status code 401".
 *
 * @param {Error} error - The caught error object.
 * @returns {{ message: string, errors: object|null }}
 */
export function extractError(error: any) {
  const resp = error?.response?.data;
  if (resp && typeof resp === 'object') {
    const message = resp.message || error.message || 'An unexpected error occurred.';
    const errors = resp.errors || null;
    return { message, errors };
  }
  return { message: error?.message || 'An unexpected error occurred.', errors: null };
}

export default extractError;
