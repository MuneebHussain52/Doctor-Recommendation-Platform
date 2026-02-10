import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  iconBg: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend, icon, iconBg }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBg} rounded-md p-3`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <div className="flex items-center">
            {trend === 'up' && (
              <ArrowUp className="flex-shrink-0 self-center h-4 w-4 text-emerald-500" />
            )}
            {trend === 'down' && (
              <ArrowDown className="flex-shrink-0 self-center h-4 w-4 text-rose-500" />
            )}
            <span
              className={`ml-1 font-medium ${
                trend === 'up'
                  ? 'text-emerald-600'
                  : trend === 'down'
                  ? 'text-rose-600'
                  : 'text-gray-500'
              }`}
            >
              {change}
            </span>
            <span className="ml-1 text-gray-500">from last month</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;