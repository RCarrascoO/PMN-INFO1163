import { CheckCircle2, ShieldAlert, KeyRound } from 'lucide-react';
import { ActionButton } from '../ui/ActionButton';
import { FlowState } from '../../types';

export const InspectionView = ({ set, isProxy }: { set: (s: FlowState) => void, isProxy: boolean }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-slate-100">EN VALIDACIÓN</h2>
    <p className="text-slate-400">El {isProxy ? 'Ayudante (Proxy)' : 'Profesor'} inspecciona la GPU (D3).</p>
    <div className="grid gap-4 mt-8">
      <ActionButton variant="success" onClick={() => set('SOLICITAR_OTP')} icon={CheckCircle2}>
        Conforme (Pines y caja OK)
      </ActionButton>
      <ActionButton variant="danger" onClick={() => set('FLUJO_RETORNO')} icon={ShieldAlert}>
        Pines Doblados (Rechazar E3)
      </ActionButton>
    </div>
  </div>
);

export const OtpView = ({ set, isProxy }: { set: (s: FlowState) => void, isProxy: boolean }) => (
  <div className="space-y-6 text-center">
    <KeyRound size={64} className="mx-auto text-emerald-500 mb-4" />
    <h2 className="text-2xl font-bold text-slate-100">2do Handshake (OTP)</h2>
    <p className="text-slate-400">Ingresa código OTP del {isProxy ? 'Profesor (vía Proxy)' : 'Profesor'}.</p>
    
    <div className="flex justify-center gap-2 mb-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="w-10 h-12 md:w-12 md:h-14 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-600 text-2xl font-mono text-slate-100">
          *
        </div>
      ))}
    </div>

    <ActionButton variant="success" onClick={() => set('ENTREGADO')} icon={CheckCircle2}>
      Validar y Finalizar
    </ActionButton>
  </div>
);

export const DeliveredView = ({ set }: { set: (s: FlowState) => void }) => (
  <div className="space-y-6 text-center py-10">
    <CheckCircle2 size={80} className="mx-auto text-emerald-500 mb-4" />
    <h2 className="text-3xl font-bold text-slate-100">ENTREGADO</h2>
    <p className="text-slate-400">Ciclo completado. Custodia transferida exitosamente al usuario final.</p>
    <ActionButton variant="secondary" onClick={() => set('HOME')}>
      Ver nuevos paquetes
    </ActionButton>
  </div>
);