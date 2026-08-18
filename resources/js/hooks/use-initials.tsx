import { useMemo } from 'react';

export function useInitials(name?: string | null) {
    return useMemo(() => {
        if (!name || typeof name !== 'string') {
            return 'U'; // 'U' for User, or you can use '?'
        }

        const parts = name.trim().split(' ');
        
        if (parts.length === 0) return 'U';
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }, [name]);
}