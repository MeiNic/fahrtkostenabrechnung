import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FormCardComponent } from 'src/app/shared/form-card/form-card.component';
import { ReimbursementControlService } from 'src/app/reimbursement/shared/reimbursement-control.service';

@Component({
  selector: 'app-meeting-course-step',
  templateUrl: './meeting-course-step.component.html',
  styleUrls: ['./meeting-course-step.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, FormCardComponent]
})
export class MeetingCourseStepComponent {
  form;

  constructor(
    public route: ActivatedRoute,
    public controlService: ReimbursementControlService
  ) {
    this.form = controlService.meetingStep;
    this.form.controls.type.setValue('course');

    this.route.queryParamMap.subscribe(params => {
      if (params.has('nummer') || params.has('name')) {
        this.form.patchValue({
          code: params.get('nummer') || '',
          name: params.get('name') || ''
        });
      }
    });
  }

  get code() {
    return this.form.controls.code;
  }

  get name() {
    return this.form.controls.name;
  }
}
