import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Projects', 'Users', 'Stages', 'Commits', 'Notifications', 'AcademicYears', 'Stats'],
  endpoints: (builder) => ({
    // Auth
    login: builder.mutation({
      query: (credentials) => ({ url: '/auth/login', method: 'POST', body: credentials }),
    }),
    getMe: builder.query({
      query: () => '/auth/me',
    }),

    // Users
    getUsers: builder.query({
      query: (params) => ({ url: '/users', params }),
      providesTags: ['Users'],
    }),
    getSupervisors: builder.query({
      query: () => '/users/supervisors',
      providesTags: ['Users'],
    }),
    getStudents: builder.query({
      query: () => '/users/students',
      providesTags: ['Users'],
    }),
    createUser: builder.mutation({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: ['Users'],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Users'],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Users'],
    }),

    // Academic Years
    getAcademicYears: builder.query({
      query: () => '/academic-years',
      providesTags: ['AcademicYears'],
    }),
    createAcademicYear: builder.mutation({
      query: (body) => ({ url: '/academic-years', method: 'POST', body }),
      invalidatesTags: ['AcademicYears'],
    }),
    updateAcademicYear: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/academic-years/${id}`, method: 'PUT', body }),
      invalidatesTags: ['AcademicYears'],
    }),
    deleteAcademicYear: builder.mutation({
      query: (id) => ({ url: `/academic-years/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AcademicYears'],
    }),

    // Projects
    getProjects: builder.query({
      query: (params) => ({ url: '/projects', params }),
      providesTags: ['Projects'],
    }),
    getProjectById: builder.query({
      query: (id) => `/projects/${id}`,
      providesTags: (result, error, id) => [{ type: 'Projects', id }],
    }),
    getProjectStats: builder.query({
      query: () => '/projects/stats',
      providesTags: ['Stats'],
    }),
    createProject: builder.mutation({
      query: (body) => ({ url: '/projects', method: 'POST', body }),
      invalidatesTags: ['Projects', 'Stats'],
    }),
    updateProject: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/projects/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Projects', 'Stats'],
    }),
    deleteProject: builder.mutation({
      query: (id) => ({ url: `/projects/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Projects', 'Stats'],
    }),

    // Stages
    getStagesByProject: builder.query({
      query: (projectId) => `/projects/${projectId}/stages`,
      providesTags: ['Stages'],
    }),
    createStage: builder.mutation({
      query: ({ projectId, ...body }) => ({ url: `/projects/${projectId}/stages`, method: 'POST', body }),
      invalidatesTags: ['Stages', 'Projects'],
    }),
    updateStage: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/stages/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Stages', 'Projects'],
    }),
    deleteStage: builder.mutation({
      query: (id) => ({ url: `/stages/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Stages', 'Projects'],
    }),

    // Git
    syncGitCommits: builder.mutation({
      query: (projectId) => ({ url: `/projects/${projectId}/git/sync`, method: 'POST' }),
      invalidatesTags: ['Commits'],
    }),
    getGitCommits: builder.query({
      query: ({ projectId, ...params }) => ({ url: `/projects/${projectId}/git/commits`, params }),
      providesTags: ['Commits'],
    }),
    getGitStats: builder.query({
      query: (projectId) => `/projects/${projectId}/git/stats`,
      providesTags: ['Commits'],
    }),

    // Notifications
    getNotifications: builder.query({
      query: () => '/notifications',
      providesTags: ['Notifications'],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PUT' }),
      invalidatesTags: ['Notifications'],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({ url: '/notifications/read-all', method: 'PUT' }),
      invalidatesTags: ['Notifications'],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetMeQuery,
  useGetUsersQuery,
  useGetSupervisorsQuery,
  useGetStudentsQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetAcademicYearsQuery,
  useCreateAcademicYearMutation,
  useUpdateAcademicYearMutation,
  useDeleteAcademicYearMutation,
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useGetProjectStatsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetStagesByProjectQuery,
  useCreateStageMutation,
  useUpdateStageMutation,
  useDeleteStageMutation,
  useSyncGitCommitsMutation,
  useGetGitCommitsQuery,
  useGetGitStatsQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = apiSlice;
