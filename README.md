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

## Vercel Services

Kökdəki [vercel.json](vercel.json) bir Vercel layihəsində beş müstəqil Next.js servisi təyin edir. Repozitoriyanın Root Directory-si `./`, Node.js versiyası `24.x` olmalıdır. Build/install/dev əmrləri hər servisin öz konfiqurasiyasındadır; bu sahələri kök səviyyədə əlavə etmə.

| Servis | Qovluq | Açıq yol |
| --- | --- | --- |
| `portal` | `.` | `/` və qalan portal ünvanları |
| `level-up` | `apps/level-up` | `/tools/level-up` və alt yollar |
| `overtimer` | `apps/overtimer` | `/tools/overtimer` və alt yollar |
| `sloth-ai` | `apps/sloth-ai` | `/tools/sloth-ai` və alt yollar |
| `visio-generator` | `apps/visio-generator` | `/tools/visio-generator` və alt yollar |

Dörd konkret tətbiq rewrite-ı əvvəl, `portal` üçün catch-all isə axırdadır. Yol prefiksi silinmir: məsələn `/tools/level-up/api/labs/http` eyni yolla Level Up-a çatır. Next.js `basePath` və brauzerdəki API/Worker ünvanları bu yollara uyğundur. Qısa `/level-up`, `/calendar`, `/todo`, `/sprint-pointer` kimi ünvanlar portalı və onun menyusunu açır.

Bu quruluşda beş servis də açıqdır; yalnız daxili servis yoxdur. Tətbiqlər bir-birinə server sorğusu etmir. Portalın `/api/health` funksiyası dörd tətbiqi daxili binding-lərlə yoxlayır:

| Çağıran | Hədəf | Vercel-in yaratdığı dəyişən |
| --- | --- | --- |
| `portal` | `level-up` | `LEVEL_UP_URL` |
| `portal` | `overtimer` | `OVERTIMER_URL` |
| `portal` | `sloth-ai` | `SLOTH_AI_URL` |
| `portal` | `visio-generator` | `VISIO_GENERATOR_URL` |

Bu dəyişənlərə özün dəyər vermə. Vercel onları yalnız servisin runtime funksiyasına daxil edir. Sağlamlıq yoxlaması onları hər sorğu zamanı oxuyur; build və middleware binding istifadə etmir. Dəyişən yoxdursa localhost və ya açıq domenə keçid edilmir, servis hazır deyil kimi göstərilir. Binding hədəfi açıq etmir; açıq yollar ayrıca rewrite-larla müəyyən olunur.

Rəsmi sənədlər: [Services](https://vercel.com/docs/services), [routing](https://vercel.com/docs/services/routing), [bindings](https://vercel.com/docs/services/bindings).

## Lokal iş və yoxlama

Node.js 24 və npm:

```sh
npm ci --include=dev
npm run setup
npx vercel dev --local
```

`vercel dev` bütün servisləri və binding-ləri birlikdə başladır. `--local` hesabla əlaqələndirmədən lokal yoxlama üçündür. Eyni əmr `npm run dev:services` ilə də mövcuddur. Bu script ayrıca adlanır: kök `dev` scriptinin `vercel dev` çağırması Vercel-in rekursiya qorumasına düşür. `npm run dev` yalnız portal üçün olan development əmridir; tam sayt üçün `dev:services` istifadə et.

```sh
npm test
npm run typecheck
npm run build
# vercel dev işləyərkən, ayrı terminalda:
npm run test:browser
```

`build:portal` yalnız ortaq brauzer yoxlayıcılarını və portalı build edir. O, digər servislərin quraşdırılmasından asılı deyil. `npm run build` lokal yoxlama üçün portalı və dörd tətbiqi ardıcıl build edir. Vercel hər servisi ayrıca build edir; əvvəlki müvəqqəti statik-export sistemi və əllə yazılmış funksiya adapterləri çıxarılıb.

Brauzer testləri `/usr/bin/chromium` istifadə edir. `CHROMIUM_PATH` və `PERASHKI_TEST_ORIGIN` ilə dəyişmək olar. Onlar ortaq menyunu, bir JSON-dan bütün məlumatların bərpasını, StoryPointer-i, Sloth AI Worker-lərini, Visio yaddaşını, Overtimer-i, Level Up SQL/API laboratoriyalarını və mobil görünüşü yoxlayır. Binding yoxlamaları URL-lərin runtime-dan oxunmasını və prefikslərin qorunmasını da test edir.

## Mənbələr

Orijinal tətbiqlərin kodu, sənədləri, testləri, bildirişləri və lockfile-ları `apps/` altında saxlanır. Mənbə commitləri [docs/sources.json](docs/sources.json) faylındadır. Mənbə repozitoriyalarına dəyişiklik göndərilməyib.

Tətbiqlərin API-ləri və testləri öz servis qovluqlarında saxlanır. Hər tətbiq öz lockfile-ı ilə quraşdırılır. Ortaq JSON yoxlayıcıları portal build-i zamanı mənbə parserlərindən hazırlanır; portalın öz Zod asılılığı ayrıca sabitlənib.

Təqvimin verilmiş məlumatları və dizaynı saxlanıb; görünüş vəziyyətinin ehtiyat nüsxəyə daxil edilməsi əlavə olunub. Bayram məlumatlarına ayrıca məzmun yoxlaması aparılmayıb.
