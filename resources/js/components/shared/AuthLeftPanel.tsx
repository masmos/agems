import AppLogoIcon from '@/components/app-logo-icon';
import { Link, usePage } from '@inertiajs/react';
import { Mail, PhoneCallIcon } from 'lucide-react';

export default function AuthLeftPanel() {
    const currentYear = new Date().getFullYear();

    return (
        <div className="relative hidden h-full flex-col bg-zinc-900 bg-cover bg-center bg-no-repeat p-10 text-white lg:flex dark:border-r"
            style={{ backgroundImage: `url('/images/bg01.jpg')` }} >
            <div className="absolute inset-0 bg-green-950/90" />

            {/* Logo */}
            <Link href={'home'} className="relative z-20 mb-10 flex items-center text-lg font-medium">
                <AppLogoIcon className="mr-2 h-12 fill-current text-white" />
                Albertine Graben 
            </Link>

            {/* Main Content */}
            <div className="relative z-20 flex flex-grow flex-col justify-between">
                <div>
                    <h1 className="mb-4 text-4xl font-semibold">Albertine Graben Environmental & Flare Monitoring</h1>
                    <p className="text-xl leading-relaxed text-neutral-300">
                        Welcome to the Albertine Graben Monitoring System — a centralized web platform for managing environmental data, 
                        flare monitoring, and related information efficiently and securely
                    </p>
                </div>

                {/* Footer Contact Info */}
                <div className="mt-auto space-y-2 text-sm text-neutral-300">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 p-2">
                                <Mail className="size-8 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <strong className="text-sm text-muted-foreground">Email Support</strong>
                                <a href="mailto:servicedesk@nema.co.ug" className="text-md text-white opacity-90">
                                    servicedesk@nema.co.ug
                                </a>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 p-2">
                                <PhoneCallIcon className="size-8" />
                            </div>
                            <div className="flex flex-col">
                                <strong className="text-sm text-muted-foreground">Phone Support</strong>
                                <div className="flex items-center gap-2">
                                    <a href="tel:+256758881085" className="text-md text-white opacity-90">
                                        +256 758881085
                                    </a>
                                    <span className="text-md">|</span>
                                    <a href="tel:+256 781960154" className="text-md text-white opacity-90">
                                        +256 781960154
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="pt-6 text-center text-sm text-neutral-500">&copy; {currentYear} AGEMS. All rights reserved | Version 1.0</p>
                </div>
            </div>
        </div>
    );
}
