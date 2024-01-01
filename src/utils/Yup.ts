import * as yup from 'yup';
import {RequiredStringSchema} from 'yup/lib/string';
import {AnyObject, Maybe} from 'yup/lib/types';
import store from '@store/store';
import {IDataFormula, mathFunctions} from '@gd/IFormula';
import {validate, evaluate} from '@gd/Formula';
import {isNumber} from '@utils/helpers';

// eslint-disable-next-line func-names
yup.addMethod(yup.string, 'variableNameFirstChar', function () {
  return this.test(
    'variableNameFirstChar',
    'Variable names must begin with an alphabetic character or _.',
    (value) => {
      // value :: string|null
      if (!value) return true;
      return /^[a-zA-Z_]/.test(value);
    }
  );
});
// eslint-disable-next-line func-names
yup.addMethod(yup.string, 'variableName', function () {
  return this.test(
    'variableName',
    'Variable names must consist of alphanumeric characters and _ only.',
    (value) => {
      // value :: string|null
      if (!value) return true;
      return /^[a-zA-Z_0-9]+$/.test(value);
    }
  );
});

// eslint-disable-next-line func-names
yup.addMethod(yup.string, 'numberArray', function (integer?: boolean) {
  return this.test('numberArray', '', (input, {createError}) => {
    if (!input) return true;
    const woSpace = input.replace(' ', '');
    const values = woSpace.split(',');
    for (const value of values) {
      if (!isNumber(value)) {
        return createError({
          message: 'Invalid number array'
        });
      }
      if (integer && !Number.isInteger(value)) {
        return createError({
          message: 'Each number must be integer'
        });
      }
    }
    return true;
  });
});

// eslint-disable-next-line func-names
yup.addMethod(yup.string, 'arrayMax', function (max: number) {
  return this.test('arrayMax', '', (input, {createError}) => {
    if (!input) return true;
    const woSpace = input.replace(' ', '');
    const values = woSpace.split(',');
    for (const value of values) {
      if (Number(value) > max) {
        return createError({
          message: `Each number must be less than ${max}.`
        });
      }
    }
    return true;
  });
});

// eslint-disable-next-line func-names
yup.addMethod(yup.string, 'arrayMin', function (min: number) {
  return this.test('arrayMax', '', (input, {createError}) => {
    if (!input) return true;
    const woSpace = input.replace(' ', '');
    const values = woSpace.split(',');
    for (const value of values) {
      if (Number(value) < min) {
        return createError({
          message: `Each number must be greater than ${min}.`
        });
      }
    }
    return true;
  });
});

// eslint-disable-next-line func-names
yup.addMethod(yup.string, 'noMathFunctionsName', function () {
  return this.test(
    'noMathFunctionsName',
    "You can't use the same name as math functions.",
    (value) => {
      // value :: string|null
      if (!value) return true;
      return !mathFunctions.includes(value);
    }
  );
});

yup.addMethod(
  yup.string,
  'gdVariableNameMustBeUnique',
  // eslint-disable-next-line func-names
  function (formulae?: IDataFormula[], except?: string) {
    return this.test(
      'gdVariableNameMustBeUnique',
      'Variable name must be unique.',
      (value) => {
        // value :: string|null
        if (!value) return true;
        if (formulae) {
          const names = formulae.map((f) => f.name);
          return except === value || !names.includes(value);
        }
        const dataFormulae = store.getState().dgd.present.formulae;
        const names = dataFormulae.map((f) => f.name);
        return except === value || !names.includes(value);
      }
    );
  }
);

yup.addMethod(
  yup.string,
  'gdFormulaIsValid',
  // eslint-disable-next-line func-names
  function (
    formulae?: IDataFormula[],
    temporaryName?: string,
    onValidated?: (formula: string) => void,
    onInvalidated?: (formula: string) => void
  ) {
    return this.test('gdFormulaIsValid', '', (value, {createError}) => {
      if (!value) return true;
      if (!formulae) {
        formulae = store.getState().dgd.present.formulae;
      }
      const ret = validate(
        {
          name: temporaryName ?? 'temporary',
          formula: value,
          absPath: 'temporary'
        },
        formulae
      );
      if (ret === 'OK' && onValidated) {
        onValidated(value);
      } else if (onInvalidated) {
        onInvalidated(value);
      }
      return (
        ret === 'OK' ||
        createError({
          message: ret
        })
      );
    });
  }
);

yup.addMethod(
  yup.string,
  'gdFormulaPositive',
  // eslint-disable-next-line func-names
  function () {
    return this.test('gdFormulaPositive', '', (value, {createError}) => {
      if (!value) return true;
      const ret = evaluate({formula: value});
      return (
        ret > 0 ||
        createError({
          message: 'The evaluation value must be a positive value.'
        })
      );
    });
  }
);

yup.addMethod(
  yup.string,
  'gdFormulaNonZero',
  // eslint-disable-next-line func-names
  function () {
    return this.test('gdFormulaNonZero', '', (value, {createError}) => {
      if (!value) return true;
      const ret = evaluate({formula: value});
      return (
        Math.abs(ret) > Number.EPSILON ||
        createError({
          message: 'The evaluation value must be a non-zero value.'
        })
      );
    });
  }
);

yup.addMethod(
  yup.string,
  'gdFormulaInteger',
  // eslint-disable-next-line func-names
  function () {
    return this.test('gdFormulaInteger', '', (value, {createError}) => {
      if (!value) return true;
      const ret = evaluate({formula: value});
      return (
        Number.isInteger(ret) ||
        createError({
          message: 'The evaluation value must be a integer.'
        })
      );
    });
  }
);

yup.addMethod(
  yup.string,
  'gdFormulaStepValid',
  // eslint-disable-next-line func-names
  function (start: number | null, end: number | null) {
    return this.test('gdFormulaStepValid', '', (value, {createError}) => {
      if (!value) return true;
      if (start === null || end === null)
        return createError({
          message: 'Start value or End value is invalid.'
        });
      const ret = evaluate({formula: value});
      return (
        (start < end ? ret > 0 : ret < 0) ||
        createError({
          message: 'The evaluation value must be a valid step value.'
        })
      );
    });
  }
);

declare module 'yup' {
  interface StringSchema<
    TType extends Maybe<string> = string | undefined,
    TContext extends AnyObject = AnyObject,
    TOut extends TType = TType
  > extends yup.BaseSchema<TType, TContext, TOut> {
    gdVariableNameMustBeUnique(
      formulae?: IDataFormula[],
      except?: string
    ): RequiredStringSchema<TType, TContext>;
    gdFormulaIsValid(
      formulae?: IDataFormula[],
      temporaryName?: string,
      onValidated?: (formula: string) => void,
      onInvalidated?: (formula: string) => void
    ): RequiredStringSchema<TType, TContext>;
    variableNameFirstChar(): RequiredStringSchema<TType, TContext>;
    gdFormulaPositive(): RequiredStringSchema<TType, TContext>;
    gdFormulaNonZero(): RequiredStringSchema<TType, TContext>;
    gdFormulaInteger(): RequiredStringSchema<TType, TContext>;
    gdFormulaStepValid(
      start: number | null,
      end: number | null
    ): RequiredStringSchema<TType, TContext>;
    variableName(): RequiredStringSchema<TType, TContext>;
    numberArray(integer: boolean): RequiredStringSchema<TType, TContext>;
    arrayMax(max: number): RequiredStringSchema<TType, TContext>;
    arrayMin(min: number): RequiredStringSchema<TType, TContext>;
    noMathFunctionsName(): RequiredStringSchema<TType, TContext>;
  }
}

export default yup;
