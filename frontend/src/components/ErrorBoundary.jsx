import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('App Error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
          <div className="bg-gray-800 rounded-xl shadow-lg shadow-gray-900/50 p-8 max-w-md text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-300 mb-4">{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <button onClick={() => window.location.reload()} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
