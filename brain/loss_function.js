export function calculateLoss(predicted, actual) {
    return (predicted - actual) ** 2;
}
