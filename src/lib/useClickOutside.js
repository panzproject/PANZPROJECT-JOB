import { useEffect } from 'react';
export function useClickOutside(ref, open, onClose) {
    useEffect(() => {
        if (!open)
            return;
        const handlePointer = (event) => {
            const target = event.target;
            if (ref.current && !ref.current.contains(target))
                onClose();
        };
        const handleKey = (event) => {
            if (event.key === 'Escape')
                onClose();
        };
        document.addEventListener('mousedown', handlePointer);
        document.addEventListener('touchstart', handlePointer);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handlePointer);
            document.removeEventListener('touchstart', handlePointer);
            document.removeEventListener('keydown', handleKey);
        };
    }, [ref, open, onClose]);
}
