import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { profile } = useAuth();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Welcome, {profile.get()?.full_name || 'User'}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-card rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
          <p>Coming soon...</p>
        </div>
      </div>
    </div>
  );
}
