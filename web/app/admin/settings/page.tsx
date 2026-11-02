import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-1">
        Settings
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Configure illustrative assumptions, data sources and user roles.
      </p>

      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <Settings className="mx-auto h-10 w-10 text-gray-300 mb-4" />
        <h3 className="text-base font-medium text-gray-700 mb-2">
          Settings not yet available
        </h3>
        <p className="max-w-md mx-auto text-sm text-gray-500">
          Admin controls for managing configurable assumptions (fare revenue,
          capacity loss percentages, pricing model) and user role management
          will be built after Supabase integration.
        </p>
      </div>
    </section>
  );
}
