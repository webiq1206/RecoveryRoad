import { WorkbookSection } from '../../types';
import { WORKBOOK_SECTIONS_1_5 } from './sections1-5';
import { WORKBOOK_SECTIONS_6_10 } from './sections6-10';
import { WORKBOOK_SECTIONS_11_15 } from './sections11-15';
import { WORKBOOK_SECTIONS_16_20 } from './sections16-20';
import { WORKBOOK_SECTIONS_21_25 } from './sections21-25';

export const WORKBOOK_SECTIONS: WorkbookSection[] = [
  ...WORKBOOK_SECTIONS_1_5,
  ...WORKBOOK_SECTIONS_6_10,
  ...WORKBOOK_SECTIONS_11_15,
  ...WORKBOOK_SECTIONS_16_20,
  ...WORKBOOK_SECTIONS_21_25,
];
