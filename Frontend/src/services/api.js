import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { signedOut } from "../app/authSlice";
const raw = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || "/api",
  timeout: 20000,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});
export const api = createApi({
  reducerPath: "api",
  baseQuery: async (args, context, options) => {
    const token = context.getState().auth.token;
    const result = await raw(args, context, options);
    const url = typeof args === "string" ? args : args.url;
    if (
      result.error?.status === 401 &&
      token &&
      token === context.getState().auth.token &&
      !["/auth/login", "/auth/register"].includes(url)
    )
      context.dispatch(signedOut());
    return result;
  },
  tagTypes: ["Workspace"],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: (build) => ({
    read: build.query({ query: (path) => path, providesTags: ["Workspace"] }),
    write: build.mutation({
      query: ({ url, method = "POST", body }) => ({ url, method, body }),
      invalidatesTags: (result, error) => (error ? [] : ["Workspace"]),
    }),
  }),
});
export const { useReadQuery, useWriteMutation } = api;
export const query = (path, params = {}) =>
  `${path}?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null))}`;
export function errorMessage(error) {
  return (
    error?.data?.errors?.map((e) => `${e.field}: ${e.message}`).join(". ") ||
    error?.data?.message ||
    (error?.status === "FETCH_ERROR"
      ? "Cannot reach the server. Check your connection and try again."
      : error?.status === "TIMEOUT_ERROR"
        ? "The request timed out. Please try again."
        : "Something went wrong. Please try again.")
  );
}
