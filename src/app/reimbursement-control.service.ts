import { Injectable } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { validateIBAN } from 'ngx-iban-validator';
import { Direction, ExpenseType, Expense } from 'src/domain/expense';
import { Reimbursement } from 'src/domain/reimbursement';
import { expensesRequired } from './forms/validators/expenses-required.validator';
import { maxPlanExpenses } from './forms/validators/max-plan-expenses.validator';
import { validateCourseCode } from './forms/validators/course-code.validator';

const PLZ_PATTERN = /^[0-9]{5}$/;
const BIC_PATTERN = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

const SEPA_CODES =
  /^(BE|BG|DK|DE|EE|FI|FR|GR|GB|IE|IS|IT|HR|LV|LI|LT|LU|MT|MC|NL|NO|AT|PL|PT|RO|SM|SE|CH|SK|SI|ES|CZ|HU|CY)/;
const BIC_REQUIRED = /^(MC|SM|CH)/;

@Injectable({
  providedIn: 'root'
})
export class ReimbursementControlService {
  travelExpensesForm = this.formBuilder.group({
    course: this.formBuilder.nonNullable.group({
      code: ['', [Validators.required, validateCourseCode]],
      name: ['', Validators.required]
    }),
    participant: this.formBuilder.nonNullable.group({
      givenName: ['', Validators.required],
      surname: ['', Validators.required],
      sectionId: [0, Validators.required],
      zipCode: ['', [Validators.required, Validators.pattern(PLZ_PATTERN)]],
      city: ['', Validators.required]
    }),
    expenses: this.formBuilder.group(
      {
        inbound: this.formBuilder.array<Expense>([], maxPlanExpenses),
        onsite: this.formBuilder.array<Expense>([]),
        outbound: this.formBuilder.array<Expense>([], maxPlanExpenses)
      },
      { validators: expensesRequired }
    ),
    overview: this.formBuilder.nonNullable.group({
      iban: ['', [Validators.required, validateIBAN]],
      bic: ['', [Validators.required, Validators.pattern(BIC_PATTERN)]],
      note: [''],
      file: [undefined]
    })
  });

  constructor(private formBuilder: FormBuilder) {}

  get participantStep() {
    return this.travelExpensesForm.get('participant') as FormGroup;
  }

  get courseStep() {
    return this.travelExpensesForm.get('course') as FormGroup;
  }

  get expensesStep() {
    return this.travelExpensesForm.get('expenses') as FormGroup;
  }

  get overviewStep() {
    return this.travelExpensesForm.get('overview') as FormGroup;
  }

  getExpenses(direction: Direction): FormArray {
    return this.travelExpensesForm.get(`expenses.${direction}`) as FormArray;
  }

  getExpenseFormGroup(type: ExpenseType): FormGroup {
    const commonControls = {
      type: [type, Validators.required],
      origin: ['', Validators.required],
      destination: ['', Validators.required]
    };

    switch (type) {
      case 'car':
        return this.formBuilder.group({
          ...commonControls,
          distance: ['', [Validators.required, Validators.min(0)]],
          carType: ['', [Validators.required]],
          passengers: ['']
        });
      case 'train':
        return this.formBuilder.group({
          ...commonControls,
          price: ['', [Validators.required, Validators.min(0)]],
          discountCard: ['', [Validators.required]]
        });
      case 'plan':
        return this.formBuilder.group(commonControls);
      case 'bike':
        return this.formBuilder.group({
          ...commonControls,
          distance: ['', [Validators.required, Validators.min(0)]]
        });
    }
  }

