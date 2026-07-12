import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { STATUS_COLORS } from '@/features/public-dashboard/publicDashboard.constants';

export function StatusPieChart({ data }) {
  return (
    <div className="h-72 w-full" role="img" aria-label="Candidate status distribution pie chart">
      <ResponsiveContainer height="100%" width="100%">
        <PieChart>
          <Pie
            cx="50%"
            cy="44%"
            data={data}
            dataKey="count"
            innerRadius={55}
            nameKey="name"
            outerRadius={88}
            paddingAngle={2}
            stroke="white"
            strokeWidth={3}
          >
            {data.map((entry) => (
              <Cell fill={STATUS_COLORS[entry.name]} key={entry.name} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }} />
          <Legend iconSize={9} wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
