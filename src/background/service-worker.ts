import type { ExtensionMessage, StoreAnalysis } from '@/types';

const STORAGE_KEY = 'sbos_analyses';
const MAX_CACHED = 50;

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === 'ANALYZE_PAGE') {
    chrome.tabs.query({ active:true, currentWindow:true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) { sendResponse({ type:'ANALYSIS_ERROR', error:'No active tab' }); return; }
      chrome.tabs.sendMessage(tab.id, { type:'ANALYZE_PAGE' } as ExtensionMessage, (response: ExtensionMessage) => {
        if (chrome.runtime.lastError) {
          chrome.scripting.executeScript({ target:{ tabId:tab.id! }, files:['content.js'] })
            .then(() => setTimeout(() => {
              chrome.tabs.sendMessage(tab.id!, { type:'ANALYZE_PAGE' } as ExtensionMessage, (r: ExtensionMessage) => {
                if (r?.data) cacheAnalysis(r.data);
                sendResponse(r ?? { type:'ANALYSIS_ERROR', error:'Analysis failed' });
              });
            }, 500))
            .catch(err => sendResponse({ type:'ANALYSIS_ERROR', error:String(err) }));
          return;
        }
        if (response?.data) cacheAnalysis(response.data);
        sendResponse(response ?? { type:'ANALYSIS_ERROR', error:'No response' });
      });
    });
    return true;
  }
  if (message.type === 'GET_TAB_ANALYSIS') {
    chrome.tabs.query({ active:true, currentWindow:true }, async (tabs) => {
      const tab = tabs[0];
      if (!tab?.url) { sendResponse(null); return; }
      sendResponse(await getCachedAnalysis(tab.url));
    });
    return true;
  }
  return false;
});

async function cacheAnalysis(a: StoreAnalysis): Promise<void> {
  try {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const cache: Record<string,StoreAnalysis> = data[STORAGE_KEY]??{};
    cache[a.url] = a;
    const entries = Object.entries(cache);
    if (entries.length > MAX_CACHED) { entries.sort((x,y)=>x[1].timestamp-y[1].timestamp); for (const [k] of entries.slice(0,entries.length-MAX_CACHED)) delete cache[k]; }
    await chrome.storage.local.set({ [STORAGE_KEY]:cache });
  } catch(e) { console.error('[SBOS] Cache error:', e); }
}

async function getCachedAnalysis(url: string): Promise<StoreAnalysis|null> {
  try { const d = await chrome.storage.local.get(STORAGE_KEY); return (d[STORAGE_KEY]??{})[url]??null; } catch { return null; }
}

chrome.tabs.onActivated.addListener(i => chrome.runtime.sendMessage({ type:'TAB_CHANGED', tabId:i.tabId } as ExtensionMessage).catch(()=>{}));
chrome.tabs.onUpdated.addListener((id,info) => { if(info.status==='complete') chrome.runtime.sendMessage({ type:'TAB_CHANGED', tabId:id } as ExtensionMessage).catch(()=>{}); });
