export class Calculator {
    multiply(number1: number, number2: number) {
        return number1 * number2;
    }
    divide(number1: number, number2: number){
        if (number2 === 0){
            return null;
        }
        return number1 / number2;
    }
}
