// brain/nn_core.js — Автономная нейросеть Chesszerd
// "Ты думаешь, мне нужны чужие API? Я сам создаю реальность." — Айзен

export class NNCore {
    constructor(layers = [768, 512, 256, 128, 1]) {
        this.layers = layers;
        this.weights = [];
        this.biases = [];
        this.initWeights();
    }

    // Инициализация весов (Xavier/Glorot)
    initWeights() {
        for (let i = 0; i < this.layers.length - 1; i++) {
            const fanIn = this.layers[i];
            const fanOut = this.layers[i + 1];
            const std = Math.sqrt(2.0 / (fanIn + fanOut));
            
            const w = new Array(fanIn * fanOut);
            for (let j = 0; j < w.length; j++) {
                w[j] = this.randn() * std;
            }
            this.weights.push(w);
            
            const b = new Array(fanOut).fill(0.01);
            this.biases.push(b);
        }
    }

    randn() {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    // ReLU активация
    relu(x) { return Math.max(0, x); }
    reluDerivative(x) { return x > 0 ? 1 : 0; }

    // Прямое распространение
    forward(input) {
        this.layerOutputs = [input];
        this.layerInputs = [];
        
        let current = input;
        for (let i = 0; i < this.weights.length; i++) {
            const w = this.weights[i];
            const b = this.biases[i];
            const fanOut = this.layers[i + 1];
            const next = new Array(fanOut).fill(0);
            
            for (let j = 0; j < fanOut; j++) {
                let sum = b[j];
                for (let k = 0; k < current.length; k++) {
                    sum += current[k] * w[k * fanOut + j];
                }
                next[j] = this.relu(sum);
            }
            
            this.layerInputs.push(current);
            current = next;
            this.layerOutputs.push(current);
        }
        
        // Последний слой — tanh для оценки [-1, 1]
        return Math.tanh(current[0]);
    }

    // Обратное распространение (SGD)
    backward(target, learningRate = 0.001) {
        const output = this.layerOutputs[this.layerOutputs.length - 1];
        const loss = (output[0] - target) * (1 - Math.tanh(output[0]) ** 2);
        
        let deltas = [loss];
        
        for (let i = this.weights.length - 1; i >= 0; i--) {
            const w = this.weights[i];
            const fanIn = this.layers[i];
            const fanOut = this.layers[i + 1];
            const layerOutput = this.layerOutputs[i];
            
            const newDeltas = new Array(fanIn).fill(0);
            for (let j = 0; j < fanOut; j++) {
                const d = deltas[0] * this.reluDerivative(layerOutput[j] || 0);
                for (let k = 0; k < fanIn; k++) {
                    newDeltas[k] += d * w[k * fanOut + j];
                    w[k * fanOut + j] -= learningRate * d * (this.layerInputs[i]?.[k] || 0);
                }
                this.biases[i][j] -= learningRate * d;
            }
            deltas = [newDeltas];
        }
        
        return Math.abs(output[0] - target);
    }

    // Сохранение весов для Хогьёку
    exportWeights() {
        return JSON.stringify({
            weights: this.weights,
            biases: this.biases,
            layers: this.layers
        });
    }

    // Загрузка весов
    importWeights(json) {
        try {
            const data = JSON.parse(json);
            this.weights = data.weights;
            this.biases = data.biases;
            this.layers = data.layers;
            return true;
        } catch(e) {
            return false;
        }
    }
}
