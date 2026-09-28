// PDF Export Utility for Twins Lift Calc
// Uses html2pdf.js with fallback to high-resolution print stylesheet

export interface PdfExportOptions {
  filename?: string;
  elementId?: string;
  marginMm?: number;
  orientation?: 'portrait' | 'landscape';
}

export async function exportElementToPdf(
  targetElementOrId: HTMLElement | string,
  options: PdfExportOptions = {}
): Promise<boolean> {
  const {
    filename = 'Quotation_Document.pdf',
    marginMm = 6,
    orientation = 'portrait',
  } = options;

  let element: HTMLElement | null = null;
  if (typeof targetElementOrId === 'string') {
    element = document.getElementById(targetElementOrId);
  } else {
    element = targetElementOrId;
  }

  if (!element) {
    console.warn(`[PDF Export] Element not found:`, targetElementOrId);
    window.print();
    return false;
  }

  try {
    // Dynamic import to keep bundle optimized
    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const opt = {
      margin: [marginMm, marginMm, marginMm, marginMm],
      filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        backgroundColor: '#ffffff',
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation,
        compress: true,
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    // Show temporary progress state or cursor
    document.body.classList.add('cursor-wait');

    await (html2pdf as any)().set(opt).from(element).save();

    document.body.classList.remove('cursor-wait');
    return true;
  } catch (err) {
    console.error('[PDF Export] html2pdf failed, falling back to window.print():', err);
    document.body.classList.remove('cursor-wait');
    window.print();
    return false;
  }
}

/**
 * Batch export multiple projects into a single consolidated PDF document
 */
export async function exportProjectsBatchPdf(
  projects: any[],
  companyName: string = 'شركة توينز تكنولوجي للمصاعد',
  companyPhone: string = '+966 50 000 0000',
  language: 'ar' | 'en' = 'ar'
): Promise<boolean> {
  if (!projects || projects.length === 0) return false;

  const isAr = language === 'ar';
  const totalValue = projects.reduce((sum, p) => sum + (p.totalQuotationPrice || 0), 0);
  const totalLifts = projects.length;

  // Build temporary DOM container
  const container = document.createElement('div');
  container.id = 'batch-pdf-export-container';
  container.dir = isAr ? 'rtl' : 'ltr';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '210mm'; // Standard A4 width
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#1e293b';
  container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", sans-serif';

  // 1. Cover / Executive Portfolio Summary Page
  let html = `
    <div style="padding: 24px; min-height: 275mm; box-sizing: border-box; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px;">
          <div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #1e3a8a;">${companyName}</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">${isAr ? 'الملف المجمع لعروض الأسعار والمشاريع المعتمدة' : 'Consolidated Quotations & Projects Portfolio'}</p>
          </div>
          <div style="text-align: ${isAr ? 'left' : 'right'}; font-size: 11px; color: #475569;">
            <div><strong>${isAr ? 'تاريخ التصدير:' : 'Export Date:'}</strong> ${new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</div>
            <div><strong>${isAr ? 'عدد المشاريع:' : 'Total Projects:'}</strong> ${totalLifts}</div>
          </div>
        </div>

        <!-- Portfolio Highlights Banner -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 12px 0; font-size: 14px; font-weight: bold; color: #334155;">
            ${isAr ? 'ملخص المحفظة المجمعة' : 'Consolidated Portfolio Summary'}
          </h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; text-align: center;">
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px;">
              <div style="font-size: 11px; color: #1e40af; font-weight: bold;">${isAr ? 'إجمالي المشاريع' : 'Total Projects'}</div>
              <div style="font-size: 20px; font-weight: 900; color: #1d4ed8; margin-top: 4px;">${totalLifts}</div>
            </div>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px;">
              <div style="font-size: 11px; color: #166534; font-weight: bold;">${isAr ? 'إجمالي القيمة التقديرية' : 'Total Portfolio Value'}</div>
              <div style="font-size: 20px; font-weight: 900; color: #15803d; margin-top: 4px;">${Math.round(totalValue).toLocaleString()} SAR</div>
            </div>
            <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 12px;">
              <div style="font-size: 11px; color: #6b21a8; font-weight: bold;">${isAr ? 'متوسط سعر المصعد' : 'Average Price / Lift'}</div>
              <div style="font-size: 20px; font-weight: 900; color: #7e22ce; margin-top: 4px;">${totalLifts > 0 ? Math.round(totalValue / totalLifts).toLocaleString() : 0} SAR</div>
            </div>
          </div>
        </div>

        <!-- Consolidated Projects Table -->
        <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: bold; color: #1e293b;">
          ${isAr ? 'جدول المشاريع المتضمنة بالتقرير' : 'Included Projects Overview'}
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f1f5f9; color: #334155; text-align: ${isAr ? 'right' : 'left'};">
              <th style="padding: 8px; border: 1px solid #cbd5e1;">#</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">${isAr ? 'رقم المرجع' : 'Quote Ref'}</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">${isAr ? 'اسم المشروع' : 'Project'}</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">${isAr ? 'العميل' : 'Client'}</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">${isAr ? 'النوع والمواصفة' : 'Lift Specs'}</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">${isAr ? 'الحالة' : 'Status'}</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: ${isAr ? 'left' : 'right'};">${isAr ? 'السعر شاملاً الضريبة' : 'Total (SAR)'}</th>
            </tr>
          </thead>
          <tbody>
            ${projects.map((p, idx) => `
              <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 7px 8px; border: 1px solid #e2e8f0; font-weight: bold;">${idx + 1}</td>
                <td style="padding: 7px 8px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #2563eb;">${p.quoteRef || '-'}</td>
                <td style="padding: 7px 8px; border: 1px solid #e2e8f0; font-weight: 600;">${p.projectName || '-'}</td>
                <td style="padding: 7px 8px; border: 1px solid #e2e8f0;">${p.clientName || '-'}</td>
                <td style="padding: 7px 8px; border: 1px solid #e2e8f0;">${p.elevatorType || 'MRL'} (${p.stops || 4} ${isAr ? 'محطات' : 'stops'})</td>
                <td style="padding: 7px 8px; border: 1px solid #e2e8f0;">
                  <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; background: ${p.status === 'Won' || p.status === 'Installed' ? '#dcfce7; color: #15803d;' : '#fef9c3; color: #854d0e;'}">
                    ${p.status || 'Draft'}
                  </span>
                </td>
                <td style="padding: 7px 8px; border: 1px solid #e2e8f0; text-align: ${isAr ? 'left' : 'right'}; font-family: monospace; font-weight: bold; color: #0f172a;">
                  ${Math.round(p.totalQuotationPrice || 0).toLocaleString()} SAR
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Footer for Cover Page -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8;">
        <div>${companyName} • ${companyPhone}</div>
        <div>${isAr ? 'وثيقة مجمعة رسمية - الصفحة 1' : 'Official Batch Document - Page 1'}</div>
      </div>
    </div>
  `;

  // 2. Individual Project Sheets (1 per project)
  projects.forEach((p, idx) => {
    const pageNum = idx + 2;
    html += `
      <div style="padding: 24px; min-height: 275mm; box-sizing: border-box; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <!-- Project Document Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #cbd5e1; padding-bottom: 12px; margin-bottom: 16px;">
            <div>
              <div style="font-size: 11px; font-weight: bold; color: #2563eb; text-transform: uppercase;">
                ${companyName}
              </div>
              <h2 style="margin: 4px 0 0 0; font-size: 16px; font-weight: 800; color: #0f172a;">
                ${p.projectName || (isAr ? 'مشروع مصعد' : 'Elevator Project')}
              </h2>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                ${isAr ? 'المرجع:' : 'Ref:'} <strong style="color: #1e293b; font-family: monospace;">${p.quoteRef}</strong> | ${isAr ? 'التاريخ:' : 'Date:'} ${p.date || new Date().toISOString().split('T')[0]}
              </div>
            </div>
            <div style="text-align: ${isAr ? 'left' : 'right'};">
              <span style="display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;">
                ${isAr ? 'المشروع' : 'Project'} #${idx + 1}
              </span>
            </div>
          </div>

          <!-- Client & Project Metadata Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 11px;">
            <div>
              <div><strong style="color: #475569;">${isAr ? 'اسم العميل:' : 'Client Name:'}</strong> ${p.clientName || '-'}</div>
              <div style="margin-top: 4px;"><strong style="color: #475569;">${isAr ? 'الهاتف:' : 'Phone:'}</strong> ${p.clientPhone || '-'}</div>
              <div style="margin-top: 4px;"><strong style="color: #475569;">${isAr ? 'الموقع / المدينة:' : 'Location:'}</strong> ${p.siteLocation || '-'}</div>
            </div>
            <div>
              <div><strong style="color: #475569;">${isAr ? 'الاستشاري / المشرف:' : 'Consultant:'}</strong> ${p.consultant || '-'}</div>
              <div style="margin-top: 4px;"><strong style="color: #475569;">${isAr ? 'نوع المنشأة:' : 'Building:'}</strong> ${p.buildingType || (isAr ? 'سكني / تجاري' : 'Residential')}</div>
              <div style="margin-top: 4px;"><strong style="color: #475569;">${isAr ? 'الحالة الحالية:' : 'Status:'}</strong> ${p.status || 'Draft'}</div>
            </div>
          </div>

          <!-- Technical Specifications Breakdown -->
          <h3 style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #1e293b;">
            ${isAr ? 'المواصفات الفنية المعتمدة للمصعد' : 'Technical Specifications'}
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 16px;">
            <tbody>
              <tr style="background: #ffffff;">
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; font-weight: bold; width: 25%; background: #f1f5f9;">${isAr ? 'نوع نظام المصعد' : 'Elevator Type'}</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; width: 25%; font-weight: 600;">${p.elevatorType || 'MRL Gearless'}</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; font-weight: bold; width: 25%; background: #f1f5f9;">${isAr ? 'الحمولة / الأشخاص' : 'Capacity / Persons'}</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; width: 25%;">${p.capacityKg || 630} kg (${p.persons || 8} ${isAr ? 'أشخاص' : 'pers'})</td>
              </tr>
              <tr style="background: #ffffff;">
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; font-weight: bold; background: #f1f5f9;">${isAr ? 'عدد الوقفات / المداخل' : 'Stops & Entrances'}</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0;">${p.stops || 4} ${isAr ? 'محطات' : 'stops'} (${p.entrances || 4} ${isAr ? 'مداخل' : 'entrances'})</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; font-weight: bold; background: #f1f5f9;">${isAr ? 'السرعة المقننة' : 'Rated Speed'}</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0;">${p.speed || 1.0} m/s</td>
              </tr>
              <tr style="background: #ffffff;">
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; font-weight: bold; background: #f1f5f9;">${isAr ? 'نظام الأبواب' : 'Door Type'}</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0;">${p.doorType || 'Telescopic'} (${p.doorOpeningWidth || 800}mm)</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; font-weight: bold; background: #f1f5f9;">${isAr ? 'محرك الجر والمكينة' : 'Traction Machine'}</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0;">${p.machineLocation || 'MRL Overhead'} (${p.machinePowerKw || 5.5} kW)</td>
              </tr>
              <tr style="background: #ffffff;">
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; font-weight: bold; background: #f1f5f9;">${isAr ? 'لوحة التحكم والمحول' : 'Controller & Inverter'}</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0;">VVVF Microprocessor Integrated</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0; font-weight: bold; background: #f1f5f9;">${isAr ? 'أبعاد البئر (عرض × عمق)' : 'Shaft Size (W x D)'}</td>
                <td style="padding: 6px 10px; border: 1px solid #e2e8f0;">${p.shaftWidth || 1600} × ${p.shaftDepth || 1600} mm</td>
              </tr>
            </tbody>
          </table>

          <!-- Financial Breakdown Summary Box -->
          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 11px; font-weight: bold; color: #166534;">
                  ${isAr ? 'القيمة الإجمالية للعرض (شاملة ضريبة القيمة المضافة 15%)' : 'Total Quotation Price (Including 15% VAT)'}
                </div>
                <div style="font-size: 10px; color: #4ade80; margin-top: 2px;">
                  ${isAr ? 'تشمل التوريد والتركيب والضمان المعتمد' : 'Includes supply, installation and certified warranty'}
                </div>
              </div>
              <div style="font-size: 20px; font-weight: 900; font-family: monospace; color: #15803d;">
                ${Math.round(p.totalQuotationPrice || 0).toLocaleString()} SAR
              </div>
            </div>
          </div>

          <!-- Warranty & Maintenance Terms -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; font-size: 10px; color: #475569; margin-bottom: 20px;">
            <strong style="color: #1e293b;">${isAr ? 'شروط الضمان والصيانة:' : 'Warranty & Service:'}</strong>
            <ul style="margin: 4px 0 0 16px; padding: 0;">
              <li>${isAr ? 'ضمان شامل على المحرك وقطع الغيار الأساسية لمدة 5 سنوات ضد عيوب الصناعة.' : '5 years warranty on traction motor and major core components.'}</li>
              <li>${isAr ? 'صيانة دورية وقائية مجانية لمدة سنتين شاملة بلاغات الطوارئ 24/7.' : '2 years free routine maintenance service including 24/7 emergency response.'}</li>
              <li>${isAr ? 'جميع المكونات مطابقة للمواصفة القياسية السعودية والأوروبية EN 81-20.' : 'All components conform to Saudi SASO and European EN 81-20 safety codes.'}</li>
            </ul>
          </div>
        </div>

        <!-- Official Signatures Block -->
        <div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-size: 10px;">
            <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center;">
              <div style="font-weight: bold; color: #1e3a8a; margin-bottom: 25px;">${isAr ? 'المهندس المعتمد / ممثل الشركة' : 'Authorized Representative'}</div>
              <div style="border-top: 1px solid #94a3b8; width: 60%; margin: 0 auto; padding-top: 4px; color: #64748b;">
                ${isAr ? 'التوقيع والختم الرسمي' : 'Signature & Official Stamp'}
              </div>
            </div>
            <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center;">
              <div style="font-weight: bold; color: #1e3a8a; margin-bottom: 25px;">${isAr ? 'موافقة واعتماد العميل' : 'Client Acceptance'}</div>
              <div style="border-top: 1px solid #94a3b8; width: 60%; margin: 0 auto; padding-top: 4px; color: #64748b;">
                ${p.clientName || (isAr ? 'العميل' : 'Client')}
              </div>
            </div>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 12px; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8;">
            <div>${companyName} • ${p.quoteRef}</div>
            <div>${isAr ? `صفحة ${pageNum} من ${projects.length + 1}` : `Page ${pageNum} of ${projects.length + 1}`}</div>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const opt = {
      margin: [0, 0, 0, 0], // Margins handled inside HTML
      filename: `Twins_Consolidated_Projects_Batch_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        backgroundColor: '#ffffff',
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true,
      },
      pagebreak: { mode: ['css', 'legacy'] },
    };

    document.body.classList.add('cursor-wait');
    await (html2pdf as any)().set(opt).from(container).save();
    document.body.classList.remove('cursor-wait');

    // Cleanup
    document.body.removeChild(container);
    return true;
  } catch (err) {
    console.error('[Batch PDF Export] Failed:', err);
    document.body.classList.remove('cursor-wait');
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    return false;
  }
}
