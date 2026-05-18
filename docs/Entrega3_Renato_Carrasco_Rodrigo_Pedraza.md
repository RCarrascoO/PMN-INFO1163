# Reevaluaci´on y Ajuste Pr´actico: Modelo de Paqueter´ıa Interna

### Integrantes: Rodrigo Pedraza y Renato Carrasco Universidad Cat´olica de Temuco Profesor: Gast´on Contreras Mayo 2026

## **Introducci´on**

Para el presente avance, se opt´o por dejar de lado la redacci´on excesivamente estructurada y artificial, con el fin de enfocarse en la operatividad del sistema en un contexto
real. El modelo originalmente concebido establec´ıa normativas rigurosas, tales como el
protocolo de ”Handshake”para la transferencia de responsabilidad y el principio de que el
paquete nunca debe quedar . [a] bandonado”sin asignaci´on. No obstante, la implementaci´on
y prueba en un entorno real dentro de la UCT (Universidad Cat´olica de Temuco) ha
revelado deficiencias significativas. A continuaci´on, se presenta un desglose detallado de
los errores identificados y las soluciones propuestas.

## **1. Caso Narrado Completo: El Env´ıo de la Tarjeta** **Gr´afica**


El caso se fundamenta en un requerimiento de soporte t´ecnico, donde el Departamento de Inform´atica (Remitente) debe efectuar el despacho de una unidad de reemplazo,
espec´ıficamente una GPU RTX 3050, con destino al laboratorio de redes, a nombre del
acad´emico jefe (Destinatario). El activo es asignado al estafeta Juan (Agente de Distribuci´on) para su traslado. El proceso ideal se adhiere a la siguiente secuencia formal de
estados y acciones sist´emicas:


1. **Inicio** **(PENDIENTE** ~~**R**~~ **ECOLECCION):** El Departamento de Inform´atica ingresa la informaci´on de la GPU RTX 3050 al sistema. Tras el registro, la trazabilidad
del paquete se establece inicialmente en el estado PENDIENTE ~~R~~ ECOLECCION.


2. **Transici´on** **a** **EN** ~~**T**~~ **RANSITO:** El Agente de Distribuci´on, Juan, se presenta
en el punto de origen. Utilizando la aplicaci´on m´ovil, Juan escanea el ID Unico [´]
(QR) del paquete y, tras una verificaci´on f´ısica satisfactoria, se ejecuta el Primer
Handshake Digital. La firma electr´onica concurrente del Remitente y de Juan en
el dispositivo m´ovil gatilla la transferencia formal de la custodia, lo que resulta
en el cambio de estado a EN TRANSITO. Simult´aneamente, el sistema genera un
C´odigo de Uso Unico [´] (OTP) y lo notifica al correo institucional del Destinatario.


1


3. **Transici´on** **a** **EN** ~~**V**~~ **ALIDACION:** Juan se dirige al laboratorio de redes. Al
llegar, la aplicaci´on m´ovil realiza una validaci´on pasiva de sus coordenadas GPS
contra la geocerca preestablecida para la ubicaci´on del laboratorio. Solo al detectar
un ”match. [es] pacial, el sistema habilita la opci´on para registrar el contacto y pasar de
estado. Juan registra la llegada y la presentaci´on del paquete al Destinatario. Este
pre-chequeo preventivo de ubicaci´on garantiza la legitimidad espacial del evento
antes de que el estado sist´emico transicione a EN ~~V~~ ALIDACION, marcando el inicio
de la fase de inspecci´on por parte del Destinatario.


4. **Finalizaci´on** **(ENTREGADO):** Durante la fase de validaci´on, el Destinatario
inspecciona la RTX 3050. Al confirmar la conformidad (D3 OK), Juan requiere el
C´odigo de Uso Unico [´] (OTP) previamente enviado al correo del profesor. Al ingresar y validar este c´odigo en la aplicaci´on m´ovil, se ejecuta el Segundo Handshake
Digital. La autenticaci´on mediante OTP sella el ciclo de responsabilidad y previene
la suplantaci´on de identidad, formalizando la transferencia definitiva de la custodia
y estableciendo el estado terminal como ENTREGADO.

## **2. Ejecuci´on Paso a Paso y Manejo de Excepciones**


