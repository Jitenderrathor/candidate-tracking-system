import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SOURCE_COLOR } from '@/features/public-dashboard/publicDashboard.constants';

export function SourceBarChart({ data }) {
  return (
    <div
      className="h-72 w-full"
      role="img"
      aria-label="Candidate registrations by source bar chart"
    >
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={data} margin={{ bottom: 24, left: -18, right: 8, top: 8 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            angle={-28}
            dataKey="name"
            fontSize={11}
            height={58}
            interval={0}
            stroke="#64748b"
            textAnchor="end"
          />
          <YAxis allowDecimals={false} fontSize={11} stroke="#64748b" />
          <Tooltip
            contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }}
            cursor={{ fill: '#f1f5f9' }}
          />
          <Bar dataKey="count" fill={SOURCE_COLOR} name="Registrations" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
