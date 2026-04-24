export class AtomicOps {
    static lock(buffer, index) {
        Atomics.wait(new Int32Array(buffer), index, 0);
    }
    static unlock(buffer, index) {
        Atomics.store(new Int32Array(buffer), index, 0);
    }
}
