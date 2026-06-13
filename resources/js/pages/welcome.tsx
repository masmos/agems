import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import { AlertTriangle, MapPin, Satellite, ChartLine, Map, ClipboardList, Bell, Shield, Leaf, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick?: () => void;
}

const FeatureCard = ({ icon, title, description, onClick }: FeatureCardProps) => (
    <div 
        onClick={onClick}
        className="group cursor-pointer rounded-2xl border border-[#e9e9e6] bg-[#fafaf8] p-4 transition-all hover:scale-[1.02] hover:shadow-md dark:border-[#2c2c28] dark:bg-[#141413]"
    >
        <div className="mb-3 text-2xl text-[#2c6e2f] dark:text-[#6fbf4c]">{icon}</div>
        <h3 className="mb-1 text-base font-bold tracking-tight dark:text-[#f0f0e9]">{title}</h3>
        <p className="text-xs leading-relaxed text-[#575757] dark:text-[#aaa9a3]">{description}</p>
    </div>
);

interface StationTagProps {
    name: string;
    status?: 'healthy' | 'warning' | 'critical';
}

const StationTag = ({ name, status = 'healthy' }: StationTagProps) => {
    const statusColors = {
        healthy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusColors[status]}`}>
            <MapPin className="h-3 w-3" />
            {name}
        </span>
    );
};

export default function Welcome() {
    const { auth } = usePage().props;
    const [toast, setToast] = useState<{ message: string; type: 'info' | 'warning' | 'critical' } | null>(null);

    useEffect(() => {
        // Simulate automatic threshold alerts on load
        const timer1 = setTimeout(() => {
            showToast('⚠️ CRITICAL: Elevated methane levels detected at Bulisa station (threshold exceeded). 30-min suppression active.', 'critical');
        }, 1800);
        
        const timer2 = setTimeout(() => {
            showToast('🟡 Warning: SO₂ spike near Hoima flare. Check Geospatial View.', 'warning');
        }, 5500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    const showToast = (message: string, type: 'info' | 'warning' | 'critical') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleConsoleClick = () => {
        showToast('🔍 Console: Live telemetry & compliance audit trail (AGEMS Phase 1)', 'info');
    };

    const handleFeatureClick = (feature: string) => {
        const messages: Record<string, string> = {
            telemetry: '📡 Live telemetry API: payload validated, duplicate detection active. Last ingestion 2s ago.',
            threshold: '⚙️ Threshold engine: Last violation at Kikuube, alert suppressed for 30min.',
            geospatial: '🗺️ Albertine Graben map — Bulisa: warning, Hoima: normal, Nwoya: caution',
            audit: '📋 Audit trail: User "compliance@nema.ug" exported report at 14:32 UTC'
        };
        showToast(messages[feature], 'info');
    };

    return (
        <>
            <Head title="AGEMS | Albertine Graben Environmental Monitoring" />
            
            <div className="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 text-[#1b1b18] lg:justify-center lg:p-8 dark:bg-[#0a0a0a]">
                {/* Header Navigation */}
                <header className="mb-6 w-full max-w-[335px] text-sm lg:max-w-7xl">
                    <nav className="flex items-center justify-end gap-4">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="inline-block rounded-md border border-[#19140035] px-5 py-1.5 text-sm leading-normal transition hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="inline-block rounded-md border border-transparent px-5 py-1.5 text-sm leading-normal transition hover:border-[#19140035] dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A]"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={register()}
                                    className="inline-block rounded-md border border-[#19140035] px-5 py-1.5 text-sm leading-normal transition hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                {/* Main Content */}
                <div className="flex w-full max-w-[335px] flex-col-reverse lg:max-w-7xl lg:flex-row">
                    {/* Left Panel - Content */}
                    <div className="flex-1 rounded-b-lg bg-white p-6 shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] lg:rounded-l-lg lg:rounded-r-none lg:p-8 dark:bg-[#161615] dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d]">
                        {/* Header Section */}
                        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="mb-2 text-2xl font-bold tracking-tight lg:text-3xl dark:text-[#f0f0e9]">
                                    Albertine Graben<br />
                                    Environmental & Flare Monitoring
                                </h1>
                                <p className="text-sm text-[#5c5c56] dark:text-[#bcbcb2]">
                                    Near real-time visibility into air quality, methane, CO₂ and SO₂ across monitoring stations
                                </p>
                            </div>
                            <button
                                onClick={handleConsoleClick}
                                className="inline-flex items-center gap-2 rounded-full bg-[#1b1b18] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#33332e] dark:bg-[#eeeeec] dark:text-[#1C1C1A] dark:hover:bg-[#cfcfca]"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Open Console
                            </button>
                        </div>

                        {/* Station Tags */}
                        <div className="mb-6 flex flex-wrap gap-2">
                            <StationTag name="Bulisa" status="warning" />
                            <StationTag name="Hoima" status="healthy" />
                            <StationTag name="Nwoya" status="healthy" />
                            <StationTag name="Kikuube" status="warning" />
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                <Bell className="h-3 w-3" />
                                Active threshold: 2 warnings
                            </span>
                        </div>

                        {/* Features Grid */}
                        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 dark:[&>div]:border-[#2c2c28]">
                            <FeatureCard
                                icon={<Satellite className="h-6 w-6" />}
                                title="Live Telemetry"
                                description="Sensor ingestion API with duplicate detection and validated payloads. Real‑time data streams from flare stacks."
                                onClick={() => handleFeatureClick('telemetry')}
                            />
                            <FeatureCard
                                icon={<ChartLine className="h-6 w-6" />}
                                title="Threshold Engine"
                                description="Automatic warning and critical alerts with 30-minute suppression. Configurable limits for CO₂, SO₂, methane."
                                onClick={() => handleFeatureClick('threshold')}
                            />
                            <FeatureCard
                                icon={<Map className="h-6 w-6" />}
                                title="Geospatial View"
                                description="Station health on an interactive map of the Albertine Graben region. Drill down into each monitoring node."
                                onClick={() => handleFeatureClick('geospatial')}
                            />
                            <FeatureCard
                                icon={<ClipboardList className="h-6 w-6" />}
                                title="Audit Trail"
                                description="Role-based access with logged user actions for compliance review. Full traceability for NEMA audits."
                                onClick={() => handleFeatureClick('audit')}
                            />
                        </div>

                        {/* Bottom CTA */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs text-[#5e5e58] dark:text-[#9d9d96]">
                                <Shield className="h-3.5 w-3.5" />
                                Automatic threshold violation alerts
                            </div>
                            <Link
                                href={auth.user ? dashboard() : login()}
                                className="inline-flex items-center gap-2 rounded-full bg-[#1b4d1f] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#0f3d12] hover:shadow-md"
                            >
                                <AlertTriangle className="h-4 w-4" />
                                Explore Dashboard
                            </Link>
                        </div>
                    </div>

                    {/* Right Panel - Visual/Map Representation */}
                    <div className="relative -mb-px aspect-[335/364] w-full overflow-hidden rounded-t-lg lg:mb-0 lg:-ml-px lg:aspect-auto lg:w-[480px] lg:rounded-l-none lg:rounded-r-lg">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1f3a2f] via-[#4a6e4d] to-[#c5a16e]">
                            {/* Decorative SVG Map Scene */}
                            <svg viewBox="0 0 480 400" className="h-full w-full">
                                <defs>
                                    <linearGradient id="flareGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ff7043" stopOpacity="0.9" />
                                        <stop offset="100%" stopColor="#ffb74d" stopOpacity="0.2" />
                                    </linearGradient>
                                    <filter id="glow">
                                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                                        <feMerge>
                                            <feMergeNode in="coloredBlur"/>
                                            <feMergeNode in="SourceGraphic"/>
                                        </feMerge>
                                    </filter>
                                </defs>
                                
                                {/* Sun/Flare */}
                                <circle cx="370" cy="80" r="35" fill="#F8B803" fillOpacity="0.4" filter="url(#glow)"/>
                                <circle cx="370" cy="80" r="20" fill="#FFAC1C" />
                                
                                {/* Flare Stack */}
                                <rect x="310" y="180" width="8" height="60" fill="#6d6d64" />
                                <path d="M314 175 L300 188 L328 188 Z" fill="#DD4B1A" filter="url(#glow)"/>
                                <path d="M315 168 L307 180 L323 180 Z" fill="#FF6D2C" />
                                
                                {/* Landscape */}
                                <path d="M0 260 L480 260 L480 400 L0 400 Z" fill="#2c4b32" fillOpacity="0.9" />
                                <path d="M50 250 L75 215 L100 250 Z" fill="#2f5e3a" />
                                <path d="M100 250 L120 205 L140 250 Z" fill="#386a46" />
                                <path d="M220 255 L240 220 L260 255 Z" fill="#2c5c38" />
                                <path d="M340 252 L360 218 L380 252 Z" fill="#367d48" />
                                
                                {/* Monitoring Station Markers */}
                                <circle cx="150" cy="240" r="6" fill="#f4d03f" stroke="#1f1f1a" strokeWidth="1.5">
                                    <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
                                </circle>
                                <circle cx="270" cy="238" r="6" fill="#58d68d" stroke="#1f1f1a" strokeWidth="1.5" />
                                <circle cx="410" cy="245" r="6" fill="#f0b27a" stroke="#1f1f1a" strokeWidth="1.5">
                                    <animate attributeName="fill" values="#f0b27a;#ff9999;#f0b27a" dur="3s" repeatCount="indefinite" />
                                </circle>
                                
                                {/* Methane/Particles */}
                                <circle cx="130" cy="170" r="2.5" fill="#a9dfbf" fillOpacity="0.7">
                                    <animate attributeName="cy" values="170;150;170" dur="4s" repeatCount="indefinite" />
                                </circle>
                                <circle cx="180" cy="150" r="2" fill="#a9dfbf" fillOpacity="0.6">
                                    <animate attributeName="cy" values="150;130;150" dur="3.5s" repeatCount="indefinite" />
                                </circle>
                                <circle cx="360" cy="140" r="3" fill="#ffb347" fillOpacity="0.8">
                                    <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
                                </circle>
                                
                                {/* Labels */}
                                <text x="30" y="290" fill="#faf0cf" fontSize="9" fontWeight="bold">Albertine Graben</text>
                                <text x="135" y="230" fill="#fff" fontSize="7" fontWeight="bold">Bulisa</text>
                                <text x="255" y="228" fill="#fff" fontSize="7" fontWeight="bold">Hoima</text>
                                <text x="395" y="235" fill="#fff" fontSize="7" fontWeight="bold">Kikuube</text>
                            </svg>
                        </div>
                        <div className="absolute inset-0 rounded-t-lg shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] lg:rounded-l-none lg:rounded-r-lg dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d]" />
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-8 w-full max-w-[335px] border-t border-[#e4e4e0] pt-5 text-center text-xs text-[#7f7f7a] lg:max-w-7xl dark:border-[#2a2a27] dark:text-[#9d9d96]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <span>© 2026 National Environment Management Authority (NEMA), Uganda. AGEMS Phase 1.</span>
                        <div className="flex gap-4">
                            <span className="inline-flex items-center gap-1">
                                <Leaf className="h-3 w-3" />
                                Low emissions initiative
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <ChartLine className="h-3 w-3" />
                                Real-time compliance
                            </span>
                        </div>
                    </div>
                    <div className="mt-2 flex justify-center gap-4 text-[11px]">
                        <span>Near real-time visibility</span>
                        <span>•</span>
                        <span>Methane · CO₂ · SO₂</span>
                        <span>•</span>
                        <span>Flare volumes</span>
                    </div>
                </footer>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-right-5 fade-in duration-300">
                    <div className={`flex items-center gap-3 rounded-full px-5 py-3 text-sm font-medium shadow-lg ${
                        toast.type === 'critical' ? 'bg-red-600 text-white' :
                        toast.type === 'warning' ? 'bg-orange-500 text-white' :
                        'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900'
                    }`}>
                        {toast.type === 'critical' && <AlertTriangle className="h-4 w-4" />}
                        {toast.type === 'warning' && <Bell className="h-4 w-4" />}
                        {toast.type === 'info' && <Shield className="h-4 w-4" />}
                        {toast.message}
                    </div>
                </div>
            )}
        </>
    );
}