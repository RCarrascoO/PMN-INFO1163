import { Archive, ClipboardSignature, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ActionButton } from '../ui/ActionButton';
import { FlowState } from '../../types';

export const OriginVerificationView = ({ set }: { set: (s: FlowState) => void }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-slate-100">Verificación en Origen</h2>
    <p className="text-slate-400">Has escaneado la GPU RTX 3050 en Informática. Por favor, verifica el estado del hardware antes de aceptar responsabilidad.</p>
    
    <div className="grid gap-4 mt-8">
      <ActionButton variant="success" onClick={() => set('HANDSHAKE_ORIGEN')} icon={CheckCircle2}>
        Caja sellada (D1 OK)
      </ActionButton>
      <ActionButton variant="danger" onClick={() => set('RECHAZO_ORIGEN')} icon={Archive}>
        Caja abierta (D1 Rechazo)
      </ActionButton>
    </div>
  </div>
);

export const HandshakeOriginView = ({ set }: { set: (s: FlowState) => void }) => (
  <div className="space-y-6 text-center">
    <ClipboardSignature size={64} className="mx-auto text-blue-500 mb-4" />
    <h2 className="text-2xl font-bold text-slate-100">1er Handshake Digital</h2>
    <p className="text-slate-400">Firma electrónica concurrente. Tú y el encargado de Informática firman la transferencia formal de custodia.</p>
    
    <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 animate-pulse text-sm text-slate-300">
      Generando y enviando código OTP al destinatario...
    </div>

    <ActionButton onClick={() => set('EN_TRANSITO')} icon={ClipboardSignature}>
      Firmar y Asumir Custodia
    </ActionButton>
  </div>
);

export const RejectOriginView = ({ set }: { set: (s: FlowState) => void }) => (
  <div className="space-y-6 text-center">
    <AlertTriangle size={64} className="mx-auto text-amber-500 mb-4" />
    <h2 className="text-2xl font-bold text-slate-100">Error Temprano (E1)</h2>
    <p className="text-slate-400">Has rechazado el traslado. El paquete nunca salió de tu responsabilidad.</p>
    <ActionButton variant="secondary" onClick={() => set('HOME')}>
      Reiniciar Simulación
    </ActionButton>
  </div>
);