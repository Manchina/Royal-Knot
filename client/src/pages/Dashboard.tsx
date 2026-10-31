import React from 'react';
import { ExecutiveDashboard } from '../components/dashboards/ExecutiveDashboard';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-4">
      <ExecutiveDashboard />
    </div>
  );
};
