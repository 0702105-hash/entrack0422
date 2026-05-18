import React from 'react';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sky-200 p-6 md:p-10">
      <div className="mx-auto w-full max-w-[1400px] rounded-[36px] bg-sky-100 p-5 shadow-xl md:p-7">
        {children}
      </div>
    </div>
  );
}