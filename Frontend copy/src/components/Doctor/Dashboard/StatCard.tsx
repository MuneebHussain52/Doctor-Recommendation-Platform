import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, change }) => {
  const getColorClasses = () => {
    switch (color) {
      case 'cyan':
        return {
          bgLight: 'bg-cyan-50',
          bgIcon: 'bg-cyan-100',
          textIcon: 'text-cyan-600',
          textChange: change?.isPositive ? 'text-green-500' : 'text-red-500'
        };
      case 'blue':
        return {
          bgLight: 'bg-blue-50',
          bgIcon: 'bg-blue-100',
          textIcon: 'text-blue-600',
          textChange: change?.isPositive ? 'text-green-500' : 'text-red-500'
        };
      case 'purple':
        return {
          bgLight: 'bg-purple-50',
          bgIcon: 'bg-purple-100',
          textIcon: 'text-purple-600',
          textChange: change?.isPositive ? 'text-green-500' : 'text-red-500'
        };
      case 'amber':
        return {
          bgLight: 'bg-amber-50',
          bgIcon: 'bg-amber-100',
          textIcon: 'text-amber-600',
          textChange: change?.isPositive ? 'text-green-500' : 'text-red-500'
        };
      default:
        return {
          bgLight: 'bg-gray-50',
          bgIcon: 'bg-gray-100',
          textIcon: 'text-gray-600',
          textChange: change?.isPositive ? 'text-green-500' : 'text-red-500'
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className="bg-white rounded-lg shadow p-5 transition-all hover:shadow-md">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${colors.bgLight}`}>
          <div className={`rounded-full p-2 ${colors.bgIcon}`}>
            <Icon className={`h-6 w-6 ${colors.textIcon}`} />
          </div>
        </div>
        <div className="ml-5">
          <h2 className="text-sm font-medium text-gray-500">{title}</h2>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {change && (
              <p className={`ml-2 text-sm font-medium ${colors.textChange} flex items-center`}>
                {change.isPositive ? '+' : ''}{change.value}%
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;