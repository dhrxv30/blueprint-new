export type TestStatus = 'pass' | 'fail' | 'edge';

export interface TestCase {
  id: string;
  method: string;
  endpoint: string;
  description: string;
  expected: string;
  status: TestStatus;
}

export const functionalTests: TestCase[] = [
  { id: 'f1', method: 'GET', endpoint: '/api/v1/restaurants', description: 'List nearby restaurants with active status', expected: '200 Restaurant[]', status: 'pass' },
  { id: 'f2', method: 'GET', endpoint: '/api/v1/restaurants/:id/menu', description: 'Fetch menu and categorization', expected: '200 Menu', status: 'pass' },
  { id: 'f3', method: 'POST', endpoint: '/api/v1/orders', description: 'Place a new delivery order', expected: '201 { orderId, status: "pending" }', status: 'pass' },
  { id: 'f4', method: 'GET', endpoint: '/api/v1/orders/:id/track', description: 'Get real-time delivery status', expected: '200 { status: "in_transit", eta: 12 }', status: 'pass' },
  { id: 'f5', method: 'POST', endpoint: '/api/v1/rider/status', description: 'Update rider GPS coordinates', expected: '200 { success: true }', status: 'pass' },
  { id: 'f6', method: 'POST', endpoint: '/api/v1/payments/verify', description: 'Verify digital wallet payment', expected: '200 { transactionId }', status: 'pass' },
  { id: 'f7', method: 'GET', endpoint: '/api/v1/promos/active', description: 'Fetch applicable discount codes', expected: '200 Coupon[]', status: 'pass' },
  { id: 'f8', method: 'POST', endpoint: '/api/v1/review/restaurant', description: 'Submit order feedback', expected: '201 { reviewId }', status: 'pass' },
  { id: 'f9', method: 'GET', endpoint: '/api/v1/user/favorites', description: 'Retrieve favorite restaurants and dishes', expected: '200 Favorite[]', status: 'pass' },
  { id: 'f10', method: 'POST', endpoint: '/api/v1/user/address', description: 'Add new delivery location', expected: '201 Address', status: 'pass' },
  { id: 'f11', method: 'GET', endpoint: '/api/v1/search/autocomplete', description: 'Suggest popular dishes and places', expected: '200 Suggesion[]', status: 'pass' },
  { id: 'f12', method: 'POST', endpoint: '/api/v1/cart/validate', description: 'Check availability and stock in real-time', expected: '200 { valid: true }', status: 'pass' },
];

export const edgeCaseTests: TestCase[] = [
  { id: 'e1', method: 'POST', endpoint: '/api/v1/orders', description: 'Order from restaurant that just closed', expected: '400 { error: "Restaurant is closed" }', status: 'edge' },
  { id: 'e2', method: 'POST', endpoint: '/api/v1/orders', description: 'Address outside delivery radius', expected: '200 { warning: "Long-distance surcharge" }', status: 'edge' },
  { id: 'e3', method: 'GET', endpoint: '/api/v1/restaurants/search', description: 'Search with emoji and special chars', expected: '200 Restaurant[]', status: 'edge' },
  { id: 'e4', method: 'POST', endpoint: '/api/v1/rider/status', description: 'Update status in area with 0 network', expected: '202 Accepted (queued offline)', status: 'edge' },
];

export const negativeTests: TestCase[] = [
  { id: 'n1', method: 'POST', endpoint: '/api/v1/orders', description: 'Order with insufficient wallet balance', expected: '402 { error: "Insufficient funds" }', status: 'fail' },
  { id: 'n2', method: 'DELETE', endpoint: '/api/v1/orders/:id', description: 'Cancel order already being prepared', expected: '403 { error: "Cancellation period expired" }', status: 'fail' },
  { id: 'n3', method: 'GET', endpoint: '/api/v1/admin/dashboard', description: 'Customer access to admin endpoints', expected: '403 { error: "Forbidden" }', status: 'fail' },
];

