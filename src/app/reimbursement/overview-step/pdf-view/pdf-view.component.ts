import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SectionService } from 'src/app/core/section.service';
import { logoBase64 } from 'src/assets/logoBase64';
import { Direction } from 'src/domain/expense.model';
import { Reimbursement } from 'src/domain/reimbursement.model';
import { Section } from 'src/domain/section.model';
import { MeetingTypePipe } from 'src/app/reimbursement/shared/meeting-type.pipe';
import { DirectionPipe } from 'src/app/reimbursement/shared/direction.pipe';
import { ExpenseTitlePipe } from 'src/app/expenses/shared/expense-title.pipe';
import { ExpenseAmountPipe } from 'src/app/expenses/shared/expense-amount.pipe';
import { ExpenseDetailsComponent } from 'src/app/expenses/shared/expense-details/expense-details.component';
import { ReimbursementService } from '../../shared/reimbursement.service';

@Component({
  selector: 'app-pdf-view',
  templateUrl: './pdf-view.component.html',
  styleUrls: ['./pdf-view.component.css'],
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    MeetingTypePipe,
    DirectionPipe,
    ExpenseTitlePipe,
    ExpenseAmountPipe,
    ExpenseDetailsComponent
  ]
})
export class PdfViewComponent {
  @Input({ required: true })
  reimbursement!: Reimbursement;

  @Output()
  fullyRendered = new EventEmitter<void>();

  section?: Section;

  constructor(
    private readonly reimbursementService: ReimbursementService,
    private readonly sectionService: SectionService
  ) {}

  get meeting() {
    return this.reimbursement.meeting;
  }

  get participant() {
    return this.reimbursement.participant;
  }

  get now() {
    return new Date();
  }

  get directions(): Direction[] {
    return ['inbound', 'onsite', 'outbound'];
  }

  get report() {
    return this.reimbursementService.getReport(this.reimbursement);
  }

  ngOnInit() {
    const sectionId = this.reimbursement.participant.sectionId;
    this.section = this.sectionService.getSection(sectionId);
  }

  ngAfterViewInit() {
    this.fullyRendered.emit();
  }

  getLogo() {
    return logoBase64;
  }
}