  loadForm() {
    // parse JSON from local storage
    const travelExpensesData = localStorage.getItem('travelExpenses') || '{}';
    const travelExpenses = JSON.parse(travelExpensesData);
    this.travelExpensesForm.patchValue(travelExpenses);

    // create controls for form arrays
    for (let direction of ['inbound', 'onsite', 'outbound'] as Direction[]) {
      const expenses = travelExpenses.expenses[direction];
      if (expenses) {
        const formArray = this.getExpenses(direction);
        for (let expense of expenses) {
          const formRecord = this.getExpenseFormGroup(expense.type);
          formRecord.patchValue(expense);
          formArray.push(formRecord);
        }
      }
    }

    // mark controls with values as touched
    this.deepMarkAsDirty(this.travelExpensesForm);

    // update BIC field state
    this.updateBicState();
  }

  saveForm() {
    // TODO: exclude file field?
    const travelExpensesData = JSON.stringify(this.travelExpensesForm.value);
    localStorage.setItem('travelExpenses', travelExpensesData);
  }

  deleteStoredData(): void {
    localStorage.removeItem('travelExpenses');
  }

  updateBicState() {
    const iban = this.overviewStep.get('iban')!;
    const bic = this.overviewStep.get('bic')!;
    const enable =
      iban.valid &&
      (iban.value.match(BIC_REQUIRED) || !iban.value.match(SEPA_CODES));
    enable ? bic.enable() : bic.disable();
  }

  getExpense<T extends Expense>(expense: any): T {
    if (expense.type === 'car') {
      const carExpense = expense as any;
      const passengers = carExpense.passengers
        ? (carExpense.passengers as string)
            .split(',')
            .map(passenger => passenger.trim())
        : [];
      return { ...expense, passengers };
    }
    return expense;
  }

  getReimbursment(): Reimbursement {
    const v = this.travelExpensesForm.getRawValue();

    return {
      course: v.course,
      participant: {
        ...v.participant,
        iban: v.overview.iban,
        bic: v.overview.bic
      },
      expenses: {
        inbound: v.expenses.inbound.map(this.getExpense),
        onsite: v.expenses.onsite.map(this.getExpense),
        outbound: v.expenses.outbound.map(this.getExpense)
      },
      note: v.overview.note
    };
  }

  getOriginCompletion(direction: Direction): string {
    const expenses = this.getExpenses(direction);

    if (expenses.length === 0) {
      return direction === 'inbound' ? '' : this.getOriginCompletion('inbound');
    }

    const lastExpense = expenses.value[expenses.length - 1];
    return lastExpense.destination;
  }

  getCarTypeCompletion(): string {
    for (let direction of ['inbound', 'onsite', 'outbound'] as Direction[]) {
      const expenses = this.getExpenses(direction).getRawValue();
      const carExpense = expenses.find(expense => 'carType' in expense);
      if (carExpense) {
        return carExpense.carType;
      }
    }
    return '';
  }

  deepMarkAsDirty(parent: AbstractControl) {
    if (parent instanceof FormGroup) {
      Object.values(parent.controls).forEach(child =>
        this.deepMarkAsDirty(child)
      );
    } else if (parent instanceof FormArray) {
      parent.controls.forEach(child => this.deepMarkAsDirty(child));
    } else if (parent.value) {
      parent.markAsDirty();
      parent.markAsTouched();
    }
  }

  getDiscountCompletion(): string {
    for (let direction of ['inbound', 'onsite', 'outbound'] as Direction[]) {
      const expenses = this.getExpenses(direction).getRawValue();
      const carExpense = expenses.find(expense => 'discountCard' in expense);
      if (carExpense) {
        return carExpense.discountCard;
      }
    }
    return '';
  }

  completeReturnTrip(): void {
    const values = this.getExpenses('inbound').getRawValue();
    const outbound = this.getExpenses('outbound');
    outbound.clear();

    for (let i = values.length - 1; i >= 0; i--) {
      const value = values[i];

      // swap origin and destination
      let temp = value.origin;
      value.origin = value.destination;
      value.destination = temp;

      let control = this.getExpenseFormGroup(value.type);
      control.patchValue(value);
      outbound.push(control);
    }

    this.saveForm();
  }
}
