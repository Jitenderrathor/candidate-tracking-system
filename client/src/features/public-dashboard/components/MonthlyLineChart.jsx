import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function MonthlyLineChart({ data }) {
  return (
    <div
      className="h-72 w-full"
      role="img"
      aria-label="Monthly candidate registration trend line chart"
    >
      <ResponsiveContainer height="100%" width="100%">
        <LineChart data={data} margin={{ left: -18, right: 12, top: 8 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="monthLabel" fontSize={11} stroke="#64748b" />
          <YAxis allowDecimals={false} fontSize={11} stroke="#64748b" />
          <Tooltip
            contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }}
            labelFormatter={(_, payload) => payload?.[0]?.payload.fullMonth || ''}
          />
          <Line
            activeDot={{ r: 5 }}
            dataKey="registrationCount"
            dot={{ fill: '#4f46e5', r: 3 }}
            name="Registrations"
            stroke="#4f46e5"
            strokeWidth={3}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
