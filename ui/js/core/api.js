async function checkServer() {
    try {
        const c = new AbortController();
        const timeout = setTimeout(() => c.abort(), 1500);
        const res = await fetch('/api/health', { method: 'GET', cache: 'no-store', signal: c.signal });
        clearTimeout(timeout);
        serverOnline = res.ok;
        return res.ok;
    } catch (_) {
        serverOnline = false;
        return false;
    }
}


async function fetchRetry(url, options = {}, retries = MAX_RETRIES) {
    let lastErr = null;
    for (let i = 0; i <= retries; i++) {
        try {
            const res = await fetch(url, options);
            serverOnline = true;
            return res;
        } catch (err) {
            lastErr = err;
            logToConsole(`Connection attempt ${i + 1}/${retries + 1} failed: ${err.message}`, 'warning');
            if (i < retries) {
                await sleep(RETRY_DELAY);
                const alive = await checkServer();
                if (!alive) logToConsole('Server not responding, retrying...', 'warning');
            }
        }
    }
    serverOnline = false;
    throw lastErr || new Error('Server not reachable');
}


async function fetchModelNameFromDataFile(file) {
    if (!file) return '';
    const formData = new FormData();
    formData.append('data', file);
    const response = await fetchRetry('/api/inspect-model', { method: 'POST', body: formData }, 1);
    const result = await response.json();
    if (!response.ok || !result.success || !result.model) {
        throw createBackendError(result, 'Cannot read MODEL_NAME from data file.');
    }
    return String(result.model).trim();
}


async function browseSaveViaDesktopHost(defaultFileName) {
    try {
        const host = window?.chrome?.webview?.hostObjects?.sync?.clcaHost;
        if (!host || typeof host.BrowseSave !== 'function') {
            return { available: false, path: null };
        }
        const selectedPath = host.BrowseSave(defaultFileName);
        const normalizedPath = typeof selectedPath === 'string' ? selectedPath.trim() : '';
        return { available: true, path: normalizedPath || null };
    } catch (error) {
        return { available: true, path: null, error: error?.message || String(error) };
    }
}