export const unitStubs: TestCase[] = [
  { id: 'u1', method: 'UNIT', endpoint: 'analysisService.ts', description: 'analyzeProject() returns typed AnalysisResult', expected: 'AnalysisResult with all fields populated', status: 'pass' },
  { id: 'u2', method: 'UNIT', endpoint: 'taskGenerator.ts', description: 'generateTasks() produces tasks for each user story', expected: 'Task[] with length >= stories.length', status: 'pass' },
  { id: 'u3', method: 'UNIT', endpoint: 'authService.ts', description: 'hashPassword() produces bcrypt hash', expected: 'String starting with $2b$', status: 'pass' },
  { id: 'u4', method: 'UNIT', endpoint: 'authService.ts', description: 'verifyToken() rejects expired JWT', expected: 'Throws TokenExpiredError', status: 'fail' },
  { id: 'u5', method: 'UNIT', endpoint: 'codeGenerator.ts', description: 'generateFiles() returns non-empty content for each file', expected: 'files[].content.length > 0', status: 'pass' },
  { id: 'u6', method: 'UNIT', endpoint: 'architectureGenerator.ts', description: 'generateDiagrams() returns valid Mermaid syntax', expected: 'String containing "graph" or "erDiagram"', status: 'pass' },
];

export const postmanCollection = {
  info: {
    name: "Blueprint.dev API",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    description: "Complete API collection for Blueprint.dev — Food Delivery Platform demo"
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:3001/api" },
    { key: "accessToken", value: "" }
  ],
  item: [
    {
      name: "Auth",
      item: [
        {
          name: "Signup",
          request: {
            method: "POST",
            url: "{{baseUrl}}/auth/signup",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: { mode: "raw", raw: JSON.stringify({ email: "dev@blueprint.dev", password: "s3cur3P@ss!" }, null, 2) }
          }
        },
        {
          name: "Login",
          request: {
            method: "POST",
            url: "{{baseUrl}}/auth/login",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: { mode: "raw", raw: JSON.stringify({ email: "dev@blueprint.dev", password: "s3cur3P@ss!" }, null, 2) }
          }
        },
        {
          name: "Refresh Token",
          request: { method: "POST", url: "{{baseUrl}}/auth/refresh" }
        },
        {
          name: "Get Current User",
          request: {
            method: "GET",
            url: "{{baseUrl}}/auth/me",
            header: [{ key: "Authorization", value: "Bearer {{accessToken}}" }]
          }
        },
        {
          name: "Logout",
          request: { method: "POST", url: "{{baseUrl}}/auth/logout" }
        }
      ]
    },
    {
      name: "Projects",
      item: [
        {
          name: "List Projects",
          request: {
            method: "GET",
            url: "{{baseUrl}}/projects",
            header: [{ key: "Authorization", value: "Bearer {{accessToken}}" }]
          }
        },
        {
          name: "Create Project",
          request: {
            method: "POST",
            url: "{{baseUrl}}/projects",
            header: [
              { key: "Authorization", value: "Bearer {{accessToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: { mode: "raw", raw: JSON.stringify({ name: "Food Delivery Platform", description: "A comprehensive food delivery application" }, null, 2) }
          }
        },
        {
          name: "Upload PRD",
          request: {
            method: "POST",
            url: "{{baseUrl}}/projects/upload",
            header: [{ key: "Authorization", value: "Bearer {{accessToken}}" }],
            body: { mode: "formdata", formdata: [{ key: "projectId", value: "{{projectId}}" }, { key: "file", type: "file", src: "" }] }
          }
        }
      ]
    },
    {
      name: "Analysis & Tasks",
      item: [
        {
          name: "Get Analysis",
          request: {
            method: "GET",
            url: "{{baseUrl}}/projects/{{projectId}}/analysis",
            header: [{ key: "Authorization", value: "Bearer {{accessToken}}" }]
          }
        },
        {
          name: "Get Tasks",
          request: {
            method: "GET",
            url: "{{baseUrl}}/projects/{{projectId}}/tasks",
            header: [{ key: "Authorization", value: "Bearer {{accessToken}}" }]
          }
        },
        {
          name: "Update Task",
          request: {
            method: "PATCH",
            url: "{{baseUrl}}/projects/{{projectId}}/tasks/{{taskId}}",
            header: [
              { key: "Authorization", value: "Bearer {{accessToken}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: { mode: "raw", raw: JSON.stringify({ status: "IN_PROGRESS", sprintId: "sprint-1" }, null, 2) }
          }
        }
      ]
    }
  ]
};
