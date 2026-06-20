import axios from 'axios';

const BASE_URL = process.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const TIMESTAMP = Date.now();
const PASSWORD = 'test12345';

const client = axios.create({ baseURL: BASE_URL });
let accessToken = null;
let orderId = null;

function authHeaders() {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

async function step(name, fn) {
  try {
    const result = await fn();
    console.log(`✅ ${name}`);
    return result;
  } catch (err) {
    const status = err.response?.status || 'N/A';
    const body = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    console.log(`❌ ${name}`);
    console.log(`   Status: ${status}`);
    console.log(`   Response: ${body}`);
    process.exit(1);
  }
}

async function run() {
  console.log('=== AMIT Full Customer Flow Test ===');
  console.log(`API Base: ${BASE_URL}`);
  console.log(`User: customer_${TIMESTAMP}@test.com`);
  console.log('');

  const email = `customer_${TIMESTAMP}@test.com`;

  // Step 1: Register
  await step('Register', async () => {
    const res = await client.post('/auth/register/', {
      email,
      first_name: 'Test',
      last_name: 'Customer',
      mobile: '01000000000',
      password: PASSWORD,
      confirm_password: PASSWORD,
    });
    if (res.status !== 201) throw new Error('Register failed');
  });

  // Step 2: Login
  await step('Login', async () => {
    const res = await client.post('/auth/login/', { email, password: PASSWORD });
    if (!res.data.access) throw new Error('No access token');
    accessToken = res.data.access;
  });

  // Step 3: Fetch products
  let products = [];
  await step('Products fetched', async () => {
    const res = await client.get('/products/');
    products = res.data;
    if (products.length === 0) {
      console.log('\n⚠️  No products found.');
      console.log('   Please add at least one in-stock product from Django Admin:');
      console.log('   http://127.0.0.1:8000/admin/products/product/add/\n');
      process.exit(0);
    }
  });

  const product = products[0];

  // Step 4: Fetch product detail
  await step('Product detail', async () => {
    const res = await client.get(`/products/${product.slug}/`);
    if (res.data.stock < 1) throw new Error('Product is out of stock');
  });

  // Step 5: Add product to cart
  await step('Add to cart', async () => {
    const res = await client.post('/cart/', {
      product_id: product.id,
      quantity: 1,
    }, { headers: authHeaders() });
    if (res.data.item_count < 1) throw new Error('Cart empty after add');
  });

  // Step 6: Fetch cart & verify
  await step('Cart total', async () => {
    const res = await client.get('/cart/', { headers: authHeaders() });
    if (res.data.item_count !== 1) throw new Error(`Expected 1 item, got ${res.data.item_count}`);
    if (parseFloat(res.data.total) <= 0) throw new Error('Cart total is 0 or negative');
    if (parseFloat(res.data.total) !== parseFloat(product.price))
      throw new Error(`Total ${res.data.total} != price ${product.price}`);
  });

  // Step 7: Checkout
  await step('Checkout', async () => {
    const res = await client.post('/checkout/', {
      full_name: 'Test Customer',
      phone: '01000000000',
      address: '123 Test Street',
      city: 'Cairo',
      country: 'Egypt',
      payment_method: 'cash',
    }, { headers: authHeaders() });
    if (res.status !== 201) throw new Error('Checkout not created');
    if (!res.data.id) throw new Error('No order id in response');
    const expectedTotal = parseFloat(product.price) + 20;
    if (parseFloat(res.data.total) !== expectedTotal)
      throw new Error(`Order total ${res.data.total} != ${expectedTotal}`);
    orderId = res.data.id;
  });

  // Step 8: Verify cart empty
  await step('Cart cleared', async () => {
    const res = await client.get('/cart/', { headers: authHeaders() });
    if (res.data.item_count !== 0) throw new Error('Cart not empty after checkout');
  });

  // Step 9: Verify orders
  await step('Orders', async () => {
    const res = await client.get('/orders/', { headers: authHeaders() });
    const found = res.data.find((o) => o.id === orderId);
    if (!found) throw new Error(`Order #${orderId} not in order history`);
  });

  // Step 10: Verify order detail
  await step('Order detail', async () => {
    const res = await client.get(`/orders/${orderId}/`, { headers: authHeaders() });
    if (res.data.id !== orderId) throw new Error('Order id mismatch');
    if (!res.data.items || res.data.items.length === 0) throw new Error('No items in order');
    if (!res.data.full_name) throw new Error('Missing shipping name');
    if (!res.data.payment_method) throw new Error('Missing payment method');
    if (parseFloat(res.data.total) !== (parseFloat(product.price) + 20))
      throw new Error(`Order total mismatch`);
  });

  console.log('');
  console.log('=== All 10 steps passed ===');
}

run();
