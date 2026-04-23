export const demoProject = {
  id: 'demo-project-001',
  name: 'Food Delivery Platform',
  description: 'A comprehensive food delivery application with real-time order tracking, restaurant management, driver dispatch, and payment processing.',
  status: 'ready' as const,
  healthScore: 82,
  completeness: 71,
  complexity: 'Medium-High',
  createdAt: '2025-03-04T10:00:00Z',
  taskCount: 89,
  sprintCount: 4,
  features: [
    { id: 'feat-1', name: 'Authentication System', storyCount: 4, taskCount: 12, complexity: 'High' },
    { id: 'feat-2', name: 'Restaurant Management', storyCount: 5, taskCount: 18, complexity: 'High' },
    { id: 'feat-3', name: 'Order Workflow', storyCount: 4, taskCount: 16, complexity: 'Critical' },
    { id: 'feat-4', name: 'Payment Processing', storyCount: 3, taskCount: 14, complexity: 'High' },
    { id: 'feat-5', name: 'Driver Dispatch', storyCount: 4, taskCount: 15, complexity: 'High' },
    { id: 'feat-6', name: 'Notifications & Alerts', storyCount: 4, taskCount: 14, complexity: 'Medium' },
  ],
};

export const demoAnalysis = {
  scores: {
    health: 82,
    completeness: 71,
    complexity: 'Medium-High',
  },
  ambiguities: [
    { id: 'amb-1', feature: 'Authentication System', text: 'Password policy not specified — minimum length, special characters, and rotation requirements are undefined.', severity: 'high' },
    { id: 'amb-2', feature: 'Order Workflow', text: 'Order cancellation window is referenced but no specific time limit is defined.', severity: 'high' },
    { id: 'amb-3', feature: 'Payment Processing', text: 'Refund policy mentions "partial refunds" without specifying calculation method.', severity: 'medium' },
    { id: 'amb-4', feature: 'Driver Dispatch', text: 'Driver matching algorithm criteria not specified — distance, rating, or availability?', severity: 'high' },
    { id: 'amb-5', feature: 'Notifications & Alerts', text: 'Push notification frequency limits not defined — risk of notification fatigue.', severity: 'low' },
    { id: 'amb-6', feature: 'Restaurant Management', text: 'Menu item availability toggle scope unclear — per-location or global?', severity: 'medium' },
    { id: 'amb-7', feature: 'Order Workflow', text: 'Concurrent order limit per user is not specified.', severity: 'low' },
  ],
  missingRequirements: [
    { id: 'miss-1', feature: 'Authentication System', text: 'No mention of multi-factor authentication or 2FA requirements.' },
    { id: 'miss-2', feature: 'Payment Processing', text: 'No specification for handling failed payment retries or grace periods.' },
    { id: 'miss-3', feature: 'Driver Dispatch', text: 'No offline mode specification for drivers with poor connectivity.' },
  ],
};

export const demoChatMessages = [
  { id: 'msg-1', role: 'ai' as const, content: 'I\'ve analyzed your PRD for the Food Delivery Platform. I found 7 ambiguities and 3 missing requirements. Let\'s clarify them to improve your PRD health score.', timestamp: '2025-03-04T10:05:00Z' },
  { id: 'msg-2', role: 'ai' as const, content: 'First: your authentication section doesn\'t specify a password policy. What are your requirements?', options: ['8+ chars, 1 uppercase, 1 number', '12+ chars, mixed case, special char', 'SSO only, no passwords', 'Passkey / WebAuthn'], timestamp: '2025-03-04T10:05:10Z' },
  { id: 'msg-3', role: 'user' as const, content: '12+ chars, mixed case, special char', timestamp: '2025-03-04T10:06:00Z' },
  { id: 'msg-4', role: 'ai' as const, content: 'Noted. Password policy: minimum 12 characters, at least one uppercase, one lowercase, one digit, one special character. I\'ve updated the requirement.\n\nNext: the order cancellation window. Your PRD mentions customers can cancel, but doesn\'t specify a time limit after placing the order.', options: ['5 minutes', '10 minutes', '15 minutes', 'Until restaurant confirms'], timestamp: '2025-03-04T10:06:10Z' },
  { id: 'msg-5', role: 'user' as const, content: 'Until restaurant confirms', timestamp: '2025-03-04T10:07:00Z' },
  { id: 'msg-6', role: 'ai' as const, content: 'Good choice. Cancellation allowed until restaurant confirms the order. After confirmation, cancellation triggers a partial refund flow.\n\nSpeaking of refunds — your PRD mentions "partial refunds" but doesn\'t define the calculation. How should partial refunds work?', options: ['Percentage of order total', 'Full minus preparation cost', 'Store credit only', 'Custom per-restaurant policy'], timestamp: '2025-03-04T10:07:10Z' },
  { id: 'msg-7', role: 'user' as const, content: 'Full minus preparation cost', timestamp: '2025-03-04T10:08:00Z' },
  { id: 'msg-8', role: 'ai' as const, content: 'Understood. Partial refund = order total minus estimated preparation cost (set by restaurant per menu item). This will need a `preparationCost` field on the menu item model.\n\nNext: driver matching. Your PRD doesn\'t specify how drivers are assigned to orders. What criteria should the dispatch algorithm use?', options: ['Nearest available driver', 'Highest-rated driver', 'Round-robin assignment', 'Weighted: distance + rating'], timestamp: '2025-03-04T10:08:10Z' },
  { id: 'msg-9', role: 'user' as const, content: 'Weighted: distance + rating', timestamp: '2025-03-04T10:09:00Z' },
  { id: 'msg-10', role: 'ai' as const, content: 'Driver dispatch will use a weighted algorithm: 70% proximity, 30% driver rating. Drivers within a 5km radius of the restaurant will be considered.\n\nI also noticed there\'s no specification for multi-factor authentication. Should we add MFA?', options: ['Yes, optional for users', 'Yes, required for restaurant admins', 'No MFA needed', 'SMS OTP only'], timestamp: '2025-03-04T10:09:10Z' },
  { id: 'msg-11', role: 'user' as const, content: 'Yes, required for restaurant admins', timestamp: '2025-03-04T10:10:00Z' },
  { id: 'msg-12', role: 'ai' as const, content: 'MFA will be mandatory for restaurant admin accounts and optional for customers. I\'ll add TOTP (authenticator app) as the primary method with SMS as fallback.\n\nLast question: should drivers have an offline mode for areas with poor connectivity?', options: ['Yes, queue actions offline', 'No, require constant connection', 'Cache last 3 orders only'], timestamp: '2025-03-04T10:10:10Z' },
  { id: 'msg-13', role: 'user' as const, content: 'Yes, queue actions offline', timestamp: '2025-03-04T10:11:00Z' },
  { id: 'msg-14', role: 'ai' as const, content: 'Driver app will support offline mode: status updates and delivery confirmations are queued locally and synced when connectivity is restored. Location tracking will use last-known position.\n\nAll 7 ambiguities resolved and 3 missing requirements addressed. Your PRD health score has improved from 82 to 94. Ready to generate tasks and architecture.', timestamp: '2025-03-04T10:11:10Z' },
  { id: 'msg-15', role: 'ai' as const, content: 'Summary of changes made:\n\n```\n+ Password policy: 12+ chars, mixed case, special char\n+ Cancellation: allowed until restaurant confirms\n+ Refund: full minus preparation cost\n+ Dispatch: weighted 70% distance, 30% rating\n+ MFA: required for restaurant admins\n+ Offline mode: queue driver actions\n```\n\nShall I proceed with task generation?', timestamp: '2025-03-04T10:11:20Z' },
];
