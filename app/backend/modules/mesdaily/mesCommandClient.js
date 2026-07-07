'use strict';

function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timer };
}

async function postMesCommand(config, payload) {
  const url = String(config && config.url || '').trim();
  if (!url) {
    throw new Error('MES Daily API URL is not configured.');
  }

  const timeoutMs = Number(config.timeoutMs) > 0 ? Number(config.timeoutMs) : 30000;
  const { controller, timer } = createTimeoutSignal(timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (error) {
      const contentType = response.headers && response.headers.get ? response.headers.get('content-type') : '';
      throw new Error(`MES Daily API returned non-JSON response (HTTP ${response.status}, content-type: ${contentType || 'unknown'}).`);
    }

    if (!response.ok) {
      throw new Error(`MES Daily API HTTP ${response.status}: ${data && data.Message ? data.Message : response.statusText}`);
    }

    if (!data || data.Result === false) {
      throw new Error(`MES Daily API failed: ${data && data.Message ? data.Message : 'Unknown MES error'}`);
    }

    return data;
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw new Error(`MES Daily API timed out after ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  postMesCommand,
};
