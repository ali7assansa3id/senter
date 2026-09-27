# SENTER — المرحلة 1 (كود حقيقي قابل للتشغيل)

نظام إدارة السناتر — النواة التشغيلية وفق SRS v1.0

## التقنيات

- **Next.js 14** (App Router) — Frontend + API
- **Prisma** + **PostgreSQL**
- **JWT** للمصادقة
- **Tailwind CSS** مع دعم RTL عربي كامل
- التوقيت: Africa/Cairo | العملة: EGP

## المتطلبات

- Node.js 18+
- Docker (لقاعدة البيانات) أو PostgreSQL محلي

## التشغيل السريع

```bash
# 1. قاعدة البيانات
docker compose up -d

# 2. تثبيت الحزم
npm install

# 3. إعداد البيئة
cp .env.example .env
# تأكد أن DATABASE_URL و JWT_SECRET مضبوطان

# 4. إنشاء الجداول
npx prisma db push

# 5. بيانات تجريبية (اختياري)
npm run db:seed

# 6. تشغيل التطبيق
npm run dev
```

افتح: [http://localhost:3000](http://localhost:3000)

### حساب تجريبي (بعد الـ seed)
- الهاتف: `01000000000`
- كلمة المرور: `123456`

أو أنشئ حساباً جديداً من شاشة التسجيل (يُنشئ سنتر + مالك تلقائياً).

## ما يشمله هذا الكود (المرحلة 1)

| الوحدة | الحالة |
|--------|--------|
| تسجيل حساب / دخول / خروج | ✅ |
| قفل بعد 5 محاولات فاشلة | ✅ |
| عزل Tenant (center_id) | ✅ |
| Soft Delete | ✅ |
| إدارة الطلاب + أولياء الأمور | ✅ |
| إدارة المدرسين + نماذج المستحقات | ✅ |
| المجموعات + الجدول الأسبوعي | ✅ |
| تسجيل الحضور اليدوي | ✅ |
| إشعار غياب لولي الأمر | ✅ |
| سجل تدقيق (Audit Log) | ✅ |
| واجهة عربية RTL | ✅ |

## هيكل المشروع

```
senter-phase1-app/
├── prisma/schema.prisma      ← نموذج البيانات الكامل للمرحلة 1
├── prisma/seed.ts
├── src/
│   ├── app/
│   │   ├── api/              ← REST API
│   │   │   ├── auth/         login | register | logout
│   │   │   ├── students/
│   │   │   ├── teachers/
│   │   │   ├── groups/
│   │   │   ├── attendance/
│   │   │   └── me/
│   │   ├── (auth)/login/
│   │   └── (dashboard)/      dashboard | students | teachers | groups | attendance
│   ├── components/
│   └── lib/                  auth | prisma | api helpers
├── docker-compose.yml
└── README.md
```

## ملاحظات

- هذا **كود تشغيلي حقيقي** للمرحلة 1 فقط.
- المراحل 2–6 (مالية، بوابة طالب، امتحانات، دليل، AI) غير مضمّنة هنا.
- للإنتاج: غيّر `JWT_SECRET` واستخدم HTTPS وقيود CORS مناسبة.
