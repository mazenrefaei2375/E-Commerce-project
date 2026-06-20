import axios from 'axios';

const BASE_URL = process.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const TIMESTAMP = Date.now();
const PASSWORD = 'test12345';

const client = axios.create({ baseURL: BASE_URL });
let accessToken = null;
let wishlistItemId = null;

function authHeaders() {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

async function step(name, fn) {
  try {
    const result = await fn();
    console.log(`\u2705 ${name}`);
    return result;
  } catch (err) {
    const status = err.response?.status || 'N/A';
    const body = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    console.log(`\u274c ${name}`);
    console.log(`   Status: ${status}`);
    console.log(`   Response: ${body}`);
    process.exit(1);
  }
}

async function run() {
  console.log('=== Wishlist Flow Test ===');
  console.log(`API: ${BASE_URL}`);
  console.log(`User: wish_${TIMESTAMP}@test.com`);
  console.log('');

  const email = `wish_${TIMESTAMP}@test.com`;

  // Register + Login
  await step('Register', () => client.post('/auth/register/', {
    email, first_name: 'Wish', last_name: 'Tester', mobile: '01000000000',
    password: PASSWORD, confirm_password: PASSWORD,
  }));
  const loginRes = await step('Login', () => client.post('/auth/login/', { email, password: PASSWORD }));
  accessToken = loginRes.data.access;

  // Fetch products
  const prodRes = await step('Fetch products', () => client.get('/products/'));
  if (prodRes.data.length === 0) {
    console.log('\n\u26a0\ufe0f  No products found. Add a product in Django Admin first.\n');
    process.exit(0);
  }
  const productId = prodRes.data[0].id;

  // Add to wishlist
  await step('Add to wishlist', () => client.post('/wishlist/add/', { product_id: productId }, { headers: authHeaders() }));

  // Add duplicate (should return 200 with message)
  const dupRes = await step('Add duplicate (already in wishlist)', () => client.post('/wishlist/add/', { product_id: productId }, { headers: authHeaders() }));
  if (dupRes.status !== 200 || (!dupRes.data.message || !dupRes.data.message.toLowerCase().includes('already'))) {
    throw new Error('Expected "already in wishlist" message');
  }

  // List wishlist
  const listRes = await step('List wishlist', () => client.get('/wishlist/', { headers: authHeaders() }));
  if (listRes.data.length !== 1) throw new Error(`Expected 1 item, got ${listRes.data.length}`);
  wishlistItemId = listRes.data[0].id;

  // Remove from wishlist
  await step('Remove from wishlist', () => client.delete(`/wishlist/${wishlistItemId}/delete/`, { headers: authHeaders() }));

  // Verify empty
  const emptyRes = await step('Verify wishlist empty', () => client.get('/wishlist/', { headers: authHeaders() }));
  if (emptyRes.data.length !== 0) throw new Error('Wishlist not empty after removal');

  console.log('');
  console.log('=== All 8 wishlist steps passed ===');
}

run();
