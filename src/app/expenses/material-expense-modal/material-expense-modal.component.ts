import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

import { Component, Inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MaterialExpenseForm } from 'src/app/expenses/shared/expense-form';
import { RawFormValue } from 'src/app/shared/form-value';

@Component({
  selector: 'app-material-expense-modal',
  templateUrl: './material-expense-modal.component.html',
  styleUrls: ['./material-expense-modal.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, MatDatepickerModule]
})
export class MaterialExpenseModalComponent {
  form: FormGroup<MaterialExpenseForm>;

  initialFormValue: RawFormValue<MaterialExpenseForm>;

  constructor(
    private dialogRef: DialogRef<FormGroup<MaterialExpenseForm>>,
    @Inject(DIALOG_DATA) data: { form: FormGroup<MaterialExpenseForm> }
  ) {
    this.form = data.form;

    this.initialFormValue = this.form.getRawValue();

    this.dialogRef.closed.subscribe(() => {
      if (!this.form.valid) {
        this.form.reset(this.initialFormValue);
      }
    });
  }

  get date() {
    return this.form.controls.date;
  }

  get purpose() {
    return this.form.controls.purpose;
  }

  get amount() {
    return this.form.controls.amount;
  }

  get now() {
    return new Date();
  }

  submitForm() {
    if (this.form.valid) {
      this.dialogRef.close(this.form);
    }
  }
}
