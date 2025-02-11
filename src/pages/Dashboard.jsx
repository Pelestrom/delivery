import { TruckIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const stats = [
    {
      title: 'Véhicules Actifs',
      value: '8',
      icon: TruckIcon,
      color: 'text-blue-600',
    },
    {
      title: 'En Livraison',
      value: '5',
      icon: ClockIcon,
      color: 'text-yellow-600',
    },
    {
      title: 'Livraisons Terminées',
      value: '124',
      icon: CheckCircleIcon,
      color: 'text-green-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Activité Récente
          </h2>
        </div>
        <div className="p-6">
          {/* Contenu de l'activité récente à implémenter */}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;