import { useCallback, useEffect, useState } from 'react';
import api, { mensajeError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useSedes from '../../hooks/useSedes';
import { Esqueleto, ErrorCarga, Vacio } from '../../components/Estados';
import { pesos, TIPOS_VEHICULO } from '../../utils/formato';

const VACIO = { parqueaderoId: '', tipoVehiculo: 'carro', valorHora: '', fraccionMinutos: 15, topeDiario: 0 };

export default function Tarifas() {
  const { usuario } = useAuth();
  const toast = useToast();
  const esAdmin = usuario?.rol === 'admin';
  const { sedes } = useSedes();

  const [tarifas, setTarifas] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(VACIO);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const nombreSede = (id) => sedes.find((s) => String(s._id) === String(id))?.nombre || id;

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/tarifas');
      setTarifas(data.tarifas);
      setError('');
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar las tarifas'));
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (sedes.length && !form.parqueaderoId) setForm((f) => ({ ...f, parqueaderoId: sedes[0]._id }));
  }, [sedes, form.parqueaderoId]);

  function cambiar(campo, valor) { setForm((f) => ({ ...f, [campo]: valor })); }

  function editar(t) {
    setEditando(t._id);
    setForm({
      parqueaderoId: t.parqueaderoId,
      tipoVehiculo: t.tipoVehiculo,
      valorHora: t.valorHora,
      fraccionMinutos: t.fraccionMinutos,
      topeDiario: t.topeDiario,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelarEdicion() {
    setEditando(null);
    setForm({ ...VACIO, parqueaderoId: sedes[0]?._id || '' });
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    const cuerpo = {
      parqueaderoId: form.parqueaderoId,
      tipoVehiculo: form.tipoVehiculo,
      valorHora: Number(form.valorHora),
      fraccionMinutos: Number(form.fraccionMinutos),
      topeDiario: Number(form.topeDiario),
    };
    try {
      if (editando) {
        await api.put(`/tarifas/${editando}`, cuerpo);
        toast.exito('Tarifa actualizada');
      } else {
        await api.post('/tarifas', cuerpo);
        toast.exito('Tarifa creada');
      }
      cancelarEdicion();
      cargar();
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo guardar la tarifa'));
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(t) {
    if (!window.confirm('¿Eliminar esta tarifa? Se usará la tarifa por minuto de la sede.')) return;
    try {
      await api.delete(`/tarifas/${t._id}`);
      toast.exito('Tarifa eliminada');
      cargar();
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo eliminar'));
    }
  }

  return (
    <>
      <h1 className="p-titulo">Tarifas</h1>
      <p className="p-sub">Valor por hora, fracción y tope diario por sede y tipo de vehículo.</p>

      {esAdmin && (
        <form className="p-tarjeta" onSubmit={guardar}>
          <h2>{editando ? 'Editar tarifa' : 'Nueva tarifa'}</h2>
          <div className="p-filtros">
            <label className="p-campo">Sede
              <select value={form.parqueaderoId} onChange={(e) => cambiar('parqueaderoId', e.target.value)} disabled={!!editando} required>
                {sedes.map((s) => <option key={s._id} value={s._id}>{s.nombre}</option>)}
              </select>
            </label>
            <label className="p-campo">Vehiculo
              <select value={form.tipoVehiculo} onChange={(e) => cambiar('tipoVehiculo', e.target.value)} disabled={!!editando}>
                {TIPOS_VEHICULO.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="p-campo">Valor por hora ($)
              <input type="number" min="0" step="100" value={form.valorHora} onChange={(e) => cambiar('valorHora', e.target.value)} required />
            </label>
            <label className="p-campo">Fraccion (min)
              <input type="number" min="1" value={form.fraccionMinutos} onChange={(e) => cambiar('fraccionMinutos', e.target.value)} required />
            </label>
            <label className="p-campo">Tope diario ($, 0 = sin tope)
              <input type="number" min="0" step="100" value={form.topeDiario} onChange={(e) => cambiar('topeDiario', e.target.value)} required />
            </label>
          </div>
          <button className="p-boton" disabled={guardando}>{guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear tarifa'}</button>{' '}
          {editando && <button type="button" className="p-boton p-boton-sec" onClick={cancelarEdicion}>Cancelar</button>}
        </form>
      )}

      <div className="p-tarjeta">
        {error && <ErrorCarga mensaje={error} onReintentar={cargar} />}
        {!error && !tarifas && <Esqueleto />}
        {tarifas && tarifas.length === 0 && <Vacio icono="🏷️" titulo="Aún no hay tarifas" texto={esAdmin ? 'Crea la primera arriba.' : undefined} />}
        {tarifas && tarifas.length > 0 && (
          <div className="p-tabla-envoltura">
            <table className="p-tabla p-tabla-tarjetas">
              <thead><tr><th>Sede</th><th>Vehículo</th><th>Por hora</th><th>Fracción</th><th>Tope diario</th>{esAdmin && <th>Acciones</th>}</tr></thead>
              <tbody>
                {tarifas.map((t) => (
                  <tr key={t._id}>
                    <td data-etiqueta="Sede">{nombreSede(t.parqueaderoId)}</td>
                    <td data-etiqueta="Vehículo">{t.tipoVehiculo}</td>
                    <td data-etiqueta="Por hora">{pesos(t.valorHora)}</td>
                    <td data-etiqueta="Fracción">{t.fraccionMinutos} min</td>
                    <td data-etiqueta="Tope diario">{t.topeDiario ? pesos(t.topeDiario) : 'Sin tope'}</td>
                    {esAdmin && (
                      <td data-etiqueta="Acciones">
                        <button type="button" className="p-boton p-boton-chico p-boton-sec" onClick={() => editar(t)}>Editar</button>{' '}
                        <button type="button" className="p-boton p-boton-chico p-boton-peligro" onClick={() => eliminar(t)}>Eliminar</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
