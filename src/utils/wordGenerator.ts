import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
  HeadingLevel,
  ShadingType,
  BorderStyle,
  Footer,
  PageNumber,
} from 'docx';
import { StudentRecord } from '../data/defaultAttendance';

export interface DiscrepancyRowData {
  date: string;
  fnPresentAnAbsentRolls: string[];
  fnAbsentAnPresentRolls: string[];
  fnPresentAnAbsentStudents?: StudentRecord[];
  fnAbsentAnPresentStudents?: StudentRecord[];
}

export interface WordExportOptions {
  documentTitle?: string;
  institutionName?: string;
  academicYear?: string;
  departmentName?: string;
  includeStudentNames?: boolean;
  rollNumberFormat?: 'comma' | 'newline' | 'numbered';
  includeSummaryTable?: boolean;
  includeAbsenteeList?: boolean;
  notes?: string;
}

/**
 * Calculates discrepancy data for each date given the list of students
 */
export function calculateDiscrepancies(
  students: StudentRecord[],
  dates: string[]
): DiscrepancyRowData[] {
  return dates.map((date) => {
    const fnPresentAnAbsent: StudentRecord[] = [];
    const fnAbsentAnPresent: StudentRecord[] = [];

    students.forEach((student) => {
      const att = student.attendance[date];
      if (!att) return;
      const isFnAbsent = att.fn.toUpperCase() === 'A';
      const isAnAbsent = att.an.toUpperCase() === 'A';

      if (!isFnAbsent && isAnAbsent) {
        // FN Present (not A) and AN Absent (A)
        fnPresentAnAbsent.push(student);
      } else if (isFnAbsent && !isAnAbsent) {
        // FN Absent (A) and AN Present (not A)
        fnAbsentAnPresent.push(student);
      }
    });

    return {
      date,
      fnPresentAnAbsentRolls: fnPresentAnAbsent.map((s) => s.rollNo),
      fnAbsentAnPresentRolls: fnAbsentAnPresent.map((s) => s.rollNo),
      fnPresentAnAbsentStudents: fnPresentAnAbsent,
      fnAbsentAnPresentStudents: fnAbsentAnPresent,
    };
  });
}

/**
 * Formats roll numbers and student names according to selected format
 */
function formatRollNumbersAndNames(
  students: StudentRecord[],
  rolls: string[],
  includeNames: boolean,
  format: 'comma' | 'newline' | 'numbered'
): Paragraph[] {
  if (rolls.length === 0) {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: 'None (Nil)',
            italics: true,
            color: '6B7280',
            size: 20,
          }),
        ],
      }),
    ];
  }

  const items = rolls.map((roll, idx) => {
    const student = students.find((s) => s.rollNo === roll);
    const nameStr = student && student.name ? student.name : '';
    const prefix = format === 'numbered' ? `${idx + 1}. ` : '';

    if (includeNames && nameStr) {
      return {
        prefix,
        roll,
        name: ` (${nameStr})`,
      };
    }
    return {
      prefix,
      roll,
      name: '',
    };
  });

  if (format === 'comma') {
    const runs: TextRun[] = [];
    items.forEach((item, idx) => {
      runs.push(
        new TextRun({
          text: item.roll,
          bold: true,
          size: 20,
          font: 'Arial',
          color: '0F172A',
        })
      );
      if (item.name) {
        runs.push(
          new TextRun({
            text: item.name,
            size: 19,
            font: 'Arial',
            color: '334155',
          })
        );
      }
      if (idx < items.length - 1) {
        runs.push(
          new TextRun({
            text: ', ',
            size: 20,
            font: 'Arial',
            color: '64748B',
          })
        );
      }
    });

    return [
      new Paragraph({
        children: runs,
        spacing: { after: 40 },
      }),
    ];
  }

  // Newline / numbered
  return items.map(
    (item) =>
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: item.prefix,
            size: 20,
            font: 'Arial',
            color: '64748B',
          }),
          new TextRun({
            text: item.roll,
            bold: true,
            size: 20,
            font: 'Arial',
            color: '0F172A',
          }),
          item.name
            ? new TextRun({
                text: item.name,
                size: 19,
                font: 'Arial',
                color: '334155',
              })
            : new TextRun({ text: '' }),
        ],
      })
  );
}

/**
 * Generates the .docx Word document containing:
 * 1. The requested 3-column discrepancy table (with Roll Numbers & Student Names)
 * 2. Complete session absentees breakdown table (with Roll Numbers & Student Names)
 * 3. Summary statistics table
 */
