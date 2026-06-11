import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function CartPage() {
  const { cart, loading, updateItem, removeItem } = useCart()

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      {cart.items?.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm  p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
          <Link to="/products" className="text-blue-800 hover:underline">Browse Products</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {cart.items?.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm  p-4 flex gap-4">
                {item.product_image ? (
                  <img src={item.product_image} alt={item.product_title} className="w-20 h-20 object-cover rounded-lg" />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-lg" />
                )}
                <div className="flex-1">
                  <Link to={`/products/${item.product}`} className="font-medium text-gray-900 hover:text-blue-800">
                    {item.product_title}
                  </Link>
                  <p className="text-lg font-bold text-blue-800 mt-1">${parseFloat(item.discounted_price).toFixed(2)}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button onClick={() => updateItem(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full border text-gray-500 hover:bg-gray-100">-</button>
                    <span className="font-medium">{item.quantity}</span>
                    <button onClick={() => updateItem(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="w-8 h-8 rounded-full border text-gray-500 hover:bg-gray-100 disabled:opacity-30">+</button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Subtotal: ${parseFloat(item.subtotal).toFixed(2)}</p>
                </div>
                <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 self-start">
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm  p-6 h-fit sticky top-20">
            <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
            <div className="flex justify-between text-gray-700 mb-2">
              <span>Items</span>
              <span>{cart.item_count}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-3 mt-3">
              <span>Total</span>
              <span className="text-blue-800">${parseFloat(cart.total).toFixed(2)}</span>
            </div>
            <Link to="/checkout"
              className="block text-center mt-6 w-full bg-blue-800 text-white py-3 rounded-lg hover:bg-blue-900 font-medium">
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
