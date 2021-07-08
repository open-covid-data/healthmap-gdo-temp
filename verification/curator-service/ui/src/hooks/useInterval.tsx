import { useEffect, useRef } from 'react';

/**
 * Custom hook to perform actions on an interval.
 *
 *   https://reactjs.org/docs/hooks-custom.html
 *   https://overreacted.io/making-setinterval-declarative-with-react-hooks/
 */
export function useInterval(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (...args: any[]) => any,
    delayMs: number,
): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const savedCallback = useRef<(...args: any[]) => any>();

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        function tick(): void {
            if (savedCallback.current) {
                savedCallback.current();
            }
        }
        const id = setInterval(tick, delayMs);
        return (): void => clearInterval(id);
    }, [delayMs]);
}
