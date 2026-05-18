import { motion } from 'framer-motion';
import { MapPin, Smartphone, User, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { ActionButton } from '../ui/ActionButton';
import { FlowState } from '../../types';

export const TransitView = ({ set }: { set: (s: FlowState) => void }) => (
  <div className="space-y-6 text-center py-10">
    <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
      <MapPin size={80} className="mx-auto text-indigo-500 mb-4" />
    </motion.div>
    <h2 className="text-2xl font-bold text-slate-100">EN TRÁNSITO</h2>
    <p className="text-slate-400">Te diriges al Laboratorio de Redes.</p>
    <div className="mt-8">
      <ActionButton onClick={() => set('LLEGADA_GEOCERCA')} icon={MapPin}>
        Simular Llegada (Geocerca)
      </ActionButton>
    </div>
  </div>
);

export const ArrivalView = ({ set }: { set: (s: FlowState) => void }) => (
  <div className="space-y-6 text-center">
    <Smartphone size={64} className="mx-auto text-emerald-500 mb-4" />
    <h2 className="text-2xl font-bold text-slate-100">Match Espacial</h2>
    <p className="text-slate-400">El sistema pasivo ha validado tus coordenadas GPS en el Laboratorio de Redes. Se habilita el contacto con el destinatario.</p>
    <ActionButton onClick={() => set('PRESENCIA_DESTINATARIO')} icon={User}>
      Registrar Contacto
    </ActionButton>
  </div>
);

export const PresenceView = ({ set, setIsProxy }: { set: (s: FlowState) => void, setIsProxy: (v: boolean) => void }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-slate-100">¿Destinatario Presente?</h2>
    <p className="text-slate-400">El Profesor jefe ¿está físicamente en el laboratorio? (D2)</p>
    <div className="grid gap-4 mt-8">
      <ActionButton variant="success" onClick={() => { setIsProxy(false); set('INSPECCION_ACTIVO'); }} icon={CheckCircle2}>
        Sí, entregar al profesor
      </ActionButton>
      <ActionButton variant="warning" onClick={() => set('INTENTO_FALLIDO_ESPERA')} icon={Clock}>
        No, salió a comprar café
      </ActionButton>
    </div>
  </div>
);

export const WaitProxyView = ({ set, setIsProxy }: { set: (s: FlowState) => void, setIsProxy: (v: boolean) => void }) => (
  <div className="space-y-6 text-center">
    <Clock size={64} className="mx-auto text-amber-500 mb-4" />
    <h2 className="text-2xl font-bold text-slate-100">ESPERA (Ajuste 1)</h2>
    <p className="text-slate-400">Iniciando ventana de 15 minutos (Tolerancia) buscando al destinatario o un Proxy Autorizado.</p>
    <div className="grid gap-4 mt-8">
      <ActionButton variant="success" onClick={() => { setIsProxy(true); set('INSPECCION_ACTIVO'); }} icon={User}>
        Validar Proxy con Credencial
      </ActionButton>
      <ActionButton variant="danger" onClick={() => set('FLUJO_RETORNO')} icon={XCircle}>
        Tolerancia Expiró (D2 No)
      </ActionButton>
    </div>
  </div>
);