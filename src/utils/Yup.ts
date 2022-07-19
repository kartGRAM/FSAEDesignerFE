import * as yup from 'yup';
import {RequiredStringSchema} from 'yup/lib/string';
import {AnyObject, Maybe} from 'yup/lib/types';
import store from '@store/store';

export interface IFormula {
  name: string;
  formula: string;
  readonly evaluatedValue: number;
  readonly absPath: string;
}

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

yup.addMethod(
  yup.string,
  'gdVariableNameMustBeUnique',
  function (formulae?: IFormula[]) {
    return this.test(
      'gdVariableNameMustBeUnique',
      'Variable name must be unique.',
      (value) => {
        // value :: string|null
        if (!value) return true;
        if (formulae) {
          const names = formulae.map((f) => f.name);
          return !names.includes(value);
        }
        const dataFormulae = store.getState().dgd.present.formulae;
        const names = dataFormulae.map((f) => f.name);
        return !names.includes(value);
      }
    );
  }
);

yup.addMethod(yup.string, 'gdFormulaIsValid', function () {
  return this.test('gdFormulaIsValid', 'Invalid formula.', (value) => {
    // value :: string|null
    if (!value) return true;
    return true;
  });
});

declare module 'yup' {
  interface StringSchema<
    TType extends Maybe<string> = string | undefined,
    TContext extends AnyObject = AnyObject,
    TOut extends TType = TType
  > extends yup.BaseSchema<TType, TContext, TOut> {
    gdVariableNameMustBeUnique(
      formulae?: IFormula[]
    ): RequiredStringSchema<TType, TContext>;
    gdFormulaIsValid(): RequiredStringSchema<TType, TContext>;
    variableNameFirstChar(): RequiredStringSchema<TType, TContext>;
    variableName(): RequiredStringSchema<TType, TContext>;
  }
}

export default yup;
