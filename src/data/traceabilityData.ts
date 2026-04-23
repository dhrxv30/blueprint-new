import { MarkerType } from '@xyflow/react';

export const markerEnd = {
  type: MarkerType.ArrowClosed,
  width: 20,
  height: 20,
  color: '#3f3f46',
};

export const initialTraceNodes = [
  {
    id: 'req-1',
    type: 'trace',
    position: { x: 0, y: 150 },
    data: {
      label: 'User Authentication & JWT',
      type: 'requirement',
      badge: 'PRD-101',
      description: 'System must support secure JWT-based authentication with refresh token rotation.',
    },
  },
  {
    id: 'req-2',
    type: 'trace',
    position: { x: 0, y: 350 },
    data: {
      label: 'Real-time Dashboards',
      type: 'requirement',
      badge: 'PRD-102',
      description: 'Users should see live updates of their data processing jobs without manual refresh.',
    },
  },
  {
    id: 'svc-1',
    type: 'trace',
    position: { x: 350, y: 100 },
    data: {
      label: 'Auth Service',
      type: 'service',
      badge: 'SVC-AUTH',
      description: 'Handles login, registration, and token validation.',
    },
  },
  {
    id: 'svc-2',
    type: 'trace',
    position: { x: 350, y: 400 },
    data: {
      label: 'Analytics Engine',
      type: 'service',
      badge: 'SVC-ANL',
      description: 'Processes large datasets and generates real-time metrics.',
    },
  },
  {
    id: 'api-1',
    type: 'trace',
    position: { x: 700, y: 50 },
    data: {
      label: 'POST /auth/login',
      type: 'api',
      badge: 'API-LGN',
      method: 'POST',
      endpoint: '/api/v1/auth/login',
      description: 'Authenticates user and returns access/refresh tokens.',
    },
  },
  {
    id: 'api-2',
    type: 'trace',
    position: { x: 700, y: 150 },
    data: {
      label: 'POST /auth/refresh',
      type: 'api',
      badge: 'API-RFR',
      method: 'POST',
      endpoint: '/api/v1/auth/refresh',
      description: 'Issues new access tokens using a valid refresh token.',
    },
  },
  {
    id: 'api-3',
    type: 'trace',
    position: { x: 700, y: 400 },
    data: {
      label: 'GET /stats/live',
      type: 'api',
      badge: 'API-STS',
      method: 'GET',
      endpoint: '/api/v1/analytics/live',
      description: 'Streams live data updates via Server-Sent Events.',
    },
  },
  {
    id: 'task-1',
    type: 'trace',
    position: { x: 1050, y: 50 },
    data: {
      label: 'Implement Argon2 hashing',
      type: 'task',
      badge: 'TASK-01',
      status: 'Done',
      description: 'Securely hash user passwords using Argon2id algorithm.',
    },
  },
  {
    id: 'task-2',
    type: 'trace',
    position: { x: 1050, y: 150 },
    data: {
      label: 'Redis Cluster Setup',
      type: 'task',
      badge: 'TASK-02',
      status: 'In Progress',
      description: 'Configure a high-availability Redis cluster for session storage.',
    },
  },
  {
    id: 'task-3',
    type: 'trace',
    position: { x: 1050, y: 400 },
    data: {
      label: 'Optimize SQL queries',
      type: 'task',
      badge: 'TASK-03',
      status: 'Done',
      description: 'Indexing and query optimization for high-volume analytics data.',
    },
  },
];

export const initialTraceEdges = [
  { id: 'e-req1-svc1', source: 'req-1', target: 'svc-1', markerEnd },
  { id: 'e-svc1-api1', source: 'svc-1', target: 'api-1', markerEnd },
  { id: 'e-svc1-api2', source: 'svc-1', target: 'api-2', markerEnd },
  { id: 'e-api1-task1', source: 'api-1', target: 'task-1', markerEnd },
  { id: 'e-api2-task2', source: 'api-2', target: 'task-2', markerEnd },
  
  { id: 'e-req2-svc2', source: 'req-2', target: 'svc-2', markerEnd },
  { id: 'e-svc2-api3', source: 'svc-2', target: 'api-3', markerEnd },
  { id: 'e-api3-task3', source: 'api-3', target: 'task-3', markerEnd },
];
