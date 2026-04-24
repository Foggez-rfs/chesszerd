export class HogyokuPersistence {
    constructor() {
        this.storageKey = 'hogyoku_weights';
    }
    async save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch(e) { return false; }
    }
    async load(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch(e) { return null; }
    }
    async init() { return true; }
}
