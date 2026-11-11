# Perashki

Bir Vercel layihəsində işləyən şəxsi iş məkanı: solda ortaq menyu, daxilində Sloth AI, Visio Generator, Overtimer, Level Up, Azərbaycan təqvimi, to-do və StoryPointer. Mövcud tətbiqlərin dizaynları saxlanılıb. Verilənlər bazası və hesab tələb olunmur.

## Bütün məlumatlar bir JSON-da

Başlıqdakı **Yüklə** düyməsi bütün bölmələri bir `perashki-YYYY-MM-DD.json` faylında saxlayır. **İdxal et** düyməsindən həmin faylı seçdikdə bütün bölmələr birlikdə bərpa olunur və əvvəl açıq olan bölmə göstərilir.

Fayla Overtimer qeydləri/profil/maaşlar, bütün Visio diaqramları və açıq diaqramın ünvanı, Level Up irəliləyişi/qeydləri/test nəticələri, Sloth AI mətn-mail qaralamaları/formatlanmış nəticələri/şəxsi lüğəti/jurnalı/test nümunələri, to-do tapşırıqları, StoryPointer işləri, təqvim ili və görünüş seçimləri daxildir.

İdxal əvvəlcə bütün faylı tətbiqlərin öz format yoxlayıcıları ilə yoxlayır. Etibarlı nüsxə saytın məlumatlarını bütöv əvəz edir; köhnə nüsxədə olmayan yeni qeydlər də çıxarılır. Yazma uğursuz olarsa əvvəlki məlumatlar geri qaytarılır. Başqa proqramların brauzer yaddaşına toxunulmur. Açıq tətbiqlər bərpadan əvvəl dayandırılır ki, gecikmiş avtomatik yazma bərpa olunan məlumatı əvəz etməsin.

JSON əməliyyatları brauzerdə aparılır; fayl serverə yüklənmir. Başqa brauzerdə/cihazda ümumi faylı idxal etmək lazımdır. Köhnə ayrıca tətbiqlərin JSON faylları onların əvvəlki idxal funksiyalarında işləyir. Ortaq idxal düyməsi ümumi Perashki faylını qəbul edir.

## StoryPointer

Başlıqdan Azure DevOps üçün **Description**, **Acceptance Criteria**, **Technical Notes**, **Open Questions** və ilkin **Story Points** təklifi hazırlanır. User Story / Task / Bug seçimi, redaktə, əl ilə qiymətləndirmə, yadda saxlama, tarixçə və formatlanmış kopyalama var.

Bu versiya yerli şablon köməkçisidir: başlıqda API, ixrac, idxal, giriş, axtarış və digər mövzuları tanıyır. Generativ AI xidməti çağırılmır və API açarı tələb olunmur. Mətn və qiymətləndirmə layihə/komanda ilə dəqiqləşdirilməlidir. Azure DevOps-a avtomatik iş qeydi yaradılmır.

## Vercel

Repozitoriyanı bir layihə kimi import et. Root Directory `./`, Node.js `24.x` olsun. [vercel.json](vercel.json) qalan parametrləri saxlayır:

| Parametr | Dəyər |
| --- | --- |
| Framework Preset | Other |
| Install Command | `npm ci --include=dev && npm run setup` |
| Build Command | `npm run build` |
| Output | Vercel Build Output API, `.vercel/output` |
| Database / Secrets | Tələb olunmur |

Output Directory üçün ayrıca `.next`, `public` və ya `dist` override təyin etmə. Build rəsmi [Vercel Build Output API](https://vercel.com/docs/build-output-api) formatında bir deploy hazırlayır. Ayrı Vercel layihələri və daimi daxili serverlər lazım deyil. Buradan deploy və mühitin publish əməliyyatı edilməyib.

Frontend-lər statik fayllara çevrilir. Level Up laboratoriya/tərcümə API-ləri və Sloth AI-nin mövcud HTTP endpoint-ləri eyni deploy daxilində Vercel Functions kimi paketlənir. Sloth AI redaktoru öz brauzer Worker-ləri ilə, SQL laboratoriyası isə brauzerdə SQLite/WASM ilə işləyir.

## Lokal iş

Node.js 24 və npm:

```sh
npm ci
npm run setup
npm run dev
```

İnkişaf rejimi mövcud Next.js tətbiqlərinin canlı redaktəsini saxlayır. Deploy olunan quruluşu yoxlamaq üçün:

```sh
npm run build
npm start
```

`npm start` yaradılmış Vercel çıxışını bir Node prosesi və bir portla təqdim edir; default 3000, dəyişmək üçün `PORT`. Lokal API adapteri eyni funksiya paketlərini işlədir.

```sh
npm test
npm run typecheck
# npm start işləyərkən, ayrı terminalda:
npm run test:browser
```

Brauzer testləri `/usr/bin/chromium` istifadə edir. `CHROMIUM_PATH` və `PERASHKI_TEST_ORIGIN` ilə dəyişmək olar. Testlər təmiz brauzerdə bütün bölmələrin bir JSON-dan bərpasını, səhv idxalda məlumatın qorunmasını, StoryPointer-i, Sloth AI düzəlişini, Visio yaddaşını, Overtimer formasını, Level Up SQL/API laboratoriyalarını və mobil görünüşü yoxlayır. Şəkillər `.local/screenshots/` altındadır.

## Mənbələr

Orijinal tətbiqlərin kodu, sənədləri, testləri, bildirişləri və lockfile-ları `apps/` altında saxlanır. Mənbə commitləri [docs/sources.json](docs/sources.json) faylındadır. Mənbə repozitoriyalarına dəyişiklik göndərilməyib.

Build yalnız `.local/static-build/` daxilindəki müvəqqəti nüsxələrdən frontend hazırlayır. Server API-ləri frontend nüsxəsindən çıxarılıb funksiya kimi paketlənir; orijinal tətbiqlərdə API və testlər yerindədir. `npm run typecheck` orijinal tətbiqləri də yoxlayır.

Təqvimin verilmiş məlumatları və dizaynı saxlanıb; görünüş vəziyyətinin ehtiyat nüsxəyə daxil edilməsi əlavə olunub. Bayram məlumatlarına ayrıca məzmun yoxlaması aparılmayıb.
