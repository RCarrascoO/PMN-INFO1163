import { Package, Clock, QrCode, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import { ActionButton } from '../ui/ActionButton';
import { FlowState } from '../../types';

export const HomeView = ({ set }: { set: (s: FlowState) => void }) => (
  <div className="space-y-6">
    <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100">GPU RTX 3050</h3>
          <p className="text-slate-400">Origen: Depto. Informática</p>
          <p className="text-slate-400">Destino: Lab de Redes</p>
        </div>
        <div className="bg-blue-500/20 text-blue-400 p-3 rounded-2xl">
          <Package size={32} />
        </div>
      </div>
      <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-4 py-2 rounded-xl mb-6">
        <Clock size={16} />
        <span className="font-semibold text-sm">Estado: PENDIENTE RECOLECCIÓN</span>
      </div>
      <ActionButton onClick={() => set('PENDIENTE_RECOLECCION')} icon={QrCode}>
        Escanear e Iniciar Traslado
      </ActionButton>
    </div>
    
    <div className="bg-slate-800/30 p-6 rounded-3xl border border-slate-700/50 opacity-60">
      <h3 className="text-lg font-bold text-slate-300">Teclado Mecánico</h3>
      <p className="text-sm text-slate-500">Destino: Sala 404 (Fuera de Servicio)</p>
      <div className="mt-4">
        <ActionButton variant="secondary" onClick={() => set('ERROR_DATOS')} icon={AlertTriangle}>
          Simular Error Datos (E2)
        </ActionButton>
      </div>
    </div>
  </div>
);

export const ErrorDataView = ({ set }: { set: (s: FlowState) => void }) => (
  <div className="space-y-6 text-center">
    <XCircle size={64} className="mx-auto text-rose-500 mb-4" />
    <h2 className="text-2xl font-bold text-slate-100">Inconsistencia Lógica</h2>
    <p className="text-slate-400">El destino (Sala 404) no coincide con el perfil del destinatario o no existe. El sistema bloquea el cambio de estado.</p>
    <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-400 text-sm">
      Excepción (E2): Retorna a borrador para que el Remitente corrija.
    </div>
    <ActionButton variant="secondary" onClick={() => set('HOME')} icon={CheckCircle2}>
      Volver al inicio
    </ActionButton>
  </div>
);