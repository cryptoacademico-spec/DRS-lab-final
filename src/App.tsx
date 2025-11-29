import React, { useState, useEffect, useRef } from 'react';
import { 
  RotateCcw, Server, Activity, Zap, Database, CheckCircle, 
  Info, FileText, Monitor, Globe, Layers, ChevronRight, 
  BarChart3, ArrowRightLeft, Scale, AlertTriangle 
} from 'lucide-react';

// --- TIPOS ---
type DRSState = 
  | 'BALANCED'           
  | 'LOAD_SPIKE'         
  | 'CALCULATING'        
  | 'MIGRATING_PHASE_1'  // Emergencia: Salir del Host saturado
  | 'ANALYZING_PHASE_2'  // Re-evaluación
  | 'MIGRATING_PHASE_2'  // Optimización fina (Relleno)
  | 'OPTIMIZED';         

type ViewMode = 'VCENTER_UI' | 'INFRASTRUCTURE';

interface VM {
  id: string;
  name: string;
  hostId: string;
  load: number; 
  size: 'Small' | 'Large'; 
}

interface Host {
  id: string;
  name: string;
  ip: string;
  cpuUsage: number;
  memUsage: number;
  capacity: number;
}

const DRSSimulation = () => {
  // --- ESTADOS ---
  const [viewMode, setViewMode] = useState<ViewMode>('VCENTER_UI');
  const [drsState, setDrsState] = useState<DRSState>('BALANCED');
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  const [statusTitle, setStatusTitle] = useState("Cluster Equilibrado");
  const [statusMessage, setStatusMessage] = useState("El cluster opera dentro de los umbrales normales de desviación.");

  // Configuración de Hosts
  const [hosts, setHosts] = useState<Host[]>([
    { id: 'h1', name: 'ESXi-01', ip: '192.168.10.5', cpuUsage: 30, memUsage: 40, capacity: 100 },
    { id: 'h2', name: 'ESXi-02', ip: '192.168.10.6', cpuUsage: 35, memUsage: 45, capacity: 100 },
    { id: 'h3', name: 'ESXi-03', ip: '192.168.10.7', cpuUsage: 50, memUsage: 60, capacity: 100 },
  ]);

  const [vms, setVms] = useState<VM[]>([
    // Host 1 
    { id: 'vm1', name: 'Web-01', hostId: 'h1', load: 10, size: 'Small' },
    { id: 'vm2', name: 'Web-02', hostId: 'h1', load: 10, size: 'Small' },
    { id: 'vm3', name: 'DNS-01', hostId: 'h1', load: 5, size: 'Small' },
    { id: 'vm4', name: 'NTP-01', hostId: 'h1', load: 5, size: 'Small' },
    
    // Host 2 (El que va a explotar)
    { id: 'vm5', name: 'SQL-PROD', hostId: 'h2', load: 15, size: 'Large' },
    { id: 'vm6', name: 'ORA-DB',   hostId: 'h2', load: 15, size: 'Large' },
    { id: 'vm7', name: 'SAP-Core', hostId: 'h2', load: 15, size: 'Large' },

    // Host 3
    { id: 'vm8', name: 'App-01', hostId: 'h3', load: 12, size: 'Small' },
    { id: 'vm9', name: 'App-02', hostId: 'h3', load: 12, size: 'Small' },
    { id: 'vm10', name: 'Mail-01', hostId: 'h3', load: 12, size: 'Small' },
    { id: 'vm11', name: 'Print',   hostId: 'h3', load: 8, size: 'Small' },
    { id: 'vm12', name: 'File',    hostId: 'h3', load: 15, size: 'Large' },
  ]);

  const [contextMenu, setContextMenu] = useState<{x: number, y: number} | null>(null);

  // Inicialización
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // LOGS INVERTIDOS (Nuevos arriba)
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev]);
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // --- LÓGICA DE SIMULACIÓN DRS ---

  const triggerLoadSpike = () => {
    setContextMenu(null);
    setViewMode('INFRASTRUCTURE');
    setTimeout(() => runDRSSequence(), 1500);
  };

  const runDRSSequence = async () => {
    // 0. ESTADO INICIAL
    addLog("--- INICIO DE SIMULACIÓN DRS ---");
    addLog("Monitor: Analizando métricas de rendimiento...");
    await delay(4000);

    // 1. PICO DE CARGA
    setDrsState('LOAD_SPIKE');
    setStatusTitle("¡ALERTA DE RENDIMIENTO!");
    setStatusMessage("Host ESXi-02 está saturado (>90%). Las bases de datos SQL y SAP consumen todos los recursos.");
    
    setHosts(prev => prev.map(h => 
      h.id === 'h2' ? { ...h, memUsage: 95, cpuUsage: 92 } : h
    ));
    
    addLog("Alarma Crítica: Host ESXi-02 Memoria al 95%.");
    addLog("DRS: Desbalance severo detectado. Puntuación de clúster: Crítica.");

    await delay(7000);

    // 2. CÁLCULO FASE 1
    setDrsState('CALCULATING');
    setStatusTitle("DRS Calculando (Fase 1: Emergencia)");
    setStatusMessage("Prioridad: Reducir carga del Host 2 inmediatamente moviendo las VMs más grandes.");
    
    addLog("DRS: Planificando evacuación de cargas pesadas...");
    addLog("Plan A: Mover 'SQL-PROD' -> ESXi-01.");
    addLog("Plan B: Mover 'SAP-Core' -> ESXi-03.");

    await delay(7000);

    // 3. MIGRACIÓN FASE 1 (Evacuación)
    setDrsState('MIGRATING_PHASE_1');
    setStatusTitle("Ejecutando vMotion (Fase 1)");
    setStatusMessage("Moviendo bases de datos grandes para liberar el Host 2.");
    
    // Mover SQL a H1
    setVms(prev => prev.map(vm => vm.id === 'vm5' ? { ...vm, hostId: 'h1' } : vm));
    // Mover SAP a H3
    setVms(prev => prev.map(vm => vm.id === 'vm7' ? { ...vm, hostId: 'h3' } : vm));
    
    // RESULTADO INTERMEDIO (Desbalanceado hacia el otro lado)
    setHosts(prev => [
      { ...prev[0], memUsage: 70, cpuUsage: 60 }, // H1 sube
      { ...prev[1], memUsage: 45, cpuUsage: 40 }, // H2 baja mucho (muy libre)
      { ...prev[2], memUsage: 80, cpuUsage: 75 }  // H3 sube mucho (casi lleno)
    ]);
    
    addLog("vMotion: Migraciones de emergencia completadas.");
    addLog("Estado: Host 2 liberado, pero Host 3 ahora está sobrecargado (80%).");

    await delay(8000);

    // 4. ANÁLISIS SECUNDARIO (Fine Tuning)
    setDrsState('ANALYZING_PHASE_2');
    setStatusTitle("DRS Re-calculando (Fase 2: Optimización)");
    setStatusMessage("El DRS detecta que el Host 3 quedó muy lleno (80%) y el Host 2 muy vacío (45%). Se requiere un rebalanceo fino.");
    
    addLog("DRS: Ejecutando segunda pasada de optimización...");
    addLog("Análisis: Host 3 (80%) tiene demasiada carga.");
    addLog("Análisis: Host 1 (70%) podría optimizarse.");
    addLog("Destino: Host 2 (45%) tiene capacidad disponible.");
    addLog("Plan: Migrar cargas pequeñas (Web/App) hacia Host 2.");

    await delay(8000);

    // 5. MIGRACIÓN FASE 2 (Equilibrio)
    setDrsState('MIGRATING_PHASE_2');
    setStatusTitle("Ejecutando vMotion (Fase 2)");
    setStatusMessage("Distribuyendo VMs ligeras (App-01, App-02, Web-01) hacia el Host 2 para nivelar todo al 50-60%.");

    // Mover App-01 (H3 -> H2)
    setVms(prev => prev.map(vm => vm.id === 'vm8' ? { ...vm, hostId: 'h2' } : vm));
    // Mover App-02 (H3 -> H2)
    setVms(prev => prev.map(vm => vm.id === 'vm9' ? { ...vm, hostId: 'h2' } : vm));
    // Mover Web-01 (H1 -> H2)
    setVms(prev => prev.map(vm => vm.id === 'vm1' ? { ...vm, hostId: 'h2' } : vm));

    // CARGA FINAL EQUILIBRADA
    setHosts(prev => [
      { ...prev[0], memUsage: 60, cpuUsage: 55 }, // H1 baja a 60
      { ...prev[1], memUsage: 62, cpuUsage: 58 }, // H2 sube a 62 (Perfecto)
      { ...prev[2], memUsage: 58, cpuUsage: 55 }  // H3 baja a 58 (Perfecto)
    ]);

    addLog("vMotion: 'App-01' migrada a ESXi-02.");
    addLog("vMotion: 'App-02' migrada a ESXi-02.");
    addLog("vMotion: 'Web-01' migrada a ESXi-02.");

    await delay(8000);

    // 6. OPTIMIZADO
    setDrsState('OPTIMIZED');
    setStatusTitle("Clúster Totalmente Optimizado");
    setStatusMessage("Objetivo alcanzado: Todos los hosts operan entre el 55% y 65% de capacidad. Rendimiento garantizado.");
    addLog("DRS: Desviación de carga < 5%. Estado Saludable.");
    addLog("--- FIN DE BALANCEO AUTOMÁTICO ---");
  };

  const resetSimulation = () => {
    setDrsState('BALANCED');
    setViewMode('VCENTER_UI');
    setLogs([]);
    setStatusTitle("Cluster Equilibrado");
    setStatusMessage("El cluster opera dentro de los umbrales normales.");
    
    setHosts([
      { id: 'h1', name: 'ESXi-01', ip: '192.168.10.5', cpuUsage: 30, memUsage: 40, capacity: 100 },
      { id: 'h2', name: 'ESXi-02', ip: '192.168.10.6', cpuUsage: 35, memUsage: 45, capacity: 100 },
      { id: 'h3', name: 'ESXi-03', ip: '192.168.10.7', cpuUsage: 50, memUsage: 60, capacity: 100 },
    ]);

    setVms([
      { id: 'vm1', name: 'Web-01', hostId: 'h1', load: 10, size: 'Small' },
      { id: 'vm2', name: 'Web-02', hostId: 'h1', load: 10, size: 'Small' },
      { id: 'vm3', name: 'DNS-01', hostId: 'h1', load: 5, size: 'Small' },
      { id: 'vm4', name: 'NTP-01', hostId: 'h1', load: 5, size: 'Small' },
      { id: 'vm5', name: 'SQL-PROD', hostId: 'h2', load: 15, size: 'Large' },
      { id: 'vm6', name: 'ORA-DB',   hostId: 'h2', load: 15, size: 'Large' },
      { id: 'vm7', name: 'SAP-Core', hostId: 'h2', load: 15, size: 'Large' },
      { id: 'vm8', name: 'App-01', hostId: 'h3', load: 12, size: 'Small' },
      { id: 'vm9', name: 'App-02', hostId: 'h3', load: 12, size: 'Small' },
      { id: 'vm10', name: 'Mail-01', hostId: 'h3', load: 12, size: 'Small' },
      { id: 'vm11', name: 'Print',   hostId: 'h3', load: 8, size: 'Small' },
      { id: 'vm12', name: 'File',    hostId: 'h3', load: 15, size: 'Large' },
    ]);
  };

  // --- RENDERIZADORES ---

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const renderVCenter = () => (
    <div className="bg-[#f5f7fa] min-h-screen flex flex-col font-sans text-[#2d3640]">
      {/* Header vCenter */}
      <div className="bg-[#1e2730] text-white h-[48px] flex items-center justify-between px-4 border-b border-[#444]">
        <div className="flex items-center gap-6">
            <div className="font-semibold text-lg flex items-center gap-2">
               <span className="font-bold">VMware</span> vSphere Client
            </div>
            <div className="text-gray-400 text-sm border-l border-gray-600 pl-4">Menu</div>
        </div>
        <div className="text-xs text-gray-300">administrator@riveritatech.local</div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-[280px] bg-white border-r border-gray-300 flex flex-col hidden md:flex">
            <div className="p-3 border-b border-gray-200 bg-[#f1f3f5] text-[11px] font-bold text-gray-600 uppercase">Navigator</div>
            <div className="p-2 overflow-y-auto flex-1 text-[13px] text-[#2d3640]">
                <div className="flex items-center gap-1.5 py-1 px-2 hover:bg-[#e1f0fa] cursor-pointer">
                    <Globe size={14} className="text-gray-500"/> Riveritatech
                </div>
                {/* Cluster Seleccionado */}
                <div 
                    className="ml-4 flex items-center gap-1.5 py-1 px-2 bg-[#e1f0fa] border-l-[3px] border-[#007cbb] text-[#2d3640] font-medium cursor-context-menu"
                    onContextMenu={handleRightClick}
                >
                    <Layers size={14} className="text-[#007cbb]"/> ClusterLab
                </div>
                
                <div className="ml-8 flex items-center gap-1.5 py-1 px-2 hover:bg-[#e1f0fa] cursor-pointer text-gray-600">
                    <Server size={14}/> ESXi-01 (192.168.10.5)
                </div>
                <div className="ml-8 flex items-center gap-1.5 py-1 px-2 hover:bg-[#e1f0fa] cursor-pointer text-gray-600">
                    <Server size={14}/> ESXi-02 (192.168.10.6)
                </div>
                <div className="ml-8 flex items-center gap-1.5 py-1 px-2 hover:bg-[#e1f0fa] cursor-pointer text-gray-600">
                    <Server size={14}/> ESXi-03 (192.168.10.7)
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-[#f5f7fa] relative" onClick={() => setContextMenu(null)}>
            
            {/* Cluster Header */}
            <div className="bg-white px-6 pt-5 pb-0 border-b border-gray-300 shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                    <div className="bg-[#007cbb] p-2 rounded-sm text-white shadow-sm">
                        <Layers size={40} strokeWidth={1.5} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-normal text-[#2d3640]">ClusterLab</h1>
                            <span className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded border border-green-200">DRS: Fully Automated</span>
                            <span className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded border border-green-200">HA: Enabled</span>
                        </div>
                        <div className="flex gap-6 text-[11px] text-gray-600 mt-1">
                            <span className="flex items-center gap-1">Total Hosts: 3</span>
                            <span className="flex items-center gap-1">Total Processors: 168</span>
                            <span className="flex items-center gap-1">Total Memory: 1.5 TB</span>
                        </div>
                    </div>
                </div>
                {/* Tabs */}
                <div className="flex gap-8 text-[13px] font-medium text-gray-600">
                    <div className="pb-3 border-b-[3px] border-[#007cbb] text-[#007cbb]">Summary</div>
                    <div className="pb-3 hover:border-gray-300 border-b-[3px] border-transparent cursor-pointer">Monitor</div>
                    <div className="pb-3 hover:border-gray-300 border-b-[3px] border-transparent cursor-pointer">Configure</div>
                    <div className="pb-3 hover:border-gray-300 border-b-[3px] border-transparent cursor-pointer">VMs</div>
                </div>
            </div>

            {/* Summary Body */}
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-300 rounded-sm p-4 shadow-sm h-64">
                        <h3 className="text-[11px] font-bold text-gray-700 uppercase mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                            <BarChart3 size={14}/> vSphere DRS Score
                        </h3>
                        <div className="flex items-center justify-center h-40 flex-col">
                            <div className="text-5xl font-light text-green-600 mb-2">98%</div>
                            <p className="text-xs text-gray-500 text-center max-w-[200px]">
                                El clúster está equilibrado. No se requieren acciones en este momento.
                            </p>
                        </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-sm p-8 flex flex-col items-center justify-center text-center shadow-sm h-64">
                        <div className="bg-white p-4 rounded-full mb-3 shadow-md">
                            <Activity size={32} className="text-[#007cbb]" />
                        </div>
                        <h3 className="text-lg font-bold text-[#2d3640]">Prueba de Balanceo DRS</h3>
                        <p className="text-sm text-gray-600 mt-2 max-w-xs">
                            Para iniciar, haz <strong>Clic Derecho</strong> en el <strong>ClusterLab</strong> (barra lateral) y selecciona "Simular pico de carga".
                        </p>
                    </div>
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div 
                    className="absolute bg-white shadow-xl border border-gray-300 py-1 w-64 z-50 text-[13px] text-[#2d3640]"
                    style={{ top: contextMenu.y, left: contextMenu.x }} 
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-4 py-1.5 hover:bg-[#e1f0fa] cursor-pointer">Add Host...</div>
                    <div className="px-4 py-1.5 hover:bg-[#e1f0fa] cursor-pointer">Settings...</div>
                    <div className="h-px bg-gray-200 my-1"></div>
                    <div 
                        className="px-4 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white cursor-pointer flex items-center gap-2 font-bold"
                        onClick={triggerLoadSpike}
                    >
                        <Activity size={14}/> Simular pico de carga (DRS)
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );

  // VISTA INFRAESTRUCTURA (BACKEND)
  const renderInfrastructure = () => (
    <div className="min-h-screen bg-[#f0f2f5] p-6 font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto w-full mb-6 flex justify-between items-center bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded uppercase border border-blue-100">Riveritatech Lab</span>
             <span className="text-[10px] font-bold bg-[#007cbb] text-white px-2 py-0.5 rounded uppercase">vSphere DRS</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Scale className="text-[#007cbb]" />
            Balanceo de Cargas Automático (DRS)
          </h1>
        </div>

        {drsState === 'OPTIMIZED' && (
             <button 
                onClick={resetSimulation}
                className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md font-bold shadow-sm"
             >
                <RotateCcw size={18} /> Reiniciar Laboratorio
             </button>
        )}
        {(drsState.includes('MIGRATING') || drsState.includes('ANALYZING')) && (
             <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded border border-blue-100 animate-pulse font-bold">
                <ArrowRightLeft size={18} className="animate-spin"/> BALANCEANDO...
             </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- COLUMNA IZQUIERDA: RACKS Y CARGA --- */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* PANEL DE ESTADO Y EXPLICACIÓN */}
          <div className={`p-6 rounded-lg border-l-4 shadow-sm transition-all duration-500 bg-white ${
             drsState === 'BALANCED' || drsState === 'OPTIMIZED' ? 'border-green-500' :
             drsState === 'LOAD_SPIKE' ? 'border-red-500' :
             'border-blue-500'
          }`}>
             <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
               {drsState === 'BALANCED' && <span className="text-green-600 flex items-center gap-2"><CheckCircle size={24}/> {statusTitle}</span>}
               {drsState === 'LOAD_SPIKE' && <span className="text-red-600 flex items-center gap-2"><AlertTriangle size={24}/> {statusTitle}</span>}
               {drsState === 'CALCULATING' && <span className="text-blue-600 flex items-center gap-2"><Activity size={24}/> {statusTitle}</span>}
               {drsState.includes('MIGRATING') && <span className="text-blue-600 flex items-center gap-2"><ArrowRightLeft size={24}/> {statusTitle}</span>}
               {drsState.includes('ANALYZING') && <span className="text-purple-600 flex items-center gap-2"><Scale size={24}/> {statusTitle}</span>}
               {drsState === 'OPTIMIZED' && <span className="text-green-600 flex items-center gap-2"><CheckCircle size={24}/> {statusTitle}</span>}
             </h3>
             <p className="text-gray-600 text-base leading-relaxed">
               {statusMessage}
             </p>
          </div>

          {/* VISUALIZACIÓN DE HOSTS (RACKS) */}
          <div className="grid grid-cols-3 gap-4">
             {hosts.map(host => {
               const hostVms = vms.filter(vm => vm.hostId === host.id);
               const isHighLoad = host.memUsage > 80;
               return (
                 <div key={host.id} className={`bg-white p-4 rounded-lg shadow-md border-2 transition-all duration-500 flex flex-col min-h-[400px] ${
                    isHighLoad ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'
                 }`}>
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                       <div className="flex items-center gap-2">
                          <Server size={20} className={isHighLoad ? "text-red-500" : "text-gray-600"}/>
                          <div>
                             <div className="font-bold text-sm text-gray-800">{host.name}</div>
                             <div className="text-[10px] text-gray-500">{host.ip}</div>
                          </div>
                       </div>
                    </div>

                    {/* Barras de Recursos */}
                    <div className="space-y-3 mb-4 bg-gray-50 p-2 rounded">
                       <div>
                          <div className="flex justify-between text-[10px] text-gray-600 mb-1">
                             <span>CPU Usage</span>
                             <span className={isHighLoad ? "text-red-600 font-bold" : ""}>{host.cpuUsage}%</span>
                          </div>
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                             <div 
                                className={`h-full transition-all duration-1000 ${isHighLoad ? 'bg-red-500' : 'bg-blue-500'}`} 
                                style={{ width: `${host.cpuUsage}%` }}
                             ></div>
                          </div>
                       </div>
                       <div>
                          <div className="flex justify-between text-[10px] text-gray-600 mb-1">
                             <span>Memory Usage</span>
                             <span className={isHighLoad ? "text-red-600 font-bold" : ""}>{host.memUsage}%</span>
                          </div>
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                             <div 
                                className={`h-full transition-all duration-1000 ${isHighLoad ? 'bg-red-500' : 'bg-green-500'}`} 
                                style={{ width: `${host.memUsage}%` }}
                             ></div>
                          </div>
                       </div>
                    </div>

                    {/* VMs List */}
                    <div className="flex-1 space-y-2 overflow-hidden">
                        <div className="text-[10px] font-bold text-gray-400 uppercase border-b pb-1 mb-2">Active VMs ({hostVms.length})</div>
                        {hostVms.map(vm => (
                           <div key={vm.id} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded animate-in fade-in zoom-in duration-500 hover:bg-blue-50 transition-colors">
                              <Monitor size={14} className={vm.size === 'Large' ? "text-blue-600" : "text-gray-500"}/>
                              <div className="flex-1">
                                 <div className="text-xs font-bold text-gray-700">{vm.name}</div>
                                 <div className="text-[9px] text-gray-500">{vm.size === 'Large' ? 'High Load' : 'Standard'}</div>
                              </div>
                              {vm.size === 'Large' && <Database size={12} className="text-orange-400"/>}
                           </div>
                        ))}
                    </div>
                 </div>
               );
             })}
          </div>
        </div>

        {/* --- COLUMNA DERECHA: LOGS --- */}
        <div className="lg:col-span-1 h-full">
           <div className="bg-[#1e1e1e] rounded-lg shadow-lg border border-gray-700 flex flex-col h-[600px] font-mono text-xs overflow-hidden">
                <div className="flex justify-between items-center bg-[#252526] p-3 border-b border-gray-700">
                    <span className="font-bold text-gray-400 flex items-center gap-2">
                       <FileText size={14}/> drs.log (Live)
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-green-500">
                       <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> 
                       MONITORING
                    </span>
                </div>
                
                {/* LOGS INVERTIDOS */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-[#1e1e1e]">
                    {logs.map((l, i) => (
                        <div key={i} className={`leading-snug break-words border-l-2 pl-3 py-1 animate-in slide-in-from-top-2 duration-500 ${
                           l.includes("Alarma") ? "text-red-400 border-red-500 bg-red-900/10" :
                           l.includes("Recomendación") ? "text-blue-300 border-blue-500" :
                           l.includes("vMotion") ? "text-yellow-300 border-yellow-500" :
                           l.includes("Análisis") ? "text-purple-300 border-purple-500" :
                           "text-[#a6e22e] border-[#a6e22e]"
                        }`}>
                            {l}
                        </div>
                    ))}
                </div>
           </div>

           {/* INFO CARD EDUCATIVA */}
           <div className="mt-4 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                 <Scale size={16} className="text-[#007cbb]"/> ¿Cómo funciona DRS?
              </h4>
              <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
                 <li><strong>Monitoreo Continuo:</strong> Revisa CPU/RAM cada 5 minutos.</li>
                 <li><strong>Algoritmo Inteligente:</strong> Simula migraciones para encontrar el menor desequilibrio.</li>
                 <li><strong>Sin Interrupciones:</strong> Usa vMotion para mover VMs en caliente y evitar "cuellos de botella".</li>
              </ul>
           </div>
        </div>

      </div>
    </div>
  );

  return viewMode === 'VCENTER_UI' ? renderVCenter() : renderInfrastructure();
};

export default DRSSimulation;
