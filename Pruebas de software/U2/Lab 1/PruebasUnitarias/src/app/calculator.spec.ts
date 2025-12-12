import { Calculator } from './calculator';

// simplificar los Arrange
let calculator: any;

beforeEach(() => {
  calculator = new Calculator();
});

describe('Calculator', () => {
  describe(' Test multiply method', () => {
    it('should return twelve', () => {
      let number1 = 4;
      let number2 = 3;
      let expected = 12;

      // Act
      let result = calculator.multiply(number1, number2);

      // Assert 
      expect(result).toEqual(expected);
    });
  });
  describe(' Test divide method', () => {
    it('divide for a number', () => {
      // Act & Assert
      expect(calculator.divide(6, 2)).toEqual(3);
      expect(calculator.divide(15, 2)).toEqual(7.5);
    });

    it('divide for zero', () => {
      // Act & Assert
      expect(calculator.divide(20, 0)).toBeNull();
      expect(calculator.divide(155, 0)).toBeNull();
      expect(calculator.divide(561254, 0)).toBeNull();
    });
  });

  describe( ' Test Matchers', () => {
    it('test of matchers', () => {
      let name = 'Moises';
      let name2 = '';

      expect(name).toBeDefined();
      expect(name2).toBeUndefined();

      expect(1 + 1 === 2).toBeTruthy();
      expect(1 + 1 === 3).toBeFalsy();
      
      expect(4).toBeLessThan(19);
      expect(50).toBeGreaterThan(5);

      expect('Evalua cadenas de texto').toContain('/aden/');
      expect(['chair', 'table', 'desk']).toContain('desk');
    });
  });
});

