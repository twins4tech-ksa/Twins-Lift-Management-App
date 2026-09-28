export type NavTab = 
  | 'CUSTOMER_PORTAL'          // بوابة العميل المخصصة
  | 'TECHNICIAN_PORTAL'        // بوابة الفني الميداني المخصصة
  | 'SUPPLIER_PORTAL'          // بوابة المورد المعتمد (للتصميم لاحقاً)
  | 'WIZARD'                   // حاسبة ومواصفات المصعد
  | 'DRAWINGS'                 // المخططات الهندسية ونظام التعليق CAD
  | 'COMPONENTS'               // المكونات ومقارنة الأسعار
  | 'CUSTOMERS'                // سجل وإدارة العملاء
  | 'SALES_QUOTATIONS'         // عروض بيع المصاعد
  | 'SALES_CONTRACTS'          // عقود توريد وتركيب المصاعد
  | 'SALES_ANALYTICS'          // لوحة تحليلات وإحصاءات المبيعات
  | 'MAINTENANCE_CONTRACTS'    // عقود الصيانة السارية
  | 'MAINTENANCE_SCHEDULES'    // إدارة زيارات الصيانة
  | 'MAINTENANCE_BREAKDOWNS'    // إدارة بلاغات الأعطال
  | 'MAINTENANCE_QUOTATIONS'   // عروض أسعار الصيانة
  | 'EMPLOYEES'                // شؤون الموظفين والمناديب
  | 'INVENTORY'                // المستودع وإدارة المخزون وقطع الغيار
  | 'INTERACTIVE_MAP'          // الخريطة التفاعلية للمواقع والمشاريع
  | 'PRINT'                    // طباعة العرض الفني
  | 'SETTINGS';                // إعدادات الشركة والتسعير
