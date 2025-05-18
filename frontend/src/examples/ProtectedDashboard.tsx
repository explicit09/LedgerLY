import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

/**
 * Example of a protected dashboard component that requires authentication
 * This component will only be rendered if the user is authenticated
 * and has the required roles (if specified)
 */
const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Welcome to Your Dashboard</h1>
          <Button 
            onClick={logout}
            variant="outline"
            className="bg-red-500 text-white hover:bg-red-600"
          >
            Logout
          </Button>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">User Information</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {user?.name || 'N/A'}</p>
            <p><span className="font-medium">Email:</span> {user?.email || 'N/A'}</p>
            <p><span className="font-medium">Role:</span> {user?.role || 'N/A'}</p>
            <p><span className="font-medium">Last Login:</span> {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}</p>
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ActionCard 
              title="View Profile" 
              description="View and edit your profile information"
              onClick={() => console.log('View Profile')}
            />
            <ActionCard 
              title="Settings" 
              description="Update your account settings"
              onClick={() => console.log('Settings')}
            />
            <ActionCard 
              title="Help & Support" 
              description="Get help with any issues"
              onClick={() => console.log('Help & Support')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Example of a reusable card component for dashboard actions
interface ActionCardProps {
  title: string;
  description: string;
  onClick: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({ title, description, onClick }) => (
  <div 
    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    onClick={onClick}
  >
    <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);

// Export the component with authentication protection
export default Dashboard;

// Example of how to use withAuth with role-based access control
// export default withAuth(Dashboard, {
//   requireAuth: true,
//   requiredRoles: ['admin', 'user'],
//   redirectTo: '/login',
// });