**Error** **Temprano** **(E1)** **e** **Inicio:** El encargado de Inform´atica registra la RTX 3050
(estado PENDIENTE ~~R~~ ECOLECCION). Llega Juan a buscarla, pero se percata de que
la caja antiest´atica est´a abierta y mal sellada. En la decisi´on D1, Juan rechaza el traslado.
Esto activa el Error Temprano (E1), denominado Rechazo de Origen. El paquete nunca
sali´o de la responsabilidad del Remitente. El encargado procede a sellar correctamente y
el proceso se reinicia.
**Dato Inv´alido y Error Intermedio (E2):** En una fase previa al traslado, Inform´atica registra el env´ıo, pero comete un error de datos al ingresar el destino (por ejemplo,
la Sala 404, que figura como ”Fuera de Servicio. [o] cuyo identificador no coincide con el
perfil del destinatario). Cuando Juan escanea el paquete para firmar el Primer Handshake, el sistema consulta la base de datos, detecta la inconsistencia l´ogica y bloquea el
cambio de estado a EN ~~T~~ RANSITO. El estado cambia a una excepci´on temprana (como
ERROR ~~D~~ ATOS - regresa a Borrador). Esto obliga al Remitente a corregir el dato en el
sistema antes de que Juan pueda asumir cualquier responsabilidad.
Una vez corregido el dato, el paquete est´a EN ~~T~~ RANSITO y Juan llega al laboratorio,
pero el profesor sali´o a comprar un caf´e y no est´a f´ısicamente (D2 = No). El modelo
original plantea que esto activar´ıa inmediatamente el RECHAZADO (E2) y el retorno
del paquete, lo cual es ineficiente en la realidad.
**Decisi´on** **Alternativa** **(Proxy):** Supongamos que el profe no est´a, pero dej´o a su
ayudante. La regla RN3 permite entregar a un ”proxy formalmente autorizado”. Sin
embargo, al ejecutar la decisi´on D2 (¿Destinatario Presente?), el modelo es r´ıgido y no
le da a Juan la opci´on sist´emica de validar al proxy, forzando un error. La soluci´on
es la implementaci´on del Ajuste 1 (Estado INTENTO ~~F~~ ALLIDO ~~E~~ SPERA). Cuando el
destinatario no est´a, el estado no pasa de inmediato a RECHAZADO, sino a un estado
de espera por un m´aximo de 15 minutos, - permite reasignar al proxy (cumpliendo RN3
de forma expl´ıcita). Esta validaci´on se materializa mediante el escaneo de la credencial
universitaria - el ingreso del identificador ´unico del proxy en el dispositivo de Juan,
generando un registro de trazabilidad formal. Solo si esta tolerancia expira y no se valida
un proxy, se declara RECHAZADO definitivo.


2


**Error** **de** **Conformidad** **(E3)** **y** **Flujo** **de** **Retorno:** Asumiendo que el profesor
vuelve del caf´e y entramos a EN VALIDACION. Al sacar la tarjeta gr´afica, el profesor
nota que los pines est´an doblados. En la decisi´on D3, la conformidad es negativa. El
sistema marca RECHAZADO. Juan mantiene la custodia del activo (RN4) y debe iniciar
el flujo de devoluci´on. Para cerrar el ciclo de responsabilidad (Ajuste 2), Juan retorna el
paquete a Inform´atica y requiere un Handshake de Devoluci´on (Tercer Handshake) con
el Remitente.


1. **Activaci´on** **de** **la** **Disputa:** Si el Remitente se niega a firmar el Handshake de
Devoluci´on (alegando da˜no por parte del estafeta), el paquete no puede transicionar al estado terminal DEVUELTO ~~A~~ ~~O~~ RIGEN. El sistema fuerza el estado a
DISPUTA ~~C~~ USTODIA.


2. **El** **Entorno** **de** **Cuarentena** **(Mitigaci´on** **de** **Riesgo** **F´ısico):** Para proteger
el activo y liberar operativamente a Juan, el sistema le instruye depositar inmediatamente la GPU en una Bodega de Cuarentena. Al escanear el paquete en este
casillero neutral, Juan cede la custodia f´ısica al sistema, aunque la responsabilidad
legal siga en disputa.


3. **Resoluci´on** **y** **Estado** **Terminal:** La entidad Supervisor de Bodega interviene
para revisar la trazabilidad del caso (incluyendo el registro D3 de da˜no). Una
vez tomada la decisi´on de resoluci´on, el Supervisor cambia el estado a CERRADO ~~C~~ ON INCIDENCIA. Esto libera definitivamente a Juan de la carga legal, termina el ciclo del paquete y cierra el modelo de forma coherente.

## **3. Prueba de Consistencia Interna**


Al abordar las preguntas clave, surgen las contradicciones:


**¿Qu´e** **sucede** **si** **el** **proceso** **de** **entrega** **falla** **en** **destino?** De acuerdo con la
Norma RN4, la responsabilidad no se transfiere al destinatario y el Agente asume
la gesti´on del inconveniente.


