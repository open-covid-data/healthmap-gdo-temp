import { useState, useEffect } from 'react';

// Custom hook for debouncing
export const useDebounce: (value: string, delay: number) => string = (
    value,
    delay,
) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
};
