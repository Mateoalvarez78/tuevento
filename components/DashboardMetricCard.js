export default function DashboardMetricCard({ title, value, subtitle, icon, color = 'primary', trend }) {
  const colorMap = {
    primary: 'bg-primary-light text-primary',
    green:   'bg-green-50 text-green-600',
    blue:    'bg-blue-50 text-blue-600',
    yellow:  'bg-yellow-50 text-yellow-600',
    purple:  'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        {icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${colorMap[color] || colorMap.primary}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {trend && (
          <span className={`text-xs font-medium mb-1 ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
