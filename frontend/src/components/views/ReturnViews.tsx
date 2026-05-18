import { motion } from 'framer-motion';
import { Archive, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { ActionButton } from '../ui/ActionButton';
import { FlowState } from '../../types';

export const ReturnFlowView = ({ set }: { set: (s: FlowState) => void }) => (
  <div className="space-y-6">
    <div className="text-center">
      <Archive size={64} className="mx-auto text-rose-500 mb-4" />
      <h2 className="text-2xl font-bold text-slate-100">Retorno (Ajuste 2)</h2>
      <p className="text-slate-400">El activo fue RECHAZADO. Requieres 3er Handshake del Remitente al regresar.</p>
    </div>
    
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl">
      <h3 className="text-white font-bold mb-4">¿El Remitente acepta la devolución?</h3>
      <div className="grid gap-3">
        <ActionButton variant="success" onClick={() => set('HOME')} icon={CheckCircle2}>
          Sí, 3er Handshake (Devuelto origin)
        </ActionButton>
        <ActionButton variant="danger" onClick={() => set('DISPUTA_CUSTODIA')} icon={ShieldAlert}>
          No, alega daño de tu parte
        </ActionButton>
      </div>
    </div>
  </div>
);

export const DisputeView = ({ set }: { set: (s: FlowState) => void }) => (
  <div className="space-y-6 text-center">
    <ShieldAlert size={64} className="mx-auto text-red-500 mb-4" />
    <h2 className="text-2xl font-bold text-slate-100">DISPUTA (Ajuste 3)</h2>
    <p className="text-slate-400">El originador se niega. Debes liberarte recurriendo a Cuarentena neutral.</p>
    <ActionButton onClick={() => set('CUARENTENA')} icon={Archive}>
      Depositar en Casillero
    </ActionButton>
  </div>
);

export const QuarantineView = ({ set }: { set: (s: FlowState) => void }) => (
  <div className="space-y-6 text-center py-6">
    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 3 }}>
      <Archive size={80} className="mx-auto text-slate-500 mb-4" />
    </motion.div>
    <h2 className="text-2xl font-bold text-slate-100">Bodega Cuarentena</h2>
    <p className="text-slate-400 mb-4">Depositado. Cedes custodia física. Interviene el Supervisor de Bodega.</p>
    
    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 font-bold mb-6">
      Resolución: CERRADO CON INCIDENCIA
    </div>

    <ActionButton variant="secondary" onClick={() => set('HOME')}>
      Finalizar Simulación PMN
    </ActionButton>
  </div>
);