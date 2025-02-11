import { BellIcon } from '@heroicons/react/24/outline';

function Navbar() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 lg:hidden">
                LiveTrack
              </h1>
            </div>
          </div>
          <div className="flex items-center">
            <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none">
              <span className="sr-only">Voir les notifications</span>
              <BellIcon className="h-6 w-6" />
            </button>
            <div className="ml-4 flex items-center">
              <div className="h-8 w-8 rounded-full bg-gray-200"></div>
              <span className="ml-2 text-sm font-medium text-gray-700">Admin</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;