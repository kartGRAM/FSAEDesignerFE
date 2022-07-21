import * as yup from 'yup';
import {RequiredStringSchema} from 'yup/lib/string';
import {AnyObject, Maybe} from 'yup/lib/types';
import store from '@store/store';
import {IDataFormula, mathFunctions} from '@gd/DataFormula';
import {validate} from '@gd/Formula';

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
  function (
    formulae?: IDataFormula[],
    temporaryName?: string,
    onValidated?: (formula: string) => void
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
      onValidated?: (formula: string) => void
    ): RequiredStringSchema<TType, TContext>;
    variableNameFirstChar(): RequiredStringSchema<TType, TContext>;
    variableName(): RequiredStringSchema<TType, TContext>;
    noMathFunctionsName(): RequiredStringSchema<TType, TContext>;
  }
}

export default yup;
