import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { pesos } from '../utils/formato';

// Colores tomados de las variables del panel para que funcionen en modo claro y oscuro.
const EJE = { style: { fill: 'var(--p-texto-suave)', fontSize: 12 } };
const TOOLTIP = {
  contentStyle: {
    background: 'var(--p-tarjeta)',
    border: '1px solid var(--p-borde)',
    borderRadius: 10,
    color: 'var(--p-texto)',
  },
  labelStyle: { color: 'var(--p-texto)', fontWeight: 600 },
  itemStyle: { color: 'var(--p-texto)' },
};

const ddmm = (fecha) => `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`;
const compacto = (v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : v);

export function GraficaIngresos({ datos }) {
  const serie = datos.map((d) => ({ ...d, dia: ddmm(d.fecha) }));
  return (
    <div style={{ width: '100%', height: 260 }} role="img" aria-label="Gráfica de ingresos por día">
      <ResponsiveContainer>
        <AreaChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="relleno-ingresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f5a623" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#f5a623" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--p-borde)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="dia" tickLine={false} axisLine={false} tick={EJE} />
          <YAxis tickFormatter={compacto} tickLine={false} axisLine={false} width={44} tick={EJE} />
          <Tooltip {...TOOLTIP} formatter={(v) => [pesos(v), 'Ingresos']} />
          <Area type="monotone" dataKey="total" stroke="#f5a623" strokeWidth={2.5} fill="url(#relleno-ingresos)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GraficaHoras({ datos }) {
  const serie = [...datos]
    .sort((a, b) => a.hora - b.hora)
    .map((h) => ({ ...h, etiqueta: `${String(h.hora).padStart(2, '0')}:00` }));
  const maximo = Math.max(...serie.map((h) => h.entradas));
  return (
    <div style={{ width: '100%', height: 260 }} role="img" aria-label="Gráfica de horas pico">
      <ResponsiveContainer>
        <BarChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--p-borde)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} tick={EJE} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} tick={EJE} />
          <Tooltip {...TOOLTIP} cursor={{ fill: 'var(--p-fondo-suave)' }} formatter={(v) => [v, 'Entradas']} />
          <Bar dataKey="entradas" radius={[6, 6, 0, 0]}>
            {serie.map((h) => (
              <Cell key={h.hora} fill={h.entradas === maximo ? '#f5a623' : '#8b5fbf'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
