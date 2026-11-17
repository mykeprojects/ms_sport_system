import { Matches } from 'class-validator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class UpdateContractDto {
  @Matches(DATE, { message: 'Date must use the yyyy-mm-dd format.' })
  startDate: string;

  @Matches(DATE, { message: 'Date must use the yyyy-mm-dd format.' })
  endDate: string;
}
