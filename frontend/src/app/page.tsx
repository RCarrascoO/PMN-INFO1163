"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { FlowState } from "../types";

import { HomeView, ErrorDataView } from "../components/views/HomeViews";
import { OriginVerificationView, HandshakeOriginView, RejectOriginView } from "../components/views/OriginViews";
import { TransitView, ArrivalView, PresenceView, WaitProxyView } from "../components/views/TransitViews";
import { InspectionView, OtpView, DeliveredView } from "../components/views/ValidationViews";
import { ReturnFlowView, DisputeView, QuarantineView } from "../components/views/ReturnViews";

export default function PMNApp() {
  const [currentState, setCurrentState] = useState<FlowState>("HOME");
  const [isProxy, setIsProxy] = useState(false);

  const renderContent = () => {
    switch (currentState) {
      case "HOME": return <HomeView set={setCurrentState} />;
      case "ERROR_DATOS": return <ErrorDataView set={setCurrentState} />;
      case "PENDIENTE_RECOLECCION": return <OriginVerificationView set={setCurrentState} />;
      case "HANDSHAKE_ORIGEN": return <HandshakeOriginView set={setCurrentState} />;
      case "RECHAZO_ORIGEN": return <RejectOriginView set={setCurrentState} />;
      case "EN_TRANSITO": return <TransitView set={setCurrentState} />;
      case "LLEGADA_GEOCERCA": return <ArrivalView set={setCurrentState} />;
      case "PRESENCIA_DESTINATARIO": return <PresenceView set={setCurrentState} setIsProxy={setIsProxy} />;
      case "INTENTO_FALLIDO_ESPERA": return <WaitProxyView set={setCurrentState} setIsProxy={setIsProxy} />;
      case "INSPECCION_ACTIVO": return <InspectionView set={setCurrentState} isProxy={isProxy} />;
      case "SOLICITAR_OTP": return <OtpView set={setCurrentState} isProxy={isProxy} />;
      case "ENTREGADO": return <DeliveredView set={setCurrentState} />;
      case "FLUJO_RETORNO": return <ReturnFlowView set={setCurrentState} />;
      case "DISPUTA_CUSTODIA": return <DisputeView set={setCurrentState} />;
      case "CUARENTENA": return <QuarantineView set={setCurrentState} />;
      default: return <HomeView set={setCurrentState} />;
    }
  };

  return (
    <div className="min-h-screen bg-uct-blue text-white flex items-center justify-center p-4 selection:bg-uct-gold/30">
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl bg-slate-950 shadow-[0_0_50px_-12px_rgba(255,215,0,0.2)] rounded-[2.5rem] p-6 md:p-8 border border-uct-gold/30 overflow-hidden relative transition-all duration-300" style={{ minHeight: "600px"}}>
        
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-uct-gold/50">
          <div className="flex items-center gap-4">
            
            {/* ESTA ES LA LÍNEA CON LA RUTA CORRECTA. NO NECESITAS CAMBIARLA. */}
            <Image src="/logo.jpg" alt="Logo UCT" width={50} height={50} />
            
            <div>
              <h1 className="text-xl font-bold text-white">
                Sistema de Paquetería
              </h1>
              <p className="text-sm text-slate-400">Plataforma Interna UCT</p>
            </div>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-uct-gold/20 to-yellow-500/20 rounded-full flex items-center justify-center text-uct-gold border border-uct-gold/30 font-bold">
            J
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentState}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}