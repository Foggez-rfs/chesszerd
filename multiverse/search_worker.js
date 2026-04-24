// search_worker.js — Исполнитель поиска в отдельном потоке
self.onmessage = function(e) {
    const result = search(e.data);
    self.postMessage(result);
};
function search(data) { return 0; }
