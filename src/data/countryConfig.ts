export interface GovernorateOption {
  id: string;
  name: {
    ar: string;
    en: string;
    ckb: string;
  };
}

export interface CountryConfig {
  code: string;
  name: {
    ar: string;
    en: string;
    ckb: string;
  };
  dialCode: string;
  flag: string;
  placeholder: string;
  phoneLength: {
    min: number;
    max: number;
  };
  governorates: GovernorateOption[];
  active: boolean;
}

export const countryList: CountryConfig[] = [
  // 1. IRAQ
  {
    code: 'IQ',
    name: { ar: 'العراق (Iraq)', en: 'Iraq', ckb: 'عێراق' },
    dialCode: '+964',
    flag: '🇮🇶',
    placeholder: '770 123 4567',
    phoneLength: { min: 8, max: 15 },
    active: true,
    governorates: [
      { id: 'baghdad', name: { ar: 'بغداد (Baghdad)', en: 'Baghdad', ckb: 'بەغدا' } },
      { id: 'erbil', name: { ar: 'أربيل (Erbil)', en: 'Erbil', ckb: 'هەولێر' } },
      { id: 'basra', name: { ar: 'البصرة (Basra)', en: 'Basra', ckb: 'بەسڕە' } },
      { id: 'sulaymaniyah', name: { ar: 'السليمانية (Sulaymaniyah)', en: 'Sulaymaniyah', ckb: 'سلێمانی' } },
      { id: 'najaf', name: { ar: 'النجف الأشرف (Najaf)', en: 'Najaf', ckb: 'نەجەف' } },
      { id: 'karbala', name: { ar: 'كربلاء المقدسة (Karbala)', en: 'Karbala', ckb: 'کەربەلا' } },
      { id: 'duhok', name: { ar: 'دهوك (Duhok)', en: 'Duhok', ckb: 'دهۆک' } },
      { id: 'kirkuk', name: { ar: 'كركوك (Kirkuk)', en: 'Kirkuk', ckb: 'کەرکووک' } },
      { id: 'nineveh', name: { ar: 'نينوى / الموصل (Nineveh)', en: 'Nineveh / Mosul', ckb: 'نەینەوا / مووسڵ' } },
      { id: 'babylon', name: { ar: 'بابل / الحلة (Babylon)', en: 'Babylon', ckb: 'بابل' } },
      { id: 'anbar', name: { ar: 'الأنبار (Anbar)', en: 'Anbar', ckb: 'ئەنبار' } },
      { id: 'diyala', name: { ar: 'ديالى (Diyala)', en: 'Diyala', ckb: 'دیالە' } },
      { id: 'dhi_qar', name: { ar: 'ذي قار / الناصرية (Dhi Qar)', en: 'Dhi Qar', ckb: 'زیقار' } },
      { id: 'maysan', name: { ar: 'ميسان / العمارة (Maysan)', en: 'Maysan', ckb: 'مەیسان' } },
      { id: 'wasit', name: { ar: 'واسط / الكوت (Wasit)', en: 'Wasit', ckb: 'واسیت' } },
      { id: 'salah_al_din', name: { ar: 'صلاح الدين / تكريت (Salah al-Din)', en: 'Salah al-Din', ckb: 'سەڵاحەددین' } },
      { id: 'qadisiyyah', name: { ar: 'الديوانية (Al-Qadisiyyah)', en: 'Al-Qadisiyyah', ckb: 'دیوانیە' } },
      { id: 'muthanna', name: { ar: 'المثنى / السماوة (Muthanna)', en: 'Muthanna', ckb: 'موسەننا' } },
      { id: 'other_gov', name: { ar: 'أخرى (Other)', en: 'Other', ckb: 'ئەوانی تر (أخرى)' } },
    ],
  },
  // 2. SAUDI ARABIA
  {
    code: 'SA',
    name: { ar: 'المملكة العربية السعودية (Saudi Arabia)', en: 'Saudi Arabia', ckb: 'عەرەبستانی سعوودی' },
    dialCode: '+966',
    flag: '🇸🇦',
    placeholder: '50 123 4567',
    phoneLength: { min: 8, max: 15 },
    active: true,
    governorates: [
      { id: 'riyadh', name: { ar: 'الرياض (Riyadh)', en: 'Riyadh', ckb: 'ڕیاز' } },
      { id: 'jeddah', name: { ar: 'جدة (Jeddah)', en: 'Jeddah', ckb: 'جەددە' } },
      { id: 'mecca', name: { ar: 'مكة المكرمة (Mecca)', en: 'Mecca', ckb: 'مەککە' } },
      { id: 'medina', name: { ar: 'المدينة المنورة (Medina)', en: 'Medina', ckb: 'مەدینە' } },
      { id: 'dammam', name: { ar: 'الدمام / الشرقية (Dammam)', en: 'Dammam', ckb: 'دەمام' } },
      { id: 'khobar', name: { ar: 'الخبر (Khobar)', en: 'Khobar', ckb: 'خۆبەر' } },
      { id: 'qassim', name: { ar: 'القصيم (Qassim)', en: 'Qassim', ckb: 'قەسیم' } },
      { id: 'tabuk', name: { ar: 'تبوك (Tabuk)', en: 'Tabuk', ckb: 'تەبووك' } },
      { id: 'abha', name: { ar: 'أبها / عسير (Abha)', en: 'Abha', ckb: 'ئەبها' } },
    ],
  },
  // 3. UAE
  {
    code: 'AE',
    name: { ar: 'الإمارات العربية المتحدة (UAE)', en: 'United Arab Emirates', ckb: 'ئیماراتی یەکگرتووی عەرەبی' },
    dialCode: '+971',
    flag: '🇦🇪',
    placeholder: '50 123 4567',
    phoneLength: { min: 8, max: 15 },
    active: true,
    governorates: [
      { id: 'dubai', name: { ar: 'دبي (Dubai)', en: 'Dubai', ckb: 'دوبەی' } },
      { id: 'abu_dhabi', name: { ar: 'أبوظبي (Abu Dhabi)', en: 'Abu Dhabi', ckb: 'ئەبوزەبی' } },
      { id: 'sharjah', name: { ar: 'الشارقة (Sharjah)', en: 'Sharjah', ckb: 'شارقە' } },
      { id: 'ajman', name: { ar: 'عجمان (Ajman)', en: 'Ajman', ckb: 'عەجمان' } },
      { id: 'rak', name: { ar: 'رأس الخيمة (Ras Al Khaimah)', en: 'Ras Al Khaimah', ckb: 'ڕەئس ئەلخەیمە' } },
      { id: 'fujairah', name: { ar: 'الفجيرة (Fujairah)', en: 'Fujairah', ckb: 'فوجەیرە' } },
      { id: 'um_al_quwain', name: { ar: 'أم القيوين (Umm Al Quwain)', en: 'Umm Al Quwain', ckb: 'ئوم ئەلقەیوەین' } },
    ],
  },
  // 4. KUWAIT
  {
    code: 'KW',
    name: { ar: 'الكويت (Kuwait)', en: 'Kuwait', ckb: 'کووەیت' },
    dialCode: '+965',
    flag: '🇰🇼',
    placeholder: '9000 1234',
    phoneLength: { min: 7, max: 15 },
    active: true,
    governorates: [
      { id: 'kuwait_city', name: { ar: 'العاصمة (Kuwait City)', en: 'Kuwait City', ckb: 'کووەیت سیتی' } },
      { id: 'hawalli', name: { ar: 'حولي (Hawalli)', en: 'Hawalli', ckb: 'حەولی' } },
      { id: 'farwaniya', name: { ar: 'الفروانية (Farwaniya)', en: 'Farwaniya', ckb: 'فەروانیە' } },
      { id: 'ahmadi', name: { ar: 'الأحمدي (Ahmadi)', en: 'Ahmadi', ckb: 'ئەحمەدی' } },
      { id: 'jahra', name: { ar: 'الجهراء (Jahra)', en: 'Jahra', ckb: 'جەهرا' } },
      { id: 'mubarak_al_kabeer', name: { ar: 'مبارك الكبير (Mubarak Al-Kabeer)', en: 'Mubarak Al-Kabeer', ckb: 'موبارەک ئەلکەبیر' } },
    ],
  },
  // 5. JORDAN
  {
    code: 'JO',
    name: { ar: 'الأردن (Jordan)', en: 'Jordan', ckb: 'ئوردن' },
    dialCode: '+962',
    flag: '🇯🇴',
    placeholder: '7 9123 4567',
    phoneLength: { min: 8, max: 15 },
    active: true,
    governorates: [
      { id: 'amman', name: { ar: 'عمّان (Amman)', en: 'Amman', ckb: 'عەممان' } },
      { id: 'zarqa', name: { ar: 'الزرقاء (Zarqa)', en: 'Zarqa', ckb: 'زەرقا' } },
      { id: 'irbid', name: { ar: 'إربد (Irbid)', en: 'Irbid', ckb: 'ئربید' } },
      { id: 'aqaba', name: { ar: 'العقبة (Aqaba)', en: 'Aqaba', ckb: 'عەقەبە' } },
      { id: 'balqa', name: { ar: 'البلقاء / السلط (Balqa)', en: 'Balqa', ckb: 'بەڵقا' } },
    ],
  },
  // 6. QATAR
  {
    code: 'QA',
    name: { ar: 'قطر (Qatar)', en: 'Qatar', ckb: 'قەتەر' },
    dialCode: '+974',
    flag: '🇶🇦',
    placeholder: '3312 3456',
    phoneLength: { min: 7, max: 15 },
    active: true,
    governorates: [
      { id: 'doha', name: { ar: 'الدوحة (Doha)', en: 'Doha', ckb: 'دەوحە' } },
      { id: 'al_rayyan', name: { ar: 'الريان (Al Rayyan)', en: 'Al Rayyan', ckb: 'ڕەییان' } },
      { id: 'al_wakrah', name: { ar: 'الوكرة (Al Wakrah)', en: 'Al Wakrah', ckb: 'وەکرە' } },
    ],
  },
  // 7. BAHRAIN
  {
    code: 'BH',
    name: { ar: 'البحرين (Bahrain)', en: 'Bahrain', ckb: 'بەحرەین' },
    dialCode: '+973',
    flag: '🇧🇭',
    placeholder: '3600 1234',
    phoneLength: { min: 7, max: 15 },
    active: true,
    governorates: [
      { id: 'manama', name: { ar: 'المنامة (Manama)', en: 'Manama', ckb: 'مەنامە' } },
      { id: 'muharraq', name: { ar: 'المحرق (Muharraq)', en: 'Muharraq', ckb: 'موهەڕەق' } },
      { id: 'riffa', name: { ar: 'الرفاع (Riffa)', en: 'Riffa', ckb: 'ڕفاع' } },
    ],
  },
  // 8. OMAN
  {
    code: 'OM',
    name: { ar: 'سلطنة عُمان (Oman)', en: 'Oman', ckb: 'عومان' },
    dialCode: '+968',
    flag: '🇴🇲',
    placeholder: '9123 4567',
    phoneLength: { min: 7, max: 15 },
    active: true,
    governorates: [
      { id: 'muscat', name: { ar: 'مسقط (Muscat)', en: 'Muscat', ckb: 'مەسکەت' } },
      { id: 'salalah', name: { ar: 'صلالة / ظفار (Salalah)', en: 'Salalah', ckb: 'سەڵاڵە' } },
      { id: 'sohar', name: { ar: 'صحار (Sohar)', en: 'Sohar', ckb: 'سوحار' } },
    ],
  },
  // 9. EGYPT
  {
    code: 'EG',
    name: { ar: 'مصر (Egypt)', en: 'Egypt', ckb: 'میسر' },
    dialCode: '+20',
    flag: '🇪🇬',
    placeholder: '100 123 4567',
    phoneLength: { min: 8, max: 15 },
    active: true,
    governorates: [
      { id: 'cairo', name: { ar: 'القاهرة (Cairo)', en: 'Cairo', ckb: 'قاهیرە' } },
      { id: 'alexandria', name: { ar: 'الإسكندرية (Alexandria)', en: 'Alexandria', ckb: 'ئەسکەندەریە' } },
      { id: 'giza', name: { ar: 'الجيزة (Giza)', en: 'Giza', ckb: 'گیزە' } },
    ],
  },
  // 10. TURKEY
  {
    code: 'TR',
    name: { ar: 'تركيا (Turkey)', en: 'Turkey', ckb: 'تورکیا' },
    dialCode: '+90',
    flag: '🇹🇷',
    placeholder: '532 123 4567',
    phoneLength: { min: 8, max: 15 },
    active: true,
    governorates: [
      { id: 'istanbul', name: { ar: 'إسطنبول (Istanbul)', en: 'Istanbul', ckb: 'ئەستەنبوڵ' } },
      { id: 'ankara', name: { ar: 'أنقرة (Ankara)', en: 'Ankara', ckb: 'ئەنکەرە' } },
      { id: 'gaziantep', name: { ar: 'غازي عنتاب (Gaziantep)', en: 'Gaziantep', ckb: 'غازی عەنتاب' } },
    ],
  },
  // 11. LEBANON
  {
    code: 'LB',
    name: { ar: 'لبنان (Lebanon)', en: 'Lebanon', ckb: 'لوبنان' },
    dialCode: '+961',
    flag: '🇱🇧',
    placeholder: '70 123 456',
    phoneLength: { min: 7, max: 15 },
    active: true,
    governorates: [
      { id: 'beirut', name: { ar: 'بيروت (Beirut)', en: 'Beirut', ckb: 'بەیروت' } },
      { id: 'tripoli', name: { ar: 'طرابلس (Tripoli)', en: 'Tripoli', ckb: 'ترابلس' } },
    ],
  },
  // 12. SYRIA
  {
    code: 'SY',
    name: { ar: 'سوريا (Syria)', en: 'Syria', ckb: 'سووریا' },
    dialCode: '+963',
    flag: '🇸🇾',
    placeholder: '933 123 456',
    phoneLength: { min: 8, max: 15 },
    active: true,
    governorates: [
      { id: 'damascus', name: { ar: 'دمشق (Damascus)', en: 'Damascus', ckb: 'دیمەشق' } },
      { id: 'aleppo', name: { ar: 'حلب (Aleppo)', en: 'Aleppo', ckb: 'حەلەب' } },
    ],
  },
  // 13. YEMEN
  {
    code: 'YE',
    name: { ar: 'اليمن (Yemen)', en: 'Yemen', ckb: 'یەمەن' },
    dialCode: '+967',
    flag: '🇾🇪',
    placeholder: '771 123 456',
    phoneLength: { min: 7, max: 15 },
    active: true,
    governorates: [
      { id: 'sanaa', name: { ar: 'صنعاء (Sanaa)', en: 'Sanaa', ckb: 'سەنعا' } },
      { id: 'aden', name: { ar: 'عدن (Aden)', en: 'Aden', ckb: 'عەدەن' } },
    ],
  },
  // 14. LIBYA
  {
    code: 'LY',
    name: { ar: 'ليبيا (Libya)', en: 'Libya', ckb: 'لیبیا' },
    dialCode: '+218',
    flag: '🇱🇾',
    placeholder: '91 123 4567',
    phoneLength: { min: 8, max: 15 },
    active: true,
    governorates: [
      { id: 'tripoli_ly', name: { ar: 'طرابلس (Tripoli)', en: 'Tripoli', ckb: 'ترابلس' } },
      { id: 'benghazi', name: { ar: 'بنغازي (Benghazi)', en: 'Benghazi', ckb: 'بەنغازی' } },
    ],
  },
  // 15. TUNISIA
  {
    code: 'TN',
    name: { ar: 'تونس (Tunisia)', en: 'Tunisia', ckb: 'تونس' },
    dialCode: '+216',
    flag: '🇹🇳',
    placeholder: '20 123 456',
    phoneLength: { min: 7, max: 15 },
    active: true,
    governorates: [
      { id: 'tunis', name: { ar: 'تونس العاصمة (Tunis)', en: 'Tunis', ckb: 'تونس' } },
      { id: 'sfax', name: { ar: 'صفاقس (Sfax)', en: 'Sfax', ckb: 'سفاقس' } },
    ],
  },
  // 16. ALGERIA
  {
    code: 'DZ',
    name: { ar: 'الجزائر (Algeria)', en: 'Algeria', ckb: 'جەزائیر' },
    dialCode: '+213',
    flag: '🇩🇿',
    placeholder: '550 12 34 56',
    phoneLength: { min: 8, max: 15 },
    active: true,
    governorates: [
      { id: 'algiers', name: { ar: 'الجزائر العاصمة (Algiers)', en: 'Algiers', ckb: 'جەزائیر' } },
      { id: 'oran', name: { ar: 'وهران (Oran)', en: 'Oran', ckb: 'وەهران' } },
    ],
  },
  // 17. MOROCCO
  {
    code: 'MA',
    name: { ar: 'المغرب (Morocco)', en: 'Morocco', ckb: 'مەغریب' },
    dialCode: '+212',
    flag: '🇲🇦',
    placeholder: '612 345678',
    phoneLength: { min: 8, max: 15 },
    active: true,
    governorates: [
      { id: 'casablanca', name: { ar: 'الدار البيضاء (Casablanca)', en: 'Casablanca', ckb: 'كازابلانكا' } },
      { id: 'rabat', name: { ar: 'الرباط (Rabat)', en: 'Rabat', ckb: 'ڕبات' } },
    ],
  },
  // 18. SUDAN
  {
    code: 'SD',
    name: { ar: 'السودان (Sudan)', en: 'Sudan', ckb: 'سوودان' },
    dialCode: '+249',
    flag: '🇸🇩',
    placeholder: '91 234 5678',
    phoneLength: { min: 8, max: 15 },
    active: true,
    governorates: [
      { id: 'khartoum', name: { ar: 'الخرطوم (Khartoum)', en: 'Khartoum', ckb: 'خەرتووم' } },
    ],
  },
  // 19. PALESTINE
  {
    code: 'PS',
    name: { ar: 'فلسطين (Palestine)', en: 'Palestine', ckb: 'فەلەستین' },
    dialCode: '+970',
    flag: '🇵🇸',
    placeholder: '599 123 456',
    phoneLength: { min: 7, max: 15 },
    active: true,
    governorates: [
      { id: 'jerusalem', name: { ar: 'القدس الشريف (Jerusalem)', en: 'Jerusalem', ckb: 'قودس' } },
      { id: 'ramallah', name: { ar: 'رام الله (Ramallah)', en: 'Ramallah', ckb: 'رامەڵا' } },
      { id: 'gaza', name: { ar: 'غزة (Gaza)', en: 'Gaza', ckb: 'غەززە' } },
    ],
  },
  // 20. UNITED STATES
  {
    code: 'US',
    name: { ar: 'الولايات المتحدة الأمريكية (USA)', en: 'United States', ckb: 'ویلاتە یەکگرتووەکان' },
    dialCode: '+1',
    flag: '🇺🇸',
    placeholder: '(555) 000-0000',
    phoneLength: { min: 10, max: 15 },
    active: true,
    governorates: [
      { id: 'us_ny', name: { ar: 'نيويورك (New York)', en: 'New York', ckb: 'نیویۆرک' } },
      { id: 'us_ca', name: { ar: 'كاليفورنيا (California)', en: 'California', ckb: 'کالیفۆرنیا' } },
      { id: 'us_tx', name: { ar: 'تكساس (Texas)', en: 'Texas', ckb: 'تێکساس' } },
      { id: 'us_fl', name: { ar: 'فلوريدا (Florida)', en: 'Florida', ckb: 'فلۆریدا' } },
      { id: 'us_other', name: { ar: 'ولاية أخرى (Other State)', en: 'Other State', ckb: 'ویلایەتێکی تر' } },
    ],
  },
  // 21. CANADA
  {
    code: 'CA',
    name: { ar: 'كندا (Canada)', en: 'Canada', ckb: 'کەنەدا' },
    dialCode: '+1',
    flag: '🇨🇦',
    placeholder: '(555) 000-0000',
    phoneLength: { min: 10, max: 15 },
    active: true,
    governorates: [
      { id: 'ca_on', name: { ar: 'أونتاريو / تورونتو (Ontario)', en: 'Ontario', ckb: 'ئۆنتاریۆ' } },
      { id: 'ca_qc', name: { ar: 'كيبك / مونتريال (Quebec)', en: 'Quebec', ckb: 'کبێک' } },
      { id: 'ca_bc', name: { ar: 'كولومبيا البريطانية (British Columbia)', en: 'British Columbia', ckb: 'بریتین کۆلۆمبیا' } },
    ],
  },
  // 22. UNITED KINGDOM
  {
    code: 'GB',
    name: { ar: 'المملكة المتحدة (UK)', en: 'United Kingdom', ckb: 'شانشینی یەکگرتوو' },
    dialCode: '+44',
    flag: '🇬🇧',
    placeholder: '7911 123456',
    phoneLength: { min: 9, max: 15 },
    active: true,
    governorates: [
      { id: 'uk_london', name: { ar: 'لندن (London)', en: 'London', ckb: 'لەندەن' } },
      { id: 'uk_england', name: { ar: 'إنجلترا (England)', en: 'England', ckb: 'ئینگلتەرا' } },
      { id: 'uk_scotland', name: { ar: 'أسكتلندا (Scotland)', en: 'Scotland', ckb: 'سکۆتلاند' } },
    ],
  },
  // 23. GERMANY
  {
    code: 'DE',
    name: { ar: 'ألمانيا (Germany)', en: 'Germany', ckb: 'ئەڵمانیا' },
    dialCode: '+49',
    flag: '🇩🇪',
    placeholder: '151 12345678',
    phoneLength: { min: 8, max: 15 },
    active: true,
    governorates: [
      { id: 'de_berlin', name: { ar: 'برلين (Berlin)', en: 'Berlin', ckb: 'بەرلین' } },
      { id: 'de_munich', name: { ar: 'ميونيخ / بافاريا (Munich)', en: 'Munich', ckb: 'میونخ' } },
      { id: 'de_frankfurt', name: { ar: 'فرانكفورت (Frankfurt)', en: 'Frankfurt', ckb: 'فرانکفۆرت' } },
    ],
  },
  // 24. FRANCE
  {
    code: 'FR',
    name: { ar: 'فرنسا (France)', en: 'France', ckb: 'فەڕەنسا' },
    dialCode: '+33',
    flag: '🇫🇷',
    placeholder: '6 12 34 56 78',
    phoneLength: { min: 8, max: 15 },
    active: true,
    governorates: [
      { id: 'fr_paris', name: { ar: 'باريس (Paris)', en: 'Paris', ckb: 'پاریس' } },
      { id: 'fr_lyon', name: { ar: 'ليون (Lyon)', en: 'Lyon', ckb: 'لیۆن' } },
    ],
  },
  // 25. ITALY
  {
    code: 'IT',
    name: { ar: 'إيطاليا (Italy)', en: 'Italy', ckb: 'ئیتاڵیا' },
    dialCode: '+39',
    flag: '🇮🇹',
    placeholder: '312 345 6789',
    phoneLength: { min: 8, max: 15 },
    active: true,
    governorates: [
      { id: 'it_rome', name: { ar: 'روما (Rome)', en: 'Rome', ckb: 'ڕۆما' } },
      { id: 'it_milan', name: { ar: 'ميلانو (Milan)', en: 'Milan', ckb: 'میلان' } },
    ],
  },
  // 26. SPAIN
  {
    code: 'ES',
    name: { ar: 'إسبانيا (Spain)', en: 'Spain', ckb: 'ئیسپانیا' },
    dialCode: '+34',
    flag: '🇪🇸',
    placeholder: '612 34 56 78',
    phoneLength: { min: 8, max: 15 },
    active: true,
    governorates: [
      { id: 'es_madrid', name: { ar: 'مدريد (Madrid)', en: 'Madrid', ckb: 'مەدرید' } },
      { id: 'es_barcelona', name: { ar: 'برشلونة (Barcelona)', en: 'Barcelona', ckb: 'بارسەلۆنا' } },
    ],
  },
  // 27. NETHERLANDS
  {
    code: 'NL',
    name: { ar: 'هولندا (Netherlands)', en: 'Netherlands', ckb: 'هۆڵەندا' },
    dialCode: '+31',
    flag: '🇳🇱',
    placeholder: '6 12345678',
    phoneLength: { min: 8, max: 15 },
    active: true,
    governorates: [
      { id: 'nl_ams', name: { ar: 'أمستردام (Amsterdam)', en: 'Amsterdam', ckb: 'ئەمستەردام' } },
    ],
  },
  // 28. SWEDEN
  {
    code: 'SE',
    name: { ar: 'السويد (Sweden)', en: 'Sweden', ckb: 'سوید' },
    dialCode: '+46',
    flag: '🇸🇪',
    placeholder: '70 123 45 67',
    phoneLength: { min: 8, max: 15 },
    active: true,
    governorates: [
      { id: 'se_stockholm', name: { ar: 'ستوكهولم (Stockholm)', en: 'Stockholm', ckb: 'ستۆکهۆڵم' } },
    ],
  },
  // 29. SWITZERLAND
  {
    code: 'CH',
    name: { ar: 'سويسرا (Switzerland)', en: 'Switzerland', ckb: 'سویسرا' },
    dialCode: '+41',
    flag: '🇨🇭',
    placeholder: '79 123 45 67',
    phoneLength: { min: 8, max: 15 },
    active: true,
    governorates: [
      { id: 'ch_zurich', name: { ar: 'زيورخ / جنيف (Zurich)', en: 'Zurich', ckb: 'زیوریخ' } },
    ],
  },
  // 30. RUSSIA
  {
    code: 'RU',
    name: { ar: 'روسيا (Russia)', en: 'Russia', ckb: 'ڕووسیا' },
    dialCode: '+7',
    flag: '🇷🇺',
    placeholder: '912 345-67-89',
    phoneLength: { min: 9, max: 15 },
    active: true,
    governorates: [
      { id: 'ru_moscow', name: { ar: 'موسكو (Moscow)', en: 'Moscow', ckb: 'مۆسکۆ' } },
    ],
  },
  // 31. CHINA
  {
    code: 'CN',
    name: { ar: 'الصين (China)', en: 'China', ckb: 'چین' },
    dialCode: '+86',
    flag: '🇨🇳',
    placeholder: '138 0000 0000',
    phoneLength: { min: 10, max: 15 },
    active: true,
    governorates: [
      { id: 'cn_beijing', name: { ar: 'بكين (Beijing)', en: 'Beijing', ckb: 'پەکین' } },
      { id: 'cn_shanghai', name: { ar: 'شنغهاي (Shanghai)', en: 'Shanghai', ckb: 'شەنگهای' } },
      { id: 'cn_guangzhou', name: { ar: 'غوانزو (Guangzhou)', en: 'Guangzhou', ckb: 'گوانگژو' } },
    ],
  },
  // 32. JAPAN
  {
    code: 'JP',
    name: { ar: 'اليابان (Japan)', en: 'Japan', ckb: 'ژاپۆن' },
    dialCode: '+81',
    flag: '🇯🇵',
    placeholder: '90 1234 5678',
    phoneLength: { min: 9, max: 15 },
    active: true,
    governorates: [
      { id: 'jp_tokyo', name: { ar: 'طوكيو (Tokyo)', en: 'Tokyo', ckb: 'تۆکیۆ' } },
    ],
  },
  // 33. INDIA
  {
    code: 'IN',
    name: { ar: 'الهند (India)', en: 'India', ckb: 'هیندستان' },
    dialCode: '+91',
    flag: '🇮🇳',
    placeholder: '98765 43210',
    phoneLength: { min: 9, max: 15 },
    active: true,
    governorates: [
      { id: 'in_delhi', name: { ar: 'نيودلهي (New Delhi)', en: 'New Delhi', ckb: 'نیودێلی' } },
      { id: 'in_mumbai', name: { ar: 'مومباي (Mumbai)', en: 'Mumbai', ckb: 'مومبای' } },
    ],
  },
  // 34. SOUTH KOREA
  {
    code: 'KR',
    name: { ar: 'كوريا الجنوبية (South Korea)', en: 'South Korea', ckb: 'کۆریای باشوور' },
    dialCode: '+82',
    flag: '🇰🇷',
    placeholder: '10 1234 5678',
    phoneLength: { min: 8, max: 15 },
    active: true,
    governorates: [
      { id: 'kr_seoul', name: { ar: 'سيول (Seoul)', en: 'Seoul', ckb: 'سیئۆل' } },
    ],
  },
  // 35. PAKISTAN
  {
    code: 'PK',
    name: { ar: 'باكستان (Pakistan)', en: 'Pakistan', ckb: 'پاکستان' },
    dialCode: '+92',
    flag: '🇵🇰',
    placeholder: '300 1234567',
    phoneLength: { min: 9, max: 15 },
    active: true,
    governorates: [
      { id: 'pk_isb', name: { ar: 'إسلام آباد / كراتشي (Islamabad)', en: 'Islamabad', ckb: 'ئیسلام ئاباد' } },
    ],
  },
  // 36. INDONESIA
  {
    code: 'ID',
    name: { ar: 'إندونيسيا (Indonesia)', en: 'Indonesia', ckb: 'ئیندۆنیزیا' },
    dialCode: '+62',
    flag: '🇮🇩',
    placeholder: '812 3456 7890',
    phoneLength: { min: 8, max: 15 },
    active: true,
    governorates: [
      { id: 'id_jakarta', name: { ar: 'جاكرتا (Jakarta)', en: 'Jakarta', ckb: 'جاکارتا' } },
    ],
  },
  // 37. MALAYSIA
  {
    code: 'MY',
    name: { ar: 'ماليزيا (Malaysia)', en: 'Malaysia', ckb: 'مالیزیا' },
    dialCode: '+60',
    flag: '🇲🇾',
    placeholder: '12 345 6789',
    phoneLength: { min: 8, max: 15 },
    active: true,
    governorates: [
      { id: 'my_kl', name: { ar: 'كوالالمبور (Kuala Lumpur)', en: 'Kuala Lumpur', ckb: 'کوالالامپور' } },
    ],
  },
  // 38. SINGAPORE
  {
    code: 'SG',
    name: { ar: 'سنغافورة (Singapore)', en: 'Singapore', ckb: 'سەنگاپورە' },
    dialCode: '+65',
    flag: '🇸🇬',
    placeholder: '8123 4567',
    phoneLength: { min: 8, max: 15 },
    active: true,
    governorates: [
      { id: 'sg_city', name: { ar: 'سنغافورة (Singapore)', en: 'Singapore', ckb: 'سەنگاپورە' } },
    ],
  },
  // 39. AUSTRALIA
  {
    code: 'AU',
    name: { ar: 'أستراليا (Australia)', en: 'Australia', ckb: 'ئۆسترالیا' },
    dialCode: '+61',
    flag: '🇦🇺',
    placeholder: '412 345 678',
    phoneLength: { min: 8, max: 15 },
    active: true,
    governorates: [
      { id: 'au_sydney', name: { ar: 'سيدني / ملبورن (Sydney)', en: 'Sydney', ckb: 'سیدنی' } },
    ],
  },
  // 40. BRAZIL
  {
    code: 'BR',
    name: { ar: 'البرازيل (Brazil)', en: 'Brazil', ckb: 'بەڕازیل' },
    dialCode: '+55',
    flag: '🇧🇷',
    placeholder: '11 91234-5678',
    phoneLength: { min: 9, max: 15 },
    active: true,
    governorates: [
      { id: 'br_sp', name: { ar: 'ساو باولو / ريو دي جانيرو (São Paulo)', en: 'São Paulo', ckb: 'ساوپاولۆ' } },
    ],
  },
  // 41. INTERNATIONAL / OTHER
  {
    code: 'INTL',
    name: { ar: 'دولي / دولة أخرى (International)', en: 'International / Other Country', ckb: 'نێودەوڵەتی / وڵاتێکی تر' },
    dialCode: '+',
    flag: '🌐',
    placeholder: '1234567890',
    phoneLength: { min: 5, max: 18 },
    active: true,
    governorates: [
      { id: 'intl_other', name: { ar: 'دولي / إقامة خارجية (International)', en: 'International / Other', ckb: 'دەرەوەی وڵات' } },
    ],
  },
];

export function getActiveCountries(): CountryConfig[] {
  return countryList.filter((c) => c.active);
}

export function getCountryByCode(code: string): CountryConfig | null {
  if (!code) return null;
  const found = countryList.find((c) => c.code.toUpperCase() === code.toUpperCase());
  return found || null;
}

export function getCountryByDialCode(dialCode: string): CountryConfig | null {
  if (!dialCode) return null;
  const clean = dialCode.trim();
  const found = countryList.find((c) => c.dialCode === clean);
  return found || null;
}
