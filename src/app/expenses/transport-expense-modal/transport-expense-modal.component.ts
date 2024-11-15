import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

import { Component, Inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { TransportExpenseForm } from 'src/app/expenses/shared/expense-form';
import { TransportMode } from 'src/domain/expense.model';
import { ExpenseTitlePipe } from '../shared/expense-title.pipe';
import { TransportModePipe } from '../shared/transport-mode.pipe';
import { RawFormValue } from 'src/app/shared/form-value';

export interface TransportExpenseDialogData {
  allowedModes: TransportMode[];
  form: FormGroup<TransportExpenseForm>;
}

@Component({
  selector: 'app-transport-expense-modal',
  templateUrl: './transport-expense-modal.component.html',
  styleUrls: ['./transport-expense-modal.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, ExpenseTitlePipe, TransportModePipe]
})
export class TransportExpenseModalComponent {
  form: FormGroup<TransportExpenseForm>;
  allowedModes: TransportMode[];

  initialFormValue: RawFormValue<TransportExpenseForm>;

  constructor(
    private dialogRef: DialogRef<FormGroup<TransportExpenseForm>>,
    @Inject(DIALOG_DATA) data: TransportExpenseDialogData
  ) {
    this.form = data.form;
    this.allowedModes = data.allowedModes;

    this.initialFormValue = this.form.getRawValue();

    this.dialogRef.closed.subscribe(() => {
      if (!this.form.valid) {
        this.form.reset(this.initialFormValue);
      }
    });
  }

  get mode() {
    return this.form.controls.mode;
  }

  get origin() {
    return this.form.controls.origin;
  }

  get destination() {
    return this.form.controls.destination;
  }

  get distance() {
    return this.form.controls.distance;
  }

  get train() {
    return this.form.controls.train;
  }

  get car() {
    return this.form.controls.car;
  }

  getIcon(mode: TransportMode) {
    switch (mode) {
      case 'car':
        return '&#xe531;';
      case 'train':
        return '&#xe570;';
      case 'plan':
        return '&#xe8f8;';
      case 'bike':
        return '&#xeb29;';
    }
  }

  chooseExpense(mode: TransportMode) {
    this.mode.setValue(mode);
  }

  addPassenger() {
    const control = new FormControl('', {
      nonNullable: true,
      validators: Validators.required
    });

    const passengers = this.car?.controls.passengers;
    passengers?.push(control);
  }

  removePassenger(index: number) {
    const passengers = this.car?.controls.passengers;
    passengers?.removeAt(index);
  }

  submitForm() {
    if (this.form.valid) {
      this.dialogRef.close(this.form);
    }
  }
}
