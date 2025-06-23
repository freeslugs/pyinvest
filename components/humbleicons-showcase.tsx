import { HumbleIcon } from './ui/humbleicon';

export function HumbleIconsShowcase() {
  const iconExamples = [
    { name: 'shield', label: 'Shield', category: 'Security' },
    { name: 'wallet', label: 'Wallet', category: 'Finance' },
    { name: 'activity', label: 'Activity', category: 'Interface' },
    { name: 'arrow-right', label: 'Arrow Right', category: 'Navigation' },
    { name: 'settings', label: 'Settings', category: 'Interface' },
    { name: 'user', label: 'User', category: 'People' },
    { name: 'home', label: 'Home', category: 'Navigation' },
    { name: 'bell', label: 'Bell', category: 'Communication' },
    { name: 'search', label: 'Search', category: 'Interface' },
    { name: 'plus', label: 'Plus', category: 'Actions' },
    { name: 'minus', label: 'Minus', category: 'Actions' },
    { name: 'check', label: 'Check', category: 'Actions' },
    { name: 'x', label: 'X', category: 'Actions' },
    { name: 'star', label: 'Star', category: 'Interface' },
    { name: 'heart', label: 'Heart', category: 'Interface' },
    { name: 'chart', label: 'Chart', category: 'Data' },
  ];

  const categories = [...new Set(iconExamples.map(icon => icon.category))];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Humbleicons Showcase</h2>
        <p className="text-gray-600 mb-6">
          Simple, neutral, carefully crafted icons for your better UI. Here are some examples integrated into your app.
        </p>

        {/* Size Examples */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Size Variations</h3>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <HumbleIcon name="shield" size="sm" />
              <span className="text-sm">Small</span>
            </div>
            <div className="flex items-center space-x-2">
              <HumbleIcon name="shield" size="md" />
              <span className="text-sm">Medium (default)</span>
            </div>
            <div className="flex items-center space-x-2">
              <HumbleIcon name="shield" size="lg" />
              <span className="text-sm">Large</span>
            </div>
            <div className="flex items-center space-x-2">
              <HumbleIcon name="shield" size="xl" />
              <span className="text-sm">Extra Large</span>
            </div>
          </div>
        </div>

        {/* Color Examples */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Color Examples</h3>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <HumbleIcon name="heart" className="text-red-500" />
              <span className="text-sm">Red</span>
            </div>
            <div className="flex items-center space-x-2">
              <HumbleIcon name="star" className="text-yellow-500" />
              <span className="text-sm">Yellow</span>
            </div>
            <div className="flex items-center space-x-2">
              <HumbleIcon name="check" className="text-green-500" />
              <span className="text-sm">Green</span>
            </div>
            <div className="flex items-center space-x-2">
              <HumbleIcon name="bell" className="text-blue-500" />
              <span className="text-sm">Blue</span>
            </div>
            <div className="flex items-center space-x-2">
              <HumbleIcon name="settings" className="text-purple-500" />
              <span className="text-sm">Purple</span>
            </div>
          </div>
        </div>
      </div>

      {/* Icon Grid by Category */}
      {categories.map(category => (
        <div key={category} className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{category}</h3>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {iconExamples
              .filter(icon => icon.category === category)
              .map(icon => (
                <div
                  key={icon.name}
                  className="flex flex-col items-center p-3 bg-white border rounded-lg hover:shadow-md transition-shadow"
                >
                  <HumbleIcon name={icon.name} size="lg" className="mb-2 text-gray-700" />
                  <span className="text-xs text-gray-600 text-center">{icon.label}</span>
                </div>
              ))
            }
          </div>
        </div>
      ))}

      {/* Usage Examples */}
      <div className="mt-12 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Usage Examples</h3>

        <div className="space-y-4">
          {/* Button with icon */}
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Button with Icon</h4>
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <HumbleIcon name="plus" size="sm" className="mr-2" />
              Add New Item
            </button>
          </div>

          {/* Navigation item */}
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Navigation Item</h4>
            <a href="#" className="inline-flex items-center text-blue-600 hover:text-blue-800">
              <HumbleIcon name="home" size="sm" className="mr-2" />
              Dashboard
            </a>
          </div>

          {/* Status indicator */}
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Status Indicators</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <HumbleIcon name="check" size="sm" className="mr-2 text-green-500" />
                <span className="text-green-700">Task completed</span>
              </div>
              <div className="flex items-center">
                <HumbleIcon name="x" size="sm" className="mr-2 text-red-500" />
                <span className="text-red-700">Task failed</span>
              </div>
              <div className="flex items-center">
                <HumbleIcon name="activity" size="sm" className="mr-2 text-blue-500" />
                <span className="text-blue-700">Task in progress</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
