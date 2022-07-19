import * as yup from 'yup';
import {RequiredStringSchema} from 'yup/lib/string';
import {AnyObject, Maybe} from 'yup/lib/types';
import store from '@store/store';

yup.addMethod(yup.string, 'gdVariableNameMustBeUnique', function () {
  return this.test(
    'gdVariableNameMustBeUnique',
    'Variable name must be unique.',
    (value) => {
      // value :: string|null
      if (!value) return true;
      const {formulae} = store.getState().dgd.present;
      const names = formulae.map((f) => f.name);
      return !names.includes(value);
    }
  );
});

yup.addMethod(yup.string, 'gdFormulaIsValid', function () {
  return this.test('gdFormulaIsValid', 'formula must be valid.', (value) => {
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
    gdVariableNameMustBeUnique(): RequiredStringSchema<TType, TContext>;
    gdFormulaIsValid(): RequiredStringSchema<TType, TContext>;
  }
}

export default yup;
