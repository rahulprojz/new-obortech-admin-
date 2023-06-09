export function logExecTime(tag) {
    const now = performance.now();
    return () => {
        const now2 = performance.now();
        console.log(`${tag} took ${now2 - now}ms`);
        return now2 - now;
    };
}
