import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DiscrepancyRowData, WordExportOptions } from './wordGenerator';
import { StudentRecord } from '../data/defaultAttendance';

export interface PdfExportOptions extends WordExportOptions {
  orientation?: 'portrait' | 'landscape';
}

export function generatePdfDocument(
  discrepancies: DiscrepancyRowData[],
  allStudents: StudentRecord[],
  options: PdfExportOptions = {}
): Blob {
  const {
    documentTitle = 'STUDENT ATTENDANCE DISCREPANCY & ABSENTEES REPORT',
    institutionName = 'DEPARTMENT OF ELECTRONICS & COMMUNICATION ENGINEERING',
    departmentName = 'Academic Session 2026-2027 | B.Tech II Year',
    includeStudentNames = true,
    rollNumberFormat = 'newline',
    includeSummaryTable = true,
    includeAbsenteeList = true,
    notes = 'Official session discrepancy and absentee record generated from Google Sheets attendance tracking.',
    orientation = 'portrait',
  } = options;

  const doc = new jsPDF({
    orientation,
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 40;

  // 1. Institution Header
  if (institutionName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138); // Navy blue #1e3a8a
    doc.text(institutionName.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    currentY += 18;
  }

  // 2. Department / Session Subheader
  if (departmentName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // Slate 600
    doc.text(departmentName, pageWidth / 2, currentY, { align: 'center' });
    currentY += 16;
  }

  // 3. Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(documentTitle, pageWidth / 2, currentY, { align: 'center' });
  currentY += 16;

  // Horizontal divider
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(1);
  doc.line(40, currentY, pageWidth - 40, currentY);
  currentY += 16;

  // Description intro
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const introText =
    'This document presents the session-wise attendance discrepancy records extracted from Google Sheets. The table lists students who were present in the morning session (FN) but absent in the evening session (AN), and vice versa.';
  const splitIntro = doc.splitTextToSize(introText, pageWidth - 80);
  doc.text(splitIntro, 40, currentY);
  currentY += splitIntro.length * 12 + 10;

  // Section 1 Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text('1. Session Attendance Discrepancy Table', 40, currentY);
  currentY += 8;

  // Prepare Data for 3-Column Table
  // Col 1: Date
  // Col 2: FN present and AN absent
  // Col 3: FN absent and AN present
  const tableRows = discrepancies.map((row) => {
    // Format Col 2
    let col2Text = 'None (Nil)';
    if (row.fnPresentAnAbsentRolls.length > 0) {
      col2Text = row.fnPresentAnAbsentRolls
        .map((roll, idx) => {
          const s = allStudents.find((std) => std.rollNo === roll);
          const namePart = includeStudentNames && s?.name ? ` (${s.name})` : '';
          const prefix = rollNumberFormat === 'numbered' ? `${idx + 1}. ` : '';
          return `${prefix}${roll}${namePart}`;
        })
        .join(rollNumberFormat === 'comma' ? ', ' : '\n');
    }

    // Format Col 3
    let col3Text = 'None (Nil)';
    if (row.fnAbsentAnPresentRolls.length > 0) {
      col3Text = row.fnAbsentAnPresentRolls
        .map((roll, idx) => {
          const s = allStudents.find((std) => std.rollNo === roll);
          const namePart = includeStudentNames && s?.name ? ` (${s.name})` : '';
          const prefix = rollNumberFormat === 'numbered' ? `${idx + 1}. ` : '';
          return `${prefix}${roll}${namePart}`;
        })
        .join(rollNumberFormat === 'comma' ? ', ' : '\n');
    }

    return [row.date, col2Text, col3Text];
  });

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        '1. Date',
        '2. FN present and AN absent\n(Roll Numbers & Names)',
        '3. FN absent and AN present\n(Roll Numbers & Names)',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    margin: { left: 40, right: 40 },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 9.5,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 6,
      overflow: 'linebreak',
      valign: 'top',
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 70, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: (pageWidth - 80 - 70) / 2 },
      2: { cellWidth: (pageWidth - 80 - 70) / 2 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 20;

  // Section 2: Complete Absentees Roster (if requested)
  if (includeAbsenteeList) {
    discrepancies.forEach((dRow) => {
      const date = dRow.date;
      const allAbsenteesForDate = allStudents.filter((s) => {
        const att = s.attendance[date];
        return att && (att.fn.toUpperCase() === 'A' || att.an.toUpperCase() === 'A');
      });

      if (allAbsenteesForDate.length > 0) {
        // Check page overflow
        if (currentY > doc.internal.pageSize.getHeight() - 120) {
          doc.addPage();
          currentY = 40;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(153, 27, 27); // Red-800
        doc.text(`2. Complete Absentees Roster for ${date} (Total: ${allAbsenteesForDate.length} students)`, 40, currentY);
        currentY += 8;

        const absenteeRows = allAbsenteesForDate.map((s, idx) => {
          const att = s.attendance[date] || { fn: '', an: '' };
          const fnAbs = att.fn.toUpperCase() === 'A';
          const anAbs = att.an.toUpperCase() === 'A';
          let sessionDesc = 'Both Sessions (FN & AN)';
          if (fnAbs && !anAbs) sessionDesc = 'Morning (FN) Only';
          if (!fnAbs && anAbs) sessionDesc = 'Evening (AN) Only';

          return [String(idx + 1), s.rollNo, s.name || 'Unknown', sessionDesc];
        });

        autoTable(doc, {
          startY: currentY,
          head: [['S.No', 'Roll Number', 'Student Name', 'Absent Session']],
          body: absenteeRows,
          theme: 'grid',
          margin: { left: 40, right: 40 },
          headStyles: {
            fillColor: [153, 27, 27],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center',
          },
          styles: {
            fontSize: 8,
            cellPadding: 4,
            textColor: [15, 23, 42],
          },
          columnStyles: {
            0: { cellWidth: 35, halign: 'center' },
            1: { cellWidth: 90, halign: 'center', fontStyle: 'bold' },
            2: { cellWidth: 'auto', fontStyle: 'bold' },
            3: { cellWidth: 110, halign: 'center' },
          },
          alternateRowStyles: {
            fillColor: [254, 242, 242], // Light red tint
          },
        });

        currentY = (doc as any).lastAutoTable.finalY + 20;
      }
    });
  }

  // Section 3: Summary Table
  if (includeSummaryTable && discrepancies.length > 0) {
    if (currentY > doc.internal.pageSize.getHeight() - 100) {
      doc.addPage();
      currentY = 40;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 58, 138);
    doc.text('3. Discrepancy Summary Statistics', 40, currentY);
    currentY += 8;

    const summaryRows = discrepancies.map((r) => [
      r.date,
      `${r.fnPresentAnAbsentRolls.length} student${r.fnPresentAnAbsentRolls.length === 1 ? '' : 's'}`,
      `${r.fnAbsentAnPresentRolls.length} student${r.fnAbsentAnPresentRolls.length === 1 ? '' : 's'}`,
      `${r.fnPresentAnAbsentRolls.length + r.fnAbsentAnPresentRolls.length} students`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [
        ['Date', 'FN Present & AN Absent', 'FN Absent & AN Present', 'Total Discrepancies'],
      ],
      body: summaryRows,
      theme: 'grid',
      margin: { left: 40, right: 40 },
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        fontSize: 8,
        cellPadding: 4,
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 20;
  }

  // Notes
  if (notes) {
    if (currentY > doc.internal.pageSize.getHeight() - 70) {
      doc.addPage();
      currentY = 40;
    }
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Note: ${notes}`, 40, currentY);
    currentY += 20;
  }

  // Signature Block
  if (currentY > doc.internal.pageSize.getHeight() - 60) {
    doc.addPage();
    currentY = 40;
  }
  currentY = Math.max(currentY + 15, doc.internal.pageSize.getHeight() - 70);
  doc.setDrawColor(100, 116, 139);
  doc.line(pageWidth - 220, currentY, pageWidth - 40, currentY);
  currentY += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Faculty / Class In-charge Signature', pageWidth - 130, currentY, { align: 'center' });

  // Add Page Numbers to all pages
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 15,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}
