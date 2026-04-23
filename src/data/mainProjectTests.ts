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
  { id: 'f1', method: 'POST', endpoint: '/api/v1/cart/add', description: 'Add item to shopping cart', expected: '201 { cartId, items }', status: 'pass' },
  { id: 'f2', method: 'GET', endpoint: '/api/v1/inventory/search', description: 'Search items by SKU', expected: '200 Product[]', status: 'pass' },
  { id: 'f3', method: 'POST', endpoint: '/api/v1/payments/stripe/checkout', description: 'Initialize Stripe session', expected: '200 { sessionId, url }', status: 'pass' },
  { id: 'f4', method: 'GET', endpoint: '/api/v1/orders/history', description: 'Fetch user order history', expected: '200 Order[]', status: 'pass' },
];

export const edgeCaseTests: TestCase[] = [
  { id: 'e1', method: 'POST', endpoint: '/api/v1/cart/add', description: 'Add item with 0 quantity', expected: '400 { error: "Quantity must be > 0" }', status: 'edge' },
  { id: 'e2', method: 'POST', endpoint: '/api/v1/payments/stripe/webhook', description: 'Simulate Stripe signature mismatch', expected: '400 { error: "Invalid signature" }', status: 'edge' },
];

export const negativeTests: TestCase[] = [
  { id: 'n1', method: 'POST', endpoint: '/api/v1/payments/checkout', description: 'Checkout with expired token', expected: '401 { error: "Unauthorized" }', status: 'fail' },
  { id: 'n2', method: 'GET', endpoint: '/api/v1/inventory/12345', description: 'Fetch non-existent product ID', expected: '404 { error: "Product not found" }', status: 'fail' },
];

export const unitStubs: TestCase[] = [
  { id: 'u1', method: 'UNIT', endpoint: 'cartLogic.ts', description: 'calculateTax() handles multiple VAT zones', expected: 'Correct tax amount returned', status: 'pass' },
];

export const postmanCollection = {
  info: {
    name: "Blueprint.dev API - E-Commerce",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    description: "Complete API collection for Blueprint.dev — E-Commerce Replatforming"
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:3001/api" },
    { key: "accessToken", value: "" }
  ],
  item: [
    {
      name: "Products & Inventory",
      item: [
        {
          name: "Search Products",
          request: {
            method: "GET",
            url: "{{baseUrl}}/v1/inventory/search?q=laptop"
          }
        }
      ]
    },
    {
      name: "Cart & Checkout",
      item: [
        {
          name: "Add to Cart",
          request: {
            method: "POST",
            url: "{{baseUrl}}/v1/cart/add",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: { mode: "raw", raw: JSON.stringify({ productId: "p-101", quantity: 1 }, null, 2) }
          }
        }
      ]
    }
  ]
};
