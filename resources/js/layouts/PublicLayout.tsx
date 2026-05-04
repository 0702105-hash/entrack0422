import React from 'react';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-sky-100 p-4 md:p-8">
            <div className="mx-auto w-full max-w-[1400px] rounded-[32px] border border-white/50bg-emerald-50/80 p-4 shadow-xl backdrop-blur md:p-6">
            {children}
            </div>
        </div>
    )
}