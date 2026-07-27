export function resolveView(el) {
    return el._view
        ?? el.closest?.('[data-graph-id]')?._view3d;
}

export function waitForView(el, callback) {
    const view = resolveView(el);
    if (view) { callback(view); return () => {}; }

    let done = false;
    const finish = (view) => {
        if (done) return;
        done = true;
        observer.disconnect();
        window.removeEventListener('graph-ready', onReady);
        callback(view);
    };

    const onReady = () => {
        const view = resolveView(el);
        if (view) finish(view);
    };

    const observer = new MutationObserver(() => {
        const view = resolveView(el);
        if (view) finish(view);
    });

    window.addEventListener('graph-ready', onReady, { once: true });
    observer.observe(el.parentElement?.parentElement ?? document.body, {
        attributes: true,
        subtree: true,
        attributeFilter: ['data-graph-id'],
    });

    return () => {
        done = true;
        observer.disconnect();
        window.removeEventListener('graph-ready', onReady);
    };
}