export async function generateWordDocumentBlob(
  discrepancyRows: DiscrepancyRowData[],
  allStudents: StudentRecord[],
  options: WordExportOptions = {}
): Promise<Blob> {
  const {
    documentTitle = 'STUDENT ATTENDANCE DISCREPANCY & ABSENTEES REPORT',
    institutionName = 'Department of Electronics & Communication Engineering',
    departmentName = 'Academic Year 2026 - 2027 | B.Tech II Year',
    includeStudentNames = true, // Set to true by default per user request!
    rollNumberFormat = 'newline',
    includeSummaryTable = true,
    includeAbsenteeList = true,
    notes = '',
  } = options;

  // Build the primary requested 3-column table
  // Columns:
  // 1. Date
  // 2. FN present and AN absent (Roll numbers + Student names)
  // 3. FN absent and AN present (Roll numbers + Student names)
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 18, type: WidthType.PERCENTAGE },
        shading: { fill: '1E3A8A', type: ShadingType.CLEAR },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
          bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
          left: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
          right: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Date',
                bold: true,
                color: 'FFFFFF',
                size: 22,
                font: 'Arial',
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 41, type: WidthType.PERCENTAGE },
        shading: { fill: '1E3A8A', type: ShadingType.CLEAR },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
          bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
          left: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
          right: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'FN present and AN absent',
                bold: true,
                color: 'FFFFFF',
                size: 22,
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: '(Roll Numbers & Names)',
                color: '93C5FD',
                size: 18,
                font: 'Arial',
                italics: true,
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 41, type: WidthType.PERCENTAGE },
        shading: { fill: '1E3A8A', type: ShadingType.CLEAR },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
          bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
          left: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
          right: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'FN absent and AN present',
                bold: true,
                color: 'FFFFFF',
                size: 22,
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: '(Roll Numbers & Names)',
                color: '93C5FD',
                size: 18,
                font: 'Arial',
                italics: true,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const dataRows: TableRow[] = discrepancyRows.map((row, idx) => {
    const isEven = idx % 2 === 0;
    const bgFill = isEven ? 'F8FAFC' : 'FFFFFF';

    const col2Paragraphs = formatRollNumbersAndNames(
      allStudents,
      row.fnPresentAnAbsentRolls,
      includeStudentNames,
      rollNumberFormat
    );

    const col3Paragraphs = formatRollNumbersAndNames(
      allStudents,
      row.fnAbsentAnPresentRolls,
      includeStudentNames,
      rollNumberFormat
    );

    return new TableRow({
      children: [
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          shading: { fill: bgFill, type: ShadingType.CLEAR },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
            left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
            right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: row.date,
                  bold: true,
                  size: 20,
                  font: 'Arial',
                  color: '0F172A',
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 41, type: WidthType.PERCENTAGE },
          shading: { fill: bgFill, type: ShadingType.CLEAR },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
            left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
            right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
          },
          children: col2Paragraphs,
        }),
        new TableCell({
          width: { size: 41, type: WidthType.PERCENTAGE },
          shading: { fill: bgFill, type: ShadingType.CLEAR },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
            left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
            right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
          },
          children: col3Paragraphs,
        }),
      ],
    });
  });

  const discrepancyTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });

  // Prepare overall document elements
  const children: (Paragraph | Table)[] = [];

  // Title / Institution Header
  if (institutionName) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: institutionName.toUpperCase(),
            bold: true,
            size: 24,
            font: 'Arial',
            color: '1E3A8A',
          }),
        ],
      })
    );
  }

  if (departmentName) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: departmentName,
            size: 20,
            color: '475569',
            font: 'Arial',
          }),
        ],
      })
    );
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: documentTitle,
          bold: true,
          size: 26,
          font: 'Arial',
          color: '0F172A',
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { after: 180 },
      children: [
        new TextRun({
          text: 'This document presents the session-wise attendance discrepancy records and absentee rosters extracted from Google Sheets. Roll numbers and student names are documented for each category.',
          size: 20,
          font: 'Arial',
          color: '334155',
        }),
      ],
    })
  );

  // Section 1: Session Discrepancy Table
  children.push(
    new Paragraph({
      spacing: { before: 100, after: 100 },
      children: [
        new TextRun({
          text: '1. Session Attendance Discrepancy Table',
          bold: true,
          size: 22,
          font: 'Arial',
          color: '1E3A8A',
        }),
      ],
    })
  );

  // Insert the 3-column table
  children.push(discrepancyTable);

  // Section 2: Complete Session Absentees Roster (Roll Numbers & Student Names)
  if (includeAbsenteeList) {
    discrepancyRows.forEach((dRow) => {
      const date = dRow.date;
      const fnAbsentees: StudentRecord[] = [];
      const anAbsentees: StudentRecord[] = [];

      allStudents.forEach((student) => {
        const att = student.attendance[date];
        if (!att) return;
        if (att.fn.toUpperCase() === 'A') {
          fnAbsentees.push(student);
        }
        if (att.an.toUpperCase() === 'A') {
          anAbsentees.push(student);
        }
      });

      children.push(
        new Paragraph({
          spacing: { before: 300, after: 100 },
          children: [
            new TextRun({
              text: `2. Complete Absentees Roster for ${date} (Roll Numbers & Names)`,
              bold: true,
              size: 22,
              font: 'Arial',
              color: '1E3A8A',
            }),
          ],
        })
      );

      // Create an absentees table
      const absenteeHeader = new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            width: { size: 8, type: WidthType.PERCENTAGE },
            shading: { fill: '991B1B', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'S.No', bold: true, color: 'FFFFFF', size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 22, type: WidthType.PERCENTAGE },
            shading: { fill: '991B1B', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Roll Number', bold: true, color: 'FFFFFF', size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            shading: { fill: '991B1B', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [new TextRun({ text: 'Student Name', bold: true, color: 'FFFFFF', size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: '991B1B', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Absent Session', bold: true, color: 'FFFFFF', size: 20 })],
              }),
            ],
          }),
        ],
      });

      // Collect all unique absentees for this date
      const allAbsenteesForDate = allStudents.filter((s) => {
        const att = s.attendance[date];
        return att && (att.fn.toUpperCase() === 'A' || att.an.toUpperCase() === 'A');
      });

      const absenteeRows = allAbsenteesForDate.map((s, idx) => {
        const att = s.attendance[date] || { fn: '', an: '' };
        const fnAbs = att.fn.toUpperCase() === 'A';
        const anAbs = att.an.toUpperCase() === 'A';
        let sessionDesc = 'Both (FN & AN)';
        if (fnAbs && !anAbs) sessionDesc = 'Morning (FN) Only';
        if (!fnAbs && anAbs) sessionDesc = 'Evening (AN) Only';

        const bg = idx % 2 === 0 ? 'FEF2F2' : 'FFFFFF';

        return new TableRow({
          children: [
            new TableCell({
              shading: { fill: bg, type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${idx + 1}`, size: 19 })],
                }),
              ],
            }),
            new TableCell({
              shading: { fill: bg, type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: s.rollNo, bold: true, size: 19, font: 'Arial' })],
                }),
              ],
            }),
            new TableCell({
              shading: { fill: bg, type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [new TextRun({ text: s.name || 'Unknown', size: 19, font: 'Arial' })],
                }),
              ],
            }),
            new TableCell({
              shading: { fill: bg, type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: sessionDesc,
                      bold: true,
                      color: sessionDesc.includes('Both') ? 'B91C1C' : '1D4ED8',
                      size: 19,
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
      });

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [absenteeHeader, ...absenteeRows],
        })
      );
    });
  }

  // Section 3: Summary statistics if requested
  if (includeSummaryTable && discrepancyRows.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 300, after: 100 },
        children: [
          new TextRun({
            text: '3. Discrepancy & Absentee Summary Statistics',
            bold: true,
            size: 22,
            font: 'Arial',
            color: '1E3A8A',
          }),
        ],
      })
    );

    const summaryHeader = new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: '334155', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Date', bold: true, color: 'FFFFFF', size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: '334155', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'FN Present & AN Absent', bold: true, color: 'FFFFFF', size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: '334155', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'FN Absent & AN Present', bold: true, color: 'FFFFFF', size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: '334155', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Total Discrepancies', bold: true, color: 'FFFFFF', size: 20 })],
            }),
          ],
        }),
      ],
    });

    const summaryRows = discrepancyRows.map((r, i) => {
      const bg = i % 2 === 0 ? 'F8FAFC' : 'FFFFFF';
      const count1 = r.fnPresentAnAbsentRolls.length;
      const count2 = r.fnAbsentAnPresentRolls.length;
      return new TableRow({
        children: [
          new TableCell({
            shading: { fill: bg, type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: r.date, bold: true, size: 20 })],
              }),
            ],
          }),
          new TableCell({
            shading: { fill: bg, type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `${count1} student${count1 === 1 ? '' : 's'}`, size: 20 })],
              }),
            ],
          }),
          new TableCell({
            shading: { fill: bg, type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `${count2} student${count2 === 1 ? '' : 's'}`, size: 20 })],
              }),
            ],
          }),
          new TableCell({
            shading: { fill: bg, type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `${count1 + count2} students`, bold: true, size: 20 })],
              }),
            ],
          }),
        ],
      });
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [summaryHeader, ...summaryRows],
      })
    );
  }

  // Notes or remarks if any
  if (notes) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({
            text: 'Remarks / Observations:',
            bold: true,
            size: 20,
            font: 'Arial',
          }),
        ],
      })
    );
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: notes,
            italics: true,
            size: 19,
            font: 'Arial',
            color: '475569',
          }),
        ],
      })
    );
  }

  // Signature Block
  children.push(
    new Paragraph({
      spacing: { before: 400 },
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: '_____________________________\nFaculty / Class In-charge Signature',
          size: 20,
          font: 'Arial',
          color: '475569',
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Page ',
                    size: 18,
                    color: '94A3B8',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: '94A3B8',
                  }),
                  new TextRun({
                    text: ' of ',
                    size: 18,
                    color: '94A3B8',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: '94A3B8',
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Helper to trigger automatic download in the user's browser
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