**¿Qui´en** **es** **responsable** **de** **cada** **decisi´on** **importante?** La Decisi´on D1 es
tomada por el Agente. La Decisi´on D2 es una validaci´on h´ıbrida: condicionada
sistem´aticamente mediante el control preventivo de Geocerca (GPS pasivo), y confirmada operativamente por el Agente al registrar el encuentro f´ısico.


**¿Qu´e** **elementos** **cambian** **de** **estado** **y** **qu´e** **evento** **desencadena** **dicho** **cam-**
**bio?** Los ”Handshakes”(acuerdos/confirmaciones) son los detonantes que efectivamente trasladan el paquete a los estados EN TRANSITO y ENTREGADO.

## **4. Problemas Reales Detectados**


Al someter el flujo a una revisi´on exhaustiva, se identificaron fallas cr´ıticas que comprometen la integridad del modelo propuesto:


1. **Riesgo F´ısico y Operativo por Custodia Indefinida:** El modelo actual permite
que, tras un rechazo (E2    - E3), el activo (la GPU RTX 3050, un bien de alto


3


valor) permanezca en tr´ansito bajo la custodia f´ısica del Agente de Distribuci´on
(Juan) durante su retorno a Inform´atica. Este escenario expone el activo a riesgos de
extrav´ıo, da˜no o hurto dentro del campus, sin un control f´ısico formal que lo mitigue.
La ausencia de un punto de custodia neutral (p. ej., un casillero seguro) para el
activo rechazado o da˜nado extiende la responsabilidad operativa y la exposici´on del
bien m´as all´a de la ventana de distribuci´on.


2. **Vac´ıo** **L´ogico/Legal** **en** **el** **Flujo** **de** **Retorno** **(Ausencia** **de** **Handshake** **de**
**Cierre):** En el evento de que un paquete sea RECHAZADO (E2 o E3), el protocolo
establece que la unidad ”permanece bajo la responsabilidad del Agente, activ´andose
el flujo de retorno”. Sin embargo, no se ha estipulado un ”Tercer Handshake”formal
para transferir la custodia legal al Remitente original una vez que el Agente regresa
a la unidad de Inform´atica. Esta omisi´on implica que, a nivel sist´emico, el Agente
mantendr´ıa la responsabilidad legal de la GPU de manera indefinida, lo que invalida
el proceso de cierre y gesti´on de responsabilidades.


3. **Rigidez en el Criterio de Decisi´on (D2 sin Tolerancia L´ogica):** La transici´on
al estado RECHAZADO bas´andose ´unicamente en una ausencia temporal del destinatario (e.g., ir al ba˜no) carece de realismo operativo y demuestra una falta de
tolerancia en el proceso de validaci´on.


4. **Entidad** **Remitente** **Pasiva** **en** **la** **Excepci´on:** La participaci´on del Remitente
est´a limitada exclusivamente al inicio del proceso. En situaciones de excepci´on    rechazo, esta entidad no posee un rol definido para recepcionar formalmente los
paquetes devueltos, lo que lo excluye del ciclo de retroalimentaci´on cr´ıtica.

## **5. Ajustes Realizados al Modelo**


Para asegurar la robustez del modelo en un entorno de ejecuci´on real, se implementaron las siguientes modificaciones l´ogicas:


**Ajuste** **1:** **Estado** **INTENTO** ~~**F**~~ **ALLIDO** **(Mecanismo** **de** **Tolerancia):** Se
modific´o la bifurcaci´on l´ogica en D2. Si la entrega al destinatario resulta fallida,
el estado no transiciona inmediatamente a RECHAZADO. En su lugar, el proceso
entra en un estado de espera (INTENTO ~~F~~ ALLIDO ~~E~~ SPERA) con una duraci´on
m´axima de 15 minutos,   - bien permite la reasignaci´on a un agente proxy (cumpliendo expl´ıcitamente la RN3). El estado RECHAZADO definitivo solo se declara
si esta ventana de tolerancia no resulta exitosa.


**Ajuste 2: Modelado Formal del Retorno (Handshake de Devoluci´on y Ca-**
**so** **Base):** Se conceptualiz´o y a˜nadi´o el flujo inverso para las devoluciones limpias.
Cuando un paquete es declarado RECHAZADO y retorna a la base de operaciones,
se establece la obligatoriedad de un ”Handshake de Devoluci´on”(Tercer Handshake)
entre el Agente de entrega y el Remitente. Tras la confirmaci´on por ambas partes,
el paquete adquiere el estado terminal DEVUELTO ~~A~~ ORIGEN, lo que libera al
Agente de la responsabilidad legal asociada y garantiza el cierre limpio del ciclo.


