import { TrendingUp } from "lucide-react";

export default function ForecastPage() {
  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-1">
        Forecast
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Historical demand forecasting with clearly labelled illustrative assumptions.
      </p>

      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <TrendingUp className="mx-auto h-10 w-10 text-gray-300 mb-4" />
        <h3 className="text-base font-medium text-gray-700 mb-2">
          No forecast data
        </h3>
        <p className="max-w-md mx-auto text-sm text-gray-500">
          When historical bus‑run data is available, this page will display
          demand curves, confidence intervals and the assumptions behind each
          forecast. All illustrative numbers will be clearly labelled.
        </p>
      </div>
    </section>
  );
}