**Ajuste** **3:** **Protocolo** **de** **Disputa,** **Cuarentena** **y** **Resoluci´on** **(Mitigaci´on** **de**
**Riesgo** **F´ısico):** Para mitigar el riesgo f´ısico de tener el activo ”dando vueltas”por


4


el campus y resolver la controversia legal, se formaliz´o el flujo de gesti´on de conflictos. Activaci´on de la Disputa: Si el Remitente se niega a firmar el Handshake de
Devoluci´on (por ejemplo, alegando da˜no atribuible al estafeta), el sistema bloquea
la transici´on a DEVUELTO A ~~O~~ RIGEN y fuerza el estado transitorio a DISPUTA ~~C~~ USTODIA. El Entorno de Cuarentena: Para proteger el activo y liberar a
Juan operativamente, el sistema le instruye depositar inmediatamente la GPU en
una Bodega de Cuarentena. Al escanear el paquete en este casillero neutral, Juan
cede la custodia f´ısica al sistema, aunque la responsabilidad legal siga en disputa.
Resoluci´on de Conflictos: La entidad Supervisor de Bodega interviene para revisar la trazabilidad del caso, incluyendo el registro de da˜no D3. Una vez tomada
la decisi´on, el Supervisor est´a facultado para forzar el estado terminal CERRADO ~~C~~ ON INCIDENCIA, liberando definitivamente al Agente de la carga legal y
cerrando el ciclo del paquete.

## **6. Bit´acora de Co-creaci´on y Uso Cr´ıtico de IA**


La presente versi´on del modelo (tercera iteraci´on) se desarroll´o bajo una metodolog´ıa de co-creaci´on, empleando la Inteligencia Artificial (IA) no como un generador de
contenido inicial, sino como un validador l´ogico y un tutor cr´ıtico, lo que garantiza el
cumplimiento de los est´andares y exigencias formales de la r´ubrica de evaluaci´on. Los
principales hitos de este proceso de refinamiento incluyen:


**Desaf´ıo** **al** **Escenario** **Inicial** **y** **la** **Integraci´on** **de** **la** **Seguridad** **L´ogica** **y** **Le-**
**gal:** Originalmente, el modelo asum´ıa un flujo de entrega ideal basado ´unicamente
en la interacci´on humana. La IA, actuando como cr´ıtico, detect´o vulnerabilidades
inherentes a este . [es] cenario optimista”, se˜nalando riesgos cr´ıticos como la suplantaci´on de identidad y el fraude de ubicaci´on. Esta observaci´on forz´o una reorientaci´on
del caso de uso, transitando desde un enfoque meramente descriptivo hacia un dise˜no
de ingenier´ıa de seguridad. Como resultado, se incorporaron validaciones sist´emicas preventivas (Geocerca/GPS pasivo) y mecanismos robustos de autenticaci´on
(C´odigo OTP).


**Refinamiento** **en** **la** **Detecci´on** **de** **Discrepancias** **y** **Errores:** La revisi´on de
las trayectorias de excepci´on, realizada de forma conjunta, permiti´o identificar inconsistencias entre la capa de operaciones f´ısicas (ej. ausencia del destinatario) y la
capa de datos (ej. error en la base de datos). Esto motiv´o la segregaci´on precisa de
los errores (E1, E2) para asegurar un tratamiento sist´emico y coherente en el flujo
del proceso.


**Resoluci´on** **de** **Vulnerabilidades** **Cr´ıticas** **y** **Riesgo** **Operacional/Legal:** La
simulaci´on detallada del flujo de retorno en un entorno operativo revel´o una falla
significativa: el modelo inicial dejaba al estafeta en una situaci´on de custodia legal
indefinida en caso de disputa. Esta vulnerabilidad cr´ıtica se corrigi´o mediante la
introducci´on formal del Ajuste 3, lo que conllev´o a la creaci´on de la Bodega de
Cuarentena y la definici´on del estado terminal CERRADO ~~C~~ ON ~~I~~ NCIDENCIA,
resolviendo as´ı un riesgo operativo y legal de alta severidad.


**Consistencia** **T´ecnica** **y** **Rigor** **Formal:** El documento ha sido sometido a m´ultiples revisiones exhaustivas para asegurar una consistencia interna absoluta entre los


5


escenarios funcionales descritos, las reglas de negocio (RN) y las entidades del sistema, adoptando en todo momento el lenguaje t´ecnico y el rigor formal exigidos en
el ´ambito de la Ingenier´ıa Civil en Inform´atica.


**Evidencia de Iteraci´on:** El registro completo de la validaci´on, los casos planteados
y el cuestionamiento del modelo original puede ser auditado en el siguiente enlace
al chat de trabajo: `[https://gemini.google.com/share/e57356272e4c](https://gemini.google.com/share/e57356272e4c)`


6


